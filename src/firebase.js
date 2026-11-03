import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

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

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
// Loaded on demand: Storage is only needed for seller image uploads. Keeping it out of the
// main bundle speeds up first load.
let storagePromise;
export function getStorageLazy() {
  storagePromise ??= import('firebase/storage').then((m) => ({ ...m, storage: m.getStorage(app) }));
  return storagePromise;
}

// Analytics is started by src/utils/analytics.js only after the visitor gives consent.
