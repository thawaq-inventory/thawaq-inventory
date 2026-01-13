import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/transfers
// Query params: branchId (optional, for filtering), status (optional)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');
        const status = searchParams.get('status');

        const where: any = {};

        if (branchId) {
            where.OR = [
                { fromBranchId: branchId },
                { toBranchId: branchId }
            ];
        }

        if (status) {
            where.status = status;
        }

        const transfers = await prisma.transferRequest.findMany({
            where,
            include: {
                fromBranch: { select: { id: true, name: true, type: true } },
                toBranch: { select: { id: true, name: true, type: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, sku: true, unit: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(transfers);
    } catch (error) {
        console.error('Error fetching transfers:', error);
        return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
    }
}

// POST /api/transfers
// Create a new Transfer Request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fromBranchId, toBranchId, items, notes } = body;

        // Validation
        if (!fromBranchId || !toBranchId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (fromBranchId === toBranchId) {
            return NextResponse.json({ error: 'Source and destination branches must be different' }, { status: 400 });
        }

        // Create Request and Items
        const transfer = await prisma.transferRequest.create({
            data: {
                fromBranchId,
                toBranchId,
                status: 'REQUESTED',
                notes,
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: Number(item.quantity)
                    }))
                }
            },
            include: {
                items: true
            }
        });

        return NextResponse.json(transfer, { status: 201 });
    } catch (error) {
        console.error('Error creating transfer request:', error);
        return NextResponse.json({ error: 'Failed to create transfer request' }, { status: 500 });
    }
}
