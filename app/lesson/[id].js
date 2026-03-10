import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LESSONS } from '../../constants/lessons';
import { generateLesson } from '../../lib/api';
import useUserStore from '../../store/userStore';
import Markdown from 'react-native-markdown-display';

// Cache lives outside component so it persists between navigations
const lessonCache = {};

export default function LessonScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const lesson = LESSONS.find((l) => l.id === id);

  const [content, setContent] = useState(lessonCache[id] || '');
  const [loading, setLoading] = useState(!lessonCache[id]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (lessonCache[id]) return; // Already cached, skip fetch
    loadLesson();
  }, []);

  const loadLesson = async () => {
    setLoading(true);
    try {
      const result = await generateLesson(lesson.topic, profile);
      if (result.disclaimer || result.error) {
        setError(true);
      } else {
        lessonCache[id] = result.response; // Save to cache
        setContent(result.response);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!lesson) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.icon}>{lesson.icon}</Text>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.xp}>+{lesson.xp} FinCoins on completion</Text>

      <View style={styles.divider} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F4E79" />
          <Text style={styles.loadingText}>
            Generating your personalised lesson...
          </Text>
          <Text style={styles.loadingSubtext}>
            This may take up to 20 seconds
          </Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>
          Unable to load lesson content. Please check your connection and try again.
        </Text>
      ) : (
        <>
          <Markdown style={markdownStyles}>{content}</Markdown>
          <TouchableOpacity
            style={styles.quizBtn}
            onPress={() => router.push(`/quiz/${id}`)}
          >
            <Text style={styles.quizBtnText}>Take the Quiz →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 48 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#1F4E79', fontSize: 16 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 4 },
  xp: { fontSize: 13, color: '#F39C12', fontWeight: '600', marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 24 },
  loadingContainer: { alignItems: 'center', paddingTop: 48 },
  loadingText: { marginTop: 16, color: '#666', fontSize: 14, textAlign: 'center' },
  loadingSubtext: { marginTop: 8, color: '#999', fontSize: 12, textAlign: 'center' },
  errorText: { color: '#E74C3C', fontSize: 14, textAlign: 'center', paddingTop: 48 },
  quizBtn: {
    backgroundColor: '#1F4E79',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 48,
  },
  quizBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

const markdownStyles = {
  body: { fontSize: 16, lineHeight: 26, color: '#333' },
  heading1: { fontSize: 22, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8, marginTop: 16 },
  heading2: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79', marginBottom: 6, marginTop: 12 },
  strong: { fontWeight: 'bold', color: '#333' },
  bullet_list: { marginBottom: 8 },
  ordered_list: { marginBottom: 8 },
  list_item: { marginBottom: 4 },
};