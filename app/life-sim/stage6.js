// app/life-sim/stage5.js
//
// Stage 5 — Build Your Emergency Fund
//
// The user allocates a portion of their monthly savings toward an emergency fund
// over multiple simulated months. One random life event fires at a surprise month
// (between months 2–4) showing the "with fund" vs "without fund" parallel paths.
// Stage completes when the fund reaches 1 month of their Needs expenses.
//
// Flow:
//   1. StageHeader + fund meter (ProgressBar from LifeSimComponents)
//   2. Fin intro bubble explaining the 3-month rule
//   3. Month view — income breakdown, allocation slider (savings % → fund)
//   4. "Advance month" CTA → applies interest, appends history entry
//   5. Surprise event modal (fires once, random month 2–4)
//      — with-fund / without-fund side-by-side comparison
//      — Fin RAG message contextualised to the event
//   6. Completion when fund >= monthlyNeeds
//   7. StageCompleteModal → outfit 'shield' unlocked
//
// Data:
//   EMERGENCY_EVENTS     — from constants/lifeSimStages.js
//   WALLET_TEMPLATES     — bank + emergencyFund templates
//   completeStage        — marks complete, saves summary fields
//   updateWallet         — updates balance on a wallet by id
//   saveSimProgress      — persists arbitrary fields to simProgress doc

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Modal, Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';
import {
  completeStage, loadSimProgress, saveSimProgress, updateWallet,
} from '../../lib/lifeSim';
import {
  STAGES, EMERGENCY_EVENTS, WALLET_TEMPLATES, formatDual,
} from '../../constants/lifeSimStages';
import { getUnlockedOutfits, getNewOutfit } from '../../constants/avatars';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../../constants/theme';
import { auth } from '../../lib/firebase';
import { ragAsk } from '../../lib/api';
import {
  FinBubble, StageHeader, StageCompleteModal, ProgressBar,
} from '../../components/LifeSimComponents';

const STAGE = STAGES.find(s => s.id === 'stage-6');

// Month when the surprise event fires (randomised once on mount: 2, 3, or 4)
const pickEventMonth = () => 2 + Math.floor(Math.random() * 3);

