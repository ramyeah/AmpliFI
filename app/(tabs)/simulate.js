// app/(tabs)/simulate.js
//
// AmpliFI Life Simulation — one continuous narrative screen.
//
// This is the entire simulation. The user never leaves this tab.
// Everything happens here: Fin narrates, the user makes decisions,
// the world updates, time advances.
//
// ─── The model ───────────────────────────────────────────────────────────────
//
//  The screen has three zones:
//
//  TOP    — date strip: "Day 1", "Day 3", "Month 2, Day 14" etc. Updates as
//           time passes. Tapping it shows the full timeline.
//
//  MIDDLE — the scene: Fin + speech bubble, always visible. Fin is the narrator.
//           He speaks, the user taps through his lines, and a CTA appears.
//           Behind Fin, a soft background changes per chapter.
//
//  BOTTOM — the action area: context-sensitive. Could be:
//            • A bottom sheet sliding up (open bank account, set budget)
//            • A modal card (paycheck landing, life event)
//            • Nothing (Fin is still speaking)
//
// ─── The story arc ────────────────────────────────────────────────────────────
//
//  Chapter 0 — Arrival
//    Day 1:   Fin introduces himself and the simulation.
//    Day 1:   User sets their FI number (bottom sheet with lifestyle builder).
//    Day 2:   Fin acknowledges the FI number. Urges opening a bank account.
//
//  Chapter 1 — Banking
//    Day 2:   User opens bank account (bottom sheet — pick bank, pick type).
//             Balance chip animates from "cash" to "bank account".
//    Day 3:   Fin explains interest. Shows what the account earns per month.
//
//  Chapter 2 — First Month
//    Day 5:   Fin: "A month passes. Life costs money."
//             Spending notification cards slide in one by one (needs only — auto).
//             Each card briefly shows merchant, amount, category. Tap to dismiss.
//    Day 30:  Fin: "Here's where your money went." — spending summary modal.
//             Then: "Now your salary lands."
//    Day 30:  Salary modal — confetti, balance animates up.
//
//  Chapter 3 — Budgeting
//    Day 31:  Fin: "Before next month — give every dollar a job."
//             Budget setup bottom sheet (50/30/20 sliders).
//    Day 31:  After budget locked — Fin shows the allocation:
//             "Needs go automatically. Savings go automatically.
//              Every month I'll show you what happened."
//             User can choose: automate savings, or manually transfer.
//             If manual: "Go to bank" button appears. User sees transfer modal.
//
//  Chapter 4 — Emergency Fund
//    Day 32:  Fin: "One thing missing. An emergency fund."
//             Bottom sheet: set target (1–6 months expenses), set monthly contrib.
//             New "Emergency Fund" chip appears on balance strip.
//    Day 45+: Each month — spending notifications, then salary, then fund grows.
//             One random month: life event fires (broken phone, clinic visit).
//             Fin shows: "With fund: absorbed. Without fund: this would hurt."
//
//  Chapter 5 — Ongoing
//    Monthly: Fin narrates each month end.
//             Net worth chip updates.
//             Timeline dot fills in.
//
// ─── Data ────────────────────────────────────────────────────────────────────
//
//  sim.chapter          — 0|1|2|3|4|5  (which chapter we're in)
//  sim.scene            — string key for current scene within chapter
//  sim.simDay           — integer (starts at 1, increments as story advances)
//  sim.simMonth         — integer (starts at 1)
//  sim.wallets          — same as before
//  sim.ffn              — FI number
//  sim.monthlyBudget    — { needsPct, wantsPct, savingsPct, ... }
//  sim.spendHistory     — monthly spend summaries
//  sim.automatedSavings — bool (did user choose to automate)
//
// ─── Key design principle ────────────────────────────────────────────────────
//
//  Fin always has something to say. The user is never staring at a blank screen.
//  When a chapter is done, Fin bridges to the next one immediately.
//  The user can always scroll up to see the timeline of what happened.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Modal, Dimensions, ActivityIndicator,
  Alert, TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../../store/userStore';
import { loadSimProgress, saveSimProgress } from '../../lib/lifeSim';
import {
  createSimProgress, formatDual, BANK_ACCOUNTS, ACCOUNT_TYPES,
  SPENDING_TRANSACTIONS, EMERGENCY_EVENTS, calcInterestComparison,
} from '../../constants/lifeSimStages';
import { Colors, Fonts, Spacing, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';
import { auth } from '../../lib/firebase';

const { width: SW, height: SH } = Dimensions.get('window');
const TEAL   = MODULE_COLORS['module-1'].color;   // #3AAECC
const ORANGE = MODULE_COLORS['module-2'].color;   // #F5883A
const GREEN  = MODULE_COLORS['module-3'].color;   // #5BBF8A
const PURPLE = MODULE_COLORS['module-4'].color;   // #8B6FD4

// ─── Scene backgrounds ────────────────────────────────────────────────────────
const SCENE_BG = {
  arrival:    '#F0F9FD',
  banking:    '#FFF5EC',
  firstmonth: '#F0FDF4',
  budgeting:  '#EEF4FF',
  emergency:  '#FFF8F0',
  ongoing:    '#F5F0FF',
};

// ─── Day display ──────────────────────────────────────────────────────────────
function dayLabel(simDay, simMonth) {
  if (simDay <= 30)   return `Day ${simDay}`;
  const m = simMonth ?? Math.ceil(simDay / 30);
  const d = ((simDay - 1) % 30) + 1;
  return `Month ${m}, Day ${d}`;
}

// ─── Fin scenes ───────────────────────────────────────────────────────────────
// Each scene: lines Fin speaks, CTA that fires after all lines, background.
// The 'action' key tells the screen what bottom sheet / modal to open.

const SCENES = {
  // ── Chapter 0: Arrival ────────────────────────────────────────────────────
  'arrival-intro': {
    bg:     SCENE_BG.arrival,
    lines: [
      "Hey — I'm Fin. I'll be your guide here.",
      "You've been studying. Now it's time to actually do something with that knowledge.",
      "Your FinCoins from lessons have converted into starting cash. That's your seed money.",
      "But before we touch any of it — what are we working toward?",
    ],
    cta:    'Set my FI number →',
    action: 'fi-number',
  },
  'arrival-fi-done': {
    bg:     SCENE_BG.arrival,
    lines: [
      "That's your target. The number your whole financial life is working toward.",
      "Right now your cash is just sitting there — earning nothing, losing to inflation.",
      "First thing: get it into a bank account. Let's go.",
    ],
    cta:    'Open a bank account →',
    action: 'open-bank',
  },

  // ── Chapter 1: Banking ────────────────────────────────────────────────────
  'banking-account-open': {
    bg:     SCENE_BG.banking,
    lines: [
      "There it is. Your money has a home now.",
      "See that interest rate? Tiny for now. But it compounds — every single day.",
      "A month from now, you'll see the first interest payment land.",
      "For now though — time passes. Life costs money. Let's fast-forward.",
    ],
    cta:    'Advance to Month 1 →',
    action: 'advance-to-month1',
  },

  // ── Chapter 2: First Month ────────────────────────────────────────────────
  'month1-spending': {
    bg:     SCENE_BG.firstmonth,
    lines: [
      "A month just passed. You didn't even notice it — but your money did.",
      "Rent left. Transport left. Food left. That's just life in Singapore.",
      "Let me show you exactly where it went.",
    ],
    cta:    'Show me →',
    action: 'spending-notifications',
  },
  'month1-salary': {
    bg:     SCENE_BG.firstmonth,
    lines: [
      "And then — your salary landed.",
      "This is the moment most people feel briefly invincible.",
      "Most of it will be gone by next week if there's no plan.",
      "Let's make sure you have one.",
    ],
    cta:    'Receive my salary →',
    action: 'salary-landing',
  },

  // ── Chapter 3: Budgeting ──────────────────────────────────────────────────
  'budgeting-intro': {
    bg:     SCENE_BG.budgeting,
    lines: [
      "You've seen what a month actually costs. Now let's plan the next one.",
      "50% Needs. 30% Wants. 20% Savings.",
      "We'll set your budget right now. Every dollar gets a job.",
    ],
    cta:    'Set my budget →',
    action: 'set-budget',
  },
  'budgeting-done-auto': {
    bg:     SCENE_BG.budgeting,
    lines: [
      "Budget locked.",
      "Needs and savings will leave your account automatically each month.",
      "You won't have to think about it — it just happens.",
      "Next: your emergency fund. This one matters more than the rate.",
    ],
    cta:    'Set up emergency fund →',
    action: 'setup-emergency',
  },
  'budgeting-done-manual': {
    bg:     SCENE_BG.budgeting,
    lines: [
      "Budget locked. You chose to transfer manually.",
      "That's fine — some people prefer to stay hands-on.",
      "Let me show you how to move your savings to the right place.",
    ],
    cta:    'Transfer my savings →',
    action: 'manual-transfer',
  },

  // ── Chapter 4: Emergency Fund ─────────────────────────────────────────────
  'emergency-intro': {
    bg:     SCENE_BG.emergency,
    lines: [
      "This is the account most people skip. Don't.",
      "It's not about the interest rate. It's about not going into debt when life surprises you.",
      "Set a target. Put a little in each month. That's all it takes.",
    ],
    cta:    'Set my target →',
    action: 'set-fund-target',
  },
  'emergency-month-passes': {
    bg:     SCENE_BG.emergency,
    lines: [
      "Another month. Your salary landed, your needs were paid, and your fund grew.",
      "It doesn't feel like much. But this is how financial security is actually built.",
      "One month at a time.",
    ],
    cta:    'Next month →',
    action: 'advance-month',
  },
  'emergency-event': {
    bg:     SCENE_BG.emergency,
    lines: [
      "Something just happened.",
      "An unexpected expense hit — the kind that wrecks most people's months.",
      "Let's see how your fund handles it.",
    ],
    cta:    'See what happened →',
    action: 'show-life-event',
  },
  'emergency-complete': {
    bg:     SCENE_BG.emergency,
    lines: [
      "Emergency fund complete.",
      "You now have a real financial buffer. Most people never build one.",
      "From here — your money works for you. Not the other way around.",
    ],
    cta:    'Continue →',
    action: 'chapter-done',
  },

  // ── Chapter 5: Ongoing ────────────────────────────────────────────────────
  'ongoing-month-end': {
    bg:     SCENE_BG.ongoing,
    lines: [
      "Month done.",
      "Interest posted. Savings transferred. Fund growing.",
      "Here's what this month looked like.",
    ],
    cta:    'See report →',
    action: 'month-report',
  },
};

// ─── COST CATEGORIES (for FI number builder) ─────────────────────────────────
const COST_CATS = [
  { id: 'housing',   icon: '🏠', label: 'Housing',        tiers: [800,  1200, 2500] },
  { id: 'food',      icon: '🍜', label: 'Food',           tiers: [400,   650, 1200] },
  { id: 'transport', icon: '🚇', label: 'Transport',      tiers: [150,   250,  500] },
  { id: 'health',    icon: '🏥', label: 'Healthcare',     tiers: [200,   400,  800] },
  { id: 'travel',    icon: '✈️', label: 'Travel',         tiers: [0,     400, 1500] },
  { id: 'misc',      icon: '🎯', label: 'Personal',       tiers: [200,   350,  700] },
];
const TIER_LABELS = ['Low', 'Mid', 'High'];
const TIER_BG     = [Colors.successLight, Colors.warningLight, Colors.dangerLight];
const TIER_COLOR  = [Colors.successDark,  Colors.warningDark,  Colors.danger];

// ─── NEEDS BREAKDOWN (for spending notifications) ─────────────────────────────
const NEEDS_ITEMS = [
  { icon: '🏠', label: 'Rent & utilities',     pct: 0.50 },
  { icon: '🍚', label: 'Hawker & groceries',   pct: 0.30 },
  { icon: '🚇', label: 'Transport (MRT/bus)',  pct: 0.13 },
  { icon: '🏥', label: 'Healthcare',           pct: 0.07 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Bottom sheet component — slides up from bottom
// ─────────────────────────────────────────────────────────────────────────────

function BottomSheet({ visible, onClose, children, title, noClose }) {
  const slideY = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 55, friction: 11 }).start();
    } else {
      Animated.timing(slideY, { toValue: SH, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <View style={bs.backdrop}>
        {!noClose && (
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        )}
        <Animated.View style={[bs.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={bs.handle} />
          {title && <Text style={bs.title}>{title}</Text>}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const bs = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:    { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingTop: Spacing.md, maxHeight: SH * 0.92 },
  handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  title:    { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary, marginBottom: Spacing.lg },
});

// ─── Spending notification card (auto-dismissed) ──────────────────────────────

function SpendNotifCard({ item, onDismiss, delay = 0 }) {
  const slideX = useRef(new Animated.Value(-SW)).current;
  const opac   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
        Animated.timing(opac,   { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(slideX, { toValue: SW, duration: 280, useNativeDriver: true }),
        Animated.timing(opac,   { toValue: 0, duration: 280, useNativeDriver: true }),
      ]),
    ]).start(onDismiss);
  }, []);

  return (
    <Animated.View style={[sn.card, { transform: [{ translateX: slideX }], opacity: opac }]}>
      <Text style={sn.icon}>{item.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={sn.label}>{item.label}</Text>
        <Text style={sn.sub}>automatic · needs</Text>
      </View>
      <Text style={sn.amt}>−${item.amount.toLocaleString()}</Text>
    </Animated.View>
  );
}

const sn = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Shadows.soft },
  icon: { fontSize: 22 },
  label:{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  sub:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  amt:  { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textMuted },
});

