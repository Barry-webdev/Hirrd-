// Configuration Firebase — remplace les valeurs par tes vraies credentials Firebase
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";

import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBUVMhx3hOy66bIcHONsZrRqwbV_5lwCO0",
  authDomain: "hirrde-pass.firebaseapp.com",
  projectId: "hirrde-pass",
  storageBucket: "hirrde-pass.firebasestorage.app",
  messagingSenderId: "597549685708",
  appId: "1:597549685708:web:417047a3e3b46c40f9db69",
  measurementId: "G-8QRSTVKP0J"
};

const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const auth    = getAuth(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);


export { app, db, auth, storage };
