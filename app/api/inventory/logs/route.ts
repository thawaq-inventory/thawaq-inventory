import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || 'ALL';
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};

        if (search) {
            where.product = {
                OR: [
                    { name: { contains: search } },
                    { sku: { contains: search } }
                ]
            };
        }

        if (type !== 'ALL') {
            where.reason = type;
        }

        const logs = await prisma.inventoryLog.findMany({
            where,
            include: {
                product: true,
                user: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch inventory logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory logs' },
            { status: 500 }
        );
    }
}
