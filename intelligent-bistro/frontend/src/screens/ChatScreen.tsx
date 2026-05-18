import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useStore, Message } from '../store/useStore';
import MessageBubble from '../components/MessageBubble';
import SuggestionChips from '../components/SuggestionChips';
import CartToast from '../components/CartToast';
import { Colors, FontSize, Spacing, Radius } from '../config/theme';

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Bonsoir! I'm Auguste, your personal culinary concierge at The Intelligent Bistro. I can guide you through our menu, suggest perfect pairings, and build your ideal meal — just ask. What are you in the mood for tonight?",
  suggestions: [
    "What's the chef's special?",
    'Show me vegetarian options',
    "Recommend a wine pairing",
  ],
  timestamp: new Date(),
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const messages = useStore((s) => s.messages);
  const isTyping = useStore((s) => s.isTyping);
  const sendMessage = useStore((s) => s.sendMessage);
  const addMessage = useStore((s) => s.addMessage);
  const lastCartToast = useStore((s) => s.lastCartToast);

  const [inputText, setInputText] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Show welcome message once
  useEffect(() => {
    if (!initialized && messages.length === 0) {
      addMessage(WELCOME_MESSAGE);
      setInitialized(true);
    } else {
      setInitialized(true);
    }
  }, []);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    sendMessage(text);
  }, [inputText, isTyping, sendMessage]);

  const handleSuggestion = useCallback(
    (s: string) => {
      if (isTyping) return;
      sendMessage(s);
    },
    [isTyping, sendMessage],
  );

  const lastMessage = messages[messages.length - 1];
  const lastSuggestions =
    lastMessage?.role === 'assistant' && !isTyping ? lastMessage.suggestions || [] : [];

  // Combine messages with typing indicator placeholder
  const displayMessages: (Message | { id: string; isTyping: true })[] = [
    ...messages,
    ...(isTyping ? [{ id: 'typing-indicator', isTyping: true as const }] : []),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CartToast message={lastCartToast} />

      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.surface]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Auguste</Text>
            <Text style={styles.headerSubtitle}>Your culinary concierge · AI-powered</Text>
          </View>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="robot-outline" size={14} color={Colors.accent} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Message list (inverted) */}
        <FlatList
          ref={flatListRef}
          data={[...displayMessages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if ('isTyping' in item && item.isTyping) {
              return (
                <MessageBubble
                  message={{ id: 'typing', role: 'assistant', content: '', timestamp: new Date() }}
                  onSuggestionPress={handleSuggestion}
                  isTyping
                />
              );
            }
            return (
              <MessageBubble
                message={item as Message}
                onSuggestionPress={handleSuggestion}
              />
            );
          }}
        />

        {/* Quick suggestions above input */}
        {lastSuggestions.length > 0 && (
          <View style={styles.quickSuggestions}>
            <SuggestionChips suggestions={lastSuggestions} onSelect={handleSuggestion} />
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything… 'I'd like the salmon'"
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.8}
          >
            {isTyping ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={inputText.trim() ? Colors.primary : Colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiBadgeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  messageList: {
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
  },
  quickSuggestions: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.textMain,
    fontSize: FontSize.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.card,
  },
});
