import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Update par levels for product(s)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { updates } = body; // Array of { productId, minStock, maxStock }

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json(
                { error: 'updates array is required' },
                { status: 400 }
            );
        }

        const results = [];

        for (const update of updates) {
            const { productId, minStock, maxStock } = update;

            const product = await prisma.product.update({
                where: { id: productId },
                data: {
                    minStock: minStock !== undefined ? minStock : undefined,
                    maxStock: maxStock !== undefined ? maxStock : undefined,
                }
            });

            results.push(product);
        }

        return NextResponse.json({ updated: results.length, products: results });
    } catch (error) {
        console.error('Error updating par levels:', error);
        return NextResponse.json(
            { error: 'Failed to update par levels' },
            { status: 500 }
        );
    }
}

// GET - Get all products with par levels
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                sku: true,
                stockLevel: true,
                unit: true,
                minStock: true,
                maxStock: true,
                cost: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching par levels:', error);
        return NextResponse.json(
            { error: 'Failed to fetch par levels' },
            { status: 500 }
        );
    }
}
