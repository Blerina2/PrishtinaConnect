import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';

export default function ClubsScreen() {
    const [clubs, setClubs] = useState([
        { id: '1', name: '🚀 FIEK Coders Club', members: 42, desc: 'Grupi zyrtar i studentëve të pasionuar pas programimit dhe inxhinierisë softuerike.' },
        { id: '2', name: '⚖ Këshilli i Studentëve - UP', members: 120, desc: 'Përfaqësimi zyrtar studentor për mbrojtjen e të drejtave tona akademike.' },
        { id: '3', name: '🤖 UP Robotics & AI Team', members: 28, desc: 'Zhvillimi i projekteve inovative në fushën e automatizimit dhe Inteligjencës Artificiale.' }
    ]);

    const handleJoinClub = (clubName) => {
        Alert.alert('Sukses', `Ju jeni bashkuar me sukses në klubin: ${clubName}`);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Klubet Studentore të UP-së</Text>
            <FlatList
                data={clubs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.clubCard}>
                        <Text style={styles.clubName}>{item.name}</Text>
                        <Text style={styles.clubDesc}>{item.desc}</Text>
                        <View style={styles.clubFooter}>
                            <Text style={styles.memberCount}>👤 {item.members} Studentë</Text>
                            <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinClub(item.name)}>
                                <Text style={styles.joinButtonText}>Bashkohu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F9', padding: 15 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#0B2545', marginBottom: 15 },
    clubCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 10, marginVertical: 6, borderWidth: 1, borderColor: '#E2E8F0' },
    clubName: { fontSize: 16, fontWeight: 'bold', color: '#0B2545', marginBottom: 6 },
    clubDesc: { fontSize: 13, color: '#4A5568', lineHeight: 18, marginBottom: 12 },
    clubFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F4F6F9', paddingTop: 10 },
    memberCount: { fontSize: 12, color: '#718096', fontWeight: '600' },
    joinButton: { backgroundColor: '#0B2545', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
    joinButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 }
});