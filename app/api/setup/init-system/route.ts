
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function GET() {
    try {
        console.log('🔄 Manual System Initialization Triggered...');

        // 1. Create Branches
        const branches = [
            { code: 'HQ', name: 'Al Thawaq HQ', type: 'HQ' },
            { code: 'CK', name: 'Central Kitchen', type: 'CENTRAL_KITCHEN' },
            { code: 'SW', name: 'Sweifieh', type: 'RESTAURANT' },
            { code: 'KH', name: 'Khalda', type: 'RESTAURANT' },
        ];

        for (const b of branches) {
            await prisma.branch.upsert({
                where: { code: b.code },
                update: { type: b.type },
                create: {
                    name: b.name,
                    code: b.code,
                    type: b.type,
                    address: 'Amman, Jordan',
                    phone: '000-000-0000',
                    isActive: true
                }
            });
        }

        // 2. Create Admin
        const hq = await prisma.branch.findUnique({ where: { code: 'HQ' } });
        if (!hq) throw new Error("HQ Branch failed to create");

        const adminEmail = 'admin@althawaq.com';
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.upsert({
            where: { username: adminEmail },
            update: {
                isSuperAdmin: true,
                role: 'ADMIN',
                branchId: hq.id,
                password: hashedPassword // FORCE RESET PASSWORD
            },
            create: {
                name: 'Super Admin',
                username: adminEmail,
                password: hashedPassword,
                pinCode: '0000',
                role: 'ADMIN',
                isSuperAdmin: true,
                branchId: hq.id,
                isActive: true
            }
        });

        return NextResponse.json({
            status: 'SUCCESS',
            message: 'System Initialized. You can now login.',
            credentials: {
                username: adminEmail,
                password: 'admin'
            },
            branches: branches.map(b => b.name)
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
