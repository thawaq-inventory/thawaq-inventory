const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createTestEmployee() {
    try {
        // Get the Main Branch
        const mainBranch = await prisma.branch.findFirst({
            where: { code: 'MAIN' }
        });

        if (!mainBranch) {
            console.log('❌ Main Branch not found. Please create a branch first.');
            return;
        }

        console.log('👤 Creating test employee...\n');

        // Create a test employee
        const hashedPassword = await bcrypt.hash('temp123', 10);

        const employee = await prisma.user.create({
            data: {
                name: 'Test Employee',
                username: 'test.employee',
                password: hashedPassword,
                pinCode: '1234',
                role: 'EMPLOYEE',
                isActive: true,
                branchId: mainBranch.id,
                cliqAlias: 'test@example.com', // Optional
                hourlyRate: 5.0,
            },
        });

        console.log('✅ Test employee created successfully!\n');
        console.log(`Name: ${employee.name}`);
        console.log(`Username: ${employee.username}`);
        console.log(`PIN: 1234`);
        console.log(`Branch: ${mainBranch.name} (${mainBranch.code})`);
        console.log(`\n✅ You should now see 1 employee in the employee management page!`);
        console.log(`\nEmployee can log in at /employee/login with PIN: 1234`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestEmployee();
