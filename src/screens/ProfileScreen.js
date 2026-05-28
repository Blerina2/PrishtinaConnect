import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ user, onLogout }) {
    const { isDarkMode } = useAuth();
    const [profileImage, setProfileImage] = useState(null);
    const [loading, setLoading] = useState(true);

    const studentNickname = user?.email ? user.email.split('@')[0] : 'Student';
    const studentFaculty = user?.faculty || 'UP';

    useEffect(() => {
        const loadLocalAvatar = async () => {
            try {
                const storedImage = await AsyncStorage.getItem(`@PrishtinaConnect:avatar:${user?.email}`);
                if (storedImage != null) setProfileImage(storedImage);
            } catch (e) {
                console.log("Gabim leximi të avatarit:", e);
            } finally {
                setLoading(false);
            }
        };
        if (user?.email) loadLocalAvatar();
    }, [user]);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Refuzuar 🔒", "Duhet të lejoni qasjen në galeri për të ndryshuar foton.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const selectedImg = result.assets[0].uri;
            try {
                await AsyncStorage.setItem(`@PrishtinaConnect:avatar:${user?.email}`, selectedImg);
                setProfileImage(selectedImg);
            } catch (e) {
                console.log("Gabim gjatë ruajtjes së fotos:", e);
            }
        }
    };

    const handleActualLogout = async () => {
        try {
            await AsyncStorage.removeItem('@PrishtinaConnect:user');
            onLogout();
        } catch (e) {
            onLogout();
        }
    };

    const themeStyles = {
        container: isDarkMode ? styles.darkContainer : styles.lightContainer,
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
    };

    if (loading) {
        return (
            <View style={[styles.profileContainer, themeStyles.container, styles.center]}>
                <ActivityIndicator size="small" color="#EEB902" />
            </View>
        );
    }

    return (
        <View style={[styles.profileContainer, themeStyles.container]}>
            <Text style={[styles.mainTitle, themeStyles.text]}>Profili im Zyrtar</Text>

            {/* Dashboard Card e Pastër dhe Moderne */}
            <View style={[styles.headerCard, themeStyles.card]}>
                <TouchableOpacity style={styles.logoutTopButton} onPress={handleActualLogout} activeOpacity={0.7}>
                    <Text style={styles.logoutTopText}>🚪 Dalja</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.avatarButton} onPress={pickImage} activeOpacity={0.85}>
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{studentNickname.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={styles.cameraBadge}>
                        <Text style={styles.cameraIcon}>📷</Text>
                    </View>
                </TouchableOpacity>

                <Text style={[styles.profileName, themeStyles.text]}>{studentNickname}</Text>

                <View style={styles.badgeRow}>
                    <Text style={styles.statusBadge}>🏛 Fakulteti: {studentFaculty}</Text>
                    <Text style={styles.regularBadge}>🛡 Student i Rregullt</Text>
                </View>

                <Text style={styles.emailText}>📍 {user?.email}</Text>
            </View>

            {/* Kartela e Detajeve plotësuese të Studentit */}
            <View style={[styles.infoCard, themeStyles.card]}>
                <Text style={[styles.infoTitle, themeStyles.text]}>ℹ️ Informacione të Sistemit</Text>
                <View style={styles.infoLine}>
                    <Text style={styles.infoLabel}>Statusi i Llogarisë:</Text>
                    <Text style={styles.infoValueActive}>Aktivizuar</Text>
                </View>
                <View style={styles.infoLine}>
                    <Text style={styles.infoLabel}>Mjedisi i Komunikimit:</Text>
                    <Text style={[styles.infoValue, themeStyles.text]}>Universiteti i Prishtinës</Text>
                </View>
                <View style={styles.infoLine}>
                    <Text style={styles.infoLabel}>ID e Pajisjes Lokale:</Text>
                    <Text style={styles.infoValueId} numberOfLines={1}>{user?.uid}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    lightContainer: { backgroundColor: '#F0F4F8' },
    darkContainer: { backgroundColor: '#1A202C' },
    lightCard: { backgroundColor: '#ffffff', borderColor: '#F0F4F8' },
    darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
    lightText: { color: '#0B2545' },
    darkText: { color: '#FFFFFF' },

    profileContainer: { flex: 1, padding: 14, alignItems: 'center' },
    center: { justifyContent: 'center', alignItems: 'center' },
    mainTitle: { fontSize: 18, fontWeight: '800', alignSelf: 'flex-start', marginVertical: 12, letterSpacing: -0.4 },

    headerCard: { width: '100%', padding: 24, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 3, marginBottom: 15, borderWidth: 1, position: 'relative' },
    logoutTopButton: { position: 'absolute', top: 18, right: 18, backgroundColor: '#FFF5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#FED7D7' },
    logoutTopText: { color: '#C53030', fontSize: 11, fontWeight: '700' },

    avatarButton: { position: 'relative', marginTop: 15 },
    avatarCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#EEB902' },
    avatarImage: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: '#EEB902' },
    avatarText: { color: '#ffffff', fontSize: 30, fontWeight: '800' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EEB902', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
    cameraIcon: { fontSize: 10 },

    profileName: { fontSize: 19, fontWeight: '800', marginTop: 10, textTransform: 'capitalize' },
    badgeRow: { flexDirection: 'row', marginTop: 8, gap: 6 },
    statusBadge: { backgroundColor: '#EBF8FF', color: '#2B6CB0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 11, fontWeight: '700' },
    regularBadge: { backgroundColor: '#E6FFFA', color: '#319795', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 11, fontWeight: '700' },
    emailText: { fontSize: 12, color: '#718096', marginTop: 12, fontWeight: '500' },

    // Kartela e re e informatave të sistemit
    infoCard: { width: '100%', padding: 16, borderRadius: 20, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.02, elevation: 2 },
    infoTitle: { fontSize: 13, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
    infoLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(113, 128, 150, 0.1)' },
    infoLabel: { fontSize: 12, color: '#718096', fontWeight: '600' },
    infoValue: { fontSize: 12, fontWeight: '700' },
    infoValueActive: { fontSize: 11, fontWeight: '800', color: '#319795', backgroundColor: '#E6FFFA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
    infoValueId: { fontSize: 11, color: '#A0AEC0', fontWeight: '500', maxWidth: '50%' }
});
