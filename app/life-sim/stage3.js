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
  StyleSheet, Animated, Platform, Modal, Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';
import { setBudget, completeStage, loadSimProgress, updateWallet, saveSimProgress } from '../../lib/lifeSim';
import { getIncomeBracket, formatDual, STAGES } from '../../constants/lifeSimStages';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../../constants/theme';
import { auth } from '../../lib/firebase';
import { FinBubble, StageHeader, StageCompleteModal, DualAmount } from '../../components/LifeSimComponents';
import { simBudgetFeedback } from '../../lib/api';

const STAGE = STAGES.find(s => s.id === 'stage-3');
const { width: SW, height: SH } = Dimensions.get('window');
const CONFETTI_COUNT = 30;

// ─── Confetti particle ────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#F97B8B', '#3AAECC', '#5BBF8A', '#F5883A', '#8B6FD4', '#E6A800', '#FFFFFF'];

function ConfettiParticle({ index }) {
  const startX   = Math.random() * SW;  // plain number, used in translateX
  const y        = useRef(new Animated.Value(-20)).current;
  const rotate   = useRef(new Animated.Value(0)).current;
  const opacity  = useRef(new Animated.Value(1)).current;
  const size     = 6 + Math.random() * 8;
  const color    = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const duration = 1200 + Math.random() * 800;
  const delay    = Math.random() * 400;
  const isRect   = index % 3 !== 0;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y,      { toValue: SH * 0.75, duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 720 + Math.random() * 360, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(opacity, { toValue: 0, duration: duration * 0.4, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1080], outputRange: ['0deg', '1080deg'] });

  return (
    <Animated.View style={{
      position:  'absolute',
      top:       0,
      width:     isRect ? size : size * 1.2,
      height:    isRect ? size * 0.4 : size * 1.2,
      borderRadius: isRect ? 2 : size * 0.6,
      backgroundColor: color,
      opacity,
      transform: [{ translateX: startX }, { translateY: y }, { rotate: rotateDeg }],
    }} />
  );
}

// ─── Animated balance counter ─────────────────────────────────────────────────
function AnimatedBalance({ from, to, duration = 1200, color, style }) {
  const anim = useRef(new Animated.Value(from)).current;
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    const listener = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    Animated.timing(anim, { toValue: to, duration, useNativeDriver: false, delay: 600 }).start();
    return () => anim.removeListener(listener);
  }, [to]);

  return (
    <Text style={[style, { color }]}>${display.toLocaleString()}</Text>
  );
}

