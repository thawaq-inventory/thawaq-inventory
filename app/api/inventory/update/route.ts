import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId, changeAmount, reason, userId } = body;

        // Logic to get branchId (Context)
        let branchId = body.branchId;

        // If no branchId provided, try to infer from cookie (standard for Employee App Context)
        if (!branchId) {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const selectedBranchesCookie = cookieStore.get('selectedBranches');
            if (selectedBranchesCookie) {
                try {
                    const branches = JSON.parse(decodeURIComponent(selectedBranchesCookie.value));
                    if (branches && branches.length > 0 && branches[0] !== 'all') {
                        branchId = branches[0];
                    }
                } catch (e) {
                    console.error('Error parsing branch cookie:', e);
                }
            }
        }

        // If still no branch, check if Product has a fixed branchId (Legacy)
        // But for Global products, we MUST have a branchId from context.
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, branchId: true, name: true }
        });

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        if (!branchId && product.branchId) {
            branchId = product.branchId;
        }

        if (!branchId) {
            return NextResponse.json({ error: 'Branch Context missing. Please select a location.' }, { status: 400 });
        }

        // Transaction: Update InventoryLevel + Create Log
        // Note: We use upsert for InventoryLevel because it might not exist yet (if auto-seed skipped or new branch)

        await prisma.$transaction(async (tx) => {
            // 1. Upsert Inventory Level
            const currentLevel = await tx.inventoryLevel.findUnique({
                where: {
                    productId_branchId: { productId, branchId }
                }
            });

            const newQuantity = (currentLevel?.quantityOnHand || 0) + changeAmount;

            await tx.inventoryLevel.upsert({
                where: {
                    productId_branchId: { productId, branchId }
                },
                create: {
                    productId,
                    branchId,
                    quantityOnHand: changeAmount, // If creating new, assuming started at 0
                    reorderPoint: 0
                },
                update: {
                    quantityOnHand: { increment: changeAmount }
                }
            });

            // 2. Create Log
            await tx.inventoryLog.create({
                data: {
                    productId,
                    branchId,
                    changeAmount,
                    reason: reason || 'ADJUSTMENT',
                    userId: userId || null // userId might be null if just a quick adjustment? 
                    // Ideally we should have userId. Client often sends it.
                }
            });

            // 3. Optional: Sync legacy stockLevel if this is a single-branch product? 
            // Better to leave legacy stockLevel alone or update it only if product.branchId matches.
            if (product.branchId === branchId) {
                await tx.product.update({
                    where: { id: productId },
                    data: { stockLevel: { increment: changeAmount } }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update inventory error:', error);
        return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
    }
}
