import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBSM0kMxsq3sm1LbAajE6EAFxDiPpcm3SU",
    authDomain: "tomato-ripeness-d12c3.firebaseapp.com",
    projectId: "tomato-ripeness-d12c3",
    messagingSenderId: "712137883145",
    appId: "1:712137883145:web:a4ac9323b3dbb3a6ee42d8",
    measurementId: "G-2DJN9XX8VD"
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;