// ─── Salary Modal — cinematic full-screen paycheck landing ───────────────────
//
// Three phases:
//   Phase 1 — "Your salary is about to land" — bank card shown with current balance
//   Phase 2 — Animated balance counting up, confetti falling, salary breakdown
//   Phase 3 — Summary + CPF note + "Continue →" CTA

const CONFETTI_COLORS = ['#F97B8B','#3AAECC','#5BBF8A','#F5883A','#8B6FD4','#E6A800','#FFF6A4'];

function ConfettiPiece({ index, sw, sh }) {
  const startX  = useRef(Math.random() * sw).current;
  const y       = useRef(new Animated.Value(-20)).current;
  const rotate  = useRef(new Animated.Value(0)).current;
  const opac    = useRef(new Animated.Value(1)).current;
  const size    = 5 + Math.random() * 8;
  const color   = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const dur     = 1400 + Math.random() * 900;
  const delay   = Math.random() * 600;
  const isRect  = index % 3 !== 0;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y,      { toValue: sh * 0.8, duration: dur, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 720 + Math.random() * 360, duration: dur, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(dur * 0.55),
          Animated.timing(opac, { toValue: 0, duration: dur * 0.45, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1080], outputRange: ['0deg', '1080deg'] });

  return (
    <Animated.View style={{
      position:        'absolute',
      top:             0,
      left:            startX,
      width:           isRect ? size : size * 1.2,
      height:          isRect ? size * 0.4 : size * 1.2,
      borderRadius:    isRect ? 2 : size,
      backgroundColor: color,
      opacity:         opac,
      transform:       [{ translateY: y }, { rotate: rotateDeg }],
    }} />
  );
}

