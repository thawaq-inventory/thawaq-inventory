import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { branchId, productId, quantity, reason, notes, userId } = body;

        if (!branchId || !productId || !quantity || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            return NextResponse.json(
                { error: 'Invalid quantity' },
                { status: 400 }
            );
        }

        // Execute in transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Product Cost for Valuation
            const product = await tx.product.findUnique({
                where: { id: productId }
            });
            const cost = product?.cost || 0;
            const totalValue = cost * qty;

            // 2. Update Inventory (Deduct)
            await tx.inventoryLevel.upsert({
                where: {
                    productId_branchId: {
                        productId,
                        branchId
                    }
                },
                update: {
                    quantityOnHand: { decrement: qty }
                },
                create: {
                    productId,
                    branchId,
                    quantityOnHand: -qty // Allow negative if stock tracking was missing
                }
            });

            // 3. Log Inventory Transaction (WASTE)
            await tx.inventoryTransaction.create({
                data: {
                    type: 'WASTE',
                    productId,
                    sourceBranchId: branchId, // Source is where waste happened
                    quantity: qty,
                    userId: userId || 'system',
                    notes: `Reason: ${reason}. ${notes || ''}`
                }
            });

            // Legacy Log
            await tx.inventoryLog.create({
                data: {
                    productId,
                    branchId,
                    changeAmount: -qty,
                    reason: 'WASTE',
                    userId: userId || null
                }
            });

            // 4. Create Journal Entry (Financials)
            // Need Accounts: Inventory (Asset) vs Waste (Expense)
            // We will Try to find them or create defaults if missing

            // Helper to get/create account
            const getAccount = async (code: string, name: string, type: string) => {
                let acc = await tx.account.findUnique({ where: { code } });
                if (!acc) {
                    acc = await tx.account.create({
                        data: { code, name, type }
                    });
                }
                return acc;
            };

            const inventoryAccount = await getAccount('1200', 'Inventory Asset', 'ASSET');

            // Determine Expense Account based on reason
            let expenseCode = '5100'; // COGS / Waste default
            let expenseName = 'Cost of Goods Sold - Waste';

            if (reason === 'Staff Meal') {
                expenseCode = '5200';
                expenseName = 'Employee Benefits';
            }

            const expenseAccount = await getAccount(expenseCode, expenseName, 'EXPENSE');

            await tx.journalEntry.create({
                data: {
                    description: `Inventory Waste: ${product?.name || 'Item'} (${reason})`,
                    reference: 'WASTE-' + Date.now(),
                    date: new Date(),
                    lines: {
                        create: [
                            {
                                accountId: expenseAccount.id,
                                debit: totalValue,
                                credit: 0
                            },
                            {
                                accountId: inventoryAccount.id,
                                debit: 0,
                                credit: totalValue
                            }
                        ]
                    }
                }
            });

            return { success: true };
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Waste API Error:', error);
        return NextResponse.json(
            { error: 'Failed to record waste' },
            { status: 500 }
        );
    }
}
