import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Log production batch
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { recipeId, outputProductId, quantityProduced, ingredients, notes, locationId, userId } = body;

        if (!outputProductId || !quantityProduced || !ingredients || ingredients.length === 0) {
            return NextResponse.json(
                { error: 'outputProductId, quantityProduced, and ingredients are required' },
                { status: 400 }
            );
        }

        // Create production batch
        // First get the output product to retrieve its branchId
        const product = await prisma.product.findUnique({
            where: { id: outputProductId },
            select: { id: true, branchId: true, name: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Output product not found' }, { status: 404 });
        }

        // Determine Branch Context for Inventory Logs
        // 1. Try Product's fixed branch (Legacy)
        // 2. Try request body branchId (New Global Context)
        // 3. Fallback: If locationId is provided, should we fetch branch? 
        //    (Skipping for now to keep it efficient, assume client sends branchId or product has it)

        let targetBranchId: string | null = product.branchId;

        if (!targetBranchId) {
            // Global Product - Requirement: branchId MUST be in body
            targetBranchId = (body.branchId as string) || null;
        }

        // If we still have no branch ID, we cannot log inventory efficiently. 
        // Critical Error for Global Products.
        if (!targetBranchId) {
            // Try to fetch first active branch as emergency fallback? 
            // Or fail. Validating context is better.
            return NextResponse.json({ error: 'Branch Context (branchId) is required for Global Products production.' }, { status: 400 });
        }


        const batch = await prisma.productionBatch.create({
            data: {
                recipeId: recipeId || null,
                outputProductId,
                quantityProduced,
                notes: notes || null,
                locationId: locationId || null,
                userId: userId || null,
                ingredients: {
                    create: ingredients.map((ing: any) => ({
                        productId: ing.productId,
                        quantityUsed: ing.quantityUsed,
                    }))
                }
            },
            include: {
                recipe: true,
                outputProduct: true,
                ingredients: {
                    include: {
                        product: true
                    }
                },
                location: true,
                user: true,
            }
        });

        // Update stock levels
        // Decrease raw ingredients
        for (const ing of ingredients) {
            // Update InventoryLevel for the Ingredient at this Branch
            await prisma.inventoryLevel.upsert({
                where: {
                    productId_branchId: {
                        productId: ing.productId,
                        branchId: targetBranchId
                    }
                },
                update: {
                    quantityOnHand: { decrement: ing.quantityUsed }
                },
                create: {
                    productId: ing.productId,
                    branchId: targetBranchId,
                    quantityOnHand: -ing.quantityUsed // Negative if not previously tracked
                }
            });

            // Log inventory change
            await prisma.inventoryLog.create({
                data: {
                    productId: ing.productId,
                    branchId: targetBranchId,
                    changeAmount: -ing.quantityUsed,
                    reason: 'PRODUCTION',
                    userId: userId || null,
                }
            });
        }

        // Increase produced item
        await prisma.inventoryLevel.upsert({
            where: {
                productId_branchId: {
                    productId: outputProductId,
                    branchId: targetBranchId
                }
            },
            update: {
                quantityOnHand: { increment: quantityProduced }
            },
            create: {
                productId: outputProductId,
                branchId: targetBranchId,
                quantityOnHand: quantityProduced
            }
        });

        // 3. Financials: Record Value Added to Output Product & Cost Transfer
        // Calculate Cost of Batch
        let totalBatchCost = 0;

        // We need to re-fetch ingredients with their costs because the input `ingredients` might not have it or we want fresh DB connection
        // Optimization: Use the `ingredients` array we iterated, assuming we can get costs. 
        // Better: Fetch costs now or during the loop. 

        for (const ing of ingredients) {
            const p = await prisma.product.findUnique({ where: { id: ing.productId } });
            if (p) {
                totalBatchCost += (p.cost || 0) * ing.quantityUsed;
            }
        }

        // Update Output Product Cost (WAC)
        // Similar to Purchase WAC: (OldVal + NewVal) / TotalQty
        const outProduct = await prisma.product.findUnique({
            where: { id: outputProductId },
            include: { inventoryLevels: true }
        });

        if (outProduct) {
            const currentGlobalStock = outProduct.inventoryLevels.reduce((sum, level) => sum + level.quantityOnHand, 0);
            const currentTotalValue = (currentGlobalStock - quantityProduced) * (outProduct.cost || 0); // Note: we already incremented stock above?
            // Actually, we executed increment above in Step 2.
            // So `currentGlobalStock` INCLUDES the new `quantityProduced`.
            // The "Old Stock" was `currentGlobalStock - quantityProduced`.

            const oldStock = currentGlobalStock - quantityProduced;
            const oldValue = oldStock * (outProduct.cost || 0);

            let newCost = outProduct.cost || 0;
            if (currentGlobalStock > 0) {
                newCost = (oldValue + totalBatchCost) / currentGlobalStock;
            }

            await prisma.product.update({
                where: { id: outputProductId },
                data: { cost: newCost }
            });
        }

        // Create Journal Entry
        // Credit Inventory (Raw Mats) -> Debit Inventory (Finished Goods)
        // In simple setup: Debit 1200, Credit 1200.
        // We find default inventory account.
        const inventoryAccount = await prisma.accountingMapping.findUnique({
            where: { eventKey: 'INVENTORY_ASSET_DEFAULT' },
            include: { account: true }
        }).then(m => m?.account) || await prisma.account.findUnique({ where: { code: '1200' } });

        if (inventoryAccount && totalBatchCost > 0) {
            await prisma.journalEntry.create({
                data: {
                    description: `Production: ${product.name} (Qty: ${quantityProduced})`,
                    reference: `PROD-${batch.id.substring(0, 8)}`,
                    date: new Date(),
                    lines: {
                        create: [
                            // Debit Finished Goods (Asset Increase)
                            {
                                accountId: inventoryAccount.id,
                                debit: totalBatchCost,
                                credit: 0
                            },
                            // Credit Raw Materials (Asset Decrease)
                            {
                                accountId: inventoryAccount.id, // Same account for now, but logs the flow
                                debit: 0,
                                credit: totalBatchCost
                            }
                        ]
                    }
                }
            });
        }


        return NextResponse.json(batch, { status: 201 });
    } catch (error) {
        console.error('Error creating production batch:', error);
        return NextResponse.json(
            { error: 'Failed to create production batch' },
            { status: 500 }
        );
    }
}

// GET - Production history
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const recipeId = searchParams.get('recipeId');
        const locationId = searchParams.get('locationId');

        const where: any = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        if (recipeId) where.recipeId = recipeId;
        if (locationId) where.locationId = locationId;

        const batches = await prisma.productionBatch.findMany({
            where,
            include: {
                recipe: true,
                outputProduct: true,
                ingredients: {
                    include: {
                        product: true
                    }
                },
                location: true,
                user: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(batches);
    } catch (error) {
        console.error('Error fetching production batches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch production batches' },
            { status: 500 }
        );
    }
}
