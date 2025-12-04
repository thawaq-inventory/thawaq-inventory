import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Create receiving batch with items
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { vendorId, batchNumber, notes, photoUrl, locationId, userId, items } = body;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: 'items array is required' },
                { status: 400 }
            );
        }

        // Create receiving batch with items
        const batch = await prisma.receivingBatch.create({
            data: {
                vendorId: vendorId || null,
                batchNumber: batchNumber || null,
                notes: notes || null,
                photoUrl: photoUrl || null,
                locationId: locationId || null,
                userId: userId || null,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                        lotNumber: item.lotNumber || null,
                        qualityOk: item.qualityOk !== false,
                        quantityOk: item.quantityOk !== false,
                        packagingOk: item.packagingOk !== false,
                        notes: item.notes || null,
                    }))
                }
            },
            include: {
                vendor: true,
                location: true,
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        // Update stock levels for all items
        for (const item of items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stockLevel: {
                        increment: item.quantity
                    }
                }
            });

            // Create inventory log
            await prisma.inventoryLog.create({
                data: {
                    productId: item.productId,
                    changeAmount: item.quantity,
                    reason: 'RESTOCK',
                    userId: userId || null,
                }
            });
        }

        return NextResponse.json(batch, { status: 201 });
    } catch (error) {
        console.error('Error creating receiving batch:', error);
        return NextResponse.json(
            { error: 'Failed to create receiving batch' },
            { status: 500 }
        );
    }
}

// GET - Receiving history
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const vendorId = searchParams.get('vendorId');
        const locationId = searchParams.get('locationId');

        const where: any = {};

        if (startDate || endDate) {
            where.deliveryDate = {};
            if (startDate) where.deliveryDate.gte = new Date(startDate);
            if (endDate) where.deliveryDate.lte = new Date(endDate);
        }

        if (vendorId) where.vendorId = vendorId;
        if (locationId) where.locationId = locationId;

        const batches = await prisma.receivingBatch.findMany({
            where,
            include: {
                vendor: true,
                location: true,
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                deliveryDate: 'desc'
            }
        });

        return NextResponse.json(batches);
    } catch (error) {
        console.error('Error fetching receiving batches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch receiving batches' },
            { status: 500 }
        );
    }
}
