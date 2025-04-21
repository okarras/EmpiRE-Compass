// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDDvixkM17sWyw9XjsUZOUyBHgeC7GkuZw',
  authDomain: 'projectdbclass.firebaseapp.com',
  projectId: 'projectdbclass',
  storageBucket: 'projectdbclass.firebasestorage.app',
  messagingSenderId: '565133906368',
  appId: '1:565133906368:web:9a3dbce23f845a0f127825',
  measurementId: 'G-EC9VETBXZ3',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Initialize other services
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
