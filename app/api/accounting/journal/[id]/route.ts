
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Check if entry exists
        const entry = await prisma.journalEntry.findUnique({
            where: { id },
            include: {
                expense: true,
                payrollTransaction: true
            }
        });

        if (!entry) {
            return NextResponse.json({ error: 'Journal Entry not found' }, { status: 404 });
        }

        // Logic to handle related entities if needed
        // If it's a payroll transaction, we should probably update the payroll status back to Approved/Pending?
        // Or un-link it.
        if (entry.payrollTransaction) {
            await prisma.payrollTransaction.update({
                where: { id: entry.payrollTransaction.id },
                data: {
                    glStatus: 'PENDING',
                    journalEntryId: null
                }
            });
        }

        // If it's an expense claim, we might want to update status, but for now just unlinking happens via cascade or set null depending on schema.
        // Assuming Expense.journalEntryId is the link.

        await prisma.journalEntry.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Entry deleted successfully' });

    } catch (error: any) {
        console.error('Delete Journal Entry Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
