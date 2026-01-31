
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';

interface MenuRow {
    POS_String: string;
    Selling_Price: number;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        const { data: rows, errors } = await parseUpload<MenuRow>(file);

        if (errors.length > 0) {
            return NextResponse.json({ error: 'Parse Error', details: errors }, { status: 400 });
        }

        let updatedCount = 0;
        let createdCount = 0;

        for (const row of rows) {
            const name = String(row.POS_String || '').trim();
            const price = parseFloat(String(row.Selling_Price || '0'));

            if (!name) continue;

            const result = await prisma.posMenuItem.upsert({
                where: { posString: name },
                create: {
                    posString: name,
                    sellingPrice: price
                },
                update: {
                    sellingPrice: price
                }
            });

            // Check if it was essentially a create or update
            // Upsert doesn't tell us easily without comparison, but we can assume success.
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${updatedCount} menu items.`
        });

    } catch (error: any) {
        console.error('Menu Import Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
