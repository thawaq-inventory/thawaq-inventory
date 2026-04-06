import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const branchIds = searchParams.get('branchIds');

        const where: any = {};
        if (branchIds && branchIds !== 'all') {
            where.branchId = { in: branchIds.split(',') };
        }

        const requests = await prisma.stockCountRequest.findMany({
            where,
            include: {
                user: { select: { name: true } },
                branch: { select: { name: true } },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Failed to fetch stock count requests:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
