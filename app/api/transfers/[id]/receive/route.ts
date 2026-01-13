import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/transfers/[id]/receive
// Receive the transfer -> Add Stock to Destination
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Start Transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Request
            const transfer = await tx.transferRequest.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!transfer) throw new Error('Transfer request not found');
            if (transfer.status !== 'IN_TRANSIT') throw new Error(`Transfer is not in transit (Status: ${transfer.status})`);

            // 2. Add Stock
            for (const item of transfer.items) {
                // Upsert to ensure record exists
                // We use upsert because the receiving branch might not have this product record yet
                await tx.inventoryLevel.upsert({
                    where: {
                        productId_branchId: {
                            productId: item.productId,
                            branchId: transfer.toBranchId
                        }
                    },
                    update: { quantityOnHand: { increment: item.quantity } },
                    create: {
                        productId: item.productId,
                        branchId: transfer.toBranchId,
                        quantityOnHand: item.quantity,
                        reorderPoint: 0 // Default
                    }
                });

                // Log Transaction
                await tx.inventoryTransaction.create({
                    data: {
                        type: 'TRANSFER_IN',
                        sourceBranchId: transfer.fromBranchId,
                        destBranchId: transfer.toBranchId,
                        productId: item.productId,
                        quantity: item.quantity,
                        userId: userId,
                        notes: `Transfer In for Request #${transfer.id.slice(0, 8)}`
                    }
                });
            }

            // 3. Financials (Move Value between Branches)
            // Ideally we do this per item to capture precise cost, but bulk entry is fine for MVP.
            let totalTransferValue = 0;

            for (const item of transfer.items) {
                const p = await tx.product.findUnique({ where: { id: item.productId } });
                if (p) {
                    totalTransferValue += (p.cost || 0) * item.quantity;
                }
            }

            if (totalTransferValue > 0) {
                // Credit Inventory (Source) -> Debit Inventory (Dest)
                // NOTE: In a single-company single-inventory-account ledger, this is 1200 -> 1200.
                // It documents the flow, even if net GL impact is zero.

                const inventoryAccount = await tx.accountingMapping.findUnique({
                    where: { eventKey: 'INVENTORY_ASSET_DEFAULT' },
                    include: { account: true }
                }).then(m => m?.account) || await tx.account.findUnique({ where: { code: '1200' } });

                if (inventoryAccount) {
                    await tx.journalEntry.create({
                        data: {
                            description: `Stock Transfer: ${transfer.fromBranchId} -> ${transfer.toBranchId} (Ref: ${transfer.id.slice(0, 8)})`,
                            reference: `TRF-${transfer.id.slice(0, 8)}`,
                            date: new Date(),
                            lines: {
                                create: [
                                    {
                                        accountId: inventoryAccount.id,
                                        debit: totalTransferValue, // Destination Increase (Asset)
                                        credit: 0
                                    },
                                    {
                                        accountId: inventoryAccount.id,
                                        debit: 0,
                                        credit: totalTransferValue // Source Decrease (Asset)
                                    }
                                ]
                            }
                        }
                    });
                }
            }

            // 3. Update Request Status
            const updatedTransfer = await tx.transferRequest.update({
                where: { id },
                data: { status: 'RECEIVED' }
            });

            return updatedTransfer;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error receiving transfer:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to receive transfer' },
            { status: 400 }
        );
    }
}
