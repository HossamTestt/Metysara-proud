const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // I need to check if this exists

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const phone = '01099847001';

async function findAndNotify() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('phone', '==', phone).get();
  
  if (snapshot.empty) {
    console.log('No user found with phone:', phone);
    return;
  }

  snapshot.forEach(async (doc) => {
    const userData = doc.data();
    console.log('User found:', userData.name, 'with FCM:', !!userData.fcmToken);
    
    if (userData.fcmToken) {
      const message = {
        notification: {
          title: 'Metysara Test',
          body: 'Hello! This is a test push notification with your new icon.'
        },
        token: userData.fcmToken,
        android: {
          notification: {
            smallIcon: 'ic_stat_notification',
            color: '#D4AF37'
          }
        }
      };

      try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
      } catch (error) {
        console.log('Error sending message:', error);
      }
    }
  });
}

findAndNotify();
