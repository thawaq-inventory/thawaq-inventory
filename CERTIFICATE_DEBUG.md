# Certificate Verification Checklist

## Current Status

✅ Certificate file exists: `backend/certs/public.pem`  
✅ Certificate is valid (signed by Staq.io/Etihad)  
✅ Expires: Dec 5, 2026  
✅ Subject: yanal.halawa@gmail.com  
❌ OAuth still returning 401  

---

## Why 401 Persists

The certificate is valid, but Staq.io is rejecting it. This means:

**Most Likely Causes:**
1. Certificate not associated with your App ID (159) in the portal
2. Certificate uploaded to wrong environment (Production vs Sandbox)
3. Certificate not "activated" or "enabled" in the portal
4. App ID mismatch between portal and credentials

---

## Steps to Fix

### 1. Log into Staq Developer Portal

Go to: https://developer.staq.io/apps

Verify you see your application with ID **159**

### 2. Open Your App Settings

Click on your app → Go to "Credentials" or "Certificates" section

### 3. Check Environment

Look for an environment selector (dropdown or toggle):
- [ ] Is it set to "**Sandbox**"?  
- [ ] NOT "Production" or "Live"?

This is **critical** - if you're in the wrong environment, that's the problem!

### 4. Verify Certificate Status

In the Certificates section, you should see:
- Certificate Subject: `yanal.halawa@gmail.com`
- Status: **"Active"** or **"Verified"** (NOT "Pending" or "Inactive")
- Environment: **Sandbox**
- Expiration: Dec 5, 2026

If status shows anything other than "Active"/"Verified":
- Look for an "Activate" or "Enable" button
- Click it and wait a few minutes

### 5. Check Certificate Thumbprint (Fingerprint)

Get your certificate's thumbprint:
```bash
openssl x509 -in backend/certs/public.pem -fingerprint -noout
```

Compare this thumbprint with what's shown in the portal. They **must match exactly**.

### 6. Verify App Credentials Match

In the portal, verify:
- Client ID: `8a8b243c-f393-55d3-0cae-091fb99a7e4a`
- This should match what's in your `.env` file

If they don't match, you might be using credentials from a different app!

---

## Alternative: Contact Staq Support

If everything above checks out and you still get 401, contact Staq.io support with:

```
Subject: mTLS Certificate 401 Error - Sandbox Environment

Body:
Hello,

I'm getting a 401 error when trying to authenticate to the sandbox API despite having:
- Valid certificate signed by Staq.io
- Certificate uploaded to sandbox environment
- App ID: 159
- Client ID: 8a8b243c-f393-55d3-0cae-091fb99a7e4a
- Certificate Subject: yanal.halawa@gmail.com
- Sandbox URL: https://sandbox-api.staq.io/api/v1

Error Response:
{
  "Code": "401003",
  "Message": "The access token provided is expired, revoked, malformed, or invalid for other reasons"
}

Can you verify my certificate is properly activated for this app in the sandbox environment?

Thank you
```

---

## Debug: Certificate Info

Your current certificate details:
```
Issuer: Etihad for Financial Technology (Finto)
Subject: yanal.halawa@gmail.com
Valid: Dec 5 2025 - Dec 5 2026
Serial: 77 (0x4d)
```

To see full certificate:
```bash
openssl x509 -in backend/certs/public.pem -text -noout
```

---

## Expected Portal View

You should see something like this in the portal:

```
┌─────────────────────────────────────────────┐
│ App: Thawaq Inventory (ID: 159)             │
│ Environment: [ Sandbox ▼ ]                  │
├─────────────────────────────────────────────┤
│ Certificates                                │
│                                             │
│ ✓ ACTIVE                                    │
│ Subject: yanal.halawa@gmail.com             │
│ Expires: Dec 5, 2026                        │
│ Fingerprint: XX:XX:XX:...                   │
│                                             │
│ [Revoke] [Download]                         │
└─────────────────────────────────────────────┘
```

If you see "Pending" or "Inactive" instead of "ACTIVE", that's your problem!

---

## Summary

The error is **NOT** with your code or certificate file.  
The issue is with the **portal configuration**.

**Check these 3 things:**
1. ✅ Environment = "Sandbox" (not Production)
2. ✅ Certificate Status = "Active" (not Pending/Inactive)
3. ✅ Certificate matches your app (thumbprint verification)

One of these is likely misconfigured on the Staq.io side.
