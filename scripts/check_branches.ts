
import { prisma } from '../lib/prisma';

async function main() {
    const branches = await prisma.branch.findMany();
    console.log(`Found ${branches.length} branches.`);
    branches.forEach(b => console.log(` - ${b.name} (${b.id}) [Active: ${b.isActive}]`));
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
