import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { dbInstance } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';

export default function NewsScreen() {
    const [news, setNews] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        const q = query(collection(dbInstance, 'news'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, () => {
            // Lajme statike shembull për Demo nëse jemi offline
            setNews([
                { id: '1', title: 'Afati i Qershorit 2026', content: 'Njoftohen studentët e FIEK se paraqitja e provimeve fillon me datë 1 qershor.', author: 'Dekanati' },
                { id: '2', title: 'Anulim i ligjëratës', content: 'Ligjërata në lëndën Programim në Internet anulohet për këtë javë.', author: 'Prof. FIEK' }
            ]);
        });
        return () => unsubscribe();
    }, []);

    const handlePostNews = async () => {
        if (!title.trim() || !content.trim()) return;
        const newsObj = { title: title.trim(), content: content.trim(), createdAt: new Date().toISOString(), author: 'Blerina Beka' };
        try {
            await addDoc(collection(dbInstance, 'news'), newsObj);
            setTitle(''); setContent('');
        } catch (err) {
            setNews([newsObj, ...news]);
            setTitle(''); setContent('');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.postBox}>
                <Text style={styles.boxTitle}>📢 Posto një Njoftim/Lajm</Text>
                <TextInput style={styles.input} placeholder="Titulli i lajmit..." placeholderTextColor="#A0AEC0" value={title} onChangeText={setTitle} />
                <TextInput style={[styles.input, { height: 60 }]} placeholder="Përmbajtja e njoftimit..." placeholderTextColor="#A0AEC0" multiline value={content} onChangeText={setContent} />
                <TouchableOpacity style={styles.postButton} onPress={handlePostNews}>
                    <Text style={styles.postButtonText}>Shpërndaj Lajmin</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={news}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.newsCard}>
                        <Text style={styles.newsTitle}>{item.title}</Text>
                        <Text style={styles.newsContent}>{item.content}</Text>
                        <View style={styles.newsFooter}>
                            <Text style={styles.newsAuthor}>Nga: {item.author}</Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F9', padding: 12 },
    postBox: { backgroundColor: '#ffffff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
    boxTitle: { fontSize: 15, fontWeight: 'bold', color: '#0B2545', marginBottom: 10 },
    input: { height: 40, borderColor: '#CBD5E0', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, marginBottom: 10, color: '#0B2545' },
    postButton: { backgroundColor: '#0B2545', padding: 10, borderRadius: 6, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#EEB902' },
    postButtonText: { color: '#ffffff', fontWeight: 'bold' },
    newsCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 8, marginVertical: 6, borderWidth: 1, borderColor: '#E2E8F0' },
    newsTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B2545', marginBottom: 5 },
    newsContent: { fontSize: 14, color: '#2D3748', lineHeight: 19 },
    newsFooter: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#F4F6F9', paddingTop: 5 },
    newsAuthor: { fontSize: 11, color: '#718096', fontWeight: 'bold' }
});