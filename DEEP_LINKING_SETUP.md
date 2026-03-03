# Deep Linking Setup Guide

## Quick Answer: Why Manual Setup is Required

Android **requires domain verification** for HTTPS App Links (`https://buylist.app/invite/*`) to work automatically. Without verification, Android shows a disambiguation dialog asking the user to choose between the browser and your app.

**Solution:** Set up domain verification (one-time setup), then all devices will automatically open your app for `https://buylist.app/invite/*` links.

---

## Option 1: Use Custom Scheme (Works Immediately) ✅

The `buylist://invite/CODE` scheme works **immediately** on any device with your APK installed — no domain setup needed.

**Use this for:**
- Testing on emulator/device
- Sharing invites before domain is set up
- Internal testing

**Example:** `buylist://invite/FfOd91riIq`

---

## Option 2: HTTPS App Links (Requires Domain Setup) 🌐

For `https://buylist.app/invite/*` to open automatically in your app, you need:

### Step 1: Get Your App's SHA-256 Fingerprint

**For Debug Build (Testing):**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256
```

**For Release Build (Production):**
```bash
keytool -list -v -keystore android/app/release.keystore -alias your-alias | grep SHA256
```

Copy the SHA-256 fingerprint (it looks like: `AA:BB:CC:DD:...`)

### Step 2: Generate assetlinks.json

```bash
node scripts/generate-assetlinks.js YOUR_SHA256_FINGERPRINT
```

This will output a JSON file. Copy the entire output.

### Step 3: Host the File

Create a file at: `https://buylist.app/.well-known/assetlinks.json`

**Requirements:**
- ✅ Must be accessible via HTTPS
- ✅ Must return `Content-Type: application/json`
- ✅ Must be exactly at `/.well-known/assetlinks.json` (not `/well-known/assetlinks.json`)
- ✅ No redirects (301/302) — must be a direct 200 response

**Example using nginx:**
```nginx
location /.well-known/assetlinks.json {
    add_header Content-Type application/json;
    return 200 '[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"com.buylist","sha256_cert_fingerprints":["YOUR_FINGERPRINT"]}}]';
}
```

### Step 4: Verify It Works

```bash
curl https://buylist.app/.well-known/assetlinks.json
```

Should return your JSON file.

### Step 5: Test on Device

1. **Uninstall the app** (or clear app data) — Android only verifies on first install
2. **Reinstall** the APK
3. **Open a link:** `https://buylist.app/invite/FfOd91riIq`
4. **Android will verify** the domain automatically (takes a few seconds)
5. **After verification**, the app opens automatically — no disambiguation dialog!

---

## Troubleshooting

### "Still shows disambiguation dialog"

1. **Check file is accessible:**
   ```bash
   curl -I https://buylist.app/.well-known/assetlinks.json
   ```
   Should return `200 OK` with `Content-Type: application/json`

2. **Check fingerprint matches:**
   - Debug builds use debug keystore fingerprint
   - Release builds use release keystore fingerprint
   - They must match exactly

3. **Clear app data and reinstall:**
   - Android caches verification results
   - Uninstall → Reinstall to trigger fresh verification

4. **Check Android logs:**
   ```bash
   adb logcat | grep -i "intentfilter"
   ```
   Look for verification success/failure messages

### "Verification failed"

- Ensure the JSON is valid (no trailing commas, proper formatting)
- Ensure the fingerprint is uppercase with no colons
- Ensure `package_name` is exactly `com.buylist`
- Ensure the file is served over HTTPS (not HTTP)

---

## Testing Without Domain Setup

For immediate testing, use the **custom scheme** in the in-app tester:

1. Open app → Home screen
2. Scroll to "Dev Tokens" section
3. Use: `buylist://invite/FfOd91riIq`
4. Tap the green → button

This works immediately without any domain setup!

---

## Summary

| Link Type | Works Immediately? | Requires Domain? | Use Case |
|-----------|-------------------|------------------|----------|
| `buylist://invite/CODE` | ✅ Yes | ❌ No | Testing, development |
| `https://buylist.app/invite/CODE` | ❌ No | ✅ Yes | Production, sharing |

**For production:** Set up domain verification once, then all `https://` links work automatically on all devices.
