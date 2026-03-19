// app/simulate/chapter-1.js
//
// Chapter 1 — Know Your Number
// The user calculates their FI Number using the 4% rule and sets a target age.

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeBack } from '../../hooks/useHardwareBack';
import { loadSimProgress, saveSimProgress, completeStage } from '../../lib/lifeSim';
import { WALLET_TEMPLATES } from '../../constants/lifeSimStages';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../../constants/theme';
import { CHAPTER_COLORS, FIN, COIN_ASSET } from '../../constants/simTheme';
import { auth } from '../../lib/firebase';

const { accent, light } = CHAPTER_COLORS[1];
const AGE_OPTIONS = [45, 50, 55, 60, 65];

export default function Chapter1Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = useSafeBack('/(tabs)/simulate');
  const uid    = auth.currentUser?.uid;

  const [sim,     setSim]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Active mode state
  const [monthlyIncome, setMonthlyIncome] = useState(2000);
  const [selectedAge,   setSelectedAge]   = useState(null);

  const ffn = monthlyIncome * 12 * 25;

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await loadSimProgress(uid);
      setSim(data);
    } catch (e) { console.error('ch1 load:', e); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLockIn = async () => {
    if (!selectedAge || saving) return;
    setSaving(true);
    try {
      const stage1Data = { ffn, ffnAge: selectedAge, monthlyRetirementIncome: monthlyIncome };
      await saveSimProgress(uid, {
        ffn,
        ffnAge: selectedAge,
        monthlyRetirementIncome: monthlyIncome,
        stage1Data,
      });
      await completeStage(uid, 'stage-1', stage1Data);
      router.replace('/(tabs)/simulate');
    } catch (e) {
      console.error('ch1 save:', e);
      Alert.alert('Something went wrong', 'Please try again.');
      setSaving(false);
    }
  };

  const handleRedo = () => {
    Alert.alert(
      'Start over?',
      "Redoing Chapter 1 will reset all your simulation progress \u2014 your bank, budget, and investment decisions will be cleared. This can\u2019t be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Redo',
          style: 'destructive',
          onPress: async () => {
            const starterBalance = sim?.wallets?.[0]?.balance ?? 0;
            const starterWallet = {
              ...WALLET_TEMPLATES.wallet,
              balance: starterBalance,
            };
            await saveSimProgress(uid, {
              stage1Data: null,
              stage2Data: null,
              stage3Data: null,
              stage4Data: null,
              stage5Data: null,
              ffn: null,
              ffnAge: null,
              completedStages: [],
              currentStage: 'stage-1',
              wallets: [starterWallet],
            });
            setLoading(true);
            load();
          },
        },
      ]
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return <View style={s.root} />;

  const isComplete = sim?.stage1Data != null;

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY MODE
  // ═══════════════════════════════════════════════════════════════════════════

  if (isComplete) {
    const d = sim.stage1Data;
    return (
      <View style={s.root}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={goBack} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Completion banner */}
          <View style={[s.banner, { backgroundColor: Colors.successDark }]}>
            <Text style={s.bannerText}>Chapter 1 Complete ✓</Text>
          </View>

          {/* Your decisions */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Your Decisions</Text>

            <View style={s.decisionRow}>
              <Text style={s.decisionLabel}>Monthly retirement income</Text>
              <View style={s.coinRow}>
                <Image source={COIN_ASSET} style={s.coinImg} />
                <Text style={[s.decisionValue, { color: accent }]}>
                  {(d.monthlyRetirementIncome ?? 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.decisionRow}>
              <Text style={s.decisionLabel}>FI Number</Text>
              <View style={s.coinRow}>
                <Image source={COIN_ASSET} style={s.coinImg} />
                <Text style={[s.decisionValue, { color: accent }]}>
                  {(d.ffn ?? 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={s.divider} />

            <View style={s.decisionRow}>
              <Text style={s.decisionLabel}>Target retirement age</Text>
              <Text style={[s.decisionValue, { color: accent }]}>{d.ffnAge}</Text>
            </View>
          </View>

          {/* Fin dialogue */}
          <View style={[s.finCard, { borderLeftColor: accent }]}>
            <View style={[s.finAvatarWrap, { backgroundColor: light }]}>
              <Text style={s.finEmoji}>{FIN.emoji}</Text>
            </View>
            <Text style={s.finText}>
              This is your north star. Every financial decision in the simulation moves you closer to {'\u2014'} or further from {'\u2014'} this number.
            </Text>
          </View>

          {/* Redo */}
          <TouchableOpacity style={[s.redoBtn, { borderColor: accent }]} onPress={handleRedo} activeOpacity={0.82}>
            <Text style={[s.redoBtnText, { color: accent }]}>Redo Chapter 1</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE MODE
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <View style={s.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity onPress={goBack} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.screenTitle}>Know Your Number</Text>
        <Text style={s.screenSubtitle}>Chapter 1</Text>

        {/* Fin dialogue */}
        <View style={[s.finCard, { borderLeftColor: accent }]}>
          <View style={[s.finAvatarWrap, { backgroundColor: light }]}>
            <Text style={s.finEmoji}>{FIN.emoji}</Text>
          </View>
          <Text style={s.finText}>
            Before you touch a single coin {'\u2014'} what are you actually working toward? Let's figure out your Financial Independence Number.
          </Text>
        </View>

        {/* ── Step 1: Monthly retirement income ── */}
        <Text style={s.stepLabel}>How much do you want to spend each month in retirement?</Text>

        <View style={[s.sliderCard, { backgroundColor: light }]}>
          <View style={s.coinRow}>
            <Image source={COIN_ASSET} style={s.coinImg} />
            <Text style={[s.sliderValue, { color: accent }]}>{monthlyIncome.toLocaleString()}</Text>
            <Text style={s.sliderUnit}>/month</Text>
          </View>
          <Slider
            minimumValue={500}
            maximumValue={5000}
            step={100}
            value={monthlyIncome}
            onValueChange={v => setMonthlyIncome(Math.round(v))}
            minimumTrackTintColor={accent}
            thumbTintColor={accent}
            style={{ marginTop: Spacing.sm }}
          />
        </View>

        {/* FI Number result card */}
        <View style={s.card}>
          <View style={s.calcRow}>
            <Text style={s.calcLabel}>Monthly income</Text>
            <View style={s.coinRow}>
              <Image source={COIN_ASSET} style={s.coinImgSm} />
              <Text style={[s.calcValue, { color: accent }]}>{monthlyIncome.toLocaleString()}</Text>
            </View>
          </View>

          <View style={s.calcRow}>
            <Text style={s.calcLabel}>{'\u00D7'} 12 months {'\u00D7'} 25 years</Text>
            <Text style={s.calcMuted}>(4% rule)</Text>
          </View>

          <View style={s.divider} />

          <View style={s.calcRow}>
            <Text style={s.calcResultLabel}>= Your FI Number</Text>
            <View style={s.coinRow}>
              <Image source={COIN_ASSET} style={{ width: 20, height: 20 }} />
              <Text style={[s.calcResult, { color: accent }]}>{ffn.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* ── Step 2: Target retirement age ── */}
        <Text style={s.stepLabel}>When do you want to retire?</Text>

        <View style={s.ageRow}>
          {AGE_OPTIONS.map(age => {
            const selected = selectedAge === age;
            return (
              <TouchableOpacity
                key={age}
                style={[
                  s.agePill,
                  selected
                    ? { backgroundColor: accent, borderColor: accent }
                    : { backgroundColor: Colors.white, borderColor: Colors.border },
                ]}
                onPress={() => setSelectedAge(age)}
                activeOpacity={0.8}
              >
                <Text style={[
                  s.agePillText,
                  selected ? { color: Colors.white } : { color: Colors.textMuted },
                ]}>
                  {age}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── CTA ── */}
        <TouchableOpacity
          style={[
            s.ctaBtn,
            { backgroundColor: selectedAge ? accent : Colors.border },
          ]}
          onPress={handleLockIn}
          disabled={!selectedAge || saving}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={s.ctaBtnText}>Lock in my FI Number 🎯</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.background },
  scroll:         { paddingHorizontal: Spacing.lg, gap: Spacing.md },

  // Back button
  backBtn:        { marginBottom: Spacing.sm },
  backText:       { fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.primary },

  // Header
  screenTitle:    { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.textPrimary },
  screenSubtitle: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.sm },

  // Completion banner
  banner:         { borderRadius: Radii.xl, padding: Spacing.lg, alignItems: 'center', ...Shadows.medium },
  bannerText:     { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.white },

  // Fin card
  finCard:        { backgroundColor: Colors.white, borderRadius: Radii.lg, borderLeftWidth: 3, padding: Spacing.lg, flexDirection: 'row', alignItems: 'flex-start', gap: 10, ...Shadows.soft },
  finAvatarWrap:  { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  finEmoji:       { fontSize: 18 },
  finText:        { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 21, flex: 1 },

  // Generic card
  card:           { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, ...Shadows.soft },
  cardTitle:      { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.xs },
  divider:        { height: 1, backgroundColor: Colors.border },

  // Decision rows (summary mode)
  decisionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  decisionLabel:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1 },
  decisionValue:  { fontFamily: Fonts.extraBold, fontSize: 16 },

  // Coin inline
  coinRow:        { flexDirection: 'row', alignItems: 'center', gap: 3 },
  coinImg:        { width: 16, height: 16 },
  coinImgSm:      { width: 14, height: 14 },

  // Step label
  stepLabel:      { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginTop: Spacing.sm },

  // Slider card
  sliderCard:     { borderRadius: Radii.xl, padding: Spacing.lg },
  sliderValue:    { fontFamily: Fonts.extraBold, fontSize: 28 },
  sliderUnit:     { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, marginLeft: 2, alignSelf: 'flex-end', marginBottom: 4 },

  // Calc rows
  calcRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcLabel:      { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  calcValue:      { fontFamily: Fonts.bold, fontSize: 15 },
  calcMuted:      { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  calcResultLabel:{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  calcResult:     { fontFamily: Fonts.extraBold, fontSize: 24 },

  // Age pills
  ageRow:         { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  agePill:        { borderWidth: 1.5, borderRadius: Radii.full, paddingHorizontal: 20, paddingVertical: 10, minWidth: 54, alignItems: 'center' },
  agePillText:    { fontFamily: Fonts.bold, fontSize: 15 },

  // CTA
  ctaBtn:         { borderRadius: Radii.xl, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.md },
  ctaBtnText:     { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },

  // Redo button
  redoBtn:        { borderWidth: 1.5, borderRadius: Radii.xl, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.md },
  redoBtnText:    { fontFamily: Fonts.bold, fontSize: 14 },
});
