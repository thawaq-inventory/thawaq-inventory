import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/transfers/[id]/receive
// Receive the transfer -> Add Stock to Destination
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Start Transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Request
            const transfer = await tx.transferRequest.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!transfer) throw new Error('Transfer request not found');
            if (transfer.status !== 'IN_TRANSIT') throw new Error(`Transfer is not in transit (Status: ${transfer.status})`);

            // 2. Add Stock
            for (const item of transfer.items) {
                // Upsert to ensure record exists
                // We use upsert because the receiving branch might not have this product record yet
                await tx.inventoryLevel.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: transfer.toBranchId
                        }
                    },
                    update: { quantityOnHand: { increment: item.quantity } },
                    create: {
                        productId: item.productId,
                        branchId: transfer.toBranchId,
                        quantityOnHand: item.quantity,
                        reorderPoint: 0 // Default
                    }
                });

                // Log Transaction
                await tx.inventoryTransaction.create({
                    data: {
                        type: 'TRANSFER_IN',
                        sourceBranchId: transfer.fromBranchId,
                        destBranchId: transfer.toBranchId,
                        productId: item.productId,
                        quantity: item.quantity,
                        userId: userId,
                        notes: `Transfer In for Request #${transfer.id.slice(0, 8)}`
                    }
                });
            }

            // 3. Update Request Status
            const updatedTransfer = await tx.transferRequest.update({
                where: { id },
                data: { status: 'RECEIVED' }
            });

            return updatedTransfer;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error receiving transfer:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to receive transfer' },
            { status: 400 }
        );
    }
}
