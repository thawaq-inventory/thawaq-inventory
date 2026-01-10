import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/shifts/week - Fetch shifts for a specific week
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get('startDate');

        if (!startDateParam) {
            return NextResponse.json(
                { error: 'startDate parameter is required' },
                { status: 400 }
            );
        }

        const startDate = new Date(startDateParam);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7); // 7 days from start

        // Fetch all shifts in the week
        const shifts = await prisma.shift.findMany({
            where: {
                date: {
                    gte: startDate,
                    lt: endDate,
                },
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
            orderBy: [
                { date: 'asc' },
                { startTime: 'asc' },
            ],
        });

        // Get all active employees
        const employees = await prisma.user.findMany({
            where: {
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Calculate total hours per employee
        const employeeHours: { [key: string]: number } = {};

        shifts.forEach((shift) => {
            const [startHour, startMin] = shift.startTime.split(':').map(Number);
            const [endHour, endMin] = shift.endTime.split(':').map(Number);

            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const hours = (endMinutes - startMinutes) / 60;

            if (!employeeHours[shift.userId]) {
                employeeHours[shift.userId] = 0;
            }
            employeeHours[shift.userId] += hours;
        });

        return NextResponse.json({
            shifts,
            employees,
            employeeHours,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
    } catch (error) {
        console.error('Error fetching week shifts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch week shifts' },
            { status: 500 }
        );
    }
}
