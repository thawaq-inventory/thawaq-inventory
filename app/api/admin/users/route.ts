import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { getBranchFilterForAPI } from '@/lib/branchFilter';

const prisma = new PrismaClient();

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
    try {
        // Get branch filter from cookies
        const branchFilter = await getBranchFilterForAPI();

        const users = await prisma.user.findMany({
            where: branchFilter,
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                isActive: true,
                isSuperAdmin: true,
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
                cliqAlias: true,
                hourlyRate: true,
                pinCode: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
    try {
        const { username, password, name, role, branchIds, pinCode, cliqAlias, hourlyRate, isSuperAdmin } = await request.json();

        // Validation
        if (!username || !password || !name) {
            return NextResponse.json(
                { error: 'Username, password, and name are required' },
                { status: 400 }
            );
        }

        // Validate username format
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return NextResponse.json(
                { error: 'Username must be 3-20 alphanumeric characters' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existing = await prisma.user.findUnique({
            where: { username: username.toLowerCase() }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username: username.toLowerCase(),
                password: hashedPassword,
                name,
                role: role || 'EMPLOYEE',
                isActive: true,
                pinCode: pinCode || null,
                cliqAlias: cliqAlias || null,
                hourlyRate: hourlyRate || 5.0,
                isSuperAdmin: isSuperAdmin || false,
            }
        });

        // Create UserBranch records if branchIds provided
        if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
            await prisma.userBranch.createMany({
                data: branchIds.map((branchId: string) => ({
                    userId: user.id,
                    branchId
                }))
            });
        }

        // Fetch complete user with branches
        const completeUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                isActive: true,
                isSuperAdmin: true,
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
                cliqAlias: true,
                hourlyRate: true,
                createdAt: true
            }
        });

        return NextResponse.json(completeUser, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        );
    }
}
