const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPLData() {
    console.log('🌱 Seeding P&L Data for Jan 2026...');

    // 1. Ensure Accounts Exist
    const accountsToCheck = [
        { name: 'Food Sales', type: 'REVENUE', code: '4001' },
        { name: 'COGS', type: 'EXPENSE', code: '5001' },
        { name: 'Rent Expense', type: 'EXPENSE', code: '6200' },
        { name: 'Cash', type: 'ASSET', code: '1001' },
        { name: 'Inventory Asset', type: 'ASSET', code: '1100' }
    ];

    const accountMap = {};

    for (const acc of accountsToCheck) {
        let account = await prisma.account.findFirst({
            where: { code: acc.code }
        });

        if (!account) {
            console.log(`Creating account: ${acc.name}`);
            account = await prisma.account.create({
                data: {
                    name: acc.name,
                    type: acc.type,
                    code: acc.code,
                    description: `Test ${acc.name} Account`
                }
            });
        }
        accountMap[acc.code] = account.id;
    }

    // 2. Create Journal Entries

    // Revenue Entry: Sales of 5000 JOD
    await prisma.journalEntry.create({
        data: {
            date: new Date('2026-01-15T12:00:00Z'),
            description: 'Daily Sales - Jan 15',
            lines: {
                create: [
                    {
                        accountId: accountMap['4001'], // Credit Revenue
                        credit: 5000,
                        debit: 0
                    },
                    {
                        accountId: accountMap['1001'], // Debit Cash
                        credit: 0,
                        debit: 5000
                    }
                ]
            }
        }
    });

    // Expense Entry: COGS of 1500 JOD
    await prisma.journalEntry.create({
        data: {
            date: new Date('2026-01-15T12:00:00Z'),
            description: 'COGS - Jan 15',
            lines: {
                create: [
                    {
                        accountId: accountMap['5001'], // Debit Expense
                        credit: 0,
                        debit: 1500
                    },
                    {
                        accountId: accountMap['1100'], // Credit Inventory Asset
                        credit: 1500,
                        debit: 0
                    }
                ]
            }
        }
    });

    // Expense Entry: Rent of 800 JOD
    await prisma.journalEntry.create({
        data: {
            date: new Date('2026-01-01T09:00:00Z'),
            description: 'Monthly Rent - Jan',
            lines: {
                create: [
                    {
                        accountId: accountMap['6200'], // Debit Expense
                        credit: 0,
                        debit: 800
                    },
                    {
                        accountId: accountMap['1001'], // Credit Cash
                        credit: 800,
                        debit: 0
                    }
                ]
            }
        }
    });

    console.log('✅ Seeding complete.');
}

seedPLData()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
