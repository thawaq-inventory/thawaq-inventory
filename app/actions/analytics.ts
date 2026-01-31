'use server';

import { prisma } from '@/lib/prisma';

export interface CostingRow {
    id: string; // PosMenuItem ID
    posName: string;
    sellingPrice: number;
    recipeName: string;
    foodCost: number;
    grossProfit: number;
    costPercent: number;
    status: 'GOOD' | 'WARNING' | 'CRITICAL' | 'MISSING_RECIPE';
}

export async function getCostingReport(): Promise<CostingRow[]> {
    try {
        // 1. Fetch Menu Items with their Mappings and subsequent Recipes + Ingredients
        // Prisma relation: PosMenuItem -> (No direct link to Mapping in schema?)
        // Wait, Schema check:
        // ProductMapping has `posString`. PosMenuItem has `posString` (unique).
        // They are linked by `posString`.

        const menuItems = await prisma.posMenuItem.findMany();
        const mappings = await prisma.productMapping.findMany({
            include: {
                recipe: {
                    include: {
                        ingredients: {
                            include: { product: true }
                        }
                    }
                },
                product: true // For legacy direct product links
            }
        });

        // Map for fast lookup
        const mappingMap = new Map(mappings.map(m => [m.posString, m]));

        const report: CostingRow[] = menuItems.map(item => {
            const mapping = mappingMap.get(item.posString);

            let foodCost = 0;
            let recipeName = 'Unmapped';
            let hasRecipe = false;

            if (mapping) {
                if (mapping.recipe) {
                    recipeName = mapping.recipe.name;
                    hasRecipe = true;
                    // Sum ingredients
                    foodCost = mapping.recipe.ingredients.reduce((sum, ing) => {
                        return sum + (ing.quantity * ing.product.cost);
                    }, 0);
                } else if (mapping.product) {
                    // Direct Product Link fallback
                    recipeName = `Direct: ${mapping.product.name}`;
                    hasRecipe = true;
                    foodCost = mapping.product.cost * mapping.quantity;
                }
            }

            const sellingPrice = item.sellingPrice || 0;
            const grossProfit = sellingPrice - foodCost;
            // Avoid division by zero
            const costPercent = sellingPrice > 0 ? (foodCost / sellingPrice) * 100 : 0;

            let status: CostingRow['status'] = 'GOOD';
            if (!hasRecipe || (!mapping?.recipe && !mapping?.product)) status = 'MISSING_RECIPE';
            else if (costPercent > 40) status = 'CRITICAL';
            else if (costPercent > 30) status = 'WARNING';

            return {
                id: item.id,
                posName: item.posString,
                sellingPrice,
                recipeName,
                foodCost,
                grossProfit,
                costPercent,
                status
            };
        });

        // Sort by Critical first
        return report.sort((a, b) => {
            // Priority: MISSING -> CRITICAL -> WARNING -> GOOD
            const score = (s: string) => {
                if (s === 'MISSING_RECIPE') return 0;
                if (s === 'CRITICAL') return 1;
                if (s === 'WARNING') return 2;
                return 3;
            };
            return score(a.status) - score(b.status);
        });

    } catch (error) {
        console.error("Error generating costing report", error);
        return [];
    }
}
