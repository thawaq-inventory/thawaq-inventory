import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all accounts
export async function GET() {
    try {
        const accounts = await prisma.account.findMany({
            orderBy: [
                { type: 'asc' },
                { code: 'asc' }
            ]
        });
        return NextResponse.json(accounts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}

// POST create account
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const account = await prisma.account.create({
            data: {
                code: body.code,
                name: body.name,
                type: body.type,
                description: body.description
            }
        });
        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
