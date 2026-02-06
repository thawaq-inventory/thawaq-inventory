
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function GET() {
    try {
        console.log('🔄 Manual System Initialization Triggered...');

        // 1. Create Branches
        const branches = [
            { code: 'HQ', name: 'Al Thawaq HQ', type: 'HQ' },
            { code: 'CK', name: 'Central Kitchen', type: 'CENTRAL_KITCHEN' },
            { code: 'SW', name: 'Sweifieh', type: 'RESTAURANT' },
            { code: 'KH', name: 'Khalda', type: 'RESTAURANT' },
        ];

        for (const b of branches) {
            await prisma.branch.upsert({
                where: { code: b.code },
                update: { type: b.type },
                create: {
                    name: b.name,
                    code: b.code,
                    type: b.type,
                    address: 'Amman, Jordan',
                    phone: '000-000-0000',
                    isActive: true
                }
            });
        }

        // 2. Create Admin
        const hq = await prisma.branch.findUnique({ where: { code: 'HQ' } });
        if (!hq) throw new Error("HQ Branch failed to create");

        const adminEmail = 'admin@althawaq.com';
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.user.upsert({
            where: { username: adminEmail },
            update: {
                isSuperAdmin: true,
                role: 'ADMIN',
                branchId: hq.id,
                password: hashedPassword // FORCE RESET PASSWORD
            },
            create: {
                name: 'Super Admin',
                username: adminEmail,
                password: hashedPassword,
                pinCode: '0000',
                role: 'ADMIN',
                isSuperAdmin: true,
                branchId: hq.id,
                isActive: true
            }
        });

        // 3. Create Default Chart of Accounts
        const defaultAccounts = [
            // Assets
            { code: '1010', name: 'Cash on Hand', type: 'ASSET' },
            { code: '1015', name: 'Petty Cash', type: 'ASSET' },
            { code: '1020', name: 'Bank Account - Arab Bank', type: 'ASSET' },
            { code: '1200', name: 'Inventory Asset', type: 'ASSET' },

            // Liabilities
            { code: '2010', name: 'Accounts Payable', type: 'LIABILITY' },
            { code: '2020', name: 'VAT Payable', type: 'LIABILITY' },

            // Equity
            { code: '3010', name: 'Retained Earnings', type: 'EQUITY' },
            { code: '3020', name: 'Opening Balance Equity', type: 'EQUITY' },

            // Revenue
            { code: '4010', name: 'Sales Revenue', type: 'REVENUE' },
            { code: '4020', name: 'Service Revenue', type: 'REVENUE' },

            // Expenses (COGS)
            { code: '5010', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE' },
            { code: '5020', name: 'Wastage Expense', type: 'EXPENSE' },
            { code: '5030', name: 'Inventory Shrinkage', type: 'EXPENSE' },

            // Operating Expenses
            { code: '6010', name: 'Rent Expense', type: 'EXPENSE' },
            { code: '6020', name: 'Salaries & Wages', type: 'EXPENSE' },
            { code: '6030', name: 'Utilities', type: 'EXPENSE' },
            { code: '6040', name: 'Maintenance', type: 'EXPENSE' },
            { code: '6050', name: 'Marketing', type: 'EXPENSE' },
            { code: '6300', name: 'Merchant Fees', type: 'EXPENSE' } // Important for Sales Import
        ];

        let createdAccounts = 0;
        for (const acc of defaultAccounts) {
            const exists = await prisma.account.findFirst({ where: { code: acc.code } });
            if (!exists) {
                await prisma.account.create({
                    data: {
                        code: acc.code,
                        name: acc.name,
                        type: acc.type as any // Cast to enum
                    }
                });
                createdAccounts++;
            }
        }

        return NextResponse.json({
            status: 'SUCCESS',
            message: `System Initialized. Created ${createdAccounts} new accounts.`,
            credentials: {
                username: adminEmail,
                password: 'admin'
            },
            branches: branches.map(b => b.name),
            accountsCreated: createdAccounts
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
