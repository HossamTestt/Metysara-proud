const { execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const path = require('path');

try {
  const keystorePath = path.join(os.homedir(), '.android', 'debug.keystore');
  const command = `keytool -list -v -keystore "${keystorePath}" -alias androiddebugkey -storepass android -keypass android`;
  const output = execSync(command, { encoding: 'utf-8' });
  const sha1Match = output.match(/SHA1:\s+([0-9A-F:]+)/);
  if (sha1Match) {
    const sha1Hex = sha1Match[1].replace(/:/g, '');
    const sha1Buffer = Buffer.from(sha1Hex, 'hex');
    const base64Hash = sha1Buffer.toString('base64');
    console.log('--- KEYS GENERATED SUCCESSFULLY ---');
    console.log('\nFirebase (Google Login) SHA1: ');
    console.log(sha1Match[1]);
    console.log('\nFacebook Login Hash Key: ');
    console.log(base64Hash);
    console.log('\n-----------------------------------');
  } else {
    console.log('Could not find SHA1 in output. Output was:', output);
  }
} catch (e) {
  console.log('Error executing keytool cmd. Details:', e.message);
}
