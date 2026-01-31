import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';

// Helper to normalize a key for comparison (remove _ - spaces)
function normalizeKey(k: string): string {
    return k.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Helper to find value in a row based on candidates
function findValue(row: any, candidates: string[]): any {
    const rowKeys = Object.keys(row);
    // 1. Try exact match on keys
    for (const key of rowKeys) {
        if (candidates.includes(key)) return row[key];
    }
    // 2. Try normalized match
    for (const key of rowKeys) {
        const norm = normalizeKey(key);
        if (candidates.includes(norm)) return row[key];
    }
    return undefined;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        // 1. Parse File
        const { data, errors } = await parseUpload<any>(file);

        if (errors.length > 0) {
            return NextResponse.json({ error: 'Failed to parse file', details: errors }, { status: 400 });
        }

        if (data.length === 0) {
            return NextResponse.json({ error: 'File is empty' }, { status: 400 });
        }

        console.log("--- Smart Recipe Import Started ---");

        // Candidates for fuzzy matching headers
        const posCandidates = ['posstring', 'pos_string', 'itemname', 'posname', 'name', 'item'];
        const skuCandidates = ['inventorysku', 'sku', 'inventory_sku', 'code', 'productid'];
        const qtyCandidates = ['quantity', 'qty', 'amount', 'qnty'];

        // 2. Group Rows by POS String (Recipe Name)
        const recipeGroups = new Map<string, any[]>();

        for (const row of data) {
            const rawPos = findValue(row, posCandidates);
            const rawSku = findValue(row, skuCandidates);
            const rawQty = findValue(row, qtyCandidates);

            const posString = rawPos ? String(rawPos).trim() : null;
            const sku = rawSku ? String(rawSku).trim() : null;
            const quantity = rawQty ? Number(rawQty) : 0;

            if (!posString || !sku || quantity <= 0) continue;

            const group = recipeGroups.get(posString) || [];
            group.push({ sku, quantity });
            recipeGroups.set(posString, group);
        }

        console.log(`Found ${recipeGroups.size} unique Recipes to create/update.`);

        // 3. Pre-fetch Products for Speed
        const allProducts = await prisma.product.findMany();
        const productMap = new Map(allProducts.map(p => [String(p.sku || '').trim(), p]));

        let processedRecipes = 0;
        let ingredientsAdded = 0;
        let errorsCount = 0;
        const errorDetails: string[] = [];

        // 4. Process Each Recipe Group
        for (const [recipeName, ingredients] of recipeGroups.entries()) {
            try {
                // A. Find or Create Recipe
                // Start with a clean slate for the recipe logic
                let recipe = await prisma.recipe.findFirst({ where: { name: recipeName } });

                if (!recipe) {
                    recipe = await prisma.recipe.create({
                        data: { name: recipeName, servingSize: 1 }
                    });
                }

                // B. Clear Existing Ingredients (Full Overwrite for this Import)
                await prisma.recipeIngredient.deleteMany({
                    where: { recipeId: recipe.id }
                });

                // C. Add New Ingredients
                for (const item of ingredients) {
                    const product = productMap.get(item.sku);

                    if (!product) {
                        // Warn but don't crash whole process
                        // errorDetails.push(`SKU not found: ${item.sku} for recipe ${recipeName}`);
                        continue;
                    }

                    await prisma.recipeIngredient.create({
                        data: {
                            recipeId: recipe.id,
                            productId: product.id,
                            quantity: item.quantity,
                            unit: product.unit // Default to product unit
                        }
                    });
                    ingredientsAdded++;
                }

                // D. Update Product Mapping to Point to Recipe (Critical for COGS)
                await prisma.productMapping.upsert({
                    where: { posString: recipeName },
                    create: {
                        posString: recipeName,
                        recipeId: recipe.id,
                        quantity: 1, // 1 Serving
                    },
                    update: {
                        recipeId: recipe.id,
                        productId: null, // CLEAR direct product link to force Recipe usage
                        quantity: 1
                    }
                });

                processedRecipes++;

            } catch (e: any) {
                console.error(`Error processing recipe ${recipeName}:`, e);
                errorsCount++;
                errorDetails.push(`Failed to process ${recipeName}: ${e.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Smart Import Complete. Updated ${processedRecipes} recipes with ${ingredientsAdded} ingredients.`,
            processedCount: processedRecipes,
            errorCount: errorsCount,
            errorDetails: errorDetails
        });

    } catch (error: any) {
        console.error("Recipe Import Server Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
