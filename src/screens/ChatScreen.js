import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import MessageBubble from '../components/MessageBubble';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';

export default function ChatScreen({ selectedChannel, onBack, hideHeader }) {
    const { user, isDarkMode } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [requestStatus, setRequestStatus] = useState(selectedChannel?.initialStatus || 'accepted');
    const [loading, setLoading] = useState(true);
    const [showTrashMenu, setShowTrashMenu] = useState(false);

    useEffect(() => {
        if (!selectedChannel?.id || !user?.uid) return;

        if (!selectedChannel.isPrivate) {
            setRequestStatus('accepted');
            setLoading(false);
        } else {
            const requestDocRef = doc(db, 'channels', selectedChannel.id);
            const unsubscribeRequest = onSnapshot(requestDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.status === 'accepted') {
                        setRequestStatus('accepted');
                    } else if (data.senderId === user.uid) {
                        setRequestStatus('pending');
                    } else {
                        setRequestStatus('incoming');
                    }
                } else {
                    setRequestStatus('none');
                }
                setLoading(false);
            }, (error) => {
                console.log("Gabim live stream kërkesa:", error);
                setRequestStatus('none');
                setLoading(false);
            });

            return () => unsubscribeRequest();
        }
    }, [selectedChannel?.id, user?.uid]);

    useEffect(() => {
        if (!selectedChannel?.id) return;

        const q = query(collection(db, 'channels', selectedChannel.id, 'messages'), orderBy('createdAt', 'desc'));
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            setMessages(list);
        }, (error) => {
            console.log("Gabim live stream mesazhet:", error);
        });

        return () => unsubscribeMessages();
    }, [selectedChannel?.id]);

    const formatNicknameSafe = (textInput) => {
        if (!textInput) return 'Student';
        const cleanStr = String(textInput);
        if (cleanStr.includes('@')) {
            const parts = cleanStr.split('@');
            const partBeforeAt = parts.shift();
            return partBeforeAt.replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        }
        return cleanStr.replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    };
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user?.uid || !selectedChannel?.id) return;

        const currentText = newMessage.trim();
        setNewMessage('');

        if (selectedChannel.isPrivate && requestStatus === 'none') {
            try {
                const idParts = selectedChannel.id.split('_');
                const extractedPartnerId = idParts.find(id => id !== user.uid && id !== 'chat') || selectedChannel.targetUser?.id || '';

                if (!extractedPartnerId) return;

                const channelDocRef = doc(db, 'channels', selectedChannel.id);
                await setDoc(channelDocRef, {
                    id: selectedChannel.id,
                    isPrivate: true,
                    status: 'pending',
                    senderId: user.uid,
                    receiverId: extractedPartnerId,
                    members: [user.uid, extractedPartnerId],
                    createdAt: new Date().toISOString()
                }, { merge: true });

                setRequestStatus('pending');
            } catch (e) {
                console.log("Gabim gjatë krijimit të kanalit privat:", e);
            }
        }

        try {
            await addDoc(collection(db, 'channels', selectedChannel.id, 'messages'), {
                text: currentText,
                createdAt: new Date().toISOString(),
                uid: user.uid,
                email: user.email || 'student@uni-pr.edu'
            });
        } catch (e) {
            console.log("Gabim gjatë shtimit të mesazhit:", e);
        }
    };

    const handleAccept = async () => {
        if (!selectedChannel?.id) return;
        try {
            await setDoc(doc(db, 'channels', selectedChannel.id), { status: 'accepted' }, { merge: true });
            setRequestStatus('accepted');
        } catch (e) { console.log(e); }
    };

    const handleDeny = async () => {
        if (!selectedChannel?.id) return;
        try {
            await deleteDoc(doc(db, 'channels', selectedChannel.id));
            onBack();
        } catch (e) { console.log(e); }
    };

    const handleClearMessagesOnly = async () => {
        if (!selectedChannel?.id) return;
        setShowTrashMenu(false);
        try {
            const batch = writeBatch(db);
            const messagesSnapshot = await getDocs(collection(db, 'channels', selectedChannel.id, 'messages'));
            messagesSnapshot.forEach((msgDoc) => {
                const msgDocRef = doc(db, 'channels', selectedChannel.id, 'messages', msgDoc.id);
                batch.delete(msgDocRef);
            });
            await batch.commit();
            Alert.alert("Historiku u pastrua 🗑️", "Të gjitha mesazhet u fshinë, por biseda mbetet aktive.");
        } catch (e) { console.log("Gabim gjatë pastrimit të mesazheve:", e); }
    };

    const handleDeleteChatOnly = async () => {
        if (!selectedChannel?.id) return;
        setShowTrashMenu(false);
        try {
            const batch = writeBatch(db);
            const messagesSnapshot = await getDocs(collection(db, 'channels', selectedChannel.id, 'messages'));
            messagesSnapshot.forEach((msgDoc) => {
                const msgDocRef = doc(db, 'channels', selectedChannel.id, 'messages', msgDoc.id);
                batch.delete(msgDocRef);
            });
            await batch.commit();
            Alert.alert("Biseda u fshi 🗑️", "Historiku u pastrua.");
            if (onBack) onBack();
        } catch (e) { console.log("Gabim gjatë fshirjes së bisedës:", e); }
    };

    const handleRemoveFromFriends = async () => {
        if (!selectedChannel?.id) return;
        setShowTrashMenu(false);
        try {
            const batch = writeBatch(db);
            const channelDocRef = doc(db, 'channels', selectedChannel.id);
            batch.delete(channelDocRef);

            const messagesSnapshot = await getDocs(collection(db, 'channels', selectedChannel.id, 'messages'));
            messagesSnapshot.forEach((msgDoc) => {
                const msgDocRef = doc(db, 'channels', selectedChannel.id, 'messages', msgDoc.id);
                batch.delete(msgDocRef);
            });

            await batch.commit();
            Alert.alert("U largua nga miqtë 🚫", "Lidhja e shoqërisë dhe historiku u fshinë komplet.");
            if (onBack) onBack();
        } catch (e) { console.log("Gabim gjatë largimit nga miqtë:", e); }
    };

    if (!selectedChannel || !selectedChannel.id || loading) {
        return <View style={styles.center}><ActivityIndicator color="#0B2545" /></View>;
    }
    return (
        <KeyboardAvoidingView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            {!hideHeader && (
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack}><Text style={styles.headerText}>⬅ Kthehu</Text></TouchableOpacity>
                    <Text style={styles.headerTitle}>{selectedChannel.name}</Text>

                    {selectedChannel.isPrivate && (
                        <View>
                            {/* Butoni i koshit 🗑️ */}
                            <TouchableOpacity onPress={() => setShowTrashMenu(!showTrashMenu)} style={styles.trashcanBtn} activeOpacity={0.7}>
                                <Text style={styles.trashcanIconTxt}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* TAB-I I RI SAKTI: Shfaqet direkt MBI bisedën e hapur, pa u bllokuar nga dritarja e kërkimit */}
            {selectedChannel.isPrivate && showTrashMenu && (
                <View style={styles.chatInternalOverlay}>
                    <View style={styles.viberMasterTabContent}>
                        <Text style={styles.viberTabTitleTxt}>⚙️ Opsionet e Bisedës</Text>

                        <TouchableOpacity style={styles.viberTabRowBtn} onPress={handleClearMessagesOnly}>
                            <Text style={styles.dropdownBlueTxt}>🗑️ Pastro Historikun</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.viberTabRowBtn} onPress={handleDeleteChatOnly}>
                            <Text style={styles.dropdownOrangeTxt}>❌ Fshij Bisedën</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.viberTabRowBtn, { borderBottomWidth: 0 }]} onPress={handleRemoveFromFriends}>
                            <Text style={styles.dropdownRedTxt}>🚫 Largo nga Miqtë</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.viberTabCloseBtn} onPress={() => setShowTrashMenu(false)}>
                            <Text style={styles.viberTabCloseTxt}>Mbyll Opsionet ×</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                inverted
                contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
                renderItem={({ item }) => {
                    const isMe = item.uid === user.uid;
                    return <MessageBubble text={item.text} email={item.email} isMe={isMe} imageUri={item.imageUri} />;
                }}
            />

            {selectedChannel.isPrivate && requestStatus === 'incoming' && (
                <View style={styles.alertBox}>
                    <Text style={styles.alertTxt}>Prano kërkesën nga {selectedChannel.name} për të biseduar?</Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.denyBtn} onPress={handleDeny}>
                            <Text style={{ color: '#C53030', fontWeight: '700', fontSize: 12 }}>Refuzo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Prano</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {selectedChannel.isPrivate && requestStatus === 'pending' && (
                <View style={styles.alertBox}>
                    <Text style={[styles.alertTxt, { color: '#718096', fontStyle: 'italic', textAlign: 'center' }]}>
                        ⏳ Kërkesa u dërgua. Qasja në shkrim bllokohet derisa studenti ta pranojë bisedën tuaj.
                    </Text>
                </View>
            )}

            {(requestStatus === 'accepted' || requestStatus === 'none') && (
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Shkruaj një mesazh..."
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholderTextColor="#A0AEC0"
                        onSubmitEditing={handleSendMessage}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} activeOpacity={0.8}>
                        <Text style={{ color: '#FFF', fontWeight: '700' }}>➔</Text>
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF', position: 'relative' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    lightBg: { backgroundColor: '#FFF' }, darkBg: { backgroundColor: '#1A202C' },
    header: { height: 50, backgroundColor: '#0B2545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, zIndex: 100 },
    headerText: { color: '#FFF', fontWeight: '700' }, headerTitle: { color: '#FFF', fontWeight: '700' },

    trashcanBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
    trashcanIconTxt: { fontSize: 15 },

    /* REZOLUCIONI VIZUAL: Qëndron fiks brenda dritares së bisedës pa u bllokuar nga modali i kërkimit */
    chatInternalOverlay: { position: 'absolute', top: 50, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.97)', justifyContent: 'center', alignItems: 'center', zIndex: 999999, padding: 10 },
    viberMasterTabContent: { width: '100%', maxWidth: 260, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 20 },
    viberTabTitleTxt: { fontSize: 13, fontWeight: '800', color: '#0B2545', marginBottom: 8, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#EDF2F7', paddingBottom: 6 },
    viberTabRowBtn: { width: '100%', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center', cursor: 'pointer' },
    viberTabCloseBtn: { marginTop: 10, width: '100%', height: 32, backgroundColor: '#EDF2F7', borderRadius: 8, justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
    viberTabCloseTxt: { color: '#4A5568', fontWeight: '700', fontSize: 11 },

    dropdownBlueTxt: { color: '#3182CE', fontSize: 12, fontWeight: '800' },
    dropdownOrangeTxt: { color: '#DD6B20', fontSize: 12, fontWeight: '800' },
    dropdownRedTxt: { color: '#E53E3E', fontSize: 12, fontWeight: '800' },

    inputRow: { flexDirection: 'row', padding: 8, alignItems: 'center', backgroundColor: '#F0F4F8', borderTopWidth: 1, borderColor: '#E2E8F0', zIndex: 10 },
    input: { flex: 1, height: 34, backgroundColor: '#FFF', borderRadius: 17, paddingHorizontal: 12, fontSize: 13, borderWidth: 1, borderColor: '#CCD0D5', color: '#000' },
    sendBtn: { width: 34, height: 34, backgroundColor: '#0B2545', borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    alertBox: { padding: 12, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', width: '100%', zIndex: 20 },
    alertTxt: { fontWeight: '700', fontSize: 12, marginBottom: 8, color: '#2D3748' },
    row: { flexDirection: 'row', gap: 8, width: '100%' },
    denyBtn: { flex: 1, height: 34, backgroundColor: '#FCE8E6', borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FAD2CF' },
    acceptBtn: { flex: 1, height: 34, backgroundColor: '#0B2545', borderRadius: 6, justifyContent: 'center', alignItems: 'center' }
});
