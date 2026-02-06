import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Approve expense and create journal entry
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { reviewedById, debitAccountId, creditAccountId } = body;

        if (!reviewedById || !debitAccountId || !creditAccountId) {
            return NextResponse.json(
                { error: 'reviewedById, debitAccountId, and creditAccountId are required' },
                { status: 400 }
            );
        }

        // Get expense
        const expense = await prisma.expense.findUnique({
            where: { id }
        });

        if (!expense) {
            return NextResponse.json(
                { error: 'Expense not found' },
                { status: 404 }
            );
        }

        if (expense.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'Expense has already been reviewed' },
                { status: 400 }
            );
        }

        // Execute as a single atomic transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Journal Entry
            const lines = [
                {
                    accountId: debitAccountId, // Expense Category Account
                    debit: expense.amount, // Net Amount
                    credit: 0,
                },
                {
                    accountId: creditAccountId, // Payment Method (Cash/Bank)
                    debit: 0,
                    credit: expense.totalAmount, // Total (Net + Tax)
                }
            ];

            // Add Tax Line if tax exists
            if (expense.taxAmount && expense.taxAmount > 0) {
                // Find or use a default Tax Account. 
                // Ideally this should be "Input VAT" (Asset) or "VAT Payable" (Liability - Debit to reduce liability)
                // For now, we will try to find 'VAT Payable' or fallback to a hardcoded logic if possible, 
                // but since we are in a transaction, we can't easily query outside without passing it in.
                // OPTION: We assume the frontend/setup ensures a Tax Account exists.
                // IMPROVEMENT: We'll look up VAT Payable here or fail? 
                // BETTER: We can just use the provided debit/credit accounts for now but we need a 3rd account for Tax.
                // CURRENT LIMITATION: We don't have the Tax Account ID passed in from the frontend approval modal.
                // FIX: We will look up 'VAT Payable' inside this transaction or assume a specific code '2020'.

                const taxAccount = await tx.account.findFirst({
                    where: {
                        OR: [{ code: '2020' }, { name: 'VAT Payable' }]
                    }
                });

                if (taxAccount) {
                    lines.push({
                        accountId: taxAccount.id,
                        debit: expense.taxAmount,
                        credit: 0
                    });
                } else {
                    // Fallback: Add tax back to expense line if no tax account found (avoid unbalanced entry)
                    lines[0].debit = Number(lines[0].debit) + Number(expense.taxAmount);
                    // This technically makes it balanced but loses the tax detail. 
                    // Ideally we should throw error or create account but that's risky in production hotfix.
                    // Let's stick to adding to expense line so it balances, effectively "Grossing Up" the expense.
                }
            }

            const journalEntry = await tx.journalEntry.create({
                data: {
                    date: expense.expenseDate,
                    description: `Expense: ${expense.description || expense.customCategory || 'Miscellaneous'}`,
                    reference: `EXP-${expense.id.substring(0, 8)}`,
                    branchId: expense.branchId, // Link to branch
                    lines: {
                        create: lines
                    }
                },
                include: {
                    lines: {
                        include: {
                            account: true
                        }
                    }
                }
            });

            // 2. Update Expense with Link & Status
            const updatedExpense = await tx.expense.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    reviewedById,
                    reviewedAt: new Date(),
                    debitAccountId,
                    creditAccountId,
                    journalEntryId: journalEntry.id,
                },
                include: {
                    category: true,
                    submittedBy: true,
                    reviewedBy: true,
                    debitAccount: true,
                    creditAccount: true,
                    journalEntry: {
                        include: {
                            lines: {
                                include: {
                                    account: true
                                }
                            }
                        }
                    }
                }
            });

            return { expense: updatedExpense, journalEntry };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error approving expense:', error);
        return NextResponse.json(
            { error: 'Failed to approve expense' },
            { status: 500 }
        );
    }
}
