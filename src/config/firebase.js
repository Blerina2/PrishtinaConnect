import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB8GCJ-if1ZUND0oazyeBzGjTsyx7Q9isg",
    authDomain: "://firebaseapp.com", // rregulluar formati i autorizimit
    projectId: "prishtina-connect",
    storageBucket: "prishtina-connect.firebasestorage.app",
    messagingSenderId: "423059141293",
    appId: "1:423059141293:web:869933a294fbdf28df6424"
};

// Inicializimi i Firebase
const app = initializeApp(firebaseConfig);

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
 * Nxjerr automatikisht fakultetin ose departamentin nga emaili i studentit
 * Shembull: blerina.beka.fiek@student.uni-pr.edu -> Kthen "FIEK"
 * Nëse emaili nuk ka ndarje, kthen "UP" si vlerë standarde.
 */
export const extractFacultyFromEmail = (email) => {
    if (!email) return "UP";
    const namePart = email.split('@')[0].toLowerCase();

    if (namePart.includes('fiek')) return 'FIEK';
    if (namePart.includes('fshmn')) return 'FSHMN';
    if (namePart.includes('fe')) return 'Ekonomik';
    if (namePart.includes('fd')) return 'Juridik';

    return 'FIEK'; // Vlerë e paracaktuar (Default) për testet tuaja demo
};
