const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllUsers() {
    console.log('👥 Listing all users...\n');

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                isSuperAdmin: true,
                branchId: true,
                branch: {
                    select: {
                        name: true,
                        code: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        console.log(`Total users: ${users.length}\n`);
        console.log('════════════════════════════════════════');

        users.forEach((user, i) => {
            console.log(`\n${i + 1}. ${user.name}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Super Admin: ${user.isSuperAdmin ? '✅ YES' : '❌ NO'}`);
            console.log(`   Branch: ${user.branch ? `${user.branch.name} (${user.branch.code})` : 'None'}`);
            console.log(`   Branch ID: ${user.branchId || 'null'}`);
        });

        console.log('\n════════════════════════════════════════');
        console.log('\n💡 To set a user as super admin, run:');
        console.log('   node scripts/make-super-admin.js <username>');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

listAllUsers()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
