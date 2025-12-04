import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Create recipe with ingredients
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, category, servingSize, targetCost, sellingPrice, ingredients } = body;

        if (!name || !ingredients || ingredients.length === 0) {
            return NextResponse.json(
                { error: 'name and ingredients are required' },
                { status: 400 }
            );
        }

        const recipe = await prisma.recipe.create({
            data: {
                name,
                description: description || null,
                category: category || null,
                servingSize: servingSize || 1,
                targetCost: targetCost || null,
                sellingPrice: sellingPrice || null,
                ingredients: {
                    create: ingredients.map((ing: any) => ({
                        productId: ing.productId,
                        quantity: ing.quantity,
                        unit: ing.unit,
                    }))
                }
            },
            include: {
                ingredients: {
                    include: {
                        product: true
                    }
                }
            }
        });

        return NextResponse.json(recipe, { status: 201 });
    } catch (error) {
        console.error('Error creating recipe:', error);
        return NextResponse.json(
            { error: 'Failed to create recipe' },
            { status: 500 }
        );
    }
}

// GET - List all recipes
export async function GET() {
    try {
        const recipes = await prisma.recipe.findMany({
            include: {
                ingredients: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Calculate current cost for each recipe
        const recipesWithCost = recipes.map(recipe => {
            const currentCost = recipe.ingredients.reduce((sum, ing) => {
                return sum + (ing.product.cost * ing.quantity);
            }, 0);

            return {
                ...recipe,
                currentCost,
                profitMargin: recipe.sellingPrice ? recipe.sellingPrice - currentCost : null,
                foodCostPercentage: recipe.sellingPrice ? (currentCost / recipe.sellingPrice) * 100 : null,
            };
        });

        return NextResponse.json(recipesWithCost);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recipes' },
            { status: 500 }
        );
    }
}

// PUT - Update recipe
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description, category, servingSize, targetCost, sellingPrice, ingredients } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            );
        }

        // Delete existing ingredients if new ones are provided
        if (ingredients) {
            await prisma.recipeIngredient.deleteMany({
                where: { recipeId: id }
            });
        }

        const recipe = await prisma.recipe.update({
            where: { id },
            data: {
                name: name,
                description: description,
                category: category,
                servingSize: servingSize,
                targetCost: targetCost,
                sellingPrice: sellingPrice,
                ...(ingredients && {
                    ingredients: {
                        create: ingredients.map((ing: any) => ({
                            productId: ing.productId,
                            quantity: ing.quantity,
                            unit: ing.unit,
                        }))
                    }
                })
            },
            include: {
                ingredients: {
                    include: {
                        product: true
                    }
                }
            }
        });

        return NextResponse.json(recipe);
    } catch (error) {
        console.error('Error updating recipe:', error);
        return NextResponse.json(
            { error: 'Failed to update recipe' },
            { status: 500 }
        );
    }
}

// DELETE - Remove recipe
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            );
        }

        await prisma.recipe.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        return NextResponse.json(
            { error: 'Failed to delete recipe' },
            { status: 500 }
        );
    }
}
