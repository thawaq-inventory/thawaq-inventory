import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';
import { parseSalesReportLine, parseTabSenseItems, ParsedItem } from '@/lib/parsers/sales-report-parser';
import { parseTalabatItems, TalabatItem } from '@/lib/parsers/talabat-parser';

// --- FINANCIAL CONSTANTS (FALLBACKS) ---
// These will be overridden by DB settings if available
const DEFAULT_RATES: Record<string, number> = {
    'Visa': 0.007,
    'Talabat': 0.25,
    'Careem': 0.25
};

// Normalized Headers expected
interface SalesRow {
    // TabSense Format (Master)
    created_at?: string;
    receipt?: string | number; // Unique Identifier
    items_breakdown?: string;
    total?: string | number; // Total Collected
    gross_sales?: string | number; // Real Revenue
    taxes?: string | number; // Tax Liability

    // Date & Time specific columns (Historical Import)
    date?: string; // e.g. "2023-10-25"
    time?: string; // e.g. "14:30:00"

    // Payment Methods for Fee Calc
    cash?: string | number;
    visa?: string | number;
    talabat?: string | number;
    careem?: string | number;
    tips?: string | number;
    tip?: string | number; // Alias

    // Legacy support (optional)
    order_items?: string;
    order_value?: string | number;

    // Talabat-specific fields
    subtotal?: string | number; // Revenue
    order_received_at?: string; // Timestamp

    [key: string]: any;
}

interface FlashPnL {
    metric: string;
    amount: number;
    logic: string;
    isNegative?: boolean;
    isTotal?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const action = formData.get('action') as string; // 'ANALYZE', 'POST_ALL', 'POST_REVENUE_ONLY', 'POST_MISSING_COGS'
        const branchId = formData.get('branchId') as string;
        const channel = (formData.get('channel') as string) || 'IN_HOUSE'; // Default to IN_HOUSE

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        // 0. Fetch Dynamic Settings
        const [paymentMethods, systemSettings] = await Promise.all([
            prisma.paymentMethod.findMany(),
            prisma.systemSetting.findMany()
        ]);

        const getFeeRate = (method: string) => {
            const setting = paymentMethods.find(p => p.name.toLowerCase() === method.toLowerCase());
            return setting ? setting.feeRate : (DEFAULT_RATES[method] || 0);
        };

        const getSetting = (key: string, defaultVal: number) => {
            const s = systemSettings.find(x => x.key === key);
            return s ? parseFloat(s.value) : defaultVal;
        };

        const VAT_RATE = getSetting('VAT_RATE', 0.16); // Default 16% if missing
        const FEE_VISA = getFeeRate('Visa');
        const FEE_TALABAT = getFeeRate('Talabat');
        const FEE_CAREEM = getFeeRate('Careem');

        // 1. Parsing
        const { data: rawData, errors } = await parseUpload<SalesRow>(file);
        if (errors.length > 0) {
            return NextResponse.json({ error: 'File Parse Error', details: errors }, { status: 400 });
        }

        // Filter valid data
        const data = rawData.filter(row => {
            const hasItems = (row.items_breakdown && String(row.items_breakdown).trim() !== '') || row.order_items;
            const hasTotal = row.total || row.order_value || row.subtotal; // Added subtotal for Talabat
            return hasItems && hasTotal;
        });

        if (data.length === 0) {
            const foundHeaders = rawData.length > 0 ? Object.keys(rawData[0]).join(', ') : 'None';
            return NextResponse.json({
                error: 'No valid sales data found. Check your CSV headers.',
                details: [
                    `Found Headers: ${foundHeaders}`,
                    `Expected: items_breakdown (or order_items) AND total (or order_value or subtotal)`
                ]
            }, { status: 400 });
        }

        // 2. Pre-Validation: Check Mappings
        const allPosStrings = new Set<string>();
        for (const row of data) {
            if (row.items_breakdown) {
                const items = parseTabSenseItems(String(row.items_breakdown));

                items.forEach(i => {
                    allPosStrings.add(i.name);
                    i.modifiers.forEach(m => allPosStrings.add(m.name));
                });
            } else if (row.order_items) {
                let items: ParsedItem[] = [];
                if (channel === 'TALABAT') {
                    const tItems = parseTalabatItems(String(row.order_items));
                    items = tItems.map(ti => ({ name: ti.name, qty: ti.qty, modifiers: [] }));
                } else {
                    items = parseSalesReportLine(String(row.order_items));
                }
                items.forEach(i => { allPosStrings.add(i.name); i.modifiers.forEach(m => allPosStrings.add(m.name)); });
            }
        }

