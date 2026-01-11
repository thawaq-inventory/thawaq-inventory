
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        // 1. Create Main Branch
        const branch = await prisma.branch.upsert({
            where: { code: 'MAIN' },
            update: {},
            create: {
                name: 'Main Branch',
                code: 'MAIN',
            },
        });

        // 2. Create Admin User
        const hashedPassword = await hash('admin123', 10);
        const admin = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                pinCode: '0000', // Set default PIN for admin
                branch: {
                    connect: { id: branch.id }
                }
            },
            create: {
                name: 'Admin',
                username: 'admin',
                password: hashedPassword,
                role: 'ADMIN',
                pinCode: '0000', // Set default PIN for admin
                branch: {
                    connect: { id: branch.id },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Admin seeded',
            username: 'admin',
            password: 'admin123',
            pinCode: '0000'
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ success: false, error: 'Failed to seed' }, { status: 500 });
    }
}
