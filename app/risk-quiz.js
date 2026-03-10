import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import useUserStore from '../store/userStore';

const QUESTIONS = [
  {
    question: "If your portfolio dropped 20% in a month, what would you do?",
    options: [
      { text: "Sell everything immediately", score: 1 },
      { text: "Sell some to reduce risk", score: 2 },
      { text: "Hold and wait for recovery", score: 3 },
      { text: "Buy more at the lower price", score: 4 },
    ]
  },
  {
    question: "What is your primary investment goal?",
    options: [
      { text: "Preserve my capital above all", score: 1 },
      { text: "Steady income with some growth", score: 2 },
      { text: "Balance growth and stability", score: 3 },
      { text: "Maximum long-term growth", score: 4 },
    ]
  },
  {
    question: "How long do you plan to keep your investments?",
    options: [
      { text: "Less than 2 years", score: 1 },
      { text: "2–5 years", score: 2 },
      { text: "5–10 years", score: 3 },
      { text: "More than 10 years", score: 4 },
    ]
  },
  {
    question: "How familiar are you with investing?",
    options: [
      { text: "Complete beginner", score: 1 },
      { text: "I know the basics", score: 2 },
      { text: "Fairly comfortable", score: 3 },
      { text: "Very experienced", score: 4 },
    ]
  },
  {
    question: "Which investment would you prefer?",
    options: [
      { text: "Singapore Savings Bonds (guaranteed 3%)", score: 1 },
      { text: "CPF-IS unit trusts (stable ~5%)", score: 2 },
      { text: "Robo-advisor portfolio (6–8%)", score: 3 },
      { text: "STI ETF stocks (8–10%, volatile)", score: 4 },
    ]
  },
];

export default function RiskQuizScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);

  const handleSelect = (score) => {
    setSelected(score);
  };

  const handleNext = async () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];

    if (currentQ + 1 < QUESTIONS.length) {
      setAnswers(newAnswers);
      setCurrentQ((q) => q + 1);
      setSelected(null);
    } else {
      // Calculate risk profile
      const total = newAnswers.reduce((a, b) => a + b, 0);
      let riskProfile;
      if (total <= 8) riskProfile = 'conservative';
      else if (total <= 14) riskProfile = 'balanced';
      else riskProfile = 'aggressive';

      // Save to Firestore
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, 'users', uid), { riskProfile });
        setProfile({ ...profile, riskProfile });
      }

      router.replace({ pathname: '/simulate-main', params: { riskProfile } });
    }
  };

  const q = QUESTIONS[currentQ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Risk Tolerance Quiz 🎯</Text>
      <Text style={styles.subtitle}>
        Answer 5 questions to get your personalised investment profile
      </Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQ) / QUESTIONS.length) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>Question {currentQ + 1} of {QUESTIONS.length}</Text>

      <Text style={styles.question}>{q.question}</Text>

      {q.options.map((option, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.option, selected === option.score && styles.optionSelected]}
          onPress={() => handleSelect(option.score)}
        >
          <Text style={[styles.optionText, selected === option.score && styles.optionTextSelected]}>
            {option.text}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.btn, selected === null && styles.btnDisabled]}
        onPress={handleNext}
        disabled={selected === null}
      >
        <Text style={styles.btnText}>
          {currentQ + 1 < QUESTIONS.length ? 'Next →' : 'See My Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, backgroundColor: '#1F4E79', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#999', marginBottom: 24 },
  question: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 24, lineHeight: 26 },
  option: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 12 },
  optionSelected: { borderColor: '#1F4E79', backgroundColor: '#D6E4F0' },
  optionText: { fontSize: 15, color: '#333' },
  optionTextSelected: { color: '#1F4E79', fontWeight: '600' },
  btn: { backgroundColor: '#1F4E79', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  btnDisabled: { backgroundColor: '#aaa' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});