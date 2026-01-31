const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Create Admin User
    const user = await prisma.user.upsert({
        where: { username: 'admin_temp' },
        update: { role: 'ADMIN', pinCode: '9999' },
        create: {
            name: 'Temp Admin',
            username: 'admin_temp',
            password: 'hashed_placeholder_will_use_pin',
            pinCode: '9999',
            role: 'ADMIN',
            isActive: true
        }
    });
    console.log('✅ Admin user ready: admin_temp / 9999');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
