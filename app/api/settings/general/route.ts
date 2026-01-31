
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.systemSetting.findMany();
        const map: Record<string, string> = {};
        settings.forEach(s => map[s.key] = s.value);
        return NextResponse.json(map);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // Body: { "VAT_RATE": "0.16" }

        const ops = Object.entries(body).map(([key, value]) =>
            prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            })
        );

        await prisma.$transaction(ops);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
