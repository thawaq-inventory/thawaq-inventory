import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Fetch Accounts
        const accounts = await prisma.account.findMany();
        const getAccId = (name: string) => accounts.find(a => a.name === name)?.id;

        const accSales = getAccId('Food Sales');
        const accVAT = getAccId('VAT Payable');
        const accFees = getAccId('Merchant Fees');
        const accCOGS = getAccId('COGS');

        if (!accSales || !accVAT || !accFees || !accCOGS) {
            return NextResponse.json({
                error: 'Accounts missing',
                waterfall: [],
                metrics: { monthlyRevenue: 0, netProfit: 0 }
            });
        }

        // Aggregate Data for Current Month
        // We can do a single aggregate query or separate ones. 
        // GroupBy accountId on JournalEntryLine where JournalEntry.date is in range.

        const aggregates = await prisma.journalEntryLine.groupBy({
            by: ['accountId'],
            where: {
                journalEntry: {
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                },
                accountId: { in: [accSales, accVAT, accFees, accCOGS] }
            },
            _sum: {
                debit: true,
                credit: true
            }
        });

        const getSum = (accId: string, type: 'debit' | 'credit') => {
            const found = aggregates.find(a => a.accountId === accId);
            return found?._sum[type] || 0;
        };

        const sales = getSum(accSales, 'credit');
        const vat = getSum(accVAT, 'credit');
        const fees = getSum(accFees, 'debit');
        const cogs = getSum(accCOGS, 'debit');

        const totalGeneratedRevenue = sales + vat; // Total Collected (Cash/Visa)
        const netProfit = totalGeneratedRevenue - vat - fees - cogs;

        // Construct Waterfall Data
        // Ideally: Start (Total), Down (VAT), Down (Fees), Down (COGS), End (Net)
        const waterfallData = [
            { name: 'Total Revenue', value: totalGeneratedRevenue, type: 'total' },
            { name: 'VAT (16%)', value: -vat, type: 'deduction' },
            { name: 'Trans. Fees', value: -fees, type: 'deduction' },
            { name: 'COGS', value: -cogs, type: 'deduction' },
            { name: 'Net Profit', value: netProfit, type: 'net' }
        ];

        return NextResponse.json({
            waterfall: waterfallData,
            metrics: {
                monthlyRevenue: sales, // Real Revenue
                monthlyExpenses: fees + cogs,
                netProfit: netProfit,
                totalCollected: totalGeneratedRevenue
            }
        });

    } catch (error: any) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
