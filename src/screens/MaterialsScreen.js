import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Linking, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';

export default function MaterialsScreen() {
    const { user, isDarkMode } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [title, setTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [selectedType, setSelectedType] = useState('Drive 📁'); // Kategoria fillestare
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const studentFaculty = user?.faculty || 'FIEK';

    const llojet = [
        { id: 'Drive 📁', label: 'Google Drive' },
        { id: 'Test 📝', label: 'Teste / Kuize' },
        { id: 'Foto 📸', label: 'Foto Provimi' }
    ];

    // Ngarkimi i shpejtë i materialeve pa bllokuar uebin
    const loadMaterials = async () => {
        setLoading(true);
        try {
            // FILTRIMI I RREPTË: Merr vetëm materialet që i përkasin fakultetit të studentit të kyçur
            const q = query(
                collection(db, 'materials'),
                where('faculty', '==', studentFaculty),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const list = [];
            querySnapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setMaterials(list);
        } catch (e) {
            console.error("Gabim gjatë ngarkimit të materialeve:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentFaculty) {
            loadMaterials();
        }
    }, [studentFaculty]);

    const handleUploadMaterial = async () => {
        if (!title.trim() || !linkUrl.trim()) {
            Alert.alert("Gabim", "Ju lutem plotësoni titullin dhe linkun.");
            return;
        }

        setSubmitting(true);
        try {
            const matObj = {
                title: title.trim(),
                linkUrl: linkUrl.trim(),
                type: selectedType,
                faculty: studentFaculty, // Ruhet me emrin e fakultetit specifik
                uploadedBy: user?.email ? user.email.split('@')[0] : 'Student',
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'materials'), matObj);
            setTitle('');
            setLinkUrl('');

            // Rifresko listën menjëherë pas postimit
            await loadMaterials();
            Alert.alert("Sukses 🎉", "Materiali akademik u nda me sukses!");
        } catch (err) {
            console.error(err);
            Alert.alert("Gabim", "Ndodhi një problem gjatë postimit.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenLink = (url) => {
        Linking.openURL(url).catch(() => Alert.alert("Gabim", "Nuk mund të hapet ky link. Sigurohuni që fillon me http:// ose https://"));
    };

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText,
        input: isDarkMode ? styles.darkInput : styles.lightInput,
    };

    return (
        <View style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]}>
            <View style={styles.headerRow}>
                <Text style={[styles.title, themeStyles.text]}>📚 Burimet Akademike [{studentFaculty}]</Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={loadMaterials}>
                    <Text style={styles.refreshBtnText}>🔄 Rifresko</Text>
                </TouchableOpacity>
            </View>

            {/* KUTIA E POSTIMIT TË MATERIALEVE */}
            <View style={[styles.uploadBox, themeStyles.card]}>
                <Text style={styles.miniTitle}>Zgjedh llojin e materialit:</Text>
                <View style={styles.typeSelectorRow}>
                    {llojet.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            style={[styles.typeButton, selectedType === t.id && styles.typeButtonActive]}
                            onPress={() => setSelectedType(t.id)}
                        >
                            <Text style={[styles.typeButtonText, selectedType === t.id && styles.typeButtonTextActive]}>{t.id}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={[styles.input, themeStyles.input]}
                    placeholder="Emri i lëndës ose përshkrimi (p.sh. Matematika 1 - Afati Janar)"
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor="#A0AEC0"
                />

                <TextInput
                    style={[styles.input, themeStyles.input, { marginTop: 8 }]}
                    placeholder="Linku i Google Drive ose i Fotos (https://...)"
                    value={linkUrl}
                    onChangeText={setLinkUrl}
                    placeholderTextColor="#A0AEC0"
                    autoCapitalize="none"
                />

                <TouchableOpacity style={styles.btn} onPress={handleUploadMaterial} disabled={submitting}>
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Shpërndaj me studentët e {studentFaculty} ➔</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* LISTA E MATERIALEVE ENTIRELY ISOLATED */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#0B2545" />
                    <Text style={{ marginTop: 10, color: '#A0AEC0', fontWeight: '500' }}>Duke ngarkuar materialet ekskluzive...</Text>
                </View>
            ) : materials.length === 0 ? (
                <Text style={styles.emptyText}>Nuk ka ende materiale të ndarë për fakultetin {studentFaculty}. Bëhu i pari që ndan një Drive ose Foto!</Text>
            ) : (
                <FlatList
                    data={materials}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 110 }}
                    renderItem={({ item }) => (
                        <View style={[styles.matCard, themeStyles.card]}>
                            <View style={styles.matCardHeader}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{item.type}</Text>
                                </View>
                                <Text style={styles.matDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            </View>

                            <Text style={[styles.matTitle, themeStyles.text]}>{item.title}</Text>
                            <Text style={styles.matAuthor}>👤 Nga: {item.uploadedBy}</Text>

                            <TouchableOpacity style={styles.linkButton} onPress={() => handleOpenLink(item.linkUrl)}>
                                <Text style={styles.linkButtonText}>Hap Burimin Zyrtar 🔗</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    lightBg: { backgroundColor: '#F0F4F8' }, darkBg: { backgroundColor: '#1A202C' },
    lightCard: { backgroundColor: '#FFF', borderColor: '#E2E8F0' }, darkCard: { backgroundColor: '#2D3748', borderColor: '#4A5568' },
    lightText: { color: '#0B2545' }, darkText: { color: '#FFFFFF' },
    lightInput: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0B2545' }, darkInput: { backgroundColor: '#1A202C', borderColor: '#4A5568', color: '#FFFFFF' },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 16, fontWeight: '800' },
    refreshBtn: { backgroundColor: 'rgba(11, 37, 69, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    refreshBtnText: { color: '#0B2545', fontSize: 12, fontWeight: '700' },

    uploadBox: { padding: 15, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.03, elevation: 3, marginBottom: 15 },
    miniTitle: { fontSize: 11, fontWeight: '700', color: '#718096', marginBottom: 8, textTransform: 'uppercase' },
    typeSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 6 },
    typeButton: { flex: 1, paddingVertical: 8, backgroundColor: '#F0F4F8', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    typeButtonActive: { backgroundColor: '#EEB902', borderColor: '#EEB902' },
    typeButtonText: { fontSize: 11, fontWeight: '700', color: '#0B2545' },
    typeButtonTextActive: { color: '#0B2545', fontWeight: '800' },

    input: { height: 42, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, fontSize: 13, fontWeight: '500' },
    btn: { marginTop: 12, backgroundColor: '#0B2545', height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
    emptyText: { textAlign: 'center', color: '#A0AEC0', marginTop: 30, fontSize: 13, lineHeight: 20, paddingHorizontal: 20 },
    matCard: { padding: 16, borderRadius: 14, marginVertical: 6, borderWidth: 1, elevation: 2 },
    matCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    badge: { backgroundColor: '#EBF8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#2B6CB0' },
    matDate: { fontSize: 10, color: '#A0AEC0', fontWeight: '700' },
    matTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
    matAuthor: { fontSize: 11, color: '#718096', marginTop: 4, fontWeight: '600' },
    linkButton: { marginTop: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 10, borderRadius: 8, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#0B2545' },
    linkButtonText: { color: '#0B2545', fontWeight: '700', fontSize: 12 }
});
