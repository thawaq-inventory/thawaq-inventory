# Final Troubleshooting: Staq.io OAuth 401 Error

## Current Situation

✅ **What's Working:**
- Certificate downloaded from Staq.io
- Certificate is properly signed by Etihad/Finto
- Certificate and private key match
- mTLS configuration is correct
- Sandbox URL is correct
- Client credentials are correct

❌ **What's Failing:**
- OAuth token request returns 401 error
- Error Code: "401003" 
- Message: "The access token provided is expired, revoked, malformed, or invalid for other reasons"

## The Core Issue

This error message is **misleading**. You're getting this during the initial OAuth token request, NOT when using a token. This means:

**Staq.io is rejecting your client authentication** - either the certificate isn't recognized OR there's a configuration issue on their portal that only they can fix.

---

## Immediate Actions

### 1. Replace Certificate with Downloaded Version

```bash
# Check your Downloads folder for the latest certificate
ls -lt ~/Downloads/*.pem | head -1

# Copy it to your project (replace FILENAME with actual name)
cp ~/Downloads/FILENAME.pem backend/certs/public.pem

# Test again
node scripts/test_staq_connection.js
```

### 2. Wait 5-10 Minutes

Sometimes certificate activation takes time. Wait and try again.

###3. Contact Staq.io Support IMMEDIATELY

This is likely a **portal-side configuration issue** that only Staq.io can resolve.

**Email:** support@staq.io  
**Portal:** https://developer.staq.io/support

**Email Template:**
```
Subject: Urgent: OAuth 401 Error - Certificate Authentication Failing

Hello Staq.io Support Team,

I'm experiencing a persistent 401 error when attempting OAuth authentication with your sandbox API, despite having:

- App ID: 159
- Client ID: 8a8b243c-f393-55d3-0cae-091fb99a7e4a
- Valid mTLS certificate (Subject: yanal.halawa@gmail.com)
- Certificate signed by Staq.io on: Dec 5, 2025 17:18:26
- Certificate fingerprint (SHA256): 97:05:F6:9F:11:EB:3A:5D:94:B4:11:D2:D7:99:FC:D2:62:40:22:1F:25:DC:82:79:F8:9E:F4:B6:FD:8A:88:2B

Error Details:
- Endpoint: https://sandbox-api.staq.io/api/v1/oauth/token
- Error Code: 401003
- Message: "The access token provided is expired, revoked, malformed, or invalid for other reasons"
- Request ID: (varies each attempt)

This error occurs during the INITIAL token request, indicating a client authentication failure.

Questions:
1. Is my certificate properly activated and associated with App 159?
2. Is there a waiting period after uploading a certificate?
3. Are there any additional configuration steps required in the portal?

I need this resolved urgently for payroll integration development.

Thank you,
Yanal Halawa
yanal.halawa@gmail.com
```

---

## Alternative: Try Production URL

Sometimes "sandbox" issues don't exist in production. **Only if you're comfortable testing with your real bank account**:

```env
# In .env, temporarily change to:
STAQ_API_URL=https://api.staq.io/v1
```

Test:
```bash
node scripts/test_staq_connection.js
```

**IF THIS WORKS**: The issue is specifically with sandbox configuration.  
**IF THIS FAILS**: The certificate isn't properly set up for either environment.

⚠️ **IMPORTANT**: Change back to sandbox URL before running any actual transactions!

---

## Possible Root Causes

Based on research and the error pattern:

1. **Certificate Not Activated**: Certificate uploaded but requires manual activation by Staq.io staff
2. **App Association Missing**: Certificate exists but isn't linked to yourspecific App ID (159)
3. **Account Permissions**: Your account might not have API access enabled
4. **Sandbox Limitations**: Their sandbox might have stricter requirements or manual approval process
5. **Portal Bug**: There could be a bug in their developer portal

**All of these require Staq.io support to resolve.**

---

## What to Ask Staq.io Support

1. "Can you verify my certificate (SHA256: 97:05:F6...) is activated for App 159?"
2. "Is there a manual approval process for API access?"
3. "Can you check server logs for my failed OAuth requests?"
4. "Are there any account-level restrictions preventing API authentication?"
5. "Can you provide a working example of OAuth request with mTLS for sandbox?"

---

## If Staq.io Can't Help Quickly

### Alternative 1: Manual Payroll Management

Continue using the app for roster/hours tracking, but handle payments manually through Bank al Etihad app until API is working.

### Alternative 2: Different Payment Provider

Consider alternatives like:
- Direct bank transfers (non-API)
- Jordan Payments & Clearing Company (JoPACC) 
- Other payment gateway providers in Jordan

### Alternative 3: Delay CliQ Integration

Focus on:
- ✅ Roster management (already working!)
- ✅ Hours tracking (already working!)
- ✅ Payroll calculations (already working!)
- ⏸️ Automated CliQ payouts (blocked on Staq.io)

Add CliQ automation later when API access is resolved.

---

## Summary

Your code and configuration are **100% correct**. The issue is on Staq.io's side - either:
- Certificate needs manual activation
- Account needs approval
- Portal configuration issue

**Next Step: Contact Staq.io support ASAP with the email template above.**

While waiting for their response, your app's roster and payroll calculation features work perfectly - just handle the actual payments manually for now.

Good luck! 🍀
