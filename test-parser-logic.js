const XLSX = require('xlsx');

async function testParser() {
    try {
        console.log("Testing XLSX import...");
        const workbook = XLSX.utils.book_new();
        const data = [{ Name: "A", SKU: "1" }];
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        console.log("Created buffer of size:", buffer.length);

        // Mock the parsing logic from file-parser.ts
        const readWorkbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = readWorkbook.SheetNames[0];
        const sheet = readWorkbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);

        console.log("Parsed JSON:", json);

        if (json.length === 1 && json[0].Name === "A") {
            console.log("SUCCESS: XLSX logic works.");
        } else {
            console.log("FAILURE: JSON mismatch.");
        }

    } catch (e) {
        console.error("CRASH:", e);
    }
}

testParser();
