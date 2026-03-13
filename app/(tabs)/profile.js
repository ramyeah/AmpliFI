import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import useUserStore from '../../store/userStore';
import { LESSONS } from '../../constants/lessons';
import { resetProgress } from '../../lib/progress';

const BADGES = [
  { id: 'first_lesson', icon: '📖', label: 'First Step', desc: 'Complete your first lesson' },
  { id: 'all_lessons', icon: '🎓', label: 'Savvy Investor', desc: 'Complete all 5 lessons' },
  { id: 'simulation', icon: '📈', label: 'Market Maker', desc: 'Complete a simulation' },
  { id: 'streak_3', icon: '🔥', label: '3-Day Streak', desc: 'Log in 3 days in a row' },
  { id: 'streak_7', icon: '⚡', label: 'Week Warrior', desc: 'Log in 7 days in a row' },
];

const RISK_LABELS = {
  conservative: { label: 'Conservative', color: '#27AE60', icon: '🛡️' },
  balanced: { label: 'Balanced', color: '#E67E22', icon: '⚖️' },
  aggressive: { label: 'Aggressive', color: '#E74C3C', icon: '🚀' },
};

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);

  const [completedLessons, setCompletedLessons] = useState([]);
  const [streak, setStreak] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const [progressDoc, userDoc] = await Promise.all([
      getDoc(doc(db, 'progress', uid)),
      getDoc(doc(db, 'users', uid)),
    ]);

    const completed = progressDoc.exists()
      ? progressDoc.data().completedLessons || []
      : [];
    setCompletedLessons(completed);

    const userData = userDoc.data();
    const currentStreak = userData?.streak || 0;
    setStreak(currentStreak);

    const badges = [];
    if (completed.length >= 1) badges.push('first_lesson');
    if (completed.length >= 5) badges.push('all_lessons');
    if ((userData?.finCoins || 0) >= 100) badges.push('simulation');
    if (currentStreak >= 3) badges.push('streak_3');
    if (currentStreak >= 7) badges.push('streak_7');
    setEarnedBadges(badges);

    setLoading(false);
  };

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

  const riskInfo = profile?.riskProfile
    ? RISK_LABELS[profile.riskProfile]
    : null;

  const totalFinCoins = profile?.finCoins || 0;
  const lessonsComplete = completedLessons.length;
  const quizzesPassed = completedLessons.length; // 1 quiz per lesson

  if (loading) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Avatar + Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.name || 'User'}</Text>
        <Text style={styles.email}>{auth.currentUser?.email}</Text>
        {riskInfo && (
          <View style={[styles.riskBadge, { backgroundColor: riskInfo.color + '22' }]}>
            <Text style={[styles.riskText, { color: riskInfo.color }]}>
              {riskInfo.icon} {riskInfo.label} Investor
            </Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>💰 {totalFinCoins}</Text>
          <Text style={styles.statLabel}>FinCoins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>📖 {lessonsComplete}/{LESSONS.length}</Text>
          <Text style={styles.statLabel}>Lessons</Text>
        </View>
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Details</Text>
        <InfoRow label="Age" value={profile?.age || '—'} />
        <InfoRow label="Income Bracket" value={profile?.income || '—'} />
        <InfoRow label="Family Status" value={profile?.familyStatus || '—'} />
        <InfoRow label="Financial Goal" value={profile?.goal || '—'} />
      </View>

      {/* Lesson Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lesson Progress</Text>
        {LESSONS.map((lesson, i) => {
          const done = completedLessons.includes(lesson.id);
          return (
            <View key={lesson.id} style={styles.lessonRow}>
              <Text style={styles.lessonIcon}>{done ? '✅' : '⬜'}</Text>
              <Text style={[styles.lessonName, done && styles.lessonNameDone]}>
                {lesson.title}
              </Text>
              {done && <Text style={styles.lessonXP}>+{lesson.xp} 💰</Text>}
            </View>
          );
        })}
      </View>

      {/* Badges */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Badges</Text>
        {BADGES.map(badge => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <View key={badge.id} style={styles.badgeRow}>
              <Text style={[styles.badgeIcon, !earned && styles.locked]}>
                {earned ? badge.icon : '🔒'}
              </Text>
              <View style={styles.badgeInfo}>
                <Text style={[styles.badgeLabel, !earned && styles.lockedText]}>
                  {badge.label}
                </Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
              </View>
              {earned && <Text style={styles.earnedTag}>Earned</Text>}
            </View>
          );
        })}
      </View>

      {/* Dev: Reset Progress */}
      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetText}>🔄  Reset Progress (Dev)</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1F4E79', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1F4E79', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 12 },
  riskBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  riskText: { fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 16 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  lessonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  lessonIcon: { fontSize: 18, marginRight: 10 },
  lessonName: { flex: 1, fontSize: 14, color: '#666' },
  lessonNameDone: { color: '#333', fontWeight: '500' },
  lessonXP: { fontSize: 12, color: '#F39C12', fontWeight: '600' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  badgeIcon: { fontSize: 28, marginRight: 14 },
  locked: { opacity: 0.3 },
  badgeInfo: { flex: 1 },
  badgeLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  lockedText: { color: '#aaa' },
  badgeDesc: { fontSize: 12, color: '#888' },
  earnedTag: { fontSize: 11, color: '#27AE60', fontWeight: '600', backgroundColor: '#E8F8E8', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  resetBtn: {
    backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#F59E0B',
    borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 8,
  },
  resetText: { color: '#B45309', fontSize: 14, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E74C3C', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  logoutText: { color: '#E74C3C', fontSize: 16, fontWeight: 'bold' },
});