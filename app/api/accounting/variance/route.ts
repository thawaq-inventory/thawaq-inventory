
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');

        // Default to current month if not specified
        const now = new Date();
        const fromStr = searchParams.get('from');
        const toStr = searchParams.get('to');

        const fromDate = fromStr ? parseISO(fromStr) : startOfMonth(now);
        const toDate = toStr ? parseISO(toStr) : endOfMonth(now);

        // 1. THEORETICAL (From Sales Reports - "POS Data")
        const salesReports = await prisma.salesReport.aggregate({
            _sum: {
                netRevenue: true,
                totalCOGS: true
            },
            where: {
                branchId: branchId || undefined,
                // Use uploadDate or reportDate? reportDate is better if parsed, falling back to uploadDate
                // However, Prisma text search or date filtering on optional field is tricky.
                // Assuming 'uploadDate' roughly correlates for now, or use complex logic.
                // Let's use uploadDate for simplicity as reportDate is optional in schema.
                uploadDate: {
                    gte: fromDate,
                    lte: toDate
                },
                status: {
                    in: ['SUCCESS', 'THEORETICAL_ONLY']
                }
            }
        });

        const theoreticalRevenue = salesReports._sum.netRevenue || 0;
        const theoreticalCOGS = salesReports._sum.totalCOGS || 0;

        // 2. ACTUAL (From General Ledger - "Bank/Manual Data")
        // Actual Revenue: Credits to Revenue Accounts
        const actualRevenueAgg = await prisma.journalEntryLine.aggregate({
            _sum: { credit: true, debit: true },
            where: {
                account: { type: 'REVENUE' },
                journalEntry: {
                    branchId: branchId || undefined,
                    date: {
                        gte: fromDate,
                        lte: toDate
                    }
                }
            }
        });
        // Net Revenue = Credit - Debit (Refunds)
        const actualRevenue = (actualRevenueAgg._sum.credit || 0) - (actualRevenueAgg._sum.debit || 0);

        // Actual COGS: Debits to Expense Accounts named 'COGS' or type 'EXPENSE' generic?
        // We specifically want 'Cost of Goods Sold' account usually. 
        // Let's filter by names containing 'COGS' or explicitly code '5010'
        // Ideally we grab ALL Expense accounts, but Variance is usually specific.
        // Let's target the specific COGS account code '5010' for precision, or fallback to name.
        const actualCOGSAgg = await prisma.journalEntryLine.aggregate({
            _sum: { debit: true, credit: true },
            where: {
                account: {
                    OR: [
                        { code: '5010' },
                        { name: { contains: 'COGS', mode: 'insensitive' } },
                        { name: { contains: 'Cost of Goods', mode: 'insensitive' } }
                    ]
                },
                journalEntry: {
                    branchId: branchId || undefined,
                    date: {
                        gte: fromDate,
                        lte: toDate
                    }
                }
            }
        });
        // Net COGS = Debit - Credit
        const actualCOGS = (actualCOGSAgg._sum.debit || 0) - (actualCOGSAgg._sum.credit || 0);

        // 3. Calculate Variances
        const revenueVariance = actualRevenue - theoreticalRevenue;
        const revenueVariancePct = theoreticalRevenue ? (revenueVariance / theoreticalRevenue) * 100 : 0;

        const cogsVariance = actualCOGS - theoreticalCOGS;
        const cogsVariancePct = theoreticalCOGS ? (cogsVariance / theoreticalCOGS) * 100 : 0;

        return NextResponse.json({
            period: { from: fromDate, to: toDate },
            theoretical: {
                revenue: theoreticalRevenue,
                cogs: theoreticalCOGS
            },
            actual: {
                revenue: actualRevenue,
                cogs: actualCOGS
            },
            variance: {
                revenue: revenueVariance,
                revenuePct: revenueVariancePct,
                cogs: cogsVariance,
                cogsPct: cogsVariancePct
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
