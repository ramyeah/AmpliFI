// app/module-complete/[moduleId].js

import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getProgress } from '../../lib/progress';
import { MODULES } from '../../constants/modules';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#FFD700', '#FF6B6B', '#4F46E5', '#059669',
  '#F59E0B', '#EC4899', '#0891B2', '#8B5CF6',
];

function ConfettiPiece({ delay, color, startX, size, shape }) {
  const y      = useRef(new Animated.Value(-40)).current;
  const x      = useRef(new Animated.Value(0)).current;
  const op     = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 200;
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(y,      { toValue: SH * 0.75, duration: 2600, useNativeDriver: true }),
        Animated.timing(x,      { toValue: drift,     duration: 2600, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1,         duration: 2600, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(op, { toValue: 1, duration: 150,  useNativeDriver: true }),
          Animated.timing(op, { toValue: 0, duration: 700,  delay: 1600, useNativeDriver: true }),
        ]),
      ]).start();
    }, delay);
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${Math.random() > 0.5 ? 720 : -540}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute', left: startX, top: 0,
        width: size, height: shape === 'rect' ? size * 0.4 : size,
        borderRadius: shape === 'circle' ? size / 2 : 3,
        backgroundColor: color,
        opacity: op,
        transform: [{ translateY: y }, { translateX: x }, { rotate: spin }],
      }}
    />
  );
}

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1200,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    startX: Math.random() * SW,
    size: 7 + Math.random() * 9,
    shape: ['circle', 'rect', 'square'][Math.floor(Math.random() * 3)],
  }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}
    </View>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label, color }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, delay: 600, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[stat.pill, { transform: [{ scale }] }]}>
      <Text style={stat.icon}>{icon}</Text>
      <Text style={[stat.value, { color }]}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
    </Animated.View>
  );
}

