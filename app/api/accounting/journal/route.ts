import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all journal entries
export async function GET() {
    try {
        const entries = await prisma.journalEntry.findMany({
            orderBy: { date: 'desc' },
            include: {
                lines: {
                    include: {
                        account: true
                    }
                }
            }
        });
        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
    }
}

// POST create journal entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate that debits equal credits
        const totalDebits = body.lines.reduce((sum: number, line: any) => sum + parseFloat(line.debit || 0), 0);
        const totalCredits = body.lines.reduce((sum: number, line: any) => sum + parseFloat(line.credit || 0), 0);

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            return NextResponse.json({
                error: 'Debits must equal credits',
                debits: totalDebits,
                credits: totalCredits
            }, { status: 400 });
        }

        const entry = await prisma.journalEntry.create({
            data: {
                date: new Date(body.date),
                description: body.description,
                reference: body.reference,
                lines: {
                    create: body.lines.map((line: any) => ({
                        accountId: line.accountId,
                        debit: parseFloat(line.debit) || 0,
                        credit: parseFloat(line.credit) || 0
                    }))
                }
            },
            include: {
                lines: {
                    include: {
                        account: true
                    }
                }
            }
        });

        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error('Journal entry creation error:', error);
        return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
    }
}
