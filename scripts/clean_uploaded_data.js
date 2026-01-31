const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("⚠️  Starting DATA CLEANUP PROCESS ⚠️");
    console.log("This will permanently delete imported Products, Inventory, Recipes, and Prices.");
    console.log("Waiting 3 seconds... Press Ctrl+C to cancel.");

    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // 1. Delete Sales Reports (and cascade? No, usually specific logs)
        console.log("... Deleting Sales Reports...");
        const deleteReports = await prisma.salesReport.deleteMany({});
        console.log(`✅ Deleted ${deleteReports.count} Sales Reports.`);

        // 1b. Delete Inventory Logs (Old Legacy Logs that might block product deletion)
        console.log("... Deleting Inventory Logs...");
        const deleteLogs = await prisma.inventoryLog.deleteMany({});
        console.log(`✅ Deleted ${deleteLogs.count} Inventory Logs.`);

        // 2. Delete Inventory Transactions (Linked to Products)
        console.log("... Deleting Inventory Transactions...");
        const deleteTx = await prisma.inventoryTransaction.deleteMany({});
        console.log(`✅ Deleted ${deleteTx.count} Inventory Transactions.`);

        // 3. Delete Inventory Levels
        console.log("... Deleting Inventory Levels...");
        const deleteLevels = await prisma.inventoryLevel.deleteMany({});
        console.log(`✅ Deleted ${deleteLevels.count} Inventory Levels.`);

        // 4. Delete Product Mappings (Recipe Maps)
        console.log("... Deleting Product Mappings...");
        const deleteMappings = await prisma.productMapping.deleteMany({});
        console.log(`✅ Deleted ${deleteMappings.count} Product Mappings.`);

        // 5. Delete POS Menu Items (Prices)
        console.log("... Deleting POS Menu Items (Prices)...");
        const deletePrices = await prisma.posMenuItem.deleteMany({});
        console.log(`✅ Deleted ${deletePrices.count} POS Menu Items.`);

        // 6. Delete Recipe Ingredients (if any linked to these products)
        // We should be careful here if we have manually created recipes. 
        // But assuming "Clean Slate" means all products are gone, then ingredients must go too.
        console.log("... Deleting Recipe Ingredients...");
        const deleteIngredients = await prisma.recipeIngredient.deleteMany({});
        console.log(`✅ Deleted ${deleteIngredients.count} Recipe Ingredients.`);

        // 7. Delete Transfer Items
        console.log("... Deleting Transfer Items...");
        const deleteTransferItems = await prisma.transferItem.deleteMany({});
        console.log(`✅ Deleted ${deleteTransferItems.count} Transfer Items.`);

        // 8. Delete Location Stocks (Legacy)
        console.log("... Deleting Location Stocks (Legacy)...");
        const deleteLocStocks = await prisma.locationStock.deleteMany({});
        console.log(`✅ Deleted ${deleteLocStocks.count} Location Stocks.`);

        // 9. Delete Invoice Items (Dependent on Product)
        console.log("... Deleting Invoice Items...");
        const deleteInvoiceItems = await prisma.invoiceItem.deleteMany({});
        console.log(`✅ Deleted ${deleteInvoiceItems.count} Invoice Items.`);

        // 10. Delete Waste Logs
        console.log("... Deleting Waste Logs...");
        const deleteWaste = await prisma.wasteLog.deleteMany({});
        console.log(`✅ Deleted ${deleteWaste.count} Waste Logs.`);

        // 11. Finally, Delete Products
        console.log("... Deleting Products...");
        const deleteProducts = await prisma.product.deleteMany({});
        console.log(`✅ Deleted ${deleteProducts.count} Products.`);

        console.log("-----------------------------------------");
        console.log("🎉 CLEANUP COMPLETE. System is ready for fresh data.");

    } catch (e) {
        console.error("❌ Cleanup Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
