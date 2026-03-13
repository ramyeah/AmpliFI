// app/(tabs)/learn.js

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MODULES } from '../../constants/modules';
import { getProgress } from '../../lib/progress';

const { width: SW } = Dimensions.get('window');
const NODE_SIZE     = 68;

// Snake path positions — assigned in forward order, then array reversed
const PATH_POSITIONS = ['left', 'center', 'right', 'center'];

// ─── Build flat lesson list with metadata ─────────────────────────────────────
const getAllLessons = () =>
  MODULES.flatMap(m =>
    m.chapters.flatMap(c =>
      c.lessons.map(l => ({
        ...l,
        chapterId:          c.id,
        chapterTitle:       c.title,
        chapterIcon:        c.icon,
        chapterDescription: c.description || '',
        moduleId:           m.id,
        moduleTitle:        m.title,
        moduleColor:        m.color,
        moduleColorLight:   m.colorLight,
        moduleIcon:         m.icon,
        moduleDescription:  m.description,
      }))
    )
  );

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const router           = useRouter();
  const { scrollTo }     = useLocalSearchParams();
  const scrollRef        = useRef(null);
  const itemLayoutsRef   = useRef({});

  const [completedLessons,  setCompletedLessons]  = useState([]);
  const [completedChapters, setCompletedChapters] = useState([]);
  const [completedModules,  setCompletedModules]  = useState([]);
  const [loading,           setLoading]           = useState(true);

  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const trophyPulse = useRef(new Animated.Value(1)).current;

  // ── Load progress ──────────────────────────────────────────────────────────
  const loadProgress = useCallback(async () => {
    const progress = await getProgress();
    setCompletedLessons(progress.completedLessons);
    setCompletedChapters(progress.completedChapters);
    setCompletedModules(progress.completedModules);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProgress();
    startPulse();
    startTrophyPulse();
  }, []);

  // ── Scroll to bottom on first load (journey starts at bottom) ─────────────
  useEffect(() => {
    if (!loading && !scrollTo) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 120);
    }
  }, [loading]);

  // ── Scroll to specific item when returning from completion screens ─────────
  useEffect(() => {
    if (!loading && scrollTo) {
      setTimeout(() => {
        const y = itemLayoutsRef.current[scrollTo];
        if (y != null) scrollRef.current?.scrollTo({ y, animated: true });
      }, 350);
    }
  }, [loading, scrollTo]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const startTrophyPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyPulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(trophyPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const allLessons   = getAllLessons();
  const totalLessons = allLessons.length;
  const totalDone    = completedLessons.length;
  const pct          = Math.round((totalDone / totalLessons) * 100);

  const isLessonUnlocked = (index) => {
    if (index === 0) return true;
    return completedLessons.includes(allLessons[index - 1].id);
  };

  const currentIndex = (() => {
    for (let i = 0; i < allLessons.length; i++) {
      if (!completedLessons.includes(allLessons[i].id)) return i;
    }
    return allLessons.length - 1;
  })();

  // ── Build render items (forward order → reversed before render) ────────────
  const buildRenderItems = () => {
    const items       = [];
    let lessonIndex   = 0;
    let prevChapterId = null;
    let prevModuleId  = null;
    let modNumber     = 0; // 1-based, increments each new module
    let chapNumber    = 0; // 1-based, resets each new module

    allLessons.forEach((lesson, i) => {

      // Module banner
      if (lesson.moduleId !== prevModuleId) {
        modNumber++;
        chapNumber    = 0;
        const mod     = MODULES.find(m => m.id === lesson.moduleId);
        items.push({
          type:      'module-banner',
          module:    mod,
          modNumber,
          key:       `mod-${lesson.moduleId}`,
        });
        prevModuleId  = lesson.moduleId;
        prevChapterId = null;
      }

      // Chapter banner
      if (lesson.chapterId !== prevChapterId) {
        chapNumber++;
        items.push({
          type:               'chapter-banner',
          chapterId:          lesson.chapterId,
          chapterTitle:       lesson.chapterTitle,
          chapterIcon:        lesson.chapterIcon,
          chapterDescription: lesson.chapterDescription,
          moduleColor:        lesson.moduleColor,
          isDone:             completedChapters.includes(lesson.chapterId),
          modNumber,
          chapNumber,
          key:                `chap-${lesson.chapterId}`,
        });
        prevChapterId = lesson.chapterId;
      }

      // Lesson node
      const done     = completedLessons.includes(lesson.id);
      const unlocked = isLessonUnlocked(i);
      items.push({
        type:        'lesson',
        lesson,
        position:    PATH_POSITIONS[lessonIndex % PATH_POSITIONS.length],
        done,
        unlocked,
        isCurrent:   i === currentIndex,
        moduleColor: lesson.moduleColor,
        key:         lesson.id,
      });
      lessonIndex++;

      // Chapter trophies removed — chapter done state is shown in the banner only

      // Module trophy (after last lesson in module, if module complete)
      const isLastInModule =
        i === allLessons.length - 1 ||
        allLessons[i + 1].moduleId !== lesson.moduleId;

      if (isLastInModule && completedModules.includes(lesson.moduleId)) {
        const mod = MODULES.find(m => m.id === lesson.moduleId);
        items.push({ type: 'module-trophy', module: mod, key: `mtrophy-${lesson.moduleId}` });
      }
    });

    // Reverse: module 1 at bottom, module 4 at top
    return items.reverse();
  };

  const renderItems = buildRenderItems();

  if (loading) return <View style={s.container} />;

  return (
    <View style={s.container}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <View>
          <Text style={s.topBarTitle}>Learning Journey 🗺️</Text>
          <Text style={s.topBarSub}>{totalDone} of {totalLessons} lessons complete</Text>
        </View>
        <View style={s.pctBadge}>
          <Text style={s.pctText}>{pct}%</Text>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={s.progressBarBg}>
        <View style={[s.progressBarFill, { width: `${pct}%` }]} />
      </View>

      {/* ── Map ── */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top: finish line */}
        <View style={s.finishBanner}>
          <Text style={s.finishEmoji}>🏁</Text>
          <Text style={s.finishText}>The finish line awaits</Text>
        </View>

        {renderItems.map((item) => {

          // ── Module banner ────────────────────────────────────────
          if (item.type === 'module-banner') {
            return (
              <View
                key={item.key}
                onLayout={e => { itemLayoutsRef.current[item.module.id] = e.nativeEvent.layout.y; }}
                style={[s.moduleBanner, { backgroundColor: item.module.color }]}
              >
                <Text style={s.moduleBannerIcon}>{item.module.icon}</Text>
                <View style={s.moduleBannerText}>
                  <Text style={s.moduleBannerLabel}>MODULE {item.modNumber}</Text>
                  <Text style={s.moduleBannerTitle} numberOfLines={2}>{item.module.title}</Text>
                  <Text style={s.moduleBannerDesc}  numberOfLines={2}>{item.module.description}</Text>
                </View>
                {completedModules.includes(item.module.id) && (
                  <View style={s.moduleDoneBadge}>
                    <Text style={s.moduleDoneText}>✓</Text>
                  </View>
                )}
              </View>
            );
          }

          // ── Chapter banner ───────────────────────────────────────
          if (item.type === 'chapter-banner') {
            // e.g. "1-2" = module 1, chapter 2 within that module
            const chapLabel = `${item.modNumber}-${item.chapNumber}`;
            return (
              <View
                key={item.key}
                onLayout={e => { itemLayoutsRef.current[item.chapterId] = e.nativeEvent.layout.y; }}
                style={[
                  s.chapterBanner,
                  item.isDone && { borderColor: item.moduleColor + '60', borderWidth: 1.5 },
                ]}
              >
                {/* Numbered badge: e.g. "1-2" */}
                <View style={[s.chapNumBadge, { backgroundColor: item.moduleColor + '18' }]}>
                  <Text style={[s.chapNumText, { color: item.moduleColor }]}>{chapLabel}</Text>
                </View>

                <Text style={s.chapterBannerIcon}>{item.chapterIcon}</Text>

                <View style={s.chapterBannerText}>
                  <Text style={[s.chapterBannerTitle, { color: item.moduleColor }]}>
                    {item.chapterTitle}
                  </Text>
                  {!!item.chapterDescription && (
                    <Text style={s.chapterBannerDesc} numberOfLines={1}>{item.chapterDescription}</Text>
                  )}
                </View>

                {item.isDone && (
                  <View style={[s.chapterDonePill, { backgroundColor: item.moduleColor }]}>
                    <Text style={s.chapterDoneText}>✓ Done</Text>
                  </View>
                )}
              </View>
            );
          }

          // ── Module trophy ────────────────────────────────────────
          if (item.type === 'module-trophy') {
            const { module: mod } = item;
            return (
              <TouchableOpacity
                key={item.key}
                style={s.moduleTrophyRow}
                onPress={() => router.push(`/module-complete/${mod.id}`)}
                activeOpacity={0.85}
              >
                <Animated.View style={[
                  s.moduleTrophyNode,
                  { backgroundColor: mod.color, transform: [{ scale: trophyPulse }] },
                ]}>
                  <Text style={s.moduleTrophyEmoji}>🏆</Text>
                </Animated.View>
                <View style={s.moduleTrophyLabelWrap}>
                  <Text style={[s.moduleTrophyTitle, { color: mod.color }]}>{mod.title}</Text>
                  <Text style={s.moduleTrophySub}>Module complete · Tap to view →</Text>
                </View>
              </TouchableOpacity>
            );
          }

          // ── Lesson node ──────────────────────────────────────────
          if (item.type === 'lesson') {
            const { lesson, position, done, unlocked, isCurrent, moduleColor } = item;

            const positionStyle =
              position === 'left'  ? { alignSelf: 'flex-start', marginLeft:  SW * 0.06 } :
              position === 'right' ? { alignSelf: 'flex-end',   marginRight: SW * 0.06 } :
                                     { alignSelf: 'center' };

            const labelOnLeft = position === 'right';

            const nodeStyle = [
              s.node,
              // Unlocked + incomplete: plain white bg, colored border
              unlocked && !done && { borderColor: moduleColor },
              // Current: slightly thicker colored border
              isCurrent && unlocked && !done && { borderColor: moduleColor, borderWidth: 4 },
              // Done: solid filled background
              done && { backgroundColor: moduleColor, borderColor: moduleColor },
              // Locked: grey + faded
              !unlocked && s.nodeLocked,
            ];

            // Always show lesson icon — never a tick, even when done
            const iconToShow = unlocked ? lesson.icon : '🔒';

            return (
              <View key={item.key} style={[s.nodeOuter, positionStyle]}>
                <View style={[s.nodeRow, labelOnLeft && s.nodeRowReversed]}>

                  {/* Label */}
                  <View style={[s.nodeLabel, labelOnLeft ? s.nodeLabelLeft : s.nodeLabelRight]}>
                    {isCurrent && unlocked && (
                      <View style={[s.chip, s.chipNext, { backgroundColor: moduleColor }]}>
                        <Text style={s.chipText}>NEXT</Text>
                      </View>
                    )}
                    <Text
                      style={[s.nodeLabelText, !unlocked && s.nodeLabelLocked]}
                      numberOfLines={2}
                    >
                      {lesson.title}
                    </Text>
                    {/* Meta row: coin.jpg + amount + duration */}
                    <View style={s.nodeMetaRow}>
                      <View style={s.metaCoinRow}>
                        <Image
                          source={require('../../assets/coin.png')}
                          style={s.coinImg}
                        />
                        <Text style={s.nodeMeta}>{lesson.fincoins ?? lesson.xp ?? 55}</Text>
                      </View>
                      {!!lesson.duration && (
                        <Text style={s.nodeMeta}>⏱ {lesson.duration}</Text>
                      )}
                    </View>
                  </View>

                  {/* Node bubble */}
                  <TouchableOpacity
                    onPress={() => unlocked && router.push(`/lesson/${lesson.id}`)}
                    disabled={!unlocked}
                    activeOpacity={0.85}
                  >
                    {isCurrent && unlocked ? (
                      <Animated.View style={[...nodeStyle, { transform: [{ scale: pulseAnim }] }]}>
                        <Text style={s.nodeIcon}>{lesson.icon}</Text>
                      </Animated.View>
                    ) : (
                      <View style={nodeStyle}>
                        <Text style={s.nodeIcon}>{iconToShow}</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                </View>
              </View>
            );
          }

          return null;
        })}

        {/* Bottom: origin node */}
        <View style={s.originNode}>
          <View style={s.originCircle}>
            <Text style={s.originEmoji}>🌱</Text>
          </View>
          <Text style={s.originText}>Your journey begins here</Text>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
  },
  topBarTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  topBarSub:   { fontSize: 13, color: '#6B7280', marginTop: 2 },
  pctBadge: {
    backgroundColor: '#4F46E5', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  pctText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  progressBarBg: {
    height: 6, backgroundColor: '#E5E7EB',
    marginHorizontal: 20, borderRadius: 3, marginBottom: 16,
  },
  progressBarFill: { height: 6, backgroundColor: '#4F46E5', borderRadius: 3 },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 32, paddingTop: 8 },

  finishBanner: { alignItems: 'center', paddingVertical: 28 },
  finishEmoji:  { fontSize: 36, marginBottom: 6 },
  finishText:   { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },

  // ── Module banner ──────────────────────────────────────────────────────────
  moduleBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 28, marginBottom: 8,
    borderRadius: 20, padding: 20, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  moduleBannerIcon:  { fontSize: 36 },
  moduleBannerText:  { flex: 1 },
  moduleBannerLabel: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 2,
  },
  moduleBannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  moduleBannerDesc:  { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },
  moduleDoneBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  moduleDoneText: { fontSize: 16, color: '#fff', fontWeight: '800' },

  // ── Chapter banner ─────────────────────────────────────────────────────────
  chapterBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: 24, marginBottom: 6, marginTop: 4,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 10,
    borderWidth: 1, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  // Numbered badge showing e.g. "1-2"
  chapNumBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
    minWidth: 36, alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  chapNumText:        { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  chapterBannerIcon:  { fontSize: 20, marginTop: 2 },
  chapterBannerText:  { flex: 1 },
  chapterBannerTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3, lineHeight: 19 },
  chapterBannerDesc:  { fontSize: 11, color: '#6B7280', lineHeight: 16 },
  chapterDonePill:    { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  chapterDoneText:    { fontSize: 10, fontWeight: '800', color: '#fff' },

  // ── Module trophy ──────────────────────────────────────────────────────────
  moduleTrophyRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginVertical: 20, gap: 16,
    paddingHorizontal: 24,
  },
  moduleTrophyNode: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  moduleTrophyEmoji:     { fontSize: 36 },
  moduleTrophyLabelWrap: { flex: 1 },
  moduleTrophyTitle:     { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  moduleTrophySub:       { fontSize: 12, color: '#9CA3AF' },

  // ── Lesson nodes ───────────────────────────────────────────────────────────
  nodeOuter:       { marginVertical: 8 },
  nodeRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nodeRowReversed: { flexDirection: 'row-reverse' },

  node: {
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    backgroundColor: '#fff', borderWidth: 3, borderColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  nodeLocked: { backgroundColor: '#F9FAFB', opacity: 0.4 },
  nodeIcon:   { fontSize: 26 },

  nodeLabel:      { width: SW * 0.38 },
  nodeLabelLeft:  { alignItems: 'flex-end' },
  nodeLabelRight: { alignItems: 'flex-start' },

  chip: {
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
    marginBottom: 4, alignSelf: 'flex-start',
  },
  chipNext: {},
  chipDone: { backgroundColor: '#DCFCE7' },
  chipText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.4 },

  nodeLabelText:   { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
  nodeLabelLocked: { color: '#9CA3AF' },

  // Coin image + meta
  nodeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  metaCoinRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  coinImg:     { width: 14, height: 14, borderRadius: 7 },
  nodeMeta:    { fontSize: 11, color: '#6B7280' },

  // ── Origin node ────────────────────────────────────────────────────────────
  originNode: { alignItems: 'center', paddingVertical: 32 },
  originCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  originEmoji: { fontSize: 32 },
  originText:  { fontSize: 14, color: '#6B7280', fontWeight: '600' },
});