import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');
        const { id } = await params;

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
                { error: 'Only super admins can update branches' },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Update branch
        const branch = await prisma.branch.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(branch);
    } catch (error) {
        console.error('Error updating branch:', error);
        return NextResponse.json(
            { error: 'Failed to update branch' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');
        const { id } = await params;

        if (!authToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const branch = await prisma.branch.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        products: true,
                        shifts: true,
                    },
                },
            },
        });

        if (!branch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json(branch);
    } catch (error) {
        console.error('Error fetching branch:', error);
        return NextResponse.json(
            { error: 'Failed to fetch branch' },
            { status: 500 }
        );
    }
}
