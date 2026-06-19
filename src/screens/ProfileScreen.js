import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Image, Alert, Modal, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../config/firebase';
import { updatePassword } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, doc, updateDoc, arrayUnion, setDoc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { uploadFileToCloud } from '../utils/uploader';
import ChatScreen from './ChatScreen';

export default function ProfileScreen({ user, onLogout }) {
    const { isDarkMode, setIsDarkMode, setUser } = useAuth();
    const [profileImage, setProfileImage] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [discoverPosts, setDiscoverPosts] = useState([]);
    const [postText, setPostText] = useState('');
    const [postImage, setPostImage] = useState(null);
    const [commentTexts, setCommentTexts] = useState({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Tabet kryesore dhe kontrolli i dritareve
    const [activeSubTab, setActiveSubTab] = useState('posts');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Biografia, Fjalëkalimi dhe Email-i i Rikuperimit
    const [bioText, setBioText] = useState('');
    const [inputBio, setInputBio] = useState('');
    const [newPass, setNewPass] = useState('');
    const [backupEmail, setBackupEmail] = useState('');

    // Kontrolli i bisedës private lundruese (Floating Chat)
    const [activeChatSession, setActiveChatSession] = useState(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [chatPosition, setChatPosition] = useState({ x: 20, y: 105 });

    const studentEmail = user?.email || 'Nuk ka email';
    const studentFaculty = user?.faculty || 'FIEK';
    const rawPrefix = user?.email ? user.email.split('@')[0] : 'student';

    const formatNickname = (name) => {
        if (!name) return 'Student i UP-së';
        return String(name).replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    };

    const studentFullName = formatNickname(rawPrefix);

    useEffect(() => {
        const directAuthenticatedUid = auth.currentUser?.uid;
        if (!directAuthenticatedUid) {
            setLoading(false);
            return;
        }

        // Merr biografinë dhe email-in e dytë direkt nga dokumenti i përdoruesit
        const fetchUserData = async () => {
            try {
                const userDocRef = doc(db, 'users', directAuthenticatedUid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.bio) {
                        setBioText(data.bio);
                        setInputBio(data.bio);
                    }
                    if (data.backupEmail) {
                        setBackupEmail(data.backupEmail);
                    }
                }
            } catch (err) {
                console.log("Gabim gjatë ngarkimit të biografisë:", err);
            }
        };
        fetchUserData();

        // Ngarkimi i avatarit nga cache lokale
        const loadProfileAvatarCache = async () => {
            try {
                const storedImage = await AsyncStorage.getItem(`@PrishtinaConnect:avatar:${user?.email}`);
                if (storedImage != null) setProfileImage(storedImage);
            } catch (e) {
                console.log("Gabim leximi cache avatar:", e);
            }
        };
        loadProfileAvatarCache();

        // Dëgjimi i postimeve - I thjeshtuar plotësisht pa asnjë kusht (Bypass Indexes)
        const postsRef = collection(db, 'posts');
        const unsubscribeLiveFeed = onSnapshot(postsRef, (snapshot) => {
            const mine = [];
            const others = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data) {
                    const unifiedPostObj = {
                        id: doc.id,
                        likes: data.likes || [],
                        comments: data.comments || [],
                        content: data.content || '',
                        author: data.author || 'Student',
                        faculty: data.faculty || 'UP',
                        uid: data.uid,
                        createdAt: data.createdAt || new Date().toISOString(),
                        postImgUri: data.postImgUri || null
                    };

                    // Ndarja e postimeve bëhet në memorien lokale të telefonit pa bllokuar Firebase
                    if (data.uid && String(data.uid).trim() === String(directAuthenticatedUid).trim()) {
                        mine.push(unifiedPostObj);
                    } else {
                        others.push(unifiedPostObj);
                    }

                }
            });

            // Renditja lokale
            mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Algoritmi Random (Shuffle Engine) për studentët e tjerë
            for (let i = others.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [others[i], others[j]] = [others[j], others[i]];
            }

            setMyPosts(mine);
            setDiscoverPosts(others);
            setLoading(false);
        }, (err) => {
            console.log("Gabim në dëgjimin e postimeve:", err);
            setLoading(false);
        });

        return () => unsubscribeLiveFeed();
    }, [user?.uid]);

    const pickProfileImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Refuzuar 🔒", "Lejoni qasjen në galeri për të ndryshuar foton.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.6,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedImg = result.assets[0].uri;
            setUploading(true);
            try {
                const cloudAvatarUrl = await uploadFileToCloud(selectedImg, 'avatars');
                await AsyncStorage.setItem(`@PrishtinaConnect:avatar:${user?.email}`, cloudAvatarUrl);
                setProfileImage(cloudAvatarUrl);
                Alert.alert("Sukses 🎉", "Fotoja e profilit u përditësua me sukses!");
            } catch (e) {
                console.log("Avatar upload crash:", e);
                Alert.alert("Gabim", "Ngarkimi i fotos dështoi.");
            } finally {
                setUploading(false);
            }
        }
    };

    const pickPostImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Refuzuar 🔒", "Lejoni qasjen në galeri për të përzgjedhur foto.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        //  Safely reads the array element index to get the uri
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setPostImage(result.assets[0].uri);
        }
    };

    const handleCreatePost = async () => {
        if (!postText.trim() && !postImage) {
            Alert.alert("Gabim", "Ju lutem shkruani diçka ose zgjedhni një foto.");
            return;
        }

        const directAuthenticatedUid = auth.currentUser?.uid;
        if (!directAuthenticatedUid) {
            Alert.alert("Gabim", "Seanca juaj ka skaduar. Kyçuni përsëri.");
            return;
        }

        setUploading(true);
        try {
            let finalCloudMediaUrl = null;
            if (postImage) {
                finalCloudMediaUrl = await uploadFileToCloud(postImage, 'posts_media');
            }

            //  Dërgimi i pastër i të dhënave të autorit dhe UID
            await addDoc(collection(db, 'posts'), {
                content: postText.trim(),
                postImgUri: finalCloudMediaUrl,
                createdAt: new Date().toISOString(),
                uid: String(directAuthenticatedUid), // Sigurohemi që është String i pastër
                author: String(rawPrefix),
                faculty: studentFaculty,
                likes: [],
                comments: []
            });

            setPostText('');
            setPostImage(null);
            Alert.alert("Sukses 🎉", "Postimi juaj u publikua me sukses!");
        } catch (e) {
            console.log("Gabim kritik gjatë postimit:", e);
            Alert.alert("Gabim", "Postimi dështoi.");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfileSettings = async () => {
        const directAuthenticatedUid = auth.currentUser?.uid;
        if (!directAuthenticatedUid) {
            if (typeof window !== 'undefined') alert("Gabim: Seanca juaj ka skaduar.");
            else Alert.alert("Gabim", "Seanca juaj ka skaduar.");
            return;
        }

        setUploading(true);
        try {
            const userDocRef = doc(db, 'users', directAuthenticatedUid);

            // Ndërtojmë payload-in duke marrë Bio-n e re të shkruar
            const dataPayload = {
                bio: inputBio ? inputBio.trim() : ''
            };

            //  Nëse studenti ka shkruar diçka te email-i i rikuperimit, e ruajmë. Nëse jo, e anashkalojmë dhe nuk e bllokojmë procesin!
            if (backupEmail && backupEmail.trim()) {
                dataPayload.backupEmail = backupEmail.trim();
            }

            // Ruajtja fleksibile në Firebase Firestore (përditëson vetëm atë që ndryshon pa fshirë të tjerat)
            await setDoc(userDocRef, dataPayload, { merge: true });

            // Përditësojmë tekstin e profilit në ekran menjëherë
            setBioText(inputBio ? inputBio.trim() : '');

            if (setUser) {
                setUser(prev => ({ ...prev, ...dataPayload }));
            }

            // Ndryshimi i fjalëkalimit (vetëm nëse është shkruar një fjalëkalim i ri)
            if (newPass && newPass.trim()) {
                if (newPass.trim().length < 6) {
                    if (typeof window !== 'undefined') alert("Fjalëkalimi duhet të jetë së paku 6 karaktere.");
                    setUploading(false);
                    return;
                }
                const activeUserInstance = auth.currentUser;
                if (activeUserInstance) {
                    await updatePassword(activeUserInstance, newPass.trim());
                    setNewPass('');
                }
            }

            // Njoftimi i suksesit për Google Chrome apo Celular
            if (typeof window !== 'undefined') {
                alert("Sukses 🎉 Biografia juaj u përditësua me sukses!");
            } else {
                Alert.alert("Sukses 🎉", "Biografia juaj u përditësua me sukses!");
            }

            setIsSettingsOpen(false);
        } catch (err) {
            console.error("Gabim kritik gjatë ruajtjes së profilit:", err);
            if (typeof window !== 'undefined') alert("Gabim: Përditësimi i biografisë dështoi.");
            else Alert.alert("Gabim", "Përditësimi i biografisë dështoi.");
        } finally {
            setUploading(false);
        }
    };


//  FUNKSIONI  PËR FSHIRJEN E POSTIMIT
    const handleDeletePost = async (postId) => {
        if (!postId) return;

        // Logjikë ekzekutimi e përshtatur posaçërisht për Google Chrome Web Browser
        const ekzekutoFshirjen = async () => {
            try {
                await deleteDoc(doc(db, 'posts', String(postId).trim()));
                alert("Sukses 🎉 Postimi u fshi."); // Përdorim alert të thjeshtë për Web
            } catch (e) {
                console.log("Gabim gjatë fshirjes në Firebase:", e);
                alert("Gabim! Fshirja dështoi. Kontrolloni rregullat në Firebase.");
            }
        };

        // KONTROLLI I PLATFORMËS: Nëse jemi në Web (Chrome), përdorim window.confirm të browser-it
        if (typeof window !== 'undefined' && window.confirm) {
            const konfirmimiWeb = window.confirm("A jeni i sigurt që dëshironi ta fshini përgjithmonë këtë postim?");
            if (konfirmimiWeb) {
                await ekzekutoFshirjen();
            }
        } else {
            // Fallback tradicional për telefon nëse kodi kthehet në emulator/celular
            Alert.alert(
                "Fshij Postimin 🗑️",
                "A jeni i sigurt që dëshironi ta fshini përgjithmonë këtë postim?",
                [
                    { text: "Anulo", style: "cancel" },
                    { text: "Fshij", style: "destructive", onPress: ekzekutoFshirjen }
                ]
            );
        }
    };



    const handleLikePost = async (postId, currentLikes = []) => {
        const postRef = doc(db, 'posts', postId);
        const directAuthenticatedUid = auth.currentUser?.uid;
        if (!directAuthenticatedUid) return;
        const hasLiked = currentLikes.includes(directAuthenticatedUid);
        try {
            const updatedLikes = hasLiked
                ? currentLikes.filter(id => id !== directAuthenticatedUid)
                : [...currentLikes, directAuthenticatedUid];
            await updateDoc(postRef, { likes: updatedLikes });
        } catch (e) { console.log(e); }
    };

    const handleAddComment = async (postId) => {
        const text = commentTexts[postId];
        if (!text || !text.trim()) return;

        const postRef = doc(db, 'posts', postId);
        const newComment = {
            author: rawPrefix,
            content: text.trim(),
            createdAt: new Date().toISOString()
        };

        try {
            await updateDoc(postRef, { comments: arrayUnion(newComment) });
            setCommentTexts(prev => ({ ...prev, [postId]: '' }));
        } catch (e) {
            console.log("Error updates comments:", e);
        }
    };

    const handleOpenDiscoverChat = async (postAuthorUid, authorName, authorFaculty) => {
        if (!postAuthorUid || !user?.uid) return;

        const chatId = user.uid < postAuthorUid ? `chat_${user.uid}_${postAuthorUid}` : `chat_${postAuthorUid}_${user.uid}`;
        let initialStatus = 'none';

        try {
            const channelDocRef = doc(db, 'channels', chatId);
            const channelSnap = await getDoc(channelDocRef);

            if (channelSnap.exists()) {
                const reqData = channelSnap.data();
                if (reqData.status === 'accepted') {
                    initialStatus = 'accepted';
                } else if (reqData.senderId === user.uid) {
                    initialStatus = 'pending';
                } else {
                    initialStatus = 'incoming';
                }
            } else {
                await setDoc(channelDocRef, {
                    id: chatId,
                    isPrivate: true,
                    status: 'pending',
                    senderId: user.uid,
                    receiverId: postAuthorUid,
                    members: [user.uid, postAuthorUid],
                    createdAt: new Date().toISOString()
                }, { merge: true });
                initialStatus = 'pending';
                Alert.alert("Kërkesa u dërgua ✉️", `Kërkesa për bisedë private iu dërgua studentit ${formatNickname(authorName)}.`);
            }
        } catch(e) {
            console.log("Chat routing fault:", e);
        }

        setActiveChatSession({
            id: chatId,
            name: formatNickname(authorName),
            isPrivate: true,
            initialStatus: initialStatus,
            targetUser: { id: postAuthorUid, faculty: authorFaculty, email: `${authorName}@student.uni-pr.edu` }
        });
        setIsMaximized(false);
    };

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };

    if (loading) {
        return (
            <View style={[styles.center, isDarkMode ? styles.darkBg : styles.lightBg]}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, width: '100%' }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.profileContainer, isDarkMode ? styles.darkBg : styles.lightBg]} keyboardShouldPersistTaps="handled">

                {/* INSTITUTIONAL PROFILE MASTER HEAD CARD */}
                <View style={[styles.headerCard, themeStyles.card]}>
                    <TouchableOpacity style={styles.logoutTopButton} onPress={onLogout}>
                        <Text style={styles.logoutTopText}>Dalja 🚪</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.avatarButton} onPress={pickProfileImage} activeOpacity={0.85}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{String(studentFullName).charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        <View style={styles.cameraBadge}><Text style={styles.cameraIcon}>📸</Text></View>
                    </TouchableOpacity>

                    <Text style={[styles.profileName, themeStyles.text]}>{studentFullName}</Text>

                    {/* NEW SIDE-BY-SIDE BUBBLE BADGE FOR FACULTY AND EMAIL */}
                    <View style={styles.bubbleBadgesInlineRow}>
                        <View style={styles.facultyBadgeBubble}>
                            <Text style={styles.facultyBadgeBubbleTxt}>🏛️ {studentFaculty}</Text>
                        </View>
                        <View style={styles.emailBadgeBubble}>
                            <Text style={styles.emailBadgeBubbleTxt} numberOfLines={1}>📧 {studentEmail}</Text>
                        </View>
                    </View>
                    {/* DEDICATED BIOGRAPHY FIELD ENTRY SECTION BELOW THE BADGES */}
                    <View style={styles.biographyTextContainerBlock}>
                        <Text style={[styles.biographyTextNodeDisplay, themeStyles.text]}>
                            {bioText && bioText.trim() ? bioText : "Nuk ka biografi të shkruar ende. Kliko cilësimet për ta shtuar! ✨"}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.settingsLauncherBtn} onPress={() => setIsSettingsOpen(true)}>
                        <Text style={styles.settingsLauncherTxt}>⚙️ Settings</Text>
                    </TouchableOpacity>
                </View>

                {/* HORIZONTAL TAB SWITCHERS PANEL */}
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
                        {/* COMPACT PUBLISHING TIMELINE PANEL BOX */}
                        <View style={[styles.newPostBox, themeStyles.card]}>
                            <TextInput
                                style={[styles.postInput, themeStyles.input]}
                                placeholder="Çfarë po mendon sot, koleg/e?"
                                placeholderTextColor="#A0AEC0"
                                value={postText}
                                onChangeText={setPostText}
                                multiline
                            />

                            {/* WORKING: IMAGE PREVIEW CONTAINER EQUIPPED WITH TOP-RIGHT DELETION [X] BUTTON */}
                            {postImage && (
                                <View style={styles.previewImageRelativeWrapper}>
                                    <Image source={{ uri: postImage }} style={styles.previewPostImage} />
                                    <TouchableOpacity
                                        style={styles.cancelSelectedImageBtn}
                                        onPress={() => setPostImage(null)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.cancelSelectedImageTxt}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.postActionsRow}>
                                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPostImage}>
                                    <Text style={styles.addPhotoBtnText}>📸 Shto Foto</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.submitPostBtn} onPress={handleCreatePost} disabled={uploading}>
                                    {uploading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.submitPostBtnText}>Posto ➔</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* PERSONAL USER FEED LOOPS LIST */}
                        {myPosts.length === 0 ? (
                            <Text style={styles.emptyFeedTextNode}>Nuk keni publikuar asnjë postim ende.</Text>
                        ) : (
                            myPosts.map(item => (
                                <View key={item.id} style={[styles.feedCard, themeStyles.card]}>
                                    <Text style={[styles.feedContent, themeStyles.text]}>{item.content}</Text>
                                    {item.postImgUri && <Image source={{ uri: item.postImgUri }} style={styles.feedImage} resizeMode="cover" />}

                                    <View style={styles.myPostFooter}>
                                        <Text style={styles.likesCountText}>❤️ {item.likes?.length || 0} pëlqime</Text>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Text style={styles.feedDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                            {/* WORKING: INSTANT POST DELETION METHOD TRIGGER HOOK */}
                                            <TouchableOpacity onPress={() => handleDeletePost(item.id)} style={styles.deletePostInlineBtn}>
                                                <Text style={styles.deletePostInlineTxt}>🗑️ Fshij</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                ) : (

                    <View style={{ width: '100%' }}>
                        {/* RANDOMIZED DISCOVER FEED PIPELINES */}
                        {discoverPosts.length === 0 ? (
                            <Text style={styles.emptyFeedTextNode}>Nuk ka postime nga studentët e tjerë.</Text>
                        ) : (
                            discoverPosts.map(item => {
                                const authorDisplayName = formatNickname(item.author);
                                const hasLiked = item.likes?.includes(user?.uid);
                                return (
                                    <View key={item.id} style={[styles.discoverFeedCard, themeStyles.card]}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.avatarMini}>
                                                <Text style={styles.avatarMiniTxt}>{String(authorDisplayName).charAt(0).toUpperCase()}</Text>
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <Text style={[styles.authorNameTxt, themeStyles.text]}>{authorDisplayName}</Text>
                                                <Text style={styles.facultySubTxt}>🏛️ {item.faculty || 'UP'}</Text>
                                            </View>
                                            <TouchableOpacity style={styles.waveBtn} onPress={() => handleOpenDiscoverChat(item.uid, item.author, item.faculty)}>
                                                <Text style={styles.waveBtnTxt}>👋 Mesazh</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {item.content ? <Text style={[styles.postBodyTxt, themeStyles.text]}>{item.content}</Text> : null}
                                        {item.postImgUri && <Image source={{ uri: item.postImgUri }} style={styles.feedImage} resizeMode="cover" />}

                                        <View style={styles.socialActionRow}>
                                            <TouchableOpacity style={styles.socialActionBtn} onPress={() => handleLikePost(item.id, item.likes)}>
                                                <Text style={[styles.socialActionText, hasLiked && { color: '#EF4444', fontWeight: '800' }]}>
                                                    {hasLiked ? '❤️ E pëlqyer' : '🤍 Pëlqe'} ({item.likes?.length || 0})
                                                </Text>
                                            </TouchableOpacity>
                                            <Text style={styles.commentsCountTxt}>💬 Komente ({item.comments?.length || 0})</Text>
                                        </View>

                                        {item.comments && item.comments.length > 0 && (
                                            <View style={styles.commentsContainer}>
                                                {item.comments.map((comment, idx) => (
                                                    <View key={idx} style={styles.commentRow}>
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
                                                placeholderTextColor="#A0AEC0"
                                                value={commentTexts[item.id] || ''}
                                                onChangeText={(txt) => setCommentTexts(prev => ({ ...prev, [item.id]: txt }))}
                                            />
                                            <TouchableOpacity style={styles.commentSubmitBtn} onPress={() => handleAddComment(item.id)}>
                                                <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 11 }}>➔</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}
            </ScrollView>

            <Modal animationType="slide" transparent={true} visible={isSettingsOpen} onRequestClose={() => setIsSettingsOpen(false)}>
                <ScrollView contentContainerStyle={styles.settingsModalScrollWrapper} keyboardShouldPersistTaps="handled">
                    <View style={[styles.settingsModalContent, themeStyles.card]}>
                        <View style={styles.settingsHeaderRow}>
                            <Text style={[styles.settingsTitleMain, themeStyles.text]}>⚙️ Ndrysho Pamjen & Sigurinë</Text>
                            <TouchableOpacity style={styles.settingsCloseBtnTop} onPress={() => setIsSettingsOpen(false)}>
                                <Text style={styles.settingsCloseBtnTxtTop}>Mbyll ×</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.settingsSectionHeading}>Biografia e Studentit (Bio)</Text>
                        <TextInput
                            style={[styles.settingsInputField, themeStyles.input, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                            placeholder="Shkruaj diçka rreth vetes ose interesave të tua..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            value={inputBio}
                            onChangeText={setInputBio}
                        />

                        {/* SECURE PASSWORD MANAGEMENT TRACKS */}
                        <Text style={styles.settingsSectionHeading}>Fjalëkalimi i Ri</Text>
                        <TextInput
                            style={[styles.settingsInputField, themeStyles.input]}
                            placeholder="Lere zbrazët nëse nuk dëshiron ta ndryshosh"
                            placeholderTextColor="#94A3B8"
                            secureTextEntry
                            value={newPass}
                            onChangeText={setNewPass}
                        />

                        {/* BACKUP RECOVERY EMAIL INTERFACE FIELD */}
                        <Text style={styles.settingsSectionHeading}>Email Rikuperimi (Backup Email) 🛡️</Text>
                        <TextInput
                            style={[styles.settingsInputField, themeStyles.input]}
                            placeholder="email.rikuperimi@gmail.com"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={backupEmail}
                            onChangeText={setBackupEmail}
                        />

                        <Text style={styles.settingsSectionHeading}>Pamja e Portalit</Text>
                        <View style={styles.settingsOptionItemRow}>
                            <Text style={[styles.optionLabelTitle, themeStyles.text]}>Tema e Errët (Dark Mode)</Text>
                            <Switch
                                value={isDarkMode}
                                onValueChange={(val) => setIsDarkMode(val)}
                                trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                                thumbColor={isDarkMode ? '#4F46E5' : '#F1F5F9'}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.settingsSaveAndDoneBtn}
                            onPress={handleUpdateProfileSettings}
                            disabled={uploading}
                        >
                            {uploading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.settingsSaveAndDoneTxt}>Ruaj Ndryshimet ⚡</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Modal>

            {activeChatSession && (
                <View style={[styles.floatingChatWrapper, isMaximized ? styles.maximizedWindow : { bottom: chatPosition.y, right: chatPosition.x }]}>
                    <View style={styles.bubbleDragHeader}>
                        <Text style={styles.bubbleHeaderTitle} numberOfLines={1}>💬 {activeChatSession.name}</Text>
                        <View style={styles.headerControls}>
                            <TouchableOpacity onPress={() => setIsMaximized(!isMaximized)} style={styles.controlBtn}>
                                <Text style={styles.controlBtnTxt}>{isMaximized ? '🗗' : '🗖'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveChatSession(null)} style={styles.controlBtn}>
                                <Text style={styles.controlBtnTxt}>✕</Text>
                            </TouchableOpacity>
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
    lightBg: { backgroundColor: '#F0F4F8' },
    darkBg: { backgroundColor: '#080E1A' },
    lightCard: { backgroundColor: '#FFFFFF', borderColor: '#EEF2F6' },
    darkCard: { backgroundColor: '#0F172A', borderColor: 'rgba(79, 70, 229, 0.2)' },
    lightText: { color: '#0B2545' },
    darkText: { color: '#FFFFFF' },
    lightInput: { backgroundColor: '#F8FAFC', color: '#0B2545', borderColor: '#E2E8F0' },
    darkInput: { backgroundColor: '#1E293B', color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.05)' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerCard: { width: '100%', padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, position: 'relative', elevation: 2 },
    logoutTopButton: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2' },
    logoutTopText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },
    avatarButton: { position: 'relative', marginTop: 12 },
    avatarCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#10B981' },
    avatarImage: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: '#10B981' },
    avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
    cameraIcon: { fontSize: 10 },
    profileName: { fontSize: 16, fontWeight: '900', marginTop: 8 },
    emailText: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '600' },
    bubbleBadgesInlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap', width: '100%' },
    facultyBadgeBubble: { backgroundColor: 'rgba(79, 70, 229, 0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(79, 70, 229, 0.2)' },
    facultyBadgeBubbleTxt: { color: '#818CF8', fontSize: 11, fontWeight: '800' },
    emailBadgeBubble: { backgroundColor: 'rgba(16, 185, 129, 0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', maxWidth: '65%' },
    emailBadgeBubbleTxt: { color: '#10B981', fontSize: 11, fontWeight: '800' },
    biographyTextContainerBlock: { width: '100%', paddingHorizontal: 16, marginTop: 12, alignItems: 'center' },
    biographyTextNodeDisplay: { fontSize: 13, lineHeight: 19, fontWeight: '500', fontStyle: 'italic', color: '#64748B', textAlign: 'center' },
    settingsLauncherBtn: { marginTop: 14, backgroundColor: 'rgba(79, 70, 229, 0.1)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 },
    settingsLauncherTxt: { color: '#818CF8', fontSize: 11, fontWeight: '800' },
    subTabRow: { flexDirection: 'row', width: '100%', marginVertical: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 4 },
    subTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
    subTabActive: { backgroundColor: '#4F46E5', elevation: 1 },
    subTabText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    subTabTextActive: { color: '#FFFFFF', fontWeight: '800' },
    newPostBox: { width: '100%', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    postInput: { width: '100%', minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingTop: 8, fontSize: 13, textAlignVertical: 'top' },
    previewImageRelativeWrapper: { width: '100%', height: 160, marginTop: 8, position: 'relative', borderRadius: 12, overflow: 'hidden' },
    previewPostImage: { width: '100%', height: '100%' },
    cancelSelectedImageBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(15, 23, 42, 0.85)', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    cancelSelectedImageTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    postActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
    addPhotoBtn: { backgroundColor: 'rgba(0,0,0,0.02)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    addPhotoBtnText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
    submitPostBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    submitPostBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
    emptyFeedTextNode: { textAlign: 'center', color: '#94A3B8', marginVertical: 30, fontSize: 13, fontStyle: 'italic' },
    feedCard: {width: '100%', padding: 14, borderRadius: 16, marginVertical: 6, borderWidth: 1, zIndex: 10, elevation: 3},
    feedContent: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
    myPostFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)', paddingTop: 8 },
    likesCountText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
    feedDate: { fontSize: 10, color: '#94A3B8' },
    deletePostInlineBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5, borderColor: '#FEE2E2' },
    deletePostInlineTxt: { color: '#EF4444', fontSize: 10, fontWeight: '800' },
    feedImage: { width: '100%', height: 180, borderRadius: 12, marginTop: 8 },
    discoverFeedCard: { width: '100%', padding: 14, borderRadius: 20, marginVertical: 6, borderWidth: 1, elevation: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatarMini: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
    avatarMiniTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
    authorNameTxt: { fontSize: 13, fontWeight: '800' },
    facultySubTxt: { fontSize: 10, color: '#64748B', fontWeight: '600', marginTop: 1 },
    waveBtn: { backgroundColor: 'rgba(16, 185, 129, 0.12)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    waveBtnTxt: { color: '#10B981', fontSize: 11, fontWeight: '700' },
    postBodyTxt: { fontSize: 13, lineHeight: 19, fontWeight: '500', marginBottom: 8, paddingHorizontal: 2 },
    socialActionRow: { flexDirection: 'row', gap: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.03)', paddingVertical: 8, marginBottom: 8 },
    socialActionBtn: { paddingVertical: 2 },
    socialActionText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    commentsCountTxt: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    commentsContainer: { backgroundColor: 'rgba(0,0,0,0.02)', padding: 10, borderRadius: 12, marginBottom: 8 },
    commentRow: { flexDirection: 'row', marginVertical: 3, paddingHorizontal: 2 },
    commentAuthor: { fontSize: 11, fontWeight: '800' },
    commentContent: { fontSize: 11, fontWeight: '500', flex: 1 },
    commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, width: '100%' },
    commentField: { flex: 1, height: 34, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, fontSize: 12 },
    commentSubmitBtn: { width: 34, height: 34, backgroundColor: '#10B981', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    settingsModalScrollWrapper: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    settingsModalContent: { width: '100%', maxWidth: 380, borderRadius: 24, padding: 20, borderWidth: 1, elevation: 12 },
    settingsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    settingsTitleMain: { fontSize: 15, fontWeight: '900' },
    settingsCloseBtnTop: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#FEF2F2', borderRadius: 8 },
    settingsCloseBtnTxtTop: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
    settingsSectionHeading: { fontSize: 11, fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 },
    settingsInputField: { width: '100%', height: 44, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, fontSize: 13, fontWeight: '500', marginBottom: 4 },
    settingsOptionItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.02)' },
    optionLabelTitle: { fontSize: 13, fontWeight: '700' },
    institutionalDataBlock: { backgroundColor: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 12, gap: 4, width: '100%' },
    instDataLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    settingsSaveAndDoneBtn: { marginTop: 18, backgroundColor: '#4F46E5', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', width: '100%' },
    settingsSaveAndDoneTxt: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    floatingChatWrapper: { position: 'absolute', width: 310, height: 420, backgroundColor: '#FFFFFF', borderRadius: 14, elevation: 12, overflow: 'hidden', zIndex: 999, borderWidth: 1, borderColor: '#E2E8F0' },
    maximizedWindow: { position: 'absolute', top: '12%', left: '25%', width: '50%', height: '70%', borderRadius: 16 },
    bubbleDragHeader: { height: 40, backgroundColor: '#0B2545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
    bubbleHeaderTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, flex: 1 },
    headerControls: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    controlBtn: { padding: 2 },
    controlBtnTxt: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' }
});
