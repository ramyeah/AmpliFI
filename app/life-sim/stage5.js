// app/life-sim/stage5.js
//
// Stage 5 — Set Your Budget
//
// The user has now tracked a full month of spending (Stage 4).
// They've seen where their money went. Now they lock in a forward-looking
// 50/30/20 budget — but this time informed by real spending data.
//
// Key difference from a generic budget exercise:
//   Stage 4 showed them their ACTUAL spend. Fin surfaces the gap.
//   This stage asks: "Given what you know, what's your target split?"
//   The sliders start pre-filled at the user's actual Stage 4 percentages,
//   so they can see what they'd need to change to hit 50/30/20.
//
// Flow:
//   1. Fin opens with a 2-sentence summary of what Stage 4 revealed
//   2. "Actual vs Target" comparison — their real split vs 50/30/20
//   3. Sliders (pre-filled at actual) — user adjusts to a plan they commit to
//   4. Fin gives RAG feedback on the locked budget (as in old stage2)
//   5. StageCompleteModal → outfit 'calculator' unlocked
//
// Saves: stage5Data { needsPct, wantsPct, savingsPct, needsAmt, wantsAmt, savingsAmt }
// Also saves top-level monthlyBudget alias for backwards compat
// Gate:  lesson '2-2' — The 50/30/20 Rule
// Outfit unlock: 'calculator'

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
import { ragAsk } from '../../lib/api';
import { FinBubble, StageHeader, StageCompleteModal, DualAmount } from '../../components/LifeSimComponents';

const STAGE = STAGES.find(s => s.id === 'stage-5');

