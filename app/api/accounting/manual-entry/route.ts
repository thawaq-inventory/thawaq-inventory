
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { accountId, amount, type, description, branchId } = body;

        if (!accountId || !amount || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Default Offset Account: Opening Balance Equity
        // We need to keep the General Ledger balanced.
        const offsetAccount = await prisma.account.findFirst({
            where: { name: 'Opening Balance Equity' }
        });

        if (!offsetAccount) {
            return NextResponse.json({ error: 'System Error: Opening Balance Equity account missing.' }, { status: 500 });
        }

        const lines: any[] = [];
        const entryAmount = parseFloat(amount);

        if (type === 'DEBIT') {
            // Debit Target, Credit Equity
            lines.push({ accountId: accountId, debit: entryAmount, credit: 0 });
            lines.push({ accountId: offsetAccount.id, debit: 0, credit: entryAmount });
        } else {
            // Credit Target, Debit Equity
            lines.push({ accountId: accountId, debit: 0, credit: entryAmount });
            lines.push({ accountId: offsetAccount.id, debit: entryAmount, credit: 0 });
        }

        const journalEntry = await prisma.journalEntry.create({
            data: {
                description: description || 'Manual Adjustment',
                reference: 'MANUAL_ADJ',
                branchId: branchId, // Nullable if global
                lines: {
                    create: lines
                }
            }
        });

        return NextResponse.json({ success: true, entry: journalEntry });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
