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
        const product = await prisma.product.create({
            data: {
                name: body.name,
                sku: body.sku,
                description: body.description,
                stockLevel: body.stockLevel || 0,
                unit: body.unit || 'UNIT',
                minStock: body.minStock || 0,
                cost: body.cost || 0,
                price: body.price || 0,
            }
        });
        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
