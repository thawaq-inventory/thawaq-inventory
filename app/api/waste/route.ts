import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Create waste log entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId, quantity, reason, notes, locationId, userId } = body;

        // Validate required fields
        if (!productId || !quantity || !reason) {
            return NextResponse.json(
                { error: 'productId, quantity, and reason are required' },
                { status: 400 }
            );
        }

        // Get product to calculate cost impact
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        const costImpact = product.cost * quantity;

        // Create waste log
        const wasteLog = await prisma.wasteLog.create({
            data: {
                productId,
                quantity,
                reason,
                costImpact,
                notes: notes || null,
                locationId: locationId || null,
                userId: userId || null,
            },
            include: {
                product: true,
                location: true,
                user: true,
            }
        });

        // Update product stock level (decrease)
        await prisma.product.update({
            where: { id: productId },
            data: {
                stockLevel: {
                    decrement: quantity
                }
            }
        });

        // Create inventory log entry for audit trail
        await prisma.inventoryLog.create({
            data: {
                productId,
                changeAmount: -quantity,
                reason: 'WASTE',
                userId: userId || null,
            }
        });

        return NextResponse.json(wasteLog, { status: 201 });
    } catch (error) {
        console.error('Error creating waste log:', error);
        return NextResponse.json(
            { error: 'Failed to create waste log' },
            { status: 500 }
        );
    }
}

// GET - Retrieve waste logs with filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const productId = searchParams.get('productId');
        const reason = searchParams.get('reason');
        const locationId = searchParams.get('locationId');

        const where: any = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        if (productId) where.productId = productId;
        if (reason) where.reason = reason;
        if (locationId) where.locationId = locationId;

        const wasteLogs = await prisma.wasteLog.findMany({
            where,
            include: {
                product: true,
                location: true,
                user: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(wasteLogs);
    } catch (error) {
        console.error('Error fetching waste logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch waste logs' },
            { status: 500 }
        );
    }
}
