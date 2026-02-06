import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCOUNTS = [
    { code: '2300', name: 'Loan Payable - Mother', type: 'LIABILITY', description: 'Loan owed to Mother' },
    { code: '1500', name: 'Security Deposits', type: 'ASSET', description: 'Deposits paid for rent/services' },
    { code: '1400', name: 'Prepaid Rent', type: 'ASSET', description: 'Rent paid in advance' }
];

async function main() {
    console.log("🌱 FORCE Seeding Accrual Accounts...");

    for (const acc of ACCOUNTS) {
        // Try creating directly, ignoring unique constraint errors just in case, or upsert
        try {
            const result = await prisma.account.upsert({
                where: { code: acc.code },
                update: {},
                create: {
                    code: acc.code,
                    name: acc.name,
                    type: acc.type,
                    description: acc.description
                }
            });
            console.log(`   ✅ [ENSURED] ${result.name} (${result.code})`);
        } catch (e) {
            console.log(`   🔸 [ERROR] Could not ensure ${acc.name}: ${e}`);
        }
    }
}

main()
    .catch((e) => {
        console.error("❌ Error seeding accounts:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
