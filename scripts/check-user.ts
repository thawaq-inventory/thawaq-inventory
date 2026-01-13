
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const username = 'yanalkitchen';
    console.log(`Checking user: ${username}`);

    const user = await prisma.user.findUnique({
        where: { username },
        include: {
            branch: true,
            userBranches: {
                include: { branch: true }
            }
        }
    });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log('User Details:');
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Legacy Branch (branchId): ${user.branchId}`);
    console.log(`Legacy Branch Name: ${user.branch?.name}`);

    console.log('--- UserBranches (M2M) ---');
    if (user.userBranches.length === 0) {
        console.log('No UserBranch records found.');
    } else {
        user.userBranches.forEach((ub: any) => {
            console.log(`- Branch: ${ub.branch.name} (${ub.branchId})`);
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
