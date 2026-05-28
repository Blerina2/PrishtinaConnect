import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { isValidPrishtinaStudent } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ onLoginSuccess }) {
    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState('FIEK');
    const [error, setError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    const falkultetet = [
        { id: 'FIEK', icon: '💻' },
        { id: 'FSHMN', icon: '🔬' },
        { id: 'DIF', icon: '🏃‍♂️' },
        { id: 'Ekonomik', icon: '📊' },
        { id: 'Juridik', icon: '⚖️' },
        { id: 'Mjekësi', icon: '🩺' }
    ];

    const handleAuthAction = () => {
        setError('');
        Keyboard.dismiss();

        if (!email.trim() || !password.trim()) {
            setError('Ju lutem plotësoni të gjitha fushat.');
            return;
        }

        if (!isValidPrishtinaStudent(email)) {
            setError('Qasja u refuzua. Duhet email-i zyrtar @student.uni-pr.edu');
            return;
        }

        if (password.length < 6) {
            setError('Fjalëkalimi duhet të jetë së paku 6 karaktere.');
            return;
        }

        setAuthLoading(true);

        setTimeout(async () => {
            const cleanEmail = email.toLowerCase().trim();
            const userDocId = cleanEmail.replace(/[^a-zA-Z0-9]/g, "");

            const loggedUser = {
                email: cleanEmail,
                uid: "uid_" + userDocId,
                faculty: selectedFaculty
            };

            try {
                // ZGJIDHJA HIBRIDE: Ruajtja sinkrone për Web që eliminon bug-un e refresh-it
                if (Platform.OS === 'web') {
                    localStorage.setItem('@PrishtinaConnect:user', JSON.stringify(loggedUser));
                } else {
                    await AsyncStorage.setItem('@PrishtinaConnect:user', JSON.stringify(loggedUser));
                }

                setUser(loggedUser);
                onLoginSuccess(loggedUser);

                if (isRegistering) {
                    Alert.alert('Sukses 🎉', `Mirëseerdhët! Profili u krijua për fakultetin: ${selectedFaculty}`);
                }
            } catch (e) {
                console.log("Gabim gjatë ruajtjes së seancës:", e);
                setError('Problem me ruajtjen lokale.');
            } finally {
                setAuthLoading(false);
            }
        }, 600);
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>

                {/* Stema Vektoriale e UP-së */}
                <View style={styles.logoBackground}>
                    <View style={styles.upVectorShield}>
                        <Text style={styles.upVectorText}>UP</Text>
                        <View style={styles.upGoldLine} />
                    </View>
                </View>

                <Text style={styles.welcomeText}>Prishtina Connect</Text>
                <Text style={styles.loginSubText}>
                    {isRegistering ? 'Krijo profilin tënd studentor zyrtar' : 'Portal Komunikimi dhe Lajmesh - UP'}
                </Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>E-mail adresa zyrtare</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="emri.mbiemri@student.uni-pr.edu"
                        placeholderTextColor="#A0AEC0"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Fjalëkalimi</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#A0AEC0"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleAuthAction}
                    />
                </View>

                <View style={styles.facultySection}>
                    <Text style={styles.facultyTitle}>Zgjedh Fakultetin Tënd</Text>
                    <View style={styles.facultyGrid}>
                        {falkultetet.map((fak) => (
                            <TouchableOpacity
                                key={fak.id}
                                style={[styles.facultyButton, selectedFaculty === fak.id && styles.facultyActive]}
                                onPress={() => setSelectedFaculty(fak.id)}
                            >
                                <Text style={styles.facultyIcon}>{fak.icon}</Text>
                                <Text style={[styles.facultyBtnText, selectedFaculty === fak.id && styles.facultyTextActive]}>
                                    {fak.id}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleAuthAction} activeOpacity={0.9} disabled={authLoading}>
                    {authLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isRegistering ? 'Regjistrohu Tani 🚀' : 'Kyçuni në Portal 🔑'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.toggleContainer} onPress={() => { setIsRegistering(!isRegistering); setError(''); }}>
                    <Text style={styles.toggleText}>
                        {isRegistering ? 'Keni llogari? Kyçuni këtu' : 'Nuk keni llogari? Regjistrohuni këtu'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8', padding: 20 },
    card: { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#1A365D', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
    logoBackground: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 3, borderColor: '#EEB902', shadowColor: '#0B2545', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    upVectorShield: { alignItems: 'center', justifyContent: 'center' },
    upVectorText: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', letterSpacing: 1 },
    upGoldLine: { width: 40, height: 4, backgroundColor: '#EEB902', borderRadius: 2, marginTop: 2 },
    welcomeText: { fontSize: 24, fontWeight: '800', color: '#0B2545', letterSpacing: -0.5 },
    loginSubText: { fontSize: 13, color: '#718096', marginBottom: 25, textAlign: 'center', fontWeight: '500' },
    inputWrapper: { width: '100%', marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#4A5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { width: '100%', height: 48, borderColor: '#E2E8F0', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, color: '#0B2545', backgroundColor: '#F8FAFC', fontSize: 14, fontWeight: '500' },
    button: { width: '100%', height: 50, backgroundColor: '#0B2545', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15, borderBottomWidth: 3, borderBottomColor: '#EEB902' },
    buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    errorText: { color: '#C53030', marginBottom: 15, fontWeight: '600', backgroundColor: '#FFF5F5', padding: 12, borderRadius: 10, width: '100%', textAlign: 'center', fontSize: 12 },
    toggleContainer: { marginTop: 20, padding: 5 },
    toggleText: { color: '#0B2545', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
    facultySection: { width: '100%', marginBottom: 15, alignItems: 'flex-start' },
    facultyTitle: { fontSize: 12, fontWeight: '700', color: '#4A5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    facultyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
    facultyButton: { width: '48%', paddingVertical: 12, backgroundColor: '#F8FAFC', borderRadius: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: '#E2E8F0', flexDirection: 'row', paddingHorizontal: 12 },
    facultyActive: { backgroundColor: '#F0F4F8', borderColor: '#0B2545', borderWidth: 2 },
    facultyIcon: { fontSize: 16, marginRight: 8 },
    facultyBtnText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
    facultyTextActive: { color: '#0B2545', fontWeight: '800' }
});
