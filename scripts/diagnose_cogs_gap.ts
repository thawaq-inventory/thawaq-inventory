
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 COGS GAP DIAGNOSTIC");
    console.log("----------------------");

    // 1. Check Recipe Count (The likely suspect)
    const recipeCount = await prisma.recipe.count();
    console.log(`📚 Total Recipes in DB: ${recipeCount}`);
    if (recipeCount === 0) {
        console.log("   ❌ CRITICAL: You have 0 Recipes. Complex items like 'Burger' cannot be calculated without a Recipe.");
    }

    // 2. Analyze Mappings
    const mappings = await prisma.productMapping.findMany({
        include: { product: true, recipe: { include: { ingredients: { include: { product: true } } } } }
    });

    console.log(`\n🔗 Mappings Found: ${mappings.length}`);

    let linkedToProduct = 0;
    let linkedToRecipe = 0;
    let zeroCostMapped = 0;
    let validCostMapped = 0;

    for (const m of mappings) {
        let cost = 0;
        let type = 'NONE';

        if (m.product) {
            type = 'Product';
            linkedToProduct++;
            cost = m.product.cost;
        } else if (m.recipe) {
            type = 'Recipe';
            linkedToRecipe++;
            cost = m.recipe.ingredients.reduce((sum, i) => sum + (i.product.cost * i.quantity), 0);
        }

        if (cost === 0) {
            zeroCostMapped++;
            // console.log(`   ⚠️ Zero Cost: "${m.posString}" -> ${type} (Cost: 0)`);
        } else {
            validCostMapped++;
        }
    }

    console.log(`   - Linked to Direct Product: ${linkedToProduct}`);
    console.log(`   - Linked to Recipe:         ${linkedToRecipe}`);
    console.log(`   - Valid Cost (>0):          ${validCostMapped}`);
    console.log(`   - Zero Cost (Mapped):       ${zeroCostMapped}`);

    // 3. Check for Unmapped items appearing in Sales?
    // We can't see the uploaded file, but we can guess if PosMenuItems > Mappings
    const posItems = await prisma.posMenuItem.count();
    console.log(`\n🍔 Total POS Menu Items (from history): ${posItems}`);
    console.log(`   (If you have ${posItems} items but only ${mappings.length} mappings, the difference is uncosted.)`);

    // 4. Recommendation
    console.log("\n📋 DIAGNOSIS:");
    if (recipeCount === 0 && linkedToProduct < posItems) {
        console.log("   Your COGS is low because you have NO RECIPES and missing Product mappings.");
        console.log("   Action: Go to /admin/recipes and create recipes for your items.");
    } else if (zeroCostMapped > 0) {
        console.log(`   You have ${zeroCostMapped} items mapped to products/recipes that cost $0. Check Product costs.`);
    } else if (mappings.length < posItems) {
        console.log(`   You have unmapped items. ${posItems - mappings.length} items have no map.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
