
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Chart of Accounts...');

    const accounts = [
        // ASSETS (1000-1999)
        { code: '1000', name: 'Cash on Hand', type: 'ASSET', description: 'Physical cash in registers/safe' },
        { code: '1200', name: 'Inventory Asset - Food', type: 'ASSET', description: 'Value of food stock' },
        { code: '1210', name: 'Inventory Asset - Beverage', type: 'ASSET', description: 'Value of beverage stock' },

        // LIABILITIES (2000-2999)
        { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', description: 'Owed to suppliers' },
        { code: '2100', name: 'Sales Tax Payable', type: 'LIABILITY', description: 'Tax collected from customers' },

        // REVENUE (4000-4999)
        { code: '4000', name: 'Sales - Food', type: 'REVENUE', description: 'Income from food sales' },
        { code: '4100', name: 'Sales - Beverage', type: 'REVENUE', description: 'Income from beverage sales' },

        // COST OF GOODS SOLD (5000-5999)
        { code: '5000', name: 'COGS - Food', type: 'EXPENSE', description: 'Cost of food sold' },
        { code: '5100', name: 'COGS - Beverage', type: 'EXPENSE', description: 'Cost of beverages sold' },

        // EXPENSES (6000-6999)
        { code: '6000', name: 'Wastage & Spoilage', type: 'EXPENSE', description: 'Inventory loss' },
        { code: '6010', name: 'Employee Benefits (Staff Meals)', type: 'EXPENSE', description: 'Cost of staff meals' },
        { code: '6020', name: 'Inventory Shrinkage', type: 'EXPENSE', description: 'Unexplained inventory loss' },
        { code: '6100', name: 'Rent Expense', type: 'EXPENSE', description: 'Property rent' },
        { code: '6200', name: 'Utilities', type: 'EXPENSE', description: 'Water, electricity, gas' },
        { code: '6300', name: 'Salaries & Wages', type: 'EXPENSE', description: 'Employee payroll' },
    ];

    for (const acc of accounts) {
        await prisma.account.upsert({
            where: { code: acc.code },
            update: {
                name: acc.name,
                type: acc.type,
                description: acc.description
            },
            create: {
                code: acc.code,
                name: acc.name,
                type: acc.type,
                description: acc.description
            }
        });
    }

    console.log('Accounts seeded.');

    // Default Mappings
    const mappings = [
        { key: 'INVENTORY_ASSET_DEFAULT', code: '1200', desc: 'Default Inventory Asset Account' },
        { key: 'COGS_DEFAULT', code: '5000', desc: 'Default Cost of Goods Sold' },
        { key: 'WASTE_EXPENSE', code: '6000', desc: 'General Wastage Account' },
        { key: 'STAFF_MEAL_EXPENSE', code: '6010', desc: 'Account for Staff Meals' },
        { key: 'SALES_DEFAULT', code: '4000', desc: 'Default Sales Revenue Account' },
        { key: 'INVENTORY_ADJUSTMENT', code: '6020', desc: 'Shrinkage/Overage Account' },
        { key: 'ACCOUNTS_PAYABLE', code: '2000', desc: 'Default AP Account' }
    ];

    console.log('Seeding Mappings...');

    for (const m of mappings) {
        const account = await prisma.account.findUnique({ where: { code: m.code } });
        if (account) {
            await prisma.accountingMapping.upsert({
                where: { eventKey: m.key },
                update: { accountId: account.id, description: m.desc },
                create: {
                    eventKey: m.key,
                    accountId: account.id,
                    description: m.desc
                }
            });
        }
    }

    console.log('Mappings seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
