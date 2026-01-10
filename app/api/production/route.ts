import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Log production batch
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { recipeId, outputProductId, quantityProduced, ingredients, notes, locationId, userId } = body;

        if (!outputProductId || !quantityProduced || !ingredients || ingredients.length === 0) {
            return NextResponse.json(
                { error: 'outputProductId, quantityProduced, and ingredients are required' },
                { status: 400 }
            );
        }

        // Create production batch
        // First get the output product to retrieve its branchId
        const product = await prisma.product.findUnique({
            where: { id: outputProductId },
            select: { id: true, branchId: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Output product not found' }, { status: 404 });
        }

        const batch = await prisma.productionBatch.create({
            data: {
                recipeId: recipeId || null,
                outputProductId,
                quantityProduced,
                notes: notes || null,
                locationId: locationId || null,
                userId: userId || null,
                ingredients: {
                    create: ingredients.map((ing: any) => ({
                        productId: ing.productId,
                        quantityUsed: ing.quantityUsed,
                    }))
                }
            },
            include: {
                recipe: true,
                outputProduct: true,
                ingredients: {
                    include: {
                        product: true
                    }
                },
                location: true,
                user: true,
            }
        });

        // Update stock levels
        // Decrease raw ingredients
        for (const ing of ingredients) {
            await prisma.product.update({
                where: { id: ing.productId },
                data: {
                    stockLevel: {
                        decrement: ing.quantityUsed
                    }
                }
            });

            // Log inventory change
            await prisma.inventoryLog.create({
                data: {
                    productId: ing.productId,
                    branchId: product.branchId,
                    changeAmount: -ing.quantityUsed,
                    reason: 'PRODUCTION',
                    userId: userId || null,
                }
            });
        }

        // Increase produced item
        await prisma.product.update({
            where: { id: outputProductId },
            data: {
                stockLevel: {
                    increment: quantityProduced
                }
            }
        });

        // Log inventory change
        await prisma.inventoryLog.create({
            data: {
                productId: outputProductId,
                branchId: product.branchId,
                changeAmount: quantityProduced,
                reason: 'PRODUCTION',
                userId: userId || null,
            }
        });

        return NextResponse.json(batch, { status: 201 });
    } catch (error) {
        console.error('Error creating production batch:', error);
        return NextResponse.json(
            { error: 'Failed to create production batch' },
            { status: 500 }
        );
    }
}

// GET - Production history
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const recipeId = searchParams.get('recipeId');
        const locationId = searchParams.get('locationId');

        const where: any = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        if (recipeId) where.recipeId = recipeId;
        if (locationId) where.locationId = locationId;

        const batches = await prisma.productionBatch.findMany({
            where,
            include: {
                recipe: true,
                outputProduct: true,
                ingredients: {
                    include: {
                        product: true
                    }
                },
                location: true,
                user: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(batches);
    } catch (error) {
        console.error('Error fetching production batches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch production batches' },
            { status: 500 }
        );
    }
}
