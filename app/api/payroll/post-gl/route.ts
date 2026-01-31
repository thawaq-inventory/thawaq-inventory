
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { payrollIds } = await req.json();

        if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
            return NextResponse.json({ success: false, error: 'No payroll transactions selected' }, { status: 400 });
        }

        // 1. Fetch Accounts
        const accExpense = await prisma.account.findFirst({ where: { name: 'Salaries & Wages' } });
        const accLiability = await prisma.account.findFirst({ where: { name: 'Salaries Payable' } });

        if (!accExpense || !accLiability) {
            return NextResponse.json({ success: false, error: 'Payroll accounts missing in Chart of Accounts' }, { status: 500 });
        }

        // 2. Fetch Transactions to Validate
        const transactions = await prisma.payrollTransaction.findMany({
            where: {
                id: { in: payrollIds },
                glStatus: 'PENDING',
                status: 'approved' // Only approved can be posted
            }
        });

        if (transactions.length === 0) {
            return NextResponse.json({ success: false, error: 'No approved, pending transactions found' }, { status: 400 });
        }

        // 3. Calculate Totals
        const totalAmount = transactions.reduce((sum, t) => sum + t.finalAmount, 0);
        const employeeCount = transactions.length;
        const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

        // 4. Create Journal Entry
        // Debit Expense, Credit Liability
        const journalEntry = await prisma.journalEntry.create({
            data: {
                description: `Payroll Run: ${monthYear} - ${employeeCount} Employees`,
                reference: `PAYROLL-${new Date().toISOString().split('T')[0]}`,
                lines: {
                    create: [
                        {
                            accountId: accExpense.id,
                            debit: totalAmount,
                            credit: 0
                        },
                        {
                            accountId: accLiability.id,
                            debit: 0,
                            credit: totalAmount
                        }
                    ]
                }
            }
        });

        // 5. Update Payroll Transactions
        await prisma.payrollTransaction.updateMany({
            where: { id: { in: transactions.map(t => t.id) } },
            data: {
                glStatus: 'POSTED',
                // We can't batch update foreign keys easily with updateMany if we want to link the same JE
                // But updateMany doesn't support setting relation fields directly in some versions like this. 
                // Wait, PayrollTransaction has journalEntryId scalar. We CAN update it.
                journalEntryId: journalEntry.id
            }
        });

        return NextResponse.json({
            success: true,
            journalEntryId: journalEntry.id,
            postedCount: transactions.length,
            totalAmount
        });

    } catch (error: any) {
        console.error('Post Payroll Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
