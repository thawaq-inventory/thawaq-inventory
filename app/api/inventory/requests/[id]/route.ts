import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const countRequest = await prisma.stockCountRequest.findUnique({
            where: { id },
            include: {
                user: { select: { name: true } },
                branch: { select: { name: true } },
                items: {
                    include: {
                        product: {
                            select: { name: true, sku: true, unit: true, cost: true }
                        }
                    }
                }
            }
        });

        if (!countRequest) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json(countRequest);
    } catch (error) {
        console.error('Fetch request error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action, items, adminUserId } = body; // action: 'APPROVE' | 'REJECT', items: updated items

        const countRequest = await prisma.stockCountRequest.findUnique({
            where: { id }
        });

        if (!countRequest || countRequest.status !== 'PENDING') {
            return NextResponse.json({ error: 'Invalid request or already processed' }, { status: 400 });
        }

        if (action === 'REJECT') {
            await prisma.stockCountRequest.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    reviewedById: adminUserId || null,
                    reviewedAt: new Date()
                }
            });
            return NextResponse.json({ success: true });
        }

        if (action === 'APPROVE') {
            // We need to run the transaction logic here
            const result = await prisma.$transaction(async (tx) => {
                // Update items if Admin changed anything
                if (items && Array.isArray(items)) {
                    for (const item of items) {
                        if (item.id) {
                            await tx.stockCountItem.update({
                                where: { id: item.id },
                                data: {
                                    countedQuantity: item.countedQuantity,
                                    variance: item.countedQuantity - item.systemQuantity
                                }
                            });
                        } else if (item.productId) {
                           // Admin added a new missing item
                           const currentLevel = await tx.inventoryLevel.findUnique({
                                where: {
                                    productId_branchId: { productId: item.productId, branchId: countRequest.branchId }
                                }
                            });
                           const sysQty = currentLevel ? currentLevel.quantityOnHand : 0;
                           await tx.stockCountItem.create({
                               data: {
                                   requestId: id,
                                   productId: item.productId,
                                   systemQuantity: sysQty,
                                   countedQuantity: item.countedQuantity,
                                   variance: item.countedQuantity - sysQty
                               }
                           });
                        }
                    }
                }

                // Fetch final items
                const finalItems = await tx.stockCountItem.findMany({
                    where: { requestId: id },
                    include: { product: true }
                });

                // Apply logic
                for (const item of finalItems) {
                    if (item.variance === 0 && item.systemQuantity === 0) continue; // Skip if no variance

                    // 1. Update Inventory Level
                    await tx.inventoryLevel.upsert({
                        where: {
                            productId_branchId: {
                                productId: item.productId,
                                branchId: countRequest.branchId
                            }
                        },
                        update: { quantityOnHand: item.countedQuantity },
                        create: {
                            productId: item.productId,
                            branchId: countRequest.branchId,
                            quantityOnHand: item.countedQuantity
                        }
                    });

                    // 2. Log Transaction
                    if (item.variance !== 0) {
                        await tx.inventoryTransaction.create({
                            data: {
                                type: 'ADJUSTMENT',
                                productId: item.productId,
                                sourceBranchId: countRequest.branchId,
                                quantity: item.variance,
                                userId: adminUserId || countRequest.userId,
                                notes: `Stock Take Variance: ${item.variance > 0 ? '+' : ''}${item.variance}. Approved by Admin.`
                            }
                        });

                        // Keep Legacy Log for safety
                        await tx.inventoryLog.create({
                            data: {
                                productId: item.productId,
                                branchId: countRequest.branchId,
                                changeAmount: item.variance,
                                reason: 'STOCK_TAKE',
                                userId: countRequest.userId
                            }
                        });
                        
                        // 3. Financials
                        const cost = item.product.cost || 0;
                        const varianceValue = Math.abs(item.variance * cost);
                        
                        if (varianceValue > 0) {
                            const inventoryAccount = await tx.accountingMapping.findUnique({
                                where: { eventKey: 'INVENTORY_ASSET_DEFAULT' },
                                include: { account: true }
                            }).then(m => m?.account) || await tx.account.findUnique({ where: { code: '1200' } });

                            const adjustmentAccount = await tx.accountingMapping.findUnique({
                                where: { eventKey: 'INVENTORY_ADJUSTMENT' },
                                include: { account: true }
                            }).then(m => m?.account) || await tx.account.findUnique({ where: { code: '6020' } }); 

                            if (inventoryAccount && adjustmentAccount) {
                                const isLoss = item.variance < 0;

                                await tx.journalEntry.create({
                                    data: {
                                        description: `Stock Adjustment: ${item.product.name} (${item.variance > 0 ? '+' : ''}${item.variance} ${item.product.unit})`,
                                        reference: `ADJ-${Date.now()}`,
                                        date: new Date(),
                                        lines: {
                                            create: [
                                                {
                                                    accountId: isLoss ? adjustmentAccount.id : inventoryAccount.id,
                                                    debit: varianceValue, 
                                                    credit: 0
                                                },
                                                {
                                                    accountId: isLoss ? inventoryAccount.id : adjustmentAccount.id,
                                                    debit: 0,
                                                    credit: varianceValue
                                                }
                                            ]
                                        }
                                    }
                                });
                            }
                        }
                    }
                }

                // Update request status
                await tx.stockCountRequest.update({
                    where: { id },
                    data: {
                        status: 'APPROVED',
                        reviewedById: adminUserId || null,
                        reviewedAt: new Date()
                    }
                });

                return true;
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Approve/Reject request error:', error);
        return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
    }
}
