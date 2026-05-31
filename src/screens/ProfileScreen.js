import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, query, orderBy, getDocs, doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import ChatScreen from './ChatScreen';

export default function ProfileScreen({ user, onLogout }) {
    const { isDarkMode } = useAuth();
    const [profileImage, setProfileImage] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [discoverPosts, setDiscoverPosts] = useState([]);
    const [postText, setPostText] = useState('');
    const [postImage, setPostImage] = useState(null);
    const [commentTexts, setCommentTexts] = useState({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [activeSubTab, setActiveSubTab] = useState('posts');
    const [activeChatSession, setActiveChatSession] = useState(null);

    const [isMaximized, setIsMaximized] = useState(false);
    const [chatPosition, setChatPosition] = useState({ x: 20, y: 105 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const studentNickname = user?.email ? user.email.split('@')[0] : 'Student';
    const studentFaculty = user?.faculty || 'UP';

    const loadAllProfileData = async () => {
        if (!user?.uid) return;
        try {
            const storedImage = await AsyncStorage.getItem(`@PrishtinaConnect:avatar:${user?.email}`);
            if (storedImage != null) setProfileImage(storedImage);

            const allPostsQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(allPostsQ);

            const mine = [];
            const others = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.uid === user.uid) {
                    mine.push({ id: doc.id, ...data });
                } else {
                    others.push({ id: doc.id, ...data });
                }
            });

            setMyPosts(mine);
            setDiscoverPosts(others);
        } catch (e) {
            console.log("Gabim load data:", e);
        } finally {
            loading && setLoading(false);
        }
    };

    useEffect(() => {
        loadAllProfileData();
    }, [user?.uid]);

    const formatNickname = (name) => {
        if (!name) return 'Student';
        return String(name).replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    };

    const pickProfileImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Refuzuar 🔒", "Lejoni qasjen në galeri.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.6,
        });
        if (!result.canceled) {
            const selectedImg = result.assets.uri;
            try {
                await AsyncStorage.setItem(`@PrishtinaConnect:avatar:${user?.email}`, selectedImg);
                setProfileImage(selectedImg);
            } catch (e) { console.log(e); }
        }
    };

    const pickPostImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Refuzuar 🔒", "Lejoni qasjen në galeri.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) {
            setPostImage(result.assets.uri);
        }
    };

    const handleCreatePost = async () => {
        if (!postText.trim() && !postImage) return;
        setUploading(true);
        try {
            await addDoc(collection(db, 'posts'), {
                content: postText.trim(),
                postImgUri: postImage,
                createdAt: new Date().toISOString(),
                uid: user.uid,
                author: studentNickname,
                faculty: studentFaculty
            });
            setPostText('');
            setPostImage(null);
            await loadAllProfileData();
            Alert.alert("Sukses 🎉", "Postimi u publikua!");
        } catch (e) { console.log(e); } finally { setUploading(false); }
    };

    const handleLikePost = async (postId, currentLikes = []) => {
        const postRef = doc(db, 'posts', postId);
        const hasLiked = currentLikes.includes(user.uid);
        try {
            const updatedLikes = hasLiked
                ? currentLikes.filter(id => id !== user.uid)
                : [...currentLikes, user.uid];

            await updateDoc(postRef, { likes: updatedLikes });
            setDiscoverPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: updatedLikes } : p));
        } catch (e) { console.log(e); }
    };

    const handleAddComment = async (postId) => {
        const text = commentTexts[postId];
        if (!text || !text.trim()) return;

        const postRef = doc(db, 'posts', postId);
        const newComment = {
            author: studentNickname,
            content: text.trim(),
            createdAt: new Date().toISOString()
        };

        try {
            await updateDoc(postRef, { comments: arrayUnion(newComment) });
            setCommentTexts(prev => ({ ...prev, [postId]: '' }));
            setDiscoverPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p));
        } catch (e) { console.log(e); }
    };

    // REQUEST-SYSTEM SYNC: Erstellt die private Unterhaltung sauber als 'pending' (Në Pritje)
    const handleOpenDiscoverChat = async (postAuthorUid, authorName, authorFaculty) => {
        if (!postAuthorUid || !user?.uid) return;

        const chatId = user.uid < postAuthorUid
            ? `${user.uid}_${postAuthorUid}`
            : `${postAuthorUid}_${user.uid}`;

        try {
            await setDoc(doc(db, 'chat_requests', chatId), {
                status: 'pending',
                senderId: user.uid,
                receiverId: postAuthorUid,
                createdAt: new Date().toISOString()
            }, { merge: true });
        } catch(e) { console.log(e); }

        setActiveChatSession({
            id: chatId,
            name: formatNickname(authorName),
            isPrivate: true,
            targetUser: { id: postAuthorUid, faculty: authorFaculty, email: `${authorName}@uni-pr.edu` }
        });
        setIsMaximized(false);
        setChatPosition({ x: 20, y: 105 });
    };

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };

    if (loading) return <View style={styles.center}><ActivityIndicator color="#0B2545" size="large" /></View>;
    return (
        <View style={{ flex: 1, width: '100%' }} onMouseMove={(e) => isDragging && !isMaximized && setChatPosition({ x: dragStart.x - e.clientX, y: dragStart.y - e.clientY })} onMouseUp={() => setIsDragging(false)}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.profileContainer, isDarkMode ? styles.darkContainer : styles.lightContainer]}>

                {/* PROFILE CARD */}
                <View style={[styles.headerCard, themeStyles.card]}>
                    <TouchableOpacity style={styles.logoutTopButton} onPress={onLogout}>
                        <Text style={styles.logoutTopText}>Dalja 🚪</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.avatarButton} onPress={pickProfileImage} activeOpacity={0.85}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{String(studentNickname).charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        <View style={styles.cameraBadge}><Text style={styles.cameraIcon}>📸</Text></View>
                    </TouchableOpacity>

                    <Text style={[styles.profileName, themeStyles.text]}>{formatNickname(studentNickname)}</Text>
                    <Text style={styles.emailText}>🏛️ Fakulteti: {studentFaculty} • {user?.email}</Text>
                </View>

                {/* TABS ROW */}
                <View style={styles.subTabRow}>
                    <TouchableOpacity style={[styles.subTabBtn, activeSubTab === 'posts' && styles.subTabActive]} onPress={() => setActiveSubTab('posts')}>
                        <Text style={[styles.subTabText, activeSubTab === 'posts' && styles.subTabTextActive]}>📝 Postimet e Mia</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.subTabBtn, activeSubTab === 'discover' && styles.subTabActive]} onPress={() => setActiveSubTab('discover')}>
                        <Text style={[styles.subTabText, activeSubTab === 'discover' && styles.subTabTextActive]}>✨ Get to Know People</Text>
                    </TouchableOpacity>
                </View>

                {activeSubTab === 'posts' ? (
                    <View style={{ width: '100%' }}>
                        <View style={[styles.newPostBox, themeStyles.card]}>
                            <TextInput
                                style={[styles.postInput, themeStyles.input]}
                                placeholder="Çfarë po mendon sot?"
                                placeholderTextColor="#A0AEC0"
                                value={postText}
                                onChangeText={setPostText}
                            />
                            {postImage && <Image source={{ uri: postImage }} style={styles.previewPostImage} />}
                            <View style={styles.postActionsRow}>
                                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPostImage}>
                                    <Text style={styles.addPhotoBtnText}>📸 Shto Foto</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.submitPostBtn} onPress={handleCreatePost} disabled={uploading}>
                                    {uploading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.submitPostBtnText}>Posto ➔</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {myPosts.map(item => (
                            <View key={item.id} style={[styles.feedCard, themeStyles.card]}>
                                <Text style={[styles.feedContent, themeStyles.text]}>{item.content}</Text>
                                {item.postImgUri && <Image source={{ uri: item.postImgUri }} style={styles.feedImage} resizeMode="cover" />}
                                <View style={styles.myPostFooter}>
                                    <Text style={styles.likesCountText}>❤️ {item.likes?.length || 0} pëlqime</Text>
                                    <Text style={styles.feedDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={{ width: '100%' }}>
                        {discoverPosts.map(item => {
                            const authorName = formatNickname(item.author);
                            const hasLiked = item.likes?.includes(user.uid);
                            return (
                                <View key={item.id} style={[styles.discoverFeedCard, themeStyles.card]}>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.avatarMini}><Text style={styles.avatarMiniTxt}>{String(item.author).charAt(0).toUpperCase()}</Text></View>
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={[styles.authorNameTxt, themeStyles.text]}>{authorName}</Text>
                                            <Text style={styles.facultySubTxt}>🏛️ {item.faculty || 'UP'}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.waveBtn} onPress={() => handleOpenDiscoverChat(item.uid, item.author, item.faculty)}>
                                            <Text style={styles.waveBtnTxt}>👋 Mesazh</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={[styles.postBodyTxt, themeStyles.text]}>{item.content}</Text>
                                    {item.postImgUri && <Image source={{ uri: item.postImgUri }} style={styles.feedImage} resizeMode="cover" />}

                                    <View style={styles.socialActionRow}>
                                        <TouchableOpacity style={styles.socialActionBtn} onPress={() => handleLikePost(item.id, item.likes)}>
                                            <Text style={[styles.socialActionText, hasLiked && { color: '#E53E3E', fontWeight: 'bold' }]}>
                                                {hasLiked ? '❤️ E pëlqyer' : '🤍 Pëlqe'} ({item.likes?.length || 0})
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.commentsCountTxt}>💬 Komente ({item.comments?.length || 0})</Text>
                                    </View>

                                    {item.comments && item.comments.length > 0 && (
                                        <View style={styles.commentsContainer}>
                                            {item.comments.map((comment, index) => (
                                                <View key={index} style={styles.commentRow}>
                                                    <Text style={[styles.commentAuthor, themeStyles.text]}>{formatNickname(comment.author)}: </Text>
                                                    <Text style={[styles.commentContent, themeStyles.text]}>{comment.content}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    <View style={styles.commentInputRow}>
                                        <TextInput
                                            style={[styles.commentField, themeStyles.input]}
                                            placeholder="Shkruaj një koment..."
                                            value={commentTexts[item.id] || ''}
                                            onChangeText={(text) => setCommentTexts(prev => ({ ...prev, [item.id]: text }))}
                                            placeholderTextColor="#A0AEC0"
                                        />
                                        <TouchableOpacity style={styles.commentSubmitBtn} onPress={() => handleAddComment(item.id)}>
                                            <Text style={{ color: '#0B2545', fontWeight: '800', fontSize: 12 }}>➔</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {activeChatSession && (
                <View style={[styles.floatingChatWrapper, isMaximized ? styles.maximizedWindow : { bottom: chatPosition.y, right: chatPosition.x }]}>
                    <View style={styles.bubbleDragHeader} onMouseDown={(e) => { if (!isMaximized) { setIsDragging(true); setDragStart({ x: e.clientX + chatPosition.x, y: e.clientY + chatPosition.y }); } }}>
                        <Text style={styles.bubbleHeaderTitle} numberOfLines={1}>💬 {activeChatSession.name}</Text>
                        <View style={styles.headerControls}>
                            <TouchableOpacity onPress={() => setIsMaximized(!isMaximized)} style={styles.controlBtn}><Text style={styles.controlBtnTxt}>{isMaximized ? '🗗' : '🗖'}</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveChatSession(null)} style={styles.controlBtn}><Text style={styles.controlBtnTxt}>✕</Text></TouchableOpacity>
                        </View>
                    </View>
                    <ChatScreen selectedChannel={activeChatSession} hideHeader={true} onBack={() => setActiveChatSession(null)} />
                </View>
            )}
        </View>
    );
}
const styles = StyleSheet.create({
    profileContainer: { flexGrow: 1, padding: 14, alignItems: 'center', width: '100%' },
    lightContainer: { backgroundColor: '#F0F4F8' }, darkContainer: { backgroundColor: '#1A202C' },
    lightCard: { backgroundColor: '#FFF', borderColor: '#EEF2F6' }, darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
    lightText: { color: '#0B2545' }, darkText: { color: '#FFF' },
    lightInput: { backgroundColor: '#F8FAFC', color: '#0B2545', borderColor: '#E2E8F0' }, darkInput: { backgroundColor: '#1A202C', color: '#FFF', borderColor: '#4A5568' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerCard: { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, position: 'relative' },
    logoutTopButton: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFF5F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FED7D7' },
    logoutTopText: { color: '#C53030', fontSize: 11, fontWeight: '700' },
    avatarButton: { position: 'relative', marginTop: 8 },
    avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#EEB902' },
    avatarImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#EEB902' },
    avatarText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EEB902', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#ffffff' },
    cameraIcon: { fontSize: 10 },
    profileName: { fontSize: 16, fontWeight: '800', marginTop: 6, textTransform: 'capitalize' },
    emailText: { fontSize: 12, color: '#718096', marginTop: 2, fontWeight: '500' },
    subTabRow: { flexDirection: 'row', width: '100%', marginVertical: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 4 },
    subTabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    subTabActive: { backgroundColor: '#FFF', elevation: 2 },
    subTabText: { fontSize: 12, fontWeight: '700', color: '#718096' },
    subTabTextActive: { color: '#0B2545' },
    newPostBox: { width: '100%', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
    postInput: { width: '100%', height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13 },
    previewPostImage: { width: '100%', height: 160, borderRadius: 10, marginTop: 8 },
    postActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
    addPhotoBtn: { backgroundColor: '#F0F4F8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    addPhotoBtnText: { color: '#4A5568', fontSize: 11, fontWeight: '700' },
    submitPostBtn: { backgroundColor: '#0B2545', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    submitPostBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    feedCard: { width: '100%', padding: 14, borderRadius: 12, marginVertical: 6, borderWidth: 1 },
    feedContent: { fontSize: 13, fontWeight: '500' },
    myPostFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, alignItems: 'center' },
    likesCountText: { fontSize: 11, fontWeight: '700', color: '#E53E3E' },
    feedDate: { fontSize: 10, color: '#A0AEC0', textAlign: 'right' },
    feedImage: { width: '100%', height: 200, borderRadius: 12, marginTop: 8 },
    discoverFeedCard: { width: '100%', padding: 14, borderRadius: 16, marginVertical: 6, borderWidth: 1, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatarMini: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center' },
    avatarMiniTxt: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    authorNameTxt: { fontSize: 13, fontWeight: '800' },
    facultySubTxt: { fontSize: 10, color: '#718096', fontWeight: '600' },
    waveBtn: { backgroundColor: '#F0F4F8', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    waveBtnTxt: { color: '#0B2545', fontSize: 11, fontWeight: '700' },
    postBodyTxt: { fontSize: 13, lineHeight: 19, fontWeight: '500', marginBottom: 8, paddingHorizontal: 2 },
    socialActionRow: { flexDirection: 'row', gap: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.04)', paddingVertical: 8, marginBottom: 8 },
    socialActionBtn: { paddingVertical: 2 },
    socialActionText: { fontSize: 12, color: '#718096', fontWeight: '600' },
    commentsCountTxt: { fontSize: 12, color: '#718096', fontWeight: '600' },
    commentsContainer: { backgroundColor: 'rgba(0,0,0,0.01)', padding: 8, borderRadius: 10, marginBottom: 8 },
    commentRow: { flexDirection: 'row', marginVertical: 2, paddingHorizontal: 4 },
    commentAuthor: { fontSize: 11, fontWeight: '800' },
    commentContent: { fontSize: 11, fontWeight: '500' },
    commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, width: '100%' },
    commentField: { flex: 1, height: 32, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 12 },
    commentSubmitBtn: { width: 32, height: 32, backgroundColor: '#EEB902', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    floatingChatWrapper: { position: 'absolute', width: 310, height: 420, backgroundColor: '#FFF', borderRadius: 14, elevation: 12, overflow: 'hidden', zIndex: 99999, borderWidth: 1, borderColor: '#E2E8F0' },
    maximizedWindow: { position: 'absolute', top: '12%', left: '25%', width: '50%', height: '70%', borderRadius: 16 },
    bubbleDragHeader: { height: 40, backgroundColor: '#0B2545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, cursor: 'move' },
    bubbleHeaderTitle: { color: '#FFF', fontWeight: '700', fontSize: 12, flex: 1 },
    headerControls: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    controlBtn: { padding: 2 }, controlBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' }
});
