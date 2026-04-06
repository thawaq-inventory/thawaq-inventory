import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { branchId, items, notes, userId } = body;

        if (!branchId || !items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'branchId and items array are required' },
                { status: 400 }
            );
        }

        // We will execute this in a transaction to ensure integrity
        const result = await prisma.$transaction(async (tx) => {
            const stockCountItems = [];

            for (const item of items) {
                const { productId, actualQuantity } = item;

                if (!productId || actualQuantity === undefined) continue;

                // 1. Get current stock level
                const currentLevel = await tx.inventoryLevel.findUnique({
                    where: {
                        productId_branchId: {
                            productId,
                            branchId
                        }
                    }
                });

                const systemQuantity = currentLevel ? currentLevel.quantityOnHand : 0;
                const variance = actualQuantity - systemQuantity;

                stockCountItems.push({
                    productId,
                    systemQuantity,
                    countedQuantity: actualQuantity,
                    variance
                });
            }

            if (stockCountItems.length === 0) return [];

            const requestRecord = await tx.stockCountRequest.create({
                data: {
                    branchId,
                    userId: userId || 'system',
                    notes: notes || '',
                    items: {
                        create: stockCountItems
                    }
                }
            });

            return stockCountItems;
        });

        return NextResponse.json({ success: true, processed: result.length });

    } catch (error) {
        console.error('Stock Reconciliation Error:', error);
        return NextResponse.json(
            { error: 'Failed to reconcile stock' },
            { status: 500 }
        );
    }
}
