import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/transfers/[id]/send
// Approve/Send the transfer -> Deduct Stock from Source
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        // In a real app, we would get `userId` from the session. 
        // For now, expect it in the body for simplicity of testing.
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
            if (transfer.status !== 'REQUESTED') throw new Error(`Transfer is already ${transfer.status}`);

            // 2. Validate & Deduct Stock
            for (const item of transfer.items) {
                const inventory = await tx.inventoryLevel.findUnique({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: transfer.fromBranchId
                        }
                    }
                });

                if (!inventory || inventory.quantityOnHand < item.quantity) {
                    throw new Error(`Insufficient stock for Product ${item.productId} at Source Branch`);
                }

                // Deduct
                await tx.inventoryLevel.update({
                    where: { id: inventory.id },
                    data: { quantityOnHand: { decrement: item.quantity } }
                });

                // Log Transaction
                await tx.inventoryTransaction.create({
                    data: {
                        type: 'TRANSFER_OUT',
                        sourceBranchId: transfer.fromBranchId,
                        destBranchId: transfer.toBranchId,
                        productId: item.productId,
                        quantity: item.quantity,
                        userId: userId,
                        notes: `Transfer Out for Request #${transfer.id.slice(0, 8)}`
                    }
                });
            }

            // 3. Update Request Status
            const updatedTransfer = await tx.transferRequest.update({
                where: { id },
                data: { status: 'IN_TRANSIT' }
            });

            return updatedTransfer;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error sending transfer:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send transfer' },
            { status: 400 } // Return 400 for logic errors (like stock)
        );
    }
}