        const recipes = await prisma.productMapping.findMany({
            where: { posString: { in: Array.from(allPosStrings) } },
            include: {
                product: true,
                recipe: {
                    include: {
                        ingredients: {
                            include: { product: true }
                        }
                    }
                }
            }
        });
        const recipeMap = new Map<string, any>();
        recipes.forEach(r => recipeMap.set(r.posString, r));

        // Strict Validation Check
        const missingItems = Array.from(allPosStrings).filter(name => !recipeMap.has(name));

        if (missingItems.length > 0) {
            return NextResponse.json({
                error: 'Validation Failed: Items missing from Recipe Map',
                details: missingItems,
                missingItems: missingItems // Explicit format for UI to consume
            }, { status: 400 });
        }


        // 3. Data Gathering & Flash P&L Calculation
        let totalCollected = 0;
        let totalNetRevenue = 0;
        let totalTaxLiability = 0;
        let totalTips = 0;
        let totalTransactionFees = 0;
        let totalCOGS = 0;
        let zeroCostCount = 0;

        const receiptsToProcess: any[] = [];
        const receiptIds = new Set<string>();

        // Main Loop
        for (const row of data) {
            const receiptId = String(row.receipt || row['Receipt'] || `LEGACY_${Math.random()}`); // Fallback for legacy
            receiptIds.add(receiptId);

            // Helpers to parse currency safely
            const getFloat = (val: any) => parseFloat(String(val || 0).replace(/[^0-9.-]+/g, '')) || 0;

            // --- WATERFALL CALCULATION ---
            // 1. Total Collected (Cash + Tax)
            let rowTotal = getFloat(row.total || row.subtotal); // Added subtotal for Talabat
            const rowTax = getFloat(row.taxes);
            const rowGrossInput = getFloat(row.gross_sales);

            // Fallback: If total is missing, reconstruct it
            if (rowTotal === 0 && (rowGrossInput > 0 || rowTax > 0)) {
                rowTotal = rowGrossInput + rowTax;
            }

            // 2. Net Revenue (Real Income)
            const rowNetRevenue = rowTotal - rowTax;

            // Handling Tips
            const tips = getFloat(row.tips || row.tip);

            // Fees Calculation
            const visa = getFloat(row.visa);
            const talabat = getFloat(row.talabat);
            const careem = getFloat(row.careem);

            const fees = (visa * FEE_VISA) + (talabat * FEE_TALABAT) + (careem * FEE_CAREEM);

            // COGS Calculation
            let rowCOGS = 0;
            let rowItems: ParsedItem[] = [];

            // Channel-specific parsing logic
            if (channel === 'TALABAT') {
                if (row.order_items) {
                    const talabatItems = parseTalabatItems(String(row.order_items));
                    rowItems = talabatItems.map(ti => ({
                        name: ti.name,
                        qty: ti.qty,
                        modifiers: []
                    }));
                }
            } else {
                if (row.items_breakdown) {
                    rowItems = parseTabSenseItems(String(row.items_breakdown));
                } else if (row.order_items) {
                    rowItems = parseSalesReportLine(String(row.order_items));
                }
            }

            for (const item of rowItems) {
                const processItem = (name: string, qty: number) => {
                    const mapping = recipeMap.get(name);
                    if (mapping) {
                        if (mapping.product) {
                            const cost = mapping.product.cost || 0;
                            if (cost === 0) zeroCostCount++;
                            rowCOGS += (cost * mapping.quantity * qty);
                        } else if (mapping.recipe) {
                            const recipeCost = mapping.recipe.ingredients.reduce((sum: number, ing: any) => {
                                return sum + (ing.quantity * ing.product.cost);
                            }, 0);

                            if (recipeCost === 0) zeroCostCount++;
                            rowCOGS += (recipeCost * qty);
                        }
                    }
                };
                processItem(item.name, item.qty);
                item.modifiers.forEach(mod => processItem(mod.name, item.qty * mod.qty));
            }

            // Date Parsing Logic
            let transactionDate = new Date(); // Default fallback

            if (row.date) {
                // Combine date and time if available
                const timeStr = row.time || '12:00:00';
                // Handle various date formats via constructor if standard, or manual parse? 
                // Assuming ISO or standard YYYY-MM-DD or DD/MM/YYYY. 
                // Let's try standard constructor first, usually works for YYYY-MM-DD
                const dateTimeStr = `${row.date}T${timeStr}`;
                const tryDate = new Date(dateTimeStr);
                if (!isNaN(tryDate.getTime())) {
                    transactionDate = tryDate;
                } else {
                    // Fallback try just date
                    const tryDateOnly = new Date(row.date);
                    if (!isNaN(tryDateOnly.getTime())) transactionDate = tryDateOnly;
                }
            } else if (row.created_at) {
                const tryDate = new Date(row.created_at);
                if (!isNaN(tryDate.getTime())) transactionDate = tryDate;
            } else if (row.order_received_at) {
                const tryDate = new Date(row.order_received_at);
                if (!isNaN(tryDate.getTime())) transactionDate = tryDate;
            }

            // Aggregate
            totalCollected += rowTotal;
            totalNetRevenue += rowNetRevenue;
            totalTaxLiability += rowTax;
            totalTips += tips;
            totalTransactionFees += fees;
            totalCOGS += rowCOGS;

            receiptsToProcess.push({
                receiptId,
                totalCollected: rowTotal,
                netRevenue: rowNetRevenue, // replacing gross
                tax: rowTax,
                tips,
                fees,
                cogs: rowCOGS,
                items: rowItems,
                date: transactionDate
            });
        }

