import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getSelectedBranches } from '@/lib/branchFilter';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
    try {
        // Check if current user is a super admin
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        let isSuperAdmin = false;
        if (authToken) {
            const session = await prisma.session.findUnique({
                where: { token: authToken.value },
                include: { user: { select: { isSuperAdmin: true } } }
            });
            isSuperAdmin = session?.user?.isSuperAdmin || false;
        }

        // Super admins see ALL users - no filtering
        // Regular admins see users filtered by selected branches
        let whereClause = {};

        if (!isSuperAdmin) {
            // Get selected branches for filtering (only for non-super admins)
            const selectedBranches = await getSelectedBranches();

            if (!selectedBranches.includes('all') && selectedBranches.length > 0) {
                whereClause = {
                    OR: [
                        { isSuperAdmin: true },  // Always include super admins in results
                        { branchId: { in: selectedBranches } },  // Legacy branchId field
                        { userBranches: { some: { branchId: { in: selectedBranches } } } }  // userBranches junction table
                    ]
                };
            }
        }
        // If super admin or 'all' is selected, whereClause stays empty (no filtering)

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                isActive: true,
                isSuperAdmin: true,
                branchId: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                userBranches: {
                    include: {
                        branch: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                },
                cliqAlias: true,
                hourlyRate: true,
                pinCode: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to fetch users: ${errorMessage}` },
            { status: 500 }
        );
    }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
    try {
        const { username, password, name, role, branchIds, pinCode, cliqAlias, hourlyRate, isSuperAdmin } = await request.json();

        // Validation
        if (!username || !password || !name) {
            return NextResponse.json(
                { error: 'Username, password, and name are required' },
                { status: 400 }
            );
        }

        // Validate username format
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return NextResponse.json(
                { error: 'Username must be 3-20 alphanumeric characters' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existing = await prisma.user.findUnique({
            where: { username: username.toLowerCase() }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user - set branchId to first branch if provided
        const primaryBranchId = (branchIds && Array.isArray(branchIds) && branchIds.length > 0) ? branchIds[0] : null;

        const user = await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                password: hashedPassword,
                name,
                role: role || 'EMPLOYEE',
                isActive: true,
                pinCode: pinCode || null,
                cliqAlias: cliqAlias || null,
                hourlyRate: hourlyRate || 5.0,
                isSuperAdmin: isSuperAdmin || false,
                branchId: primaryBranchId, // Set legacy branchId for clock-in support
            }
        });

        // Create UserBranch records if branchIds provided
        if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
            await prisma.userBranch.createMany({
                data: branchIds.map((branchId: string) => ({
                    userId: user.id,
                    branchId
                }))
            });
        }

        // Fetch complete user with branches
        const completeUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                isActive: true,
                isSuperAdmin: true,
                branchId: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                userBranches: {
                    include: {
                        branch: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                },
                cliqAlias: true,
                hourlyRate: true,
                createdAt: true
            }
        });

        return NextResponse.json(completeUser, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to create user: ${errorMessage}` },
            { status: 500 }
        );
    }
}
