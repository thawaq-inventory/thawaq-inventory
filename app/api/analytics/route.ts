import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Fetch all products
        const products = await prisma.product.findMany();

        // Calculate metrics
        const totalProducts = products.length;
        const lowStockItems = products.filter(p => p.stockLevel <= p.minStock && p.stockLevel > 0).length;
        const outOfStockItems = products.filter(p => p.stockLevel === 0).length;
        const totalInventoryValue = products.reduce((sum, p) => sum + (p.stockLevel * p.cost), 0);
        const totalRetailValue = products.reduce((sum, p) => sum + (p.stockLevel * p.price), 0);

        // Stock distribution by status
        const inStock = products.filter(p => p.stockLevel > p.minStock).length;

        // Top low stock items
        const lowStockProducts = products
            .filter(p => p.stockLevel <= p.minStock && p.stockLevel > 0)
            .sort((a, b) => (a.stockLevel / a.minStock) - (b.stockLevel / b.minStock))
            .slice(0, 5)
            .map(p => ({
                name: p.name,
                sku: p.sku,
                current: p.stockLevel,
                minimum: p.minStock,
                unit: p.unit
            }));

        // Stock levels by category (using unit as proxy for category)
        const stockByUnit = products.reduce((acc: any, p) => {
            if (!acc[p.unit]) {
                acc[p.unit] = { unit: p.unit, total: 0, items: 0 };
            }
            acc[p.unit].total += p.stockLevel;
            acc[p.unit].items += 1;
            return acc;
        }, {});

        const categoryData = Object.values(stockByUnit);

        // Value distribution
        const valueDistribution = products
            .sort((a, b) => (b.stockLevel * b.price) - (a.stockLevel * a.price))
            .slice(0, 10)
            .map(p => ({
                name: p.name,
                value: p.stockLevel * p.price,
                cost: p.stockLevel * p.cost
            }));

        return NextResponse.json({
            metrics: {
                totalProducts,
                lowStockItems,
                outOfStockItems,
                inStock,
                totalInventoryValue,
                totalRetailValue,
                profitPotential: totalRetailValue - totalInventoryValue
            },
            lowStockProducts,
            categoryData,
            valueDistribution,
            stockDistribution: [
                { name: 'In Stock', value: inStock, fill: '#10b981' },
                { name: 'Low Stock', value: lowStockItems, fill: '#f59e0b' },
                { name: 'Out of Stock', value: outOfStockItems, fill: '#ef4444' }
            ]
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
