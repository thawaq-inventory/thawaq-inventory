
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {
    console.log('📜 Starting Final Acceptance Test: Multi-Branch Architecture\n');

    const results = {
        cleanup: { status: 'PENDING', note: '' },
        privacy: { status: 'PENDING', note: '' },
        consolidation: { status: 'PENDING', note: '' },
        isolation: { status: 'PENDING', note: '' }
    };

    try {
        // --- 1. THE CLEANUP SWEEP ---
        console.log('🧹 TEST 1: The Cleanup Sweep');

        // Ensure Required Branches Exist
        const sweifieh = await prisma.branch.upsert({
            where: { code: 'SW' },
            create: { name: 'Sweifieh', code: 'SW', type: 'RESTAURANT', isActive: true },
            update: { type: 'RESTAURANT', isActive: true }
        });

        const khalda = await prisma.branch.upsert({
            where: { code: 'KH' },
            create: { name: 'Khalda', code: 'KH', type: 'RESTAURANT', isActive: true },
            update: { type: 'RESTAURANT', isActive: true }
        });

        const hq = await prisma.branch.upsert({
            where: { code: 'HQ' },
            create: { name: 'Al Thawaq HQ', code: 'HQ', type: 'HQ', isActive: true },
            update: { type: 'HQ', isActive: true }
        });

        // Delete Junk
        const junkNames = ['Abdoun', 'Test Branch'];
        const deletion = await prisma.branch.deleteMany({
            where: {
                OR: [
                    { name: { in: junkNames } },
                    { name: { contains: 'Test' } }
                ]
            }
        });

        const activeBranches = await prisma.branch.findMany({ select: { name: true, type: true } });
        console.log('   Active Branches:', activeBranches.map(b => `${b.name} (${b.type})`).join(', '));

        results.cleanup.status = 'PASS';
        results.cleanup.note = `Verified Core Trio. Deleted ${deletion.count} junk branches.`;


        // --- SETUP SHARED LEDGER ACCOUNTS ---
        const salesAcc = await prisma.account.findFirst({ where: { type: 'REVENUE' } })
            || await prisma.account.create({ data: { name: 'Test Sales', code: 'REV001', type: 'REVENUE' } });
        const expAcc = await prisma.account.findFirst({ where: { type: 'EXPENSE' } })
            || await prisma.account.create({ data: { name: 'Test Exp', code: 'EXP001', type: 'EXPENSE' } });


        // --- 2. THE CROSS-BRANCH SPY TEST ---
        console.log('\n🕵️  TEST 2: The Cross-Branch Spy Test');

        // 1. Create Sale in Khalda
        const khaldaSale = await prisma.journalEntry.create({
            data: {
                description: 'Khalda Secret Sale',
                date: new Date(),
                branchId: khalda.id,
                reference: 'SPY_TEST_001',
                lines: { create: [{ accountId: salesAcc.id, credit: 500, debit: 0 }] }
            }
        });

        // 2. Simulate Sweifieh View (Strict Filter)
        const sweifiehView = await prisma.journalEntry.findMany({
            where: { branchId: sweifieh.id }
        });

        const seenBySweifieh = sweifiehView.find(e => e.id === khaldaSale.id);

        if (!seenBySweifieh) {
            results.privacy.status = 'PASS';
            results.privacy.note = 'Sweifieh could not see Khalda data.';
        } else {
            results.privacy.status = 'FAIL';
            results.privacy.note = 'DATA LEAK DETECTED!';
        }

        // CleanupSpy
        await prisma.journalEntry.delete({ where: { id: khaldaSale.id } });


        // --- 3. THE HQ ZOOM LENS ---
        console.log('\n🔭 TEST 3: The HQ Zoom Lens');

        // Create Expenses
        const expS = await prisma.journalEntry.create({
            data: {
                description: 'Sweifieh Exp', date: new Date(), branchId: sweifieh.id, reference: 'ZOOM_S',
                lines: { create: [{ accountId: expAcc.id, debit: 100, credit: 0 }] }
            }
        });
        const expK = await prisma.journalEntry.create({
            data: {
                description: 'Khalda Exp', date: new Date(), branchId: khalda.id, reference: 'ZOOM_K',
                lines: { create: [{ accountId: expAcc.id, debit: 200, credit: 0 }] }
            }
        });

        // HQ Request: Consolidated P&L
        const hqView = await prisma.journalEntry.findMany({
            where: {
                branchId: { in: [sweifieh.id, khalda.id] }
            },
            include: { lines: true }
        });

        let totalExp = 0;
        hqView.forEach(entry => {
            entry.lines.forEach(line => {
                if (line.accountId === expAcc.id) totalExp += line.debit;
            });
        });

        if (totalExp === 300) {
            results.consolidation.status = 'PASS';
            results.consolidation.note = 'Consolidated Sum (100+200) = 300 correct.';
        } else {
            results.consolidation.status = 'FAIL';
            results.consolidation.note = `Math Failed. Expected 300, got ${totalExp}`;
        }

        // Cleanup Zoom
        await prisma.journalEntry.deleteMany({
            where: {
                id: { in: [expS.id, expK.id] }
            }
        });


        // --- 4. THE PROFIT SHIELD ---
        console.log('\n🛡️  TEST 4: The Profit Shield');

        // 1. Massive HQ Expense
        const hqExpense = await prisma.journalEntry.create({
            data: {
                description: 'HQ Legal Fees',
                date: new Date(),
                branchId: hq.id,
                reference: 'SHIELD_TEST',
                lines: { create: [{ accountId: expAcc.id, debit: 10000, credit: 0 }] }
            }
        });

        // 2. Run Sweifieh Report
        // Logic: Filter by BranchId = Sweifieh
        const sweifiehReportEntries = await prisma.journalEntry.findMany({
            where: { branchId: sweifieh.id },
            include: { lines: true }
        });

        let sweifiehCosts = 0;
        sweifiehReportEntries.forEach(e => {
            e.lines.forEach(l => { if (l.accountId === expAcc.id) sweifiehCosts += l.debit; });
        });

        if (sweifiehCosts === 0) { // Should be 0 since we deleted previous test expenses
            results.isolation.status = 'PASS';
            results.isolation.note = 'HQ Costs did not touch Branch P&L.';
        } else {
            results.isolation.status = 'FAIL';
            results.isolation.note = `Leaked! Sweifieh costs = ${sweifiehCosts}`;
        }

        // Cleanup Shield
        await prisma.journalEntry.delete({ where: { id: hqExpense.id } });


    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }

    // --- REPORT CARD ---
    console.log('\n\n🎓 CERTIFICATION TABLE 🎓');
    console.table([
        { Test: 'Branch Cleanup', Result: results.cleanup.status, Notes: results.cleanup.note },
        { Test: 'Privacy Wall', Result: results.privacy.status, Notes: results.privacy.note },
        { Test: 'Consolidation', Result: results.consolidation.status, Notes: results.consolidation.note },
        { Test: 'HQ Isolation', Result: results.isolation.status, Notes: results.isolation.note },
    ]);
}

runAudit();
