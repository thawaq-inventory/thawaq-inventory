import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');
        const dateParam = searchParams.get('date');
        const asOfDate = dateParam ? new Date(dateParam) : new Date();

        // 1. Build Where Clause
        const where: any = {
            date: {
                lte: asOfDate // All entries up to this date
            }
        };

        if (branchId) {
            where.branchId = branchId;
        }

        // 2. Fetch All Lines mapped to Accounts
        // We need to group by Account and sum Debit/Credit
        const lines = await prisma.journalEntryLine.findMany({
            where: {
                journalEntry: where
            },
            include: {
                account: true
            }
        });

        // 3. Aggregate
        const balances = new Map<string, { account: any, balance: number }>();
        let totalRevenue = 0;
        let totalExpense = 0;

        lines.forEach(line => {
            const acc = line.account;
            const amount = line.debit - line.credit; // Net Debit

            if (!balances.has(acc.id)) {
                balances.set(acc.id, { account: acc, balance: 0 });
            }

            const current = balances.get(acc.id)!;
            current.balance += amount;

            if (acc.type === 'REVENUE') totalRevenue += (line.credit - line.debit); // Credit normal
            if (acc.type === 'EXPENSE') totalExpense += (line.debit - line.credit); // Debit normal
        });

        // 4. Categorize
        const assets: any[] = [];
        const liabilities: any[] = [];
        const equity: any[] = [];

        balances.forEach((item) => {
            const { account, balance } = item;

            // Skip zero balances? Maybe keep for completeness if non-zero movement exists, but usually skip.
            if (Math.abs(balance) < 0.001) return;

            if (account.type === 'ASSET') {
                assets.push({ ...account, balance: balance }); // Debit positive
            } else if (account.type === 'LIABILITY') {
                liabilities.push({ ...account, balance: -balance }); // Credit positive
            } else if (account.type === 'EQUITY') {
                equity.push({ ...account, balance: -balance }); // Credit positive
            }
            // Revenue/Expense are rolled into Retained Earnings
        });

        // 5. Retained Earnings
        const retainedEarnings = totalRevenue - totalExpense;
        // Add to Equity
        equity.push({
            id: 'retained-earnings',
            name: 'Retained Earnings',
            type: 'EQUITY',
            code: '3999',
            balance: retainedEarnings
        });

        // 6. Sort
        const sortFn = (a: any, b: any) => a.code.localeCompare(b.code);
        assets.sort(sortFn);
        liabilities.sort(sortFn);
        equity.sort(sortFn);

        return NextResponse.json({
            assets,
            liabilities,
            equity,
            meta: {
                asOf: asOfDate,
                totalAssets: assets.reduce((s, a) => s + a.balance, 0),
                totalLiabilities: liabilities.reduce((s, a) => s + a.balance, 0),
                totalEquity: equity.reduce((s, a) => s + a.balance, 0),
            }
        });

    } catch (error) {
        console.error('Balance Sheet Error:', error);
        return NextResponse.json({ error: 'Failed to generate balance sheet' }, { status: 500 });
    }
}
