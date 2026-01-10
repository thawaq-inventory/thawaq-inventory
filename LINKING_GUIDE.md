# Linking Staq.io Portal App with Your Code

## The Problem

Your credentials are in the code, but the app on Staq.io portal isn't recognizing your certificate. This means the **certificate and credentials aren't properly linked** in the portal.

---

## Step-by-Step Linking Process

### Step 1: Verify Which App You're Using

1. Log into **https://developer.staq.io**
2. Go to **"Applications"** or **"My Apps"**
3. You should see your app listed

**Question**: Do you see an app named something like "Thawaq Inventory" or "Al Thawaq"?

If NO → You need to create an app (see Step 1B)
If YES → Note the App ID and proceed to Step 2

---

### Step 1B: Create App (If Needed)

If you don't have an app or want to create a new one:

1. Click **"Create New Application"** or **"New App"**
2. Fill in:
   - **App Name**: Thawaq Inventory
   - **Description**: Payroll management system
   - **Type**: Server/Backend Application
   - **APIs**: Select "Transfers API" or "Payments API"
3. Click **"Create"** or **"Save"**
4. **Note the App ID** (might be shown in URL or on app details page)

---

### Step 2: Get Fresh Credentials FROM THE APP

**This is critical:** You must use credentials from the SAME app where you upload the certificate.

1. Open your app in the portal
2. Go to **"Credentials"** tab or section
3. Look for:
   - **Client ID** (UUID format like `8a8b243c-...`)
   - **Client Secret** (long base64 string)
   - **Environment selector** (should show "Sandbox" or "Development")

4. **Copy these exact values**

---

### Step 3: Update Your .env File

Open your `.env` file and update with the credentials you JUST copied:

```env
STAQ_CLIENT_ID=<paste_client_id_from_portal>
STAQ_CLIENT_SECRET=<paste_client_secret_from_portal>
```

**Important**: Make sure there are no extra spaces or quotes!

---

### Step 4: Upload Certificate to THE SAME APP

Still on the portal, in the SAME app:

1. Make sure environment is set to **"Sandbox"**
2. Find **"Certificates"** or **"mTLS"** or **"Security"** section
3. Click **"Add Certificate"** or **"Upload CSR"**
4. Upload: `backend/certs/request.csr` or `backend/certs/csr.pem`
5. Portal will process and give you a signed certificate
6. **Download** the signed certificate
7. Save it as: `backend/certs/public.pem` (overwrite existing if needed)

---

### Step 5: Verify Certificate is Active

On the portal, in the Certificates section, verify:
- [x] Status shows **"Active"** or **"Valid"** (NOT "Pending")
- [x] Environment shows **"Sandbox"**
- [x] Certificate subject matches: `yanal.halawa@gmail.com`
- [x] There's only ONE active certificate (not multiple)

**If status is "Pending":**
- Look for **"Activate"** or **"Enable"** button and click it
- Wait 2-5 minutes
- Refresh page until status shows "Active"

---

### Step 6: Verify Credentials Match

Double-check your `.env` file:

```bash
# Run this to see your current config
cat .env | grep STAQ
```

Compare the Client ID in your `.env` with the Client ID shown in the portal.

**They MUST match exactly!**

---

### Step 7: Test the Connection

```bash
# Clear any Node.js cache
rm -rf node_modules/.cache

# Test OAuth
node scripts/test_staq_connection.js
```

**Expected Success:**
```
✅ Certificates Loaded successfully
✅ OAuth token acquired
   Token: eyJhbGciOiJSUzI1Ni...
✅ API connectivity verified
```

---

## Common Mistakes (Why Linking Fails)

### ❌ Mistake 1: Multiple Apps
- Created multiple apps on portal
- Using credentials from App A
- Uploaded certificate to App B
- **Fix**: Use credentials and certificate from THE SAME app

### ❌ Mistake 2: Wrong Environment
- Credentials from "Sandbox"
- Certificate uploaded to "Production" (or vice versa)
- **Fix**: Make sure both use "Sandbox"

