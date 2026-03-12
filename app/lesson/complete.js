import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  getLessonById, getChapterByLessonId, getModuleByLessonId, getNextLessonId 
} from '../../constants/modules';

const C = {
  success: '#059669', primary: '#4F46E5', primaryLight: '#EEF2FF',
  neutral1: '#111827', neutral2: '#374151', neutral3: '#6B7280',
  white: '#ffffff', cardBg: '#F9FAFB',
};

export default function LessonComplete() {
  const { lessonId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const lesson = getLessonById(lessonId);
  const chapter = getChapterByLessonId(lessonId);
  const module = getModuleByLessonId(lessonId);
  const nextLessonId = getNextLessonId(lessonId);
  const moduleColor = module?.color || '#4F46E5';

  const [totalFincoins] = useState(150); // TODO: Fetch from Firestore later
  const [totalXP] = useState(lesson?.xp || 0);

  const handleContinue = () => {
    if (nextLessonId) {
      router.push(`/lesson/${nextLessonId}`);
    } else {
      router.push('/tabs/learn');
    }
  };

  if (!lesson) return null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.emoji}>✨</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: moduleColor }]}>
          Congratulations!
        </Text>

        <Text style={styles.subtitle}>Lesson completed</Text>

        <View style={styles.locationRow}>
          <Text style={styles.locationModule}>{module?.title}</Text>
          <Text style={styles.locationDot}>·</Text>
          <Text style={styles.locationChapter}>{chapter?.title}</Text>
        </View>

        <Text style={styles.lessonName}>
          {lesson.icon} {lesson.title}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🪙</Text>
            <Text style={styles.statLabel}>FinCoins earned</Text>
            <Text style={styles.statValue}>+{totalFincoins}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statLabel}>XP Gained</Text>
            <Text style={styles.statValue}>+{totalXP}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: moduleColor }]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueText}>
            {nextLessonId ? 'Continue to Next Lesson →' : 'Back to Learn →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  hero: { 
    flex: 1.2, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emoji: { fontSize: 80, margin: 8 },
  content: { 
    flex: 1.8, 
    paddingHorizontal: 24, 
    paddingBottom: 80, 
    justifyContent: 'center' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '900', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: C.neutral2, 
    textAlign: 'center', 
    marginBottom: 16, 
    fontWeight: '600' 
  },
  locationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 24 
  },
  locationModule: { 
    fontSize: 13, 
    color: C.neutral3, 
    fontWeight: '700' 
  },
  locationDot: { 
    fontSize: 13, 
    color: C.neutral3, 
    marginHorizontal: 8 
  },
  locationChapter: { 
    fontSize: 13, 
    color: C.neutral3, 
    fontWeight: '500' 
  },
  lessonName: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: C.neutral1, 
    textAlign: 'center', 
    marginBottom: 36, 
    lineHeight: 24 
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 48 
  },
  statCard: { 
    backgroundColor: C.white, 
    padding: 24, 
    borderRadius: 20, 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 12, 
    elevation: 4 
  },
  statEmoji: { fontSize: 36, marginBottom: 12 },
  statLabel: { fontSize: 12, color: C.neutral3, marginBottom: 4, textAlign: 'center' },
  statValue: { fontSize: 26, fontWeight: '900', color: C.primary },
  continueBtn: { 
    borderRadius: 16, 
    paddingVertical: 20, 
    alignItems: 'center', 
    marginHorizontal: 20 
  },
  continueText: { 
    color: C.white, 
    fontSize: 16, 
    fontWeight: '800' 
  },
});
