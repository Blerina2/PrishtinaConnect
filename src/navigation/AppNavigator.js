import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ChannelsScreen from '../screens/ChannelsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewsScreen from '../screens/NewsScreen';
import ClubsScreen from '../screens/ClubsScreen';
import MaterialsScreen from '../screens/MaterialsScreen';

export default function AppNavigator() {
    const { user, setUser, loading, isDarkMode } = useAuth();
    const [currentTab, setCurrentTab] = useState('channels');

    const handleLogout = () => {
        setCurrentTab('channels');
        setUser(null);
    };

    if (loading) {
        return (
            <View style={[styles.loadingScreen, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
                <ActivityIndicator size="large" color="#EEB902" />
                <Text style={{ marginTop: 10, color: isDarkMode ? '#FFF' : '#0B2545', fontWeight: '600' }}>
                    Duke verifikuar seancën...
                </Text>
            </View>
        );
    }

    if (!user) {
        return <LoginScreen />;
    }

    const containerStyle = isDarkMode ? styles.darkContainer : styles.lightContainer;

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={styles.mainContent}>
                {currentTab === 'channels' ? (
                    <ChannelsScreen />
                ) : currentTab === 'materials' ? (
                    <MaterialsScreen />
                ) : currentTab === 'news' ? (
                    <NewsScreen />
                ) : currentTab === 'clubs' ? (
                    <ClubsScreen />
                ) : (
                    <ProfileScreen user={user} onLogout={handleLogout} />
                )}
            </View>

            <View style={styles.tabBarContainer}>
                <View style={[styles.floatingTabBar, isDarkMode && styles.darkTabBar]}>
                    <TouchableOpacity style={[styles.tabItem, currentTab === 'channels' && styles.activeTab]} onPress={() => setCurrentTab('channels')}>
                        <Text style={styles.tabIcon}>💬</Text>
                        <Text style={[styles.tabText, currentTab === 'channels' && styles.activeTabText]}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'materials' && styles.activeTab]} onPress={() => setCurrentTab('materials')}>
                        <Text style={styles.tabIcon}>📁</Text>
                        <Text style={[styles.tabText, currentTab === 'materials' && styles.activeTabText]}>Materiale</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'news' && styles.activeTab]} onPress={() => setCurrentTab('news')}>
                        <Text style={styles.tabIcon}>📢</Text>
                        <Text style={[styles.tabText, currentTab === 'news' && styles.activeTabText]}>Lajme</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'clubs' && styles.activeTab]} onPress={() => setCurrentTab('clubs')}>
                        <Text style={styles.tabIcon}>🚀</Text>
                        <Text style={[styles.tabText, currentTab === 'clubs' && styles.activeTabText]}>Klube</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'profile' && styles.activeTab]} onPress={() => setCurrentTab('profile')}>
                        <Text style={styles.tabIcon}>👤</Text>
                        <Text style={[styles.tabText, currentTab === 'profile' && styles.activeTabText]}>Profil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    lightContainer: { backgroundColor: '#F0F4F8' },
    darkContainer: { backgroundColor: '#1A202C' },
    mainContent: { flex: 1 },
    loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabBarContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15 },
    floatingTabBar: { flexDirection: 'row', backgroundColor: '#0B2545', width: '100%', maxWidth: 500, height: 66, borderRadius: 33, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'space-around', shadowColor: '#0B2545', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    darkTabBar: { backgroundColor: '#2D3748', shadowColor: '#000', borderColor: '#4A5568' },
    tabItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 24, flex: 1 },
    activeTab: { backgroundColor: 'rgba(255,255,255,0.15)', borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    tabIcon: { fontSize: 18, marginBottom: 1 },
    tabText: { fontSize: 10, fontWeight: '600', color: '#A0AEC0' },
    activeTabText: { color: '#ffffff', fontWeight: '800' }
});
