require('dotenv').config();
const { getStaqClient } = require('../backend/services/staqClient');

/**
 * Test Script: CliQ Instant Payout with Draft Mode
 * 
 * This script tests the complete CliQ payout flow:
 * 1. OAuth authentication
 * 2. mTLS handshake
 * 3. CliQ instant transfer creation in DRAFT mode
 * 4. Verification that transaction appears in approval dashboard
 */

console.log('\n🚀 Testing CliQ Instant Payout\n');
console.log('='.repeat(60));

async function testCliqPayout() {
    try {
        // Initialize Staq client
        console.log('\n📦 Step 1: Initializing Staq client...');
        const staqClient = getStaqClient();
        console.log('✅ Staq client initialized');

        // Test payout parameters
        const testParams = {
            employeeAlias: process.env.TEST_CLIQ_ALIAS || 'test@etihad',  // CHANGE THIS to your CliQ alias
            employeeName: 'Test Employee',
            amountJOD: 0.001,  // Minimal test amount (1 fils)
            reference: `TEST_${Date.now()}`,
            description: 'Test payroll payout - CliQ instant transfer',
            metadata: {
                test: true,
                total_hours: 1,
                hourly_rate: 0.001,
            },
        };

        console.log('\n💰 Step 2: Initiating CliQ payout...');
        console.log(`   Beneficiary: ${testParams.employeeName}`);
        console.log(`   CliQ Alias: ${testParams.employeeAlias}`);
        console.log(`   Amount: ${testParams.amountJOD.toFixed(3)} JOD`);
        console.log(`   Reference: ${testParams.reference}`);

        // Initiate payout
        const result = await staqClient.initiateCliqPayout(testParams);

        console.log('\n📊 Step 3: Processing results...');

        if (result.success) {
            console.log('\n✅ SUCCESS! CliQ payout created in DRAFT mode\n');
            console.log('   Transaction Details:');
            console.log(`   ├─ Transaction ID: ${result.transactionId}`);
            console.log(`   ├─ Status: ${result.status}`);
            console.log(`   ├─ Service Level: ${result.serviceLevel}`);
            console.log(`   ├─ Amount: ${result.amount.value} ${result.amount.currency}`);
            console.log(`   ├─ Beneficiary: ${result.beneficiary.name}`);
            console.log(`   ├─ CliQ Alias: ${result.beneficiary.alias}`);
            console.log(`   ├─ Approval Required: ${result.approvalRequired ? 'YES' : 'NO'}`);
            if (result.approvalUrl) {
                console.log(`   └─ Approval URL: ${result.approvalUrl}`);
            }

            console.log('\n📱 Next Steps:');
            console.log('   1. Open Bank al Etihad mobile app');
            console.log('   2. Navigate to "Pending Approvals" or "Transfers"');
            console.log(`   3. Find transaction: ${result.transactionId}`);
            console.log('   4. Approve the transfer');
            console.log('   5. Verify instant settlement to beneficiary');

        } else {
            console.error('\n❌ FAILED! CliQ payout creation failed\n');
            console.error('   Error Details:');
            console.error(`   ├─ Error: ${result.error}`);
            console.error(`   ├─ Error Code: ${result.errorCode || 'N/A'}`);
            if (result.errorDetails) {
                console.error(`   └─ Details: ${JSON.stringify(result.errorDetails, null, 2)}`);
            }

            console.log('\n🔍 Troubleshooting:');
            console.log('   1. Verify STAQ_CLIENT_ID and STAQ_CLIENT_SECRET in .env');
            console.log('   2. Check that backend/certs/public.pem and private.key exist');
            console.log('   3. Verify CliQ alias is registered and active');
            console.log('   4. Check company account has sufficient balance (even for 0.001 JOD)');
            console.log('   5. Review API documentation for correct endpoint structure');
        }

        console.log('\n' + '='.repeat(60));

    } catch (error) {
        console.error('\n💥 EXCEPTION THROWN!\n');
        console.error('   Error:', error.message);
        console.error('   Stack:', error.stack);
        console.log('\n='.repeat(60));
        process.exit(1);
    }
}

// Run test
console.log('\n⚙️  Environment Configuration:');
console.log(`   STAQ_API_URL: ${process.env.STAQ_API_URL || 'https://api.staq.io/v1'}`);
console.log(`   STAQ_CLIENT_ID: ${process.env.STAQ_CLIENT_ID?.substring(0, 8)}...`);
console.log(`   Certificates: backend/certs/private.key, public.pem`);
console.log(`   Test CliQ Alias: ${process.env.TEST_CLIQ_ALIAS || 'test@etihad (CHANGE THIS!)'}`);

testCliqPayout();
