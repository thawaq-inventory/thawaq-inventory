
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Master Seed...');

    // 1. Ensure Core Branches Exist (The 4 Pillars)
    const branches = [
        { code: 'HQ', name: 'Al Thawaq HQ', type: 'HQ' },
        { code: 'CK', name: 'Central Kitchen', type: 'CENTRAL_KITCHEN' },
        { code: 'SW', name: 'Sweifieh', type: 'RESTAURANT' },
        { code: 'KH', name: 'Khalda', type: 'RESTAURANT' },
    ];

    for (const b of branches) {
        await prisma.branch.upsert({
            where: { code: b.code },
            update: { type: b.type }, // Ensure type is correct even if exists
            create: {
                name: b.name,
                code: b.code,
                type: b.type,
                address: 'Amman, Jordan',
                phone: '000-000-0000',
                isActive: true
            }
        });
        console.log(`   ✅ Branch: ${b.name} (${b.type})`);
    }

    // 2. Ensure Super Admin Exists
    const hq = await prisma.branch.findUnique({ where: { code: 'HQ' } });

    if (hq) {
        const adminEmail = 'admin@althawaq.com';
        const defaultPassword = 'admin'; // Change immediately in production
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const admin = await prisma.user.upsert({
            where: { username: adminEmail }, // Using email as username for now or specific username
            update: {
                isSuperAdmin: true,
                role: 'ADMIN',
                branchId: hq.id // Linked to HQ
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
        console.log(`   ✅ Admin User: ${admin.username} (Linked to HQ)`);
    }

    console.log('✅ Master Seed Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
