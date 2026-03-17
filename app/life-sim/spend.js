// app/life-sim/spend.js
//
// Spending — wants decisions for the current month.
//
// This screen is fundamentally different from the old approach:
//
//   NEEDS  → shown as a read-only "already left your account" section.
//             Rent, transport, food — these aren't decisions, they're facts.
//             Fin shows them as a notification feed that already happened.
//
//   WANTS  → the only real decisions. 4–6 want events per month.
//             Each one pops up a modal: Fin explains what it is, the user
//             taps Approve or Skip. Balance updates live.
//
//   SAVINGS → shown as a line item — "20% goes to savings automatically".
//
// The "approve/skip" modal appears for each want, one at a time.
// The user can't go back and change a decision — just like real life.
//
// At the end, a summary shows what was approved vs skipped,
// and how the month looks against budget.
// The actual month close (interest, transfers) happens on the hub via "End Month".

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Modal, Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../../store/userStore';
import { loadSimProgress, saveSimProgress } from '../../lib/lifeSim';
import { Colors, Fonts, Spacing, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';
import { auth } from '../../lib/firebase';

const { width: SW, height: SH } = Dimensions.get('window');

const TEAL   = MODULE_COLORS['module-1'].color;
const ORANGE = MODULE_COLORS['module-2'].color;
const GREEN  = MODULE_COLORS['module-3'].color;

// ─── Monthly wants events ─────────────────────────────────────────────────────
// These are the optional decisions each month.
// Needs are never here — they're auto-deducted and shown as notifications.
// Each month rotates which wants appear using the month number as a seed.

const ALL_WANTS = [
  { id: 'grabfood',     merchant: 'GrabFood',       description: 'Delivery orders this month',           amount: 152, icon: '🛵', finNote: '$152 on delivery this month. That\'s 8+ orders. The convenience premium adds up.' },
  { id: 'netflix',      merchant: 'Netflix',         description: 'Monthly subscription',                 amount: 18,  icon: '🎬', finNote: '$18/month is $216/year. Worth it if you actually use it — not if it\'s habit.' },
  { id: 'spotify',      merchant: 'Spotify',         description: 'Monthly subscription',                 amount: 10,  icon: '🎵', finNote: 'Subscriptions are easy to keep and forget. Is this one earning its keep?' },
  { id: 'uniqlo',       merchant: 'Uniqlo',          description: 'Clothing (sale purchase)',              amount: 50,  icon: '👕', finNote: 'Clothing is a Want unless it\'s replacing something broken. What\'s this one?' },
  { id: 'gym',          merchant: 'ActiveSG',        description: 'Monthly gym membership',               amount: 45,  icon: '🏋️', finNote: 'Health spend is genuinely ambiguous. If you go regularly, this pays for itself in avoided healthcare.' },
  { id: 'bbq',          merchant: 'NTUC FairPrice',  description: 'BBQ contribution (hall event)',        amount: 25,  icon: '🍖', finNote: 'Social spending matters. The 30% Wants budget exists so you don\'t have to say no to everything.' },
  { id: 'shopee',       merchant: 'Shopee',          description: 'Online purchase (sale)',               amount: 48,  icon: '📦', finNote: 'Flash sales create artificial urgency. Would you have bought this at full price?' },
  { id: 'boba',         merchant: 'KOI / Gong Cha',  description: 'Bubble tea (×6 this month)',          amount: 30,  icon: '🧋', finNote: '$5 each, 6 times. These feel small individually — together they\'re $30.' },
  { id: 'kopitiam',     merchant: 'Kopitiam',        description: 'Weekend breakfast runs (×4)',          amount: 24,  icon: '☕', finNote: 'Under $7 a sitting. One of the smarter food habits you can build in Singapore.' },
  { id: 'grab-surge',   merchant: 'Grab',            description: 'Late night surge rides (×2)',         amount: 32,  icon: '🌩', finNote: 'Surge pricing is the cost of convenience at peak time. Could these have been planned earlier?' },
  { id: 'coursera',     merchant: 'Coursera',        description: 'Online course subscription',          amount: 20,  icon: '💻', finNote: 'Skill investment is a Want with real upside. Is this course moving toward a concrete goal?' },
  { id: 'movies',       merchant: 'Shaw / Cathay',   description: 'Movie tickets (×2)',                  amount: 26,  icon: '🎟', finNote: 'Entertainment is the whole point of the Wants budget. No guilt needed here.' },
  { id: 'birthday',     merchant: 'Lazada',          description: 'Friend\'s birthday gift',             amount: 35,  icon: '🎁', finNote: 'Gifts are a real cost most budgets forget. Consider a "social" line item going forward.' },
  { id: 'bookstore',    merchant: 'Kinokuniya',      description: 'Books (×2)',                          amount: 40,  icon: '📚', finNote: 'Hard to argue against books. Whether this is Want or Savings depends on what you do with them.' },
  { id: 'gaming',       merchant: 'Steam / PS Store', description: 'Game purchase',                     amount: 35,  icon: '🎮', finNote: 'Entertainment spend. Worth it if you actually play — waste if it joins the backlog.' },
];

const ALL_SURPRISES = [
  { id: 'late-night',  merchant: 'Kopitiam',       description: 'Late-night supper run',         amount: 18, icon: '🌙', finNote: 'An impulse spend. Not a crisis — just worth noticing.', isSurprise: true },
  { id: 'data-topup',  merchant: 'Singtel',        description: 'Data top-up (ran out mid-month)', amount: 10, icon: '📱', finNote: 'This suggests your plan might be undersized for your usage.', isSurprise: true },
  { id: 'parking',     merchant: 'HDB Car Park',   description: 'Parking fines (×1)',            amount: 30, icon: '🅿️', finNote: 'An avoidable cost. Worth building in a small buffer for admin slips.', isSurprise: true },
  { id: 'atm',         merchant: 'ATM',            description: 'Cash withdrawal fee (wrong bank)', amount: 4, icon: '🏧', finNote: 'Easy to avoid with PayNow. This is why digital payments reduce friction costs.', isSurprise: true },
];

function seededRandom(seed) {
  let s = (seed * 1664525 + 1013904223) & 0xffffffff;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateWantsForMonth(month, income) {
  const rand        = seededRandom(month * 7919);
  const scaleFactor = income / 2800;

  // Pick 5 wants from the full list
  const shuffled = [...ALL_WANTS].sort(() => rand() - 0.5).slice(0, 5);
  const scaled   = shuffled.map(w => ({
    ...w,
    amount:   Math.round(w.amount * (0.85 + rand() * 0.3) * scaleFactor),
    resolved: false,
    approved: false,
  }));

  // 1 surprise every other month
  if (month % 2 === 0) {
    const surpriseIdx = Math.floor(rand() * ALL_SURPRISES.length);
    scaled.push({
      ...ALL_SURPRISES[surpriseIdx],
      amount:     Math.round(ALL_SURPRISES[surpriseIdx].amount * scaleFactor),
      resolved:   false,
      approved:   false,
      isSurprise: true,
    });
  }

  return scaled;
}

// ─── Want decision modal ──────────────────────────────────────────────────────
// One per want event. Fin explains, user approves or skips.

function WantModal({ event, balance, budget, onApprove, onSkip }) {
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (!event) return;
    slideAnim.setValue(SH);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }).start();
  }, [event?.id]);

  if (!event) return null;

  const afterApprove  = Math.max(0, balance - event.amount);
  const remaining     = Math.max(0, (budget ?? 0) - event.amount);
  const budgetOk      = budget === null || budget === undefined || event.amount <= budget;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <View style={wm.backdrop}>
        <Animated.View style={[wm.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={wm.handle} />

          {event.isSurprise && (
            <View style={wm.surprisePill}>
              <Text style={wm.surprisePillText}>⚡ Surprise expense</Text>
            </View>
          )}

          {/* Merchant + amount */}
          <View style={wm.topRow}>
            <View style={wm.merchantIcon}>
              <Text style={{ fontSize: 30 }}>{event.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={wm.merchant}>{event.merchant}</Text>
              <Text style={wm.desc}>{event.description}</Text>
            </View>
            <Text style={wm.amount}>${event.amount.toFixed(0)}</Text>
          </View>

          {/* Balance preview */}
          <View style={wm.balPreview}>
            <View style={wm.balCol}>
              <Text style={wm.balLabel}>Current balance</Text>
              <Text style={[wm.balAmt, { color: ORANGE }]}>${Math.round(balance).toLocaleString()}</Text>
            </View>
            <Text style={wm.balArrow}>→</Text>
            <View style={wm.balCol}>
              <Text style={wm.balLabel}>If approved</Text>
              <Text style={[wm.balAmt, { color: afterApprove < 500 ? Colors.danger : Colors.textPrimary }]}>
                ${Math.round(afterApprove).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Fin's note */}
          <View style={wm.finNote}>
            <Text style={wm.finOwl}>🦉</Text>
            <Text style={wm.finText}>{event.finNote}</Text>
          </View>

          {/* Wants budget remaining */}
          {budget !== null && budget !== undefined && (
            <View style={[wm.budgetRow, { backgroundColor: budgetOk ? Colors.successLight : Colors.warningLight }]}>
              <Text style={[wm.budgetText, { color: budgetOk ? GREEN : Colors.warningDark }]}>
                {budgetOk
                  ? `Wants budget: $${Math.round(remaining)} remaining after this`
                  : `⚠ This would go $${Math.round(event.amount - budget)} over your Wants budget`}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={wm.actions}>
            <TouchableOpacity style={wm.skipBtn} onPress={onSkip} activeOpacity={0.8}>
              <Text style={wm.skipIcon}>✕</Text>
              <Text style={wm.skipLabel}>Skip it</Text>
              <Text style={wm.skipSub}>save ${event.amount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={wm.approveBtn} onPress={onApprove} activeOpacity={0.88}>
              <Text style={wm.approveIcon}>✓</Text>
              <Text style={wm.approveLabel}>Approve</Text>
              <Text style={wm.approveSub}>−${event.amount}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const wm = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md },
  handle:         { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center' },
  surprisePill:   { alignSelf: 'flex-start', backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 4 },
  surprisePillText:{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.warningDark },
  topRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  merchantIcon:   { width: 56, height: 56, backgroundColor: Colors.lightGray, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center' },
  merchant:       { fontFamily: Fonts.extraBold, fontSize: 17, color: Colors.textPrimary, marginBottom: 3 },
  desc:           { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  amount:         { fontFamily: Fonts.extraBold, fontSize: 26, color: Colors.textPrimary },
  balPreview:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lightGray, borderRadius: Radii.lg, padding: Spacing.md, gap: Spacing.md },
  balCol:         { flex: 1, gap: 3 },
  balLabel:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  balAmt:         { fontFamily: Fonts.extraBold, fontSize: 20 },
  balArrow:       { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted },
  finNote:        { flexDirection: 'row', gap: 10, backgroundColor: Colors.background, borderRadius: Radii.md, padding: Spacing.sm, alignItems: 'flex-start' },
  finOwl:         { fontSize: 18 },
  finText:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 19 },
  budgetRow:      { borderRadius: Radii.md, padding: Spacing.sm },
  budgetText:     { fontFamily: Fonts.bold, fontSize: 12 },
  actions:        { flexDirection: 'row', gap: Spacing.sm },
  skipBtn:        { flex: 1, backgroundColor: Colors.lightGray, borderRadius: Radii.lg, paddingVertical: Spacing.md, alignItems: 'center', gap: 2 },
  skipIcon:       { fontSize: 18, color: Colors.textMuted },
  skipLabel:      { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textSecondary },
  skipSub:        { fontFamily: Fonts.regular, fontSize: 11, color: GREEN },
  approveBtn:     { flex: 2, backgroundColor: Colors.textPrimary, borderRadius: Radii.lg, paddingVertical: Spacing.md, alignItems: 'center', gap: 2 },
  approveIcon:    { fontSize: 18, color: Colors.white },
  approveLabel:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
  approveSub:     { fontFamily: Fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
});

// ─── Needs notification row ───────────────────────────────────────────────────
// Read-only. These already happened.

function NeedRow({ icon, label, amount }) {
  return (
    <View style={nr.row}>
      <Text style={nr.icon}>{icon}</Text>
      <Text style={nr.label}>{label}</Text>
      <Text style={nr.amount}>−${amount.toLocaleString()}</Text>
    </View>
  );
}
const nr = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  icon:   { fontSize: 18, width: 28 },
  label:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1 },
  amount: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted },
});

// ─── Resolved want row ────────────────────────────────────────────────────────

function ResolvedWantRow({ event }) {
  const approved = event.approved;
  return (
    <View style={[rw.row, approved && { borderLeftWidth: 3, borderLeftColor: ORANGE }]}>
      <Text style={rw.icon}>{event.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={rw.merchant}>{event.merchant}</Text>
        {event.isSurprise && <Text style={rw.surprise}>surprise</Text>}
      </View>
      {approved
        ? <View style={rw.approvedBlock}>
            <Text style={[rw.amt, { color: Colors.danger }]}>−${event.amount}</Text>
            <View style={rw.tag}><Text style={rw.tagText}>approved</Text></View>
          </View>
        : <View style={rw.skippedBlock}>
            <Text style={rw.savedAmt}>+${event.amount} saved</Text>
            <View style={rw.skippedTag}><Text style={rw.skippedText}>skipped</Text></View>
          </View>
      }
    </View>
  );
}
const rw = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: Spacing.sm, backgroundColor: Colors.white, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, marginBottom: 5 },
  icon:         { fontSize: 18, width: 24 },
  merchant:     { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  surprise:     { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  approvedBlock:{ alignItems: 'flex-end', gap: 2 },
  amt:          { fontFamily: Fonts.extraBold, fontSize: 14 },
  tag:          { backgroundColor: ORANGE + '20', borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 1 },
  tagText:      { fontFamily: Fonts.bold, fontSize: 9, color: ORANGE },
  skippedBlock: { alignItems: 'flex-end', gap: 2 },
  savedAmt:     { fontFamily: Fonts.bold, fontSize: 13, color: GREEN },
  skippedTag:   { backgroundColor: Colors.lightGray, borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 1 },
  skippedText:  { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function SpendScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [sim,       setSim]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [wants,     setWants]     = useState([]);   // this month's want events
  const [activeIdx, setActiveIdx] = useState(null); // index of currently shown modal
  const [balance,   setBalance]   = useState(0);

  const uid = auth.currentUser?.uid;

  const loadSim = useCallback(async () => {
    if (!uid) return;
    try {
      const data  = await loadSimProgress(uid);
      setSim(data);
      const month  = data?.currentMonth ?? 1;
      const income = data?.income ?? 2000;

      // Load or generate wants for this month
      const savedWants = data?.wantsEvents?.[String(month)];
      const evts = savedWants?.length
        ? savedWants
        : generateWantsForMonth(month, income);
      setWants(evts);

      const bankBal = (data?.wallets ?? []).find(w => w.type === 'bank')?.balance ?? 0;
      setBalance(bankBal);

      // Find first unresolved want to show
      const firstUnresolved = evts.findIndex(e => !e.resolved);
      setActiveIdx(firstUnresolved >= 0 ? firstUnresolved : null);

    } catch (e) { console.error('spend load:', e); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { loadSim(); }, [loadSim]);

  // ── Save wants state ───────────────────────────────────────────────────────

  const saveWants = async (updatedWants, updatedBalance, wantsDecisions) => {
    const month = sim?.currentMonth ?? 1;
    const updatedWallets = (sim?.wallets ?? []).map(w =>
      w.type === 'bank' ? { ...w, balance: Math.round(updatedBalance * 100) / 100 } : w
    );
    const newSim = { ...sim, wallets: updatedWallets };
    setSim(newSim);

    await saveSimProgress(uid, {
      wallets:         updatedWallets,
      wantsEvents:     { ...(sim?.wantsEvents ?? {}), [String(month)]: updatedWants },
      wantsDecisions:  { ...(sim?.wantsDecisions ?? {}), [String(month)]: wantsDecisions },
    });
  };

  // ── Approve want ───────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (activeIdx === null) return;
    const event = wants[activeIdx];
    const newBalance = Math.max(0, balance - event.amount);

    const updatedWants = wants.map((w, i) =>
      i === activeIdx ? { ...w, resolved: true, approved: true } : w
    );
    setWants(updatedWants);
    setBalance(newBalance);

    // Build decisions list
    const month = sim?.currentMonth ?? 1;
    const existing = sim?.wantsDecisions?.[String(month)] ?? [];
    const decisions = [...existing, { id: event.id, amount: event.amount, merchant: event.merchant }];

    await saveWants(updatedWants, newBalance, decisions);

    // Advance to next unresolved
    const next = updatedWants.findIndex((w, i) => i > activeIdx && !w.resolved);
    setActiveIdx(next >= 0 ? next : null);
  };

  // ── Skip want ──────────────────────────────────────────────────────────────

  const handleSkip = async () => {
    if (activeIdx === null) return;
    const updatedWants = wants.map((w, i) =>
      i === activeIdx ? { ...w, resolved: true, approved: false } : w
    );
    setWants(updatedWants);

    const month = sim?.currentMonth ?? 1;
    const decisions = sim?.wantsDecisions?.[String(month)] ?? [];
    await saveWants(updatedWants, balance, decisions);

    const next = updatedWants.findIndex((w, i) => i > activeIdx && !w.resolved);
    setActiveIdx(next >= 0 ? next : null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const budget     = sim?.monthlyBudget;
  const month      = sim?.currentMonth ?? 1;
  const income     = sim?.income ?? 2000;
  const needsAmt   = budget?.needsAmt ?? Math.round(income * 0.5);
  const savingsAmt = budget?.savingsAmt ?? Math.round(income * 0.2);
  const wantsBudget = budget?.wantsAmt ?? Math.round(income * 0.3);
  const bankWallet  = (sim?.wallets ?? []).find(w => w.type === 'bank');

  const approved      = wants.filter(w => w.resolved && w.approved);
  const skipped       = wants.filter(w => w.resolved && !w.approved);
  const unresolved    = wants.filter(w => !w.resolved);
  const totalApproved = approved.reduce((s, w) => s + w.amount, 0);
  const savedAmt      = skipped.reduce((s, w) => s + w.amount, 0);
  const remainingWants= Math.max(0, wantsBudget - totalApproved);
  const allDone       = unresolved.length === 0 && wants.length > 0;

  // Needs breakdown
  const NEEDS_BREAKDOWN = [
    { icon: '🏠', label: 'Rent & utilities',    amount: Math.round(needsAmt * 0.55) },
    { icon: '🍚', label: 'Food (hawker/groceries)', amount: Math.round(needsAmt * 0.28) },
    { icon: '🚇', label: 'Transport (MRT/bus)', amount: Math.round(needsAmt * 0.17) },
  ];

  const activeEvent = activeIdx !== null ? wants[activeIdx] : null;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!bankWallet) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, backgroundColor: Colors.background, gap: Spacing.md }}>
        <Text style={{ fontSize: 40 }}>🏦</Text>
        <Text style={{ fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, textAlign: 'center' }}>Open a bank account first</Text>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 }}>You need somewhere for your money to live.</Text>
        <TouchableOpacity style={{ backgroundColor: ORANGE, borderRadius: Radii.lg, paddingVertical: 13, paddingHorizontal: 32 }} onPress={() => router.replace('/life-sim/bank')} activeOpacity={0.88}>
          <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.white }}>Go to the bank →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: Colors.background }]}>

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Month {month} spending</Text>
          <Text style={s.subTitle}>{unresolved.length > 0 ? `${unresolved.length} wants to decide` : 'All done for this month'}</Text>
        </View>
        <View style={[s.balBadge, { borderColor: ORANGE + '40' }]}>
          <Text style={s.balLabel}>BALANCE</Text>
          <Text style={[s.balAmt, { color: ORANGE }]}>${Math.round(balance).toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Needs — already left your account ── */}
        <View style={s.sectionCard}>
          <View style={s.sectionHead}>
            <View>
              <Text style={s.sectionTitle}>Needs</Text>
              <Text style={s.sectionSub}>Auto-deducted at month end · not negotiable</Text>
            </View>
            <Text style={[s.sectionTotal, { color: TEAL }]}>−${needsAmt.toLocaleString()}</Text>
          </View>
          {NEEDS_BREAKDOWN.map((n, i) => <NeedRow key={i} {...n} />)}
          <View style={s.savingsRow}>
            <Text style={s.savingsIcon}>💰</Text>
            <Text style={s.savingsLabel}>Savings (auto-transfer to fund)</Text>
            <Text style={[s.savingsAmt, { color: GREEN }]}>−${savingsAmt.toLocaleString()}</Text>
          </View>
        </View>

        {/* ── Wants — your decisions ── */}
        <View style={s.sectionCard}>
          <View style={s.sectionHead}>
            <View>
              <Text style={s.sectionTitle}>Wants</Text>
              <Text style={s.sectionSub}>Your decisions · budget ${wantsBudget.toLocaleString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={[s.sectionTotal, { color: ORANGE }]}>−${Math.round(totalApproved).toLocaleString()}</Text>
              <Text style={[s.remainingText, { color: remainingWants > 0 ? GREEN : Colors.danger }]}>
                ${Math.round(remainingWants)} left
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={s.wantTrack}>
            <View style={[s.wantFill, {
              width: `${Math.min((totalApproved / wantsBudget) * 100, 100)}%`,
              backgroundColor: totalApproved > wantsBudget ? Colors.danger : ORANGE,
            }]} />
          </View>

          {/* Resolved wants */}
          {wants.filter(w => w.resolved).map((w, i) => <ResolvedWantRow key={i} event={w} />)}

          {/* Pending */}
          {unresolved.length > 0 && (
            <TouchableOpacity
              style={s.nextWantBtn}
              onPress={() => {
                const idx = wants.findIndex(w => !w.resolved);
                setActiveIdx(idx >= 0 ? idx : null);
              }}
              activeOpacity={0.88}
            >
              <Text style={s.nextWantIcon}>{unresolved[0]?.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.nextWantMerchant}>{unresolved[0]?.merchant}</Text>
                <Text style={s.nextWantDesc}>{unresolved[0]?.description}</Text>
              </View>
              <View style={s.nextWantBadge}>
                <Text style={s.nextWantBadgeText}>${unresolved[0]?.amount} · decide →</Text>
              </View>
            </TouchableOpacity>
          )}

          {wants.length === 0 && (
            <Text style={s.emptyNote}>No wants this month. All your money is accounted for in Needs and Savings.</Text>
          )}
        </View>

        {/* ── Summary when all done ── */}
        {allDone && savedAmt > 0 && (
          <View style={s.summaryCard}>
            <Text style={s.summaryOwl}>🦉</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.summaryTitle}>You saved ${Math.round(savedAmt)} by skipping.</Text>
              <Text style={s.summaryText}>
                That could go toward your emergency fund — or stay in your bank account earning interest. When you're ready, tap "End Month" on the hub to close this month.
              </Text>
            </View>
          </View>
        )}

        {allDone && savedAmt === 0 && (
          <View style={s.summaryCard}>
            <Text style={s.summaryOwl}>🦉</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.summaryTitle}>Wants fully spent.</Text>
              <Text style={s.summaryText}>
                You approved everything this month. That's fine — the Wants budget exists for this. Head back to the hub when ready to close the month.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Active want modal */}
      {activeEvent && (
        <WantModal
          event={activeEvent}
          balance={balance}
          budget={remainingWants}
          onApprove={handleApprove}
          onSkip={handleSkip}
        />
      )}

    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.lightGray, borderRadius: Radii.full },
  backIcon:      { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary },
  title:         { fontFamily: Fonts.extraBold, fontSize: 17, color: Colors.textPrimary },
  subTitle:      { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  balBadge:      { borderWidth: 1.5, borderRadius: Radii.lg, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'flex-end' },
  balLabel:      { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  balAmt:        { fontFamily: Fonts.extraBold, fontSize: 16 },
  scroll:        { padding: Spacing.lg, gap: Spacing.md },
  sectionCard:   { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm, ...Shadows.soft },
  sectionHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  sectionTitle:  { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  sectionSub:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  sectionTotal:  { fontFamily: Fonts.extraBold, fontSize: 18 },
  remainingText: { fontFamily: Fonts.bold, fontSize: 11 },
  savingsRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.lightGray, marginTop: 4 },
  savingsIcon:   { fontSize: 18, width: 28 },
  savingsLabel:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1 },
  savingsAmt:    { fontFamily: Fonts.bold, fontSize: 14 },
  wantTrack:     { height: 5, backgroundColor: Colors.lightGray, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.sm },
  wantFill:      { height: 5, borderRadius: 3 },
  nextWantBtn:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.textPrimary, borderRadius: Radii.lg, padding: Spacing.md, marginTop: Spacing.sm },
  nextWantIcon:  { fontSize: 22 },
  nextWantMerchant:{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
  nextWantDesc:  { fontFamily: Fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  nextWantBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  nextWantBadgeText:{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.white },
  emptyNote:     { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },
  summaryCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, ...Shadows.soft },
  summaryOwl:    { fontSize: 28 },
  summaryTitle:  { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  summaryText:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 19 },
});