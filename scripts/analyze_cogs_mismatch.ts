
import { prisma } from '../lib/prisma';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Robust Parser for various formats
// Robust Parser (Mirrors lib/parsers/sales-report-parser.ts)
function parseItems(itemsString: string) {
    if (!itemsString) return [];

    const results: string[] = [];

    // Strategy 1: Standard "Quantity x Name" format
    if (itemsString.match(/^\d+x/)) {
        const parts = itemsString.split(/,\s*(?=\d+x)/);
        for (const part of parts) {
            const match = part.trim().match(/^(\d+)x\s+(.+)$/);
            if (match) {
                results.push(match[2].split('(')[0].trim());
            }
        }
        return results;
    }

    // Strategy 2: Comma Separated String (Legacy/Arabic)
    // Handle newlines too
    const separators = /[\n,]/;
    const parts = itemsString.split(separators);

    for (const p of parts) {
        let clean = p.trim();
        if (!clean) continue;

        // Handle "Note:" or "Notes:" suffix and strip it
        const noteIndex = clean.toLowerCase().indexOf('note:');
        if (noteIndex > -1) {
            clean = clean.substring(0, noteIndex).trim();
        }
        const notesIndex = clean.toLowerCase().indexOf('notes:');
        if (notesIndex > -1) {
            clean = clean.substring(0, notesIndex).trim();
        }

        // Strip parens
        clean = clean.split('(')[0].trim();

        if (clean) {
            results.push(clean);
        }
    }

    return results;
}

async function main() {
    const filePath = path.join(process.cwd(), 'public', 'Orders_20260130T114306668Z.xlsx');
    console.log(`📂 Reading: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error("❌ File not found!");
        return;
    }

    const buf = fs.readFileSync(filePath);
    const wb = xlsx.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    console.log(`📄 Found ${rows.length} rows.`);

    const itemCounts = new Map<string, number>();

    // 1. Aggregation
    for (const row of rows) {
        // Header fallback chain
        const content = row['Items Breakdown'] || row['items_breakdown'] || row['Order Items'] || row['order_items'];
        if (content) {
            const names = parseItems(String(content));
            for (const name of names) {
                itemCounts.set(name, (itemCounts.get(name) || 0) + 1);
            }
        }
    }

    console.log(`🔍 Found ${itemCounts.size} unique items in sales history.`);

    // 2. Database Check
    console.log("\n📊 CHECKING MAPPINGS & COSTS...");
    console.log("---------------------------------------------------");
    console.log(String("ITEM NAME").padEnd(40) + " | " + String("COUNT").padEnd(6) + " | " + String("STATUS").padEnd(20) + " | " + "COST");
    console.log("---------------------------------------------------");

    let totalPotentialMissed = 0;

    // Sort by frequency
    const sortedItems = Array.from(itemCounts.entries()).sort((a, b) => b[1] - a[1]);

    // Cache mappings for speed
    const allMappings = await prisma.productMapping.findMany({
        include: {
            recipe: { include: { ingredients: { include: { product: true } } } },
            product: true
        }
    });
    const mapDict = new Map(allMappings.map(m => [m.posString.toLowerCase(), m]));

    for (const [name, count] of sortedItems) {
        // Check exact match (case insensitive)
        const mapping = mapDict.get(name.toLowerCase());

        let status = "❌ UNMAPPED";
        let cost = 0.00;

        if (mapping) {
            if (mapping.recipe) {
                const ingCount = mapping.recipe.ingredients.length;
                if (ingCount > 0) {
                    status = `✅ RECIPE (${ingCount} ing)`;
                    cost = mapping.recipe.ingredients.reduce((sum, i) => sum + (i.quantity * i.product.cost), 0);
                } else {
                    status = "⚠️ RECIPE (Empty)";
                }
            } else if (mapping.product) {
                status = "📦 PRODUCT";
                cost = mapping.product.cost || 0;
            } else {
                status = "⚠️ MAPPED (Null)";
            }
        }

        const costDisplay = cost > 0 ? cost.toFixed(3) : "FAIL";

        console.log(`${name.substring(0, 39).padEnd(40)} | ${String(count).padEnd(6)} | ${status.padEnd(20)} | ${costDisplay}`);

        if (cost === 0) {
            totalPotentialMissed += count;
        }
    }

    console.log("---------------------------------------------------");
    console.log(`🚨 Total Items with ZERO cost: ${totalPotentialMissed}`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
