#!/bin/bash

# Staq.io App Linking Diagnostic Script
# This script helps verify your Staq.io app is properly linked

echo "════════════════════════════════════════════════════════════"
echo "  Staq.io App Linking Diagnostic"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check .env file
echo "📋 Step 1: Checking .env configuration..."
echo ""

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

STAQ_CLIENT_ID=$(grep STAQ_CLIENT_ID .env | cut -d '=' -f2)
STAQ_API_URL=$(grep STAQ_API_URL .env | cut -d '=' -f2)

echo "   API URL: $STAQ_API_URL"
echo "   Client ID: ${STAQ_CLIENT_ID:0:20}..."

if [[ $STAQ_API_URL == *"sandbox"* ]]; then
    echo "   ✅ Using Sandbox environment"
else
    echo "   ⚠️  Not using sandbox URL!"
fi

echo ""

# Check certificate files
echo "📜 Step 2: Checking certificate files..."
echo ""

if [ -f backend/certs/private.key ]; then
    echo "   ✅ private.key exists"
else
    echo "   ❌ private.key NOT FOUND"
fi

if [ -f backend/certs/public.pem ]; then
    echo "   ✅ public.pem exists"
else
    echo "   ❌ public.pem NOT FOUND"
    exit 1
fi

echo ""

# Check certificate details
echo "🔐 Step 3: Certificate Details..."
echo ""

echo "   Subject:"
openssl x509 -in backend/certs/public.pem -subject -noout | sed 's/^/      /'

echo ""
echo "   Issuer:"
openssl x509 -in backend/certs/public.pem -issuer -noout | sed 's/^/      /'

echo ""
echo "   Validity:"
openssl x509 -in backend/certs/public.pem -dates -noout | sed 's/^/      /'

echo ""
echo "   Fingerprint (SHA1):"
openssl x509 -in backend/certs/public.pem -fingerprint -sha1 -noout | sed 's/^/      /'

echo ""
echo "   Fingerprint (SHA256):"
openssl x509 -in backend/certs/public.pem -fingerprint -sha256 -noout | sed 's/^/      /'

echo ""

# Check if certificate matches private key
echo "🔑 Step 4: Verifying certificate matches private key..."
echo ""

CERT_MODULUS=$(openssl x509 -in backend/certs/public.pem -modulus -noout | openssl md5)
KEY_MODULUS=$(openssl rsa -in backend/certs/private.key -modulus -noout | openssl md5)

if [ "$CERT_MODULUS" = "$KEY_MODULUS" ]; then
    echo "   ✅ Certificate and private key match!"
else
    echo "   ❌ Certificate and private key DO NOT MATCH!"
    echo "   This means the certificate was not generated from this private key"
fi

echo ""

# Summary
echo "════════════════════════════════════════════════════════════"
echo "  Summary & Next Steps"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. Go to: https://developer.staq.io/apps"
echo ""
echo "2. Find your app and verify:"
echo "   - Environment is set to: SANDBOX"
echo "   - Client ID matches: ${STAQ_CLIENT_ID:0:20}..."
echo ""
echo "3. In Certificates section, verify:"
echo "   - Status shows: ACTIVE or VERIFIED"
echo "   - Subject matches: (see above)"
echo "   - Fingerprint matches: (see above)"
echo ""
echo "4. If fingerprint DOESN'T match:"
echo "   → Upload backend/certs/request.csr to portal"
echo "   → Download signed cert and save as backend/certs/public.pem"
echo ""
echo "5. If everything matches but still getting 401:"
echo "   → Certificate might not be activated in portal"
echo "   → Look for 'Activate' or 'Enable' button"
echo "   → Wait 2-5 minutes after activation"
echo ""
echo "════════════════════════════════════════════════════════════"
