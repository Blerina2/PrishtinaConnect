import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { dbInstance } from '../config/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import MessageBubble from '../components/MessageBubble';

export default function ClubsScreen() {
    const [activeClub, setActiveClub] = useState(null);
    const [clubMessages, setClubMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');

    // Profili lokal i studentit tonë për Demo
    const currentStudentProfile = {
        email: 'blerina.beka@uni-pr.edu',
        department: 'IT-Network',
        uid: 'fiek_student_demo_id'
    };

    // Lista zyrtare e klubeve të mbrojtura të UP-së
    const [clubs] = useState([
        { id: 'c1', name: '🚀 IT-Network Expert Club', allowedDept: 'IT-Network', desc: 'Grupi ekskluziv për siguri në rrjeta, administrim sistemesh dhe inxhinieri softuerike.' },
        { id: 'c2', name: '🤖 UP Robotics & AI Team', allowedDept: 'Robotike', desc: 'Zhvillimi i projekteve inovative në fushën e automatizimit dhe Inteligjencës Artificiale.' },
        { id: 'c3', name: '🎓 Bashkimi Studentor UP', allowedDept: 'ALL', desc: 'Organizimi i përgjithshëm studentor për të gjitha departamentet e FIEK-ut.' }
    ]);

    // Ngarkimi i mesazheve në kohë reale për klubin e përzgjedhur
    useEffect(() => {
        if (!activeClub) return;

        const q = query(
            collection(dbInstance, 'clubs', activeClub.id, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(30)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setClubMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, () => {
            // Mesazhe shembull lokal për Demon e së premtes nëse jemi offline
            setClubMessages([
                { id: 'cm1', text: 'Mirëseerdhët në grupin e IT-Network! Këtu do të ndajmë materialet e laboratorit.', email: 'prof.fiek@uni-pr.edu', uid: '999' },
                { id: 'cm2', text: 'Faleminderit profesor, detyrat e projektit jemi duke i përfunduar.', email: 'blerina.beka@uni-pr.edu', uid: 'fiek_student_demo_id' }
            ]);
        });

        return () => unsubscribe();
    }, [activeClub]);

    const handleEnterClub = (club) => {
        // RREGULLI STRIKT I IZOLIMIT: Ndalon studentët e huaj të futen në klub
        if (club.allowedDept !== 'ALL' && club.allowedDept !== currentStudentProfile.department) {
            Alert.alert(
                'Qasja u Refuzua 🔒',
                `Ky klub është i mbyllur! Vetëm studentët e departamentit [${club.allowedDept}] kanë autorizim. Ju jeni të regjistruar në [${currentStudentProfile.department}].`
            );
            return;
        }
        // Nëse është i autorizuar, hapet dritarja e klubit
        setActiveClub(club);
    };

    const handleSendClubMessage = async () => {
        if (!newMsg.trim()) return;

        const msgObj = {
            text: newMsg.trim(),
            createdAt: new Date().toISOString(),
            uid: currentStudentProfile.uid,
            email: currentStudentProfile.email
        };

        try {
            await addDoc(collection(dbInstance, 'clubs', activeClub.id, 'messages'), msgObj);
            setNewMsg('');
        } catch (err) {
            setClubMessages(prev => [msgObj, ...prev]);
            setNewMsg('');
        }
    };

    // Nëse studenti është brenda një Klubi, shfaq dhomën e bisedës së mbrojtur
    if (activeClub) {
        return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.clubHeader}>
                    <TouchableOpacity onPress={() => setActiveClub(null)}>
                        <Text style={styles.backButtonText}>⬅ Dal bota</Text>
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

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.chatInput}
                        placeholder={`Shkruaj në klubin ${activeClub.allowedDept}...`}
                        placeholderTextColor="#A0AEC0"
                        value={newMsg}
                        onChangeText={setNewMsg}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendClubMessage}>
                        <Text style={styles.sendButtonText}>Dërgo</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // Përndryshe, shfaq listën kryesore të klubeve të UP-së
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Klubet Studentore të UP-së</Text>
            <FlatList
                data={clubs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.clubCard}>
                        <View style={styles.cardTop}>
                            <Text style={styles.clubName}>{item.name}</Text>
                            <Text style={[styles.lockText, item.allowedDept === 'ALL' ? styles.colorOpen : styles.colorClose]}>
                                {item.allowedDept === 'ALL' ? '🔓 Publik' : '🔒 Mbyllur'}
                            </Text>
                        </View>
                        <Text style={styles.clubDesc}>{item.desc}</Text>
                        <View style={styles.clubFooter}>
                            <Text style={styles.memberCount}>🛡 Departament: {item.allowedDept}</Text>
                            <TouchableOpacity style={styles.joinButton} onPress={() => handleEnterClub(item)}>
                                <Text style={styles.joinButtonText}>Bashkohu / Hyr</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F9', padding: 12 },
    title: { fontSize: 17, fontWeight: 'bold', color: '#0B2545', marginVertical: 10, paddingHorizontal: 4 },
    clubCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 10, marginVertical: 6, borderWidth: 1, borderColor: '#E2E8F0' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    clubName: { fontSize: 15, fontWeight: 'bold', color: '#0B2545', flex: 1, marginRight: 10 },
    lockText: { fontSize: 11, fontWeight: 'bold' },
    colorOpen: { color: '#2F855A' },
    colorClose: { color: '#C53030' },
    clubDesc: { fontSize: 13, color: '#4A5568', lineHeight: 18, marginBottom: 12 },
    clubFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F4F6F9', paddingTop: 10 },
    memberCount: { fontSize: 12, color: '#718096', fontWeight: '600' },
    joinButton: { backgroundColor: '#0B2545', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6 },
    joinButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
    clubHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButtonText: { color: '#0B2545', fontWeight: 'bold', fontSize: 14, marginRight: 15 },
    clubHeaderTitle: { fontSize: 15, fontWeight: 'bold', color: '#0B2545', flex: 1 },
    inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#ffffff', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    chatInput: { flex: 1, height: 40, borderColor: '#E2E8F0', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 15, color: '#0B2545', backgroundColor: '#F4F6F9' },
    sendButton: { marginLeft: 10, backgroundColor: '#0B2545', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
    sendButtonText: { color: '#ffffff', fontWeight: 'bold' }
});