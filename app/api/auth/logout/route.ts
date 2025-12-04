import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';

const prisma = new PrismaClient();

// POST /api/auth/logout
export async function POST(request: NextRequest) {
    try {
        const cookies = parse(request.headers.get('cookie') || '');
        const token = cookies.auth_token;

        if (token) {
            // Delete session from database
            await prisma.session.deleteMany({
                where: { token }
            });
        }

        // Clear cookie
        const response = NextResponse.json({ success: true });
        response.headers.append(
            'Set-Cookie',
            'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        );

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
}
