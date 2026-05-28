import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MessageBubble({ text, email, isMe }) {
    const senderNickname = email ? email.split('@')[0] : 'Student';

    return (
        <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
            <View style={[styles.messageBox, isMe ? styles.myBox : styles.otherBox]}>
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
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                    {text}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    messageRow: { flexDirection: 'row', marginVertical: 6, paddingHorizontal: 14, width: '100%' },
    myRow: { justifyContent: 'flex-end' },
    otherRow: { justifyContent: 'flex-start' },
    messageBox: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, maxWidth: '80%', shadowColor: '#1A365D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
    myBox: { backgroundColor: '#0B2545', borderBottomRightRadius: 2 },
    otherBox: { backgroundColor: '#ffffff', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#E2E8F0' },
    mySenderText: { fontSize: 10, fontWeight: '800', color: '#EEB902', marginBottom: 3, alignSelf: 'flex-end' },
    otherSenderText: { fontSize: 10, fontWeight: '800', color: '#4A5568', marginBottom: 3 },
    messageText: { fontSize: 14, lineHeight: 19, fontWeight: '500' },
    myMessageText: { color: '#FFFFFF' },
    otherMessageText: { color: '#2D3748' }
});
