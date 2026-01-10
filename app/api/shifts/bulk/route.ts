import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ShiftData {
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    role: string;
    notes?: string;
}

// POST /api/shifts/bulk - Create multiple shifts at once
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shifts } = body as { shifts: ShiftData[] };

        if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
            return NextResponse.json(
                { error: 'Invalid shifts data' },
                { status: 400 }
            );
        }

        // Validate all shifts
        for (const shift of shifts) {
            if (!shift.userId || !shift.date || !shift.startTime || !shift.endTime || !shift.role) {
                return NextResponse.json(
                    { error: 'All shifts must have userId, date, startTime, endTime, and role' },
                    { status: 400 }
                );
            }
        }

        // Create all shifts in a transaction
        const createdShifts = await prisma.$transaction(
            shifts.map((shift) =>
                prisma.shift.create({
                    data: {
                        userId: shift.userId,
                        date: new Date(shift.date),
                        startTime: shift.startTime,
                        endTime: shift.endTime,
                        role: shift.role,
                        notes: shift.notes || null,
                        status: 'SCHEDULED',
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                role: true,
                            },
                        },
                    },
                })
            )
        );

        return NextResponse.json(
            {
                message: `Successfully created ${createdShifts.length} shifts`,
                shifts: createdShifts,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating bulk shifts:', error);
        return NextResponse.json(
            { error: 'Failed to create shifts' },
            { status: 500 }
        );
    }
}
