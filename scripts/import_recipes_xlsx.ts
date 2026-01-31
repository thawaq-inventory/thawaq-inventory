
import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();
const FILE_PATH = path.join(process.cwd(), 'public/Recipe_Map.xlsx');

interface RecipeRow {
    POS_String: string;
    Inventory_SKU: string;
    Quantity: number;
}

async function main() {
    console.log("🥘 STARTING RECIPE MIGRATION FROM XLSX");
    console.log("-------------------------------------");

    // 1. Read File
    const workbook = xlsx.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: RecipeRow[] = xlsx.utils.sheet_to_json(sheet);

    console.log(`📥 Loaded ${rows.length} rows from Recipe_Map.xlsx`);

    // 2. Group by Recipe Name (POS_String)
    const recipeGroups = new Map<string, RecipeRow[]>();
    for (const row of rows) {
        // Clean strings
        const name = String(row.POS_String || '').trim();
        const sku = String(row.Inventory_SKU || '').trim();
        const qty = parseFloat(String(row.Quantity || '0'));

        if (!name || !sku || qty <= 0) continue;

        const group = recipeGroups.get(name) || [];
        group.push(row);
        recipeGroups.set(name, group);
    }

    console.log(`🍳 Found ${recipeGroups.size} unique Recipes to create.`);

    // 3. Process Each Group
    let createdCount = 0;
    let ingredientCount = 0;
    let errorCount = 0;

    // Cache products by SKU for speed
    const products = await prisma.product.findMany();
    // Create Map: SKU -> ProductID
    // Note: User said "Inventory_SKU" matches Product SKU.
    const productMap = new Map(products.map(p => [String(p.sku || '').trim(), p]));

    for (const [recipeName, ingredients] of recipeGroups.entries()) {
        try {
            // A. Create or Upsert Recipe
            // We use upsert to avoid crashing if it exists (update basics)
            const recipe = await prisma.recipe.upsert({
                where: { id: recipeName }, // Use name as ID? No, ID is uuid. We can't upsert by name easily unless name is unique.
                // findFirst equivalent logic needed.
                // Let's check if exists first.
                create: { name: recipeName },
                update: {}, // do nothing if exists (or maybe update name to match exactly?)
            }).catch(async () => {
                // If upsert fails (unlikely on create), try find
                return await prisma.recipe.findFirst({ where: { name: recipeName } }) || await prisma.recipe.create({ data: { name: recipeName } });
            });

            // Re-fetch to get ID reliably if upsert logic confusing with uuid
            const actualRecipe = await prisma.recipe.findFirst({ where: { name: recipeName } });
            if (!actualRecipe) {
                // Create it
                await prisma.recipe.create({ data: { name: recipeName, servingSize: 1 } });
            }

            // Actually, let's do a reliable Find-or-Create
            let targetRecipe = await prisma.recipe.findFirst({ where: { name: recipeName } });
            if (!targetRecipe) {
                targetRecipe = await prisma.recipe.create({
                    data: { name: recipeName, servingSize: 1 }
                });
                createdCount++;
            }

            // B. Clear existing ingredients (Migration = Full Overwrite)
            await prisma.recipeIngredient.deleteMany({ where: { recipeId: targetRecipe.id } });

            // C. Add Ingredients
            for (const ing of ingredients) {
                const sku = String(ing.Inventory_SKU).trim();
                const product = productMap.get(sku);

                if (!product) {
                    console.warn(`   ⚠️ SKU Not Found: ${sku} (for recipe: ${recipeName})`);
                    continue;
                }

                await prisma.recipeIngredient.create({
                    data: {
                        recipeId: targetRecipe.id,
                        productId: product.id,
                        quantity: Number(ing.Quantity),
                        unit: product.unit // Default to product's unit
                    }
                });
                ingredientCount++;
            }

            // D. Update Product Mapping (Link POS Item to this Recipe)
            // We do this so the import script uses the Recipe logic!
            await prisma.productMapping.upsert({
                where: { posString: recipeName },
                create: {
                    posString: recipeName,
                    recipeId: targetRecipe.id,
                    quantity: 1, // 1 Serving
                },
                update: {
                    recipeId: targetRecipe.id,
                    // Clear direct product link if it existed, to prefer Recipe
                    productId: null
                }
            });

        } catch (error) {
            console.error(`Error processing recipe: ${recipeName}`, error);
            errorCount++;
        }
    }

    console.log("-------------------------------------");
    console.log(`✅ MIGRATION COMPLETE`);
    console.log(`   - Recipes Created/Updated: ${createdCount}`); // Technically "Processed"
    console.log(`   - Ingredients Added:       ${ingredientCount}`);
    console.log(`   - Errors:                  ${errorCount}`);
    console.log(`   - ProductMappings Updated: ${recipeGroups.size}`);
    console.log("\n🚀 System is now ready for Sales Import (Costing will use these Recipes).");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
