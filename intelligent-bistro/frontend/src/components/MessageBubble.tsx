import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Message } from '../store/useStore';
import { Colors, Radius, FontSize, Spacing } from '../config/theme';
import TypingIndicator from './TypingIndicator';

interface Props {
  message: Message;
  onSuggestionPress: (s: string) => void;
  isTyping?: boolean;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, onSuggestionPress, isTyping = false }: Props) {
  const isUser = message.role === 'user';
  const slideAnim = useRef(new Animated.Value(isUser ? 30 : -30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  if (isTyping) {
    return (
      <Animated.View style={[styles.row, styles.rowLeft, { opacity: opacityAnim, transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🍽️</Text>
        </View>
        <View style={[styles.bubble, styles.assistantBubble]}>
          <TypingIndicator />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: opacityAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🍽️</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 12,
    gap: 8,
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  userText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  assistantText: {
    color: Colors.textMain,
  },
  timestamp: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(26,26,46,0.6)',
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: Colors.textMuted,
  },
});
