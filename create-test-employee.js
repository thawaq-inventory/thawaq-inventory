
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Get the main branch
    const branch = await prisma.branch.findUnique({
        where: { code: 'MAIN' }
    });

    if (!branch) {
        console.error('Main branch not found!');
        return;
    }

    // 2. Create a test employee
    const employee = await prisma.user.upsert({
        where: { username: 'testemployee' },
        update: {
            pinCode: '9999',
            branchId: branch.id,
        },
        create: {
            name: 'Test Employee',
            username: 'testemployee',
            password: 'password123', // Not used for employee login, but required
            role: 'employee',
            pinCode: '9999',
            isActive: true,
            branchId: branch.id,
        },
    });

    console.log('Created/Updated test employee:', employee.name, 'with PIN 1234');
    console.log('Assigned to branch:', branch.name);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
