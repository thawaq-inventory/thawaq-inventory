import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
        },
        {
            name: 'Onions',
            sku: 'VEG-002',
            description: 'Yellow onions',
            stockLevel: 25,
            unit: 'kg',
            minStock: 10,
            cost: 1.20,
            price: 2.50,
        },
        {
            name: 'Garlic',
            sku: 'VEG-003',
            description: 'Fresh garlic',
            stockLevel: 8,
            unit: 'kg',
            minStock: 5,
            cost: 3.00,
            price: 6.00,
        },
        {
            name: 'Salt',
            sku: 'SPC-001',
            description: 'Table salt',
            stockLevel: 50,
            unit: 'kg',
            minStock: 10,
            cost: 0.50,
            price: 1.00,
        },
        {
            name: 'Black Pepper',
            sku: 'SPC-002',
            description: 'Ground black pepper',
            stockLevel: 3,
            unit: 'kg',
            minStock: 2,
            cost: 15.00,
            price: 30.00,
        },
        {
            name: 'Lettuce',
            sku: 'VEG-004',
            description: 'Fresh lettuce',
            stockLevel: 12,
            unit: 'pcs',
            minStock: 5,
            cost: 0.80,
            price: 1.50,
        },
        {
            name: 'Beef Patties',
            sku: 'MEAT-001',
            description: 'Frozen beef patties',
            stockLevel: 0,
            unit: 'box',
            minStock: 5,
            cost: 25.00,
            price: 45.00,
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
