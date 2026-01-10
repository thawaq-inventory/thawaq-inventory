import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/shifts/[id] - Get a single shift
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const shift = await prisma.shift.findUnique({
            where: { id },
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
        });

        if (!shift) {
            return NextResponse.json(
                { error: 'Shift not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(shift);
    } catch (error) {
        console.error('Error fetching shift:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shift' },
            { status: 500 }
        );
    }
}

// PUT /api/shifts/[id] - Update a shift
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { date, startTime, endTime, role, notes, status } = body;

        // Check if shift exists
        const existingShift = await prisma.shift.findUnique({
            where: { id },
        });

        if (!existingShift) {
            return NextResponse.json(
                { error: 'Shift not found' },
                { status: 404 }
            );
        }

        // If updating date or time, check for conflicts
        if (date || startTime || endTime) {
            const checkDate = date ? new Date(date) : existingShift.date;
            const checkStartTime = startTime || existingShift.startTime;
            const checkEndTime = endTime || existingShift.endTime;

            const conflictingShifts = await prisma.shift.findMany({
                where: {
                    userId: existingShift.userId,
                    date: checkDate,
                    id: { not: id },
                    status: { not: 'CANCELLED' },
                },
            });

            for (const shift of conflictingShifts) {
                if (
                    (checkStartTime >= shift.startTime && checkStartTime < shift.endTime) ||
                    (checkEndTime > shift.startTime && checkEndTime <= shift.endTime) ||
                    (checkStartTime <= shift.startTime && checkEndTime >= shift.endTime)
                ) {
                    return NextResponse.json(
                        { error: 'Updated shift conflicts with an existing shift' },
                        { status: 409 }
                    );
                }
            }
        }

        const updateData: any = {};
        if (date) updateData.date = new Date(date);
        if (startTime) updateData.startTime = startTime;
        if (endTime) updateData.endTime = endTime;
        if (role) updateData.role = role;
        if (notes !== undefined) updateData.notes = notes || null;
        if (status) updateData.status = status;

        const updatedShift = await prisma.shift.update({
            where: { id },
            data: updateData,
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
        });

        return NextResponse.json(updatedShift);
    } catch (error) {
        console.error('Error updating shift:', error);
        return NextResponse.json(
            { error: 'Failed to update shift' },
            { status: 500 }
        );
    }
}

// DELETE /api/shifts/[id] - Delete a shift
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // Check if shift exists
        const shift = await prisma.shift.findUnique({
            where: { id },
        });

        if (!shift) {
            return NextResponse.json(
                { error: 'Shift not found' },
                { status: 404 }
            );
        }

        await prisma.shift.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        return NextResponse.json(
            { error: 'Failed to delete shift' },
            { status: 500 }
        );
    }
}
