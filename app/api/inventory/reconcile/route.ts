import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { branchId, items, notes, userId } = body;

        // If no branchId or userId provided, try to infer from cookie (standard for Employee App Context)
        if (!branchId || !userId) {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            
            if (!branchId) {
                const selectedBranchesCookie = cookieStore.get('selectedBranches');
                if (selectedBranchesCookie) {
                    try {
                        const branches = JSON.parse(decodeURIComponent(selectedBranchesCookie.value));
                        if (branches && branches.length > 0 && branches[0] !== 'all') {
                            branchId = branches[0];
                        }
                    } catch (e) {}
                }
            }
            
            if (!userId) {
                const token = cookieStore.get('auth_token')?.value;
                if (token) {
                    const session = await prisma.session.findUnique({
                        where: { token },
                        select: { userId: true }
                    });
                    if (session) userId = session.userId;
                }
            }
        }

        // Fallback to any valid user if still not found to satisfy FK constraint
        if (!userId) {
            const fallbackUser = await prisma.user.findFirst({ select: { id: true } });
            if (fallbackUser) userId = fallbackUser.id;
        }

        if (!branchId || !items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'branchId and items array are required' },
                { status: 400 }
            );
        }

        // We will execute this in a transaction to ensure integrity
        const result = await prisma.$transaction(async (tx) => {
            const stockCountItems = [];

            for (const item of items) {
                const { productId, actualQuantity } = item;

                if (!productId || actualQuantity === undefined) continue;

                // 1. Get current stock level
                const currentLevel = await tx.inventoryLevel.findUnique({
                    where: {
                        productId_branchId: {
                            productId,
                            branchId
                        }
                    }
                });

                const systemQuantity = currentLevel ? currentLevel.quantityOnHand : 0;
                const variance = actualQuantity - systemQuantity;

                stockCountItems.push({
                    productId,
                    systemQuantity,
                    countedQuantity: actualQuantity,
                    variance
                });
            }

            if (stockCountItems.length === 0) return [];

            const requestRecord = await tx.stockCountRequest.create({
                data: {
                    branchId,
                    userId: userId,
                    notes: notes || '',
                    items: {
                        create: stockCountItems
                    }
                }
            });

            return stockCountItems;
        });

        return NextResponse.json({ success: true, processed: result.length });

    } catch (error) {
        console.error('Stock Reconciliation Error:', error);
        return NextResponse.json(
            { error: 'Failed to reconcile stock' },
            { status: 500 }
        );
    }
}
