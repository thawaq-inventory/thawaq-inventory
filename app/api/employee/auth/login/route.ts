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

        if (employee.role?.toLowerCase() !== 'employee') {
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

        // Get the user's branch ID for session
        let branchId = null;
        const userWithBranch = await prisma.user.findUnique({
            where: { id: employee.id },
            select: {
                branchId: true,
                userBranches: {
                    select: { branchId: true },
                    take: 1
                }
            }
        });

        // Prefer legacy branchId, fallback to first UserBranch
        branchId = userWithBranch?.branchId || userWithBranch?.userBranches[0]?.branchId || null;

        console.log('Employee branchId:', branchId);

        // Return employee session data WITH branchId
        const response = NextResponse.json({
            id: employee.id,
            name: employee.name,
            username: employee.username,
            branchId: branchId  // Include branchId in session for clock in
        });

        if (branchId) {
            // Set the cookie for branch filtering
            const cookieValue = JSON.stringify([branchId]);
            response.cookies.set('selectedBranches', cookieValue, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            console.log('Set branch context cookie for employee:', branchId);
        }

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}
