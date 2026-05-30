import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import MessageBubble from '../components/MessageBubble';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export default function ChatScreen({ selectedChannel, onBack, hideHeader }) {
    const { user, isDarkMode } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [requestStatus, setRequestStatus] = useState('accepted');
    const [loading, setLoading] = useState(true);
    const [showViberMenu, setShowViberMenu] = useState(false);

    useEffect(() => {
        if (!selectedChannel?.id || !user?.uid) return;

        if (!selectedChannel.isPrivate) {
            setRequestStatus('accepted');
            setLoading(false);
        } else {
            // Vëzhgimi live i kërkesës
            const requestDocRef = doc(db, 'chat_requests', selectedChannel.id);
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
                console.log("Gabim te kërkesa:", error);
                setLoading(false);
            });

            return () => unsubscribeRequest();
        }
    }, [selectedChannel?.id, user?.uid]);

    useEffect(() => {
        if (!selectedChannel?.id) return;

        // Vëzhgimi live i mesazheve në kohë reale
        const q = query(collection(db, 'channels', selectedChannel.id, 'messages'), orderBy('createdAt', 'desc'));
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
            setMessages(list);
        }, (error) => {
            console.log("Gabim te mesazhet:", error);
        });

        return () => unsubscribeMessages();
    }, [selectedChannel?.id]);

    // RREGULLIMI SINTAKSOR 1: Përdorimi i .shift() që të kthehet në String të pastër dhe të mos bëjë crash
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

    // RREGULLIMI KRYESOR: Kur shkruan mesazh, automatikisht e bën bisedën 'accepted' që të dalë te My Chats
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user?.uid || !selectedChannel?.id) return;

        const currentText = newMessage.trim();
        setNewMessage('');

        // Sa herë që shkruan mesazh, ulet statusi 'accepted' në Firestore që të dalë direkt te Tabi kryesor
        try {
            await setDoc(doc(db, 'chat_requests', selectedChannel.id), {
                status: 'accepted',
                senderId: user.uid,
                receiverId: selectedChannel.targetUser?.id || '',
                createdAt: new Date().toISOString()
            }, { merge: true });
            setRequestStatus('accepted');
        } catch (e) {
            console.log("Gabim te krijimi i kërkesës:", e);
        }

        try {
            await addDoc(collection(db, 'channels', selectedChannel.id, 'messages'), {
                text: currentText,
                createdAt: new Date().toISOString(),
                uid: user.uid,
                email: user.email || 'student@uni-pr.edu'
            });
        } catch (e) {
            console.log("Gabim dërgimi:", e);
        }
    };

    const handleAccept = async () => {
        if (!selectedChannel?.id) return;
        try {
            await setDoc(doc(db, 'chat_requests', selectedChannel.id), { status: 'accepted' }, { merge: true });
            setRequestStatus('accepted');
        } catch (e) { console.log(e); }
    };

    const handleDeny = async () => {
        if (!selectedChannel?.id) return;
        try {
            await deleteDoc(doc(db, 'chat_requests', selectedChannel.id));
            onBack();
        } catch (e) { console.log(e); }
    };

    const handleDeleteChatComplete = async () => {
        if (!selectedChannel?.id) return;
        setShowViberMenu(false);
        Alert.alert("Fshij Bisedën 🗑️", "A jeni të sigurt që dëshironi ta fshini historikun e kësaj bisede?", [
            { text: "Anulo", style: "cancel" },
            { text: "Fshije", style: "destructive", onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'chat_requests', selectedChannel.id));
                        const messagesSnapshot = await getDocs(collection(db, 'channels', selectedChannel.id, 'messages'));
                        for (const msgDoc of messagesSnapshot.docs) {
                            await deleteDoc(doc(db, 'channels', selectedChannel.id, 'messages', msgDoc.id));
                        }
                        onBack();
                    } catch (e) { console.log(e); }
                }}
        ]);
    };
    if (!selectedChannel || !selectedChannel.id) {
        return <View style={styles.center}><ActivityIndicator color="#0B2545" /></View>;
    }

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color="#0B2545" /></View>;
    }

    return (
        <KeyboardAvoidingView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            {!hideHeader && (
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack}><Text style={styles.headerText}>⬅ Kthehu</Text></TouchableOpacity>
                    <Text style={styles.headerTitle}>{selectedChannel.name}</Text>

                    {selectedChannel.isPrivate && (
                        <View style={{ position: 'relative' }}>
                            <TouchableOpacity onPress={() => setShowViberMenu(!showViberMenu)} style={styles.threeDotsBtn}>
                                <Text style={styles.threeDotsTxt}>⋮</Text>
                            </TouchableOpacity>
                            {showViberMenu && (
                                <View style={styles.viberDropdown}>
                                    <TouchableOpacity style={styles.dropdownItem} onPress={handleDeleteChatComplete}>
                                        <Text style={styles.dropdownDeleteTxt}>🗑️ Fshij Bisedën</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            )}

            {hideHeader && selectedChannel.isPrivate && (
                <View style={styles.embeddedHeaderControls}>
                    <TouchableOpacity onPress={() => setShowViberMenu(!showViberMenu)} style={styles.embeddedThreeDots}>
                        <Text style={{ fontWeight: '800', color: '#718096', fontSize: 11 }}>⚙️ Opsionet e Bisedës (⋮)</Text>
                    </TouchableOpacity>
                    {showViberMenu && (
                        <View style={styles.embeddedDropdown}>
                            <TouchableOpacity style={styles.dropdownItem} onPress={handleDeleteChatComplete}>
                                <Text style={styles.dropdownDeleteTxt}>🗑️ Fshij krejt bisedën</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                inverted
                renderItem={({ item }) => <MessageBubble text={item.text} email={item.email} isMe={item.uid === user.uid} />}
            />

            {requestStatus === 'incoming' && (
                <View style={styles.alertBox}>
                    <Text style={styles.alertTxt}>💬 Kërkesë e re për bisedë në kohë reale.</Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.denyBtn} onPress={handleDeny}><Text style={{ color: '#D93025', fontWeight: '700', fontSize: 11 }}>Injoro</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}><Text style={{ color: '#FFF', fontWeight: '700', fontSize: 11 }}>Prano</Text></TouchableOpacity>
                    </View>
                </View>
            )}

            {requestStatus === 'pending' && (
                <View style={styles.alertBox}>
                    <Text style={styles.pendingTxt}>⏳ Në pritje të konfirmimit nga studenti...</Text>
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
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    lightBg: { backgroundColor: '#FFF' }, darkBg: { backgroundColor: '#1A202C' },
    header: { height: 50, backgroundColor: '#0B2545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, zIndex: 100 },
    headerText: { color: '#FFF', fontWeight: '700' }, headerTitle: { color: '#FFF', fontWeight: '700' },
    threeDotsBtn: { paddingHorizontal: 8, paddingVertical: 4 }, threeDotsTxt: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    viberDropdown: { position: 'absolute', top: 32, right: 0, backgroundColor: '#FFF', width: 140, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', elevation: 5, zIndex: 99999, padding: 4 },
    dropdownItem: { padding: 10, borderRadius: 6, width: '100%' },
    dropdownDeleteTxt: { color: '#C53030', fontSize: 12, fontWeight: '700' },
    embeddedHeaderControls: { position: 'relative', width: '100%', zIndex: 99 },
    embeddedThreeDots: { padding: 6, backgroundColor: '#F8FAFC', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E2E8F0' },
    embeddedDropdown: { backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', padding: 2 },
    inputRow: { flexDirection: 'row', padding: 8, alignItems: 'center', backgroundColor: '#F0F4F8', borderTopWidth: 1, borderColor: '#E2E8F0' },
    input: { flex: 1, height: 34, backgroundColor: '#FFF', borderRadius: 17, paddingHorizontal: 12, fontSize: 13, borderWidth: 1, borderColor: '#CCD0D5', color: '#000' },
    sendBtn: { width: 34, height: 34, backgroundColor: '#0B2545', borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    alertBox: { padding: 12, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', width: '100%' },
    alertTxt: { fontWeight: '700', fontSize: 12, marginBottom: 8, color: '#2D3748' }, pendingTxt: { color: '#718096', fontSize: 11, fontWeight: '600', textAlign: 'center' },
    row: { flexDirection: 'row', gap: 8, width: '100%' },
    denyBtn: { flex: 1, height: 34, backgroundColor: '#FCE8E6', borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FAD2CF' },
    acceptBtn: { flex: 1, height: 34, backgroundColor: '#0B2545', borderRadius: 6, justifyContent: 'center', alignItems: 'center' }
});
