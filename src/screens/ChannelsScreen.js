import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { dbInstance } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';

export default function ChannelsScreen({ onSelectChannel }) {
    const [channels, setChannels] = useState([]);
    const [newChannelName, setNewChannelName] = useState('');
    const [targetDept, setTargetDept] = useState('');
    const [loading, setLoading] = useState(true);

    // Profili zyrtar lokal i studentit për mbrojtjen e bisedës
    const currentStudentProfile = {
        email: 'blerina.beka@uni-pr.edu',
        department: 'IT-Network'
    };

    useEffect(() => {
        // Tërheqja e listës zyrtare të kanaleve nga serveri në kohë reale
        const q = query(collection(dbInstance, 'channels'), orderBy('name', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const channelList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setChannels(channelList);
            setLoading(false);
        }, (err) => {
            console.log("Gabim gjatë ngarkimit të kanaleve: ", err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCreateChannel = async () => {
        if (!newChannelName.trim()) return;

        const channelObj = {
            name: newChannelName.trim(),
            allowedDepartment: targetDept.trim() || 'ALL'
        };

        try {
            // Ruajtja përfundimtare në serverin cloud të Firebase
            await addDoc(collection(dbInstance, 'channels'), channelObj);
            setNewChannelName('');
            setTargetDept('');
        } catch (err) {
            console.log("Gabim gjatë shkrimit të kanalit: ", err.message);
        }
    };

    const handleChannelClick = (channel) => {
        // Kontrolli strikt i autorizimit sipas departamentit të studentit
        if (channel.allowedDepartment !== 'ALL' && channel.allowedDepartment !== currentStudentProfile.department) {
            Alert.alert(
                'Qasja u Refuzua 🔒',
                `Ky kanal është ekskluziv për departamentin [${channel.allowedDepartment}]. Ju si student i [${currentStudentProfile.department}] nuk keni autorizim qasjeje.`
            );
            return;
        }
        onSelectChannel(channel);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="small" color="#0B2545" />
                <Text style={styles.loadingText}>Duke u lidhur me serverin e UP-së...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.createChannelBox}>
                <TextInput style={styles.channelInput} placeholder="Emri i klubit/lëndës (p.sh. IT-Network)" placeholderTextColor="#A0AEC0" value={newChannelName} onChangeText={setNewChannelName} />
                <TextInput style={[styles.channelInput, { marginTop: 8 }]} placeholder="Departamenti i autorizuar (p.sh. IT-Network)" placeholderTextColor="#A0AEC0" value={targetDept} onChangeText={setTargetDept} />
                <TouchableOpacity style={styles.addChannelButton} onPress={handleCreateChannel}>
                    <Text style={styles.addChannelText}>+ Krijoni Kanal të Ruajtur në Cloud</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={channels}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.channelItem} onPress={() => handleChannelClick(item)}>
                        <Text style={styles.channelHash}>#</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.channelName}>{item.name}</Text>
                            <Text style={styles.lockBadge}>
                                {item.allowedDepartment === 'ALL' ? '🔓 Publik' : `🔒 Vetëm për: ${item.allowedDepartment}`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#0B2545', fontSize: 13, fontWeight: '500' },
    createChannelBox: { padding: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    channelInput: { height: 40, borderColor: '#CBD5E0', borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 12, color: '#0B2545', backgroundColor: '#F9FAFB' },
    addChannelButton: { backgroundColor: '#0B2545', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 6, marginTop: 8, borderBottomWidth: 3, borderBottomColor: '#EEB902' },
    addChannelText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
    channelItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, marginVertical: 4, marginHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    channelHash: { fontSize: 18, fontWeight: 'bold', color: '#EEB902', marginRight: 12 },
    channelName: { fontSize: 16, color: '#0B2545', fontWeight: '600' },
    lockBadge: { fontSize: 11, color: '#718096', marginTop: 2, fontWeight: '500' }
});