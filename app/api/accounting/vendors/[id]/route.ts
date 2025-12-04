import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single vendor
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const vendor = await prisma.vendor.findUnique({
            where: { id },
            include: { invoices: true }
        });
        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }
        return NextResponse.json(vendor);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 });
    }
}

// PUT update vendor
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const vendor = await prisma.vendor.update({
            where: { id },
            data: {
                name: body.name,
                email: body.email,
                phone: body.phone,
                address: body.address,
                taxId: body.taxId
            }
        });
        return NextResponse.json(vendor);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
    }
}

// DELETE vendor
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.vendor.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
    }
}
