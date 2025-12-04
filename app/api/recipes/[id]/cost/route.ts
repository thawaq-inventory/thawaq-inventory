import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Calculate current recipe cost
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const recipe = await prisma.recipe.findUnique({
            where: { id },
            include: {
                ingredients: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!recipe) {
            return NextResponse.json(
                { error: 'Recipe not found' },
                { status: 404 }
            );
        }

        const currentCost = recipe.ingredients.reduce((sum, ing) => {
            return sum + (ing.product.cost * ing.quantity);
        }, 0);

        const ingredientCosts = recipe.ingredients.map(ing => ({
            productName: ing.product.name,
            quantity: ing.quantity,
            unit: ing.unit,
            unitCost: ing.product.cost,
            totalCost: ing.product.cost * ing.quantity
        }));

        return NextResponse.json({
            recipeId: recipe.id,
            recipeName: recipe.name,
            servingSize: recipe.servingSize,
            currentCost,
            costPerServing: currentCost / recipe.servingSize,
            targetCost: recipe.targetCost,
            sellingPrice: recipe.sellingPrice,
            profitMargin: recipe.sellingPrice ? recipe.sellingPrice - currentCost : null,
            foodCostPercentage: recipe.sellingPrice ? (currentCost / recipe.sellingPrice) * 100 : null,
            ingredientCosts,
        });
    } catch (error) {
        console.error('Error calculating recipe cost:', error);
        return NextResponse.json(
            { error: 'Failed to calculate recipe cost' },
            { status: 500 }
        );
    }
}
