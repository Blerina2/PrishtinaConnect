import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { authInstance } from '../config/firebase';
import LoginScreen from '../screens/LoginScreen';
import ChannelsScreen from '../screens/ChannelsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewsScreen from '../screens/NewsScreen'; // Import i ri
import ClubsScreen from '../screens/ClubsScreen'; // Import i ri

export default function AppNavigator() {
    const { user, setUser } = useAuth();
    // Kemi 4 Tab-e tani: 'channels', 'news', 'clubs', 'profile'
    const [currentTab, setCurrentTab] = useState('channels');
    const [selectedChannel, setSelectedChannel] = useState(null);

    const handleLogout = async () => {
        try {
            await signOut(authInstance);
            setSelectedChannel(null);
            setCurrentTab('channels');
            setUser(null);
        } catch (err) {
            console.log(err);
        }
    };

    if (!user) {
        return <LoginScreen onLoginSuccess={(currentUser) => setUser(currentUser)} />;
    }

    return (
        <View style={{ flex: 1 }}>
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

            {/* Shiriti Navigues i Poshtëm i zgjeruar me 4 elemente si në GitHub */}
            {!selectedChannel && (
                <View style={styles.tabBar}>
                    <TouchableOpacity style={[styles.tabItem, currentTab === 'channels' && styles.activeTab]} onPress={() => setCurrentTab('channels')}>
                        <Text style={[styles.tabText, currentTab === 'channels' && styles.activeTabText]}>💬 Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'news' && styles.activeTab]} onPress={() => setCurrentTab('news')}>
                        <Text style={[styles.tabText, currentTab === 'news' && styles.activeTabText]}>📢 Lajme</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'clubs' && styles.activeTab]} onPress={() => setCurrentTab('clubs')}>
                        <Text style={[styles.tabText, currentTab === 'clubs' && styles.activeTabText]}>🚀 Klube</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'profile' && styles.activeTab]} onPress={() => setCurrentTab('profile')}>
                        <Text style={[styles.tabText, currentTab === 'profile' && styles.activeTabText]}>👤 Profil</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    mainContent: { flex: 1 },
    tabBar: { height: 60, backgroundColor: '#ffffff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-around' },
    tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%' },
    activeTab: { borderTopWidth: 3, borderTopColor: '#0B2545', backgroundColor: '#F8FAFC' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#718096' },
    activeTabText: { color: '#0B2545', fontWeight: 'bold' }
});