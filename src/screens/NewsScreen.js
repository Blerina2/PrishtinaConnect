import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { dbInstance } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';

export default function NewsScreen() {
    const [news, setNews] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Thirrja në kohë reale nga serveri i Firebase Cloud
        const q = query(collection(dbInstance, 'news'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNews(newsList);
            setLoading(false);
        }, (err) => {
            console.log("Gabim gjatë marrjes së lajmeve: ", err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handlePostNews = async () => {
        if (!title.trim() || !content.trim()) return;

        // Struktura zyrtare NoSQL që ruhet përgjithmonë në Cloud
        const newsObj = {
            title: title.trim(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
            author: 'Blerina Beka'
        };

        try {
            // Dërgimi direkt në Firebase Firestore
            await addDoc(collection(dbInstance, 'news'), newsObj);
            setTitle('');
            setContent('');
        } catch (err) {
            console.log("Gabim gjatë ruajtjes në cloud: ", err.message);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="small" color="#0B2545" />
                <Text style={styles.loadingText}>Duke sinkronizuar lajmet me cloud...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.postBox}>
                <Text style={styles.boxTitle}>📢 Posto një Njoftim Zyrtar në UP</Text>
                <TextInput style={styles.input} placeholder="Titulli i lajmit..." placeholderTextColor="#A0AEC0" value={title} onChangeText={setTitle} />
                <TextInput style={[styles.input, { height: 60 }]} placeholder="Përmbajtja e njoftimit studentor..." placeholderTextColor="#A0AEC0" multiline value={content} onChangeText={setContent} />
                <TouchableOpacity style={styles.postButton} onPress={handlePostNews}>
                    <Text style={styles.postButtonText}>Shpërndaj në Server</Text>
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
                            <Text style={styles.newsAuthor}>Autor: {item.author}</Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6F9', padding: 12 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#0B2545', fontSize: 13, fontWeight: '500' },
    postBox: { backgroundColor: '#ffffff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    boxTitle: { fontSize: 15, fontWeight: 'bold', color: '#0B2545', marginBottom: 10 },
    input: { height: 40, borderColor: '#CBD5E0', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, marginBottom: 10, color: '#0B2545', backgroundColor: '#F9FAFB' },
    postButton: { backgroundColor: '#0B2545', padding: 12, borderRadius: 6, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#EEB902' },
    postButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
    newsCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 8, marginVertical: 6, borderWidth: 1, borderColor: '#E2E8F0' },
    newsTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B2545', marginBottom: 5 },
    newsContent: { fontSize: 14, color: '#2D3748', lineHeight: 19 },
    newsFooter: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#F4F6F9', paddingTop: 6 },
    newsAuthor: { fontSize: 11, color: '#718096', fontWeight: 'bold' }
});