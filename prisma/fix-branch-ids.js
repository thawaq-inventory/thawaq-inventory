const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get main branch
    const mainBranch = await prisma.branch.findFirst({ where: { code: 'MAIN' } });
    if (!mainBranch) {
        console.log('No main branch found!');
        return;
    }

    console.log('Found Main Branch:', mainBranch.id);

    // Update all users without branchId to use main branch
    const result = await prisma.user.updateMany({
        where: { branchId: null },
        data: { branchId: mainBranch.id }
    });

    console.log('✅ Updated', result.count, 'users to have branchId set to Main Branch');

    // Verify
    const users = await prisma.user.findMany({
        select: { name: true, branchId: true }
    });
    users.forEach(u => console.log('   -', u.name, ':', u.branchId ? '✓ has branch' : '✗ no branch'));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
