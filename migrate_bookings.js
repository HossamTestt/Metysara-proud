import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteField, updateDoc } from "firebase/firestore";

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
  console.log("Fetching venues for images...");
  const venuesSnapshot = await getDocs(collection(db, "venues"));
  const venueImages = {};
  venuesSnapshot.forEach(doc => {
    venueImages[doc.id] = (doc.data().images?.[0]) || null;
  });

  console.log("Fetching bookings...");
  const bookingsSnapshot = await getDocs(collection(db, "bookings"));
  let migratedCount = 0;

  for (const bDoc of bookingsSnapshot.docs) {
    const data = bDoc.data();
    const bId = bDoc.id;

    // Check if it needs migration
    if (data.customerPhone || data.customerEmail || data.customerName || data.notes || data.services) {
        console.log(`Migrating booking [${bId}] for ${data.customerName || 'unknown'}...`);

        // 1. Create subcollection document
        const subDocRef = doc(db, "bookings", bId, "private_details", "contact");
        await setDoc(subDocRef, {
            type: "contact",
            customerName: data.customerName || null,
            customerPhone: data.customerPhone || null,
            customerEmail: data.customerEmail || null,
            notes: data.notes || "",
            services: data.services || [],
            migratedAt: new Date().toISOString()
        });

        // 2. Update root document
        const rootUpdates = {
            migrated: true,
            customerName: deleteField(),
            customerPhone: deleteField(),
            customerEmail: deleteField(),
            notes: deleteField(),
            services: deleteField()
        };

        if (!data.venueImage && venueImages[data.venueId]) {
            rootUpdates.venueImage = venueImages[data.venueId];
        }

        await updateDoc(doc(db, "bookings", bId), rootUpdates);
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
