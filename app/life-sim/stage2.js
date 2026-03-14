// app/life-sim/stage2.js
//
// Stage 2 — Your First Paycheck
//
// The user splits their income across Needs / Wants / Savings using sliders.
// Pre-filled at 70/30/0 — they have to actively fix it.
// No target markers — they apply what they learned.
// Fin is silent unless Savings = 0 at 100% total, then surfaces the implication.
// Soft nudge if Savings < 10% (can still proceed).
// Paycheck animation on entry.
//
// On completion: setBudget() + completeStage() → outfit 'notebook' unlocked.

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';
import { setBudget, completeStage, loadSimProgress } from '../../lib/lifeSim';
import { getIncomeBracket, formatDual, STAGES } from '../../constants/lifeSimStages';
import { getUnlockedOutfits, getNewOutfit } from '../../constants/avatars';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../../constants/theme';
import { auth } from '../../lib/firebase';
import { FinBubble, StageHeader, StageCompleteModal, DualAmount } from '../../components/LifeSimComponents';

const STAGE = STAGES.find(s => s.id === 'stage-2');

// ─── Paycheck float animation ─────────────────────────────────────────────────
function PaycheckToast({ amount, visible }) {
  const y  = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    y.setValue(0); op.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(y,  { toValue: -60, friction: 6, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(800),
      Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[pt.wrap, { opacity: op, transform: [{ translateY: y }] }]}>
      <Text style={pt.text}>💸  +{formatDual(amount).sgd} arrived!</Text>
    </Animated.View>
  );
}
const pt = StyleSheet.create({
  wrap: { position: 'absolute', alignSelf: 'center', top: 0, backgroundColor: Colors.successDark, borderRadius: Radii.full, paddingHorizontal: 20, paddingVertical: 10, zIndex: 100, ...Shadows.medium },
  text: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});

