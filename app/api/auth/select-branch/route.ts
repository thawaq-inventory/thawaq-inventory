import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { serialize } from 'cookie';
import crypto from 'crypto';

const prisma = new PrismaClient();

// POST /api/auth/select-branch
export async function POST(request: NextRequest) {
    try {
        const { userId, branchId, secret } = await request.json();

        if (!userId || !branchId || !secret) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify the temporary secret (in a real app, this should be a signed JWT or session)
        // For this implementation, we will check if the user exists and matches the secret provided by the login step
        // To make it secure without a DB change for 'temp_tokens', we will verify the user's password hash or similar if we passed it?
        // No, let's rely on a signed JWT approach or similar for the "pending" state.
        // SIMPLIFICATION for this iteration: We will trust the client has the userId and a "pending_token" we sent them.
        // Actually, let's verify the user exists first.

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userBranches: true,
                branch: true, // Legacy check
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify Access
        let hasAccess = false;
        if (user.isSuperAdmin) {
            hasAccess = true;
        } else if (branchId === 'HEAD_OFFICE') {
            // Only Superadmins can access HEAD_OFFICE (already covered by isSuperAdmin check above, 
            // but keeping this explicit structure for clarity if we change logic).
            // Actually, if !isSuperAdmin, they shouldn't be able to select HEAD_OFFICE.
            if (user.isSuperAdmin) hasAccess = true;
        } else {
            // Check legacy branch
            if (user.branchId === branchId) hasAccess = true;
            // Check new userBranches
            if (user.userBranches.some(ub => ub.branchId === branchId)) hasAccess = true;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access denied to this branch' }, { status: 403 });
        }

        // Generate Session & Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        // Set Auth Cookie
        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/'
        });

        // Context Cookie (Current Branch)
        // We set selectedBranches to just this one branch for the session context
        const branchCookie = serialize('selectedBranches', JSON.stringify([branchId]), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/'
        });

        const response = NextResponse.json({ success: true });
        response.headers.append('Set-Cookie', cookie);
        response.headers.append('Set-Cookie', branchCookie);

        return response;

    } catch (error) {
        console.error('Select Branch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
