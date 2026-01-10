const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupDefaultBranch() {
    console.log('🏢 Setting up default branch for multi-branch system...\n');

    try {
        // Step 1: Create default branch
        console.log('Step 1: Creating default "Main Branch"...');
        const defaultBranch = await prisma.branch.create({
            data: {
                name: 'Main Branch',
                code: 'MAIN',
                address: null,
                phone: null,
                email: null,
                isActive: true,
            },
        });
        console.log(`✅ Default branch created: ${defaultBranch.name} (ID: ${defaultBranch.id})\n`);

        // Step 2: Assign all existing users to default branch
        console.log('Step 2: Migrating existing users...');
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            await prisma.$executeRaw`UPDATE User SET branchId = ${defaultBranch.id} WHERE branchId IS NULL`;
            console.log(`✅ Migrated ${userCount} users to Main Branch\n`);
        } else {
            console.log('ℹ️  No users to migrate\n');
        }

        // Step 3: Assign all existing products to default branch
        console.log('Step 3: Migrating existing products...');
        const productCount = await prisma.product.count();
        if (productCount > 0) {
            await prisma.$executeRaw`UPDATE Product SET branchId = ${defaultBranch.id} WHERE branchId IS NULL`;
            console.log(`✅ Migrated ${productCount} products to Main Branch\n`);
        } else {
            console.log('ℹ️  No products to migrate\n');
        }

        // Step 4: Assign all existing shifts to default branch
        console.log('Step 4: Migrating existing shifts...');
        const shiftCount = await prisma.shift.count();
        if (shiftCount > 0) {
            await prisma.$executeRaw`UPDATE Shift SET branchId = ${defaultBranch.id} WHERE branchId IS NULL`;
            console.log(`✅ Migrated ${shiftCount} shifts to Main Branch\n`);
        } else {
            console.log('ℹ️  No shifts to migrate\n');
        }

        // Step 5: Assign all existing locations to default branch
        console.log('Step 5: Migrating existing locations...');
        const locationCount = await prisma.location.count();
        if (locationCount > 0) {
            await prisma.$executeRaw`UPDATE Location SET branchId = ${defaultBranch.id} WHERE branchId IS NULL`;
            console.log(`✅ Migrated ${locationCount} locations to Main Branch\n`);
        } else {
            console.log('ℹ️  No locations to migrate\n');
        }

        // Step 6: Assign all existing inventory logs to default branch
        console.log('Step 6: Migrating existing inventory logs...');
        const logCount = await prisma.inventoryLog.count();
        if (logCount > 0) {
            await prisma.$executeRaw`UPDATE InventoryLog SET branchId = ${defaultBranch.id} WHERE branchId IS NULL`;
            console.log(`✅ Migrated ${logCount} inventory logs to Main Branch\n`);
        } else {
            console.log('ℹ️  No inventory logs to migrate\n');
        }

        // Step 7: Assign all existing waste logs to default branch
        console.log('Step 7: Migrating existing waste logs...');
        const wasteCount = await prisma.wasteLog.count();
        if (wasteCount > 0) {
            await prisma.$executeRaw`UPDATE WasteLog SET branchId = ${defaultBranch.id} WHERE branchId IS NULL`;
            console.log(`✅ Migrated ${wasteCount} waste logs to Main Branch\n`);
        } else {
            console.log('ℹ️  No waste logs to migrate\n');
        }

        // Step 8: Assign all existing expenses to default branch
        console.log('Step 8: Migrating existing expenses...');
        const expenseCount = await prisma.expense.count();
        if (expenseCount > 0) {
            await prisma.$executeRaw`UPDATE Expense SET branchId = ${defaultBranch.id} WHERE branchId IS NULL`;
            console.log(`✅ Migrated ${expenseCount} expenses to Main Branch\n`);
        } else {
            console.log('ℹ️  No expenses to migrate\n');
        }

        // Step 9: Assign all existing payroll transactions to default branch
        console.log('Step 9: Migrating existing payroll transactions...');
        const payrollCount = await prisma.payrollTransaction.count();
        if (payrollCount > 0) {
            await prisma.$executeRaw`UPDATE PayrollTransaction SET branchId = ${defaultBranch.id} WHERE branchId IS NULL`;
            console.log(`✅ Migrated ${payrollCount} payroll transactions to Main Branch\n`);
        } else {
            console.log('ℹ️  No payroll transactions to migrate\n');
        }

        // Step 10: Mark primary admin as super admin
        console.log('Step 10: Setting up super admin...');
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
            orderBy: { createdAt: 'asc' }, // Get the first admin created
        });

        if (adminUser) {
            await prisma.user.update({
                where: { id: adminUser.id },
                data: {
                    isSuperAdmin: true,
                    branchId: null // Super admins don't belong to a specific branch
                },
            });
            console.log(`✅ Set ${adminUser.username} as super admin\n`);
        } else {
            console.log('ℹ️  No admin user found\n');
        }

        console.log('════════════════════════════════════════════════════════');
        console.log('✅ Migration completed successfully!');
        console.log('════════════════════════════════════════════════════════');
        console.log(`\nDefault Branch: ${defaultBranch.name}`);
        console.log(`Branch Code: ${defaultBranch.code}`);
        console.log(`Branch ID: ${defaultBranch.id}`);
        if (adminUser) {
            console.log(`\nSuper Admin: ${adminUser.username}`);
        }
        console.log('\nYou can now create additional branches from the admin dashboard!');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

setupDefaultBranch()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