// ─── Single slider row ────────────────────────────────────────────────────────
function BudgetSlider({ label, icon, value, color, dollarAmt, income, onChange }) {
  const pct = Math.round((dollarAmt / income) * 100);
  return (
    <View style={sl.wrap}>
      <View style={sl.topRow}>
        <Text style={sl.icon}>{icon}</Text>
        <Text style={sl.label}>{label}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[sl.pct, { color }]}>{value}%</Text>
      </View>
      <Slider
        style={{ width: '100%', height: 36 }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={v => onChange(Math.round(v))}
        minimumTrackTintColor={color}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={color}
      />
      <Text style={[sl.dollar, { color }]}>{formatDual(dollarAmt).sgd} / month</Text>
    </View>
  );
}
const sl = StyleSheet.create({
  wrap:   { backgroundColor: Colors.white, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.soft },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  icon:   { fontSize: 18 },
  label:  { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary },
  pct:    { fontFamily: Fonts.extraBold, fontSize: 20, minWidth: 44, textAlign: 'right' },
  dollar: { fontFamily: Fonts.regular, fontSize: 12, marginTop: -4, paddingHorizontal: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Stage2() {
  const router     = useRouter();
  const profile    = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);

  const uid       = auth.currentUser?.uid;
  const finCoins  = profile?.finCoins ?? 0;
  const avatarId  = profile?.avatarId ?? 'alex';
  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const bracket   = getIncomeBracket(finCoins);
  const income    = bracket.income;

  // Budget sliders — pre-filled at 70/30/0 (the "bad default")
  const [needs,   setNeeds]   = useState(70);
  const [wants,   setWants]   = useState(30);
  const [savings, setSavings] = useState(0);

  const [saving,       setSaving]       = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [locked,       setLocked]       = useState(false);

  const scrollRef = useRef(null);

  // Show paycheck toast on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 2200);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const total     = needs + wants + savings;
  const remaining = 100 - total;
  const needsAmt   = Math.round((needs   / 100) * income);
  const wantsAmt   = Math.round((wants   / 100) * income);
  const savingsAmt = Math.round((savings / 100) * income);

  // ── Clamped slider change — total never exceeds 100 ───────────────────────
  const handleNeeds = useCallback((v) => {
    const clamped = Math.min(v, 100 - wants - savings);
    setNeeds(Math.max(0, clamped));
  }, [wants, savings]);

  const handleWants = useCallback((v) => {
    const clamped = Math.min(v, 100 - needs - savings);
    setWants(Math.max(0, clamped));
  }, [needs, savings]);

  const handleSavings = useCallback((v) => {
    const clamped = Math.min(v, 100 - needs - wants);
    setSavings(Math.max(0, clamped));
  }, [needs, wants]);

  // ── Fin's nudge logic ──────────────────────────────────────────────────────
  // Fin only speaks when savings = 0 AND total = 100
  const showFinNudge = savings === 0 && total === 100 && !locked;

  // Soft warning when savings is very low but non-zero
  const showSoftNudge = savings > 0 && savings < 10 && total === 100 && !locked;

  // ── Lock in budget ─────────────────────────────────────────────────────────
  const handleLockIn = async () => {
    if (saving || total !== 100) return;
    setSaving(true);
    setLocked(true);
    try {
      await setBudget(uid, {
        needsPct:   needs,
        wantsPct:   wants,
        savingsPct: savings,
        income,
      });

      const sim = await loadSimProgress(uid);
      await completeStage(uid, 'stage-2', {
        needsPct: needs, wantsPct: wants, savingsPct: savings,
        needsAmt, wantsAmt, savingsAmt,
      }, sim?.wallets ?? []);

      setProfile({ ...profile, finCoins: finCoins + 50 });
      setShowComplete(true);
    } catch (e) {
      console.error('Stage2 lockIn:', e);
      setLocked(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Outfit ─────────────────────────────────────────────────────────────────
  const completedStages = profile?.completedStages ?? [];
  const newOutfit       = getNewOutfit('stage-2');
  const unlockedOutfits = [
    ...getUnlockedOutfits(completedStages).map(o => o.id),
    ...(showComplete && newOutfit ? [newOutfit.id] : []),
  ];

  // ── Button state ───────────────────────────────────────────────────────────
  const canLock     = total === 100 && !locked;
  const btnColor    = canLock ? STAGE.color : Colors.border;
  const btnTextColor = canLock ? Colors.white : Colors.textMuted;

  // ── Budget bar (visual split) ──────────────────────────────────────────────
  const barSegments = [
    { pct: needs,   color: '#3AAECC' },   // teal — needs
    { pct: wants,   color: Colors.accent }, // orange — wants
    { pct: savings, color: Colors.successDark }, // green — savings
  ];

  return (
    <View style={s.container}>
      <StageHeader
        title={STAGE.title}
        color={STAGE.color}
        sim={null}
        onBack={() => router.back()}
      />

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Paycheck banner ── */}
        <View style={s.paycheckBannerWrap}>
          <PaycheckToast amount={income} visible={toastVisible} />
          <View style={[s.paycheckBanner, { backgroundColor: STAGE.colorLight, borderColor: STAGE.color + '50' }]}>
            <View>
              <Text style={s.paycheckLabel}>Your paycheck arrived</Text>
              <Text style={[s.paycheckAmount, { color: STAGE.color }]}>
                {formatDual(income).combined}
              </Text>
            </View>
            <View style={[s.bracketPill, { backgroundColor: STAGE.color + '20' }]}>
              <Text style={[s.bracketText, { color: STAGE.color }]}>
                {bracket.emoji} {bracket.label}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Intro ── */}
        <Text style={s.intro}>
          Before you spend a single dollar — you need a plan.{'\n'}
          Split your income across the three buckets below.
        </Text>

        {/* ── Visual budget bar ── */}
        <View style={s.barWrap}>
          {barSegments.map((seg, i) => (
            seg.pct > 0 && (
              <View
                key={i}
                style={[s.barSeg, { flex: seg.pct, backgroundColor: seg.color }]}
              />
            )
          ))}
          {remaining > 0 && (
            <View style={[s.barSeg, { flex: remaining, backgroundColor: Colors.lightGray }]} />
          )}
        </View>

        {/* ── Total indicator ── */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Allocated</Text>
          <Text style={[
            s.totalValue,
            total === 100 && { color: Colors.successDark },
            total > 100  && { color: Colors.danger },
          ]}>
            {total}%
            {total === 100 ? '  ✓' : total > 100 ? '  ↑ over' : `  (${remaining}% unallocated)`}
          </Text>
        </View>

        {/* ── Sliders ── */}
        <BudgetSlider
          label="Needs"
          icon="🏠"
          value={needs}
          color="#3AAECC"
          dollarAmt={needsAmt}
          income={income}
          onChange={handleNeeds}
        />
        <BudgetSlider
          label="Wants"
          icon="🎉"
          value={wants}
          color={Colors.accent}
          dollarAmt={wantsAmt}
          income={income}
          onChange={handleWants}
        />
        <BudgetSlider
          label="Savings"
          icon="💰"
          value={savings}
          color={Colors.successDark}
          dollarAmt={savingsAmt}
          income={income}
          onChange={handleSavings}
        />

        {/* ── Fin's nudge (only when savings = 0 and total = 100) ── */}
        {showFinNudge && (
          <FinBubble
            text={`You've allocated $0 to savings — that's ${formatDual(0).sgd}/month going toward your future. At this rate, your FI Number takes... well, forever. Is that intentional, ${firstName}?`}
          />
        )}

        {/* ── Soft nudge (savings > 0 but < 10%) ── */}
        {showSoftNudge && (
          <View style={[s.softNudge, { backgroundColor: Colors.warningLight, borderColor: Colors.warningDark + '40' }]}>
            <Text style={[s.softNudgeText, { color: Colors.warningDark }]}>
              💡  Most financial advisors recommend at least 20% to savings. You've set {savings}% — that's {formatDual(savingsAmt).sgd}/month. You can still proceed, but consider adjusting.
            </Text>
          </View>
        )}

        {/* ── Breakdown preview (once total = 100) ── */}
        {total === 100 && (
          <View style={[s.breakdownCard, { borderColor: STAGE.color + '40' }]}>
            <Text style={[s.breakdownTitle, { color: STAGE.color }]}>Your monthly budget</Text>
            {[
              { label: 'Needs',   emoji: '🏠', pct: needs,   amt: needsAmt,   color: '#3AAECC' },
              { label: 'Wants',   emoji: '🎉', pct: wants,   amt: wantsAmt,   color: Colors.accent },
              { label: 'Savings', emoji: '💰', pct: savings, amt: savingsAmt, color: Colors.successDark },
            ].map(row => (
              <View key={row.label} style={s.breakdownRow}>
                <Text style={s.breakdownEmoji}>{row.emoji}</Text>
                <Text style={s.breakdownLabel}>{row.label}</Text>
                <Text style={[s.breakdownPct, { color: row.color }]}>{row.pct}%</Text>
                <Text style={s.breakdownAmt}>{formatDual(row.amt).sgd}</Text>
              </View>
            ))}
            {savings > 0 && (
              <View style={[s.savingsNote, { backgroundColor: Colors.successLight }]}>
                <Text style={[s.savingsNoteText, { color: Colors.successDark }]}>
                  {formatDual(savingsAmt).sgd}/month saved = {formatDual(savingsAmt * 12).sgd}/year toward your FI Number
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Lock in button ── */}
        <TouchableOpacity
          style={[s.lockBtn, { backgroundColor: btnColor }]}
          onPress={handleLockIn}
          disabled={!canLock || saving}
          activeOpacity={canLock ? 0.8 : 1}
        >
          <Text style={[s.lockBtnText, { color: btnTextColor }]}>
            {saving
              ? 'Saving…'
              : total !== 100
              ? `Allocate ${remaining > 0 ? `${remaining}% more` : 'exactly 100%'} to continue`
              : 'Lock in my budget →'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      <StageCompleteModal
        visible={showComplete}
        stageTitle={STAGE.title}
        outfitItem={newOutfit}
        avatarId={avatarId}
        unlockedOutfits={unlockedOutfits}
        onContinue={() => { setShowComplete(false); router.replace('/(tabs)/simulate'); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  scroll:          { flex: 1 },
  content:         { padding: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 60 },

  // Paycheck
  paycheckBannerWrap: { position: 'relative', marginBottom: Spacing.lg },
  paycheckBanner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.md },
  paycheckLabel:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  paycheckAmount:  { fontFamily: Fonts.extraBold, fontSize: 22 },
  bracketPill:     { borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 6 },
  bracketText:     { fontFamily: Fonts.bold, fontSize: 12 },

  // Intro
  intro:           { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.lg },

  // Budget bar
  barWrap:         { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: Spacing.sm, backgroundColor: Colors.lightGray },
  barSeg:          { height: 10 },

  // Total
  totalRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, paddingHorizontal: 2 },
  totalLabel:      { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textMuted },
  totalValue:      { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },

  // Soft nudge
  softNudge:       { borderWidth: 1, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md },
  softNudgeText:   { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 20 },

  // Breakdown card
  breakdownCard:   { backgroundColor: Colors.white, borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  breakdownTitle:  { fontFamily: Fonts.bold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: Spacing.sm },
  breakdownRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 8 },
  breakdownEmoji:  { fontSize: 16, width: 22 },
  breakdownLabel:  { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  breakdownPct:    { fontFamily: Fonts.bold, fontSize: 14, minWidth: 36, textAlign: 'right' },
  breakdownAmt:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, minWidth: 70, textAlign: 'right' },
  savingsNote:     { borderRadius: Radii.sm, padding: Spacing.sm, marginTop: Spacing.sm },
  savingsNoteText: { fontFamily: Fonts.semiBold, fontSize: 12, textAlign: 'center' },

  // Lock button
  lockBtn:         { borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center' },
  lockBtnText:     { fontFamily: Fonts.bold, fontSize: 15 },
});