
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const branches = await prisma.branch.findMany({
            where: { isActive: true },
            select: { id: true, name: true, code: true, type: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(branches);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }
}
