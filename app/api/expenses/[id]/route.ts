import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get single expense
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const expense = await prisma.expense.findUnique({
            where: { id },
            include: {
                category: true,
                submittedBy: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                reviewedBy: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
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

        if (!expense) {
            return NextResponse.json(
                { error: 'Expense not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expense' },
            { status: 500 }
        );
    }
}

// PUT - Update expense (admin editing before approval)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { amount, description, expenseDate, notes, categoryId, customCategory, debitAccountId, creditAccountId } = body;

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                amount: amount !== undefined ? amount : undefined,
                description: description !== undefined ? description : undefined,
                expenseDate: expenseDate ? new Date(expenseDate) : undefined,
                notes: notes !== undefined ? notes : undefined,
                categoryId: categoryId !== undefined ? categoryId : undefined,
                customCategory: customCategory !== undefined ? customCategory : undefined,
                debitAccountId: debitAccountId !== undefined ? debitAccountId : undefined,
                creditAccountId: creditAccountId !== undefined ? creditAccountId : undefined,
            },
            include: {
                category: true,
                submittedBy: true,
                reviewedBy: true,
                debitAccount: true,
                creditAccount: true,
            }
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json(
            { error: 'Failed to update expense' },
            { status: 500 }
        );
    }
}
