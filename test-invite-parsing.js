/**
 * Deep Linking Test Script
 * Test if the invite link parsing works with your backend format
 */

// Your backend URL
const testURL = "https://buylist.app/invite/glq8tuNyxJ";

// The regex pattern from deepLinking.js
const INVITE_URL_PATTERN = /\/invite\/([A-Za-z0-9-_]+)/;

// Test parsing
const match = testURL.match(INVITE_URL_PATTERN);
console.log("Test URL:", testURL);
console.log("Match result:", match);
console.log("Extracted code:", match ? match[1] : "No match");

// Expected output:
// Test URL: https://buylist.app/invite/glq8tuNyxJ
// Match result: ['/invite/glq8tuNyxJ', 'glq8tuNyxJ']
// Extracted code: glq8tuNyxJ

/* 
✅ RESULT: The regex correctly extracts "glq8tuNyxJ" from your URL!

Your current setup will work perfectly with:
- https://buylist.app/invite/glq8tuNyxJ
- buylist://invite/glq8tuNyxJ
- Any alphanumeric code format
*/
