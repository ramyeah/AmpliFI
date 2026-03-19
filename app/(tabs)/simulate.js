// app/(tabs)/simulate.js
//
// Simulation home screen — overview of the user's financial simulation.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../../store/userStore';
import { loadSimProgress } from '../../lib/lifeSim';
import { getProgress } from '../../lib/progress';
import { getMonthLabel } from '../../constants/lifeSimStages';
import { Colors, Fonts, Spacing, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';
import { auth } from '../../lib/firebase';

const { width: SW } = Dimensions.get('window');
const TEAL   = MODULE_COLORS['module-1'].color;
const ORANGE = MODULE_COLORS['module-2'].color;
const GREEN  = MODULE_COLORS['module-3'].color;
const PURPLE = MODULE_COLORS['module-4'].color;

// ─── Chapter definitions ─────────────────────────────────────────────────────
const CHAPTERS = [
  {
    id: 1, icon: '🎯', title: 'Know Your Number',
    desc: 'Set your Financial Independence target.',
    unlockCheck: () => true, // always unlocked
  },
  {
    id: 2, icon: '🏦', title: 'Open Your Bank',
    desc: 'Choose a bank and open your first account.',
    unlockModule: 'module-1',
  },
  {
    id: 3, icon: '📊', title: 'Budget Your Life',
    desc: 'Give every dollar a job with the 50/30/20 rule.',
    unlockStage: 'stage-2',
  },
  {
    id: 4, icon: '📈', title: 'Start Investing',
    desc: 'Put your money to work in the market.',
    unlockModule: 'module-3',
  },
  {
    id: 5, icon: '🏛️', title: 'Advanced Moves',
    desc: 'CPF optimisation and long-term strategy.',
    unlockModule: 'module-4',
  },
];

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SimulateScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const profile = useUserStore(s => s.profile);
  const uid     = auth.currentUser?.uid;

  const [sim,              setSim]              = useState(null);
  const [completedModules, setCompletedModules] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const firstName = auth.currentUser?.displayName?.split(' ')[0] ?? profile?.name?.split(' ')[0] ?? 'there';
  const finCoins  = profile?.finCoins ?? 0;

  // ── Load data ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const [simData, progress] = await Promise.all([
        loadSimProgress(uid),
        getProgress(),
      ]);
      setSim(simData);
      setCompletedModules(progress.completedModules ?? []);
    } catch (e) { console.error('sim home load:', e); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Fade in on mount
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [loading]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const wallets        = sim?.wallets ?? [];
  const netWorth       = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);
  const completedStgs  = sim?.completedStages ?? [];
  const currentMonth   = sim?.currentMonth ?? 1;
  const ffn            = sim?.ffn ?? null;
  const invested       = wallets.filter(w => w.type === 'investment').reduce((s, w) => s + (w.balance ?? 0), 0);
  const fiPct          = ffn ? Math.min(invested / ffn, 1) : 0;
  const hasRealAccounts = wallets.some(w => w.type !== 'wallet');

  // ── Chapter status ───────────────────────────────────────────────────────

  const getChapterStatus = (ch) => {
    // Chapter completion: check sim.completedStages for the matching stage
    const stageId = `stage-${ch.id}`;
    if (completedStgs.includes(stageId)) return 'complete';

    // Unlock checks
    if (ch.unlockCheck && ch.unlockCheck()) {
      // Check if this is the current chapter (first non-complete chapter)
      return 'current';
    }
    if (ch.unlockModule && completedModules.includes(ch.unlockModule)) return 'unlocked';
    if (ch.unlockStage && completedStgs.includes(ch.unlockStage)) return 'unlocked';

    return 'locked';
  };

  // Find the first non-complete chapter to mark as "current"
  const chapterStatuses = CHAPTERS.map(ch => {
    const raw = getChapterStatus(ch);
    return { ...ch, status: raw };
  });

  // Mark the first unlocked/current as "current", rest stay as-is
  let foundCurrent = false;
  const finalChapters = chapterStatuses.map(ch => {
    if (ch.status === 'complete') return ch;
    if (!foundCurrent && (ch.status === 'current' || ch.status === 'unlocked')) {
      foundCurrent = true;
      return { ...ch, status: 'current' };
    }
    if (foundCurrent && ch.status === 'unlocked') return ch;
    if (ch.status === 'locked') return ch;
    return ch;
  });

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) return <View style={s.root} />;

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]}>

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={s.greeting}>Hi, {firstName}</Text>
        <View style={s.coinBadge}>
          <Image source={require('../../assets/coin.png')} style={{ width: 16, height: 16 }} />
          <Text style={s.coinAmt}>{finCoins.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Time card ── */}
        <View style={s.timeCard}>
          <Text style={s.timeLabel}>{getMonthLabel(currentMonth)}</Text>
          <Text style={s.timeSub}>Year 1</Text>
        </View>

        {/* ── FI Progress ── */}
        <View style={s.fiCard}>
          {ffn ? (
            <>
              <View style={s.fiRow}>
                <Text style={s.fiLabel}>FI Number</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Image source={require('../../assets/coin.png')} style={{ width: 14, height: 14 }} />
                  <Text style={[s.fiValues, { color: TEAL }]}>{Math.round(invested).toLocaleString()}</Text>
                  <Text style={s.fiValues}>  of  </Text>
                  <Image source={require('../../assets/coin.png')} style={{ width: 14, height: 14 }} />
                  <Text style={[s.fiValues, { color: Colors.textPrimary }]}>{Math.round(ffn).toLocaleString()}</Text>
                </View>
              </View>
              <View style={s.fiTrack}>
                <View style={[s.fiFill, { width: `${Math.max(Math.round(fiPct * 100), 1)}%` }]} />
              </View>
              <Text style={s.fiPct}>{Math.round(fiPct * 100)}% complete</Text>
            </>
          ) : (
            <View style={s.fiEmpty}>
              <Text style={s.fiEmptyIcon}>🎯</Text>
              <Text style={s.fiEmptyText}>Complete Chapter 1 to set your FI Number</Text>
            </View>
          )}
        </View>

        {/* ── Accounts ── */}
        <Text style={s.sectionTitle}>My Accounts</Text>
        {hasRealAccounts ? (
          <View style={s.accountsList}>
            {wallets.filter(w => w.type !== 'wallet' || w.balance > 0).map(w => (
              <View key={w.id} style={s.accountRow}>
                <Text style={s.accountIcon}>{w.icon ?? '💵'}</Text>
                <Text style={s.accountLabel}>{w.label ?? 'Cash'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Image source={require('../../assets/coin.png')} style={{ width: 14, height: 14 }} />
                  <Text style={[s.accountBal, { color: w.color ?? TEAL }]}>
                    {Math.round(w.balance ?? 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.accountsEmpty}>
            <Text style={s.accountsEmptyIcon}>🏦</Text>
            <Text style={s.accountsEmptyText}>Open your first account in Chapter 2</Text>
          </View>
        )}

        {/* ── Chapters ── */}
        <Text style={s.sectionTitle}>Your Journey</Text>
        {finalChapters.map(ch => {
          const isCurrent  = ch.status === 'current';
          const isComplete = ch.status === 'complete';
          const isLocked   = ch.status === 'locked';
          const tappable   = !isLocked;

          return (
            <TouchableOpacity
              key={ch.id}
              style={[
                s.chapterCard,
                isCurrent  && { borderColor: TEAL, borderWidth: 2 },
                isComplete && { borderColor: GREEN + '50' },
                isLocked   && { opacity: 0.5 },
              ]}
              activeOpacity={tappable ? 0.82 : 1}
              onPress={() => {
                if (tappable) router.push(`/simulate/chapter-${ch.id}`);
              }}
            >
              <View style={[s.chapterIconWrap, {
                backgroundColor: isComplete ? GREEN + '18' : isCurrent ? TEAL + '18' : Colors.lightGray,
              }]}>
                <Text style={s.chapterIcon}>{ch.icon}</Text>
              </View>
              <View style={s.chapterText}>
                <Text style={s.chapterTitle}>{ch.title}</Text>
                <Text style={s.chapterDesc}>{ch.desc}</Text>
              </View>
              <View style={[
                s.statusBadge,
                isCurrent  && { backgroundColor: TEAL + '18' },
                isComplete && { backgroundColor: GREEN + '18' },
                isLocked   && { backgroundColor: Colors.lightGray },
              ]}>
                <Text style={[
                  s.statusText,
                  isCurrent  && { color: TEAL },
                  isComplete && { color: GREEN },
                  isLocked   && { color: Colors.textMuted },
                ]}>
                  {isComplete ? '✓ Done' : isCurrent ? 'Current' : '🔒 Locked'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── AI Report ── */}
        <TouchableOpacity
          style={[s.reportBtn, currentMonth < 2 && { opacity: 0.4 }]}
          activeOpacity={currentMonth < 2 ? 1 : 0.82}
          onPress={() => {
            if (currentMonth >= 2) {
              Alert.alert('Coming soon', 'Fin will be able to review your finances in a future update.');
            }
          }}
        >
          <Text style={s.reportText}>Ask Fin to review my finances 🤖</Text>
        </TouchableOpacity>

      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },

  // Header
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  greeting: { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textPrimary },
  coinBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 6 },
  coinAmt:  { fontFamily: Fonts.bold, fontSize: 14, color: Colors.warningDark },

  // Scroll
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md },

  // Time card
  timeCard:  { backgroundColor: Colors.primary, borderRadius: Radii.xl, padding: Spacing.lg, alignItems: 'center', ...Shadows.medium },
  timeLabel: { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.white },
  timeSub:   { fontFamily: Fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // FI progress
  fiCard:    { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadows.soft },
  fiRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.sm },
  fiLabel:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  fiValues:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted },
  fiTrack:   { height: 10, backgroundColor: Colors.lightGray, borderRadius: 5, overflow: 'hidden' },
  fiFill:    { height: 10, borderRadius: 5, backgroundColor: TEAL },
  fiPct:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 6, textAlign: 'right' },
  fiEmpty:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fiEmptyIcon: { fontSize: 24 },
  fiEmptyText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, flex: 1, lineHeight: 19 },

  // Section title
  sectionTitle: { fontFamily: Fonts.extraBold, fontSize: 17, color: Colors.textPrimary, marginTop: Spacing.sm },

  // Accounts
  accountsList:     { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.soft },
  accountRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  accountIcon:      { fontSize: 20 },
  accountLabel:     { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  accountBal:       { fontFamily: Fonts.extraBold, fontSize: 16 },
  accountsEmpty:    { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, flexDirection: 'row', alignItems: 'center', gap: 10, ...Shadows.soft },
  accountsEmptyIcon:{ fontSize: 24 },
  accountsEmptyText:{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, flex: 1, lineHeight: 19 },

  // Chapter cards
  chapterCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.soft },
  chapterIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chapterIcon:     { fontSize: 22 },
  chapterText:     { flex: 1, gap: 2 },
  chapterTitle:    { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary },
  chapterDesc:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  statusBadge:     { borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:      { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 },

  // AI report button
  reportBtn:  { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radii.xl, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm },
  reportText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.primary },
});
