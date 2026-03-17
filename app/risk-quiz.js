// app/risk-quiz.js
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import useUserStore from '../store/userStore';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../constants/theme';
import { ADVISOR } from '../constants/simulation';
import { useSafeBack } from '../hooks/useHardwareBack';

// ─── Quiz questions ────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 'q1',
    question: 'You invest $1,000 and it drops 20% in a month. What do you do?',
    icon: '📉',
    options: [
      { text: 'Sell everything — I can\'t afford to lose more.',            score: 0 },
      { text: 'Hold and wait — short-term dips are normal.',                score: 1 },
      { text: 'Buy more — prices are cheaper now.',                         score: 2 },
    ],
  },
  {
    id: 'q2',
    question: 'You receive a $3,000 bonus. How do you invest it?',
    icon: '💰',
    options: [
      { text: 'SSBs and fixed deposits — guaranteed returns only.',         score: 0 },
      { text: 'Half in a diversified ETF, half in SSBs.',                   score: 1 },
      { text: 'Mostly equities — I want maximum growth.',                   score: 2 },
    ],
  },
  {
    id: 'q3',
    question: 'What is your investment time horizon?',
    icon: '📅',
    options: [
      { text: 'Less than 3 years — I may need the money soon.',             score: 0 },
      { text: '3 to 10 years — medium term.',                               score: 1 },
      { text: 'More than 10 years — I\'m investing for the long run.',      score: 2 },
    ],
  },
  {
    id: 'q4',
    question: 'Which statement best describes your financial situation?',
    icon: '🧮',
    options: [
      { text: 'No emergency fund yet — my savings are limited.',            score: 0 },
      { text: 'I have 3 months of expenses saved and some surplus.',        score: 1 },
      { text: 'Emergency fund fully funded and I invest regularly.',        score: 2 },
    ],
  },
  {
    id: 'q5',
    question: 'A friend recommends an "8% guaranteed return" investment. What do you think?',
    icon: '🚨',
    options: [
      { text: 'Sounds great — I\'d invest immediately.',                     score: 0 },
      { text: 'I\'d research it carefully before committing anything.',      score: 1 },
      { text: 'Guaranteed high returns are a red flag — this is likely a scam.', score: 2 },
    ],
  },
];

// Score → profile mapping
function scoreToProfile(total) {
  if (total <= 3) return 'conservative';
  if (total <= 7) return 'balanced';
  return 'aggressive';
}

const PROFILE_INFO = {
  conservative: {
    label: 'Conservative 🛡️',
    color: Colors.successDark,
    colorLight: Colors.successLight,
    description: 'You prioritise capital protection over growth. Your simulation will lean heavily on bonds, SSBs, and CPF — low volatility, steady returns.',
    tip: 'As your knowledge and emergency fund grow, consider gradually increasing equity exposure for better long-term returns.',
  },
  balanced: {
    label: 'Balanced ⚖️',
    color: Colors.warningDark,
    colorLight: Colors.warningLight,
    description: 'You balance growth with security. Your simulation will split across equities, bonds, and robo-advisors — moderate volatility, good long-term potential.',
    tip: 'A balanced portfolio is ideal for most investors in their 20s–30s. Stay consistent and avoid reacting to short-term events.',
  },
  aggressive: {
    label: 'Aggressive 🚀',
    color: Colors.danger,
    colorLight: Colors.dangerLight,
    description: 'You seek maximum growth and can tolerate significant short-term losses. Your simulation will be equity-heavy — high volatility, high potential reward.',
    tip: 'Make sure your emergency fund is fully funded before taking on equity-heavy risk. Volatility is only manageable when you have a safety net.',
  },
};

