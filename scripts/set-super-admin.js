const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndSetSuperAdmin() {
    console.log('🔍 Checking user permissions...\n');

    try {
        // Find all admin users
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                username: true,
                name: true,
                role: true,
                isSuperAdmin: true,
                branchId: true,
            },
        });

        console.log(`Found ${admins.length} admin user(s):\n`);
        admins.forEach((admin, i) => {
            console.log(`${i + 1}. ${admin.name} (@${admin.username})`);
            console.log(`   Super Admin: ${admin.isSuperAdmin ? '✅ YES' : '❌ NO'}`);
            console.log(`   Branch ID: ${admin.branchId || 'None (Super Admin)'}\n`);
        });

        // Set all admins as super admins if not already
        const nonSuperAdmins = admins.filter(a => !a.isSuperAdmin);

        if (nonSuperAdmins.length > 0) {
            console.log(`\n📝 Setting ${nonSuperAdmins.length} admin(s) as super admin...\n`);

            for (const admin of nonSuperAdmins) {
                await prisma.user.update({
                    where: { id: admin.id },
                    data: {
                        isSuperAdmin: true,
                        branchId: null, // Super admins don't belong to a specific branch
                    },
                });
                console.log(`✅ Updated ${admin.username} to super admin`);
            }

            console.log('\n✅ All admin users are now super admins!');
        } else {
            console.log('✅ All admin users already have super admin access!');
        }

        console.log('\n════════════════════════════════════════');
        console.log('✅ Super admin check complete!');
        console.log('════════════════════════════════════════');
        console.log('\nYou can now:');
        console.log('1. Refresh your browser');
        console.log('2. Try creating a branch again');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

checkAndSetSuperAdmin()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
