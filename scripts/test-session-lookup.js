const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSessionLookup() {
    const token = 'e6c86a24880b1013049e562fde97914fc192b9b08ab34967d643b043921e3f73';

    const sessionData = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
    });

    console.log('Full session data:');
    console.log(JSON.stringify(sessionData, null, 2));

    console.log('\nUser fields:');
    console.log(`- isSuperAdmin: ${sessionData?.user?.isSuperAdmin}`);
    console.log(`- Type: ${typeof sessionData?.user?.isSuperAdmin}`);
    console.log(`- role: ${sessionData?.user?.role}`);

    await prisma.$disconnect();
}

testSessionLookup();
