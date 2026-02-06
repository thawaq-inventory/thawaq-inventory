const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ACCOUNTS = [
    { code: '2300', name: 'Loan Payable - Mother', type: 'LIABILITY', description: 'Loan owed to Mother' },
    { code: '1500', name: 'Security Deposits', type: 'ASSET', description: 'Deposits paid for rent/services' },
    { code: '1400', name: 'Prepaid Rent', type: 'ASSET', description: 'Rent paid in advance' }
];

async function main() {
    console.log("🌱 FORCE Seeding Accrual Accounts (JS)...");

    for (const acc of ACCOUNTS) {
        try {
            const existing = await prisma.account.findFirst({
                where: { OR: [{ code: acc.code }, { name: acc.name }] }
            });

            if (existing) {
                console.log(`   🔸 [SKIP] ${acc.name} (${acc.code}) already exists.`);
            } else {
                await prisma.account.create({
                    data: {
                        code: acc.code,
                        name: acc.name,
                        type: acc.type,
                        description: acc.description
                    }
                });
                console.log(`   ✅ [CREATED] ${acc.name} (${acc.code})`);
            }
        } catch (e) {
            console.error(`   ❌ [ERROR] Failed ${acc.name}:`, e.message);
        }
    }
}

main()
    .catch((e) => {
        console.error("❌ Error seeding:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