### ❌ Mistake 3: Old Credentials
- Created new app but still using old credentials in .env
- **Fix**: Copy credentials from the app page in portal

### ❌ Mistake 4: Certificate Not Activated
- Certificate uploaded but still shows "Pending"
- **Fix**: Click "Activate" button in portal

### ❌ Mistake 5: Typo in Credentials
- Copied Client ID/Secret with extra spaces or incomplete
- **Fix**: Copy-paste carefully, verify no leading/trailing spaces

---

## Visual Checklist

Use this to verify everything is linked:

```
Portal (Staq.io)                    Your Code (.env)
┌─────────────────────┐             ┌──────────────────────┐
│ App: Thawaq Inv.    │             │ STAQ_CLIENT_ID=      │
│ ID: 159             │             │  8a8b243c-f393...    │
│                     │             │                      │
│ Environment:        │             │ STAQ_API_URL=        │
│  [X] Sandbox        │  ◄────────► │  sandbox-api....     │
│  [ ] Production     │             │                      │
│                     │             │                      │
│ Credentials:        │             │ STAQ_CLIENT_SECRET=  │
│  Client ID:         │  ◄────────► │  9Fw+PQU4Dq7...      │
│   8a8b243c-f393...  │             │                      │
│                     │             │                      │
│ Certificates:       │             │ backend/certs/       │
│  ✓ ACTIVE           │  ◄────────► │  public.pem          │
│  Subject: yanal...  │             │  private.key         │
└─────────────────────┘             └──────────────────────┘
       │                                     │
       └──────── MUST MATCH ─────────────────┘
```

---

## Still Not Working?

If you've done all the above and still getting 401, try this:

### Option A: Start Fresh with New Certificate

```bash
# Generate completely new certificate
openssl req -new -newkey rsa:2048 -nodes \
  -keyout backend/certs/new_private.key \
  -out backend/certs/new_csr.pem \
  -subj "/CN=yanal.halawa@gmail.com/emailAddress=yanal.halawa@gmail.com"

# Upload new_csr.pem to portal
# Download signed cert
# Rename files:
mv backend/certs/new_private.key backend/certs/private.key
mv backend/certs/new_public.pem backend/certs/public.pem
```

### Option B: Create Brand New App

1. Create a completely new app on Staq.io portal
2. Note the NEW app ID and credentials
3. Upload certificate to this NEW app
4. Update .env with NEW credentials
5. Test

---

## Success Looks Like

When everything is properly linked:

```bash
$ node scripts/test_staq_connection.js

✅ Environment variables loaded
   API URL: https://sandbox-api.staq.io/api/v1
   Client ID: 8a8b243c...

✅ Certificates loaded successfully
✅ HTTPS agent created with mTLS configuration
✅ OAuth token acquired
   Token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
   Expires in: 3600 seconds
✅ API connectivity verified

==================================================
✅ All tests passed!
==================================================
```

---

## Quick Verification Script

Run this to check if everything matches:

```bash
echo "=== Current Configuration ==="
echo "Client ID in .env:"
grep STAQ_CLIENT_ID .env

echo ""
echo "Certificate Subject:"
openssl x509 -in backend/certs/public.pem -subject -noout

echo ""
echo "Certificate Expiry:"
openssl x509 -in backend/certs/public.pem -dates -noout

echo ""
echo "Certificate Fingerprint:"
openssl x509 -in backend/certs/public.pem -fingerprint -noout
```

Compare this fingerprint with what's shown in the portal - they MUST match!

---

## Summary

The linking process is:
1. ✅ Create/select ONE app on portal
2. ✅ Copy credentials from THAT app
3. ✅ Put credentials in .env
4. ✅ Upload certificate to THAT SAME app
5. ✅ Activate certificate (wait for "Active" status)  
6. ✅ Ensure environment is "Sandbox" everywhere
7. ✅ Test connection

**All of these must use the SAME app!**
