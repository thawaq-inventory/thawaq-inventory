import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
            const journalEntry = await tx.journalEntry.create({
                data: {
                    date: expense.expenseDate,
                    description: `Expense: ${expense.description || expense.customCategory || 'Miscellaneous'}`,
                    reference: `EXP-${expense.id.substring(0, 8)}`,
                    lines: {
                        create: [
                            {
                                accountId: debitAccountId,
                                debit: expense.amount,
                                credit: 0,
                            },
                            {
                                accountId: creditAccountId,
                                debit: 0,
                                credit: expense.amount,
                            }
                        ]
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
