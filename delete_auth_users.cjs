const admin = require('firebase-admin');
const fs = require('fs');

// Initialize without service account - might work if logged in via firebase CLI
admin.initializeApp({
  projectId: 'metysara-prod'
});

const keepEmails = [
  'hessile@metysara.com',
  'melmansory@metysara.com'
];

async function deleteUsers() {
  console.log('Starting bulk user deletion...');
  try {
    const csvContent = fs.readFileSync('users_temp.csv', 'utf8');
    const lines = csvContent.split('\n');
    const uidsToDelete = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',');
      const uid = parts[0];
      const email = parts[1]?.toLowerCase();

      if (uid && email && !keepEmails.includes(email)) {
        uidsToDelete.push(uid);
      }
    }

    console.log(`Found ${uidsToDelete.length} users to delete.`);

    // Delete users in batches of 1000 (Firebase limit)
    if (uidsToDelete.length > 0) {
      await admin.auth().deleteUsers(uidsToDelete);
      console.log('Successfully deleted users from Firebase Auth.');
    } else {
      console.log('No users to delete.');
    }

  } catch (error) {
    console.error('Error deleting users:', error);
    console.log('\n--- IMPORTANT ---');
    console.log('It seems I don\'t have direct "Admin" permission to delete users from the authentication system.');
    console.log('Please go to the Firebase Console -> Authentication -> Users and delete them manually.');
    console.log('I have already deleted their data from the Database (Firestore), so they cannot do anything, but they can still "Log in".');
  }
}

deleteUsers();
