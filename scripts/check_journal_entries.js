
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Journal Entries ---');

    // 1. Count Total
    const count = await prisma.journalEntry.count();
    console.log(`Total Journal Entries: ${count}`);

    if (count === 0) {
        console.log('No entries found. The database is empty of journals.');
        return;
    }

    // 2. Fetch Sample (Latest 10)
    const entries = await prisma.journalEntry.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        include: {
            branch: true
        }
    });

    console.log('\n--- Latest 10 Entries ---');
    entries.forEach(e => {
        console.log(`ID: ${e.id.substring(0, 8)}... | Date: ${e.date.toISOString().split('T')[0]} | Branch: ${e.branch ? e.branch.name : 'NULL (Global)'} | Desc: ${e.description}`);
    });

    // 3. Check for Future Entries specifically
    const futureEntries = await prisma.journalEntry.findMany({
        where: {
            date: { gt: new Date() }
        },
        take: 5
    });

    console.log(`\n--- Future Entries Count: ${futureEntries.length} (showing max 5) ---`);
    futureEntries.forEach(e => {
        console.log(`ID: ${e.id.substring(0, 8)}... | Date: ${e.date.toISOString().split('T')[0]} | Desc: ${e.description}`);
    });

}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
