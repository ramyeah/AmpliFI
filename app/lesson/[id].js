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
  redoSection,
  syncProfileAfterSection,
  buildSectionId,
  getProgress,
} from '../../lib/progress';
import { Colors as C, Fonts as F } from '../../constants/theme';
import { ModuleColorProvider } from '../../constants/ModuleColorContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SW = SCREEN_WIDTH - 48;

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
        <View style={[fc.badge, fc.badgeBack]}><Text style={[fc.badgeText, { color: C.successDark }]}>A {index + 1}/{total}</Text></View>
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
function LessonCompleteModal({ visible, lesson, moduleColor, sectionCount, onContinue, onBackToMap }) {
  const scale   = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const dotAnims = useRef(
    Array.from({ length: sectionCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (visible) {
      dotAnims.forEach(a => a.setValue(0));
      scale.setValue(0.8);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start(() => {
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
          <View style={[lcm.accent, { backgroundColor: moduleColor }]}>
            <Text style={lcm.accentEmoji}>🎉</Text>
          </View>
          <View style={lcm.body}>
            <Text style={lcm.completeLabel}>LESSON COMPLETE</Text>
            <Text style={lcm.lessonTitle} numberOfLines={2}>
              {lesson.icon} {lesson.title}
            </Text>
            <View style={[lcm.coinRow, { backgroundColor: moduleColor + '15' }]}>
              <Text style={lcm.coinEmoji}>💰</Text>
              <Text style={[lcm.coinAmount, { color: moduleColor }]}>
                +{lesson.fincoins ?? 55} FinCoins
              </Text>
            </View>
            <Text style={lcm.dotsLabel}>All sections complete</Text>
            <View style={lcm.dotsRow}>
              {dotAnims.map((anim, i) => {
                const bg = anim.interpolate({
                  inputRange:  [0, 1],
                  outputRange: [C.border, moduleColor],
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
            <TouchableOpacity style={lcm.mapBtn} onPress={onBackToMap} activeOpacity={0.7}>
              <Text style={lcm.mapBtnText}>← Back to Learning Map</Text>
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
                isDone    && { backgroundColor: C.successDark, borderColor: C.successDark },
                isCurrent && { backgroundColor: moduleColor,   borderColor: moduleColor, transform: [{ scale: 1.2 }] },
                isLocked  && { backgroundColor: C.lightGray,   borderColor: C.border },
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
                <Text style={[bpb.dotLabel, { color: moduleColor }]} numberOfLines={2}>
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
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const lesson      = getLessonById(id);
  const chapter     = getChapterByLessonId(id);
  const module      = getModuleByLessonId(id);
  const sections    = lesson?.sections ?? [];
  const flashcards  = lesson?.flashcards ?? [];
  const moduleColor      = module?.color      || C.primary;
  const moduleColorLight = module?.colorLight || C.primaryLight;
  const nextLesson  = getNextLesson(id);
  const hasNewFormat = sections.length > 0;

  const isLastInChapter =
    chapter != null &&
    chapter.lessons[chapter.lessons.length - 1]?.id === id;

  const { isLessonComplete, getSavedExercises, completeLesson } = useLessonStore();
  const userId = useUserStore((state) => state.profile?.uid) ?? auth.currentUser?.uid;
  const alreadyComplete = isLessonComplete(id);
  const savedExercises  = getSavedExercises(id);

  const progressSteps = [...sections];

  const initialSection = sectionParam != null
    ? Math.min(parseInt(sectionParam, 10), sections.length - 1)
    : 0;

  const [currentSection,     setCurrentSection]     = useState(initialSection);
  const [completedSections,  setCompletedSections]  = useState(() =>
    alreadyComplete ? sections.map((_, i) => i) : []
  );
  const [completedExercises, setCompletedExercises] = useState(() => savedExercises);
  const [showContinueCard,   setShowContinueCard]   = useState(() => alreadyComplete);
  const [attemptedExercises, setAttemptedExercises] = useState({});
  const [sectionFincoins,    setSectionFincoins]    = useState({});
  const [showLessonModal,    setShowLessonModal]    = useState(false);
  const [lessonResult,       setLessonResult]       = useState(null);
  const [toastAmount,        setToastAmount]        = useState(0);
  const [toastVisible,       setToastVisible]       = useState(false);
  const toastTimer = useRef(null);
  const [cardIndex, setCardIndex] = useState(0);

  const highestReachedRef  = useRef(alreadyComplete ? sections.length - 1 : initialSection);
  const sectionFincoinsRef = useRef({});

  useEffect(() => {
    if (initialSection > 0) {
      highestReachedRef.current = Math.max(highestReachedRef.current, initialSection);
    }
  }, []);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentSection]);

  useEffect(() => {
    const section = sections[currentSection];
    if (!section) return;
    const earnables = section.content.filter(b => EARNABLE_TYPES.has(b.type));
    if (earnables.length === 0) { setShowContinueCard(true); return; }
    const allPassed = earnables.every(b => completedExercises[b.exerciseId]);
    setShowContinueCard(allPassed);
  }, [completedExercises, currentSection]);

  if (!lesson) return null;

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

      // Only show toast on first-time completion, not redos
      if (!alreadyComplete) {
        setToastAmount(fincoins);
        setToastVisible(false);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => {
          setToastVisible(true);
          toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
        }, 100);
      }
    }
  }, [alreadyComplete]);

  const handleSectionComplete = useCallback(async (sectionIndex) => {
    setCompletedSections(prev =>
      prev.includes(sectionIndex) ? prev : [...prev, sectionIndex]
    );

    const next = sectionIndex + 1;
    // Fincoins earned in this specific section (from exercises)
    const thisSectionFincoins = sectionFincoinsRef.current[sectionIndex] || 0;

    if (next < sections.length) {
      // ── Mid-lesson section complete ──────────────────────────────────────
      highestReachedRef.current = Math.max(highestReachedRef.current, next);
      setCurrentSection(next);

      try {
        if (alreadyComplete) {
          // Lesson already done — redo awards no coins
          const result = await redoSection(id, sectionIndex);
          if (result) syncProfileAfterSection(result);
        } else {
          const result = await completeSectionInFirestore(id, sectionIndex);
          if (result) syncProfileAfterSection(result);
        }
      } catch (e) {
        console.error('Progress save error (mid-section):', e);
      }
    } else {
      // ── Final section complete ────────────────────────────────────────────
      const totalFincoins = Object.values(sectionFincoinsRef.current).reduce((a, b) => a + b, 0);
      if (userId) completeLesson(userId, id, totalFincoins, completedExercises);

      try {
        if (alreadyComplete) {
          // Redo of final section — no coins awarded
          const result = await redoSection(id, sectionIndex);
          if (result) syncProfileAfterSection(result);
          setLessonResult(null);
        } else {
          const result = await completeSectionInFirestore(id, sectionIndex);
          if (result) syncProfileAfterSection(result);
          setLessonResult(result);
        }
        setShowLessonModal(true);
      } catch (e) {
        console.error('Progress save error (final section):', e);
        setLessonResult(null);
        setShowLessonModal(true);
      }
    }
  }, [sections.length, id, userId, completedExercises, alreadyComplete]);

  const handleModalContinue = useCallback(() => {
    setShowLessonModal(false);
    const moduleCompleted = lessonResult?.moduleCompleted;
    const moduleId        = lessonResult?.moduleId ?? module?.id;
    const chapterId       = chapter?.id;

    if (moduleCompleted && moduleId) {
      router.push(`/module-complete/${moduleId}`);
    } else if (isLastInChapter && chapterId) {
      router.push(`/chapter-complete/${chapterId}`);
    } else if (nextLesson) {
      router.push(`/lesson/${nextLesson.id}`);
    } else {
      router.replace('/(tabs)/learn');
    }
  }, [lessonResult, isLastInChapter, chapter, module, nextLesson, router]);

  const handleDotPress = useCallback((index) => {
    setCurrentSection(index);
  }, []);

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

  return (
    <ModuleColorProvider color={moduleColor} colorLight={moduleColorLight}>
      <View style={s.root}>
        <FinCoinToast amount={toastAmount} visible={toastVisible} />

        <LessonCompleteModal
          visible={showLessonModal}
          lesson={lesson}
          moduleColor={moduleColor}
          sectionCount={sections.length}
          onContinue={handleModalContinue}
          onBackToMap={() => { setShowLessonModal(false); router.replace('/(tabs)/learn'); }}
        />

        {/* ── Static header ── */}
        <View style={[s.header, { backgroundColor: moduleColor, paddingTop: insets.top + 8 }]}>
          <View style={s.headerTopRow}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)/learn')} style={s.backBtn} activeOpacity={0.7}>
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
              <Text style={s.metaText}>{lesson.fincoins ?? 55} FinCoins</Text>
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
            <>
              {(lesson.content ?? []).map((block, i) => renderBlock(block, i))}
            </>
          )}
        </ScrollView>

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
    </ModuleColorProvider>
  );
}

// ═══════════════════════════════════════════════════════
// STYLESHEETS
// ═══════════════════════════════════════════════════════

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 20, paddingBottom: 16,
    shadowColor: C.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  headerTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerNextText: { fontFamily: F.bold, fontSize: 13, color: C.white },
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
  breadcrumbModule: { fontFamily: F.semiBold, fontSize: 11, color: '#FFFFFF' },
  breadcrumbDot:    { fontFamily: F.regular,  fontSize: 11, color: '#FFFFFF', marginHorizontal: 4 },
  breadcrumbChapter:{ fontFamily: F.medium,   fontSize: 11, color: '#FFFFFF' },
  lessonTitle:      { fontFamily: F.extraBold, fontSize: 20, color: C.white, lineHeight: 26, marginBottom: 14 },
  metaRow:          { flexDirection: 'row', gap: 8 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)',
  },
  metaIcon: { fontSize: 11, marginRight: 4 },
  metaText: { fontFamily: F.semiBold, fontSize: 11, color: '#ffffff' },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },
  continueBtn:     { borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 20, marginBottom: 8 },
  continueBtnText: { fontFamily: F.extraBold, fontSize: 17, color: C.white },
  flashSectionTitle: { fontFamily: F.extraBold, fontSize: 20, color: C.textPrimary, marginBottom: 4, marginTop: 8 },
  flashSectionSub:   { fontFamily: F.regular,   fontSize: 12, color: C.textMuted, marginBottom: 12, paddingHorizontal: 4 },
  flashDots:         { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 8 },
  flashDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
});