        // 3. Transaction Audit (Phase 2 Step A)
        // Check Ledger for these Receipt IDs
        const existingEntries = await prisma.journalEntry.findMany({
            where: { reference: { in: Array.from(receiptIds) } },
            include: { lines: { include: { account: true } } }
        });

        const ledgerMap = new Map<string, string>(); // ID -> Status
        existingEntries.forEach(entry => {
            // Check content of lines to determine Partial vs Duplicate
            const hasRevenue = entry.lines.some(l => l.account.type === 'REVENUE');
            const hasCOGS = entry.lines.some(l => l.account.type === 'EXPENSE' && l.account.name === 'COGS');

            if (hasRevenue && hasCOGS) ledgerMap.set(entry.reference || '', 'DUPLICATE');
            else if (hasRevenue) ledgerMap.set(entry.reference || '', 'PARTIAL');
            else ledgerMap.set(entry.reference || '', 'UNKNOWN');
        });

        // Determine Status for User
        let status = 'NEW';
        if (ledgerMap.size > 0) {
            const allDupes = Array.from(receiptIds).every(id => ledgerMap.get(id) === 'DUPLICATE');
            const allPartial = Array.from(receiptIds).every(id => ledgerMap.get(id) === 'PARTIAL');

            if (allDupes) status = 'DUPLICATE';
            else if (allPartial) status = 'PARTIAL';
            else if (ledgerMap.size < receiptIds.size) status = 'MIXED'; // Some new, some old
        }


        // 4. Construct Flash P&L (Phase 2 Step B)
        const netOperatingProfit = totalNetRevenue - totalTransactionFees - totalCOGS;

        const flashReport: FlashPnL[] = [
            { metric: 'Total Collected', amount: totalCollected, logic: 'Cash + Tax' },
            { metric: '(-) VAT Liability', amount: totalTaxLiability, logic: `Gov Money (${(VAT_RATE * 100).toFixed(0)}%)`, isNegative: true },
            { metric: '(=) Net Revenue', amount: totalNetRevenue, logic: 'Real Income', isTotal: true },
            { metric: '(-) Transaction Fees', amount: totalTransactionFees, logic: 'Visa(0.7%) + Talabat(25%)', isNegative: true },
            { metric: '(-) Actual COGS', amount: totalCOGS, logic: 'Based on Recipe Ingredients', isNegative: true },
            { metric: '(=) Net Operating Profit', amount: netOperatingProfit, logic: 'Net Revenue - Fees - COGS', isTotal: true }
        ];

        if (totalTips > 0) {
            flashReport.splice(6, 0, { metric: '(i) Total Tips', amount: totalTips, logic: 'Pass-through to Staff', isNegative: false });
        }

