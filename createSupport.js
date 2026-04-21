import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABSfXjPKIyAcFo3M4DLDQUqI5cWm5cHhA",
  authDomain: "metysara-prod.firebaseapp.com",
  projectId: "metysara-prod",
  storageBucket: "metysara-prod.firebasestorage.app",
  messagingSenderId: "427456660895",
  appId: "1:427456660895:web:27cb2395a2e0e9e44fa9aa"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createSupportAccount(email, name, password) {
  console.log(`Creating ${name} at ${email}...`);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email: email,
      name: name,
      role: "support"
    });
    console.log(`✅ Created ${name} successfully!`);
  } catch (e) {
    console.log(`❌ ${name} error: `, e.message);
  }
}

async function run() {
  try {
    await createSupportAccount("m1@metysarasupport.com", "Support M1", "password123");
    await createSupportAccount("m2@metysarasupport.com", "Support M2", "password123");
    await createSupportAccount("m3@metysarasupport.com", "Support M3", "password123");
  } catch(e) {
    console.error("Fatal Error: ", e);
  }
  process.exit(0);
}

run();
