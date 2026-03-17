import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getLessonById } from '../../constants/modules';
import { generateQuiz } from '../../lib/api';
import useUserStore from '../../store/userStore';
import { doc, updateDoc, getDoc, setDoc, increment } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useSafeBack } from '../../hooks/useHardwareBack';

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)/learn');
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);
  const lesson = getLessonById(id);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await generateQuiz(lesson.topic, profile);

      // DEBUG - paste what you see in terminal here
      console.log('Quiz raw result:', JSON.stringify(result));

      if (result.disclaimer || result.error) {
        console.log('Disclaimer or error flag triggered');
        setError(true);
        return;
      }

      let parsed;
      try {
        // Try to extract JSON from anywhere in the response
        const raw = result.response || '';
        console.log('Raw response string:', raw);

        // Strip code fences
        const clean = raw
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        // Try to find JSON object in the string
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON object found in response');
          setError(true);
          return;
        }

        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('JSON parse error:', e.message);
        setError(true);
        return;
      }

      if (!parsed.questions || parsed.questions.length === 0) {
        console.error('No questions in parsed response');
        setError(true);
        return;
      }

      setQuestions(parsed.questions);
    } catch (e) {
      console.error('Quiz load error:', e.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option) => {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);
    const correct = option.startsWith(questions[currentQ].correct);
    if (correct) setScore((s) => s + 1);
  };

  const handleNext = async () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowFeedback(false);
    } else {
      setFinished(true);
      await saveProgress();
    }
  };

  const saveProgress = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const passed = score + (selected?.startsWith(questions[currentQ]?.correct) ? 1 : 0) >= Math.ceil(questions.length * 0.6);

    if (passed) {
      await updateDoc(doc(db, 'users', uid), {
        finCoins: increment(lesson.fincoins ?? 55)
      });

      const progressRef = doc(db, 'progress', uid);
      const progressDoc = await getDoc(progressRef);
      const completed = progressDoc.exists() ? progressDoc.data().completedLessons || [] : [];
      if (!completed.includes(id)) {
        await setDoc(progressRef, { completedLessons: [...completed, id] }, { merge: true });
      }

      setProfile({ ...profile, finCoins: (profile?.finCoins || 0) + (lesson.fincoins ?? 55) });
    }
  };

  if (!lesson) return null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1F4E79" />
        <Text style={styles.loadingText}>Generating your quiz...</Text>
        <Text style={styles.loadingSubtext}>This may take up to 20 seconds</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load quiz. Please try again.</Text>
        <TouchableOpacity style={styles.btn} onPress={loadQuiz}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#999', marginTop: 12 }]} onPress={goBack}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (finished) {
    const total = questions.length;
    const passed = score >= Math.ceil(total * 0.6);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.resultIcon}>{passed ? '🎉' : '📖'}</Text>
        <Text style={styles.resultTitle}>{passed ? 'Quiz Passed!' : 'Keep Studying!'}</Text>
        <Text style={styles.resultScore}>{score}/{total} correct</Text>
        {passed ? (
          <Text style={styles.resultMsg}>
            You earned {lesson.fincoins ?? 55} FinCoins! The next lesson is now unlocked.
          </Text>
        ) : (
          <Text style={styles.resultMsg}>
            You need 60% to pass. Review the lesson and try again!
          </Text>
        )}
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/learn')}>
          <Text style={styles.btnText}>Back to Lessons</Text>
        </TouchableOpacity>
        {!passed && (
          <TouchableOpacity style={[styles.btn, styles.retryBtn]} onPress={() => {
            setFinished(false);
            setCurrentQ(0);
            setScore(0);
            setSelected(null);
            setShowFeedback(false);
            loadQuiz();
          }}>
            <Text style={styles.btnText}>Retry Quiz</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  const q = questions[currentQ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.progress}>Question {currentQ + 1} of {questions.length}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentQ) / questions.length) * 100}%` }]} />
      </View>

      <Text style={styles.question}>{q.question}</Text>

      {q.options.map((option) => {
        const isCorrect = option.startsWith(q.correct);
        const isSelected = selected === option;
        let bgColor = '#fff';
        if (showFeedback && isCorrect) bgColor = '#D6EAD8';
        if (showFeedback && isSelected && !isCorrect) bgColor = '#FCE8E8';

        return (
          <TouchableOpacity
            key={option}
            style={[styles.option, { backgroundColor: bgColor }]}
            onPress={() => handleAnswer(option)}
            disabled={showFeedback}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        );
      })}

      {showFeedback && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackTitle}>
            {selected?.startsWith(q.correct) ? '✅ Correct!' : '❌ Incorrect'}
          </Text>
          <Text style={styles.feedbackText}>{q.explanation}</Text>
          <TouchableOpacity style={styles.btn} onPress={handleNext}>
            <Text style={styles.btnText}>
              {currentQ + 1 < questions.length ? 'Next Question →' : 'See Results'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 16, color: '#666', fontSize: 14 },
  loadingSubtext: { marginTop: 8, color: '#999', fontSize: 12 },
  errorText: { color: '#E74C3C', fontSize: 16, marginBottom: 24, textAlign: 'center' },
  progress: { fontSize: 14, color: '#666', marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 24 },
  progressFill: { height: 6, backgroundColor: '#1F4E79', borderRadius: 3 },
  question: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79', marginBottom: 24, lineHeight: 26 },
  option: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 14, marginBottom: 12 },
  optionText: { fontSize: 15, color: '#333' },
  feedback: { marginTop: 16, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 },
  feedbackTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  feedbackText: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 16 },
  btn: { backgroundColor: '#1F4E79', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  retryBtn: { backgroundColor: '#E67E22', marginTop: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultIcon: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', textAlign: 'center', marginBottom: 8 },
  resultScore: { fontSize: 22, textAlign: 'center', color: '#333', marginBottom: 16 },
  resultMsg: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 32, lineHeight: 24 },
});