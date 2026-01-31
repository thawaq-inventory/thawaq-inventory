import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';

interface ArabicNameRow {
    sku?: string;
    name?: string;
    arabic_name?: string;
    arabicName?: string;
    arabic?: string;
    [key: string]: any;
}

/**
 * POST /api/inventory/arabic-names
 * Upload CSV with SKU and Arabic names to update products
 * 
 * Expected CSV format:
 * SKU, Arabic_Name
 * BRD-SHRAK, خبز شراك
 * ING-KABAB, كباب مشوي
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Parse the uploaded file
        const parsed = await parseUpload<ArabicNameRow>(file);

        if (!parsed.data || parsed.data.length === 0) {
            return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
        }

        const rows = parsed.data;
        let updated = 0;
        let notFound = 0;
        let errors = 0;
        const errorDetails: string[] = [];

        for (const row of rows) {
            try {
                // Extract SKU (flexible column names)
                const sku = (
                    row.sku ||
                    row.SKU ||
                    row.Sku ||
                    ''
                ).toString().trim();

                // Extract Arabic Name (flexible column names)
                const arabicName = (
                    row.arabic_name ||
                    row.arabicName ||
                    row.Arabic_Name ||
                    row.arabic ||
                    row.Arabic ||
                    ''
                ).toString().trim();

                if (!sku) {
                    errors++;
                    errorDetails.push(`Skipped row: missing SKU`);
                    continue;
                }

                if (!arabicName) {
                    errors++;
                    errorDetails.push(`Skipped ${sku}: missing Arabic name`);
                    continue;
                }

                // Find product by SKU
                const product = await prisma.product.findUnique({
                    where: { sku: sku }
                });

                if (!product) {
                    notFound++;
                    errorDetails.push(`Product not found: ${sku}`);
                    continue;
                }

                // Update Arabic name
                await prisma.product.update({
                    where: { id: product.id },
                    data: { arabicName }
                });

                updated++;

            } catch (e: any) {
                errors++;
                errorDetails.push(`Error processing row: ${e.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Arabic names import complete`,
            stats: {
                total: rows.length,
                updated,
                notFound,
                errors
            },
            errorDetails: errorDetails.length > 0 ? errorDetails.slice(0, 20) : undefined
        });

    } catch (error: any) {
        console.error('Arabic Names Import Error:', error);
        return NextResponse.json({
            error: error.message || 'Import failed'
        }, { status: 500 });
    }
}
