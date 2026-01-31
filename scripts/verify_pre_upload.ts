
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 PRE-UPLOAD STATE CHECK");
    console.log("-----------------------");

    // Master Data (Should Exist)
    const productCount = await prisma.product.count();
    const recipeCount = await prisma.recipe.count();
    const menuCount = await prisma.posMenuItem.count();

    // Sales Data (Should be Zero)
    const salesTxCount = await prisma.inventoryTransaction.count({ where: { type: 'SALE' } });
    const journalCount = await prisma.journalEntry.count();
    const headersCount = await prisma.salesReport.count();

    console.log(`📦 Master Data (MUST EXIST):`);
    console.log(`   - Products:   ${productCount} (Raw Materials)`);
    console.log(`   - Recipes:    ${recipeCount} (Cost Logic)`);
    console.log(`   - POS Items:  ${menuCount} (Menu List)`);

    console.log(`\n📉 Sales History (MUST BE ZERO):`);
    console.log(`   - Sales Tx:   ${salesTxCount}`);
    console.log(`   - Financials: ${journalCount}`);
    console.log(`   - Reports:    ${headersCount}`);

    if (productCount > 0 && salesTxCount === 0) {
        console.log("\n✅ STATUS: GREEN. Ready for Sales Import.");
        console.log("   (Products exist to be referenced. Sales are clean.)");
    } else if (salesTxCount > 0) {
        console.log("\n❌ STATUS: NOT READY. Sales history still exists!");
    } else {
        console.log("\n⚠️ STATUS: EMPTY. No Products found. You need Master Data first.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
