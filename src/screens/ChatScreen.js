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
            const requestDocRef = doc(db, 'chat_requests', selectedChannel.id);
            const unsubscribeRequest = onSnapshot(requestDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.status === 'accepted') {
                        setRequestStatus('accepted');
                    } else if (data.senderId === user.uid) {
                        setRequestStatus('pending'); // Ti e ke dërguar kërkesën
                    } else {
                        setRequestStatus('incoming'); // Dikush tjetër ta ka sjellë ty
                    }
                } else {
                    setRequestStatus('none');
                }
                setLoading(false);
            }, (error) => {
                console.log("Gabim te kërkesa:", error);
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
            console.log("Gabim te mesazhet:", error);
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
    // KORRIGJIMI I SAKTË: Dërgimi i mesazhit nuk e bën automatikisht accepted, statusi qëndron ashtu siç është
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user?.uid || !selectedChannel?.id) return;

        const currentText = newMessage.trim();
        setNewMessage('');

        try {
            // Kontrollojmë nëse kërkesa ekziston tashmë në Firestore
            const reqDocRef = doc(db, 'chat_requests', selectedChannel.id);
            const reqDoc = await getDocs(query(collection(db, 'chat_requests')));

            // Nëse biseda është krejtësisht e re (statusi none), krijohet si 'pending'
            if (selectedChannel.isPrivate && requestStatus === 'none') {
                await setDoc(reqDocRef, {
                    status: 'pending',
                    senderId: user.uid,
                    receiverId: selectedChannel.targetUser?.id || '',
                    createdAt: new Date().toISOString()
                }, { merge: true });
                setRequestStatus('pending');
            }
        } catch (e) {
            console.log("Gabim me statusin e kërkesës:", e);
        }

        try {
            // Shtohet mesazhi i rregullt në nën-koleksion
            await addDoc(collection(db, 'channels', selectedChannel.id, 'messages'), {
                text: currentText,
                createdAt: new Date().toISOString(),
                uid: user.uid,
                email: user.email || 'student@uni-pr.edu'
            });
        } catch (e) {
            console.log("Gabim gjatë dërgimit të mesazhit:", e);
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

    // RREGULLIMI PËRFUNDIMTAR: Fshirja e bisedës (Delete Chat) fshin dokumentin kryesor dhe mesazhet asinkronisht
    const handleDeleteChatComplete = async () => {
        if (!selectedChannel?.id) return;
        setShowViberMenu(false);

        try {
            // 1. Fshijmë dokumentin e kërkesës kryesore që biseda të hiqet live nga listat e Inbox-it
            await deleteDoc(doc(db, 'chat_requests', selectedChannel.id));

            // 2. Fshijmë të gjitha mesazhet brenda nën-koleksionit 'messages' përmes ID-ve direkte të Firebase
            const messagesSnapshot = await getDocs(collection(db, 'channels', selectedChannel.id, 'messages'));
            for (const msgDoc of messagesSnapshot.docs) {
                await deleteDoc(doc(db, 'channels', selectedChannel.id, 'messages', msgDoc.id));
            }

            Alert.alert("Biseda u fshi 🗑️", "Historiku i kësaj bisede u pastrua plotësisht.");
            onBack(); // Mbyllet automatikisht dritarja e bisedës për të rifreskuar listat në ekranin tjetër
        } catch (e) {
            console.log("Gabim kritik gjatë fshirjes së bisedës:", e);
        }
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
                    <TouchableOpacity onPress={() => setShowViberMenu(!showViberMenu)} style={styles.embeddedThreeDots} activeOpacity={0.7}>
                        <Text style={{ fontWeight: '800', color: isDarkMode ? '#EEB902' : '#0B2545', fontSize: 11 }}>
                            {showViberMenu ? '🔼 Mbyll Opsionet' : '⚙️ Opsionet e Bisedës (⋮)'}
                        </Text>
                    </TouchableOpacity>
                    {showViberMenu && (
                        <View style={[styles.embeddedDropdown, isDarkMode ? styles.darkCard : styles.lightCard]}>
                            <TouchableOpacity style={styles.dropdownItem} onPress={handleDeleteChatComplete} activeOpacity={0.6}>
                                <Text style={styles.dropdownDeleteTxt}>🗑️ Fshij Historikun</Text>
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

            {/* KËRKESAT E ARDHURA: Marrësi e ka të bllokuar shkrimin derisa të pranojë kërkesën */}
            {requestStatus === 'incoming' && (
                <View style={styles.alertBox}>
                    <Text style={styles.alertTxt}>💬 Kërkesë e re për bisedë në kohë reale.</Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={styles.denyBtn} onPress={handleDeny}>
                            <Text style={{ color: '#D93025', fontWeight: '700', fontSize: 11 }}>Injoro</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 11 }}>Prano</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* INPUT-I I CHAT-IT: Shfaqet për dërguesin (pending) ose pasi pranohet kërkesa (accepted) */}
            {(requestStatus === 'accepted' || requestStatus === 'pending' || requestStatus === 'none') && (
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={requestStatus === 'pending' ? "Në pritje të konfirmimit... Shkruaj këtu..." : "Shkruaj një mesazh..."}
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
    viberDropdown: { position: 'absolute', top: 34, right: 0, backgroundColor: '#FFF', width: 150, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5, zIndex: 99999 },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, width: '100%', alignItems: 'center' },
    dropdownDeleteTxt: { color: '#E53E3E', fontSize: 12, fontWeight: '800', letterSpacing: -0.2 },

    embeddedHeaderControls: { position: 'relative', width: '100%', zIndex: 9999 },
    embeddedThreeDots: { paddingVertical: 10, backgroundColor: '#F8FAFC', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E2E8F0' },
    embeddedDropdown: { backgroundColor: '#FFF', alignItems: 'center', padding: 2, position: 'absolute', top: 38, right: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 12, zIndex: 99999, width: 140 },
    lightCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
    darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },

    inputRow: { flexDirection: 'row', padding: 8, alignItems: 'center', backgroundColor: '#F0F4F8', borderTopWidth: 1, borderColor: '#E2E8F0' },
    input: { flex: 1, height: 34, backgroundColor: '#FFF', borderRadius: 17, paddingHorizontal: 12, fontSize: 13, borderWidth: 1, borderColor: '#CCD0D5', color: '#000' },
    sendBtn: { width: 34, height: 34, backgroundColor: '#0B2545', borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    alertBox: { padding: 12, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', width: '100%' },
    alertTxt: { fontWeight: '700', fontSize: 12, marginBottom: 8, color: '#2D3748' },
    row: { flexDirection: 'row', gap: 8, width: '100%' },
    denyBtn: { flex: 1, height: 34, backgroundColor: '#FCE8E6', borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FAD2CF' },
    acceptBtn: { flex: 1, height: 34, backgroundColor: '#0B2545', borderRadius: 6, justifyContent: 'center', alignItems: 'center' }
});
