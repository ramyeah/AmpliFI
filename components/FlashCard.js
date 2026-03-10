import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator, Dimensions
} from 'react-native';
import { getFlashcardAnswer } from '../lib/api';

const CARD_WIDTH = Dimensions.get('window').width - 48;

export default function FlashCard({ question, ragQuery, index, total }) {
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Cache answer so re-flipping is instant
  const answerCache = useRef(null);

  const flipAnim = useRef(new Animated.Value(0)).current;

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const handleFlip = async () => {
    if (flipped) {
      // Flip back to question
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setFlipped(false);
      return;
    }

    // Flip to answer
    Animated.spring(flipAnim, {
      toValue: 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setFlipped(true);

    // Fetch answer if not cached
    if (answerCache.current) {
      setAnswer(answerCache.current);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const result = await getFlashcardAnswer(question, ragQuery);
      if (result.error) {
        setError(true);
      } else {
        answerCache.current = result.answer;
        setAnswer(result.answer);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.counter}>{index + 1} / {total}</Text>

      <TouchableOpacity onPress={handleFlip} activeOpacity={0.9}>
        {/* Front — Question */}
        <Animated.View style={[
          styles.card,
          styles.cardFront,
          { transform: [{ rotateY: frontInterpolate }] },
          flipped && styles.hidden,
        ]}>
          <View style={styles.cardTag}>
            <Text style={styles.cardTagText}>QUESTION</Text>
          </View>
          <Text style={styles.question}>{question}</Text>
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>Tap to reveal answer →</Text>
          </View>
        </Animated.View>

        {/* Back — Answer */}
        <Animated.View style={[
          styles.card,
          styles.cardBack,
          { transform: [{ rotateY: backInterpolate }] },
          !flipped && styles.hidden,
        ]}>
          <View style={[styles.cardTag, styles.cardTagAnswer]}>
            <Text style={[styles.cardTagText, { color: '#059669' }]}>ANSWER</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.loadingText}>Fetching from knowledge base...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>
              Unable to load answer. Check your connection and tap to retry.
            </Text>
          ) : (
            <Text style={styles.answer}>{answer}</Text>
          )}

          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>← Tap to see question</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24 },
  counter: { fontSize: 13, color: '#6B7280', marginBottom: 12, fontWeight: '600' },
  card: {
    width: CARD_WIDTH,
    minHeight: 220,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardFront: { backgroundColor: '#fff' },
  cardBack: {
    backgroundColor: '#F0FDF4',
    position: 'absolute',
    top: 0,
  },
  hidden: { opacity: 0 },
  cardTag: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  cardTagAnswer: { backgroundColor: '#DCFCE7' },
  cardTagText: { fontSize: 11, fontWeight: '700', color: '#4F46E5', letterSpacing: 1 },
  question: { fontSize: 18, fontWeight: '700', color: '#111827', lineHeight: 26, flex: 1 },
  answer: { fontSize: 15, color: '#374151', lineHeight: 24, flex: 1 },
  tapHint: { marginTop: 16, alignItems: 'center' },
  tapHintText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: '#6B7280' },
  errorText: { fontSize: 14, color: '#EF4444', lineHeight: 22, flex: 1 },
});