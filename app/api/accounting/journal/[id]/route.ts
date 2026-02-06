import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single journal entry
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const entry = await prisma.journalEntry.findUnique({
            where: { id },
            include: {
                lines: {
                    include: {
                        account: true
                    }
                },
                branch: true,
                expense: true,
                payrollTransaction: true
            }
        });

        if (!entry) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        return NextResponse.json(entry);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
    }
}

// DELETE journal entry
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Delete lines first (cascade usually handles this but good to be safe if not configured)
        // Prisma schema usually works with Cascade delete on relations.

        await prisma.journalEntry.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error', error);
        return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
}
