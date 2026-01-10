# Staq.io Sandbox Configuration Guide

## ✅ Step 1: Update .env File

Open your `.env` file and update the Staq.io configuration section:

```env
# Staq.io Sandbox Configuration
STAQ_API_URL=https://sandbox-api.staq.io/api/v1
STAQ_CLIENT_ID=<your_client_id_from_dashboard>
STAQ_CLIENT_SECRET=<your_client_secret_from_dashboard>

# Company Details
COMPANY_ACCOUNT_NUMBER=<your_test_account_number>
COMPANY_NAME=Al Thawaq Restaurant

# Test CliQ Alias
TEST_CLIQ_ALIAS=test@sandbox
```

**Important Notes:**
- ✅ Use the **exact URL**: `https://sandbox-api.staq.io/api/v1` (note the `/api` before `/v1`)
- ✅ The credentials shown in your dashboard are already Sandbox credentials
- ✅ No need to "switch" anything in the dashboard - you're already in sandbox mode

---

## ✅ Step 2: Verify staqClient.js

The client should automatically use the URL from your `.env` file. No code changes needed!

Your `staqClient.js` already uses:
```javascript
const BASE_URL = process.env.STAQ_API_URL || 'https://api.staq.io/v1';
```

Just make sure `.env` has the sandbox URL.

---

## ✅ Step 3: Test the Configuration

Run the connection test:

```bash
node scripts/test_staq_connection.js
```

**Expected output:**
```
✅ Certificates loaded successfully
✅ OAuth token acquired from https://sandbox-api.staq.io/api/v1/oauth/token
✅ API connectivity verified
```

If you see errors, double-check:
- URL is exactly `https://sandbox-api.staq.io/api/v1`
- Client ID and Secret are copied correctly from dashboard
- Certificates are uploaded to sandbox environment

---

## 🎮 Bonus: Using the Simulation API

Staq provides a Simulation API to fake money movement in sandbox:

### Add Balance to Test Account

```bash
# Save this as scripts/simulate_balance.sh
#!/bin/bash

ACCOUNT_NUMBER="${1:-JO12ETIH0000000000000123456}"
AMOUNT="${2:-1000}"

curl -X PUT \
  "https://sandbox-api.staq.io/api/v1/partner/simulation/accounts/${ACCOUNT_NUMBER}/balance" \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"balance\": ${AMOUNT},
    \"currency\": \"JOD\"
  }"
```

### Simulate CliQ Transfer Completion

```bash
curl -X POST \
  "https://sandbox-api.staq.io/api/v1/partner/simulation/transfers/TRANSACTION_ID/settle" \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"completed\"
  }"
```

---

## 📋 Quick Checklist

Before testing CliQ payouts:

- [ ] `.env` has `STAQ_API_URL=https://sandbox-api.staq.io/api/v1`
- [ ] Client ID and Secret are from your dashboard (already sandbox)
- [ ] Certificates uploaded to sandbox environment on Staq portal
- [ ] Test connection script runs successfully
- [ ] (Optional) Used simulation API to add test balance

---

## 🚀 Ready to Test!

Now you can:

1. **Test via Command Line:**
   ```bash
   node scripts/test_cliq_payout.js
   ```

2. **Test via UI:**
   - Go to http://localhost:3000/en/admin/roster
   - Click "Pay" on an employee
   - Use any test CliQ alias (e.g., `test@sandbox`, `0790000000`)
   - Transaction will be created in DRAFT status

3. **View in Dashboard:**
   - Go to http://localhost:3000/en/admin/payroll/approvals
   - See your sandbox transactions
   - No real money moves!

---

## 🔄 Switching to Production Later

When you're ready for production:

1. Click "Submit for Review" or "Go Live" in Staq dashboard
2. Sign legal agreements
3. Receive production credentials
4. Update `.env`:
   ```env
   STAQ_API_URL=https://api.staq.io/v1
   STAQ_CLIENT_ID=<new_production_client_id>
   STAQ_CLIENT_SECRET=<new_production_secret>
   ```
5. Upload production certificates
6. Link actual bank account in Bank al Etihad app

---

## ❓ Common Issues

**"Connection Refused"**
→ Check URL has `/api` before `/v1`: `https://sandbox-api.staq.io/api/v1`

**"Invalid Credentials"**
→ Copy-paste Client ID/Secret exactly from dashboard (no extra spaces)

**"Certificate Error"**
→ Make sure you uploaded CSR to **sandbox** environment, not production

**"Insufficient Funds"**
→ Use simulation API to add test balance to your sandbox account

---

## 📞 Need Help?

- **Staq Docs:** https://developer.staq.io/docs
- **Support:** support@staq.io
- **Your Dashboard:** https://developer.staq.io/apps/159

Happy testing! 🎉
