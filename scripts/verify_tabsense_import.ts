
import { parseUpload } from '../lib/parsers/file-parser';
import { parseTabSenseItems } from '../lib/parsers/sales-report-parser';

// Polyfill 'File' since we are in Node.js environment
const fs = require('fs');
const path = require('path');

class MockFile {
    path: string;
    name: string;

    constructor(path: string) {
        this.path = path;
        this.name = 'test_tabsense.csv';
    }

    async arrayBuffer() {
        return fs.readFileSync(this.path);
    }
}

async function verifyImport() {
    console.log("--- Starting TabSense Import Verification ---");
    const filePath = path.resolve(__dirname, '../test_tabsense.csv');

    if (!fs.existsSync(filePath)) {
        console.error("Test CSV not found!");
        return;
    }

    const file = new MockFile(filePath);

    // 1. Parse File (simulating API logic)
    const { data: rawData, errors } = await parseUpload<any>(file as any);

    if (errors.length > 0) {
        console.error("Parse Errors:", errors);
        return;
    }

    console.log(`Parsed ${rawData.length} rows.`);

    const row = rawData[0];
    console.log("Parsed Row Data:", JSON.stringify(row, null, 2));

    // 2. Validate Column Mapping
    // 'Created At' -> 'created_at'
    // 'Items Breakdown' -> 'items_breakdown'
    // 'Total' -> 'total'

    const dateVal = row.created_at;
    const itemsRaw = row.items_breakdown;
    const totalVal = row.total;
    const grossVal = row.gross_sales;
    const taxVal = row.taxes;

    console.log(`\n--- Verification Results ---`);
    console.log(`Date (created_at): ${dateVal} [Expected: "2026-01-30 02:48:30"]`);
    console.log(`Total (total): ${totalVal} [Expected: 4.4]`);
    console.log(`Gross Sales (gross_sales): ${grossVal} [Expected: 3.793]`);
    console.log(`Taxes (taxes): ${taxVal} [Expected: 0.607]`);
    console.log(`Items Raw: ${JSON.stringify(itemsRaw)}`);

    // 3. Test Item Parsing
    if (itemsRaw) {
        const parsedItems = parseTabSenseItems(itemsRaw);
        console.log(`\nParsed Items:`, JSON.stringify(parsedItems, null, 2));
    } else {
        console.error("❌ 'items_breakdown' column missing or empty!");
    }
}

verifyImport().catch(e => console.error(e));
