import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';

/**
 * Channel Pricing Import API
 * 
 * Accepts CSV with columns: POS_String, Price
 * Populates ChannelPricing table for a specific sales channel
 */

interface PricingRow {
    pos_string?: string;
    posstring?: string;
    item?: string;
    name?: string;
    price?: string | number;
    selling_price?: string | number;
    [key: string]: any;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const channel = formData.get('channel') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!channel || !['TALABAT', 'CAREEM', 'DELIVEROO', 'OTHER'].includes(channel)) {
            return NextResponse.json({ error: 'Invalid channel' }, { status: 400 });
        }

        // Parse the uploaded file
        const parsed = await parseUpload<PricingRow>(file);

        if (!parsed.data || parsed.data.length === 0) {
            return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
        }

        const rows = parsed.data;
        let created = 0;
        let updated = 0;
        let errors = 0;
        const errorDetails: string[] = [];

        for (const row of rows) {
            try {
                // Extract POS String (flexible column names)
                const posString = (
                    row.pos_string ||
                    row.posstring ||
                    row.item ||
                    row.name ||
                    ''
                ).toString().trim();

                // Extract Price (flexible column names)
                const priceStr = (
                    row.price ||
                    row.selling_price ||
                    ''
                ).toString().trim();

                if (!posString || !priceStr) {
                    errors++;
                    errorDetails.push(`Skipped row: missing POS String or Price`);
                    continue;
                }

                const price = parseFloat(priceStr);
                if (isNaN(price) || price < 0) {
                    errors++;
                    errorDetails.push(`Invalid price for "${posString}": ${priceStr}`);
                    continue;
                }

                // Upsert into ChannelPricing
                const existing = await prisma.channelPricing.findUnique({
                    where: {
                        posString_channel: {
                            posString: posString,
                            channel: channel as any
                        }
                    }
                });

                if (existing) {
                    await prisma.channelPricing.update({
                        where: { id: existing.id },
                        data: { price, isActive: true }
                    });
                    updated++;
                } else {
                    await prisma.channelPricing.create({
                        data: {
                            posString,
                            channel: channel as any,
                            price,
                            isActive: true
                        }
                    });
                    created++;
                }

            } catch (e: any) {
                errors++;
                errorDetails.push(`Error processing row: ${e.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Channel pricing import complete for ${channel}`,
            stats: {
                total: rows.length,
                created,
                updated,
                errors
            },
            errorDetails: errorDetails.length > 0 ? errorDetails.slice(0, 10) : undefined
        });

    } catch (error: any) {
        console.error('Channel Pricing Import Error:', error);
        return NextResponse.json({
            error: error.message || 'Import failed'
        }, { status: 500 });
    }
}
