# New Certificate Upload Instructions

## Step-by-Step Guide

### 1. Upload CSR (File Dialog is Open)

In the file dialog that just opened:
- Navigate to: `/Users/mac/Desktop/Thawaq Inventory App/backend/certs/`
- Select file: `csr_new.pem`
- Click "Open" or "Upload"

### 2. Wait for Signing

The portal will process your CSR and sign it.
Wait for the page to show the new certificate status.

### 3. Download Signed Certificate

Once the certificate appears on the page:
- Click the "DOWNLOAD" button
- The file will be saved to your Downloads folder (likely as `public.pem`)

### 4. After Download, Run These Commands

I'll run these automatically once you confirm the download is complete:

```bash
# Backup old files
mv backend/certs/private.key backend/certs/private_old.key
mv backend/certs/public.pem backend/certs/public_old.pem

# Install new files
mv backend/certs/private_new.key backend/certs/private.key
cp ~/Downloads/public.pem backend/certs/public.pem

# Test connection
node scripts/test_staq_connection.js
```

### 5. Expected Result

If the new certificate works, you should see:
```
✅ OAuth token acquired
   Token: eyJhbGciOiJSUzI1Ni...
✅ API connectivity verified
```

---

## If It Still Fails

If even the brand new certificate fails with 401, it confirms the issue is NOT with the certificate itself, but with:
- Account permissions
- App configuration on Staq.io's side
- Manual approval required

In that case, you MUST contact Staq.io support as this is beyond what can be fixed in code or configuration on your end.

---

**Let me know when the signed certificate is downloaded!**
