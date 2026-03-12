// app/lesson/[id].js

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Animated, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLessonById, getChapterByLessonId, getModuleByLessonId } from '../../constants/modules';
import { renderBlock } from '../../components/ContentBlocks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SW = SCREEN_WIDTH - 48;
// ─── Shared theme tokens ──────────────────────────────
const C = {
  success: '#059669', successLight: '#DCFCE7',
  warning: '#F59E0B', warningLight: '#FFFBEB',
  neutral1: '#111827', neutral3: '#6B7280', neutral4: '#9CA3AF',
  border: '#E5E7EB', borderLight: '#F3F4F6', white: '#ffffff',
};
const EARNABLE_TYPES = new Set(['tindertruefalse', 'scenarios', 'multistepmcq', 'mcq']);
// ═══════════════════════════════════════════════════════
// FLASHCARD
// ═══════════════════════════════════════════════════════
function FlashCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => { anim.stopAnimation(); anim.removeAllListeners(); };
  }, []);

  const flip = () => {
    Animated.spring(anim, { toValue: flipped ? 0 : 1, friction: 8, useNativeDriver: true }).start();
    setFlipped(f => !f);
  };

  const frontRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot  = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity onPress={flip} activeOpacity={1} style={fc.outer}>
      <Animated.View style={[fc.card, fc.front, { transform: [{ perspective: 1000 }, { rotateY: frontRot }] }, flipped && fc.gone]}>
        <View style={fc.badge}><Text style={fc.badgeText}>Q {index + 1}/{total}</Text></View>
        <Text style={fc.qText}>{card.q}</Text>
        <Text style={fc.hint}>Tap to flip →</Text>
      </Animated.View>
      <Animated.View style={[fc.card, fc.back, { transform: [{ perspective: 1000 }, { rotateY: backRot }] }, !flipped && fc.gone]}>
        <View style={[fc.badge, fc.badgeBack]}><Text style={[fc.badgeText, { color: C.success }]}>A {index + 1}/{total}</Text></View>
        <Text style={fc.aText}>{card.a}</Text>
        <Text style={fc.hint}>← Tap to flip back</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════
