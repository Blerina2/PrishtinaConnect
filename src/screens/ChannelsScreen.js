import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ChannelsScreen({ onSelectChannel }) {
    const { user, isDarkMode } = useAuth();
    const [channels, setChannels] = useState([]);
    const [newChannelName, setNewChannelName] = useState('');
    const [loading, setLoading] = useState(false);

    const studentFaculty = user?.faculty || 'FIEK';

    const channelsDemo = [
        { id: 'ch1', name: 'Rrjeta Kompjuterike', allowedDepartment: 'FIEK' },
        { id: 'ch2', name: 'Inxhinieri Softuerike', allowedDepartment: 'FIEK' },
        { id: 'ch3', name: 'Matematika 1', allowedDepartment: 'FSHMN' },
        { id: 'ch4', name: 'Laboratori i Fizikës', allowedDepartment: 'FSHMN' },
        { id: 'ch5', name: 'Menaxhment dhe Ndërmarrësi', allowedDepartment: 'Ekonomik' },
        { id: 'ch6', name: 'Kontabilitet Financiar', allowedDepartment: 'Ekonomik' },
        { id: 'ch7', name: 'Anatomia e Njeriut', allowedDepartment: 'Mjekësi' },
        { id: 'ch8', name: 'Teoria e Stërvitjes', allowedDepartment: 'DIF' },
        { id: 'ch9', name: 'Njoftime të Përgjithshme UP', allowedDepartment: 'ALL' }
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

    // Stilet dinamike të temës
    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };

    return (
        <View style={styles.container}>
            {/* Box-i i Krijimit */}
            <View style={[styles.createChannelBox, themeStyles.card]}>
                <Text style={[styles.boxTitle, isDarkMode ? styles.darkSubText : styles.lightSubText]}>Krijo kanal të ri në {studentFaculty}</Text>
                <View style={styles.inputActionRow}>
                    <TextInput
                        style={[styles.channelInput, themeStyles.input]}
                        placeholder="Emri i lëndës (p.sh. Lënda-Re)..."
                        placeholderTextColor="#A0AEC0"
                        value={newChannelName}
                        onChangeText={setNewChannelName}
                    />
                    <TouchableOpacity style={styles.addChannelButton} onPress={handleCreateChannel} activeOpacity={0.9}>
                        <Text style={styles.addChannelText}>+ Krijo</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Lista e Kanaleve */}
            <FlatList
                data={channels}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.channelItem, themeStyles.card]} onPress={() => onSelectChannel(item)} activeOpacity={0.8}>
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
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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

    createChannelBox: { padding: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#000', shadowOpacity: 0.02, elevation: 3, marginBottom: 10, borderWidth: 1 },
    boxTitle: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
    inputActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    channelInput: { flex: 1, height: 44, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, fontSize: 14, marginRight: 10, fontWeight: '500' },
    addChannelButton: { backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', height: 44, paddingHorizontal: 18, borderRadius: 12, borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    addChannelText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
    listContainer: { paddingHorizontal: 16, paddingBottom: 110 },
    channelItem: { flexDirection: 'row', alignItems: 'center', padding: 16, marginVertical: 6, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.02, elevation: 2, borderWidth: 1 },
    hashCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    channelHash: { fontSize: 18, fontWeight: '800', color: '#EEB902' },
    channelName: { fontSize: 15, fontWeight: '700' },
    badgeContainer: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 5 },
    badgePublic: { backgroundColor: '#E6FFFA' },
    badgePrivate: { backgroundColor: '#EBF8FF' },
    lockBadge: { fontSize: 11, fontWeight: '700' },
    textPublic: { color: '#319795' },
    textPrivate: { color: '#2B6CB0' },
    arrowIcon: { fontSize: 14, color: '#A0AEC0', fontWeight: '700' }
});
