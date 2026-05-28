import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export default function NewsScreen() {
    const { user, isDarkMode } = useAuth();
    const [news, setNews] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    // SHTETI I RI PËR KËRKIMIN E LAJMEVE 🔍
    const [searchQuery, setSearchQuery] = useState('');

    const studentFaculty = user?.faculty || 'UP';

    useEffect(() => {
        const loadLocalNews = async () => {
            try {
                const storedNews = await AsyncStorage.getItem('@PrishtinaConnect:global_news');
                if (storedNews != null) {
                    setNews(JSON.parse(storedNews));
                } else {
                    const defaultNews = [
                        { id: 'n1', title: '📢 Afati i Provimeve - Qershor 2026', content: 'Njoftohen të gjithë studentët e Universitetit të Prishtinës se paraqitja e provimeve për afatin e Qershorit fillon zyrtarisht javën e ardhshme përmes sistemit SEMS.', createdAt: new Date().toISOString(), author: 'Administrata UP', faculty: 'ALL' },
                        { id: 'n2', title: '💻 Hapen aplikimet për Hackathon në FIEK', content: 'Klubi i Rrjetave organizon garën 48-orëshe për zhvillimin e aplikacioneve inovative. Fituesit do të shpërblehen me bursa ekskluzive.', createdAt: new Date().toISOString(), author: 'Dekanati FIEK', faculty: 'FIEK' }
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

    // FILTRIMI I LAJMEVE NË KOHË REALE BAZUAR NË SEARCH BAR 🔍
    const filteredNews = news.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const themeStyles = {
        container: isDarkMode ? styles.darkContainer : styles.lightContainer,
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };

    if (loading) {
        return (
            <View style={[styles.centerContainer, themeStyles.container]}>
                <ActivityIndicator size="small" color="#EEB902" />
            </View>
        );
    }

    return (
        <View style={[styles.container, themeStyles.container]}>
            {/* Kuti Postimi Luksoze */}
            <View style={[styles.postBox, themeStyles.card]}>
                <Text style={[styles.boxTitle, themeStyles.text]}>📢 Shpërndaj një Njoftim Zyrtar</Text>
                <TextInput style={[styles.input, themeStyles.input]} placeholder="Titulli i njoftimit..." placeholderTextColor="#A0AEC0" value={title} onChangeText={setTitle} />
                <TextInput style={[styles.input, themeStyles.input, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]} placeholder="Përmbajtja e detajuar..." placeholderTextColor="#A0AEC0" multiline value={content} onChangeText={setContent} />
                <TouchableOpacity style={styles.postButton} onPress={handlePostNews}>
                    <Text style={styles.postButtonText}>Publiko Lajmin ➔</Text>
                </TouchableOpacity>
            </View>

            {/* FUSHA E RE E KËRKIMIT PËR LAJMET 🔍 */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={[styles.searchInput, themeStyles.input]}
                    placeholder="🔍 Kërko njoftime (p.sh. afati, provim)..."
                    placeholderTextColor="#A0AEC0"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Feed-i i Njoftimeve */}
            <FlatList
                data={filteredNews}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 110 }}
                renderItem={({ item }) => (
                    <View style={[styles.newsCard, themeStyles.card]}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={[styles.newsTitle, themeStyles.text]}>{item.title}</Text>
                            <View style={[styles.facultyTag, item.faculty === 'ALL' ? styles.tagAll : styles.tagSpecific]}>
                                <Text style={styles.tagText}>
                                    {item.faculty === 'ALL' ? '🌎 Global' : `🏛 ${item.faculty}`}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.newsContent, isDarkMode ? styles.darkSubText : styles.lightSubText]}>{item.content}</Text>
                        <View style={styles.newsFooter}>
                            <Text style={styles.newsAuthor}>✍️ Nga: {item.author}</Text>
                            <Text style={styles.newsDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    lightContainer: { backgroundColor: '#F0F4F8' },
    darkContainer: { backgroundColor: '#1A202C' },
    lightCard: { backgroundColor: '#ffffff', borderColor: '#F0F4F8' },
    darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
    lightText: { color: '#0B2545' },
    darkText: { color: '#FFFFFF' },
    lightSubText: { color: '#4A5568' },
    darkSubText: { color: '#CBD5E0' },
    lightInput: { backgroundColor: '#F8FAFC', color: '#0B2545', borderColor: '#E2E8F0' },
    darkInput: { backgroundColor: '#1A202C', color: '#FFFFFF', borderColor: '#4A5568' },

    container: { flex: 1, padding: 14 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    postBox: { padding: 16, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.02, elevation: 2, marginBottom: 15, borderWidth: 1 },
    boxTitle: { fontSize: 11, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
    input: { height: 42, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, marginBottom: 10, fontSize: 13, fontWeight: '500' },
    postButton: { backgroundColor: '#0B2545', height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    postButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

    // Stili i Search Bar-it
    searchContainer: { marginBottom: 12, width: '100%' },
    searchInput: { width: '100%', height: 40, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, fontSize: 13, fontWeight: '500' },

    newsCard: { padding: 18, borderRadius: 20, marginVertical: 6, shadowColor: '#000', shadowOpacity: 0.02, elevation: 2, borderWidth: 1 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 },
    newsTitle: { fontSize: 14, fontWeight: '800', flex: 1, lineHeight: 19 },
    facultyTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    tagAll: { backgroundColor: '#E6FFFA' },
    tagSpecific: { backgroundColor: '#EBF8FF' },
    tagText: { fontSize: 9, fontWeight: '700', color: '#2B6CB0' },
    newsContent: { fontSize: 13, lineHeight: 19, marginBottom: 12, fontWeight: '500' },
    newsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F4F8', paddingTop: 8 },
    newsAuthor: { fontSize: 11, color: '#718096', fontWeight: '700' },
    newsDate: { fontSize: 10, color: '#A0AEC0', fontWeight: '700' }
});
