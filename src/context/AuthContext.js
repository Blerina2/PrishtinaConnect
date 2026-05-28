import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const initializeAuthAndTheme = async () => {
            try {
                // ZGJIDHJA PËR WEB: Nëse jemi në Web, përdorim direkt localStorage të shfletuesit që është instant
                if (Platform.OS === 'web') {
                    const storedUser = localStorage.getItem('@PrishtinaConnect:user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }

                    const storedTheme = localStorage.getItem('@PrishtinaConnect:theme');
                    if (storedTheme) {
                        setIsDarkMode(JSON.parse(storedTheme));
                    }
                } else {
                    // Nëse jemi në Telefon (Android/iOS), përdorim AsyncStorage si më parë
                    const jsonUser = await AsyncStorage.getItem('@PrishtinaConnect:user');
                    if (jsonUser != null) {
                        setUser(JSON.parse(jsonUser));
                    }

                    const storedTheme = await AsyncStorage.getItem('@PrishtinaConnect:theme');
                    if (storedTheme != null) {
                        setIsDarkMode(JSON.parse(storedTheme));
                    }
                }
            } catch (e) {
                console.log("Gabim gjatë leximit të seancës:", e);
            } finally {
                setLoading(false); // Efikim loading vetëm kur përfundon leximi
            }
        };
        initializeAuthAndTheme();
    }, []);

    const toggleTheme = async () => {
        try {
            const nextTheme = !isDarkMode;
            setIsDarkMode(nextTheme);

            if (Platform.OS === 'web') {
                localStorage.setItem('@PrishtinaConnect:theme', JSON.stringify(nextTheme));
            } else {
                await AsyncStorage.setItem('@PrishtinaConnect:theme', JSON.stringify(nextTheme));
            }
        } catch (e) {
            console.log("Gabim gjatë ruajtjes së temës:", e);
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
