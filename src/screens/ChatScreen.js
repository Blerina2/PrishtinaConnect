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
                        setRequestStatus('pending'); // Ti e ke dërguar kërkesën -> Do të dalë te "Në Pritje"
                    } else {
                        setRequestStatus('incoming'); // Të ka ardhur ty -> Do të dalë te "Kërkesat"
                    }
                } else {
                    setRequestStatus('none'); // Bisedë krejtësisht e re pa kërkesë ende
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
                // RREGULLIMI I SAKTË: Nxerrja e ID-së së saktë të partnerit nga ID e bisedës unike
                const idParts = selectedChannel.id.split('_');
                const extractedReceiverId = idParts.find(id => id !== user.uid) || selectedChannel.targetUser?.id || '';

                const reqDocRef = doc(db, 'chat_requests', selectedChannel.id);
                await setDoc(reqDocRef, {
                    id: selectedChannel.id,
                    status: 'pending',
                    senderId: user.uid,
                    receiverId: extractedReceiverId,
                    createdAt: new Date().toISOString()
                }, { merge: true });
                setRequestStatus('pending');
            } catch (e) {
                console.log("Gabim kritik gjatë krijimit të dokumentit të kërkesës:", e);
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
            console.log("Gabim gjatë shtimit të mesazhit në Firestore:", e);
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

        try {
            const batch = writeBatch(db);
            const reqDocRef = doc(db, 'chat_requests', selectedChannel.id);
            batch.delete(reqDocRef);

            const messagesSnapshot = await getDocs(collection(db, 'channels', selectedChannel.id, 'messages'));
            messagesSnapshot.forEach((msgDoc) => {
                const msgDocRef = doc(db, 'channels', selectedChannel.id, 'messages', msgDoc.id);
                batch.delete(msgDocRef);
            });

            await batch.commit();
            Alert.alert("Biseda u fshi 🗑️", "Historiku i kësaj bisede u pastrua plotësisht.");
            if (onBack) onBack();
        } catch (e) {
            console.log("Gabim kritik gjatë fshirjes me batch:", e);
        }
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

            {/* BLLOKIMI I SHKRIMIT: Aktivizohet te dërguesi automatikisht sapo shkruan mesazhin e parë */}
            {selectedChannel.isPrivate && requestStatus === 'pending' && (
                <View style={styles.alertBox}>
                    <Text style={[styles.alertTxt, { color: '#718096', fontStyle: 'italic', textAlign: 'center' }]}>
                        ⏳ Kërkesa u dërgua. Qasja në shkrim bllokohet derisa studenti ta pranojë bisedën tuaj.
                    </Text>
                </View>
            )}

            {/* INPUTI I SHKRIMIT: Lejohet vetëm nëse biseda është e re fare (none) ose nëse është pranuar (accepted) */}
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
    viberDropdown: { position: 'absolute', top: 34, right: 0, backgroundColor: '#FFF', width: 150, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5, zIndex: 99999 },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, width: '100%', alignItems: 'center' },
    dropdownDeleteRow: { padding: 6, width: '100%' },
    dropdownDeleteTxt: { color: '#E53E3E', fontSize: 12, fontWeight: '800', letterSpacing: -0.2 },
    inputRow: { flexDirection: 'row', padding: 8, alignItems: 'center', backgroundColor: '#F0F4F8', borderTopWidth: 1, borderColor: '#E2E8F0' },
    input: { flex: 1, height: 34, backgroundColor: '#FFF', borderRadius: 17, paddingHorizontal: 12, fontSize: 13, borderWidth: 1, borderColor: '#CCD0D5', color: '#000' },
    sendBtn: { width: 34, height: 34, backgroundColor: '#0B2545', borderRadius: 17, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    alertBox: { padding: 12, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', width: '100%' },
    alertTxt: { fontWeight: '700', fontSize: 12, marginBottom: 8, color: '#2D3748' },
    row: { flexDirection: 'row', gap: 8, width: '100%' },
    denyBtn: { flex: 1, height: 34, backgroundColor: '#FCE8E6', borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FAD2CF' },
    acceptBtn: { flex: 1, height: 34, backgroundColor: '#0B2545', borderRadius: 6, justifyContent: 'center', alignItems: 'center' }
});
