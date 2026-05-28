import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import MessageBubble from '../components/MessageBubble';
import { useAuth } from '../context/AuthContext';

export default function ClubsScreen() {
    const { user, isDarkMode } = useAuth();
    const [activeClub, setActiveClub] = useState(null);
    const [clubMessages, setClubMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');

    const currentStudentProfile = {
        email: user?.email || 'student@student.uni-pr.edu',
        department: user?.faculty || 'FIEK',
        uid: user?.uid || 'student_demo_id'
    };

    const [clubs] = useState([
        { id: 'c1', name: '🚀 IT-Network Expert Club', allowedDept: 'FIEK', icon: '🌐', desc: 'Grupi ekskluziv për siguri në rrjeta, administrim sistemesh.' },
        { id: 'c2', name: '🤖 UP Robotics & AI Team', allowedDept: 'FIEK', icon: '🦾', desc: 'Zhvillimi i projekteve inovative në fushën e Inteligjencës Artificiale.' },
        { id: 'c3', name: '📊 Shoqata e Ekonomistëve të Rinj', allowedDept: 'Ekonomik', icon: '📈', desc: 'Analiza makroekonomike, trajnime në kontabilitet dhe diskutime financiare.' },
        { id: 'c4', name: '⚖️ Klubi i Debatit Juridik - UP', allowedDept: 'Juridik', icon: '🏛', desc: 'Simulime të seancave gjyqësore, analiza të ligjeve të reja.' },
        { id: 'c5', name: '🔬 Kërkimet Shkencore FSHMN', allowedDept: 'FSHMN', icon: '🧪', desc: 'Grupi i biologëve, kimistëve dhe matematikanëve për laboratorë.' },
        { id: 'c6', name: '🩺 Portal i Mjekësisë Klinike', allowedDept: 'Mjekësi', icon: '🏥', desc: 'Diskutime mbi praktikat mjekësore, anatominë universitare.' },
        { id: 'c7', name: '🏃‍♂️ Klubi Olimpik studentor DIF', allowedDept: 'DIF', icon: '🏆', desc: 'Organizimi i garave sportive universitare dhe rekreacionit.' },
        { id: 'c8', name: '📢 Bashkimi Studentor i UP-së', allowedDept: 'ALL', icon: '🎓', desc: 'Organizimi i përgjithshëm studentor për të gjitha fakultetet e UP-së.' }
    ]);

    useEffect(() => {
        if (!activeClub) return;
        setClubMessages([
            { id: 'cm1', text: `Mirëseerdhët në hapësirën zyrtare të klubit!`, email: 'profesor.up@student.uni-pr.edu', uid: '999' },
            { id: 'cm2', text: `Përshëndetje kolegë, kur mbahet takimi?`, email: 'kolegu@student.uni-pr.edu', uid: '888' }
        ]);
    }, [activeClub]);

    const handleEnterClub = (club) => {
        if (club.allowedDept !== 'ALL' && club.allowedDept !== currentStudentProfile.department) {
            Alert.alert(
                'Qasja u Refuzua 🔒',
                `Ky klub është ekskluziv! Vetëm studentët e [${club.allowedDept}] kanë qasje. Ju jeni në [${currentStudentProfile.department}].`
            );
            return;
        }
        setActiveClub(club);
    };

    const handleSendClubMessage = () => {
        if (!newMsg.trim()) return;
        const msgObj = { id: 'm_' + Date.now(), text: newMsg.trim(), createdAt: new Date().toISOString(), uid: currentStudentProfile.uid, email: currentStudentProfile.email };
        setClubMessages(prev => [msgObj, ...prev]);
        setNewMsg('');
    };

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };

    if (activeClub) {
        return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.clubHeader}>
                    <TouchableOpacity onPress={() => setActiveClub(null)} style={styles.backButton}>
                        <Text style={styles.backButtonText}>⬅ Klubet</Text>
                    </TouchableOpacity>
                    <Text style={styles.clubHeaderTitle} numberOfLines={1}>{activeClub.name}</Text>
                </View>

                <FlatList
                    data={clubMessages}
                    keyExtractor={(item) => item.id}
                    inverted
                    renderItem={({ item }) => {
                        const isMe = item.uid === currentStudentProfile.uid;
                        return <MessageBubble text={item.text} email={item.email} isMe={isMe} />;
                    }}
                />

                <View style={[styles.inputContainer, isDarkMode && { backgroundColor: '#1A202C' }]}>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#2D3748' }]}>
                        <TextInput style={[styles.chatInput, isDarkMode && { color: '#FFFFFF' }]} placeholder={`Shkruaj në klub...`} placeholderTextColor="#A0AEC0" value={newMsg} onChangeText={setNewMsg} />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSendClubMessage}>
                            <Text style={styles.sendButtonText}>✈️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.title, themeStyles.text]}>Klubet Studentore të UP-së</Text>
            <FlatList
                data={clubs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 110 }}
                renderItem={({ item }) => (
                    <View style={[styles.clubCard, themeStyles.card]}>
                        <View style={styles.cardTop}>
                            <View style={[styles.iconCircle, isDarkMode ? { backgroundColor: '#1A202C' } : { backgroundColor: '#F0F4F8' }]}>
                                <Text style={styles.clubIconText}>{item.icon}</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.clubName, themeStyles.text]}>{item.name}</Text>
                                <Text style={[styles.lockText, item.allowedDept === 'ALL' ? styles.colorOpen : styles.colorClose]}>
                                    {item.allowedDept === 'ALL' ? '🔓 Publik' : `🔒 Vetëm për ${item.allowedDept}`}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.clubDesc, isDarkMode ? { color: '#CBD5E0' } : { color: '#4A5568' }]}>{item.desc}</Text>
                        <TouchableOpacity style={styles.joinButton} onPress={() => handleEnterClub(item)} activeOpacity={0.8}>
                            <Text style={styles.joinButtonText}>Bashkohu / Hyr ➔</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 14 },
    lightCard: { backgroundColor: '#ffffff', borderColor: '#F0F4F8' },
    darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
    lightText: { color: '#0B2545' },
    darkText: { color: '#FFFFFF' },

    title: { fontSize: 18, fontWeight: '800', marginVertical: 12, letterSpacing: -0.4 },
    clubCard: { padding: 16, borderRadius: 20, marginVertical: 8, shadowColor: '#000', shadowOpacity: 0.02, elevation: 3, borderWidth: 1 },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    clubIconText: { fontSize: 20 },
    clubName: { fontSize: 15, fontWeight: '700' },
    lockText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    colorOpen: { color: '#319795' },
    colorClose: { color: '#E53E3E' },
    clubDesc: { fontSize: 13, lineHeight: 19, marginBottom: 16, fontWeight: '500' },
    joinButton: { backgroundColor: '#0B2545', height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    joinButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
    clubHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#0B2545', borderBottomWidth: 2, borderBottomColor: '#EEB902', marginHorizontal: -14, marginTop: -14, marginBottom: 10 },
    backButton: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    backButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
    clubHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff', flex: 1 },
    inputContainer: { padding: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E2E8F0', marginHorizontal: -14, marginBottom: -14 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', borderRadius: 24, paddingHorizontal: 6, paddingVertical: 4 },
    chatInput: { flex: 1, height: 40, paddingHorizontal: 14, color: '#0B2545', fontSize: 14 },
    sendButton: { width: 36, height: 36, backgroundColor: '#0B2545', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    sendButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