export default function RiskQuizScreen() {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)/simulate');
  const setProfile = useUserStore((state) => state.setProfile);
  const profile = useUserStore((state) => state.profile);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const question = QUESTIONS[currentQ];
  const progress = (currentQ / QUESTIONS.length) * 100;

  const handleAnswer = (option) => {
    const newAnswers = [...answers, option.score];

    if (currentQ < QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ(q => q + 1);
    } else {
      // Score and show result
      const total = newAnswers.reduce((a, b) => a + b, 0);
      setResult(scoreToProfile(total));
    }
  };

  const saveAndContinue = async () => {
    if (!result) return;
    setSaving(true);
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { riskProfile: result });
      setProfile({ ...profile, riskProfile: result });
    }
    setSaving(false);
    router.replace('/(tabs)/simulate');
  };

  // ── Result screen ──
  if (result) {
    const info = PROFILE_INFO[result];
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.resultBadge, { backgroundColor: info.colorLight }]}>
          <Text style={styles.resultBadgeEmoji}>{ADVISOR.emoji}</Text>
        </View>

        <Text style={styles.resultHeading}>Your Risk Profile</Text>
        <Text style={[styles.resultLabel, { color: info.color }]}>{info.label}</Text>
        <Text style={styles.resultDesc}>{info.description}</Text>

        <View style={[styles.tipCard, { borderLeftColor: info.color, backgroundColor: info.colorLight }]}>
          <Text style={styles.tipTitle}>{ADVISOR.name} says</Text>
          <Text style={styles.tipText}>{info.tip}</Text>
        </View>

        <View style={styles.profileBreakdown}>
          <Text style={styles.breakdownTitle}>What this means for your simulation</Text>
          {[
            { label: 'Stocks / ETFs',           pct: result === 'conservative' ? 10 : result === 'balanced' ? 30 : 50, color: '#5BBF8A' },
            { label: 'Bonds / Fixed Deposits',  pct: result === 'conservative' ? 50 : result === 'balanced' ? 30 : 10, color: '#F5883A' },
            { label: 'CPF Investment Scheme',   pct: result === 'conservative' ? 30 : result === 'balanced' ? 20 : 10, color: '#8B6FD4' },
            { label: 'Robo-Advisor Fund',       pct: result === 'conservative' ? 10 : result === 'balanced' ? 20 : 30, color: '#FF8E3C' },
          ].map(item => (
            <View key={item.label} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <View style={styles.breakdownBarBg}>
                <View style={[styles.breakdownBarFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={[styles.breakdownPct, { color: item.color }]}>{item.pct}%</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: info.color, opacity: saving ? 0.7 : 1 }]}
          onPress={saveAndContinue}
          disabled={saving}
        >
          <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save & Start Investing →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Question screen ──
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Back */}
      <TouchableOpacity onPress={goBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.quizTitle}>Risk Tolerance Quiz</Text>
      <Text style={styles.quizSubtitle}>5 quick questions to personalise your investing simulation</Text>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>Question {currentQ + 1} of {QUESTIONS.length}</Text>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      {/* Question card */}
      <View style={styles.questionCard}>
        <Text style={styles.questionIcon}>{question.icon}</Text>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      {/* Options */}
      {question.options.map((option, i) => (
        <TouchableOpacity
          key={i}
          style={styles.optionCard}
          onPress={() => handleAnswer(option)}
          activeOpacity={0.75}
        >
          <View style={styles.optionIndex}>
            <Text style={styles.optionIndexText}>{String.fromCharCode(65 + i)}</Text>
          </View>
          <Text style={styles.optionText}>{option.text}</Text>
        </TouchableOpacity>
      ))}

      {/* NPC note */}
      <View style={styles.npcNote}>
        <Text style={styles.npcEmoji}>{ADVISOR.emoji}</Text>
        <Text style={styles.npcText}>There are no wrong answers — this quiz personalises your simulation, not your real money.</Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingTop: Spacing.xxxl },

  backBtn: { marginBottom: Spacing.lg },
  backText: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.primary },

  quizTitle: { fontSize: 26, fontFamily: Fonts.extraBold, color: Colors.textPrimary, marginBottom: 6 },
  quizSubtitle: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textMuted, marginBottom: Spacing.lg },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 12, fontFamily: Fonts.semiBold, color: Colors.textMuted },
  progressBarBg: { height: 6, backgroundColor: Colors.lightGray, borderRadius: 3, marginBottom: Spacing.xl, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },

  questionCard: {
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    padding: Spacing.xl, marginBottom: Spacing.lg,
    alignItems: 'center', ...Shadows.soft,
  },
  questionIcon: { fontSize: 40, marginBottom: Spacing.md },
  questionText: { fontSize: 17, fontFamily: Fonts.bold, color: Colors.textPrimary, textAlign: 'center', lineHeight: 26 },

  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radii.md,
    padding: Spacing.lg, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, ...Shadows.soft,
    gap: Spacing.md,
  },
  optionIndex: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  optionIndexText: { fontSize: 13, fontFamily: Fonts.bold, color: Colors.primary },
  optionText: { flex: 1, fontSize: 14, fontFamily: Fonts.regular, color: Colors.textPrimary, lineHeight: 21 },

  npcNote: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.secondaryLight, borderRadius: Radii.md,
    padding: Spacing.md, marginTop: Spacing.lg, gap: Spacing.sm,
  },
  npcEmoji: { fontSize: 20 },
  npcText: { flex: 1, fontSize: 12, fontFamily: Fonts.regular, color: Colors.textSecondary, lineHeight: 19 },

  // Result screen
  resultBadge: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.lg,
  },
  resultBadgeEmoji: { fontSize: 40 },
  resultHeading: { fontSize: 18, fontFamily: Fonts.semiBold, color: Colors.textMuted, textAlign: 'center', marginBottom: 6 },
  resultLabel: { fontSize: 30, fontFamily: Fonts.extraBold, textAlign: 'center', marginBottom: Spacing.md },
  resultDesc: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textSecondary, lineHeight: 23, marginBottom: Spacing.lg, textAlign: 'center' },

  tipCard: {
    borderRadius: Radii.md, padding: Spacing.md,
    borderLeftWidth: 3, marginBottom: Spacing.xl,
  },
  tipTitle: { fontSize: 12, fontFamily: Fonts.bold, color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  tipText: { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textSecondary, lineHeight: 21 },

  profileBreakdown: {
    backgroundColor: Colors.white, borderRadius: Radii.lg,
    padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadows.soft,
  },
  breakdownTitle: { fontSize: 14, fontFamily: Fonts.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: Spacing.sm },
  breakdownLabel: { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textSecondary, width: 130 },
  breakdownBarBg: { flex: 1, height: 6, backgroundColor: Colors.lightGray, borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: 6, borderRadius: 3 },
  breakdownPct: { fontSize: 12, fontFamily: Fonts.bold, width: 32, textAlign: 'right' },

  btn: { padding: 16, borderRadius: Radii.lg, alignItems: 'center', marginBottom: 8 },
  btnText: { fontSize: 15, fontFamily: Fonts.bold, color: Colors.white },
});