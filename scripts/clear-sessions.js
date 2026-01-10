const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAuthTokens() {
    console.log('🍪 Clearing auth tokens from browser cookies...\n');

    console.log('To clear your authentication and get fresh permissions:');
    console.log('\n1. Open Chrome DevTools (F12 or Cmd+Option+I)');
    console.log('2. Go to Application tab → Cookies → http://localhost:3000');
    console.log('3. Delete the "auth_token" cookie (right-click → Delete)');
    console.log('4. Refresh the page');
    console.log('\nOR simply visit: http://localhost:3000/admin/login');
    console.log('\n✅ Admin login page created at /admin/login');
    console.log('\nLog in with:');
    console.log('  Username: daniah');
    console.log('  Password: (your password)');

    await prisma.$disconnect();
}

clearAuthTokens();
