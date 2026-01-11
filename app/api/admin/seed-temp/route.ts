import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

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
                currency: 'JOD',
            },
        });

        // 2. Create Admin User
        const hashedPassword = await hash('admin123', 10);
        const admin = await prisma.user.upsert({
            where: { email: 'admin@thawaq.com' },
            update: {
                password: hashedPassword, // Reset password if exists
                role: 'ADMIN',
                branches: {
                    connect: { id: branch.id }
                }
            },
            create: {
                name: 'Admin',
                email: 'admin@thawaq.com',
                password: hashedPassword,
                role: 'ADMIN',
                branches: {
                    connect: { id: branch.id },
                },
            },
        });

        return NextResponse.json({ success: true, message: 'Admin seeded', email: 'admin@thawaq.com', password: 'admin123' });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ success: false, error: 'Failed to seed' }, { status: 500 });
    }
}
