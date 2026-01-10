import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * DELETE /api/payroll/transactions/:id
 * 
 * Reject/cancel a payroll transaction
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Update transaction status to rejected
        const transaction = await prisma.payrollTransaction.update({
            where: { id },
            data: {
                status: 'rejected',
                updatedAt: new Date(),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Transaction rejected successfully',
            transaction,
        });
    } catch (error: any) {
        console.error('[Payroll API] Error rejecting transaction:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reject transaction' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/payroll/transactions/:id
 * 
 * Update transaction details (amount, etc.)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { finalAmount, notes } = body;

        const transaction = await prisma.payrollTransaction.update({
            where: { id },
            data: {
                finalAmount: finalAmount !== undefined ? finalAmount : undefined,
                notes: notes !== undefined ? notes : undefined,
                updatedAt: new Date(),
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Transaction updated successfully',
            transaction,
        });
    } catch (error: any) {
        console.error('[Payroll API] Error updating transaction:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update transaction' },
            { status: 500 }
        );
    }
}
