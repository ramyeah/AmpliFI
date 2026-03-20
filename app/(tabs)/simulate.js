// app/(tabs)/simulate.js
//
// FinCity — simulation home screen.
// Entry screen → Dashboard with quest drawer + bottom sheets.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, Dimensions, PanResponder, Modal, Easing, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Svg, { Path, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../../store/userStore';
import { loadSimProgress, saveSimProgress, advanceMonth as advanceMonthFn, resetSimProgress, closeSavingsGoalAccount } from '../../lib/lifeSim';
import { doc as firestoreDoc, updateDoc as firestoreUpdateDoc, getDoc as firestoreGetDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { createSimProgress, getMonthLabel } from '../../constants/lifeSimStages';
import { QUEST_MAP, SIDE_QUESTS as ROADMAP_SIDE_QUESTS, CHAPTER_META } from '../../constants/questRoadmap';
import { Colors, Fonts, Spacing, Radii, Shadows, Typography, MODULE_COLORS } from '../../constants/theme';
import { COIN_ASSET, FIN } from '../../constants/simTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Quest1 from '../quests/quest-1';
import Quest2 from '../quests/quest-2';
import Quest3 from '../quests/quest-3';
import Quest4 from '../quests/quest-4';
import Quest5 from '../quests/quest-5';
import Quest6 from '../quests/quest-6';
import Quest7 from '../quests/quest-7';
import Quest8 from '../quests/quest-8';
import Quest9 from '../quests/quest-9';
import Quest10 from '../quests/quest-10';
import Quest11 from '../quests/quest-11';
import Quest12 from '../quests/quest-12';
import BankModal from '../life-sim/bank-modal';
import PortfolioModal from '../life-sim/portfolio-modal';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Static config ──────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];


const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

// ─── Confetti ───────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4F46E5', '#059669', '#F59E0B', '#EC4899', '#0891B2'];
function ConfettiPiece({ delay, color, startX, size }) {
  const y = useRef(new Animated.Value(-30)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const drift = (Math.random() - 0.5) * 160;
    setTimeout(() => { Animated.parallel([Animated.timing(y, { toValue: SH * 0.7, duration: 2400, useNativeDriver: true }), Animated.timing(x, { toValue: drift, duration: 2400, useNativeDriver: true }), Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0, duration: 700, delay: 1500, useNativeDriver: true })]), Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true })]).start(); }, delay);
  }, []);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() > 0.5 ? 540 : -720}deg`] });
  return <Animated.View style={{ position: 'absolute', left: startX, top: 0, width: size, height: size, borderRadius: Math.random() > 0.5 ? size / 2 : 2, backgroundColor: color, opacity, transform: [{ translateY: y }, { translateX: x }, { rotate: spin }] }} />;
}
function SimConfetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({ id: i, delay: Math.random() * 1000, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], startX: Math.random() * SW, size: 6 + Math.random() * 8 }));
  return <View style={StyleSheet.absoluteFill} pointerEvents="none">{pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}</View>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function getEntryGreeting(sim) {
  const completed = sim?.completedStages ?? [];
  const month = sim?.currentMonth ?? 1;
  const nw = (sim?.wallets ?? []).reduce((s, w) => s + (w.balance ?? 0), 0);
  if (completed.length === 0) return "Welcome to FinCity. This is where everything you've learned becomes real. Ready to start building your financial life?";
  if (completed.length < 3) return `Month ${month} and you're making moves. Net worth at \uD83E\uDE99${Math.round(nw).toLocaleString()}. Let's keep building.`;
  return `Month ${month}. \uD83E\uDE99${Math.round(nw).toLocaleString()} and growing. You're ${Math.round((completed.length / 5) * 100)}% through your FinCity journey.`;
}

function getFinNarrative(sim) {
  const completed = sim?.completedStages ?? [];
  if (!completed.includes('stage-1')) return 'Welcome to FinCity. Before you touch a single coin, you need to know what you\'re actually building toward. Your FI Number is the foundation \u2014 everything else is just tactics. Start with Quest 1.';
  if (!completed.includes('stage-2')) return 'FI Number locked in. Now your money needs somewhere to live. A bank account is the difference between cash that sits and cash that compounds. Open one in Quest 2 before we go any further.';
  if (!completed.includes('stage-3') && !sim?.income) return 'Bank account sorted. Your cash is earning interest. Now \u2014 I pulled some strings. There\'s a job waiting for you at Luminary. Tap me to see the offer.';
  if (!completed.includes('stage-3')) return `Your offer is accepted. \uD83E\uDE99${(sim?.income ?? 0).toLocaleString()} a month from Luminary. Open Quest 3 to watch your first salary land \u2014 it's a bigger moment than you think.`;
  if (!completed.includes('stage-4')) return 'First salary is in your account. Right now it\'s just sitting there. Quest 4 is where you decide what happens to every coin of it \u2014 needs, savings, and the wants budget you actually get to spend.';
  if (completed.includes('stage-4') && !completed.includes('stage-5') && sim?.stage2Data?.accountType === 'basic') return 'Your salary is split and your budget is running. But your savings are earning almost nothing in a basic account. The HYSA upgrade side quest in Chapter 3 fixes this in one step. Open Quest 5 to give your savings a goal.';
  if (!completed.includes('stage-5')) return 'Your salary is split and your budget is running. But right now all your savings are sitting in the same account as your spending money. That is a problem \u2014 savings need a separate home with a name and a target. Open Quest 5 to fix that.';
  if (completed.includes('stage-5') && !completed.includes('stage-6') && sim?.stage2Data?.accountType === 'basic') return 'Your savings goal and emergency fund are earning almost nothing in a basic account. The HYSA upgrade side quest in Chapter 3 fixes this in one step \u2014 it is worth doing before you go further.';
  if (!completed.includes('stage-6')) return 'Savings goal created. Now let us talk about the other thing that derails most people \u2014 unexpected costs. One medical bill, one broken device, and suddenly you are raiding your savings. Quest 6 builds the wall that stops that from happening.';
  if (!completed.includes('stage-7')) return 'Safety net in place. Savings goal running. Budget on autopilot. You have built the foundation that most people never get right. Now it is time to make your money work harder \u2014 the investing chapter starts in Quest 7.';
  if (!completed.includes('stage-8')) return 'You have seen what compounding does over time. Now the question is which investment vehicle fits your life. Quest 4.2 gives you three options \u2014 each with different fees, effort, and returns. Pick the one that matches how you want to invest.';
  if (!completed.includes('stage-9')) { const vehicle = sim?.investmentVehicle; return `${vehicle?.name ?? 'Your vehicle'} is locked in. Now it is time to make your first actual investment. Quest 4.3 \u2014 open your investment account and watch your portfolio appear on the dashboard for the first time.`; }
  if (!completed.includes('stage-10')) { const inv = (sim?.wallets ?? []).find(w => w.type === 'investment'); return `Your portfolio is live. FC ${Math.round(inv?.balance ?? 0).toLocaleString()} invested and growing. Every month advance adds your DCA and applies returns. Quest 4.4 is next \u2014 the market is about to drop. How you respond to that moment defines your investing future.`; }
  if (!completed.includes('stage-11')) { const dipChoice = sim?.marketDipChoice ?? 'hold'; if (dipChoice === 'sell') return 'You sold during the dip. That is the lesson most investors need to experience once. The good news \u2014 you still have your bank balance and you know what not to do next time. Quest 4.5 is about making sure your next portfolio is built to weather storms better.'; return 'You survived your first market dip. That is not nothing \u2014 most new investors panic at exactly this moment. Quest 4.5 takes that further \u2014 a diversified portfolio is more resilient to exactly the kind of drop you just experienced.'; }
  if (!completed.includes('stage-12')) return `Portfolio diversified across ${sim?.portfolioAllocations ? Object.keys(sim.portfolioAllocations).length : 'multiple'} asset classes. Risk score: ${sim?.portfolioRiskScore ?? '\u2014'}. Quest 4.6 is the final investing quest \u2014 your portfolio will drift over time as different assets grow at different rates. Rebalancing brings it back to your target allocation.`;
  return 'Chapter 4 complete. You have built a diversified portfolio, survived a market dip, and learned to rebalance. The rebalance tool lives in your Portfolio tab permanently \u2014 check it every few months. The investing chapter is done.';
}

// ─── Quest card helpers ─────────────────────────────────────────────────────
const CHAPTER_COLORS_MAP = {
  1: { color: MODULE_COLORS['module-1'].color, colorLight: MODULE_COLORS['module-1'].colorLight },
  2: { color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight },
  3: { color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight },
  4: { color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight },
  5: { color: MODULE_COLORS['module-4'].color, colorLight: MODULE_COLORS['module-4'].colorLight },
  6: { color: Colors.primary, colorLight: Colors.primaryLight },
};
const QC_ICONS = { '1.1': '\uD83C\uDFAF', '1.2': '\uD83C\uDFE6', '2.1': '\uD83D\uDCB8', '2.2': '\uD83D\uDCCA', '3.1': '\uD83C\uDFAF', '3.2': '\uD83D\uDEE1\uFE0F', '4.1': '\u23F3', '4.2': '\uD83D\uDE80', '4.3': '\uD83D\uDCC8', '4.4': '\uD83D\uDCC9', '4.5': '\uD83C\uDF0D', '4.6': '\u2696\uFE0F', '5.1': '\uD83C\uDFDB\uFE0F', '5.2': '\uD83D\uDCA1', '5.3': '\uD83D\uDD2E', '6.1': '\uD83C\uDFC6', '6.2': '\uD83D\uDCD0' };
const QC_DESCS = { '1.1': 'Figure out what your money is actually working toward.', '1.2': 'Your cash needs a home before anything else happens.', '2.1': 'Watch your first salary from Luminary land.', '2.2': 'Tell every coin where to go before it disappears.', '3.1': 'Create a dedicated account for a specific goal.', '3.2': 'Build a financial safety net for the unexpected.', '4.1': 'See how time turns small amounts into serious wealth.', '4.2': 'Pick your investment style and commit to it.', '4.3': 'Make your first real investment and watch it grow.', '4.4': 'The market drops. What do you do?', '4.5': 'Spread your risk across different asset classes.', '4.6': 'Correct your portfolio back to its target allocation.', '5.1': 'Understand how Singapore forces you to save for retirement.', '5.2': 'Should you invest your CPF or leave it at 2.5%?', '5.3': 'When do you actually hit your FI Number?', '6.1': 'Your portfolio hits the target. This is what it all led to.', '6.2': 'Test whether your portfolio can sustain retirement withdrawals.' };
const CH_NAMES = { 1: 'Chapter 1 \u00B7 Foundations', 2: 'Chapter 2 \u00B7 First Job', 3: 'Chapter 3 \u00B7 Banking Pro', 4: 'Chapter 4 \u00B7 Investing', 5: 'Chapter 5 \u00B7 Advanced', 6: 'Endgame' };

const WALLET_CYCLE = [
  { color: MODULE_COLORS['module-1'].color, colorLight: MODULE_COLORS['module-1'].colorLight },
  { color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight },
  { color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight },
  { color: MODULE_COLORS['module-4'].color, colorLight: MODULE_COLORS['module-4'].colorLight },
];

const ASSET_VOLATILITY = { 'nestvault': 50, 'drakon-rss': 45, 'apextrade-diy': 60, 'apex-global': 80, 'sg-blue-chip': 55, 'sg-reit': 50, 'fsa-bond': 15, 'drakon-fd': 0, 'voltcoin': 100, 'gold-trust': 30 };
const ASSET_RETURN = { 'nestvault': 6.5, 'drakon-rss': 5.5, 'apextrade-diy': 6, 'apex-global': 7, 'sg-blue-chip': 5, 'sg-reit': 6, 'fsa-bond': 3.5, 'drakon-fd': 2.8, 'voltcoin': 25, 'gold-trust': 4 };
const calcRiskScore = (allocs) => { const t = Object.values(allocs).reduce((s, v) => s + v, 0); if (t === 0) return 0; return Math.round(Object.entries(allocs).reduce((sum, [id, pct]) => sum + (ASSET_VOLATILITY[id] ?? 50) * (pct / t), 0)); };
const calcExpReturn = (allocs) => { const t = Object.values(allocs).reduce((s, v) => s + v, 0); if (t === 0) return 0; return Object.entries(allocs).reduce((sum, [id, pct]) => sum + (ASSET_RETURN[id] ?? 5) * (pct / t), 0); };
const getRiskLabel = (score) => { if (score <= 20) return { label: 'Very Low', color: '#457B9D' }; if (score <= 40) return { label: 'Low', color: MODULE_COLORS['module-1'].color }; if (score <= 60) return { label: 'Moderate', color: '#F4A261' }; if (score <= 80) return { label: 'High', color: MODULE_COLORS['module-2'].color }; return { label: 'Very High', color: '#E63946' }; };

