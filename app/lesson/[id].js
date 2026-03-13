// app/lesson/[id].js

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Animated, Dimensions, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getLessonById, getChapterByLessonId,
  getModuleByLessonId, getNextLesson,
} from '../../constants/modules';
import { renderBlock } from '../../components/ContentBlocks';
import { useLessonStore } from '../../store/useLessonStore';
import useUserStore from '../../store/userStore';
import { auth } from '../../lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import {
  completeSection as completeSectionInFirestore,
  buildSectionId,
  getProgress,
} from '../../lib/progress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SW = SCREEN_WIDTH - 48;

// ─── Theme tokens ──────────────────────────────────────
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
// LESSON COMPLETE MODAL
// ═══════════════════════════════════════════════════════
function LessonCompleteModal({ visible, lesson, moduleColor, sectionCount, onContinue }) {
  const scale   = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Dot sweep animation — each dot fills in sequence
  const dotAnims = useRef(
    Array.from({ length: sectionCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset
      dotAnims.forEach(a => a.setValue(0));
      scale.setValue(0.8);
      opacity.setValue(0);

      // Card entrance
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        // Sweep dots one by one
        Animated.stagger(
          120,
          dotAnims.map(a =>
            Animated.spring(a, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true })
          )
        ).start();
      });
    } else {
      scale.setValue(0.8);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!lesson) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={lcm.backdrop}>
        <Animated.View style={[lcm.card, { transform: [{ scale }], opacity }]}>

          {/* Top accent */}
          <View style={[lcm.accent, { backgroundColor: moduleColor }]}>
            <Text style={lcm.accentEmoji}>🎉</Text>
          </View>

          <View style={lcm.body}>
            <Text style={lcm.completeLabel}>LESSON COMPLETE</Text>
            <Text style={lcm.lessonTitle} numberOfLines={2}>
              {lesson.icon} {lesson.title}
            </Text>

            {/* Fincoins earned */}
            <View style={[lcm.coinRow, { backgroundColor: moduleColor + '15' }]}>
              <Text style={lcm.coinEmoji}>💰</Text>
              <Text style={[lcm.coinAmount, { color: moduleColor }]}>
                +{lesson.fincoins ?? 55} FinCoins
              </Text>
              <Text style={lcm.coinLabel}>earned</Text>
            </View>

            {/* Section dots sweeping in */}
            <Text style={lcm.dotsLabel}>All sections complete</Text>
            <View style={lcm.dotsRow}>
              {dotAnims.map((anim, i) => {
                const bg = anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#E5E7EB', moduleColor],
                });
                return (
                  <Animated.View
                    key={i}
                    style={[
                      lcm.dot,
                      { backgroundColor: bg, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] },
                    ]}
                  >
                    <Animated.Text style={[lcm.dotCheck, { opacity: anim }]}>✓</Animated.Text>
                  </Animated.View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[lcm.continueBtn, { backgroundColor: moduleColor }]}
              onPress={onContinue}
              activeOpacity={0.85}
            >
              <Text style={lcm.continueBtnText}>Continue →</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// STICKY BOTTOM PROGRESS BAR
