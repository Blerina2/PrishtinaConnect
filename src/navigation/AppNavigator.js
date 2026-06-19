import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';

// Importimi i të gjitha ekraneve kryesore
import LoginScreen from '../screens/LoginScreen';
import ChannelsScreen from '../screens/ChannelsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewsScreen from '../screens/NewsScreen';
import ClubsScreen from '../screens/ClubsScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import StudentLifeScreen from '../screens/StudentLifeScreen';

export default function AppNavigator() {
    const { user, setUser, loading, isDarkMode } = useAuth();

    // Lexojmë tab-in e fundit të mbetur direkt nga localStorage e Chrome për të parandaluar resetimin
    const [currentTab, setCurrentTab] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const savedTab = window.localStorage.getItem('@PrishtinaConnect:currentTab');
            return savedTab !== null ? savedTab : 'channels';
        }
        return 'channels';
    });

    // Funksion  që ndërron tab-in dhe e ruan atë automatikisht në memorien e browser-it
    const ndryshoTabinDheRuaj = (tabId) => {
        setCurrentTab(tabId);
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('@PrishtinaConnect:currentTab', tabId);
        }
    };

    // Funksioni për çkyçje të plotë nga aplikacioni (Pastrojmë edhe memorien e navigimit)
    const handleLogout = async () => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem('@PrishtinaConnect:currentTab');
            }
            setCurrentTab('channels');
            await auth.signOut();
            setUser(null);
        } catch (e) {
            console.log("Gabim gjatë çkyçjes së plotë:", e);
        }
    };

    // Shfaqja e ekranit të loading-ut gjatë verifikimit të përdoruesit
    if (loading) {
        return (
            <View style={[styles.loadingScreen, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={{ marginTop: 10, color: isDarkMode ? '#FFF' : '#0B2545', fontWeight: '600' }}>
                    Duke verifikuar seancën...
                </Text>
            </View>
        );
    }

    // Barrierë Sigurie: Nëse nuk ka përdorues të kyçur, shfaqet ekrani i Login-it
    if (!user || !user.uid) {
        return <LoginScreen />;
    }

    const containerStyle = isDarkMode ? styles.darkContainer : styles.lightContainer;
    return (
        <View style={[styles.container, containerStyle]}>
            {/* CONTAINER FOR CORE CONTENT MOUNTING */}
            <View style={styles.mainContent}>
                {currentTab === 'channels' ? (
                    <ChannelsScreen />
                ) : currentTab === 'materials' ? (
                    <MaterialsScreen />
                ) : currentTab === 'news' ? (
                    <NewsScreen />
                ) : currentTab === 'clubs' ? (
                    <ClubsScreen />
                ) : currentTab === 'lifestyle' ? (
                    <StudentLifeScreen />
                ) : (
                    <ProfileScreen user={user} onLogout={handleLogout} />
                )}
            </View>

            {/* INTEGRATED FLOATING BOTTOM TAB BAR WITH 6 DIRECTORIES */}
            <View style={styles.tabBarContainer}>
                <View style={[styles.floatingTabBar, isDarkMode && styles.darkTabBar]}>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'channels' && styles.activeTab]} onPress={() => ndryshoTabinDheRuaj('channels')}>
                        <Text style={styles.tabIcon}>💬</Text>
                        <Text style={[styles.tabText, currentTab === 'channels' && styles.activeTabText]}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'materials' && styles.activeTab]} onPress={() => ndryshoTabinDheRuaj('materials')}>
                        <Text style={styles.tabIcon}>📁</Text>
                        <Text style={[styles.tabText, currentTab === 'materials' && styles.activeTabText]}>Material</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'news' && styles.activeTab]} onPress={() => ndryshoTabinDheRuaj('news')}>
                        <Text style={styles.tabIcon}>📢</Text>
                        <Text style={[styles.tabText, currentTab === 'news' && styles.activeTabText]}>Lajme</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'clubs' && styles.activeTab]} onPress={() => ndryshoTabinDheRuaj('clubs')}>
                        <Text style={styles.tabIcon}>🚀</Text>
                        <Text style={[styles.tabText, currentTab === 'clubs' && styles.activeTabText]}>Klube</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'lifestyle' && styles.activeTab]} onPress={() => ndryshoTabinDheRuaj('lifestyle')}>
                        <Text style={styles.tabIcon}>✨</Text>
                        <Text style={[styles.tabText, currentTab === 'lifestyle' && styles.activeTabText]}>Jeta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.tabItem, currentTab === 'profile' && styles.activeTab]} onPress={() => ndryshoTabinDheRuaj('profile')}>
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
    darkContainer: { backgroundColor: '#080E1A' },
    mainContent: { flex: 1 },
    loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabBarContainer: { position: 'absolute', bottom: 15, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, zIndex: 9999 },
    floatingTabBar: { flexDirection: 'row', backgroundColor: '#0F172A', width: '100%', maxWidth: 520, height: 66, borderRadius: 33, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'space-around', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12, borderWidth: 1, borderColor: 'rgba(79, 70, 229, 0.2)' },
    darkTabBar: { backgroundColor: '#0F172A', shadowColor: '#000', borderColor: 'rgba(79, 70, 229, 0.3)' },
    tabItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, borderRadius: 20, flex: 1 },
    activeTab: { backgroundColor: 'rgba(79, 70, 229, 0.15)', borderBottomWidth: 2, borderBottomColor: '#10B981' },
    tabIcon: { fontSize: 16, marginBottom: 1 },
    tabText: { fontSize: 9, fontWeight: '600', color: '#94A3B8' },
    activeTabText: { color: '#ffffff', fontWeight: '800' }
});
