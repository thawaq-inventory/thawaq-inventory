import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBranchFilterForAPI } from '@/lib/branchFilter';

// GET /api/products
// Returns products with stock levels for the specific branch context
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');

        // Context: Which branch are we viewing?
        const branchFilter = await getBranchFilterForAPI();

        // Extract the explicit branch ID from the filter if possible
        // The filter usually returns { branchId: '...' } or { branchId: { in: [...] } } or {}
        // For the Left Join logic, we need a specific "View Context Branch".
        // If the user is a Superadmin looking at "All", we might sum them up?
        // But the critical bug is for "Branch Admin" seeing nothing.
        // Let's rely on the cookie 'selectedBranches' directly to get the "Current View Context".

        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const selectedBranchesCookie = cookieStore.get('selectedBranches');

        let currentBranchId = null;
        if (selectedBranchesCookie) {
            const branches = JSON.parse(selectedBranchesCookie.value);
            if (branches && branches.length > 0 && branches[0] !== 'all') {
                currentBranchId = branches[0];
            }
        }

        // Base Query: Fetch Products
        const whereClause: any = {};
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }

        let products;

        if (currentBranchId === 'HEAD_OFFICE') {
            // Global View: Fetch all products with ALL stock levels to sum them up
            products = await prisma.product.findMany({
                where: whereClause,
                include: {
                    inventoryLevels: true // Fetch ALL levels
                },
                orderBy: { name: 'asc' }
            });
        } else {
            // Specific Branch View: Fetch products with specific stock level
            products = await prisma.product.findMany({
                where: whereClause,
                include: {
                    inventoryLevels: {
                        where: { branchId: currentBranchId || 'undefined_branch' },
                        take: 1
                    }
                },
                orderBy: { name: 'asc' }
            });
        }

        // Transform result to match expected frontend interface
        const mappedProducts = products.map(p => {
            let stockLevel = 0;
            let reorderPoint = 0;

            if (currentBranchId === 'HEAD_OFFICE') {
                // Sum up ALL inventory levels
                stockLevel = p.inventoryLevels.reduce((sum, level) => sum + level.quantityOnHand, 0);
                // For reorder point, maybe take the max or average? Or just 0 for global view?
                // Let's use max for now to be safe, or 0.
                reorderPoint = 0;
            } else {
                const level = p.inventoryLevels[0];
                stockLevel = level ? level.quantityOnHand : 0;
                reorderPoint = level ? level.reorderPoint : 0;
            }

            return {
                ...p,
                stockLevel,
                reorderPoint
            };
        });

        return NextResponse.json(mappedProducts);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Branch Strategy:
        // 1. If `availableToAllBranches` is TRUE, we create a GLOBAL product (branchId = null).
        // 2. If `branchId` is provided explicitly, we tie it to that branch (Legacy / Local Special).
        // 3. If neither, we default to GLOBAL (preferred new architecture).

        let targetBranchId: string | null = null;
        let isGlobal = false;

        if (body.availableToAllBranches || !body.branchId) {
            isGlobal = true;
            targetBranchId = null; // Explicitly null for global
        } else {
            targetBranchId = body.branchId;
        }

        // Validate basic fields
        if (!body.name) {
            return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
        }

        // Create the Product
        const product = await prisma.product.create({
            data: {
                name: body.name,
                sku: body.sku,
                description: body.description,
                branchId: targetBranchId, // Could be null
                stockLevel: 0, // Legacy field, kept 0
                unit: body.unit || 'UNIT',
                minStock: body.minStock || 0,
                cost: body.cost || 0,
                price: body.price || 0,
            }
        });

        // Auto-Seed Inventory Levels
        // If Global, seed for ALL active branches.
        // If specific branch, seed for THAT branch.

        const activeBranches = await prisma.branch.findMany({
            where: { isActive: true },
            select: { id: true }
        });

        const branchesToSeed = isGlobal
            ? activeBranches.map(b => b.id)
            : (targetBranchId ? [targetBranchId] : []);

        if (branchesToSeed.length > 0) {
            await prisma.inventoryLevel.createMany({
                data: branchesToSeed.map(bId => ({
                    productId: product.id,
                    branchId: bId,
                    quantityOnHand: 0,
                    reorderPoint: body.minStock || 0
                })),
                skipDuplicates: true
            });
        }

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
