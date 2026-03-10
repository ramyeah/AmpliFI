import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import useUserStore from '../../store/userStore';
import { LESSONS } from '../../constants/lessons';

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

    // Load progress
    const progressDoc = await getDoc(doc(db, 'progress', uid));
    const completed = progressDoc.exists() ? progressDoc.data().completedLessons || [] : [];
    setCompletedLessons(completed);

    // Load user data + update streak
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data();
    const today = new Date().toDateString();
    const lastLogin = userData?.lastLogin;
    const currentStreak = userData?.streak || 0;

    let newStreak = currentStreak;
    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastLogin === yesterday.toDateString()) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1;
      }
      await updateDoc(doc(db, 'users', uid), {
        lastLogin: today,
        streak: newStreak,
      });
      setProfile({ ...profile, streak: newStreak });
    }
    setStreak(newStreak);

    // Calculate badges
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
        <View>
          <Text style={styles.greeting}>Good {getTimeOfDay()}, {profile?.name?.split(' ')[0] || 'there'}! 👋</Text>
          <Text style={styles.goal}>Goal: {profile?.goal || 'Set a financial goal'}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakCount}>{streak}</Text>
        </View>
      </View>

      {/* XP Bar */}
      <View style={styles.xpCard}>
        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>FinCoins</Text>
          <Text style={styles.xpValue}>💰 {profile?.finCoins || 0}</Text>
        </View>
        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>Progress to Level 2</Text>
          <Text style={styles.xpPct}>{Math.round(xpPct)}%</Text>
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
            style={styles.actionCard}
            onPress={() => router.push(`/lesson/${nextLesson.id}`)}
          >
            <Text style={styles.actionIcon}>{nextLesson.icon}</Text>
            <Text style={styles.actionLabel}>Continue Learning</Text>
            <Text style={styles.actionSub}>{nextLesson.title}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionCard, { backgroundColor: '#E8F8E8' }]}>
            <Text style={styles.actionIcon}>🎓</Text>
            <Text style={styles.actionLabel}>All lessons done!</Text>
            <Text style={styles.actionSub}>You're a Savvy Investor</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#EEF2FF' }]}
          onPress={() => router.push('/simulate-main')}
        >
          <Text style={styles.actionIcon}>📈</Text>
          <Text style={styles.actionLabel}>Simulate</Text>
          <Text style={styles.actionSub}>Practice investing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#FEF9E7' }]}
          onPress={() => router.push('/chat')}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionLabel}>Ask AmpliFI</Text>
          <Text style={styles.actionSub}>AI-powered Q&A</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Overview */}
      <Text style={styles.sectionTitle}>Lesson Progress</Text>
      <View style={styles.progressCard}>
        <Text style={styles.progressFraction}>
          {completedLessons.length}/{LESSONS.length} completed
        </Text>
        <View style={styles.lessonDots}>
          {LESSONS.map((l) => (
            <View
              key={l.id}
              style={[
                styles.dot,
                completedLessons.includes(l.id) ? styles.dotDone : styles.dotPending
              ]}
            >
              <Text style={styles.dotIcon}>{completedLessons.includes(l.id) ? '✓' : l.icon}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Badges */}
      <Text style={styles.sectionTitle}>Badges</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesRow}>
        {BADGES.map(badge => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <View key={badge.id} style={[styles.badgeCard, !earned && styles.badgeLocked]}>
              <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>
                {earned ? badge.icon : '🔒'}
              </Text>
              <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>
                {badge.label}
              </Text>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1F4E79' },
  goal: { fontSize: 13, color: '#666', marginTop: 4, maxWidth: 240 },
  streakBadge: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 52 },
  streakIcon: { fontSize: 20 },
  streakCount: { fontSize: 16, fontWeight: 'bold', color: '#E67E22' },
  xpCard: { backgroundColor: '#1F4E79', borderRadius: 16, padding: 20, marginBottom: 24 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  xpValue: { color: '#F39C12', fontWeight: 'bold', fontSize: 16 },
  xpPct: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  xpBarContainer: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
  xpBarFill: { height: 8, backgroundColor: '#F39C12', borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCard: { width: '47%', backgroundColor: '#E8F0FB', borderRadius: 16, padding: 16 },  actionCard: { flex: 1, backgroundColor: '#E8F0FB', borderRadius: 16, padding: 16 },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: 'bold', color: '#1F4E79', marginBottom: 2 },
  actionSub: { fontSize: 12, color: '#555' },
  progressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24 },
  progressFraction: { fontSize: 15, color: '#666', marginBottom: 16 },
  lessonDots: { flexDirection: 'row', gap: 10 },
  dot: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  dotDone: { backgroundColor: '#D6EAD8' },
  dotPending: { backgroundColor: '#eee' },
  dotIcon: { fontSize: 18 },
  badgesRow: { marginBottom: 32 },
  badgeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginRight: 12, alignItems: 'center', width: 100 },
  badgeLocked: { backgroundColor: '#f0f0f0' },
  badgeIcon: { fontSize: 32, marginBottom: 8 },
  badgeIconLocked: { opacity: 0.3 },
  badgeLabel: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center' },
  badgeLabelLocked: { color: '#aaa' },
});