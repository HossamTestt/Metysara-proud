import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyABSfXjPKIyAcFo3M4DLDQUqI5cWm5cHhA",
  authDomain: "metysara-prod.firebaseapp.com",
  projectId: "metysara-prod",
  storageBucket: "metysara-prod.firebasestorage.app",
  messagingSenderId: "427456660895",
  appId: "1:427456660895:web:27cb2395a2e0e9e44fa9aa",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  try {
    const email = "hossam@metysara.com";
    const password = "Admin@1234";

    console.log(`Logging in as ${email}...`);
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in successfully.");

    const commentsSnap = await getDocs(collection(db, "comments"));
    const allComments = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const venuesSnap = await getDocs(collection(db, "venues"));
    let updatedCount = 0;

    for (const d of venuesSnap.docs) {
        const venueId = d.id;
        const venueData = d.data();
        
        const venueComments = allComments.filter(c => String(c.venueId) === String(venueId));
        const count = venueComments.length;
        
        let avgRating = 0;
        if (count > 0) {
            const sum = venueComments.reduce((s, c) => s + (Number(c.rating) || 0), 0);
            avgRating = Math.round((sum / count) * 10) / 10;
        }

        if (venueData.reviews !== count || venueData.rating !== avgRating) {
            console.log(`Updating Venue [${venueId}] (${venueData.name}): Reviews=${count}, Rating=${avgRating}`);
            await updateDoc(doc(db, "venues", venueId), {
                reviews: count,
                rating: avgRating
            });
            updatedCount++;
        }
    }
    console.log(`Updated ${updatedCount} venues.`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
