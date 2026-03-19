// app/(tabs)/simulate.js
//
// FinCity — simulation home screen.
// Entry screen → Dashboard with quest drawer + bottom sheets.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, Dimensions, PanResponder, Modal, Easing,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../../store/userStore';
import { loadSimProgress, saveSimProgress } from '../../lib/lifeSim';
import { createSimProgress, getMonthLabel } from '../../constants/lifeSimStages';
import { Colors, Fonts, Spacing, Radii, Shadows, Typography, MODULE_COLORS } from '../../constants/theme';
import { COIN_ASSET, FIN } from '../../constants/simTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../lib/firebase';
import Quest1 from '../quests/quest-1';
import Quest2 from '../quests/quest-2';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Static config ──────────────────────────────────────────────────────────
const STAT_TILES = [
  { key: 'income',   label: 'INCOME',   moduleKey: 'module-1' },
  { key: 'spent',    label: 'SPENT',    moduleKey: 'module-2' },
  { key: 'saved',    label: 'SAVED',    moduleKey: 'module-3' },
  { key: 'invested', label: 'INVESTED', moduleKey: 'module-4' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MAIN_QUESTS = [
  { id: 'set-fi-number',   icon: '\uD83C\uDFAF', label: 'Calculate your FI Number',    shortDesc: "Figure out what you're working toward.", finLine: "Before anything else, you need to know what you're working toward. Your FI Number is your north star.", reward: 15, completedWhen: (sim) => (sim?.completedStages ?? []).includes('stage-1'), route: '/simulate/chapter-1' },
  { id: 'open-bank',       icon: '\uD83C\uDFE6', label: 'Open a bank account',         shortDesc: 'Give your money a proper home.',         finLine: "Your coins are just sitting there. A bank account is the foundation of everything that comes next.",     reward: 15, completedWhen: (sim) => (sim?.completedStages ?? []).includes('stage-2'), route: '/simulate/chapter-2' },
  { id: 'build-budget',    icon: '\uD83D\uDCCA', label: 'Build your monthly budget',   shortDesc: 'Plan where every coin goes.',              finLine: "Without a budget, every paycheck disappears. Plan where your money goes before it arrives.",             reward: 15, completedWhen: (sim) => (sim?.completedStages ?? []).includes('stage-3'), route: '/simulate/chapter-3' },
  { id: 'first-paycheck',  icon: '\uD83D\uDCBC', label: 'Receive your first paycheck', shortDesc: 'Watch your first salary land.',            finLine: "Your first salary is ready. Watch it land and see your budget spring into action.",                      reward: 20, completedWhen: (sim) => (sim?.completedStages ?? []).includes('stage-4'), route: '/simulate/chapter-4' },
  { id: 'start-investing', icon: '\uD83D\uDCC8', label: 'Make your first investment',  shortDesc: 'Put your savings to work.',                finLine: "Your emergency fund is solid. Now it's time to make your money work for you.",                          reward: 25, completedWhen: (sim) => (sim?.completedStages ?? []).includes('stage-5'), route: '/simulate/chapter-5' },
];

const SIDE_QUESTS = [
  { id: 'check-fi-progress', icon: '\uD83C\uDFAF', label: 'Check your FI progress',  reward: 5, availableWhen: (sim) => !!(sim?.ffn),                                          action: 'dashboard' },
  { id: 'review-accounts',   icon: '\uD83C\uDFE6', label: 'Review your accounts',     reward: 5, availableWhen: (sim) => (sim?.wallets ?? []).length > 1,                        action: 'bank' },
  { id: 'read-fin-advice',   icon: '\uD83D\uDC1F', label: "Read Fin's latest advice", reward: 5, availableWhen: () => true,                                                     action: 'fin-modal' },
  { id: 'check-portfolio',   icon: '\uD83D\uDCC8', label: 'Check your portfolio',      reward: 5, availableWhen: (sim) => (sim?.wallets ?? []).some(w => w.type === 'investment'), action: 'portfolio' },
];

const DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

// ─── SparkLine ──────────────────────────────────────────────────────────────
function SparkLine({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 28, gap: 3, marginTop: 8 }}>
      {data.map((v, i) => (
        <View key={i} style={{ width: 6, borderRadius: 3, height: Math.max((v / max) * 28, 3), backgroundColor: 'rgba(255,255,255,0.5)' }} />
      ))}
    </View>
  );
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
  const wallets = sim?.wallets ?? [];
  const ef = wallets.find(w => w.id === 'emergency-fund');
  const invest = wallets.find(w => w.type === 'investment');
  if (!completed.includes('stage-1')) return "Before anything else, you need to know what you're working toward. Your Financial Independence Number is the target that makes every other decision meaningful.";
  if (!completed.includes('stage-2')) return `FI Number locked in at \uD83E\uDE99${(sim.ffn ?? 0).toLocaleString()}. Now your cash needs a home. A bank account is the foundation of everything that comes next.`;
  if (!completed.includes('stage-3')) return "Bank account open. Here's the truth: without a budget, every paycheck disappears. Build yours before the money arrives.";
  if (!completed.includes('stage-4')) return "Budget set. Your first paycheck is ready. Watch it land \u2014 this is the moment the simulation gets real.";
  if (!completed.includes('stage-5')) { const p = ef?.target ? Math.round((ef.balance / ef.target) * 100) : 0; return `Emergency fund is ${p}% funded. This is your safety net \u2014 the thing that means a broken laptop doesn't derail your entire financial plan. Keep building it.`; }
  if (invest) return `Portfolio at \uD83E\uDE99${Math.round(invest.balance).toLocaleString()} and compounding. The best thing you can do right now is nothing \u2014 stay consistent, don't panic sell.`;
  return "You've built something real. Net worth growing, savings automated, investments compounding. This is what financial independence looks like in progress.";
}

