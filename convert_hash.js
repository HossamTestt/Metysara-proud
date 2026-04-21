const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: node convert_hash.js <YOUR_SHA1_FINGERPRINT>");
  console.log("Example: node convert_hash.js 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25");
  process.exit(1);
}

const sha1Hex = args[0].replace(/:/g, '');
const sha1Buffer = Buffer.from(sha1Hex, 'hex');
const base64Hash = sha1Buffer.toString('base64');

console.log("\n==================================");
console.log("YOUR FACEBOOK HASH KEY IS:");
console.log(base64Hash);
console.log("==================================\n");
