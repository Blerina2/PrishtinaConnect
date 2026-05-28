import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export default function NewsScreen() {
    const { user } = useAuth();
    const [news, setNews] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    const studentFaculty = user?.faculty || 'UP';

    // 1. NGARKIMI I LAJMEVE NGA MEMORJA LOKALE
    useEffect(() => {
        const loadLocalNews = async () => {
            try {
                const storedNews = await AsyncStorage.getItem('@PrishtinaConnect:global_news');
                if (storedNews != null) {
                    setNews(JSON.parse(storedNews));
                } else {
                    // Lajme fillestare demo shumë të bukura që të mos jetë faqja e zbrazët
                    const defaultNews = [
                        { id: 'n1', title: '📢 Afati i Provimeve - Qershor 2026', content: 'Njoftohen të gjithë studentët e Universitetit të Prishtinës se paraqitja e provimeve për afatin e Qershorit fillon zyrtarisht javën e ardhshme përmes sistemit SEMS.', createdAt: new Date().toISOString(), author: 'Administrata UP', faculty: 'ALL' },
                        { id: 'n2', title: '💻 Hapen aplikimet për Hackathon në FIEK', content: 'Klubi i Rrjetave dhe Inxhinierisë Softuerike organizon garën 48-orëshe për zhvillimin e aplikacioneve inovative. Fituesit do të shpërblehen me bursa ekskluzive.', createdAt: new Date().toISOString(), author: 'Dekanati FIEK', faculty: 'FIEK' }
                    ];
                    setNews(defaultNews);
                }
            } catch (e) {
                console.log("Gabim leximi lajmesh:", e);
            } finally {
                setLoading(false);
            }
        };
        loadLocalNews();
    }, []);

    // 2. KRIJIMI I NJË LAJMI TË RI AUTOMATIK
    const handlePostNews = async () => {
        if (!title.trim() || !content.trim()) return;
        Keyboard.dismiss();

        const newsObj = {
            id: 'news_' + Date.now(),
            title: title.trim(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
            author: user?.email ? user.email.split('@')[0] : 'Student',
            faculty: studentFaculty
        };

        const updatedNews = [newsObj, ...news];

        try {
            await AsyncStorage.setItem('@PrishtinaConnect:global_news', JSON.stringify(updatedNews));
            setNews(updatedNews);
            setTitle('');
            setContent('');
            Alert.alert('Sukses 🎉', 'Njoftimi zyrtar u shpërnda me sukses në portal!');
        } catch (err) {
            console.log("Gabim gjatë ruajtjes së lajmit:", err);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="small" color="#0B2545" />
                <Text style={styles.loadingText}>Duke sinkronizuar lajmet me portalin...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Kuti Postimi Luksoze */}
            <View style={styles.postBox}>
                <Text style={styles.boxTitle}>📢 Shpërndaj një Njoftim Zyrtar</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Titulli i njoftimit (p.sh. Anulimi i ligjëratës)..."
                    placeholderTextColor="#A0AEC0"
                    value={title}
                    onChangeText={setTitle}
                />
                <TextInput
                    style={[styles.input, { height: 65, textAlignVertical: 'top', paddingTop: 10 }]}
                    placeholder="Përmbajtja e detajuar e njoftimit studentor..."
                    placeholderTextColor="#A0AEC0"
                    multiline
                    value={content}
                    onChangeText={setContent}
                />
                <TouchableOpacity style={styles.postButton} onPress={handlePostNews} activeOpacity={0.8}>
                    <Text style={styles.postButtonText}>Publiko Lajmin ➔</Text>
                </TouchableOpacity>
            </View>

            {/* Lista e Lajmeve si Feed Reviste */}
            <FlatList
                data={news}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 110 }} // Lihet hapësirë që mos ta zë menuja lundruese
                renderItem={({ item }) => (
                    <View style={styles.newsCard}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.newsTitle}>{item.title}</Text>
                            <View style={[styles.facultyTag, item.faculty === 'ALL' ? styles.tagAll : styles.tagSpecific]}>
                                <Text style={styles.tagText}>
                                    {item.faculty === 'ALL' ? '🌎 Global' : `🏛 ${item.faculty}`}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.newsContent}>{item.content}</Text>
                        <View style={styles.newsFooter}>
                            <Text style={styles.newsAuthor}>✍️ Nga: {item.author}</Text>
                            <Text style={styles.newsDate}>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8', padding: 14 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4F8' },
    loadingText: { marginTop: 8, color: '#0B2545', fontSize: 13, fontWeight: '600' },
    postBox: { backgroundColor: '#ffffff', padding: 16, borderRadius: 20, shadowColor: '#1A365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, marginBottom: 15 },
    boxTitle: { fontSize: 12, fontWeight: '700', color: '#4A5568', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { height: 44, borderColor: '#E2E8F0', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, marginBottom: 10, color: '#0B2545', backgroundColor: '#F8FAFC', fontSize: 13, fontWeight: '500' },
    postButton: { backgroundColor: '#0B2545', height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#EEB902', marginTop: 4 },
    postButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

    // Stilet e reja luksoze për Kartelën e Lajmeve
    newsCard: { backgroundColor: '#ffffff', padding: 18, borderRadius: 20, marginVertical: 8, shadowColor: '#1A365D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#F0F4F8' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 },
    newsTitle: { fontSize: 15, fontWeight: '800', color: '#0B2545', flex: 1, letterSpacing: -0.3, lineHeight: 20 },
    facultyTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    tagAll: { backgroundColor: '#E6FFFA' },
    tagSpecific: { backgroundColor: '#EBF8FF' },
    tagText: { fontSize: 10, fontWeight: '700', color: '#2B6CB0' },
    newsContent: { fontSize: 13, color: '#4A5568', lineHeight: 20, fontWeight: '500', marginBottom: 14 },
    newsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F4F8', paddingTop: 10 },
    newsAuthor: { fontSize: 11, color: '#718096', fontWeight: '700' },
    newsDate: { fontSize: 10, color: '#A0AEC0', fontWeight: '700' }
});
