import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDikZgQVfiJ31zHapRmDpmEnRSHdoTQN8M",
  authDomain: "brandclothzy.firebaseapp.com",
  databaseURL: "https://brandclothzy-default-rtdb.firebaseio.com",
  projectId: "brandclothzy",
  storageBucket: "brandclothzy.firebasestorage.app",
  messagingSenderId: "598687617849",
  appId: "1:598687617849:web:553576b24e02e6d95b8ee8",
  measurementId: "G-K6G07KR20D",
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
export const storage = getStorage(app);
