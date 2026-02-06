import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const branchesParam = searchParams.get('branches'); // Legacy support
        const branchIdParam = searchParams.get('branchId'); // Standardized

        // 1. Security & Context (Simulated for now, replace with actual Auth later)
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();

        // In a real app, we decode the session.
        // For now, we trust the 'role' and 'branchId' cookies if they exist, or default to SuperAdmin for dev.
        const userRole = cookieStore.get('role')?.value || 'ADMIN'; // 'ADMIN', 'MANAGER'
        const userBranchId = cookieStore.get('branchId')?.value; // Assigned branch for Manager

        let branchIdsToFilter: string[] = [];

        if (userRole === 'MANAGER' && userBranchId) {
            // SECURITY: Manager can ONLY see their own branch
            branchIdsToFilter = [userBranchId];
        } else {
            // ADMIN/HQ: Can filter by requested branches, or view Global (All)
            if (branchesParam) {
                branchIdsToFilter = branchesParam.split(',').filter(Boolean);
            } else if (branchIdParam && branchIdParam !== 'all') {
                branchIdsToFilter = [branchIdParam];
            }
            // If empty, we assume "All Branches" -> No filter needed
        }

        // 2. Build Query
        const where: any = {};

        // Date Range
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        // Branch Filter
        if (branchIdsToFilter.length > 0) {
            where.OR = [
                { branchId: { in: branchIdsToFilter } },
                { branchId: null } // Global entries are always visible? Or strictly segregated? 
                // Decision: Global entries (Head Office expenses) should be visible to HQ, but maybe not Managers?
                // Let's keep it simple: Managers see THEIR branch. HQ sees Selected + Global.
            ];

            if (userRole === 'MANAGER') {
                // strict override: Manager sees ONLY their branch, no Global overhead unless explicitly assigned
                where.OR = undefined;
                where.branchId = userBranchId;
            }
        }

        const entries = await prisma.journalEntry.findMany({
            where,
            include: {
                lines: {
                    include: {
                        account: true
                    }
                },
                branch: true // Include Branch Type info
            }
        });

        // Calculate P&L
        let revenue = 0;
        let expenses = 0;

        // Operating Metrics (Excluding HQ)
        let opRevenue = 0;
        let opExpenses = 0;

        const accountTotals: { [key: string]: { name: string, type: string, total: number } } = {};

        entries.forEach(entry => {
            // Check if this is an HQ entry
            // If branch is null, it's Global/HQ context usually, or we treat "Al Thawaq HQ" explicitly.
            // Based on our patching, Global entries are assigned to HQ.
            // So we check entry.branch.type
            const isHQ = entry.branch?.type === 'HQ' || entry.branch?.type === 'HEAD_OFFICE';

            entry.lines.forEach(line => {
                const accountType = line.account.type;
                const amount = line.credit - line.debit; // Net effect (+ for Rev/Equity, - for Exp/Asset)

                if (!accountTotals[line.account.code]) {
                    accountTotals[line.account.code] = {
                        name: line.account.name,
                        type: accountType,
                        total: 0
                    };
                }

                accountTotals[line.account.code].total += amount;

                // Total Consolidated Values
                if (accountType === 'REVENUE') {
                    revenue += line.credit;
                    if (!isHQ) opRevenue += line.credit;
                } else if (accountType === 'EXPENSE') {
                    expenses += line.debit;
                    if (!isHQ) opExpenses += line.debit;
                }
            });
        });

        const netProfit = revenue - expenses;
        const opProfit = opRevenue - opExpenses;

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
                margin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0,
                // New Operating Metrics
                operatingRevenue: opRevenue,
                operatingExpenses: opExpenses,
                operatingProfit: opProfit,
                operatingMargin: opRevenue > 0 ? ((opProfit / opRevenue) * 100).toFixed(2) : 0
            },
            revenueAccounts,
            expenseAccounts
        });
    } catch (error) {
        console.error('P&L generation error:', error);
        return NextResponse.json({ error: 'Failed to generate P&L' }, { status: 500 });
    }
}
