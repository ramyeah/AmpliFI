import { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator, Dimensions
} from 'react-native';
import { getFlashcardAnswer } from '../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 260;

function SingleCard({ card, index, total, prefetchedAnswer }) {
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState(prefetchedAnswer || null);
  const [loading, setLoading] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Update answer if prefetch arrives after mount
  useEffect(() => {
    if (prefetchedAnswer && !answer) setAnswer(prefetchedAnswer);
  }, [prefetchedAnswer]);

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '180deg']
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1], outputRange: ['180deg', '360deg']
  });

  const handleFlip = () => {
    const toValue = flipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue, friction: 8, tension: 10, useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };

  return (
    <TouchableOpacity
      style={styles.cardWrapper}
      onPress={handleFlip}
      activeOpacity={1}
    >
      {/* Front */}
      <Animated.View style={[
        styles.card, styles.cardFront,
        { transform: [{ rotateY: frontRotate }] },
        flipped && { position: 'absolute' },
      ]}>
        <View style={styles.cardPill}>
          <Text style={styles.cardPillText}>QUESTION {index + 1}/{total}</Text>
        </View>
        <Text style={styles.questionText}>{card.q}</Text>
        <View style={styles.tapRow}>
          <Text style={styles.tapText}>👆 Tap to reveal answer</Text>
        </View>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[
        styles.card, styles.cardBack,
        { transform: [{ rotateY: backRotate }] },
        !flipped && { position: 'absolute', opacity: 0 },
      ]}>
        <View style={[styles.cardPill, styles.cardPillAnswer]}>
          <Text style={[styles.cardPillText, { color: '#059669' }]}>ANSWER {index + 1}/{total}</Text>
        </View>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching from knowledge base...</Text>
          </View>
        ) : answer ? (
          <Text style={styles.answerText}>{answer}</Text>
        ) : (
          <Text style={styles.answerText}>Unable to load answer. Please check your connection.</Text>
        )}
        <View style={styles.tapRow}>
          <Text style={styles.tapText}>👆 Tap to see question</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function FlashCardDeck({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const flatListRef = useRef(null);

  // Pre-fetch all answers in parallel on mount
  useEffect(() => {
    prefetchAll();
  }, []);

  const prefetchAll = async () => {
    const promises = flashcards.map(async (card, i) => {
      try {
        const result = await getFlashcardAnswer(card.q, card.ragQuery);
        if (!result.error) {
          setAnswers(prev => ({ ...prev, [i]: result.answer }));
        }
      } catch (e) {
        console.error(`Prefetch error for card ${i}:`, e);
      }
    });
    await Promise.all(promises);
  };

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.deckContainer}>
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {flashcards.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={flashcards}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <SingleCard
            card={item}
            index={index}
            total={flashcards.length}
            prefetchedAnswer={answers[index]}
          />
        )}
      />

      {/* Swipe hint */}
      <Text style={styles.swipeHint}>
        {currentIndex < flashcards.length - 1
          ? '← swipe for next card →'
          : '✅ All cards reviewed!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  deckContainer: { marginBottom: 24 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#4F46E5', width: 20 },
  cardWrapper: {
    width: SCREEN_WIDTH - 48,
    height: CARD_HEIGHT,
    marginHorizontal: 24,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 20,
    padding: 24,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardFront: { backgroundColor: '#fff' },
  cardBack: { backgroundColor: '#F0FDF4' },
  cardPill: {
    backgroundColor: '#EEF2FF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  cardPillAnswer: { backgroundColor: '#DCFCE7' },
  cardPillText: { fontSize: 11, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.5 },
  questionText: {
    fontSize: 17, fontWeight: '700', color: '#111827',
    lineHeight: 26, flex: 1, marginTop: 12,
  },
  answerText: {
    fontSize: 14, color: '#374151',
    lineHeight: 22, flex: 1, marginTop: 12,
  },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#6B7280' },
  tapRow: { alignItems: 'center', marginTop: 8 },
  tapText: { fontSize: 12, color: '#9CA3AF' },
  swipeHint: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 12 },
});