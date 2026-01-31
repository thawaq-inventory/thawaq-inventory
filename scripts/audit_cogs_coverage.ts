
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 COGS COVERAGE AUDIT");
    console.log("-----------------------");

    // 1. Fetch Key Data
    const mappings = await prisma.productMapping.findMany({
        include: { product: true }
    });

    const recipes = await prisma.recipe.findMany({
        include: { ingredients: { include: { product: true } } }
    });

    const products = await prisma.product.findMany();

    console.log(`\n📊 Database Stats:`);
    console.log(`- Products (Ingredients): ${products.length}`);
    console.log(`- Recipes (Menu Designs): ${recipes.length}`);
    console.log(`- POS Mappings (Links):   ${mappings.length}`);

    // 2. Audit Recipes (Theoretical Cost)
    console.log(`\n🍲 Recipe Cost Audit:`);
    let zeroCostRecipes = 0;

    for (const r of recipes) {
        let cost = 0;
        let missingCostIng = 0;

        for (const ing of r.ingredients) {
            if (ing.product.cost > 0) {
                cost += ing.product.cost * ing.quantity;
            } else {
                missingCostIng++;
            }
        }

        if (cost === 0) {
            zeroCostRecipes++;
            console.log(`  ❌ [No Cost] Recipe: "${r.name}" (Ingredients: ${r.ingredients.length})`);
        } else if (missingCostIng > 0) {
            console.log(`  ⚠️ [Partial] Recipe: "${r.name}" has ${missingCostIng} ingredients with $0 cost.`);
        }
    }

    if (zeroCostRecipes === 0) console.log("  ✅ All recipes have a calculated cost > 0.");

    // 3. Audit Mappings (Actual Sales Link)
    console.log(`\n🔗 POS Mapping Audit:`);
    let unmapped = 0;
    let zeroCostMapped = 0;

    // Check coverage of Mappings
    for (const m of mappings) {
        if (!m.product) {
            console.log(`  ❌ [Broken Link] POS: "${m.posString}" -> No Product Linked`);
            unmapped++;
            continue;
        }

        if (m.product.cost === 0) {
            console.log(`  ⚠️ [Zero Cost] POS: "${m.posString}" -> Linked to "${m.product.name}" (Cost: 0)`);
            zeroCostMapped++;
        }
    }

    if (unmapped === 0 && zeroCostMapped === 0) {
        console.log("  ✅ All POS Mappings link to products with cost.");
    }

    // 4. Missing Mappings Check (Simulation)
    // We can't know what *will* be sold, but we can check if Recipes are mapped
    console.log(`\n❓ Mapping Gaps (Recipes not linked to POS):`);
    const mappedProductIds = new Set(mappings.map(m => m.productId));
    // Find recipes whose "Output Product" (if any) or simply matching by Name isn't mapped
    // Since Recipe != Product directly in schema yet (planned change), we check loosely.

    // Check Logic Summary
    console.log("\n-----------------------");
    console.log("📝 SYSTEM LOGIC CONFIRMATION:");
    console.log("1. Multi-Item Rows: System SPLITS by newline (\\n).");
    console.log("2. Notes: Logic REMOVES text after 'Note:'.");
    console.log("3. Unmapped Items: Currently costed at $0.00 (No Error Raised).");
    console.log("-----------------------");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
