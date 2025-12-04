import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Generate reorder suggestions
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                sku: true,
                stockLevel: true,
                unit: true,
                minStock: true,
                maxStock: true,
                cost: true,
            }
        });

        // Filter products that are below min stock or could be optimally reordered
        const suggestions = products
            .filter(p => p.stockLevel < p.minStock || (p.maxStock > 0 && p.stockLevel < (p.minStock + p.maxStock) / 2))
            .map(p => {
                const isCritical = p.stockLevel < p.minStock;
                const suggestedOrder = p.maxStock > 0 ? p.maxStock - p.stockLevel : p.minStock * 2 - p.stockLevel;
                const orderCost = suggestedOrder * p.cost;

                return {
                    ...p,
                    isCritical,
                    deficit: p.minStock - p.stockLevel,
                    suggestedOrderQuantity: Math.max(suggestedOrder, 0),
                    estimatedCost: orderCost,
                    priority: isCritical ? 'HIGH' : 'MEDIUM',
                };
            })
            .sort((a, b) => {
                // Sort by priority (critical first), then by deficit
                if (a.isCritical && !b.isCritical) return -1;
                if (!a.isCritical && b.isCritical) return 1;
                return b.deficit - a.deficit;
            });

        const summary = {
            totalSuggestions: suggestions.length,
            criticalItems: suggestions.filter(s => s.isCritical).length,
            totalEstimatedCost: suggestions.reduce((sum, s) => sum + s.estimatedCost, 0),
        };

        return NextResponse.json({
            summary,
            suggestions,
        });
    } catch (error) {
        console.error('Error generating reorder suggestions:', error);
        return NextResponse.json(
            { error: 'Failed to generate reorder suggestions' },
            { status: 500 }
        );
    }
}
