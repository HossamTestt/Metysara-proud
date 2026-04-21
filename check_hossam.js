import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
  const hossamUid = "b8JVOvf4n4bfjk7JXCiz8nmaSwG2";
  const docSnap = await getDoc(doc(db, "users", hossamUid));
  if (docSnap.exists()) {
    console.log("Hossam exists in users collection:", JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log("Hossam NOT found in users collection.");
  }
}
run();
