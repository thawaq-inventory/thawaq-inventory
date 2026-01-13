import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBranchFilterForAPI } from '@/lib/branchFilter';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');
        const sku = searchParams.get('sku');

        // Get branch filter from cookies
        const branchFilter = await getBranchFilterForAPI();

        if (sku) {
            const product = await prisma.product.findUnique({
                where: { sku: sku }
            });
            return NextResponse.json(product ? [product] : []);
        }

        const whereClause: any = {
            ...branchFilter,
        };

        if (search) {
            whereClause.OR = [
                { name: { contains: search } },
                { sku: { contains: search } },
                { description: { contains: search } },
            ];
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Get branchId from request body or from selected branches cookie
        let branchId = body.branchId;

        if (!branchId) {
            // Get selected branches from cookies
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const selectedBranchesCookie = cookieStore.get('selectedBranches');

            if (selectedBranchesCookie) {
                try {
                    const selectedBranches = JSON.parse(decodeURIComponent(selectedBranchesCookie.value));
                    // Use first selected branch that isn't 'all'
                    branchId = selectedBranches.find((b: string) => b !== 'all');
                } catch (e) {
                    console.error('Error parsing selectedBranches cookie:', e);
                }
            }

            // If still no branchId, try to get the first active branch
            if (!branchId) {
                const { prisma: prismaClient } = await import('@/lib/prisma');
                const firstBranch = await prismaClient.branch.findFirst({
                    where: { isActive: true },
                    select: { id: true }
                });
                branchId = firstBranch?.id;
            }
        }

        if (!branchId) {
            return NextResponse.json({ error: 'No branch available. Please create a branch first.' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name: body.name,
                sku: body.sku,
                description: body.description,
                branchId: branchId,
                stockLevel: body.stockLevel || 0,
                unit: body.unit || 'UNIT',
                minStock: body.minStock || 0,
                cost: body.cost || 0,
                price: body.price || 0,
            }
        });
        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
