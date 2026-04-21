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
    await signInWithEmailAndPassword(auth, "hossam@metysara.com", "Admin@1234");
    console.log("Logged in as Admin");
    
    const snapshot = await getDocs(collection(db, "venues"));
    for (const d of snapshot.docs) {
        const data = d.data();
        if (data.name && data.name.toLowerCase().includes("soul")) {
            console.log(`Updating [${d.id}]: ${data.name}`);
            await updateDoc(doc(db, "venues", d.id), {
                location: "Omrania, Giza",
                locationLink: "https://maps.app.goo.gl/QcZtxP8sR5b3o"
            });
        }
    }
    console.log("All updated");
  } catch(e) {
    console.error("Error", e);
  }
  process.exit(0);
}
run();
