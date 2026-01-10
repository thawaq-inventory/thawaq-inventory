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
    branchId?: string;
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

        // Fetch branchIds for all users involved
        const userIds = [...new Set(shifts.map(s => s.userId))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, branchId: true }
        });

        const userBranchMap = new Map(users.map(u => [u.id, u.branchId]));

        // Verify all users have branches or branchId is provided
        for (const shift of shifts) {
            if (!shift.branchId && !userBranchMap.get(shift.userId)) {
                return NextResponse.json(
                    { error: `User ${shift.userId} is not assigned to a primary branch and no branchId provided` },
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
                        branchId: shift.branchId || userBranchMap.get(shift.userId)!,
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
