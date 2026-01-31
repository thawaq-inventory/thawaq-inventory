
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function patchSystem() {
    console.log('🚀 Starting Phase 2: Data Patching & Initialization...');

    // 1. Initialize Special Branches
    console.log('--- Step 1: Initialize Special Branches ---');

    // HQ
    const hq = await prisma.branch.upsert({
        where: { code: 'HQ' },
        create: {
            name: 'Al Thawaq HQ',
            code: 'HQ',
            type: 'HQ',
            isActive: true
        },
        update: {
            type: 'HQ' // Ensure type is correct if it exists
        }
    });
    console.log(`✅ HQ Verified: ${hq.id}`);

    // Central Kitchen
    const kitchen = await prisma.branch.upsert({
        where: { code: 'CK' },
        create: {
            name: 'Central Kitchen',
            code: 'CK',
            type: 'CENTRAL_KITCHEN',
            isActive: true
        },
        update: {
            type: 'CENTRAL_KITCHEN'
        }
    });
    console.log(`✅ Central Kitchen Verified: ${kitchen.id}`);

    // 2. Patch Ghost Journal Entries
    console.log('\n--- Step 2: Patch Ghost Journal Entries ---');
    const ghostEntries = await prisma.journalEntry.count({
        where: { branchId: null }
    });

    if (ghostEntries > 0) {
        console.log(`👻 Found ${ghostEntries} entries with NULL branchId. Patching to HQ...`);
        const updated = await prisma.journalEntry.updateMany({
            where: { branchId: null },
            data: { branchId: hq.id }
        });
        console.log(`✅ Patched ${updated.count} entries.`);
    } else {
        console.log('✨ No ghost entries found.');
    }

    console.log('\n✅ Phase 2 Complete.');
}

patchSystem()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
