import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { serialize } from 'cookie';
import crypto from 'crypto';

const prisma = new PrismaClient();

// POST /api/auth/login
export async function POST(request: NextRequest) {
    try {
        const { username, password, rememberMe } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            include: {
                branch: true, // Legacy
                userBranches: {
                    include: { branch: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // Check if account is active
        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Account is deactivated' },
                { status: 401 }
            );
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { error: 'Invalid username or password' },
                { status: 401 }
            );
        }

        // --- Multi-Branch Logic ---

        let availableBranches: any[] = [];

        if (user.isSuperAdmin) {
            // Superadmin gets all branches
            availableBranches = await prisma.branch.findMany({
                where: { isActive: true },
                select: { id: true, name: true, code: true, type: true }
            });
            // Virtual Head Office injection REMOVED to prevent duplicate with Real HQ
        } else {
            // Collect assigned branches
            // 1. Legacy branch
            if (user.branch) {
                availableBranches.push(user.branch);
            }
            // 2. Multi-branch assignments
            user.userBranches.forEach(ub => {
                if (!availableBranches.find(b => b.id === ub.branchId)) {
                    availableBranches.push(ub.branch);
                }
            });
        }

        // Case 1: Multiple branches or Superadmin -> Require Selection
        if (availableBranches.length > 1 || user.isSuperAdmin) {
            return NextResponse.json({
                user: {
                    id: user.id,
                    name: user.name,
                    username: user.username,
                    role: user.role
                },
                requiresBranchSelection: true,
                availableBranches: availableBranches.map(b => ({
                    id: b.id,
                    name: b.name,
                    code: b.code,
                    type: b.type
                })),
                // In a real app, sign a temp jwt here. For now, client uses User ID.
                secret: 'temp-pending-secret'
            });
        }

        // Case 2: Zero branches (and not superadmin) -> Error
        if (availableBranches.length === 0 && !user.isSuperAdmin) {
            return NextResponse.json(
                { error: 'No active branches assigned to this user.' },
                { status: 403 }
            );
        }

        // Case 3: Single Branch -> Auto Login
        const targetBranchId = availableBranches[0].id;

        // Create session token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days (Database record always keeps 7 days for safety)

        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        // Set Cookies
        // If rememberMe is true, set maxAge to 7 days.
        // If false, do not set maxAge (session cookie).
        const cookieOptions: any = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        };

        if (rememberMe) {
            cookieOptions.maxAge = 7 * 24 * 60 * 60; // 7 days
        }

        const cookie = serialize('auth_token', token, cookieOptions);
        const branchCookie = serialize('selectedBranches', JSON.stringify([targetBranchId]), cookieOptions);

        const response = NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role
            },
            requiresBranchSelection: false,
            targetBranchId
        });

        response.headers.append('Set-Cookie', cookie);
        response.headers.append('Set-Cookie', branchCookie);

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}
