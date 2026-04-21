import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
const auth = getAuth(app);

async function run() {
  try {
    await signInWithEmailAndPassword(auth, "m1@metysarasupport.com", "password123");
    
    console.log("Fetching all comments...");
    const commentsSnap = await getDocs(collection(db, "comments"));
    const allComments = commentsSnap.docs.map(d => Object.assign(d.data(), {id: d.id}));
    console.log("Total comments found:", allComments.length);

    const venuesSnap = await getDocs(collection(db, "venues"));
    console.log("Total venues found:", venuesSnap.docs.length);

    for (const d of venuesSnap.docs) {
        const venueComments = allComments.filter(c => c.venueId === d.id);
        const count = venueComments.length;
        const data = d.data();
        
        console.log(`[${d.id}] ${data.name}: DbRating=${data.rating}, DbReviews=${data.reviews} | Counted=${count}`);
    }
  } catch(e) {
    console.error("Error", e.message);
  }
  process.exit(0);
}

run();
