import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { dbInstance } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';

export default function ChannelsScreen({ onSelectChannel }) {
    const [channels, setChannels] = useState([]);
    const [newChannelName, setNewChannelName] = useState('');

    useEffect(() => {
        const q = query(collection(dbInstance, 'channels'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setChannels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, () => {
            setChannels([
                { id: '1', name: 'FIEK-Viti-1' },
                { id: '2', name: 'FIEK-Algoritmet' },
                { id: '3', name: 'Diskutime-UP' }
            ]);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;
        try {
            await addDoc(collection(dbInstance, 'channels'), { name: newChannelName.trim() });
            setNewChannelName('');
        } catch (err) {
            setChannels([...channels, { id: Date.now().toString(), name: newChannelName.trim() }]);
            setNewChannelName('');
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.createChannelBox}>
                <TextInput
                    style={styles.channelInput}
                    placeholder="Krijo kanal (p.sh. FIEK-Algoritmet)"
                    placeholderTextColor="#A0AEC0"
                    value={newChannelName}
                    onChangeText={setNewChannelName}
                />
                <TouchableOpacity style={styles.addChannelButton} onPress={handleCreateChannel}>
                    <Text style={styles.addChannelText}>+ Shto</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={channels}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.channelItem} onPress={() => onSelectChannel(item)}>
                        <Text style={styles.channelHash}>#</Text>
                        <Text style={styles.channelName}>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    createChannelBox: { flexDirection: 'row', padding: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    channelInput: { flex: 1, height: 40, borderColor: '#CBD5E0', borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 12, color: '#0B2545' },
    addChannelButton: { marginLeft: 10, backgroundColor: '#0B2545', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 6 },
    addChannelText: { color: '#ffffff', fontWeight: 'bold' },
    channelItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, marginVertical: 4, marginHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    channelHash: { fontSize: 18, fontWeight: 'bold', color: '#EEB902', marginRight: 10 },
    channelName: { fontSize: 16, color: '#0B2545', fontWeight: '600' }
});