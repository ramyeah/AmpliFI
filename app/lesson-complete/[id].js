import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLessonById, getModuleByLessonId, getNextLesson } from '../../constants/modules';

const C = {
  neutral1: '#111827', neutral3: '#6B7280', neutral4: '#9CA3AF',
  border: '#E5E7EB', white: '#ffffff', success: '#059669',
  successLight: '#DCFCE7',
};

export default function LessonCompleteScreen() {
  const { id, fincoins } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const lesson      = getLessonById(id);
  const module      = getModuleByLessonId(id);
  const nextLesson  = getNextLesson?.(id);
  const moduleColor = module?.color || '#4F46E5';
  const earned      = parseInt(fincoins || '0', 10);

  // ── Animations ──
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const coinAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]),
      Animated.spring(coinAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: moduleColor }]}>
        <Text style={s.headerSub}>Lesson Complete</Text>
        <Text style={s.headerTitle}>🎉 Well done!</Text>
        <Text style={s.lessonName} numberOfLines={2}>
          {lesson?.icon}  {lesson?.title}
        </Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* FinCoins earned card */}
        <Animated.View style={[
          s.coinCard,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}>
          <Animated.Text style={[
            s.coinEmoji,
            { transform: [{ scale: coinAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] },
          ]}>
            🪙
          </Animated.Text>
          <Text style={s.coinAmount}>+{earned}</Text>
          <Text style={s.coinLabel}>FinCoins Earned</Text>
        </Animated.View>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statEmoji}>📚</Text>
            <Text style={s.statValue}>{lesson?.sections?.length ?? 0}</Text>
            <Text style={s.statLabel}>Sections</Text>
          </View>
          <View style={[s.statBox, s.statBoxMid]}>
            <Text style={s.statEmoji}>🃏</Text>
            <Text style={s.statValue}>{lesson?.flashcards?.length ?? 0}</Text>
            <Text style={s.statLabel}>Cards</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statEmoji}>⏱</Text>
            <Text style={s.statValue}>{lesson?.duration ?? '—'}</Text>
            <Text style={s.statLabel}>Duration</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          {nextLesson && (
            <TouchableOpacity
              style={[s.btnPrimary, { backgroundColor: moduleColor }]}
              onPress={() => router.replace(`/lesson/${nextLesson.id}`)}
              activeOpacity={0.85}
            >
              <Text style={s.btnPrimaryText}>Next Lesson →</Text>
              <Text style={s.btnPrimarySub}>{nextLesson.icon}  {nextLesson.title}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={s.btnSecondary}
            onPress={() => router.replace('/(tabs)/learn')}
            activeOpacity={0.85}
          >
            <Text style={s.btnSecondaryText}>← Back to Learn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnGhost}
            onPress={() => {/* coming soon */}}
            activeOpacity={0.7}
          >
            <Text style={s.btnGhostText}>🎮 Try the Simulation Engine</Text>
            <Text style={s.btnGhostSub}>Coming soon</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#F8F7FF' },

  header:         {
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 28,
  },
  headerSub:      { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  headerTitle:    { fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: 8 },
  lessonName:     { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  scroll:         { flex: 1 },
  body:           { padding: 24, gap: 16 },

  coinCard:       {
    backgroundColor: '#FFF7ED', borderRadius: 24, padding: 36,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FED7AA',
    shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  coinEmoji:      { fontSize: 52, marginBottom: 8 },
  coinAmount:     { fontSize: 52, fontWeight: '900', color: '#EA580C', lineHeight: 60 },
  coinLabel:      { fontSize: 14, fontWeight: '700', color: '#9A3412', marginTop: 6 },

  statsRow:       {
    flexDirection: 'row',
    backgroundColor: C.white, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  statBox:        { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBoxMid:     { borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.border },
  statEmoji:      { fontSize: 20, marginBottom: 4 },
  statValue:      { fontSize: 16, fontWeight: '800', color: C.neutral1 },
  statLabel:      { fontSize: 10, color: C.neutral4, fontWeight: '600', marginTop: 2 },

  actions:        { gap: 12 },
  btnPrimary:     { borderRadius: 16, padding: 18, alignItems: 'center' },
  btnPrimaryText: { fontSize: 17, fontWeight: '800', color: C.white },
  btnPrimarySub:  { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  btnSecondary:   {
    borderRadius: 16, padding: 16, alignItems: 'center',
    backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border,
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '700', color: C.neutral1 },

  btnGhost:       { borderRadius: 16, padding: 16, alignItems: 'center' },
  btnGhostText:   { fontSize: 15, fontWeight: '700', color: C.neutral3 },
  btnGhostSub:    { fontSize: 11, color: C.neutral4, marginTop: 2 },
});