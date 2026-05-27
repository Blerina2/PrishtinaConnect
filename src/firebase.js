import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB8GCJ-if1ZUND0oazyeBzGjTsyx7Q9isg",
    authDomain: "://firebaseapp.com",
    projectId: "prishtina-connect",
    storageBucket: "prishtina-connect.firebasestorage.app",
    messagingSenderId: "423059141293",
    appId: "1:423059141293:web:869933a294fbdf28df6424"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const isUPStudent = (email) => {
    return email ? email.toLowerCase().endsWith("@uni-pr.edu") : false;
};