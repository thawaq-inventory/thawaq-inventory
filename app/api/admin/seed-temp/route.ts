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
                // currency: 'JOD', // Removed: Not in schema, will default or be handled by logic
            },
        });

        // 2. Create Admin User
        const hashedPassword = await hash('admin123', 10);
        const admin = await prisma.user.upsert({
            where: { username: 'admin' }, // Use username instead of email
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                isSuperAdmin: true, // Grant Super Admin privs
                branch: {
                    connect: { id: branch.id }
                }
            },
            create: {
                name: 'Admin',
                username: 'admin', // Use username
                password: hashedPassword,
                role: 'ADMIN',
                isSuperAdmin: true, // Grant Super Admin privs
                branch: {
                    connect: { id: branch.id },
                },
            },
        });

        return NextResponse.json({ success: true, message: 'Admin seeded', username: 'admin', password: 'admin123' });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ success: false, error: 'Failed to seed' }, { status: 500 });
    }
}
