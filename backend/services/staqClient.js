require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');

/**
 * Staq.io API Client with mTLS Authentication for CliQ Instant Transfers
 * 
 * Features:
 * - OAuth 2.0 client credentials authentication
 * - mTLS (mutual TLS) for transport security
 * - CliQ instant settlement (URGP service level)
 * - Maker-Checker workflow (draft mode)
 * - Alias-based beneficiary identification
 */

class StaqClient {
    constructor() {
        this.baseURL = process.env.STAQ_API_URL || 'https://api.staq.io/v1';
        this.clientId = process.env.STAQ_CLIENT_ID;
        this.clientSecret = process.env.STAQ_CLIENT_SECRET;
        this.accessToken = null;
        this.tokenExpiry = null;

        // Validate configuration
        if (!this.clientId || !this.clientSecret) {
            throw new Error('Missing required environment variables: STAQ_CLIENT_ID and STAQ_CLIENT_SECRET');
        }

        // Load mTLS certificates
        const certPath = path.join(process.cwd(), 'backend', 'certs');

        try {
            this.privateKey = fs.readFileSync(path.join(certPath, 'private.key'), 'utf8');
            this.certificate = fs.readFileSync(path.join(certPath, 'public.pem'), 'utf8');
            console.log('[StaqClient] mTLS certificates loaded successfully');
        } catch (error) {
            console.error('[StaqClient] Failed to load mTLS certificates:', error.message);
            throw new Error('mTLS certificates not found. Ensure private.key and public.pem exist in backend/certs/');
        }

        // Create HTTPS agent with mTLS
        this.httpsAgent = new https.Agent({
            cert: this.certificate,
            key: this.privateKey,
            rejectUnauthorized: true,
        });

        // Create Axios instance
        this.client = axios.create({
            baseURL: this.baseURL,
            httpsAgent: this.httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: 30000,
        });

        // Request interceptor - inject access token
        this.client.interceptors.request.use(
            async (config) => {
                // Skip token for auth endpoint
                if (!config.url.includes('/oauth/token')) {
                    const token = await this.getValidAccessToken();
                    config.headers.Authorization = `Bearer ${token}`;
                }
                console.log(`[Staq API] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('[Staq API] Request error:', error.message);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                console.log(`[Staq API] Response ${response.status} from ${response.config.url}`);
                return response;
            },
            (error) => {
                const status = error.response?.status;
                const message = error.response?.data?.message || error.message;
                console.error(`[Staq API] Error ${status}: ${message}`);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get valid access token (fetch new if expired)
     */
    async getValidAccessToken() {
        const now = Date.now();

        // Return cached token if still valid (with 60s buffer)
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > now + 60000) {
            return this.accessToken;
        }

        // Fetch new token
        console.log('[StaqClient] Fetching new access token...');

        try {
            // Build URL-encoded form data
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', this.clientId);
            params.append('client_secret', this.clientSecret);

            const response = await axios.post(
                `${this.baseURL}/oauth/token`,
                params.toString(),
                {
                    httpsAgent: this.httpsAgent,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

            console.log('[StaqClient] Access token obtained successfully');
            console.log(`[StaqClient] Token expires in ${response.data.expires_in} seconds`);

            return this.accessToken;
        } catch (error) {
            console.error('[StaqClient] OAuth authentication failed:', error.response?.data || error.message);
            throw new Error(`OAuth authentication failed: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Initiate CliQ instant payout with draft mode (Maker-Checker)
     * 
     * @param {Object} params - Payout parameters
     * @param {string} params.employeeAlias - Employee's CliQ alias (mobile/email)
     * @param {string} params.employeeName - Employee's full name
     * @param {number} params.amountJOD - Amount in Jordanian Dinars
     * @param {string} params.reference - Unique payment reference
     * @param {string} params.description - Payment description
     * @param {Object} params.metadata - Additional metadata
     * @returns {Promise<Object>} Transfer response with transaction ID and status
     */
    async initiateCliqPayout(params) {
        const {
            employeeAlias,
            employeeName,
            amountJOD,
            reference,
            description,
            metadata = {},
        } = params;

        // Validate parameters
        if (!employeeAlias || !employeeName || !amountJOD || !reference) {
            throw new Error('Missing required parameters: employeeAlias, employeeName, amountJOD, reference');
        }

        // Construct CliQ instant transfer payload
        const payload = {
            // CRITICAL: CliQ instant settlement flags
            serviceLevel: 'URGP',  // Urgent Payment = Instant CliQ rail
            instructionPriority: 'HIGH',

            // Amount
            amount: {
                currency: 'JOD',
                value: amountJOD.toFixed(3),  // JOD uses 3 decimal places
            },

            // Debtor (Company)
            debtor: {
                name: process.env.COMPANY_NAME || 'Al Thawaq Restaurant',
                account: {
                    identification: process.env.COMPANY_ACCOUNT_NUMBER || '',
                    scheme: 'IBAN',
                },
            },

            // Creditor (Employee) - CRITICAL: Use ALIAS scheme for CliQ
            creditor: {
                name: employeeName,
                account: {
                    identification: employeeAlias,  // CliQ alias (e.g., "0790123456" or "email@bank")
                    scheme: 'ALIAS',  // CRITICAL for CliQ routing
                },
            },

            // Payment details
            remittanceInformation: {
                unstructured: description || `Payroll payment - ${reference}`,
            },
            endToEndIdentification: reference,

            // CRITICAL: Draft mode for Maker-Checker workflow
            auto_execute: false,  // Do NOT execute immediately
            requires_approval: true,  // Mark for approval
            status: 'DRAFT',  // Create in draft state

            // Metadata
            metadata: {
                ...metadata,
                payment_type: 'PAYROLL',
                payment_rail: 'CLIQ_INSTANT',
                created_by: 'thawaq_inventory',
            },
        };

        try {
            console.log('[StaqClient] Initiating CliQ instant payout...');
            console.log(`[StaqClient] Beneficiary: ${employeeName} (${employeeAlias})`);
            console.log(`[StaqClient] Amount: ${amountJOD.toFixed(3)} JOD`);

            const response = await this.client.post('/transfers', payload);

            const result = {
                success: true,
                transactionId: response.data.transfer_id || response.data.id,
                status: response.data.status || 'PENDING_APPROVAL',
                serviceLevel: response.data.service_level || 'URGP',
                createdAt: response.data.created_at,
                approvalRequired: response.data.requires_approval !== false,
                approvalUrl: response.data.approval_url,
                reference: reference,
                amount: {
                    value: amountJOD.toFixed(3),
                    currency: 'JOD',
                },
                beneficiary: {
                    name: employeeName,
                    alias: employeeAlias,
                },
            };

            console.log(`[StaqClient] ✅ CliQ payout created: ${result.transactionId}`);
            console.log(`[StaqClient] Status: ${result.status}`);

            return result;
        } catch (error) {
            console.error('[StaqClient] ❌ CliQ payout failed:', error.response?.data || error.message);

            return {
                success: false,
                error: error.response?.data?.message || error.message,
                errorCode: error.response?.data?.code || error.response?.data?.error,
                errorDetails: error.response?.data,
            };
        }
    }

    /**
     * Get transfer status by ID
     */
    async getTransferStatus(transactionId) {
        try {
            const response = await this.client.get(`/transfers/${transactionId}`);
            return {
                success: true,
                ...response.data,
            };
        } catch (error) {
            console.error('[StaqClient] Failed to get transfer status:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * List pending transfers (for approval dashboard)
     */
    async listPendingTransfers() {
        try {
            const response = await this.client.get('/transfers', {
                params: {
                    status: 'PENDING_APPROVAL',
                },
            });
            return {
                success: true,
                transfers: response.data.transfers || response.data,
            };
        } catch (error) {
            console.error('[StaqClient] Failed to list transfers:', error.message);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

// Export singleton instance
let staqClientInstance;

function getStaqClient() {
    if (!staqClientInstance) {
        staqClientInstance = new StaqClient();
    }
    return staqClientInstance;
}

module.exports = { getStaqClient, StaqClient };
