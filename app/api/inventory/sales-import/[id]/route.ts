
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to get Account IDs
async function getAccountIds() {
    const accounts = await prisma.account.findMany();
    const getAcc = (name: string) => accounts.find(a => a.name === name)?.id;

    return {
        accFoodSales: getAcc('Food Sales'),
        accVAT: getAcc('VAT Payable'),
        accMerchantFees: getAcc('Merchant Fees'),
        accCOGS: getAcc('COGS'),
        accInventory: getAcc('Inventory Asset'),
        accCashClearing: getAcc('Cash Clearing'),
        accTips: getAcc('Tips Payable'),
    };
}

export async function DELETE(
    req: NextRequest,
    params: { params: Promise<{ id: string }> } // Params is a Promise in Next 15+
) {
    try {
        const { id: receiptId } = await params.params;

        if (!receiptId) {
            return NextResponse.json({ error: 'Receipt ID required' }, { status: 400 });
        }

        // 1. Find the Journal Entries associated with this Receipt
        // We look for entries with reference = receiptId
        const journalEntries = await prisma.journalEntry.findMany({
            where: { reference: receiptId },
            include: { lines: true }
        });

        if (journalEntries.length === 0) {
            return NextResponse.json({ error: 'No associated journal entries found.' }, { status: 404 });
        }

        // 2. Reverse Logic
        // We need to just delete the entries, but "Smart" means we might want to log something or check other dependencies.
        // For Sales Import, it creates Journal Entries. If we delete them, the GL is reversed.
        // BUT, what about Inventory?
        // Wait, the detailed Sales Import logic does NOT create direct InventoryTransaction records yet in our Phase 3 Implementation.
        // It relied on Journal Entry (COGS vs Inventory).
        // Let's check `route.ts`. 
        // Yes, Engine B (COGS) posts: Dr COGS, Cr Inventory.
        // So deleting the Journal Entry effectively reverses the Financial Impact.

        // However, if we had `InventoryTransaction` records (for stock counts), we would need to delete them too.
        // Currently, our Smart Upload specific implementation mainly touches GL.

        // Let's perform a Transaction to delete all found entries.
        const deleteOps = journalEntries.map(entry =>
            prisma.journalEntry.delete({ where: { id: entry.id } })
        );

        await prisma.$transaction(deleteOps);

        return NextResponse.json({
            success: true,
            message: `Reversed ${journalEntries.length} entries for Receipt ${receiptId}`
        });

    } catch (error: any) {
        console.error('Smart Delete Error:', error);
        return NextResponse.json({ error: `Server Error: ${error.message}` }, { status: 500 });
    }
}