// ═══════════════════════════════════════════════════════
function BottomProgressBar({ sections, currentSection, completedSections, highestReached, moduleColor, onDotPress, insetBottom }) {
  const total     = sections.length;
  const doneCount = completedSections.length;
  const progress  = total > 1 ? doneCount / (total - 1) : doneCount / total;

  return (
    <View style={[bpb.wrapper, { paddingBottom: insetBottom + 8 }]}>
      <View style={bpb.rail}>
        <View style={[bpb.fill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: moduleColor }]} />
      </View>
      <View style={bpb.dotsRow}>
        {sections.map((section, i) => {
          const isDone    = completedSections.includes(i);
          const isCurrent = i === currentSection;
          const isLocked  = i > highestReached;

          return (
            <TouchableOpacity
              key={section.key}
              style={bpb.dotWrap}
              onPress={() => !isLocked && onDotPress(i)}
              activeOpacity={isLocked ? 1 : 0.7}
            >
              <View style={[
                bpb.dot,
                isDone    && { backgroundColor: C.success,     borderColor: C.success },
                isCurrent && { backgroundColor: moduleColor,   borderColor: moduleColor, transform: [{ scale: 1.2 }] },
                isLocked  && { backgroundColor: C.borderLight, borderColor: C.border },
              ]}>
                <Text style={[
                  bpb.dotText,
                  (isDone || isCurrent) && { color: C.white },
                  isLocked              && { color: C.border },
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
  const { id, section: sectionParam } = useLocalSearchParams();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const scrollRef = useRef(null);

  // ── Lesson data ──────────────────────────────────────
  const lesson     = getLessonById(id);
  const chapter    = getChapterByLessonId(id);
  const module     = getModuleByLessonId(id);
  const sections   = lesson?.sections ?? [];
  const flashcards = lesson?.flashcards ?? [];
  const moduleColor = module?.color || '#4F46E5';
  const nextLesson  = getNextLesson(id);
  const hasNewFormat = sections.length > 0;

  // ── Stores ───────────────────────────────────────────
  const { isLessonComplete, getSavedExercises, completeLesson } = useLessonStore();
  const userId = useUserStore((state) => state.profile?.uid) ?? auth.currentUser?.uid;
  const alreadyComplete = isLessonComplete(id);
  const savedExercises  = getSavedExercises(id);

  const progressSteps = [...sections];

  // ── State ────────────────────────────────────────────
  // If a ?section= param was passed (from learn map dot), jump straight there
  const initialSection = sectionParam != null
    ? Math.min(parseInt(sectionParam, 10), sections.length - 1)
    : 0;

  const [currentSection,    setCurrentSection]    = useState(initialSection);
  const [completedSections, setCompletedSections] = useState(() =>
    alreadyComplete ? sections.map((_, i) => i) : []
  );
  const [completedExercises, setCompletedExercises] = useState(() => savedExercises);
  const [showContinueCard,   setShowContinueCard]   = useState(() => alreadyComplete);
  const [attemptedExercises, setAttemptedExercises] = useState({});
  const [sectionFincoins,    setSectionFincoins]    = useState({});

  // Lesson complete modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonResult,    setLessonResult]    = useState(null); // result from completeSection

  // Toast
  const [toastAmount,  setToastAmount]  = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  // Flashcard pager
  const [cardIndex, setCardIndex] = useState(0);

  const highestReachedRef  = useRef(alreadyComplete ? sections.length - 1 : initialSection);
  const sectionFincoinsRef = useRef({});

  // Jump to section on mount if deep-linked
  useEffect(() => {
    if (initialSection > 0) {
      highestReachedRef.current = Math.max(highestReachedRef.current, initialSection);
    }
  }, []);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  // Scroll to top whenever section changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentSection]);

  // Show Continue once all earnables in current section are passed
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
    const resolvedTotal   = total   ?? 1;
    const resolvedCorrect = correct ?? resolvedTotal;
    const passing = resolvedCorrect / resolvedTotal >= 0.7;

    setAttemptedExercises(prev => ({ ...prev, [exerciseId]: true }));

    if (passing) {
      setCompletedExercises(prev => {
        if (prev[exerciseId]) return prev;
        return { ...prev, [exerciseId]: true };
      });
      setSectionFincoins(prev => {
        const updated = { ...prev, [sectionIndex]: (prev[sectionIndex] || 0) + fincoins };
        sectionFincoinsRef.current = updated;
        return updated;
      });
      setToastAmount(fincoins);
      setToastVisible(false);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        setToastVisible(true);
        toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
      }, 100);
    }
  }, []);

  const handleSectionComplete = useCallback(async (sectionIndex) => {
    // Mark section done locally
    setCompletedSections(prev =>
      prev.includes(sectionIndex) ? prev : [...prev, sectionIndex]
    );

    const next = sectionIndex + 1;

    if (next < sections.length) {
      // ── Not the last section — just advance ──────────
      highestReachedRef.current = Math.max(highestReachedRef.current, next);
      setCurrentSection(next);

      // Write section completion to Firestore (non-blocking)
      completeSectionInFirestore(id, sectionIndex).catch(console.error);

    } else {
      // ── Last section — full cascade ───────────────────
      const totalFincoins = Object.values(sectionFincoinsRef.current).reduce((a, b) => a + b, 0);

      // Write to local store
      if (userId) {
        completeLesson(userId, id, totalFincoins, completedExercises);
      }

      // Write to Firestore and get cascade result
      try {
        const result = await completeSectionInFirestore(id, sectionIndex);
        setLessonResult(result);
        setShowLessonModal(true);
      } catch (e) {
        console.error('Progress save error:', e);
        // Still show modal even if Firestore fails
        setLessonResult(null);
        setShowLessonModal(true);
      }
    }
  }, [sections.length, id, userId, completedExercises]);

  const handleModalContinue = useCallback(() => {
    setShowLessonModal(false);

    if (!lessonResult) {
      // Fallback — just go to learn map
      router.replace('/(tabs)/learn');
      return;
    }

    if (lessonResult.moduleCompleted) {
      // Module complete — go to module complete screen
      router.push(`/module-complete/${lessonResult.moduleId}`);
    } else if (lessonResult.chapterCompleted) {
      // Chapter complete — go to chapter complete screen
      router.push(`/chapter-complete/${lessonResult.chapterId}`);
    } else if (nextLesson) {
      // Next lesson in chapter
      router.push(`/lesson/${nextLesson.id}`);
    } else {
      router.replace('/(tabs)/learn');
    }
  }, [lessonResult, nextLesson, router]);

  const handleDotPress = useCallback((index) => {
    setCurrentSection(index);
  }, []);

  // ── Content renderer ─────────────────────────────────
  const renderSectionContent = (section, sectionIndex) => {
    if (!section?.content) return null;
    return section.content.map((block, i) => {
      const isExercise  = EARNABLE_TYPES.has(block.type);
      const isCompleted = isExercise && !!completedExercises[block.exerciseId];
      const enhanced    = isExercise
        ? {
            ...block,
            isCompleted,
            onComplete: (correct, total) =>
              handleExerciseComplete(block.exerciseId, block.fincoins, sectionIndex, correct, total),
          }
        : block;
      return renderBlock(enhanced, i);
    });
  };

  const BOTTOM_BAR_HEIGHT = 80 + insets.bottom;

  // ─────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* FinCoin toast */}
      <FinCoinToast amount={toastAmount} visible={toastVisible} />

      {/* Lesson complete modal */}
      <LessonCompleteModal
        visible={showLessonModal}
        lesson={lesson}
        moduleColor={moduleColor}
        sectionCount={sections.length}
        onContinue={handleModalContinue}
      />

      {/* ── Static header ── */}
      <View style={[s.header, { backgroundColor: moduleColor, paddingTop: insets.top + 8 }]}>
        <View style={s.headerTopRow}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/learn')}
            style={s.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          {currentSection === sections.length - 1 && (
            <TouchableOpacity
              style={[
                s.headerNextBtn,
                (alreadyComplete || showContinueCard)
                  ? { borderColor: 'rgba(255,255,255,0.9)' }
                  : { borderColor: 'rgba(255,255,255,0.3)' },
              ]}
              onPress={() => {
                if (alreadyComplete || showContinueCard) {
                  handleSectionComplete(currentSection);
                } else {
                  alert('Complete this section first!');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[
                s.headerNextText,
                !(alreadyComplete || showContinueCard) && { opacity: 0.4 },
              ]}>
                {nextLesson ? 'Next Lesson →' : 'Complete →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.breadcrumbRow}>
          <Text numberOfLines={1} style={s.breadcrumbModule}>{module?.title}</Text>
          <Text style={s.breadcrumbDot}>·</Text>
          <Text numberOfLines={1} style={s.breadcrumbChapter}>{chapter?.title}</Text>
        </View>
        <Text numberOfLines={2} style={s.lessonTitle}>{lesson.icon} {lesson.title}</Text>
        <View style={s.metaRow}>
          <View style={s.metaPill}>
            <Text style={s.metaIcon}>⏱</Text>
            <Text style={s.metaText}>{lesson.duration}</Text>
          </View>
          <View style={s.metaPill}>
            <Text style={s.metaIcon}>🪙</Text>
            <Text style={s.metaText}>{lesson.fincoins ?? lesson.xp} FinCoins</Text>
          </View>
          {flashcards.length > 0 && (
            <View style={s.metaPill}>
              <Text style={s.metaIcon}>🃏</Text>
              <Text style={s.metaText}>{flashcards.length} cards</Text>
            </View>
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
            {/* Flashcards — shown in last section */}
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
                  {currentSection === sections.length - 1 ? 'Complete Lesson ✓' : 'Continue →'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          // Legacy flat content — no quiz button
          <>
            {(lesson.content ?? []).map((block, i) => renderBlock(block, i))}
          </>
        )}
      </ScrollView>

      {/* Sticky bottom progress bar */}
      {hasNewFormat && (
        <BottomProgressBar
          sections={progressSteps}
          currentSection={currentSection}
          completedSections={completedSections}
          highestReached={highestReachedRef.current}
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

  header: {
    paddingHorizontal: 20, paddingBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  headerTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerNextText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerNextBtn: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  breadcrumbRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  breadcrumbModule: { fontSize: 11, color: 'rgba(226,232,240,0.9)', fontWeight: '600' },
  breadcrumbDot:    { fontSize: 11, color: 'rgba(226,232,240,0.8)', marginHorizontal: 4 },
  breadcrumbChapter:{ fontSize: 11, color: 'rgba(226,232,240,0.8)', fontWeight: '500' },
  lessonTitle:      { fontSize: 20, fontWeight: '800', color: '#FFFFFF', lineHeight: 26, marginBottom: 14 },
  metaRow:          { flexDirection: 'row', gap: 8 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.25)',
  },
  metaIcon: { fontSize: 11, marginRight: 4 },
  metaText: { fontSize: 11, color: '#F9FAFB', fontWeight: '600' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },

  continueBtn:     { borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 20, marginBottom: 8 },
  continueBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '800' },

  flashSectionTitle: { fontSize: 20, fontWeight: '800', color: C.neutral1, marginBottom: 4, marginTop: 8 },
  flashSectionSub:   { fontSize: 12, color: C.neutral4, marginBottom: 12, paddingHorizontal: 4 },
  flashDots:         { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 8 },
  flashDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
});

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

const fc = StyleSheet.create({
  outer: { height: 240, marginBottom: 8 },
  card: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: 20, padding: 24, justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  front:     { backgroundColor: C.white, borderWidth: 1.5, borderColor: '#E0E7FF' },
  back:      { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0' },
  gone:      { opacity: 0, pointerEvents: 'none' },
  badge:     { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeBack: { backgroundColor: C.successLight },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  qText:     { fontSize: 16, fontWeight: '700', color: C.neutral1, lineHeight: 24, flex: 1, marginTop: 10 },
  aText:     { fontSize: 14, color: '#374151', lineHeight: 22, flex: 1, marginTop: 10 },
  hint:      { fontSize: 12, color: C.neutral4, textAlign: 'center' },
});

// Lesson complete modal styles
const lcm = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 28,
    overflow: 'hidden', width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 20,
  },
  accent: {
    height: 80, justifyContent: 'center', alignItems: 'center',
  },
  accentEmoji: { fontSize: 40 },
  body: { padding: 24, alignItems: 'center', gap: 12 },
  completeLabel: {
    fontSize: 11, fontWeight: '800', color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  lessonTitle: {
    fontSize: 17, fontWeight: '800', color: '#111827',
    textAlign: 'center', lineHeight: 24,
  },
  coinRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12,
    width: '100%', justifyContent: 'center',
  },
  coinEmoji:  { fontSize: 24 },
  coinAmount: { fontSize: 22, fontWeight: '800' },
  coinLabel:  { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  dotsLabel:  { fontSize: 12, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.3 },
  dotsRow:    { flexDirection: 'row', gap: 10, marginBottom: 4 },
  dot: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  dotCheck: { fontSize: 16, fontWeight: '800', color: '#fff' },
  continueBtn: {
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32,
    alignItems: 'center', width: '100%', marginTop: 4,
  },
  continueBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});