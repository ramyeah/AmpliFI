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
const NODE_SIZE = 68;

// ─── Snake path positions ─────────────────────────────────────────────────────
const PATH_POSITIONS = ['left', 'center', 'right', 'center'];

// ─── Module colour zones ──────────────────────────────────────────────────────
// To retheme a module's zone background, add its ID here.
// Falls back to module.colorLight automatically.
// e.g.  'module-budgeting': '#FFF7ED'
const MODULE_ZONE_OVERRIDES = {};

// ─── Milestone star node ──────────────────────────────────────────────────────
function MilestoneStarNode({ mod, onPress, pulseAnim }) {
  return (
    <TouchableOpacity style={ms.row} onPress={onPress} activeOpacity={0.85}>
      <Animated.View style={[ms.outerRing, { borderColor: mod.color + '50', transform: [{ scale: pulseAnim }] }]}>
        <View style={[ms.innerCircle, { backgroundColor: mod.color }]}>
          <Text style={ms.starEmoji}>⭐</Text>
        </View>
      </Animated.View>
      <View style={ms.labelWrap}>
        <Text style={[ms.title, { color: mod.color }]}>{mod.title} Complete!</Text>
        <Text style={ms.sub}>Tap to collect your reward →</Text>
      </View>
    </TouchableOpacity>
  );
}

const ms = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28, paddingVertical: 20, gap: 16,
  },
  outerRing: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 2.5,
    justifyContent: 'center', alignItems: 'center',
  },
  innerCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  starEmoji:  { fontSize: 30 },
  labelWrap:  { flex: 1 },
  title:      { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  sub:        { fontSize: 12, color: '#9CA3AF' },
});

