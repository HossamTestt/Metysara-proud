import { initializeApp } from "firebase/app";
import { getFirestore, updateDoc, doc } from "firebase/firestore";
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
    console.log("Logging in...");
    await signInWithEmailAndPassword(auth, "hossam@metysara.com", "Admin@1234");
    console.log("Logged in.");

    const venueId = "1774336557629";
    console.log(`Updating venue ${venueId}...`);
    
    await updateDoc(doc(db, "venues", venueId), {
      reviews: 3,
      rating: 5.0
    });
    
    console.log("Successfully updated Soul Hall!");
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
// Don't call process.exit() to avoid the gRPC crash
