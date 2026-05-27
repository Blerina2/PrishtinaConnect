import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB8GCJ-if1ZUND0oazyeBzGjTsyx7Q9isg",
    authDomain: "://firebaseapp.com",
    projectId: "prishtina-connect",
    storageBucket: "prishtina-connect.firebasestorage.app",
    messagingSenderId: "423059141293",
    appId: "1:423059141293:web:869933a294fbdf28df6424"
};

const app = initializeApp(firebaseConfig);
export const authInstance = getAuth(app);
export const dbInstance = getFirestore(app);

export const isValidPrishtinaStudent = (email) => {
    if (!email) return false;
    return email.toLowerCase().endsWith('@uni-pr.edu');
};