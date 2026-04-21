import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABSfXjPKIyAcFo3M4DLDQUqI5cWm5cHhA",
  authDomain: "metysara-prod.firebaseapp.com",
  projectId: "metysara-prod",
  storageBucket: "metysara-prod.firebasestorage.app",
  messagingSenderId: "427456660895",
  appId: "1:427456660895:web:27cb2395a2e0e9e44fa9aa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Fetching all bookings...");
  const snapshot = await getDocs(collection(db, "bookings"));
  let migratedCount = 0;

  for (const bDoc of snapshot.docs) {
    const data = bDoc.data();
    const bId = bDoc.id;
    const rawDate = data.date;

    // Check if it's an ISO string (contains 'T')
    if (rawDate && typeof rawDate === 'string' && rawDate.includes('T')) {
      const shortDate = rawDate.split('T')[0];
      console.log(`Migrating booking [${bId}]: ${rawDate} -> ${shortDate}`);

      await updateDoc(doc(db, "bookings", bId), {
        date: shortDate,
        dateMigrated: true
      });
      migratedCount++;
    }
  }

  console.log(`Successfully migrated ${migratedCount} bookings.`);
  process.exit(0);
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
