import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { MODULES } from '../../constants/modules';

const { width: SW } = Dimensions.get('window');
const NODE_SIZE = 64;
const PATH_POSITIONS = ['left', 'center', 'right', 'center'];

export default function LearnScreen() {
  const router = useRouter();
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadProgress();
    startPulse();
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const loadProgress = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const snap = await getDoc(doc(db, 'progress', uid));
    setCompletedLessons(snap.exists() ? snap.data().completedLessons || [] : []);
    setLoading(false);
  };

  const allLessons = MODULES.flatMap(m =>
    m.chapters.flatMap(c =>
      c.lessons.map(l => ({
        ...l,
        chapterId: c.id,
        chapterTitle: c.title,
        chapterIcon: c.icon,
        chapterDescription: c.description || '',
        moduleId: m.id,
        moduleTitle: m.title,
        moduleColor: m.color,
        moduleColorLight: m.colorLight,
        moduleIcon: m.icon,
        moduleDescription: m.description,
      }))
    )
  );

  const isUnlocked = (index) => {
    if (index === 0) return true;
    return completedLessons.includes(allLessons[index - 1].id);
  };

  const currentIndex = (() => {
    for (let i = 0; i < allLessons.length; i++) {
      if (!completedLessons.includes(allLessons[i].id)) return i;
    }
    return allLessons.length - 1;
  })();

  const buildRenderItems = () => {
    const items = [];
    let lessonIndex = 0;
    let prevChapterId = null;
    let prevModuleId = null;

    allLessons.forEach((lesson, i) => {
      if (lesson.moduleId !== prevModuleId) {
        items.push({
          type: 'module-banner',
          module: MODULES.find(m => m.id === lesson.moduleId),
          key: `mod-${lesson.moduleId}`,
        });
        prevModuleId = lesson.moduleId;
        prevChapterId = null;
      }
      if (lesson.chapterId !== prevChapterId) {
        items.push({
          type: 'chapter-banner',
          chapterId: lesson.chapterId,
          chapterTitle: lesson.chapterTitle,
          chapterIcon: lesson.chapterIcon,
          chapterDescription: lesson.chapterDescription,
          moduleColor: lesson.moduleColor,
          key: `chap-${lesson.chapterId}`,
        });
        prevChapterId = lesson.chapterId;
      }
      items.push({
        type: 'lesson',
        lesson,
        globalIndex: i,
        position: PATH_POSITIONS[lessonIndex % PATH_POSITIONS.length],
        done: completedLessons.includes(lesson.id),
        unlocked: isUnlocked(i),
        isCurrent: i === currentIndex,
        moduleColor: lesson.moduleColor,
        moduleColorLight: lesson.moduleColorLight,
        key: lesson.id,
      });
      lessonIndex++;
    });
    return items;
  };

  const renderItems = buildRenderItems();
  const totalDone = completedLessons.length;
  const totalLessons = allLessons.length;
  const pct = Math.round((totalDone / totalLessons) * 100);

  if (loading) return <View style={styles.container} />;

  return (
    <View style={styles.container}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Learning Journey 🗺️</Text>
          <Text style={styles.topBarSub}>{totalDone} of {totalLessons} lessons done</Text>
        </View>
        <View style={styles.pctBadge}>
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderItems.map((item) => {

          // ── Module Banner ──
          if (item.type === 'module-banner') {
            return (
              <View key={item.key} style={[styles.moduleBanner, { backgroundColor: item.module.color }]}>
                <Text style={styles.moduleBannerIcon}>{item.module.icon}</Text>
                <View style={styles.moduleBannerText}>
                  <Text style={styles.moduleBannerLabel}>MODULE</Text>
                  <Text style={styles.moduleBannerTitle} numberOfLines={2}>
                    {item.module.title}
                  </Text>
                  <Text style={styles.moduleBannerDesc} numberOfLines={2}>
                    {item.module.description}
                  </Text>
                </View>
              </View>
            );
          }

          // ── Chapter Banner ──
          if (item.type === 'chapter-banner') {
            return (
              <View key={item.key} style={styles.chapterBanner}>
                <Text style={styles.chapterBannerIcon}>{item.chapterIcon}</Text>
                <View style={styles.chapterBannerText}>
                  <Text style={[styles.chapterBannerTitle, { color: item.moduleColor }]}
                    numberOfLines={2}>
                    {item.chapterTitle}
                  </Text>
                  {!!item.chapterDescription && (
                    <Text style={styles.chapterBannerDesc} numberOfLines={2}>
                      {item.chapterDescription}
                    </Text>
                  )}
                </View>
              </View>
            );
          }

          // ── Lesson Node ──
          if (item.type === 'lesson') {
            const { lesson, position, done, unlocked, isCurrent, moduleColor } = item;

            const positionStyle =
              position === 'left' ? { alignSelf: 'flex-start', marginLeft: SW * 0.1 } :
              position === 'right' ? { alignSelf: 'flex-end', marginRight: SW * 0.1 } :
              { alignSelf: 'center' };

            const labelOnLeft = position === 'right';

            const nodeWrap = [
              styles.node,
              done && { backgroundColor: moduleColor, borderColor: moduleColor },
              isCurrent && unlocked && { borderColor: moduleColor, borderWidth: 4 },
              !unlocked && styles.nodeLocked,
            ];

            return (
              <View key={item.key} style={[styles.nodeRow, positionStyle]}>

                {/* Label */}
                <View style={[
                  styles.nodeLabel,
                  labelOnLeft ? styles.nodeLabelLeft : styles.nodeLabelRight,
                ]}>
                  {isCurrent && unlocked && (
                    <View style={[styles.startChip, { backgroundColor: moduleColor }]}>
                      <Text style={styles.startChipText}>START</Text>
                    </View>
                  )}
                  <Text
                    style={[styles.nodeLabelText, !unlocked && styles.nodeLabelLocked]}
                    numberOfLines={3}
                  >
                    {lesson.title}
                  </Text>
                  <Text style={styles.nodeMeta}>
                    {done ? '✅ · ' : ''}{lesson.xp}💰
                  </Text>
                </View>

                {/* Node */}
                <TouchableOpacity
                  onPress={() => unlocked && router.push(`/lesson/${lesson.id}`)}
                  disabled={!unlocked}
                  activeOpacity={0.85}
                >
                  {isCurrent && unlocked ? (
                    <Animated.View style={[...nodeWrap, { transform: [{ scale: pulseAnim }] }]}>
                      <Text style={styles.nodeIcon}>{lesson.icon}</Text>
                    </Animated.View>
                  ) : (
                    <View style={nodeWrap}>
                      <Text style={styles.nodeIcon}>
                        {done ? '✓' : unlocked ? lesson.icon : '🔒'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

              </View>
            );
          }

          return null;
        })}

        {/* End trophy */}
        <View style={styles.endNode}>
          <Text style={styles.endEmoji}>🏆</Text>
          <Text style={styles.endText}>
            {totalDone === totalLessons
              ? 'You completed the entire roadmap!'
              : `${totalLessons - totalDone} lessons remaining`}
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
  },
  topBarTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  topBarSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  pctBadge: {
    backgroundColor: '#4F46E5', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  pctText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Progress bar
  progressBarBg: {
    height: 6, backgroundColor: '#E5E7EB',
    marginHorizontal: 20, borderRadius: 3, marginBottom: 16,
  },
  progressBarFill: { height: 6, backgroundColor: '#4F46E5', borderRadius: 3 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: 4 },

  // Module banner
  moduleBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
    borderRadius: 20, padding: 20, gap: 14,
  },
  moduleBannerIcon: { fontSize: 36 },
  moduleBannerText: { flex: 1 },
  moduleBannerLabel: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 2,
  },
  moduleBannerTitle: {
    fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4,
  },
  moduleBannerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },

  // Chapter banner
  chapterBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 8, marginTop: 4,
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  chapterBannerIcon: { fontSize: 22 },
  chapterBannerText: { flex: 1 },
  chapterBannerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  chapterBannerDesc: { fontSize: 12, color: '#6B7280', lineHeight: 17 },

  // Lesson node
  nodeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 16, gap: 12,
  },
  node: {
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    backgroundColor: '#fff', borderWidth: 3, borderColor: '#E5E7EB',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  nodeLocked: { backgroundColor: '#F9FAFB', opacity: 0.5 },
  nodeIcon: { fontSize: 24, color: '#fff' },

  // Node label
  nodeLabel: { width: SW * 0.35 },
  nodeLabelLeft: { alignItems: 'flex-end' },
  nodeLabelRight: { alignItems: 'flex-start' },
  startChip: {
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4,
  },
  startChipText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  nodeLabelText: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
  nodeLabelLocked: { color: '#9CA3AF' },
  nodeMeta: { fontSize: 11, color: '#6B7280', marginTop: 3 },

  // End
  endNode: { alignItems: 'center', paddingVertical: 32 },
  endEmoji: { fontSize: 48, marginBottom: 8 },
  endText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});