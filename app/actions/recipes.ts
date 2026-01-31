'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- RECIPES ---

export async function getRecipes() {
    try {
        return await prisma.recipe.findMany({
            orderBy: { name: 'asc' },
            include: {
                ingredients: {
                    include: {
                        product: true
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error fetching recipes", error);
        return [];
    }
}

export async function createRecipe(data: { name: string; servingSize?: number }) {
    try {
        const recipe = await prisma.recipe.create({
            data: {
                name: data.name,
                servingSize: data.servingSize || 1,
            }
        });
        revalidatePath('/admin/recipes');
        return { success: true, recipe };
    } catch (error) {
        return { success: false, error: 'Failed to create recipe' };
    }
}

export async function updateRecipe(id: string, data: { name?: string; servingSize?: number; targetCost?: number }) {
    try {
        await prisma.recipe.update({
            where: { id },
            data
        });
        revalidatePath('/admin/recipes');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update recipe' };
    }
}

export async function deleteRecipe(id: string) {
    try {
        await prisma.recipe.delete({ where: { id } });
        revalidatePath('/admin/recipes');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete recipe' };
    }
}

// --- INGREDIENTS ---

export async function getRecipeDetails(id: string) {
    try {
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
        return recipe;
    } catch (error) {
        return null;
    }
}

export async function addIngredient(recipeId: string, productId: string, quantity: number, unit: string) {
    try {
        await prisma.recipeIngredient.create({
            data: {
                recipeId,
                productId,
                quantity,
                unit
            }
        });
        revalidatePath('/admin/recipes');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to add ingredient' };
    }
}

export async function removeIngredient(id: string) {
    try {
        await prisma.recipeIngredient.delete({ where: { id } });
        revalidatePath('/admin/recipes');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to remove ingredient' };
    }
}

export async function updateIngredient(id: string, quantity: number) {
    try {
        await prisma.recipeIngredient.update({
            where: { id },
            data: { quantity }
        });
        revalidatePath('/admin/recipes');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to update ingredient' };
    }
}

export async function getProductsList() {
    try {
        return await prisma.product.findMany({
            select: { id: true, name: true, unit: true, cost: true },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        return [];
    }
}
