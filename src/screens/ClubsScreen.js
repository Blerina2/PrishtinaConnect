import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal } from 'react-native';
import MessageBubble from '../components/MessageBubble';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, where, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';

export default function ClubsScreen() {
    const { user, isDarkMode } = useAuth();
    const [activeClub, setActiveClub] = useState(null);
    const [clubMessages, setClubMessages] = useState([]);
    const [newMsg, setNewMsg] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Switcher-i kryesor i tab-eve ('all' = Katalogu, 'my_clubs' = Klubet e Mia)
    const [activeMainTab, setActiveMainTab] = useState('all');

    const [pendingRequests, setPendingRequests] = useState([]);
    const [approvedLogs, setApprovedLogs] = useState([]);
    const [myApprovedClubIds, setMyApprovedClubIds] = useState([]);
    const [showPresidentPanel, setShowPresidentPanel] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClubName, setNewClubName] = useState('');
    const [newClubDesc, setNewClubDesc] = useState('');

    const currentStudentProfile = {
        email: user?.email || 'student@student.uni-pr.edu',
        department: user?.faculty || 'FIEK',
        uid: user?.uid || 'student_demo_id'
    };

    const [clubs, setClubs] = useState([
        { id: 'c1', name: '🚀 IT-Network Expert Club', allowedDept: 'FIEK', icon: '🌐', desc: 'Grupi ekskluziv për siguri në rrjeta, administrim sistemesh.', presidentUid: 'student_demo_id' },
        { id: 'c2', name: '🤖 UP Robotics & AI Team', allowedDept: 'FIEK', icon: '🦾', desc: 'Zhvillimi i projekteve inovative në fushën e Inteligjencës Artificiale.', presidentUid: 'student_demo_id' },
        { id: 'c3', name: '📊 Shoqata e Ekonomistëve të Rinj', allowedDept: 'Ekonomik', icon: '📈', desc: 'Analiza makroekonomike, trajnime në kontabilitet dhe diskutime financiare.', presidentUid: 'pres_econ_id' },
        { id: 'c4', name: '⚖️ Klubi i Debatit Juridik - UP', allowedDept: 'Juridik', icon: '🏛', desc: 'Simulime të seancave gjyqësore, analiza të ligjeve të reja.', presidentUid: 'pres_law_id' },
        { id: 'c5', name: '🔬 Kërkimet Shkencore FSHMN', allowedDept: 'FSHMN', icon: '🧪', desc: 'Grupi i biologëve, kimistëve dhe matematikanëve për laboratorë.', presidentUid: 'pres_fshmn_id' },
        { id: 'c6', name: '🩺 Portal i Mjekësisë Klinike', allowedDept: 'Mjekësi', icon: '🏥', desc: 'Diskutime mbi praktikat mjekësore, anatominë universitare.', presidentUid: 'pres_med_id' },
        { id: 'c7', name: '🏃‍♂️ Klubi Olimpik studentor DIF', allowedDept: 'DIF', icon: '🏆', desc: 'Organizimi i garave sportive universitare dhe rekreacionit.', presidentUid: 'pres_dif_id' },
        { id: 'c8', name: '📢 Bashkimi Studentor i UP-së', allowedDept: 'ALL', icon: '🎓', desc: 'Organizimi i përgjithshëm studentor për të gjitha fakultetet e UP-së.', presidentUid: 'pres_all_id' }
    ]);

    const myManagedClubs = clubs.filter(c => c.presidentUid === currentStudentProfile.uid);
    const isAPresident = myManagedClubs.length > 0;
    // DËGJUESI LIVE: Ngarkon klubet e krijuara nga studentët në kohë reale
    useEffect(() => {
        const qCustomClubs = query(collection(db, 'custom_clubs'), orderBy('createdAt', 'desc'));
        const unsubscribeClubs = onSnapshot(qCustomClubs, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });

            setClubs([
                { id: 'c1', name: '🚀 IT-Network Expert Club', allowedDept: 'FIEK', icon: '🌐', desc: 'Grupi ekskluziv për siguri në rrjeta, administrim sistemesh.', presidentUid: 'student_demo_id' },
                { id: 'c2', name: '🤖 UP Robotics & AI Team', allowedDept: 'FIEK', icon: '🦾', desc: 'Zhvillimi i projekteve inovative në fushën e Inteligjencës Artificiale.', presidentUid: 'student_demo_id' },
                { id: 'c3', name: '📊 Shoqata e Ekonomistëve të Rinj', allowedDept: 'Ekonomik', icon: '📈', desc: 'Analiza makroekonomike, trajnime në kontabilitet dhe diskutime financiare.', presidentUid: 'pres_econ_id' },
                { id: 'c4', name: '⚖️ Klubi i Debatit Juridik - UP', allowedDept: 'Juridik', icon: '🏛', desc: 'Simulime të seancave gjyqësore, analiza të ligjeve të reja.', presidentUid: 'pres_law_id' },
                { id: 'c5', name: '🔬 Kërkimet Shkencore FSHMN', allowedDept: 'FSHMN', icon: '🧪', desc: 'Grupi i biologëve, kimistëve dhe matematikanëve për laboratorë.', presidentUid: 'pres_fshmn_id' },
                { id: 'c6', name: '🩺 Portal i Mjekësisë Klinike', allowedDept: 'Mjekësi', icon: '🏥', desc: 'Diskutime mbi praktikat mjekësore, anatominë universitare.', presidentUid: 'pres_med_id' },
                { id: 'c7', name: '🏃‍♂️ Klubi Olimpik studentor DIF', allowedDept: 'DIF', icon: '🏆', desc: 'Organizimi i garave sportive universitare dhe rekreacionit.', presidentUid: 'pres_dif_id' },
                { id: 'c8', name: '📢 Bashkimi Studentor i UP-së', allowedDept: 'ALL', icon: '🎓', desc: 'Organizimi i përgjithshëm studentor për të gjitha fakultetet e UP-së.', presidentUid: 'pres_all_id' },
                ...list
            ]);
        });
        return () => unsubscribeClubs();
    }, []);

    // DËGJUESI LIVE: Monitoron kërkesat e pranuara nga Presidentët për këtë student
    useEffect(() => {
        if (!currentStudentProfile.uid) return;
        const qLogs = query(
            collection(db, 'club_requests'),
            where('studentUid', '==', currentStudentProfile.uid),
            where('status', '==', 'accepted')
        );
        const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
            const logsList = [];
            const approvedIds = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                logsList.push({ id: doc.id, ...data });
                approvedIds.push(data.clubId);
            });
            setApprovedLogs(logsList);
            setMyApprovedClubIds(approvedIds);
        });
        return () => unsubscribeLogs();
    }, [currentStudentProfile.uid]);

    // DËGJUESI LIVE: Për kërkesat hyrëse që i vijnë këtë përdoruesi nëse është President
    useEffect(() => {
        if (!currentStudentProfile.uid || myManagedClubs.length === 0) return;
        const managedClubIds = myManagedClubs.map(c => c.id);
        const qRequests = query(
            collection(db, 'club_requests'),
            where('clubId', 'in', managedClubIds),
            where('status', '==', 'pending')
        );
        const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
            setPendingRequests(list);
        });
        return () => unsubscribeRequests();
    }, [currentStudentProfile.uid, clubs.length]);

    // FUNKSIONI: Krijon një klub të ri në Firestore
    const handleCreateClub = async () => {
        if (!newClubName.trim() || !newClubDesc.trim()) {
            Alert.alert('Gabim', 'Ju lutem plotësoni emrin dhe përshkrimin e klubit.');
            return;
        }
        try {
            await addDoc(collection(db, 'custom_clubs'), {
                name: `🚀 ${newClubName.trim()}`,
                desc: newClubDesc.trim(),
                allowedDept: currentStudentProfile.department,
                icon: '✨',
                presidentUid: currentStudentProfile.uid,
                createdAt: new Date().toISOString()
            });
            setNewClubName('');
            setNewClubDesc('');
            setIsCreateModalOpen(false);
            Alert.alert('Sukses 🎉', 'Klubi juaj u krijua! Ju jeni Presidenti zyrtar.');
        } catch (e) { console.error(e); }
    };

    const handleAcceptRequest = async (requestItem) => {
        try {
            await updateDoc(doc(db, 'club_requests', requestItem.id), { status: 'accepted' });
            await setDoc(doc(db, 'clubs_meta', requestItem.clubId + '_' + requestItem.studentUid), {
                clubId: requestItem.clubId,
                studentUid: requestItem.studentUid,
                studentEmail: requestItem.studentEmail,
                grantedAt: new Date().toISOString()
            });
            Alert.alert('Sukses 🎉', `Studenti u pranua në klub.`);
        } catch (e) { console.error(e); }
    };

    const handleRejectRequest = async (requestId) => {
        try { await deleteDoc(doc(db, 'club_requests', requestId)); } catch (e) { console.error(e); }
    };

    const handleRequestAccess = async (club) => {
        try {
            await addDoc(collection(db, 'club_requests'), {
                clubId: club.id,
                clubName: club.name,
                studentUid: currentStudentProfile.uid,
                studentEmail: currentStudentProfile.email,
                studentFaculty: currentStudentProfile.department,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            Alert.alert('Kërkesa u Dërgua ⏳', 'Kërkesa u dërgua te Presidenti i Klubit.');
        } catch (e) { console.error(e); }
    };

    const handleEnterClub = async (club) => {
        if (club.allowedDept === 'ALL' || club.allowedDept === currentStudentProfile.department || club.presidentUid === currentStudentProfile.uid || myApprovedClubIds.includes(club.id)) {
            setActiveClub(club);
            return;
        }
        try {
            const permissionSnap = await getDoc(doc(db, 'clubs_meta', club.id + '_' + currentStudentProfile.uid));
            if (permissionSnap.exists()) {
                setActiveClub(club);
            } else {
                Alert.alert('Qasje e Kufizuar 🔒', `Klikoni "Dërgo Kërkesë" për të kërkuar leje.`);
            }
        } catch (e) { console.error(e); }
    };
    const handleSendClubMessage = async () => {
        if (!newMsg.trim() || !activeClub) return;
        const currentText = newMsg.trim();
        setNewMsg('');

        try {
            await addDoc(collection(db, 'clubs', activeClub.id, 'messages'), {
                text: currentText,
                createdAt: new Date().toISOString(),
                uid: currentStudentProfile.uid,
                email: currentStudentProfile.email
            });
        } catch (e) {
            console.log("Gabim gjatë dërgimit në klub:", e);
        }
    };

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };

    // LOGJIKA E KORRIGJUAR E FILTRIMIT: Ndarja e rreptë e dhomave pa përsëritje
    const filteredClubsByTab = clubs.filter(item => {
        const isPresidentOfThis = item.presidentUid === currentStudentProfile.uid;
        const hasAccess = item.allowedDept === 'ALL' ||
            item.allowedDept === currentStudentProfile.department ||
            isPresidentOfThis ||
            myApprovedClubIds.includes(item.id);

        if (activeMainTab === 'my_clubs') {
            return hasAccess; // Tab "Klubet e Mia": Shfaq vetëm ato ku përdoruesi KA qasje
        } else {
            return !hasAccess; // Tab "Katalogu": Shfaq vetëm dhomat e huaja ku përdoruesi NUK ka qasje ende
        }
    });

    if (activeClub) {
        return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.clubHeader}>
                    <TouchableOpacity onPress={() => setActiveClub(null)} style={styles.backButton}>
                        <Text style={styles.backButtonText}>⬅ Klubet</Text>
                    </TouchableOpacity>
                    <Text style={styles.clubHeaderTitle} numberOfLines={1}>{activeClub.name}</Text>
                </View>

                {loadingMessages ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color="#4F46E5" size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={clubMessages}
                        keyExtractor={(item) => item.id}
                        inverted
                        renderItem={({ item }) => {
                            const isMe = item.uid === currentStudentProfile.uid;
                            return <MessageBubble text={item.text} email={item.email} isMe={isMe} messageId={item.id} />;
                        }}
                    />
                )}

                <View style={[styles.inputContainer, isDarkMode && { backgroundColor: '#080E1A', borderTopColor: 'rgba(255,255,255,0.05)' }]}>
                    <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#1E293B' }]}>
                        <TextInput
                            style={[styles.chatInput, isDarkMode && { color: '#FFFFFF' }]}
                            placeholder={`Shkruaj në klub...`}
                            placeholderTextColor="#94A3B8"
                            value={newMsg}
                            onChangeText={setNewMsg}
                            onSubmitEditing={handleSendClubMessage}
                            blurOnSubmit={false}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSendClubMessage}>
                            <Text style={styles.sendButtonText}>✈️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <View style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]}>

            {/* INCOMING ACCEPTANCE NOTIFICATION LOGS ALERTS */}
            {approvedLogs.length > 0 && (
                <View style={styles.alertsContainerSection}>
                    <Text style={styles.alertsHeaderTitle}>🔔 Njoftimet e Pranimit:</Text>
                    {approvedLogs.map(log => (
                        <View key={log.id} style={styles.alertSuccessBubbleItem}>
                            <Text style={styles.alertSuccessTxt}>
                                🎉 Urime! Eshtë pranuar kërkesa juaj për t'u qasur në klubin: <Text style={{ fontWeight: '900' }}>{log.clubName}</Text>. Tani keni qasje të plotë shkrimi.
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* PRESIDENT MANAGEMENT PANEL DOCK */}
            {isAPresident && (
                <View style={styles.presidentBadgeContainer}>
                    <TouchableOpacity
                        style={styles.presidentControlToggle}
                        onPress={() => setShowPresidentPanel(!showPresidentPanel)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.presidentToggleTxt}>
                            {showPresidentPanel ? '🔒 Mbyll Panelin e Presidentit' : '👑 Paneli i Menaxhimit (Klub President)'}
                        </Text>
                        {pendingRequests.length > 0 && (
                            <View style={styles.notificationBubble}>
                                <Text style={styles.notificationBubbleTxt}>{pendingRequests.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {showPresidentPanel && (
                        <View style={[styles.presidentPanelDropdown, themeStyles.card]}>
                            <Text style={styles.panelSectionTitle}>Kërkesat për Qasje Ndër-Fakultetore:</Text>
                            {pendingRequests.length === 0 ? (
                                <Text style={styles.emptyRequestsTxt}>Nuk ka kërkesa në pritje për klubet tuaja.</Text>
                            ) : (
                                pendingRequests.map(req => (
                                    <View key={req.id} style={styles.requestItemRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.requestUserTxt} numberOfLines={1}>👤 {req.studentEmail.split('@')}</Text>
                                            <Text style={styles.requestMetaTxt}>Klubi: {req.clubName} • Fakulteti: {req.studentFaculty}</Text>
                                        </View>
                                        <View style={styles.requestActionBtnRow}>
                                            <TouchableOpacity style={styles.actionApproveBtn} onPress={() => handleAcceptRequest(req)}>
                                                <Text style={styles.actionBtnTxt}>Prano</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.actionRejectBtn} onPress={() => handleRejectRequest(req.id)}>
                                                <Text style={styles.actionBtnTxt}>Refuzo</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            )}

            {/* HEADER CONTROLS WITH REVOLUTIONARY CREATION ACTIONS */}
            <View style={styles.clubsHeaderControlRow}>
                <Text style={[styles.title, themeStyles.text, { marginVertical: 0 }]}>Klubet e Universitetit</Text>
                <TouchableOpacity style={styles.createNewClubTriggerBtn} onPress={() => setIsCreateModalOpen(true)} activeOpacity={0.85}>
                    <Text style={styles.createNewClubTriggerTxt}>+ Krijo Klubin Tënd ✨</Text>
                </TouchableOpacity>
            </View>

            {/* Rrjeti i Ndërrimit të Tab-eve (Katalogu vs Klubet e Mia) */}
            <View style={styles.mainTabNavigationRow}>
                <TouchableOpacity
                    style={[styles.mainTabBtnItem, activeMainTab === 'all' && styles.mainTabActiveNode]}
                    onPress={() => setActiveMainTab('all')}
                >
                    <Text style={[styles.mainTabBtnTxt, activeMainTab === 'all' && styles.mainTabBtnTxtActive]}>📋 Katalogu i Klubeve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mainTabBtnItem, activeMainTab === 'my_clubs' && styles.mainTabActiveNode]}
                    onPress={() => setActiveMainTab('my_clubs')}
                >
                    <Text style={[styles.mainTabBtnTxt, activeMainTab === 'my_clubs' && styles.mainTabBtnTxtActive]}>⭐ Klubet e Mia</Text>
                </TouchableOpacity>
            </View>
            {/* SEGMENTED DIRECTORY TIMELINE FEED */}
            <View style={styles.internalTabContainerRow}>
                <Text style={[styles.subSectionHeaderTitle, themeStyles.text]}>
                    {activeMainTab === 'all' ? '📋 Katalogu i hapshëm (Klubet e huaja):' : '⭐ Dhomat tuaja me qasje të plotë:'}
                </Text>
            </View>

            <FlatList
                data={filteredClubsByTab}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 110 }}
                ListEmptyComponent={
                    <Text style={styles.miniEmptyText}>
                        {activeMainTab === 'all'
                            ? 'Nuk ka klube të mbetura për t\'u dërguar kërkesë. Çdo gjë ndodhet tek "Klubet e Mia"!'
                            : 'Nuk jeni anëtar i asnjë klubi ende. Zgjidhni një dhomë tek Katalogu për të kërkuar qasje.'}
                    </Text>
                }
                renderItem={({ item }) => {
                    const isPresidentOfThis = item.presidentUid === currentStudentProfile.uid;
                    const hasAccess = item.allowedDept === 'ALL' || item.allowedDept === currentStudentProfile.department || isPresidentOfThis || myApprovedClubIds.includes(item.id);

                    return (
                        <View style={[styles.clubCard, themeStyles.card]}>
                            <View style={styles.cardTop}>
                                <View style={[styles.iconCircle, isDarkMode ? { backgroundColor: '#1E293B' } : { backgroundColor: '#F0F4F8' }]}>
                                    <Text style={styles.clubIconText}>{item.icon || '✨'}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.clubName, themeStyles.text]}>{item.name}</Text>
                                    <Text style={[styles.lockText, hasAccess ? styles.colorOpen : styles.colorClose]}>
                                        {item.allowedDept === 'ALL' ? '🔓 Publik' : isPresidentOfThis ? '👑 Ti je Presidenti' : hasAccess ? `🔓 Qasje e Hapur` : `🔒 Rezervuar për ${item.allowedDept}`}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.clubDesc, isDarkMode ? { color: '#CBD5E0' } : { color: '#4A5568' }]}>{item.desc}</Text>

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    style={[styles.joinButton, { flex: 1 }, !hasAccess && { backgroundColor: '#334155' }]}
                                    onPress={() => handleEnterClub(item)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.joinButtonText}>Hyr në Kanal ➔</Text>
                                </TouchableOpacity>

                                {!hasAccess && (
                                    <TouchableOpacity
                                        style={[styles.joinButton, { backgroundColor: '#D97706', paddingHorizontal: 12 }]}
                                        onPress={() => handleRequestAccess(item)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.joinButtonText}>Dërgo Kërkesë ✉️</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                }}
            />

            {/* CREATION OVERLAY WORKFLOW PORTAL FORM */}
            <Modal animationType="slide" transparent={true} visible={isCreateModalOpen} onRequestClose={() => setIsCreateModalOpen(false)}>
                <View style={styles.creationModalOverlay}>
                    <View style={[styles.creationModalContent, themeStyles.card]}>
                        <Text style={[styles.modalMainTitle, themeStyles.text]}>🚀 Krijo një Klub të Ri Studentor</Text>
                        <Text style={styles.modalSubDesc}>Klubi juaj fillimisht do të jetë i hapur për studentët e fakultetit tuaj [ {currentStudentProfile.department} ] dhe ju do të jeni Presidenti zyrtar.</Text>

                        <View style={styles.inputWrapperField}>
                            <Text style={styles.fieldLabelTitle}>Emri i Klubit</Text>
                            <TextInput
                                style={[styles.modalInputField, themeStyles.input]}
                                placeholder="p.sh. Klubi i Kodicëve UP"
                                placeholderTextColor="#64748B"
                                value={newClubName}
                                onChangeText={setNewClubName}
                            />
                        </View>

                        <View style={styles.inputWrapperField}>
                            <Text style={styles.fieldLabelTitle}>Përshkrimi i Aktivitetit</Text>
                            <TextInput
                                style={[styles.modalInputField, themeStyles.input, { height: 75, textAlignVertical: 'top', paddingTop: 8 }]}
                                placeholder="Shkruaj rredit qëllimit dhe takimeve të klubit..."
                                placeholderTextColor="#64748B"
                                multiline
                                value={newClubDesc}
                                onChangeText={setNewClubDesc}
                            />
                        </View>

                        <View style={styles.modalActionsRowGrid}>
                            <TouchableOpacity style={styles.cancelCreationFormBtn} onPress={() => setIsCreateModalOpen(false)}>
                                <Text style={styles.cancelBtnText}>Anulo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitCreationFormBtn} onPress={handleCreateClub}>
                                <Text style={styles.submitBtnText}>Krijo Klubin ⚡</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 14, paddingBottom: 85, position: 'relative', zIndex: 10 },
    lightBg: { backgroundColor: '#F0F4F8' }, darkBg: { backgroundColor: '#080E1A' },
    lightCard: { backgroundColor: '#ffffff', borderColor: '#F0F4F8' }, darkCard: { backgroundColor: '#0F172A', borderColor: 'rgba(79, 70, 229, 0.2)' },
    lightText: { color: '#0B2545' }, darkText: { color: '#FFFFFF' },

    title: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
    clubsHeaderControlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6, width: '100%' },
    createNewClubTriggerBtn: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1.2, borderColor: '#10B981', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
    createNewClubTriggerTxt: { color: '#10B981', fontSize: 12, fontWeight: '800' },

    // DUAL TAB LAYOUT CONTROLLER HUB ARCHITECTURE
    mainTabNavigationRow: { flexDirection: 'row', backgroundColor: '#1E293B', padding: 4, borderRadius: 16, marginVertical: 12, gap: 4 },
    mainTabBtnItem: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 12 },
    mainTabActiveNode: { backgroundColor: '#4F46E5' },
    mainTabBtnTxt: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
    mainTabBtnTxtActive: { color: '#FFFFFF', fontWeight: '800' },

    internalTabContainerRow: { marginVertical: 4, width: '100%' },
    subSectionHeaderTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
    miniEmptyText: { fontSize: 13, color: '#64748B', paddingHorizontal: 24, fontStyle: 'italic', marginVertical: 35, textAlign: 'center', fontWeight: '500', lineHeight: 20 },

    clubCard: { padding: 16, borderRadius: 24, marginVertical: 8, shadowColor: '#000', shadowOpacity: 0.02, elevation: 3, borderWidth: 1 },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconCircle: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    clubIconText: { fontSize: 22 },
    clubName: { fontSize: 15, fontWeight: '700' },
    lockText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
    colorOpen: { color: '#10B981' }, colorClose: { color: '#EF4444' },
    clubDesc: { fontSize: 13, lineHeight: 19, marginBottom: 16, fontWeight: '500' },
    joinButton: { backgroundColor: '#4F46E5', height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },
    joinButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

    clubHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#0F172A', borderBottomWidth: 2, borderBottomColor: '#4F46E5', marginHorizontal: -14, marginTop: -14, marginBottom: 10 },
    backButton: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    backButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
    clubHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#ffffff', flex: 1 },

    inputContainer: { padding: 12, backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginHorizontal: -14, marginBottom: 12, zIndex: 9999999 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 24, paddingHorizontal: 6, paddingVertical: 4 },
    chatInput: { flex: 1, height: 40, paddingHorizontal: 14, color: '#FFFFFF', fontSize: 14 },
    sendButton: { width: 36, height: 36, backgroundColor: '#4F46E5', borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    sendButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

    presidentBadgeContainer: { width: '100%', marginBottom: 10 },
    presidentControlToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#D97706', padding: 14, borderRadius: 16 },
    presidentToggleTxt: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
    notificationBubble: { backgroundColor: '#EF4444', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    notificationBubbleTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
    presidentPanelDropdown: { padding: 14, borderRadius: 20, borderWidth: 1, marginTop: 6 },
    panelSectionTitle: { fontSize: 12, fontWeight: '800', color: '#F59E0B', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },
    emptyRequestsTxt: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
    requestItemRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', alignItems: 'center', gap: 8 },
    requestUserTxt: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    requestMetaTxt: { color: '#94A3B8', fontSize: 11, fontWeight: '500', marginTop: 2 },
    requestActionBtnRow: { flexDirection: 'row', gap: 6 },
    actionApproveBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    actionRejectBtn: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    actionBtnTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

    alertsContainerSection: { width: '100%', marginBottom: 10, backgroundColor: 'rgba(16,185,129,0.04)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)', padding: 12, borderRadius: 18 },
    alertsHeaderTitle: { fontSize: 12, fontWeight: '800', color: '#10B981', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
    alertSuccessBubbleItem: { paddingVertical: 4 },
    alertSuccessTxt: { color: '#A7F3D0', fontSize: 12, fontWeight: '500', lineHeight: 17 },

    // CREATION WORKFLOW FORM OVERLAY CSS
    creationModalOverlay: { flex: 1, backgroundColor: 'rgba(8,14,26,0.85)', justifyContent: 'center', alignItems: 'center', padding: 15 },
    creationModalContent: { width: '100%', maxWidth: 400, borderRadius: 28, padding: 22, borderWidth: 1 },
    modalMainTitle: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3, marginBottom: 6 },
    modalSubDesc: { fontSize: 12, color: '#94A3B8', lineHeight: 18, marginBottom: 16, fontWeight: '500' },
    inputWrapperField: { width: '100%', marginBottom: 14 },
    fieldLabelTitle: { fontSize: 12, fontWeight: '700', color: '#818CF8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    modalInputField: { width: '100%', height: 46, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, fontSize: 13 },
    modalActionsRowGrid: { flexDirection: 'row', gap: 10, marginTop: 8 },
    cancelCreationFormBtn: { flex: 1, height: 44, backgroundColor: '#1E293B', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cancelBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
    submitCreationFormBtn: { flex: 1, height: 44, backgroundColor: '#10B981', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 }
});
