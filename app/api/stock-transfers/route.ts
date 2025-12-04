import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Create stock transfer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fromLocationId, toLocationId, productId, quantity, notes } = body;

        if (!fromLocationId || !toLocationId || !productId || !quantity) {
            return NextResponse.json(
                { error: 'fromLocationId, toLocationId, productId, and quantity are required' },
                { status: 400 }
            );
        }

        // Check if source location has enough stock
        const fromStock = await prisma.locationStock.findUnique({
            where: {
                locationId_productId: {
                    locationId: fromLocationId,
                    productId
                }
            }
        });

        if (!fromStock || fromStock.stockLevel < quantity) {
            return NextResponse.json(
                { error: 'Insufficient stock at source location' },
                { status: 400 }
            );
        }

        // Create transfer
        const transfer = await prisma.stockTransfer.create({
            data: {
                fromLocationId,
                toLocationId,
                productId,
                quantity,
                notes: notes || null,
                status: 'COMPLETED',
                completedAt: new Date(),
            },
            include: {
                fromLocation: true,
                toLocation: true,
                product: true,
            }
        });

        // Update stock levels
        await prisma.locationStock.update({
            where: {
                locationId_productId: {
                    locationId: fromLocationId,
                    productId
                }
            },
            data: {
                stockLevel: {
                    decrement: quantity
                }
            }
        });

        // Upsert to location stock
        await prisma.locationStock.upsert({
            where: {
                locationId_productId: {
                    locationId: toLocationId,
                    productId
                }
            },
            create: {
                locationId: toLocationId,
                productId,
                stockLevel: quantity,
            },
            update: {
                stockLevel: {
                    increment: quantity
                }
            }
        });

        return NextResponse.json(transfer, { status: 201 });
    } catch (error) {
        console.error('Error creating stock transfer:', error);
        return NextResponse.json(
            { error: 'Failed to create stock transfer' },
            { status: 500 }
        );
    }
}

// GET - Transfer history
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const locationId = searchParams.get('locationId');
        const productId = searchParams.get('productId');

        const where: any = {};
        if (locationId) {
            where.OR = [
                { fromLocationId: locationId },
                { toLocationId: locationId }
            ];
        }
        if (productId) where.productId = productId;

        const transfers = await prisma.stockTransfer.findMany({
            where,
            include: {
                fromLocation: true,
                toLocation: true,
                product: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(transfers);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transfers' },
            { status: 500 }
        );
    }
}
