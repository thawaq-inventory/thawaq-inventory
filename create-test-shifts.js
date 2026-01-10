const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestShifts() {
    console.log('🔄 Creating test shifts...\n');

    try {
        // Get Daniah user
        const daniah = await prisma.user.findUnique({
            where: { username: 'daniah' }
        });

        if (!daniah) {
            console.log('❌ User Daniah not found!');
            return;
        }

        console.log('✅ Found user:', daniah.name);

        // Create shifts for this week
        const today = new Date();
        const monday = new Date(today);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);

        const shifts = [];

        // Create shifts for Monday through Friday
        for (let i = 0; i < 5; i++) {
            const shiftDate = new Date(monday);
            shiftDate.setDate(monday.getDate() + i);

            const shift = await prisma.shift.create({
                data: {
                    userId: daniah.id,
                    date: shiftDate,
                    startTime: i < 2 ? '09:00' : '14:00',
                    endTime: i < 2 ? '17:00' : '22:00',
                    role: 'Server',
                    status: 'SCHEDULED'
                }
            });

            shifts.push(shift);
            console.log(`✅ Created shift for ${shiftDate.toDateString()} (${shift.startTime} - ${shift.endTime})`);
        }

        console.log(`\n✅ Successfully created ${shifts.length} shifts!`);
    } catch (error) {
        console.error('❌ Error creating shifts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestShifts();
