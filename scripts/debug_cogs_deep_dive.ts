
import { prisma } from '../lib/prisma';

async function main() {
    console.log("🕵️‍♀️ STARTING DEEP DIVE DIAGNOSIS");

    const allMappings = await prisma.productMapping.findMany({
        where: { recipeId: { not: null } },
        include: { recipe: { include: { ingredients: true } } }
    });

    console.log(`Found ${allMappings.length} mappings linked to recipes.`);

    // Sample the first 10
    allMappings.slice(0, 10).forEach(m => {
        console.log(`PosString: "${m.posString}" -> Recipe: "${m.recipe?.name}" (Ings: ${m.recipe?.ingredients.length})`);
    });

    // Check for "Burger" explicitly
    const burger = allMappings.find(m => m.posString.toLowerCase().includes('burger'));
    if (burger) {
        console.log(`\n🍔 FOUND BURGER MATCH: ${burger.posString}`);
        console.log(JSON.stringify(burger, null, 2));
    } else {
        console.log("\n❌ NO 'burger' found in mappings.");
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
