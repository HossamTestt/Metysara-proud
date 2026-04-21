import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

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
  const venueId = "1774336557629";
  const docSnap = await getDoc(doc(db, "venues", venueId));
  if (docSnap.exists()) {
    console.log("Venue Data:", JSON.stringify(docSnap.data(), null, 2));
  } else {
    console.log("Venue not found");
  }

  const commentsSnap = await getDocs(collection(db, "comments"));
  const venueComments = commentsSnap.docs
    .map(d => d.data())
    .filter(c => c.venueId === venueId);
  
  console.log(`Found ${venueComments.length} comments for this venue.`);
  venueComments.forEach((c, i) => console.log(`Comment ${i+1}: Rating=${c.rating}`));

  process.exit(0);
}
run();
