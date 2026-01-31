
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditBranchLogic() {
    console.log('🕵️‍♂️ Starting Multi-Branch Logic Audit...\n');

    // --- SETUP ---
    console.log('--- SETUP: Creating Test Environment ---');
    // Ensure Branches Exist
    const branchA = await prisma.branch.upsert({
        where: { code: 'TEST_A' },
        create: { name: 'Audit Branch A', code: 'TEST_A', type: 'BRANCH' },
        update: {}
    });
    const branchB = await prisma.branch.upsert({
        where: { code: 'TEST_B' },
        create: { name: 'Audit Branch B', code: 'TEST_B', type: 'BRANCH' },
        update: {}
    });
    console.log(`✅ Branches Ready: ${branchA.name}, ${branchB.name}`);

    // --- TEST 1: THE GLOBAL MENU CHECK ---
    console.log('\n--- TEST 1: Global Menu Check (Product Visibility) ---');

    // 1. Create Products
    const pGlobal = await prisma.product.create({ data: { name: 'Audit Burger Global', branchId: null, price: 5 } });
    const pLocalA = await prisma.product.create({ data: { name: 'Audit Burger A', branchId: branchA.id, price: 5 } });
    const pLocalB = await prisma.product.create({ data: { name: 'Audit Burger B', branchId: branchB.id, price: 5 } });

    // 2. Simulate API Query for Branch A
    // (Replicating logic from app/api/products/route.ts)
    const currentBranchId = branchA.id;
    const whereClause = { isArchived: false };

    // VISIBILITY LOGIC (Phase 3.2): Prevent Data Leaks
    if (currentBranchId && currentBranchId !== 'HEAD_OFFICE') {
        whereClause.AND = [
            {
                OR: [
                    { branchId: null },          // Global Menu
                    { branchId: currentBranchId } // Local Specials
                ]
            }
        ];
    }

    const productsVisibleToA = await prisma.product.findMany({
        where: whereClause
    });

    // 3. Validation
    const canSeeGlobal = productsVisibleToA.some(p => p.id === pGlobal.id);
    const canSeeLocalA = productsVisibleToA.some(p => p.id === pLocalA.id);
    const canSeeLocalB = productsVisibleToA.some(p => p.id === pLocalB.id);

    console.log(`- Branch A sees Global Product? ${canSeeGlobal ? 'YES (✅ Pass)' : 'NO (❌ Fail)'}`);
    console.log(`- Branch A sees Own Product?    ${canSeeLocalA ? 'YES (✅ Pass)' : 'NO (❌ Fail)'}`);
    console.log(`- Branch A sees Branch B Product? ${canSeeLocalB ? 'YES (❌ FAIL - LEAK)' : 'NO (✅ Pass)'}`);

    // Clean up products
    await prisma.product.deleteMany({ where: { id: { in: [pGlobal.id, pLocalA.id, pLocalB.id] } } });


    // --- TEST 2: THE FINANCIAL WALL (UPDATED) ---
    console.log('\n--- TEST 2: The Financial Wall (Ledger Segregation & Consolidation) ---');

    // 1. Create a Journal Entry for Branch A
    let revenueAccount = await prisma.account.findFirst({ where: { code: '4001' } });
    if (!revenueAccount) {
        revenueAccount = await prisma.account.create({ data: { name: 'Test Rev', code: '4001', type: 'REVENUE' } });
    }

    const jeId = `TEST_JE_${Date.now()}`;
    const je = await prisma.journalEntry.create({
        data: {
            description: `Audit Sale ${jeId}`,
            date: new Date(),
            lines: {
                create: [
                    { accountId: revenueAccount.id, credit: 1000, debit: 0 }
                ]
            },
            branchId: branchA.id // NOW WE HAVE A BRANCH ID!
        }
    });
    console.log(`- Created Journal Entry: 1000 JOD (Assigned to Branch A: ${branchA.id})`);

    // 2. Simulate P&L Query for Branch B (Should see NOTHING)
    // We simulate the API logic: filtering by branchId
    const entriesForB = await prisma.journalEntry.findMany({
        where: {
            branchId: branchB.id // Branch B Context
        }
    });

    const isLeakingToB = entriesForB.some(e => e.id === je.id);
    console.log(`- Branch B sees Branch A's Entry?       ${isLeakingToB ? 'YES (❌ FAIL - LEAK)' : 'NO (✅ Pass)'}`);

    // 3. Simulate HQ Consolidation (Should see BOTH A and Global)
    const entriesForHQ = await prisma.journalEntry.findMany({
        where: {
            OR: [
                { branchId: { in: [branchA.id, branchB.id] } },
                { branchId: null }
            ]
        }
    });
    const hqSeesIt = entriesForHQ.some(e => e.id === je.id);
    console.log(`- HQ sees Branch A's Entry in Console?  ${hqSeesIt ? 'YES (✅ Pass)' : 'NO (❌ Fail)'}`);

    // Clean up JE
    await prisma.journalEntry.delete({ where: { id: je.id } });


    // --- TEST 3: GHOST DATA CHECK ---
    console.log('\n--- TEST 3: Ghost Data Check (Schema Audit) ---');

    try {
        await prisma.$queryRaw`SELECT "branchId" FROM "JournalEntry" LIMIT 1`;
        console.log(`- JournalEntry table has 'branchId' column? YES (✅ Pass)`);
    } catch (e) {
        console.log(`- JournalEntry table has 'branchId' column? NO (❌ FAIL - LEAK RISK)`);
    }

    try {
        await prisma.$queryRaw`SELECT "type" FROM "Branch" LIMIT 1`;
        console.log(`- Branch table has 'type' column?         YES (✅ Pass)`);
    } catch (e) {
        console.log(`- Branch table has 'type' column?         NO (❌ FAIL)`);
    }

    // New Test 4: Data Patching Check
    console.log('\n--- TEST 4: Data Patching Verification ---');
    const ghostCount = await prisma.journalEntry.count({
        where: { branchId: null }
    });
    console.log(`- Ghost Entries (NULL branchId): ${ghostCount}`);
    if (ghostCount === 0) console.log('✅ PASS: All Journal Entries are assigned.');
    else console.log('⚠️ WARNING: Ghost entries exist, patching might have failed.');

    console.log('\n--- Audit Complete ---');
}

auditBranchLogic()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
