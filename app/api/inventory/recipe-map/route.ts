import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';

// We don't enforce strict interface on input because we are doing fuzzy matching
// But we can define what we expect to extract
interface MappedRecipe {
    posString: string | null;
    sku: string | null;
    quantity: number;
}

// Helper to normalize a key for comparison (remove _ - spaces)
function normalizeKey(k: string): string {
    return k.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Helper to find value in a row based on candidates
function findValue(row: any, candidates: string[]): any {
    const rowKeys = Object.keys(row);
    // 1. Try exact match on keys
    for (const key of rowKeys) {
        if (candidates.includes(key)) return row[key];
    }
    // 2. Try normalized match
    for (const key of rowKeys) {
        const norm = normalizeKey(key);
        if (candidates.includes(norm)) return row[key];
    }
    return undefined;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        // 1. Parse File (returns snake_case keys from file-parser)
        const { data, errors } = await parseUpload<any>(file);

        if (errors.length > 0) {
            return NextResponse.json({ error: 'Failed to parse file', details: errors }, { status: 400 });
        }

        if (data.length === 0) {
            return NextResponse.json({ error: 'File is empty' }, { status: 400 });
        }

        // 2. Dry Run Logging
        // Log the first row keys to help debugging
        console.log("--- Recipe Import Debug ---");
        const firstRow = data[0];
        console.log("Parsed Headers (First Row Keys):", Object.keys(firstRow));

        let processedCount = 0;
        let errorCount = 0;
        const errorDetails: string[] = [];

        // Candidates for fuzzy matching
        // file-parser returns snake_case, so 'POS_String' -> 'pos_string'.
        // user wants to match 'posstring', 'itemname'.
        const posCandidates = ['posstring', 'pos_string', 'itemname', 'posname', 'name', 'item'];
        const skuCandidates = ['inventorysku', 'sku', 'inventory_sku', 'code', 'productid'];
        const qtyCandidates = ['quantity', 'qty', 'amount', 'qnty'];

        console.log("First Row Data (Raw):", JSON.stringify(firstRow));

        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // Extract Values
            const rawPos = findValue(row, posCandidates);
            const rawSku = findValue(row, skuCandidates);
            const rawQty = findValue(row, qtyCandidates);

            const posString = rawPos ? String(rawPos).trim() : null;
            const sku = rawSku ? String(rawSku).trim() : null;

            if (!posString || !sku) {
                // Only log if it looks like a real row (not fully empty)
                if (Object.keys(row).length > 0 && (rawPos || rawSku)) {
                    console.warn(`Skipping partial row ${i}: Missing POS String or SKU. Found: POS=${posString}, SKU=${sku}`);
                }
                continue;
            }

            let quantity = 0;
            if (rawQty) {
                quantity = Number(rawQty);
            }

            if (isNaN(quantity)) {
                errorCount++;
                errorDetails.push(`Invalid Quantity for item ${posString}`);
                continue;
            }

            // Find Product
            const product = await prisma.product.findUnique({
                where: { sku: sku },
            });

            if (!product) {
                errorCount++;
                errorDetails.push(`Product SKU not found: ${sku} (for ${posString})`);
                continue;
            }

            try {
                await prisma.productMapping.upsert({
                    where: { posString: posString },
                    update: {
                        productId: product.id,
                        quantity: quantity
                    },
                    create: {
                        posString: posString,
                        productId: product.id,
                        quantity: quantity
                    }
                });
                processedCount++;
            } catch (e: any) {
                errorCount++;
                errorDetails.push(`Database error for ${posString}: ${e.message}`);
                console.error(`Row ${i} Insert Error:`, e);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${processedCount} mappings successfully.`,
            processedCount,
            errorCount,
            errorDetails
        });

    } catch (error: any) {
        console.error("Recipe Import Server Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
