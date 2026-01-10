const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetAdminPassword() {
    const username = 'daniah';
    const newPassword = 'admin123'; // Simple password for testing

    try {
        console.log(`🔐 Resetting password for user: ${username}...\n`);

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { username },
            data: { password: hashedPassword },
        });

        console.log('✅ Password reset successfully!\n');
        console.log('════════════════════════════════════════');
        console.log('Login Credentials:');
        console.log('════════════════════════════════════════');
        console.log(`Username: ${username}`);
        console.log(`Password: ${newPassword}`);
        console.log('════════════════════════════════════════\n');
        console.log('You can now log in at: http://localhost:3000/admin/login');
        console.log('\n⚠️  Remember to change this password after logging in!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword();
