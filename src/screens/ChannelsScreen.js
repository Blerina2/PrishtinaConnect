import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ChannelsScreen({ onSelectChannel }) {
    const { user } = useAuth();
    const [channels, setChannels] = useState([]);
    const [newChannelName, setNewChannelName] = useState('');
    const [loading, setLoading] = useState(false);

    const studentFaculty = user?.faculty || 'FIEK';

    // Lista e kanaleve demo që shfaqen në mënyrë inteligjente sipas Fakultetit
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
        // Filtrimi automatik në pajisje pa pasur nevojë për server
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

    return (
        <View style={styles.container}>
            <View style={styles.createChannelBox}>
                <Text style={styles.boxTitle}>Krijo kanal të ri në {studentFaculty}</Text>
                <View style={styles.inputActionRow}>
                    <TextInput
                        style={styles.channelInput}
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

            <FlatList
                data={channels}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.channelItem} onPress={() => onSelectChannel(item)} activeOpacity={0.8}>
                        <View style={styles.hashCircle}>
                            <Text style={styles.channelHash}>#</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.channelName}>{item.name}</Text>
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
    container: { flex: 1, backgroundColor: '#F0F4F8' },
    createChannelBox: { padding: 16, backgroundColor: '#ffffff', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#1A365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 10 },
    boxTitle: { fontSize: 12, fontWeight: '700', color: '#4A5568', marginBottom: 8, textTransform: 'uppercase' },
    inputActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    channelInput: { flex: 1, height: 44, borderColor: '#E2E8F0', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, color: '#0B2545', backgroundColor: '#F8FAFC', fontSize: 14, marginRight: 10, fontWeight: '500' },
    addChannelButton: { backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', height: 44, paddingHorizontal: 18, borderRadius: 12, borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    addChannelText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
    listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
    channelItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, marginVertical: 6, borderRadius: 16, shadowColor: '#1A365D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
    hashCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    channelHash: { fontSize: 18, fontWeight: '800', color: '#EEB902' },
    channelName: { fontSize: 15, color: '#0B2545', fontWeight: '700' },
    badgeContainer: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 5 },
    badgePublic: { backgroundColor: '#E6FFFA' },
    badgePrivate: { backgroundColor: '#EBF8FF' },
    lockBadge: { fontSize: 11, fontWeight: '700' },
    textPublic: { color: '#319795' },
    textPrivate: { color: '#2B6CB0' },
    arrowIcon: { fontSize: 14, color: '#A0AEC0', fontWeight: '700' }
});
