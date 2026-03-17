import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { getProgress } from '../../lib/progress';
import { MODULES } from '../../constants/modules';
import useUserStore from '../../store/userStore';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';

const { width: SW } = Dimensions.get('window');
const R = Radii.xl;

const getAllLessons = () =>
  MODULES.flatMap(m => m.chapters.flatMap(c => c.lessons));
const TOTAL_LESSONS = getAllLessons().length;

const BADGES = [
  { id: 'first_lesson', icon: '📖', label: 'First Step',     desc: 'Complete your first lesson' },
  { id: 'first_module', icon: '🏅', label: 'Module Done',    desc: 'Complete a full module' },
  { id: 'all_modules',  icon: '🎓', label: 'Savvy Investor', desc: 'Complete all modules' },
  { id: 'simulation',   icon: '📈', label: 'Market Maker',   desc: 'Earn 100+ FinCoins' },
  { id: 'streak_3',     icon: '🔥', label: '3-Day Streak',   desc: 'Log in 3 days in a row' },
  { id: 'streak_7',     icon: '⚡', label: 'Week Warrior',   desc: 'Log in 7 days in a row' },
];

// ─── Animated bar ─────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color, height = 5, trackColor }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 900, delay: 200, useNativeDriver: false }).start();
  }, [pct]);
  const w = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  return (
    <View style={{ height, backgroundColor: trackColor || 'rgba(255,255,255,0.25)', borderRadius: height, overflow: 'hidden' }}>
      <Animated.View style={{ height, width: w, backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }) {
  return (
    <View style={sh.row}>
      <Text style={sh.title}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={sh.action}>{action} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const sh = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  title:  { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  action: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: Colors.primary },
});

// ─── Stat chip — tall vertical pill inside the hero ──────────────────────────
function StatChip({ icon, value, label }) {
  return (
    <View style={chip.wrap}>
      <Text style={chip.icon}>{icon}</Text>
      <Text style={chip.value}>{value}</Text>
      <Text style={chip.label}>{label}</Text>
    </View>
  );
}
const chip = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radii.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    gap: 3,
  },
  icon:  { fontSize: 22 },
  value: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize.base, color: Colors.white },
  label: { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
});

// ─── Module tile — solid colour, no watermark ────────────────────────────────
function ModuleTile({ mod, completedLessons, onPress }) {
  const lessonIds = mod.chapters.flatMap(c => c.lessons.map(l => l.id));
  const done      = lessonIds.filter(id => completedLessons.includes(id)).length;
  const total     = lessonIds.length;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <TouchableOpacity style={[mt.tile, { backgroundColor: mod.color }]} onPress={onPress} activeOpacity={0.82}>
      <View style={mt.body}>
        <Text style={mt.icon}>{mod.icon}</Text>
        <Text style={mt.title} numberOfLines={2}>{mod.title}</Text>
        <Text style={mt.sub}>{done}/{total} lessons</Text>
        <AnimatedBar
          pct={pct}
          color="rgba(255,255,255,0.9)"
          height={4}
          trackColor="rgba(255,255,255,0.25)"
        />
      </View>
    </TouchableOpacity>
  );
}
const TILE_W = (SW - Spacing.lg * 2 - Spacing.md) / 2;
const mt = StyleSheet.create({
  tile: { width: TILE_W, borderRadius: R, overflow: 'hidden', ...Shadows.medium, marginBottom: Spacing.md, minHeight: 148 },
  body: { flex: 1, padding: Spacing.lg, gap: 6, justifyContent: 'flex-end' },
  icon:  { fontSize: 32, marginBottom: 2 },
  title: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: Colors.white, lineHeight: 18 },
  sub:   { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
});

