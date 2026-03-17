// app/chapter-complete/[chapterId].js

import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getProgress } from '../../lib/progress';
import { MODULES } from '../../constants/modules';
import { Colors as C, Fonts as F } from '../../constants/theme';
import useHardwareBack from '../../hooks/useHardwareBack';

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
          Animated.timing(opacity, { toValue: 1, duration: 150,                    useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 700, delay: 1500,       useNativeDriver: true }),
        ]),
        Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);

  const spin = rotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', `${Math.random() > 0.5 ? 540 : -720}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute', left: startX, top: 0,
        width: size, height: size,
        borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        backgroundColor: color, opacity,
        transform: [{ translateY: y }, { translateX: x }, { rotate: spin }],
      }}
    />
  );
}

function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay:  Math.random() * 1000,
    color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: Math.random() * SW,
    size:   6 + Math.random() * 8,
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
      <View style={[row.iconCircle, { backgroundColor: isCompleted ? moduleColor : C.lightGray }]}>
        <Text style={row.icon}>{lesson.icon}</Text>
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
  const goBack = useHardwareBack('/(tabs)/learn');
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const headerScale   = useRef(new Animated.Value(0.8)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const bodyOpacity   = useRef(new Animated.Value(0)).current;
  const badgeBounce   = useRef(new Animated.Value(-8)).current;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => { loadProgress(); }, []);

  useEffect(() => {
    if (!loading) {
      setShowConfetti(true);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(headerScale,   { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
          Animated.timing(headerOpacity, { toValue: 1, duration: 400,            useNativeDriver: true }),
        ]),
        Animated.spring(badgeBounce, { toValue: 0, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(bodyOpacity,  { toValue: 1, duration: 350,            useNativeDriver: true }),
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

  const earnedFincoins = chapter.lessons
    .filter(l => completedLessons.includes(l.id))
    .reduce((sum, l) => sum + (l.fincoins ?? 55), 0);

  const allChapters           = mod.chapters;
  const chapIdx               = allChapters.findIndex(c => c.id === chapterId);
  const nextChapter           = allChapters[chapIdx + 1] ?? null;
  const modIdx                = MODULES.findIndex(m => m.id === mod.id);
  const nextModule            = MODULES[modIdx + 1] ?? null;
  const isLastChapterInModule = chapIdx === allChapters.length - 1;

  const handleContinue = () => {
    if (isLastChapterInModule) {
      router.replace(`/module-complete/${mod.id}`);
    } else if (nextChapter) {
      const firstLesson = nextChapter.lessons[0];
      router.replace(`/lesson/${firstLesson.id}`);
    } else {
      router.replace('/(tabs)/learn');
    }
  };

  const ctaLabel = isLastChapterInModule
    ? `${mod.title} Complete 🏆`
    : nextChapter
      ? `Start ${nextChapter.title} →`
      : 'Back to Map →';

  return (
    <View style={styles.container}>
      {showConfetti && <Confetti />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header card ── */}
        <Animated.View
          style={[
            styles.headerCard,
            { backgroundColor: mod.color, opacity: headerOpacity, transform: [{ scale: headerScale }] },
          ]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.badge, { transform: [{ translateY: badgeBounce }] }]}>
            <Text style={styles.badgeEmoji}>{chapter.icon}</Text>
          </Animated.View>

          <Text style={styles.completeLabel}>CHAPTER COMPLETE</Text>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>

          <View style={styles.coinChip}>
            <Text style={styles.coinEmoji}>💰</Text>
            <Text style={styles.coinText}>{earnedFincoins} FinCoins earned</Text>
          </View>
        </Animated.View>

        {/* ── Body ── */}
        <Animated.View style={[styles.body, { opacity: bodyOpacity }]}>

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
              <View style={[styles.nextCard, { borderColor: nextModule.color + '40', backgroundColor: nextModule.colorLight ?? C.lightGray }]}>
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
              <View style={[styles.nextCard, { borderColor: C.warningDark + '40', backgroundColor: C.warningLight }]}>
                <Text style={styles.nextIcon}>🏆</Text>
                <View style={styles.nextText}>
                  <Text style={[styles.nextLabel, { color: C.warningDark }]}>Journey Complete</Text>
                  <Text style={styles.nextTitle}>You've finished the entire roadmap!</Text>
                </View>
              </View>
            )}
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── Continue CTA ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: mod.color }]}
          onPress={handleContinue}
          activeOpacity={0.87}
        >
          <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.background },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  headerCard: {
    alignItems: 'center',
    paddingTop: 64, paddingBottom: 36, paddingHorizontal: 28,
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
    marginBottom: 8,
  },
  backBtn:     { position: 'absolute', top: 56, left: 20, padding: 8 },
  backBtnText: { fontFamily: F.semiBold, fontSize: 15, color: 'rgba(255,255,255,0.85)' },

  badge: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  badgeEmoji:    { fontSize: 44 },
  completeLabel: {
    fontFamily: F.extraBold, fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2, marginBottom: 8,
  },
  chapterTitle: {
    fontFamily: F.extraBold, fontSize: 24,
    color: C.white, textAlign: 'center', marginBottom: 20, lineHeight: 30,
  },
  coinChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
  },
  coinEmoji: { fontSize: 22 },
  coinText:  { fontFamily: F.extraBold, fontSize: 16, color: C.white },

  body:    { paddingHorizontal: 20, paddingTop: 16, gap: 24 },
  section: { gap: 10 },
  sectionLabel: {
    fontFamily: F.bold, fontSize: 12,
    color: C.textMuted, letterSpacing: 0.5, marginBottom: 4,
  },

  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.white, borderRadius: 16, padding: 16, borderWidth: 2,
    shadowColor: C.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  nextIcon:  { fontSize: 30 },
  nextText:  { flex: 1 },
  nextLabel: { fontFamily: F.bold,      fontSize: 11, color: C.textMuted, letterSpacing: 0.3, marginBottom: 2 },
  nextTitle: { fontFamily: F.bold,      fontSize: 15, color: C.textPrimary, marginBottom: 2 },
  nextDesc:  { fontFamily: F.regular,   fontSize: 12, color: C.textMuted, lineHeight: 17 },

  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.background, paddingHorizontal: 20,
    paddingTop: 12, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  ctaBtn: {
    borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowColor: C.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  ctaBtnText: { fontFamily: F.extraBold, fontSize: 16, color: C.white },
});

// ─── Lesson Row Styles ────────────────────────────────────────────────────────
const row = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.white, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.lightGray,
  },
  containerDone: { borderColor: C.border },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  icon:  { fontSize: 18 },
  text:  { flex: 1 },
  title: { fontFamily: F.semiBold, fontSize: 14, color: C.textPrimary },
  meta:  { fontFamily: F.regular,  fontSize: 12, color: C.textMuted, marginTop: 2 },
  check: { fontFamily: F.extraBold, fontSize: 18 },
});