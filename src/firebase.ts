import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6IJrRpgWXw_cWxQryYMCTdBo91vnt5LY",
  authDomain: "vku-room-booking-72090.firebaseapp.com",
  projectId: "vku-room-booking-72090",
  storageBucket: "vku-room-booking-72090.firebasestorage.app",
  messagingSenderId: "742652967021",
  appId: "1:742652967021:web:75bf0a6b0d1d2e2fa8a764",
  measurementId: "G-GCW7T931W6"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
