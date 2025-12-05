import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    // Clear session (client-side will handle localStorage clearing)
    return NextResponse.json({ success: true });
}
