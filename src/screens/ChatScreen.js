import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { dbInstance } from '../config/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import MessageBubble from '../components/MessageBubble';

export default function ChatScreen({ selectedChannel, onBack }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // Përdoruesi Demo i kyçur lokal për prezantim të sigurt pa dështuar fjalëkalimi
    const currentUser = { uid: 'fiek_student_demo_id', email: 'student@uni-pr.edu' };

    useEffect(() => {
        if (!selectedChannel?.id) return;

        // Sintaksa zyrtare e mbrojtur NoSQL për leximin e nën-koleksioneve të mesazheve
        const q = query(
            collection(dbInstance, 'channels', selectedChannel.id, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgList);
        }, (error) => {
            console.log("Gabim gjatë leximit: ", error.message);
            // Mesazhe statike shembull për Demo nëse databaza nuk ka të dhëna ende
            setMessages([
                { id: 'm1', text: 'Përshëndetje kolegë! A ka filluar ligjërata në FIEK?', email: 'blerina.beka@uni-pr.edu', uid: '123' },
                { id: 'm2', text: 'Po, profesori sapo erdhi në sallë dhe po përgatit projektorin.', email: 'student2@uni-pr.edu', uid: 'fiek_student_demo_id' }
            ]);
        });

        return () => unsubscribe();
    }, [selectedChannel.id]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const msgObj = {
            text: newMessage.trim(),
            createdAt: new Date().toISOString(),
            uid: currentUser.uid,
            email: currentUser.email
        };

        try {
            await addDoc(collection(dbInstance, 'channels', selectedChannel.id, 'messages'), msgObj);
            setNewMessage('');
        } catch (err) {
            // Nëse jemi offline ose rregullat na bllokojnë, e shfaqim menjëherë lokal në ekran për prezantim
            setMessages((prevMessages) => [msgObj, ...prevMessages]);
            setNewMessage('');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Shiriti i sipërm i dhomës së bisedës */}
            <View style={styles.channelHeader}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>⬅ Kanalet</Text>
                </TouchableOpacity>
                <Text style={styles.channelTitle}># {selectedChannel.name}</Text>
            </View>

            {/* Lista e flluskave të bisedës */}
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                inverted
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const isMe = item.uid === currentUser.uid;
                    return (
                        <MessageBubble
                            text={item.text}
                            email={item.email}
                            isMe={isMe}
                        />
                    );
                }}
            />

            {/* Fusha e shkrimit të mesazhit të ri */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.chatInput}
                    placeholder="Shkruaj një mesazh studentor..."
                    placeholderTextColor="#A0AEC0"
                    value={newMessage}
                    onChangeText={setNewMessage}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <Text style={styles.sendButtonText}>Dërgo</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F9' },
    channelHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { marginRight: 15 },
    backButtonText: { color: '#0B2545', fontWeight: 'bold', fontSize: 15 },
    channelTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B2545' },
    listContent: { paddingVertical: 10 },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#ffffff', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    chatInput: { flex: 1, height: 42, borderColor: '#E2E8F0', borderWidth: 1.5, borderRadius: 21, paddingHorizontal: 15, color: '#0B2545', backgroundColor: '#F4F6F9' },
    sendButton: { marginLeft: 10, backgroundColor: '#0B2545', paddingHorizontal: 20, paddingVertical: 11, borderRadius: 21, borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    sendButtonText: { color: '#ffffff', fontWeight: 'bold' }
});