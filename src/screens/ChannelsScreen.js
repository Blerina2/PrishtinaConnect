import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import ChatScreen from './ChatScreen';

export default function ChannelsScreen() {
    const { user, isDarkMode } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [chatRequests, setChatRequests] = useState([]);
    const [myChatsList, setMyChatsList] = useState([]);
    const [newChatsList, setNewChatsList] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [searchStudent, setSearchStudent] = useState('');
    const [fetching, setFetching] = useState(true);

    // Tabet kryesore të mëdha lart
    const [activePrivateTab, setActivePrivateTab] = useState('friends');

    // Nën-tabet kompakte horizontale brenda "Miqtë e Mi"
    const [activeSubFriendTab, setActiveSubFriendTab] = useState('my_chats');

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [activeChatSession, setActiveChatSession] = useState(null);

    const [isMaximized, setIsMaximized] = useState(false);
    const [chatPosition, setChatPosition] = useState({ x: 20, y: 105 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedStudentMenu, setSelectedStudentMenu] = useState(null);

    const studentFaculty = user?.faculty || 'FIEK';

    const channelsDataPool = [
        { id: 'ch1', name: 'Rrjeta Kompjuterike', department: 'FIEK' },
        { id: 'ch2', name: 'Inxhinieri Softuerike', department: 'FIEK' },
        { id: 'ch3', name: 'Matematika 1', department: 'FSHMN' },
        { id: 'ch4', name: 'Kimi e Përgjithshme', department: 'FSHMN' },
        { id: 'ch5', name: 'Menaxhment dhe Ndërmarrësi', department: 'Ekonomik' },
        { id: 'ch6', name: 'Kontabilitet Financiar', department: 'Ekonomik' },
        { id: 'ch9', name: 'Njoftime të Përgjithshme UP', department: 'ALL' }
    ];

    const filteredChannels = channelsDataPool.filter(ch =>
        ch.department === studentFaculty || ch.department === 'ALL'
    );

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, 'chat_requests'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const reqs = [];
            snapshot.forEach((doc) => { reqs.push({ id: doc.id, ...doc.data() }); });
            setChatRequests(reqs);
            if (usersList.length > 0) { filterAllSections(usersList, reqs); }
        });

        const fetchStudents = async () => {
            try {
                const querySnapshot = await getDocs(query(collection(db, 'users'), where('email', '!=', user.email)));
                const students = [];
                querySnapshot.forEach((doc) => students.push({ id: doc.id, ...doc.data() }));
                setUsersList(students);
                filterAllSections(students, chatRequests);
            } catch (e) { console.log(e); }
            setFetching(false);
        };
        fetchStudents();

        return () => unsubscribe();
    }, [user?.uid, usersList.length]);

    // KORRIGJIMI TOTAL: Gjenerim i pastër pa kllapa dhe pa presje (user.uid < student.id)
    const filterAllSections = async (students, currentRequests) => {
        const chats = [];
        const fresh = [];
        const incoming = [];

        for (let student of students) {
            if (!student.id || !user.uid) continue;

            // Gjenerim i saktë simetrik si në ProfileScreen dhe ChatScreen
            const chatId = user.uid < student.id ? `${user.uid}_${student.id}` : `${student.id}_${user.uid}`;

            const match = currentRequests.find(r => r.id === chatId);

            if (match) {
                if (match.status === 'accepted') {
                    try {
                        const msgSnapshot = await getDocs(collection(db, 'channels', chatId, 'messages'));
                        if (!msgSnapshot.empty) {
                            chats.push(student);
                        } else {
                            fresh.push(student);
                        }
                    } catch(err) {
                        chats.push(student);
                    }
                } else if (match.status === 'pending' && match.receiverId === user.uid) {
                    incoming.push(student);
                }
            }
        }

        setMyChatsList(chats);
        setNewChatsList(fresh);
        setIncomingRequests(incoming);
    };

    const formatNickname = (email) => {
        if (!email) return 'Student';
        const parts = email.split('@');
        const partBeforeAt = parts.shift();
        return partBeforeAt.replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    };

    const hasNewRequestsGlobal = incomingRequests.length > 0;

    const handleOpenChatBubble = (channelOrUser, isPrivate = false) => {
        if (!channelOrUser) return;

        let chatId = channelOrUser.id;
        if (isPrivate) {
            chatId = user.uid < channelOrUser.id ? `${user.uid}_${channelOrUser.id}` : `${channelOrUser.id}_${user.uid}`;
        }

        setActiveChatSession({
            id: chatId,
            name: isPrivate ? formatNickname(channelOrUser.email) : channelOrUser.name,
            isPrivate: isPrivate,
            targetUser: isPrivate ? channelOrUser : null
        });
        setIsSearchModalOpen(false);
        setIsMaximized(false);
        setChatPosition({ x: 20, y: 105 });
    };

    const handleClearMessagesOnly = async (targetStudent) => {
        if (!targetStudent) return;
        setSelectedStudentMenu(null);
        const chatId = user.uid < targetStudent.id ? `${user.uid}_${targetStudent.id}` : `${targetStudent.id}_${user.uid}`;
        try {
            const messagesSnapshot = await getDocs(collection(db, 'channels', chatId, 'messages'));
            messagesSnapshot.forEach(async (msgDoc) => {
                await deleteDoc(doc(db, 'channels', chatId, 'messages', msgDoc.id));
            });
            Alert.alert("Pastruar 🗑️", "Historiku i mesazheve u fshi.");
            filterAllSections(usersList, chatRequests);
        } catch (e) { console.log(e); }
    };

    const handleDeleteChatAndName = async (targetStudent) => {
        if (!targetStudent) return;
        setSelectedStudentMenu(null);
        const chatId = user.uid < targetStudent.id ? `${user.uid}_${targetStudent.id}` : `${targetStudent.id}_${user.uid}`;
        try {
            await deleteDoc(doc(db, 'chat_requests', chatId));
            const messagesSnapshot = await getDocs(collection(db, 'channels', chatId, 'messages'));
            messagesSnapshot.forEach(async (msgDoc) => {
                await deleteDoc(doc(db, 'channels', chatId, 'messages', msgDoc.id));
            });
            Alert.alert("Fshirë plotësisht ❌", "Biseda u largua nga lista.");
            if (activeChatSession?.id === chatId) setActiveChatSession(null);
            filterAllSections(usersList, chatRequests);
        } catch (e) { console.log(e); }
    };

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };
    return (
        <View style={{ flex: 1, position: 'relative' }} onMouseMove={(e) => isDragging && !isMaximized && setChatPosition({ x: dragStart.x - e.clientX, y: dragStart.y - e.clientY })} onMouseUp={() => setIsDragging(false)}>

            <View style={styles.mainHeaderRow}>
                <Text style={[styles.mainSectionTitle, themeStyles.text]}>🏛️ Kanalet e Fakultetit Tënd [{studentFaculty}]</Text>
            </View>

            <ScrollView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]} contentContainerStyle={{ paddingBottom: 110 }}>
                {filteredChannels.map((item) => (
                    <TouchableOpacity key={item.id} style={[styles.channelItem, themeStyles.card]} onPress={() => handleOpenChatBubble(item, false)}>
                        <View style={styles.hashCircle}><Text style={styles.hashText}>#</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.channelName, themeStyles.text]}>{item.name}</Text>
                            <Text style={styles.channelLabel}>🏛️ Zyrtare</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity style={styles.gmailFabButton} onPress={() => setIsSearchModalOpen(true)} activeOpacity={0.85}>
                <Text style={styles.gmailFabText}>💬</Text>
                {hasNewRequestsGlobal && <View style={styles.fabNotificationBadge} />}
            </TouchableOpacity>

            <Modal visible={isSearchModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsSearchModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, isDarkMode ? styles.darkCard : styles.lightCard]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, themeStyles.text]}>Inbox Komunikimi - UP</Text>
                            <TouchableOpacity onPress={() => setIsSearchModalOpen(false)} style={styles.modalCloseBtn}><Text style={styles.modalCloseBtnTxt}>✕</Text></TouchableOpacity>
                        </View>

                        {/* DIE BEIDEN HAUPTTABS OBEN */}
                        <View style={styles.modalTabContainer}>
                            <TouchableOpacity style={[styles.modalTabBtn, activePrivateTab === 'friends' && styles.modalTabActive]} onPress={() => setActivePrivateTab('friends')}>
                                <Text style={styles.modalTabTxt}>👥 Miqtë e Mi</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalTabBtn, activePrivateTab === 'requests' && styles.modalTabActive]} onPress={() => setActivePrivateTab('requests')}>
                                <Text style={styles.modalTabTxt}>📩 Kërkesat {hasNewRequestsGlobal && <Text style={{ color: '#E53E3E' }}>●</Text>}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
                            {fetching ? <ActivityIndicator color="#0B2545" style={{ marginTop: 20 }} /> : (
                                activePrivateTab === 'friends' ? (
                                    <>
                                        {/* UNTER-TABS IN HORIZONTALER FORM */}
                                        <View style={styles.modalSubTabContainer}>
                                            <TouchableOpacity style={[styles.modalSubTabBtn, activeSubFriendTab === 'my_chats' && styles.modalSubTabActive]} onPress={() => setActiveSubFriendTab('my_chats')}>
                                                <Text style={styles.modalSubTabTxt}>💬 My Chats ({myChatsList.length})</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.modalSubTabBtn, activeSubFriendTab === 'start_new' && styles.modalSubTabActive]} onPress={() => setActiveSubFriendTab('start_new')}>
                                                <Text style={styles.modalSubTabTxt}>➕ Start New ({newChatsList.length})</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* LIVE CHAT FILTER FEED */}
                                        {activeSubFriendTab === 'my_chats' ? (
                                            myChatsList.length === 0 ? <Text style={styles.miniEmptyText}>Nuk ka biseda aktive.</Text> : myChatsList.map(student => renderStudentItem(student, false, themeStyles))
                                        ) : (
                                            newChatsList.length === 0 ? <Text style={styles.miniEmptyText}>Nuk ka miq të rinj pa mesazhe.</Text> : newChatsList.map(student => renderStudentItem(student, false, themeStyles))
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Text style={[styles.subSectionHeaderTitle, themeStyles.text]}>📥 Kërkesat e reja të pranuara në pritje</Text>
                                        {incomingRequests.length === 0 ? <Text style={styles.miniEmptyText}>Nuk ka asnjë kërkesë të re.</Text> : incomingRequests.map(student => renderStudentItem(student, true, themeStyles))}
                                    </>
                                )
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {activeChatSession && (
                <View style={[styles.floatingChatWrapper, isMaximized ? styles.maximizedWindow : { bottom: chatPosition.y, right: chatPosition.x }]}>
                    <View style={styles.bubbleDragHeader} onMouseDown={(e) => { if(!isMaximized) { setIsDragging(true); setDragStart({ x: e.clientX + chatPosition.x, y: e.clientY + chatPosition.y }); } }}>
                        <Text style={styles.bubbleHeaderTitle} numberOfLines={1}>💬 {activeChatSession.name}</Text>
                        <View style={styles.headerControls}>
                            <TouchableOpacity onPress={() => setIsMaximized(!isMaximized)} style={styles.controlBtn}><Text style={styles.controlBtnTxt}>{isMaximized ? '🗗' : '🗖'}</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setActiveChatSession(null)} style={styles.controlBtn}><Text style={styles.controlBtnTxt}>✕</Text></TouchableOpacity>
                        </View>
                    </View>
                    <ChatScreen selectedChannel={activeChatSession} hideHeader={true} onBack={() => setActiveChatSession(null)} />
                </View>
            )}
        </View>
    );

    function renderStudentItem(student, isIncomingRequest, themeStyles) {
        const cleanName = formatNickname(student.email);
        const isMenuOpen = selectedStudentMenu === student.id;
        return (
            <View key={student.id} style={styles.studentSearchItemWrapper}>
                <TouchableOpacity style={styles.studentSearchItem} onPress={() => handleOpenChatBubble(student, true)}>
                    <Text style={[styles.studentSearchName, themeStyles.text]}>
                        👤 {cleanName} ({student.faculty || 'UP'}) {isIncomingRequest && <Text style={{ color: '#E53E3E' }}> 🔴</Text>}
                    </Text>
                </TouchableOpacity>

                <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <TouchableOpacity style={styles.outsideThreeDotsBtn} onPress={() => setSelectedStudentMenu(isMenuOpen ? null : student.id)}>
                        <Text style={[styles.outsideThreeDotsTxt, themeStyles.text]}>⋮</Text>
                    </TouchableOpacity>

                    {isMenuOpen && (
                        <View style={styles.outsideDropdown}>
                            {/* KORRIGJIMI: Tani kalohet ndryshorja e saktë student */}
                            <TouchableOpacity style={styles.dropdownDeleteRow} onPress={() => handleClearMessagesOnly(student)}>
                                <Text style={{ color: '#3182CE', fontSize: 11, fontWeight: '700' }}>🗑️ Pastro historikun</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dropdownDeleteRow} onPress={() => handleDeleteChatAndName(student)}>
                                <Text style={{ color: '#C53030', fontSize: 11, fontWeight: '700' }}>❌ Fshij krejt bisedën</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    }
}
const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 12 },
    lightBg: { backgroundColor: '#F8FAFC' }, darkBg: { backgroundColor: '#1A202C' },
    lightCard: { backgroundColor: '#ffffff', borderColor: '#EEF2F6' }, darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
    lightText: { color: '#0B2545' }, darkText: { color: '#FFFFFF' },
    lightInput: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', color: '#0B2545' }, darkInput: { backgroundColor: '#1A202C', borderColor: '#4A5568', color: '#FFFFFF' },
    mainHeaderRow: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },
    mainSectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    channelItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, marginVertical: 4, borderWidth: 1, elevation: 1 },
    hashCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(238, 185, 2, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    hashText: { color: '#EEB902', fontWeight: '900', fontSize: 13 },
    channelName: { fontSize: 13, fontWeight: '700' },
    channelLabel: { fontSize: 10, color: '#718096', marginTop: 1 },
    gmailFabButton: { position: 'absolute', bottom: 100, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', elevation: 6, zIndex: 999, borderBottomWidth: 2.5, borderBottomColor: '#EEB902' },
    gmailFabText: { fontSize: 16 },
    fabNotificationBadge: { position: 'absolute', top: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53E3E', borderWidth: 1.5, borderColor: '#FFF' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: 15 },
    modalContent: { width: '100%', maxWidth: 400, height: '60%', borderRadius: 16, padding: 16, borderWidth: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 13, fontWeight: '800' },
    modalCloseBtn: { padding: 4, backgroundColor: '#FFF5F5', borderRadius: 6 },
    modalCloseBtnTxt: { color: '#C53030', fontWeight: '700', fontSize: 11 },

    // HAUPTTABS OBEN
    modalTabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', padding: 3, borderRadius: 8, marginVertical: 6 },
    modalTabBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
    modalTabActive: { backgroundColor: '#FFF', elevation: 1 },
    modalTabTxt: { fontSize: 11, fontWeight: '700', color: '#4A5568' },

    // UNTER-TABS HORIZONTAL (IDENTISCHER STIL, ETWAS KLEINER)
    modalSubTabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', padding: 2.5, borderRadius: 6, marginVertical: 6, width: '100%' },
    modalSubTabBtn: { flex: 1, paddingVertical: 5, alignItems: 'center', borderRadius: 5 },
    modalSubTabActive: { backgroundColor: '#FFF', elevation: 1 },
    modalSubTabTxt: { fontSize: 10, fontWeight: '700', color: '#4A5568' },

    subSectionHeaderTitle: { fontSize: 10, fontWeight: '800', marginTop: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3, paddingHorizontal: 2 },
    miniEmptyText: { fontSize: 11, color: '#A0AEC0', paddingHorizontal: 10, fontStyle: 'italic', marginVertical: 8, textAlign: 'center' },

    searchInput: { height: 36, borderWidth: 1.2, borderRadius: 8, paddingHorizontal: 10, fontSize: 12 },
    studentSearchItemWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3, paddingRight: 2, backgroundColor: 'rgba(0,0,0,0.01)', borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    studentSearchItem: { flex: 1, padding: 10 },
    studentSearchName: { fontSize: 12, fontWeight: '700' },
    outsideThreeDotsBtn: { paddingHorizontal: 8, paddingVertical: 6 },
    outsideThreeDotsTxt: { fontSize: 14, fontWeight: '900' },

    outsideDropdown: { position: 'absolute', top: 24, right: 8, backgroundColor: '#FFF', width: 135, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', elevation: 4, zIndex: 99999, padding: 1 },
    dropdownDeleteRow: { padding: 6, width: '100%' },

    floatingChatWrapper: { position: 'absolute', width: 310, height: 420, backgroundColor: '#FFF', borderRadius: 14, elevation: 10, overflow: 'hidden', zIndex: 99999, borderWidth: 1, borderColor: '#E2E8F0' },
    maximizedWindow: { position: 'absolute', top: '12%', left: '25%', width: '50%', height: '70%', borderRadius: 16 },
    bubbleDragHeader: { height: 40, backgroundColor: '#0B2545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, cursor: 'move' },
    bubbleHeaderTitle: { color: '#FFF', fontWeight: '700', fontSize: 12, flex: 1 },
    headerControls: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    controlBtn: { padding: 2 }, controlBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' }
});
