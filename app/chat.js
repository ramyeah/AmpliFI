import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { askRAG } from '../lib/api';
import useUserStore from '../store/userStore';
import { Colors, Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { useSafeBack } from '../hooks/useHardwareBack';

const SUGGESTED_QUESTIONS = [
  { icon: '🏦', text: 'What is the CPF Ordinary Account interest rate?' },
  { icon: '📅', text: 'How does dollar-cost averaging work?' },
  { icon: '📋', text: 'What is the MAS-regulated investment limit?' },
  { icon: '🇸🇬', text: 'How do Singapore Savings Bonds work?' },
  { icon: '📈', text: "What's the difference between stocks and ETFs?" },
  { icon: '💡', text: 'How should a student start investing in Singapore?' },
];

// ─── Typing indicator — bouncing dots with scale + opacity ────────────────────
function TypingDots() {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    anims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.spring(anim, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.delay((anims.length - i) * 160),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={td.row}>
      {anims.map((anim, i) => {
        const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
        const opacity = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.35, 1, 0.35] });
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
        return (
          <Animated.View
            key={i}
            style={[td.dot, { transform: [{ scale }, { translateY }], opacity }]}
          />
        );
      })}
    </View>
  );
}
const td = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});

// ─── Suggestion card ──────────────────────────────────────────────────────────
function SuggestionCard({ icon, text, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  return (
    <Animated.View style={[sg.cardWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={sg.card}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        <Text style={sg.icon}>{icon}</Text>
        <Text style={sg.text} numberOfLines={3}>{text}</Text>
        <Text style={sg.arrow}>→</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const sg = StyleSheet.create({
  cardWrap: { width: '48.5%' },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
    minHeight: 80,
    justifyContent: 'space-between',
  },
  icon:  { fontSize: 18 },
  text:  { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: Colors.textPrimary, lineHeight: 17, flex: 1 },
  arrow: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs, color: Colors.textMuted, alignSelf: 'flex-end' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const router    = useRouter();
  const goBack    = useSafeBack('/(tabs)/home');
  const profile   = useUserStore((s) => s.profile);
  const scrollRef = useRef(null);
  const insets    = useSafeAreaInsets();
  const firstName = profile?.name?.split(' ')[0] || 'there';

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi ${firstName}! 👋 I'm Finn, your Singapore financial literacy assistant.\n\nAsk me anything about investing, CPF, savings, or managing money in Singapore!`,
    },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
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
        setMessages(prev => [...prev, { role: 'assistant', text: result.response }]);
      }
    } catch {
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
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.finnAvatar}>
            <Text style={s.finnEmoji}>🦉</Text>
          </View>
          <View>
            <Text style={s.headerTitle}>Finn</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>Online</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={s.messages}
        contentContainerStyle={s.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Suggestion cards — only at start */}
        {messages.length === 1 && (
          <View style={s.suggestions}>
            <Text style={s.suggestionsLabel}>SUGGESTED QUESTIONS</Text>
            <View style={s.suggestionsGrid}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <SuggestionCard
                  key={i}
                  icon={q.icon}
                  text={q.text}
                  onPress={() => sendMessage(q.text)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              s.bubbleRow,
              msg.role === 'user' ? s.bubbleRowUser : s.bubbleRowAssistant,
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={s.bubbleAvatar}>
                <Text style={s.bubbleAvatarEmoji}>🦉</Text>
              </View>
            )}
            <View style={[
              s.bubble,
              msg.role === 'user' ? s.userBubble      : s.assistantBubble,
              msg.isDisclaimer    ? s.disclaimerBubble : null,
              msg.isError         ? s.errorBubble      : null,
            ]}>
              <Text style={[
                s.bubbleText,
                msg.role === 'user' ? s.userBubbleText : null,
                msg.isDisclaimer    ? s.disclaimerText : null,
                msg.isError         ? s.errorText      : null,
              ]}>
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {/* Typing indicator */}
        {loading && (
          <View style={[s.bubbleRow, s.bubbleRowAssistant]}>
            <View style={s.bubbleAvatar}>
              <Text style={s.bubbleAvatarEmoji}>🦉</Text>
            </View>
            <View style={[s.assistantBubble, s.typingBubble]}>
              <TypingDots />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input bar ── */}
      <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Finn anything..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={300}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
        >
          <Text style={s.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl + Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radii.full,
    backgroundColor: Colors.lightGray,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon:    { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  headerCenter:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  finnAvatar:  { width: 40, height: 40, borderRadius: Radii.full, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  finnEmoji:   { fontSize: 22 },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.successDark },
  onlineText:  { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.successDark },

  // ── Messages
  messages:        { flex: 1 },
  messagesContent: { padding: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.md },

  // ── Suggestions
  suggestions:      { marginBottom: Spacing.lg, gap: Spacing.md },
  suggestionsLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },

  // ── Bubble rows
  bubbleRow:          { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  bubbleRowUser:      { justifyContent: 'flex-end' },
  bubbleRowAssistant: { justifyContent: 'flex-start' },
  bubbleAvatar: {
    width: 30, height: 30, borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  bubbleAvatarEmoji: { fontSize: 16 },

  // ── Bubbles
  bubble: { borderRadius: Radii.xl, padding: Spacing.lg, maxWidth: '78%' },
  userBubble:       { backgroundColor: Colors.primary, borderBottomRightRadius: Radii.sm },
  assistantBubble:  { backgroundColor: Colors.white, borderBottomLeftRadius: Radii.sm, ...Shadows.soft },
  disclaimerBubble: { backgroundColor: Colors.warningLight, borderWidth: 1, borderColor: Colors.warningDark },
  errorBubble:      { backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerMid },

  typingBubble:     { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minWidth: 72 },
  bubbleText:     { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.base, color: Colors.textPrimary, lineHeight: 24 },
  userBubbleText: { color: Colors.white },
  disclaimerText: { color: Colors.warningDark },
  errorText:      { color: Colors.dangerDark },

  // ── Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn:    { width: 46, height: 46, borderRadius: Radii.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.soft },
  sendBtnOff: { backgroundColor: Colors.border },
  sendIcon:   { fontFamily: Typography.fontFamily.bold, fontSize: 20, color: Colors.white },
});