
import { prisma } from './lib/prisma';

async function main() {
    console.log("--- DEBUG: Checking Sales Data Persistence ---");

    // 1. Check SalesReport
    const reports = await prisma.salesReport.findMany({ take: 2, orderBy: { createdAt: 'desc' } });
    console.log(`\nFound ${reports.length} Sales Reports.`);
    reports.forEach(r => console.log(`  - Report: ${r.fileName} (Total Rev: ${r.totalRevenue})`));

    // 2. Check Journal Entries for Sales
    const journals = await prisma.journalEntry.findMany({
        where: { description: { contains: 'Sales Import' } },
        take: 2,
        include: { lines: { include: { account: true } } }
    });
    console.log(`\nFound ${journals.length} Sales Journals.`);
    journals.forEach(j => {
        console.log(`  - Journal: ${j.description} (Ref: ${j.reference})`);
        j.lines.forEach(l => console.log(`    - ${l.account.name}: ${l.debit > 0 ? 'Dr ' + l.debit : 'Cr ' + l.credit}`));
    });

    // 3. Check Inventory Transactions (type SALE)
    // Note: Schema might use InventoryLog or InventoryTransaction depending on version
    // Let's check InventoryLog first
    const logs = await prisma.inventoryLog.findMany({
        where: { reason: 'SALE' },
        take: 5,
        include: { product: true }
    });
    console.log(`\nFound ${logs.length} Inventory Logs (Reason: SALE).`);
    logs.forEach(l => console.log(`  - Product: ${l.product.name} | Qty: ${l.changeAmount}`));

    // 4. Check InventoryTransaction (New Model)
    const txns = await prisma.inventoryTransaction.findMany({
        where: { type: 'SALE' },
        take: 5,
        include: { product: true }
    });
    console.log(`\nFound ${txns.length} Inventory Transactions (Type: SALE).`);
    txns.forEach(t => console.log(`  - Product: ${t.product.name} | Qty: ${t.quantity} | Notes: ${t.notes}`));

}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
