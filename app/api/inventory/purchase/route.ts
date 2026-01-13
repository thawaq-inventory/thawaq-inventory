import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/inventory/purchase
// Record a Direct Purchase (Receive PO) from a Vendor
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { branchId, vendorId, items, invoiceNumber, notes, userId } = body;

        // Validation
        if (!branchId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Start Transaction
        const result = await prisma.$transaction(async (tx) => {
            const results = [];

            for (const item of items) {
                // 1. Upsert Inventory Level (Add Stock)
                await tx.inventoryLevel.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: branchId
                        }
                    },
                    update: { quantityOnHand: { increment: Number(item.quantity) } },
                    create: {
                        productId: item.productId,
                        branchId: branchId,
                        quantityOnHand: Number(item.quantity),
                        reorderPoint: 0
                    }
                });

                // 2. Log Transaction
                const transaction = await tx.inventoryTransaction.create({
                    data: {
                        type: 'PURCHASE_IN',
                        destBranchId: branchId, // Destination is the branch receiving
                        sourceBranchId: null,   // No internal source
                        productId: item.productId,
                        quantity: Number(item.quantity),
                        userId: userId,
                        notes: `PO: ${invoiceNumber || 'N/A'} - ${notes || ''} (Vendor: ${vendorId || 'Unknown'})`
                    }
                });

                results.push(transaction);
            }

            return results;
        });

        return NextResponse.json({ success: true, count: result.length }, { status: 201 });

    } catch (error: any) {
        console.error('Error recording purchase:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to record purchase' },
            { status: 500 }
        );
    }
}
