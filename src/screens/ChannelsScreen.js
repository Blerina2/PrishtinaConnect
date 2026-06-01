import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Modal, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, deleteDoc, doc, onSnapshot, setDoc, getDoc, writeBatch } from 'firebase/firestore';
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

    const [activePrivateTab, setActivePrivateTab] = useState('friends');
    const [activeSubFriendTab, setActiveSubFriendTab] = useState('my_chats');

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [activeChatSession, setActiveChatSession] = useState(null);

    const [isMaximized, setIsMaximized] = useState(false);
    const [chatPosition, setChatPosition] = useState({ x: 20, y: 105 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const [selectedStudentForAction, setSelectedStudentForAction] = useState(null);

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

        const qRequests = query(
            collection(db, 'channels'),
            where('members', 'array-contains', user.uid)
        );

        const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
            const reqs = [];
            snapshot.forEach((doc) => {
                reqs.push({ id: doc.id, ...doc.data() });
            });
            setChatRequests(reqs);

            if (usersList.length > 0) {
                filterAllSections(usersList, reqs);
            }
        });

        const fetchStudents = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const students = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data && data.email !== user.email) {
                        const actualId = data.uid || doc.id;
                        students.push({ id: actualId, ...data, uid: actualId });
                    }
                });

                setUsersList(students);
                filterAllSections(students, chatRequests);
            } catch (e) {
                console.log("Gabim gjatë ngarkimit të studentëve:", e);
            } finally {
                setFetching(false);
            }
        };

        fetchStudents();

        return () => {
            unsubscribeRequests();
        };
    }, [user?.uid, usersList.length]);
    // REITER-LOGIK: Sortiert private Anfragen und Chats live basierend auf dem members-Array
    const filterAllSections = (students, currentRequests) => {
        const chats = [];
        const fresh = [];
        const incoming = [];

        if (!students || !Array.isArray(students)) return;
        const safeRequests = currentRequests || [];

        for (let student of students) {
            const studentUid = student.uid || student.id;
            if (!studentUid || !user.uid) continue;

            const match = safeRequests.find(r =>
                r.members && r.members.includes(user.uid) && r.members.includes(studentUid)
            );

            if (match) {
                const studentWithReq = { ...student, id: studentUid, currentRequestId: match.id };
                const currentStatus = match.status || 'pending';

                if (currentStatus === 'accepted') {
                    chats.push(studentWithReq);
                } else if (currentStatus === 'pending') {
                    if (match.senderId === user.uid) {
                        fresh.push(studentWithReq);
                    } else if (match.receiverId === user.uid) {
                        incoming.push(studentWithReq);
                    }
                }
            }
        }

        setMyChatsList(chats);
        setNewChatsList(fresh);
        setIncomingRequests(incoming);
    };

    const formatNickname = (email) => {
        if (!email || typeof email !== 'string') return 'Student';
        const cleanEmail = email.trim();
        if (!cleanEmail.includes('@')) {
            return cleanEmail.replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        }
        const parts = cleanEmail.split('@');
        const partBeforeAt = parts.shift();
        if (!partBeforeAt) return 'Student';
        return partBeforeAt.replace(/\./g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    };

    const hasNewRequestsGlobal = incomingRequests.length > 0;

    const handleOpenChatBubble = (channelOrUser, isPrivate = false) => {
        if (!channelOrUser) return;

        const targetId = channelOrUser.id || channelOrUser.uid;
        if (!targetId) return;

        let chatId = channelOrUser.id;
        let initialStatus = 'accepted';

        if (isPrivate) {
            if (channelOrUser.currentRequestId) {
                chatId = channelOrUser.currentRequestId;
            } else {
                const existing = chatRequests.find(r =>
                    r.members && r.members.includes(user.uid) && r.members.includes(targetId)
                );
                chatId = existing ? existing.id : `chat_${user.uid}_${targetId}`;
            }

            const match = chatRequests.find(r => r.id === chatId);
            if (match) {
                if (match.status === 'accepted') {
                    initialStatus = 'accepted';
                } else if (match.senderId === user.uid) {
                    initialStatus = 'pending';
                } else {
                    initialStatus = 'incoming';
                }
            } else {
                initialStatus = 'none';
            }
        }

        setActiveChatSession({
            id: chatId,
            name: isPrivate ? formatNickname(channelOrUser.email) : channelOrUser.name,
            isPrivate: isPrivate,
            initialStatus: initialStatus,
            targetUser: isPrivate ? {
                id: targetId,
                faculty: channelOrUser.faculty || 'UP',
                email: channelOrUser.email || ''
            } : null
        });
        setIsSearchModalOpen(false);
        setIsMaximized(false);
        setChatPosition({ x: 20, y: 105 });
    };

    // BANI PASTRIMIN E HISTORIKUT ME BATCH
    const handleClearMessagesOnly = async (targetStudent) => {
        if (!targetStudent || !targetStudent.currentRequestId) return;
        setSelectedStudentForAction(null);
        try {
            const batch = writeBatch(db);
            const messagesSnapshot = await getDocs(collection(db, 'channels', targetStudent.currentRequestId, 'messages'));

            messagesSnapshot.forEach((msgDoc) => {
                const msgDocRef = doc(db, 'channels', targetStudent.currentRequestId, 'messages', msgDoc.id);
                batch.delete(msgDocRef);
            });

            await batch.commit();
            Alert.alert("Pastruar 🗑️", "Historiku i mesazheve u fshi.");
            filterAllSections(usersList, chatRequests);
        } catch (e) { console.log("Gabim gjatë fshirjes së historikut:", e); }
    };

    // BANI FSHIRJEN E PLOTË TË BISEDËS ME BATCH
    const handleDeleteChatAndName = async (targetStudent) => {
        if (!targetStudent || !targetStudent.currentRequestId) return;
        setSelectedStudentForAction(null);
        try {
            const batch = writeBatch(db);

            const reqDocRef = doc(db, 'channels', targetStudent.currentRequestId);
            batch.delete(reqDocRef);

            const messagesSnapshot = await getDocs(collection(db, 'channels', targetStudent.currentRequestId, 'messages'));
            messagesSnapshot.forEach((msgDoc) => {
                const msgDocRef = doc(db, 'channels', targetStudent.currentRequestId, 'messages', msgDoc.id);
                batch.delete(msgDocRef);
            });

            await batch.commit();
            Alert.alert("Fshirë plotësisht ❌", "Biseda u largua nga lista.");
            if (activeChatSession?.id === targetStudent.currentRequestId) setActiveChatSession(null);
            filterAllSections(usersList, chatRequests);
        } catch (e) { console.log("Gabim gjatë fshirjes së plotë:", e); }
    };

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };
    // KORRIGJIMI TOTAL VIZUAL: Modali i vjetër i madh u fshi, mbetet vetëm flluska e vogël Instagram-Style
    function renderStudentItem(student, isIncomingRequest, themeStyles) {
        if (!student) return null;
        const studentUid = student.uid || student.id;
        const cleanName = formatNickname(student.email);

        const isBubbleOpen = selectedStudentForAction && selectedStudentForAction.id === studentUid;

        return (
            <View key={studentUid} style={styles.studentSearchItemWrapper}>
                {/* Kartela e studentit */}
                <TouchableOpacity
                    style={styles.studentSearchItem}
                    onPress={() => handleOpenChatBubble(student, true)}
                >
                    <Text style={[styles.studentSearchName, themeStyles.text]}>
                        👤 {cleanName} ({student.faculty || 'UP'}) {isIncomingRequest && <Text style={{ color: '#E53E3E' }}> 🔴</Text>}
                    </Text>
                </TouchableOpacity>

                {/* Zona e tri pikave anësore */}
                <View style={{ position: 'relative', zIndex: 999999 }}>
                    <TouchableOpacity
                        style={styles.outsideThreeDotsBtn}
                        onPress={(e) => {
                            if (e && e.stopPropagation) e.stopPropagation();
                            setSelectedStudentForAction(isBubbleOpen ? null : student);
                        }}
                    >
                        <Text style={[styles.outsideThreeDotsTxt, themeStyles.text]}>⋮</Text>
                    </TouchableOpacity>
                    {/* FLLUSKA E RE INSTAGRAM-STYLE ME OPSIONIN UNFRIEND */}
                    {isBubbleOpen && (
                        <View style={styles.outsideInstagramBubble}>
                            <TouchableOpacity
                                style={styles.instagramRowBtn}
                                onPress={(e) => {
                                    if (e && e.stopPropagation) e.stopPropagation();
                                    handleClearMessagesOnly(selectedStudentForAction);
                                }}
                            >
                                <Text style={styles.dropdownBlueTxt}>🗑️ Pastro Historikun</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.instagramRowBtn}
                                onPress={(e) => {
                                    if (e && e.stopPropagation) e.stopPropagation();
                                    handleDeleteChatAndName(selectedStudentForAction);
                                }}
                            >
                                <Text style={styles.dropdownOrangeTxt}>❌ Fshij Bisedën</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.instagramRowBtn, { borderBottomWidth: 0 }]}
                                onPress={(e) => {
                                    if (e && e.stopPropagation) e.stopPropagation();
                                    // Thërret të njëjtin funksion fshirjeje totale pasi fshin lidhjen bazë dhe mesazhet
                                    handleDeleteChatAndName(selectedStudentForAction);
                                    Alert.alert("U largua nga miqtë 🚫", "Lidhja e shoqërisë u fshi komplet.");
                                }}
                            >
                                <Text style={styles.dropdownRedTxt}>🚫 Unfriend (Largo)</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </View>
            </View>
        );
    }

    return (
        <View
            style={{ flex: 1, position: 'relative' }}
            onMouseMove={(e) => {
                if (isDragging && !isMaximized) {
                    setChatPosition({
                        x: dragStart.x - e.clientX,
                        y: dragStart.y - e.clientY
                    });
                }
            }}
            onMouseUp={() => setIsDragging(false)}
        >
            <View style={styles.mainHeaderRow}>
                <Text style={[styles.mainSectionTitle, themeStyles.text]}>🏛️ Kanalet e Fakultetit Tënd [{studentFaculty}]</Text>
            </View>

            <ScrollView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]} contentContainerStyle={{ paddingBottom: 110 }}>
                {filteredChannels.map((channel) => (
                    <TouchableOpacity key={channel.id} style={[styles.channelItem, themeStyles.card]} onPress={() => handleOpenChatBubble(channel, false)}>
                        <View style={styles.hashCircle}><Text style={styles.hashText}>#</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.channelName, themeStyles.text]}>{channel.name}</Text>
                            <Text style={styles.channelLabel}>Kanal Zyrtar • {channel.department}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity style={styles.gmailFabButton} onPress={() => setIsSearchModalOpen(true)} activeOpacity={0.85}>
                <Text style={styles.gmailFabText}>💬</Text>
                {hasNewRequestsGlobal && <View style={styles.fabNotificationBadge} />}
            </TouchableOpacity>
            <Modal animationType="fade" transparent={true} visible={isSearchModalOpen} onRequestClose={() => setIsSearchModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, themeStyles.card]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, themeStyles.text]}>🔍 Kërko Studentët [UP]</Text>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsSearchModalOpen(false)}>
                                <Text style={styles.modalCloseBtnTxt}>Mbyll</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalTabContainer}>
                            <TouchableOpacity style={[styles.modalTabBtn, activePrivateTab === 'friends' && styles.modalTabActive]} onPress={() => setActivePrivateTab('friends')}>
                                <Text style={styles.modalTabTxt}>Miqtë e Mi</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalTabBtn, activePrivateTab === 'search' && styles.modalTabActive]} onPress={() => setActivePrivateTab('search')}>
                                <Text style={styles.modalTabTxt}>Kërko të Ri</Text>
                            </TouchableOpacity>
                        </View>

                        {activePrivateTab === 'friends' ? (
                            <View style={{ flex: 1 }}>
                                <View style={styles.modalSubTabContainer}>
                                    <TouchableOpacity style={[styles.modalSubTabBtn, activeSubFriendTab === 'my_chats' && styles.modalSubTabActive]} onPress={() => setActiveSubFriendTab('my_chats')}>
                                        <Text style={styles.modalSubTabTxt}>Bisedat ({(myChatsList || []).length})</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.modalSubTabBtn, activeSubFriendTab === 'new_requests' && styles.modalSubTabActive]} onPress={() => setActiveSubFriendTab('new_requests')}>
                                        <Text style={styles.modalSubTabTxt}>Në Pritje ({(newChatsList || []).length})</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.modalSubTabBtn, activeSubFriendTab === 'incoming' && styles.modalSubTabActive]} onPress={() => setActiveSubFriendTab('incoming')}>
                                        <Text style={styles.modalSubTabTxt}>Kërkesat {hasNewRequestsGlobal ? '🔴' : `(${(incomingRequests || []).length})`}</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={{ flex: 1 }}>
                                    {activeSubFriendTab === 'my_chats' && (
                                        (!myChatsList || myChatsList.length === 0) ? <Text style={styles.miniEmptyText}>Nuk ka biseda aktive.</Text> : myChatsList.map(s => renderStudentItem(s, false, themeStyles))
                                    )}
                                    {activeSubFriendTab === 'new_requests' && (
                                        (!newChatsList || newChatsList.length === 0) ? <Text style={styles.miniEmptyText}>Nuk ka kërkesa në pritje.</Text> : newChatsList.map(s => renderStudentItem(s, false, themeStyles))
                                    )}
                                    {activeSubFriendTab === 'incoming' && (
                                        (!incomingRequests || incomingRequests.length === 0) ? <Text style={styles.miniEmptyText}>Nuk ka kërkesa të reja.</Text> : incomingRequests.map(s => renderStudentItem(s, true, themeStyles))
                                    )}
                                </ScrollView>
                            </View>
                        ) : (
                            <View style={{ flex: 1 }}>
                                <TextInput style={[styles.searchInput, themeStyles.input]} placeholder="Shkruaj emrin e studentit..." placeholderTextColor="#A0AEC0" value={searchStudent} onChangeText={setSearchStudent} />
                                <ScrollView style={{ flex: 1, marginTop: 10 }}>
                                    {(usersList || [])
                                        .filter(s => s && s.email && typeof s.email === 'string' && formatNickname(s.email).toLowerCase().includes((searchStudent || '').toLowerCase()))
                                        .map(s => renderStudentItem(s, false, themeStyles))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {activeChatSession && (
                <View style={[styles.floatingChatWrapper, isMaximized ? styles.maximizedWindow : { bottom: chatPosition.y, right: chatPosition.x }]}>
                    <View
                        style={styles.bubbleDragHeader}
                        onMouseDown={(e) => {
                            if (!isMaximized) {
                                setIsDragging(true);
                                setDragStart({ x: e.clientX + chatPosition.x, y: e.clientY + chatPosition.y });
                            }
                        }}
                    >
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

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 15, zIndex: 999999 },
    modalContent: { width: '100%', maxWidth: 400, height: '60%', borderRadius: 16, padding: 16, borderWidth: 1, position: 'relative' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 13, fontWeight: '800' },
    modalCloseBtn: { padding: 4, backgroundColor: '#FFF5F5', borderRadius: 6 },
    modalCloseBtnTxt: { color: '#C53030', fontWeight: '700', fontSize: 11 },
    modalTabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', padding: 3, borderRadius: 8, marginVertical: 6 },
    modalTabBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
    modalTabActive: { backgroundColor: '#FFF', elevation: 1 },
    modalTabTxt: { fontSize: 11, fontWeight: '700', color: '#4A5568' },
    modalSubTabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', padding: 2.5, borderRadius: 6, marginVertical: 6, width: '100%' },
    where: { flex: 1 },
    modalSubTabBtn: { flex: 1, paddingVertical: 5, alignItems: 'center', borderRadius: 5 },
    modalSubTabActive: { backgroundColor: '#FFF', elevation: 1 },
    modalSubTabTxt: { fontSize: 10, fontWeight: '700', color: '#4A5568' },
    subSectionHeaderTitle: { fontSize: 10, fontWeight: '800', marginTop: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3, paddingHorizontal: 2 },
    miniEmptyText: { fontSize: 11, color: '#A0AEC0', paddingHorizontal: 10, fontStyle: 'italic', marginVertical: 8, textAlign: 'center' },
    searchInput: { height: 36, borderWidth: 1.2, borderRadius: 8, paddingHorizontal: 10, fontSize: 12 },

    studentSearchItemWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4, backgroundColor: 'rgba(0,0,0,0.01)', borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9', position: 'relative' },
    studentSearchItem: { flex: 1, padding: 12 },
    studentSearchName: { fontSize: 12, fontWeight: '700' },
    outsideThreeDotsBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
    outsideThreeDotsTxt: { fontSize: 16, fontWeight: '900' },

    /* STYLE-I I RI ME FLOATING Z-INDEX PA OVERFLOW HIDDEN PËR WEB */
    outsideInstagramBubble: { position: 'absolute', top: 32, right: 10, backgroundColor: '#ffffff', width: 140, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', elevation: 99, zIndex: 9999999, padding: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 6 },
    instagramRowBtn: { paddingVertical: 10, paddingHorizontal: 12, width: '100%', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', cursor: 'pointer' },

    dropdownBlueTxt: { color: '#3182CE', fontSize: 11, fontWeight: '800' },
    dropdownOrangeTxt: { color: '#DD6B20', fontSize: 11, fontWeight: '800' },
    dropdownRedTxt: { color: '#E53E3E', fontSize: 11, fontWeight: '800' },


    floatingChatWrapper: { position: 'absolute', width: 310, height: 420, backgroundColor: '#FFF', borderRadius: 14, elevation: 30, zIndex: 9999999, borderWidth: 1, borderColor: '#E2E8F0' },
    maximizedWindow: { position: 'absolute', top: '12%', left: '25%', width: '50%', height: '70%', borderRadius: 16, zIndex: 9999999 },
    bubbleDragHeader: { height: 40, backgroundColor: '#0B2545', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, cursor: 'move' },
    bubbleHeaderTitle: { color: '#FFF', fontWeight: '700', fontSize: 12, flex: 1 },
    headerControls: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    controlBtn: { padding: 2 }, controlBtnTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' }
});
