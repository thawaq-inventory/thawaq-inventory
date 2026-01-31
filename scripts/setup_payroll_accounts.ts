
// @ts-nocheck
import { prisma } from '../lib/prisma';

async function setupPayrollAccounts() {
    console.log('--- Setting up Payroll Accounts ---');

    const accounts = [
        {
            code: '5002', // Expense
            name: 'Salaries & Wages',
            type: 'EXPENSE',
            description: 'Employee salaries, wages, and bonuses'
        },
        {
            code: '2200', // Liability
            name: 'Salaries Payable',
            type: 'LIABILITY',
            description: 'Accrued salaries payable to employees'
        }
    ];

    for (const acc of accounts) {
        const existing = await prisma.account.findFirst({
            where: {
                OR: [
                    { code: acc.code },
                    { name: acc.name }
                ]
            }
        });

        if (!existing) {
            console.log(`Creating account: ${acc.name} (${acc.code})`);
            await prisma.account.create({
                data: acc
            });
        } else {
            console.log(`Account already exists: ${acc.name} (${existing.code})`);
            // Optional: Update details if needed, but for now just skip
        }
    }

    console.log('--- Payroll Accounts Setup Complete ---');
}

setupPayrollAccounts()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
