import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';
import { parseSalesReportLine, parseTabSenseItems, ParsedItem } from '@/lib/parsers/sales-report-parser';

// Normalized Headers expected
interface SalesRow {
    // Standard Format
    order_items?: string;
    order_value?: string | number;

    // TabSense Format
    created_at?: string;
    items_breakdown?: string;
    total?: string | number;
    gross_sales?: string | number;
    discount?: string | number;
    tip_amount?: string | number;
    taxes?: string | number;
    order_charge?: string | number;
    cash?: string | number;
    visa?: string | number;

    // Common
    [key: string]: any;
}

interface AuditItem {
    posName: string;
    status: 'OK' | 'MISSING_RECIPE' | 'SKU_NOT_FOUND' | 'ZERO_COST';
    details: string;
    sku?: string;
    cost?: number;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const execute = formData.get('execute') === 'true';
        const branchId = formData.get('branchId') as string;

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        // 1. Parsing (Robust)
        const { data: rawData, errors } = await parseUpload<SalesRow>(file);

        if (errors.length > 0) {
            return NextResponse.json({ error: 'File Parse Error', details: errors }, { status: 400 });
        }

        // --- DATE PARSING LOGIC ---
        let reportDate: Date = new Date(); // Default to now
        let dateSourceString = "System Today";

        // Try to find a date in the first valid row content
        if (rawData.length > 0) {
            const firstRow = rawData[0];

            // 1. Check Headers aliases (including TabSense 'created_at')
            const dateVal = firstRow['Date'] || firstRow['date'] || firstRow['Business Date'] || firstRow['Time'] || firstRow['created_at'];

            if (dateVal) {
                // Try parse
                const d = new Date(String(dateVal));
                if (!isNaN(d.getTime())) {
                    reportDate = d;
                    dateSourceString = `Header (${dateVal})`;
                }
            } else {
                // 2. Hard Fallback: Column Index 9 (J) 
                // We keep this for the legacy format just in case, but TabSense overrides this via 'created_at' if found.
                const keys = Object.keys(firstRow);
                if (keys.length > 9) {
                    const colJKey = keys[9];
                    const valJ = firstRow[colJKey];
                    const dJ = new Date(String(valJ));
                    if (!isNaN(dJ.getTime())) {
                        reportDate = dJ;
                        dateSourceString = `Column J (${valJ})`;
                    }
                }
            }
        }

        // Safety Check 1: Filter Empty Rows
        // Must contain EITHER 'order_items' (Legacy) OR 'items_breakdown' (TabSense)
        const data = rawData.filter(row => {
            const legacy = row.order_items && String(row.order_items).trim() !== '';
            const tabsense = row.items_breakdown && String(row.items_breakdown).trim() !== '';
            return legacy || tabsense;
        });

        if (data.length === 0) {
            return NextResponse.json({ error: 'No valid sales data found in file.' }, { status: 400 });
        }

        // 2. Data Gathering
        const uniquePosStrings = new Set<string>();
        const parsedRows: { items: ParsedItem[], declaredRevenue: number, rowIndex: number }[] = [];
        const failedRows: { row: number, error: string }[] = [];

        let rowIndex = 0;
        for (const row of data) {
            rowIndex++;
            try {
                let items: ParsedItem[] = [];
                let declaredRevenue = 0;

                // A. DETECT AND PARSE TABSENSE
                if (row.items_breakdown) {
                    items = parseTabSenseItems(String(row.items_breakdown));

                    // Parse Revenue
                    // Use Total or Gross Sales? User specified "Total".
                    const val = row.total || row.gross_sales || '0';
                    declaredRevenue = parseFloat(String(val).replace(/[^0-9.-]+/g, '')) || 0;
                }
                // B. LEGACY FORMAT
                else if (row.order_items) {
                    items = parseSalesReportLine(String(row.order_items));

                    if (row.order_value) {
                        const cleanVal = String(row.order_value).replace(/[^0-9.-]+/g, '');
                        declaredRevenue = parseFloat(cleanVal) || 0;
                    }
                } else {
                    continue; // Should be filtered out already but extra safety
                }

                parsedRows.push({ items, declaredRevenue, rowIndex });

                items.forEach(item => {
                    uniquePosStrings.add(item.name);
                    item.modifiers.forEach(mod => {
                        uniquePosStrings.add(mod.name);
                    });
                });
            } catch (err: any) {
                console.warn(`Failed to process row ${rowIndex}:`, err.message);
                failedRows.push({ row: rowIndex, error: err.message });
            }
        }

        // 3. Database Lookups (Prices & Recipes)
        const posStrings = Array.from(uniquePosStrings);

        // Fetch Mappings
        const recipes = await prisma.productMapping.findMany({
            where: { posString: { in: posStrings } },
            include: { product: true }
        });

        const prices = await prisma.posMenuItem.findMany({
            where: { posString: { in: posStrings } }
        });

        const recipeMap = new Map<string, any>();
        recipes.forEach(m => recipeMap.set(m.posString, m));

        const priceMap = new Map<string, number>();
        prices.forEach(p => priceMap.set(p.posString, p.sellingPrice));

        // --- STRICT AUDIT LOGIC ---
        const auditReport: AuditItem[] = [];

