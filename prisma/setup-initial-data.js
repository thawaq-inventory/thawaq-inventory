const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Setting up initial data...\n');

    // 1. Create Main Branch
    console.log('📍 Creating main branch...');
    const mainBranch = await prisma.branch.upsert({
        where: { code: 'MAIN' },
        update: {},
        create: {
            name: 'Main Branch',
            code: 'MAIN',
            address: 'Main Location',
            phone: '',
            email: '',
            isActive: true,
        },
    });
    console.log(`   ✅ Branch created: ${mainBranch.name} (${mainBranch.code})`);

    // 2. Create Admin User with proper hashed password
    console.log('\n👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: hashedPassword,
        },
        create: {
            name: 'Admin User',
            username: 'admin',
            password: hashedPassword,
            pinCode: '0000',
            role: 'ADMIN',
            isSuperAdmin: true,
            isActive: true,
        },
    });
    console.log(`   ✅ Admin user created: ${adminUser.name} (username: admin, password: admin123)`);

    // Assign admin to main branch
    await prisma.userBranch.upsert({
        where: {
            userId_branchId: {
                userId: adminUser.id,
                branchId: mainBranch.id,
            }
        },
        update: {},
        create: {
            userId: adminUser.id,
            branchId: mainBranch.id,
        }
    });
    console.log(`   ✅ Admin assigned to ${mainBranch.name}`);

    // 3. Create sample products
    console.log('\n📦 Creating sample products...');
    const products = [
        { name: 'Chicken Breast', sku: 'CHK-001', description: 'Fresh chicken breast', stockLevel: 45, unit: 'kg', minStock: 10, cost: 12.00, price: 25.00 },
        { name: 'Tomatoes', sku: 'VEG-001', description: 'Fresh tomatoes', stockLevel: 30, unit: 'kg', minStock: 5, cost: 2.50, price: 5.00 },
        { name: 'Olive Oil', sku: 'OIL-001', description: 'Extra virgin olive oil', stockLevel: 15, unit: 'L', minStock: 3, cost: 8.00, price: 15.00 },
        { name: 'Rice', sku: 'GRN-001', description: 'Basmati rice', stockLevel: 100, unit: 'kg', minStock: 20, cost: 1.50, price: 3.00 },
        { name: 'Onions', sku: 'VEG-002', description: 'Yellow onions', stockLevel: 25, unit: 'kg', minStock: 10, cost: 1.20, price: 2.50 },
        { name: 'Garlic', sku: 'VEG-003', description: 'Fresh garlic', stockLevel: 8, unit: 'kg', minStock: 5, cost: 3.00, price: 6.00 },
        { name: 'Salt', sku: 'SPC-001', description: 'Table salt', stockLevel: 50, unit: 'kg', minStock: 10, cost: 0.50, price: 1.00 },
        { name: 'Black Pepper', sku: 'SPC-002', description: 'Ground black pepper', stockLevel: 3, unit: 'kg', minStock: 2, cost: 15.00, price: 30.00 },
        { name: 'Lettuce', sku: 'VEG-004', description: 'Fresh lettuce', stockLevel: 12, unit: 'pcs', minStock: 5, cost: 0.80, price: 1.50 },
        { name: 'Beef Patties', sku: 'MEAT-001', description: 'Frozen beef patties', stockLevel: 0, unit: 'box', minStock: 5, cost: 25.00, price: 45.00 },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { sku: product.sku },
            update: {},
            create: {
                ...product,
                branchId: mainBranch.id,
            },
        });
        console.log(`   ✅ ${product.name}`);
    }

    // 4. Create sample employee
    console.log('\n👷 Creating sample employee...');
    const employeePassword = await bcrypt.hash('temp123', 10);
    const employee = await prisma.user.upsert({
        where: { username: 'employee1' },
        update: {},
        create: {
            name: 'Sample Employee',
            username: 'employee1',
            password: employeePassword,
            pinCode: '1234',
            role: 'EMPLOYEE',
            isActive: true,
            hourlyRate: 5.0,
        },
    });
    console.log(`   ✅ Employee created: ${employee.name} (PIN: 1234)`);

    // Assign employee to main branch
    await prisma.userBranch.upsert({
        where: {
            userId_branchId: {
                userId: employee.id,
                branchId: mainBranch.id,
            }
        },
        update: {},
        create: {
            userId: employee.id,
            branchId: mainBranch.id,
        }
    });
    console.log(`   ✅ Employee assigned to ${mainBranch.name}`);

    // 5. Create default expense categories
    console.log('\n💰 Creating expense categories...');
    const categories = [
        { name: 'Supplies', description: 'Office and kitchen supplies' },
        { name: 'Utilities', description: 'Electricity, water, internet' },
        { name: 'Maintenance', description: 'Equipment and facility maintenance' },
        { name: 'Transportation', description: 'Delivery and travel costs' },
        { name: 'Other', description: 'Miscellaneous expenses' },
    ];

    for (const category of categories) {
        await prisma.expenseCategory.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
        console.log(`   ✅ ${category.name}`);
    }

    // 6. Create a default location
    console.log('\n🏪 Creating default location...');
    const location = await prisma.location.upsert({
        where: { id: 'main-kitchen' },
        update: {},
        create: {
            id: 'main-kitchen',
            name: 'Main Kitchen',
            address: 'Main Branch Kitchen',
            isActive: true,
            branchId: mainBranch.id,
        },
    });
    console.log(`   ✅ Location: ${location.name}`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Initial data setup complete!');
    console.log('='.repeat(50));
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:    username: admin    | password: admin123');
    console.log('   Employee: PIN: 1234');
    console.log('\n🌐 Access URLs:');
    console.log('   Admin:    http://localhost:3000/en/admin/login');
    console.log('   Employee: http://localhost:3000/ar/employee');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
