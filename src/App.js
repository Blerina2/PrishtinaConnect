import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

function MainAppContent() {
    const { isDarkMode, toggleTheme, loading, user } = useAuth();

    // Kontrolli asinkron për të parandaluar dëbimin (logout) pas refresh-it
    if (loading) {
        return (
            <View style={[styles.loadingScreen, isDarkMode ? styles.darkBg : styles.lightBg]}>
                <ActivityIndicator size="large" color="#EEB902" />
                <Text style={[styles.loadingText, { color: isDarkMode ? '#FFFFFF' : '#0B2545' }]}>
                    Duke lidhur me portalin studentor...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={isDarkMode ? '#1A202C' : '#0B2545'}
            />

            {/* Header-i shfaqet vetëm nëse studenti është i kyçur brenda */}
            {user && (
                <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerLogo}>🏫</Text>
                        <View>
                            <Text style={styles.headerTitle}>Prishtina Connect</Text>
                            <Text style={styles.headerSubtitle}>UNIVERSITETI I PRISHTINËS</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.themeButton} onPress={toggleTheme} activeOpacity={0.7}>
                        <Text style={styles.themeIcon}>
                            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <AppNavigator />
        </SafeAreaView>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <MainAppContent />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    lightBg: { backgroundColor: '#F0F4F8' },
    darkBg: { backgroundColor: '#1A202C' },
    loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, fontSize: 14, fontWeight: '700' },

    header: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 3, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 10 },
    lightHeader: { backgroundColor: '#0B2545', borderBottomColor: '#EEB902', shadowColor: '#000' },
    darkHeader: { backgroundColor: '#2D3748', borderBottomColor: '#EEB902', shadowColor: '#000' },

    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerLogo: { fontSize: 24 },
    headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
    headerSubtitle: { color: '#EEB902', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 1 },
    themeButton: { backgroundColor: 'rgba(255, 255, 255, 0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    themeIcon: { color: '#ffffff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }
});
