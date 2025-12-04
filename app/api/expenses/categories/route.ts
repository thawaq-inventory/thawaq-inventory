import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Create expense category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, debitAccountId, creditAccountId } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const category = await prisma.expenseCategory.create({
            data: {
                name,
                description: description || null,
                debitAccountId: debitAccountId || null,
                creditAccountId: creditAccountId || null,
            },
            include: {
                debitAccount: true,
                creditAccount: true,
            }
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Error creating expense category:', error);
        return NextResponse.json(
            { error: 'Failed to create expense category' },
            { status: 500 }
        );
    }
}

// GET - List all expense categories
export async function GET() {
    try {
        const categories = await prisma.expenseCategory.findMany({
            include: {
                debitAccount: true,
                creditAccount: true,
                _count: {
                    select: { expenses: true }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching expense categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expense categories' },
            { status: 500 }
        );
    }
}

// PUT - Update expense category
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description, debitAccountId, creditAccountId } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        const category = await prisma.expenseCategory.update({
            where: { id },
            data: {
                name,
                description,
                debitAccountId: debitAccountId || null,
                creditAccountId: creditAccountId || null,
            },
            include: {
                debitAccount: true,
                creditAccount: true,
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error('Error updating expense category:', error);
        return NextResponse.json(
            { error: 'Failed to update expense category' },
            { status: 500 }
        );
    }
}

// DELETE - Remove expense category
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        await prisma.expenseCategory.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting expense category:', error);
        return NextResponse.json(
            { error: 'Failed to delete expense category' },
            { status: 500 }
        );
    }
}
