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
     console.log("Creating Hossam...");
     try {
       const cred1 = await createUserWithEmailAndPassword(auth, "hossam@metysara.com", "Admin@1234");
       await setDoc(doc(db, "users", cred1.user.uid), { uid: cred1.user.uid, email: "hossam@metysara.com", name: "Hossam", role: "admin" });
       console.log("Created Hossam Admin");
     } catch (e) {
       console.log("Hossam error: ", e.message);
     }
     
     console.log("Creating Elmansory...");
     try {
       const cred2 = await createUserWithEmailAndPassword(auth, "elmansory@metysara.com", "Admin@1234");
       await setDoc(doc(db, "users", cred2.user.uid), { uid: cred2.user.uid, email: "elmansory@metysara.com", name: "Elmansory", role: "admin" });
       console.log("Created Elmansory Admin");
     } catch (e) {
       console.log("Elmansory error: ", e.message);
     }

  } catch(e) {
     console.error("Fatal: ", e);
  }
  process.exit(0);
}
run();
