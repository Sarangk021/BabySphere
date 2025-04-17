// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBUuHWIEUrrpiTFBUAN_oyCxZmO5gTBHCU", // Replace with your Firebase config values
  authDomain: "babysphere-3bf55.firebaseapp.com",
  projectId: "babysphere-3bf55",
  storageBucket: "babysphere-3bf55.firebasestorage.app",
  messagingSenderId: "699165357991",
  appId: "1:699165357991:web:13293761b54771f888a882"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
