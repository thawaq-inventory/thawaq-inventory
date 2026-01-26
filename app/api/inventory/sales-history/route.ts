import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const reports = await prisma.salesReport.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                branch: true
            }
        });

        return NextResponse.json(reports);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
