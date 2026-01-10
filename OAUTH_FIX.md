# OAuth 401 Error - Certificate Upload Guide

## The Problem

You're getting a 401 error when trying to get an OAuth token:
```
Code: "401003"
Message: "The access token provided is expired, revoked, malformed, or invalid for other reasons"
```

This error during **token acquisition** (not token usage) means:
**Your mTLS certificate is not properly registered with Staq.io's sandbox environment.**

---

## The Solution: Upload Certificate to Sandbox

### Step 1: Verify Your Certificate Files Exist

```bash
ls -la backend/certs/
```

You should see:
- `private.key` - Your private key
- `csr.pem` - Certificate Signing Request
- `public.pem` - Signed certificate (if you already uploaded before)

---

### Step 2: Go to Staq.io Developer Portal

1. Open: https://developer.staq.io/apps/159/credentials
2. **Look for an environment toggle or dropdown** - Make sure you're in **"Sandbox"** mode (NOT Production)
3. Look for a section like "Certificates" or "mTLS" or "API Credentials"

---

### Step 3: Upload Your CSR

If you haven't uploaded before:

1. Click "Add Certificate" or "Upload CSR"
2. Upload the file: `backend/certs/csr.pem`
3. Staq.io will sign it and give you a signed certificate
4.  Download the signed certificate
5. Save it as `backend/certs/public.pem` (overwrite if it exists)

---

### Step 4: Important - Environment Separation

**Sandbox and Production use DIFFERENT certificates!**

- If you previously uploaded a certificate for "Production", that won't work for "Sandbox"
- You need to upload your CSR specifically to the **Sandbox environment**
- Make sure the toggle/dropdown says "Sandbox" when you upload

---

### Step 5: Wait for Processing

After uploading:
- Staq.io may take a few minutes to process and activate the certificate
- Some platforms require you to "Activate" or "Enable" the certificate after upload
- Look for a status indicator (should say "Active" or "Verified")

---

### Step 6: Test Again

```bash
node scripts/test_staq_connection.js
```

**Expected Success:**
```
✅ Certificates loaded successfully
✅ HTTPS agent created with mTLS configuration
✅ OAuth token acquired
   Token: eyJhbGciOiJSUzI1Ni...
✅ API connectivity verified
```

---

## Alternative: Generate Fresh Certificates

If you're unsure about your current certificates, generate new ones:

```bash
# Generate new private key and CSR
openssl req -new -newkey rsa:2048 -nodes \
  -keyout backend/certs/private.key \
  -out backend/certs/csr.pem \
  -subj "/CN=your.email@althawaq.com/emailAddress=your.email@althawaq.com"

# Upload csr.pem to Staq.io SANDBOX environment
# Download signed cert as public.pem
```

---

## Common Mistakes

❌ **Wrong Environment**
- Certificate uploaded to Production instead of Sandbox
- Solution: Check environment toggle is set to "Sandbox"

❌ **Certificate Not Activated**
- Certificate uploaded but not activated/enabled
- Solution: Look for activation button or wait for status to show "Active"

❌ **Using Production URL with Sandbox Cert**
- Solution: Your .env now has correct sandbox URL

❌ **File Permissions**
- Solution: Make sure Node.js can read the cert files
```bash
chmod 600 backend/certs/private.key
chmod 644 backend/certs/public.pem
```

---

## How to Check Certificate Status on Portal

Look for indicators like:
- ✅ "Active" or "Valid" or "Verified"
- Environment: "Sandbox"
- Expiration date (should be in future)
- Certificate thumbprint/fingerprint matches

---

## Still Not Working?

Try the Staq.io API Console or Postman:
1. Download their Postman collection from developer portal
2. Import to Postman
3. Configure mTLS certificates in Postmap settings
4. Try OAuth request there
5. If it works in Postman but not in code, it's a code issue
6. If it fails in Postman too, it's a certificate/account issue

Contact Staq.io support if certificate is definitely uploaded to sandbox and still getting 401.

---

## Summary Checklist

- [ ] Certificate files exist in `backend/certs/`
- [ ] Logged into https://developer.staq.io
- [ ] Environment toggle set to "Sandbox"
- [ ] CSR uploaded to Sandbox environment
- [ ] Downloaded signed certificate as `public.pem`
- [ ] Certificate status shows "Active" or "Verified"
- [ ] Waited 2-5 minutes after upload
- [ ] `.env` has `STAQ_API_URL=https://sandbox-api.staq.io/api/v1`
- [ ] Test script runs successfully

Good luck! 🎯
