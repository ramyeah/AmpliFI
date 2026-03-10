import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { askRAG } from '../lib/api';
import useUserStore from '../store/userStore';

const SUGGESTED_QUESTIONS = [
  "What is the CPF Ordinary Account interest rate?",
  "How does dollar-cost averaging work?",
  "What is the MAS-regulated investment limit for retail investors?",
  "How do Singapore Savings Bonds work?",
  "What is the difference between stocks and ETFs?",
];

export default function ChatScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi ${profile?.name?.split(' ')[0] || 'there'}! 👋 I'm AmpliFI, your Singapore financial literacy assistant.\n\nAsk me anything about investing, CPF, savings, or managing money in Singapore!`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const result = await askRAG(userText, profile);

      if (result.disclaimer) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: "I don't have verified information on that topic. Please check the MAS or CPF Board official websites for accurate guidance.",
          isDisclaimer: true,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: result.response,
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Sorry, I'm having trouble connecting right now. Please check your connection and try again.",
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AmpliFI Chat</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={{ width: 48 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Suggested questions — only show at start */}
        {messages.length === 1 && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsLabel}>Try asking:</Text>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => sendMessage(q)}
              >
                <Text style={styles.suggestionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              msg.isDisclaimer && styles.disclaimerBubble,
              msg.isError && styles.errorBubble,
            ]}
          >
            {msg.role === 'assistant' && (
              <Text style={styles.bubbleLabel}>🤖 AmpliFI</Text>
            )}
            <Text style={[
              styles.bubbleText,
              msg.role === 'user' && styles.userBubbleText,
              msg.isDisclaimer && styles.disclaimerText,
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.assistantBubble}>
            <Text style={styles.bubbleLabel}>🤖 AmpliFI</Text>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#1F4E79" />
              <Text style={styles.typingText}>Searching knowledge base...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about CPF, investing, savings..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={300}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backText: { color: '#1F4E79', fontSize: 16, width: 48 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#27AE60' },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  suggestions: { marginBottom: 16 },
  suggestionsLabel: { fontSize: 13, color: '#999', marginBottom: 8 },
  suggestionChip: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#D6E4F0',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 8,
    alignSelf: 'flex-start',
  },
  suggestionText: { fontSize: 13, color: '#1F4E79' },
  bubble: { borderRadius: 16, padding: 14, marginBottom: 12, maxWidth: '85%' },
  userBubble: { backgroundColor: '#1F4E79', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  disclaimerBubble: { backgroundColor: '#FFF9E6', borderWidth: 1, borderColor: '#F39C12' },
  errorBubble: { backgroundColor: '#FEF0F0', borderWidth: 1, borderColor: '#E74C3C' },
  bubbleLabel: { fontSize: 11, color: '#999', marginBottom: 6, fontWeight: '600' },
  bubbleText: { fontSize: 15, color: '#333', lineHeight: 22 },
  userBubbleText: { color: '#fff' },
  disclaimerText: { color: '#666' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13, color: '#666' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', gap: 8,
  },
  input: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    color: '#333', maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1F4E79', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});