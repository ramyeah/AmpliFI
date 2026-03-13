import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getProgress } from '../../lib/progress';
import { MODULES } from '../../constants/modules';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const findChapterData = (chapterId) => {
  for (const mod of MODULES) {
    for (const chapter of mod.chapters) {
      if (chapter.id === chapterId) {
        return { chapter, module: mod };
      }
    }
  }
  return null;
};

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4F46E5', '#059669', '#F59E0B', '#EC4899', '#0891B2'];

function ConfettiPiece({ delay, color, startX, size }) {
  const y       = useRef(new Animated.Value(-30)).current;
  const x       = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 160;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(y,       { toValue: SH * 0.7, duration: 2400, useNativeDriver: true }),
        Animated.timing(x,       { toValue: drift,    duration: 2400, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1,  duration: 150,  useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0,  duration: 700, delay: 1500, useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${Math.random() > 0.5 ? 540 : -720}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: 0,
        width: size,
        height: size,
        borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: y }, { translateX: x }, { rotate: spin }],
      }}
    />
  );
}

function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1000,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: Math.random() * SW,
    size: 6 + Math.random() * 8,
  }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}
    </View>
  );
}

// ─── Lesson Summary Row ───────────────────────────────────────────────────────
function LessonRow({ lesson, isCompleted, moduleColor }) {
  return (
    <View style={[row.container, isCompleted && row.containerDone]}>
      <View style={[row.iconCircle, { backgroundColor: isCompleted ? moduleColor : '#F3F4F6' }]}>
        <Text style={row.icon}>{isCompleted ? '✓' : lesson.icon}</Text>
      </View>
      <View style={row.text}>
        <Text style={row.title} numberOfLines={1}>{lesson.title}</Text>
        <Text style={row.meta}>{lesson.fincoins ?? 55} 💰</Text>
      </View>
      {isCompleted && <Text style={[row.check, { color: moduleColor }]}>✓</Text>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ChapterCompleteScreen() {
  const router = useRouter();
  const { chapterId } = useLocalSearchParams();
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animations
  const headerScale  = useRef(new Animated.Value(0.8)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const bodyOpacity  = useRef(new Animated.Value(0)).current;
  const badgeBounce  = useRef(new Animated.Value(-8)).current;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (!loading) {
      setShowConfetti(true);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(headerScale,   { toValue: 1,   friction: 7, tension: 70, useNativeDriver: true }),
          Animated.timing(headerOpacity, { toValue: 1,   duration: 400,            useNativeDriver: true }),
        ]),
        Animated.spring(badgeBounce, { toValue: 0, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(bodyOpacity,   { toValue: 1,   duration: 350,            useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const loadProgress = async () => {
    const progress = await getProgress();
    setCompletedLessons(progress.completedLessons);
    setLoading(false);
  };

  const data = findChapterData(chapterId);
  if (!data || loading) return <View style={styles.container} />;

  const { chapter, module: mod } = data;
  const totalFincoins = chapter.lessons.reduce((sum, l) => sum + (l.fincoins ?? 55), 0);
  const earnedFincoins = chapter.lessons
    .filter(l => completedLessons.includes(l.id))
    .reduce((sum, l) => sum + (l.fincoins ?? 55), 0);

  // Find next chapter
  const allChapters = mod.chapters;
  const chapIdx = allChapters.findIndex(c => c.id === chapterId);
  const nextChapter = allChapters[chapIdx + 1];

  // Find next module
  const modIdx = MODULES.findIndex(m => m.id === mod.id);
  const nextModule = MODULES[modIdx + 1];

  const handleContinue = () => router.replace('/learn');

  return (
    <View style={styles.container}>
      {showConfetti && <Confetti />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header card */}
        <Animated.View
          style={[
            styles.headerCard,
            { backgroundColor: mod.color, opacity: headerOpacity, transform: [{ scale: headerScale }] },
          ]}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.badge, { transform: [{ translateY: badgeBounce }] }]}>
            <Text style={styles.badgeEmoji}>{chapter.icon}</Text>
          </Animated.View>

          <Text style={styles.completeLabel}>CHAPTER COMPLETE</Text>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>

          {/* Fincoins earned */}
          <View style={styles.coinChip}>
            <Text style={styles.coinEmoji}>💰</Text>
            <Text style={styles.coinText}>{earnedFincoins} FinCoins earned</Text>
          </View>
        </Animated.View>

        {/* Body */}
        <Animated.View style={[styles.body, { opacity: bodyOpacity }]}>

          {/* Lessons summary */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Lessons in this chapter</Text>
            {chapter.lessons.map(l => (
              <LessonRow
                key={l.id}
                lesson={l}
                isCompleted={completedLessons.includes(l.id)}
                moduleColor={mod.color}
              />
            ))}
          </View>

          {/* What's next */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What's next</Text>
            {nextChapter ? (
              <View style={[styles.nextCard, { borderColor: mod.color + '40' }]}>
                <Text style={styles.nextIcon}>{nextChapter.icon}</Text>
                <View style={styles.nextText}>
                  <Text style={styles.nextLabel}>Next Chapter</Text>
                  <Text style={styles.nextTitle}>{nextChapter.title}</Text>
                  {nextChapter.description && (
                    <Text style={styles.nextDesc} numberOfLines={2}>{nextChapter.description}</Text>
                  )}
                </View>
              </View>
            ) : nextModule ? (
              <View style={[styles.nextCard, { borderColor: nextModule.color + '40', backgroundColor: nextModule.colorLight ?? '#F9FAFB' }]}>
                <Text style={styles.nextIcon}>{nextModule.icon}</Text>
                <View style={styles.nextText}>
                  <Text style={[styles.nextLabel, { color: nextModule.color }]}>Next Module</Text>
                  <Text style={styles.nextTitle}>{nextModule.title}</Text>
                  {nextModule.description && (
                    <Text style={styles.nextDesc} numberOfLines={2}>{nextModule.description}</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={[styles.nextCard, { borderColor: '#F59E0B40', backgroundColor: '#FFFBEB' }]}>
                <Text style={styles.nextIcon}>🏆</Text>
                <View style={styles.nextText}>
                  <Text style={[styles.nextLabel, { color: '#D97706' }]}>Journey Complete</Text>
                  <Text style={styles.nextTitle}>You've finished the entire roadmap!</Text>
                </View>
              </View>
            )}
          </View>

        </Animated.View>
      </ScrollView>

      {/* Continue CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: mod.color }]}
          onPress={handleContinue}
          activeOpacity={0.87}
        >
          <Text style={styles.ctaBtnText}>
            {nextChapter ? `Start ${nextChapter.title} →` : 'Back to Map →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  scroll:    { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  headerCard: {
    alignItems: 'center',
    paddingTop: 64, paddingBottom: 36, paddingHorizontal: 28,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    marginBottom: 8,
  },
  backBtn: { position: 'absolute', top: 56, left: 20, padding: 8 },
  backBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  badge: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  badgeEmoji:    { fontSize: 44 },
  completeLabel: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2, marginBottom: 8,
  },
  chapterTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff',
    textAlign: 'center', marginBottom: 20, lineHeight: 30,
  },
  coinChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
  },
  coinEmoji: { fontSize: 22 },
  coinText:  { fontSize: 16, fontWeight: '800', color: '#fff' },

  body:    { paddingHorizontal: 20, paddingTop: 16, gap: 24 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.5, marginBottom: 4,
  },

  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  nextIcon:  { fontSize: 30 },
  nextText:  { flex: 1 },
  nextLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.3, marginBottom: 2 },
  nextTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  nextDesc:  { fontSize: 12, color: '#6B7280', lineHeight: 17 },

  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#F8F7FF', paddingHorizontal: 20,
    paddingTop: 12, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  ctaBtn: {
    borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});

// ─── Lesson Row Styles ────────────────────────────────────────────────────────
const row = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  containerDone: { borderColor: '#E5E7EB' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  icon:  { fontSize: 18, color: '#fff' },
  text:  { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#111827' },
  meta:  { fontSize: 12, color: '#6B7280', marginTop: 2 },
  check: { fontSize: 18, fontWeight: '800' },
});