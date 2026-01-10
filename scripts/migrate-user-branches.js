const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateUserBranches() {
    console.log('Starting user-branch data migration...');

    try {
        // Find all users with a branchId (except super admins)
        const usersWithBranch = await prisma.user.findMany({
            where: {
                AND: [
                    { branchId: { not: null } },
                    { isSuperAdmin: false }
                ]
            },
            select: {
                id: true,
                branchId: true,
                name: true
            }
        });

        console.log(`Found ${usersWithBranch.length} users with branch assignments`);

        // Create UserBranch records for each user
        for (const user of usersWithBranch) {
            // Check if UserBranch record already exists
            const existing = await prisma.userBranch.findUnique({
                where: {
                    userId_branchId: {
                        userId: user.id,
                        branchId: user.branchId
                    }
                }
            });

            if (!existing) {
                await prisma.userBranch.create({
                    data: {
                        userId: user.id,
                        branchId: user.branchId
                    }
                });
                console.log(`✓ Created UserBranch for ${user.name}`);
            } else {
                console.log(`- UserBranch already exists for ${user.name}`);
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log(`Migrated ${usersWithBranch.length} user-branch assignments`);

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateUserBranches();
