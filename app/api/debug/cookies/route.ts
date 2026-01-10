import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        return NextResponse.json({
            hasAuthToken: !!authToken,
            tokenValue: authToken?.value || 'NO TOKEN',
            tokenLength: authToken?.value?.length || 0,
            allCookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
