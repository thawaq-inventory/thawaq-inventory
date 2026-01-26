import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';

interface PriceRow {
    pos_string: string;
    selling_price: string | number;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const { data, errors } = await parseUpload<PriceRow>(file);

        if (errors.length > 0) {
            return NextResponse.json({ error: 'File Parsing Error', details: errors }, { status: 400 });
        }

        let count = 0;

        for (const row of data) {
            // Normalize inputs
            const posString = row.pos_string ? String(row.pos_string).trim() : null;
            if (!posString) continue;

            const price = row.selling_price ? Number(row.selling_price) : 0;

            await prisma.posMenuItem.upsert({
                where: { posString: posString },
                update: { sellingPrice: price },
                create: {
                    posString: posString,
                    sellingPrice: price
                }
            });
            count++;
        }

        return NextResponse.json({
            success: true,
            message: `Updated Price List with ${count} items.`,
            count
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
