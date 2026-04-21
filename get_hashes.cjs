const { execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs');

try {
  let keytoolPath = 'keytool'; 
  const potentialPaths = [
    'C:/Program Files/Android/Android Studio/jbr/bin/keytool.exe',
    'C:/Program Files/Android/Android Studio/jre/bin/keytool.exe',
    'C:/Program Files/Java/jdk-17/bin/keytool.exe',
    'C:/Program Files/Java/jdk-11/bin/keytool.exe',
  ];
  for (const p of potentialPaths) {
    if (fs.existsSync(p)) {
      keytoolPath = `"${p}"`;
      break;
    }
  }

  const keystorePath = path.join(os.homedir(), '.android', 'debug.keystore');
  const command = `${keytoolPath} -list -v -keystore "${keystorePath}" -alias androiddebugkey -storepass android -keypass android`;
  console.log(`Running: ${command}`);
  const output = execSync(command, { encoding: 'utf-8' });
  const sha1Match = output.match(/SHA1:\s+([0-9A-F:]+)/);
  if (sha1Match) {
    const sha1Hex = sha1Match[1].replace(/:/g, '');
    const sha1Buffer = Buffer.from(sha1Hex, 'hex');
    const base64Hash = sha1Buffer.toString('base64');
    console.log('\n--- KEYS GENERATED SUCCESSFULLY ---');
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
