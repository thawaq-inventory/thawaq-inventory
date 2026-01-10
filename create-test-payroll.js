const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestPayrollTransactions() {
    try {
        console.log('Creating test payroll transactions...\n');

        // Get all employees (check both 'EMPLOYEE' and 'employee')
        const employees = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'EMPLOYEE' },
                    { role: 'employee' }
                ]
            },
        });

        if (employees.length === 0) {
            console.log('❌ No employees found. Please create employees first.');
            console.log('Run: node create-user.js');
            return;
        }

        console.log(`Found ${employees.length} employee(s)`);

        // Create test transactions for each employee
        const transactions = [];

        for (const employee of employees) {
            // Pending transaction
            const pending = await prisma.payrollTransaction.create({
                data: {
                    employeeId: employee.id,
                    totalHours: 48,
                    hourlyRate: employee.hourlyRate || 5.0,
                    finalAmount: 48 * (employee.hourlyRate || 5.0),
                    periodStart: new Date('2025-12-01'),
                    periodEnd: new Date('2025-12-07'),
                    status: 'waiting_bank_approval',
                    accountNumber: employee.cliqAlias || '0790123456',
                    reference: `PAY_20251201_${employee.id.substring(0, 8)}`,
                    notes: 'Test weekly payroll - pending approval',
                },
            });
            transactions.push(pending);
            console.log(`✅ Created pending transaction for ${employee.name}: ${pending.finalAmount} JOD`);

            // Approved transaction (from last week)
            const approved = await prisma.payrollTransaction.create({
                data: {
                    employeeId: employee.id,
                    totalHours: 45,
                    hourlyRate: employee.hourlyRate || 5.0,
                    finalAmount: 45 * (employee.hourlyRate || 5.0),
                    periodStart: new Date('2025-11-24'),
                    periodEnd: new Date('2025-11-30'),
                    status: 'approved',
                    accountNumber: employee.cliqAlias || '0790123456',
                    reference: `PAY_20251124_${employee.id.substring(0, 8)}`,
                    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    approvedAt: new Date('2025-11-30T14:30:00'),
                    notes: 'Test weekly payroll - approved',
                },
            });
            transactions.push(approved);
            console.log(`✅ Created approved transaction for ${employee.name}: ${approved.finalAmount} JOD`);

            // Rejected transaction (older)
            const rejected = await prisma.payrollTransaction.create({
                data: {
                    employeeId: employee.id,
                    totalHours: 40,
                    hourlyRate: employee.hourlyRate || 5.0,
                    finalAmount: 40 * (employee.hourlyRate || 5.0),
                    periodStart: new Date('2025-11-17'),
                    periodEnd: new Date('2025-11-23'),
                    status: 'rejected',
                    accountNumber: employee.cliqAlias || '0790123456',
                    reference: `PAY_20251117_${employee.id.substring(0, 8)}`,
                    notes: 'Test transaction - rejected for review',
                    errorMessage: 'Rejected by manager for amount verification',
                },
            });
            transactions.push(rejected);
            console.log(`✅ Created rejected transaction for ${employee.name}: ${rejected.finalAmount} JOD`);
        }

        console.log(`\n✅ Successfully created ${transactions.length} test transactions`);
        console.log('\nSummary:');
        console.log(`  - Pending: ${transactions.filter(t => t.status === 'waiting_bank_approval').length}`);
        console.log(`  - Approved: ${transactions.filter(t => t.status === 'approved').length}`);
        console.log(`  - Rejected: ${transactions.filter(t => t.status === 'rejected').length}`);
        console.log('\nYou can now view these in the Payroll Approvals dashboard!');

    } catch (error) {
        console.error('Error creating test transactions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestPayrollTransactions();
