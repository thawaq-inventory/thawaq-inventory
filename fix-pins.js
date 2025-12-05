const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
});

async function fixPins() {
    try {
        console.log('🔧 Fixing employee PINs...\n');

        // Update Yanal to PIN 1234
        const yanal = await prisma.user.findFirst({
            where: { name: { contains: 'Yanal', mode: 'insensitive' } }
        });

        if (yanal) {
            await prisma.user.update({
                where: { id: yanal.id },
                data: { pinCode: '1234' }
            });
            console.log('✅ Yanal PIN set to: 1234');
        }

        // Update Daniah to PIN 5678
        const daniah = await prisma.user.findFirst({
            where: { name: { contains: 'Daniah', mode: 'insensitive' } }
        });

        if (daniah) {
            await prisma.user.update({
                where: { id: daniah.id },
                data: { pinCode: '5678' }
            });
            console.log('✅ Daniah PIN set to: 5678');
        }

        console.log('\n📋 Current setup:');
        console.log('- Yanal: PIN 1234');
        console.log('- Daniah: PIN 5678');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixPins();
