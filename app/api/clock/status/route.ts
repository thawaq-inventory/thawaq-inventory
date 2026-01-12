import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get current clock status for a user
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        // Find any open clock entry (clocked in but not out)
        const openEntry = await prisma.clockEntry.findFirst({
            where: {
                userId,
                clockOutTime: null
            },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });

        if (openEntry) {
            const clockInTime = new Date(openEntry.clockInTime);
            const now = new Date();
            const elapsedHours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

            return NextResponse.json({
                isClockedIn: true,
                entry: openEntry,
                elapsedHours: Math.round(elapsedHours * 100) / 100,
                clockInTime: openEntry.clockInTime
            });
        }

        // Get the last clock entry for reference
        const lastEntry = await prisma.clockEntry.findFirst({
            where: { userId },
            orderBy: { clockOutTime: 'desc' },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });

        return NextResponse.json({
            isClockedIn: false,
            entry: null,
            lastEntry: lastEntry || null
        });

    } catch (error) {
        console.error('Error fetching clock status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch clock status' },
            { status: 500 }
        );
    }
}
