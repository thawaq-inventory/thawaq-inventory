import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Waste analytics summary
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where: any = {};

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Get all waste logs for the period
        const wasteLogs = await prisma.wasteLog.findMany({
            where,
            include: {
                product: true,
            }
        });

        // Calculate totals
        const totalCost = wasteLogs.reduce((sum, log) => sum + log.costImpact, 0);
        const totalQuantity = wasteLogs.reduce((sum, log) => sum + log.quantity, 0);

        // Group by reason
        const byReason = wasteLogs.reduce((acc: any, log) => {
            if (!acc[log.reason]) {
                acc[log.reason] = { count: 0, cost: 0, quantity: 0 };
            }
            acc[log.reason].count++;
            acc[log.reason].cost += log.costImpact;
            acc[log.reason].quantity += log.quantity;
            return acc;
        }, {});

        // Top products by waste cost
        const byProduct = wasteLogs.reduce((acc: any, log) => {
            const key = log.productId;
            if (!acc[key]) {
                acc[key] = {
                    productId: log.productId,
                    productName: log.product.name,
                    count: 0,
                    cost: 0,
                    quantity: 0
                };
            }
            acc[key].count++;
            acc[key].cost += log.costImpact;
            acc[key].quantity += log.quantity;
            return acc;
        }, {});

        const topProducts = Object.values(byProduct)
            .sort((a: any, b: any) => b.cost - a.cost)
            .slice(0, 10);

        // Calculate daily trend
        const dailyTrend = wasteLogs.reduce((acc: any, log) => {
            const dateKey = log.createdAt.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = { date: dateKey, cost: 0, quantity: 0 };
            }
            acc[dateKey].cost += log.costImpact;
            acc[dateKey].quantity += log.quantity;
            return acc;
        }, {});

        return NextResponse.json({
            summary: {
                totalCost,
                totalQuantity,
                totalItems: wasteLogs.length,
            },
            byReason,
            topProducts,
            dailyTrend: Object.values(dailyTrend).sort((a: any, b: any) =>
                a.date.localeCompare(b.date)
            ),
        });
    } catch (error) {
        console.error('Error fetching waste summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch waste summary' },
            { status: 500 }
        );
    }
}
