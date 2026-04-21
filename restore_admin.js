import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABSfXjPKIyAcFo3M4DLDQUqI5cWm5cHhA",
  authDomain: "metysara-prod.firebaseapp.com",
  projectId: "metysara-prod",
  storageBucket: "metysara-prod.firebasestorage.app",
  messagingSenderId: "427456660895",
  appId: "1:427456660895:web:27cb2395a2e0e9e44fa9aa",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  const email = "hossam@metysara.com";
  const password = "Admin@1234";
  const name = "Hossam Admin";

  console.log(`Attempting to create admin account: ${email}...`);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    console.log(`Authentication account created successfully with UID: ${uid}`);

    // Create the user document with admin role
    await setDoc(doc(db, "users", uid), {
      uid,
      email,
      name,
      role: "admin",
      createdAt: new Date()
    });
    console.log(`Firestore user document created with ADMIN privileges.`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
       console.log("Auth account already exists. Re-logging in to update Firestore permissions...");
       try {
         const cred = await signInWithEmailAndPassword(auth, email, password);
         const uid = cred.user.uid;
         // Ensure it's marked as admin
         await setDoc(doc(db, "users", uid), {
           uid,
           email,
           name,
           role: "admin",
         }, { merge: true });
         console.log(`Firestore document updated to ADMIN for existing account ${uid}.`);
       } catch (signInErr) {
         console.error("Login failed:", signInErr.message);
       }
    } else {
       console.error("Critical error:", err.message);
    }
  }
}

run().catch(console.error);
