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
            const results = [];

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

                // If no variance, skip update (or maybe log confirm?)
                // Let's skip update if 0 variance to save DB space, 
                // BUT user might want a record that they counted.
                // For now, only record if variance exists OR if it's a first-time set (system 0, actual > 0).

                if (variance === 0 && currentLevel) {
                    continue;
                }

                // 2. Update Inventory Level
                await tx.inventoryLevel.upsert({
                    where: {
                        productId_branchId: {
                            productId,
                            branchId
                        }
                    },
                    update: {
                        quantityOnHand: actualQuantity
                    },
                    create: {
                        productId,
                        branchId,
                        quantityOnHand: actualQuantity
                    }
                });

                // 3. Log Transaction
                // Reason: ADJUSTMENT
                // If negative variance: Missing stock (Shrinkage)
                // If positive variance: Found stock (Overage)

                await tx.inventoryTransaction.create({
                    data: {
                        type: 'ADJUSTMENT',
                        productId,
                        // Schema: sourceBranchId, destBranchId. 
                        // For Adjustment, usually we set the branch as source? Or null?
                        // Let's use `sourceBranchId` for the branch where adjustment happened.
                        sourceBranchId: branchId,
                        quantity: Math.abs(variance), // Transaction usually tracks magnitude
                        // Wait, if we use `InventoryLog` (legacy but still used in logic), we record signed change.
                        // `InventoryTransaction` is the new one.
                        // Let's check Schema regarding `InventoryTransaction` quantity. 
                        // Usually unsigned magnitude + Type tells direction? 
                        // OR signed? 
                        // Let's use signed quantity for simplicity if the type allows interpretation, 
                        // BUT standard is often Positive Qty with specific Type.
                        // Let's use Positive Qty and notes to describe direction.
                        // ACTUALLY, checking schema: `quantity Float`.
                        // Let's look at `type`. 
                        // If type is ADJUSTMENT, we need to know if it was + or -.
                        // I will store the Signed Variance in Quantity? 
                        // Or should I stick to standard "Movement" logic? 
                        // Let's store Signed Variance in `notes` or assume "ADJUSTMENT" with +/- quantity?
                        // Let's check how `InventoryLog` does it: `changeAmount` (signed).
                        // Let's stick to strict Signed Quantity for `InventoryTransaction` too if not constrained.
                        // If I can't, I'll use `quantity` as abs and reliance on type logic is ambiguous for Adjustment (could be + or -).
                        // DECISION: Using Signed Quantity for Adjustment makes most sense for "Correction".
                        quantity: variance,
                        userId: userId || 'system',
                        notes: `Stock Take Variance: ${variance > 0 ? '+' : ''}${variance}. ${notes || ''}`
                    }
                });

                // Keep Legacy Log for safety
                await tx.inventoryLog.create({
                    data: {
                        productId,
                        branchId,
                        changeAmount: variance,
                        reason: 'STOCK_TAKE',
                        userId: userId || null
                    }
                });

                results.push({ productId, variance });
            }

            return results;
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
