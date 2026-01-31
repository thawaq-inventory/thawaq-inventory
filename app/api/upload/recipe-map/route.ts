
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUpload } from '@/lib/parsers/file-parser';

interface RecipeRow {
    POS_String: string;
    Inventory_SKU: string;
    Quantity: number;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

        const { data: rows, errors } = await parseUpload<RecipeRow>(file);
        if (errors.length > 0) return NextResponse.json({ error: 'Parse Error', details: errors }, { status: 400 });

        // Group by Recipe
        const recipeGroups = new Map<string, RecipeRow[]>();
        for (const row of rows) {
            const name = String(row.POS_String || '').trim();
            const sku = String(row.Inventory_SKU || '').trim();
            const qty = parseFloat(String(row.Quantity || '0'));
            if (!name || !sku || qty <= 0) continue;

            const group = recipeGroups.get(name) || [];
            group.push(row);
            recipeGroups.set(name, group);
        }

        const productCache = await prisma.product.findMany();
        const productMap = new Map(productCache.map(p => [String(p.sku || '').trim(), p]));

        let successCount = 0;

        for (const [recipeName, ingredients] of recipeGroups.entries()) {

            // 1. Create/Find Recipe
            let recipe = await prisma.recipe.findFirst({ where: { name: recipeName } });
            if (!recipe) {
                recipe = await prisma.recipe.create({ data: { name: recipeName, servingSize: 1 } });
            }

            // 2. Overwrite Ingredients
            await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });

            for (const ing of ingredients) {
                const product = productMap.get(String(ing.Inventory_SKU).trim());
                if (product) {
                    await prisma.recipeIngredient.create({
                        data: {
                            recipeId: recipe.id,
                            productId: product.id,
                            quantity: Number(ing.Quantity),
                            unit: product.unit
                        }
                    });
                }
            }

            // 3. Update Mapping
            await prisma.productMapping.upsert({
                where: { posString: recipeName },
                create: { posString: recipeName, recipeId: recipe.id, quantity: 1 },
                update: { recipeId: recipe.id, productId: null }
            });

            successCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Imported ${successCount} recipes successfully.`
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
