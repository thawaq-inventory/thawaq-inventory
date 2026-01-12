import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// POST - Clock in or out
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, branchId, action, latitude, longitude, source = 'app' } = body;

        // Validate required fields
        if (!userId || !branchId || !action) {
            return NextResponse.json(
                { error: 'userId, branchId, and action are required' },
                { status: 400 }
            );
        }

        if (action !== 'in' && action !== 'out') {
            return NextResponse.json(
                { error: 'action must be "in" or "out"' },
                { status: 400 }
            );
        }

        // Get branch to check geolocation requirements
        const branch = await prisma.branch.findUnique({
            where: { id: branchId },
            select: { id: true, name: true, latitude: true, longitude: true, geoRadius: true }
        });

        if (!branch) {
            return NextResponse.json(
                { error: 'Branch not found' },
                { status: 404 }
            );
        }

        // Check geolocation if branch has location set
        if (branch.latitude && branch.longitude) {
            if (!latitude || !longitude) {
                return NextResponse.json(
                    { error: 'Location is required for this branch. Please enable location services.' },
                    { status: 400 }
                );
            }

            const distance = calculateDistance(
                latitude,
                longitude,
                branch.latitude,
                branch.longitude
            );

            if (distance > branch.geoRadius) {
                return NextResponse.json(
                    {
                        error: `You are too far from ${branch.name}. Please move within ${branch.geoRadius}m of the branch.`,
                        distance: Math.round(distance),
                        allowedRadius: branch.geoRadius
                    },
                    { status: 403 }
                );
            }
        }
        // If branch has no location set, allow clock in/out from anywhere

        const now = new Date();

        if (action === 'in') {
            // Check if already clocked in (has an open entry)
            const existingEntry = await prisma.clockEntry.findFirst({
                where: {
                    userId,
                    clockOutTime: null
                }
            });

            if (existingEntry) {
                return NextResponse.json(
                    { error: 'You are already clocked in. Please clock out first.' },
                    { status: 400 }
                );
            }

            // Create clock in entry
            const entry = await prisma.clockEntry.create({
                data: {
                    userId,
                    branchId,
                    clockInTime: now,
                    clockInLat: latitude || null,
                    clockInLng: longitude || null,
                    clockInSource: source
                },
                include: {
                    branch: { select: { name: true } },
                    user: { select: { name: true } }
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Clocked in successfully',
                entry
            }, { status: 201 });

        } else {
            // Clock out - find the open entry
            const openEntry = await prisma.clockEntry.findFirst({
                where: {
                    userId,
                    clockOutTime: null
                }
            });

            if (!openEntry) {
                return NextResponse.json(
                    { error: 'You are not clocked in. Please clock in first.' },
                    { status: 400 }
                );
            }

            // Calculate total hours
            const clockInTime = new Date(openEntry.clockInTime);
            const totalHours = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

            // Update the entry with clock out time
            const entry = await prisma.clockEntry.update({
                where: { id: openEntry.id },
                data: {
                    clockOutTime: now,
                    clockOutLat: latitude || null,
                    clockOutLng: longitude || null,
                    clockOutSource: source,
                    totalHours: Math.round(totalHours * 100) / 100 // Round to 2 decimals
                },
                include: {
                    branch: { select: { name: true } },
                    user: { select: { name: true } }
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Clocked out successfully',
                entry
            });
        }

    } catch (error) {
        console.error('Error in clock API:', error);
        return NextResponse.json(
            { error: 'Failed to process clock request' },
            { status: 500 }
        );
    }
}

// GET - Fetch clock entries with filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const branchId = searchParams.get('branchId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const activeOnly = searchParams.get('activeOnly') === 'true';

        const where: any = {};

        if (userId) where.userId = userId;
        if (branchId) where.branchId = branchId;
        if (activeOnly) where.clockOutTime = null;

        if (startDate || endDate) {
            where.clockInTime = {};
            if (startDate) where.clockInTime.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.clockInTime.lte = end;
            }
        }

        const entries = await prisma.clockEntry.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: {
                clockInTime: 'desc'
            },
            take: 100 // Limit results
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error('Error fetching clock entries:', error);
        return NextResponse.json(
            { error: 'Failed to fetch clock entries' },
            { status: 500 }
        );
    }
}
