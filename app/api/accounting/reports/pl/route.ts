import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Fetch all journal entries within date range
        const where = startDate && endDate ? {
            date: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        } : {};

        const entries = await prisma.journalEntry.findMany({
            where,
            include: {
                lines: {
                    include: {
                        account: true
                    }
                }
            }
        });

        // Calculate P&L
        let revenue = 0;
        let expenses = 0;

        const accountTotals: { [key: string]: { name: string, type: string, total: number } } = {};

        entries.forEach(entry => {
            entry.lines.forEach(line => {
                const accountType = line.account.type;
                const amount = line.credit - line.debit; // Net effect

                if (!accountTotals[line.account.code]) {
                    accountTotals[line.account.code] = {
                        name: line.account.name,
                        type: accountType,
                        total: 0
                    };
                }

                accountTotals[line.account.code].total += amount;

                if (accountType === 'REVENUE') {
                    revenue += line.credit;
                } else if (accountType === 'EXPENSE') {
                    expenses += line.debit;
                }
            });
        });

        const netProfit = revenue - expenses;

        // Group by account type
        const revenueAccounts = Object.entries(accountTotals)
            .filter(([_, acc]) => acc.type === 'REVENUE')
            .map(([code, acc]) => ({ code, ...acc }));

        const expenseAccounts = Object.entries(accountTotals)
            .filter(([_, acc]) => acc.type === 'EXPENSE')
            .map(([code, acc]) => ({ code, ...acc }));

        return NextResponse.json({
            period: {
                start: startDate || 'All time',
                end: endDate || 'Present'
            },
            summary: {
                revenue,
                expenses,
                netProfit,
                margin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0
            },
            revenueAccounts,
            expenseAccounts
        });
    } catch (error) {
        console.error('P&L generation error:', error);
        return NextResponse.json({ error: 'Failed to generate P&L' }, { status: 500 });
    }
}
