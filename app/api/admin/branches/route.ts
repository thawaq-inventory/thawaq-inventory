import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        if (!authToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user session exists
        const sessionData = await prisma.session.findUnique({
            where: { token: authToken.value },
            include: { user: true },
        });

        if (!sessionData) {
            return NextResponse.json({ error: 'Session not found' }, { status: 401 });
        }

        // Allow admins, super admins, and employees to view branches
        // (employees need to see branches for forms, but only admins can manage)
        const userRole = sessionData.user.role?.toUpperCase();
        const isAdmin = userRole === 'ADMIN' || sessionData.user.isSuperAdmin;

        // All authenticated users can view branches
        // (for employee assignment, clock-in, etc.)

        // Fetch all branches with counts
        const branches = await prisma.branch.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        products: true,
                        shifts: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json(branches);
    } catch (error) {
        console.error('Error fetching branches:', error);
        return NextResponse.json(
            { error: 'Failed to fetch branches' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');

        if (!authToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is super admin
        const sessionData = await prisma.session.findUnique({
            where: { token: authToken.value },
            include: { user: true },
        });

        if (!sessionData?.user.isSuperAdmin) {
            return NextResponse.json(
                { error: 'Only super admins can create branches' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, code, address, phone, email } = body;

        // Validate required fields
        if (!name || !code) {
            return NextResponse.json(
                { error: 'Name and code are required' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.branch.findUnique({
            where: { code },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Branch code already exists' },
                { status: 400 }
            );
        }

        // Create branch
        const branch = await prisma.branch.create({
            data: {
                name,
                code: code.toUpperCase(),
                address,
                phone,
                email,
                isActive: true,
            },
        });

        return NextResponse.json(branch, { status: 201 });
    } catch (error) {
        console.error('Error creating branch:', error);
        return NextResponse.json(
            { error: 'Failed to create branch' },
            { status: 500 }
        );
    }
}
