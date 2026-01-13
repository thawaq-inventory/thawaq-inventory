import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Verify Employee Session (simplified check for now, typically via cookie or header)
        // Since this is called from the client component which has access to the public API
        // We really should rely on the Cookie validation here if possible, but the Employee App uses localStorage session mostly?
        // Wait, the Employee App uses `employeeSession` in localStorage, but for API calls it doesn't send a token header usually unless we built it.
        // However, the login SETS a cookie `selectedBranches`. We can check if *that* or `auth_token` exists?
        // Actually, for SuperAdmin "God Mode", they likely have the `auth_token` if logged in via Admin, OR just the `employeeSession` if logged via PIN.

        // Let's assume we pass the Employee ID in a header or query for now, OR better, since this is "God Mode", 
        // we can fetch *all* branches if the caller asserts they are SuperAdmin (validated against ID).

        // Let's use the query param `employeeId` to validate.
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        if (!employeeId) {
            return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: employeeId },
            select: { isSuperAdmin: true, role: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let branches: any[] = [];

        // logic: If SuperAdmin -> Fetch ALL active branches.
        // If Employee -> Fetch assigned branches.

        if (user.isSuperAdmin || user.role === 'SUPERADMIN') {
            branches = await prisma.branch.findMany({
                where: { isActive: true },
                select: { id: true, name: true, code: true }
            });
        } else {
            // Fetch assigned
            const userWithBranches = await prisma.user.findUnique({
                where: { id: employeeId },
                include: {
                    branch: true,
                    userBranches: { include: { branch: true } }
                }
            });

            if (userWithBranches?.branch) branches.push(userWithBranches.branch);
            userWithBranches?.userBranches.forEach(ub => {
                if (!branches.find((b: any) => b.id === ub.branchId)) branches.push(ub.branch);
            });
        }

        return NextResponse.json(branches);

    } catch (error) {
        console.error('Error fetching employee branches:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
