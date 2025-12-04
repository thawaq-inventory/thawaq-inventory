import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Reject expense
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { reviewedById, rejectionReason } = body;

        if (!reviewedById) {
            return NextResponse.json(
                { error: 'reviewedById is required' },
                { status: 400 }
            );
        }

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

        const updatedExpense = await prisma.expense.update({
            where: { id },
            data: {
                status: 'REJECTED',
                reviewedById,
                reviewedAt: new Date(),
                rejectionReason: rejectionReason || null,
            },
            include: {
                category: true,
                submittedBy: true,
                reviewedBy: true,
            }
        });

        return NextResponse.json(updatedExpense);
    } catch (error) {
        console.error('Error rejecting expense:', error);
        return NextResponse.json(
            { error: 'Failed to reject expense' },
            { status: 500 }
        );
    }
}
