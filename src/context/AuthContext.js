import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // THEME REFACTOR: Tracks global theme state universally across all components and screens
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUser({ uid: firebaseUser.uid, ...userDoc.data() });
                    } else {
                        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, faculty: 'FIEK' });
                    }
                } catch (e) {
                    console.log("Gabim gjatë leximit të profilit:", e);
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
        <AuthContext.Provider value={{
            user,
            setUser,
            loading,
            isDarkMode,
            setIsDarkMode // CRITICAL COMPILER FIX: Releases global context locks for inner screens
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
