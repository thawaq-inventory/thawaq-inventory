import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const mappings = await prisma.accountingMapping.findMany({
            include: { account: true },
            orderBy: { eventKey: 'asc' }
        });

        // Also fetch all active accounts for the dropdown
        const accounts = await prisma.account.findMany({
            orderBy: { code: 'asc' }
        });

        return NextResponse.json({ mappings, accounts });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { mappings } = body; // Array of { eventKey, accountId }

        if (!Array.isArray(mappings)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const results = [];
        for (const m of mappings) {
            if (m.eventKey && m.accountId) {
                const updated = await prisma.accountingMapping.update({
                    where: { eventKey: m.eventKey },
                    data: { accountId: m.accountId }
                });
                results.push(updated);
            }
        }

        return NextResponse.json({ success: true, updated: results.length });
    } catch (error) {
        console.error('Update Mappings Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
