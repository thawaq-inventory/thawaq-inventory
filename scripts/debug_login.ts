
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const username = 'admin@althawaq.com';
    const password = 'admin';

    console.log(`🔍 Debugging Login for: ${username}`);

    const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
        include: { branch: true }
    });

    if (!user) {
        console.error('❌ User NOT FOUND in database.');
        const allUsers = await prisma.user.findMany();
        console.log('Available users:', allUsers.map(u => u.username));
        return;
    }

    console.log(`✅ User Found: ${user.username} (ID: ${user.id})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Branch: ${user.branch?.name || 'None'}`);
    console.log(`   Stored Hash: ${user.password.substring(0, 10)}...`);

    const match = await bcrypt.compare(password, user.password);

    if (match) {
        console.log('✅ Password Match: SUCCESS');
    } else {
        console.error('❌ Password Match: FAILED');
        console.log('   Testing if hash is valid...');
        const newHash = await bcrypt.hash(password, 10);
        console.log(`   New Hash would be: ${newHash.substring(0, 10)}...`);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