const generatePortfolioPiePaths = (holdings, size) => {
  const total = holdings.reduce((s, h) => s + (h.allocation ?? 0), 0);
  if (total === 0) return [];
  const radius = size * 0.38;
  const center = size / 2;
  let startAngle = -Math.PI / 2;
  return holdings.map(h => {
    const pct = (h.allocation ?? 0) / total;
    if (pct <= 0) return null;
    const endAngle = startAngle + pct * 2 * Math.PI;
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    const path = { d: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: h.color ?? Colors.primary, pct: Math.round(pct * 100), assetId: h.assetId };
    startAngle = endAngle;
    return path;
  }).filter(Boolean);
};

const formatCoins = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : Math.round(n).toString();

// Quest ID for each stage — used by Fin modal and quest card routing
const STAGE_TO_QUEST = {
  'stage-1': 'quest-1',
  'stage-2': 'quest-2',
  'stage-3': 'quest-3',  // First Paycheck
  'stage-4': 'quest-4',  // Build Your Budget
  'stage-5': 'quest-5',
  'stage-6': 'quest-6',
  'stage-7': 'quest-7',
  'stage-8': 'quest-8',
  'stage-9': 'quest-9',
  'stage-10': 'quest-10',
  'stage-11': 'quest-11',
  'stage-12': 'quest-12',
};

function getCurrentChapter(sim) {
  const cq = QUEST_MAP.find(q => !(sim?.completedStages ?? []).includes(q.stageId));
  return cq?.chapter ?? 6;
}

function getNextQuestId(cs) {
  const stages = ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-5', 'stage-6', 'stage-7', 'stage-8', 'stage-9', 'stage-10', 'stage-11', 'stage-12'];
  for (const stageId of stages) {
    if (!cs.includes(stageId)) return STAGE_TO_QUEST[stageId] ?? null;
  }
  return null;
}

