
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REQUIRED_ACCOUNTS = [
    { name: 'Food Sales', type: 'REVENUE', code: '4001', description: 'Revenue from food and beverage sales' },
    { name: 'VAT Payable', type: 'LIABILITY', code: '2100', description: 'VAT collected from sales (16%)' },
    { name: 'Merchant Fees', type: 'EXPENSE', code: '6100', description: 'Transaction fees (Visa, Delivery Apps)' },
    { name: 'COGS', type: 'EXPENSE', code: '5001', description: 'Cost of Goods Sold' },
    { name: 'Inventory Asset', type: 'ASSET', code: '1100', description: 'Value of stock on hand' },
    { name: 'Tips Payable', type: 'LIABILITY', code: '2101', description: 'Tips collected to be paid to staff' },
    { name: 'Cash Clearing', type: 'ASSET', code: '1005', description: 'Temporary holding for undeposited funds' }
];

async function setupAccounts() {
    console.log("--- Starting Chart of Accounts Audit ---");

    for (const acc of REQUIRED_ACCOUNTS) {
        // Check by Name OR Code to avoid duplicates
        const existing = await prisma.account.findFirst({
            where: {
                OR: [
                    { name: acc.name },
                    { code: acc.code }
                ]
            }
        });

        if (existing) {
            console.log(`✅ [EXISTS] ${acc.name} (${existing.code}) - ${existing.type}`);
        } else {
            console.log(`⚠️ [MISSING] ${acc.name}... Creating.`);
            try {
                await prisma.account.create({
                    data: {
                        name: acc.name,
                        type: acc.type,
                        code: acc.code,
                        description: acc.description
                    }
                });
                console.log(`   ✨ Created ${acc.name}`);
            } catch (e: any) {
                console.error(`   ❌ Failed to create ${acc.name}: ${e.message}`);
            }
        }
    }
    console.log("--- Audit Complete ---");
}

setupAccounts()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
