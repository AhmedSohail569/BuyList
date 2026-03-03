/**
 * Generate assetlinks.json for Android App Links
 * 
 * This file must be hosted at: https://buylist.app/.well-known/assetlinks.json
 * 
 * Usage:
 *   1. Get your app's SHA-256 fingerprint:
 *      - Debug: keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256
 *      - Release: keytool -list -v -keystore android/app/release.keystore -alias your-alias | grep SHA256
 * 
 *   2. Run this script: node scripts/generate-assetlinks.js YOUR_SHA256_FINGERPRINT
 * 
 *   3. Copy the output to: https://buylist.app/.well-known/assetlinks.json
 */

const sha256Fingerprint = process.argv[2];

if (!sha256Fingerprint) {
  console.error("❌ Error: SHA-256 fingerprint required");
  console.log("\nUsage: node scripts/generate-assetlinks.js YOUR_SHA256_FINGERPRINT");
  console.log("\nTo get your SHA-256 fingerprint:");
  console.log("  Debug: keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256");
  console.log("  Release: keytool -list -v -keystore android/app/release.keystore -alias your-alias | grep SHA256");
  process.exit(1);
}

// Remove colons and convert to uppercase (Android expects uppercase, no colons)
const formattedFingerprint = sha256Fingerprint.replace(/:/g, "").toUpperCase();

const assetlinks = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.buylist",
      sha256_cert_fingerprints: [formattedFingerprint],
    },
  },
];

console.log("\n✅ Generated assetlinks.json:\n");
console.log(JSON.stringify(assetlinks, null, 2));
console.log("\n📋 Next steps:");
console.log("1. Host this JSON at: https://buylist.app/.well-known/assetlinks.json");
console.log("2. Ensure the file is served with Content-Type: application/json");
console.log("3. Verify it's accessible: curl https://buylist.app/.well-known/assetlinks.json");
console.log("4. Reinstall the app (or clear app data) to trigger Android verification");
console.log("\n💡 Note: Android verifies the domain on first install. After verification,");
console.log("   all https://buylist.app/invite/* links will automatically open your app!\n");
