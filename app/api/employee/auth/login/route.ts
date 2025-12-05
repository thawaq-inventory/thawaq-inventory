import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employeeId, pinCode } = body;

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

        // Check PIN
        if (employee.pinCode !== pinCode) {
            return NextResponse.json(
                { error: 'Invalid PIN' },
                { status: 401 }
            );
        }

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
