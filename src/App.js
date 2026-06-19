import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

function CampusHeaderWrapper() {
    const { isDarkMode, setIsDarkMode, user } = useAuth();

    const themeBg = isDarkMode ? '#0F172A' : '#FFFFFF';
    const themeBorder = isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#E2E8F0';
    const primaryText = isDarkMode ? '#FFFFFF' : '#0B2545';
    const secondaryText = isDarkMode ? '#94A3B8' : '#64748B';

    // Nëse nuk ka përdorues të kyçur (Faqja e Parë), fshihet Header-i automatikisht
    const shouldShowHeader = user && user.uid;

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#080E1A' : '#F0F4F8' }}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={themeBg} />

            {shouldShowHeader && (
                <SafeAreaView style={{ backgroundColor: themeBg, zIndex: 999 }}>
                    <View style={[styles.headerRow, { backgroundColor: themeBg, borderColor: themeBorder }]}>
                        <View style={styles.brandContainer}>
                            <View style={styles.titleRowWithEmoji}>
                                <Text style={styles.campusEmojiIcon}>🏫</Text>
                                <Text style={[styles.mainTitle, { color: primaryText }]}>Prishtina Connect</Text>
                            </View>
                            <Text style={[styles.subTitle, { color: secondaryText }]}>🎓 UNIVERSITETI I PRISHTINËS</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.toggleBtn, isDarkMode ? styles.btnDark : styles.btnLight]}
                            onPress={() => setIsDarkMode(!isDarkMode)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.toggleBtnTxt}>
                                {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            )}

            <AppNavigator />
        </View>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <CampusHeaderWrapper />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        width: '100%',
        height: 64,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    brandContainer: { flexDirection: 'column', justifyContent: 'center' },
    titleRowWithEmoji: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    campusEmojiIcon: { fontSize: 16, marginRight: 2 },
    mainTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.4 },
    subTitle: { fontSize: 9, fontWeight: '800', marginTop: 2, letterSpacing: 0.5, textTransform: 'uppercase' },
    toggleBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, elevation: 2 },
    btnLight: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
    btnDark: { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.06)' },
    toggleBtnTxt: { fontSize: 11, fontWeight: '800', color: '#818CF8', letterSpacing: 0.2 }
});
