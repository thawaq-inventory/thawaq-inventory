
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCOUNTS = [
    // 1. Assets (1000-1999)
    { code: '1010', name: 'Cash on Hand', type: 'ASSET', description: 'Physical cash in registers/safe' },
    { code: '1015', name: 'Petty Cash', type: 'ASSET', description: 'Small funds for daily expenses' },
    { code: '1020', name: 'Bank Account - Arab Bank', type: 'ASSET', description: 'Main business bank account' },
    { code: '1005', name: 'Cash Clearing', type: 'ASSET', description: 'Temporary holding for undeposited funds' },
    { code: '1100', name: 'Inventory Asset', type: 'ASSET', description: 'Value of raw materials and stock' },
    { code: '1200', name: 'Fixed Assets', type: 'ASSET', description: 'Equipment, Furniture, Machinery' },

    // 2. Liabilities (2000-2999)
    { code: '2010', name: 'Accounts Payable', type: 'LIABILITY', description: 'Money owed to suppliers (Vendors)' },
    { code: '2020', name: 'VAT Payable', type: 'LIABILITY', description: '16% Sales Tax collected ' },
    { code: '2100', name: 'Tips Payable', type: 'LIABILITY', description: 'Tips collected for later distribution' },
    { code: '2200', name: 'Salaries Payable', type: 'LIABILITY', description: 'Accrued staff wages' },

    // 3. Equity (3000-3999)
    { code: '3010', name: 'Retained Earnings', type: 'EQUITY', description: 'Accumulated profits/losses' },
    { code: '3020', name: 'Opening Balance Equity', type: 'EQUITY', description: 'Initial import balance adjustments' },
    { code: '3030', name: 'Owner Investment', type: 'EQUITY', description: 'Capital injected by owners' },
    { code: '3040', name: 'Owner Draw', type: 'EQUITY', description: 'Capital withdrawn by owners' },

    // 4. Revenue (4000-4999)
    { code: '4001', name: 'Food Sales', type: 'REVENUE', description: 'Revenue from food/beverage items' },
    { code: '4010', name: 'Sales Revenue', type: 'REVENUE', description: 'General sales revenue' },
    { code: '4020', name: 'Delivery Income', type: 'REVENUE', description: 'Delivery fees charged to customers' },
    { code: '4030', name: 'Service Revenue', type: 'REVENUE', description: 'Service charges/catering fees' },

    // 5. Expenses (5000-6999)
    // 5000-5999: COGS & Direct Costs
    { code: '5001', name: 'COGS', type: 'EXPENSE', description: 'Cost of Goods Sold (Materials used)' },
    { code: '5010', name: 'Wastage Expense', type: 'EXPENSE', description: 'Cost of spoiled/damaged inventory' },
    { code: '5020', name: 'Inventory Shrinkage', type: 'EXPENSE', description: 'Unexplained inventory loss' },
    { code: '5030', name: 'Packaging Expense', type: 'EXPENSE', description: 'Cost of disposables/packaging' },

    // 6000-6999: Operating Expenses
    { code: '6010', name: 'Rent Expense', type: 'EXPENSE', description: 'Restaurant premises rent' },
    { code: '6020', name: 'Salaries & Wages', type: 'EXPENSE', description: 'Staff payroll expense' },
    { code: '6030', name: 'Utilities', type: 'EXPENSE', description: 'Water, Electricity, Internet' },
    { code: '6040', name: 'Maintenance', type: 'EXPENSE', description: 'Repairs and upkeep' },
    { code: '6050', name: 'Marketing', type: 'EXPENSE', description: 'Ads, Social Media, Promos' },
    { code: '6100', name: 'Merchant Fees', type: 'EXPENSE', description: 'Credit Card/Delivery App Commissions' },
    { code: '6200', name: 'Office Supplies', type: 'EXPENSE', description: 'Stationery and admin supplies' },
    { code: '6300', name: 'Professional Fees', type: 'EXPENSE', description: 'Legal, Accounting, Consulting' }
];

async function main() {
    console.log("🌱 Seeding Chart of Accounts...");

    let createdCount = 0;
    let skippedCount = 0;

    for (const acc of ACCOUNTS) {
        // Check if account code OR name exists
        const existing = await prisma.account.findFirst({
            where: {
                OR: [
                    { code: acc.code },
                    { name: acc.name }
                ]
            }
        });

        if (existing) {
            console.log(`   🔸 [SKIP] ${acc.name} (${acc.code}) already exists.`);
            skippedCount++;
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
            createdCount++;
        }
    }

    console.log(`\n🎉 Seed Complete! Created: ${createdCount}, Skipped: ${skippedCount}`);
}

main()
    .catch((e) => {
        console.error("❌ Error seeding accounts:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
