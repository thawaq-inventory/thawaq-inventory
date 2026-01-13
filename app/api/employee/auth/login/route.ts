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

        // ... (PIN Verification passed)

        console.log('Login successful for:', employee.name);

        // Get ALL user branches
        const userWithBranches = await prisma.user.findUnique({
            where: { id: employee.id },
            include: {
                branch: true, // Legacy
                userBranches: {
                    include: { branch: true }
                }
            }
        });

        const availableBranches: any[] = [];
        if (userWithBranches?.branch) {
            availableBranches.push(userWithBranches.branch);
        }
        userWithBranches?.userBranches.forEach(ub => {
            if (!availableBranches.find(b => b.id === ub.branchId)) {
                availableBranches.push(ub.branch);
            }
        });

        // Check if branch selection is needed
        // If > 1 branch and no specific branch selected in request
        const { branchId: selectedBranchId } = body; // Optional param from client

        if (availableBranches.length > 1 && !selectedBranchId) {
            return NextResponse.json({
                user: {
                    id: employee.id,
                    name: employee.name,
                    username: employee.username
                },
                requiresBranchSelection: true,
                availableBranches: availableBranches.map(b => ({
                    id: b.id,
                    name: b.name,
                    code: b.code
                }))
            });
        }

        // Determine Final Branch ID
        let finalBranchId = null;

        if (selectedBranchId) {
            // Verify user has access to this branch
            const isValid = availableBranches.find(b => b.id === selectedBranchId);
            if (!isValid) {
                return NextResponse.json(
                    { error: 'Invalid branch selection' },
                    { status: 403 }
                );
            }
            finalBranchId = selectedBranchId;
        } else if (availableBranches.length === 1) {
            finalBranchId = availableBranches[0].id;
        } else if (availableBranches.length === 0) {
            return NextResponse.json(
                { error: 'No active branches assigned to this employee' },
                { status: 403 }
            );
        } else {
            // Fallback (should be covered by requiresBranchSelection, but safety check)
            finalBranchId = availableBranches[0].id;
        }

        console.log('Employee final login branchId:', finalBranchId);

        // Return employee session data WITH branchId
        const response = NextResponse.json({
            id: employee.id,
            name: employee.name,
            username: employee.username,
            branchId: finalBranchId
        });

        if (finalBranchId) {
            // Set the cookie for branch filtering
            const cookieValue = JSON.stringify([finalBranchId]);
            response.cookies.set('selectedBranches', cookieValue, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
            console.log('Set branch context cookie for employee:', finalBranchId);
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