function SalaryModal({ visible, sim, onDone }) {
  const [phase, setPhase] = useState(1); // 1=preview, 2=animating, 3=done
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayBal, setDisplayBal] = useState(0);
  const insets = useSafeAreaInsets();

  const income     = sim?.income ?? 2000;
  const bankW      = (sim?.wallets ?? []).find(w => w.type === 'bank');
  const preBal     = bankW?.balance ?? 0;
  const postBal    = preBal + income;
  const color      = bankW?.color ?? GREEN;

  // CPF approximation: ~20% employee contribution for Singapore residents
  const grossSalary = Math.round(income / 0.8);
  const cpfDeduct   = grossSalary - income;
  const institution = bankW?.institution ?? 'your bank';

  useEffect(() => {
    if (!visible) { setPhase(1); countAnim.setValue(0); setDisplayBal(preBal); }
  }, [visible]);

  const startAnimation = () => {
    setPhase(2);
    countAnim.setValue(preBal);
    const id = countAnim.addListener(({ value }) => setDisplayBal(Math.round(value)));
    Animated.timing(countAnim, {
      toValue:  postBal,
      duration: 2200,
      useNativeDriver: false,
    }).start(() => {
      countAnim.removeListener(id);
      setDisplayBal(postBal);
      setTimeout(() => setPhase(3), 400);
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={[sal.root, { backgroundColor: phase >= 2 ? '#0D1117' : Colors.background }]}>

        {/* Confetti — phase 2 only */}
        {phase === 2 && Array.from({ length: 32 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} sw={SW} sh={SH} />
        ))}

        <View style={[sal.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>

          {/* ── Phase 1: Preview ── */}
          {phase === 1 && (
            <>
              <View style={sal.bankCard}>
                <View style={[sal.bankLogo, { backgroundColor: color + '25' }]}>
                  <Text style={[sal.bankLogoText, { color }]}>{institution}</Text>
                </View>
                <Text style={sal.previewLabel}>Current balance</Text>
                <Text style={[sal.previewBal, { color: Colors.textPrimary }]}>
                  ${preBal.toLocaleString()}
                </Text>
                <View style={[sal.salaryPill, { backgroundColor: GREEN + '20' }]}>
                  <Text style={[sal.salaryPillText, { color: GREEN }]}>
                    +${income.toLocaleString()} salary incoming
                  </Text>
                </View>
              </View>

              <View style={sal.breakdownCard}>
                <Text style={sal.breakdownTitle}>Payslip breakdown</Text>
                <View style={sal.breakdownRow}>
                  <Text style={sal.breakdownLabel}>Gross salary</Text>
                  <Text style={sal.breakdownAmt}>${grossSalary.toLocaleString()}</Text>
                </View>
                <View style={sal.breakdownRow}>
                  <Text style={sal.breakdownLabel}>CPF contribution (~20%)</Text>
                  <Text style={[sal.breakdownAmt, { color: Colors.textMuted }]}>−${cpfDeduct.toLocaleString()}</Text>
                </View>
                <View style={[sal.breakdownRow, sal.breakdownTotal]}>
                  <Text style={[sal.breakdownLabel, { fontFamily: Fonts.bold }]}>Take-home pay</Text>
                  <Text style={[sal.breakdownAmt, { color: GREEN, fontFamily: Fonts.extraBold }]}>
                    ${income.toLocaleString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={[sal.cta, { backgroundColor: Colors.textPrimary }]} onPress={startAnimation} activeOpacity={0.88}>
                <Text style={sal.ctaText}>Watch it land 🎉</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Phase 2: Counting up ── */}
          {phase === 2 && (
            <View style={sal.countingWrap}>
              <View style={[sal.bankCard, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: color + '40' }]}>
                <Text style={[sal.bankLogoText, { color, marginBottom: 8 }]}>{institution}</Text>
                <Text style={sal.countingLabel}>Balance</Text>
                <Text style={[sal.countingNumber, { color }]}>
                  ${displayBal.toLocaleString()}
                </Text>
              </View>
              <View style={[sal.incomingBadge, { backgroundColor: GREEN + '25', borderColor: GREEN + '50' }]}>
                <Text style={[sal.incomingText, { color: GREEN }]}>+${income.toLocaleString()} landing…</Text>
              </View>
            </View>
          )}

          {/* ── Phase 3: Done ── */}
          {phase === 3 && (
            <>
              <View style={sal.doneCard}>
                <Text style={sal.doneEmoji}>🎉</Text>
                <Text style={[sal.doneTitle, { color }]}>Salary landed!</Text>
                <View style={[sal.bankLogo, { backgroundColor: color + '25', marginBottom: 4 }]}>
                  <Text style={[sal.bankLogoText, { color }]}>{institution}</Text>
                </View>
                <Text style={sal.doneBalLabel}>New balance</Text>
                <Text style={[sal.doneBal, { color }]}>${postBal.toLocaleString()}</Text>
                <Text style={sal.doneDelta}>↑ +${income.toLocaleString()} from salary</Text>
              </View>

              <View style={sal.finNote}>
                <Text style={sal.finNoteOwl}>🦉</Text>
                <Text style={sal.finNoteText}>
                  Most people feel rich for 48 hours and then wonder where it went. You won't — because next you're going to give every dollar a job.
                </Text>
              </View>

              <TouchableOpacity style={[sal.cta, { backgroundColor: Colors.textPrimary }]} onPress={onDone} activeOpacity={0.88}>
                <Text style={sal.ctaText}>Set my budget →</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

const sal = StyleSheet.create({
  root:            { flex: 1, justifyContent: 'center' },
  inner:           { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center', gap: Spacing.lg },
  bankCard:        { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.xl, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.border, ...Shadows.medium },
  bankLogo:        { borderRadius: Radii.md, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 4 },
  bankLogoText:    { fontFamily: Fonts.extraBold, fontSize: 14 },
  previewLabel:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  previewBal:      { fontFamily: Fonts.extraBold, fontSize: 32, marginBottom: 4 },
  salaryPill:      { borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 6 },
  salaryPillText:  { fontFamily: Fonts.bold, fontSize: 13 },
  breakdownCard:   { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.lg, gap: 8, borderWidth: 1, borderColor: Colors.border },
  breakdownTitle:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  breakdownRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownTotal:  { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 },
  breakdownLabel:  { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  breakdownAmt:    { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  cta:             { borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText:         { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },
  // Phase 2
  countingWrap:    { flex: 1, justifyContent: 'center', gap: Spacing.lg },
  countingLabel:   { fontFamily: Fonts.bold, fontSize: 13, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  countingNumber:  { fontFamily: Fonts.extraBold, fontSize: 52 },
  incomingBadge:   { borderRadius: Radii.full, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 8, alignSelf: 'center' },
  incomingText:    { fontFamily: Fonts.bold, fontSize: 15 },
  // Phase 3
  doneCard:        { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.xl, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border, ...Shadows.medium },
  doneEmoji:       { fontSize: 40, marginBottom: 4 },
  doneTitle:       { fontFamily: Fonts.extraBold, fontSize: 24, marginBottom: 4 },
  doneBalLabel:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  doneBal:         { fontFamily: Fonts.extraBold, fontSize: 40 },
  doneDelta:       { fontFamily: Fonts.bold, fontSize: 13, color: GREEN },
  finNote:         { flexDirection: 'row', gap: 10, backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'flex-start', borderWidth: 1, borderColor: Colors.border },
  finNoteOwl:      { fontSize: 22 },
  finNoteText:     { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
});

// ─── Wallet sheet ─────────────────────────────────────────────────────────────
// Tapping 👛 opens this — shows all accounts + a shortcut to the bank screen.

function WalletSheet({ visible, sim, onClose, onBankPress }) {
  const slideY  = useRef(new Animated.Value(SH)).current;
  const wallets = sim?.wallets ?? [];
  const total   = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 55, friction: 11 }).start();
    } else {
      Animated.timing(slideY, { toValue: SH, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <TouchableOpacity style={ws.backdrop} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[ws.sheet, { transform: [{ translateY: slideY }] }]}>
          <TouchableOpacity activeOpacity={1}>
            <View style={ws.handle} />

            <View style={ws.headerRow}>
              <View>
                <Text style={ws.title}>Your wallet</Text>
                <Text style={ws.totalLabel}>Net worth: <Text style={{ color: TEAL }}>${Math.round(total).toLocaleString()}</Text></Text>
              </View>
              <TouchableOpacity
                style={[ws.bankBtn, { backgroundColor: ORANGE }]}
                onPress={() => {
                  onClose();
                  setTimeout(onBankPress, 300);
                }}
                activeOpacity={0.88}
              >
                <Text style={ws.bankBtnText}>🏦  Go to bank</Text>
              </TouchableOpacity>
            </View>

            {wallets.length === 0 ? (
              <Text style={ws.empty}>No accounts yet. Follow Fin to open one.</Text>
            ) : (
              wallets.map(w => {
                const color = w.color ?? TEAL;
                const pct   = w.target > 0 ? Math.min((w.balance ?? 0) / w.target, 1) : null;
                return (
                  <View key={w.id} style={[ws.accountCard, { borderColor: color + '35' }]}>
                    <View style={ws.accountRow}>
                      <View style={[ws.accountIcon, { backgroundColor: color + '18' }]}>
                        <Text style={{ fontSize: 20 }}>{w.icon ?? '🏦'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[ws.accountName, { color }]}>{w.label}</Text>
                        {w.institution && <Text style={ws.accountInst}>{w.institution}{w.accountType === 'hysa' ? ' · HYSA ⚡' : ''}</Text>}
                        {w.interestRate > 0 && (
                          <Text style={ws.accountRate}>{(w.interestRate * 100).toFixed(2)}% p.a. · ~${Math.round((w.balance ?? 0) * w.interestRate)}/yr</Text>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[ws.accountBal, { color }]}>${Math.round(w.balance ?? 0).toLocaleString()}</Text>
                        <Text style={ws.accountCoins}>{Math.round((w.balance ?? 0) / 10)}🪙</Text>
                      </View>
                    </View>
                    {pct !== null && (
                      <View style={ws.progWrap}>
                        <View style={ws.progTrack}>
                          <View style={[ws.progFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
                        </View>
                        <Text style={ws.progLabel}>{Math.round(pct * 100)}% of ${Math.round(w.target ?? 0).toLocaleString()} target</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            <TouchableOpacity style={ws.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={ws.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const ws = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingTop: Spacing.md, maxHeight: SH * 0.85 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.lg },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  title:        { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textPrimary, marginBottom: 2 },
  totalLabel:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  bankBtn:      { borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 8 },
  bankBtnText:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.white },
  empty:        { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  accountCard:  { backgroundColor: Colors.white, borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  accountRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accountIcon:  { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  accountName:  { fontFamily: Fonts.bold, fontSize: 13, marginBottom: 1 },
  accountInst:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  accountRate:  { fontFamily: Fonts.regular, fontSize: 10, color: Colors.successDark, marginTop: 1 },
  accountBal:   { fontFamily: Fonts.extraBold, fontSize: 18 },
  accountCoins: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  progWrap:     { marginTop: Spacing.sm, gap: 4 },
  progTrack:    { height: 5, backgroundColor: Colors.lightGray, borderRadius: 3, overflow: 'hidden' },
  progFill:     { height: 5, borderRadius: 3 },
  progLabel:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  closeBtn:     { backgroundColor: Colors.lightGray, borderRadius: Radii.md, paddingVertical: 13, alignItems: 'center', marginTop: Spacing.md },
  closeBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
});

// ─── Balance strip ────────────────────────────────────────────────────────────

function BalanceStrip({ sim }) {
  const wallets = (sim?.wallets ?? []).filter(w => w.type !== 'wallet' || w.balance > 0);
  if (!wallets.length) {
    const cashBal = (sim?.wallets ?? []).find(w => w.id === 'wallet')?.balance ?? 0;
    if (!cashBal) return null;
    return (
      <View style={bal.strip}>
        <View style={bal.chip}>
          <Text style={bal.chipIcon}>💵</Text>
          <View>
            <Text style={bal.chipLabel}>CASH</Text>
            <Text style={[bal.chipAmt, { color: Colors.textMuted }]}>${Math.round(cashBal).toLocaleString()}</Text>
          </View>
        </View>
      </View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={bal.strip} contentContainerStyle={bal.stripInner}>
      {wallets.map(w => {
        const color = w.color ?? TEAL;
        const pct   = w.target > 0 ? Math.min((w.balance ?? 0) / w.target, 1) : null;
        return (
          <View key={w.id} style={[bal.chip, { borderColor: color + '40' }]}>
            <Text style={bal.chipIcon}>{w.icon ?? '🏦'}</Text>
            <View>
              <Text style={[bal.chipLabel, { color: color + 'CC' }]}>{w.institution ?? w.label ?? 'Account'}</Text>
              <Text style={[bal.chipAmt, { color }]}>${Math.round(w.balance ?? 0).toLocaleString()}</Text>
              {pct !== null && (
                <View style={bal.progRow}>
                  <View style={[bal.prog, { width: Math.round(pct * 60), backgroundColor: color }]} />
                  <View style={[bal.progBg, { width: 60 - Math.round(pct * 60) }]} />
                </View>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const bal = StyleSheet.create({
  strip:      { maxHeight: 80 },
  stripInner: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: 6 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, ...Shadows.soft },
  chipIcon:   { fontSize: 20 },
  chipLabel:  { fontFamily: Fonts.bold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  chipAmt:    { fontFamily: Fonts.extraBold, fontSize: 16 },
  progRow:    { flexDirection: 'row', marginTop: 3, borderRadius: 2, overflow: 'hidden' },
  prog:       { height: 3 },
  progBg:     { height: 3, backgroundColor: Colors.border },
});

// ─────────────────────────────────────────────────────────────────────────────
// Action sheets — each 'action' key maps to one of these
// ─────────────────────────────────────────────────────────────────────────────

// FI Number Builder
function FINumberSheet({ sim, onDone }) {
  const [page,  setPage]  = useState(0); // 0 = explanation, 1 = builder
  const [tiers, setTiers] = useState(
    Object.fromEntries(COST_CATS.map(c => [c.id, 1]))
  );
  const monthlyTotal = COST_CATS.reduce((s, c) => s + c.tiers[tiers[c.id]], 0);
  const ffn = Math.round(monthlyTotal * 12 * 25);

  // ── Page 0: What is FI? ──────────────────────────────────────────────────
  if (page === 0) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero concept */}
        <View style={fi_s.heroBox}>
          <Text style={fi_s.heroEmoji}>🏝️</Text>
          <Text style={[fi_s.heroTitle, { color: TEAL }]}>Financial Independence</Text>
          <Text style={fi_s.heroSub}>
            The point where your investments generate enough passive income to cover your living expenses — forever. You never have to work again unless you want to.
          </Text>
        </View>

        {/* The 4% rule */}
        <View style={fi_s.section}>
          <Text style={fi_s.sectionTitle}>The 4% Rule</Text>
          <Text style={fi_s.sectionBody}>
            Research shows that if you withdraw 4% of your invested portfolio each year, it will last indefinitely — because a diversified portfolio historically grows at ~7% p.a., outpacing both your withdrawals and inflation.
          </Text>
          <View style={fi_s.formulaBox}>
            <View style={fi_s.formulaRow}>
              <View style={fi_s.formulaItem}>
                <Text style={fi_s.formulaNum}>$5,000</Text>
                <Text style={fi_s.formulaLbl}>monthly expenses</Text>
              </View>
              <Text style={fi_s.formulaOp}>×</Text>
              <View style={fi_s.formulaItem}>
                <Text style={fi_s.formulaNum}>12</Text>
                <Text style={fi_s.formulaLbl}>months</Text>
              </View>
              <Text style={fi_s.formulaOp}>×</Text>
              <View style={fi_s.formulaItem}>
                <Text style={fi_s.formulaNum}>25</Text>
                <Text style={fi_s.formulaLbl}>years (100 ÷ 4%)</Text>
              </View>
            </View>
            <View style={[fi_s.formulaResult, { backgroundColor: TEAL + '18' }]}>
              <Text style={[fi_s.formulaResultText, { color: TEAL }]}>= $1,500,000 FI Number</Text>
            </View>
          </View>
        </View>

        {/* Why it matters */}
        <View style={fi_s.section}>
          <Text style={fi_s.sectionTitle}>Why calculate it now?</Text>
          <Text style={fi_s.sectionBody}>
            Most people save without a target — which means they save randomly. Your FI Number gives every financial decision a direction. Skipping a delivery order, opening a HYSA, investing 20% — these aren't restrictions. They're steps toward a specific number.
          </Text>
        </View>

        {/* Key terms */}
        <View style={fi_s.termRow}>
          <View style={[fi_s.termBox, { backgroundColor: TEAL + '12' }]}>
            <Text style={fi_s.termIcon}>💼</Text>
            <Text style={[fi_s.termTitle, { color: TEAL }]}>Active income</Text>
            <Text style={fi_s.termDesc}>Money you earn by working. Stops when you stop.</Text>
          </View>
          <View style={[fi_s.termBox, { backgroundColor: GREEN + '12' }]}>
            <Text style={fi_s.termIcon}>🌱</Text>
            <Text style={[fi_s.termTitle, { color: GREEN }]}>Passive income</Text>
            <Text style={fi_s.termDesc}>Money your investments earn. Keeps going while you sleep.</Text>
          </View>
        </View>

        <TouchableOpacity style={[act.cta, { backgroundColor: Colors.textPrimary }]} onPress={() => setPage(1)} activeOpacity={0.88}>
          <Text style={act.ctaText}>Calculate my FI Number →</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    );
  }

  // ── Page 1: Lifestyle builder ─────────────────────────────────────────────
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => setPage(0)} style={{ marginBottom: Spacing.sm }}>
        <Text style={[act.backLink, { color: TEAL }]}>← What is FI?</Text>
      </TouchableOpacity>
      <Text style={act.label}>Your target monthly lifestyle in retirement</Text>
      <Text style={act.hint}>Tap each row to cycle Low → Mid → High. Be honest.</Text>
      <View style={act.catList}>
        {COST_CATS.map(cat => {
          const t = tiers[cat.id];
          return (
            <TouchableOpacity
              key={cat.id}
              style={act.catRow}
              onPress={() => setTiers(prev => ({ ...prev, [cat.id]: (t + 1) % 3 }))}
              activeOpacity={0.75}
            >
              <Text style={act.catIcon}>{cat.icon}</Text>
              <Text style={act.catLabel}>{cat.label}</Text>
              <View style={[act.tierPill, { backgroundColor: TIER_BG[t] }]}>
                <Text style={[act.tierText, { color: TIER_COLOR[t] }]}>{TIER_LABELS[t]}</Text>
              </View>
              <Text style={[act.catAmt, { color: TIER_COLOR[t] }]}>${cat.tiers[t].toLocaleString()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={act.ffnResult}>
        <Text style={act.ffnLabel}>Your FI Number</Text>
        <Text style={[act.ffnAmt, { color: TEAL }]}>${ffn.toLocaleString()}</Text>
        <Text style={[act.ffnFormula, { color: TEAL }]}>${monthlyTotal.toLocaleString()}/mo × 12 × 25</Text>
        <Text style={fi_s.ffnNote}>
          At 4% withdrawal, ${ffn.toLocaleString()} invested generates ${monthlyTotal.toLocaleString()}/mo — enough to cover this lifestyle without ever working again.
        </Text>
      </View>
      <TouchableOpacity style={[act.cta, { backgroundColor: Colors.textPrimary }]} onPress={() => onDone({ ffn, monthlyTotal })} activeOpacity={0.88}>
        <Text style={act.ctaText}>Lock this in →</Text>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// FI explanation styles
const fi_s = StyleSheet.create({
  heroBox:         { alignItems: 'center', backgroundColor: TEAL + '10', borderRadius: Radii.xl, padding: Spacing.xl, marginBottom: Spacing.lg, gap: Spacing.sm },
  heroEmoji:       { fontSize: 40 },
  heroTitle:       { fontFamily: Fonts.extraBold, fontSize: 22, textAlign: 'center' },
  heroSub:         { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  section:         { marginBottom: Spacing.lg },
  sectionTitle:    { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary, marginBottom: 6 },
  sectionBody:     { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  formulaBox:      { backgroundColor: Colors.white, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginTop: Spacing.sm, gap: Spacing.sm },
  formulaRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  formulaItem:     { alignItems: 'center', flex: 1 },
  formulaNum:      { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  formulaLbl:      { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted, textAlign: 'center', lineHeight: 13 },
  formulaOp:       { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted },
  formulaResult:   { borderRadius: Radii.md, padding: Spacing.sm, alignItems: 'center' },
  formulaResultText:{ fontFamily: Fonts.extraBold, fontSize: 15 },
  termRow:         { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  termBox:         { flex: 1, borderRadius: Radii.lg, padding: Spacing.md, gap: 4 },
  termIcon:        { fontSize: 22 },
  termTitle:       { fontFamily: Fonts.bold, fontSize: 13 },
  termDesc:        { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary, lineHeight: 17 },
  ffnNote:         { fontFamily: Fonts.regular, fontSize: 12, color: TEAL, textAlign: 'center', lineHeight: 18, marginTop: 4 },
});

// Bank Account Opener
function BankAccountSheet({ sim, onDone }) {
  const [step,         setStep]         = useState(1); // 1=type, 2=bank
  const [accountType,  setAccountType]  = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const cashBal = (sim?.wallets ?? []).find(w => w.id === 'wallet')?.balance ?? 0;
  const { basicEarned, hysaEarned, difference } = calcInterestComparison(cashBal);
  const availBanks = accountType ? BANK_ACCOUNTS.filter(b => b.accountType === accountType) : [];
  const chosenBank = BANK_ACCOUNTS.find(b => b.id === selectedBank);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {step === 1 && (
        <>
          <Text style={act.label}>What kind of account?</Text>
          {cashBal > 0 && (
            <View style={act.compareBanner}>
              <Text style={act.compareTitle}>On your ${Math.round(cashBal).toLocaleString()} this year:</Text>
              <View style={act.compareRow}>
                <View style={act.compareCol}>
                  <Text style={act.compareColLabel}>Basic</Text>
                  <Text style={[act.compareColAmt, { color: Colors.textMuted }]}>${basicEarned}</Text>
                </View>
                <View style={[act.compareDivider]} />
                <View style={act.compareCol}>
                  <Text style={act.compareColLabel}>HYSA</Text>
                  <Text style={[act.compareColAmt, { color: ORANGE }]}>${hysaEarned}</Text>
                </View>
                <View style={[act.compareDivider]} />
                <View style={act.compareCol}>
                  <Text style={act.compareColLabel}>Diff</Text>
                  <Text style={[act.compareColAmt, { color: GREEN }]}>+${difference}</Text>
                </View>
              </View>
            </View>
          )}
          {ACCOUNT_TYPES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[act.typeCard, accountType === t.id && { borderColor: t.color, borderWidth: 2 }]}
              onPress={() => { setAccountType(t.id); setSelectedBank(null); setTimeout(() => setStep(2), 280); }}
              activeOpacity={0.85}
            >
              <Text style={[act.typeTitle, { color: t.color }]}>{t.icon} {t.label}</Text>
              <Text style={act.typeTagline}>{t.tagline}</Text>
              <Text style={[act.typeRate, { color: t.color }]}>
                {t.id === 'hysa' ? 'Up to 4%+ p.a. with conditions' : '0.05% p.a. — simple, no requirements'}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}
      {step === 2 && (
        <>
          <TouchableOpacity onPress={() => { setStep(1); setSelectedBank(null); }} style={{ marginBottom: Spacing.md }}>
            <Text style={[act.backLink, { color: ORANGE }]}>← Back to account type</Text>
          </TouchableOpacity>
          <Text style={act.label}>{accountType === 'hysa' ? 'Which bank?' : 'Open with DBS'}</Text>
          {availBanks.map(bank => (
            <TouchableOpacity
              key={bank.id}
              style={[act.bankCard, selectedBank === bank.id && { borderColor: bank.color, borderWidth: 2 }]}
              onPress={() => setSelectedBank(bank.id)}
              activeOpacity={0.85}
            >
              <View style={act.bankRow}>
                <View style={[act.bankLogo, { backgroundColor: bank.colorLight }]}>
                  <Text style={[act.bankLogoText, { color: bank.color }]}>{bank.bank}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={act.bankName}>{bank.name}</Text>
                  <Text style={[act.bankRate, { color: bank.color }]}>
                    {bank.bonusRate > 0 ? `up to ${(bank.bonusRate * 100).toFixed(1)}% p.a.` : '0.05% p.a.'}
                  </Text>
                </View>
                {selectedBank === bank.id && (
                  <View style={[act.checkBadge, { backgroundColor: bank.color }]}>
                    <Text style={act.checkText}>✓</Text>
                  </View>
                )}
              </View>
              {bank.minBalance > 0 && (
                <Text style={act.minBal}>Min. ${bank.minBalance.toLocaleString()} · ${bank.fallBelowFee}/mo fee if below</Text>
              )}
            </TouchableOpacity>
          ))}
          {selectedBank && (
            <TouchableOpacity style={[act.cta, { backgroundColor: Colors.textPrimary }]} onPress={() => onDone({ bankId: selectedBank, accountType, bank: chosenBank })} activeOpacity={0.88}>
              <Text style={act.ctaText}>Open {chosenBank?.bank} account →</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// Budget Setup
function BudgetSheet({ sim, onDone }) {
  const income  = sim?.income ?? 2000;
  const [needs, setNeeds]   = useState(50);
  const [wants, setWants]   = useState(30);
  const savings = 100 - needs - wants;
  const needsAmt   = Math.round(income * needs / 100);
  const wantsAmt   = Math.round(income * wants / 100);
  const savingsAmt = Math.round(income * savings / 100);
  const [automate, setAutomate] = useState(null); // null | true | false

  const handleNeedsChange = v => {
    const n = Math.round(v);
    const remaining = 100 - n;
    if (remaining < 10) return;
    setNeeds(n);
    const newWants = Math.min(wants, remaining - 10);
    setWants(newWants);
  };

  if (automate === null) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={act.label}>Your income: ${income.toLocaleString()}/month</Text>
        <View style={act.sliderBlock}>
          <View style={act.sliderRow}>
            <Text style={act.sliderIcon}>🏠</Text>
            <Text style={act.sliderLabel}>Needs <Text style={{ color: TEAL, fontFamily: Fonts.extraBold }}>{needs}%</Text></Text>
            <Text style={[act.sliderAmt, { color: TEAL }]}>${needsAmt.toLocaleString()}</Text>
          </View>
          <Slider minimumValue={30} maximumValue={70} step={1} value={needs} onValueChange={handleNeedsChange} minimumTrackTintColor={TEAL} thumbTintColor={TEAL} />
        </View>
        <View style={act.sliderBlock}>
          <View style={act.sliderRow}>
            <Text style={act.sliderIcon}>🎉</Text>
            <Text style={act.sliderLabel}>Wants <Text style={{ color: ORANGE, fontFamily: Fonts.extraBold }}>{wants}%</Text></Text>
            <Text style={[act.sliderAmt, { color: ORANGE }]}>${wantsAmt.toLocaleString()}</Text>
          </View>
          <Slider minimumValue={10} maximumValue={Math.max(10, 100 - needs - 10)} step={1} value={wants} onValueChange={v => setWants(Math.round(v))} minimumTrackTintColor={ORANGE} thumbTintColor={ORANGE} />
        </View>
        <View style={[act.savingsRow, { backgroundColor: GREEN + '15' }]}>
          <Text style={act.savingsIcon}>💰</Text>
          <Text style={act.savingsLabel}>Savings</Text>
          <Text style={[act.savingsPct, { color: GREEN }]}>{savings}%</Text>
          <Text style={[act.savingsAmt2, { color: GREEN }]}>${savingsAmt.toLocaleString()}/mo</Text>
        </View>

        <Text style={[act.label, { marginTop: Spacing.lg }]}>How do you want to handle savings?</Text>
        <TouchableOpacity style={act.automateCard} onPress={() => setAutomate(true)} activeOpacity={0.85}>
          <Text style={act.automateIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={act.automateTitle}>Automate it</Text>
            <Text style={act.automateSub}>Savings transfer automatically each month. You don't think about it.</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={act.automateCard} onPress={() => setAutomate(false)} activeOpacity={0.85}>
          <Text style={act.automateIcon}>🏦</Text>
          <View style={{ flex: 1 }}>
            <Text style={act.automateTitle}>I'll transfer manually</Text>
            <Text style={act.automateSub}>Each month I'll go to the bank and move my savings myself.</Text>
          </View>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    );
  }

  return (
    <View style={{ gap: Spacing.md }}>
      <View style={act.budgetSummary}>
        <View style={act.budgetSummaryRow}><Text style={act.budgetSummaryLabel}>🏠 Needs</Text><Text style={[act.budgetSummaryAmt, { color: TEAL }]}>${needsAmt.toLocaleString()}/mo</Text></View>
        <View style={act.budgetSummaryRow}><Text style={act.budgetSummaryLabel}>🎉 Wants</Text><Text style={[act.budgetSummaryAmt, { color: ORANGE }]}>${wantsAmt.toLocaleString()}/mo</Text></View>
        <View style={act.budgetSummaryRow}><Text style={act.budgetSummaryLabel}>💰 Savings</Text><Text style={[act.budgetSummaryAmt, { color: GREEN }]}>${savingsAmt.toLocaleString()}/mo</Text></View>
      </View>
      <View style={[act.savingsRow, { backgroundColor: automate ? GREEN + '15' : ORANGE + '15' }]}>
        <Text style={{ fontSize: 18 }}>{automate ? '⚡' : '🏦'}</Text>
        <Text style={[act.savingsLabel, { color: automate ? GREEN : ORANGE }]}>
          {automate ? 'Savings will transfer automatically each month' : 'You\'ll manually transfer savings to the bank'}
        </Text>
      </View>
      <TouchableOpacity style={[act.cta, { backgroundColor: Colors.textPrimary }]} onPress={() => onDone({ needs, wants, savings, needsAmt, wantsAmt, savingsAmt, automate })} activeOpacity={0.88}>
        <Text style={act.ctaText}>Lock in this budget →</Text>
      </TouchableOpacity>
    </View>
  );
}

// Manual Transfer Sheet
function ManualTransferSheet({ sim, onDone }) {
  const savingsAmt = sim?.monthlyBudget?.savingsAmt ?? 0;
  const bankBal    = (sim?.wallets ?? []).find(w => w.type === 'bank')?.balance ?? 0;
  const fundBal    = (sim?.wallets ?? []).find(w => w.id === 'emergency-fund')?.balance ?? 0;
  const fundTarget = (sim?.wallets ?? []).find(w => w.id === 'emergency-fund')?.target ?? 0;
  const [transferred, setTransferred] = useState(false);

  return (
    <View style={{ gap: Spacing.md }}>
      <View style={act.transferPreview}>
        <View style={act.transferBox}>
          <Text style={act.transferIcon}>🏦</Text>
          <Text style={act.transferLabel}>Bank account</Text>
          <Text style={[act.transferAmt, { color: ORANGE }]}>${Math.round(bankBal).toLocaleString()}</Text>
          {!transferred
            ? <Text style={act.transferAfter}>→ ${Math.round(bankBal - savingsAmt).toLocaleString()} after</Text>
            : <Text style={[act.transferAfter, { color: GREEN }]}>✓ done</Text>
          }
        </View>
        <Text style={act.transferArrow}>→</Text>
        <View style={act.transferBox}>
          <Text style={act.transferIcon}>🛡️</Text>
          <Text style={act.transferLabel}>Emergency fund</Text>
          <Text style={[act.transferAmt, { color: GREEN }]}>${Math.round(fundBal + (transferred ? savingsAmt : 0)).toLocaleString()}</Text>
          {fundTarget > 0 && (
            <Text style={act.transferAfter}>{Math.round(((fundBal + savingsAmt) / fundTarget) * 100)}% of target</Text>
          )}
        </View>
      </View>
      <View style={act.transferDetail}>
        <Text style={act.transferDetailText}>Transferring ${savingsAmt.toLocaleString()} — your monthly savings allocation</Text>
      </View>
      {!transferred
        ? <TouchableOpacity style={[act.cta, { backgroundColor: Colors.textPrimary }]} onPress={() => setTransferred(true)} activeOpacity={0.88}>
            <Text style={act.ctaText}>Transfer ${savingsAmt.toLocaleString()} →</Text>
          </TouchableOpacity>
        : <TouchableOpacity style={[act.cta, { backgroundColor: Colors.textPrimary }]} onPress={onDone} activeOpacity={0.88}>
            <Text style={act.ctaText}>Done ✓</Text>
          </TouchableOpacity>
      }
    </View>
  );
}

// Emergency Fund Setup
function EmergencyFundSheet({ sim, onDone }) {
  const needs      = sim?.monthlyBudget?.needsAmt ?? Math.round((sim?.income ?? 2000) * 0.5);
  const [months, setMonths] = useState(3);
  const target = needs * months;
  const monthlyContrib = sim?.monthlyBudget?.savingsAmt ?? Math.round((sim?.income ?? 2000) * 0.2);
  const monthsToFull = Math.ceil(target / monthlyContrib);

  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={act.label}>How many months of expenses to protect?</Text>
      <View style={act.monthChips}>
        {[1,2,3,4,6].map(m => (
          <TouchableOpacity key={m} style={[act.monthChip, months === m && { backgroundColor: GREEN, borderColor: GREEN }]} onPress={() => setMonths(m)} activeOpacity={0.8}>
            <Text style={[act.monthChipText, months === m && { color: Colors.white }]}>{m}mo</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={[act.fundResult, { backgroundColor: GREEN + '12' }]}>
        <View style={act.fundResultRow}>
          <Text style={act.fundResultLabel}>Target</Text>
          <Text style={[act.fundResultAmt, { color: GREEN }]}>${target.toLocaleString()}</Text>
        </View>
        <View style={act.fundResultRow}>
          <Text style={act.fundResultLabel}>Monthly contribution</Text>
          <Text style={[act.fundResultAmt, { color: GREEN }]}>${monthlyContrib.toLocaleString()}</Text>
        </View>
        <View style={act.fundResultRow}>
          <Text style={act.fundResultLabel}>Fully funded in</Text>
          <Text style={[act.fundResultAmt, { color: GREEN }]}>{monthsToFull} month{monthsToFull !== 1 ? 's' : ''}</Text>
        </View>
      </View>
      <TouchableOpacity style={[act.cta, { backgroundColor: Colors.textPrimary }]} onPress={() => onDone({ target, monthlyContrib, months })} activeOpacity={0.88}>
        <Text style={act.ctaText}>Set up emergency fund →</Text>
      </TouchableOpacity>
    </View>
  );
}

// Life Event Modal
function LifeEventModal({ event, hasFund, onClose }) {
  if (!event) return null;
  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View style={le.backdrop}>
        <View style={le.card}>
          <Text style={le.icon}>{event.icon}</Text>
          <Text style={le.title}>{event.title}</Text>
          <Text style={le.desc}>{event.description}</Text>
          <Text style={le.costLabel}>Cost: <Text style={{ color: Colors.danger }}>${event.amount}</Text></Text>
          <View style={[le.outcomePath, { backgroundColor: hasFund ? Colors.successLight : Colors.warningLight, borderColor: hasFund ? Colors.successDark + '40' : Colors.warningDark + '40' }]}>
            <Text style={[le.outcomeLabel, { color: hasFund ? Colors.successDark : Colors.warningDark }]}>
              {hasFund ? '✓ With emergency fund' : '⚠ Without emergency fund'}
            </Text>
            <Text style={[le.outcomeText, { color: hasFund ? Colors.successDark : Colors.warningDark }]}>
              {hasFund ? event.withFundPath : (event.withoutFundPath ?? '').replace('{weeks}', '3')}
            </Text>
          </View>
          <Text style={le.finNote}>{event.finMessage}</Text>
          <TouchableOpacity style={[le.btn, { backgroundColor: Colors.textPrimary }]} onPress={onClose} activeOpacity={0.88}>
            <Text style={le.btnText}>Understood →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const le = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  card:         { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.xl, width: '100%', gap: Spacing.sm, ...Shadows.medium },
  icon:         { fontSize: 40, textAlign: 'center' },
  title:        { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary, textAlign: 'center' },
  desc:         { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, textAlign: 'center' },
  costLabel:    { fontFamily: Fonts.bold, fontSize: 13, textAlign: 'center' },
  outcomePath:  { borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md },
  outcomeLabel: { fontFamily: Fonts.bold, fontSize: 13, marginBottom: 4 },
  outcomeText:  { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 18 },
  finNote:      { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  btn:          { borderRadius: Radii.lg, paddingVertical: 14, alignItems: 'center' },
  btnText:      { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});

// Action sheet styles
const act = StyleSheet.create({
  label:           { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm },
  hint:            { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.md },
  catList:         { borderRadius: Radii.lg, overflow: 'hidden', marginBottom: Spacing.md },
  catRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  catIcon:         { fontSize: 20, width: 28 },
  catLabel:        { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  catAmt:          { fontFamily: Fonts.bold, fontSize: 14 },
  tierPill:        { borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  tierText:        { fontFamily: Fonts.bold, fontSize: 10 },
  ffnResult:       { backgroundColor: MODULE_COLORS['module-1'].colorLight, borderRadius: Radii.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md, gap: 4 },
  ffnLabel:        { fontFamily: Fonts.bold, fontSize: 11, color: TEAL, textTransform: 'uppercase', letterSpacing: 0.6 },
  ffnAmt:          { fontFamily: Fonts.extraBold, fontSize: 36 },
  ffnFormula:      { fontFamily: Fonts.regular, fontSize: 12, color: TEAL },
  cta:             { borderRadius: Radii.lg, paddingVertical: 15, alignItems: 'center', marginTop: Spacing.sm },
  ctaText:         { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  backLink:        { fontFamily: Fonts.semiBold, fontSize: 14 },
  compareBanner:   { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md },
  compareTitle:    { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.sm },
  compareRow:      { flexDirection: 'row', alignItems: 'center' },
  compareCol:      { flex: 1, alignItems: 'center' },
  compareColLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 3 },
  compareColAmt:   { fontFamily: Fonts.extraBold, fontSize: 20 },
  compareDivider:  { width: 1, height: 32, backgroundColor: Colors.border, marginHorizontal: 4 },
  typeCard:        { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  typeTitle:       { fontFamily: Fonts.extraBold, fontSize: 15, marginBottom: 3 },
  typeTagline:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  typeRate:        { fontFamily: Fonts.bold, fontSize: 12 },
  bankCard:        { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  bankRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bankLogo:        { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  bankLogoText:    { fontFamily: Fonts.extraBold, fontSize: 12 },
  bankName:        { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 2 },
  bankRate:        { fontFamily: Fonts.extraBold, fontSize: 16 },
  checkBadge:      { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  checkText:       { fontFamily: Fonts.extraBold, fontSize: 12, color: Colors.white },
  minBal:          { fontFamily: Fonts.regular, fontSize: 11, color: Colors.warningDark, backgroundColor: Colors.warningLight, borderRadius: Radii.sm, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  sliderBlock:     { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  sliderRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sliderIcon:      { fontSize: 18 },
  sliderLabel:     { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  sliderAmt:       { fontFamily: Fonts.extraBold, fontSize: 16 },
  savingsRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radii.lg, padding: Spacing.md },
  savingsIcon:     { fontSize: 20 },
  savingsLabel:    { fontFamily: Fonts.regular, fontSize: 13, flex: 1 },
  savingsPct:      { fontFamily: Fonts.extraBold, fontSize: 18 },
  savingsAmt2:     { fontFamily: Fonts.bold, fontSize: 13 },
  automateCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  automateIcon:    { fontSize: 26 },
  automateTitle:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 2 },
  automateSub:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  budgetSummary:   { backgroundColor: Colors.lightGray, borderRadius: Radii.lg, padding: Spacing.md, gap: 8 },
  budgetSummaryRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetSummaryLabel:{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  budgetSummaryAmt:{ fontFamily: Fonts.extraBold, fontSize: 16 },
  transferPreview: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  transferBox:     { flex: 1, backgroundColor: Colors.lightGray, borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'center', gap: 3 },
  transferIcon:    { fontSize: 26 },
  transferLabel:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  transferAmt:     { fontFamily: Fonts.extraBold, fontSize: 18 },
  transferAfter:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  transferArrow:   { fontFamily: Fonts.bold, fontSize: 22, color: Colors.textMuted },
  transferDetail:  { backgroundColor: Colors.successLight, borderRadius: Radii.md, padding: Spacing.sm },
  transferDetailText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.successDark },
  monthChips:      { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  monthChip:       { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.white },
  monthChipText:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSecondary },
  fundResult:      { borderRadius: Radii.lg, padding: Spacing.md, gap: 8 },
  fundResultRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fundResultLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  fundResultAmt:   { fontFamily: Fonts.extraBold, fontSize: 16 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function SimulateScreen() {
  const insets  = useSafeAreaInsets();
  const profile = useUserStore(s => s.profile);
  const router  = useRouter();

  const [sim,          setSim]          = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [lineIdx,      setLineIdx]      = useState(0);
  const [ctaReady,     setCtaReady]     = useState(false);
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [notifIdx,     setNotifIdx]     = useState(0);
  const [lifeEvent,    setLifeEvent]    = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [showWallet,   setShowWallet]   = useState(false); // wallet bottom sheet
  const [showSalary,   setShowSalary]   = useState(false); // cinematic salary modal

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const uid       = auth.currentUser?.uid;

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadSim = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await loadSimProgress(uid);
      setSim(data);
      setLineIdx(0);
      setCtaReady(false);
    } catch (e) { console.error('sim load:', e); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { loadSim(); }, []);
  useFocusEffect(useCallback(() => { loadSim(); }, [loadSim]));

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = () => {
    Alert.alert(
      'Reset simulation?',
      'This wipes all accounts, balances, and story progress. Your FinCoins and lesson completions are unaffected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const fresh = createSimProgress(uid, profile?.finCoins ?? 0);
            // Reset scene/chapter/day fields
            const resetState = {
              ...fresh,
              scene:    'arrival-intro',
              chapter:  0,
              simDay:   1,
              simMonth: 1,
              shownSteps: [],
              lifeEventFired: false,
              wantsDecisions: {},
              wantsEvents: {},
              spendHistory: [],
              history: [],
              automatedSavings: null,
            };
            await saveSimProgress(uid, resetState);
            setSim(resetState);
            setLineIdx(0);
            setCtaReady(false);
            setSheetOpen(false);
            setShowNotifs(false);
            setNotifIdx(0);
            setLifeEvent(null);
          },
        },
      ]
    );
  };

  // ── Current scene ─────────────────────────────────────────────────────────

  const sceneKey = (() => {
    if (!sim) return 'arrival-intro';
    const ch = sim.chapter ?? 0;
    const sc = sim.scene   ?? 'arrival-intro';
    return sc;
  })();

  const scene    = SCENES[sceneKey] ?? SCENES['arrival-intro'];
  const lines    = scene.lines;
  const bgColor  = scene.bg ?? Colors.background;
  const action   = scene.action;

  // ── Advance line ──────────────────────────────────────────────────────────

  const advanceLine = () => {
    if (ctaReady) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      if (lineIdx + 1 >= lines.length) {
        setCtaReady(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      } else {
        setLineIdx(i => i + 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }
    });
  };

  // ── Save scene ────────────────────────────────────────────────────────────

  const saveScene = async (newScene, extraData = {}) => {
    const updated = { ...sim, scene: newScene, ...extraData, updatedAt: Date.now() };
    setSim(updated);
    setLineIdx(0);
    setCtaReady(false);
    await saveSimProgress(uid, { scene: newScene, ...extraData });
  };

  // ── Handle CTA press ──────────────────────────────────────────────────────

  const handleCta = () => {
    // For spending notifications, launch inline notification flow
    if (action === 'spending-notifications') {
      setShowNotifs(true);
      return;
    }
    // For advance-to-month1, just advance scene (no sheet needed)
    if (action === 'advance-to-month1') {
      saveScene('month1-spending');
      return;
    }
    // For advance-month
    if (action === 'advance-month') {
      handleAdvanceMonth();
      return;
    }
    // For chapter-done
    if (action === 'chapter-done') {
      saveScene('ongoing-month-end');
      return;
    }
    // For month-report
    if (action === 'month-report') {
      setSheetOpen(true);
      return;
    }
    // For show-life-event
    if (action === 'show-life-event') {
      const eventIdx = (sim?.simMonth ?? 1) % EMERGENCY_EVENTS.length;
      const hasFund  = (sim?.wallets ?? []).some(w => w.id === 'emergency-fund' && (w.balance ?? 0) > 0);
      setLifeEvent({ event: EMERGENCY_EVENTS[eventIdx], hasFund });
      return;
    }
    // Salary → cinematic full-screen modal
    if (action === 'salary-landing') {
      setShowSalary(true);
      return;
    }
    // All other actions open the bottom sheet
    setSheetOpen(true);
  };

  // ── Action completions ────────────────────────────────────────────────────

  const handleFINumberDone = async ({ ffn, monthlyTotal }) => {
    setSheetOpen(false);
    setSaving(true);
    try {
      const updates = { ffn, monthlyTotal, chapter: 0, simDay: 2, simMonth: 1 };
      await saveScene('arrival-fi-done', updates);
    } finally { setSaving(false); }
  };

  const handleBankDone = async ({ bankId, accountType, bank }) => {
    setSheetOpen(false);
    setSaving(true);
    try {
      const cashWallet    = (sim?.wallets ?? []).find(w => w.id === 'wallet');
      const openingBalance = cashWallet?.balance ?? 0;
      const bankWallet = {
        id:          bank.id,
        type:        'bank',
        label:       bank.name,
        icon:        '🏦',
        balance:     openingBalance,
        interestRate: bank.baseRate,
        bonusRate:   bank.bonusRate > 0 ? bank.bonusRate : null,
        accountType,
        color:       bank.color,
        colorLight:  bank.colorLight,
        institution: bank.bank,
        minBalance:  bank.minBalance,
        fallBelowFee: bank.fallBelowFee,
        interestLog: [],
        openedMonth: 1,
      };
      const updatedWallets = [
        ...(sim?.wallets ?? []).map(w => w.id === 'wallet' ? { ...w, balance: 0 } : w),
        bankWallet,
      ];
      await saveScene('banking-account-open', {
        wallets: updatedWallets,
        bankAccountId: bank.id,
        chapter: 1,
        simDay: 3,
      });
    } finally { setSaving(false); }
  };

  const handleBudgetDone = async ({ needs, wants, savings, needsAmt, wantsAmt, savingsAmt, automate }) => {
    setSheetOpen(false);
    setSaving(true);
    try {
      const budget = { needsPct: needs, wantsPct: wants, savingsPct: savings, needsAmt, wantsAmt, savingsAmt };
      const nextScene = automate ? 'budgeting-done-auto' : 'budgeting-done-manual';
      await saveScene(nextScene, {
        monthlyBudget: budget,
        automatedSavings: automate,
        chapter: 3,
        simDay: 31,
      });
    } finally { setSaving(false); }
  };

  const handleManualTransferDone = async () => {
    setSheetOpen(false);
    // Move savings to emergency fund if it exists, else just advance
    const fundW = (sim?.wallets ?? []).find(w => w.id === 'emergency-fund');
    if (fundW) {
      const savingsAmt = sim?.monthlyBudget?.savingsAmt ?? 0;
      const wallets = (sim?.wallets ?? []).map(w => {
        if (w.type === 'bank')        return { ...w, balance: Math.max(0, (w.balance ?? 0) - savingsAmt) };
        if (w.id === 'emergency-fund') return { ...w, balance: Math.min((w.balance ?? 0) + savingsAmt, w.target ?? Infinity) };
        return w;
      });
      await saveScene('emergency-month-passes', { wallets, simDay: (sim?.simDay ?? 31) + 1 });
    } else {
      await saveScene('emergency-intro', { simDay: 32 });
    }
  };

  const handleEmergencyFundDone = async ({ target, monthlyContrib, months }) => {
    setSheetOpen(false);
    setSaving(true);
    try {
      const bankW = (sim?.wallets ?? []).find(w => w.type === 'bank');
      const fundWallet = {
        id:          'emergency-fund',
        type:        'fund',
        label:       'Emergency Fund',
        icon:        '🛡️',
        balance:     0,
        target,
        interestRate: bankW?.interestRate ?? 0.0005,
        color:       Colors.successDark,
        colorLight:  Colors.successLight,
        institution: bankW?.institution,
        linkedTo:    bankW?.id,
        interestLog: [],
      };
      const updatedWallets = [...(sim?.wallets ?? []), fundWallet];
      await saveScene('emergency-month-passes', {
        wallets: updatedWallets,
        chapter: 4,
        simDay:  (sim?.simDay ?? 32) + 1,
      });
    } finally { setSaving(false); }
  };

  const handleAdvanceMonth = async () => {
    setSaving(true);
    try {
      const month   = sim?.simMonth ?? 1;
      let wallets   = [...(sim?.wallets ?? [])];

      // Apply interest
      wallets = wallets.map(w => {
        if (!w.interestRate || w.interestRate <= 0) return w;
        const earned = Math.round((w.balance ?? 0) * (w.interestRate / 12) * 100) / 100;
        return { ...w, balance: Math.round(((w.balance ?? 0) + earned) * 100) / 100, interestLog: [...(w.interestLog ?? []), { month, amount: earned }] };
      });

      // Auto-transfer savings if automated
      if (sim?.automatedSavings) {
        const savingsAmt = sim?.monthlyBudget?.savingsAmt ?? 0;
        const fundIdx    = wallets.findIndex(w => w.id === 'emergency-fund');
        const bankIdx    = wallets.findIndex(w => w.type === 'bank');
        if (fundIdx >= 0 && bankIdx >= 0) {
          const space = Math.max(0, (wallets[fundIdx].target ?? 0) - (wallets[fundIdx].balance ?? 0));
          const xfer  = Math.min(savingsAmt, wallets[bankIdx].balance ?? 0, space);
          if (xfer > 0) {
            wallets[bankIdx] = { ...wallets[bankIdx], balance: Math.round(((wallets[bankIdx].balance ?? 0) - xfer) * 100) / 100 };
            wallets[fundIdx] = { ...wallets[fundIdx], balance: Math.round(((wallets[fundIdx].balance ?? 0) + xfer) * 100) / 100 };
          }
        }
      }

      const fundW = wallets.find(w => w.id === 'emergency-fund');
      const fundComplete = fundW && fundW.balance >= (fundW.target ?? Infinity);

      // Check for life event (month 2–4 within chapter 4)
      const shouldFireEvent = month >= 2 && month <= 4 && !sim?.lifeEventFired && Math.random() < 0.5;
      const newSimMonth = month + 1;
      const newSimDay   = (sim?.simDay ?? 1) + 30;

      if (shouldFireEvent) {
        const event = EMERGENCY_EVENTS[month % EMERGENCY_EVENTS.length];
        const hasFund = (fundW?.balance ?? 0) > 0;
        if (!hasFund) {
          const bankIdx = wallets.findIndex(w => w.type === 'bank');
          if (bankIdx >= 0) wallets[bankIdx] = { ...wallets[bankIdx], balance: Math.max(0, (wallets[bankIdx].balance ?? 0) - event.amount) };
        }
        await saveSimProgress(uid, { wallets, simMonth: newSimMonth, simDay: newSimDay, lifeEventFired: true });
        setSim(s => ({ ...s, wallets, simMonth: newSimMonth, simDay: newSimDay }));
        setLifeEvent({ event, hasFund });
        setSaving(false);
        return;
      }

      const nextScene = fundComplete ? 'emergency-complete' : 'emergency-month-passes';
      await saveScene(nextScene, { wallets, simMonth: newSimMonth, simDay: newSimDay });
    } finally { setSaving(false); }
  };

  // ── Spending notifications flow ───────────────────────────────────────────

  const needsAmt  = sim?.monthlyBudget?.needsAmt ?? Math.round((sim?.income ?? 2000) * 0.5);
  const notifItems = NEEDS_ITEMS.map(n => ({
    ...n,
    amount: Math.round(needsAmt * n.pct),
  }));

  const handleNotifDone = () => {
    setShowNotifs(false);
    setNotifIdx(0);
    // Advance to salary scene
    saveScene('month1-salary', {
      simDay: (sim?.simDay ?? 5) + 25,
    });
  };

  // ── Salary landing ────────────────────────────────────────────────────────

  const handleSalaryLanding = async () => {
    setShowSalary(false);
    setSaving(true);
    try {
      const income    = sim?.income ?? 2000;
      const bankIdx   = (sim?.wallets ?? []).findIndex(w => w.type === 'bank');
      let wallets     = [...(sim?.wallets ?? [])];
      if (bankIdx >= 0) {
        wallets[bankIdx] = { ...wallets[bankIdx], balance: Math.round(((wallets[bankIdx].balance ?? 0) + income) * 100) / 100 };
      }
      await saveScene('budgeting-intro', {
        wallets,
        stage4Data: { paycheckReceived: true, income },
        simDay:  (sim?.simDay ?? 30) + 1,
        simMonth: 2,
      });
    } finally { setSaving(false); }
  };

  // ── Life event dismiss ────────────────────────────────────────────────────

  const handleLifeEventClose = async () => {
    setLifeEvent(null);
    // After life event, continue to next month or complete
    const fundW = (sim?.wallets ?? []).find(w => w.id === 'emergency-fund');
    const fundComplete = fundW && (fundW.balance ?? 0) >= (fundW.target ?? Infinity);
    await saveScene(fundComplete ? 'emergency-complete' : 'emergency-month-passes');
  };

  // ── Month report sheet ────────────────────────────────────────────────────

  const currentMonthReport = (() => {
    const hist = sim?.spendHistory ?? [];
    return hist[hist.length - 1] ?? null;
  })();

  // ── Derived ───────────────────────────────────────────────────────────────

  const simDay   = sim?.simDay   ?? 1;
  const simMonth = sim?.simMonth ?? 1;
  const bankWallet = (sim?.wallets ?? []).find(w => w.type === 'bank');

  // ── Sheet content ─────────────────────────────────────────────────────────

  const sheetContent = (() => {
    if (action === 'fi-number')       return { title: 'Financial Independence', content: <FINumberSheet sim={sim} onDone={handleFINumberDone} /> };
    if (action === 'open-bank')       return { title: 'Open a Bank Account', content: <BankAccountSheet sim={sim} onDone={handleBankDone} /> };
    if (action === 'set-budget')      return { title: 'Set Your Budget', content: <BudgetSheet sim={sim} onDone={handleBudgetDone} /> };
    if (action === 'manual-transfer') return { title: 'Transfer Savings', content: <ManualTransferSheet sim={sim} onDone={handleManualTransferDone} /> };
    if (action === 'setup-emergency') return { title: 'Emergency Fund', content: <EmergencyFundSheet sim={sim} onDone={handleEmergencyFundDone} /> };
    if (action === 'set-fund-target') return { title: 'Emergency Fund', content: <EmergencyFundSheet sim={sim} onDone={handleEmergencyFundDone} /> };
    if (action === 'month-report' && currentMonthReport) return {
      title: `Month ${currentMonthReport.month} report`,
      content: (
        <View style={{ gap: Spacing.md }}>
          <View style={{ gap: 8 }}>
            {[
              { label: 'Needs', amt: currentMonthReport.needsSpent, color: Colors.primary },
              { label: 'Wants', amt: currentMonthReport.wantsSpent, color: ORANGE },
              { label: 'Savings', amt: currentMonthReport.savingsAmt, color: GREEN },
            ].map(c => (
              <View key={c.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>{c.label}</Text>
                <Text style={{ fontFamily: Fonts.extraBold, fontSize: 16, color: c.color }}>${Math.round(c.amt ?? 0).toLocaleString()}</Text>
              </View>
            ))}
          </View>
          {currentMonthReport.interest > 0 && (
            <View style={{ backgroundColor: Colors.successLight, borderRadius: Radii.md, padding: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: GREEN }}>💰 Interest earned</Text>
              <Text style={{ fontFamily: Fonts.extraBold, fontSize: 15, color: GREEN }}>+${currentMonthReport.interest?.toFixed(2)}</Text>
            </View>
          )}
          <TouchableOpacity style={[act.cta, { backgroundColor: Colors.textPrimary }]} onPress={() => { setSheetOpen(false); saveScene('emergency-month-passes'); }} activeOpacity={0.88}>
            <Text style={act.ctaText}>Next month →</Text>
          </TouchableOpacity>
        </View>
      ),
    };
    return null;
  })();

  // ── Derived for dashboard HUD ─────────────────────────────────────────────

  const wallets     = sim?.wallets ?? [];
  const bankW       = wallets.find(w => w.type === 'bank');
  const fundW       = wallets.find(w => w.id === 'emergency-fund');
  const netWorth    = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);
  const invested    = wallets.filter(w => w.type === 'investment').reduce((s, w) => s + (w.balance ?? 0), 0);
  const fiPct       = sim?.ffn ? Math.min(invested / sim.ffn, 1) : 0;
  const fundPct     = fundW?.target > 0 ? Math.min((fundW.balance ?? 0) / fundW.target, 1) : 0;
  const accentColor = scene.bg === SCENE_BG.arrival ? TEAL : (scene.bg === SCENE_BG.banking ? ORANGE : scene.bg === SCENE_BG.firstmonth ? GREEN : scene.bg === SCENE_BG.budgeting ? TEAL : scene.bg === SCENE_BG.emergency ? GREEN : PURPLE);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: Colors.background }]}>

      {/* ══ TOP BAR ════════════════════════════════════════════════════════ */}
      <View style={[s.topBar, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={s.dayLabel}>{dayLabel(simDay, simMonth)}</Text>
          {sim?.incomeLabel && (
            <Text style={s.incomeLabel}>{sim.incomeEmoji} {sim.incomeLabel}</Text>
          )}
        </View>
        <View style={s.topRight}>
          <View style={s.coinBadge}>
            <Text style={s.coinText}>🪙 {profile?.finCoins ?? 0}</Text>
          </View>
          {sim && (
            <TouchableOpacity style={s.resetBtn} onPress={handleReset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.resetText}>↺</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ══ SCROLLABLE DASHBOARD BODY ══════════════════════════════════════ */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 200 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── FI Progress — always visible once FI number is set ── */}
        {sim?.ffn ? (
          <View style={s.fiCard}>
            <View style={s.fiTop}>
              <View>
                <Text style={[s.fiLabel, { color: 'rgba(255,255,255,0.75)' }]}>FINANCIAL INDEPENDENCE</Text>
                <Text style={[s.fiPct, { color: Colors.white }]}>{Math.round(fiPct * 100)}%</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.fiTargetLabel, { color: 'rgba(255,255,255,0.75)' }]}>Target</Text>
                <Text style={[s.fiTargetAmt, { color: Colors.white }]}>${Math.round(sim.ffn).toLocaleString()}</Text>
                <Text style={[s.fiInvestedLabel, { color: 'rgba(255,255,255,0.85)' }]}>${Math.round(invested).toLocaleString()} invested</Text>
              </View>
            </View>
            <View style={[s.fiTrack, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <View style={[s.fiFill, { width: `${Math.round(fiPct * 100)}%`, backgroundColor: Colors.white }]} />
            </View>
          </View>
        ) : (
          sim && (
            <TouchableOpacity style={s.fiCardEmpty} onPress={() => { setSheetOpen(true); }} activeOpacity={0.85}>
              <Text style={s.fiEmptyTitle}>Set your FI number</Text>
              <Text style={s.fiEmptyBody}>Tap to calculate your Financial Independence target — the number every decision is working toward.</Text>
              <Text style={[s.fiEmptyLink, { color: Colors.primary }]}>Calculate now →</Text>
            </TouchableOpacity>
          )
        )}

        {/* ── Net Worth ── */}
        {sim && (
          <TouchableOpacity style={s.nwCard} onPress={() => router.push('/life-sim/dashboard')} activeOpacity={0.88}>
            <View style={s.nwRow}>
              <View>
                <Text style={s.nwLabel}>NET WORTH</Text>
                <Text style={[s.nwAmt, { color: Colors.primary }]}>${Math.round(netWorth).toLocaleString()}</Text>
              </View>
              <Text style={[s.nwLink, { color: Colors.primary }]}>Full dashboard →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Account cards (2 per row) ── */}
        {sim && (
          <>
            <Text style={s.sectionLabel}>YOUR ACCOUNTS</Text>
            <View style={s.cardGrid}>

              {/* Bank — Module 1: TEAL background */}
              <TouchableOpacity
                style={[s.hudCard, { backgroundColor: bankW ? TEAL : Colors.lightGray, borderColor: 'transparent' }]}
                onPress={() => router.push('/life-sim/bank')}
                activeOpacity={0.82}
              >
                <Text style={s.hudCardIcon}>🏦</Text>
                <Text style={[s.hudCardTitle, { color: bankW ? 'rgba(255,255,255,0.8)' : Colors.textMuted }]}>Bank</Text>
                {bankW ? (
                  <>
                    <Text style={[s.hudCardAmt, { color: Colors.white }]}>
                      ${Math.round(bankW.balance ?? 0).toLocaleString()}
                    </Text>
                    <Text style={[s.hudCardSub, { color: 'rgba(255,255,255,0.75)' }]}>{bankW.institution} · {((bankW.interestRate ?? 0) * 100).toFixed(2)}% p.a.</Text>
                  </>
                ) : (
                  <Text style={s.hudCardLocked}>Not set up</Text>
                )}
              </TouchableOpacity>

              {/* Emergency Fund — Module 3: GREEN background */}
              <TouchableOpacity
                style={[s.hudCard, { backgroundColor: fundW ? GREEN : Colors.lightGray, borderColor: 'transparent' }]}
                onPress={() => router.push('/life-sim/bank')}
                activeOpacity={0.82}
              >
                <Text style={s.hudCardIcon}>🛡️</Text>
                <Text style={[s.hudCardTitle, { color: fundW ? 'rgba(255,255,255,0.8)' : Colors.textMuted }]}>Emergency</Text>
                {fundW ? (
                  <>
                    <Text style={[s.hudCardAmt, { color: Colors.white }]}>
                      ${Math.round(fundW.balance ?? 0).toLocaleString()}
                    </Text>
                    <View style={[s.fundMiniTrack, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                      <View style={[s.fundMiniFill, { width: `${Math.round(fundPct * 100)}%`, backgroundColor: Colors.white }]} />
                    </View>
                    <Text style={[s.hudCardSub, { color: 'rgba(255,255,255,0.75)' }]}>{Math.round(fundPct * 100)}% of target</Text>
                  </>
                ) : (
                  <Text style={s.hudCardLocked}>Not set up</Text>
                )}
              </TouchableOpacity>

              {/* This Month — Module 2: ORANGE background */}
              <TouchableOpacity
                style={[s.hudCard, { backgroundColor: ORANGE, borderColor: 'transparent' }]}
                onPress={() => { if (currentMonthReport) setSheetOpen(true); }}
                activeOpacity={0.82}
              >
                <Text style={s.hudCardIcon}>📅</Text>
                <Text style={[s.hudCardTitle, { color: 'rgba(255,255,255,0.8)' }]}>This Month</Text>
                <Text style={[s.hudCardAmt, { color: Colors.white, fontSize: 18 }]}>
                  {dayLabel(simDay, simMonth)}
                </Text>
                {currentMonthReport ? (
                  <Text style={[s.hudCardSub, { color: 'rgba(255,255,255,0.75)' }]}>Tap to see report</Text>
                ) : (
                  <Text style={[s.hudCardSub, { color: 'rgba(255,255,255,0.75)' }]}>{scene.bg === SCENE_BG.arrival ? 'Getting started' : 'Month in progress'}</Text>
                )}
              </TouchableOpacity>

              {/* Investments — Module 4: PURPLE background (dimmed = locked) */}
              <TouchableOpacity
                style={[s.hudCard, { backgroundColor: PURPLE, borderColor: 'transparent', opacity: 0.55 }]}
                activeOpacity={1}
              >
                <Text style={s.hudCardIcon}>📈</Text>
                <Text style={[s.hudCardTitle, { color: 'rgba(255,255,255,0.8)' }]}>Invest</Text>
                <Text style={[s.hudCardAmt, { color: Colors.white, fontSize: 16 }]}>—</Text>
                <Text style={[s.hudCardSub, { color: 'rgba(255,255,255,0.7)' }]}>Module 3</Text>
              </TouchableOpacity>

            </View>
          </>
        )}

        {/* ── Spending notifications appear here inline ── */}
        {showNotifs && notifIdx < notifItems.length && (
          <View style={s.notifArea}>
            <SpendNotifCard
              key={notifIdx}
              item={notifItems[notifIdx]}
              delay={0}
              onDismiss={() => {
                if (notifIdx + 1 < notifItems.length) {
                  setNotifIdx(i => i + 1);
                } else {
                  handleNotifDone();
                }
              }}
            />
          </View>
        )}

        {/* ── No sim yet ── */}
        {!sim && (
          <View style={s.startCard}>
            <Text style={s.startEmoji}>🌱</Text>
            <Text style={s.startTitle}>Your financial life starts here</Text>
            <Text style={s.startBody}>
              FinCoins from studying convert into starting cash. Every decision here mirrors real financial life.
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ══ FIN — floating card pinned above tab bar ═══════════════════════ */}
      <View style={[s.finArea, { paddingBottom: insets.bottom + 8 }]}>

        {/* Spending notification strip (replaces fin during notif flow) */}

        <View style={s.finCard}>
          {/* Fin avatar — small */}
          <View style={[s.finAvatarWrap, { backgroundColor: Colors.primaryLight }]}>
            <Text style={s.finAvatar}>🦉</Text>
          </View>

          {/* Speech + dots */}
          <TouchableOpacity style={{ flex: 1 }} onPress={advanceLine} activeOpacity={0.9}>
            <Animated.Text style={[s.finSpeech, { opacity: fadeAnim }]}>
              {ctaReady ? lines[lines.length - 1] : (lines[lineIdx] ?? '')}
            </Animated.Text>
            {!ctaReady && (
              <View style={s.dotsRow}>
                {lines.map((_, i) => (
                  <View key={i} style={[
                    s.dot,
                    i < lineIdx   && { backgroundColor: Colors.primaryLight },
                    i === lineIdx && { backgroundColor: Colors.primary, width: 14 },
                    i > lineIdx   && { backgroundColor: Colors.border },
                  ]} />
                ))}
                <Text style={[s.tapHint, { color: Colors.primary + '90' }]}>tap ›</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* CTA button */}
        {ctaReady && (
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: Colors.textPrimary }, saving && { opacity: 0.6 }]}
            onPress={handleCta}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={s.ctaBtnText}>{scene.cta}</Text>
            }
          </TouchableOpacity>
        )}

        {/* First launch begin button */}
        {!sim && !loading && (
          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: Colors.textPrimary }]}
            onPress={async () => {
              const fresh = createSimProgress(uid, profile?.finCoins ?? 0);
              await saveSimProgress(uid, fresh);
              setSim(fresh);
              setLineIdx(0);
              setCtaReady(false);
            }}
            activeOpacity={0.88}
          >
            <Text style={s.ctaBtnText}>Begin →</Text>
          </TouchableOpacity>
        )}

      </View>

      {/* ══ MODALS & SHEETS ════════════════════════════════════════════════ */}

      {sheetContent && (
        <BottomSheet
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={sheetContent.title}
        >
          {sheetContent.content}
        </BottomSheet>
      )}

      {lifeEvent && (
        <LifeEventModal
          event={lifeEvent.event}
          hasFund={lifeEvent.hasFund}
          onClose={handleLifeEventClose}
        />
      )}

      <WalletSheet
        visible={showWallet}
        sim={sim}
        onClose={() => setShowWallet(false)}
        onBankPress={() => router.push('/life-sim/bank')}
      />

      <SalaryModal
        visible={showSalary}
        sim={sim}
        onDone={handleSalaryLanding}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_W = (SW - Spacing.lg * 2 - Spacing.sm) / 2;

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: Colors.background },

  // Top bar
  topBar:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.background },
  dayLabel:        { fontFamily: Fonts.extraBold, fontSize: 17, color: Colors.textPrimary },
  incomeLabel:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  topRight:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinBadge:       { backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  coinText:        { fontFamily: Fonts.bold, fontSize: 12, color: Colors.warningDark },
  resetBtn:        { backgroundColor: Colors.lightGray, borderRadius: Radii.full, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  resetText:       { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted },

  // Scroll body
  scroll:          { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md },

  // FI progress card
  fiCard:          { backgroundColor: Colors.primary, borderRadius: Radii.xl, padding: Spacing.lg, gap: Spacing.md, ...Shadows.medium },
  fiTop:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  fiLabel:         { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  fiPct:           { fontFamily: Fonts.extraBold, fontSize: 32 },
  fiTargetLabel:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'right' },
  fiTargetAmt:     { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textSecondary, textAlign: 'right' },
  fiInvestedLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.primary, textAlign: 'right' },
  fiTrack:         { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  fiFill:          { height: 10, borderRadius: 5 },
  fiCardEmpty:     { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1.5, borderColor: Colors.primaryLight, borderStyle: 'dashed', padding: Spacing.lg, gap: Spacing.sm, ...Shadows.soft },
  fiEmptyTitle:    { fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary },
  fiEmptyBody:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  fiEmptyLink:     { fontFamily: Fonts.bold, fontSize: 13 },

  // Net Worth bar
  nwCard:          { backgroundColor: Colors.white, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, ...Shadows.soft },
  nwRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nwLabel:         { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  nwAmt:           { fontFamily: Fonts.extraBold, fontSize: 24 },
  nwLink:          { fontFamily: Fonts.bold, fontSize: 12 },

  // Section label
  sectionLabel:    { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },

  // 2×2 HUD cards
  cardGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hudCard:         { width: CARD_W, borderRadius: Radii.lg, borderWidth: 0, padding: Spacing.md, gap: 3, ...Shadows.medium },
  hudCardIconWrap: { width: 36, height: 36, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  hudCardIcon:     { fontSize: 20 },
  hudCardTitle:    { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  hudCardAmt:      { fontFamily: Fonts.extraBold, fontSize: 20, marginTop: 2 },
  hudCardSub:      { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  hudCardLocked:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Emergency fund mini bar
  fundMiniTrack:   { height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  fundMiniFill:    { height: 3, borderRadius: 2, backgroundColor: GREEN },

  // Spending notif area
  notifArea:       { paddingVertical: Spacing.sm },

  // Start card
  startCard:       { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, ...Shadows.soft },
  startEmoji:      { fontSize: 36 },
  startTitle:      { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary, textAlign: 'center' },
  startBody:       { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },

  // Fin floating card (bottom, above tab bar)
  finArea:         { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm, backgroundColor: Colors.background },
  finCard:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.white, borderRadius: Radii.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.medium },
  finAvatarWrap:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  finAvatar:       { fontSize: 20 },
  finSpeech:       { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginBottom: 6 },

  // Dots + CTA
  dotsRow:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:             { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  tapHint:         { fontFamily: Fonts.bold, fontSize: 10, marginLeft: 4 },
  ctaBtn:          { borderRadius: Radii.lg, paddingVertical: 14, alignItems: 'center' },
  ctaBtnText:      { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});