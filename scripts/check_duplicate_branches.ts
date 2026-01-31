
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Scanning for Duplicate HQ Branches...");

    // 1. Find potential duplicates
    const branches = await prisma.branch.findMany({
        where: {
            OR: [
                { id: 'HEAD_OFFICE' },
                { name: { contains: 'Head Office' } },
                { name: { contains: 'Global View' } },
                { code: 'HQ' }
            ]
        }
    });

    console.log(`Found ${branches.length} potential matches:`);
    branches.forEach(b => {
        console.log(` - [${b.id}] ${b.name} (Code: ${b.code}, Type: ${b.type})`);
    });

    // 2. Check for data usage on the 'HEAD_OFFICE' ID if it exists
    const virtualId = 'HEAD_OFFICE';
    const virtualBranch = branches.find(b => b.id === virtualId);

    if (virtualBranch) {
        console.log(`\n⚠️ Found Database Record for virtual ID '${virtualId}'. Checking usage...`);
        // Check usage in JournalEntry, etc.
        const journalEntries = await prisma.journalEntry.count({ where: { branchId: virtualId } });
        const users = await prisma.user.count({ where: { branchId: virtualId } });

        console.log(`   - JournalEntries: ${journalEntries}`);
        console.log(`   - Users: ${users}`);

        if (journalEntries === 0 && users === 0) {
            console.log("✅ Safe to DELETE (No data linked).");
        } else {
            console.log("❌ Has Data! Requires Merge.");
        }
    } else {
        console.log("\n✅ No Database Record found for ID 'HEAD_OFFICE'. It is likely purely virtual in code.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
