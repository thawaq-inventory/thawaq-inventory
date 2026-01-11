import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/employee/list - Public endpoint for employee login dropdown
// This returns only active employees with minimal info (id, name)
export async function GET() {
    try {
        const employees = await prisma.user.findMany({
            where: {
                isActive: true,
                // Find users with 'EMPLOYEE' role (case-insensitive check not possible in Prisma directly, so we filter both)
                OR: [
                    { role: 'EMPLOYEE' },
                    { role: 'employee' }
                ]
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employees' },
            { status: 500 }
        );
    }
}
