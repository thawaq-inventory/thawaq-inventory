
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Find or Create 'admin' user
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: { password: hashedPassword, role: 'ADMIN', isActive: true, isSuperAdmin: true },
        create: {
            username: 'admin',
            password: hashedPassword,
            name: 'Super Admin',
            role: 'ADMIN',
            isSuperAdmin: true
        }
    });

    console.log(`✅ Admin User Reset: ${user.username} / admin`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
