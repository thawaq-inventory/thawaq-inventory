import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { branchId } = body;

        if (!branchId) {
            return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });
        }

        // We assume the user is already authenticated (accessed via Employee App).
        // For extra security we could check 'employeeSession' or 'auth_token' but this is an internal convenience endpoint for the app context.

        const cookieStore = await cookies();

        // Update the Context Cookie
        // This cookie determines which "Left Join" branch is used for queries
        cookieStore.set('selectedBranches', JSON.stringify([branchId]), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error switching branch:', error);
        return NextResponse.json({ error: 'Failed to switch branch' }, { status: 500 });
    }
}
