require('dotenv').config();
const axios = require('axios');

/**
 * Staq.io Sandbox Simulation Helper
 * 
 * This script helps you interact with the Sandbox Simulation API
 * to fake money movement and transaction states for testing.
 */

const BASE_URL = process.env.STAQ_API_URL || 'https://sandbox-api.staq.io/api/v1';
const CLIENT_ID = process.env.STAQ_CLIENT_ID;
const CLIENT_SECRET = process.env.STAQ_CLIENT_SECRET;

let accessToken = null;

async function getAccessToken() {
    if (accessToken) return accessToken;

    try {
        const response = await axios.post(`${BASE_URL}/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        });

        accessToken = response.data.access_token;
        console.log('✅ OAuth token acquired');
        return accessToken;
    } catch (error) {
        console.error('❌ Failed to get OAuth token:', error.response?.data || error.message);
        throw error;
    }
}

async function addBalanceToAccount(accountNumber, amount = 1000) {
    try {
        const token = await getAccessToken();

        console.log(`\n💰 Adding ${amount} JOD to account ${accountNumber}...`);

        const response = await axios.put(
            `${BASE_URL}/partner/simulation/accounts/${accountNumber}/balance`,
            {
                balance: amount,
                currency: 'JOD',
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('✅ Balance updated successfully');
        console.log('New balance:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to update balance:', error.response?.data || error.message);
        throw error;
    }
}

async function settleTransfer(transactionId, status = 'completed') {
    try {
        const token = await getAccessToken();

        console.log(`\n🔄 Settling transfer ${transactionId} as ${status}...`);

        const response = await axios.post(
            `${BASE_URL}/partner/simulation/transfers/${transactionId}/settle`,
            {
                status: status, // 'completed', 'failed', 'rejected'
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log(`✅ Transfer ${status}`);
        console.log('Result:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to settle transfer:', error.response?.data || error.message);
        throw error;
    }
}

// Command-line interface
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

async function main() {
    console.log('🎮 Staq.io Sandbox Simulation API\n');
    console.log('Using:', BASE_URL);
    console.log('');

    if (!command) {
        console.log('Usage:');
        console.log('  node scripts/simulate.js balance <account_number> [amount]');
        console.log('  node scripts/simulate.js settle <transaction_id> [status]');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/simulate.js balance JO12ETIH0000000000000123456 5000');
        console.log('  node scripts/simulate.js settle TXN_123456 completed');
        process.exit(0);
    }

    try {
        switch (command) {
            case 'balance':
                if (!arg1) {
                    console.error('❌ Please provide account number');
                    process.exit(1);
                }
                await addBalanceToAccount(arg1, parseFloat(arg2) || 1000);
                break;

            case 'settle':
                if (!arg1) {
                    console.error('❌ Please provide transaction ID');
                    process.exit(1);
                }
                await settleTransfer(arg1, arg2 || 'completed');
                break;

            default:
                console.error('❌ Unknown command. Use "balance" or "settle"');
                process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 Operation failed');
        process.exit(1);
    }
}

main();
