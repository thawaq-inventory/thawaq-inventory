import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Create location
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, address, phone, branchId } = body;

        if (!name || !branchId) {
            return NextResponse.json(
                { error: 'name and branchId are required' },
                { status: 400 }
            );
        }

        const location = await prisma.location.create({
            data: {
                name,
                address: address || null,
                phone: phone || null,
                branchId,
            }
        });

        return NextResponse.json(location, { status: 201 });
    } catch (error) {
        console.error('Error creating location:', error);
        return NextResponse.json(
            { error: 'Failed to create location' },
            { status: 500 }
        );
    }
}

// GET - List all locations
export async function GET() {
    try {
        const locations = await prisma.location.findMany({
            where: {
                isActive: true
            },
            include: {
                stocks: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch locations' },
            { status: 500 }
        );
    }
}

// PUT - Update location
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, address, phone, isActive } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'id is required' },
                { status: 400 }
            );
        }

        const location = await prisma.location.update({
            where: { id },
            data: {
                name,
                address,
                phone,
                isActive,
            }
        });

        return NextResponse.json(location);
    } catch (error) {
        console.error('Error updating location:', error);
        return NextResponse.json(
            { error: 'Failed to update location' },
            { status: 500 }
        );
    }
}