function getNextRoute(cs) {
  if (!cs.includes('stage-1')) return '/simulate/chapter-1';
  if (!cs.includes('stage-2')) return '/simulate/chapter-2';
  if (!cs.includes('stage-3')) return '/simulate/chapter-3';
  if (!cs.includes('stage-4')) return '/simulate/chapter-4';
  if (!cs.includes('stage-5')) return '/simulate/chapter-5';
  return null;
}

function getMonthSummary(sim) {
  const completed = sim?.completedStages ?? [];
  const month = sim?.currentMonth ?? 1;
  const netWorth = (sim?.wallets ?? []).reduce((s, w) => s + (w.balance ?? 0), 0);
  const budget = sim?.monthlyBudget;
  const invested = (sim?.wallets ?? []).find(w => w.type === 'investment');
  if (completed.length === 0) return `Month ${month} \u00B7 No activity yet. Complete your first quest to get started.`;
  if (!budget) return `Month ${month} \u00B7 FI Number set. Open a bank account to keep building.`;
  if (!invested) return `Month ${month} \u00B7 Budget active. Net worth at \uD83E\uDE99${Math.round(netWorth).toLocaleString()} and growing.`;
  return `Month ${month} \u00B7 Portfolio active. You're building real financial momentum.`;
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
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [activeQuest, setActiveQuest] = useState(null);
  const [bankNotif, setBankNotif] = useState(false);
  const [finHasUpdate, setFinHasUpdate] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const drawerAnim = useRef(new Animated.Value(-280)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const finBackdropAnim = useRef(new Animated.Value(0)).current;
  const finSlideAnim = useRef(new Animated.Value(200)).current;
  const sheetAnim = useRef(new Animated.Value(SH)).current;
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
  const progressPct = Math.round((completedStages.length / 5) * 100);
  const budget = sim?.monthlyBudget ?? null;
  const income = sim?.income ?? 0;
  const history = sim?.history ?? [];
  const nwDelta = history.length >= 2
    ? Object.values((history[history.length - 1].walletSnapshots ?? {})).reduce((a, b) => a + b, 0) - Object.values((history[history.length - 2].walletSnapshots ?? {})).reduce((a, b) => a + b, 0)
    : 0;
  const statValues = { income: budget ? income : null, spent: budget ? (budget.needsAmt ?? 0) + (budget.wantsAmt ?? 0) : null, saved: budget ? (budget.savingsAmt ?? 0) : null, invested: invested > 0 ? invested : null };
  const pendingFinCoins = sim?.pendingFinCoins ?? 0;
  const completedMainQuests = MAIN_QUESTS.filter(q => q.completedWhen(sim));
  const currentMainQuest = MAIN_QUESTS.find(q => !q.completedWhen(sim)) ?? null;
  const availableSideQuests = SIDE_QUESTS.filter(q => q.availableWhen(sim));
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

  const getSparkData = (key) => {
    const last6 = history.slice(-6);
    const padded = [...Array(Math.max(0, 6 - last6.length)).fill(0)];
    const vals = last6.map(h => {
      const snaps = h.walletSnapshots ?? {};
      if (key === 'income') return income;
      if (key === 'spent') return budget ? (budget.needsAmt ?? 0) + (budget.wantsAmt ?? 0) : 0;
      if (key === 'saved') return budget ? (budget.savingsAmt ?? 0) : 0;
      if (key === 'invested') return Object.entries(snaps).reduce((ss, [id, bal]) => { const w = wallets.find(ww => ww.id === id); return w?.type === 'investment' ? ss + bal : ss; }, 0);
      return 0;
    });
    return [...padded, ...vals];
  };

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
      setFinVisible(false);
      setFinHasUpdate(false);
      const cs = sim?.completedStages ?? [];
      const latest = cs[cs.length - 1] ?? null;
      if (latest) AsyncStorage.setItem('fin_last_seen_stage', latest);
      showFin();
    }
  };

  // ── Bottom Sheets ───────────────────────────────────────────────────────
  const openSheet = (id) => { setActiveSheet(id); sheetAnim.setValue(SH); Animated.spring(sheetAnim, { toValue: 0, tension: 55, friction: 11, useNativeDriver: true }).start(); };
  const closeSheet = () => { Animated.timing(sheetAnim, { toValue: SH, duration: 250, useNativeDriver: true }).start(() => setActiveSheet(null)); };
  const handleChipPress = (id) => openSheet(id);

  const handleSideQuestTap = (q) => {
    closeDrawer();
    setTimeout(() => {
      if (q.action === 'fin-modal') { setFinVisible(false); showFin(); }
      else if (q.action === 'bank' || q.action === 'portfolio' || q.action === 'history') openSheet(q.action);
    }, 300);
  };

  // ── Reset ───────────────────────────────────────────────────────────────
  const handleReset = () => { Alert.alert('Reset simulation?', 'This wipes all accounts, balances, and story progress.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Reset', style: 'destructive', onPress: async () => { const fresh = createSimProgress(uid, profile?.finCoins ?? 0); const rs = { ...fresh, scene: 'arrival-intro', chapter: 0, simDay: 1, simMonth: 1, shownSteps: [], lifeEventFired: false, wantsDecisions: {}, wantsEvents: {}, spendHistory: [], history: [], automatedSavings: null }; await saveSimProgress(uid, rs); setSim(rs); setInsideCity(false); } }]); };

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
  const nextRoute = getNextRoute(completedStages);

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      {/* Header */}
      <View>
        <View style={s.topBar}><View><Text style={s.topBarTitle}>FinCity</Text><Text style={s.topBarSub}>{completedStages.length} of 5 milestones complete</Text></View><View style={s.dashHeaderRight}><View style={s.coinBadge}><Image source={COIN_ASSET} style={{ width: 16, height: 16 }} /><Text style={s.coinAmt}>{finCoins.toLocaleString()}</Text>{pendingFinCoins > 0 && <View style={s.pendingBadge}><Text style={s.pendingBadgeText}>+{pendingFinCoins} on payday</Text></View>}</View>{sim && <TouchableOpacity style={s.resetBtn} onPress={handleReset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={s.resetText}>{'\u21BA'}</Text></TouchableOpacity>}</View></View>
        <View style={s.progressBarBg}><View style={[s.progressBarFill, { width: `${progressPct}%` }]} /></View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {/* Date + icons row */}
        <View style={s.dateIconRow}>
          <View style={s.dateLeft}>
            <Text style={s.dateYear}>YEAR {simYear}</Text>
            <View style={s.dateMonthRow}>
              <Text style={s.dateMonth}>{monthName}</Text>
              <TouchableOpacity onPress={() => Alert.alert('Advance Month', 'This will apply interest, advance the sim clock, and trigger any life events. Coming soon.')} activeOpacity={0.8} style={s.advanceBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={s.advanceIcon}>{'\u23ED'}</Text>{pendingFinCoins > 0 && <Text style={s.advanceLabel}>+{pendingFinCoins}{'\uD83E\uDE99'}</Text>}</TouchableOpacity>
            </View>
            <Text style={s.dateDay}>{simDay}</Text>
            <View style={s.netWorthRow}>
              <Text style={s.netWorthLabel}>NET WORTH</Text>
              <Image source={COIN_ASSET} style={{ width: 16, height: 16 }} />
              <Text style={s.netWorthValue}>{Math.round(netWorth).toLocaleString()}</Text>
            </View>
            {ffn ? (
              <View style={{ marginTop: 8 }}>
                <View style={s.fiTrack}><View style={[s.fiFill, { width: `${Math.round(fiPct * 100)}%` }]} /></View>
                <Text style={s.fiLabel}>{'\uD83C\uDFAF'} {Math.round(fiPct * 100)}% to FI Number</Text>
              </View>
            ) : (
              <Text style={s.fiEmpty}>Complete your first milestone to set your FI Number</Text>
            )}
            <Text style={s.monthSummary}>{getMonthSummary(sim)}</Text>
          </View>
          <View style={s.dateRight}>
            <TouchableOpacity style={s.dateIconBtn} onPress={() => { handleChipPress('bank'); dismissBankNotif(); }} activeOpacity={0.82}>
              <View style={s.dateIconCircle}><Text style={{ fontSize: 20 }}>{'\uD83C\uDFE6'}</Text>{bankNotif && <View style={s.notifDot} />}</View>
              <Text style={s.dateIconLabel}>Bank</Text>
            </TouchableOpacity>
            {[{ id: 'portfolio', icon: '\uD83D\uDCC8', label: 'Portfolio' }, { id: 'history', icon: '\uD83D\uDCDC', label: 'History' }].map(c => (
              <TouchableOpacity key={c.id} style={s.dateIconBtn} onPress={() => handleChipPress(c.id)} activeOpacity={0.82}>
                <View style={s.dateIconCircle}><Text style={{ fontSize: 20 }}>{c.icon}</Text></View>
                <Text style={s.dateIconLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats grid */}
        <View style={s.statsGrid}>
          {STAT_TILES.map(tile => { const mc = MODULE_COLORS[tile.moduleKey]; const val = statValues[tile.key]; return (
            <View key={tile.key} style={[s.statTile, { backgroundColor: mc.color }]}>
              <Text style={s.statLabel}>{tile.label}</Text>
              {val != null ? <View style={s.statValueRow}><Image source={COIN_ASSET} style={{ width: 14, height: 14 }} /><Text style={s.statValue}>{Math.round(val).toLocaleString()}</Text></View> : <Text style={s.statDash}>{'\u2014'}</Text>}
              <SparkLine data={getSparkData(tile.key)} />
            </View>
          ); })}
        </View>
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

      {/* Drawer panel — quests only */}
      <Animated.View style={[s.drawerPanel, { transform: [{ translateX: drawerAnim }], paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={s.drawerHeaderRow}>
          <Text style={s.drawerTitle}>Quests</Text>
          <TouchableOpacity onPress={closeDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Text style={s.drawerClose}>{'\u2715'}</Text></TouchableOpacity>
        </View>
        <Text style={s.drawerSub}>{completedMainQuests.length}/{MAIN_QUESTS.length} complete</Text>

        <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 2, paddingTop: 4, paddingBottom: 40 }}>
          {/* Hero quest */}
          {currentMainQuest ? (
            <TouchableOpacity style={s.questCard} onPress={() => { closeDrawer(); setTimeout(() => { if (currentMainQuest.id === 'set-fi-number') setActiveQuest('quest-1'); else if (currentMainQuest.id === 'open-bank') setActiveQuest('quest-2'); else if (currentMainQuest.route) router.push(currentMainQuest.route); }, 300); }} activeOpacity={0.88}>
              <View style={s.questCardLeft}>
                <View style={s.questCardIconCircle}><Text style={{ fontSize: 20 }}>{currentMainQuest.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.questCardLabel}>{currentMainQuest.label}</Text>
                  <Text style={s.questCardDesc}>{currentMainQuest.shortDesc}</Text>
                  <View style={s.questCardReward}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={s.questCardRewardText}>+{currentMainQuest.reward}</Text></View>
                </View>
              </View>
              <Text style={s.questCardArrow}>{'\u203A'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.allDoneCard}><Text style={{ fontSize: 32 }}>{'\uD83C\uDFC6'}</Text><Text style={s.allDoneTitle}>All quests complete</Text><Text style={s.allDoneSub}>You've built something real.</Text></View>
          )}

          {/* Side quests */}
          {availableSideQuests.length > 0 && <>
            <Text style={[s.questHeaderLabel, { marginBottom: 8, marginTop: 4 }]}>WHILE YOU'RE HERE</Text>
            {availableSideQuests.map(q => (
              <TouchableOpacity key={q.id} style={s.sideQuestRow} onPress={() => handleSideQuestTap(q)} activeOpacity={0.82}>
                <View style={s.sideQuestRowIcon}><Text style={{ fontSize: 16 }}>{q.icon}</Text></View>
                <Text style={s.sideQuestRowLabel}>{q.label}</Text>
                <View style={s.sideRewardRow}><Image source={COIN_ASSET} style={{ width: 11, height: 11 }} /><Text style={s.sideRewardText}>+{q.reward}</Text></View>
                <Text style={s.questCardArrow}>{'\u203A'}</Text>
              </TouchableOpacity>
            ))}
          </>}

          {/* Completed */}
          {completedMainQuests.length > 0 && <View style={{ marginTop: 8 }}>
            <TouchableOpacity style={s.completedHeader} onPress={() => setCompletedExpanded(e => !e)} activeOpacity={0.7}><Text style={s.completedHeaderText}>COMPLETED ({completedMainQuests.length})</Text><Text style={s.completedChevron}>{completedExpanded ? '\u25B2' : '\u25BC'}</Text></TouchableOpacity>
            {completedExpanded && completedMainQuests.map(q => <View key={q.id} style={s.completedRow}><Text style={s.completedIcon}>{q.icon}</Text><Text style={s.completedLabel}>{q.label}</Text><Text style={s.completedCheck}>{'\u2713'}</Text></View>)}
          </View>}
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
              {nextRoute ? <TouchableOpacity style={s.finOverlayBtn} activeOpacity={0.88} onPress={() => { handleFinModalClose(); setTimeout(() => router.push(nextRoute), 300); }}><Text style={s.finOverlayBtnText}>Next step {'\u2192'}</Text></TouchableOpacity> : <Text style={s.finOverlayCaughtUp}>You're all caught up.</Text>}
              <TouchableOpacity onPress={handleFinModalClose} activeOpacity={0.7} style={s.finOverlayDismiss}><Text style={s.finOverlayDismissText}>Explore dashboard</Text></TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      )}

      {/* Bottom sheets */}
      {activeSheet && (
        <Modal transparent animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
          <TouchableOpacity style={s.sheetBackdrop} activeOpacity={1} onPress={closeSheet}>
            <Animated.View style={[s.sheetContainer, { transform: [{ translateY: sheetAnim }], paddingBottom: insets.bottom + 24 }]}>
              <TouchableOpacity activeOpacity={1}>
                <View style={s.sheetHandle} />
                <View style={s.sheetTitleRow}>
                  <Text style={s.sheetTitle}>{activeSheet === 'bank' ? '\uD83C\uDFE6 Bank' : activeSheet === 'portfolio' ? '\uD83D\uDCC8 Portfolio' : '\uD83D\uDCDC History'}</Text>
                  <TouchableOpacity onPress={closeSheet}><Text style={s.sheetCloseX}>{'\u2715'}</Text></TouchableOpacity>
                </View>

                {/* Bank */}
                {activeSheet === 'bank' && <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SH * 0.6 }}>
                  {wallets.length === 0 ? <Text style={s.sheetEmpty}>No accounts yet. Complete your first steps.</Text> : wallets.map(w => {
                    const isEF = w.id === 'emergency-fund';
                    const efPct = isEF && w.target ? Math.round((w.balance / w.target) * 100) : 0;
                    return <View key={w.id} style={s.sheetCard}>
                      <View style={s.sheetCardTop}><Text style={{ fontSize: 22 }}>{w.icon ?? '\uD83D\uDCB5'}</Text><View style={{ flex: 1 }}><Text style={s.sheetCardName}>{w.label ?? 'Cash'}</Text><Text style={s.sheetCardSub}>{w.institution ? `${w.institution} \u00B7 ` : ''}{w.interestRate ? `${(w.interestRate * 100).toFixed(1)}% p.a.` : w.type}</Text></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN_ASSET} style={{ width: 14, height: 14 }} /><Text style={s.sheetCardBal}>{Math.round(w.balance ?? 0).toLocaleString()}</Text></View></View>
                      {isEF && w.target > 0 && <View style={{ marginTop: 10 }}><View style={s.sheetTrack}><View style={[s.sheetFill, { width: `${Math.min(efPct, 100)}%`, backgroundColor: Colors.successDark }]} /></View><Text style={s.sheetCardSub}>{efPct}% of {'\uD83E\uDE99'}{Math.round(w.target).toLocaleString()} target</Text></View>}
                      <View style={s.sheetCardActions}><TouchableOpacity style={s.sheetActionBtn} onPress={() => Alert.alert('Coming soon', 'Transfers are being built.')}><Text style={s.sheetActionText}>Transfer in</Text></TouchableOpacity><TouchableOpacity style={s.sheetActionBtn} onPress={() => Alert.alert('Coming soon', 'Transfers are being built.')}><Text style={s.sheetActionText}>Transfer out</Text></TouchableOpacity></View>
                    </View>;
                  })}
                  <TouchableOpacity style={s.sheetOutlineBtn} onPress={() => Alert.alert('Coming soon')}><Text style={s.sheetOutlineBtnText}>+ Open new account</Text></TouchableOpacity>
                </ScrollView>}

                {/* Portfolio */}
                {activeSheet === 'portfolio' && (() => {
                  const iw = wallets.find(w => w.type === 'investment');
                  return <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SH * 0.6 }}>
                    {!iw ? <View style={s.sheetEmptyCenter}><Text style={{ fontSize: 40 }}>{'\uD83D\uDCC8'}</Text><Text style={s.sheetEmptyTitle}>No investments yet</Text><Text style={s.sheetEmpty}>Complete the Workplace milestone to start investing.</Text></View> : <>
                      <View style={s.sheetCard}><Text style={s.sheetCardSub}>TOTAL PORTFOLIO</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}><Image source={COIN_ASSET} style={{ width: 20, height: 20 }} /><Text style={[s.sheetCardBal, { fontSize: 28 }]}>{Math.round(iw.balance ?? 0).toLocaleString()}</Text></View></View>
                      {history.length > 0 && <View style={s.sheetCard}><Text style={s.sheetCardSub}>GROWTH</Text><View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 48, gap: 6, marginTop: 8 }}>{history.slice(-6).map((h, i) => { const b = h.walletSnapshots?.[iw.id] ?? 0; const mx = Math.max(...history.slice(-6).map(hh => hh.walletSnapshots?.[iw.id] ?? 0), 1); return <View key={i} style={{ flex: 1, borderRadius: 4, height: Math.max((b / mx) * 48, 4), backgroundColor: Colors.primary, opacity: 0.6 + (i / 6) * 0.4 }} />; })}</View></View>}
                    </>}
                  </ScrollView>;
                })()}

                {/* History */}
                {activeSheet === 'history' && (() => {
                  const sl = { 'stage-1': { icon: '\uD83C\uDFAF', text: 'Set FI Number' }, 'stage-2': { icon: '\uD83C\uDFE6', text: 'Opened bank account' }, 'stage-3': { icon: '\uD83D\uDCCA', text: 'Built monthly budget' }, 'stage-4': { icon: '\uD83D\uDCBC', text: 'Received first paycheck' }, 'stage-5': { icon: '\uD83D\uDCC8', text: 'Started investing' } };
                  const evts = [...completedStages.filter(sid => sl[sid]).map(sid => ({ ...sl[sid], type: 'milestone' })), ...history.map(h => ({ icon: '\uD83D\uDCC5', text: `Month ${h.month} \u2014 Net worth \uD83E\uDE99${Math.round(Object.values(h.walletSnapshots ?? {}).reduce((a, b) => a + b, 0)).toLocaleString()}`, type: 'month' }))].reverse();
                  return <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SH * 0.6 }}>
                    {evts.length === 0 ? <View style={s.sheetEmptyCenter}><Text style={{ fontSize: 40 }}>{'\uD83D\uDCD6'}</Text><Text style={s.sheetEmptyTitle}>Your story starts here</Text><Text style={s.sheetEmpty}>Every decision you make will appear here.</Text></View> : evts.map((e, i) => <View key={i} style={s.historyRow}><View style={[s.historyIconCircle, e.type === 'milestone' && { backgroundColor: Colors.primaryLight }]}><Text style={{ fontSize: 16 }}>{e.icon}</Text></View><Text style={s.historyText}>{e.text}</Text></View>)}
                  </ScrollView>;
                })()}
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Quest modals */}
      <Quest1
        visible={activeQuest === 'quest-1'}
        income={sim?.income ?? 4500}
        onComplete={() => { setActiveQuest(null); loadSim(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest2
        visible={activeQuest === 'quest-2'}
        sim={sim}
        onComplete={() => { setActiveQuest(null); loadSim(); setBankNotif(true); setFinHasUpdate(true); }}
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
  pendingBadge: { backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 4 },
  pendingBadgeText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.warningDark },
  resetBtn: { backgroundColor: Colors.lightGray, borderRadius: Radii.full, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted },

  // Date + icons row
  dateIconRow: { flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  dateLeft: { flex: 1, paddingRight: 12 },
  dateRight: { width: 72, alignItems: 'center', gap: 14, alignSelf: 'stretch', paddingVertical: 4 },
  dateYear: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  dateMonthRow: { flexDirection: 'row', alignItems: 'center' },
  dateMonth: { fontFamily: Fonts.extraBold, fontSize: 42, color: Colors.textPrimary, marginTop: -2 },
  dateDay: { fontFamily: Fonts.regular, fontSize: 16, color: Colors.textSecondary },
  advanceBtn: { marginLeft: 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 },
  advanceIcon: { fontSize: 18, color: Colors.textPrimary },
  advanceLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.warningDark },
  dateIconBtn: { alignItems: 'center', gap: 5 },
  dateIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadows.soft },
  dateIconLabel: { fontFamily: Fonts.bold, fontSize: 8, color: Colors.textMuted, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  notifDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8000D', borderWidth: 1.5, borderColor: Colors.background },
  netWorthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  netWorthLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', marginRight: 4 },
  netWorthValue: { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary },
  fiTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  fiFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  fiLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  fiEmpty: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 8 },
  monthSummary: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, lineHeight: 20, marginTop: 10, marginBottom: 4, fontStyle: 'italic' },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginTop: 16, marginBottom: 16 },
  statTile: { width: (SW - 42) / 2, minHeight: 148, borderRadius: Radii.xl, padding: Spacing.lg, overflow: 'hidden', ...Shadows.medium, justifyContent: 'flex-end' },
  statLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.white, textTransform: 'uppercase', marginBottom: 6 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.white },
  statDash: { fontFamily: Fonts.regular, fontSize: 20, color: Colors.white, opacity: 0.5 },

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
  drawerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  drawerTitle: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary },
  drawerClose: { fontSize: 18, color: Colors.textMuted },
  drawerSub: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  // Quest card in drawer
  questHeaderLabel: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  questCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, ...Shadows.medium, marginBottom: 12 },
  questCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  questCardIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  questCardLabel: { fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 3 },
  questCardDesc: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 6 },
  questCardReward: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  questCardRewardText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
  questCardArrow: { fontSize: 24, color: Colors.textMuted, fontFamily: Fonts.bold },
  allDoneCard: { backgroundColor: Colors.successLight, borderRadius: Radii.xl, padding: 24, alignItems: 'center', gap: 6, marginBottom: 12, ...Shadows.medium },
  allDoneTitle: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.successDark },
  allDoneSub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.successDark, opacity: 0.8 },
  sideQuestRow: { backgroundColor: Colors.white, borderRadius: Radii.lg, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, ...Shadows.medium },
  sideQuestRowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  sideQuestRowLabel: { flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textPrimary },
  sideRewardRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sideRewardText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
  completedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  completedHeaderText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8 },
  completedChevron: { fontSize: 10, color: Colors.textMuted },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, opacity: 0.6 },
  completedIcon: { fontSize: 16 },
  completedLabel: { flex: 1, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textDecorationLine: 'line-through' },
  completedCheck: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.successDark },

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
});
