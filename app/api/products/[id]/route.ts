import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const product = await prisma.product.update({
            where: { id },
            data: {
                name: body.name,
                sku: body.sku,
                description: body.description,
                branchId: body.branchId,
                stockLevel: body.stockLevel,
                unit: body.unit,
                purchaseUnit: body.purchaseUnit,
                conversionFactor: body.conversionFactor,
                minStock: body.minStock,
                maxStock: body.maxStock,
                cost: body.cost,
                price: body.price,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Feature 4: Soft Delete
        // Instead of deleting, just mark as archived to preserve history
        const product = await prisma.product.update({
            where: { id },
            data: { isArchived: true }
        });

        return NextResponse.json({ success: true, message: "Product archived successfully", id: product.id });
    } catch (error: any) {
        // Fallback if update fails, but typically update is safe.
        return NextResponse.json({ error: `Failed to archive product: ${error.message}` }, { status: 500 });
    }
}
