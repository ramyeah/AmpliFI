import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LESSONS } from '../../constants/lessons';
import useUserStore from '../../store/userStore';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

export default function LearnScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const [completedLessons, setCompletedLessons] = useState([]);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const progressDoc = await getDoc(doc(db, 'progress', uid));
      if (progressDoc.exists()) {
        setCompletedLessons(progressDoc.data().completedLessons || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isUnlocked = (index) => {
    if (index === 0) return true;
    return completedLessons.includes(LESSONS[index - 1].id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Learning Path 📚</Text>
      <Text style={styles.subtitle}>
        Complete lessons in order to unlock the next one
      </Text>

      {LESSONS.map((lesson, index) => {
        const unlocked = isUnlocked(index);
        const completed = completedLessons.includes(lesson.id);

        return (
          <TouchableOpacity
            key={lesson.id}
            style={[
              styles.lessonCard,
              !unlocked && styles.locked,
              completed && styles.completed,
            ]}
            onPress={() => {
              if (unlocked) {
                router.push(`/lesson/${lesson.id}`);
              }
            }}
            disabled={!unlocked}
          >
            <View style={styles.lessonLeft}>
              <Text style={styles.lessonIcon}>{lesson.icon}</Text>
              <View>
                <Text style={[styles.lessonTitle, !unlocked && styles.lockedText]}>
                  {lesson.title}
                </Text>
                <Text style={[styles.lessonDesc, !unlocked && styles.lockedText]}>
                  {lesson.description}
                </Text>
                <Text style={styles.xp}>+{lesson.xp} FinCoins</Text>
              </View>
            </View>
            <Text style={styles.lessonStatus}>
              {completed ? '✅' : unlocked ? '▶' : '🔒'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  completed: { borderLeftWidth: 4, borderLeftColor: '#27AE60' },
  locked: { opacity: 0.5 },
  lessonLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  lessonIcon: { fontSize: 32, marginRight: 12 },
  lessonTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 4 },
  lessonDesc: { fontSize: 13, color: '#666', marginBottom: 4 },
  xp: { fontSize: 12, color: '#F39C12', fontWeight: '600' },
  lockedText: { color: '#999' },
  lessonStatus: { fontSize: 20 },
});