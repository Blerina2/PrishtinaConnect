import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Alert, Keyboard, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export default function MaterialsScreen() {
    const { user, isDarkMode } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [selectedTag, setSelectedTag] = useState('Material');
    const [loading, setLoading] = useState(true);

    const studentFaculty = user?.faculty || 'UP';

    const tags = [
        { id: 'Material', icon: '🔗' },
        { id: 'Detyrë', icon: '📝' },
        { id: 'Provim', icon: '📚' },
        { id: 'Njoftim', icon: '📢' }
    ];

    useEffect(() => {
        const loadLocalMaterials = async () => {
            try {
                const stored = await AsyncStorage.getItem(`@PrishtinaConnect:materials:${user?.email}`);
                let loadedMaterials = [];

                if (stored != null) {
                    loadedMaterials = JSON.parse(stored);
                } else {
                    // LINKU YT I VËRTETË: Vendoset si material fillestar
                    loadedMaterials = [
                        {
                            id: 'mat_fiek_drive',
                            content: 'Koleksioni zyrtar i materialeve dhe ligjëratave të FIEK në Google Drive.',
                            tag: 'Material',
                            linkUrl: 'https://google.com',
                            faculty: 'FIEK', // Mbrohet në nivel fakulteti
                            createdAt: new Date().toISOString()
                        }
                    ];
                }

                // KORRIGJIMI: Filtrojmë materialet në kohë reale (Studenti i FIEK-ut e sheh, të tjerët jo)
                const filteredMaterials = loadedMaterials.filter(mat =>
                    !mat.faculty || mat.faculty === studentFaculty || mat.faculty === 'ALL'
                );

                setMaterials(filteredMaterials);
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        };
        if (user?.email) loadLocalMaterials();
    }, [user, studentFaculty]);

    const extractUrl = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = text.match(urlRegex);
        return match ? match : null;
    };

    const handleCreateMaterial = async () => {
        if (!newContent.trim()) return;
        Keyboard.dismiss();

        const detectedUrl = extractUrl(newContent);

        const matObj = {
            id: 'mat_' + Date.now(),
            content: newContent.trim(),
            tag: selectedTag,
            linkUrl: detectedUrl,
            faculty: studentFaculty, // Çdo material i ri që krijohet, izolohet për këtë fakultet
            createdAt: new Date().toISOString()
        };

        const updated = [matObj, ...materials];
        try {
            await AsyncStorage.setItem(`@PrishtinaConnect:materials:${user?.email}`, JSON.stringify(updated));
            setMaterials(updated);
            setNewContent('');
            Alert.alert('Sukses 🎉', `Burimi akademik u nda vetëm për përdoruesit e [${studentFaculty}].`);
        } catch (err) {
            console.log(err);
        }
    };

    const handleOpenLink = (url) => {
        Linking.openURL(url).catch(() => Alert.alert("Gabim", "Nuk mund të hapet ky link."));
    };

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };

    if (loading) {
        return (
            <View style={[styles.center, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
                <ActivityIndicator size="small" color="#EEB902" />
            </View>
        );
    }

    return (
        <View style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
            <Text style={[styles.title, themeStyles.text]}>Hapësira e Burimeve [{studentFaculty}]</Text>

            <View style={[styles.createBox, themeStyles.card]}>
                <Text style={styles.miniTitle}>Zgjedh Kategorinë:</Text>
                <View style={styles.tagSelectorRow}>
                    {tags.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            style={[styles.tagBadgeButton, selectedTag === t.id && styles.tagBadgeActive]}
                            onPress={() => setSelectedTag(t.id)}
                        >
                            <Text style={styles.tagBadgeText}>{t.icon} {t.id}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={[styles.postInput, themeStyles.input]}
                    placeholder="Shkruaj njoftimin ose shto një link akademik..."
                    placeholderTextColor="#A0AEC0"
                    multiline
                    value={newContent}
                    onChangeText={setNewContent}
                />
                <TouchableOpacity style={styles.postButton} onPress={handleCreateMaterial} activeOpacity={0.8}>
                    <Text style={styles.postButtonText}>Shpërndaj në {studentFaculty} ➔</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={materials}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 110 }}
                renderItem={({ item }) => (
                    <View style={[styles.postCard, themeStyles.card]}>
                        <View style={styles.postCardHeader}>
                            <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            <View style={styles.activeTagBadge}>
                                <Text style={styles.activeTagText}>#{item.tag}</Text>
                            </View>
                        </View>
                        <Text style={[styles.postContent, themeStyles.text]}>{item.content}</Text>
                        {item.linkUrl ? (
                            <TouchableOpacity style={styles.linkCard} onPress={() => handleOpenLink(item.linkUrl)} activeOpacity={0.8}>
                                <Text style={styles.linkCardIcon}>🔗</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.linkCardTitle}>Hap Drive-in e Materialeve</Text>
                                    <Text style={styles.linkCardUrl} numberOfLines={1}>{item.linkUrl}</Text>
                                </View>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 14 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    lightContainer: { backgroundColor: '#F0F4F8' },
    darkContainer: { backgroundColor: '#1A202C' },
    lightCard: { backgroundColor: '#ffffff', borderColor: '#F0F4F8' },
    darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
    lightText: { color: '#0B2545' },
    darkText: { color: '#FFFFFF' },
    lightInput: { backgroundColor: '#F8FAFC', color: '#0B2545', borderColor: '#E2E8F0' },
    darkInput: { backgroundColor: '#1A202C', color: '#FFFFFF', borderColor: '#4A5568' },
    title: { fontSize: 18, fontWeight: '800', marginVertical: 12, letterSpacing: -0.4 },
    createBox: { padding: 14, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.03, elevation: 2, marginBottom: 15, borderWidth: 1 },
    miniTitle: { fontSize: 11, fontWeight: '700', color: '#718096', marginBottom: 8, textTransform: 'uppercase' },
    tagSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, width: '100%' },
    tagBadgeButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F0F4F8', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    tagBadgeActive: { backgroundColor: '#EEB902', borderColor: '#EEB902' },
    tagBadgeText: { fontSize: 11, fontWeight: '700', color: '#0B2545' },
    postInput: { height: 55, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontWeight: '500' },
    postButton: { backgroundColor: '#0B2545', height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    postButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
    postCard: { width: '100%', padding: 14, borderRadius: 16, marginVertical: 5, borderWidth: 1 },
    postCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    postDate: { fontSize: 10, color: '#A0AEC0', fontWeight: '700' },
    activeTagBadge: { backgroundColor: '#EBF8FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    activeTagText: { fontSize: 10, fontWeight: '700', color: '#2B6CB0' },
    postContent: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
    linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, borderLeftColor: '#0B2545' },
    linkCardIcon: { fontSize: 16, marginRight: 10 },
    linkCardTitle: { fontSize: 12, fontWeight: '700', color: '#0B2545' },
    linkCardUrl: { fontSize: 11, color: '#3182CE', marginTop: 1, textDecorationLine: 'underline' }
});