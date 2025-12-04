import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single account
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const account = await prisma.account.findUnique({
            where: { id }
        });
        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }
        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
    }
}

// PUT update account
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const account = await prisma.account.update({
            where: { id },
            data: {
                code: body.code,
                name: body.name,
                type: body.type,
                description: body.description
            }
        });
        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}

// DELETE account
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.account.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
