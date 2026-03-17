import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { getProgress } from '../../lib/progress';
import { MODULES } from '../../constants/modules';
import { getAvatar, AvatarDisplay } from '../../constants/avatars';
import useUserStore from '../../store/userStore';
import { resetProgress } from '../../lib/progress';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const RISK_MAP = {
  conservative: { label: 'Conservative', color: '#27AE60', bg: '#E8F8EE', icon: '🛡️' },
  balanced:     { label: 'Balanced',     color: '#E67E22', bg: '#FEF3E2', icon: '⚖️' },
  aggressive:   { label: 'Aggressive',   color: '#E74C3C', bg: '#FDECEC', icon: '🚀' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value, last }) {
  return (
    <View style={[ir.row, !last && ir.border]}>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}
const ir = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  label:  { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted, flex: 1 },
  value:  { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, flex: 1.2, textAlign: 'right' },
});

function SectionCard({ title, children, style }) {
  return (
    <View style={[sc.card, style]}>
      {title ? <Text style={sc.title}>{title}</Text> : null}
      {children}
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.xl, marginBottom: Spacing.md, ...Shadows.soft },
  title: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: Colors.textPrimary, marginBottom: Spacing.lg },
});

function ModuleProgressRow({ mod, completedLessons, completedModules, last }) {
  const lessonIds  = mod.chapters.flatMap(c => c.lessons.map(l => l.id));
  const done       = lessonIds.filter(id => completedLessons.includes(id)).length;
  const total      = lessonIds.length;
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = completedModules.includes(mod.id);

  return (
    <View style={[mp.row, !last && mp.border]}>
      <View style={[mp.iconWrap, { backgroundColor: mod.color }]}>
        <Text style={mp.icon}>{mod.icon}</Text>
      </View>
      <View style={mp.middle}>
        <Text style={mp.title} numberOfLines={1}>{mod.title}</Text>
        <View style={mp.barTrack}>
          <View style={[mp.barFill, { width: `${pct}%`, backgroundColor: mod.color }]} />
        </View>
      </View>
      <View style={mp.right}>
        {isComplete
          ? <View style={[mp.donePill, { backgroundColor: mod.colorLight }]}>
              <Text style={[mp.doneText, { color: mod.color }]}>✓ Done</Text>
            </View>
          : <Text style={[mp.pct, { color: mod.color }]}>{done}/{total}</Text>
        }
      </View>
    </View>
  );
}
const mp = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  border:  { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap:{ width: 36, height: 36, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center' },
  icon:    { fontSize: 18 },
  middle:  { flex: 1, gap: 6 },
  title:   { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: Colors.textPrimary },
  barTrack:{ height: 4, backgroundColor: Colors.lightGray, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 4 },
  right:   { width: 52, alignItems: 'flex-end' },
  pct:     { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs },
  donePill:{ borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 2 },
  doneText:{ fontFamily: Typography.fontFamily.bold, fontSize: 10 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router     = useRouter();
  const profile    = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);

  const [completedLessons,  setCompletedLessons]  = useState([]);
  const [completedModules,  setCompletedModules]  = useState([]);
  const [streak,            setStreak]            = useState(0);
  const [earnedBadges,      setEarnedBadges]      = useState([]);
  const [loading,           setLoading]           = useState(true);

  const loadProfileData = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Use getProgress() — the same source of truth as learn.js and home.js
    const [progress, userDoc] = await Promise.all([
      getProgress(),
      getDoc(doc(db, 'users', uid)),
    ]);

    setCompletedLessons(progress.completedLessons);
    setCompletedModules(progress.completedModules);

    const userData = userDoc.data() ?? {};
    const currentStreak = userData.streak || 0;
    setStreak(currentStreak);

    // Badge logic — mirrors home.js exactly
    const badges = [];
    if (progress.completedLessons.length >= 1)              badges.push('first_lesson');
    if (progress.completedModules.length >= 1)              badges.push('first_module');
    if (progress.completedModules.length >= MODULES.length) badges.push('all_modules');
    if ((userData.finCoins ?? 0) >= 100)                    badges.push('simulation');
    if (currentStreak >= 3)                                 badges.push('streak_3');
    if (currentStreak >= 7)                                 badges.push('streak_7');
    setEarnedBadges(badges);

    setLoading(false);
  }, []);

  useEffect(() => { loadProfileData(); }, []);

  const handleReset = () => {
    Alert.alert(
      'Reset Progress',
      'This will wipe all completed lessons, chapters, and modules. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetProgress();
            await loadProfileData();
            Alert.alert('Done', 'Progress has been reset.');
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProfile(null);
    router.replace('/login');
  };

  if (loading) return <View style={s.container} />;

  const finCoins    = profile?.finCoins || 0;
  const xp          = profile?.xp || 0;
  const totalDone   = completedLessons.length;
  const riskInfo    = profile?.riskProfile ? RISK_MAP[profile.riskProfile] : null;

  // Avatar — use profile.avatarId if set, else first initial fallback
  const avatarId    = profile?.avatarId ?? null;
  const avatarDef   = avatarId ? getAvatar(avatarId) : null;
  const initials    = profile?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Hero section ── */}
      <View style={s.hero}>
        {/* Avatar */}
        {avatarDef ? (
          <AvatarDisplay avatarId={avatarId} state="happy" size={80} showName={false} />
        ) : (
          <View style={s.avatarCircle}>
            <Text style={s.avatarInitial}>{initials}</Text>
          </View>
        )}

        <Text style={s.heroName}>{profile?.name || 'User'}</Text>
        <Text style={s.heroEmail}>{auth.currentUser?.email}</Text>

        {riskInfo && (
          <View style={[s.riskPill, { backgroundColor: riskInfo.bg }]}>
            <Text style={[s.riskText, { color: riskInfo.color }]}>
              {riskInfo.icon}  {riskInfo.label} Investor
            </Text>
          </View>
        )}
      </View>

      {/* ── Stats row ── */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statEmoji}>💰</Text>
          <Text style={s.statVal}>{finCoins}</Text>
          <Text style={s.statLbl}>FinCoins</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statEmoji}>⭐</Text>
          <Text style={s.statVal}>{xp}</Text>
          <Text style={s.statLbl}>XP</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statEmoji}>🔥</Text>
          <Text style={s.statVal}>{streak}</Text>
          <Text style={s.statLbl}>Day Streak</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statEmoji}>📚</Text>
          <Text style={s.statVal}>{totalDone}/{TOTAL_LESSONS}</Text>
          <Text style={s.statLbl}>Lessons</Text>
        </View>
      </View>

      {/* ── Profile details ── */}
      <SectionCard title="Profile Details">
        <InfoRow label="Age"             value={profile?.age} />
        <InfoRow label="Income Bracket"  value={profile?.income} />
        <InfoRow label="Family Status"   value={profile?.familyStatus} />
        <InfoRow label="Financial Goal"  value={profile?.goal} last />
      </SectionCard>

      {/* ── Module progress ── */}
      <SectionCard title="Module Progress">
        {MODULES.map((mod, i) => (
          <ModuleProgressRow
            key={mod.id}
            mod={mod}
            completedLessons={completedLessons}
            completedModules={completedModules}
            last={i === MODULES.length - 1}
          />
        ))}
      </SectionCard>

      {/* ── Badges ── */}
      <SectionCard title="Badges">
        {BADGES.map((badge, i) => {
          const earned = earnedBadges.includes(badge.id);
          const last   = i === BADGES.length - 1;
          return (
            <View key={badge.id} style={[bd.row, !last && bd.border]}>
              <View style={[bd.iconWrap, earned ? bd.iconEarned : bd.iconLocked]}>
                <Text style={bd.icon}>{earned ? badge.icon : '🔒'}</Text>
              </View>
              <View style={bd.info}>
                <Text style={[bd.label, !earned && bd.labelLocked]}>{badge.label}</Text>
                <Text style={bd.desc}>{badge.desc}</Text>
              </View>
              {earned && (
                <View style={bd.earnedPill}>
                  <Text style={bd.earnedText}>Earned ✓</Text>
                </View>
              )}
            </View>
          );
        })}
      </SectionCard>

      {/* ── Actions ── */}
      <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
        <Text style={s.resetText}>🔄  Reset Progress (Dev)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ─── Badge row styles ─────────────────────────────────────────────────────────
const bd = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  border:     { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap:   { width: 44, height: 44, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  iconEarned: { backgroundColor: Colors.primaryLight },
  iconLocked: { backgroundColor: Colors.lightGray },
  icon:       { fontSize: 22 },
  info:       { flex: 1 },
  label:      { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, marginBottom: 2 },
  labelLocked:{ color: Colors.textMuted },
  desc:       { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  earnedPill: { backgroundColor: Colors.mint, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  earnedText: { fontFamily: Typography.fontFamily.bold, fontSize: 10, color: '#2D7A3A' },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  avatarInitial: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.xl,
    color: Colors.white,
  },
  heroName: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  heroEmail: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  riskPill: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  riskText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 2,
    ...Shadows.soft,
  },
  statEmoji: { fontSize: 18 },
  statVal: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  statLbl: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Actions
  resetBtn: {
    backgroundColor: Colors.warningLight,
    borderWidth: 1,
    borderColor: Colors.warningDark,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resetText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.warningDark,
  },
  logoutBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.base,
    color: Colors.danger,
  },
});