// ─── Badge card ───────────────────────────────────────────────────────────────
function BadgeCard({ badge, earned }) {
  return (
    <View style={[bc.card, !earned && bc.locked]}>
      <View style={[bc.iconWrap, earned ? bc.iconEarned : bc.iconLocked]}>
        <Text style={bc.icon}>{earned ? badge.icon : '🔒'}</Text>
      </View>
      <Text style={[bc.label, !earned && bc.labelLocked]}>{badge.label}</Text>
      <Text style={bc.desc} numberOfLines={2}>{badge.desc}</Text>
      {earned && <View style={bc.pill}><Text style={bc.pillText}>Earned ✓</Text></View>}
    </View>
  );
}
const bc = StyleSheet.create({
  card:       { backgroundColor: Colors.white, borderRadius: R, padding: Spacing.lg, marginRight: Spacing.md, width: 112, alignItems: 'center', ...Shadows.soft },
  locked:     { backgroundColor: '#F8F8F8' },
  iconWrap:   { width: 52, height: 52, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  iconEarned: { backgroundColor: Colors.primaryLight },
  iconLocked: { backgroundColor: Colors.lightGray },
  icon:       { fontSize: 26 },
  label:      { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  labelLocked:{ color: Colors.textMuted },
  desc:       { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'center', lineHeight: 14, marginBottom: 6 },
  pill:       { backgroundColor: Colors.mint, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  pillText:   { fontFamily: Typography.fontFamily.semiBold, fontSize: 10, color: '#2D7A3A' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router     = useRouter();
  const profile    = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);

  const [completedLessons, setCompletedLessons] = useState([]);
  const [completedModules, setCompletedModules] = useState([]);
  const [streak,           setStreak]           = useState(0);
  const [earnedBadges,     setEarnedBadges]     = useState([]);
  const [loading,          setLoading]          = useState(true);

  const fadeIn      = useRef(new Animated.Value(0)).current;
  const greetSlide0 = useRef(new Animated.Value(12)).current;
  const greetFade0  = useRef(new Animated.Value(0)).current;
  const greetSlide1 = useRef(new Animated.Value(12)).current;
  const greetFade1  = useRef(new Animated.Value(0)).current;

  const loadHomeData = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const progress = await getProgress();
    setCompletedLessons(progress.completedLessons);

    const validIds       = MODULES.map(m => m.id);
    const validCompleted = (progress.completedModules ?? []).filter(id => validIds.includes(id));
    setCompletedModules(validCompleted);

    const userDoc  = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data() ?? {};
    const today     = new Date().toDateString();
    const lastLogin = userData.lastLogin;
    const curr      = userData.streak || 0;

    let newStreak = curr;
    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      newStreak = lastLogin === yesterday.toDateString() ? curr + 1 : 1;
      await updateDoc(doc(db, 'users', uid), { lastLogin: today, streak: newStreak });
      setProfile({ ...profile, streak: newStreak });
    }
    setStreak(newStreak);

    const badges = [];
    if (progress.completedLessons.length >= 1)           badges.push('first_lesson');
    if (validCompleted.length >= 1)                      badges.push('first_module');
    if (validCompleted.length >= MODULES.length)         badges.push('all_modules');
    if ((userData.finCoins ?? 0) >= 100)                 badges.push('simulation');
    if (newStreak >= 3)                                  badges.push('streak_3');
    if (newStreak >= 7)                                  badges.push('streak_7');
    setEarnedBadges(badges);

    setLoading(false);
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(60),
        Animated.parallel([
          Animated.timing(greetFade0,  { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(greetSlide0, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(greetFade1,  { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(greetSlide1, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  useEffect(() => { loadHomeData(); }, []);

  const finCoins  = profile?.finCoins || 0;
  const totalDone = completedLessons.length;
  const firstName = profile?.name?.split(' ')[0] || 'there';

  const allLessons = getAllLessons();
  const nextLesson = allLessons.find(l => !completedLessons.includes(l.id));
  const nextCtx    = nextLesson
    ? (() => {
        for (const mod of MODULES)
          for (const chap of mod.chapters)
            if (chap.lessons.find(l => l.id === nextLesson.id)) return { mod, chap };
        return null;
      })()
    : null;

  if (loading) return <View style={s.container} />;

  return (
    <Animated.View style={[s.container, { opacity: fadeIn }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Greeting — animated, separate ── */}
        <View style={s.greetingRow}>
          <View>
            <Animated.Text style={[s.greetingTime, { opacity: greetFade0, transform: [{ translateY: greetSlide0 }] }]}>
              {getGreeting()},
            </Animated.Text>
            <Animated.Text style={[s.greetingName, { opacity: greetFade1, transform: [{ translateY: greetSlide1 }] }]}>
              {firstName} 👋
            </Animated.Text>
          </View>
          <Animated.View style={[s.streakBubble, { opacity: greetFade1 }]}>
            <Text style={s.streakEmoji}>🔥</Text>
            <Text style={s.streakNum}>{streak}</Text>
            <Text style={s.streakLbl}>day{streak !== 1 ? 's' : ''}</Text>
          </Animated.View>
        </View>

        {/* ══ HERO BANNER — chips only ══ */}
        <View style={s.hero}>
          <View style={s.heroChips}>
            <StatChip icon="💰" value={String(finCoins)}                               label="FinCoins" />
            <StatChip icon="📚" value={`${totalDone}/${TOTAL_LESSONS}`}                label="Lessons"  />
            <StatChip icon="🏅" value={`${completedModules.length}/${MODULES.length}`} label="Modules"  />
            <StatChip icon="⭐" value={`${earnedBadges.length}/${BADGES.length}`}      label="Badges"   />
          </View>
        </View>

        {/* ── Up Next ── */}
        <SectionHeader title="Continue Learning" />
        {nextLesson ? (
          <TouchableOpacity
            style={s.continueShadow}
            onPress={() => router.push(`/lesson/${nextLesson.id}`)}
            activeOpacity={0.85}
          >
            <View style={[s.continueBanner, { borderLeftColor: nextCtx?.mod.color || Colors.primary }]}>
              <View style={s.continueBannerLeft}>
                <Text style={[s.continueEyebrow, { color: nextCtx?.mod.color || Colors.primary }]}>UP NEXT</Text>
                <Text style={s.continueTitle} numberOfLines={1}>{nextLesson.title}</Text>
                {nextCtx && (
                  <Text style={s.continueSub} numberOfLines={1}>
                    {nextCtx.mod.icon} {nextCtx.mod.title}  ·  {nextCtx.chap.title}
                  </Text>
                )}
              </View>
              <View style={[s.continueBtn, { backgroundColor: nextCtx?.mod.color || Colors.primary }]}>
                <Text style={s.continueBtnText}>Go →</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={s.continueShadow}>
            <View style={[s.continueBanner, { borderLeftColor: Colors.successDark, backgroundColor: Colors.successLight }]}>
              <Text style={{ fontSize: 24, marginRight: Spacing.md }}>🎓</Text>
              <Text style={[s.continueTitle, { color: Colors.successDark }]}>All lessons complete!</Text>
            </View>
          </View>
        )}

        {/* ── Ask AmpliFI ── */}
        <TouchableOpacity style={s.chatCard} onPress={() => router.push('/chat')} activeOpacity={0.88}>
          <View style={s.chatContent}>
            <View style={s.chatPill}>
              <Text style={s.chatPillText}>AI TUTOR</Text>
            </View>
            <Text style={s.chatHeadline}>Ask AmpliFI anything 💬</Text>
            <Text style={s.chatSub}>
              Get instant answers to your finance questions, explained your way.
            </Text>
            <View style={s.chatBtn}>
              <Text style={s.chatBtnText}>Start a conversation →</Text>
            </View>
          </View>
          <Text style={s.chatDecor}>?</Text>
        </TouchableOpacity>

        {/* ── Module grid ── */}
        <SectionHeader
          title="Your Modules"
          action="See all"
          onAction={() => router.push('/(tabs)/learn')}
        />
        <View style={s.moduleGrid}>
          {MODULES.map(mod => (
            <ModuleTile
              key={mod.id}
              mod={mod}
              completedLessons={completedLessons}
              onPress={() => router.push('/(tabs)/learn')}
            />
          ))}
        </View>

        {/* ── Badges ── */}
        <SectionHeader title="Badges" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: Spacing.lg, paddingBottom: 4 }}
          style={{ marginBottom: Spacing.xxxl }}
        >
          {BADGES.map(badge => (
            <BadgeCard key={badge.id} badge={badge} earned={earnedBadges.includes(badge.id)} />
          ))}
        </ScrollView>

      </ScrollView>
    </Animated.View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTagline(modulesCompleted, lessonsCompleted) {
  if (modulesCompleted >= MODULES.length)
    return "You've completed every module. You're a Savvy Investor! 🎓";
  if (modulesCompleted >= 3)
    return `${modulesCompleted} modules down — one to go. You're almost there. 💪`;
  if (modulesCompleted >= 2)
    return `${modulesCompleted} modules complete. You're making real progress! 📈`;
  if (modulesCompleted === 1)
    return `First module done! Keep the momentum going. ✨`;
  if (lessonsCompleted >= 1)
    return `${lessonsCompleted} lesson${lessonsCompleted > 1 ? 's' : ''} in — great start! Keep going. 🌱`;
  return "Your financial journey starts here. Let's go! 🚀";
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll:    { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxxl, paddingBottom: Spacing.xxxl, gap: Spacing.md },

  // ══ GREETING ════════════════════════════════════════════════════════════════
  greetingRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingTime: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  greetingName: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary },
  streakBubble: { backgroundColor: '#FFF3E0', borderRadius: Radii.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignItems: 'center', minWidth: 52, ...Shadows.soft },
  streakEmoji:  { fontSize: 18 },
  streakNum:    { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize.md, color: Colors.accent },
  streakLbl:    { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted },

  // ══ HERO BANNER ══════════════════════════════════════════════════════════════
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: R,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.medium,
  },
  heroChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // ══ UP NEXT BANNER ════════════════════════════════════════════════════════════
  // Outer: carries shadow. Inner: carries left border. Kept separate so
  // Android elevation doesn't bleed colour onto the border edge.
  continueShadow: {
    borderRadius: R,
    backgroundColor: Colors.white,
    ...Shadows.soft,
  },
  continueBanner: {
    borderRadius: R,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  continueBannerLeft:  { flex: 1, marginRight: Spacing.md },
  continueEyebrow:     { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs, letterSpacing: 1, marginBottom: 4 },
  continueTitle:       { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: Colors.textPrimary, marginBottom: 2 },
  continueSub:         { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  continueBtn:         { borderRadius: Radii.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  continueBtnText:     { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: Colors.white },

  // ══ CHAT CARD — white card, coral accents ════════════════════════════════════
  chatCard: {
    backgroundColor: Colors.white,
    borderRadius: R,
    padding: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },
  chatContent: { gap: Spacing.sm },
  chatPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    marginBottom: 2,
  },
  chatPillText:  { fontFamily: Typography.fontFamily.bold, fontSize: 10, color: Colors.primary, letterSpacing: 1 },
  chatHeadline:  { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary },
  chatSub:       { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted, lineHeight: 20, maxWidth: '85%' },
  chatBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chatBtnText:  { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: Colors.white },
  chatDecor: {
    position: 'absolute',
    right: -8,
    bottom: -24,
    fontSize: 140,
    fontFamily: Typography.fontFamily.extraBold,
    color: Colors.primaryLight,
    lineHeight: 160,
  },

  // ══ MODULE GRID ═══════════════════════════════════════════════════════════════
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});