import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all invoices
export async function GET() {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { date: 'desc' },
            include: {
                vendor: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });
        return NextResponse.json(invoices);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

// POST create invoice
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: body.invoiceNumber,
                vendorId: body.vendorId,
                date: new Date(body.date),
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                amount: parseFloat(body.amount),
                taxAmount: parseFloat(body.taxAmount) || 0,
                totalAmount: parseFloat(body.totalAmount),
                description: body.description,
                imageUrl: body.imageUrl,
                status: body.status || 'UNPAID',
                items: {
                    create: body.items?.map((item: any) => ({
                        productId: item.productId,
                        description: item.description || item.name,
                        quantity: parseFloat(item.quantity),
                        unitPrice: parseFloat(item.unitPrice),
                        amount: parseFloat(item.amount)
                    })) || []
                }
            },
            include: {
                vendor: true,
                items: true
            }
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error('Invoice creation error:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}
