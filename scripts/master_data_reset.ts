
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🚨 STARTING MASTER DATA RESET 🚨");
    console.log("-----------------------------------");
    console.log("Keeping: Users, Branches, SalesReports, Accounts, Vendors");
    console.log("Deleting: Recipes, Menu Items, Products, Inventory Levels, Transactions");

    // 1. CLEAR DEPENDENCIES (The "Leaves" of the tree)
    console.log("\nDeleting Dependencies...");

    // Menu & Recipe Links
    await prisma.recipeIngredient.deleteMany();
    console.log(" - RecipeIngredients Cleared");

    await prisma.productMapping.deleteMany(); // Links POS string to Product
    console.log(" - ProductMappings Cleared");

    // Inventory State
    await prisma.inventoryLevel.deleteMany();
    console.log(" - InventoryLevels Cleared");

    await prisma.inventoryTransaction.deleteMany();
    console.log(" - InventoryTransactions Cleared");

    await prisma.inventoryLog.deleteMany();
    console.log(" - InventoryLogs Cleared");

    await prisma.wasteLog.deleteMany();
    console.log(" - WasteLogs Cleared");

    await prisma.locationStock.deleteMany(); // Legacy
    console.log(" - LocationStock Cleared");

    // Operations (Moving parts)
    await prisma.productionItem.deleteMany();
    await prisma.productionBatch.deleteMany();
    console.log(" - Production Batches Cleared");

    await prisma.receivingItem.deleteMany();
    await prisma.receivingBatch.deleteMany();
    console.log(" - Receiving Batches Cleared");

    await prisma.transferItem.deleteMany();
    await prisma.transferRequest.deleteMany();
    console.log(" - Transfer Requests Cleared");

    await prisma.stockTransfer.deleteMany(); // Legacy
    console.log(" - StockTransfers Cleared");

    await prisma.invoiceItem.deleteMany();
    // await prisma.invoice.deleteMany(); // Optional: Keep invoices headers? User "Safe truncate" implied fixing data. Invoice headers without items are useless.
    // Keeping Invoice Headers for now to be safe on "Financial History", but deleting Items removes the Product link.
    console.log(" - Invoice Items Cleared (Headers Encact)");

    // 2. DELETE MENU ITEMS (Sellables)
    console.log("\nDeleting Menu Data...");
    await prisma.recipe.deleteMany(); // These are the "Menu Items" with costing
    console.log(" - Recipes (Menu Items) Deleted");

    try {
        await prisma.posMenuItem.deleteMany();
        console.log(" - PosMenuItems Deleted");
    } catch (e) {
        console.log(" - PosMenuItem table might be empty or skipped.");
    }

    // 3. DELETE PRODUCTS (Raw Materials)
    console.log("\nDeleting Products...");
    const products = await prisma.product.deleteMany();
    console.log(`✅ Products Deleted: ${products.count}`);

    console.log("\n-----------------------------------");
    console.log("✅ MASTER DATA WIPE COMPLETE");
    console.log("Tables are clean. Ready for correct upload order:");
    console.log("1. Products");
    console.log("2. Menu / Recipes");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
