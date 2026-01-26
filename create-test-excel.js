const XLSX = require('xlsx');

const workbook = XLSX.utils.book_new();
const data = [
    { Name: "Test Product A", SKU: "TEST-001", Initial_Cost: 10, Category: "Test" },
    { Name: "Test Product B", SKU: "TEST-002", Initial_Cost: 20, Category: "Test" }
];

const worksheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

XLSX.writeFile(workbook, "test_products.xlsx");
console.log("Created test_products.xlsx");
