// app/(tabs)/simulate.js
//
// FinCity — simulation home screen.
// Entry screen → Dashboard with quest drawer + bottom sheets.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, Dimensions, PanResponder, Modal, Easing, ActivityIndicator, TextInput,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Svg, { Path, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../../store/userStore';
import { loadSimProgress, saveSimProgress, advanceMonth as advanceMonthFn, advanceMultipleMonths, resetSimProgress, closeSavingsGoalAccount } from '../../lib/lifeSim';
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
  if (!completed.includes('stage-1')) return 'Welcome to FinCity. Before you touch a single coin, you need to know what you\'re actually building toward. Your FI Number is the foundation \u2014 everything else is just tactics. Start with Quest 1.1.';
  if (!completed.includes('stage-2')) return 'FI Number locked in. Now your money needs somewhere to live. A bank account is the difference between cash that sits and cash that compounds. Open one in Quest 1.2 before we go any further.';
  if (!completed.includes('stage-3') && !sim?.income) return 'Bank account sorted. Your cash is sitting idle. I pulled some strings at Luminary \u2014 there is a job offer waiting for you.';
  if (!completed.includes('stage-3')) return `Your offer is accepted. \uD83E\uDE99${(sim?.income ?? 0).toLocaleString()} a month from Luminary. Open Quest 2.1 to watch your first salary land \u2014 it's a bigger moment than you think.`;
  if (!completed.includes('stage-4')) return 'First salary is in your account. Right now it\'s just sitting there. Quest 2.2 is where you decide what happens to every coin of it \u2014 needs, savings, and the wants budget you actually get to spend.';
  if (completed.includes('stage-4') && !completed.includes('stage-5') && sim?.stage2Data?.accountType === 'basic') return 'Your salary is split and your budget is running. But your savings are earning almost nothing in a basic account. The HYSA upgrade side quest in Chapter 3 fixes this in one step. Open Quest 3.1 to give your savings a goal.';
  if (!completed.includes('stage-5')) return 'Your salary is split and your budget is running. But right now all your savings are sitting in the same account as your spending money. That is a problem \u2014 savings need a separate home with a name and a target. Open Quest 3.1 to fix that.';
  if (completed.includes('stage-5') && !completed.includes('stage-6') && sim?.stage2Data?.accountType === 'basic') return 'Your savings goal and emergency fund are earning almost nothing in a basic account. The HYSA upgrade side quest in Chapter 3 fixes this in one step \u2014 it is worth doing before you go further.';
  if (!completed.includes('stage-6')) return 'Savings goal created. Now let us talk about the other thing that derails most people \u2014 unexpected costs. One medical bill, one broken device, and suddenly you are raiding your savings. Quest 3.2 builds the wall that stops that from happening.';
  if (!completed.includes('stage-7')) {
  const efWallet = (sim?.wallets ?? []).find(w => w.type === 'emergency');
  const efPct = efWallet?.target > 0 ? Math.round(((efWallet.balance ?? 0) / efWallet.target) * 100) : 100;
  if (efPct < 50) return `Your emergency fund is only ${efPct}% funded. Starting to invest before your safety net is complete is risky \u2014 one bad month and you could be forced to sell investments at a loss. Consider fast forwarding a few months to build the fund before Quest 4.1.`;
  if (efPct < 100) return `Emergency fund is ${efPct}% there. You can start Quest 4.1 now \u2014 but be aware that investing before your safety net is complete carries risk. A fully funded emergency fund means you never need to touch your investments in a crisis.`;
  return 'Safety net fully funded. Emergency fund complete. The foundation is solid \u2014 now it is time to make your money work harder. Quest 4.1 \u2014 Compound Interest is next.';
}
  if (!completed.includes('stage-8')) return 'You have seen what compounding does over time. Now the question is which investment vehicle fits your life. Quest 4.2 gives you three options \u2014 each with different fees, effort, and returns. Pick the one that matches how you want to invest.';
  if (!completed.includes('stage-9')) { const vehicle = sim?.investmentVehicle; return `${vehicle?.name ?? 'Your vehicle'} is locked in. Now it is time to make your first actual investment. Quest 4.3 \u2014 open your investment account and watch your portfolio appear on the dashboard for the first time.`; }
  if (completed.includes('stage-9') && !completed.includes('stage-10')) {
    const invWallets = (sim?.wallets ?? []).filter(w => w.type === 'investment');
    if (invWallets.length === 1) return `Portfolio live with ${invWallets[0].label ?? 'your vehicle'}. Every month advance adds your DCA and applies returns. You can open up to 2 more investment accounts in your Portfolio tab \u2014 different vehicles, different strategies, all growing simultaneously. Quest 4.4 is next.`;
  }
  if (!completed.includes('stage-10')) { const inv = (sim?.wallets ?? []).find(w => w.type === 'investment'); return `Your portfolio is live. ${Math.round(inv?.balance ?? 0).toLocaleString()} invested and growing. Every month advance adds your DCA and applies returns. Quest 4.4 is next \u2014 the market is about to drop. How you respond to that moment defines your investing future.`; }
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
    return { label, body: `${sgName} active. ${sgContrib.toLocaleString()} auto-saving each month.` };
  }
  if (!completed.includes('stage-7')) {
    const efContrib = sim?.stage6Data?.monthlyContribution ?? 0;
    return { label, body: `Foundation complete. ${efContrib.toLocaleString()} to emergency fund each month.` };
  }
  if (!completed.includes('stage-8')) return { label, body: 'Compounding understood. Choose your investment vehicle next.' };
  if (!completed.includes('stage-9')) return { label, body: `${sim?.investmentVehicle?.name ?? 'Vehicle'} chosen. Make your first investment next.` };
  if (!completed.includes('stage-10')) { const inv = (sim?.wallets ?? []).find(w => w.type === 'investment'); return { label, body: `Portfolio live. ${Math.round(inv?.balance ?? 0).toLocaleString()} invested and growing.` }; }
  if (!completed.includes('stage-11')) return { label, body: 'Market dip survived. Diversify your portfolio next.' };
  if (!completed.includes('stage-12')) return { label, body: `Portfolio diversified. ${Object.keys(sim?.portfolioAllocations ?? {}).length} assets. Rebalance next.` };
  return { label, body: 'Chapter 4 complete. Portfolio rebalanced and maintained.' };
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── Portfolio bento grid ────────────────────────────────────────────────────

