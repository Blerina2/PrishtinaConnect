import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
    return (
        <AuthProvider>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0B2545" />

                {/* Header Premium i përmirësuar */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerLogo}>🏫</Text>
                        <View>
                            <Text style={styles.headerTitle}>Prishtina Connect</Text>
                            <Text style={styles.headerSubtitle}>UNIVERSITETI I PRISHTINËS</Text>
                        </View>
                    </View>
                    <View style={styles.statusDotContainer}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Cloud Sync Active</Text>
                    </View>
                </View>

                <AppNavigator />
            </SafeAreaView>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    header: { height: 70, backgroundColor: '#0B2545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 3, borderBottomColor: '#EEB902', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 10 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerLogo: { fontSize: 24 },
    headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    headerSubtitle: { color: '#EEB902', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 1 },
    statusDotContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#319795', marginRight: 6 },
    statusText: { color: '#ffffff', fontSize: 10, fontWeight: '700' }
});