        posStrings.forEach(posName => {
            const mapping = recipeMap.get(posName);

            // Check A: Recipe Exists
            if (!mapping) {
                auditReport.push({
                    posName,
                    status: 'MISSING_RECIPE',
                    details: 'No recipe mapping found.'
                });
                return;
            }

            // Check B: SKU Exists (Product relation)
            if (!mapping.product) {
                // Mapping exists but valid product does not (Orphaned)
                auditReport.push({
                    posName,
                    status: 'SKU_NOT_FOUND',
                    details: `Mapped to productId ${mapping.productId} but not found in DB.`,
                    sku: 'UNKNOWN'
                });
                return;
            }

            // Check C: Cost > 0
            if (mapping.product.cost <= 0) {
                auditReport.push({
                    posName,
                    status: 'ZERO_COST',
                    details: `Product Cost is 0.00.`,
                    sku: mapping.product.sku,
                    cost: 0
                });
                return;
            }

            // All OK
            auditReport.push({
                posName,
                status: 'OK',
                details: 'Detailed validated.',
                sku: mapping.product.sku,
                cost: mapping.product.cost
            });
        });

        // 5. Calculations
        let totalExpectedRevenue = 0;
        let totalDeclaredRevenue = 0;
        const deductionMap = new Map<string, number>();
        const cogsMap = new Map<string, number>();

        for (const row of parsedRows) {
            totalDeclaredRevenue += row.declaredRevenue;
            let rowRevenue = 0;

            for (const item of row.items) {
                const pPrice = priceMap.get(item.name) || 0;
                rowRevenue += pPrice * item.qty;

                for (const mod of item.modifiers) {
                    const mPrice = priceMap.get(mod.name) || 0;
                    rowRevenue += mPrice * item.qty * mod.qty;
                }

                // Deduction Logic
                const processDeduction = (posName: string, multiplier: number) => {
                    const mapping = recipeMap.get(posName);
                    if (mapping && mapping.product) {
                        const deductQty = multiplier * mapping.quantity;

                        // Helper map for execution later
                        const currentQty = deductionMap.get(mapping.productId) || 0;
                        deductionMap.set(mapping.productId, currentQty + deductQty);

                        // COGS (Live WAC)
                        // If cost is 0, we still sum it but it adds 0
                        const unitCost = mapping.product.cost || 0;
                        const currentCogs = cogsMap.get(mapping.productId) || 0;
                        cogsMap.set(mapping.productId, currentCogs + (deductQty * unitCost));
                    }
                };

                processDeduction(item.name, item.qty);
                item.modifiers.forEach(mod => processDeduction(mod.name, item.qty * mod.qty));
            }
            totalExpectedRevenue += rowRevenue;
        }

        const totalCOGS = Array.from(cogsMap.values()).reduce((a, b) => a + b, 0);
        const revenueVariance = totalDeclaredRevenue - totalExpectedRevenue;

        // 6. Execute (If enabled)
        if (execute) {
            if (!branchId) return NextResponse.json({ error: 'Branch ID required for execution' }, { status: 400 });

            const adminUser = await prisma.user.findFirst();
            const userId = adminUser?.id || 'system';

            // Create the History Log
            const report = await prisma.salesReport.create({
                data: {
                    fileName: file.name,
                    uploadDate: new Date(),
                    reportDate: reportDate, // Use extracted date
                    totalRevenue: totalDeclaredRevenue,
                    totalCOGS: totalCOGS,
                    variance: revenueVariance,
                    status: 'SUCCESS',
                    branchId: branchId
                }
            });

            // Perform Inventory Deductions
            const operations = [];

            for (const [productId, qty] of deductionMap.entries()) {
                if (qty <= 0) continue;

                operations.push(
                    prisma.inventoryLevel.upsert({
                        where: { productId_branchId: { productId, branchId } },
                        update: { quantityOnHand: { decrement: qty } },
                        create: { productId, branchId, quantityOnHand: -qty }
                    })
                );

                operations.push(
                    prisma.inventoryTransaction.create({
                        data: {
                            type: 'SALE',
                            productId,
                            quantity: qty,
                            sourceBranchId: branchId,
                            userId,
                            notes: `Sales Import: ${file.name}`,
                            timestamp: reportDate // Use extracted date for transaction time
                        }
                    })
                );
            }

            if (operations.length > 0) {
                await prisma.$transaction(operations);
            }

            return NextResponse.json({
                success: true,
                executed: true,
                reportId: report.id,
                financials: {
                    totalDeclaredRevenue,
                    totalExpectedRevenue,
                    revenueVariance,
                    totalCOGS
                },
                auditReport,
                message: `Executed deductions successfully. Date used: ${reportDate.toISOString().split('T')[0]}`
            });
        }

        // Analysis Response
        return NextResponse.json({
            success: true,
            executed: false,
            failedRows: failedRows,
            dateDetected: {
                date: reportDate,
                source: dateSourceString
            },
            financials: {
                totalDeclaredRevenue,
                totalExpectedRevenue,
                revenueVariance,
                totalCOGS,
                ROW_COUNT: parsedRows.length
            },
            auditReport: auditReport
        });

    } catch (error: any) {
        console.error('Sales Import API Error:', error);
        return NextResponse.json({ error: `Server Error: ${error.message}` }, { status: 500 });
    }
}
