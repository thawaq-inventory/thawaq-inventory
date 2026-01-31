
import { prisma } from '../lib/prisma';

async function main() {
    const term = "ساندوش تيركي";
    console.log(`Checking mapping for: "${term}"`);

    const mapping = await prisma.productMapping.findFirst({
        where: { posString: term },
        include: { recipe: true, product: true }
    });

    if (mapping) {
        console.log("✅ FOUND!");
        console.log(mapping);
    } else {
        console.log("❌ NOT FOUND");
    }

    // List all mappings to see what we have
    const all = await prisma.productMapping.findMany({ take: 5 });
    console.log("Sample mappings:", all.map(m => m.posString));
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
