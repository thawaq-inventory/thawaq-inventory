const { parseTabSenseItems } = require('../lib/parsers/sales-report-parser');

// Mock data based on user request
const sampleInput = "ساندوش حلوم\nساندوش حلوم\nمشروبات غازية 250مل\nBurger Note: No Cheese";

console.log("Input:", JSON.stringify(sampleInput));

try {
    const items = parseTabSenseItems(sampleInput);
    console.log("Parsed Items:", JSON.stringify(items, null, 2));
} catch (e: any) {
    console.log("Error:", e.message);
}
