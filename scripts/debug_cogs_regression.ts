
import { prisma } from '../lib/prisma';

async function main() {
    console.log("🕵️‍♀️ STARTING COGS REGRESSION DIAGNOSIS");
    console.log("-------------------------------------");

    // 1. Check Total Counts
    const recipeCount = await prisma.recipe.count();
    const mappingCount = await prisma.productMapping.count();
    const recipeMappingCount = await prisma.productMapping.count({
        where: { recipeId: { not: null } }
    });

    console.log(`📊 TOTAL RECIPES: ${recipeCount}`);
    console.log(`🔗 TOTAL MAPPINGS: ${mappingCount}`);
    console.log(`🍳 MAPPINGS LINKED TO RECIPE: ${recipeMappingCount}`);

    // 2. Inspect Key Items (suspected culprits)
    // We look for items that SHOULD use recipes
    const suspectItems = ['Zinger', 'Burger', 'Sandwich', 'Fries'];

    console.log("\n🔍 INSPECTING SUSPECT ITEMS:");
    for (const term of suspectItems) {
        const mappings = await prisma.productMapping.findMany({
            where: { posString: { contains: term, mode: 'insensitive' } },
            include: { recipe: { include: { ingredients: true } }, product: true },
            take: 5
        });

        if (mappings.length === 0) continue;

        console.log(`\n--- Matches for '${term}' ---`);
        for (const m of mappings) {
            console.log(`Item: "${m.posString}"`);
            if (m.recipeId) {
                const ingCount = m.recipe?.ingredients.length || 0;
                console.log(`   ✅ Linked to Recipe: "${m.recipe?.name}" (ID: ${m.recipeId})`);
                console.log(`      Ingredients: ${ingCount}`);
                if (ingCount === 0) console.log("      ⚠️ RECIPE HAS NO INGREDIENTS!");
            } else if (m.productId) {
                console.log(`   ⚠️ Linked to Product: "${m.product?.name}" (Cost: ${m.product?.cost})`);
                if ((m.product?.cost || 0) === 0) console.log("      ❌ ZERO COST PRODUCT!");
            } else {
                console.log(`   ❌ NO LINK (Unmapped)`);
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
