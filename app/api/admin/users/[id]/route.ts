import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// GET /api/admin/users/[id] - Get single user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                isActive: true,
                createdAt: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return updateUser(request, params);
}

// PATCH /api/admin/users/[id] - Partial update user (including PIN)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return updateUser(request, params);
}

async function updateUser(
    request: NextRequest,
    params: Promise<{ id: string }>
) {
    try {
        const { id } = await params;
        const { name, password, role, isActive, pinCode, branchIds, cliqAlias, hourlyRate, isSuperAdmin } = await request.json();

        const updateData: any = {};

        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (pinCode !== undefined) updateData.pinCode = pinCode;
        if (cliqAlias !== undefined) updateData.cliqAlias = cliqAlias;
        if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
        if (isSuperAdmin !== undefined) updateData.isSuperAdmin = isSuperAdmin;

        // Hash new password if provided
        if (password) {
            if (password.length < 6) {
                return NextResponse.json(
                    { error: 'Password must be at least 6 characters' },
                    { status: 400 }
                );
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Update user
        await prisma.user.update({
            where: { id },
            data: updateData
        });

        // Update branch assignments if branchIds provided
        if (branchIds !== undefined && Array.isArray(branchIds)) {
            // Delete existing branch assignments
            await prisma.userBranch.deleteMany({
                where: { userId: id }
            });

            // Create new branch assignments
            if (branchIds.length > 0) {
                await prisma.userBranch.createMany({
                    data: branchIds.map((branchId: string) => ({
                        userId: id,
                        branchId
                    }))
                });
            }
        }

        // Fetch updated user with all relations
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                isActive: true,
                isSuperAdmin: true,
                pinCode: true,
                cliqAlias: true,
                hourlyRate: true,
                branchId: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                userBranches: {
                    include: {
                        branch: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                },
                createdAt: true
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/users/[id] - Deactivate or permanently delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const permanent = searchParams.get('permanent') === 'true';

        if (permanent) {
            // First delete related UserBranch records
            await prisma.userBranch.deleteMany({
                where: { userId: id }
            });

            // Delete clock entries
            await prisma.clockEntry.deleteMany({
                where: { userId: id }
            });

            // Then permanently delete the user
            await prisma.user.delete({
                where: { id }
            });

            return NextResponse.json({ success: true, message: 'User permanently deleted' });
        } else {
            // Soft delete - just deactivate
            await prisma.user.update({
                where: { id },
                data: { isActive: false }
            });

            return NextResponse.json({ success: true, message: 'User deactivated' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
