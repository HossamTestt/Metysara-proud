import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
  const snapshot = await getDocs(collection(db, "venues"));
  let found = 0;
  snapshot.docs.forEach(d => {
      const data = d.data();
      if (data.name && data.name.toLowerCase().includes("soul")) {
          console.log(`[${d.id}]: ${data.name} | Location: ${data.location} | Link: ${data.locationLink}`);
          found++;
      }
  });
  console.log("Total Soul Halls: ", found);
  process.exit(0);
}
run();
