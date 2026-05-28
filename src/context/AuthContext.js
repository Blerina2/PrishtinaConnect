import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Fillon si TRUE

    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const jsonUser = await AsyncStorage.getItem('@PrishtinaConnect:user');
                if (jsonUser != null) {
                    setUser(JSON.parse(jsonUser));
                }
            } catch (e) {
                console.log("Gabim gjatë leximit të memorisë lokale:", e);
            } finally {
                setLoading(false); // Kthehet në FALSE vetëm kur përfundon plotësisht leximi
            }
        };
        loadStorageData();
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
