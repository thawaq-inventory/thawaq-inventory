const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function makeSuperAdmin() {
    const username = process.argv[2];

    if (!username) {
        console.log('❌ Usage: node scripts/make-super-admin.js <username>');
        console.log('\nExample: node scripts/make-super-admin.js daniah');
        process.exit(1);
    }

    try {
        console.log(`🔍 Looking for user: ${username}...\n`);

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            console.log(`❌ User "${username}" not found!\n`);
            console.log('Run: node scripts/list-users.js to see all users');
            process.exit(1);
        }

        console.log(`Found: ${user.name} (@${user.username})`);
        console.log(`Current role: ${user.role}`);
        console.log(`Current super admin status: ${user.isSuperAdmin}\n`);

        // Update user
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                role: 'ADMIN', // Promote to admin if not already
                isSuperAdmin: true,
                branchId: null, // Super admins don't belong to a specific branch
            },
        });

        console.log('✅ Success!\n');
        console.log(`${updated.name} is now:`);
        console.log(`   Role: ${updated.role}`);
        console.log(`   Super Admin: ${updated.isSuperAdmin}`);
        console.log(`   Branch: None (can manage all branches)\n`);
        console.log('════════════════════════════════════════');
        console.log('✅ You can now access branch management!');
        console.log('════════════════════════════════════════');
        console.log('\nNext steps:');
        console.log('1. Refresh your browser (or log out and log back in)');
        console.log('2. Navigate to /admin/branches');
        console.log('3. Create your first branch!');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

makeSuperAdmin()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
