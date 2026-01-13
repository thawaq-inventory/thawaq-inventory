import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBranchFilterForAPI } from '@/lib/branchFilter';

// GET /api/shifts - Fetch shifts with optional filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const status = searchParams.get('status');

        // Get branch filter from cookies
        const branchFilter = await getBranchFilterForAPI();

        const where: any = {
            ...branchFilter
        };

        if (userId) {
            where.userId = userId;
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                where.date.gte = new Date(startDate);
            }
            if (endDate) {
                where.date.lte = new Date(endDate);
            }
        }

        if (status) {
            where.status = status;
        }

        const shifts = await prisma.shift.findMany({
            where,
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
            orderBy: {
                date: 'asc',
            },
        });

        return NextResponse.json(shifts);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to fetch shifts: ${errorMessage}` },
            { status: 500 }
        );
    }
}

// POST /api/shifts - Create a new shift
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, date, startTime, endTime, role, notes, branchId } = body;

        // Validate required fields
        if (!userId || !date || !startTime || !endTime || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get user's branch if not provided
        let shiftBranchId = branchId;
        if (!shiftBranchId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { branchId: true }
            });
            if (user && user.branchId) {
                shiftBranchId = user.branchId;
            } else {
                return NextResponse.json(
                    { error: 'Branch ID is required or user must be assigned to a primary branch' },
                    { status: 400 }
                );
            }
        }

        // Check for shift conflicts (overlapping shifts for the same user on the same day)
        const existingShifts = await prisma.shift.findMany({
            where: {
                userId,
                date: new Date(date),
                status: {
                    not: 'CANCELLED',
                },
            },
        });

        // Check for time overlap
        for (const shift of existingShifts) {
            const existingStart = shift.startTime;
            const existingEnd = shift.endTime;

            // Check if times overlap
            if (
                (startTime >= existingStart && startTime < existingEnd) ||
                (endTime > existingStart && endTime <= existingEnd) ||
                (startTime <= existingStart && endTime >= existingEnd)
            ) {
                return NextResponse.json(
                    { error: 'Shift conflicts with an existing shift for this employee' },
                    { status: 409 }
                );
            }
        }

        const shift = await prisma.shift.create({
            data: {
                userId,
                branchId: shiftBranchId,
                date: new Date(date),
                startTime,
                endTime,
                role,
                notes: notes || null,
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
        });

        return NextResponse.json(shift, { status: 201 });
    } catch (error) {
        console.error('Error creating shift:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to create shift: ${errorMessage}` },
            { status: 500 }
        );
    }
}
