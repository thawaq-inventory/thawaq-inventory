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

        // Create journal entry
        const journalEntry = await prisma.journalEntry.create({
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

        // Update expense
        const updatedExpense = await prisma.expense.update({
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

        return NextResponse.json({
            expense: updatedExpense,
            journalEntry
        });
    } catch (error) {
        console.error('Error approving expense:', error);
        return NextResponse.json(
            { error: 'Failed to approve expense' },
            { status: 500 }
        );
    }
}
