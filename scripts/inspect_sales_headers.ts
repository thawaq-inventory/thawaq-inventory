
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

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

    if (rows.length > 0) {
        console.log("📋 First Row Keys (Headers):");
        console.log(Object.keys(rows[0]));
        console.log("\n📄 First Row Data:");
        console.log(JSON.stringify(rows[0], null, 2));
    } else {
        console.log("❌ File is empty or could not be parsed.");
    }
}

main().catch(console.error);