// FINCOIN TOAST
// ═══════════════════════════════════════════════════════
function FinCoinToast({ amount, visible }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.sequence([
      Animated.spring(anim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(anim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [visible, amount]);

  if (!visible) return null;

  return (
    <Animated.View style={[
      toastSt.wrapper,
      {
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
      },
    ]}>
      <Text style={toastSt.text}>+{amount} FinCoins 🪙</Text>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════
// STICKY BOTTOM PROGRESS BAR
// ═══════════════════════════════════════════════════════
function BottomProgressBar({ sections, currentSection, completedSections, highestReached, moduleColor, onDotPress, insetBottom }) {
  const total = sections.length;
  const doneCount = completedSections.length;
  const progress = total > 1 ? doneCount / (total - 1) : doneCount / total;

  return (
    <View style={[bpb.wrapper, { paddingBottom: insetBottom + 8 }]}>
      <View style={bpb.rail}>
        <View style={[bpb.fill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: moduleColor }]} />
      </View>
      <View style={bpb.dotsRow}>
        {sections.map((section, i) => {
          const isDone    = completedSections.includes(i);
          const isCurrent = i === currentSection;
          // FIX 2: lock only sections strictly ahead of where the user currently is.
          // This allows free backward AND forward revisiting of any already-reached section.
          const isLocked = i > highestReached;


          return (
            <TouchableOpacity
              key={section.key}
              style={bpb.dotWrap}
              onPress={() => !isLocked && onDotPress(i)}
              activeOpacity={isLocked ? 1 : 0.7}
            >
              <View style={[
                bpb.dot,
                isDone    && { backgroundColor: C.success, borderColor: C.success },
                isCurrent && { backgroundColor: moduleColor, borderColor: moduleColor, transform: [{ scale: 1.2 }] },
                isLocked  && { backgroundColor: C.borderLight, borderColor: C.border },
              ]}>
                <Text style={[
                  bpb.dotText,
                  (isDone || isCurrent) && { color: C.white },
                  isLocked && { color: C.border },
                ]}>
                  {isDone ? '✓' : isLocked ? '🔒' : i + 1}
                </Text>
              </View>
              {isCurrent && (
                <Text style={[bpb.dotLabel, { color: moduleColor, fontWeight: '700' }]} numberOfLines={2}>
                  {section.title}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
export default function LessonScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  // ── Lesson data ──────────────────────────────────────
  const lesson  = getLessonById(id);
  const chapter = getChapterByLessonId(id);
  const module  = getModuleByLessonId(id);

  const sections     = lesson?.sections ?? [];
  const hasNewFormat = sections.length > 0;
  const flashcards   = lesson?.flashcards ?? [];
  const moduleColor  = module?.color || '#4F46E5';

  // FIX 1: Build a unified progress-bar step list that appends the flashcard
  // step as a 5th node when flashcards exist. The content sections array is
  // unchanged — only the progress bar receives this augmented list.
  const progressSteps = [...sections];

  // ── State ────────────────────────────────────────────
  const [currentSection,     setCurrentSection]     = useState(0);
  const [completedSections,  setCompletedSections]  = useState([]);
  const [completedExercises, setCompletedExercises] = useState({});
  const [attemptedExercises, setAttemptedExercises] = useState({});
  const [sectionFincoins,    setSectionFincoins]    = useState({});
  const [showContinueCard,   setShowContinueCard]   = useState(false);

  // Toast
  const [toastAmount,  setToastAmount]  = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  // Flashcard pager
  const [cardIndex, setCardIndex] = useState(0);
  const highestReachedRef = useRef(0);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  // Scroll to top whenever section changes
  // Only reset continue card if this section hasn't been completed before
  useEffect(() => {
  scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentSection]);

  // Show Continue once all earnables in current section are attempted AND all passed.
  // If the section has no earnables, show Continue immediately.
  // Note: this effect only applies to content sections (0–3), not the flashcard step.
  useEffect(() => {
  const section = sections[currentSection];
  if (!section) return;
  const earnables = section.content.filter(b => EARNABLE_TYPES.has(b.type));
  if (earnables.length === 0) {
    setShowContinueCard(true);
    return;
  }
  const allPassed = earnables.every(b => completedExercises[b.exerciseId]);
  setShowContinueCard(allPassed);
  }, [completedExercises, currentSection]);

  if (!lesson) return null;


  // ── Handlers ─────────────────────────────────────────
  const handleExerciseComplete = useCallback((exerciseId, fincoins, sectionIndex, correct = null, total = null) => {
    console.log('handleExerciseComplete called', exerciseId, correct, total);
    const resolvedTotal   = total   ?? 1;
    const resolvedCorrect = correct ?? resolvedTotal;
    const passing = resolvedCorrect / resolvedTotal >= 0.7;

    // Always mark attempted regardless of score
    setAttemptedExercises(prev => ({ ...prev, [exerciseId]: true }));

    if (passing) {
      setCompletedExercises(prev => {
        // Guard against double-award using the latest state, not a stale closure
        if (prev[exerciseId]) return prev;
        return { ...prev, [exerciseId]: true };
      });
      setSectionFincoins(prev => ({
        ...prev,
        [sectionIndex]: (prev[sectionIndex] || 0) + fincoins,
      }));
      setToastAmount(fincoins);
      setToastVisible(false);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        setToastVisible(true);
        toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
      }, 100);
    }
  }, []); // empty deps: all state via functional updaters, no stale closure possible

  // FIX 1 (continued): After the last content section (index 3), advance to the
  // flashcard step (index 4 = sections.length) instead of immediately routing to
  // the quiz. The quiz route is triggered from the flashcard step's Complete button.
  const handleSectionComplete = useCallback((sectionIndex) => {
    setCompletedSections(prev =>
      prev.includes(sectionIndex) ? prev : [...prev, sectionIndex]
    );
    const next = sectionIndex + 1;
    if (next < sections.length) {
      highestReachedRef.current = Math.max(highestReachedRef.current, next);
      setCurrentSection(next);
    } else {
      router.push(`/quiz/${id}`);
    }
  }, [sections.length, id, router]);

  const handleDotPress = useCallback((index) => {
    setCurrentSection(index);
  }, []);

  // ── Content renderer ─────────────────────────────────
  const renderSectionContent = (section, sectionIndex) =>
    section.content.map((block, i) => {
      const EARNABLE_TYPES = new Set(['tindertruefalse', 'scenarios', 'multistepmcq', 'mcq']);
      const isExercise = EARNABLE_TYPES.has(block.type);
      const isCompleted = isExercise && !!completedExercises[block.exerciseId];
      const enhanced = isExercise
        ? {
            ...block,
            isCompleted,
            onComplete: (correct, total) =>
              handleExerciseComplete(block.exerciseId, block.fincoins, sectionIndex, correct, total),
          }
        : block;
      return renderBlock(enhanced, i);
    });


  // ── Derived flags ────────────────────────────────────

  const BOTTOM_BAR_HEIGHT = 80 + insets.bottom;

  // ─────────────────────────────────────────────────────
  return (
    <View style={s.root}>

      {/* FinCoin toast */}
      <FinCoinToast amount={toastAmount} visible={toastVisible} />

      {/* ── Static header ── */}
      <View style={[s.header, { backgroundColor: moduleColor, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/learn')} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.breadcrumb} numberOfLines={1}>
          {module?.title} · {chapter?.title}
        </Text>
        <Text style={s.lessonTitle} numberOfLines={1}>
          {lesson.icon}  {lesson.title}
        </Text>
        <View style={s.metaRow}>
          <Text style={s.meta}>⏱ {lesson.duration}</Text>
          <Text style={s.meta}>💰 {lesson.xp} XP</Text>
          {flashcards.length > 0 && (
            <Text style={s.meta}>🗂 {flashcards.length} cards</Text>
          )}
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: BOTTOM_BAR_HEIGHT + 24 }]}
        removeClippedSubviews={false}
      >
      {hasNewFormat ? (
        <>

          {/* Flashcards — shown in last section, before the continue button */}
          {currentSection === sections.length - 1 && flashcards.length > 0 && (
            <View>
              <Text style={s.flashSectionTitle}>Review — Test Your Memory</Text>
              <Text style={s.flashSectionSub}>Tap a card to flip · Swipe for next</Text>
              <FlatList
                data={flashcards}
                horizontal
                pagingEnabled
                snapToInterval={SW + 16}
                snapToAlignment="start"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                scrollEnabled
                removeClippedSubviews={false}
                getItemLayout={(_, index) => ({ length: SW + 16, offset: (SW + 16) * index, index })}
                onScroll={(e) => setCardIndex(Math.round(e.nativeEvent.contentOffset.x / (SW + 16)))}
                scrollEventThrottle={32}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item, index }) => (
                  <View style={{ width: SW, marginRight: 16 }}>
                    <FlashCard card={item} index={index} total={flashcards.length} />
                  </View>
                )}
                style={{ overflow: 'visible' }}
                contentContainerStyle={{ gap: 0 }}
              />
              
              <View style={s.flashDots}>
                {flashcards.map((_, i) => (
                  <View key={i} style={[s.flashDot, i === cardIndex && { backgroundColor: moduleColor, width: 16 }]} />
                ))}
              </View>
            </View>
          )}
          {renderSectionContent(sections[currentSection], currentSection)}

          {showContinueCard && (
            <TouchableOpacity
              style={[s.continueBtn, { backgroundColor: moduleColor }]}
              onPress={() => handleSectionComplete(currentSection)}
              activeOpacity={0.85}
            >
              <Text style={s.continueBtnText}>
                {currentSection === sections.length - 1 ? 'Complete Lesson →' : 'Continue →'}
              </Text>
            </TouchableOpacity>
          )}
        </>
        ) : (
          // Legacy flat content[]
          <>
            {(lesson.content ?? []).map((block, i) => renderBlock(block, i))}
            <View style={s.ctaCard}>
              <Text style={s.ctaTitle}>Ready to test yourself? 🎯</Text>
              <TouchableOpacity
                style={[s.quizBtn, { backgroundColor: moduleColor }]}
                onPress={() => router.push(`/quiz/${id}`)}
              >
                <Text style={s.quizBtnText}>Take the Quiz →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky bottom progress bar — receives progressSteps (4 content + 1 flashcard) */}
      {hasNewFormat && (
        // In the JSX:
        <BottomProgressBar
          sections={progressSteps}
          currentSection={currentSection}
          completedSections={completedSections}
          highestReached={highestReachedRef.current}   // ← ADD
          moduleColor={moduleColor}
          onDotPress={handleDotPress}
          insetBottom={insets.bottom}
        />
      )}
      

    </View>
  );
}

// ═══════════════════════════════════════════════════════
// STYLESHEETS
// ═══════════════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F7FF' },

  // ── Header ──
  header: {
    paddingHorizontal: 20, paddingBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 6, zIndex: 10,
  },
  backBtn:     { marginBottom: 8 },
  backText:    { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  breadcrumb:  { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  lessonTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 10 },
  metaRow:     { flexDirection: 'row', gap: 16 },
  meta:        { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // ── Scroll ──
  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },

  // ── Continue button ──
  continueBtn:     { borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 20, marginBottom: 8 },
  continueBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },

  // ── CTA (legacy) ──
  ctaCard:    { backgroundColor: C.white, borderRadius: 20, padding: 24, marginTop: 16, alignItems: 'center' },
  ctaTitle:   { fontSize: 18, fontWeight: '800', color: C.neutral1, marginBottom: 16 },
  quizBtn:    { borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' },
  quizBtnText:{ color: C.white, fontSize: 16, fontWeight: '800' },

  // ── Flashcard step ──
  flashSection:      { marginTop: 8, marginBottom: 8, backgroundColor: C.white, borderRadius: 20, paddingTop: 20, paddingBottom: 20, paddingHorizontal: 0, borderWidth: 1.5, borderColor: '#E0E7FF', overflow: 'hidden' },
  flashSectionTitle: { fontSize: 20, fontWeight: '800', color: C.neutral1, marginBottom: 4, marginTop: 8 },
  flashSectionSub:   { fontSize: 12, color: C.neutral4, marginBottom: 12, paddingHorizontal: 4 },
  flashDots:         { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 8 },
  flashDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },

});

// ── Bottom progress bar ──
const bpb = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.white,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 8, paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8, zIndex: 20,
  },
  rail:    { height: 3, backgroundColor: C.borderLight, borderRadius: 2, marginBottom: 10, marginHorizontal: 4 },
  fill:    { height: 3, borderRadius: 2 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
  dotWrap: { alignItems: 'center', flex: 1 },
  dot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    backgroundColor: '#F9FAFB', borderColor: C.border,
  },
  dotText:  { fontSize: 13, fontWeight: '800', color: C.neutral1 },
  dotLabel: { fontSize: 9, color: C.neutral3, textAlign: 'center', lineHeight: 13, maxWidth: 72 },
});

// ── Toast ──
const toastSt = StyleSheet.create({
  wrapper: {
    position: 'absolute', top: 70, alignSelf: 'center', zIndex: 999,
    backgroundColor: '#111827', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 10,
  },
  text: { color: C.white, fontSize: 15, fontWeight: '800' },
});

// ── Flashcard ──
const fc = StyleSheet.create({
  outer: { height: 240, marginBottom: 8 },
  card: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: 20, padding: 24, justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  front:    { backgroundColor: C.white, borderWidth: 1.5, borderColor: '#E0E7FF' },
  back:     { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0' },
  gone:     { opacity: 0, pointerEvents: 'none' },
  badge:    { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeBack:{ backgroundColor: C.successLight },
  badgeText:{ fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  qText:    { fontSize: 16, fontWeight: '700', color: C.neutral1, lineHeight: 24, flex: 1, marginTop: 10 },
  aText:    { fontSize: 14, color: '#374151', lineHeight: 22, flex: 1, marginTop: 10 },
  hint:     { fontSize: 12, color: C.neutral4, textAlign: 'center' },
});