import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Lexojmë temën direkt nga localStorage e Chrome në mënyrë sinkrone
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const savedTheme = window.localStorage.getItem('@PrishtinaConnect:theme');
            // Nëse nuk ka temë të ruajtur, vendoset Tema e Errët (true) si vlerë fillestare
            return savedTheme !== null ? JSON.parse(savedTheme) : true;
        }
        return true; // Fallback për mjedise të tjera
    });

    // Funksion i ri që ruan temën në Chrome sa herë që studenti e ndryshon atë te Settings
    const ndryshoTemenGlobalisht = (vleratERe) => {
        setIsDarkMode(vleratERe);
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('@PrishtinaConnect:theme', JSON.stringify(vleratERe));
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        setUser({ uid: firebaseUser.uid, ...userDoc.data() });
                    } else {
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

        <AuthContext.Provider value={{ user, setUser, loading, isDarkMode, setIsDarkMode: ndryshoTemenGlobalisht }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
