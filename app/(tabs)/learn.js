// app/(tabs)/learn.js

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MODULES } from '../../constants/modules';
import { getProgress } from '../../lib/progress';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';

const { width: SW } = Dimensions.get('window');
const NODE_SIZE = 68;

const PATH_POSITIONS = ['left', 'center', 'right', 'center'];
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
    ...Shadows.medium,
  },
  starEmoji:  { fontSize: 30 },
  labelWrap:  { flex: 1 },
  title: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.base,
    marginBottom: 3,
  },
  sub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
});

// ─── Flat lesson list ─────────────────────────────────────────────────────────
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
        moduleTextColor: m.textColor ?? null,
        moduleColor:        m.color,
        moduleColorLight:   m.colorLight,
        moduleIcon:         m.icon,
        moduleBadgeColor: m.badgeColor ?? null,
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
          chapterId:          lesson.chapterId,
          chapterTitle:       lesson.chapterTitle,
          chapterIcon:        lesson.chapterIcon,
          chapterDescription: lesson.chapterDescription,
          moduleColor:        lesson.moduleColor,
          moduleTextColor: lesson.moduleTextColor,
          moduleBadgeColor: lesson.moduleBadgeColor,
          moduleId:           lesson.moduleId,
          isDone:             completedChapters.includes(lesson.chapterId),
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

  const modById   = (id) => MODULES.find(m => m.id === id);
  const zoneColor = (mod, moduleId) => 'transparent';

  return (
    <View style={s.container}>

      {/* Top bar */}
      <View style={s.topBar}>
        <View>
          <Text style={s.topBarTitle}>Learning Journey</Text>
          <Text style={s.topBarSub}>{totalDone} of {totalLessons} lessons complete</Text>
        </View>
        <View style={s.pctBadge}>
          <Text style={s.pctText}>{pct}%</Text>
        </View>
      </View>

      {/* Progress bar */}
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
          <Text style={s.finishEmoji}>🏆</Text>
          <Text style={s.originText}>That's it for now!</Text>
        </View>

        {renderItems.map((item) => {
          const mod = item.module
            ?? modById(item.moduleId ?? getAllLessons().find(l => l.chapterId === item.chapterId)?.moduleId);
          const zc  = zoneColor(mod, mod?.id);
          

          // ── Module banner ──────────────────────────────────────────────
          if (item.type === 'module-banner') {
            return (
              <View key={item.key} style={[s.zoneRow, { backgroundColor: zc }]}>
                <View
                  onLayout={e => { itemLayoutsRef.current[item.module.id] = e.nativeEvent.layout.y; }}
                  style={[s.moduleBanner, { backgroundColor: item.module.color }]}
                >
                  <Text style={s.moduleBannerIcon}>{item.module.icon}</Text>
                  <View style={s.moduleBannerText}>
                    <Text style={[s.moduleBannerLabel, { color: item.module.textColor ?? 'rgba(255,255,255,0.7)' }]}>MODULE {item.modNumber}</Text>
                    <Text style={[s.moduleBannerTitle, { color: item.module.textColor ?? Colors.white }]}>{item.module.title}</Text>
                    <Text style={[s.moduleBannerDesc,  { color: item.module.textColor ?? 'rgba(255,255,255,0.8)' }]}>{item.module.description}</Text>
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

          // ── Chapter banner ─────────────────────────────────────────────
          // ── Chapter banner ─────────────────────────────────────────────
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
                  <View style={s.chapRow}>
                    <View style={[s.chapNumBadge, { backgroundColor: item.moduleColor + '18' }]}>
                      <Text style={[s.chapNumText, { color: item.moduleColor }]}>{chapLabel}</Text>
                    </View>
                    <View style={s.chapTextCol}>
                      <View style={s.chapTitleRow}>
                        <Text style={[s.chapTitle, { color: item.moduleTextColor ?? item.moduleColor }]}>
                          {item.chapterTitle}
                        </Text>

                        {item.isDone && (
                          <View style={[s.chapDonePill, { backgroundColor: item.moduleColor }]}>
                            <Text style={s.chapDoneText}>✓ Done</Text>
                          </View>
                        )}
                      </View>
                      {!!item.chapterDescription && (
                        <Text style={s.chapDesc}>{item.chapterDescription}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          }

          // ── Module star ────────────────────────────────────────────────
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

          // ── Lesson node ────────────────────────────────────────────────
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
              unlocked && !done             && { borderColor: moduleColor },
              isCurrent && unlocked && !done && { borderColor: moduleColor, borderWidth: 4 },
              done                           && { backgroundColor: moduleColor, borderColor: moduleColor },
              !unlocked                      && s.nodeLocked,
            ];

            return (
              <View key={item.key}>
                <View style={[s.zoneRow, { backgroundColor: zc }]}>
                  <View style={[s.nodeOuter, posStyle]}>
                    <View style={[s.nodeRow, labelOnLeft && s.nodeRowReversed]}>

                      <View style={[s.nodeLabel, labelOnLeft ? s.nodeLabelLeft : s.nodeLabelRight]}>
                        {isCurrent && unlocked && (
                          <View style={[s.chip, {
                            backgroundColor: moduleColor,
                            alignSelf: labelOnLeft ? 'flex-end' : 'flex-start',
                          }]}>
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
                            {done
                              ? <Text style={[s.nodeIcon, s.nodeDoneIcon]}>✓</Text>
                              : <Text style={s.nodeIcon}>{unlocked ? lesson.icon : '🔒'}</Text>
                            }
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

        {/* Origin node */}
        <View style={s.originNode}>
          <Text style={s.originEmoji}>🌱</Text>
          <Text style={s.originText}>Your journey begins here</Text>
        </View>

      </ScrollView>
    </View>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl + Spacing.md,
    paddingBottom: Spacing.md,
  },
  topBarTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  topBarSub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pctBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pctText: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.base,
    color: Colors.white,
  },

  // Progress bar
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.full,
    marginBottom: Spacing.lg,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxl, paddingTop: Spacing.md },

  // Finish banner
  finishBanner: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  finishEmoji:  { fontSize: 36, marginBottom: Spacing.sm },
  finishText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },

  zoneRow: { position: 'relative' },

  // Module banner
  moduleBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl, marginBottom: Spacing.md,
    borderRadius: Radii.xl, padding: Spacing.xl, gap: 14,
    ...Shadows.medium,
  },
  moduleBannerIcon:  { fontSize: 36 },
  moduleBannerText:  { flex: 1 },
  moduleBannerLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  moduleBannerTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  moduleBannerDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 17,
  },
  
  moduleDoneBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  moduleDoneText: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.md,
    color: Colors.white,
  },

  // Chapter banner
  chapterBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    borderWidth: 1, borderColor: 'transparent',
    ...Shadows.soft,
  },
  chapRow: {
  flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  chapTextCol: {
    flex: 1, gap: 3,
  },
  chapTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap',
  },

  chapNumBadge: {
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    alignItems: 'center', justifyContent: 'center',
  },
  chapNumText: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 0.3,
  },
  chapIcon:  { fontSize: 18 },
  chapTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  chapDonePill: {
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  chapDoneText: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
  },
  chapDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    lineHeight: 17,
  },

  // Lesson nodes
  nodeOuter:       { marginVertical: 18, zIndex: 2, position: 'relative' },
  nodeRow:         { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nodeRowReversed: { flexDirection: 'row-reverse' },

  node: {
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 3, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    ...Shadows.soft,
  },
  nodeLocked: { backgroundColor: Colors.lightGray, opacity: 0.4 },
  nodeIcon:   { fontSize: 26 },

  nodeLabel:      { width: SW * 0.38 },
  nodeLabelLeft:  { alignItems: 'flex-end' },
  nodeLabelRight: { alignItems: 'flex-start' },

  chip: {
    borderRadius: Radii.sm,
    paddingHorizontal: 7, paddingVertical: 2,
    marginBottom: Spacing.xs, alignSelf: 'flex-start',
  },
  chipText: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 9,
    color: Colors.white,
    letterSpacing: 0.4,
  },

  nodeLabelText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  nodeLabelLocked: { color: Colors.textMuted },
  nodeDoneIcon: { color: Colors.white },

  nodeMetaRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap',
  },
  metaCoinRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  coinImg:     { width: 14, height: 14, borderRadius: 7 },
  nodeMeta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Origin node
  originNode: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  originCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  originEmoji: { fontSize: 32 },
  originText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
});