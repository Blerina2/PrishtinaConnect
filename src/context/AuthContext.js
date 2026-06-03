import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // RREGULLIMI: Hoqëm doc() e dyfishtë që shkaktonte dështim dhe bllokonte leximin e fakultetit
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        // Këtu marrim të dhënat e sakta nga Firestore (përfshirë fakultetin e saktë të regjistrimit)
                        setUser({ uid: firebaseUser.uid, ...userDoc.data() });
                    } else {
                        // Vlerë rezervë nëse dokumenti nuk gjendet për ndonjë arsye
                        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, faculty: 'FIEK' });
                    }
                } catch (e) {
                    console.log("Gabim gjatë leximit të profilit nga Firestore:", e);
                    setUser({ uid: firebaseUser.uid, email: firebaseUser.email, faculty: 'FIEK' });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, isDarkMode, setIsDarkMode }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
