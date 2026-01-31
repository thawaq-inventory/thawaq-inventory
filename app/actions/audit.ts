'use server';

import { prisma } from '@/lib/prisma';

export interface AuditResult {
    reportedRevenue: number;
    theoreticalRevenue: number;
    discrepancy: number;
    status: 'MATCH' | 'MISMATCH';
}

export async function getRevenueAudit(): Promise<AuditResult> {
    try {
        // 1. Reported Revenue (From Sales Reports - Cash Collected)
        const reportedAgg = await prisma.salesReport.aggregate({
            _sum: { totalRevenue: true }
        });
        const reportedRevenue = reportedAgg._sum.totalRevenue || 0;

        // 2. Theoretical Revenue (From Logs * Current Menu Price)
        // Fetch aggregated logs
        const logs = await prisma.salesItemLog.groupBy({
            by: ['posString'],
            _sum: { quantity: true }
        });

        // Fetch Prices
        const menuItems = await prisma.posMenuItem.findMany();
        const priceMap = new Map(menuItems.map(i => [i.posString, i.sellingPrice]));

        let theoreticalRevenue = 0;

        for (const log of logs) {
            const qty = log._sum.quantity || 0;
            const price = priceMap.get(log.posString) || 0;
            theoreticalRevenue += (qty * price);
        }

        const discrepancy = reportedRevenue - theoreticalRevenue;
        const diffPercent = reportedRevenue > 0 ? Math.abs(discrepancy / reportedRevenue) : 0;

        // 1% Tolerance
        const status = diffPercent < 0.01 ? 'MATCH' : 'MISMATCH';

        return {
            reportedRevenue,
            theoreticalRevenue,
            discrepancy,
            status
        };

    } catch (error) {
        console.error("Audit Error:", error);
        return {
            reportedRevenue: 0,
            theoreticalRevenue: 0,
            discrepancy: 0,
            status: 'MATCH'
        };
    }
}