function getMonthSummary(sim) {
  const completed = sim?.completedStages ?? [];
  const month = sim?.currentMonth ?? 1;
  const label = `MONTH ${month}`;
  if (completed.length === 0) return { label, body: 'No activity yet. Complete your first quest to get started.' };
  if (!completed.includes('stage-2')) return { label, body: 'FI Number set. Open a bank account to keep building.' };
  if (!completed.includes('stage-3')) return { label, body: 'Bank account open. A job offer is waiting \u2014 tap Fin.' };
  if (!completed.includes('stage-4')) return { label, body: 'First salary landed. Set your budget to put it to work.' };
  if (!completed.includes('stage-5')) return { label, body: 'Budget active. Savings need a dedicated account.' };
  if (!completed.includes('stage-6')) {
    const sgName = sim?.stage5Data?.goalName ?? 'Savings goal';
    const sgContrib = (sim?.wallets ?? []).find(w => w.type === 'savings-goal')?.monthlyContribution ?? 0;
    return { label, body: `${sgName} active. FC ${sgContrib} auto-saving each month.` };
  }
  if (!completed.includes('stage-7')) {
    const efContrib = sim?.stage6Data?.monthlyContribution ?? 0;
    return { label, body: `Foundation complete. FC ${efContrib} to emergency fund each month.` };
  }
  if (!completed.includes('stage-8')) return { label, body: 'Compounding understood. Choose your investment vehicle next.' };
  if (!completed.includes('stage-9')) return { label, body: `${sim?.investmentVehicle?.name ?? 'Vehicle'} chosen. Make your first investment next.` };
  if (!completed.includes('stage-10')) { const inv = (sim?.wallets ?? []).find(w => w.type === 'investment'); return { label, body: `Portfolio live. FC ${Math.round(inv?.balance ?? 0).toLocaleString()} invested and growing.` }; }
  if (!completed.includes('stage-11')) return { label, body: 'Market dip survived. Diversify your portfolio next.' };
  if (!completed.includes('stage-12')) return { label, body: `Portfolio diversified. ${Object.keys(sim?.portfolioAllocations ?? {}).length} assets. Rebalance next.` };
  return { label, body: 'Chapter 4 complete. Portfolio rebalanced and maintained.' };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function SimulateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore(s => s.profile);
  const uid = auth.currentUser?.uid;

  const [sim, setSim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insideCity, setInsideCity] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [finOverlayVisible, setFinOverlayVisible] = useState(false);
  const [entryBubbleVisible, setEntryBubbleVisible] = useState(false);
  const [finVisible, setFinVisible] = useState(true);
  const [activeSheet, setActiveSheet] = useState(null); // 'bank'|'portfolio'|'history'
  const [activeQuest, setActiveQuest] = useState(null);
  const [bankNotif, setBankNotif] = useState(false);
  const [finHasUpdate, setFinHasUpdate] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [monthSummary, setMonthSummary] = useState(null);
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);
  const [gateMessage, setGateMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAdvError, setShowAdvError] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonName, setComingSoonName] = useState('');
  const [showJobOffer, setShowJobOffer] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [jobOfferStep, setJobOfferStep] = useState(1);
  const [completedGoalQueue, setCompletedGoalQueue] = useState([]);
  const [showGoalComplete, setShowGoalComplete] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [goalCompleteConfetti, setGoalCompleteConfetti] = useState(false);
  const [closingGoal, setClosingGoal] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioSim, setPortfolioSim] = useState(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim = useRef(new Animated.Value(-280)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const finBackdropAnim = useRef(new Animated.Value(0)).current;
  const finSlideAnim = useRef(new Animated.Value(200)).current;
  const sheetAnim = useRef(new Animated.Value(SH)).current;
  const summarySheetAnim = useRef(new Animated.Value(SH)).current;
  const advanceConfirmAnim = useRef(new Animated.Value(SH)).current;
  const finX = useRef(new Animated.Value(40)).current;
  const finY = useRef(new Animated.Value(30)).current;
  const finFlip = useRef(new Animated.Value(1)).current;
  const finPulse = useRef(new Animated.Value(1)).current;
  const finSwimRef = useRef(null);
  const entryBubbleOpacity = useRef(new Animated.Value(0)).current;
  const fadeHeading = useRef(new Animated.Value(0)).current;
  const fadeBody = useRef(new Animated.Value(0)).current;
  const fadeBullets = useRef(new Animated.Value(0)).current;
  const fadeBtn = useRef(new Animated.Value(0)).current;
  const slideHeading = useRef(new Animated.Value(16)).current;
  const slideBody = useRef(new Animated.Value(16)).current;
  const slideBullets = useRef(new Animated.Value(16)).current;
  const slideBtn = useRef(new Animated.Value(16)).current;

  const finCoins = profile?.finCoins ?? 0;

  // ── Load ────────────────────────────────────────────────────────────────
  const loadSim = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    try { setSim(await loadSimProgress(uid)); }
    catch (e) { console.error('sim load:', e); }
    finally { setLoading(false); }
  }, [uid]);

  const refreshAll = useCallback(async () => {
    await loadSim();
    if (uid) {
      try {
        const uSnap = await firestoreGetDoc(firestoreDoc(db, 'users', uid));
        if (uSnap.exists()) {
          useUserStore.getState().setProfile({
            ...useUserStore.getState().profile,
            finCoins: uSnap.data().finCoins ?? 0,
          });
        }
      } catch (e) { console.error('refreshAll user fetch:', e); }
    }
  }, [uid, loadSim]);

  useFocusEffect(useCallback(() => { setInsideCity(false); loadSim(); }, [loadSim]));

  useEffect(() => { if (!loading) Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, [loading]);

  // Fin pulse — stronger when has update
  useEffect(() => {
    finPulse.stopAnimation();
    finPulse.setValue(1);
    const toVal = finHasUpdate ? 1.25 : 1.10;
    const dur   = finHasUpdate ? 550  : 1200;
    Animated.loop(Animated.sequence([
      Animated.timing(finPulse, { toValue: toVal, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(finPulse, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, [finHasUpdate]);

  // Check for Fin update on sim load
  useEffect(() => {
    if (!sim) return;
    AsyncStorage.getItem('fin_last_seen_stage').then(lastSeen => {
      const completed = sim?.completedStages ?? [];
      const latestStage = completed[completed.length - 1] ?? null;
      if (latestStage && latestStage !== lastSeen) setFinHasUpdate(true);
    });
  }, [sim]);

  useEffect(() => {
    if (!insideCity && !loading) {
      [fadeHeading, fadeBody, fadeBullets, fadeBtn].forEach(a => a.setValue(0));
      [slideHeading, slideBody, slideBullets, slideBtn].forEach(a => a.setValue(16));
      Animated.stagger(180, [
        Animated.parallel([Animated.timing(fadeHeading, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.timing(slideHeading, { toValue: 0, duration: 500, useNativeDriver: true })]),
        Animated.parallel([Animated.timing(fadeBody, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.timing(slideBody, { toValue: 0, duration: 500, useNativeDriver: true })]),
        Animated.parallel([Animated.timing(fadeBullets, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.timing(slideBullets, { toValue: 0, duration: 500, useNativeDriver: true })]),
        Animated.parallel([Animated.timing(fadeBtn, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.timing(slideBtn, { toValue: 0, duration: 500, useNativeDriver: true })]),
      ]).start();
    }
  }, [insideCity, loading]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const completedStages = sim?.completedStages ?? [];
  const wallets = sim?.wallets ?? [];
  const netWorth = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);
  const ffn = sim?.ffn ?? null;
  const invested = wallets.filter(w => w.type === 'investment').reduce((s, w) => s + (w.balance ?? 0), 0);
  const fiPct = ffn ? Math.min(invested / ffn, 1) : 0;
  const isFirstTime = completedStages.length === 0;
  const completedQuestCount = QUEST_MAP.filter(q => completedStages.includes(q.stageId)).length;
  const progressPct = Math.round((completedQuestCount / QUEST_MAP.length) * 100);
  const budget = sim?.monthlyBudget ?? null;
  const income = sim?.income ?? 0;
  const history = sim?.history ?? [];
  const nwDelta = history.length >= 2
    ? Object.values((history[history.length - 1].walletSnapshots ?? {})).reduce((a, b) => a + b, 0) - Object.values((history[history.length - 2].walletSnapshots ?? {})).reduce((a, b) => a + b, 0)
    : 0;
  // Feature unlock flags
  const unlocks = {
    fiProgressBar:   completedStages.includes('stage-1'),
    monthAdvance:    completedStages.includes('stage-2'),
    incomeChip:      completedStages.includes('stage-3'),
    spentSavedChips: completedStages.includes('stage-4'),
    investedChip:    false,
  };
  const simMonthRaw = sim?.currentMonth ?? 1;
  const simYear = Math.ceil(simMonthRaw / 12);
  const simMonth = ((simMonthRaw - 1) % 12) + 1;
  const monthName = MONTH_NAMES[simMonth - 1];
  const simDay = DAY_NAMES[(simMonthRaw - 1) % 5];

  // Bank notification badge
  useEffect(() => {
    if (sim) AsyncStorage.getItem('bankNotif_seen').then(val => {
      if (val !== 'true' && completedStages.includes('stage-2')) setBankNotif(true);
    });
  }, [sim]);

  const dismissBankNotif = async () => { setBankNotif(false); await AsyncStorage.setItem('bankNotif_seen', 'true'); };



  // ── Drawer ──────────────────────────────────────────────────────────────
  const openDrawer = () => { setDrawerOpen(true); Animated.parallel([Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }), Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true })]).start(); };
  const closeDrawer = () => { Animated.parallel([Animated.timing(drawerAnim, { toValue: -280, duration: 220, useNativeDriver: true }), Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true })]).start(() => setDrawerOpen(false)); };
  const panResponder = useRef(PanResponder.create({ onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dy) < 30, onPanResponderRelease: (_, gs) => { if (gs.dx > 40 && gs.moveX < 60) openDrawer(); if (gs.dx < -40 && drawerOpen) closeDrawer(); } })).current;

  // ── Fin Overlay ─────────────────────────────────────────────────────────
  const showFin = () => { setFinOverlayVisible(true); finBackdropAnim.setValue(0); finSlideAnim.setValue(200); Animated.parallel([Animated.timing(finBackdropAnim, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.spring(finSlideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true })]).start(); };
  const handleFinModalClose = () => {
    Animated.parallel([Animated.timing(finBackdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }), Animated.timing(finSlideAnim, { toValue: 200, duration: 200, useNativeDriver: true })]).start(() => setFinOverlayVisible(false));
    setTimeout(() => setFinVisible(true), 400);
  };

  // ── Swimming Fin ────────────────────────────────────────────────────────
  const swimToNextSpot = () => {
    const ZW = SW - 80, ZH = SH - 160;
    const nx = Math.random() * ZW, ny = Math.random() * ZH;
    const cx = finX.__getValue();
    Animated.timing(finFlip, { toValue: cx < nx ? 1 : -1, duration: 80, useNativeDriver: true }).start();
    const dist = Math.sqrt((cx - nx) ** 2 + (finY.__getValue() - ny) ** 2);
    const dur = 1800 + (dist / ZW) * 2400;
    finSwimRef.current = Animated.parallel([Animated.timing(finX, { toValue: nx, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(finY, { toValue: ny, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]);
    finSwimRef.current.start(({ finished }) => { if (finished) setTimeout(swimToNextSpot, 400 + Math.random() * 800); });
  };
  useEffect(() => { if (!loading) { swimToNextSpot(); return () => finSwimRef.current?.stop(); } }, [loading]);

  const handleFinTap = () => {
    if (!insideCity) { setEntryBubbleVisible(true); entryBubbleOpacity.setValue(0); Animated.timing(entryBubbleOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start(); setTimeout(() => { Animated.timing(entryBubbleOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setEntryBubbleVisible(false)); }, 3000); }
    else {
      setFinHasUpdate(false);
      const cs = sim?.completedStages ?? [];
      const latest = cs[cs.length - 1] ?? null;
      if (latest) AsyncStorage.setItem('fin_last_seen_stage', latest);
      // Job offer intercept: after bank open, before first paycheck, and no income set yet
      if (cs.includes('stage-2') && !cs.includes('stage-3') && !sim?.income) {
        setShowJobOffer(true);
        setJobOfferStep(1);
        setSelectedSalary(null);
        return;
      }
      setFinVisible(false);
      showFin();
    }
  };

  // ── Bottom Sheets ───────────────────────────────────────────────────────
  const openSheet = async (id) => {
    if (id === 'portfolio') {
      setPortfolioLoading(true);
      try {
        const fresh = await loadSimProgress(uid);
        setSim(fresh);
        setPortfolioSim(fresh);
      } catch (e) { console.error('portfolio load error:', e); }
      finally { setPortfolioLoading(false); }
    }
    setActiveSheet(id);
    sheetAnim.setValue(SH);
    Animated.spring(sheetAnim, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }).start();
  };
  const closeSheet = () => { Animated.timing(sheetAnim, { toValue: SH, duration: 250, useNativeDriver: true }).start(() => { setActiveSheet(null); setPortfolioSim(null); }); };
  const handleChipPress = (id) => openSheet(id);



  // ── Advance Month ───────────────────────────────────────────────────────
  const doAdvance = async () => {
    setShowAdvanceConfirm(false);
    setAdvancing(true);
    try {
      const result = await advanceMonthFn(uid);
      if (!result.canAdvance) { setGateMessage(result.reason); setShowGateModal(true); setAdvancing(false); return; }
      // Re-fetch sim and user profile for fresh data
      await loadSim();
      if (uid) { const uSnap = await firestoreGetDoc(firestoreDoc(db, 'users', uid)); if (uSnap.exists()) { const ud = uSnap.data(); useUserStore.getState().setProfile({ ...useUserStore.getState().profile, finCoins: ud.finCoins ?? 0 }); } }
      setMonthSummary(result);
      if (result.completedGoals?.length > 0) setCompletedGoalQueue(result.completedGoals);
      setShowMonthlySummary(true);
      summarySheetAnim.setValue(SH);
      Animated.spring(summarySheetAnim, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }).start();
    } catch (e) { console.error('advanceMonth error:', e); setShowAdvError(true); }
    setAdvancing(false);
  };

  const handleAdvanceMonth = () => {
    if (advancing) return;
    if (!unlocks.monthAdvance) { setGateMessage("Open a bank account first \u2014 your salary needs somewhere to land."); setShowGateModal(true); return; }
    setShowAdvanceConfirm(true);
    advanceConfirmAnim.setValue(SH);
    Animated.spring(advanceConfirmAnim, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }).start();
  };

  const closeAdvanceConfirm = () => {
    Animated.timing(advanceConfirmAnim, { toValue: SH, duration: 250, useNativeDriver: true }).start(() => setShowAdvanceConfirm(false));
  };

  const closeMonthlySummary = () => {
    Animated.timing(summarySheetAnim, { toValue: SH, duration: 250, useNativeDriver: true }).start(() => {
      setShowMonthlySummary(false);
      setMonthSummary(null);
      if (completedGoalQueue.length > 0) {
        const [next, ...rest] = completedGoalQueue;
        setCurrentGoal(next);
        setCompletedGoalQueue(rest);
        setGoalCompleteConfetti(true);
        setShowGoalComplete(true);
      }
    });
  };

  // ── Reset ───────────────────────────────────────────────────────────────
  const handleReset = () => setShowResetConfirm(true);
  const doReset = async () => { setShowResetConfirm(false); await resetSimProgress(uid); setSim(null); setInsideCity(false); };

  if (loading) return <View style={s.root} />;

  // ═══════════════════════════════════════════════════════════════════════
  // ENTRY SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (!insideCity) {
    const subtitle = isFirstTime ? 'Your financial life, simulated.' : `Month ${sim?.currentMonth ?? 1} \u00B7 Net worth \uD83E\uDE99${Math.round(netWorth).toLocaleString()}`;
    const heading = isFirstTime ? 'Welcome to FinCity' : 'Welcome back';
    const body = isFirstTime ? "This is where everything you've learned becomes real. Ready to start building your financial life?" : getEntryGreeting(sim);
    return (
      <Animated.View style={[s.entryRoot, { opacity: fadeAnim }]}>
        <View>
          <View style={s.topBar}><View><Text style={s.topBarTitle}>FinCity</Text><Text style={s.topBarSub}>{subtitle}</Text></View><View style={s.pctBadge}><Text style={s.pctText}>{progressPct}%</Text></View></View>
          <View style={s.progressBarBg}><View style={[s.progressBarFill, { width: `${progressPct}%` }]} /></View>
        </View>
        <View style={{ flex: 1 }} />
        <View style={s.entryContent}>
          <Animated.View style={{ opacity: fadeHeading, transform: [{ translateY: slideHeading }] }}><Text style={s.welcomeHeading}>{heading}</Text></Animated.View>
          <Animated.View style={{ opacity: fadeBody, transform: [{ translateY: slideBody }] }}><Text style={s.welcomeBody}>{body}</Text></Animated.View>
          {isFirstTime && <Animated.View style={{ opacity: fadeBullets, transform: [{ translateY: slideBullets }] }}><View style={s.bulletList}>{['Invest your FinCoins in a simulated world','Watch your money grow month by month','Work toward your Financial Independence Number'].map((t,i) => <Text key={i} style={s.bulletText}><Text style={s.bulletDot}>{'\u00B7'} </Text>{t}</Text>)}</View></Animated.View>}
        </View>
        <View style={{ flex: 1 }} />
        <Animated.View style={{ opacity: fadeBtn, transform: [{ translateY: slideBtn }] }}><TouchableOpacity style={[s.entryCta, { marginBottom: insets.bottom + 24 }]} onPress={() => setInsideCity(true)} activeOpacity={0.88}><Text style={s.entryCtaText}>{isFirstTime ? 'Begin my journey \u2192' : 'Enter FinCity \u2192'}</Text></TouchableOpacity></Animated.View>
        <Animated.View style={{ position: 'absolute', zIndex: 50, transform: [{ translateX: finX }, { translateY: finY }, { scaleX: finFlip }, { scale: finPulse }] }} pointerEvents="box-none">
          <TouchableOpacity activeOpacity={0.8} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }} onPress={handleFinTap}>
            {entryBubbleVisible && <Animated.View style={{ transform: [{ scaleX: finFlip }] }}><Animated.View style={[s.entryBubble, { opacity: entryBubbleOpacity }]}><Text style={s.entryBubbleText}>Hi! I'm Fin, your financial advisor {'\uD83D\uDC4B'}</Text><View style={s.entryBubbleTail} /></Animated.View></Animated.View>}
            <View style={[s.finBody, s.finBodyTappable]}><Text style={{ fontSize: 28 }}>{FIN.emoji}</Text></View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════
  const nextQuestId = getNextQuestId(completedStages);

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      {/* Header */}
      <View>
        <View style={s.topBar}><View><Text style={s.topBarTitle}>FinCity</Text><Text style={s.topBarSub}>{completedQuestCount}/{QUEST_MAP.length} quests</Text></View><View style={s.dashHeaderRight}><View style={s.coinBadge}><Image source={COIN_ASSET} style={{ width: 16, height: 16 }} /><Text style={s.coinAmt}>{finCoins.toLocaleString()}</Text></View>{sim && <TouchableOpacity style={s.resetBtn} onPress={handleReset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={s.resetText}>{'\u21BA'}</Text></TouchableOpacity>}</View></View>
        <View style={s.progressBarBg}><View style={[s.progressBarFill, { width: `${progressPct}%` }]} /></View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {/* Centred date section */}
        <View style={s.dtContainer}>
          <Text style={s.dtYear}>YEAR {simYear}</Text>
          <View style={s.dtMonthRow}>
            <Text style={s.dtMonth}>{monthName}</Text>
            <TouchableOpacity
              onPress={handleAdvanceMonth}
              disabled={!unlocks.monthAdvance || advancing}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[s.dtAdvIconText, !unlocks.monthAdvance && s.dtAdvIconDisabled]}>{'\u23ED'}</Text>
            </TouchableOpacity>
          </View>
          {(() => { const ms = getMonthSummary(sim); return (
            <View style={s.dtFinCard}>
              <View style={s.finCardAvatar}><Text style={{ fontSize: 14 }}>{FIN.emoji}</Text></View>
              <Text style={s.dtFinCardText}><Text style={s.dtFinCardLabel}>{ms.label}</Text>  {ms.body}</Text>
            </View>
          ); })()}
        </View>

        {/* Net Worth Card */}
        <View style={s.nwCard}>
          <View style={s.nwTopRow}>
            <Text style={s.nwLabel}>NET WORTH</Text>
            {nwDelta !== 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Text style={[s.nwChange, { color: nwDelta > 0 ? MODULE_COLORS['module-3'].color : Colors.danger }]}>{nwDelta > 0 ? '\u2191' : '\u2193'}</Text><Image source={COIN_ASSET} style={{ width: 11, height: 11 }} /><Text style={[s.nwChange, { color: nwDelta > 0 ? MODULE_COLORS['module-3'].color : Colors.danger }]}>{formatCoins(Math.abs(nwDelta))} this month</Text></View>}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Image source={COIN_ASSET} style={{ width: 20, height: 20 }} />
            <Text style={s.nwHero}>{Math.round(netWorth).toLocaleString()}</Text>
          </View>
          {ffn ? (
            <View style={s.nwBarWrap}>
              <View style={s.nwBarTrack}>
                <View style={[s.nwBarFill, { width: `${Math.min(100, Math.round(fiPct * 100))}%`, backgroundColor: fiPct >= 1 ? MODULE_COLORS['module-3'].color : Colors.primary, zIndex: 1 }]} />
                {[25, 50, 75].map(p => <View key={p} style={[s.nwMilestone, { left: `${p}%` }]} />)}
              </View>
              <View style={s.nwBarFooter}>
                <Text style={s.nwBarLabel}>{Math.round(fiPct * 100)}% to FI</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 11, height: 11 }} /><Text style={s.nwBarTarget}>{Math.round(netWorth).toLocaleString()} of {Math.round(ffn).toLocaleString()}</Text></View>
              </View>
            </View>
          ) : (
            <Text style={s.nwNoFI}>Complete Quest 1 to set your FI target</Text>
          )}
        </View>

        {/* Nav pills */}
        <View style={s.navRow}>
          <TouchableOpacity style={s.navPill} onPress={() => { setShowBankModal(true); dismissBankNotif(); }}><Text style={{ fontSize: 16 }}>{'\uD83C\uDFE6'}</Text><Text style={s.navPillLabel}>Bank</Text>{bankNotif && <View style={s.notifDot} />}</TouchableOpacity>
          <TouchableOpacity style={[s.navPill, !completedStages.includes('stage-9') && { opacity: 0.5 }]} onPress={() => { if (completedStages.includes('stage-9')) setShowPortfolioModal(true); }}><Text style={{ fontSize: 16 }}>{'\uD83D\uDCC8'}</Text><Text style={s.navPillLabel}>Portfolio</Text>{!completedStages.includes('stage-9') && <Text style={{ fontSize: 10 }}>{'\uD83D\uDD12'}</Text>}</TouchableOpacity>
          <TouchableOpacity style={s.navPill} onPress={() => handleChipPress('history')}><Text style={{ fontSize: 16 }}>{'\uD83D\uDCDC'}</Text><Text style={s.navPillLabel}>History</Text></TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={s.divRow}><View style={s.divLine} /><Text style={s.divLabel}>YOUR JOURNEY</Text><View style={s.divLine} /></View>

        {/* Empty state — no quests completed */}
        {(!sim?.completedStages || sim.completedStages.length === 0) && (
          <View style={s.esContainer}>
            <Text style={s.esEmoji}>{'\uD83D\uDDFA\uFE0F'}</Text>
            <Text style={s.esTitle}>Your journey starts here</Text>
            <Text style={s.esBody}>Complete quests to unlock accounts, track your money, and build toward financial independence.</Text>
            <View style={s.esHintRow}>
              <View style={s.esHintCard}><Text style={s.esHintIcon}>{'\uD83C\uDFAF'}</Text><Text style={s.esHintText}>Main quests unlock the next chapter of your story</Text></View>
              <View style={s.esHintCard}><Text style={s.esHintIcon}>{'\uD83C\uDFE6'}</Text><Text style={s.esHintText}>Accounts you open appear here as wallet cards</Text></View>
            </View>
            <View style={s.esHintRow}>
              <View style={s.esHintCard}><Text style={s.esHintIcon}>{'\u25C0'}</Text><Text style={s.esHintText}>Side quests live in the drawer on the left edge</Text></View>
              <View style={s.esHintCard}><Text style={s.esHintIcon}>{'\u203A'}</Text><Text style={s.esHintText}>Tap {'\u203A'} next to the month to advance time</Text></View>
            </View>
            <Text style={s.esCta}>Start with Quest 1 above {'\u2191'}</Text>
          </View>
        )}

        {/* Quest Banner */}
        {sim && (() => {
          const cq = QUEST_MAP.find(q => !completedStages.includes(q.stageId));
          if (!cq) return null;
          return (
            <TouchableOpacity activeOpacity={0.85} onPress={() => { const qid = STAGE_TO_QUEST[cq.stageId]; if (qid) setActiveQuest(qid); }} style={[s.qbBanner, { borderLeftColor: Colors.primary }]}>
              <View style={[s.qbIcon, { backgroundColor: Colors.primaryLight }]}><Text style={{ fontSize: 16 }}>{QC_ICONS[cq.id] ?? '\uD83C\uDFAF'}</Text></View>
              <View style={{ flex: 1 }}><Text style={s.qbEyebrow}>CURRENT QUEST</Text><Text style={s.qbName} numberOfLines={1}>{cq.name}</Text></View>
              <View style={[s.qbCta, { backgroundColor: Colors.primaryLight }]}><Text style={[s.qbCtaText, { color: Colors.primary }]}>Start {'\u2192'}</Text></View>
            </TouchableOpacity>
          );
        })()}

        {/* Wallet grid */}
        <View style={s.walletGrid}>
          {(() => {
            const wls = wallets.filter(w => w.type !== 'investment');
            const inv = wallets.find(w => w.type === 'investment');
            return <>
              <View style={s.walletRow}>
              {wls.map((w, wcIdx) => { const theme = WALLET_CYCLE[wcIdx % WALLET_CYCLE.length]; const isLone = wls.length === 1 || (wls.length % 2 === 1 && wcIdx === wls.length - 1); return (
                    <TouchableOpacity key={w.id} style={[s.wcCard, isLone ? s.wcCardFull : s.wcCardHalf, { backgroundColor: theme.color }]} activeOpacity={0.85} onPress={() => { setShowBankModal(true); dismissBankNotif(); }}>
                      <View style={s.wcIconCircle}><Text style={{ fontSize: 18 }}>{w.icon ?? '\uD83D\uDCB5'}</Text></View>
                      <Text style={s.wcName} numberOfLines={1}>{w.label}</Text>
                      {(w.type === 'savings-goal' || w.type === 'emergency') && <Text style={s.wcSubAccount}>Sub-account {'\u00B7'} {w.institution ?? 'Your Bank'}</Text>}
                      {w.type === 'bank' && w.accountType && (
                        <View style={[s.wcBadge, w.accountType === 'hysa' ? s.wcBadgeHYSA : s.wcBadgeBasic]}>
                          <Text style={s.wcBadgeText}>{w.accountType === 'hysa' ? '\u26A1 HYSA' : '\uD83D\uDCCB Basic'}</Text>
                        </View>
                      )}
                      <View style={s.wcBalRow}><Image source={COIN_ASSET} style={s.wcCoin} /><Text style={s.wcBal}>{Math.round(w.balance ?? 0).toLocaleString()}</Text></View>
                      {w.type === 'cash' && (w.balance ?? 0) === 0 && <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: Fonts.regular }}>All funds in bank</Text>}
                      {w.type === 'bank' && (w.interestRate ?? 0) > 0.001 && <Text style={s.wcSub}>{(w.interestRate * 100).toFixed(2)}% p.a. interest</Text>}
                      {w.type === 'bank' && (!w.interestRate || w.interestRate <= 0.001) && <Text style={s.wcSub}>0.05% p.a. {'\u00B7'} upgrade to HYSA for more</Text>}
                      {w.type !== 'bank' && w.type !== 'savings-goal' && w.type !== 'emergency' && (w.interestRate ?? 0) > 0 && <Text style={s.wcSub}>{(w.interestRate * 100).toFixed(2)}% p.a.</Text>}
                      {(w.type === 'savings-goal' || w.type === 'emergency') && (w.interestRate ?? 0) > 0 && (
                        w.parentAccountType === 'hysa'
                          ? <Text style={s.wcSub}>{(w.interestRate * 100).toFixed(2)}% p.a. {'\u26A1'} HYSA rate</Text>
                          : <><Text style={s.wcSub}>{(w.interestRate * 100).toFixed(2)}% p.a.</Text><Text style={s.wcSubWarn}>Upgrade to HYSA for more</Text></>
                      )}
                      {w.type === 'savings-goal' && w.target > 0 && <><View style={s.wcGoalTrack}><View style={[s.wcGoalFill, { width: `${Math.min(100, Math.round(((w.balance ?? 0) / w.target) * 100))}%` }]} /></View><Text style={s.wcSub}>{Math.round(((w.balance ?? 0) / w.target) * 100)}% of target</Text></>}
                      {w.type === 'emergency' && w.target > 0 && <><View style={s.wcGoalTrack}><View style={[s.wcGoalFill, { width: `${Math.min(100, Math.round(((w.balance ?? 0) / w.target) * 100))}%` }]} /></View><Text style={s.wcSub}>{Math.round(((w.balance ?? 0) / w.target) * 100)}% funded</Text></>}
                    </TouchableOpacity>
                  ); })}
              </View>
              {inv && <View style={{ marginTop: 10 }}><TouchableOpacity style={[s.wcCard, s.wcCardFull, { backgroundColor: MODULE_COLORS['module-4'].color }]} activeOpacity={0.85} onPress={() => setShowPortfolioModal(true)}>
                <View style={s.wcIconCircle}><Text style={{ fontSize: 18 }}>{'\uD83D\uDCC8'}</Text></View>
                <Text style={s.wcName}>{inv.label}</Text>
                <View style={s.wcBalRow}><Image source={COIN_ASSET} style={s.wcCoin} /><Text style={s.wcBal}>{Math.round(inv.balance ?? 0).toLocaleString()}</Text></View>
              </TouchableOpacity></View>}
            </>;
          })()}
        </View>

        {/* Budget card */}
        {completedStages.includes('stage-4') && budget && (
          <View style={s.budgetCard}>
            <View style={s.budgetHeader}><Text style={s.budgetTitle}>THIS MONTH</Text><Text style={s.budgetMonth}>Month {simMonthRaw}</Text></View>
            {[
              { icon: '\uD83C\uDFE0', label: 'Needs', amt: budget.needsAmt ?? 0, status: 'Auto-deducted', color: MODULE_COLORS['module-2'].color },
              { icon: '\uD83D\uDECD\uFE0F', label: 'Wants', amt: budget.wantsAmt ?? 0, status: `${formatCoins(budget.wantsAmt ?? 0)} available`, color: Colors.primary },
              { icon: '\uD83D\uDCB0', label: 'Savings', amt: budget.savingsAmt ?? 0, status: 'Moves at month end', color: MODULE_COLORS['module-3'].color },
            ].map((r, i) => (
              <View key={i} style={s.budgetRow}>
                <Text style={{ fontSize: 20, marginTop: 2 }}>{r.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={s.budgetRowHead}><Text style={s.budgetRowLabel}>{r.label}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={[s.budgetRowAmt, { color: r.color }]}>{formatCoins(r.amt)}</Text></View></View>
                  <View style={s.budgetTrackB}><View style={[s.budgetFillB, { width: '100%', backgroundColor: r.color }]} /></View>
                  <Text style={s.budgetRowStatus}>{r.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Swimming Fin */}
      <Animated.View style={[{ position: 'absolute', zIndex: 50, opacity: finVisible ? 1 : 0 }, { transform: [{ translateX: finX }, { translateY: finY }, { scaleX: finFlip }] }]} pointerEvents={finVisible ? 'box-none' : 'none'}>
        <TouchableOpacity onPress={handleFinTap} activeOpacity={0.8} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          {finHasUpdate && <Animated.View style={[s.finAlertRing, { opacity: finPulse.interpolate({ inputRange: [1, 1.25], outputRange: [0.8, 0.3] }) }]} />}
          <View style={[s.finBody, s.finBodyTappable, finHasUpdate && s.finBodyAlert]}>
            <Text style={{ fontSize: 28 }}>{FIN.emoji}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Drawer tab */}
      <TouchableOpacity style={s.drawerTab} activeOpacity={0.85} onPress={() => drawerOpen ? closeDrawer() : openDrawer()}><Text style={s.drawerTabIcon}>{drawerOpen ? '\u203A' : '\u2039'}</Text></TouchableOpacity>

      {/* Drawer backdrop */}
      {drawerOpen && <Animated.View style={[s.drawerBackdropStyle, { opacity: backdropAnim }]} pointerEvents="auto"><TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} /></Animated.View>}

      {/* Drawer panel — quests by chapter */}
      <Animated.View style={[s.drawerPanel, { transform: [{ translateX: drawerAnim }], paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={s.drawerHeaderRow}>
          <View>
            <Text style={s.drawerTitle}>Quests</Text>
            <Text style={s.drawerSub}>{completedQuestCount}/{QUEST_MAP.length} complete</Text>
          </View>
          <TouchableOpacity onPress={closeDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={s.drawerClose}>{'\u2715'}</Text></TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {(() => {
            const curCh = getCurrentChapter(sim);

            const renderChapterSection = (chapter, isCurrent) => {
              const meta = CHAPTER_META[chapter];
              if (!meta) return null;
              const mainQuests = QUEST_MAP.filter(q => q.chapter === chapter);
              const sideQuests = ROADMAP_SIDE_QUESTS.filter(q => q.chapter === chapter);
              const completedMain = mainQuests.filter(q => completedStages.includes(q.stageId));
              const completedSide = sideQuests.filter(q => (sim?.completedSideQuests ?? []).includes(q.id));
              const totalComplete = completedMain.length + completedSide.length;
              const totalQuests = mainQuests.length + sideQuests.length;
              const chapterColor = CHAPTER_COLORS_MAP[chapter] ?? { color: Colors.primary, colorLight: Colors.primaryLight };
              const isChapterComplete = mainQuests.every(q => completedStages.includes(q.stageId));

              return (
                <View key={chapter} style={[s.dwChapterSection, isCurrent && s.dwChapterSectionCurrent]}>
                  {/* Chapter header */}
                  <View style={s.dwChapterHeader}>
                    <View style={[s.dwChapterIconCircle, { backgroundColor: isCurrent ? chapterColor.color : chapterColor.colorLight }]}>
                      <Text style={[s.dwChapterIcon, isCurrent && { color: Colors.white }]}>{meta.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.dwChapterName, isCurrent && { color: chapterColor.color }]}>Chapter {chapter} {'\u00B7'} {meta.name}</Text>
                      <Text style={s.dwChapterProgress}>{totalComplete}/{totalQuests} complete</Text>
                    </View>
                    {isChapterComplete && <Text style={[s.dwChapterBadge, { color: chapterColor.color }]}>{'\u2713'}</Text>}
                  </View>

                  {/* Main quests */}
                  {mainQuests.map(quest => {
                    const isComplete = completedStages.includes(quest.stageId);
                    const isActiveQuest = !isComplete && QUEST_MAP.find(q => !completedStages.includes(q.stageId))?.id === quest.id;
                    return (
                      <TouchableOpacity
                        key={quest.id}
                        style={[s.dwQuestCard, isComplete && s.dwQuestCardComplete, isActiveQuest && { borderLeftColor: Colors.primary }]}
                        onPress={() => { if (!isComplete) { const qid = STAGE_TO_QUEST[quest.stageId]; if (qid) { closeDrawer(); setTimeout(() => setActiveQuest(qid), 300); } } }}
                        disabled={isComplete}
                        activeOpacity={0.82}
                      >
                        <View style={[s.dwQuestIconCircle, { backgroundColor: isComplete ? chapterColor.colorLight : isActiveQuest ? Colors.primaryLight : Colors.border }]}>
                          <Text style={s.dwQuestIcon}>{QC_ICONS[quest.id] ?? '\uD83C\uDFAF'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={s.dwQuestTopRow}>
                            <Text style={[s.dwQuestType, { color: isActiveQuest ? Colors.primary : Colors.textMuted }]}>{isActiveQuest ? 'CURRENT' : isComplete ? 'COMPLETE' : 'MAIN QUEST'}</Text>
                            {isComplete && <Text style={[s.dwQuestCheck, { color: chapterColor.color }]}>{'\u2713'}</Text>}
                          </View>
                          <Text style={[s.dwQuestName, isComplete && s.dwQuestNameComplete]} numberOfLines={2}>{quest.name}</Text>
                        </View>
                        {!isComplete && <Text style={s.dwQuestChevron}>{'\u203A'}</Text>}
                      </TouchableOpacity>
                    );
                  })}

                  {/* Side quests */}
                  {sideQuests.length > 0 && (
                    <View style={s.dwSideSection}>
                      <Text style={s.dwSideHeader}>SIDE QUESTS</Text>
                      {sideQuests.map(sq => {
                        const isComplete = (sim?.completedSideQuests ?? []).includes(sq.id);
                        return (
                          <TouchableOpacity
                            key={sq.id}
                            style={[s.dwSideCard, isComplete && s.dwSideCardComplete]}
                            onPress={() => { if (!sq.built) { setComingSoonName(sq.name); setShowComingSoon(true); } }}
                            activeOpacity={0.82}
                          >
                            <View style={[s.dwSideIconCircle, { backgroundColor: isComplete ? chapterColor.colorLight : Colors.border }]}>
                              <Text style={s.dwSideIcon}>{sq.icon}</Text>
                            </View>
                            <View style={{ flex: 1, gap: 4 }}>
                              <Text style={[s.dwSideName, isComplete && s.dwSideNameComplete]} numberOfLines={2}>{sq.name}</Text>
                              <View style={s.dwSidePill}><Text style={s.dwSidePillText}>{sq.category}</Text></View>
                            </View>
                            <Text style={s.dwSideRight}>{isComplete ? '\u2713' : sq.built ? '\u203A' : '\uD83D\uDD1C'}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {!isCurrent && <View style={s.dwChapterDivider} />}
                </View>
              );
            };

            return <>
              {/* Current chapter — pinned at top */}
              <Text style={s.dwNowHeader}>NOW PLAYING</Text>
              {renderChapterSection(curCh, true)}

              {/* Divider */}
              <View style={s.dwSectionDivider}><View style={s.dwDividerLine} /><Text style={s.dwDividerLabel}>ALL CHAPTERS</Text><View style={s.dwDividerLine} /></View>

              {/* All other chapters in order */}
              {Object.keys(CHAPTER_META).map(Number).filter(ch => ch !== curCh).map(ch => renderChapterSection(ch, false))}
            </>;
          })()}
        </ScrollView>
      </Animated.View>

      {/* Fin overlay */}
      {finOverlayVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View style={[s.finOverlayBackdrop, { opacity: finBackdropAnim }]}><TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleFinModalClose} /></Animated.View>
          <View style={s.finOverlayContainer} pointerEvents="box-none">
            <Animated.View style={[s.finOverlayCard, { transform: [{ translateY: finSlideAnim }], paddingBottom: insets.bottom + 16 }]}>
              <View style={s.finOverlayTopRow}><View style={s.finOverlayCircle}><Text style={{ fontSize: 22 }}>{FIN.emoji}</Text></View><Text style={s.finOverlayName}>Fin</Text><Text style={s.finOverlayMonth}>{getMonthLabel(simMonthRaw)}</Text></View>
              <Text style={s.finOverlayMsg}>{getFinNarrative(sim)}</Text>
              {nextQuestId ? <TouchableOpacity style={s.finOverlayBtn} activeOpacity={0.88} onPress={() => { handleFinModalClose(); setTimeout(() => setActiveQuest(nextQuestId), 300); }}><Text style={s.finOverlayBtnText}>Next step {'\u2192'}</Text></TouchableOpacity> : <Text style={s.finOverlayCaughtUp}>You're all caught up.</Text>}
              <TouchableOpacity onPress={handleFinModalClose} activeOpacity={0.7} style={s.finOverlayDismiss}><Text style={s.finOverlayDismissText}>Explore dashboard</Text></TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      )}

      {/* History bottom sheet */}
      {activeSheet === 'history' && (
        <Modal transparent animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
          <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} activeOpacity={1} onPress={closeSheet} />
          <Animated.View style={[s.sheetContainer, { transform: [{ translateY: sheetAnim }], paddingBottom: insets.bottom + 24, position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
            <>
                <View style={s.sheetHandle} />
                <View style={s.sheetTitleRow}>
                  <Text style={s.sheetTitle}>{'\uD83D\uDCDC History'}</Text>
                  <TouchableOpacity onPress={closeSheet}><Text style={s.sheetCloseX}>{'\u2715'}</Text></TouchableOpacity>
                </View>

                {(() => {
                  const sl = { 'stage-1': { icon: '\uD83C\uDFAF', text: 'Set FI Number' }, 'stage-2': { icon: '\uD83C\uDFE6', text: 'Opened bank account' }, 'stage-3': { icon: '\uD83D\uDCCA', text: 'Built monthly budget' }, 'stage-4': { icon: '\uD83D\uDCBC', text: 'Received first paycheck' }, 'stage-5': { icon: '\uD83D\uDCC8', text: 'Started investing' } };
                  const evts = [...completedStages.filter(sid => sl[sid]).map(sid => ({ ...sl[sid], type: 'milestone' })), ...history.map(h => ({ icon: '\uD83D\uDCC5', text: `Month ${h.month} \u2014 Net worth \uD83E\uDE99${Math.round(Object.values(h.walletSnapshots ?? {}).reduce((a, b) => a + b, 0)).toLocaleString()}`, type: 'month' }))].reverse();
                  return <ScrollView style={{ maxHeight: SH * 0.75 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
                    {evts.length === 0 ? <View style={s.sheetEmptyCenter}><Text style={{ fontSize: 40 }}>{'\uD83D\uDCD6'}</Text><Text style={s.sheetEmptyTitle}>Your story starts here</Text><Text style={s.sheetEmpty}>Every decision you make will appear here.</Text></View> : evts.map((e, i) => <View key={i} style={s.historyRow}><View style={[s.historyIconCircle, e.type === 'milestone' && { backgroundColor: Colors.primaryLight }]}><Text style={{ fontSize: 16 }}>{e.icon}</Text></View><Text style={s.historyText}>{e.text}</Text></View>)}
                  </ScrollView>;
                })()}
            </>
          </Animated.View>
        </Modal>
      )}

      {/* Bank & Portfolio full-screen modals */}
      <BankModal
        visible={showBankModal}
        onClose={() => setShowBankModal(false)}
        sim={sim}
        onSimUpdate={refreshAll}
      />
      <PortfolioModal
        visible={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        sim={sim}
        onSimUpdate={refreshAll}
      />

      {/* Advance Confirm Modal */}
      {showAdvanceConfirm && (
        <Modal transparent animationType="none" statusBarTranslucent onRequestClose={closeAdvanceConfirm}>
          <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} activeOpacity={1} onPress={closeAdvanceConfirm} />
          <Animated.View style={[s.sheetContainer, { transform: [{ translateY: advanceConfirmAnim }], paddingBottom: insets.bottom + 24, position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
            <>
                <View style={s.sheetHandle} />
                <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 4 }}>{'\uD83D\uDC1F'}</Text>
                <Text style={s.summaryTitle}>Advance to {MONTH_NAMES[simMonthRaw % 12]}?</Text>
                <Text style={s.advConfirmSub}>Here's what happens this month</Text>
                <View style={s.summaryDivider} />
                {(() => {
                  const lines = [];
                  if (completedStages.includes('stage-3') && income) lines.push({ icon: '\uD83D\uDCB8', label: 'Salary arriving', amt: `+${income.toLocaleString()}`, color: MODULE_COLORS['module-3'].color });
                  if (completedStages.includes('stage-4') && budget?.needsAmt) lines.push({ icon: '\uD83C\uDFE0', label: 'Needs deducted', amt: `-${budget.needsAmt.toLocaleString()}`, color: Colors.textSecondary });
                  if (wallets.some(w => (w.interestRate ?? 0) > 0)) lines.push({ icon: '\uD83D\uDCC8', label: 'Interest ticks on your accounts', value: null, color: null });
                  const sgWallet = wallets.find(w => w.type === 'savings-goal');
                  if (sgWallet && completedStages.includes('stage-5') && sgWallet.balance < sgWallet.target) lines.push({ icon: '\uD83C\uDFAF', label: `Savings goal contribution`, amt: `-${(sgWallet.monthlyContribution ?? 0).toLocaleString()}`, color: MODULE_COLORS['module-3'].color });
                  const efWallet2 = wallets.find(w => w.type === 'emergency');
                  if (efWallet2 && completedStages.includes('stage-6') && efWallet2.balance < efWallet2.target) lines.push({ icon: '\uD83D\uDEE1\uFE0F', label: 'Emergency fund contribution', amt: `-${(sim?.stage6Data?.monthlyContribution ?? 0).toLocaleString()}`, color: '#F5883A' });
                  const invWallet = wallets.find(w => w.type === 'investment');
                  if (invWallet && completedStages.includes('stage-9')) lines.push({ icon: '\uD83D\uDCC8', label: 'DCA investment', amt: `-${(sim?.monthlyDCA ?? 0).toLocaleString()}`, color: MODULE_COLORS['module-4'].color });
                  if (lines.length === 0) return <Text style={s.advConfirmEmpty}>{'\uD83D\uDCC5'} Time passes. Keep building.</Text>;
                  return lines.map((l, i) => (
                    <View key={i} style={s.summaryLineRow}>
                      <Text style={s.summaryLineIcon}>{l.icon}</Text>
                      <Text style={s.summaryLineLabel}>{l.label}</Text>
                      {l.amt && <View style={s.summaryLineValue}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={[s.summaryLineAmt, l.color && { color: l.color }]}>{l.amt}</Text></View>}
                    </View>
                  ));
                })()}
                {completedStages.includes('stage-3') && income > 0 && (
                  <>
                    <View style={s.summaryDivider} />
                    <View style={s.summaryNetRow}>
                      <Text style={s.summaryNetLabel}>Net this month</Text>
                      <View style={s.summaryLineValue}>
                        <Image source={COIN_ASSET} style={{ width: 15, height: 15 }} />
                        <Text style={[s.summaryNetAmt, { color: MODULE_COLORS['module-3'].color }]}>+{(income - (budget?.needsAmt ?? 0)).toLocaleString()}</Text>
                      </View>
                    </View>
                  </>
                )}
                <View style={s.advConfirmBtns}>
                  <TouchableOpacity style={s.advConfirmCancel} onPress={closeAdvanceConfirm} activeOpacity={0.82}>
                    <Text style={s.advConfirmCancelText}>Not yet</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.advConfirmGo} onPress={doAdvance} activeOpacity={0.88}>
                    <Text style={s.advConfirmGoText}>{"Let's go \u2192"}</Text>
                  </TouchableOpacity>
                </View>
            </>
          </Animated.View>
        </Modal>
      )}

      {/* Gate Modal */}
      {showGateModal && (
        <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowGateModal(false)}>
          <View style={s.gateBackdrop}>
            <View style={s.gateCard}>
              <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>{'\uD83D\uDC1F'}</Text>
              <Text style={s.gateTitle}>Not quite yet</Text>
              <Text style={s.gateBody}>{gateMessage}</Text>
              <TouchableOpacity style={s.gateCta} onPress={() => setShowGateModal(false)} activeOpacity={0.88}>
                <Text style={s.gateCtaText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Monthly Summary Modal */}
      {showMonthlySummary && monthSummary && (
        <Modal transparent animationType="none" statusBarTranslucent onRequestClose={closeMonthlySummary}>
          <TouchableOpacity style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} activeOpacity={1} onPress={closeMonthlySummary} />
          <Animated.View style={[s.sheetContainer, { transform: [{ translateY: summarySheetAnim }], paddingBottom: insets.bottom + 24, position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
            <>
                <View style={s.sheetHandle} />
                <Text style={s.summaryTitle}>Month {(monthSummary.newMonth ?? 2) - 1} Complete</Text>
                <Text style={s.summarySubtitle}>{MONTH_NAMES[((monthSummary.newMonth ?? 2) - 2) % 12]}</Text>
                <View style={s.summaryDivider} />

                {(() => {
                  const hasLines = (monthSummary.salaryCredit > 0) || (monthSummary.needsDebit > 0) || (monthSummary.interestEarned > 0) || (monthSummary.savingsContribution ?? 0) > 0 || (monthSummary.efContribution ?? 0) > 0 || (monthSummary.dcaContribution ?? 0) > 0 || (monthSummary.investmentReturns ?? 0) > 0;
                  if (!hasLines) return <Text style={s.summaryEmptyText}>{'\uD83D\uDCC5'} Month passed. Keep completing quests to unlock more.</Text>;
                  return <>
                    {monthSummary.salaryCredit > 0 && <View style={s.summaryLineRow}><Text style={s.summaryLineIcon}>{'\uD83D\uDCB0'}</Text><Text style={s.summaryLineLabel}>Salary credited</Text><View style={s.summaryLineValue}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={[s.summaryLineAmt, { color: MODULE_COLORS['module-3'].color }]}>+{Math.round(monthSummary.salaryCredit).toLocaleString()}</Text></View></View>}
                    {monthSummary.needsDebit > 0 && <View style={s.summaryLineRow}><Text style={s.summaryLineIcon}>{'\uD83C\uDFE0'}</Text><Text style={s.summaryLineLabel}>Needs deducted</Text><View style={s.summaryLineValue}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={s.summaryLineAmt}>-{Math.round(monthSummary.needsDebit).toLocaleString()}</Text></View></View>}
                    {monthSummary.interestEarned > 0 && <View style={s.summaryLineRow}><Text style={s.summaryLineIcon}>{'\uD83D\uDCC8'}</Text><Text style={s.summaryLineLabel}>Interest earned</Text><View style={s.summaryLineValue}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={[s.summaryLineAmt, { color: MODULE_COLORS['module-3'].color }]}>+{monthSummary.interestEarned.toFixed(1)}</Text></View></View>}
                    {(monthSummary.savingsContribution ?? 0) > 0 && <View style={s.summaryLineRow}><Text style={s.summaryLineIcon}>{'\uD83C\uDFAF'}</Text><Text style={s.summaryLineLabel}>Savings goal</Text><View style={s.summaryLineValue}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={[s.summaryLineAmt, { color: MODULE_COLORS['module-3'].color }]}>-{Math.round(monthSummary.savingsContribution).toLocaleString()}</Text></View></View>}
                    {(monthSummary.efContribution ?? 0) > 0 && <View style={s.summaryLineRow}><Text style={s.summaryLineIcon}>{'\uD83D\uDEE1\uFE0F'}</Text><Text style={s.summaryLineLabel}>Emergency fund</Text><View style={s.summaryLineValue}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={[s.summaryLineAmt, { color: '#F5883A' }]}>-{Math.round(monthSummary.efContribution).toLocaleString()}</Text></View></View>}
                    {(monthSummary.dcaContribution ?? 0) > 0 && <View style={s.summaryLineRow}><Text style={s.summaryLineIcon}>{'\uD83D\uDCC8'}</Text><Text style={s.summaryLineLabel}>DCA invested</Text><View style={s.summaryLineValue}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={[s.summaryLineAmt, { color: MODULE_COLORS['module-4'].color }]}>-{Math.round(monthSummary.dcaContribution).toLocaleString()}</Text></View></View>}
                    {(monthSummary.investmentReturns ?? 0) > 0 && <View style={s.summaryLineRow}><Text style={s.summaryLineIcon}>{'\uD83D\uDCB9'}</Text><Text style={s.summaryLineLabel}>Investment returns</Text><View style={s.summaryLineValue}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={[s.summaryLineAmt, { color: MODULE_COLORS['module-3'].color }]}>+{monthSummary.investmentReturns.toFixed(2)}</Text></View></View>}
                  </>;
                })()}

                <View style={s.summaryDivider} />
                {(() => {
                  const net = (monthSummary.salaryCredit ?? 0) + (monthSummary.interestEarned ?? 0) - (monthSummary.needsDebit ?? 0);
                  return (
                    <View style={s.summaryNetRow}>
                      <Text style={s.summaryNetLabel}>Net this month</Text>
                      <View style={s.summaryLineValue}>
                        <Image source={COIN_ASSET} style={{ width: 15, height: 15 }} />
                        <Text style={[s.summaryNetAmt, { color: net >= 0 ? MODULE_COLORS['module-3'].color : Colors.danger }]}>
                          {net >= 0 ? '+' : ''}{Math.round(net).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                <TouchableOpacity style={s.summaryCta} onPress={() => { closeMonthlySummary(); if (monthSummary.salaryCredit > 0) setBankNotif(true); }} activeOpacity={0.88}>
                  <Text style={s.summaryCtaText}>{"Let's go \u2192"}</Text>
                </TouchableOpacity>
            </>
          </Animated.View>
        </Modal>
      )}

      {/* Job Offer Modal */}
      {showJobOffer && (
        <Modal visible transparent={false} animationType="fade" statusBarTranslucent>
          <View style={[s.jobOfferScreen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
            <SimConfetti />
            <ScrollView contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              {jobOfferStep === 1 ? (
                <>
                  <Text style={{ fontSize: 64, marginBottom: 8 }}>{'\uD83C\uDF89'}</Text>
                  <Text style={s.jobTitle}>Fin has news for you!</Text>
                  <View style={s.finCard}><View style={s.finCardTop}><View style={s.finCardAvatar}><Text style={{ fontSize: 16 }}>{FIN.emoji}</Text></View><Text style={s.finCardLabel}>FIN SAYS</Text></View><Text style={s.finCardText}>I pulled some strings. Luminary just opened a role and I think you're perfect for it. Here's the offer.</Text></View>
                  <View style={s.jobOfferCard}>
                    <Text style={{ fontSize: 20 }}>{'\uD83C\uDFE2'}</Text>
                    <Text style={s.jobCompany}>Luminary</Text>
                    <Text style={s.jobRole}>Experience Architect</Text>
                    <View style={s.summaryDivider} />
                    {[
                      { id: 4500, icon: '\uD83D\uDCBC', title: 'Steady Start', salary: '4,500', desc: 'Solid offer. Room to grow.' },
                      { id: 5200, icon: '\u2B50', title: 'Sweet Spot', salary: '5,200', desc: 'Right where most Experience Architects land.' },
                      { id: 6500, icon: '\uD83D\uDE80', title: 'High Roller', salary: '6,500', desc: 'Big expectations. Bigger rewards.' },
                    ].map(opt => (
                      <TouchableOpacity key={opt.id} style={[s.salaryOption, selectedSalary === opt.id && s.salaryOptionSelected]} onPress={() => setSelectedSalary(opt.id)} activeOpacity={0.85}>
                        <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.salaryOptTitle}>{opt.title}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={s.salaryOptSalary}>{opt.salary.toLocaleString()} / month</Text></View>
                          <Text style={s.salaryOptDesc}>{opt.desc}</Text>
                        </View>
                        {selectedSalary === opt.id && <Text style={{ fontSize: 18, color: Colors.primary }}>{'\u2713'}</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 64, marginBottom: 8 }}>{'\u270D\uFE0F'}</Text>
                  <Text style={s.jobTitle}>Offer accepted!</Text>
                  <Text style={s.jobSubtitle}>Experience Architect at Luminary</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 16 }}>
                    <Image source={COIN_ASSET} style={{ width: 24, height: 24 }} />
                    <Text style={s.jobSalaryHero}>{selectedSalary?.toLocaleString()}</Text>
                    <Text style={s.jobSalaryUnit}>/month</Text>
                  </View>
                  <View style={s.jobDetailCard}>
                    <Text style={s.jobDetailRow}>{'\uD83D\uDCC5'} Start date: Month {(sim?.currentMonth ?? 1) + 1}</Text>
                    <Text style={s.jobDetailRow}>{'\uD83D\uDCB8'} First salary: Next month advance</Text>
                    <Text style={s.jobDetailRow}>{'\uD83C\uDFE6'} Credited to: {(sim?.wallets ?? []).find(w => w.type === 'bank')?.label ?? 'Bank'}</Text>
                  </View>
                  <View style={s.finCard}><View style={s.finCardTop}><View style={s.finCardAvatar}><Text style={{ fontSize: 16 }}>{FIN.emoji}</Text></View><Text style={s.finCardLabel}>FIN SAYS</Text></View><Text style={s.finCardText}>Your first salary arrives when you advance to next month. But first - open Quest 3 to watch it land.</Text></View>
                </>
              )}
            </ScrollView>
            <View style={{ paddingHorizontal: 24 }}>
              {jobOfferStep === 1 ? (
                <TouchableOpacity style={[s.jobCta, !selectedSalary && { opacity: 0.5 }]} disabled={!selectedSalary} onPress={() => setJobOfferStep(2)} activeOpacity={0.88}>
                  <Text style={s.jobCtaText}>{"Accept offer \u2192"}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.jobCta} onPress={async () => {
                  if (uid && selectedSalary) await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), { income: selectedSalary, incomeStartMonth: sim?.currentMonth ?? 1, incomeLabel: 'Luminary salary', incomeEmoji: '\uD83D\uDCBC', updatedAt: Date.now() });
                  setShowJobOffer(false);
                  setJobOfferStep(1);
                  setSelectedSalary(null);
                  await loadSim();
                  setFinHasUpdate(true);
                }} activeOpacity={0.88}>
                  <Text style={s.jobCtaText}>{"Let's go \u2192"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Reset confirm */}
      <Modal visible={showResetConfirm} transparent animationType="fade"><View style={s.alertBg}><View style={s.alertCard}><Text style={s.alertEmoji}>{'\u26A0\uFE0F'}</Text><Text style={s.alertTitle}>Reset FinCity?</Text><Text style={s.alertBody}>This will wipe all your simulation progress and start fresh. Your FinCoins will reset to {'\uD83E\uDE99'}1,980. Your learning progress is not affected.</Text><View style={s.alertBtns}><TouchableOpacity style={s.alertCancel} onPress={() => setShowResetConfirm(false)}><Text style={s.alertCancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={s.alertConfirm} onPress={doReset}><Text style={s.alertConfirmText}>Reset</Text></TouchableOpacity></View></View></View></Modal>

      {/* Advance error */}
      <Modal visible={showAdvError} transparent animationType="fade"><View style={s.alertBg}><View style={s.alertCard}><Text style={s.alertEmoji}>{'\uD83D\uDE2C'}</Text><Text style={s.alertTitle}>Something went wrong</Text><Text style={s.alertBody}>Could not advance the month. Please try again.</Text><View style={s.alertBtns}><TouchableOpacity style={s.alertConfirm} onPress={() => setShowAdvError(false)}><Text style={s.alertConfirmText}>OK</Text></TouchableOpacity></View></View></View></Modal>

      {/* Coming soon */}
      <Modal visible={showComingSoon} transparent animationType="fade"><View style={s.alertBg}><View style={s.alertCard}><Text style={s.alertEmoji}>{'\uD83D\uDD1C'}</Text><Text style={s.alertTitle}>{comingSoonName || 'Coming soon'}</Text><Text style={s.alertBody}>{comingSoonName === 'New Savings Goal' ? 'Savings goal accounts are coming to the bank in the next update. For now, your Quest 5 savings goal is your primary savings bucket.' : 'This side quest is coming soon. Keep completing main quests to unlock more of FinCity.'}</Text><View style={s.alertBtns}><TouchableOpacity style={s.alertConfirm} onPress={() => setShowComingSoon(false)}><Text style={s.alertConfirmText}>Got it</Text></TouchableOpacity></View></View></View></Modal>

      {/* Goal complete modal */}
      <Modal visible={showGoalComplete} transparent={false} animationType="fade" statusBarTranslucent>
        <View style={[s.goalScreen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          {goalCompleteConfetti && <SimConfetti />}
          <ScrollView contentContainerStyle={s.goalContent} showsVerticalScrollIndicator={false}>
            <Text style={s.goalEmoji}>{'\uD83C\uDFAF'}</Text>
            <Text style={s.goalHeroTitle}>Goal reached!</Text>
            <Text style={s.goalHeroName}>{currentGoal?.label}</Text>
            <View style={s.goalStatsCard}>
              {[
                { label: 'Target reached', value: Math.round(currentGoal?.target ?? 0).toLocaleString(), coin: true, color: MODULE_COLORS['module-3'].color },
                { label: 'Months to reach goal', value: String(currentGoal?.monthsActive ?? 0), coin: false, color: Colors.textPrimary },
                { label: 'Interest earned', value: Math.round(currentGoal?.interestEarned ?? 0).toLocaleString(), coin: true, color: MODULE_COLORS['module-3'].color },
              ].map((row, i, arr) => (
                <View key={i} style={[s.goalStatRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={s.goalStatLabel}>{row.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {row.coin && <Image source={COIN_ASSET} style={{ width: 13, height: 13 }} />}
                    <Text style={[s.goalStatValue, { color: row.color }]}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={s.dtFinCard}>
              <View style={s.finCardAvatar}><Text style={{ fontSize: 14 }}>{FIN.emoji}</Text></View>
              <Text style={s.dtFinCardText}>{currentGoal?.label} {'\u2014'} done. Every coin of that target is now sitting in your account. This is what financial discipline actually looks like.</Text>
            </View>
            <View style={s.goalNextCard}>
              <Text style={s.goalNextTitle}>What happens to your money?</Text>
              <Text style={s.goalNextBody}>Your savings goal account is closed and <Text style={{ fontFamily: Fonts.bold, color: Colors.textPrimary }}>FC {Math.round(currentGoal?.target ?? 0).toLocaleString()}</Text> moves back to your bank account automatically.</Text>
            </View>
          </ScrollView>
          <View style={s.goalBtns}>
            <TouchableOpacity style={[s.goalBtnSecondary, closingGoal && { opacity: 0.6 }]} disabled={closingGoal} onPress={async () => {
              setClosingGoal(true);
              try { await closeSavingsGoalAccount(uid, currentGoal?.id ?? 'savings-goal'); await refreshAll(); } catch (e) { console.error('closeSavingsGoal error:', e); }
              setClosingGoal(false); setShowGoalComplete(false); setCurrentGoal(null); setGoalCompleteConfetti(false);
              if (completedGoalQueue.length > 0) { const [next, ...rest] = completedGoalQueue; setCurrentGoal(next); setCompletedGoalQueue(rest); setGoalCompleteConfetti(true); setShowGoalComplete(true); }
            }} activeOpacity={0.85}>
              {closingGoal ? <ActivityIndicator color={Colors.primary} size="small" /> : <Text style={s.goalBtnSecondaryText}>Close account</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.goalBtnPrimary} onPress={async () => {
              setClosingGoal(true);
              try { await closeSavingsGoalAccount(uid, currentGoal?.id ?? 'savings-goal'); await refreshAll(); } catch (e) { console.error('closeSavingsGoal error:', e); }
              setClosingGoal(false); setShowGoalComplete(false); setCurrentGoal(null); setGoalCompleteConfetti(false);
              openSheet('bank');
              if (completedGoalQueue.length > 0) { const [next, ...rest] = completedGoalQueue; setCurrentGoal(next); setCompletedGoalQueue(rest); setGoalCompleteConfetti(true); setTimeout(() => setShowGoalComplete(true), 600); }
            }} activeOpacity={0.88}>
              <Text style={s.goalBtnPrimaryText}>{"Create new goal \u2192"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quest modals */}
      <Quest1
        visible={activeQuest === 'quest-1'}
        income={sim?.income ?? 4500}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest2
        visible={activeQuest === 'quest-2'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setBankNotif(true); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest3
        visible={activeQuest === 'quest-3'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest4
        visible={activeQuest === 'quest-4'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest5
        visible={activeQuest === 'quest-5'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest6
        visible={activeQuest === 'quest-6'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest7
        visible={activeQuest === 'quest-7'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest8
        visible={activeQuest === 'quest-8'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest9
        visible={activeQuest === 'quest-9'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest10
        visible={activeQuest === 'quest-10'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest11
        visible={activeQuest === 'quest-11'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest12
        visible={activeQuest === 'quest-12'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  entryRoot: { flex: 1, backgroundColor: Colors.background },
  entryContent: { alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxxl + Spacing.md, paddingBottom: Spacing.md },
  topBarTitle: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary },
  topBarSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 2 },
  pctBadge: { backgroundColor: Colors.primary, borderRadius: Radii.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  pctText: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize.base, color: Colors.white },
  progressBarBg: { height: 6, backgroundColor: Colors.border, marginHorizontal: Spacing.lg, borderRadius: Radii.full, marginBottom: Spacing.lg },
  progressBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: Radii.full },
  welcomeHeading: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary, textAlign: 'center', lineHeight: 36 },
  welcomeBody: { fontFamily: Fonts.regular, fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 26, marginTop: 12, paddingHorizontal: 24 },
  bulletList: { marginTop: 20, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  bulletDot: { color: Colors.primary, fontFamily: Fonts.bold },
  bulletText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  entryCta: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center', marginHorizontal: 24 },
  entryCtaText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },

  dashHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 5 },
  coinAmt: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.warningDark },
  resetBtn: { backgroundColor: Colors.lightGray, borderRadius: Radii.full, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted },

  notifDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8000D', borderWidth: 1.5, borderColor: Colors.background },

  // Centred date section
  dtContainer: { alignItems: 'center', marginBottom: 12, paddingHorizontal: 16, marginTop: 16 },
  dtYear: { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 2 },
  dtMonthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dtMonth: { fontFamily: Fonts.extraBold, fontSize: 32, color: Colors.textPrimary },
  dtAdvIconText: { fontSize: 18, color: Colors.textPrimary },
  dtAdvIconDisabled: { opacity: 0.25 },
  dtFinCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, width: '100%', ...Shadows.soft },
  dtFinCardLabel: { fontFamily: Fonts.bold, fontSize: 11, color: MODULE_COLORS['module-1'].color, letterSpacing: 0.8 },
  dtFinCardText: { flex: 1, fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  // Navigation pill row
  navRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 10 },
  navPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.white, borderRadius: 12, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  navPillLabel: { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },

  // Divider
  divRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divLabel: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.5, color: Colors.textMuted },

  // Empty state
  esContainer: { marginHorizontal: 16, marginBottom: 16, alignItems: 'center' },
  esEmoji: { fontSize: 40, marginBottom: 10, marginTop: 4 },
  esTitle: { fontFamily: Fonts.extraBold, fontSize: 17, color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  esBody: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16, paddingHorizontal: 8 },
  esHintRow: { flexDirection: 'row', gap: 10, marginBottom: 10, width: '100%' },
  esHintCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 12, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  esHintIcon: { fontSize: 20 },
  esHintText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  esCta: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginTop: 6 },

  // Net worth card
  nwCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.white, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  nwTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nwLabel: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2, color: Colors.textMuted },
  nwChange: { fontFamily: Fonts.bold, fontSize: 12 },
  nwHero: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary, marginBottom: 12 },
  nwBarWrap: { gap: 6 },
  nwBarTrack: { height: 10, backgroundColor: Colors.border, borderRadius: 5, position: 'relative' },
  nwBarFill: { height: 10, borderRadius: 5, position: 'absolute', left: 0, top: 0 },
  nwMilestone: { position: 'absolute', top: 0, width: 1.5, height: 10, backgroundColor: Colors.background, zIndex: 2 },
  nwBarFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nwBarLabel: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.primary },
  nwBarTarget: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  nwNoFI: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },

  // Quest banner
  qbBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 12, borderLeftWidth: 4, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  qbIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  qbEyebrow: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1, color: Colors.textMuted, marginBottom: 2 },
  qbName: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  qbCta: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  qbCtaText: { fontFamily: Fonts.bold, fontSize: 12 },

  // Wallet grid
  walletGrid: { marginHorizontal: 16, gap: 10, marginBottom: 12 },
  walletRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  wcCard: { borderRadius: 18, overflow: 'hidden', padding: 16, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 10, elevation: 4 },
  wcCardHalf: { width: (SW - 32 - 10) / 2 },
  wcCardFull: { width: '100%' },
  wcIconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  wcName: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.8, color: 'rgba(255,255,255,0.75)', marginBottom: 4, textTransform: 'uppercase' },
  wcBalRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  wcCoin: { width: 14, height: 14 },
  wcBal: { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.white },
  wcSub: { fontFamily: Fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  wcSubAccount: { fontFamily: Fonts.medium, fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 4 },
  wcSubWarn: { fontFamily: Fonts.medium, fontSize: 10, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', marginBottom: 4 },
  wcBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginBottom: 8 },
  wcBadgeHYSA: { backgroundColor: 'rgba(255,255,255,0.25)' },
  wcBadgeBasic: { backgroundColor: 'rgba(255,255,255,0.15)' },
  wcBadgeText: { fontFamily: Fonts.bold, fontSize: 10, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 },
  wcGoalTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, marginBottom: 4, overflow: 'hidden' },
  wcGoalFill: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' },

  // Budget card
  budgetCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.white, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  budgetTitle: { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 1, color: Colors.textMuted },
  budgetMonth: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.textMuted },
  budgetRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  budgetRowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetRowLabel: { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  budgetRowAmt: { fontFamily: Fonts.bold, fontSize: 13 },
  budgetTrackB: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  budgetFillB: { height: 6, borderRadius: 3 },
  budgetRowStatus: { fontFamily: Fonts.medium, fontSize: 11, color: Colors.textMuted },

  // Fin body
  finBody: { width: 44, height: 44, borderRadius: 22, backgroundColor: MODULE_COLORS['module-1'].colorLight, alignItems: 'center', justifyContent: 'center', ...Shadows.soft },
  finBodyTappable: { borderWidth: 2, borderColor: MODULE_COLORS['module-1'].color },
  finBodyAlert: { backgroundColor: Colors.dangerLight, borderColor: Colors.danger },
  finAlertRing: { position: 'absolute', top: -8, left: -8, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FECACA' },
  entryBubble: { position: 'absolute', bottom: 52, left: -70, width: 180, backgroundColor: MODULE_COLORS['module-1'].colorLight, borderRadius: Radii.lg, padding: 10, ...Shadows.medium },
  entryBubbleText: { fontFamily: Fonts.regular, fontSize: 12, color: MODULE_COLORS['module-1'].color, lineHeight: 18, textAlign: 'center' },
  entryBubbleTail: { position: 'absolute', bottom: -6, left: 82, width: 12, height: 12, backgroundColor: MODULE_COLORS['module-1'].colorLight, transform: [{ rotate: '45deg' }] },

  // Drawer
  drawerTab: { position: 'absolute', left: 0, top: '50%', transform: [{ translateY: -40 }], width: 28, height: 80, borderTopRightRadius: 16, borderBottomRightRadius: 16, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.medium, zIndex: 98 },
  drawerTabIcon: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textMuted },
  drawerBackdropStyle: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99 },
  drawerPanel: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, backgroundColor: Colors.background, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 16, zIndex: 100 },
  drawerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  drawerTitle: { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textPrimary },
  drawerClose: { fontSize: 18, color: Colors.textMuted, marginTop: 4 },
  drawerSub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  // Drawer — chapter-based quest list
  dwChapterSection: { marginBottom: 8 },
  dwChapterSectionCurrent: { backgroundColor: Colors.white, borderRadius: 18, padding: 14, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  dwChapterHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 8 },
  dwChapterIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dwChapterIcon: { fontSize: 16 },
  dwNowHeader: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.5, color: Colors.textMuted, marginBottom: 8 },
  dwChapterName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  dwChapterProgress: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  dwChapterBadge: { fontSize: 16, fontFamily: Fonts.bold },
  dwQuestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 12, marginBottom: 8, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  dwQuestCardComplete: { opacity: 0.6 },
  dwQuestIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dwQuestIcon: { fontSize: 17 },
  dwQuestTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  dwQuestType: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1 },
  dwQuestCheck: { fontFamily: Fonts.bold, fontSize: 13 },
  dwQuestName: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary, lineHeight: 19 },
  dwQuestNameComplete: { color: Colors.textMuted },
  dwQuestChevron: { fontSize: 20, color: Colors.textMuted },
  dwSideSection: { marginLeft: 8, marginBottom: 8 },
  dwSideHeader: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 6, marginLeft: 4 },
  dwSideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 10, marginBottom: 6, gap: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  dwSideCardComplete: { opacity: 0.55 },
  dwSideIconCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dwSideIcon: { fontSize: 14 },
  dwSideName: { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary, lineHeight: 17 },
  dwSideNameComplete: { color: Colors.textMuted },
  dwSidePill: { alignSelf: 'flex-start', backgroundColor: Colors.border, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  dwSidePillText: { fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textSecondary },
  dwSideRight: { fontSize: 14, color: Colors.textMuted },
  dwChapterDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  dwSectionDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 8 },
  dwDividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dwDividerLabel: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.5, color: Colors.textMuted },

  // Fin overlay
  finOverlayBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  finOverlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  finOverlayCard: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  finOverlayTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  finOverlayCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F5FB', alignItems: 'center', justifyContent: 'center' },
  finOverlayName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginLeft: 10, flex: 1 },
  finOverlayMonth: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  finOverlayMsg: { fontFamily: Fonts.regular, fontSize: 16, color: Colors.textPrimary, lineHeight: 26, marginTop: 16 },
  finOverlayBtn: { backgroundColor: Colors.primary, borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  finOverlayBtnText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },
  finOverlayCaughtUp: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 24 },
  finOverlayDismiss: { alignItems: 'center', marginTop: 12, marginBottom: 4 },
  finOverlayDismissText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },

  // Bottom sheets
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: SH * 0.85 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary },
  sheetCloseX: { fontSize: 16, color: Colors.textMuted, padding: 4 },
  sheetEmpty: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
  sheetEmptyCenter: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  sheetEmptyTitle: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  sheetCard: { backgroundColor: Colors.lightGray, borderRadius: Radii.lg, padding: 16, marginBottom: 12 },
  sheetCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetCardName: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary },
  sheetCardSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  sheetCardBal: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary },
  sheetTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  sheetFill: { height: 6, borderRadius: 3 },
  sheetCardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sheetActionBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.lg, paddingVertical: 8, alignItems: 'center' },
  sheetActionText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textSecondary },
  sheetOutlineBtn: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radii.lg, paddingVertical: 14, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  sheetOutlineBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.primary },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  historyText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textPrimary, flex: 1, lineHeight: 20 },

  // Monthly summary modal
  summaryTitle: { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  summarySubtitle: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, textAlign: 'center', fontStyle: 'italic', marginBottom: 16 },
  summaryDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  summaryLineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  summaryLineIcon: { fontSize: 18, width: 24 },
  summaryLineLabel: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, flex: 1 },
  summaryLineValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  summaryLineAmt: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textSecondary },
  summaryNetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  summaryNetLabel: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary },
  summaryNetAmt: { fontFamily: Fonts.extraBold, fontSize: 18 },
  summaryCta: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  summaryCtaText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },
  summaryEmptyText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

  // Advance confirm modal
  advConfirmSub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginBottom: 12 },
  advConfirmEmpty: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  advConfirmBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  advConfirmCancel: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.lg, height: 48, alignItems: 'center', justifyContent: 'center' },
  advConfirmCancelText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textSecondary },
  advConfirmGo: { flex: 1, backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 48, alignItems: 'center', justifyContent: 'center' },
  advConfirmGoText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },

  // Gate modal
  gateBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  gateCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
  gateTitle: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, marginBottom: 8 },
  gateBody: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  gateCta: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 48, width: '100%', alignItems: 'center', justifyContent: 'center' },
  gateCtaText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },


  // Fin card (used in job offer)
  finCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, width: '100%', ...Shadows.soft },
  finCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  finCardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: MODULE_COLORS['module-1'].colorLight, alignItems: 'center', justifyContent: 'center' },
  finCardLabel: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: MODULE_COLORS['module-1'].colorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden' },
  finCardText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Job offer modal
  jobOfferScreen: { flex: 1, backgroundColor: Colors.background },
  jobTitle: { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.textPrimary, textAlign: 'center', marginBottom: 16 },
  jobSubtitle: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  jobOfferCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, width: '100%', alignItems: 'center', ...Shadows.medium, marginBottom: 16 },
  jobCompany: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, marginTop: 8 },
  jobRole: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  salaryOption: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 8, backgroundColor: Colors.white },
  salaryOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  salaryOptTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  salaryOptSalary: { fontFamily: Fonts.extraBold, fontSize: 13, color: Colors.primary },
  salaryOptDesc: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  jobSalaryHero: { fontFamily: Fonts.extraBold, fontSize: 36, color: Colors.textPrimary },
  jobSalaryUnit: { fontFamily: Fonts.regular, fontSize: 16, color: Colors.textMuted },
  jobDetailCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, width: '100%', marginBottom: 16, ...Shadows.soft },
  jobDetailRow: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 28 },
  jobCta: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center' },
  jobCtaText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },

  // Styled alerts
  alertBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, marginHorizontal: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8, width: '100%' },
  alertEmoji: { fontSize: 36, marginBottom: 12 },
  alertTitle: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  alertBody: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertBtns: { flexDirection: 'row', gap: 8, width: '100%' },
  alertCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  alertCancelText: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textSecondary },
  alertConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  alertConfirmText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },

  // Goal complete modal
  goalScreen: { flex: 1, backgroundColor: Colors.background },
  goalContent: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  goalEmoji: { fontSize: 72, marginBottom: 8, marginTop: 8 },
  goalHeroTitle: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  goalHeroName: { fontFamily: Fonts.regular, fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  goalStatsCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 18, width: '100%', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  goalStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  goalStatLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  goalStatValue: { fontFamily: Fonts.bold, fontSize: 14 },
  goalNextCard: { backgroundColor: MODULE_COLORS['module-3'].colorLight, borderRadius: 14, padding: 16, width: '100%', marginTop: 4 },
  goalNextTitle: { fontFamily: Fonts.bold, fontSize: 13, color: MODULE_COLORS['module-3'].color, marginBottom: 6 },
  goalNextBody: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  goalBtns: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 16 },
  goalBtnSecondary: { flex: 1, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  goalBtnSecondaryText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.primary },
  goalBtnPrimary: { flex: 1, backgroundColor: Colors.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  goalBtnPrimaryText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },

  // Portfolio sheet
  portfolioPieSection: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 16 },
  portfolioPieCenter: { position: 'absolute', alignItems: 'center', width: 60 },
  portfolioPieCenterScore: { fontFamily: Fonts.extraBold, fontSize: 22 },
  portfolioPieCenterLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  portfolioPieLegend: { width: '100%', marginTop: 12, paddingHorizontal: 8, gap: 6 },
  portfolioPieLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  portfolioPieLegendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  portfolioPieLegendName: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, flex: 1 },
  portfolioPieLegendPct: { fontFamily: Fonts.bold, fontSize: 12 },
  portfolioSummaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  portfolioSummaryCard: { flex: 1, backgroundColor: Colors.background, borderRadius: 14, padding: 14, gap: 4 },
  portfolioSummaryLabel: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1, color: Colors.textMuted, marginBottom: 2 },
  portfolioSummaryValue: { fontFamily: Fonts.extraBold, fontSize: 20 },
  portfolioSummarySubLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  portfolioSummarySubValue: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  portfolioRiskBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginVertical: 4 },
  portfolioRiskBarFill: { height: 4, borderRadius: 2 },
  portfolioSection: { marginBottom: 16 },
  portfolioSectionTitle: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 10 },
  portfolioHoldingCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  portfolioHoldingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  portfolioHoldingName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  portfolioHoldingDrift: { fontFamily: Fonts.regular, fontSize: 11, lineHeight: 16 },
  portfolioHoldingPct: { fontFamily: Fonts.extraBold, fontSize: 16 },
  portfolioHoldingValue: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary },
  portfolioHoldingBars: { gap: 4 },
  portfolioHoldingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  portfolioHoldingBarLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, width: 36 },
  portfolioHoldingBarTrack: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  portfolioHoldingBarFill: { height: 6, borderRadius: 3 },
  portfolioPerformanceCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  portfolioPerfRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  portfolioPerfLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  portfolioPerfValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  portfolioPerfSuffix: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  portfolioRebalanceBtn: { backgroundColor: MODULE_COLORS['module-4'].color, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 6 },
  portfolioRebalanceBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  portfolioRebalanceMeta: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  portfolioRebalanceLocked: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  portfolioRebalanceLockedText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
});
