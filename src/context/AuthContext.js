import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedTheme = Platform.OS === 'web'
                    ? localStorage.getItem('@PrishtinaConnect:theme')
                    : await AsyncStorage.getItem('@PrishtinaConnect:theme');
                if (storedTheme) setIsDarkMode(JSON.parse(storedTheme));
            } catch (e) {
                console.log("Gabim me temën:", e);
            }
        };
        loadTheme();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
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

        return unsubscribe;
    }, []);

    const toggleTheme = async () => {
        const nextTheme = !isDarkMode;
        setIsDarkMode(nextTheme);
        if (Platform.OS === 'web') {
            localStorage.setItem('@PrishtinaConnect:theme', JSON.stringify(nextTheme));
        } else {
            await AsyncStorage.setItem('@PrishtinaConnect:theme', JSON.stringify(nextTheme));
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, isDarkMode, toggleTheme }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
