import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';

const prisma = new PrismaClient();

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
    try {
        const cookies = parse(request.headers.get('cookie') || '');
        const token = cookies.auth_token;

        if (!token) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Find session
        const session = await prisma.session.findUnique({
            where: { token },
            include: { user: true }
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Invalid session' },
                { status: 401 }
            );
        }

        // Check if session expired
        if (new Date() > session.expiresAt) {
            await prisma.session.delete({ where: { id: session.id } });
            return NextResponse.json(
                { error: 'Session expired' },
                { status: 401 }
            );
        }

        // Check if user is active
        if (!session.user.isActive) {
            return NextResponse.json(
                { error: 'Account deactivated' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: {
                id: session.user.id,
                name: session.user.name,
                username: session.user.username,
                role: session.user.role
            }
        });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json(
            { error: 'Authentication check failed' },
            { status: 500 }
        );
    }
}
