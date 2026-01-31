
import * as xlsx from 'xlsx';

const FILE_PATH = '/Users/mac/Desktop/Al Thawaq PnL.xlsx';

function main() {
    try {
        const workbook = xlsx.readFile(FILE_PATH);
        console.log("Sheet Names:", workbook.SheetNames);

        for (const name of workbook.SheetNames) {
            const sheet = workbook.Sheets[name];
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
            if (data.length > 0) {
                console.log(`Sheet [${name}] Headers:`, data[0]);
            }
        }
    } catch (error) {
        console.error("Error reading file:", error);
    }
}

main();
