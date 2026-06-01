import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { isUPStudent } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState('FIEK');
    const [error, setError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    const falkultetet = [
        { id: 'FIEK', icon: '💻' }, { id: 'FSHMN', icon: '🔬' },
        { id: 'DIF', icon: '🏃\u200d♂️' }, { id: 'Ekonomik', icon: '📊' },
        { id: 'Juridik', icon: '⚖️' }, { id: 'Mjekësi', icon: '🩺' }
    ];

    const handleAuthAction = async () => {
        setError('');
        Keyboard.dismiss();

        const cleanEmail = email.toLowerCase().trim();

        if (!cleanEmail || !password.trim()) {
            setError('Ju lutem plotësoni të gjitha fushat.');
            return;
        }

        if (!isUPStudent(cleanEmail)) {
            setError('Qasja u refuzua. Duhet email-i zyrtar @student.uni-pr.edu');
            return;
        }

        if (password.length < 6) {
            setError('Fjalëkalimi duhet të jetë së paku 6 karaktere.');
            return;
        }

        setAuthLoading(true);

        try {
            if (isRegistering) {
                // Krijimi i llogarisë së re
                const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
                const newUser = {
                    email: cleanEmail,
                    faculty: selectedFaculty,
                    uid: userCredential.user.uid,
                    createdAt: new Date().toISOString()
                };

                // Ruajtja e të dhënave në Firestore
                await setDoc(doc(db, 'users', userCredential.user.uid), newUser);

                Alert.alert('Sukses 🎉', `Llogaria u krijua! Ju lutem kyçuni tani.`);
                setIsRegistering(false);
                setPassword('');
            } else {
                // Procesi i Kyçjes (Login)
                const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);

                // Leximi i të dhënave të profilit nga Firestore
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
                if (userDoc.exists()) {
                    setUser({ uid: userCredential.user.uid, ...userDoc.data() });
                } else {
                    setUser({ uid: userCredential.user.uid, email: cleanEmail, faculty: 'FIEK' });
                }
            }
        } catch (err) {
            console.error("Auth Error i plotë:", err);

            // Menaxhimi i saktë i gabimeve të Firebase v9+ në Web
            if (
                err.code === 'auth/user-not-found' ||
                err.code === 'auth/wrong-password' ||
                err.code === 'auth/invalid-credential' ||
                err.code === 'auth/invalid-email'
            ) {
                setError('Email-i ose fjalëkalimi është i gabuar ose llogaria nuk ekziston.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Ky email është i regjistruar paraprakisht.');
            } else if (err.code === 'auth/weak-password') {
                setError('Fjalëkalimi duhet të jetë së paku 6 karaktere.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('Problem me rrjetin. Kontrolloni lidhjen tuaj të internetit.');
            } else {
                // Nëse ka gabim tjetër (p.sh. lejet e Firestore), të tregon kodin ekzakte në ekran
                setError(`Gabim: ${err.code || 'Problem me autorizim'}. Provoni përsëri.`);
            }
        } finally {
            setAuthLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
                <View style={styles.logoBackground}><Text style={styles.upVectorText}>UP</Text></View>
                <Text style={styles.welcomeText}>Prishtina Connect</Text>
                <Text style={styles.loginSubText}>{isRegistering ? 'Krijo profilin tënd zyrtar' : 'Portal Komunikimi dhe Lajmesh - UP'}</Text>

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
                    />
                </View>

                {isRegistering && (
                    <View style={styles.facultySection}>
                        <Text style={styles.facultyTitle}>Zgjedh Fakultetin Tënd</Text>
                        <View style={styles.facultyGrid}>
                            {falkultetet.map((fak) => (
                                <TouchableOpacity
                                    key={fak.id}
                                    style={[styles.facultyButton, selectedFaculty === fak.id && styles.facultyActive]}
                                    onPress={() => setSelectedFaculty(fak.id)}
                                >
                                    <Text style={styles.facultyIcon}>{fak.icon} {fak.id}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.button} onPress={handleAuthAction} disabled={authLoading} activeOpacity={0.8}>
                    {authLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{isRegistering ? 'Regjistrohu Tani 🚀' : 'Kyçu në Portal 🔑'}</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.toggleContainer} onPress={() => { setIsRegistering(!isRegistering); setError(''); }}>
                    <Text style={styles.toggleText}>{isRegistering ? 'Keni llogari? Kyçuni këtu' : 'Nuk keni llogari? Regjistrohuni këtu'}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8', padding: 20 },
    card: { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', shadowOpacity: 0.1, elevation: 5 },
    logoBackground: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: '#EEB902' },
    upVectorText: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
    welcomeText: { fontSize: 22, fontWeight: '800', color: '#0B2545' },
    loginSubText: { fontSize: 13, color: '#718096', marginBottom: 20 },
    inputWrapper: { width: '100%', marginBottom: 12 },
    inputLabel: { fontSize: 11, fontWeight: '700', color: '#4A5568', marginBottom: 4 },
    input: { width: '100%', height: 46, borderColor: '#E2E8F0', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F8FAFC', color: '#0B2545' },
    facultySection: { width: '100%', marginVertical: 10 },
    facultyTitle: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
    facultyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    facultyButton: { width: '48%', padding: 10, backgroundColor: '#F8FAFC', borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' },
    facultyActive: { borderColor: '#0B2545', backgroundColor: '#EBF8FF' },
    button: { width: '100%', height: 46, backgroundColor: '#0B2545', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#FFFFFF', fontWeight: '700' },
    errorText: { color: '#C53030', backgroundColor: '#FFF5F5', padding: 10, borderRadius: 8, width: '100%', textAlign: 'center', marginBottom: 10, fontSize: 12, fontWeight: '600' },
    toggleContainer: { marginTop: 15 },
    toggleText: { color: '#0B2545', fontWeight: '700', textDecorationLine: 'underline' }
});