// ─── Paycheck modal ───────────────────────────────────────────────────────────
function PaycheckModal({ visible, income, previousBalance, newBalance, bracketLabel, bracketEmoji, onContinue }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const op    = useRef(new Animated.Value(0)).current;
  const coins = useRef(new Animated.Value(0)).current;
  const [coinDisplay, setCoinDisplay] = useState(0);

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.85); op.setValue(0); coins.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    const listener = coins.addListener(({ value }) => setCoinDisplay(Math.round(value)));
    Animated.timing(coins, {
      toValue: Math.round(income / 10),
      duration: 1400, delay: 500, useNativeDriver: false,
    }).start();
    return () => coins.removeListener(listener);
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={pm.backdrop}>
        {/* Confetti */}
        {visible && Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
          <ConfettiParticle key={i} index={i} />
        ))}

        <Animated.View style={[pm.card, { opacity: op, transform: [{ scale }] }]}>
          {/* Header */}
          <Text style={pm.emoji}>💸</Text>
          <Text style={pm.title}>Paycheck Received!</Text>
          <Text style={pm.subtitle}>{bracketEmoji}  {bracketLabel}</Text>

          {/* Amount */}
          <View style={[pm.amountBox, { backgroundColor: STAGE.colorLight, borderColor: STAGE.color + '40' }]}>
            <Text style={pm.amountLabel}>This month's income</Text>
            <Text style={[pm.amount, { color: STAGE.color }]}>{formatDual(income).sgd}</Text>
            <Text style={pm.amountCoins}>+{coinDisplay} 🪙</Text>
          </View>

          {/* Bank balance change */}
          <View style={pm.balanceRow}>
            <View style={pm.balanceCol}>
              <Text style={pm.balanceLabel}>Bank balance was</Text>
              <Text style={pm.balanceBefore}>${previousBalance.toLocaleString()}</Text>
            </View>
            <Text style={pm.arrow}>→</Text>
            <View style={pm.balanceCol}>
              <Text style={pm.balanceLabel}>Now</Text>
              <AnimatedBalance
                from={previousBalance}
                to={newBalance}
                color={STAGE.color}
                style={pm.balanceAfter}
              />
            </View>
          </View>

          <View style={[pm.divider, { backgroundColor: Colors.border }]} />

          <Text style={pm.nudge}>
            Now decide: how will you split it?
          </Text>

          <TouchableOpacity
            style={[pm.btn, { backgroundColor: STAGE.color }]}
            onPress={onContinue}
            activeOpacity={0.85}
          >
            <Text style={pm.btnText}>Start budgeting →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  backdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card:          { backgroundColor: Colors.white, borderRadius: 28, padding: Spacing.xl, width: '100%', alignItems: 'center', ...Shadows.medium },
  emoji:         { fontSize: 48, marginBottom: 8 },
  title:         { fontFamily: Fonts.extraBold, fontSize: 26, color: Colors.textPrimary, marginBottom: 4 },
  subtitle:      { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.lg },
  amountBox:     { width: '100%', borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg },
  amountLabel:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  amount:        { fontFamily: Fonts.extraBold, fontSize: 32, marginBottom: 2 },
  amountCoins:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.warningDark },
  balanceRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', marginBottom: Spacing.md },
  balanceCol:    { alignItems: 'center', flex: 1 },
  balanceLabel:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  balanceBefore: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted },
  balanceAfter:  { fontFamily: Fonts.extraBold, fontSize: 22 },
  arrow:         { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textMuted, marginHorizontal: 8 },
  divider:       { height: 1, width: '100%', marginVertical: Spacing.md },
  nudge:         { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.lg, textAlign: 'center' },
  btn:           { borderRadius: Radii.lg, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center', width: '100%' },
  btnText:       { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
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
  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const bracket   = getIncomeBracket(finCoins);
  const income    = bracket.income;

  // Budget sliders — pre-filled at 70/30/0 (the "bad default")
  const [needs,   setNeeds]   = useState(70);
  const [wants,   setWants]   = useState(30);
  const [savings, setSavings] = useState(0);

  const [saving,         setSaving]         = useState(false);
  const [showComplete,   setShowComplete]   = useState(false);
  const [showPaycheck,     setShowPaycheck]     = useState(true);   // modal on entry
  const [paycheckCredited, setPaycheckCredited] = useState(false);
  const [locked,         setLocked]         = useState(false);
  const [finFeedback,    setFinFeedback]    = useState(null);
  const [loadingFeedback,setLoadingFeedback]= useState(false);

  const scrollRef = useRef(null);
  const [simFFN,        setSimFFN]        = useState(null);
  const [prevBalance,   setPrevBalance]   = useState(0);

  // Load sim on mount — credit paycheck to wallet (once), get FFN + balance
  useEffect(() => {
    if (!uid) return;
    loadSimProgress(uid).then(async sim => {
      setSimFFN(sim?.ffn ?? null);
      // Credit salary to the bank account opened in Stage 2 specifically
      // Falls back to any bank wallet, then cash wallet if somehow neither exists
      const bankId = sim?.stage2Data?.bankId ?? sim?.bankAccountId;
      const wallet = bankId
        ? (sim?.wallets ?? []).find(w => w.id === bankId)
        : (sim?.wallets ?? []).find(w => w.type === 'bank') ?? (sim?.wallets ?? []).find(w => w.id === 'wallet');
      const currentBalance = wallet?.balance ?? 0;
      setPrevBalance(currentBalance);

      // Credit paycheck only if not already credited this stage
      // We check by seeing if income has already been added — store a flag in simProgress
      const alreadyCredited = sim?.paycheckCredited === true;
      if (!alreadyCredited && wallet) {
        await updateWallet(uid, wallet.id, bracket.income);
        // Mark as credited so refreshing the page doesn't double-credit
        await saveSimProgress(uid, { paycheckCredited: true });
        setPaycheckCredited(true);
      }
    }).catch(e => console.error('Stage2 load error:', e));
  }, [uid]);



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

      // Load sim to get FFN from Stage 1
      const sim = await loadSimProgress(uid);
      const ffn = sim?.ffn ?? null;

      // Fire AI feedback — don't await, let it load asynchronously
      setLoadingFeedback(true);
      simBudgetFeedback({
        userName: firstName, income, needsPct: needs, wantsPct: wants,
        savingsPct: savings, needsAmt, wantsAmt, savingsAmt, ffn,
      }).then(r => {
        setFinFeedback(r?.response ?? null);
        setLoadingFeedback(false);
      }).catch(() => setLoadingFeedback(false));

      await completeStage(uid, 'stage-3', {
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
        {/* ── Paycheck received banner (static, shown after modal dismissed) ── */}
        <View style={[s.paycheckBanner, { backgroundColor: STAGE.colorLight, borderColor: STAGE.color + '50' }]}>
          <View>
            <Text style={s.paycheckLabel}>💸  Paycheck received</Text>
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
            text={simFFN ? `You've put $0 toward savings — meaning you'll never reach your FI Number of ${formatDual(simFFN).sgd}. Every month at 0% savings is a month of compounding you can't get back, ${firstName}.` : `You've allocated $0 to savings. At this rate, your FI Number is unreachable — compounding requires consistent contributions to work. Is that intentional, ${firstName}?`}
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

        {/* ── Fin's AI budget feedback (appears after locking) ── */}
        {(loadingFeedback || finFeedback) && (
          <View style={s.feedbackWrap}>
            <FinBubble
              text={finFeedback ?? ''}
              loading={loadingFeedback}
            />
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

      {/* ── Paycheck modal — shown on entry ── */}
      <PaycheckModal
        visible={showPaycheck}
        income={income}
        previousBalance={prevBalance}
        newBalance={prevBalance + income}
        bracketLabel={bracket.label}
        bracketEmoji={bracket.emoji}
        onContinue={() => setShowPaycheck(false)}
      />

      <StageCompleteModal
        visible={showComplete}
        stageTitle={STAGE?.title ?? ''}
        chapterNum={STAGE?.number}
        onContinue={() => { setShowComplete(false); router.replace('/(tabs)/simulate'); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  scroll:          { flex: 1 },
  content:         { padding: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 60 },

  // Paycheck banner (static strip)
  paycheckBanner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.lg },
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

  // Feedback
  feedbackWrap:    { marginBottom: Spacing.md },

  // Lock button
  lockBtn:         { borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center' },
  lockBtnText:     { fontFamily: Fonts.bold, fontSize: 15 },
});