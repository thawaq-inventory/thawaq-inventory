const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function checkAndFixUsers() {
    try {
        console.log('📋 Checking current users...\n');

        const users = await prisma.user.findMany({
            where: { role: 'employee' },
            select: {
                id: true,
                name: true,
                username: true,
                pinCode: true,
                isActive: true
            }
        });

        console.log('Found employees:');
        users.forEach(user => {
            console.log(`- ${user.name} (${user.username}): PIN = ${user.pinCode || 'NOT SET'}, Active = ${user.isActive}`);
        });

        // Check if Daniah exists
        const daniah = users.find(u => u.name.toLowerCase().includes('daniah'));

        if (!daniah) {
            console.log('\n❌ Daniah not found! Creating...');
            const newUser = await prisma.user.create({
                data: {
                    name: 'Daniah',
                    username: 'daniah',
                    password: '$2b$10$5I8g5YXkdqM.JvU7gfLG4u1FqK14eE9cWe/gj1uH3z.sYXB9zQd5K', // "employee123"
                    role: 'employee',
                    pinCode: '1234',
                    isActive: true
                }
            });
            console.log('✅ Created Daniah:', newUser);
        } else {
            console.log('\n✅ Daniah exists!');
            if (daniah.pinCode !== '1234') {
                console.log(`⚠️  PIN is ${daniah.pinCode}, updating to 1234...`);
                await prisma.user.update({
                    where: { id: daniah.id },
                    data: { pinCode: '1234' }
                });
                console.log('✅ PIN updated!');
            }
        }

        // Update Yanal's PIN if needed
        const yanal = users.find(u => u.name.toLowerCase().includes('yanal'));
        if (yanal && yanal.pinCode !== '1234') {
            console.log(`⚠️  Yanal's PIN is ${yanal.pinCode}, updating to 1234...`);
            await prisma.user.update({
                where: { id: yanal.id },
                data: { pinCode: '1234' }
            });
            console.log('✅ Yanal PIN updated!');
        }

        console.log('\n✅ All done!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndFixUsers();