// ─── Chapter row ──────────────────────────────────────────────────────────────
function ChapterRow({ chapter, completedLessons, moduleColor, index, totalChapters }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 350, delay: 800 + index * 120, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 350, delay: 800 + index * 120, useNativeDriver: true }),
    ]).start();
  }, []);

  const lessonsDone = chapter.lessons.filter(l => completedLessons.includes(l.id)).length;
  const totalLessons = chapter.lessons.length;
  const chapterFincoins = chapter.lessons
    .filter(l => completedLessons.includes(l.id))
    .reduce((sum, l) => sum + (l.fincoins ?? 55), 0);

  return (
    <Animated.View style={[crow.container, { opacity, transform: [{ translateY }] }]}>
      <View style={[crow.iconCircle, { backgroundColor: moduleColor + '20' }]}>
        <Text style={crow.icon}>{chapter.icon}</Text>
      </View>
      <View style={crow.middle}>
        <Text style={crow.title} numberOfLines={1}>{chapter.title}</Text>
        <View style={crow.lessonsRow}>
          {chapter.lessons.map((l, i) => (
            <View
              key={l.id}
              style={[
                crow.lessonDot,
                completedLessons.includes(l.id)
                  ? { backgroundColor: moduleColor }
                  : { backgroundColor: '#E5E7EB' },
              ]}
            />
          ))}
          <Text style={crow.lessonsText}>
            {lessonsDone}/{totalLessons} lessons
          </Text>
        </View>
      </View>
      <View style={crow.right}>
        <Text style={[crow.fincoins, { color: moduleColor }]}>+{chapterFincoins}</Text>
        <Text style={crow.coinIcon}>💰</Text>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ModuleCompleteScreen() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams();

  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animations
  const trophyScale   = useRef(new Animated.Value(0)).current;
  const trophyBounce  = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const bodyOpacity   = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadProgress(); }, []);

  useEffect(() => {
    if (!loading) {
      Animated.sequence([
        // Trophy entrance
        Animated.spring(trophyScale,   { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        // Bounce
        Animated.sequence([
          Animated.timing(trophyBounce, { toValue: -18, duration: 300, useNativeDriver: true }),
          Animated.timing(trophyBounce, { toValue: 0,   duration: 300, useNativeDriver: true }),
          Animated.timing(trophyBounce, { toValue: -10, duration: 200, useNativeDriver: true }),
          Animated.timing(trophyBounce, { toValue: 0,   duration: 200, useNativeDriver: true }),
        ]),
        // Fade in header text and body
        Animated.parallel([
          Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(bodyOpacity,   { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [loading]);

  const loadProgress = async () => {
    const progress = await getProgress();
    setCompletedLessons(progress.completedLessons);
    setLoading(false);
  };

  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod || loading) return <View style={s.container} />;

  // Stats
  const allModuleLessons  = mod.chapters.flatMap(c => c.lessons);
  const totalFincoins     = allModuleLessons
    .filter(l => completedLessons.includes(l.id))
    .reduce((sum, l) => sum + (l.fincoins ?? 55), 0);
  const totalLessons      = allModuleLessons.length;
  const completedCount    = allModuleLessons.filter(l => completedLessons.includes(l.id)).length;

  // Next module
  const modIdx     = MODULES.findIndex(m => m.id === moduleId);
  const nextModule = MODULES[modIdx + 1] ?? null;

  const handleContinue = () => {
    if (nextModule) {
      // Go to learn map — it will scroll to next module
      router.replace(`/(tabs)/learn?scrollTo=${nextModule.id}`);
    } else {
      router.replace('/(tabs)/learn');
    }
  };

  return (
    <View style={s.container}>
      <Confetti />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero header ── */}
        <View style={[s.hero, { backgroundColor: mod.color }]}>
          {/* Back button */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Trophy */}
          <Animated.View style={[s.trophyWrap, {
            transform: [{ scale: trophyScale }, { translateY: trophyBounce }],
          }]}>
            <View style={s.trophyGlow}>
              <Text style={s.trophyEmoji}>🏆</Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: headerOpacity, alignItems: 'center' }}>
            <Text style={s.moduleCompleteLabel}>MODULE COMPLETE</Text>
            <Text style={s.moduleTitle}>{mod.title}</Text>
            <Text style={s.moduleDesc}>{mod.description}</Text>
          </Animated.View>
        </View>

        {/* ── Stats row ── */}
        <Animated.View style={[s.statsRow, { opacity: bodyOpacity }]}>
          <StatPill
            icon="💰"
            value={totalFincoins}
            label="FinCoins"
            color={mod.color}
          />
          <StatPill
            icon="📚"
            value={`${completedCount}/${totalLessons}`}
            label="Lessons"
            color={mod.color}
          />
          <StatPill
            icon="🎯"
            value={mod.chapters.length}
            label="Chapters"
            color={mod.color}
          />
        </Animated.View>

        {/* ── Chapter breakdown ── */}
        <Animated.View style={[s.section, { opacity: bodyOpacity }]}>
          <Text style={s.sectionLabel}>What you mastered</Text>
          {mod.chapters.map((chapter, i) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              completedLessons={completedLessons}
              moduleColor={mod.color}
              index={i}
              totalChapters={mod.chapters.length}
            />
          ))}
        </Animated.View>

        {/* ── What's next ── */}
        <Animated.View style={[s.section, { opacity: bodyOpacity }]}>
          <Text style={s.sectionLabel}>What's next</Text>
          {nextModule ? (
            <View style={[s.nextCard, { borderColor: nextModule.color + '50', backgroundColor: nextModule.colorLight ?? '#F9FAFB' }]}>
              <View style={[s.nextIconCircle, { backgroundColor: nextModule.color }]}>
                <Text style={s.nextIcon}>{nextModule.icon}</Text>
              </View>
              <View style={s.nextText}>
                <Text style={[s.nextModuleLabel, { color: nextModule.color }]}>NEXT MODULE</Text>
                <Text style={s.nextModuleTitle}>{nextModule.title}</Text>
                <Text style={s.nextModuleDesc} numberOfLines={2}>{nextModule.description}</Text>
              </View>
            </View>
          ) : (
            <View style={[s.nextCard, { borderColor: '#F59E0B50', backgroundColor: '#FFFBEB' }]}>
              <View style={[s.nextIconCircle, { backgroundColor: '#F59E0B' }]}>
                <Text style={s.nextIcon}>🎓</Text>
              </View>
              <View style={s.nextText}>
                <Text style={[s.nextModuleLabel, { color: '#D97706' }]}>JOURNEY COMPLETE</Text>
                <Text style={s.nextModuleTitle}>You've mastered the full roadmap!</Text>
                <Text style={s.nextModuleDesc}>
                  Every module, chapter, and lesson — done. You're financially ready.
                </Text>
              </View>
            </View>
          )}
        </Animated.View>

      </ScrollView>

      {/* ── CTA ── */}
      <View style={s.ctaBar}>
        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: mod.color }]}
          onPress={handleContinue}
          activeOpacity={0.87}
        >
          <Text style={s.ctaBtnText}>
            {nextModule ? `Start ${nextModule.title} →` : 'Back to Map 🗺️'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  scroll:    { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  hero: {
    alignItems: 'center',
    paddingTop: 64, paddingBottom: 40, paddingHorizontal: 28,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    gap: 12,
  },
  backBtn: { position: 'absolute', top: 56, left: 20, padding: 8 },
  backText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  trophyWrap: { marginBottom: 8 },
  trophyGlow: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
  },
  trophyEmoji: { fontSize: 60 },

  moduleCompleteLabel: {
    fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2, marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    textAlign: 'center', lineHeight: 32,
  },
  moduleDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 19, marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 20, paddingVertical: 20,
    gap: 12,
  },

  section: { paddingHorizontal: 20, marginBottom: 24, gap: 10 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.5, marginBottom: 4,
  },

  nextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 16, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  nextIconCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  nextIcon:        { fontSize: 26 },
  nextText:        { flex: 1 },
  nextModuleLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  nextModuleTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 3 },
  nextModuleDesc:  { fontSize: 12, color: '#6B7280', lineHeight: 17 },

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

// ─── Stat pill styles ─────────────────────────────────────────────────────────
const stat = StyleSheet.create({
  pill: {
    flex: 1, alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    gap: 4,
  },
  icon:  { fontSize: 22 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
});

// ─── Chapter row styles ───────────────────────────────────────────────────────
const crow = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  icon:   { fontSize: 22 },
  middle: { flex: 1, gap: 6 },
  title:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  lessonsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lessonDot: { width: 8, height: 8, borderRadius: 4 },
  lessonsText: { fontSize: 11, color: '#9CA3AF', marginLeft: 4 },
  right:    { alignItems: 'flex-end' },
  fincoins: { fontSize: 16, fontWeight: '800' },
  coinIcon: { fontSize: 14 },
});