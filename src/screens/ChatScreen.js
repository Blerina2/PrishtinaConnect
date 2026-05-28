import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import MessageBubble from '../components/MessageBubble';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen({ selectedChannel, onBack }) {
    const { user, isDarkMode } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [blockedUsers, setBlockedUsers] = useState([]);

    // SHTETET E REJA PËR SISTEMIN LOKAL TË REQUESTS
    const [isAccepted, setIsAccepted] = useState(true);
    const [loadingRequest, setLoadingRequest] = useState(false);

    const currentUser = {
        uid: user?.uid || 'student_demo_id',
        email: user?.email || 'student@student.uni-pr.edu'
    };

    // Kontrolli automatik nëse biseda private është e pranuar apo është ende në pritje
    useEffect(() => {
        const checkChatStatus = async () => {
            if (selectedChannel?.name && selectedChannel.name.includes('Bisedë Private')) {
                setLoadingRequest(true);
                try {
                    // Kontrollojmë në memorien lokale statusin e kësaj bisede specifike
                    const status = await AsyncStorage.getItem(`@PrishtinaConnect:request:${selectedChannel.id}`);
                    if (status === 'accepted') {
                        setIsAccepted(true);
                    } else {
                        setIsAccepted(false); // Fillon si e bllokuar (Request) nëse nuk është pranuar ende
                    }
                } catch (e) {
                    console.log(e);
                } finally {
                    setLoadingRequest(false);
                }
            } else {
                setIsAccepted(true); // Kanalet publike të lëndëve janë gjithmonë të pranuara automatikisht
            }
        };

        checkChatStatus();

        if (selectedChannel?.id) {
            setMessages([
                { id: 'm1', text: `Përshëndetje! Kam nevojë për disa ligjërata të FIEK-ut, a mund të më ndihmosh?`, email: 'kolegu@student.uni-pr.edu', uid: '123', imageUri: null }
            ]);
        }
    }, [selectedChannel]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        const msgObj = { id: 'm_' + Date.now(), text: newMessage.trim(), createdAt: new Date().toISOString(), uid: currentUser.uid, email: currentUser.email, imageUri: null };
        setMessages((prevMessages) => [msgObj, ...prevMessages]);
        setNewMessage('');
    };

    const handleSendImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Refuzuar 🔒", "Duhet të lejoni qasjen në galeri.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.6,
        });
        if (!result.canceled) {
            const msgObj = { id: 'm_img_' + Date.now(), text: '', createdAt: new Date().toISOString(), uid: currentUser.uid, email: currentUser.email, imageUri: result.assets.uri };
            setMessages((prevMessages) => [msgObj, ...prevMessages]);
        }
    };

    // FUNKSIONI PËR PRANIMIN E KËRKESËS SË RE
    const handleAcceptRequest = async () => {
        try {
            await AsyncStorage.setItem(`@PrishtinaConnect:request:${selectedChannel.id}`, 'accepted');
            setIsAccepted(true);
            Alert.alert('Biseda u Zhbllokua 🎉', 'Tani mund të komunikoni lirisht me këtë student.');
        } catch (e) {
            console.log(e);
        }
    };

    const handleRejectRequest = () => {
        Alert.alert('Kërkesa u Refuzua 🚫', 'U ktheva prapa te lista e kanaleve.');
        onBack();
    };

    const handleBlockUser = (targetUser) => {
        if (targetUser.uid === currentUser.uid) return;
        Alert.alert('Blloko Studentin 🚫', 'A jeni të sigurt?', [
            { text: 'Anulo', style: 'cancel' },
            { text: 'Blloko', style: 'destructive', onPress: () => { setBlockedUsers([...blockedUsers, targetUser.uid]); } }
        ]);
    };

    const filteredMessages = messages.filter(msg => !blockedUsers.includes(msg.uid));
    if (loadingRequest) {
        return (
            <View style={[styles.container, styles.center, isDarkMode ? styles.darkBg : styles.lightBg]}>
                <ActivityIndicator size="small" color="#EEB902" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.channelHeader, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>⬅ Kanalet</Text>
                </TouchableOpacity>
                <View style={styles.titleWrapper}>
                    <Text style={styles.channelTitle} numberOfLines={1}>{selectedChannel.name}</Text>
                    <Text style={[styles.channelSubtitle, isDarkMode && { color: '#E2E8F0' }]}>
                        {isAccepted ? 'Lidhje e Sigurt Universitare' : '🔒 Kërkesë e Pezulluar për Mesazh'}
                    </Text>
                </View>
            </View>

            {/* Lista e mesazheve shfaqet vetëm nëse kërkesa pranohet */}
            {isAccepted ? (
                <FlatList
                    data={filteredMessages}
                    keyExtractor={(item) => item.id}
                    inverted
                    renderItem={({ item }) => {
                        const isMe = item.uid === currentUser.uid;
                        return (
                            <TouchableOpacity onLongPress={() => handleBlockUser(item)} activeOpacity={0.95}>
                                <MessageBubble text={item.text} email={item.email} isMe={isMe} imageUri={item.imageUri} />
                            </TouchableOpacity>
                        );
                    }}
                />
            ) : (
                /* PANEL I KËRKESAVE (REQUEST BOX) */
                <View style={styles.requestContainer}>
                    <View style={[styles.requestCard, isDarkMode ? styles.darkCard : styles.lightCard]}>
                        <Text style={styles.requestIcon}>📩</Text>
                        <Text style={[styles.requestTitle, isDarkMode ? styles.darkText : styles.lightText]}>Kërkesë e Re për Komunikim</Text>
                        <Text style={styles.requestDesc}>Ky student nga Universiteti i Prishtinës dëshiron të fillojë një bisedë private me ju. Mesazhet e tij nuk do të shfaqen derisa ta pranoni kërkesën.</Text>

                        <View style={styles.requestActionRow}>
                            <TouchableOpacity style={styles.rejectButton} onPress={handleRejectRequest}>
                                <Text style={styles.rejectButtonText}>Injoro / Mbylle</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRequest}>
                                <Text style={styles.acceptButtonText}>Prano Kërkesën 🎉</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Input Bar shfaqet VETËM nëse biseda është e pranuar zyrtarisht */}
            {isAccepted && (
                <View style={[styles.inputContainer, isDarkMode ? styles.darkInputContainer : styles.lightInputContainer]}>
                    <View style={[styles.inputWrapper, isDarkMode ? styles.darkInputWrapper : styles.lightInputWrapper]}>
                        <TouchableOpacity style={styles.mediaButton} onPress={handleSendImage}>
                            <Text style={styles.mediaButtonText}>📷</Text>
                        </TouchableOpacity>
                        <TextInput style={[styles.chatInput, { color: isDarkMode ? '#FFFFFF' : '#0B2545' }]} placeholder="Shkruaj një mesazh..." placeholderTextColor="#A0AEC0" value={newMessage} onChangeText={setNewMessage} />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                            <Text style={styles.sendButtonText}>✈️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    lightBg: { backgroundColor: '#F4F6F9' },
    darkBg: { backgroundColor: '#1A202C' },
    lightCard: { backgroundColor: '#ffffff', borderColor: '#E2E8F0' },
    darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
    lightText: { color: '#0B2545' },
    darkText: { color: '#FFFFFF' },

    channelHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    lightHeader: { backgroundColor: '#0B2545' },
    darkHeader: { backgroundColor: '#2D3748' },
    backButton: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    backButtonText: { color: '#ffffff', fontWeight: '700' },
    titleWrapper: { flex: 1 },
    channelTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
    channelSubtitle: { fontSize: 10, color: '#EEB902', marginTop: 1 },

    inputContainer: { padding: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    lightInputContainer: { backgroundColor: '#ffffff' },
    darkInputContainer: { backgroundColor: '#2D3748' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 6, paddingVertical: 4 },
    lightInputWrapper: { backgroundColor: '#F0F4F8' },
    darkInputWrapper: { backgroundColor: '#1A202C' },
    chatInput: { flex: 1, height: 40, paddingHorizontal: 10, fontSize: 14 },
    mediaButton: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
    mediaButtonText: { fontSize: 18 },
    sendButton: { width: 36, height: 36, backgroundColor: '#0B2545', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    sendButtonText: { color: '#ffffff', fontWeight: 'bold' },

    requestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    requestCard: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 24, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.03, elevation: 4 },
    requestIcon: { fontSize: 36, marginBottom: 12 },
    requestTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
    requestDesc: { fontSize: 12, color: '#718096', lineHeight: 18, textAlign: 'center', marginBottom: 20, fontWeight: '500' },
    requestActionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 10 },
    rejectButton: { flex: 1, height: 40, backgroundColor: '#FFF5F5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FED7D7' },
    rejectButtonText: { color: '#E53E3E', fontSize: 12, fontWeight: '700' },
    acceptButton: { flex: 1, height: 40, backgroundColor: '#0B2545', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    acceptButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '700' }
});
