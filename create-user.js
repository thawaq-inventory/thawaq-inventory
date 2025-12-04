const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function createDefaultUser() {
    try {
        const user = await prisma.user.upsert({
            where: { id: '1' },
            update: {},
            create: {
                id: '1',
                username: 'employee',
                password: '$2b$10$5I8g5YXkdqM.JvU7gfLG4u1FqK14eE9cWe/gj1uH3z.sYXB9zQd5K', // password: 'employee123'
                name: 'Default Employee',
                role: 'employee',
            },
        });
        console.log('✅ Default user created:', user);
    } catch (error) {
        console.error('Error creating default user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createDefaultUser();