function PortfolioBento({ wallets: allWallets, sim, onPress }) {
  const investmentWallets = (allWallets ?? []).filter(w => w.type === 'investment');
  if (investmentWallets.length === 0) return null;

  const holdings = investmentWallets.flatMap(w => w.holdings ?? []);
  const balance = Math.round(investmentWallets.reduce((s, w) => s + (w.balance ?? 0), 0));
  const totalBal = investmentWallets.reduce((s, w) => s + (w.balance ?? 0), 0) || 1;
  const riskScore = Math.round(investmentWallets.reduce((s, w) => s + (w.riskScore ?? 50) * ((w.balance ?? 0) / totalBal), 0));
  const expectedReturn = investmentWallets.reduce((s, w) => s + (w.expectedReturn ?? 5) * ((w.balance ?? 0) / totalBal), 0);
  const riskInfo = getRiskLabel(riskScore);
  const ffn = sim?.ffn ?? null;
  const monthlyDCA = investmentWallets.reduce((s, w) => s + (w.monthlyDCA ?? 0), 0) || (sim?.monthlyDCA ?? 0);
  const history = sim?.history ?? [];

  const lastHistory = history[history.length - 1];
  const prevInv = Object.entries(lastHistory?.walletSnapshots ?? {})
    .filter(([k]) => k.startsWith('investment'))
    .reduce((s, [, v]) => s + v, 0) || (lastHistory?.walletSnapshots?.investment ?? 0);
  const delta = balance - Math.round(prevInv);

  const yearsToFI = (() => {
    if (!ffn || balance >= ffn) return null;
    let b = balance; const mr = expectedReturn / 100 / 12; let months = 0;
    while (b < ffn && months < 600) { b += monthlyDCA; b *= (1 + mr); months++; }
    return months < 600 ? Math.round(months / 12) : null;
  })();

  const projected = (() => {
    let b = balance; const mr = expectedReturn / 100 / 12;
    for (let m = 0; m < 120; m++) { b += monthlyDCA; b *= (1 + mr); }
    return Math.round(b);
  })();

  // Sparkline data
  const sparkData = (() => {
    const invH = history.slice(-6).map(h => {
      const snaps = h.walletSnapshots ?? {};
      const invTotal = Object.entries(snaps).filter(([k]) => k.startsWith('investment')).reduce((s, [, v]) => s + v, 0);
      return invTotal || (snaps.investment ?? 0);
    });
    if (invH.length < 2) return null;
    invH.push(balance);
    return invH;
  })();

  // Pie paths
  const PIE = 100, R = PIE * 0.4, C = PIE / 2, HOLE = PIE * 0.18;
  const total = holdings.reduce((s, h) => s + (h.allocation ?? 0), 0);
  let startAngle = -Math.PI / 2;
  const paths = total > 0 ? holdings.map(h => {
    const pct = (h.allocation ?? 0) / total;
    if (pct <= 0) return null;
    const end = startAngle + pct * 2 * Math.PI;
    const x1 = C + R * Math.cos(startAngle), y1 = C + R * Math.sin(startAngle);
    const x2 = C + R * Math.cos(end), y2 = C + R * Math.sin(end);
    const d = `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`;
    startAngle = end;
    return { d, color: h.color ?? Colors.primary };
  }).filter(Boolean) : [];

  // Sparkline renderer
  const SPARK_W = 130;
  const SPARK_H = 48;
  const renderBarChart = (data, width, height) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1);
    const barCount = data.length;
    const gap = 3;
    const barWidth = (width - (gap * (barCount - 1))) / barCount;
    return (
      <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end' }}>
        {data.map((val, i) => {
          const barHeight = Math.max(4, (val / max) * height);
          const opacity = 0.3 + (i / (barCount - 1)) * 0.7;
          const isLast = i === barCount - 1;
          return <View key={i} style={{ width: barWidth, height: barHeight, borderRadius: 3, backgroundColor: MODULE_COLORS['module-4'].color, opacity: isLast ? 1 : opacity, marginRight: i < barCount - 1 ? gap : 0 }} />;
        })}
      </View>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [pb.container, pressed && pb.containerPressed]}
      onPress={onPress}
    >
      {/* Tile 1: Balance + Sparkline */}
      <View style={[pb.tile, pb.tileFull]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={pb.tileEyebrow}>INVESTED</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Image source={COIN_ASSET} style={{ width: 18, height: 18 }} />
              <Text style={[pb.tileHero, { color: Colors.textPrimary, fontSize: 28 }]}>{balance.toLocaleString()}</Text>
            </View>
            {delta !== 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}><Text style={[pb.tileDelta, { color: delta > 0 ? MODULE_COLORS['module-3'].color : '#FF4444' }]}>{delta > 0 ? '\u2191' : '\u2193'}</Text><Image source={COIN_ASSET} style={{ width: 11, height: 11 }} /><Text style={[pb.tileDelta, { color: delta > 0 ? MODULE_COLORS['module-3'].color : '#FF4444' }]}>{Math.abs(delta).toLocaleString()} this month</Text></View>}
            {(() => { const streak = sim?.dcaStreak ?? 0; if (streak < 2) return null; return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}><Text style={{ fontSize: 12 }}>{'\uD83D\uDD25'}</Text><Text style={[pb.tileDelta, { color: MODULE_COLORS['module-2'].color }]}>{streak} month DCA streak</Text></View>; })()}
          </View>
          {sparkData && <View style={{ width: SPARK_W, height: SPARK_H, overflow: 'hidden', marginTop: 8 }}>{renderBarChart(sparkData, SPARK_W, SPARK_H)}</View>}
        </View>
      </View>

      {/* Row 2: Pie chart | Asset breakdown */}
      {holdings.length > 0 && (
        <View style={[pb.tile, pb.tileFull, { flexDirection: 'row', gap: 16, alignItems: 'center' }]}>
          <View style={{ alignItems: 'center' }}>
            <Svg width={PIE} height={PIE}><G>
              {paths.map((p, i) => <Path key={i} d={p.d} fill={p.color} stroke={Colors.white} strokeWidth={2} />)}
              <Path d={`M ${C} ${C} m -${HOLE} 0 a ${HOLE} ${HOLE} 0 1 0 ${HOLE * 2} 0 a ${HOLE} ${HOLE} 0 1 0 -${HOLE * 2} 0`} fill={Colors.white} />
            </G></Svg>
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: Colors.border }}>
              {holdings.map((h, i) => <View key={i} style={{ width: `${Math.round(h.allocation ?? 0)}%`, backgroundColor: h.color ?? Colors.primary, borderRightWidth: i < holdings.length - 1 ? 1 : 0, borderRightColor: Colors.white }} />)}
            </View>
            {holdings.map((h, i) => <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: h.color ?? Colors.primary, flexShrink: 0 }} /><Text style={[pb.assetName, { flex: 1 }]} numberOfLines={1}>{h.name}</Text><Text style={[pb.assetPct, { color: h.color ?? Colors.primary }]}>{Math.round(h.allocation ?? 0)}%</Text></View>)}
          </View>
        </View>
      )}

      {/* Best/worst performer */}
      {holdings.length > 1 && (() => {
        const hist2 = history.slice(-2);
        if (hist2.length < 2) return null;
        const prevSnap = hist2[0]?.holdingSnapshots ?? {};
        const changes = holdings.map(h => { const prev = prevSnap[h.assetId] ?? h.value; const change = prev > 0 ? ((h.value - prev) / prev) * 100 : 0; return { ...h, changePct: Math.round(change * 10) / 10 }; }).filter(h => h.changePct !== 0);
        if (changes.length === 0) return null;
        const best = changes.reduce((a, b) => a.changePct > b.changePct ? a : b);
        const worst = changes.reduce((a, b) => a.changePct < b.changePct ? a : b);
        return (
          <View style={[pb.tile, pb.tileFull, { flexDirection: 'row', gap: 8 }]}>
            <View style={{ flex: 1 }}><Text style={pb.tileEyebrow}>BEST THIS MONTH</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}><Text style={{ fontSize: 16 }}>{best.icon ?? '\uD83D\uDCCA'}</Text><View><Text style={[pb.tileSubLabel, { color: Colors.textPrimary, fontFamily: Fonts.bold }]} numberOfLines={1}>{best.name}</Text><Text style={[pb.tileSubLabel, { color: MODULE_COLORS['module-3'].color, fontFamily: Fonts.bold }]}>{'\u2191'} {best.changePct}%</Text></View></View></View>
            {best.assetId !== worst.assetId && <><View style={{ width: 1, backgroundColor: Colors.border }} /><View style={{ flex: 1 }}><Text style={pb.tileEyebrow}>WORST THIS MONTH</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}><Text style={{ fontSize: 16 }}>{worst.icon ?? '\uD83D\uDCCA'}</Text><View><Text style={[pb.tileSubLabel, { color: Colors.textPrimary, fontFamily: Fonts.bold }]} numberOfLines={1}>{worst.name}</Text><Text style={[pb.tileSubLabel, { color: '#FF4444', fontFamily: Fonts.bold }]}>{'\u2193'} {Math.abs(worst.changePct)}%</Text></View></View></View></>}
          </View>
        );
      })()}

      {/* Row 3: Risk | Return | Time to FI */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[pb.tile, pb.tileThird]}>
          <Text style={[pb.tileEyebrow, { color: riskInfo.color }]}>RISK</Text>
          <Text style={[pb.tileHero, { color: riskInfo.color, fontSize: 26 }]}>{riskScore}</Text>
          <Text style={[pb.tileSubLabel, { color: riskInfo.color }]}>{riskInfo.label}</Text>
          <View style={[pb.miniBar, { backgroundColor: riskInfo.color + '20' }]}><View style={[pb.miniBarFill, { width: `${riskScore}%`, backgroundColor: riskInfo.color }]} /></View>
        </View>
        <View style={[pb.tile, pb.tileThird]}>
          <Text style={[pb.tileEyebrow, { color: MODULE_COLORS['module-3'].color }]}>RETURN</Text>
          <Text style={[pb.tileHero, { color: MODULE_COLORS['module-3'].color, fontSize: 26 }]}>{expectedReturn.toFixed(1)}%</Text>
          <Text style={[pb.tileSubLabel, { color: MODULE_COLORS['module-3'].color }]}>per year</Text>
          <Text style={[pb.tileSubLabel, { color: Colors.textMuted, fontSize: 9 }]}>after fees</Text>
        </View>
        <View style={[pb.tile, pb.tileThird]}>
          <Text style={[pb.tileEyebrow, { color: MODULE_COLORS['module-1'].color }]}>TIME TO FI</Text>
          {yearsToFI ? (<><Text style={[pb.tileHero, { color: MODULE_COLORS['module-1'].color, fontSize: 26 }]}>{yearsToFI}</Text><Text style={[pb.tileSubLabel, { color: MODULE_COLORS['module-1'].color }]}>years</Text></>) : balance >= (ffn ?? Infinity) ? (<Text style={[pb.tileHero, { color: MODULE_COLORS['module-3'].color, fontSize: 18 }]}>{'\uD83C\uDFAF'} Done</Text>) : (<Text style={[pb.tileSubLabel, { color: Colors.textMuted }]}>Set FI Number first</Text>)}
        </View>
      </View>

      {/* Tile 4: 10-year projection */}
      <View style={[pb.tile, pb.tileFull]}>
        <Text style={pb.tileEyebrow}>10-YEAR PROJECTION</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Image source={COIN_ASSET} style={{ width: 16, height: 16 }} /><Text style={[pb.tileHero, { color: Colors.textPrimary, fontSize: 22 }]}>{projected.toLocaleString()}</Text></View>
            <Text style={[pb.tileSubLabel, { color: Colors.textMuted, marginTop: 2 }]}>at {expectedReturn.toFixed(1)}% {'\u00B7'} {monthlyDCA.toLocaleString()}/mo DCA</Text>
          </View>
          {ffn && <View style={[pb.projBadge, { backgroundColor: projected >= ffn ? MODULE_COLORS['module-3'].colorLight : Colors.primaryLight }]}><Text style={[pb.projBadgeText, { color: projected >= ffn ? MODULE_COLORS['module-3'].color : Colors.primary }]}>{projected >= ffn ? '\uD83C\uDFAF FI achievable' : `${Math.round((projected / ffn) * 100)}% of FI`}</Text></View>}
        </View>
        {ffn && (<>
          <View style={[pb.projBar, { marginTop: 10 }]}><View style={[pb.projBarFill, { width: `${Math.min(100, Math.round((projected / ffn) * 100))}%`, backgroundColor: projected >= ffn ? MODULE_COLORS['module-3'].color : Colors.primary }]} /></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}><Text style={[pb.tileSubLabel, { color: Colors.textMuted }]}>Current: {Math.round((balance / ffn) * 100)}%</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Text style={[pb.tileSubLabel, { color: Colors.textMuted }]}>FI: </Text><Image source={COIN_ASSET} style={{ width: 10, height: 10 }} /><Text style={[pb.tileSubLabel, { color: Colors.textMuted }]}>{Math.round(ffn).toLocaleString()}</Text></View></View>
        </>)}
        {/* Portfolio vs savings comparison */}
        {(() => {
          const openedMonth = investmentWallets[0]?.openedMonth ?? 1;
          const monthsInvested = Math.max(1, (sim?.currentMonth ?? 1) - openedMonth);
          const totalContributed = monthlyDCA * monthsInvested;
          const savingsValue = Math.round(totalContributed * Math.pow(1 + 0.005 / 12, monthsInvested));
          const extraGained = balance - savingsValue;
          if (extraGained <= 0 || monthsInvested < 2) return null;
          return (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border }}>
              <Text style={pb.tileEyebrow}>VS SAVINGS ACCOUNT</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={[pb.tileSubLabel, { color: MODULE_COLORS['module-3'].color, fontFamily: Fonts.bold, fontSize: 12 }]}>+{Math.round(extraGained).toLocaleString()} more than a savings account</Text></View>
              <Text style={[pb.tileSubLabel, { marginTop: 2 }]}>Investing beat 0.5% p.a. savings over {monthsInvested} months</Text>
            </View>
          );
        })()}
      </View>
    </Pressable>
  );
}

// ─── Monthly snapshot card ───────────────────────────────────────────────────

function MonthlySnapshotCard({ sim }) {
  const budget = sim?.monthlyBudget ?? null;
  const income = sim?.income ?? 0;
  const monthlyDCA = (sim?.wallets ?? []).filter(w => w.type === 'investment').reduce((s, w) => s + (w.monthlyDCA ?? 0), 0) || (sim?.monthlyDCA ?? 0);
  const completedStages = sim?.completedStages ?? [];
  if (!completedStages.includes('stage-3') || !income) return null;
  const needs = budget?.needsAmt ?? 0;
  const savings = budget?.savingsAmt ?? 0;
  const free = Math.max(0, income - needs - savings - monthlyDCA);
  const currentMonth = sim?.currentMonth ?? 1;
  const rows = [
    { label: 'Income', amt: income, color: MODULE_COLORS['module-3'].color, prefix: '+' },
    ...(completedStages.includes('stage-4') && needs > 0 ? [{ label: 'Needs', amt: needs, color: MODULE_COLORS['module-2'].color, prefix: '-' }] : []),
    ...(completedStages.includes('stage-9') && monthlyDCA > 0 ? [{ label: 'Invested (DCA)', amt: monthlyDCA, color: MODULE_COLORS['module-4'].color, prefix: '-' }] : []),
    ...(completedStages.includes('stage-4') && savings > 0 ? [{ label: 'Saved', amt: savings, color: MODULE_COLORS['module-1'].color, prefix: '-' }] : []),
  ];
  return (
    <View style={snap.container}>
      <View style={snap.header}><Text style={snap.eyebrow}>MONTH {currentMonth} SNAPSHOT</Text></View>
      <View style={snap.rows}>
        {rows.map((row, i) => (
          <View key={i} style={snap.row}><Text style={snap.rowLabel}>{row.label}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={[snap.rowAmt, { color: row.color }]}>{row.prefix}{Math.round(row.amt).toLocaleString()}</Text></View></View>
        ))}
        <View style={snap.divider} />
        <View style={snap.row}><Text style={[snap.rowLabel, { fontFamily: Fonts.bold, color: Colors.textPrimary }]}>Free this month</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={[snap.rowAmt, { fontFamily: Fonts.extraBold, fontSize: 16, color: free > 0 ? MODULE_COLORS['module-3'].color : '#FF4444' }]}>{free > 0 ? '+' : ''}{Math.round(free).toLocaleString()}</Text></View></View>
        {income > 0 && <Text style={snap.savingsRateNote}>{Math.round(((savings + monthlyDCA) / income) * 100)}% savings rate this month</Text>}
      </View>
    </View>
  );
}

// ─── Accounts bento grid ─────────────────────────────────────────────────────

