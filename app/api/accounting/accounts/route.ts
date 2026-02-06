import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all accounts with Balances (Branch Filtered)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');

        const accounts = await prisma.account.findMany({
            orderBy: [
                { type: 'asc' },
                { code: 'asc' }
            ]
        });

        // Calculate Balances
        const whereClause: any = {};
        if (branchId) {
            whereClause.journalEntry = { branchId: branchId };
        }

        const balances = await prisma.journalEntryLine.groupBy({
            by: ['accountId'],
            _sum: {
                debit: true,
                credit: true
            },
            where: whereClause
        });

        const balanceMap = new Map<string, number>();
        balances.forEach(b => {
            // Standard Accounting Equation:
            // Assets/Expenses: Debit - Credit
            // Liabilities/Equity/Revenue: Credit - Debit
            // We'll store "Net Debit" here and adjust usage in UI or here.
            // Actually, let's store the "Natural Balance".

            // However, for generic 'balance', it's easier to just pass net result and let UI color it?
            // Let's standardise: Positive = Normal Balance for that type.
            balanceMap.set(b.accountId, (b._sum.debit || 0) - (b._sum.credit || 0));
        });

        const accountsWithBalance = accounts.map(acc => {
            const netDebit = balanceMap.get(acc.id) || 0;
            let finalBalance = netDebit;

            // Invert for Credit-normal accounts
            if (['LIABILITY', 'EQUITY', 'REVENUE'].includes(acc.type)) {
                finalBalance = -netDebit;
            }

            return {
                ...acc,
                balance: finalBalance
            };
        });

        return NextResponse.json(accountsWithBalance);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}

// POST create account
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const account = await prisma.account.create({
            data: {
                code: body.code,
                name: body.name,
                type: body.type,
                description: body.description
            }
        });
        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
