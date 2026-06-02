import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function StudentLifeScreen() {
    const { isDarkMode } = useAuth();
    // Adjusted initial value tab to display the new Calendar section immediately
    const [activeSubSection, setActiveSubSection] = useState('calendar');

    // NEW DATA REAL MATRIX: Official Universiti i Prishtinës academic milestones calendar
    const academicCalendar = [
        { id: 'cal1', title: '📝 Afati i Provimeve të Qershorit', date: '15 Qershor - 15 Korrik 2026', scope: 'Provime', priority: 'High', desc: 'Paraqitja e lëndëve në SEMS hapet zyrtarisht më 5 Qershor. Sigurohuni që të shlyeni obligimet financiare.' },
        { id: 'cal2', title: '🎓 Dorëzimi i Temave të Diplomës (Bachelor/Master)', date: 'Deri më 30 Qershor 2026', scope: 'Diplomim', priority: 'Medium', desc: 'Afati i fundit për dorëzimin e punimit të kompletuar te referenti i fakultetit për mbrojtje në Korrik.' },
        { id: 'cal3', title: '🚀 Hackathon Ndëruniversitar UP 2026', date: '12-14 Qershor 2026', scope: 'Evente', priority: 'Low', desc: 'Gara e madhe e kodimit dhe inovacionit e hapur për FIEK dhe FSHMN në ambientet e Fakultetit Teknik.' },
        { id: 'cal4', title: '📑 Regjistrimi i Semestrit të Ri', date: '01-15 Shtator 2026', scope: 'Administratë', priority: 'High', desc: 'Zgjedhja e lëndëve zgjedhore dhe ngarkimi i fletëpagesave të semestrit në sistem.' }
    ];

    const busLines = [
        { id: 'L1', line: 'Linja 1', route: 'Fakulteti Teknik ➔ Qendër ➔ Kalabria', stations: 'Stacionet: Amfiteatri, Te Santea, Katedralja, Komuna, Posta e Madhe', schedule: '⏰ 06:00 - 23:00 (Çdo 5-7 min)', studentPrice: 'Free FALAS për Studentë (Me ID Kartelë)', publicPrice: '🎟️ Të tjerët: 0.50€ (Bileta Mujore: 14.00€)' },
        { id: 'L3', line: 'Linja 3', route: 'Bregu i Diellit ➔ Qendër ➔ Bardhosh', stations: 'Stacionet: Banesat e Bardha, Amfiteatri, Qendra, Gjykata, Bardhosh', schedule: '⏰ 06:30 - 22:30 (Çdo 8-10 min)', studentPrice: 'Free FALAS për Studentë (Me ID Kartelë)', publicPrice: '🎟️ Të tjerët: 0.50€ (Bileta 24h: 0.80€)' },
        { id: 'L3B', line: 'Linja 3B', route: 'Bregu i Diellit ➔ Rr. B ➔ Qendër ➔ Hospital', stations: 'Stacionet: Rruga B, Ambulanca, Posta, QKUK, Lagja e Spitalit', schedule: '⏰ 06:45 - 22:00 (Çdo 10-12 min)', studentPrice: 'Free FALAS për Studentë (Me ID Kartelë)', publicPrice: '🎟️ Të tjerët: 0.50€' },
        { id: 'L4', line: 'Linja 4', route: 'Mati 1 ➔ Qendër ➔ Gërmi', stations: 'Stacionet: Rruga B, Parku i Qytetit, Teatri, Komuna e Vjetër, Gërmi', schedule: '⏰ 06:00 - 23:15 (Çdo 6-8 min)', studentPrice: 'Free FALAS për Studentë (Me ID Kartelë)', publicPrice: '🎟️ Të tjerët: 0.50€' },
        { id: 'L7', line: 'Linja 7', route: 'Arbëria (Dragodan) ➔ Qendër ➔ Kodra e Trimave', stations: 'Stacionet: Komuna e Re, Stacioni i Trenit, Qendër, Xhamia, Kafja e Shkallëve', schedule: '⏰ 07:00 - 22:00 (Çdo 12-15 min)', studentPrice: 'Free FALAS për Studentë (Me ID Kartelë)', publicPrice: '🎟️ Të tjerët: 0.50€' }
    ];

    const mensaDorms = [
        { id: 'm1', type: '🍔 MENZA ZYRTARE', title: 'Menza e Studentëve (UP)', status: 'Aplikimi Online i Hapur', schedule: '🥣 Dreka: 11:30-14:30 | Darka: 17:30-20:00', price: '💳 15.00€ në muaj (2 shujta në ditë)', extra: '🍲 Menyja: Supë, Gjellë me mish (ose Vegjetariane), Sallatë, Pemë dhe Bukë.', applyUrl: 'https://uni-pr.edu' },
        { id: 'd1', type: '🏢 KONVIKTET', title: 'Qendra e Studentëve (Konviktet 1-8)', status: 'Pranimet e Reja Aktiv', schedule: '📑 Kapaciteti: ~4000 Studentë', price: '💶 20.00€ në muaj për banim', extra: '⚡ Përfshin: Nxemje qendrore, Ujë 24h, Salla Leximi brenda secilit konvikt dhe Wi-Fi falas.', applyUrl: 'https://uni-pr.edu' }
    ];

    const studentDeals = [
        { id: 'o1', shop: '📚 Libraria Dukagjini', discount: '15% Zbritje', code: 'UP-DUKAGJINI26', details: 'Vlen për të gjithë librat akademikë dhe fletoret e vizatimit. Duhet të tregoni ID Kartelën e UP-së.', link: 'https://dukagjinibooks.com' },
        { id: 'o2', shop: '☕ Cyber Cafe (Prishtina)', discount: 'Kafja e dytë FALAS', code: 'CYBER-STUDENT', details: 'Çdo ditë nga ora 08:00 deri 13:00 për të gjithë studentët e FIEK, FSHMN dhe Ekonomikut.', link: null },
        { id: 'o3', shop: '💻 Cineplexx Kosova', discount: 'Biletë Studentore (3.50€)', code: 'UP-CINE26', details: 'Çmim ekskluziv për studentë çdo të martë dhe të mërkurë për të gjithë filmat 2D dhe 3D.', link: 'https://cineplexx-ks.eu' }
    ];

    const handleCopyCode = (code) => {
        Alert.alert('Kodi u Kopjua! ✂️', `Përdor kodin "${code}" në arkë ose online për të përfituar zbritjen.`);
    };

    const handleOpenLink = (url) => {
        if (url) { Linking.openURL(url).catch(() => Alert.alert("Gabim", "Nuk mund të hapet kjo faqe.")); }
        else { Alert.alert("Lokale 📍", "Kjo ofertë shfrytëzohet fizikisht në lokal."); }
    };

    const themeStyles = {
        card: isDarkMode ? styles.darkCard : styles.lightCard,
        text: isDarkMode ? styles.darkText : styles.lightText
    };

    return (
        <View style={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]}>
            <Text style={[styles.mainTitle, themeStyles.text]}>✨ Campus Lifestyle Hub [Prishtinë]</Text>

            {/* Horizontal Segment Scroll View Controller including the 4 sections */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentHorizontalScrollView} contentContainerStyle={{ gap: 4 }}>
                <TouchableOpacity style={[styles.segmentBtn, activeSubSection === 'calendar' && styles.segmentActive]} onPress={() => setActiveSubSection('calendar')}>
                    <Text style={[styles.segmentTxt, activeSubSection === 'calendar' && styles.segmentTxtActive]}>📅 Kalendari UP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segmentBtn, activeSubSection === 'bus' && styles.segmentActive]} onPress={() => setActiveSubSection('bus')}>
                    <Text style={[styles.segmentTxt, activeSubSection === 'bus' && styles.segmentTxtActive]}>🚌 Trafiku Urban</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segmentBtn, activeSubSection === 'mensa' && styles.segmentActive]} onPress={() => setActiveSubSection('mensa')}>
                    <Text style={[styles.segmentTxt, activeSubSection === 'mensa' && styles.segmentTxtActive]}>🏢 Menza / Dorms</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segmentBtn, activeSubSection === 'deals' && styles.segmentActive]} onPress={() => setActiveSubSection('deals')}>
                    <Text style={[styles.segmentTxt, activeSubSection === 'deals' && styles.segmentTxtActive]}>🔥 Oferta</Text>
                </TouchableOpacity>
            </ScrollView>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 110 }}>
                {/* 📅 NEW SECTION: CAMPUS CALENDAR REAL-TIME SCHEDULER TIMELINE */}
                {activeSubSection === 'calendar' && academicCalendar.map(item => (
                    <View key={item.id} style={[styles.infoCard, themeStyles.card]}>
                        <View style={[styles.badge, item.priority === 'High' ? { backgroundColor: '#EF4444' } : item.priority === 'Medium' ? { backgroundColor: '#F59E0B' } : { backgroundColor: '#4F46E5' }]}>
                            <Text style={styles.badgeTxt}>{item.scope}</Text>
                        </View>
                        <Text style={[styles.cardTitle, themeStyles.text]}>{item.title}</Text>
                        <Text style={[styles.cardSubTitle, { color: '#818CF8', fontWeight: '800', marginTop: 4 }]}>🗓️ {item.date}</Text>

                        <View style={styles.detailsBox}>
                            <Text style={[styles.detailsBoxTxt, { color: '#94A3B8', fontStyle: 'normal', fontWeight: '500' }]}>
                                {item.desc}
                            </Text>
                        </View>
                    </View>
                ))}

                {/* 🚌 TRANSIT ROUTE AND PRICE ENGINE MAPPING */}
                {activeSubSection === 'bus' && busLines.map(item => (
                    <View key={item.id} style={[styles.infoCard, themeStyles.card]}>
                        <View style={styles.badge}><Text style={styles.badgeTxt}>{item.line}</Text></View>
                        <Text style={[styles.cardTitle, themeStyles.text]}>{item.route}</Text>
                        <Text style={styles.cardStations}>📍 {item.stations}</Text>

                        <View style={styles.cardSpecsRow}>
                            <Text style={styles.scheduleText}>{item.schedule}</Text>
                            <View style={styles.pricingSubRow}>
                                <Text style={styles.freeBadgeTxt}>{item.studentPrice}</Text>
                                <Text style={styles.publicPriceTxt}>{item.publicPrice}</Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* 🏢 MENSA AND HOUSING ONLINE APPLICATION PORTALS */}
                {activeSubSection === 'mensa' && mensaDorms.map(item => (
                    <View key={item.id} style={[styles.infoCard, themeStyles.card]}>
                        <View style={[styles.badge, { backgroundColor: item.id === 'm1' ? '#4F46E5' : '#10B981' }]}>
                            <Text style={styles.badgeTxt}>{item.type}</Text>
                        </View>
                        <Text style={[styles.cardTitle, themeStyles.text, { marginTop: 4 }]}>{item.title}</Text>
                        <Text style={[styles.cardSubTitle, { color: '#10B981' }]}>🟢 {item.status}</Text>

                        <View style={styles.detailsBox}>
                            <Text style={styles.detailsBoxTxt}>🕒 {item.schedule}</Text>
                            <Text style={[styles.detailsBoxTxt, { fontWeight: '800', marginVertical: 4 }]}>{item.price}</Text>
                            <Text style={[styles.detailsBoxTxt, { color: '#94A3B8', fontStyle: 'italic' }]}>{item.extra}</Text>
                        </View>

                        <TouchableOpacity style={styles.applyPortalBtn} onPress={() => handleOpenLink(item.applyUrl)} activeOpacity={0.8}>
                            <Text style={styles.applyPortalBtnTxt}>Apliko Online Këtu (qs.uni-pr.edu) 🌐</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {/* 🔥 EXCLUSIVE CAMPUS DISCOUNT VOUCHERS */}
                {activeSubSection === 'deals' && studentDeals.map(item => (
                    <View key={item.id} style={[styles.infoCard, themeStyles.card]}>
                        <View style={[styles.badge, { backgroundColor: '#EF4444' }]}><Text style={styles.badgeTxt}>{item.discount}</Text></View>
                        <Text style={[styles.cardTitle, themeStyles.text]}>{item.shop}</Text>
                        <Text style={styles.cardSubTitle}>{item.details}</Text>

                        <View style={styles.actionGridRow}>
                            <TouchableOpacity style={styles.codeButton} onPress={() => handleCopyCode(item.code)} activeOpacity={0.7}>
                                <Text style={styles.codeButtonTxt}>✂️ Kodi: {item.code}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.linkActionBtn} onPress={() => handleOpenLink(item.link)} activeOpacity={0.7}>
                                <Text style={styles.linkActionTxt}>Hap 🌐</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 14 },
    lightBg: { backgroundColor: '#F0F4F8' },
    darkBg: { backgroundColor: '#080E1A' },
    lightCard: { backgroundColor: '#ffffff', borderColor: '#EEF2F6' },
    darkCard: { backgroundColor: '#0F172A', borderColor: 'rgba(79, 70, 229, 0.2)' },
    lightText: { color: '#0B2545' },
    darkText: { color: '#FFFFFF' },

    mainTitle: { fontSize: 18, fontWeight: '900', marginVertical: 10, letterSpacing: -0.4 },

    // NEW STYLE: Horizontal scrollable tab row for modern view spacing
    segmentHorizontalScrollView: { paddingVertical: 2, maxHeight: 60, marginBottom: 10 },
    segmentBtn: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#1E293B', height: 40 },
    segmentActive: { backgroundColor: '#4F46E5' },
    segmentTxt: { color: '#94A3B8', fontSize: 11, fontWeight: '700', textAlign: 'center' },
    segmentTxtActive: { color: '#FFFFFF', fontWeight: '800' },

    infoCard: { padding: 16, borderRadius: 24, borderWidth: 1, marginVertical: 6, position: 'relative', shadowColor: '#000', shadowOpacity: 0.02, elevation: 2 },
    badge: { position: 'absolute', top: 14, right: 14, backgroundColor: '#4F46E5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    badgeTxt: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

    cardTitle: { fontSize: 15, fontWeight: '800', maxWidth: '65%', lineHeight: 20, letterSpacing: -0.2 },
    cardSubTitle: { fontSize: 13, color: '#94A3B8', marginTop: 4, fontWeight: '600', lineHeight: 18 },
    cardStations: { fontSize: 12, color: '#64748B', marginTop: 6, fontWeight: '500', lineHeight: 17 },

    cardSpecsRow: { flex1Direction: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 10, flexDirection: 'column', gap: 6 },
    scheduleText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
    pricingSubRow: { marginTop: 2, gap: 2 },
    freeBadgeTxt: { fontSize: 12, fontWeight: '800', color: '#10B981' },
    publicPriceTxt: { fontSize: 11, fontWeight: '600', color: '#64748B' },

    detailsBox: { backgroundColor: '#1E293B', padding: 12, borderRadius: 14, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
    detailsBoxTxt: { fontSize: 12, color: '#FFF', fontWeight: '600', lineHeight: 18 },

    applyPortalBtn: { marginTop: 10, height: 38, backgroundColor: 'rgba(79, 70, 229, 0.15)', borderWidth: 1, borderColor: '#4F46E5', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    applyPortalBtnTxt: { color: '#818CF8', fontSize: 12, fontWeight: '800' },

    actionGridRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    codeButton: { flex: 1, height: 38, backgroundColor: '#1E293B', borderRadius: 10, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
    codeButtonTxt: { color: '#F59E0B', fontSize: 12, fontWeight: '800' },
    linkActionBtn: { width: 65, height: 38, backgroundColor: '#4F46E5', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    linkActionTxt: { color: '#FFF', fontSize: 12, fontWeight: '800' }
});
