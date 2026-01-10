import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        console.log('[DEBUG] Auth token:', authToken?.value);

        if (!authToken) {
            return NextResponse.json({ error: 'No auth token', step: 'cookie_check' }, { status: 401 });
        }

        // Verify user is super admin
        const sessionData = await prisma.session.findUnique({
            where: { token: authToken.value },
            include: { user: true },
        });

        console.log('[DEBUG] Session data:', JSON.stringify(sessionData));

        if (!sessionData) {
            return NextResponse.json({ error: 'Session not found', step: 'session_lookup' }, { status: 401 });
        }

        if (!sessionData.user) {
            return NextResponse.json({ error: 'User not found in session', step: 'user_check' }, { status: 401 });
        }

        console.log('[DEBUG] User data:', {
            id: sessionData.user.id,
            username: sessionData.user.username,
            role: sessionData.user.role,
            isSuperAdmin: sessionData.user.isSuperAdmin
        });

        if (!sessionData.user.isSuperAdmin) {
            return NextResponse.json({
                error: 'Only super admins can access branch management',
                step: 'superadmin_check',
                userRole: sessionData.user.role,
                isSuperAdmin: sessionData.user.isSuperAdmin
            }, { status: 403 });
        }

        // Fetch all branches with counts
        const branches = await prisma.branch.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        products: true,
                        shifts: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        console.log('[DEBUG] Found branches:', branches.length);

        return NextResponse.json(branches);
    } catch (error) {
        console.error('[ERROR] Fetching branches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch branches', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// ... rest of POST method stays the same
