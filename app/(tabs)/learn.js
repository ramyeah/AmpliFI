import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { LESSONS } from '../../constants/lessons';

export default function LearnScreen() {
  const router = useRouter();
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const progressDoc = await getDoc(doc(db, 'progress', uid));
    const completed = progressDoc.exists()
      ? progressDoc.data().completedLessons || []
      : [];
    setCompletedLessons(completed);
    setLoading(false);
  };

  const isUnlocked = (index) => {
    if (index === 0) return true;
    return completedLessons.includes(LESSONS[index - 1].id);
  };

  const pct = Math.round((completedLessons.length / LESSONS.length) * 100);

  if (loading) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Learning Roadmap 🗺️</Text>
      <Text style={styles.subtitle}>
        Complete lessons in order to unlock the next one
      </Text>

      {/* Overall progress */}
      <View style={styles.overallCard}>
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Overall Progress</Text>
          <Text style={styles.overallPct}>{pct}%</Text>
        </View>
        <View style={styles.overallBar}>
          <View style={[styles.overallFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.overallSub}>
          {completedLessons.length} of {LESSONS.length} lessons completed
        </Text>
      </View>

      {/* Lesson cards */}
      {LESSONS.map((lesson, index) => {
        const done = completedLessons.includes(lesson.id);
        const unlocked = isUnlocked(index);

        return (
          <TouchableOpacity
            key={lesson.id}
            style={[
              styles.lessonCard,
              done && styles.lessonCardDone,
              !unlocked && styles.lessonCardLocked,
            ]}
            onPress={() => unlocked && router.push(`/lesson/${lesson.id}`)}
            disabled={!unlocked}
            activeOpacity={unlocked ? 0.7 : 1}
          >
            {/* Connector line */}
            {index < LESSONS.length - 1 && (
              <View style={[styles.connector, done && styles.connectorDone]} />
            )}

            <View style={styles.lessonLeft}>
              <View style={[
                styles.iconCircle,
                done && styles.iconCircleDone,
                !unlocked && styles.iconCircleLocked,
              ]}>
                <Text style={styles.lessonIcon}>
                  {done ? '✅' : unlocked ? lesson.icon : '🔒'}
                </Text>
              </View>
            </View>

            <View style={styles.lessonBody}>
              <View style={styles.lessonHeader}>
                <Text style={[styles.lessonTitle, !unlocked && styles.lockedText]}>
                  {lesson.title}
                </Text>
                {done && (
                  <View style={styles.doneTag}>
                    <Text style={styles.doneTagText}>Done</Text>
                  </View>
                )}
                {!unlocked && (
                  <View style={styles.lockedTag}>
                    <Text style={styles.lockedTagText}>Locked</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.lessonDesc, !unlocked && styles.lockedText]}>
                {lesson.description}
              </Text>

              <View style={styles.lessonMeta}>
                <Text style={styles.metaText}>💰 {lesson.xp} FinCoins</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>📝 5 questions</Text>
                {unlocked && !done && (
                  <>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={[styles.metaText, { color: '#1F4E79', fontWeight: '600' }]}>
                      Start →
                    </Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  overallCard: { backgroundColor: '#1F4E79', borderRadius: 16, padding: 20, marginBottom: 24 },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  overallLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  overallPct: { color: '#F39C12', fontWeight: 'bold', fontSize: 16 },
  overallBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 8 },
  overallFill: { height: 8, backgroundColor: '#F39C12', borderRadius: 4 },
  overallSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  lessonCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, flexDirection: 'row', position: 'relative',
  },
  lessonCardDone: { borderLeftWidth: 4, borderLeftColor: '#27AE60' },
  lessonCardLocked: { opacity: 0.6 },
  connector: {
    position: 'absolute', left: 31, bottom: -12,
    width: 2, height: 12, backgroundColor: '#ddd', zIndex: 1,
  },
  connectorDone: { backgroundColor: '#27AE60' },
  lessonLeft: { marginRight: 14 },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E8F0FB', justifyContent: 'center', alignItems: 'center',
  },
  iconCircleDone: { backgroundColor: '#E8F8E8' },
  iconCircleLocked: { backgroundColor: '#f0f0f0' },
  lessonIcon: { fontSize: 22 },
  lessonBody: { flex: 1 },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  lessonTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F4E79', flex: 1 },
  lockedText: { color: '#aaa' },
  doneTag: { backgroundColor: '#E8F8E8', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  doneTagText: { fontSize: 11, color: '#27AE60', fontWeight: '600' },
  lockedTag: { backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  lockedTagText: { fontSize: 11, color: '#999', fontWeight: '600' },
  lessonDesc: { fontSize: 13, color: '#666', marginBottom: 10, lineHeight: 18 },
  lessonMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#888' },
  metaDot: { color: '#ccc', marginHorizontal: 6 },
});