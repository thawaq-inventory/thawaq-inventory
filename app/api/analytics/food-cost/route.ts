import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Calculate food cost analytics
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'startDate and endDate are required' },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Get all inventory changes (purchases, waste, production) for the period
        const inventoryLogs = await prisma.inventoryLog.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
                reason: {
                    in: ['RESTOCK', 'ADJUSTMENT']
                }
            },
            include: {
                product: true
            }
        });

        // Get waste logs
        const wasteLogs = await prisma.wasteLog.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end
                }
            }
        });

        // Calculate total purchase cost (positive inventory changes)
        const purchaseCost = inventoryLogs
            .filter(log => log.changeAmount > 0)
            .reduce((sum, log) => sum + (log.product.cost * log.changeAmount), 0);

        // Calculate total waste cost
        const wasteCost = wasteLogs.reduce((sum, log) => sum + log.costImpact, 0);

        // For a real implementation, you'd integrate with your POS system for sales data
        // For now, we'll use a placeholder or calculate based on theoretical usage
        const theoreticalSales = 10000; // Placeholder - should come from Foodics integration

        const foodCostPercentage = theoreticalSales > 0 ? ((purchaseCost + wasteCost) / theoreticalSales) * 100 : 0;

        // Daily breakdown
        const dailyData: any = {};

        inventoryLogs.forEach(log => {
            const dateKey = log.createdAt.toISOString().split('T')[0];
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { date: dateKey, purchaseCost: 0, wasteCost: 0, sales: 0 };
            }
            if (log.changeAmount > 0) {
                dailyData[dateKey].purchaseCost += log.product.cost * log.changeAmount;
            }
        });

        wasteLogs.forEach(log => {
            const dateKey = log.createdAt.toISOString().split('T')[0];
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { date: dateKey, purchaseCost: 0, wasteCost: 0, sales: 0 };
            }
            dailyData[dateKey].wasteCost += log.costImpact;
        });

        // Calculate food cost % for each day
        const dailyTrend = Object.values(dailyData).map((day: any) => {
            const dailySales = theoreticalSales / Object.keys(dailyData).length; // Distribute evenly for now
            day.sales = dailySales;
            day.foodCostPercentage = dailySales > 0 ? ((day.purchaseCost + day.wasteCost) / dailySales) * 100 : 0;
            return day;
        }).sort((a: any, b: any) => a.date.localeCompare(b.date));

        return NextResponse.json({
            period: {
                startDate,
                endDate,
            },
            summary: {
                totalPurchaseCost: purchaseCost,
                totalWasteCost: wasteCost,
                totalCost: purchaseCost + wasteCost,
                totalSales: theoreticalSales,
                foodCostPercentage,
                targetFoodCostPercentage: 30, // Industry standard target
                variance: foodCostPercentage - 30,
            },
            dailyTrend,
        });
    } catch (error) {
        console.error('Error calculating food cost:', error);
        return NextResponse.json(
            { error: 'Failed to calculate food cost' },
            { status: 500 }
        );
    }
}