const bpb = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.white,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 8, paddingHorizontal: 12,
    shadowColor: C.black, shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8, zIndex: 20,
  },
  rail:    { height: 3, backgroundColor: C.lightGray, borderRadius: 2, marginBottom: 10, marginHorizontal: 4 },
  fill:    { height: 3, borderRadius: 2 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' },
  dotWrap: { alignItems: 'center', flex: 1 },
  dot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    backgroundColor: C.white, borderColor: C.border,
  },
  dotText:  { fontFamily: F.extraBold, fontSize: 13, color: C.textPrimary },
  dotLabel: { fontFamily: F.bold, fontSize: 9, color: C.textSecondary, textAlign: 'center', lineHeight: 13, maxWidth: 72 },
});

const toastSt = StyleSheet.create({
  wrapper: {
    position: 'absolute', top: 70, alignSelf: 'center', zIndex: 999,
    backgroundColor: C.black, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
    shadowColor: C.black, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 10,
  },
  text: { fontFamily: F.extraBold, fontSize: 15, color: C.white },
});

const fc = StyleSheet.create({
  outer: { height: 240, marginBottom: 8 },
  card: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: 20, padding: 24, justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  front:     { backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  back:      { backgroundColor: C.successLight, borderWidth: 1, borderColor: C.success },
  gone:      { opacity: 0, pointerEvents: 'none' },
  badge:     { alignSelf: 'flex-start', backgroundColor: C.lightGray, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeBack: { backgroundColor: C.successLight },
  badgeText: { fontFamily: F.bold, fontSize: 11, color: C.textSecondary },
  qText:     { fontFamily: F.bold, fontSize: 16, color: C.textPrimary, lineHeight: 24, flex: 1, marginTop: 10 },
  aText:     { fontFamily: F.regular, fontSize: 14, color: C.textSecondary, lineHeight: 22, flex: 1, marginTop: 10 },
  hint:      { fontFamily: F.regular, fontSize: 12, color: C.textMuted, textAlign: 'center' },
});

const lcm = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: C.background, borderRadius: 28,
    overflow: 'hidden', width: '100%',
    shadowColor: C.black, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 20,
  },
  accent:      { height: 80, justifyContent: 'center', alignItems: 'center' },
  accentEmoji: { fontSize: 40 },
  body:        { padding: 24, alignItems: 'center', gap: 12 },
  completeLabel: {
    fontFamily: F.extraBold, fontSize: 11,
    color: C.textMuted, letterSpacing: 1.5,
  },
  lessonTitle: {
    fontFamily: F.extraBold, fontSize: 17,
    color: C.textPrimary, textAlign: 'center', lineHeight: 24,
  },
  coinRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12,
    width: '100%', justifyContent: 'center',
  },
  coinEmoji:  { fontSize: 24 },
  coinAmount: { fontFamily: F.extraBold, fontSize: 22 },
  coinLabel:  { fontFamily: F.medium, fontSize: 14, color: C.textMuted },
  dotsLabel:  { fontFamily: F.semiBold, fontSize: 12, color: C.textMuted, letterSpacing: 0.3 },
  dotsRow:    { flexDirection: 'row', gap: 10, marginBottom: 4 },
  dot: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  dotCheck:        { fontFamily: F.extraBold, fontSize: 16, color: C.white },
  continueBtn:     { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', width: '100%', marginTop: 4 },
  continueBtnText: { fontFamily: F.extraBold, fontSize: 16, color: C.white },
  mapBtn:          { paddingVertical: 10, alignItems: 'center', width: '100%' },
  mapBtnText:      { fontFamily: F.semiBold, fontSize: 13, color: C.textMuted },
});