        // 5. Action Handler (Phase 2 Step C)
        if (action === 'POST_ALL' || action === 'POST_REVENUE_ONLY' || action === 'POST_MISSING_COGS') {
            if (!branchId) return NextResponse.json({ error: 'Branch ID required for posting.' }, { status: 400 });

            console.log(`Executing Action: ${action} for ${receiptsToProcess.length} receipts.`);

            const operations: any[] = [];

            // Fetch Accounts
            const accounts = await prisma.account.findMany();
            const getAcc = (name: string) => accounts.find(a => a.name === name)?.id;

            const accFoodSales = getAcc('Food Sales');
            const accVAT = getAcc('VAT Payable');
            const accMerchantFees = getAcc('Merchant Fees');
            const accCOGS = getAcc('COGS');
            const accInventory = getAcc('Inventory Asset');
            const accCashClearing = getAcc('Cash Clearing');
            const accTips = getAcc('Tips Payable');

            if (!accFoodSales || !accVAT || !accMerchantFees || !accCOGS || !accInventory || !accCashClearing || !accTips) {
                return NextResponse.json({ error: 'Critical Accounts Missing (including Tips Payable). Run Audit.' }, { status: 500 });
            }

            // [MODIFIED FOR PHASE 2] THEORETICAL LOGGING ONLY
            // We NO LONGER create Journal Entries for Revenue/COGS here.
            // This is purely for "Theoretical Sales" analytics.

            // 1. Create Sales Report Header
            const salesReport = await prisma.salesReport.create({
                data: {
                    fileName: (file as File).name || 'Upload',
                    branchId: branchId,
                    channel: channel as any, // SalesChannel enum
                    totalRevenue: totalCollected,
                    netRevenue: totalNetRevenue,
                    taxAmount: totalTaxLiability,
                    totalCOGS: totalCOGS,
                    status: 'THEORETICAL_ONLY' // status changed to reflect no ledger impact
                }
            });

            // 2. Prepare Item Logs
            const itemLogData: any[] = [];

            for (const r of receiptsToProcess) {
                // We process ALL receipts for theoretical accuracy, blocking duplicates only happens on report level usually,
                // but here we are importing a file. If the FILE is new, we import it.
                // We rely on the user to not upload the same file twice, or check SalesReport fileName/date uniqueness elsewhere if needed.
                // For now, we log everything from this file as requested.

                for (const item of r.items) {
                    itemLogData.push({
                        posString: item.name,
                        quantity: item.qty,
                        totalSold: 0,
                        channel: channel as any,
                        salesReportId: salesReport.id,
                        importDate: r.date
                    });
                    // Variances/Modifiers
                    item.modifiers.forEach((mod: any) => {
                        itemLogData.push({
                            posString: mod.name,
                            quantity: item.qty * mod.qty,
                            totalSold: 0,
                            channel: channel as any,
                            salesReportId: salesReport.id,
                            importDate: r.date
                        });
                    });
                }
            }

            // 3. Batch Insert Logs
            if (itemLogData.length > 0) {
                const chunkSize = 1000;
                for (let i = 0; i < itemLogData.length; i += chunkSize) {
                    operations.push(prisma.salesItemLog.createMany({
                        data: itemLogData.slice(i, i + chunkSize)
                    }));
                }
            }

            // Execute Log Creation
            if (operations.length > 0) {
                await prisma.$transaction(operations);
            }

            // Mark strict success
            await prisma.salesReport.update({
                where: { id: salesReport.id },
                data: { status: 'SUCCESS' }
            });

            return NextResponse.json({
                success: true,
                message: `Successfully logged Theoretical Sales. No Ledger entries created.`,
                postedCount: itemLogData.length
            });

            return NextResponse.json({
                success: true,
                message: `Successfully posted ${operations.length} entries.`,
                postedCount: operations.length
            });
        }

        // Default: Analysis Response logic (without executing)
        // We still need to return the ZeroCost count and simple debug for unmatched items? 
        // With Strict Validation, 'unmappedItems' shouldn't technically exist here unless we relax validation or use a 'warning' mode.
        // But for strictly blocked validation, we return early above. 
        // So here 'zeroCostCount' refers to mapped items with 0 cost.

        return NextResponse.json({
            success: true,
            status: status, // NEW, PARTIAL, DUPLICATE, MIXED
            flashReport: flashReport,
            zeroCostCount: zeroCostCount,
            receiptCount: receiptsToProcess.length,
            debug: {
                // We've already validated existence, so just return cost warnings if any
                zeroCostCulprits: [] // Could populate if needed, but keeping simple for now
            }
        });

    } catch (error: any) {
        console.error('Smart Upload Error:', error);
        return NextResponse.json({ error: `Server Error: ${error.message}` }, { status: 500 });
    }
}
