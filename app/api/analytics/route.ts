import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Context: Which branch are we viewing?
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const selectedBranchesCookie = cookieStore.get('selectedBranches');

        let currentBranchId: string | null = null;
        if (selectedBranchesCookie) {
            const branches = JSON.parse(selectedBranchesCookie.value);
            if (branches && branches.length > 0 && branches[0] !== 'all') {
                currentBranchId = branches[0];
            }
        }
        // Fallback to 'branchId' cookie if set (Manager)
        if (!currentBranchId) currentBranchId = cookieStore.get('branchId')?.value || null;


        // Base Query
        let products;

        if (currentBranchId && currentBranchId !== 'HEAD_OFFICE') {
            // BRANCH VIEW: Fetch InventoryLevels for this branch + Product details
            // We need to reshape this to look like "Products" for the frontend logic, 
            // or adjust the logic. 
            // The frontend expects "Product" objects with "stockLevel".
            // We will map InventoryLevel back to a pseudo-product structure.

            const levels = await prisma.inventoryLevel.findMany({
                where: { branchId: currentBranchId },
                include: { product: true }
            });

            // Map to structure expected by UI (Product with local stock)
            products = levels.map(l => ({
                ...l.product,
                stockLevel: l.quantityOnHand, // OVERRIDE Global Stock with Local
                // We rely on Product Cost/Price. 
                // Note: WAC Cost is global on Product. 
                // If we had Branch Cost, we'd use it. For now, Global Cost is acceptable proxy.
            }));

            // What about items with 0 stock? They won't have InventoryLevel?
            // If we want to show "Out of Stock" items for the branch...
            // We need to fetch ALL products visible to branch, and left join levels?
            // This is complex. For now, "Inventory Value" is based on what we HAVE.
            // "Out of Stock" might be missing from this list if no record exists.
            // Better: Fetch All Visible Products, include InventoryLevel for branch.

            const visibleProducts = await prisma.product.findMany({
                where: {
                    isArchived: false,
                    OR: [{ branchId: null }, { branchId: currentBranchId }]
                },
                include: {
                    inventoryLevels: {
                        where: { branchId: currentBranchId }
                    }
                }
            });

            products = visibleProducts.map(p => ({
                ...p,
                stockLevel: p.inventoryLevels[0]?.quantityOnHand || 0
            }));

        } else {
            // HQ VIEW: Global
            // Use default behavior (Global Stock)
            // Check if Product has 'stockLevel' field?
            // Schema check required. Assuming 'stockLevel' exists or is computed?
            // The original code used `p.stockLevel`.
            products = await prisma.product.findMany({ where: { isArchived: false } });
            // If 'stockLevel' is real DB column, we use it.
            // If it was computed... previous code suggests it exists.
        }

        // Calculate metrics
        const totalProducts = products.length;
        const lowStockItems = products.filter(p => p.stockLevel <= p.minStock && p.stockLevel > 0).length;
        const outOfStockItems = products.filter(p => p.stockLevel <= 0).length;
        const totalInventoryValue = products.reduce((sum, p) => sum + (p.stockLevel * (p.cost || 0)), 0);
        const totalRetailValue = products.reduce((sum, p) => sum + (p.stockLevel * (p.price || 0)), 0);

        // Stock distribution by status
        const inStock = products.filter(p => p.stockLevel > p.minStock).length;

        // Top low stock items
        const lowStockProducts = products
            .filter(p => p.stockLevel <= p.minStock && p.stockLevel > 0)
            .sort((a, b) => (a.stockLevel / (a.minStock || 1)) - (b.stockLevel / (b.minStock || 1)))
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
            .sort((a, b) => (b.stockLevel * (b.price || 0)) - (a.stockLevel * (a.price || 0)))
            .slice(0, 10)
            .map(p => ({
                name: p.name,
                value: p.stockLevel * (p.price || 0),
                cost: p.stockLevel * (p.cost || 0)
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
