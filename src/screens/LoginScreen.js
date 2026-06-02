import React, { useState, useRef } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { isUPStudent } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const { setUser, isDarkMode, setIsDarkMode } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [backupEmail, setBackupEmail] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState('FIEK');
    const [error, setError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotUPEmail, setForgotUPEmail] = useState('');
    const [recoveryLoading, setRecoveryLoading] = useState(false);

    // CRITICAL FIX: Explicit input focus hooks mapping
    const passwordInputRef = useRef(null);
    const backupEmailInputRef = useRef(null);

    const falkultetet = [
        { id: 'FIEK', icon: '💻' }, { id: 'FSHMN', icon: '🔬' },
        { id: 'DIF', icon: '🏃‍♂️' }, { id: 'Ekonomik', icon: '📊' },
        { id: 'Juridik', icon: '⚖️' }, { id: 'Mjekësi', icon: '🩺' }
    ];

    const handleLoginForgotPassword = async () => {
        const targetUPEmail = forgotUPEmail.toLowerCase().trim();
        if (!targetUPEmail) {
            Alert.alert("Gabim", "Ju lutem shkruani e-mail adresën tuaj zyrtare të UP-së.");
            return;
        }

        setRecoveryLoading(true);
        try {
            const usersQ = query(collection(db, 'users'), where('email', '==', targetUPEmail));
            const querySnapshot = await getDocs(usersQ);

            if (querySnapshot.empty) {
                Alert.alert("Gabim", "Ky email zyrtar nuk është i regjistruar në platformë.");
                setRecoveryLoading(false);
                return;
            }

            let foundBackupEmail = null;
            querySnapshot.forEach((doc) => { foundBackupEmail = doc.data().backupEmail; });

            if (!foundBackupEmail) {
                Alert.alert("Gabim", "Kjo llogari nuk ka të regjistruar një Backup Email në profil.");
                setRecoveryLoading(false);
                return;
            }

            await sendPasswordResetEmail(auth, foundBackupEmail);
            setForgotUPEmail('');
            setIsForgotModalOpen(false);
            Alert.alert("Linku u dërgua ✉️", `Udhëzimet për fjalëkalim të ri u dërguan te Email-i juaj i dytë i rikuperimit: ${foundBackupEmail}`);
        } catch (err) {
            console.error(err);
            Alert.alert("Gabim", "Ndodhi një problem.");
        } finally { setRecoveryLoading(false); }
    };

    const handleAuthAction = async () => {
        setError('');
        Keyboard.dismiss();

        const cleanEmail = email.toLowerCase().trim();
        const cleanBackupEmail = backupEmail.toLowerCase().trim();

        if (!cleanEmail || !password.trim()) {
            setError('Ju lutem plotësoni fushat e detyrueshme.');
            return;
        }

        if (!isUPStudent(cleanEmail)) {
            setError('Qasja u refuzua. Duhet email-i zyrtar @student.uni-pr.edu');
            return;
        }

        if (isRegistering && !cleanBackupEmail) {
            setError('Ju lutem plotësoni një Email Rikuperimi (Backup Email).');
            return;
        }

        if (password.length < 6) {
            setError('Fjalëkalimi duhet të jetë së paku 6 karaktere.');
            return;
        }

        setAuthLoading(true);
        try {
            if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
                await sendEmailVerification(userCredential.user);

                const newUser = {
                    email: cleanEmail,
                    backupEmail: cleanBackupEmail,
                    faculty: selectedFaculty,
                    uid: userCredential.user.uid,
                    createdAt: new Date().toISOString()
                };

                await setDoc(doc(db, 'users', userCredential.user.uid), newUser);

                Alert.alert(
                    'Llogaria u krijua 🎉',
                    `Kemi dërguar një link verifikimi te ${cleanEmail}. Ju lutem konfirmoni email-in tuaj në inbox përpara kyçjes së parë!`,
                    [{ text: "Në rregull" }]
                );
                setIsRegistering(false);
                setPassword('');
                setBackupEmail('');
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
                const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

                if (userDoc.exists()) {
                    setUser({ uid: userCredential.user.uid, ...userDoc.data() });
                } else {
                    setUser({ uid: userCredential.user.uid, email: cleanEmail, faculty: 'FIEK' });
                }
            }
        } catch (err) {
            console.error("Auth Error:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Email-i ose fjalëkalimi është i gabuar.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Ky email është i regjistruar paraprakisht.');
            } else {
                setError('Problem me autorizim. Kontrolloni lidhjen.');
            }
        } finally { setAuthLoading(false); }
    };

    const currentTheme = {
        scrollContainer: isDarkMode ? { backgroundColor: '#080E1A' } : { backgroundColor: '#F1F5F9' },
        card: isDarkMode ? { backgroundColor: '#0F172A', borderColor: 'rgba(79, 70, 229, 0.2)' } : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
        text: isDarkMode ? { color: '#FFFFFF' } : { color: '#0B2545' },
        subText: isDarkMode ? { color: '#94A3B8' } : { color: '#64748B' },
        input: isDarkMode ? { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.05)', color: '#FFFFFF' } : { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0B2545' },
    };


    return (
        <ScrollView contentContainerStyle={[styles.scrollContainer, currentTheme.scrollContainer]} keyboardShouldPersistTaps="handled">

            {/* FLOATING CORNER THEME TOGGLE SWITCH ENGINE */}
            <TouchableOpacity
                style={[styles.themeToggleBtn, isDarkMode ? styles.themeToggleDark : styles.themeToggleLight]}
                onPress={() => setIsDarkMode(!isDarkMode)} // Ndryshon shtetin global me klikim direkt
            >
                <Text style={styles.themeToggleTxt}>{isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</Text>
            </TouchableOpacity>


            <View style={[styles.card, currentTheme.card]}>
                <View style={[styles.logoBackground, isDarkMode ? styles.logoDark : styles.logoLight]}>
                    <Text style={styles.upVectorText}>UP</Text>
                </View>
                <Text style={[styles.welcomeText, currentTheme.text]}>Prishtina Connect</Text>
                <Text style={[styles.loginSubText, currentTheme.subText]}>
                    {isRegistering ? 'Krijo profilin tënd zyrtar' : 'Portal Komunikimi dhe Lajmesh - UP'}
                </Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>E-mail adresa zyrtare</Text>
                    <TextInput
                        style={[styles.input, currentTheme.input]}
                        placeholder="emri.mbiemri@student.uni-pr.edu"
                        placeholderTextColor="#64748B"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Fjalëkalimi</Text>
                    <TextInput
                        ref={passwordInputRef}
                        style={[styles.input, currentTheme.input]}
                        placeholder="••••••••"
                        placeholderTextColor="#64748B"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        returnKeyType={isRegistering ? "next" : "go"}
                        onSubmitEditing={() => {
                            if (isRegistering) {
                                backupEmailInputRef.current?.focus();
                            } else {
                                handleAuthAction(); // FIXED ENTER ACTION: Triggers authentic cloud verification instantly
                            }
                        }}
                        blurOnSubmit={isRegistering ? false : true}
                    />
                </View>

                {isRegistering && (
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Email Rikuperimi (Gmail / Yahoo / etj.) 🛡️</Text>
                        <TextInput
                            ref={backupEmailInputRef}
                            style={[styles.input, currentTheme.input]}
                            placeholder="email.personal@gmail.com"
                            placeholderTextColor="#64748B"
                            value={backupEmail}
                            onChangeText={setBackupEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            returnKeyType="go"
                            onSubmitEditing={handleAuthAction} // FIXED ENTER ACTION: Submits credentials right from your native keyboard
                        />
                    </View>
                )}

                {!isRegistering && (
                    <TouchableOpacity style={styles.forgotPasswordInlineBtn} onPress={() => setIsForgotModalOpen(true)}>
                        <Text style={styles.forgotPasswordInlineTxt}>Harruat fjalëkalimin? Rikupero përmes Backup Email 🛡️</Text>
                    </TouchableOpacity>
                )}

                {isRegistering && (
                    <View style={styles.facultySection}>
                        <Text style={styles.facultyTitle}>Zgjedh Fakultetin Tënd</Text>
                        <View style={styles.facultyGrid}>
                            {falkultetet.map((fak) => (
                                <TouchableOpacity
                                    key={fak.id}
                                    style={[styles.facultyButton, isDarkMode ? styles.facultyDark : styles.facultyLight, selectedFaculty === fak.id && styles.facultyActive]}
                                    onPress={() => setSelectedFaculty(fak.id)}
                                >
                                    <Text style={[styles.facultyIcon, selectedFaculty === fak.id && styles.facultyIconActive]}>
                                        {fak.icon} {fak.id}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.button} onPress={handleAuthAction} disabled={authLoading} activeOpacity={0.8}>
                    {authLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {isRegistering ? 'Regjistrohu Tani 🚀' : 'Kyçu në Portal 🔑'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.toggleContainer} onPress={() => { setIsRegistering(!isRegistering); setError(''); }}>
                    <Text style={styles.toggleText}>
                        {isRegistering ? 'Keni llogari? Kyçuni këtu' : 'Nuk keni llogari? Regjistrohuni këtu'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* PASSWORD RECOVERY POPUP OVERLAY PANEL */}
            <Modal animationType="fade" transparent={true} visible={isForgotModalOpen} onRequestClose={() => setIsForgotModalOpen(false)}>
                <View style={[styles.recoveryModalOverlay, isDarkMode ? styles.overlayDark : styles.overlayLight]}>
                    <View style={[styles.recoveryModalContent, currentTheme.card]}>
                        <Text style={[styles.recoveryModalTitle, currentTheme.text]}>🔒 Rikupero Fjalëkalimin</Text>
                        <Text style={[styles.recoveryModalDesc, currentTheme.subText]}>Shkruani email-in tuaj zyrtar të universitetit. Sistemi do të gjejë adresën tuaj personale (Backup Email) dhe do të dërgojë linkun e sigurisë atje.</Text>

                        <View style={{ width: '100%', marginBottom: 16 }}>
                            <Text style={styles.inputLabel}>E-mail adresa zyrtare e UP-së</Text>
                            <TextInput
                                style={[styles.input, currentTheme.input]}
                                placeholder="emri.mbiemri@student.uni-pr.edu"
                                placeholderTextColor="#64748B"
                                autoCapitalize="none"
                                value={forgotUPEmail}
                                onChangeText={setForgotUPEmail}
                            />
                        </View>

                        <View style={styles.recoveryActionRow}>
                            <TouchableOpacity style={[styles.recoveryCancelBtn, isDarkMode ? { backgroundColor: '#1E293B' } : { backgroundColor: '#E2E8F0' }]} onPress={() => setIsForgotModalOpen(false)}>
                                <Text style={currentTheme.subText}>Anulo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.recoverySubmitBtn} onPress={handleLoginForgotPassword} disabled={recoveryLoading}>
                                {recoveryLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.recoverySubmitTxt}>Dërgo Link ✉️</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: { width: '100%', maxWidth: 400, borderRadius: 28, padding: 26, alignItems: 'center', borderWidth: 1, elevation: 10, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
    themeToggleBtn: { position: 'absolute', top: 20, left: 20, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, zIndex: 999 },
    themeToggleLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
    themeToggleDark: { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.05)' },
    themeToggleTxt: { fontSize: 11, fontWeight: '800', color: '#818CF8', letterSpacing: 0.3 },
    logoBackground: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10 },
    logoLight: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5', shadowColor: '#4F46E5' },
    logoDark: { backgroundColor: '#1E1B4B', borderColor: '#4F46E5', shadowColor: '#4F46E5' },
    upVectorText: { color: '#4F46E5', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    welcomeText: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
    loginSubText: { fontSize: 13, marginBottom: 24, textAlign: 'center', fontWeight: '500' },
    inputWrapper: { width: '100%', marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#818CF8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { width: '100%', height: 48, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, fontSize: 14, fontWeight: '500' },
    forgotPasswordInlineBtn: { width: '100%', alignItems: 'flex-start', marginVertical: 4, marginBottom: 14, paddingHorizontal: 4 },
    forgotPasswordInlineTxt: { color: '#F59E0B', fontSize: 11, fontWeight: '700' },
    facultySection: { width: '100%', marginVertical: 12 },
    facultyTitle: { fontSize: 12, fontWeight: '800', color: '#818CF8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    facultyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 2 },
    facultyButton: { width: '48%', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    facultyLight: { backgroundColor: '#F8FAFC', borderColor: 'transparent' },
    facultyDark: { backgroundColor: '#1E293B', borderColor: 'transparent' },
    facultyActive: { borderColor: '#4F46E5', backgroundColor: '#1E1B4B' },
    facultyIcon: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
    facultyIconActive: { color: '#FFFFFF' },
    button: { width: '100%', height: 50, backgroundColor: '#4F46E5', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    errorText: { color: '#F87171', backgroundColor: 'rgba(248, 113, 113, 0.1)', padding: 12, borderRadius: 12, width: '100%', textAlign: 'center', marginBottom: 16, fontSize: 13, fontWeight: '600', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.2)' },
    toggleContainer: { marginTop: 18 },
    toggleText: { color: '#818CF8', fontWeight: '700', fontSize: 13 },
    recoveryModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    overlayLight: { backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    overlayDark: { backgroundColor: 'rgba(8, 14, 26, 0.9)' },
    recoveryModalContent: { width: '100%', maxWidth: 390, borderRadius: 28, padding: 22, borderWidth: 1, alignItems: 'center', shadowColor: '#4F46E5', shadowRadius: 15, shadowOpacity: 0.2, elevation: 10 },
    recoveryModalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 8, letterSpacing: -0.3 },
    recoveryModalDesc: { fontSize: 12, lineHeight: 18, marginBottom: 16, textAlign: 'center', fontWeight: '500' },
    recoveryActionRow: { flexDirection: 'row', gap: 10, marginTop: 4, width: '100%' },
    recoveryCancelBtn: { flex: 1, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    recoveryCancelTxt: { fontWeight: '700', fontSize: 13 },
    recoverySubmitBtn: { flex: 1, height: 44, backgroundColor: '#4F46E5', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    recoverySubmitTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }
});

