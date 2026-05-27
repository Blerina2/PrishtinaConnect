import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { isValidPrishtinaStudent } from '../config/firebase';

export default function LoginScreen({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        setError('');
        if (!isValidPrishtinaStudent(email)) {
            setError('Qasja u refuzua. Duhet email-i zyrtar @uni-pr.edu');
            return;
        }
        onLoginSuccess({ email: email.toLowerCase(), uid: 'fiek_student_demo_id' });
    };

    return (
        <View style={styles.loginContainer}>
            {/* Logo Zyrtare e Universitetit të Prishtinës */}
            <Image
                source={{ uri: 'https://uni-pr.edu' }}
                style={styles.upLogo}
                resizeMode="contain"
            />

            <Text style={styles.welcomeText}>Prishtina Connect</Text>
            <Text style={styles.loginSubText}>Portal Komunikimi dhe Lajmesh - UP</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="emri.mbiemri@uni-pr.edu"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Fjalëkalimi"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Kyçuni në Portal</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 25 },
    upLogo: { width: 120, height: 120, marginBottom: 20 },
    welcomeText: { fontSize: 26, fontWeight: 'bold', color: '#0B2545', marginBottom: 4 },
    loginSubText: { fontSize: 13, color: '#718096', marginBottom: 30, textAlign: 'center' },
    input: { width: '100%', height: 50, borderColor: '#D2D6DC', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, color: '#0B2545', backgroundColor: '#F9FAFB' },
    button: { width: '100%', height: 50, backgroundColor: '#0B2545', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    errorText: { color: '#E53E3E', marginBottom: 15, fontWeight: 'bold', backgroundColor: '#FFF5F5', padding: 10, borderRadius: 6, width: '100%', textAlign: 'center' }
});