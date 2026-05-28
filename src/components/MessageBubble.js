import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

export default function MessageBubble({ text, email, isMe, imageUri }) {
    const senderNickname = email ? email.split('@')[0] : 'Student';

    return (
        <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
            <View style={[styles.messageBox, isMe ? styles.myBox : styles.otherBox]}>

                {/* Emri i dërguesit sipër mesazhit */}
                {!isMe && (
                    <Text style={styles.otherSenderText}>
                        👤 {senderNickname}
                    </Text>
                )}
                {isMe && (
                    <Text style={styles.mySenderText}>
                        ✨ Unë
                    </Text>
                )}

                {/* LOGLIKA E RE: Nëse studenti ka dërguar foto, e shfaqim imazhin këtu */}
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.chatMediaImage}
                        resizeMode="cover"
                    />
                ) : null}

                {/* Nëse ka edhe tekst, shfaqet poshtë fotos ose normalisht */}
                {text ? (
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                        {text}
                    </Text>
                ) : null}

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    messageRow: { flexDirection: 'row', marginVertical: 6, paddingHorizontal: 14, width: '100%' },
    myRow: { justifyContent: 'flex-end' },
    otherRow: { justifyContent: 'flex-start' },
    messageBox: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 18, maxWidth: '85%', shadowColor: '#1A365D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
    myBox: { backgroundColor: '#0B2545', borderBottomRightRadius: 2 },
    otherBox: { backgroundColor: '#ffffff', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#E2E8F0' },
    mySenderText: { fontSize: 10, fontWeight: '800', color: '#EEB902', marginBottom: 4, alignSelf: 'flex-end' },
    otherSenderText: { fontSize: 10, fontWeight: '800', color: '#4A5568', marginBottom: 4 },
    messageText: { fontSize: 14, lineHeight: 19, fontWeight: '500' },
    myMessageText: { color: '#FFFFFF' },
    otherMessageText: { color: '#2D3748' },

    // Stili i ri për fotot që dërgohen brenda në bisedë
    chatMediaImage: { width: 220, height: 160, borderRadius: 12, marginBottom: 4, marginTop: 2 }
});
