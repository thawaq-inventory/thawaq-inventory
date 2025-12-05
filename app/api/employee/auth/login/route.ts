import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employeeId, pinCode } = body;

        console.log('Login attempt:', { employeeId, pinCode });

        if (!employeeId || !pinCode) {
            return NextResponse.json(
                { error: 'Employee ID and PIN are required' },
                { status: 400 }
            );
        }

        // Find employee
        const employee = await prisma.user.findUnique({
            where: { id: employeeId },
            select: {
                id: true,
                name: true,
                username: true,
                pinCode: true,
                role: true,
                isActive: true,
            },
        });

        console.log('Employee found:', employee ? { id: employee.id, name: employee.name, hasPIN: !!employee.pinCode } : 'NOT FOUND');

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        if (!employee.isActive) {
            return NextResponse.json(
                { error: 'Employee account is inactive' },
                { status: 403 }
            );
        }

        if (employee.role !== 'employee') {
            return NextResponse.json(
                { error: 'Not an employee account' },
                { status: 403 }
            );
        }

        // Check if PIN is set
        if (!employee.pinCode) {
            console.error('Employee has no PIN set');
            return NextResponse.json(
                { error: 'No PIN set for this employee. Please contact admin.' },
                { status: 401 }
            );
        }

        // Check PIN - convert both to strings for comparison
        const employeePIN = String(employee.pinCode);
        const providedPIN = String(pinCode);

        console.log('PIN comparison:', { employeePIN, providedPIN, match: employeePIN === providedPIN });

        if (employeePIN !== providedPIN) {
            return NextResponse.json(
                { error: 'Invalid PIN' },
                { status: 401 }
            );
        }

        console.log('Login successful for:', employee.name);

        // Return employee session data
        return NextResponse.json({
            id: employee.id,
            name: employee.name,
            username: employee.username,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}
