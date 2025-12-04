import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId, changeAmount, reason, userId } = body;

        // Update product stock and create log
        const [product, log] = await prisma.$transaction([
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
