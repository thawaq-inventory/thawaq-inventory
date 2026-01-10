import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to generate SKU
const generateSKU = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const products = body.products;

        if (!Array.isArray(products)) {
            return NextResponse.json({ error: 'Products must be an array' }, { status: 400 });
        }

        // Process each product and auto-generate SKU if missing
        const productsToCreate = products.map((product: any) => ({
            name: product.name,
            sku: product.sku || generateSKU(), // Auto-generate if missing
            description: product.description || null,
            stockLevel: parseFloat(product.stockLevel) || 0,
            unit: product.unit || 'pcs',
            minStock: parseFloat(product.minStock) || 0,
            cost: parseFloat(product.cost) || 0,
            price: parseFloat(product.price) || 0,
            branchId: product.branchId,
        }));

        // Create all products individually (to avoid createMany compatibility issues)
        const results = await Promise.allSettled(
            productsToCreate.map((productData) =>
                prisma.product.create({ data: productData })
            )
        );

        const successCount = results.filter((r) => r.status === 'fulfilled').length;
        const failedCount = results.filter((r) => r.status === 'rejected').length;

        return NextResponse.json({
            success: true,
            count: successCount,
            failed: failedCount,
            message: `Successfully imported ${successCount} products${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
        }, { status: 201 });
    } catch (error) {
        console.error('Bulk import error:', error);
        return NextResponse.json({ error: 'Failed to import products' }, { status: 500 });
    }
}
