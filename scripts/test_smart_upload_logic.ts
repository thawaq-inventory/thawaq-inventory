
// @ts-nocheck
import { prisma } from '../lib/prisma';
import { parseTabSenseItems } from '../lib/parsers/sales-report-parser';
import * as fs from 'fs';
import * as path from 'path';

// --- FINANCIAL CONSTANTS ---
const VAT_RATE = 0.16;
const FEES_VISA = 0.007; // 0.7%
const FEES_TALABAT = 0.25; // 25%
const FEES_CAREEM = 0.25; // 25%

async function simulateSmartUpload() {
    console.log("--- Starting Smart Upload Simulation ---");

    // 1. Load Dummy Data (Simulate Parsing)
    // We'll manually construct a row that matches what parseUpload would succeed with
    // based on test_tabsense.csv content we saw earlier
    const mockData = [
        {
            created_at: "2026-01-30 02:48:30",
            receipt: "101000015657",
            items_breakdown: "Ø³Ø§Ù†Ø¯ÙˆØ´ Ø­Ù„ÙˆÙ…\nØ³Ø§Ù†Ø¯ÙˆØ´ Ø­Ù„ÙˆÙ…\nÙ…Ø´Ø±ÙˆØ¨Ø§Øª ØºØ§Ø²ÙŠØ© 250Ù…Ù„",
            total: 4.4,
            gross_sales: 3.793,
            taxes: 0.607,
            messages: "Simulated Row 1",
            visa: 0,
            talabat: 0,
            careem: 0,
            cash: 4.4
        }
    ];

    console.log(`Processing ${mockData.length} rows...`);

    // 2. Data Gathering & Flash P&L Calculation
    let totalGrossSales = 0;
    let totalTaxLiability = 0;
    let totalTransactionFees = 0;
    let totalCOGS = 0;
    let zeroCostCount = 0;

    const receiptsToProcess = [];
    const receiptIds = new Set();
    const allPosStrings = new Set();

    // Collect strings for lookup
    for (const row of mockData) {
        if (row.items_breakdown) {
            const items = parseTabSenseItems(String(row.items_breakdown));
            items.forEach(i => { allPosStrings.add(i.name); i.modifiers.forEach(m => allPosStrings.add(m.name)); });
        }
    }

    // Lookup Recipes
    const recipes = await prisma.productMapping.findMany({
        where: { posString: { in: Array.from(allPosStrings) } },
        include: { product: true }
    });
    const recipeMap = new Map();
    recipes.forEach(r => recipeMap.set(r.posString, r));

    // Main Loop
    for (const row of mockData) {
        const receiptId = String(row.receipt);
        receiptIds.add(receiptId);

        const gross = parseFloat(row.gross_sales || 0);
        const tax = parseFloat(row.taxes || 0);

        // Fees Calc
        const visa = parseFloat(row.visa || 0);
        const talabat = parseFloat(row.talabat || 0);
        const careem = parseFloat(row.careem || 0);
        const fees = (visa * FEES_VISA) + (talabat * FEES_TALABAT) + (careem * FEES_CAREEM);

        // COGS Calc
        let rowCOGS = 0;
        let rowItems = [];

        if (row.items_breakdown) {
            rowItems = parseTabSenseItems(String(row.items_breakdown));
        }

        for (const item of rowItems) {
            const processItem = (name, qty) => {
                const mapping = recipeMap.get(name);
                if (mapping && mapping.product) {
                    const cost = mapping.product.cost || 0;
                    if (cost === 0) zeroCostCount++;
                    rowCOGS += (cost * mapping.quantity * qty);
                } else {
                    zeroCostCount++;
                }
            };
            processItem(item.name, item.qty);
            item.modifiers.forEach(mod => processItem(mod.name, item.qty * mod.qty));
        }

        totalGrossSales += gross;
        totalTaxLiability += tax;
        totalTransactionFees += fees;
        totalCOGS += rowCOGS;

        receiptsToProcess.push({ receiptId, gross, tax, fees, cogs: rowCOGS });
    }

    // 3. Transaction Audit
    console.log("Checking Ledger for Duplicates...");
    const existingEntries = await prisma.journalEntry.findMany({
        where: { reference: { in: Array.from(receiptIds) } },
        include: { lines: { include: { account: true } } }
    });

    const ledgerMap = new Map();
    existingEntries.forEach(entry => {
        const hasRevenue = entry.lines.some(l => l.account.type === 'REVENUE');
        const hasCOGS = entry.lines.some(l => l.account.type === 'EXPENSE' && l.account.name === 'COGS');

        if (hasRevenue && hasCOGS) ledgerMap.set(entry.reference, 'DUPLICATE');
        else if (hasRevenue) ledgerMap.set(entry.reference, 'PARTIAL');
        else ledgerMap.set(entry.reference, 'UNKNOWN');
    });

    let status = 'NEW';
    if (ledgerMap.size > 0) {
        const allDupes = Array.from(receiptIds).every(id => ledgerMap.get(id) === 'DUPLICATE');
        const allPartial = Array.from(receiptIds).every(id => ledgerMap.get(id) === 'PARTIAL');

        if (allDupes) status = 'DUPLICATE';
        else if (allPartial) status = 'PARTIAL';
        else if (ledgerMap.size < receiptIds.size) status = 'MIXED';
    }

    console.log(`\n--- RESULTS ---`);
    console.log(`STATUS: ${status}`);
    console.log(`Gross Sales: ${totalGrossSales}`);
    console.log(`Tax Liability: ${totalTaxLiability}`);
    console.log(`Fees: ${totalTransactionFees}`);
    console.log(`COGS: ${totalCOGS}`);
    console.log(`Zero Cost Items: ${zeroCostCount}`);

    console.log("\nFlash P&L:");
    console.log(`Gross Sales: ${totalGrossSales}`);
    console.log(`(-) VAT: ${totalTaxLiability}`);
    console.log(`(-) Fees: ${totalTransactionFees}`);
    console.log(`(-) COGS: ${totalCOGS}`);
    console.log(`(=) Net: ${totalGrossSales - totalTaxLiability - totalTransactionFees - totalCOGS}`);

}

simulateSmartUpload()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
