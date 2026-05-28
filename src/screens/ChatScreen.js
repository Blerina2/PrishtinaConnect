import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import MessageBubble from '../components/MessageBubble';
import { useAuth } from '../context/AuthContext';

export default function ChatScreen({ selectedChannel, onBack }) {
    const { user, isDarkMode } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    const currentUser = {
        uid: user?.uid || 'student_demo_id',
        email: user?.email || 'student@student.uni-pr.edu'
    };

    useEffect(() => {
        if (!selectedChannel?.id) return;
        setMessages([
            { id: 'm1', text: `Përshëndetje kolegë! A ka ndonjë njoftim të ri për lëndën: ${selectedChannel.name}?`, email: 'blerina.beka@student.uni-pr.edu', uid: '123' },
            { id: 'm2', text: 'Po, materiali sapo u ngarkua në sistem.', email: 'kolegu@student.uni-pr.edu', uid: 'student_demo_id' }
        ]);
    }, [selectedChannel.id]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        const msgObj = { id: 'm_' + Date.now(), text: newMessage.trim(), createdAt: new Date().toISOString(), uid: currentUser.uid, email: currentUser.email };
        setMessages((prevMessages) => [msgObj, ...prevMessages]);
        setNewMessage('');
    };

    return (
        <KeyboardAvoidingView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.channelHeader, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>⬅ Kanalet</Text>
                </TouchableOpacity>
                <View style={styles.titleWrapper}>
                    <Text style={styles.channelTitle}># {selectedChannel.name}</Text>
                    <Text style={[styles.channelSubtitle, isDarkMode && { color: '#E2E8F0' }]}>Bisedë studentore universitare</Text>
                </View>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                inverted
                renderItem={({ item }) => {
                    const isMe = item.uid === currentUser.uid;
                    return <MessageBubble text={item.text} email={item.email} isMe={isMe} />;
                }}
            />

            <View style={[styles.inputContainer, isDarkMode ? styles.darkInputContainer : styles.lightInputContainer]}>
                <View style={[styles.inputWrapper, isDarkMode ? styles.darkInputWrapper : styles.lightInputWrapper]}>
                    <TextInput
                        style={[styles.chatInput, { color: isDarkMode ? '#FFFFFF' : '#0B2545' }]}
                        placeholder="Shkruaj një mesazh..."
                        placeholderTextColor="#A0AEC0"
                        value={newMessage}
                        onChangeText={setNewMessage}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                        <Text style={styles.sendButtonText}>✈️</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    lightBg: { backgroundColor: '#F4F6F9' },
    darkBg: { backgroundColor: '#1A202C' },

    channelHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    lightHeader: { backgroundColor: '#0B2545' },
    darkHeader: { backgroundColor: '#2D3748' },

    backButton: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    backButtonText: { color: '#ffffff', fontWeight: '700' },
    titleWrapper: { flex: 1 },
    channelTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
    channelSubtitle: { fontSize: 10, color: '#EEB902' },

    inputContainer: { padding: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    lightInputContainer: { backgroundColor: '#ffffff' },
    darkInputContainer: { backgroundColor: '#2D3748' },

    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 6, paddingVertical: 4 },
    lightInputWrapper: { backgroundColor: '#F0F4F8' },
    darkInputWrapper: { backgroundColor: '#1A202C' },

    chatInput: { flex: 1, height: 40, paddingHorizontal: 14, fontSize: 14 },
    sendButton: { width: 36, height: 36, backgroundColor: '#0B2545', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    sendButtonText: { color: '#ffffff', fontWeight: 'bold' }
});
