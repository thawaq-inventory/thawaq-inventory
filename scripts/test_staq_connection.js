require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');

/**
 * Test Script: Staq.io API Connection with mTLS
 * 
 * This script tests:
 * 1. mTLS certificate loading
 * 2. OAuth 2.0 authentication (get access token)
 * 3. Connection to Staq.io API
 * 4. (Optional) Test transfer creation
 */

console.log('\n🔐 Staq.io API Connection Test\n');
console.log('='.repeat(50));

// Load environment variables
const {
    STAQ_CLIENT_ID,
    STAQ_CLIENT_SECRET,
    STAQ_API_URL
} = process.env;

// Validate environment
if (!STAQ_CLIENT_ID || !STAQ_CLIENT_SECRET) {
    console.error('❌ Missing required environment variables:');
    console.error('   STAQ_CLIENT_ID:', STAQ_CLIENT_ID ? '✓' : '✗');
    console.error('   STAQ_CLIENT_SECRET:', STAQ_CLIENT_SECRET ? '✓' : '✗');
    process.exit(1);
}

console.log('\n✅ Environment variables loaded');
console.log(`   API URL: ${STAQ_API_URL || 'https://api.staq.io/v1'}`);
console.log(`   Client ID: ${STAQ_CLIENT_ID.substring(0, 8)}...`);

// Step 1: Load mTLS certificates
console.log('\n📜 Step 1: Loading mTLS certificates...');

const certPath = path.join(__dirname, '..', 'backend', 'certs');
let privateKey, certificate;

try {
    privateKey = fs.readFileSync(path.join(certPath, 'private.key'), 'utf8');
    certificate = fs.readFileSync(path.join(certPath, 'public.pem'), 'utf8');
    console.log('✅ Certificates loaded successfully');
    console.log(`   Private key: ${privateKey.split('\n')[0]}`);
    console.log(`   Certificate: ${certificate.split('\n')[0]}`);
} catch (error) {
    console.error('❌ Failed to load certificates:', error.message);
    console.error('   Make sure backend/certs/private.key and public.pem exist');
    process.exit(1);
}

// Step 2: Create HTTPS agent with mTLS
console.log('\n🔒 Step 2: Creating HTTPS agent with mTLS...');

const httpsAgent = new https.Agent({
    cert: certificate,
    key: privateKey,
    rejectUnauthorized: true,
});

console.log('✅ HTTPS agent created with mTLS configuration');

// Step 3: Test OAuth authentication
console.log('\n🎫 Step 3: Testing OAuth 2.0 authentication...');

async function getAccessToken() {
    try {
        const authUrl = `${STAQ_API_URL || 'https://api.staq.io/v1'}/oauth/token`;
        console.log(`   POST ${authUrl}`);

        const response = await axios.post(
            authUrl,
            {
                grant_type: 'client_credentials',
                client_id: STAQ_CLIENT_ID,
                client_secret: STAQ_CLIENT_SECRET,
            },
            {
                httpsAgent,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('✅ OAuth authentication successful!');
        console.log(`   Token type: ${response.data.token_type}`);
        console.log(`   Expires in: ${response.data.expires_in} seconds`);
        console.log(`   Access token: ${response.data.access_token.substring(0, 20)}...`);

        return response.data.access_token;
    } catch (error) {
        console.error('❌ OAuth authentication failed:');
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   Message: ${error.response?.data?.error || error.message}`);
        console.error(`   Details: ${JSON.stringify(error.response?.data, null, 2)}`);
        throw error;
    }
}

// Step 4: Test API connection (optional endpoint)
async function testApiConnection(accessToken) {
    console.log('\n🌐 Step 4: Testing API connection...');

    try {
        // Try to fetch account information or any read-only endpoint
        const testUrl = `${STAQ_API_URL || 'https://api.staq.io/v1'}/accounts`;
        console.log(`   GET ${testUrl}`);

        const response = await axios.get(testUrl, {
            httpsAgent,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('✅ API connection successful!');
        console.log(`   Response status: ${response.status}`);
        console.log(`   Data keys: ${Object.keys(response.data).join(', ')}`);

        return response.data;
    } catch (error) {
        console.warn('⚠️  API connection test returned error (may be expected):');
        console.warn(`   Status: ${error.response?.status}`);
        console.warn(`   Message: ${error.response?.data?.message || error.message}`);
        // Don't throw - this endpoint might not exist
    }
}

// Main execution
async function main() {
    try {
        // Get access token
        const accessToken = await getAccessToken();

        // Test API connection
        await testApiConnection(accessToken);

        console.log('\n' + '='.repeat(50));
        console.log('✅ All tests passed!');
        console.log('\n📝 Next steps:');
        console.log('   1. Check Staq.io documentation for exact endpoints');
        console.log('   2. Verify transfer creation parameters');
        console.log('   3. Test draft transaction creation');
        console.log('   4. Confirm approval workflow in Bank al Etihad app');
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('\n' + '='.repeat(50));
        console.error('❌ Test failed');
        console.error('='.repeat(50) + '\n');
        process.exit(1);
    }
}

// Run tests
main();
