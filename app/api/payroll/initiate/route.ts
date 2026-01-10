import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/payroll/initiate
 * 
 * Creates a draft payroll transaction that requires approval in Bank al Etihad mobile app
 * 
 * Body:
 * - employeeId: string
 * - totalHours: number
 * - hourlyRate: number
 * - periodStart: ISO date string
 * - periodEnd: ISO date string
 * - accountNumber: string (optional, employee's bank account)
 * - bankCode: string (optional, employee's bank code)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            employeeId,
            totalHours,
            hourlyRate,
            periodStart,
            periodEnd,
            accountNumber,
            bankCode,
            notes,
        } = body;

        // Validate required fields
        if (!employeeId || totalHours === undefined || hourlyRate === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: employeeId, totalHours, hourlyRate' },
                { status: 400 }
            );
        }

        // Get employee details
        const employee = await prisma.user.findUnique({
            where: { id: employeeId },
            select: {
                id: true,
                name: true,
                username: true,
            },
        });

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Calculate final amount
        const finalAmount = totalHours * hourlyRate;

        // Generate unique reference for payment
        const paymentReference = `PAY_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${employee.id.substring(0, 8)}`;

        // Call Staq API to create draft CliQ instant transfer
        let staqResponse;
        let transactionId = null;
        let reference = null;
        let status = 'waiting_bank_approval';
        let errorMessage = null;

        try {
            // Dynamically import the StaqClient (CommonJS module)
            const { getStaqClient } = require('@/backend/services/staqClient');
            const staqClient = getStaqClient();

            // CRITICAL: Use employee's CliQ alias (not account number)
            // TODO: Add cliqAlias field to User model in database
            const employeeAlias = accountNumber || employee.username; // Fallback to username temporarily

            staqResponse = await staqClient.initiateCliqPayout({
                employeeAlias: employeeAlias,
                employeeName: employee.name,
                amountJOD: finalAmount,
                reference: paymentReference,
                description: `Weekly payroll - ${totalHours} hours @ ${hourlyRate} JOD/hour`,
                metadata: {
                    employee_id: employee.id,
                    total_hours: totalHours,
                    hourly_rate: hourlyRate,
                    period_start: periodStart || new Date().toISOString(),
                    period_end: periodEnd || new Date().toISOString(),
                },
            });

            if (staqResponse.success) {
                transactionId = staqResponse.transactionId;
                reference = staqResponse.reference || paymentReference;
                status = 'waiting_bank_approval';
            } else {
                // API call failed, but we'll still save the record
                status = 'failed';
                errorMessage = staqResponse.error || 'Unknown error from bank API';
                console.error('[Payroll] Bank API error:', errorMessage);
            }
        } catch (error: any) {
            // Certificate or connection error
            console.error('[Payroll] Failed to call Staq API:', error.message);
            status = 'failed';
            errorMessage = `Bank API unreachable: ${error.message}`;
        }

        // Save transaction to database
        const payrollTransaction = await prisma.payrollTransaction.create({
            data: {
                employeeId: employee.id,
                totalHours,
                hourlyRate,
                finalAmount,
                periodStart: periodStart ? new Date(periodStart) : new Date(),
                periodEnd: periodEnd ? new Date(periodEnd) : new Date(),
                accountNumber: accountNumber || null,
                bankCode: bankCode || null,
                transactionId,
                reference,
                status,
                notes,
                errorMessage,
            },
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
            },
        });

        // Return response based on status
        if (status === 'failed') {
            return NextResponse.json(
                {
                    success: false,
                    error: errorMessage,
                    transaction: payrollTransaction,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Payroll transaction created and sent to Bank App for approval',
            transaction: payrollTransaction,
        });
    } catch (error: any) {
        console.error('[Payroll API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/payroll/initiate
 * 
 * Get all payroll transactions (for admin view)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const status = searchParams.get('status');

        const where: any = {};
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;

        const transactions = await prisma.payrollTransaction.findMany({
            where,
            include: {
                employee: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            success: true,
            transactions,
        });
    } catch (error: any) {
        console.error('[Payroll API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