function AccountsBento({ wallets, sim, onPress }) {
  if (!wallets || wallets.length === 0) return null;
  const nonInvestment = wallets.filter(w => w.type !== 'investment');
  if (nonInvestment.length === 0) return null;

  const budget = sim?.monthlyBudget ?? null;
  const income = sim?.income ?? 0;
  const history = sim?.history ?? [];
  const ACCOUNT_PALETTE = [
    MODULE_COLORS['module-2'].color,   // 0 — orange (cash)
    MODULE_COLORS['module-4'].color,   // 1 — purple (bank)
    MODULE_COLORS['module-1'].color,   // 2 — teal (EF)
    '#E63946',                         // 3 — red (extra)
    '#457B9D',                         // 4 — steel blue
    '#F4A261',                         // 5 — warm amber (savings goals)
  ];
  const getWalletColour = (w, used) => {
    const pref = { cash: 0, bank: 1, emergency: 2, 'savings-goal': 5 };
    const p = pref[w.type] ?? -1;
    if (p >= 0 && !used.has(p)) { used.add(p); return p; }
    for (let i = 0; i < ACCOUNT_PALETTE.length; i++) { if (!used.has(i)) { used.add(i); return i; } }
    return 0;
  };
  const usedColours = new Set();
  const walletWithColour = nonInvestment.map(w => {
    const idx = getWalletColour(w, usedColours);
    return { ...w, assignedColor: ACCOUNT_PALETTE[idx] };
  });
  const totalBalance = nonInvestment.reduce((s, w) => s + (w.balance ?? 0), 0);
  const goalWallets = walletWithColour.filter(w => w.type === 'savings-goal' || w.type === 'emergency');
  const monthlyNeeds = budget?.needsAmt ?? 0;
  const totalInterest = history.slice(-12).reduce((sum, h) => sum + (h.interestEarned ?? 0), 0);
  const interestHistory = (() => { const recent = history.slice(-5); if (recent.length < 2) return null; return recent.map(h => h.interestEarned ?? 0); })();
  const renderInterestBars = (data, width, height) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data, 1); const gap = 3; const barWidth = (width - gap * (data.length - 1)) / data.length;
    return <View style={{ width, height, flexDirection: 'row', alignItems: 'flex-end' }}>{data.map((val, i) => <View key={i} style={{ width: barWidth, height: Math.max(3, (val / max) * height), borderRadius: 2, backgroundColor: MODULE_COLORS['module-4'].color, opacity: i === data.length - 1 ? 1 : 0.3 + (i / (data.length - 1)) * 0.5, marginRight: i < data.length - 1 ? gap : 0 }} />)}</View>;
  };

  const renderGoalTile = (w, fullWidth) => {
    const isEF = w.type === 'emergency';
    const target = w.target ?? 0;
    const bal = w.balance ?? 0;
    const pct = target > 0 ? Math.min(100, Math.round((bal / target) * 100)) : null;
    const monthsCovered = isEF && monthlyNeeds > 0 ? Math.round((bal / monthlyNeeds) * 10) / 10 : null;
    const targetMonths = isEF && monthlyNeeds > 0 && target > 0 ? Math.round(target / monthlyNeeds) : null;

    // Emergency fund — balance hero + bar, no ring
    if (isEF) {
      return (
        <View key={w.id} style={[ab.tile, fullWidth ? ab.tileFull : { flex: 1 }]}>
          <Text style={ab.eyebrow}>EMERGENCY FUND</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, marginBottom: 4 }}><Image source={COIN_ASSET} style={{ width: 16, height: 16 }} /><Text style={[ab.goalHero, { color: Colors.textPrimary, fontSize: 22 }]}>{Math.round(bal).toLocaleString()}</Text></View>
          {monthsCovered != null && <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: w.assignedColor, marginBottom: 8 }}>{monthsCovered} months covered</Text>}
          {pct != null && (<>
            <View style={ab.goalBarTrack}><View style={[ab.goalBarFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? MODULE_COLORS['module-3'].color : w.assignedColor }]} />{targetMonths && targetMonths >= 2 && Array.from({ length: targetMonths - 1 }).map((_, i) => <View key={i} style={[ab.goalMarker, { left: `${((i + 1) / targetMonths) * 100}%` }]} />)}</View>
            <Text style={[ab.efPctLabel, { color: Colors.textMuted }]}>{pct}%{targetMonths ? ` of ${targetMonths} month target` : ' funded'}</Text>
          </>)}
          <View style={ab.goalFooter}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Text style={ab.goalFooterOf}>target</Text><Image source={COIN_ASSET} style={{ width: 10, height: 10 }} /><Text style={[ab.goalFooterOf, { color: Colors.textPrimary }]}>{Math.round(target).toLocaleString()}</Text></View>{targetMonths && <Text style={ab.goalFooterMeta}>{targetMonths} months</Text>}</View>
        </View>
      );
    }

    // Savings goal — centred ring with text below
    return (
      <View key={w.id} style={[ab.tile, fullWidth ? { width: '100%' } : { flex: 1 }]}>
        <Text style={ab.eyebrow}>{(w.label ?? 'SAVINGS GOAL').toUpperCase()}</Text>
        {pct != null ? (
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            {(() => { const RING = 80, RC = RING / 2, RR = RING * 0.38, circ = 2 * Math.PI * RR, off = circ * (1 - pct / 100); return (
              <View style={{ width: RING, height: RING }}>
                <Svg width={RING} height={RING}>
                  <Path d={`M ${RC} ${RC} m -${RR} 0 a ${RR} ${RR} 0 1 0 ${RR * 2} 0 a ${RR} ${RR} 0 1 0 -${RR * 2} 0`} fill="none" stroke={Colors.border} strokeWidth={6} />
                  <Path d={`M ${RC} ${RC - RR}`} fill="none" stroke={w.assignedColor} strokeWidth={6} strokeDasharray={`${circ}`} strokeDashoffset={off} strokeLinecap="round" transform={`rotate(-90, ${RC}, ${RC})`} />
                </Svg>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}><Text style={[ab.ringPct, { color: w.assignedColor, fontSize: 16 }]}>{pct}%</Text></View>
              </View>
            ); })()}
          </View>
        ) : null}
        <View style={{ alignItems: 'center', gap: 4, marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Image source={COIN_ASSET} style={{ width: 13, height: 13 }} />
            <Text style={[ab.goalHero, { color: Colors.textPrimary, fontSize: 16 }]}>{Math.round(bal).toLocaleString()}</Text>
            {target > 0 && <><Text style={[ab.goalFooterOf, { fontSize: 14 }]}> / </Text><Image source={COIN_ASSET} style={{ width: 11, height: 11 }} /><Text style={ab.goalFooterOf}>{Math.round(target).toLocaleString()}</Text></>}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [ab.container, pressed && ab.containerPressed]}
      onPress={onPress}
    >
      {/* Tile 1: Total balance + donut */}
      <View style={ab.tile}>
        <Text style={ab.eyebrow}>TOTAL BALANCE</Text>
        <View style={ab.balanceRow}><Image source={COIN_ASSET} style={{ width: 20, height: 20 }} /><Text style={ab.balanceHero}>{Math.round(totalBalance).toLocaleString()}</Text><Text style={ab.balanceCount}>{nonInvestment.length} account{nonInvestment.length !== 1 ? 's' : ''}</Text></View>

        {/* Composition bar */}
        {totalBalance > 0 && (
          <View style={ab.compBar}>
            {walletWithColour.map((w, i) => {
              const pct = Math.max(2, Math.round(((w.balance ?? 0) / totalBalance) * 100));
              if ((w.balance ?? 0) <= 0) return null;
              return <View key={w.id} style={{ width: `${pct}%`, height: 10, backgroundColor: w.assignedColor, borderRightWidth: i < walletWithColour.length - 1 ? 1.5 : 0, borderRightColor: Colors.white }} />;
            })}
          </View>
        )}
        {/* Legend rows */}
        <View style={ab.pieLegend}>
          {walletWithColour.map(w => <View key={w.id} style={ab.pieLegendRow}><View style={[ab.pieLegendDot, { backgroundColor: w.assignedColor }]} /><Text style={ab.pieLegendName} numberOfLines={1}>{w.label}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 11, height: 11 }} /><Text style={ab.pieLegendAmt}>{Math.round(w.balance ?? 0).toLocaleString()}</Text></View></View>)}
        </View>
      </View>

      {/* Goal wallets — side by side if 2+, full width if 1 */}
      {goalWallets.length === 1 ? renderGoalTile(goalWallets[0], true) : goalWallets.length >= 2 ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>{goalWallets.map(w => renderGoalTile(w, false))}</View>
      ) : null}

      {/* Budget card */}
      {budget && income > 0 && (
        <View style={ab.tile}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={ab.eyebrow}>MONTHLY BUDGET</Text>
            {(() => { const free = income - (budget.needsAmt ?? 0) - (budget.savingsAmt ?? 0) - (sim?.monthlyDCA ?? 0); return free > 0 ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 10, height: 10 }} /><Text style={[ab.statSub, { color: MODULE_COLORS['module-3'].color, fontFamily: Fonts.bold }]}>+{Math.round(free).toLocaleString()} free</Text></View> : null; })()}
          </View>
          <View style={{ gap: 10 }}>
            {[
              { label: 'Needs', amt: budget.needsAmt ?? 0, color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight },
              { label: 'Wants', amt: budget.wantsAmt ?? 0, color: Colors.primary, colorLight: Colors.primaryLight },
              { label: 'Savings', amt: budget.savingsAmt ?? 0, color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight },
            ].map((row, i) => {
              const pct = income > 0 ? Math.round((row.amt / income) * 100) : 0;
              return <View key={i} style={ab.budgetRow}><Text style={ab.budgetLabel}>{row.label}</Text><View style={ab.budgetBarWrap}><View style={[ab.budgetBarTrack, { backgroundColor: row.colorLight }]}><View style={[ab.budgetBarFill, { width: `${pct}%`, backgroundColor: row.color }]} /></View><Text style={[ab.budgetPct, { color: row.color }]}>{pct}%</Text></View><View style={ab.budgetAmtWrap}><Image source={COIN_ASSET} style={{ width: 11, height: 11 }} /><Text style={[ab.budgetAmt, { color: Colors.textPrimary }]}>{Math.round(row.amt).toLocaleString()}</Text></View></View>;
            })}
          </View>
        </View>
      )}

      {/* Bottom stat row: Interest | Savings rate */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[ab.tile, { flex: 1 }]}>
          <Text style={ab.eyebrow}>INTEREST EARNED</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 }}><Image source={COIN_ASSET} style={{ width: 13, height: 13 }} /><Text style={[ab.statHero, { color: MODULE_COLORS['module-3'].color }]}>+{Math.round(totalInterest).toLocaleString()}</Text></View>
          <Text style={ab.statSub}>last 12 months</Text>
          {interestHistory && <View style={{ marginTop: 8 }}>{renderInterestBars(interestHistory, 80, 28)}</View>}
        </View>
        {income > 0 && (
          <View style={[ab.tile, { flex: 1 }]}>
            {(() => {
              const savingsRate = Math.round((((budget?.savingsAmt ?? 0) + (sim?.monthlyDCA ?? 0)) / income) * 100);
              const rateColor = savingsRate >= 20 ? MODULE_COLORS['module-3'].color : savingsRate >= 10 ? '#F4A261' : '#E63946';
              return <><Text style={ab.eyebrow}>SAVINGS RATE</Text><Text style={[ab.statHero, { color: rateColor, marginTop: 6, fontSize: 26 }]}>{savingsRate}%</Text><Text style={ab.statSub}>of income saved</Text><Text style={[ab.statSub, { marginTop: 4, color: rateColor }]}>{savingsRate >= 20 ? '\u2713 On track' : savingsRate >= 10 ? 'Could be higher' : 'Needs work'}</Text></>;
            })()}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ═════════════════════════════════════════════════════════════════════════════

const WALKTHROUGH_SLIDES = [
  { emoji: '\uD83C\uDFD9\uFE0F', title: 'Welcome to FinCity', subtitle: 'Your financial life, simulated.', body: "FinCity is a sandbox where you make real financial decisions with your FinCoins. No real money \u2014 but real consequences. Every choice you make here teaches you something that applies to your actual finances." },
  { emoji: '\uD83E\uDE99', title: 'Your FinCoins are real', subtitle: 'Earned in AmpliFI. Spent here.', body: "Every FinCoin you've earned through learning lives in FinCity. When you save, your balance actually grows with interest. When you invest, real return rates apply. The maths is real \u2014 only the stakes aren't." },
  { emoji: '\uD83D\uDEE0\uFE0F', title: 'A full financial toolkit', subtitle: 'Everything a real financial life needs.', bullets: [{ icon: '\uD83C\uDFE6', text: 'Open and close bank accounts \u2014 Basic or HYSA' }, { icon: '\uD83D\uDCC8', text: 'Build an investment portfolio across 7 asset classes' }, { icon: '\u2696\uFE0F', text: 'Rebalance your portfolio as markets shift' }, { icon: '\uD83C\uDFAF', text: 'Set savings goals and track them to completion' }, { icon: '\uD83D\uDEE1\uFE0F', text: 'Build an emergency fund that covers months of expenses' }, { icon: '\uD83D\uDCCA', text: 'See projections of your wealth 10, 20, 30 years out' }, { icon: '\uD83D\uDCBC', text: 'Request promotions and grow your income over time' }] },
  { emoji: '\uD83D\uDDFA\uFE0F', title: 'Quests unlock the tools', subtitle: 'Learn first. Then do freely.', body: 'Main quests walk you through each tool one at a time \u2014 bank accounts, budgets, investments, rebalancing. Side quests go deeper on advanced topics. Complete all 17 quests and every tool is yours to use however you want, forever.', highlight: { text: 'The goal: reach your Financial Independence Number \uD83C\uDFAF', color: Colors.primary } },
  { emoji: '\u23ED', title: 'You control time', subtitle: 'Advance months. Watch money grow.', body: 'Tap the advance button to move forward one month \u2014 salary arrives, interest compounds, investments grow. Hold skip to jump months or years at once. The further you go, the more powerful compounding becomes.' },
  { emoji: '\uD83D\uDC1F', title: 'Fin is your guide', subtitle: 'Always in the bottom right.', body: 'Fin knows where you are in your journey and what to do next. Tap the fish button anytime for guidance, your next step, or a financial reality check. Finish the quests \u2014 then use every tool in FinCity to build toward financial independence your way.', highlight: { text: 'Your FI Number is the finish line. Everything in FinCity helps you get there.', color: MODULE_COLORS['module-3'].color }, isFinal: true },
];

function SectionDivider({ label }) {
  return (
    <View style={sd.container}>
      <View style={sd.line} />
      <Text style={sd.label}>{label}</Text>
      <View style={sd.line} />
    </View>
  );
}

const sd = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 16, gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  label: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.5, color: Colors.textMuted },
});

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
  const [showJobOfferGate, setShowJobOfferGate] = useState(false);
  const [gateMessage, setGateMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAdvError, setShowAdvError] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonName, setComingSoonName] = useState('');
  const [showJobOffer, setShowJobOffer] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [customSalaryText, setCustomSalaryText] = useState('');
  const [customSalaryError, setCustomSalaryError] = useState('');
  const [jobOfferStep, setJobOfferStep] = useState(1);
  const [completedGoalQueue, setCompletedGoalQueue] = useState([]);
  const [showGoalComplete, setShowGoalComplete] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [goalCompleteConfetti, setGoalCompleteConfetti] = useState(false);
  const [closingGoal, setClosingGoal] = useState(false);
  const [pendingLifeEvent, setPendingLifeEvent] = useState(null);
  const [lifeEventAllocations, setLifeEventAllocations] = useState({});
  const [lifeEventError, setLifeEventError] = useState('');
  const [lifeEventApplying, setLifeEventApplying] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioSim, setPortfolioSim] = useState(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showFFPicker, setShowFFPicker] = useState(false);
  const [ffMonths, setFfMonths] = useState(1);
  const [skipping, setSkipping] = useState(false);
  const [skipSummary, setSkipSummary] = useState(null);
  const [showSkipSummary, setShowSkipSummary] = useState(false);
  const [showSavingsGoalFlow, setShowSavingsGoalFlow] = useState(null);
  const [showEFFlow, setShowEFFlow] = useState(null);
  const [bankInitialTab, setBankInitialTab] = useState('Accounts');
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughSlide, setWalkthroughSlide] = useState(0);
  const walkthroughChecked = useRef(false);

  const questCardPulse = useRef(new Animated.Value(1)).current;
  const skipAnimValue = useRef(new Animated.Value(0)).current;
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

  const pulseQuestCard = () => {
    questCardPulse.setValue(1);
    Animated.sequence([
      Animated.timing(questCardPulse, { toValue: 1.04, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(questCardPulse, { toValue: 0.97, duration: 200, useNativeDriver: true }),
      Animated.timing(questCardPulse, { toValue: 1.02, duration: 200, useNativeDriver: true }),
      Animated.timing(questCardPulse, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

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

  useEffect(() => {
    if (!insideCity) {
      // Reset check when user leaves dashboard (returns to entry screen)
      walkthroughChecked.current = false;
      return;
    }

    // insideCity just became true — check if walkthrough needed
    if (walkthroughChecked.current) return;
    walkthroughChecked.current = true;

    AsyncStorage.getItem('fincity_walkthrough_seen').then(seen => {
      if (!seen) {
        setTimeout(() => setShowWalkthrough(true), 500);
      }
    });
  }, [insideCity]);

  const handleFinTap = () => {
    if (!insideCity) { setEntryBubbleVisible(true); entryBubbleOpacity.setValue(0); Animated.timing(entryBubbleOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start(); setTimeout(() => { Animated.timing(entryBubbleOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setEntryBubbleVisible(false)); }, 3000); }
    else {
      setFinHasUpdate(false);
      const cs = sim?.completedStages ?? [];
      const latest = cs[cs.length - 1] ?? null;
      if (latest) AsyncStorage.setItem('fin_last_seen_stage', latest);
      setFinVisible(false);
      showFin();
    }
  };

  const tryOpenQuest = (questId) => {
    // Gate: quest-3 (first paycheck) requires job offer accepted
    if (questId === 'quest-3' && !sim?.income) {
      setShowJobOfferGate(true);
      return;
    }
    setActiveQuest(questId);
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
  const applyLifeEventDeduction = async (allocations) => {
    setLifeEventApplying(true);
    setLifeEventError('');
    try {
      const updatedWallets = (sim?.wallets ?? []).map(w => {
        const deduction = allocations[w.id] ?? 0;
        if (deduction > 0) return { ...w, balance: Math.max(0, (w.balance ?? 0) - deduction) };
        return w;
      });
      await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), { wallets: updatedWallets, updatedAt: Date.now() });
      await refreshAll();
      setPendingLifeEvent(null);
      setLifeEventAllocations({});
      setLifeEventApplying(false);
      if (completedGoalQueue.length > 0) {
        const [next, ...rest] = completedGoalQueue;
        setCurrentGoal(next);
        setCompletedGoalQueue(rest);
        setGoalCompleteConfetti(true);
        setShowGoalComplete(true);
      }
    } catch (e) {
      console.error('applyLifeEventDeduction error:', e);
      setLifeEventError('Something went wrong. Please try again.');
      setLifeEventApplying(false);
    }
  };

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
      // Queue negative life event for after summary dismissal
      if (result.lifeEvent && !result.lifeEvent.isPositive) {
        setPendingLifeEvent(result.lifeEvent);
      }
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

  const doSkip = async (months) => {
    if (skipping || advancing) return;
    setSkipping(true);
    skipAnimValue.setValue(0);
    Animated.timing(skipAnimValue, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
    try {
      const result = await advanceMultipleMonths(uid, months);
      await refreshAll();
      setSkipSummary({
        months,
        totalSalary: result.totalSalary ?? 0,
        totalNeeds: result.totalNeeds ?? 0,
        totalInterest: result.totalInterest ?? 0,
        totalDCA: result.totalDCA ?? 0,
        totalReturns: result.totalReturns ?? 0,
        newMonth: result.finalMonth ?? (simMonthRaw + months),
        stoppedEarly: result.stoppedEarly ?? false,
        stoppedAt: result.stoppedAt ?? null,
        milestones: result.milestones ?? [],
        finalEFPct: result.finalEFPct,
        finalSGPct: result.finalSGPct,
        finalEFBalance: result.finalEFBalance,
        finalSGBalance: result.finalSGBalance,
        finalEFTarget: result.finalEFTarget,
        finalSGTarget: result.finalSGTarget,
        finalSGLabel: result.finalSGLabel,
      });
      if (result.completedGoals?.length > 0) setCompletedGoalQueue(result.completedGoals);
      setSkipping(false);
      setTimeout(() => setShowSkipSummary(true), 300);
    } catch (e) {
      console.error('doSkip error:', e);
      setSkipping(false);
      setShowAdvError(true);
    }
  };

  const goToSlide = (nextIdx) => {
    setWalkthroughSlide(nextIdx);
  };

  const finishWalkthrough = async () => {
    await AsyncStorage.setItem('fincity_walkthrough_seen', 'true');
    setShowWalkthrough(false);
    setWalkthroughSlide(0);
    setFinHasUpdate(true);
    setTimeout(() => showFin(), 800);
  };

  const closeAdvanceConfirm = () => {
    Animated.timing(advanceConfirmAnim, { toValue: SH, duration: 250, useNativeDriver: true }).start(() => setShowAdvanceConfirm(false));
  };

  const closeMonthlySummary = () => {
    Animated.timing(summarySheetAnim, { toValue: SH, duration: 250, useNativeDriver: true }).start(() => {
      setShowMonthlySummary(false);
      setMonthSummary(null);

      // Show life event choice if pending
      if (pendingLifeEvent && !pendingLifeEvent.isPositive) {
        const efW = (sim?.wallets ?? []).find(w => w.type === 'emergency');
        const bankW = (sim?.wallets ?? []).find(w => w.type === 'bank');
        const initAllocs = {};
        if (efW && (efW.balance ?? 0) > 0) {
          const efContrib = Math.min(efW.balance ?? 0, pendingLifeEvent.amount);
          initAllocs[efW.id] = efContrib;
          const remaining = pendingLifeEvent.amount - efContrib;
          if (remaining > 0 && bankW) {
            initAllocs[bankW.id] = Math.min(bankW.balance ?? 0, remaining);
          }
        } else if (bankW) {
          initAllocs[bankW.id] = Math.min(bankW.balance ?? 0, pendingLifeEvent.amount);
        }
        setLifeEventAllocations(initAllocs);
        return;
      }

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
  const doReset = async () => { setShowResetConfirm(false); await resetSimProgress(uid); await AsyncStorage.removeItem('fincity_walkthrough_seen'); await AsyncStorage.removeItem('savings_flow_done'); await AsyncStorage.removeItem('ef_flow_done'); walkthroughChecked.current = false; setSim(null); setInsideCity(false); };

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

      {/* Floating icon column */}
      <View style={[s.floatingColumn, { bottom: insets.bottom + 16 }, finOverlayVisible && { opacity: 0, pointerEvents: 'none' }]}>
        <TouchableOpacity style={[s.floatingBtn, { backgroundColor: MODULE_COLORS['module-2'].colorLight, borderColor: MODULE_COLORS['module-2'].color }]} onPress={() => { setBankInitialTab('Accounts'); setShowBankModal(true); dismissBankNotif(); }} activeOpacity={0.85}>
          {bankNotif && <View style={s.floatingNotifDot} />}
          <Text style={{ fontSize: 24 }}>{'\uD83C\uDFE6'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.floatingBtn, { backgroundColor: completedStages.includes('stage-9') ? MODULE_COLORS['module-4'].colorLight : Colors.white, borderColor: completedStages.includes('stage-9') ? MODULE_COLORS['module-4'].color : Colors.border }]} onPress={() => { if (completedStages.includes('stage-9')) { setShowPortfolioModal(true); } else { const nq = QUEST_MAP.find(q => !completedStages.includes(q.stageId)); setGateMessage(nq ? `Complete Quest ${nq.id} \u2014 ${nq.name} first to unlock your portfolio.` : 'Complete the investing quests to unlock your portfolio.'); setShowGateModal(true); } }} activeOpacity={0.85}>
          <Text style={{ fontSize: 24 }}>{'\uD83D\uDCC8'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.floatingBtn, { backgroundColor: MODULE_COLORS['module-1'].colorLight, borderColor: finHasUpdate ? '#FF3B30' : MODULE_COLORS['module-1'].color }]} onPress={handleFinTap} activeOpacity={0.85}>
          {finHasUpdate && <View style={s.floatingNotifDot} />}
          <Animated.View style={{ transform: [{ scale: finPulse }] }}><Text style={{ fontSize: 24 }}>{FIN.emoji}</Text></Animated.View>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
        {/* Full-bleed date header */}
        <View style={s.dateHeader}>
          <Text style={s.dateHeaderYear}>YEAR {simYear}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={s.dateHeaderMonth}>{monthName}</Text>
            <TouchableOpacity
              style={[s.ffBtn, (!unlocks.monthAdvance || advancing || skipping) && { opacity: 0.35 }]}
              onPress={() => {
                if (!unlocks.monthAdvance) {
                  setGateMessage("Open a bank account first \u2014 your salary needs somewhere to land.");
                  setShowGateModal(true);
                  return;
                }
                setShowFFPicker(true);
              }}
              disabled={advancing || skipping}
              activeOpacity={0.85}
            >
              {advancing || skipping
                ? <ActivityIndicator size="small" color={Colors.textPrimary} />
                : <Svg width={22} height={22} viewBox="0 0 24 24" fill={Colors.textPrimary}><Path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" /></Svg>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Net Worth Card */}
        <View style={s.nwCard}>
          {/* Top row: label + delta + history */}
          <View style={s.nwTopRow}>
            <Text style={s.nwLabel}>NET WORTH</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {nwDelta !== 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={[s.nwChange, {
                    color: nwDelta > 0
                      ? MODULE_COLORS['module-3'].color
                      : Colors.danger
                  }]}>
                    {nwDelta > 0 ? '↑' : '↓'}
                  </Text>
                  <Image source={COIN_ASSET} style={{ width: 11, height: 11 }} />
                  <Text style={[s.nwChange, {
                    color: nwDelta > 0
                      ? MODULE_COLORS['module-3'].color
                      : Colors.danger
                  }]}>
                    {formatCoins(Math.abs(nwDelta))} this month
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleChipPress('history')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={{ fontSize: 16 }}>📜</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero number */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 16 }}>
            <Image source={COIN_ASSET} style={{ width: 22, height: 22 }} />
            <Text style={s.nwHero}>{Math.round(netWorth).toLocaleString()}</Text>
          </View>

          {/* Composition rows */}
          {(() => {
            const bankAndSavings = wallets
              .filter(w => w.type !== 'investment')
              .reduce((sum, w) => sum + (w.balance ?? 0), 0);
            const investedTotal = wallets
              .filter(w => w.type === 'investment')
              .reduce((sum, w) => sum + (w.balance ?? 0), 0);
            const total = netWorth || 1;
            const bankPct = Math.round((bankAndSavings / total) * 100);
            const investPct = Math.round((investedTotal / total) * 100);

            const rows = [
              {
                label: 'Bank & savings',
                amount: bankAndSavings,
                pct: bankPct,
                color: MODULE_COLORS['module-2'].color,
                colorLight: MODULE_COLORS['module-2'].colorLight,
                show: bankAndSavings > 0,
              },
              {
                label: 'Invested',
                amount: investedTotal,
                pct: investPct,
                color: MODULE_COLORS['module-4'].color,
                colorLight: MODULE_COLORS['module-4'].colorLight,
                show: completedStages.includes('stage-9'),
              },
            ];

            const visibleRows = rows.filter(r => r.show);
            if (visibleRows.length === 0) return null;

            return (
              <View style={s.nwCompositionRows}>
                {visibleRows.map((row, i) => (
                  <View key={i} style={s.nwCompositionRow}>
                    {/* Label + amount */}
                    <View style={s.nwCompositionLeft}>
                      <View style={[s.nwCompositionDot, { backgroundColor: row.color }]} />
                      <Text style={s.nwCompositionLabel}>{row.label}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginRight: 8 }}>
                      <Image source={COIN_ASSET} style={{ width: 11, height: 11 }} />
                      <Text style={s.nwCompositionAmt}>
                        {Math.round(row.amount).toLocaleString()}
                      </Text>
                    </View>
                    {/* Bar */}
                    <View style={[s.nwCompositionBarTrack, { backgroundColor: row.colorLight }]}>
                      <View style={[s.nwCompositionBarFill, {
                        width: `${row.pct}%`,
                        backgroundColor: row.color,
                      }]} />
                    </View>
                    {/* Pct */}
                    <Text style={[s.nwCompositionPct, { color: row.color }]}>
                      {row.pct}%
                    </Text>
                  </View>
                ))}
              </View>
            );
          })()}

          {/* Divider */}
          {ffn && <View style={[s.summaryDivider, { marginVertical: 12 }]} />}

          {/* FI progress */}
          {ffn ? (
            <View>
              <View style={s.nwBarWrap}>
                <View style={s.nwBarTrack}>
                  <View style={[s.nwBarFill, {
                    width: `${Math.min(100, Math.round(fiPct * 100))}%`,
                    backgroundColor: fiPct >= 1
                      ? MODULE_COLORS['module-3'].color
                      : Colors.primary,
                    zIndex: 1,
                  }]} />
                  {[25, 50, 75].map(p => (
                    <View key={p} style={[s.nwMilestone, { left: `${p}%` }]} />
                  ))}
                </View>
                <View style={s.nwBarFooter}>
                  <Text style={s.nwBarLabel}>
                    {Math.round(fiPct * 100)}% invested toward FI
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Image source={COIN_ASSET} style={{ width: 11, height: 11 }} />
                    <Text style={s.nwBarTarget}>
                      {Math.round(invested).toLocaleString()} of {Math.round(ffn).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
              {netWorth > invested * 2 && invested > 0 && (
                <Text style={[s.nwNoFI, { marginTop: 6, fontStyle: 'italic' }]}>
                  {formatCoins(Math.round(netWorth - invested))} sitting uninvested in accounts
                </Text>
              )}
            </View>
          ) : (
            <Text style={s.nwNoFI}>Complete Quest 1 to set your FI target</Text>
          )}
        </View>


        {/* Quest card */}
        {sim && (() => {
          const cq = QUEST_MAP.find(q => !completedStages.includes(q.stageId));
          if (!cq) return null;
          return (
            <Animated.View style={{ transform: [{ scale: questCardPulse }] }}>
              <Pressable style={({ pressed }) => [s.questCard, pressed && { opacity: 0.92 }]} onPress={() => { const qid = STAGE_TO_QUEST[cq.stageId]; if (qid) tryOpenQuest(qid); }}>
                <View style={s.questCardInner}>
                  <View style={[s.questCardIcon, { backgroundColor: Colors.primaryLight }]}><Text style={{ fontSize: 20 }}>{QC_ICONS[cq.id] ?? '\uD83C\uDFAF'}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.questCardMeta}>Quest {cq.id} {'\u00B7'} Chapter {cq.chapter}</Text>
                    <Text style={s.questCardTitle} numberOfLines={1}>{cq.name}</Text>
                    <Text style={s.questCardDesc} numberOfLines={2}>{QC_DESCS[cq.id] ?? ''}</Text>
                  </View>
                  <Text style={s.questCardChevron}>{'\u203A'}</Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })()}

        {/* ACCOUNTS section */}
        {wallets.filter(w => w.type !== 'investment').length > 0 && (
          <>
            <SectionDivider label="YOUR ACCOUNTS" />
            <AccountsBento wallets={wallets} sim={sim} onPress={() => { setBankInitialTab('Accounts'); setShowBankModal(true); dismissBankNotif(); }} />
          </>
        )}

        {/* Monthly snapshot */}
        <MonthlySnapshotCard sim={sim} />

        {/* PORTFOLIO section — only if unlocked */}
        {wallets.some(w => w.type === 'investment') && completedStages.includes('stage-9') ? (
          <>
            <SectionDivider label="YOUR PORTFOLIO" />
            <PortfolioBento wallets={wallets} sim={sim} onPress={() => setShowPortfolioModal(true)} />
          </>
        ) : null}
      </ScrollView>

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
                        onPress={() => { if (!isComplete) { const qid = STAGE_TO_QUEST[quest.stageId]; if (qid) { closeDrawer(); setTimeout(() => tryOpenQuest(qid), 300); } } }}
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
              {/* Job offer available — special CTA */}
              {completedStages.includes('stage-2') && !completedStages.includes('stage-3') && !sim?.income ? (
                <TouchableOpacity
                  style={s.finOverlayBtn}
                  activeOpacity={0.88}
                  onPress={() => {
                    handleFinModalClose();
                    setTimeout(() => {
                      setShowJobOffer(true);
                      setJobOfferStep(1);
                      setSelectedSalary(null);
                      setCustomSalaryText('');
                      setCustomSalaryError('');
                    }, 300);
                  }}
                >
                  <Text style={s.finOverlayBtnText}>See the job offer {'\u2192'}</Text>
                </TouchableOpacity>
              ) : nextQuestId ? (
                <>
                  {/* Fast forward CTA — after emergency fund, before compounding */}
                  {completedStages.includes('stage-6') && !completedStages.includes('stage-7') && (
                    <TouchableOpacity
                      style={s.finOverlayBtnSecondary}
                      activeOpacity={0.85}
                      onPress={() => { handleFinModalClose(); setTimeout(() => doSkip(6), 300); }}
                    >
                      <Text style={s.finOverlayBtnSecondaryText}>{'\u23E9'} Fast forward 6 months</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={s.finOverlayBtn}
                    activeOpacity={0.88}
                    onPress={() => { handleFinModalClose(); setTimeout(() => tryOpenQuest(nextQuestId), 300); }}
                  >
                    <Text style={s.finOverlayBtnText}>Next step {'\u2192'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={s.finOverlayCaughtUp}>You're all caught up.</Text>
              )}
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
        initialTab={bankInitialTab}
        onClose={() => {
          setShowBankModal(false);
          setBankInitialTab('Accounts');
          setTimeout(async () => {
            const fresh = await loadSimProgress(uid);
            if (fresh) setSim(fresh);
            const sgDone = await AsyncStorage.getItem('savings_flow_done');
            const efDone = await AsyncStorage.getItem('ef_flow_done');
            const sgWallet = (fresh?.wallets ?? []).find(w => w.type === 'savings-goal');
            const efWallet = (fresh?.wallets ?? []).find(w => w.type === 'emergency');

            if (!sgDone && showSavingsGoalFlow === null && (fresh?.completedStages ?? []).includes('stage-5') && !(fresh?.completedStages ?? []).includes('stage-6')) {
              const hasAuto = (sgWallet?.monthlyContribution ?? 0) > 0;
              const hasBalance = (sgWallet?.balance ?? 0) > 0;
              if (hasAuto) {
                setShowSavingsGoalFlow('fastforward');
              } else if (hasBalance) {
                setShowSavingsGoalFlow('automate');
              }
            }

            if (!efDone && showEFFlow === null && (fresh?.completedStages ?? []).includes('stage-6')) {
              const hasAuto = (efWallet?.monthlyContribution ?? 0) > 0;
              const hasBalance = (efWallet?.balance ?? 0) > 0;
              if (hasAuto) {
                setShowEFFlow('fastforward');
              } else if (hasBalance) {
                setShowEFFlow('automate');
              }
            }
          }, 400);
        }}
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
                  const totalDCA = wallets.filter(w => w.type === 'investment').reduce((s, w) => s + (w.monthlyDCA ?? 0), 0) || (sim?.monthlyDCA ?? 0);
                  if (totalDCA > 0 && completedStages.includes('stage-9')) lines.push({ icon: '\uD83D\uDCC8', label: 'DCA investment', amt: `-${totalDCA.toLocaleString()}`, color: MODULE_COLORS['module-4'].color });
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

      {/* Job offer gate */}
      {showJobOfferGate && (
        <Modal transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowJobOfferGate(false)}>
          <View style={s.gateBackdrop}>
            <View style={s.gateCard}>
              <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>{'\uD83D\uDCBC'}</Text>
              <Text style={s.gateTitle}>You need a job first</Text>
              <Text style={s.gateBody}>Before your first paycheck can land, you need to accept a job offer from Luminary. Fin has one waiting for you.</Text>
              <TouchableOpacity style={s.gateCta} onPress={() => {
                setShowJobOfferGate(false);
                setTimeout(() => {
                  setShowJobOffer(true);
                  setJobOfferStep(1);
                  setSelectedSalary(null);
                  setCustomSalaryText('');
                  setCustomSalaryError('');
                }, 300);
              }} activeOpacity={0.88}>
                <Text style={s.gateCtaText}>See the job offer {'\u2192'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowJobOfferGate(false)} activeOpacity={0.7} style={{ marginTop: 12 }}>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center' }}>Not now</Text>
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
          <View style={s.jobOfferScreen}>
            <SimConfetti />
            <ScrollView contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24, paddingTop: insets.top + 32 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
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
                    {/* Custom salary option */}
                    <TouchableOpacity
                      style={[s.salaryOption, selectedSalary === 'custom' && s.salaryOptionSelected]}
                      onPress={() => setSelectedSalary('custom')}
                      activeOpacity={0.85}
                    >
                      <Text style={{ fontSize: 20 }}>{'\u270F\uFE0F'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.salaryOptTitle}>Enter my own</Text>
                        <Text style={s.salaryOptDesc}>Simulate your real expected salary</Text>
                        {selectedSalary === 'custom' && (
                          <View style={s.customSalaryInputWrap}>
                            <Image source={COIN_ASSET} style={{ width: 14, height: 14 }} />
                            <TextInput
                              style={s.customSalaryInput}
                              value={customSalaryText}
                              onChangeText={text => {
                                setCustomSalaryText(text.replace(/[^0-9]/g, ''));
                                setCustomSalaryError('');
                              }}
                              placeholder="e.g. 4800"
                              placeholderTextColor={Colors.textMuted}
                              keyboardType="numeric"
                              maxLength={6}
                              autoFocus
                            />
                            <Text style={s.customSalaryUnit}>/month</Text>
                          </View>
                        )}
                        {customSalaryError ? (
                          <Text style={s.customSalaryError}>{customSalaryError}</Text>
                        ) : null}
                      </View>
                      {selectedSalary === 'custom' && customSalaryText.length > 0 && (
                        <Text style={{ fontSize: 18, color: Colors.primary }}>{'\u2713'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 64, marginBottom: 8 }}>{'\u270D\uFE0F'}</Text>
                  <Text style={s.jobTitle}>Offer accepted!</Text>
                  <Text style={s.jobSubtitle}>Experience Architect at Luminary</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 16 }}>
                    <Image source={COIN_ASSET} style={{ width: 24, height: 24 }} />
                    <Text style={s.jobSalaryHero}>{typeof selectedSalary === 'number' ? selectedSalary.toLocaleString() : selectedSalary}</Text>
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
            <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
              {jobOfferStep === 1 ? (
                <TouchableOpacity style={[s.jobCta, !selectedSalary && { opacity: 0.5 }]} disabled={!selectedSalary} onPress={() => {
                  if (selectedSalary === 'custom') {
                    const val = parseInt(customSalaryText, 10);
                    if (!val || val < 500) {
                      setCustomSalaryError('Please enter a salary of at least 500');
                      return;
                    }
                    if (val > 100000) {
                      setCustomSalaryError('Maximum salary is 100,000');
                      return;
                    }
                    setSelectedSalary(val);
                  }
                  setJobOfferStep(2);
                }} activeOpacity={0.88}>
                  <Text style={s.jobCtaText}>{"Accept offer \u2192"}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={s.jobCta} onPress={async () => {
                  if (uid && selectedSalary) await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), { income: selectedSalary, incomeStartMonth: sim?.currentMonth ?? 1, incomeLabel: 'Luminary salary', incomeEmoji: '\uD83D\uDCBC', updatedAt: Date.now() });
                  setShowJobOffer(false);
                  setJobOfferStep(1);
                  setSelectedSalary(null);
                  setCustomSalaryText('');
                  setCustomSalaryError('');
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
      <Modal visible={showResetConfirm} transparent animationType="fade"><View style={s.alertBg}><View style={s.alertCard}><Text style={s.alertEmoji}>{'\u26A0\uFE0F'}</Text><Text style={s.alertTitle}>Reset FinCity?</Text><Text style={s.alertBody}>This will wipe all your simulation progress and start fresh. Your FinCoins will reset to {'\uD83E\uDE99'}1,980. Your learning progress is not affected.</Text><View style={s.alertBtns}><TouchableOpacity style={s.alertCancel} onPress={() => setShowResetConfirm(false)}><Text style={s.alertCancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={s.alertConfirm} onPress={doReset}><Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>Reset</Text></TouchableOpacity></View></View></View></Modal>

      {/* Advance error */}
      <Modal visible={showAdvError} transparent animationType="fade"><View style={s.alertBg}><View style={s.alertCard}><Text style={s.alertEmoji}>{'\uD83D\uDE2C'}</Text><Text style={s.alertTitle}>Something went wrong</Text><Text style={s.alertBody}>Could not advance the month. Please try again.</Text><View style={s.alertBtns}><TouchableOpacity style={s.alertConfirm} onPress={() => setShowAdvError(false)}><Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>OK</Text></TouchableOpacity></View></View></View></Modal>

      {/* Coming soon */}
      <Modal visible={showComingSoon} transparent animationType="fade"><View style={s.alertBg}><View style={s.alertCard}><Text style={s.alertEmoji}>{'\uD83D\uDD1C'}</Text><Text style={s.alertTitle}>{comingSoonName || 'Coming soon'}</Text><Text style={s.alertBody}>{comingSoonName === 'New Savings Goal' ? 'Savings goal accounts are coming to the bank in the next update. For now, your Quest 5 savings goal is your primary savings bucket.' : 'This side quest is coming soon. Keep completing main quests to unlock more of FinCity.'}</Text><View style={s.alertBtns}><TouchableOpacity style={s.alertConfirm} onPress={() => setShowComingSoon(false)}><Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>Got it</Text></TouchableOpacity></View></View></View></Modal>

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
              <Text style={s.goalNextBody}>Your savings goal account is closed and <Text style={{ fontFamily: Fonts.bold, color: Colors.textPrimary }}>{Math.round(currentGoal?.target ?? 0).toLocaleString()}</Text> moves back to your bank account automatically.</Text>
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

      {/* Fast forward picker */}
      {showFFPicker && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <View style={s.alertBg}>
            <View style={[s.alertCard, { paddingBottom: 28 }]}>
              <Text style={ff.modalIconText}>▶▶</Text>
              <Text style={s.alertTitle}>Fast forward</Text>
              <Text style={[s.alertBody, { marginBottom: 24 }]}>Choose how far ahead to jump. Salary, interest, and contributions apply automatically each month.</Text>

              {/* Month display */}
              <View style={ff.monthDisplay}>
                <Text style={ff.monthCount}>
                  {ffMonths >= 12 ? ffMonths / 12 : ffMonths}
                </Text>
                <Text style={ff.monthUnit}>
                  {ffMonths >= 12
                    ? (ffMonths / 12 === 1 ? 'year' : 'years')
                    : (ffMonths === 1 ? 'month' : 'months')}
                </Text>
              </View>

              {/* Human readable label */}
              <Text style={ff.monthLabel}>
                {ffMonths === 1
                  ? '→ Next month'
                  : ffMonths < 12
                    ? `→ ${ffMonths} months ahead`
                    : ffMonths === 12
                      ? '→ 1 year ahead'
                      : `→ ${ffMonths / 12} years ahead`}
              </Text>

              {/* Step slider */}
              <View style={ff.sliderWrap}>
                {(() => {
                  const steps = [1, 3, 6, 12, 36, 60, 120];
                  const currentIdx = steps.indexOf(ffMonths) >= 0 ? steps.indexOf(ffMonths) : 0;
                  return (
                    <>
                      <View style={ff.track}>
                        <View style={[ff.trackFill, { width: `${(currentIdx / (steps.length - 1)) * 100}%` }]} />
                      </View>
                      <View style={ff.stepsRow}>
                        {steps.map((step) => (
                          <TouchableOpacity
                            key={step}
                            style={[ff.stepDot, ffMonths === step && ff.stepDotActive]}
                            onPress={() => setFfMonths(step)}
                            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                          >
                            <View style={[ff.stepInner, ffMonths === step && ff.stepInnerActive]} />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={ff.labelsRow}>
                        {steps.map(step => (
                          <TouchableOpacity key={step} onPress={() => setFfMonths(step)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                            <Text style={[ff.stepLabel, ffMonths === step && ff.stepLabelActive]}>
                              {step >= 12 ? `${step / 12}y` : `${step}m`}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  );
                })()}
              </View>

              {/* Action buttons */}
              <View style={s.alertBtns}>
                <TouchableOpacity
                  style={s.alertCancel}
                  onPress={() => { setShowFFPicker(false); setFfMonths(1); }}
                  activeOpacity={0.85}
                >
                  <Text style={s.alertCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.alertConfirm}
                  onPress={async () => {
                    setShowFFPicker(false);
                    if (ffMonths === 1) {
                      handleAdvanceMonth();
                    } else {
                      await doSkip(ffMonths);
                    }
                    setFfMonths(1);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>
                    {ffMonths === 1
                      ? 'Advance month →'
                      : ffMonths < 12
                        ? `Skip ${ffMonths} months →`
                        : ffMonths === 12
                          ? 'Skip 1 year →'
                          : `Skip ${ffMonths / 12} years →`}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>
      )}

      {/* Skipping overlay */}
      {skipping && (
        <Modal transparent animationType="fade" statusBarTranslucent>
          <View style={[s.alertBg, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
            <View style={[s.alertCard, { gap: 16, paddingVertical: 32 }]}>
              <Animated.Text style={{ fontSize: 48, transform: [{ scale: skipAnimValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] }) }] }}>{'\u23E9'}</Animated.Text>
              <Text style={[s.alertTitle, { marginBottom: 0 }]}>Fast forwarding</Text>
              <Text style={{ fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.primary }}>{MONTH_NAMES[(simMonthRaw - 1) % 12]}</Text>
              <View style={{ width: '100%', height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' }}>
                <Animated.View style={{ height: 6, backgroundColor: Colors.primary, borderRadius: 3, width: skipAnimValue.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
              </View>
              <Text style={[s.alertBody, { marginBottom: 0, fontStyle: 'italic' }]}>Applying salary, interest, and contributions...</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Skip summary */}
      {showSkipSummary && skipSummary && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <View style={s.alertBg}>
            <View style={[s.alertCard, { paddingBottom: 28 }]}>
              <Text style={{ fontSize: 36, marginBottom: 4 }}>{'\u2705'}</Text>
              <Text style={s.alertTitle}>{skipSummary.stoppedEarly ? `Skipped to Month ${skipSummary.stoppedAt}` : `${skipSummary.months} months later`}</Text>
              {skipSummary.stoppedEarly && <Text style={[s.alertBody, { color: Colors.primary, marginBottom: 8 }]}>Stopped early {'\u2014'} bank gate reached</Text>}
              <ScrollView style={{ width: '100%', maxHeight: SH * 0.45 }} showsVerticalScrollIndicator={false}>
                {(skipSummary.totalSalary > 0) && <View style={s.skipSummaryRow}><View style={s.skipSummaryRowLeft}><Text style={s.skipSummaryIcon}>{'\uD83D\uDCB0'}</Text><View><Text style={s.skipSummaryLabel}>Salary</Text><Text style={s.skipSummaryBreakdown}>{Math.round(skipSummary.totalSalary / skipSummary.months).toLocaleString()} {'\u00D7'} {skipSummary.months} months</Text></View></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={[s.skipSummaryAmt, { color: MODULE_COLORS['module-3'].color }]}>+{Math.round(skipSummary.totalSalary).toLocaleString()}</Text></View></View>}
                {(skipSummary.totalNeeds > 0) && <View style={s.skipSummaryRow}><View style={s.skipSummaryRowLeft}><Text style={s.skipSummaryIcon}>{'\uD83C\uDFE0'}</Text><View><Text style={s.skipSummaryLabel}>Needs</Text><Text style={s.skipSummaryBreakdown}>{Math.round(skipSummary.totalNeeds / skipSummary.months).toLocaleString()} {'\u00D7'} {skipSummary.months} months</Text></View></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={[s.skipSummaryAmt, { color: Colors.textSecondary }]}>-{Math.round(skipSummary.totalNeeds).toLocaleString()}</Text></View></View>}
                {(skipSummary.totalInterest > 0) && <View style={s.skipSummaryRow}><View style={s.skipSummaryRowLeft}><Text style={s.skipSummaryIcon}>{'\uD83D\uDCC8'}</Text><View><Text style={s.skipSummaryLabel}>Interest earned</Text><Text style={s.skipSummaryBreakdown}>Across all accounts {'\u00B7'} {skipSummary.months} months</Text></View></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={[s.skipSummaryAmt, { color: MODULE_COLORS['module-3'].color }]}>+{Math.round(skipSummary.totalInterest).toLocaleString()}</Text></View></View>}
                {(skipSummary.totalDCA > 0) && <View style={s.skipSummaryRow}><View style={s.skipSummaryRowLeft}><Text style={s.skipSummaryIcon}>{'\uD83D\uDCCA'}</Text><View><Text style={s.skipSummaryLabel}>DCA invested</Text><Text style={s.skipSummaryBreakdown}>{Math.round(skipSummary.totalDCA / skipSummary.months).toLocaleString()} {'\u00D7'} {skipSummary.months} months</Text></View></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={[s.skipSummaryAmt, { color: MODULE_COLORS['module-4'].color }]}>-{Math.round(skipSummary.totalDCA).toLocaleString()}</Text></View></View>}
                {(skipSummary.totalReturns > 0) && <View style={s.skipSummaryRow}><View style={s.skipSummaryRowLeft}><Text style={s.skipSummaryIcon}>{'\uD83D\uDCB9'}</Text><View><Text style={s.skipSummaryLabel}>Investment returns</Text><Text style={s.skipSummaryBreakdown}>Portfolio growth {'\u00B7'} {skipSummary.months} months</Text></View></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 12, height: 12 }} /><Text style={[s.skipSummaryAmt, { color: MODULE_COLORS['module-3'].color }]}>+{Math.round(skipSummary.totalReturns).toLocaleString()}</Text></View></View>}
                <View style={s.summaryDivider} />
                <View style={[s.skipSummaryRow, { borderBottomWidth: 0 }]}><View style={s.skipSummaryRowLeft}><Text style={s.skipSummaryIcon}>{'\uD83D\uDC8E'}</Text><Text style={[s.skipSummaryLabel, { fontFamily: Fonts.bold }]}>Net change</Text></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN_ASSET} style={{ width: 14, height: 14 }} />{(() => { const net = Math.round((skipSummary.totalSalary ?? 0) + (skipSummary.totalInterest ?? 0) + (skipSummary.totalReturns ?? 0) - (skipSummary.totalNeeds ?? 0)); return <Text style={[s.skipSummaryAmt, { fontFamily: Fonts.extraBold, fontSize: 16, color: net >= 0 ? MODULE_COLORS['module-3'].color : '#FF4444' }]}>{net >= 0 ? '+' : ''}{net.toLocaleString()}</Text>; })()}</View></View>

                {/* Milestones + wallet states */}
                {(skipSummary.finalEFPct != null || skipSummary.finalSGPct != null) && (
                  <>
                    <View style={[s.summaryDivider, { marginVertical: 12 }]} />
                    <Text style={{ alignSelf: 'flex-start', fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>WHAT HAPPENED</Text>

                    {skipSummary.finalEFPct != null && (
                      <View style={s.skipMilestoneRow}>
                        <Text style={s.skipMilestoneIcon}>{'\uD83D\uDEE1\uFE0F'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.skipMilestoneLabel}>Emergency Fund{skipSummary.finalEFPct >= 100 ? ' \u2014 Fully funded! \uD83C\uDF89' : ` \u2014 ${skipSummary.finalEFPct}% funded`}</Text>
                          <View style={s.skipMilestoneBar}><View style={[s.skipMilestoneBarFill, { width: `${Math.min(skipSummary.finalEFPct, 100)}%`, backgroundColor: skipSummary.finalEFPct >= 100 ? MODULE_COLORS['module-3'].color : Colors.primary }]} /></View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}><Image source={COIN_ASSET} style={{ width: 10, height: 10 }} /><Text style={s.skipMilestoneSub}>{(skipSummary.finalEFBalance ?? 0).toLocaleString()} of {(skipSummary.finalEFTarget ?? 0).toLocaleString()}</Text></View>
                        </View>
                      </View>
                    )}

                    {skipSummary.finalSGPct != null && (
                      <View style={s.skipMilestoneRow}>
                        <Text style={s.skipMilestoneIcon}>{'\uD83C\uDFAF'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={s.skipMilestoneLabel}>{skipSummary.finalSGLabel ?? 'Savings Goal'}{skipSummary.finalSGPct >= 100 ? ' \u2014 Goal reached! \uD83C\uDF89' : ` \u2014 ${skipSummary.finalSGPct}% complete`}</Text>
                          <View style={s.skipMilestoneBar}><View style={[s.skipMilestoneBarFill, { width: `${Math.min(skipSummary.finalSGPct, 100)}%`, backgroundColor: skipSummary.finalSGPct >= 100 ? MODULE_COLORS['module-3'].color : MODULE_COLORS['module-2'].color }]} /></View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}><Image source={COIN_ASSET} style={{ width: 10, height: 10 }} /><Text style={s.skipMilestoneSub}>{(skipSummary.finalSGBalance ?? 0).toLocaleString()} of {(skipSummary.finalSGTarget ?? 0).toLocaleString()}</Text></View>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
              <TouchableOpacity style={s.skipSummaryCta} onPress={() => { setShowSkipSummary(false); setSkipSummary(null); if (completedGoalQueue.length > 0) { const [next, ...rest] = completedGoalQueue; setCurrentGoal(next); setCompletedGoalQueue(rest); setGoalCompleteConfetti(true); setShowGoalComplete(true); } }} activeOpacity={0.88}><Text style={s.skipSummaryCtaText}>Continue {'\u2192'}</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Savings Goal post-quest flow */}
      {showSavingsGoalFlow && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <View style={s.alertBg}>
            <View style={s.alertCard}>
              {showSavingsGoalFlow === 'manual' && (
                <>
                  <Text style={s.alertEmoji}>{'\uD83C\uDFAF'}</Text>
                  <Text style={s.alertTitle}>Your savings goal is open</Text>
                  <Text style={s.alertBody}>Before automating, make your first manual transfer so you understand exactly what's happening to your money.</Text>
                  <View style={s.alertBtns}>
                    <TouchableOpacity style={s.alertCancel} onPress={() => setShowSavingsGoalFlow('automate')} activeOpacity={0.85}>
                      <Text style={s.alertCancelText}>Skip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.alertConfirm} onPress={() => { setShowSavingsGoalFlow(null); setTimeout(() => { setBankInitialTab('Transfers'); setShowBankModal(true); }, 300); }} activeOpacity={0.88}>
                      <Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>Transfer now {'\u2192'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              {showSavingsGoalFlow === 'automate' && (
                <>
                  <Text style={s.alertEmoji}>{'\u2699\uFE0F'}</Text>
                  <Text style={s.alertTitle}>Now automate it</Text>
                  <Text style={s.alertBody}>Set a monthly contribution so your savings goal grows automatically every month — no manual transfers needed.</Text>
                  <View style={s.alertBtns}>
                    <TouchableOpacity style={s.alertCancel} onPress={() => setShowSavingsGoalFlow('fastforward')} activeOpacity={0.85}>
                      <Text style={s.alertCancelText}>Skip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.alertConfirm} onPress={() => { setShowSavingsGoalFlow(null); setTimeout(() => { setBankInitialTab('Goals'); setShowBankModal(true); }, 300); }} activeOpacity={0.88}>
                      <Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>Automate {'\u2192'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              {showSavingsGoalFlow === 'fastforward' && (
                <>
                  <Text style={s.alertEmoji}>{'\u23ED\uFE0F'}</Text>
                  <Text style={s.alertTitle}>See it in action</Text>
                  <Text style={s.alertBody}>Fast forward one month and watch your savings goal grow automatically — salary credited, contribution deducted, interest applied.</Text>
                  <View style={s.alertBtns}>
                    <TouchableOpacity style={s.alertCancel} onPress={async () => { await AsyncStorage.setItem('savings_flow_done', 'true'); setShowSavingsGoalFlow(null); }} activeOpacity={0.85}>
                      <Text style={s.alertCancelText}>Later</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.alertConfirm} onPress={async () => { await AsyncStorage.setItem('savings_flow_done', 'true'); setShowSavingsGoalFlow(null); await doSkip(1); }} activeOpacity={0.88}>
                      <Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>Fast forward {'\u2192'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Emergency Fund post-quest flow */}
      {showEFFlow && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <View style={s.alertBg}>
            <View style={s.alertCard}>
              {showEFFlow === 'manual' && (
                <>
                  <Text style={s.alertEmoji}>{'\uD83D\uDEE1\uFE0F'}</Text>
                  <Text style={s.alertTitle}>Your emergency fund is open</Text>
                  <Text style={s.alertBody}>Make your first manual transfer to understand how money flows into your emergency fund. This is your financial safety net.</Text>
                  <View style={s.alertBtns}>
                    <TouchableOpacity style={s.alertCancel} onPress={() => setShowEFFlow('automate')} activeOpacity={0.85}>
                      <Text style={s.alertCancelText}>Skip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.alertConfirm} onPress={() => { setShowEFFlow(null); setTimeout(() => { setBankInitialTab('Transfers'); setShowBankModal(true); }, 300); }} activeOpacity={0.88}>
                      <Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>Transfer now {'\u2192'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              {showEFFlow === 'automate' && (
                <>
                  <Text style={s.alertEmoji}>{'\u2699\uFE0F'}</Text>
                  <Text style={s.alertTitle}>Automate your safety net</Text>
                  <Text style={s.alertBody}>Set a monthly contribution to your emergency fund. Every month it grows automatically until you have 3–6 months of expenses covered.</Text>
                  <View style={s.alertBtns}>
                    <TouchableOpacity style={s.alertCancel} onPress={() => setShowEFFlow('fastforward')} activeOpacity={0.85}>
                      <Text style={s.alertCancelText}>Skip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.alertConfirm} onPress={() => { setShowEFFlow(null); setTimeout(() => { setBankInitialTab('Goals'); setShowBankModal(true); }, 300); }} activeOpacity={0.88}>
                      <Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>Automate {'\u2192'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              {showEFFlow === 'fastforward' && (
                <>
                  <Text style={s.alertEmoji}>{'\u23ED\uFE0F'}</Text>
                  <Text style={s.alertTitle}>Watch it work</Text>
                  <Text style={s.alertBody}>Fast forward one month. Your salary arrives, your emergency fund contribution deducts automatically, and interest is applied.</Text>
                  <View style={s.alertBtns}>
                    <TouchableOpacity style={s.alertCancel} onPress={async () => { await AsyncStorage.setItem('ef_flow_done', 'true'); setShowEFFlow(null); }} activeOpacity={0.85}>
                      <Text style={s.alertCancelText}>Later</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.alertConfirm} onPress={async () => { await AsyncStorage.setItem('ef_flow_done', 'true'); setShowEFFlow(null); await doSkip(1); }} activeOpacity={0.88}>
                      <Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>Fast forward {'\u2192'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Walkthrough */}
      {showWalkthrough && (
        <Modal
          visible={showWalkthrough}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <View style={wt.backdrop}>
            <View style={wt.card}>

              {/* Skip button */}
              {!WALKTHROUGH_SLIDES[walkthroughSlide]?.isFinal && (
                <TouchableOpacity
                  style={wt.skipBtn}
                  onPress={finishWalkthrough}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={wt.skipText}>Skip</Text>
                </TouchableOpacity>
              )}

              {/* Slide content — scrollable in case content is tall */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={wt.slideScroll}
                scrollEnabled={true}
              >
                {(() => {
                  const slide = WALKTHROUGH_SLIDES[walkthroughSlide];
                  if (!slide) return null;
                  return (
                    <>
                      <Text style={wt.slideEmoji}>{slide.emoji}</Text>
                      <Text style={wt.slideTitle}>{slide.title}</Text>
                      <Text style={wt.slideSubtitle}>{slide.subtitle}</Text>

                      {slide.body ? (
                        <Text style={wt.slideBody}>{slide.body}</Text>
                      ) : null}

                      {slide.bullets ? (
                        <View style={wt.bulletList}>
                          {slide.bullets.map((b, i) => (
                            <View key={i} style={wt.bulletRow}>
                              <Text style={wt.bulletIcon}>{b.icon}</Text>
                              <Text style={wt.bulletText}>{b.text}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {slide.highlight ? (
                        <View style={[wt.highlight, { borderLeftColor: slide.highlight.color }]}>
                          <Text style={[wt.highlightText, { color: slide.highlight.color }]}>
                            {slide.highlight.text}
                          </Text>
                        </View>
                      ) : null}
                    </>
                  );
                })()}
              </ScrollView>

              {/* Arrow row + dots */}
              <View style={wt.arrowRow}>
                <TouchableOpacity
                  style={[wt.arrowBtn, walkthroughSlide === 0 && { opacity: 0 }]}
                  onPress={() => walkthroughSlide > 0 && goToSlide(walkthroughSlide - 1)}
                  disabled={walkthroughSlide === 0}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={wt.arrowText}>{'\u2039'}</Text>
                </TouchableOpacity>

                <View style={wt.dots}>
                  {WALKTHROUGH_SLIDES.map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => goToSlide(i)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <View style={[wt.dot, {
                        backgroundColor: i === walkthroughSlide ? Colors.primary : Colors.border,
                        width: i === walkthroughSlide ? 20 : 8,
                      }]} />
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[wt.arrowBtn, WALKTHROUGH_SLIDES[walkthroughSlide]?.isFinal && { opacity: 0 }]}
                  onPress={() => !WALKTHROUGH_SLIDES[walkthroughSlide]?.isFinal && goToSlide(walkthroughSlide + 1)}
                  disabled={!!WALKTHROUGH_SLIDES[walkthroughSlide]?.isFinal}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={wt.arrowText}>{'\u203A'}</Text>
                </TouchableOpacity>
              </View>

              {/* Final CTA */}
              {WALKTHROUGH_SLIDES[walkthroughSlide]?.isFinal && (
                <TouchableOpacity
                  style={wt.finalBtn}
                  onPress={finishWalkthrough}
                  activeOpacity={0.88}
                >
                  <Text style={wt.finalBtnText}>Begin my journey {'\u2192'}</Text>
                </TouchableOpacity>
              )}

            </View>
          </View>
        </Modal>
      )}

      {/* Life event modal */}
      {pendingLifeEvent && !pendingLifeEvent.isPositive && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <View style={s.alertBg}>
            <View style={[s.alertCard, { paddingBottom: 24 }]}>
              <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>{pendingLifeEvent.emoji}</Text>
              <Text style={s.alertTitle}>{pendingLifeEvent.title}</Text>
              <Text style={s.alertBody}>{pendingLifeEvent.description}</Text>

              {/* Total cost */}
              <View style={le.costRow}>
                <Text style={le.costLabel}>Total cost</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Image source={COIN_ASSET} style={{ width: 14, height: 14 }} />
                  <Text style={le.costAmt}>{Math.round(pendingLifeEvent.amount).toLocaleString()}</Text>
                </View>
              </View>

              {/* Account allocation */}
              <Text style={le.sectionLabel}>Pay from:</Text>

              {(sim?.wallets ?? [])
                .filter(w => w.type !== 'investment' && w.type !== 'cash' && (w.balance ?? 0) > 0)
                .map(w => {
                  const allocated = lifeEventAllocations[w.id] ?? 0;
                  const isEF = w.type === 'emergency';

                  return (
                    <View key={w.id} style={le.walletRow}>
                      <View style={le.walletInfo}>
                        <Text style={le.walletName} numberOfLines={1}>
                          {isEF ? '\uD83D\uDEE1\uFE0F ' : '\uD83C\uDFE6 '}{w.label}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Image source={COIN_ASSET} style={{ width: 10, height: 10 }} />
                          <Text style={le.walletBal}>{Math.round(w.balance ?? 0).toLocaleString()} available</Text>
                        </View>
                      </View>

                      <View style={le.amtInputWrap}>
                        <TouchableOpacity
                          onPress={() => {
                            const cur = lifeEventAllocations[w.id] ?? 0;
                            setLifeEventAllocations(prev => ({ ...prev, [w.id]: Math.max(0, cur - 100) }));
                            setLifeEventError('');
                          }}
                          style={le.amtBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={le.amtBtnText}>{'\u2212'}</Text>
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Image source={COIN_ASSET} style={{ width: 11, height: 11 }} />
                          <Text style={le.amtValue}>{Math.round(allocated).toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            const cur = lifeEventAllocations[w.id] ?? 0;
                            const totalOther = Object.entries(lifeEventAllocations)
                              .filter(([id]) => id !== w.id)
                              .reduce((a, [, v]) => a + v, 0);
                            const maxAdd = Math.min(
                              (w.balance ?? 0) - cur,
                              pendingLifeEvent.amount - totalOther - cur
                            );
                            setLifeEventAllocations(prev => ({ ...prev, [w.id]: cur + Math.min(100, Math.max(0, maxAdd)) }));
                            setLifeEventError('');
                          }}
                          style={le.amtBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={le.amtBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

              {/* Remaining unallocated */}
              {(() => {
                const totalAllocated = Object.values(lifeEventAllocations).reduce((a, b) => a + b, 0);
                const unallocated = pendingLifeEvent.amount - totalAllocated;
                return unallocated > 0 ? (
                  <View style={le.unallocatedRow}>
                    <Text style={le.unallocatedText}>Still need to allocate:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Image source={COIN_ASSET} style={{ width: 12, height: 12 }} />
                      <Text style={[le.unallocatedText, { color: '#FF4444', fontFamily: Fonts.bold }]}>{Math.round(unallocated).toLocaleString()}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[le.unallocatedRow, { backgroundColor: MODULE_COLORS['module-3'].colorLight }]}>
                    <Text style={[le.unallocatedText, { color: MODULE_COLORS['module-3'].color }]}>{'\u2713'} Fully allocated</Text>
                  </View>
                );
              })()}

              {lifeEventError ? <Text style={le.errorText}>{lifeEventError}</Text> : null}

              {/* CTA */}
              <View style={[s.alertBtns, { marginTop: 16 }]}>
                <TouchableOpacity
                  style={s.alertCancel}
                  onPress={() => {
                    const bankW = (sim?.wallets ?? []).find(w => w.type === 'bank');
                    if (bankW) {
                      applyLifeEventDeduction({ [bankW.id]: Math.min(bankW.balance ?? 0, pendingLifeEvent.amount) });
                    } else {
                      setPendingLifeEvent(null);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={s.alertCancelText}>Auto-deduct</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.alertConfirm, lifeEventApplying && { opacity: 0.6 }]}
                  disabled={lifeEventApplying}
                  onPress={() => {
                    const totalAllocated = Object.values(lifeEventAllocations).reduce((a, b) => a + b, 0);
                    if (totalAllocated < pendingLifeEvent.amount) {
                      setLifeEventError(`Allocate the full amount (${Math.round(pendingLifeEvent.amount - totalAllocated).toLocaleString()} remaining)`);
                      return;
                    }
                    applyLifeEventDeduction(lifeEventAllocations);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={s.alertConfirmText} numberOfLines={1} adjustsFontSizeToFit>
                    {lifeEventApplying ? 'Applying...' : 'Confirm \u2192'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Quest modals */}
      <Quest1
        visible={activeQuest === 'quest-1'}
        income={sim?.income ?? 4500}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest2
        visible={activeQuest === 'quest-2'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setBankNotif(true); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest3
        visible={activeQuest === 'quest-3'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest4
        visible={activeQuest === 'quest-4'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest5
        visible={activeQuest === 'quest-5'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); setTimeout(() => setShowSavingsGoalFlow('manual'), 1200); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest6
        visible={activeQuest === 'quest-6'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); setTimeout(() => setShowEFFlow('manual'), 1200); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest7
        visible={activeQuest === 'quest-7'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest8
        visible={activeQuest === 'quest-8'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest9
        visible={activeQuest === 'quest-9'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest10
        visible={activeQuest === 'quest-10'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest11
        visible={activeQuest === 'quest-11'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
      <Quest12
        visible={activeQuest === 'quest-12'}
        sim={sim}
        onComplete={async () => { await refreshAll(); setActiveQuest(null); pulseQuestCard(); setFinHasUpdate(true); }}
        onClose={() => setActiveQuest(null)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
// ─── Portfolio bento styles ──────────────────────────────────────────────────
// ─── Walkthrough styles ─────────────────────────────────────────────────────
const wt = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    width: '100%',
    maxHeight: SH * 0.78,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  skipBtn: {
    position: 'absolute',
    top: 18,
    right: 20,
    zIndex: 10,
    padding: 4,
  },
  skipText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  slideScroll: {
    paddingBottom: 8,
    paddingTop: 8,
  },
  slideEmoji: {
    fontSize: 52,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 28,
  },
  slideSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  slideBody: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  bulletList: {
    gap: 10,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletIcon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
    marginTop: 1,
  },
  bulletText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  highlight: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 8,
    marginTop: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  highlightText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    lineHeight: 20,
  },
  arrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  arrowBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontFamily: Fonts.regular,
    fontSize: 28,
    color: Colors.textMuted,
    lineHeight: 32,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  finalBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finalBtnText: {
    fontFamily: Fonts.extraBold,
    fontSize: 15,
    color: Colors.white,
  },
});

// ─── Monthly snapshot styles ─────────────────────────────────────────────────
const snap = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  header: { marginBottom: 12 },
  eyebrow: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.2, color: Colors.textMuted },
  rows: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  rowAmt: { fontFamily: Fonts.bold, fontSize: 13 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  savingsRateNote: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});

// ─── Accounts bento styles ───────────────────────────────────────────────────
const ab = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 20, gap: 8 },
  containerPressed: { opacity: 0.92 },
  tile: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, overflow: 'hidden' },
  tileFull: { width: '100%' },
  eyebrow: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 0 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 12 },
  balanceHero: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary },
  balanceCount: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  compBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: Colors.border, marginBottom: 14, marginTop: 10 },
  pieLegend: { width: '100%', marginTop: 8, gap: 8 },
  pieLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pieLegendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  pieLegendName: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1 },
  pieLegendAmt: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  ringPct: { fontFamily: Fonts.extraBold, fontSize: 13 },
  goalHero: { fontFamily: Fonts.extraBold, fontSize: 28 },
  goalHeroUnit: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  goalBarTrack: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', position: 'relative', marginBottom: 4 },
  goalBarFill: { height: 8, borderRadius: 4, position: 'absolute', left: 0, top: 0 },
  goalMarker: { position: 'absolute', top: 0, width: 1.5, height: 8, backgroundColor: Colors.white },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalFooterAmt: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary },
  goalFooterOf: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  goalFooterMeta: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  efPctLabel: { fontFamily: Fonts.regular, fontSize: 10, marginTop: 4, marginBottom: 6 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  budgetLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, width: 56 },
  budgetBarWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetBarTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  budgetBarFill: { height: 8, borderRadius: 4 },
  budgetPct: { fontFamily: Fonts.bold, fontSize: 11, width: 30, textAlign: 'right' },
  budgetAmtWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, width: 52, justifyContent: 'flex-end' },
  budgetAmt: { fontFamily: Fonts.bold, fontSize: 12 },
  statHero: { fontFamily: Fonts.extraBold, fontSize: 20 },
  statSub: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 1 },
});

// ─── Portfolio bento styles ──────────────────────────────────────────────────
const pb = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 20, gap: 8 },
  containerPressed: { opacity: 0.92 },
  tile: { backgroundColor: Colors.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, overflow: 'hidden' },
  tileFull: { width: '100%' },
  tileThird: { flex: 1, minHeight: 100 },
  tileEyebrow: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 4 },
  tileHero: { fontFamily: Fonts.extraBold, fontSize: 22, marginBottom: 2 },
  tileDelta: { fontFamily: Fonts.bold, fontSize: 12 },
  tileSubLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, lineHeight: 14 },
  miniBar: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  miniBarFill: { height: 4, borderRadius: 2 },
  assetName: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary },
  assetPct: { fontFamily: Fonts.bold, fontSize: 11 },
  projBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  projBarFill: { height: 6, borderRadius: 3 },
  projBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-end' },
  projBadgeText: { fontFamily: Fonts.bold, fontSize: 11 },
});

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
  nwHero: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  nwBarWrap: { gap: 6 },
  nwBarTrack: { height: 10, backgroundColor: Colors.border, borderRadius: 5, position: 'relative' },
  nwBarFill: { height: 10, borderRadius: 5, position: 'absolute', left: 0, top: 0 },
  nwMilestone: { position: 'absolute', top: 0, width: 1.5, height: 10, backgroundColor: Colors.background, zIndex: 2 },
  nwBarFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nwBarLabel: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.primary },
  nwBarTarget: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  nwNoFI: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  nwCompositionRows: { gap: 10, marginBottom: 4 },
  nwCompositionRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  nwCompositionLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 110 },
  nwCompositionDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  nwCompositionLabel: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary },
  nwCompositionAmt: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary, width: 70, textAlign: 'right' },
  nwCompositionBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  nwCompositionBarFill: { height: 6, borderRadius: 3 },
  nwCompositionPct: { fontFamily: Fonts.bold, fontSize: 11, width: 32, textAlign: 'right' },

  // Quest banner
  qbBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 12, borderLeftWidth: 4, gap: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  qbIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  qbEyebrow: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1, color: Colors.textMuted, marginBottom: 2 },
  qbName: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  qbCta: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  qbCtaText: { fontFamily: Fonts.bold, fontSize: 12 },

  // Wallet grid

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
  finOverlayCard: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingTop: 36 },
  finOverlayTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  finOverlayCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F5FB', alignItems: 'center', justifyContent: 'center' },
  finOverlayName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginLeft: 10, flex: 1 },
  finOverlayMonth: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  finOverlayMsg: { fontFamily: Fonts.regular, fontSize: 16, color: Colors.textPrimary, lineHeight: 26, marginTop: 20 },
  finOverlayBtnSecondary: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radii.lg, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  finOverlayBtnSecondaryText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.primary },
  finOverlayBtn: { backgroundColor: Colors.primary, borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  finOverlayBtnText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },
  finOverlayCaughtUp: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginTop: 24 },
  finOverlayDismiss: { alignItems: 'center', marginTop: 12, marginBottom: 4 },
  finOverlayDismissText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },

  // Bottom sheets
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: SH * 0.85 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.primary, alignSelf: 'center', marginBottom: 20 },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary },
  sheetCloseX: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted, padding: 4 },
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
  gateBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  gateCard: { backgroundColor: Colors.white, borderRadius: 24, padding: 28, width: SW * 0.82, alignItems: 'center', alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
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
  customSalaryInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  customSalaryInput: { flex: 1, fontFamily: Fonts.bold, fontSize: 15, color: Colors.primary, paddingVertical: 0 },
  customSalaryUnit: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  customSalaryError: { fontFamily: Fonts.regular, fontSize: 11, color: '#FF4444', marginTop: 4 },
  jobSalaryHero: { fontFamily: Fonts.extraBold, fontSize: 36, color: Colors.textPrimary },
  jobSalaryUnit: { fontFamily: Fonts.regular, fontSize: 16, color: Colors.textMuted },
  jobDetailCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, width: '100%', marginBottom: 16, ...Shadows.soft },
  jobDetailRow: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 28 },
  jobCta: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center' },
  jobCtaText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },

  // Styled alerts
  alertBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8, width: SW * 0.82, maxHeight: SH * 0.75, alignSelf: 'center' },
  alertEmoji: { fontSize: 36, marginBottom: 12 },
  alertTitle: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  alertBody: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertBtns: { flexDirection: 'row', gap: 8, width: '100%', marginTop: 8 },
  alertCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  alertCancelText: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textSecondary },
  alertConfirm: { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  alertConfirmText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white, textAlign: 'center' },

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
  dtAdvHint: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 2, letterSpacing: 0.5 },
  skipSummaryCta: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', marginTop: 8, width: '100%' },
  skipSummaryCtaText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  skipSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, width: '100%' },
  skipSummaryRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  skipSummaryIcon: { fontSize: 20, width: 28 },
  skipSummaryLabel: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  skipSummaryBreakdown: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  skipSummaryAmt: { fontFamily: Fonts.bold, fontSize: 14 },
  skipMilestoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, width: '100%' },
  skipMilestoneIcon: { fontSize: 18, width: 24, marginTop: 2 },
  skipMilestoneLabel: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 4 },
  skipMilestoneSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  skipMilestoneBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', width: '100%' },
  skipMilestoneBarFill: { height: 4, borderRadius: 2 },
  // Portfolio dashboard card
  portfolioSummaryDashCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginTop: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, position: 'relative' },
  portfolioDashHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  portfolioDashLabel: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2, color: Colors.textMuted },
  portfolioDashRiskBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  portfolioDashRiskText: { fontFamily: Fonts.bold, fontSize: 10 },
  portfolioDashChevron: { fontSize: 18, color: Colors.textMuted },
  portfolioDashBalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  portfolioDashBalance: { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.textPrimary },
  portfolioDashDelta: { fontFamily: Fonts.bold, fontSize: 12 },
  portfolioDashHoldingsSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  // Date header
  dateHeader: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  dateHeaderYear: { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 1.4, color: Colors.textMuted },
  dateHeaderMonth: { fontFamily: Fonts.extraBold, fontSize: 40, color: Colors.textPrimary, lineHeight: 46, marginBottom: 12 },
  ffBtn: { padding: 4, alignSelf: 'center' },
  // Floating column
  floatingColumn: { position: 'absolute', right: 12, zIndex: 100, gap: 10, alignItems: 'center' },
  floatingBtn: { width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 6, position: 'relative' },
  floatingNotifDot: { position: 'absolute', top: -1, right: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: Colors.white, zIndex: 1 },
  // Quest card
  questCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.white, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: Colors.primary, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  questCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  questCardIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  questCardMeta: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.8, color: Colors.primary, marginBottom: 3 },
  questCardTitle: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary, lineHeight: 21, marginBottom: 3 },
  questCardDesc: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  questCardChevron: { fontFamily: Fonts.bold, fontSize: 24, color: Colors.textMuted, flexShrink: 0 },
});

// ─── Fast forward picker styles ──────────────────────────────────────────────
const ff = StyleSheet.create({
  monthDisplay: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginBottom: 4 },
  monthCount: { fontFamily: Fonts.extraBold, fontSize: 52, color: Colors.primary, lineHeight: 58 },
  monthUnit: { fontFamily: Fonts.regular, fontSize: 18, color: Colors.textMuted, marginBottom: 4 },
  monthLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 28, fontStyle: 'italic' },
  sliderWrap: { width: '100%', marginBottom: 28, paddingHorizontal: 8 },
  track: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: -6, overflow: 'visible' },
  trackFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 24 },
  stepDot: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: {},
  stepInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border, borderWidth: 2, borderColor: Colors.white },
  stepInnerActive: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.primary },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stepLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'center', width: 24 },
  stepLabelActive: { fontFamily: Fonts.bold, color: Colors.primary },
  modalIconText: { fontSize: 36, color: Colors.textPrimary, letterSpacing: -4, textAlign: 'center', marginBottom: 4 },
});

// ─── Life event modal styles ─────────────────────────────────────────────────
const le = StyleSheet.create({
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  costLabel: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSecondary },
  costAmt: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary },
  sectionLabel: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.1, color: Colors.textMuted, marginBottom: 8 },
  walletRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  walletInfo: { flex: 1, gap: 2 },
  walletName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  walletBal: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  amtInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amtBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  amtBtnText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary, lineHeight: 20 },
  amtValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, minWidth: 40, textAlign: 'center' },
  unallocatedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  unallocatedText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  errorText: { fontFamily: Fonts.regular, fontSize: 12, color: '#FF4444', textAlign: 'center', marginTop: 8 },
});
