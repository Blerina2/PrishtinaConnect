import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, Keyboard, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen({ user, onLogout }) {
    const [myPosts, setMyPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [profileImage, setProfileImage] = useState(null);

    const studentNickname = user?.email ? user.email.split('@')[0] : 'Student';
    const studentFaculty = user?.faculty || 'UP';

    useEffect(() => {
        const loadLocalData = async () => {
            try {
                const storedPosts = await AsyncStorage.getItem(`@PrishtinaConnect:posts:${user?.email}`);
                if (storedPosts != null) setMyPosts(JSON.parse(storedPosts));

                const storedImage = await AsyncStorage.getItem(`@PrishtinaConnect:avatar:${user?.email}`);
                if (storedImage != null) setProfileImage(storedImage);
            } catch (e) {
                console.log("Gabim leximi të dhënash:", e);
            } finally {
                setLoadingPosts(false);
            }
        };
        if (user?.email) loadLocalData();
    }, [user]);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Refuzuar 🔒", "Duhet të lejoni qasjen në galeri.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) {
            const selectedImg = result.assets[0].uri;
            try {
                await AsyncStorage.setItem(`@PrishtinaConnect:avatar:${user?.email}`, selectedImg);
                setProfileImage(selectedImg);
            } catch (e) {
                console.log(e);
            }
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        Keyboard.dismiss();

        const postObj = {
            id: 'post_' + Date.now(),
            content: newPostContent.trim(),
            createdAt: new Date().toISOString()
        };

        const updatedPosts = [postObj, ...myPosts];
        try {
            await AsyncStorage.setItem(`@PrishtinaConnect:posts:${user?.email}`, JSON.stringify(updatedPosts));
            setMyPosts(updatedPosts);
            setNewPostContent('');
            Alert.alert('Sukses 🎉', 'Postimi juaj u publikua.');
        } catch (err) {
            console.log(err);
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

    return (
        <View style={styles.profileContainer}>
            {/* Dashboard Card me Butonin e Çkyçjes Lart */}
            <View style={styles.headerCard}>
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

                <Text style={styles.profileName}>{studentNickname}</Text>
                <View style={styles.badgeRow}>
                    <Text style={styles.statusBadge}>🏛 {studentFaculty}</Text>
                    <Text style={styles.regularBadge}>🛡 I Rregullt</Text>
                </View>
                <Text style={styles.emailText}>📍 {user?.email}</Text>
            </View>

            {/* Post Creator */}
            <View style={styles.createPostBox}>
                <Text style={styles.sectionMiniTitle}>Publiko një mendim ose njoftim</Text>
                <TextInput
                    style={styles.postInput}
                    placeholder="Çfarë po mendoni sot kolegë?..."
                    placeholderTextColor="#A0AEC0"
                    multiline
                    value={newPostContent}
                    onChangeText={setNewPostContent}
                />
                <TouchableOpacity style={styles.postButton} onPress={handleCreatePost} activeOpacity={0.8}>
                    <Text style={styles.postButtonText}>Posto në Profil</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Postimet e Mia ({myPosts.length})</Text>

            {loadingPosts ? (
                <ActivityIndicator size="small" color="#0B2545" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={myPosts}
                    keyExtractor={(item) => item.id}
                    style={{ width: '100%' }}
                    contentContainerStyle={{ paddingBottom: 110 }}
                    renderItem={({ item }) => (
                        <View style={styles.postCard}>
                            <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            <Text style={styles.postContent}>{item.content}</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    profileContainer: { flex: 1, backgroundColor: '#F0F4F8', padding: 14, alignItems: 'center' },
    headerCard: { width: '100%', backgroundColor: '#ffffff', padding: 20, borderRadius: 24, alignItems: 'center', shadowColor: '#1A365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 15, position: 'relative' },
    logoutTopButton: { position: 'absolute', top: 15, right: 15, backgroundColor: '#FFF5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#FED7D7' },
    logoutTopText: { color: '#C53030', fontSize: 11, fontWeight: '700' },
    avatarButton: { position: 'relative', marginTop: 10 },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#EEB902' },
    avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#EEB902' },
    avatarText: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EEB902', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffffff' },
    cameraIcon: { fontSize: 10 },
    profileName: { fontSize: 18, fontWeight: '800', color: '#0B2545', marginTop: 8 },
    badgeRow: { flexDirection: 'row', marginTop: 6, gap: 6 },
    statusBadge: { backgroundColor: '#EBF8FF', color: '#2B6CB0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 11, fontWeight: '700' },
    regularBadge: { backgroundColor: '#E6FFFA', color: '#319795', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 11, fontWeight: '700' },
    emailText: { fontSize: 12, color: '#718096', marginTop: 10, fontWeight: '500' },
    createPostBox: { width: '100%', backgroundColor: '#ffffff', padding: 14, borderRadius: 20, shadowColor: '#1A365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 15 },
    sectionMiniTitle: { fontSize: 11, fontWeight: '700', color: '#4A5568', marginBottom: 8, textTransform: 'uppercase' },
    postInput: { height: 55, borderColor: '#E2E8F0', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: '#0B2545', backgroundColor: '#F8FAFC', fontSize: 13 },
    postButton: { backgroundColor: '#0B2545', height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10, borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    postButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
    sectionTitle: { alignSelf: 'flex-start', fontSize: 14, fontWeight: '800', color: '#0B2545', marginBottom: 8 },
    postCard: { width: '100%', backgroundColor: '#ffffff', padding: 14, borderRadius: 16, marginVertical: 5, borderWidth: 1, borderColor: '#F0F4F8' },
    postDate: { fontSize: 10, color: '#A0AEC0', marginBottom: 6, fontWeight: '700' },
    postContent: { fontSize: 13, color: '#2D3748', lineHeight: 19 }
});
