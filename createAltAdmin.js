import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABSfXjPKIyAcFo3M4DLDQUqI5cWm5cHhA",
  authDomain: "metysara-prod.firebaseapp.com",
  projectId: "metysara-prod",
  storageBucket: "metysara-prod.firebasestorage.app",
  messagingSenderId: "427456660895",
  appId: "1:427456660895:web:27cb2395a2e0e9e44fa9aa",
  measurementId: "G-2VEFHPYNHF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
     console.log("Creating hossam_admin@metysara.com...");
     const cred = await createUserWithEmailAndPassword(auth, "hossam_admin@metysara.com", "Admin@1234");
     await setDoc(doc(db, "users", cred.user.uid), { 
         uid: cred.user.uid, 
         email: "hossam_admin@metysara.com", 
         name: "Hossam Admin", 
         role: "admin" 
     });
     console.log("SUCCESS: Created hossam_admin@metysara.com Admin!");
  } catch (e) {
     console.log("Error creating user: ", e.message);
  }
  process.exit(0);
}
run();
