import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function ProfileScreen({ user, onLogout }) {
    return (
        <View style={styles.profileContainer}>
            <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>U</Text>
            </View>
            <Text style={styles.profileName}>Student i UP-së</Text>
            <Text style={styles.statusBadge}>I rregullt</Text>

            <View style={styles.infoCard}>
                <Text style={styles.infoText}>📍 Email: {user?.email}</Text>
                <Text style={styles.infoText}>🏛 Institucioni: Universiteti i Prishtinës</Text>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                <Text style={styles.logoutButtonText}>Çkyçu nga Pajisja</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    profileContainer: { flex: 1, alignItems: 'center', padding: 20 },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#EEB902', marginTop: 20 },
    avatarText: { color: '#ffffff', fontSize: 28, fontWeight: 'bold' },
    profileName: { fontSize: 20, fontWeight: 'bold', color: '#0B2545', marginTop: 15 },
    statusBadge: { backgroundColor: '#EDF2F7', color: '#718096', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold', marginTop: 5 },
    infoCard: { width: '100%', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginTop: 25, borderWidth: 1, borderColor: '#E2E8F0' },
    infoText: { fontSize: 14, color: '#0B2545', marginVertical: 5, fontWeight: '500' },
    logoutButton: { width: '100%', backgroundColor: '#E53E3E', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 'auto', marginBottom: 20 },
    logoutButtonText: { color: '#ffffff', fontWeight: 'bold' }
});