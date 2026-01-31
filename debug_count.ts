
import { prisma } from './lib/prisma';

async function main() {
    console.log("--- DEBUG V2: Counting All Rows ---");

    const jeCount = await prisma.journalEntry.count();
    console.log(`Journal Entries: ${jeCount}`);

    if (jeCount > 0) {
        const first = await prisma.journalEntry.findFirst();
        console.log("Sample JE:", first);
    }

    const srCount = await prisma.salesReport.count();
    console.log(`Sales Reports: ${srCount}`);

    const ilCount = await prisma.inventoryLog.count();
    console.log(`Inventory Logs: ${ilCount}`);

    const itCount = await prisma.inventoryTransaction.count();
    console.log(`Inventory Transactions: ${itCount}`);

    // Check Product Mappings
    const pmCount = await prisma.productMapping.count();
    console.log(`Product Mappings: ${pmCount}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
