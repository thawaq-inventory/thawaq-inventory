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
            return NextResponse.json({ error: 'Unauthorized: No auth token' }, { status: 401 });
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to update branch: ${errorMessage}` },
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
            return NextResponse.json({ error: 'Unauthorized: No auth token' }, { status: 401 });
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to fetch branch: ${errorMessage}` },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const authToken = cookieStore.get('auth_token');
        const { id } = await params;

        if (!authToken) {
            return NextResponse.json({ error: 'Unauthorized: No auth token' }, { status: 401 });
        }

        // Verify user is super admin
        const sessionData = await prisma.session.findUnique({
            where: { token: authToken.value },
            include: { user: true },
        });

        if (!sessionData?.user.isSuperAdmin) {
            return NextResponse.json(
                { error: 'Only super admins can delete branches' },
                { status: 403 }
            );
        }

        // Check if branch has associated data
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

        // Prevent deletion if branch has associated records
        const totalAssociated = branch._count.users + branch._count.products + branch._count.shifts;
        if (totalAssociated > 0) {
            return NextResponse.json(
                {
                    error: `Cannot delete branch: It has ${branch._count.users} users, ${branch._count.products} products, and ${branch._count.shifts} shifts associated. Please reassign or delete these first.`
                },
                { status: 400 }
            );
        }

        // Delete branch
        await prisma.branch.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
    } catch (error) {
        console.error('Error deleting branch:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to delete branch: ${errorMessage}` },
            { status: 500 }
        );
    }
}
