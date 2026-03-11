// Place this file at: app/lesson/[id].js
// FIXES: crash when pressing Back button after a lesson
//
// ROOT CAUSE (two bugs in the original):
//   1. isMounted.current = false was set BEFORE router.back() was called,
//      causing React Native to crash while trying to unmount mid-navigation.
//   2. router.canGoBack() is unreliable in Expo Router when a lesson is
//      opened from the Home quick-action card (shallow stack), so router.back()
//      had nothing to go back to and crashed.
//
// FIX: replaced handleBack with router.replace('/(tabs)/learn').
//      This always works regardless of navigation history, and cleanly
//      removes the lesson screen from the stack. The isMounted ref is also
//      removed from handleBack entirely — it was never needed there.

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, Animated, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getLessonById, getChapterByLessonId, getModuleByLessonId } from '../../constants/modules';
import { renderBlock } from '../../components/ContentBlocks';

const { width: SW } = Dimensions.get('window');

// ─── Static Flashcard ─────────────────────────────────
function FlashCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      anim.stopAnimation();
      anim.removeAllListeners();
    };
  }, []);

  const flip = () => {
    Animated.spring(anim, {
      toValue: flipped ? 0 : 1, friction: 8, useNativeDriver: true,
    }).start();
    setFlipped(f => !f);
  };

  const frontRot = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot  = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity onPress={flip} activeOpacity={1} style={fc.outer}>
      <Animated.View style={[fc.card, fc.front, { transform: [{ rotateY: frontRot }] }, flipped && fc.gone]}>
        <View style={fc.badge}><Text style={fc.badgeText}>Q {index + 1}/{total}</Text></View>
        <Text style={fc.qText}>{card.q}</Text>
        <Text style={fc.hint}>Tap to flip →</Text>
      </Animated.View>
      <Animated.View style={[fc.card, fc.back, { transform: [{ rotateY: backRot }] }, !flipped && fc.gone]}>
        <View style={[fc.badge, fc.badgeBack]}><Text style={[fc.badgeText, { color: '#059669' }]}>A {index + 1}/{total}</Text></View>
        <Text style={fc.aText}>{card.a}</Text>
        <Text style={fc.hint}>← Tap to flip back</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main ─────────────────────────────────────────────
export default function LessonScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('learn');
  const [cardIndex, setCardIndex] = useState(0);

  const lesson  = getLessonById(id);
  const chapter = getChapterByLessonId(id);
  const module  = getModuleByLessonId(id);

  const handleScroll = useCallback((e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SW);
    setCardIndex(index);
  }, []);

  // ── FIXED handleBack ──────────────────────────────────────────────────────
  // Always use replace() instead of back(). This safely navigates to the
  // Learn tab regardless of where the lesson was opened from (Home or Learn).
  const handleBack = useCallback(() => {
    router.replace('/(tabs)/learn');
  }, [router]);

  if (!lesson) return null;

  const flashcards = lesson.flashcards ?? [];
  const content = lesson.content ?? [];

  return (
    <View style={styles.container} key={id}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: module?.color || '#4F46E5' }]}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumb} numberOfLines={1}>{module?.title} · {chapter?.title}</Text>
        <Text style={styles.lessonTitle}>{lesson.icon} {lesson.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>⏱ {lesson.duration}</Text>
          <Text style={styles.meta}>💰 {lesson.xp} coins</Text>
          <Text style={styles.meta}>🃏 {flashcards.length} cards</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['learn', 'flashcards'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'learn' ? '📖 Learn' : `🃏 Flashcards (${flashcards.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          removeClippedSubviews={true}
        >
          {content.length > 0
            ? content.map((block, i) => renderBlock(block, i))
            : (
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonEmoji}>🚧</Text>
                <Text style={styles.comingSoonText}>Content coming soon!</Text>
              </View>
            )
          }
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Ready to test yourself? 🎯</Text>
            <Text style={styles.ctaSub}>
              Pass the quiz to earn {lesson.xp} FinCoins and unlock the next lesson
            </Text>
            <TouchableOpacity
              style={[styles.quizBtn, { backgroundColor: module?.color || '#4F46E5' }]}
              onPress={() => router.push(`/quiz/${id}`)}
            >
              <Text style={styles.quizBtnText}>Take the Quiz →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setActiveTab('flashcards')}
            >
              <Text style={styles.secondaryBtnText}>🃏 Review Flashcards First</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Flashcards Tab */}
      {activeTab === 'flashcards' && flashcards.length > 0 && (
        <View style={styles.flashOuter}>
          <View style={styles.dotsRow}>
            {flashcards.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === cardIndex && [styles.dotActive, { backgroundColor: module?.color }]]}
              />
            ))}
          </View>
          <FlatList
            data={flashcards}
            horizontal
            pagingEnabled
            snapToInterval={SW}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={true}
            getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
            onScroll={handleScroll}
            scrollEventThrottle={32}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <View style={{ width: SW, paddingHorizontal: 20, paddingTop: 8 }}>
                <FlashCard card={item} index={index} total={flashcards.length} />
              </View>
            )}
          />
          <Text style={styles.swipeHint}>
            {cardIndex < flashcards.length - 1 ? 'Swipe for next →' : '✅ All cards reviewed!'}
          </Text>
          <TouchableOpacity
            style={[styles.quizBtnBottom, { backgroundColor: module?.color || '#4F46E5' }]}
            onPress={() => router.push(`/quiz/${id}`)}
          >
            <Text style={styles.quizBtnText}>Take the Quiz →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Flashcards Tab — empty state */}
      {activeTab === 'flashcards' && flashcards.length === 0 && (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonEmoji}>🃏</Text>
          <Text style={styles.comingSoonText}>No flashcards yet for this lesson.</Text>
        </View>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  header: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20 },
  back: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 8 },
  breadcrumb: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  lessonTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 16 },
  meta: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#4F46E5' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },
  comingSoon: { alignItems: 'center', paddingVertical: 48 },
  comingSoonEmoji: { fontSize: 40, marginBottom: 12 },
  comingSoonText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  ctaCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginTop: 16, alignItems: 'center' },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  ctaSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  quizBtn: { borderRadius: 14, padding: 16, alignItems: 'center', width: '100%', marginBottom: 12 },
  quizBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, alignItems: 'center', width: '100%' },
  secondaryBtnText: { color: '#4F46E5', fontSize: 14, fontWeight: '700' },
  flashOuter: { flex: 1, paddingTop: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { width: 20 },
  swipeHint: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 12 },
  quizBtnBottom: { margin: 20, borderRadius: 14, padding: 16, alignItems: 'center' },
});

const fc = StyleSheet.create({
  outer: { height: 280, marginBottom: 16 },
  card: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: 20, padding: 24, justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  front: { backgroundColor: '#fff' },
  back: { backgroundColor: '#F0FDF4' },
  gone: { opacity: 0 },
  badge: {
    alignSelf: 'flex-start', backgroundColor: '#EEF2FF',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeBack: { backgroundColor: '#DCFCE7' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  qText: { fontSize: 17, fontWeight: '700', color: '#111827', lineHeight: 26, flex: 1, marginTop: 12 },
  aText: { fontSize: 15, color: '#374151', lineHeight: 24, flex: 1, marginTop: 12 },
  hint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
});