import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
    return (
        <AuthProvider>
            <SafeAreaView style={styles.container}>
                {/* Shiriti i Sipërm Zyrtar i UP-së */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>🏫 Prishtina Connect</Text>
                    <Text style={styles.headerSubtitle}>Universiteti i Prishtinës</Text>
                </View>

                {/* Navigimi dhe Ekranet Modulare */}
                <AppNavigator />
            </SafeAreaView>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F9' },
    header: { height: 65, backgroundColor: '#0B2545', justifyContent: 'center', paddingHorizontal: 20, borderBottomWidth: 3, borderBottomColor: '#EEB902' },
    headerTitle: { color: '#ffffff', fontSize: 19, fontWeight: 'bold' },
    headerSubtitle: { color: '#EEB902', fontSize: 11, fontWeight: '600' }
});