// ─── Flat lesson list with metadata ──────────────────────────────────────────
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

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const router         = useRouter();
  const { scrollTo }   = useLocalSearchParams();
  const scrollRef      = useRef(null);
  const itemLayoutsRef = useRef({});

  const [completedLessons,  setCompletedLessons]  = useState([]);
  const [completedChapters, setCompletedChapters] = useState([]);
  const [completedModules,  setCompletedModules]  = useState([]);
  const [loading,           setLoading]           = useState(true);

  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const trophyPulse = useRef(new Animated.Value(1)).current;

  const loadProgress = useCallback(async () => {
    const progress = await getProgress();
    setCompletedLessons(progress.completedLessons);
    setCompletedChapters(progress.completedChapters);
    setCompletedModules(progress.completedModules);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProgress();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyPulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(trophyPulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!loading && !scrollTo)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 120);
  }, [loading]);

  useEffect(() => {
    if (!loading && scrollTo) {
      setTimeout(() => {
        const y = itemLayoutsRef.current[scrollTo];
        if (y != null) scrollRef.current?.scrollTo({ y, animated: true });
      }, 350);
    }
  }, [loading, scrollTo]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const allLessons   = getAllLessons();
  const totalLessons = allLessons.length;
  const totalDone    = completedLessons.length;
  const pct          = Math.round((totalDone / totalLessons) * 100);

  const isLessonUnlocked = (i) =>
    i === 0 || completedLessons.includes(allLessons[i - 1].id);

  const currentIndex = (() => {
    for (let i = 0; i < allLessons.length; i++)
      if (!completedLessons.includes(allLessons[i].id)) return i;
    return allLessons.length - 1;
  })();

  // ── Build render items ─────────────────────────────────────────────────────
  const buildRenderItems = () => {
    const items       = [];
    let lessonIndex   = 0;
    let prevChapterId = null;
    let prevModuleId  = null;
    let modNumber     = 0;
    let chapNumber    = 0;

    allLessons.forEach((lesson, i) => {

      if (lesson.moduleId !== prevModuleId) {
        modNumber++;
        chapNumber    = 0;
        const mod     = MODULES.find(m => m.id === lesson.moduleId);
        items.push({ type: 'module-banner', module: mod, modNumber, key: `mod-${lesson.moduleId}` });
        prevModuleId  = lesson.moduleId;
        prevChapterId = null;
      }

      if (lesson.chapterId !== prevChapterId) {
        chapNumber++;
        items.push({
          type: 'chapter-banner',
          chapterId: lesson.chapterId,
          chapterTitle: lesson.chapterTitle,
          chapterIcon: lesson.chapterIcon,
          chapterDescription: lesson.chapterDescription,
          moduleColor: lesson.moduleColor,
          moduleId: lesson.moduleId,
          isDone: completedChapters.includes(lesson.chapterId),
          modNumber, chapNumber,
          key: `chap-${lesson.chapterId}`,
        });
        prevChapterId = lesson.chapterId;
      }

      const done     = completedLessons.includes(lesson.id);
      const unlocked = isLessonUnlocked(i);
      const pos      = PATH_POSITIONS[lessonIndex % PATH_POSITIONS.length];
      items.push({
        type: 'lesson',
        lesson, done, unlocked, pos,
        isCurrent:        i === currentIndex,
        moduleColor:      lesson.moduleColor,
        moduleColorLight: lesson.moduleColorLight,
        moduleId:         lesson.moduleId,
        key:              lesson.id,
      });
      lessonIndex++;

      const isLastInModule =
        i === allLessons.length - 1 || allLessons[i + 1].moduleId !== lesson.moduleId;
      if (isLastInModule && completedModules.includes(lesson.moduleId)) {
        const mod = MODULES.find(m => m.id === lesson.moduleId);
        items.push({ type: 'module-star', module: mod, key: `mstar-${lesson.moduleId}` });
      }
    });

    return items.reverse();
  };

  const renderItems = buildRenderItems();

  if (loading) return <View style={s.container} />;

  const modById    = (id) => MODULES.find(m => m.id === id);
  const zoneColor  = (mod, moduleId) => {
    if (!mod) return 'transparent';
    return MODULE_ZONE_OVERRIDES[moduleId] ?? mod.colorLight ?? mod.color + '12';
  };

  return (
    <View style={s.container}>

      <View style={s.topBar}>
        <View>
          <Text style={s.topBarTitle}>Learning Journey 🗺️</Text>
          <Text style={s.topBarSub}>{totalDone} of {totalLessons} lessons complete</Text>
        </View>
        <View style={s.pctBadge}>
          <Text style={s.pctText}>{pct}%</Text>
        </View>
      </View>

      <View style={s.progressBarBg}>
        <View style={[s.progressBarFill, { width: `${pct}%` }]} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.finishBanner}>
          <Text style={s.finishEmoji}>🏁</Text>
          <Text style={s.finishText}>The finish line awaits</Text>
        </View>

        {renderItems.map((item, idx) => {

          const mod = item.module
            ?? modById(item.moduleId ?? getAllLessons().find(l => l.chapterId === item.chapterId)?.moduleId);
          const zc  = zoneColor(mod, mod?.id);

          // ── Module banner ────────────────────────────────────────────────
          if (item.type === 'module-banner') {
            return (
              <View key={item.key} style={[s.zoneRow, { backgroundColor: zc }]}>
                <View
                  onLayout={e => { itemLayoutsRef.current[item.module.id] = e.nativeEvent.layout.y; }}
                  style={[s.moduleBanner, { backgroundColor: item.module.color }]}
                >
                  <Text style={s.moduleBannerIcon}>{item.module.icon}</Text>
                  <View style={s.moduleBannerText}>
                    <Text style={s.moduleBannerLabel}>MODULE {item.modNumber}</Text>
                    <Text style={s.moduleBannerTitle}>{item.module.title}</Text>
                    <Text style={s.moduleBannerDesc}>{item.module.description}</Text>
                  </View>
                  {completedModules.includes(item.module.id) && (
                    <View style={s.moduleDoneBadge}>
                      <Text style={s.moduleDoneText}>✓</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }

          // ── Chapter banner ───────────────────────────────────────────────
          if (item.type === 'chapter-banner') {
            const chapLabel = `${item.modNumber}-${item.chapNumber}`;
            return (
              <View key={item.key} style={[s.zoneRow, { backgroundColor: zc }]}>
                <View
                  onLayout={e => { itemLayoutsRef.current[item.chapterId] = e.nativeEvent.layout.y; }}
                  style={[
                    s.chapterBanner,
                    item.isDone && { borderColor: item.moduleColor + '60', borderWidth: 1.5 },
                  ]}
                >
                  {/* Top row: badge · icon · title · done pill */}
                  <View style={s.chapTopRow}>
                    <View style={[s.chapNumBadge, { backgroundColor: item.moduleColor + '18' }]}>
                      <Text style={[s.chapNumText, { color: item.moduleColor }]}>{chapLabel}</Text>
                    </View>
                    <Text style={s.chapIcon}>{item.chapterIcon}</Text>
                    <Text style={[s.chapTitle, { color: item.moduleColor }]}>
                      {item.chapterTitle}
                    </Text>
                    {item.isDone && (
                      <View style={[s.chapDonePill, { backgroundColor: item.moduleColor }]}>
                        <Text style={s.chapDoneText}>✓ Done</Text>
                      </View>
                    )}
                  </View>
                  {/* Description — full width, no truncation */}
                  {!!item.chapterDescription && (
                    <Text style={s.chapDesc}>{item.chapterDescription}</Text>
                  )}
                </View>
              </View>
            );
          }

          // ── Module star ──────────────────────────────────────────────────
          if (item.type === 'module-star') {
            return (
              <View key={item.key} style={[s.zoneRow, { backgroundColor: zc }]}>
                <MilestoneStarNode
                  mod={item.module}
                  onPress={() => router.push(`/module-complete/${item.module.id}`)}
                  pulseAnim={trophyPulse}
                />
              </View>
            );
          }

          // ── Lesson node ──────────────────────────────────────────────────
          if (item.type === 'lesson') {
            const {
              lesson, done, unlocked, pos,
              isCurrent, moduleColor, moduleColorLight, moduleId,
            } = item;

            const posStyle =
              pos === 'left'  ? { alignSelf: 'flex-start', marginLeft:  SW * 0.06 } :
              pos === 'right' ? { alignSelf: 'flex-end',   marginRight: SW * 0.06 } :
                                { alignSelf: 'center' };

            const labelOnLeft = pos === 'right';

            const nodeStyle = [
              s.node,
              unlocked && !done            && { borderColor: moduleColor },
              isCurrent && unlocked && !done && { borderColor: moduleColor, borderWidth: 4 },
              done                           && { backgroundColor: moduleColor, borderColor: moduleColor },
              !unlocked                      && s.nodeLocked,
            ];

            return (
              // The zoneRow wraps ONLY the node row itself (not the connector)
              // so that module zone backgrounds don't bleed into connector gaps
              <View key={item.key}>
                <View style={[s.zoneRow, { backgroundColor: zc }]}>
                  <View style={[s.nodeOuter, posStyle]}>
                    <View style={[s.nodeRow, labelOnLeft && s.nodeRowReversed]}>

                      <View style={[s.nodeLabel, labelOnLeft ? s.nodeLabelLeft : s.nodeLabelRight]}>
                        {isCurrent && unlocked && (
                          <View style={[s.chip, { backgroundColor: moduleColor, alignSelf: labelOnLeft ? 'flex-end' : 'flex-start' }]}>
                            <Text style={s.chipText}>NEXT</Text>
                          </View>
                        )}
                        <Text
                          style={[s.nodeLabelText, !unlocked && s.nodeLabelLocked]}
                          numberOfLines={2}
                        >
                          {lesson.title}
                        </Text>
                        <View style={[s.nodeMetaRow, labelOnLeft && { justifyContent: 'flex-end' }]}>
                          <View style={s.metaCoinRow}>
                            <Image source={require('../../assets/coin.png')} style={s.coinImg} />
                            <Text style={s.nodeMeta}>{lesson.fincoins ?? lesson.xp ?? 55}</Text>
                          </View>
                          {!!lesson.duration && <Text style={s.nodeMeta}>⏱ {lesson.duration}</Text>}
                        </View>
                      </View>

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
                            <Text style={s.nodeIcon}>{unlocked ? lesson.icon : '🔒'}</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                    </View>
                  </View>
                </View>

              </View>
            );
          }

          return null;
        })}

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

// ─── Main styles ──────────────────────────────────────────────────────────────
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

  // Zone row — gives each item the module's tinted background
  zoneRow: { position: 'relative' },

  // ── Module banner ──────────────────────────────────────────────────────────
  moduleBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 4, marginBottom: 4,
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

  // ── Chapter banner — vertical stack, never truncates ──────────────────────
  chapterBanner: {
    marginHorizontal: 20, marginTop: 4, marginBottom: 4,
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
    borderWidth: 1, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  chapTopRow: {
    flexDirection: 'row', alignItems: 'center',
    flexWrap: 'wrap', gap: 6, marginBottom: 4,
  },
  chapNumBadge: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  chapNumText:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  chapIcon:     { fontSize: 18 },
  chapTitle: {
    flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 20, minWidth: 80,
  },
  chapDonePill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chapDoneText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  chapDesc:     { fontSize: 11, color: '#6B7280', lineHeight: 17, marginTop: 2 },

  // ── Lesson nodes ───────────────────────────────────────────────────────────
  nodeOuter:       { marginVertical: 10, zIndex: 2, position: 'relative' },
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
  chipText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.4 },

  nodeLabelText:   { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
  nodeLabelLocked: { color: '#9CA3AF' },

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