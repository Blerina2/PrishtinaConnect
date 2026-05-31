import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB8GCJ-if1ZUNOdoazyeBzOjTeyx7Q9isg",
    authDomain: "prishtina-connect.firebaseapp.com",
    projectId: "prishtina-connect",
    storageBucket: "prishtina-connect.firebasestorage.app",
    messagingSenderId: "423859141293",
    appId: "1:423859141293:web:869933a294fbdf28df6424"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const isUPStudent = (email) => {
    if (!email) return false;
    return email.toLowerCase().trim().endsWith("@student.uni-pr.edu");
};
