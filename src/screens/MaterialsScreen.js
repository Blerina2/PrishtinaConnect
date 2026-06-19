import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Linking, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { uploadFileToCloud } from '../utils/uploader';

export default function MaterialsScreen() {
    const { user, isDarkMode } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [title, setTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [selectedType, setSelectedType] = useState('Drive 📁');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    //  Material text searching filter state tracker
    const [searchQuery, setSearchQuery] = useState('');

    const [localFileUri, setLocalFileUri] = useState(null);
    const [localFileName, setLocalFileName] = useState('');

    const studentFaculty = user?.faculty || 'FIEK';

    const llojet = [
        { id: 'Drive 📁', label: 'Google Drive' },
        { id: 'Dokument 📄', label: 'PDF / Word' },
        { id: 'Foto 📸', label: 'Foto Provimi' }
    ];

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setLocalFileUri(result.assets[0].uri);
                setLocalFileName(result.assets[0].name);
                setTitle(result.assets[0].name.split('.')[0]);
            }
        } catch (e) { console.log(e); }
    };

    const handlePickPhoto = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Refuzuar 🔒", "Lejoni qasjen.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setLocalFileUri(result.assets[0].uri);
            setLocalFileName('foto_provimi_' + Date.now() + '.jpg');
        }
    };

    const loadMaterials = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'materials'), where('faculty', '==', studentFaculty), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const list = [];
            querySnapshot.forEach((doc) => { list.push({ id: doc.id, ...doc.data() }); });
            setMaterials(list);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { if (studentFaculty) { loadMaterials(); } }, [studentFaculty]);
    const handleUploadMaterial = async () => {
        if (!title.trim()) {
            alert("Gabim: Ju lutem shkruani një titull ose përshkrim për materialin.");
            return;
        }

        if (!linkUrl.trim() || !linkUrl.toLowerCase().startsWith('http')) {
            alert("Gabim: Ju lutem plotësoni një link valid të Google Drive ose OneDrive (https://...)");
            return;
        }

        setSubmitting(true);
        try {
            const matObj = {
                title: title.trim(),
                type: 'Drive 📁', // Enforces the Drive visual template
                faculty: studentFaculty,
                uploadedBy: user?.email ? user.email.split('@')[0] : 'Student',
                createdAt: new Date().toISOString(),
                linkUrl: linkUrl.trim(),
                fileName: "Google Drive Resource"
            };

            await addDoc(collection(db, 'materials'), matObj);

            // Clear operational inputs immediately
            setTitle('');
            setLinkUrl('');
            setLocalFileUri(null);
            setLocalFileName('');

            await loadMaterials();
            alert("Sukses 🎉 Burimi akademik u shpërnda me sukses në rrjet!");
        } catch (err) {
            console.error(err);
            alert("Gabim: Ndodhi një problem gjatë dërgimit të linkut në Firestore.");
        } finally {
            setSubmitting(false);
        }
    };


    const handleOpenMaterial = (item) => {
        if (item.linkUrl) {
            Linking.openURL(item.linkUrl).catch(() =>
                Alert.alert("Gabim", "Nuk mund të hapet ky burim zyrtar.")
            );
        } else {
            Alert.alert("Gabim", "Ky material nuk përmban një link valid.");
        }
    };

    const filteredMaterials = materials.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

            {/* UPLOAD FORM PANEL BOX */}
            <View style={[styles.uploadBox, themeStyles.card]}>
                <Text style={styles.miniTitle}>Zgjedh llojin e burimit akademik:</Text>
                <View style={styles.typeSelectorRow}>
                    {llojet.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            style={[styles.typeButton, selectedType === t.id && styles.typeButtonActive]}
                            onPress={() => {
                                setSelectedType(t.id);
                                setLocalFileUri(null);
                                setLocalFileName('');
                            }}
                        >
                            <Text style={[styles.typeButtonText, selectedType === t.id && styles.typeButtonTextActive]}>{t.id}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput
                    style={[styles.input, themeStyles.input]}
                    placeholder="Emri i lëndës ose përshkrimi (p.sh. Analiza 1 - Provimi)"
                    value={title}
                    onChangeText={setTitle}
                    placeholderTextColor="#94A3B8"
                />

                {selectedType === 'Drive 📁' ? (
                    <TextInput
                        style={[styles.input, themeStyles.input, { marginTop: 10 }]}
                        placeholder="Linku i Google Drive (https://...)"
                        value={linkUrl}
                        onChangeText={setLinkUrl}
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="none"
                    />
                ) : selectedType === 'Dokument 📄' ? (
                    <TouchableOpacity style={styles.pickerSelectorBtn} onPress={handlePickDocument}>
                        <Text style={styles.pickerSelectorTxt}>
                            {localFileUri ? `✅ Përzgjedhur: ${localFileName}` : '📁 Zgjedh Dokument PDF / Word'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.pickerSelectorBtn} onPress={handlePickPhoto}>
                        <Text style={styles.pickerSelectorTxt}>
                            {localFileUri ? '✅ Foto e Provimit u shtua!' : '📸 Zgjedh Foto nga Galeria'}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.btn} onPress={handleUploadMaterial} disabled={submitting}>
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>Ngarko në Serverin Cloud ➔</Text>
                    )}
                </TouchableOpacity>
            </View>


            <View style={styles.searchBarWrapperContainer}>
                <TextInput
                    style={[styles.searchTextInputField, themeStyles.input]}
                    placeholder="🔍 Kërko materiale ose skedarë sipas lëndës..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>


            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={{ marginTop: 10, color: '#94A3B8', fontWeight: '600' }}>Duke sinkronizuar me cloud...</Text>
                </View>
            ) : filteredMaterials.length === 0 ? (
                <Text style={styles.emptyText}>Nuk u gjet asnjë material akademik për këtë kërkim.</Text>
            ) : (
                <FlatList
                    data={filteredMaterials}
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

                            <TouchableOpacity style={styles.linkButton} onPress={() => handleOpenMaterial(item)}>
                                <Text style={styles.linkButtonText}>
                                    {item.type === 'Drive 📁' ? 'Hap Linkun e Drive 🔗' : item.type === 'Dokument 📄' ? 'Shkarko Dokumentin PDF / Word 📥' : 'Shiko Foton në Server 📸'}
                                </Text>
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
    lightBg: { backgroundColor: '#F0F4F8' },
    darkBg: { backgroundColor: '#080E1A' },
    lightCard: { backgroundColor: '#FFF', borderColor: '#E2E8F0' },
    darkCard: { backgroundColor: '#0F172A', borderColor: 'rgba(79, 70, 229, 0.2)' },
    lightText: { color: '#0B2545' },
    darkText: { color: '#FFFFFF' },
    lightInput: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0B2545' },
    darkInput: { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.05)', color: '#FFFFFF' },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
    refreshBtn: { backgroundColor: 'rgba(79, 70, 229, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    refreshBtnText: { color: '#818CF8', fontSize: 12, fontWeight: '700' },

    uploadBox: { padding: 15, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.03, elevation: 3, marginBottom: 15 },
    miniTitle: { fontSize: 11, fontWeight: '800', color: '#818CF8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    typeSelectorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 6 },
    typeButton: { flex: 1, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
    typeButtonActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
    typeButtonText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
    typeButtonTextActive: { color: '#FFFFFF', fontWeight: '800' },

    input: { height: 44, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, fontSize: 13, fontWeight: '500' },
    pickerSelectorBtn: { marginTop: 10, height: 44, backgroundColor: '#1E293B', borderWidth: 1.5, borderColor: 'rgba(79, 70, 229, 0.3)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, borderStyle: 'dashed' },
    pickerSelectorTxt: { color: '#818CF8', fontSize: 13, fontWeight: '700', textAlign: 'center' },

    btn: { marginTop: 12, backgroundColor: '#4F46E5', height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6 },

    // NEW STYLE: Intelligent Search Bar styling wrappers
    searchBarWrapperContainer: { width: '100%', marginBottom: 14 },
    searchTextInputField: { width: '100%', height: 44, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, fontSize: 13, fontWeight: '500' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
    emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 30, fontSize: 13, lineHeight: 22, paddingHorizontal: 20, fontWeight: '500' },
    matCard: { padding: 16, borderRadius: 24, marginVertical: 6, borderWidth: 1, elevation: 2 },
    matCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    badge: { backgroundColor: 'rgba(79, 70, 229, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#818CF8' },
    matDate: { fontSize: 11, color: '#64748B', fontWeight: '700' },
    matTitle: { fontSize: 14, fontWeight: '800', lineHeight: 20, letterSpacing: -0.2 },
    matAuthor: { fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
    linkButton: { marginTop: 12, backgroundColor: '#1E293B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#10B981' },
    linkButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 }
});
