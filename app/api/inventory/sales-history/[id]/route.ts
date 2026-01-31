import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } // Correct Next.js 15+ type
) {
    try {
        const { id } = await context.params;
        const report = await prisma.salesReport.findUnique({
            where: { id },
            include: {
                branch: true,
                salesItemLogs: {
                    orderBy: { quantity: 'desc' } // or quantity, check model
                }
            }
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const r = report as any;

        // Fetch Arabic Names mappings for these items
        if (!r.salesItemLogs) return NextResponse.json(report);

        const posStrings = Array.from(new Set(r.salesItemLogs.map((i: any) => i.posString))) as string[];
        // @ts-ignore
        const mappings = await prisma.productMapping.findMany({
            where: { posString: { in: posStrings } },
            select: { posString: true, arabicName: true }
        });

        const mappingMap = new Map(mappings.map((m: any) => [m.posString, m.arabicName]));

        // Attach Arabic Name to items
        const itemsWithArabic = r.salesItemLogs.map((item: any) => ({
            ...item,
            arabicName: mappingMap.get(item.posString) || null
        }));

        return NextResponse.json({ ...report, items: itemsWithArabic });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
