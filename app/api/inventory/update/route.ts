import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId, changeAmount, reason, userId } = body;

        // Get the product to retrieve its branchId
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, branchId: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Update product stock and create log
        const [updatedProduct, log] = await prisma.$transaction([
            prisma.product.update({
                where: { id: productId },
                data: {
                    stockLevel: {
                        increment: changeAmount
                    }
                }
            }),
            prisma.inventoryLog.create({
                data: {
                    productId,
                    branchId: product.branchId,
                    changeAmount,
                    reason: reason || 'ADJUSTMENT',
                    userId
                }
            })
        ]);

        return NextResponse.json({ product, log });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
    }
}
