import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import useUserStore from '../../store/userStore';
import { LESSONS } from '../../constants/lessons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';

const BADGES = [
  { id: 'first_lesson', icon: '📖', label: 'First Step', desc: 'Complete your first lesson' },
  { id: 'all_lessons', icon: '🎓', label: 'Savvy Investor', desc: 'Complete all 5 lessons' },
  { id: 'simulation', icon: '📈', label: 'Market Maker', desc: 'Complete a simulation' },
  { id: 'streak_3', icon: '🔥', label: '3-Day Streak', desc: 'Log in 3 days in a row' },
  { id: 'streak_7', icon: '⚡', label: 'Week Warrior', desc: 'Log in 7 days in a row' },
];

export default function HomeScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);

  const [completedLessons, setCompletedLessons] = useState([]);
  const [streak, setStreak] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const progressDoc = await getDoc(doc(db, 'progress', uid));
    const completed = progressDoc.exists()
      ? progressDoc.data().completedLessons || []
      : [];
    setCompletedLessons(completed);

    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data();
    const today = new Date().toDateString();
    const lastLogin = userData?.lastLogin;
    const currentStreak = userData?.streak || 0;

    let newStreak = currentStreak;
    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      newStreak = lastLogin === yesterday.toDateString()
        ? currentStreak + 1
        : 1;
      await updateDoc(doc(db, 'users', uid), { lastLogin: today, streak: newStreak });
      setProfile({ ...profile, streak: newStreak });
    }
    setStreak(newStreak);

    const badges = [];
    if (completed.length >= 1) badges.push('first_lesson');
    if (completed.length >= 5) badges.push('all_lessons');
    if (userData?.finCoins >= 100) badges.push('simulation');
    if (newStreak >= 3) badges.push('streak_3');
    if (newStreak >= 7) badges.push('streak_7');
    setEarnedBadges(badges);

    setLoading(false);
  };

  const xp = completedLessons.length * 50 + (profile?.finCoins || 0);
  const xpToNext = 500;
  const xpPct = Math.min((xp / xpToNext) * 100, 100);
  const nextLesson = LESSONS.find(l => !completedLessons.includes(l.id));

  if (loading) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>
            Good {getTimeOfDay()}, {profile?.name?.split(' ')[0] || 'there'}! 👋
          </Text>
          <Text style={styles.goal}>{profile?.goal || 'Set a financial goal'}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakCount}>{streak}</Text>
        </View>
      </View>

      {/* XP / FinCoins Card */}
      <View style={styles.xpCard}>
        <View style={styles.xpTopRow}>
          <View>
            <Text style={styles.xpCardLabel}>FinCoins</Text>
            <Text style={styles.xpCardValue}>💰 {profile?.finCoins || 0}</Text>
          </View>
          <View style={styles.xpLevelBadge}>
            <Text style={styles.xpLevelText}>Level 1</Text>
          </View>
        </View>
        <View style={styles.xpBarRow}>
          <Text style={styles.xpBarLabel}>Progress to Level 2</Text>
          <Text style={styles.xpBarPct}>{Math.round(xpPct)}%</Text>
        </View>
        <View style={styles.xpBarContainer}>
          <View style={[styles.xpBarFill, { width: `${xpPct}%` }]} />
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {nextLesson ? (
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: Colors.primaryLight }]}
            onPress={() => router.push(`/lesson/${nextLesson.id}`)}
          >
            <Text style={styles.actionIcon}>{nextLesson.icon}</Text>
            <Text style={[styles.actionLabel, { color: Colors.primary }]}>Continue Learning</Text>
            <Text style={styles.actionSub}>{nextLesson.title}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionCard, { backgroundColor: Colors.mint }]}>
            <Text style={styles.actionIcon}>🎓</Text>
            <Text style={[styles.actionLabel, { color: '#2D7A3A' }]}>All done!</Text>
            <Text style={styles.actionSub}>Savvy Investor</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#EAF6FA' }]}
          onPress={() => router.push('/simulate-main')}
        >
          <Text style={styles.actionIcon}>📈</Text>
          <Text style={[styles.actionLabel, { color: '#1A7A9A' }]}>Simulate</Text>
          <Text style={styles.actionSub}>Practice investing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.yellow }]}
          onPress={() => router.push('/chat')}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.actionLabel, { color: '#7A6A00' }]}>Ask AmpliFI</Text>
          <Text style={styles.actionSub}>AI-powered Q&A</Text>
        </TouchableOpacity>
      </View>

      {/* Lesson Progress */}
      <Text style={styles.sectionTitle}>Lesson Progress</Text>
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressFraction}>
            {completedLessons.length}/{LESSONS.length} completed
          </Text>
          <Text style={styles.progressPct}>
            {Math.round((completedLessons.length / LESSONS.length) * 100)}%
          </Text>
        </View>
        {/* Mini progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, {
            width: `${(completedLessons.length / LESSONS.length) * 100}%`
          }]} />
        </View>
        {/* Lesson dots */}
        <View style={styles.lessonDots}>
          {LESSONS.map((l) => {
            const done = completedLessons.includes(l.id);
            return (
              <View
                key={l.id}
                style={[styles.dot, done ? styles.dotDone : styles.dotPending]}
              >
                <Text style={styles.dotIcon}>{done ? '✓' : l.icon}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Badges */}
      <Text style={styles.sectionTitle}>Badges</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.badgesRow}
        contentContainerStyle={{ paddingRight: Spacing.lg }}
      >
        {BADGES.map(badge => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <View key={badge.id} style={[styles.badgeCard, !earned && styles.badgeLocked]}>
              <Text style={[styles.badgeIcon, !earned && { opacity: 0.3 }]}>
                {earned ? badge.icon : '🔒'}
              </Text>
              <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>
                {badge.label}
              </Text>
              {earned && (
                <View style={styles.earnedPill}>
                  <Text style={styles.earnedPillText}>Earned</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

    </ScrollView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  headerText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  greeting: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  goal: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  streakBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    minWidth: 52,
    ...Shadows.soft,
  },
  streakIcon: { fontSize: 20 },
  streakCount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.accent,
  },

  // XP Card
  xpCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  xpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  xpCardLabel: {
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  xpCardValue: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.yellow,
    fontSize: Typography.fontSize.xl,
  },
  xpLevelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  xpLevelText: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
  },
  xpBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  xpBarLabel: {
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.fontSize.xs,
  },
  xpBarPct: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
  },
  xpBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radii.full,
  },
  xpBarFill: {
    height: 8,
    backgroundColor: Colors.yellow,
    borderRadius: Radii.full,
  },

  // Section title
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    flex: 1,
    borderRadius: Radii.xl,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  actionSub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },

  // Progress card
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.soft,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressFraction: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  progressPct: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: Radii.full,
    marginBottom: Spacing.lg,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
  },
  lessonDots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotDone: { backgroundColor: Colors.mint },
  dotPending: { backgroundColor: Colors.lightGray },
  dotIcon: { fontSize: 18 },

  // Badges
  badgesRow: {
    marginBottom: Spacing.xxxl,
  },
  badgeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    alignItems: 'center',
    width: 100,
    ...Shadows.soft,
  },
  badgeLocked: {
    backgroundColor: Colors.lightGray,
  },
  badgeIcon: { fontSize: 32, marginBottom: Spacing.sm },
  badgeLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  badgeLabelLocked: { color: Colors.textMuted },
  earnedPill: {
    backgroundColor: Colors.mint,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  earnedPillText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: '#2D7A3A',
  },
});