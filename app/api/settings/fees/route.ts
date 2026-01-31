
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        let methods = await prisma.paymentMethod.findMany({
            orderBy: { name: 'asc' }
        });

        if (methods.length === 0) {
            // Auto-Seed Defaults
            await prisma.paymentMethod.createMany({
                data: [
                    { name: 'Visa', feeRate: 0.007 },
                    { name: 'Talabat', feeRate: 0.25 },
                    { name: 'Careem', feeRate: 0.25 },
                    { name: 'Cash', feeRate: 0 }
                ]
            });

            methods = await prisma.paymentMethod.findMany({
                orderBy: { name: 'asc' }
            });
        }

        return NextResponse.json(methods);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, feeRate, id } = await req.json();

        if (!name || feeRate === undefined) {
            return NextResponse.json({ error: 'Name and Fee Rate are required' }, { status: 400 });
        }

        const method = await prisma.paymentMethod.upsert({
            where: { name: name }, // Name should be unique
            update: { feeRate: parseFloat(feeRate) },
            create: { name, feeRate: parseFloat(feeRate) }
        });

        return NextResponse.json({ success: true, method });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
    }
}
