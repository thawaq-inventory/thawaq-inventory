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

        // 2. Data Gathering & Flash P&L Calculation
        let totalCollected = 0;
        let totalNetRevenue = 0;
        let totalTaxLiability = 0;
        let totalTips = 0;
        let totalTransactionFees = 0;
        let totalCOGS = 0;
        let zeroCostCount = 0;

        const receiptsToProcess: any[] = [];
        const receiptIds = new Set<string>();

        // Pre-fetch Mappings for Speed
        const allPosStrings = new Set<string>();
        // First pass to collect names
        for (const row of data) {
            if (row.items_breakdown) {
                const items = parseTabSenseItems(String(row.items_breakdown));
                items.forEach(i => { allPosStrings.add(i.name); i.modifiers.forEach(m => allPosStrings.add(m.name)); });
            } else if (row.order_items) {
                const items = parseSalesReportLine(String(row.order_items));
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

            // Channel-specific parsing
            if (channel === 'TALABAT') {
                // Talabat format: use order_items with Talabat parser
                if (row.order_items) {
                    const talabatItems = parseTalabatItems(String(row.order_items));
                    // Convert TalabatItem[] to ParsedItem[] format
                    rowItems = talabatItems.map(ti => ({
                        name: ti.name,
                        qty: ti.qty,
                        modifiers: [] // Talabat modifiers already stripped
                    }));
                }
            } else {
                // IN_HOUSE or default: use existing logic
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
                            // Calculate Recipe/Menu Item Cost
                            // Sum of all ingredient costs
                            const recipeCost = mapping.recipe.ingredients.reduce((sum: number, ing: any) => {
                                return sum + (ing.quantity * ing.product.cost);
                            }, 0);

                            if (recipeCost === 0) zeroCostCount++;
                            rowCOGS += (recipeCost * qty);
                        } else {
                            zeroCostCount++;
                        }
                    } else {
                        // Missing recipe/product counts as zero cost for awareness
                        zeroCostCount++;
                    }
                };
                processItem(item.name, item.qty);
                item.modifiers.forEach(mod => processItem(mod.name, item.qty * mod.qty));
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
                date: new Date(row.created_at || row.order_received_at || new Date()) // Added order_received_at for Talabat
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


        // 4. Construct Flash P&L (Phase 2 Step B / Corrected Phase 10)
        // Waterfall: Total Collected -> Net Revenue -> Net Operating Profit
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
            // Tips are informative now, but if they are collected, they are part of cash flow, but not P&L revenue usually.
            // We'll show them as an info item.
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
            const accTips = getAcc('Tips Payable'); // New Account for Refinement

            if (!accFoodSales || !accVAT || !accMerchantFees || !accCOGS || !accInventory || !accCashClearing || !accTips) {
                return NextResponse.json({ error: 'Critical Accounts Missing (including Tips Payable). Run Audit.' }, { status: 500 });
            }

            // [AUDIT] 1. Create Sales Report Header
            // We create this first so we can link logs to it.
            const salesReport = await prisma.salesReport.create({
                data: {
                    fileName: (file as File).name || 'Upload',
                    branchId: branchId,
                    channel: channel as any, // SalesChannel enum
                    totalRevenue: totalCollected,
                    netRevenue: totalNetRevenue,
                    taxAmount: totalTaxLiability,
                    totalCOGS: totalCOGS,
                    status: 'PENDING'
                }
            });

            // [AUDIT] 2. Prepare Item Logs
            const itemLogData: any[] = [];

            for (const r of receiptsToProcess) {
                const ledgerStatus = ledgerMap.get(r.receiptId) || 'NEW';

                // Skip if Duplicate
                if (ledgerStatus === 'DUPLICATE') continue;

                const lines: any[] = [];

                // --- ENGINE A: REVENUE & FEES (Cash Run) ---
                if (action === 'POST_ALL' || (action === 'POST_REVENUE_ONLY' && ledgerStatus === 'NEW')) {
                    if (ledgerStatus === 'NEW') {

                        // Credit Revenue (Net Revenue)
                        lines.push({ accountId: accFoodSales, credit: r.netRevenue, debit: 0 });
                        // Credit VAT
                        if (r.tax > 0) lines.push({ accountId: accVAT, credit: r.tax, debit: 0 });
                        // Credit Tips (New)
                        if (r.tips > 0) lines.push({ accountId: accTips, credit: r.tips, debit: 0 });

                        // Debit Expenses (Fees)
                        if (r.fees > 0) lines.push({ accountId: accMerchantFees, debit: r.fees, credit: 0 });

                        // Debit Cash Clearing (Net Cash Received)
                        // Formula: (Total Collected + Tips) - Fees  (Assuming Tips are inclusive in collection if they came from online, or added)
                        // Note: r.totalCollected usually includes tax. Does it include tips? 
                        // The user said "Total Collected (Top Line): Use the Total column". Often POS total includes tips if charged.
                        // Let's assume r.totalCollected is what hit the register (Items + Tax). 
                        // If tips are separate column, they might be added on top or inside. 
                        // Safest formula based on flow: Net Revenue + Tax + Tips - Fees = Cash.

                        const cashIn = r.netRevenue + r.tax + (r.tips || 0);
                        const netCash = cashIn - r.fees;
                        lines.push({ accountId: accCashClearing, debit: netCash, credit: 0 });
                    }
                }

                // --- ENGINE B: COGS & INVENTORY (Cost Run) ---
                if (action === 'POST_ALL' || action === 'POST_MISSING_COGS') {
                    if ((ledgerStatus === 'NEW' && action === 'POST_ALL') || (ledgerStatus === 'PARTIAL' && action === 'POST_MISSING_COGS')) {
                        if (r.cogs > 0) {
                            // Debit COGS
                            lines.push({ accountId: accCOGS, debit: r.cogs, credit: 0 });
                            // Credit Inventory
                            lines.push({ accountId: accInventory, credit: r.cogs, debit: 0 });
                        }
                    }
                }

                // [AUDIT] 3. Collect Item Logs (For Revenue Audit)
                if (ledgerStatus === 'NEW') {
                    for (const item of r.items) {
                        itemLogData.push({
                            posString: item.name,
                            quantity: item.qty,
                            totalSold: 0, // Cannot determine item-level cash from total, audit uses Quantity * MenuPrice
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

                if (lines.length > 0) {
                    operations.push(
                        prisma.journalEntry.create({
                            data: {
                                date: r.date,
                                description: `Sales Import ${r.receiptId} [${action}]`,
                                reference: r.receiptId,
                                branchId: branchId,
                                lines: { create: lines }
                            }
                        })
                    );
                }
            }

            if (operations.length > 0) {
                // [AUDIT] 4. Add Log Insertion to Transaction
                if (itemLogData.length > 0) {
                    // Split into chunks if too large (Prisma safety)
                    const chunkSize = 1000;
                    for (let i = 0; i < itemLogData.length; i += chunkSize) {
                        operations.push(prisma.salesItemLog.createMany({
                            data: itemLogData.slice(i, i + chunkSize)
                        }));
                    }
                }

                await prisma.$transaction(operations);

                // [AUDIT] 5. Mark Report Success
                await prisma.salesReport.update({
                    where: { id: salesReport.id },
                    data: { status: 'SUCCESS' }
                });
            } else {
                // If no operations (e.g. all duplicates), mark report as SKIPPED or FAILED?
                // Technically duplicates means we didn't do anything new.
                await prisma.salesReport.update({
                    where: { id: salesReport.id },
                    data: { status: 'DUPLICATE_SKIPPED' }
                });
            }

            return NextResponse.json({
                success: true,
                message: `Successfully posted ${operations.length} entries.`,
                postedCount: operations.length
            });
        }

        // Default: Analysis Response

        // Debugging Helpers
        const debugInfo = {
            sampleHeaders: rawData.length > 0 ? Object.keys(rawData[0]) : [],
            sampleFirstRow: data.length > 0 ? {
                itemsRaw: data[0].items_breakdown || data[0].order_items,
                itemsParsed: data[0].items_breakdown ? parseTabSenseItems(String(data[0].items_breakdown)) : parseSalesReportLine(String(data[0].order_items))
            } : null,
            unmappedItems: Array.from(recipeMap.keys()).filter(key => {
                const map = recipeMap.get(key);
                if (!map) return true; // Truly missing map
                // Also define "unmapped" as existing map but zero cost? 
                // No, sticking to "Known to System but Zero Cost" vs "Unknown"
                return false;
            }).length === 0 ? [] : [], // This logic is slightly circular, let's fix it by tracking misses in the loop

            // True culprits for "Zero Cost"
            zeroCostCulprits: [] as string[]
        };

        // Capture actual zero cost items during loop
        // We re-iterate partially or just capture during the main loop? 
        // Let's rely on the zeroCostCount loop above, but we didn't capture names.
        // Let's capture unique names in `zeroCostCulprits` set during the loop.

        // RE-RUN LOOP LOGIC JUST FOR DEBUG SAMPLE (Low overhead for small files, safe for 2k rows)
        const unmappedSet = new Set<string>();
        let debugCounter = 0;
        for (const row of data) {
            if (debugCounter > 100) break; // Limit check
            debugCounter++;

            let items: ParsedItem[] = [];
            if (row.items_breakdown) items = parseTabSenseItems(String(row.items_breakdown));
            else if (row.order_items) items = parseSalesReportLine(String(row.order_items));

            for (const item of items) {
                const process = (name: string) => {
                    const m = recipeMap.get(name);
                    let cost = 0;
                    if (m?.product) cost = m.product.cost;
                    else if (m?.recipe) cost = m.recipe.ingredients.reduce((s: number, i: any) => s + (i.quantity * i.product.cost), 0);

                    if (!m || cost === 0) {
                        unmappedSet.add(name); // Add Name + Cost Status? Just Name.
                    }
                };
                process(item.name);
                item.modifiers.forEach(mod => process(mod.name));
            }
        }
        debugInfo.zeroCostCulprits = Array.from(unmappedSet).slice(0, 10); // Top 10

        return NextResponse.json({
            success: true,
            status: status, // NEW, PARTIAL, DUPLICATE, MIXED
            flashReport: flashReport,
            zeroCostCount: zeroCostCount,
            receiptCount: receiptsToProcess.length,
            debug: debugInfo
        });

    } catch (error: any) {
        console.error('Smart Upload Error:', error);
        return NextResponse.json({ error: `Server Error: ${error.message}` }, { status: 500 });
    }
}
