
import { prisma } from '../lib/prisma';

async function main() {
    console.log("🚑 STARTING MAPPING HEALER");

    const recipes = await prisma.recipe.findMany();
    console.log(`Found ${recipes.length} recipes to check.`);

    let fixedCount = 0;

    for (const recipe of recipes) {
        // Upsert mapping assuming Recipe Name = POS Name
        await prisma.productMapping.upsert({
            where: { posString: recipe.name },
            create: {
                posString: recipe.name,
                recipeId: recipe.id,
                quantity: 1
            },
            update: {
                recipeId: recipe.id
                // We don't nullify product here just in case, but usually we should. 
                // Let's stick to linking recipe.
            }
        });
        fixedCount++;
    }

    console.log(`✅ Synced ${fixedCount} recipes to ProductMapping.`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
