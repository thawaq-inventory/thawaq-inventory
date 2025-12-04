import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all vendors
export async function GET() {
    try {
        const vendors = await prisma.vendor.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { invoices: true }
                }
            }
        });
        return NextResponse.json(vendors);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }
}

// POST create vendor
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const vendor = await prisma.vendor.create({
            data: {
                name: body.name,
                email: body.email,
                phone: body.phone,
                address: body.address,
                taxId: body.taxId
            }
        });
        return NextResponse.json(vendor, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
    }
}
