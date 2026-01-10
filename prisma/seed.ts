import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create a default branch
    const branch = await prisma.branch.upsert({
        where: { code: 'MAIN' },
        update: {},
        create: {
            name: 'Main Branch',
            code: 'MAIN',
            address: '123 Main St',
            phone: '123-456-7890',
            isActive: true,
        },
    });

    console.log('✅ Default branch created/found:', branch.name);

    // Create sample products
    const products = [
        {
            name: 'Chicken Breast',
            sku: 'CHK-001',
            description: 'Fresh chicken breast',
            stockLevel: 45,
            unit: 'kg',
            minStock: 10,
            cost: 12.00,
            price: 25.00,
            branchId: branch.id,
        },
        {
            name: 'Tomatoes',
            sku: 'VEG-001',
            description: 'Fresh tomatoes',
            stockLevel: 30,
            unit: 'kg',
            minStock: 5,
            cost: 2.50,
            price: 5.00,
            branchId: branch.id,
        },
        {
            name: 'Olive Oil',
            sku: 'OIL-001',
            description: 'Extra virgin olive oil',
            stockLevel: 15,
            unit: 'L',
            minStock: 3,
            cost: 8.00,
            price: 15.00,
            branchId: branch.id,
        },
        {
            name: 'Rice',
            sku: 'GRN-001',
            description: 'Basmati rice',
            stockLevel: 100,
            unit: 'kg',
            minStock: 20,
            cost: 1.50,
            price: 3.00,
            branchId: branch.id,
        },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { sku: product.sku },
            update: {},
            create: product,
        });
    }

    // Create sample user
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            name: 'Admin User',
            username: 'admin',
            password: '$2b$10$YourHashedPasswordHere', // This would be generated with bcrypt
            pinCode: '1234',
            role: 'ADMIN',
            branchId: branch.id,
        },
    });

    console.log('✅ Database seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