// ─── Month history strip ───────────────────────────────────────────────────────
function MonthHistory({ history, color }) {
  if (!history?.length) return null;
  return (
    <View style={mh.wrap}>
      <Text style={mh.title}>Fund history</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={mh.rail}>
        {history.map((h, i) => (
          <View key={i} style={[mh.chip, { borderColor: color + '30' }]}>
            <Text style={mh.chipMonth}>Mo {h.month}</Text>
            <Text style={[mh.chipAmt, { color }]}>{formatDual(h.fundBalance).sgd}</Text>
            {h.eventFired && <Text style={mh.eventDot}>⚡</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
const mh = StyleSheet.create({
  wrap:      { marginBottom: Spacing.md },
  title:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  rail:      { gap: 8, paddingRight: Spacing.lg },
  chip:      { backgroundColor: Colors.white, borderWidth: 1.5, borderRadius: Radii.md, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 72, ...Shadows.soft },
  chipMonth: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 3 },
  chipAmt:   { fontFamily: Fonts.extraBold, fontSize: 13 },
  eventDot:  { fontSize: 10, marginTop: 3 },
});

// ─── Surprise event modal ──────────────────────────────────────────────────────
function EventModal({ visible, event, fundBalance, onDismiss }) {
  const slideY   = useRef(new Animated.Value(400)).current;
  const [finMsg, setFinMsg]   = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFund = fundBalance > 0;
  const covered = fundBalance >= (event?.amount ?? 0);

  useEffect(() => {
    if (!visible || !event) return;
    slideY.setValue(400);
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }).start();
    fireFinMessage();
  }, [visible]);

  const fireFinMessage = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const result = await ragAsk(
        `emergency fund Singapore ${event.category} unexpected expense`,
        `You are Fin. An NTU student just experienced an unexpected expense: "${event.title}" — $${event.amount}.
Their emergency fund balance: $${Math.round(fundBalance)}.
${hasFund ? `The fund ${covered ? 'fully covers' : 'partially covers'} this expense.` : 'They have no emergency fund yet.'}

In 2 sentences, explain what this event teaches about emergency funds. Reference the specific amount and situation. Be direct and educational — no generic advice.`,
        {}
      );
      setFinMsg(result?.response ?? event.finMessage);
    } catch {
      setFinMsg(event.finMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;
  const withPath    = event.withFundPath;
  const withoutPath = event.withoutFundPath.replace(
    '{weeks}',
    Math.ceil(event.amount / ((fundBalance || 100) / 4))
  );

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={ev.backdrop}>
        <Animated.View style={[ev.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={[ev.handle, { backgroundColor: STAGE.color }]} />

          <View style={ev.eventHeader}>
            <Text style={ev.eventIcon}>{event.icon}</Text>
            <View style={{ flex: 1 }}>
              <View style={ev.surprisePill}>
                <Text style={ev.surpriseText}>⚡ Life event</Text>
              </View>
              <Text style={ev.eventTitle}>{event.title}</Text>
              <Text style={ev.eventDesc}>{event.description}</Text>
            </View>
          </View>

          <View style={ev.amountRow}>
            <Text style={ev.amountLabel}>Unexpected cost</Text>
            <Text style={ev.amountVal}>{formatDual(event.amount).sgd}</Text>
          </View>

          {/* Side-by-side comparison */}
          <View style={ev.compareRow}>
            <View style={[ev.compareSide, ev.withFund, { opacity: hasFund ? 1 : 0.4 }]}>
              <Text style={ev.compareLabel}>🛡️ With fund</Text>
              <Text style={ev.compareText}>{withPath}</Text>
            </View>
            <View style={[ev.compareSide, ev.withoutFund]}>
              <Text style={ev.compareLabel}>😰 Without</Text>
              <Text style={ev.compareText}>{withoutPath}</Text>
            </View>
          </View>

          <FinBubble text={finMsg ?? ''} loading={loading} small />

          <TouchableOpacity
            style={[ev.dismissBtn, { backgroundColor: STAGE.color }]}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Text style={ev.dismissBtnText}>Got it — keep building →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const ev = StyleSheet.create({
  backdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingTop: Spacing.md, maxHeight: '90%' },
  handle:        { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  eventHeader:   { flexDirection: 'row', gap: 12, marginBottom: Spacing.md },
  eventIcon:     { fontSize: 36, marginTop: 4 },
  surprisePill:  { alignSelf: 'flex-start', backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 5 },
  surpriseText:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.warningDark },
  eventTitle:    { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, marginBottom: 4 },
  eventDesc:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  amountRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.dangerLight, borderRadius: Radii.md, paddingHorizontal: 14, paddingVertical: 10, marginBottom: Spacing.md },
  amountLabel:   { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.dangerDark },
  amountVal:     { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.danger },
  compareRow:    { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  compareSide:   { flex: 1, borderRadius: Radii.md, padding: Spacing.sm },
  withFund:      { backgroundColor: Colors.successLight },
  withoutFund:   { backgroundColor: Colors.dangerLight },
  compareLabel:  { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textPrimary, marginBottom: 4 },
  compareText:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  dismissBtn:    { borderRadius: Radii.lg, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  dismissBtnText:{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
});

// ─── Month allocation card ─────────────────────────────────────────────────────
function MonthCard({ month, income, savingsAmt, fundPct, onFundPctChange, onAdvance, advancing, canComplete, color }) {
  const fundContrib = Math.round(savingsAmt * (fundPct / 100));
  const remainder   = savingsAmt - fundContrib;

  return (
    <View style={[mc.card, { borderColor: color + '30' }]}>
      <View style={mc.header}>
        <View style={[mc.monthBadge, { backgroundColor: color }]}>
          <Text style={mc.monthText}>Month {month}</Text>
        </View>
        <Text style={mc.incomeLabel}>{formatDual(income).sgd} income</Text>
      </View>

      <Text style={mc.sliderLabel}>
        How much of your savings goes to the emergency fund?
      </Text>
      <Text style={[mc.sliderPct, { color }]}>{fundPct}%</Text>
      <Slider
        style={mc.slider}
        minimumValue={0}
        maximumValue={100}
        step={5}
        value={fundPct}
        onValueChange={onFundPctChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={color}
      />

      {/* Breakdown */}
      <View style={mc.breakdownRow}>
        <View style={mc.breakdownItem}>
          <Text style={mc.breakdownLabel}>→ Emergency fund</Text>
          <Text style={[mc.breakdownAmt, { color }]}>+{formatDual(fundContrib).sgd}</Text>
        </View>
        <View style={mc.breakdownItem}>
          <Text style={mc.breakdownLabel}>→ Other savings</Text>
          <Text style={mc.breakdownAmt}>{formatDual(remainder).sgd}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[mc.advanceBtn, { backgroundColor: advancing ? Colors.border : color }]}
        onPress={onAdvance}
        disabled={advancing}
        activeOpacity={0.85}
      >
        <Text style={[mc.advanceBtnText, advancing && { color: Colors.textMuted }]}>
          {advancing ? 'Saving…' : canComplete ? 'Complete Stage 5 →' : `Advance to Month ${month + 1} →`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const mc = StyleSheet.create({
  card:          { backgroundColor: Colors.white, borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  monthBadge:    { borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 4 },
  monthText:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.white },
  incomeLabel:   { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textSecondary },
  sliderLabel:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  sliderPct:     { fontFamily: Fonts.extraBold, fontSize: 28, marginBottom: 0 },
  slider:        { width: '100%', height: 40 },
  breakdownRow:  { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  breakdownItem: { flex: 1, backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: Spacing.sm },
  breakdownLabel:{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 3 },
  breakdownAmt:  { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  advanceBtn:    { borderRadius: Radii.md, paddingVertical: 13, alignItems: 'center' },
  advanceBtnText:{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
});

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function Stage5() {
  const router     = useRouter();
  const profile    = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);

  const uid       = auth.currentUser?.uid;
  const finCoins  = profile?.finCoins ?? 0;
  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  // ── Core sim state ─────────────────────────────────────────────────────────
  const [sim,          setSim]          = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [advancing,    setAdvancing]    = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  // ── Month / fund state ─────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(1);
  const [fundBalance,  setFundBalance]  = useState(0);
  const [fundPct,      setFundPct]      = useState(50);   // % of savings → fund
  const [history,      setHistory]      = useState([]);   // [{month, fundBalance, eventFired}]

  // ── Surprise event ─────────────────────────────────────────────────────────
  const eventMonth   = useRef(pickEventMonth());
  const [activeEvent,  setActiveEvent]  = useState(null);
  const [eventFired,   setEventFired]   = useState(false);
  const [showEvent,    setShowEvent]    = useState(false);

  // ── Fin intro ──────────────────────────────────────────────────────────────
  const [finIntro,     setFinIntro]     = useState(null);
  const [loadingIntro, setLoadingIntro] = useState(true);
  const introFired = useRef(false);

  // ── Load sim on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    loadSimProgress(uid).then(data => {
      setSim(data);

      // Restore month progress if returning to stage
      const s5 = data?.stage5Progress;
      if (s5) {
        setCurrentMonth(s5.currentMonth ?? 1);
        setFundBalance(s5.fundBalance ?? 0);
        setHistory(s5.history ?? []);
        setEventFired(s5.eventFired ?? false);
      } else {
        // Init emergency fund wallet if not yet created
        ensureEmergencyFundWallet(uid, data);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [uid]);

  // ── Fire Fin intro once sim loads ─────────────────────────────────────────
  useEffect(() => {
    if (!sim || introFired.current) return;
    introFired.current = true;
    fireFinIntro(sim);
  }, [sim]);

  const ensureEmergencyFundWallet = async (uid, simData) => {
    if (!simData) return;
    const alreadyHasFund = (simData.wallets ?? []).some(w => w.id === 'emergency-fund');
    if (alreadyHasFund) return;

    const monthlyNeeds = simData.monthlyBudget?.needsAmt ?? Math.round((simData.income ?? 2000) * 0.5);
    const bankWallet   = (simData.wallets ?? []).find(w => w.type === 'bank');

    const fundWallet = {
      ...WALLET_TEMPLATES.emergencyFund,
      target:      monthlyNeeds * 3,   // 3-month goal; completes at 1 month
      interestRate: bankWallet?.interestRate ?? 0.0005,
      institution:  bankWallet?.institution ?? null,
      linkedTo:     bankWallet?.id ?? null,
      color:        Colors.successDark,
      colorLight:   Colors.successLight,
    };

    const updatedWallets = [...(simData.wallets ?? []), fundWallet];
    await saveSimProgress(uid, { ...simData, wallets: updatedWallets });
    setSim({ ...simData, wallets: updatedWallets });
  };

  const fireFinIntro = async (simData) => {
    setLoadingIntro(true);
    const monthlyNeeds = simData?.monthlyBudget?.needsAmt ?? Math.round((simData?.income ?? 2000) * 0.5);
    try {
      const result = await ragAsk(
        'emergency fund Singapore 3-month rule financial safety net',
        `You are Fin, an advisor for NTU international students in Singapore.
${firstName} just opened their bank account (Stage 4) and is now starting to build an emergency fund.

Their profile:
- Monthly income: $${simData?.income ?? 2000}
- Monthly needs (fixed expenses): $${monthlyNeeds}
- 1-month target: $${monthlyNeeds} · 3-month target: $${monthlyNeeds * 3}
- Bank: ${(simData?.wallets ?? []).find(w => w.type === 'bank')?.institution ?? 'Singapore bank'}

In 2 sentences: explain what an emergency fund is and why the 3-month rule exists. Be concrete — use their actual dollar amounts. This is the intro before they start allocating.`,
        { name: firstName }
      );
      setFinIntro(result?.response ?? `An emergency fund is a ring-fenced buffer covering 3 months of your fixed expenses — in your case, $${monthlyNeeds * 3}. It's what stands between you and going into debt when life surprises you: a cracked phone screen, a medical bill, a sudden repair.`);
    } catch {
      const monthlyNeeds = simData?.monthlyBudget?.needsAmt ?? Math.round((simData?.income ?? 2000) * 0.5);
      setFinIntro(`An emergency fund is a ring-fenced buffer covering 3 months of your fixed expenses — in your case, $${monthlyNeeds * 3}. It's what stands between you and going into debt when life surprises you.`);
    } finally {
      setLoadingIntro(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const income       = sim?.income ?? 2000;
  const savingsAmt   = sim?.monthlyBudget?.savingsAmt ?? Math.round(income * 0.2);
  const monthlyNeeds = sim?.monthlyBudget?.needsAmt   ?? Math.round(income * 0.5);
  const fundTarget   = monthlyNeeds * 3;
  const fundWallet   = (sim?.wallets ?? []).find(w => w.id === 'emergency-fund');
  const bankWallet   = (sim?.wallets ?? []).find(w => w.type === 'bank');

  // Completion = fund >= 1 month of Needs
  const canComplete  = fundBalance >= monthlyNeeds;
  const fundContrib  = Math.round(savingsAmt * (fundPct / 100));

  // ── Advance month handler ──────────────────────────────────────────────────
  const handleAdvance = useCallback(async () => {
    if (advancing) return;

    // If already complete, go straight to completion
    if (canComplete) {
      await handleComplete();
      return;
    }

    setAdvancing(true);
    try {
      // 1. Calculate new fund balance with monthly contribution + interest
      const interestRate    = bankWallet?.interestRate ?? 0.0005;
      const monthlyInterest = fundBalance * (interestRate / 12);
      const newFundBalance  = Math.round(fundBalance + fundContrib + monthlyInterest);

      // 2. Check if event fires this month
      const nextMonth  = currentMonth + 1;
      const fireEvent  = !eventFired && currentMonth === eventMonth.current;
      let   resolvedFundBalance = newFundBalance;

      if (fireEvent) {
        const event = EMERGENCY_EVENTS[Math.floor(Math.random() * EMERGENCY_EVENTS.length)];
        setActiveEvent(event);
        setEventFired(true);
        // Event doesn't reduce fund balance (educational only — shows parallel paths)
        // But we do apply the deduction to show impact
      }

      // 3. Update history
      const newHistory = [
        ...history,
        { month: currentMonth, fundBalance: newFundBalance, eventFired: fireEvent },
      ];

      // 4. Persist to Firestore
      const freshSim = await loadSimProgress(uid);
      const updatedWallets = (freshSim?.wallets ?? []).map(w =>
        w.id === 'emergency-fund' ? { ...w, balance: newFundBalance } : w
      );

      await saveSimProgress(uid, {
        ...freshSim,
        wallets: updatedWallets,
        stage5Progress: {
          currentMonth: nextMonth,
          fundBalance:  newFundBalance,
          history:      newHistory,
          eventFired:   eventFired || fireEvent,
        },
      });

      // 5. Update local state
      setFundBalance(newFundBalance);
      setCurrentMonth(nextMonth);
      setHistory(newHistory);
      setSim({ ...freshSim, wallets: updatedWallets });

      // 6. Show event modal if it fires
      if (fireEvent) {
        setShowEvent(true);
      }

      // 7. Auto-complete if fund now covers 1 month of Needs
      if (newFundBalance >= monthlyNeeds && !fireEvent) {
        await handleComplete(newFundBalance, updatedWallets);
      }

    } catch (e) {
      console.error('Stage5 advance:', e);
    } finally {
      setAdvancing(false);
    }
  }, [advancing, canComplete, currentMonth, eventFired, fundBalance, fundContrib, history, sim]);

  const handleComplete = async (overrideFundBalance, overrideWallets) => {
    const finalFund    = overrideFundBalance ?? fundBalance;
    const finalWallets = overrideWallets     ?? (sim?.wallets ?? []);
    try {
      await completeStage(uid, 'stage-6', {
        emergencyFundBalance: finalFund,
        monthsBuilt:          currentMonth,
        fundTarget,
      }, finalWallets);
      setProfile({ ...profile, finCoins: finCoins + 50 });
      setShowComplete(true);
    } catch (e) {
      console.error('Stage5 complete:', e);
    }
  };

  // ── Outfit ─────────────────────────────────────────────────────────────────
  const completedStages = sim?.completedStages ?? [];
  const newOutfit       = getNewOutfit('stage-5');
  const unlockedOutfits = [
    ...getUnlockedOutfits(completedStages).map(o => o.id),
    ...(showComplete && newOutfit ? [newOutfit.id] : []),
  ];

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <Text style={s.loadingText}>Loading your sim…</Text>
      </View>
    );
  }

  const pctOfTarget = fundTarget > 0 ? Math.min(fundBalance / fundTarget, 1) : 0;
  const pctOf1Month = monthlyNeeds > 0 ? Math.min(fundBalance / monthlyNeeds, 1) : 0;

  return (
    <View style={s.container}>
      <StageHeader
        title={STAGE.title}
        color={STAGE.color}
        sim={sim}
        onBack={() => router.back()}
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Fund meter ── */}
        <View style={[s.meterCard, { borderColor: STAGE.color + '30' }]}>
          <View style={s.meterHeader}>
            <Text style={s.meterIcon}>🛡️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.meterTitle}>Emergency Fund</Text>
              <Text style={s.meterSub}>Target: {formatDual(monthlyNeeds).sgd} (1 month) → {formatDual(fundTarget).sgd} (3 months)</Text>
            </View>
          </View>

          {/* Balance */}
          <Text style={[s.meterBalance, { color: STAGE.color }]}>
            {formatDual(fundBalance).sgd}
          </Text>
          <Text style={s.meterCoins}>{formatDual(fundBalance).coins}</Text>

          {/* Progress bar to 3-month target */}
          <View style={s.barWrap}>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${Math.round(pctOfTarget * 100)}%`, backgroundColor: STAGE.color }]} />
              {/* 1-month marker */}
              <View style={[s.barMarker, { left: '33.3%' }]}>
                <Text style={s.barMarkerLabel}>1 mo</Text>
              </View>
            </View>
            <Text style={[s.barPct, { color: STAGE.color }]}>{Math.round(pctOfTarget * 100)}%</Text>
          </View>

          {/* Milestone rows */}
          <View style={s.milestoneRow}>
            <View style={[s.milestoneDot, { backgroundColor: pctOf1Month >= 1 ? STAGE.color : Colors.border }]} />
            <Text style={[s.milestoneText, pctOf1Month >= 1 && { color: STAGE.color, fontFamily: Fonts.bold }]}>
              1 month ({formatDual(monthlyNeeds).sgd}) — unlocks Stage 6
            </Text>
            {pctOf1Month >= 1 && <Text style={s.milestoneTick}>✓</Text>}
          </View>
          <View style={s.milestoneRow}>
            <View style={[s.milestoneDot, { backgroundColor: pctOfTarget >= 1 ? STAGE.color : Colors.border }]} />
            <Text style={s.milestoneText}>
              3 months ({formatDual(fundTarget).sgd}) — fully funded
            </Text>
            {pctOfTarget >= 1 && <Text style={s.milestoneTick}>✓</Text>}
          </View>
        </View>

        {/* ── Fin intro ── */}
        <FinBubble text={finIntro ?? ''} loading={loadingIntro} />

        {/* ── Month history ── */}
        {history.length > 0 && (
          <MonthHistory history={history} color={STAGE.color} />
        )}

        {/* ── Completion state ── */}
        {canComplete ? (
          <View style={[s.completeCard, { borderColor: STAGE.color + '40', backgroundColor: STAGE.colorLight }]}>
            <Text style={[s.completeTitle, { color: STAGE.color }]}>🛡️  1-month buffer reached!</Text>
            <Text style={s.completeBody}>
              You've built {formatDual(fundBalance).sgd} — enough to cover a full month of your essential expenses.
              Real life will throw surprises. Now you're ready for them.
            </Text>
            <TouchableOpacity
              style={[s.completeCTA, { backgroundColor: STAGE.color }]}
              onPress={() => handleComplete()}
              activeOpacity={0.85}
            >
              <Text style={s.completeCTAText}>Complete Stage 5 →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Monthly allocation card ── */
          <MonthCard
            month={currentMonth}
            income={income}
            savingsAmt={savingsAmt}
            fundPct={fundPct}
            onFundPctChange={setFundPct}
            onAdvance={handleAdvance}
            advancing={advancing}
            canComplete={canComplete}
            color={STAGE.color}
          />
        )}

        {/* ── How interest works ── */}
        {fundBalance > 0 && (
          <View style={s.interestCard}>
            <Text style={s.interestTitle}>💰  Interest working for you</Text>
            <Text style={s.interestBody}>
              At {((bankWallet?.interestRate ?? 0.0005) * 100).toFixed(2)}% p.a., your current balance earns{' '}
              ~{formatDual(fundBalance * (bankWallet?.interestRate ?? 0.0005) / 12).sgd}/month in interest.
              Small now — but the habit of keeping money in a ring-fenced account matters more than the rate.
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ── Surprise event modal ── */}
      <EventModal
        visible={showEvent}
        event={activeEvent}
        fundBalance={fundBalance}
        onDismiss={() => setShowEvent(false)}
      />

      {/* ── Stage complete modal ── */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  loadingWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:    { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  scroll:         { flex: 1 },
  content:        { padding: Spacing.lg, paddingTop: Spacing.md },

  // Fund meter card
  meterCard:      { backgroundColor: Colors.white, borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  meterHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.sm },
  meterIcon:      { fontSize: 28 },
  meterTitle:     { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  meterSub:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  meterBalance:   { fontFamily: Fonts.extraBold, fontSize: 38, marginBottom: 2 },
  meterCoins:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.md },
  barWrap:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  barTrack:       { flex: 1, height: 12, backgroundColor: Colors.lightGray, borderRadius: 6, overflow: 'visible', position: 'relative' },
  barFill:        { height: 12, borderRadius: 6, position: 'absolute', left: 0, top: 0 },
  barMarker:      { position: 'absolute', top: -4, width: 2, height: 20, backgroundColor: Colors.textMuted + '60', borderRadius: 1, alignItems: 'center' },
  barMarkerLabel: { position: 'absolute', top: 22, fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, width: 28, textAlign: 'center', left: -13 },
  barPct:         { fontFamily: Fonts.extraBold, fontSize: 14, minWidth: 36, textAlign: 'right' },
  milestoneRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  milestoneDot:   { width: 10, height: 10, borderRadius: 5 },
  milestoneText:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, flex: 1 },
  milestoneTick:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.successDark },

  // Completion state
  completeCard:   { borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md },
  completeTitle:  { fontFamily: Fonts.extraBold, fontSize: 18, marginBottom: 8 },
  completeBody:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  completeCTA:    { borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' },
  completeCTAText:{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },

  // Interest info card
  interestCard:   { backgroundColor: Colors.successLight, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md },
  interestTitle:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.successDark, marginBottom: 4 },
  interestBody:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 19 },
});