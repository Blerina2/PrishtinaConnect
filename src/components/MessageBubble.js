import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';

export default function MessageBubble({ text, email, isMe, imageUri, fileUri, fileName, gifUrl, stickerUrl, reactions = {}, messageId, onReactionPress, currentUserId, onOpenMenu }) {
    const senderNickname = email ? email.split('@')[0] : 'Student';

    return (
        <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
            {/* Shtypja e gjatë (onLongPress) ose shtypja normale hap menynë e reaksioneve, GIF-eve dhe Stickers */}
            <TouchableOpacity
                style={[styles.messageBox, isMe ? styles.myBox : styles.otherBox]}
                onLongPress={() => onOpenMenu(messageId, reactions)}
                delayLongPress={250}
                activeOpacity={0.9}
            >
                {/* Emri i dërguesit sipër mesazhit */}
                {!isMe && <Text style={styles.otherSenderText}>👤 {senderNickname}</Text>}
                {isMe && <Text style={styles.mySenderText}>✨ Unë</Text>}

                {/* Shfaqja e Fotos klasike */}
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.chatMediaImage} resizeMode="cover" />
                ) : null}

                {/*  Shfaqja e GIF-eve të përzgjedhura si në Discord */}
                {gifUrl ? (
                    <Image source={{ uri: gifUrl }} style={styles.chatGifMedia} resizeMode="contain" />
                ) : null}

                {/*  Shfaqja e Stickers */}
                {stickerUrl ? (
                    <Image source={{ uri: stickerUrl }} style={styles.chatStickerMedia} resizeMode="contain" />
                ) : null}

                {/* Shfaqja e Skedarëve (PDF / Word) */}
                {fileUri ? (
                    <View style={styles.fileContainer}>
                        <Text style={styles.fileIcon}>📄</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.fileText} numberOfLines={1}>{fileName || 'Dokument'}</Text>
                            <Text style={styles.fileSubText}>Kliko për ta hapur</Text>
                        </View>
                    </View>
                ) : null}

                {/* Nëse ka tekst, shfaqet këtu */}
                {text && !fileUri ? (
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                        {text}
                    </Text>
                ) : null}

                {/* Rreshti i Reaksioneve ekzistuese (Discord Style) */}
                {Object.keys(reactions).length > 0 && (
                    <View style={styles.reactionsRow}>
                        {Object.keys(reactions).map((emoji) => {
                            const usersWhoReacted = reactions[emoji] || [];
                            const hasIReacted = usersWhoReacted.includes(currentUserId);

                            if (usersWhoReacted.length === 0) return null;

                            return (
                                <TouchableOpacity
                                    key={emoji}
                                    style={[styles.reactionBadge, hasIReacted && styles.activeReactionBadge]}
                                    onPress={() => onReactionPress(messageId, reactions, emoji)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                                    <Text style={[styles.reactionCount, hasIReacted && styles.activeReactionCount]}>
                                        {usersWhoReacted.length}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    messageRow: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 12, width: '100%' },
    myRow: { justifyContent: 'flex-end' },
    otherRow: { justifyContent: 'flex-start' },
    messageBox: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, maxWidth: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    myBox: { backgroundColor: '#4F46E5', borderBottomRightRadius: 4 },
    otherBox: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
    mySenderText: { fontSize: 9, fontWeight: '800', color: '#10B981', marginBottom: 2, alignSelf: 'flex-end' },
    otherSenderText: { fontSize: 9, fontWeight: '800', color: '#6B7280', marginBottom: 2 },
    messageText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    myMessageText: { color: '#FFFFFF' },
    otherMessageText: { color: '#1F2937' },
    chatMediaImage: { width: 240, height: 160, borderRadius: 12, marginVertical: 4 },

    // Mbështetja për GIF-e dhe Stickers si në Discord/Telegram
    chatGifMedia: { width: 180, height: 140, borderRadius: 10, marginVertical: 4 },
    chatStickerMedia: { width: 120, height: 120, marginVertical: 4 },

    // Stilizimi i dokumenteve (PDF / Word)
    fileContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', padding: 10, borderRadius: 12, marginTop: 4, gap: 10, width: 220 },
    fileIcon: { fontSize: 22 },
    fileText: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
    fileSubText: { fontSize: 10, color: '#6B7280', fontWeight: '500', marginTop: 1 },

    // Reaksionet poshtë flluskës së bisedës
    reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6, alignItems: 'center' },
    reactionBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', gap: 3 },
    activeReactionBadge: { backgroundColor: '#EEF2FF', borderColor: '#818CF8' },
    reactionEmoji: { fontSize: 11 },
    reactionCount: { fontSize: 10, fontWeight: '700', color: '#4B5563' },
    activeReactionCount: { color: '#4F46E5' }
});
