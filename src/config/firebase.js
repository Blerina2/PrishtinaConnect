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

// Inicializimi zyrtar i Firebase
const app = initializeApp(firebaseConfig);

// Eksportet e sakta me emrat tuaj origjinalë
export const authInstance = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const dbInstance = getFirestore(app);

/**
 * Kontrollon nëse emaili është valid me domenin e ri studentor të UP-së
 * @param {string} email
 * @returns {boolean}
 */
export const isValidPrishtinaStudent = (email) => {
    if (!email) return false;
    return email.toLowerCase().trim().endsWith("@student.uni-pr.edu");
};

/**
 * Funksioni Fallback
 * Është lënë i zbrazët që të mos mbishkruajë apo detyrojë asnjë vlerë "FIEK" automatikisht.
 * Fakulteti tani merret 100% i saktë nga ajo që zgjedh studenti në ekran.
 */
export const extractFacultyFromEmail = (email) => {
    return "";
};
