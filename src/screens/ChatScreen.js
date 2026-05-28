import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import MessageBubble from '../components/MessageBubble';
import { useAuth } from '../context/AuthContext';

export default function ChatScreen({ selectedChannel, onBack }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [blockedUsers, setBlockedUsers] = useState([]);

    const currentUser = {
        uid: user?.uid || 'student_demo_id',
        email: user?.email || 'student@student.uni-pr.edu'
    };

    // Ngarkojmë mesazhe demo fillestare që përshtaten me kanalin e përzgjedhur
    useEffect(() => {
        if (!selectedChannel?.id) return;

        setMessages([
            { id: 'm1', text: `Përshëndetje kolegë! A ka ndonjë njoftim të ri për lëndën: ${selectedChannel.name}?`, email: 'blerina.beka@student.uni-pr.edu', uid: '123' },
            { id: 'm2', text: 'Po, profesori njoftoi se materialet e reja janë ngarkuar në portal.', email: 'kolegu.ekonomik@student.uni-pr.edu', uid: 'student_demo_id' }
        ]);
    }, [selectedChannel.id]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const msgObj = {
            id: 'm_' + Date.now(),
            text: newMessage.trim(),
            createdAt: new Date().toISOString(),
            uid: currentUser.uid,
            email: currentUser.email
        };

        // Shtojmë mesazhin e ri në fillim të listës pasi FlatList është inverted
        setMessages((prevMessages) => [msgObj, ...prevMessages]);
        setNewMessage('');
    };

    // Logjika interaktive për bllokimin e studentëve toksikë
    const handleBlockUser = (targetUser) => {
        if (targetUser.uid === currentUser.uid) return;

        Alert.alert(
            'Blloko Studentin 🚫',
            `A jeni të sigurt që dëshironi të bllokoni këtë student? Nuk do të shihni më mesazhet e tij.`,
            [
                { text: 'Anulo', style: 'cancel' },
                {
                    text: 'Blloko',
                    style: 'destructive',
                    onPress: () => {
                        setBlockedUsers([...blockedUsers, targetUser.uid]);
                        Alert.alert('Sukses 🎉', 'Përdoruesi u bllokua.');
                    }
                }
            ]
        );
    };

    // Filtrojmë mesazhet në kohë reale për të hequr ato nga personat e bllokuar
    const filteredMessages = messages.filter(msg => !blockedUsers.includes(msg.uid));

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            {/* Header-i i dhomës së bisedës me ngjyrë të errët premium */}
            <View style={styles.channelHeader}>
                <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
                    <Text style={styles.backButtonText}>⬅ Kanalet</Text>
                </TouchableOpacity>
                <View style={styles.titleWrapper}>
                    <Text style={styles.channelTitle}># {selectedChannel.name}</Text>
                    <Text style={styles.channelSubtitle}>Mbaj shtypur një mesazh për ta bllokuar dërguesin</Text>
                </View>
            </View>

            {/* Lista e Flluskave të Bisedës */}
            <FlatList
                data={filteredMessages}
                keyExtractor={(item) => item.id}
                inverted
                contentContainerStyle={styles.chatListContent}
                renderItem={({ item }) => {
                    const isMe = item.uid === currentUser.uid;
                    return (
                        <TouchableOpacity onLongPress={() => handleBlockUser(item)} activeOpacity={0.95}>
                            <MessageBubble text={item.text} email={item.email} isMe={isMe} />
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Input Bar me formë kapsule dhe butonin e ri ✈️ */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.chatInput}
                        placeholder="Shkruaj një mesazh studentor..."
                        placeholderTextColor="#A0AEC0"
                        value={newMessage}
                        onChangeText={setNewMessage}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} activeOpacity={0.8}>
                        <Text style={styles.sendButtonText}>✘</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F9' },
    channelHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#0B2545', borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    backButton: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    backButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
    titleWrapper: { flex: 1 },
    channelTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff', letterSpacing: -0.3 },
    channelSubtitle: { fontSize: 10, color: '#EEB902', fontWeight: '500', marginTop: 1 },
    chatListContent: { paddingVertical: 12, paddingBottom: 90 }, // Hapësirë që mos të mbivendoset me tabBar në disa ekrane
    inputContainer: { padding: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', borderRadius: 24, paddingHorizontal: 6, paddingVertical: 4 },
    chatInput: { flex: 1, height: 40, paddingHorizontal: 14, color: '#0B2545', fontSize: 14, fontWeight: '500' },
    sendButton: { width: 36, height: 36, backgroundColor: '#0B2545', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    sendButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});