// ─── Actual vs Target comparison row ─────────────────────────────────────────
function CompareRow({ label, icon, actualPct, actualAmt, targetPct, color }) {
  const over  = actualPct > targetPct + 5;
  const under = actualPct < targetPct - 5;
  const diff  = actualPct - targetPct;

  return (
    <View style={cr.row}>
      <Text style={cr.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <View style={cr.labelRow}>
          <Text style={cr.label}>{label}</Text>
          <View style={[cr.pill, over && cr.pillOver, under && cr.pillUnder]}>
            <Text style={[cr.pillText, over && cr.pillTextOver, under && cr.pillTextUnder]}>
              {over ? `+${diff}%` : under ? `${diff}%` : 'On target'}
            </Text>
          </View>
        </View>
        <View style={cr.bars}>
          {/* Actual */}
          <View style={cr.barRow}>
            <Text style={cr.barLabel}>Actual</Text>
            <View style={cr.barTrack}>
              <View style={[cr.barFill, { width: `${Math.min(actualPct, 100)}%`, backgroundColor: over ? Colors.danger : color }]} />
            </View>
            <Text style={[cr.barPct, over && { color: Colors.danger }]}>{actualPct}%</Text>
          </View>
          {/* Target */}
          <View style={cr.barRow}>
            <Text style={cr.barLabel}>Target</Text>
            <View style={cr.barTrack}>
              <View style={[cr.barFill, { width: `${targetPct}%`, backgroundColor: color + '50' }]} />
            </View>
            <Text style={[cr.barPct, { color: Colors.textMuted }]}>{targetPct}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const cr = StyleSheet.create({
  row:          { marginBottom: Spacing.md },
  icon:         { fontSize: 20, marginRight: 10, marginTop: 2 },
  labelRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label:        { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  pill:         { borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Colors.successLight },
  pillOver:     { backgroundColor: Colors.dangerLight },
  pillUnder:    { backgroundColor: Colors.warningLight },
  pillText:     { fontFamily: Fonts.bold, fontSize: 10, color: Colors.successDark },
  pillTextOver: { color: Colors.danger },
  pillTextUnder:{ color: Colors.warningDark },
  bars:         { gap: 4 },
  barRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel:     { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, width: 38 },
  barTrack:     { flex: 1, height: 6, backgroundColor: Colors.lightGray, borderRadius: 3, overflow: 'hidden' },
  barFill:      { height: 6, borderRadius: 3 },
  barPct:       { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textPrimary, width: 30, textAlign: 'right' },
});

// ─── Budget slider row ────────────────────────────────────────────────────────
function SliderRow({ label, icon, value, onChange, color, income, locked }) {
  const amt = Math.round((value / 100) * income);
  return (
    <View style={sl.wrap}>
      <View style={sl.header}>
        <Text style={sl.icon}>{icon}</Text>
        <Text style={sl.label}>{label}</Text>
        <Text style={[sl.pct, { color }]}>{value}%</Text>
        <Text style={[sl.dollar, { color }]}>{formatDual(amt).sgd} / month</Text>
      </View>
      <Slider
        style={sl.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={value}
        onValueChange={locked ? undefined : onChange}
        minimumTrackTintColor={locked ? Colors.border : color}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={locked ? Colors.border : color}
        disabled={locked}
      />
    </View>
  );
}

const sl = StyleSheet.create({
  wrap:   { marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  icon:   { fontSize: 18 },
  label:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  pct:    { fontFamily: Fonts.extraBold, fontSize: 18, minWidth: 44, textAlign: 'right' },
  dollar: { fontFamily: Fonts.semiBold, fontSize: 11, minWidth: 80, textAlign: 'right' },
  slider: { width: '100%', height: 36 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Stage5() {
  const router     = useRouter();
  const profile    = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);

  const uid       = auth.currentUser?.uid;
  const finCoins  = profile?.finCoins ?? 0;
  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const bracket   = getIncomeBracket(finCoins);
  const income    = bracket.income;

  // Sliders — pre-filled from actual Stage 4 spending, or default 70/20/10
  const [needs,   setNeeds]   = useState(70);
  const [wants,   setWants]   = useState(20);
  const [savings, setSavings] = useState(10);

  // Actual spending percentages from Stage 4 (for comparison)
  const [actual, setActual]  = useState(null);  // { needs, wants, savings }

  const [locked,          setLocked]          = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [showComplete,    setShowComplete]    = useState(false);
  const [finContext,      setFinContext]       = useState(null);
  const [loadingContext,  setLoadingContext]   = useState(true);
  const [finFeedback,     setFinFeedback]     = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const scrollRef    = useRef(null);
  const contextFired = useRef(false);

  // Load sim — get Stage 4 actual spending to pre-fill sliders
  useEffect(() => {
    if (!uid) return;
    loadSimProgress(uid).then(sim => {
      const stage3 = sim?.stage3Data;
      if (stage3?.totals) {
        // Convert actual SGD totals to percentages of income
        const total = stage3.totals.needs + stage3.totals.wants + (stage3.totals.savings ?? 0);
        if (total > 0) {
          const actualNeeds   = Math.round((stage3.totals.needs   / income) * 100);
          const actualWants   = Math.round((stage3.totals.wants   / income) * 100);
          const actualSavings = Math.max(0, 100 - actualNeeds - actualWants);
          setActual({ needs: actualNeeds, wants: actualWants, savings: actualSavings });
          // Pre-fill sliders at actual values so they see the gap clearly
          setNeeds(Math.min(actualNeeds, 100));
          setWants(Math.min(actualWants, 100 - Math.min(actualNeeds, 100)));
          setSavings(Math.max(0, 100 - Math.min(actualNeeds, 100) - Math.min(actualWants, 100 - Math.min(actualNeeds, 100))));
        }
      }
      // Fire Fin context once
      if (!contextFired.current) {
        contextFired.current = true;
        fireFinContext(sim);
      }
    }).catch(console.error);
  }, [uid]);

  const fireFinContext = async (sim) => {
    setLoadingContext(true);
    const stage3 = sim?.stage3Data;
    const cut    = stage3?.cutLabel;
    try {
      const result = await ragAsk(
        'budgeting 50/30/20 rule Singapore student spending habits',
        `You are Fin. ${firstName} just finished tracking their first month of spending in Singapore (Stage 4).
What they spent: Needs $${stage3?.totals?.needs?.toFixed(0) ?? '?'}, Wants $${stage3?.totals?.wants?.toFixed(0) ?? '?'}.
${cut ? `The one thing they said they'd cut: ${cut}.` : ''}
Their monthly income: $${income}.

In 2 sentences: summarise what their spending data revealed and frame why setting a forward-looking budget matters now. Be direct and specific — use their actual numbers.`,
        { name: firstName }
      );
      setFinContext(result?.response ?? null);
    } catch { setFinContext(null); }
    finally  { setLoadingContext(false); }
  };

  // ── Slider logic — total never exceeds 100 ────────────────────────────────
  const total     = needs + wants + savings;
  const remaining = 100 - total;

  const handleNeeds = useCallback((v) => {
    setNeeds(Math.min(Math.max(0, Math.round(v)), 100 - wants - savings));
  }, [wants, savings]);

  const handleWants = useCallback((v) => {
    setWants(Math.min(Math.max(0, Math.round(v)), 100 - needs - savings));
  }, [needs, savings]);

  const handleSavings = useCallback((v) => {
    setSavings(Math.min(Math.max(0, Math.round(v)), 100 - needs - wants));
  }, [needs, wants]);

  const needsAmt   = Math.round((needs   / 100) * income);
  const wantsAmt   = Math.round((wants   / 100) * income);
  const savingsAmt = Math.round((savings / 100) * income);

  // Zero savings nudge
  const showZeroSavingsNudge = savings === 0 && total === 100 && !locked;
  const showLowSavingsNudge  = savings > 0 && savings < 10 && total === 100 && !locked;

  // ── Lock in budget ─────────────────────────────────────────────────────────
  const handleLockIn = async () => {
    if (saving || total !== 100) return;
    setSaving(true);
    setLocked(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });

    // Fire Fin feedback async
    setLoadingFeedback(true);
    ragAsk(
      'budgeting Singapore student 50/30/20 savings rate',
      `You are Fin. ${firstName} just locked in their first budget in Singapore.
Budget: ${needs}% Needs ($${needsAmt}), ${wants}% Wants ($${wantsAmt}), ${savings}% Savings ($${savingsAmt}).
Monthly income: $${income}.
${actual ? `Their actual Stage 4 spending was: ${actual.needs}% Needs, ${actual.wants}% Wants, ${actual.savings}% Savings.` : ''}
${savings === 0 ? 'They set savings to 0%.' : ''}

3 sentences: (1) what their split gets right, (2) one specific Singapore context observation about their numbers, (3) one concrete next step. Use dollar amounts. No generic praise.`,
      { name: firstName }
    ).then(r => {
      setFinFeedback(r?.response ?? null);
      setLoadingFeedback(false);
    }).catch(() => setLoadingFeedback(false));

    try {
      const sim = await loadSimProgress(uid);
      await completeStage(uid, 'stage-5', {
        needsPct: needs, wantsPct: wants, savingsPct: savings,
        needsAmt, wantsAmt, savingsAmt,
      }, sim?.wallets ?? []);
      // setBudget writes monthlyBudget alias for backwards compat
      await setBudget(uid, { needsPct: needs, wantsPct: wants, savingsPct: savings, income });
      setProfile({ ...profile, finCoins: finCoins + 50 });
      setShowComplete(true);
    } catch (e) {
      console.error('Stage5 lockIn:', e);
      setLocked(false);
    } finally {
      setSaving(false);
    }
  };

  const completedStages = profile?.completedStages ?? [];
  const newOutfit       = getNewOutfit('stage-5');
  const unlockedOutfits = [
    ...getUnlockedOutfits(completedStages).map(o => o.id),
    ...(showComplete && newOutfit ? [newOutfit.id] : []),
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
        {/* ── Fin context from Stage 4 ── */}
        {(loadingContext || finContext) && (
          <FinBubble text={finContext ?? ''} loading={loadingContext} />
        )}

        {/* ── Actual vs Target comparison ── */}
        {actual && !locked && (
          <View style={[s.compareCard, { borderColor: STAGE.color + '30' }]}>
            <Text style={[s.compareTitle, { color: STAGE.color }]}>
              📊  Your Month 2 reality vs the 50/30/20 target
            </Text>
            <CompareRow
              label="Needs"  icon="🏠"
              actualPct={actual.needs}  targetPct={50}
              color={Colors.textPrimary}
            />
            <CompareRow
              label="Wants"  icon="🛍️"
              actualPct={actual.wants}  targetPct={30}
              color={STAGE.color}
            />
            <CompareRow
              label="Savings" icon="💰"
              actualPct={actual.savings} targetPct={20}
              color={Colors.successDark}
            />
          </View>
        )}

        {/* ── Budget sliders ── */}
        <View style={[s.sliderCard, locked && s.sliderCardLocked]}>
          <Text style={s.sliderCardTitle}>
            {locked ? '✓  Your budget is locked in' : 'Set your forward budget'}
          </Text>
          {!locked && (
            <Text style={s.sliderCardSub}>
              Adjust the sliders until the total reaches 100%. These percentages apply to every future month.
            </Text>
          )}

          <SliderRow
            label="Needs"   icon="🏠" value={needs}
            onChange={handleNeeds}   color={Colors.textPrimary}
            income={income}          locked={locked}
          />
          <SliderRow
            label="Wants"   icon="🛍️" value={wants}
            onChange={handleWants}   color={STAGE.color}
            income={income}          locked={locked}
          />
          <SliderRow
            label="Savings" icon="💰" value={savings}
            onChange={handleSavings} color={Colors.successDark}
            income={income}          locked={locked}
          />

          {/* Total indicator */}
          <View style={[s.totalRow, total > 100 && { backgroundColor: Colors.dangerLight }]}>
            <Text style={[s.totalLabel, total > 100 && { color: Colors.danger }]}>Total</Text>
            <Text style={[s.totalPct, total === 100 && { color: Colors.successDark }, total > 100 && { color: Colors.danger }]}>
              {total}%
            </Text>
            {remaining > 0 && (
              <Text style={s.remaining}>{remaining}% unallocated</Text>
            )}
          </View>
        </View>

        {/* ── Nudges ── */}
        {showZeroSavingsNudge && (
          <FinBubble
            text={`You've set savings to 0%. At that rate your FI Number is unreachable — compounding needs consistent contributions. Is that intentional, ${firstName}?`}
            loading={false}
          />
        )}
        {showLowSavingsNudge && (
          <View style={[s.nudge, { backgroundColor: Colors.warningLight }]}>
            <Text style={s.nudgeText}>
              💡  Most advisors recommend at least 20% savings. You've set {savings}% — that's {formatDual(savingsAmt).sgd}/month. You can proceed, but consider adjusting.
            </Text>
          </View>
        )}

        {/* ── Fin feedback (post lock-in) ── */}
        {locked && (loadingFeedback || finFeedback) && (
          <FinBubble text={finFeedback ?? ''} loading={loadingFeedback} />
        )}

        {/* ── CTA ── */}
        {!locked && (
          <TouchableOpacity
            style={[
              s.lockBtn,
              { backgroundColor: total === 100 ? STAGE.color : Colors.border },
            ]}
            onPress={handleLockIn}
            disabled={saving || total !== 100}
            activeOpacity={0.85}
          >
            <Text style={[s.lockBtnText, total !== 100 && { color: Colors.textMuted }]}>
              {total === 100 ? 'Lock in this budget →' : `${total}/100% allocated`}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <StageCompleteModal
        visible={showComplete}
        stageTitle={STAGE.title}
        outfitItem={newOutfit}
        avatarId={profile?.avatarId ?? 'alex'}
        unlockedOutfits={unlockedOutfits}
        onContinue={() => {
          setShowComplete(false);
          router.replace('/(tabs)/simulate');
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  scroll:          { flex: 1 },
  content:         { padding: Spacing.lg, paddingTop: Spacing.md },

  compareCard:     { backgroundColor: Colors.white, borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  compareTitle:    { fontFamily: Fonts.bold, fontSize: 13, marginBottom: Spacing.md },

  sliderCard:      { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.soft },
  sliderCardLocked:{ borderColor: STAGE?.color + '40', borderWidth: 1.5 },
  sliderCardTitle: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  sliderCardSub:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 18 },

  totalRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: Spacing.sm, marginTop: 4 },
  totalLabel:      { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted, flex: 1 },
  totalPct:        { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary },
  remaining:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },

  nudge:           { borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md },
  nudgeText:       { fontFamily: Fonts.regular, fontSize: 12, color: Colors.warningDark, lineHeight: 18 },

  lockBtn:         { borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center', marginBottom: Spacing.md },
  lockBtnText:     { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});