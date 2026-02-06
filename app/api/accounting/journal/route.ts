import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all journal entries
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const branchId = searchParams.get('branchId');

        const where: any = {};
        if (branchId && branchId !== 'all') {
            where.OR = [
                { branchId: branchId },
                { branchId: null } // Always show Global/HQ entries
            ];
        }

        console.log('[API Journal] Fetching with where:', JSON.stringify(where));

        const entries = await prisma.journalEntry.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                lines: {
                    include: {
                        account: true
                    }
                },
                branch: true, // Include branch info
                expense: true,
                payrollTransaction: true
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

        // Create transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Primary Entry
            const entry = await tx.journalEntry.create({
                data: {
                    date: new Date(body.date),
                    description: body.description,
                    reference: body.reference,
                    branchId: body.branchId || null,
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
                        include: { account: true }
                    }
                }
            });

            // 2. Handle Automated Accruals
            if (body.accrual && body.accrual.installments > 0) {
                const { installments, firstDate, debitAccountId, creditAccountId } = body.accrual;

                // Get Total Amount from Primary Entry (sum of debits)
                // Assuming the "Total Amount" to accrue matches the manual entry total.
                // If the user entered multiple lines, we sum all debits.
                // Or we could let the user specify amount, but typically it IS the entry amount.
                const totalAmount = body.lines.reduce((sum: number, line: any) => sum + parseFloat(line.debit || 0), 0);

                const monthlyBase = Math.floor((totalAmount / installments) * 1000) / 1000; // 3 decimal precision safe
                let remaining = totalAmount;

                for (let i = 0; i < installments; i++) {
                    const isLast = i === installments - 1;
                    const amount = isLast ? remaining : monthlyBase;
                    remaining -= amount;

                    // Calculate Date: First Date + i months
                    const entryDate = new Date(firstDate);
                    entryDate.setMonth(entryDate.getMonth() + i);

                    await tx.journalEntry.create({
                        data: {
                            date: entryDate,
                            description: `Accrual ${i + 1}/${installments}: ${body.description}`,
                            reference: body.reference ? `${body.reference}-AC${i + 1}` : `ACCRUAL-${i + 1}`,
                            branchId: body.branchId || null,
                            relatedEntryId: entry.id, // Link to primary entry
                            lines: {
                                create: [
                                    {
                                        accountId: debitAccountId,
                                        debit: amount,
                                        credit: 0
                                    },
                                    {
                                        accountId: creditAccountId,
                                        debit: 0,
                                        credit: amount
                                    }
                                ]
                            }
                        }
                    });
                }
            }

            return entry;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Journal entry creation error:', error);
        return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 });
    }
}
