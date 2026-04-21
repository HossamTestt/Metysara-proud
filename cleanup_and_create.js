import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

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

async function run() {
  try {
     // Create new admins first to ensure they exist
     console.log("Creating HEssile...");
     let uid1, uid2;
     try {
       const cred1 = await createUserWithEmailAndPassword(auth, "HEssile@Metysara.com", "Admin@1234");
       uid1 = cred1.user.uid;
       await setDoc(doc(db, "users", uid1), { uid: uid1, email: "HEssile@Metysara.com", name: "HEssile", role: "admin" });
       console.log("Created HEssile Admin");
     } catch (e) {
       console.log("HEssile error: ", e.message);
     }
     
     console.log("Creating MElmansory...");
     try {
       const cred2 = await createUserWithEmailAndPassword(auth, "MElmansory@metysara.com", "Admin@1234");
       uid2 = cred2.user.uid;
       await setDoc(doc(db, "users", uid2), { uid: uid2, email: "MElmansory@metysara.com", name: "MElmansory", role: "admin" });
       console.log("Created MElmansory Admin");
     } catch (e) {
       console.log("MElmansory error: ", e.message);
     }

     // Now sign in as one of them to get Admin permissions
     console.log("Signing in as Admin to clear database...");
     await signInWithEmailAndPassword(auth, "HEssile@Metysara.com", "Admin@1234");

     // Clean up Collections
     const collectionsToClear = ["venues", "bookings", "tickets", "notifications", "chats", "comments"];
     
     for (const col of collectionsToClear) {
         console.log(`Clearing collection: ${col}...`);
         const snap = await getDocs(collection(db, col));
         let count = 0;
         for (const d of snap.docs) {
             await deleteDoc(doc(db, col, d.id));
             count++;
         }
         console.log(`Deleted ${count} documents from ${col}.`);
     }

     // Clean up Users (Except the two new admins)
     console.log("Clearing fake users...");
     const usersSnap = await getDocs(collection(db, "users"));
     let uCount = 0;
     for (const u of usersSnap.docs) {
         const data = u.data();
         if (data.email?.toLowerCase() !== "hessile@metysara.com" && 
             data.email?.toLowerCase() !== "melmansory@metysara.com") {
             await deleteDoc(doc(db, "users", u.id));
             uCount++;
         }
     }
     console.log(`Deleted ${uCount} fake users from Firestore.`);
     
     console.log("✅ Cleanup and Admin creation complete!");
  } catch(e) {
     console.error("Fatal: ", e);
  }
  process.exit(0);
}
run();
