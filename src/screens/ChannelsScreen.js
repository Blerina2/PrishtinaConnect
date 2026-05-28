import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ChannelsScreen({ onSelectChannel }) {
    const { user, isDarkMode } = useAuth();
    const [channels, setChannels] = useState([]);
    const [newChannelName, setNewChannelName] = useState('');

    // SHTETET E REJA PËR KËRKIMIN (SEARCH)
    const [searchChannel, setSearchChannel] = useState('');
    const [searchStudent, setSearchStudent] = useState('');

    const studentFaculty = user?.faculty || 'FIEK';

    const channelsDemo = [
        { id: 'ch1', name: 'Rrjeta Kompjuterike', allowedDepartment: 'FIEK' },
        { id: 'ch2', name: 'Inxhinieri Softuerike', allowedDepartment: 'FIEK' },
        { id: 'ch3', name: 'Matematika 1', allowedDepartment: 'FSHMN' },
        { id: 'ch4', name: 'Menaxhment dhe Ndërmarrësi', allowedDepartment: 'Ekonomik' },
        { id: 'ch6', name: 'Kontabilitet Financiar', allowedDepartment: 'Ekonomik' },
        { id: 'ch9', name: 'Njoftime të Përgjithshme UP', allowedDepartment: 'ALL' }
    ];

    const studentsDemo = [
        { id: 'dm_blerand', name: '👤 Blerand Krasniqi', faculty: 'FIEK', status: 'Online 🟢' },
        { id: 'dm_erza', name: '👤 Erza Gashi', faculty: 'Ekonomik', status: 'Online 🟢' },
        { id: 'dm_artan', name: '👤 Artan Hoxha', faculty: 'FSHMN', status: 'Offline 🔴' },
        { id: 'dm_genta', name: '👤 Genta Loxha', faculty: 'Mjekësi', status: 'Online 🟢' }
    ];

    useEffect(() => {
        const filtered = channelsDemo.filter(ch =>
            ch.allowedDepartment === studentFaculty || ch.allowedDepartment === 'ALL'
        );
        setChannels(filtered);
    }, [studentFaculty, user]);

    const handleCreateChannel = () => {
        if (!newChannelName.trim()) return;

        const newCh = {
            id: 'new_' + Date.now(),
            name: newChannelName.trim(),
            allowedDepartment: studentFaculty
        };

        setChannels(prev => [...prev, newCh]);
        setNewChannelName('');
        Alert.alert('Sukses 🎉', `Kanali u krijua për fakultetin [${studentFaculty}].`);
    };

    // LOGJIKA E FILTRIMIT NË KOHË REALE PËR SEARCH BAR
    const searchedChannels = channels.filter(ch =>
        ch.name.toLowerCase().includes(searchChannel.toLowerCase())
    );

    const searchedStudents = studentsDemo.filter(st =>
        st.name.toLowerCase().includes(searchStudent.toLowerCase())
    );

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
        subText: isDarkMode ? styles.darkSubText : styles.lightSubText,
    };

    return (
        <ScrollView style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]} contentContainerStyle={{ paddingBottom: 110 }}>

            {/* Krijimi i Kanaleve */}
            <View style={[styles.createChannelBox, themeStyles.card]}>
                <Text style={[styles.boxTitle, themeStyles.subText]}>Krijo kanal të ri në {studentFaculty}</Text>
                <View style={styles.inputActionRow}>
                    <TextInput
                        style={[styles.channelInput, themeStyles.input]}
                        placeholder="Emri i lëndës së re..."
                        placeholderTextColor="#A0AEC0"
                        value={newChannelName}
                        onChangeText={setNewChannelName}
                    />
                    <TouchableOpacity style={styles.addChannelButton} onPress={handleCreateChannel} activeOpacity={0.9}>
                        <Text style={styles.addChannelText}>+ Krijo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ================= FUSHA E KËRKIMIT PËR LËNDËT 🔍 ================= */}
            <Text style={[styles.sectionTitle, themeStyles.text]}>🏛 Kanalet e Fakultetit Tënd</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchInput, themeStyles.input]}
                    placeholder="🔍 Kërko lëndën sipas emrit..."
                    placeholderTextColor="#A0AEC0"
                    value={searchChannel}
                    onChangeText={setSearchChannel}
                />
            </View>

            {searchedChannels.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.channelItem, themeStyles.card]} onPress={() => onSelectChannel(item)} activeOpacity={0.8}>
                    <View style={[styles.hashCircle, isDarkMode ? styles.darkHash : styles.lightHash]}>
                        <Text style={styles.channelHash}>#</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.channelName, themeStyles.text]}>{item.name}</Text>
                        <View style={[styles.badgeContainer, item.allowedDepartment === 'ALL' ? styles.badgePublic : styles.badgePrivate]}>
                            <Text style={[styles.lockBadge, item.allowedDepartment === 'ALL' ? styles.textPublic : styles.textPrivate]}>
                                {item.allowedDepartment === 'ALL' ? '🔓 Publik për UP' : `🏛 ${item.allowedDepartment}`}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.arrowIcon}>➔</Text>
                </TouchableOpacity>
            ))}

            {/* ================= FUSHA E KËRKIMIT PËR MESSENGER-IN 🔍 ================= */}
            <Text style={[styles.sectionTitle, themeStyles.text, { marginTop: 25 }]}>💬 Mesazhet Private (Direct Messages)</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchInput, themeStyles.input]}
                    placeholder="🔍 Kërko studentët sipas emrit..."
                    placeholderTextColor="#A0AEC0"
                    value={searchStudent}
                    onChangeText={setSearchStudent}
                />
            </View>

            {searchedStudents.map((student) => (
                <TouchableOpacity
                    key={student.id}
                    style={[styles.channelItem, themeStyles.card, { borderLeftWidth: 4, borderLeftColor: '#EEB902' }]}
                    onPress={() => onSelectChannel({ id: student.id, name: `Bisedë Private me ${student.name.replace('👤 ', '')}` })}
                    activeOpacity={0.8}
                >
                    <View style={[styles.hashCircle, isDarkMode ? styles.darkHash : styles.lightHash]}>
                        <Text style={{ fontSize: 16 }}>💬</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.channelName, themeStyles.text]}>{student.name}</Text>
                        <Text style={[styles.studentSubText, themeStyles.subText]}>🏛 {student.faculty} • <Text style={{fontWeight: '700'}}>{student.status}</Text></Text>
                    </View>
                    <Text style={styles.arrowIcon}>➔</Text>
                </TouchableOpacity>
            ))}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    lightBg: { backgroundColor: '#F0F4F8' },
    darkBg: { backgroundColor: '#1A202C' },
    lightCard: { backgroundColor: '#ffffff', borderColor: '#F0F4F8' },
    darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
    lightText: { color: '#0B2545' },
    darkText: { color: '#FFFFFF' },
    lightSubText: { color: '#4A5568' },
    darkSubText: { color: '#A0AEC0' },
    lightInput: { backgroundColor: '#F8FAFC', color: '#0B2545', borderColor: '#E2E8F0' },
    darkInput: { backgroundColor: '#1A202C', color: '#FFFFFF', borderColor: '#4A5568' },
    lightHash: { backgroundColor: '#F0F4F8' },
    darkHash: { backgroundColor: '#1A202C' },

    createChannelBox: { padding: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#000', shadowOpacity: 0.02, elevation: 3, marginBottom: 15, borderWidth: 1 },
    boxTitle: { fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
    inputActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    channelInput: { flex: 1, height: 44, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, marginRight: 10, fontWeight: '500' },
    addChannelButton: { backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', height: 44, paddingHorizontal: 18, borderRadius: 12, borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    addChannelText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

    // Stili i ri për Search Bar Box
    searchContainer: { paddingHorizontal: 16, marginBottom: 10, width: '100%' },
    searchInput: { width: '100%', height: 40, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, fontSize: 13, fontWeight: '500' },

    sectionTitle: { fontSize: 13, fontWeight: '800', marginHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
    channelItem: { flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16, marginVertical: 5, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.01, elevation: 2, borderWidth: 1 },
    hashCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    channelHash: { fontSize: 18, fontWeight: '800', color: '#EEB902' },
    channelName: { fontSize: 14, fontWeight: '700' },
    studentSubText: { fontSize: 11, marginTop: 2 },
    badgeContainer: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
    badgePublic: { backgroundColor: '#E6FFFA' },badgePrivate: { backgroundColor: '#EBF8FF' },
    lockBadge: { fontSize: 10, fontWeight: '700' },textPublic: { color: '#319795' },
    textPrivate: { color: '#2B6CB0' },arrowIcon: { fontSize: 13, color: '#A0AEC0', fontWeight: '700' }
});