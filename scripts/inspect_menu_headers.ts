
import * as xlsx from 'xlsx';
import * as path from 'path';

const FILE_PATH = path.join(process.cwd(), 'public/Menu_Prices.xlsx');

function main() {
    try {
        const workbook = xlsx.readFile(FILE_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        if (data.length > 0) {
            console.log("Headers found:", data[0]);
        }
    } catch (error) {
        console.error("Error reading file:", error);
    }
}

main();
