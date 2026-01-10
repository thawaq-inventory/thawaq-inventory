import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBranchFilterForAPI } from '@/lib/branchFilter';

const prisma = new PrismaClient();

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
        return NextResponse.json(
            { error: 'Failed to fetch shifts' },
            { status: 500 }
        );
    }
}

// POST /api/shifts - Create a new shift
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, date, startTime, endTime, role, notes } = body;

        // Validate required fields
        if (!userId || !date || !startTime || !endTime || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
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
        return NextResponse.json(
            { error: 'Failed to create shift' },
            { status: 500 }
        );
    }
}
