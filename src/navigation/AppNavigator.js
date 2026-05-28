import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import ChannelsScreen from '../screens/ChannelsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewsScreen from '../screens/NewsScreen';
import ClubsScreen from '../screens/ClubsScreen';

export default function AppNavigator() {
    // Shtojmë 'loading' nga konteksti
    const { user, setUser, loading } = useAuth();
    const [currentTab, setCurrentTab] = useState('channels');
    const [selectedChannel, setSelectedChannel] = useState(null);

    const handleLogout = () => {
        setSelectedChannel(null);
        setCurrentTab('channels');
        setUser(null);
    };

    // KORRIGJIMI: Nëse është duke lexuar memorien lokale, shfaq këtë ekran luksoz ngarkimi
    if (loading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color="#0B2545" />
                <Text style={styles.loadingText}>Duke sinkronizuar portalin e UP-së...</Text>
            </View>
        );
    }

    if (!user) {
        return <LoginScreen onLoginSuccess={(currentUser) => setUser(currentUser)} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.mainContent}>
                {selectedChannel ? (
                    <ChatScreen selectedChannel={selectedChannel} onBack={() => setSelectedChannel(null)} />
                ) : currentTab === 'channels' ? (
                    <ChannelsScreen onSelectChannel={(channel) => setSelectedChannel(channel)} />
                ) : currentTab === 'news' ? (
                    <NewsScreen />
                ) : currentTab === 'clubs' ? (
                    <ClubsScreen />
                ) : (
                    <ProfileScreen user={user} onLogout={handleLogout} />
                )}
            </View>

            {!selectedChannel && (
                <View style={styles.tabBarContainer}>
                    <View style={styles.floatingTabBar}>
                        <TouchableOpacity
                            style={[styles.tabItem, currentTab === 'channels' && styles.activeTab]}
                            onPress={() => setCurrentTab('channels')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.tabIcon}>💬</Text>
                            <Text style={[styles.tabText, currentTab === 'channels' && styles.activeTabText]}>Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabItem, currentTab === 'news' && styles.activeTab]}
                            onPress={() => setCurrentTab('news')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.tabIcon}>📢</Text>
                            <Text style={[styles.tabText, currentTab === 'news' && styles.activeTabText]}>Lajme</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabItem, currentTab === 'clubs' && styles.activeTab]}
                            onPress={() => setCurrentTab('clubs')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.tabIcon}>🚀</Text>
                            <Text style={[styles.tabText, currentTab === 'clubs' && styles.activeTabText]}>Klube</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tabItem, currentTab === 'profile' && styles.activeTab]}
                            onPress={() => setCurrentTab('profile')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.tabIcon}>👤</Text>
                            <Text style={[styles.tabText, currentTab === 'profile' && styles.activeTabText]}>Profil</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    mainContent: { flex: 1 },
    loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8' },
    loadingText: { marginTop: 12, color: '#0B2545', fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
    tabBarContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    floatingTabBar: { flexDirection: 'row', backgroundColor: '#0B2545', width: '100%', maxWidth: 450, height: 66, borderRadius: 33, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'space-around', shadowColor: '#0B2545', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    tabItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 24 },
    activeTab: { backgroundColor: 'rgba(255,255,255,0.15)', borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    tabIcon: { fontSize: 18, marginBottom: 1 },
    tabText: { fontSize: 11, fontWeight: '600', color: '#A0AEC0' },
    activeTabText: { color: '#ffffff', fontWeight: '800' }
});
