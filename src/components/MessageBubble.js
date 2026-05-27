import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MessageBubble({ text, email, isMe }) {
    const senderNickname = email ? email.split('@')[0] : 'Student';

    return (
        <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
            <View style={[styles.messageBox, isMe ? styles.myBox : styles.otherBox]}>
                <Text style={[styles.senderText, isMe ? styles.mySenderText : styles.otherSenderText]}>
                    {senderNickname}
                </Text>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                    {text}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    messageRow: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 10 },
    myRow: { justifyContent: 'flex-end' },
    otherRow: { justifyContent: 'flex-start' },
    messageBox: { padding: 11, borderRadius: 12, maxWidth: '75%' },
    myBox: { backgroundColor: '#0B2545', borderBottomRightRadius: 0 },
    otherBox: { backgroundColor: '#ffffff', borderBottomLeftRadius: 0, borderWidth: 1, borderColor: '#E2E8F0' },
    senderText: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
    mySenderText: { color: '#EEB902' },
    otherSenderText: { color: '#718096' },
    messageText: { fontSize: 15 },
    myMessageText: { color: '#FFFFFF' },
    otherMessageText: { color: '#2D3748' }
});