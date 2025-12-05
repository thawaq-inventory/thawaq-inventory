import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Submit expense (employee)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, taxRate, taxAmount, totalAmount, description, expenseDate, photoUrl, notes, categoryId, customCategory, submittedById } = body;

        if (!amount || !submittedById) {
            return NextResponse.json(
                { error: 'Amount and submittedById are required' },
                { status: 400 }
            );
        }

        // Get category default accounts if category is selected
        let debitAccountId = null;
        let creditAccountId = null;

        if (categoryId) {
            const category = await prisma.expenseCategory.findUnique({
                where: { id: categoryId }
            });

            if (category) {
                debitAccountId = category.debitAccountId;
                creditAccountId = category.creditAccountId;
            }
        }

        const expense = await prisma.expense.create({
            data: {
                amount,
                taxRate: taxRate || 0,
                taxAmount: taxAmount || 0,
                totalAmount: totalAmount || amount,
                description: description || null,
                expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
                photoUrl,
                notes: notes || null,
                categoryId: categoryId || null,
                customCategory: customCategory || null,
                submittedById,
                debitAccountId,
                creditAccountId,
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json(
            { error: 'Failed to create expense' },
            { status: 500 }
        );
    }
}

// GET - List expenses with filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const submittedById = searchParams.get('submittedById');

        const where: any = {};

        if (status) where.status = status;
        if (submittedById) where.submittedById = submittedById;

        if (startDate || endDate) {
            where.expenseDate = {};
            if (startDate) where.expenseDate.gte = new Date(startDate);
            if (endDate) where.expenseDate.lte = new Date(endDate);
        }

        const expenses = await prisma.expense.findMany({
            where,
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
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expenses' },
            { status: 500 }
        );
    }
}
