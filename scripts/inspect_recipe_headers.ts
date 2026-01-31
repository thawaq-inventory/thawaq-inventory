
import * as xlsx from 'xlsx';

const FILE_PATH = 'public/Recipe_Map.xlsx';

function main() {
    try {
        const workbook = xlsx.readFile(FILE_PATH);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Read header row (A1, B1, C1...)
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        if (data.length > 0) {
            console.log("Headers found:", data[0]);
            console.log("First Row Sample:", data[1]);
        } else {
            console.log("File is empty.");
        }
    } catch (error) {
        console.error("Error reading file:", error);
    }
}

main();
