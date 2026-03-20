// app/life-sim/portfolio-modal.js
//
// Full-screen portfolio management modal.
// Four tabs: Overview, Rebalance, Assets, Projections.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image,
  StyleSheet, Dimensions, Easing,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc as firestoreDoc, updateDoc as firestoreUpdateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Colors, Fonts, Radii, Shadows, Spacing, MODULE_COLORS } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const COIN = require('../../assets/coin.png');

// ─── Asset Universe ──────────────────────────────────────────────────────────

const ASSETS = [
  { id: 'nestvault', name: 'NestVault', category: 'Robo-Advisor', icon: '🤖', annualReturn: 6.5, volatility: 'Medium', volatilityScore: 50, color: MODULE_COLORS['module-1'].color, isVehicle: true },
  { id: 'drakon-rss', name: 'Drakon RSS Plan', category: 'ETF RSS Plan', icon: '📋', annualReturn: 5.5, volatility: 'Medium', volatilityScore: 45, color: MODULE_COLORS['module-2'].color, isVehicle: true },
  { id: 'apextrade-diy', name: 'ApexTrade DIY', category: 'DIY ETF', icon: '🎯', annualReturn: 6, volatility: 'Medium-High', volatilityScore: 60, color: MODULE_COLORS['module-3'].color, isVehicle: true },
  { id: 'apex-global', name: 'Apex Global 500 ETF', category: 'Stocks', icon: '🌍', annualReturn: 7, volatility: 'High', volatilityScore: 80, color: MODULE_COLORS['module-3'].color },
  { id: 'sg-blue-chip', name: 'SG Blue Chip ETF', category: 'Stocks', icon: '🇸🇬', annualReturn: 5, volatility: 'Medium', volatilityScore: 55, color: '#E63946' },
  { id: 'sg-reit', name: 'SG REIT Index', category: 'REITs', icon: '🏢', annualReturn: 6, volatility: 'Medium', volatilityScore: 50, color: MODULE_COLORS['module-2'].color },
  { id: 'fsa-bond', name: 'FSA Government Bond', category: 'Bonds', icon: '📜', annualReturn: 3.5, volatility: 'Low', volatilityScore: 15, color: MODULE_COLORS['module-1'].color },
  { id: 'drakon-fd', name: 'Drakon Fixed Deposit', category: 'Cash', icon: '🏦', annualReturn: 2.8, volatility: 'None', volatilityScore: 0, color: '#457B9D' },
  { id: 'voltcoin', name: 'VoltCoin', category: 'Crypto', icon: '⚡', annualReturn: 25, volatility: 'Extreme', volatilityScore: 100, color: '#F4A261' },
  { id: 'gold-trust', name: 'Gold Trust ETF', category: 'Commodities', icon: '🥇', annualReturn: 4, volatility: 'Low-Medium', volatilityScore: 30, color: '#E9C46A' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calculateRiskScore = (allocs) => {
  const total = Object.values(allocs).reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  return Math.round(Object.entries(allocs).reduce((sum, [id, pct]) => {
    const asset = ASSETS.find(a => a.id === id);
    return sum + (asset?.volatilityScore ?? 0) * (pct / total);
  }, 0));
};

const calculateExpectedReturn = (allocs) => {
  const total = Object.values(allocs).reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  return Object.entries(allocs).reduce((sum, [id, pct]) => {
    const asset = ASSETS.find(a => a.id === id);
    return sum + (asset?.annualReturn ?? 0) * (pct / total);
  }, 0);
};

const getRiskLabel = (score) => {
  if (score <= 20) return { label: 'Very Low', color: '#457B9D' };
  if (score <= 40) return { label: 'Low', color: MODULE_COLORS['module-1'].color };
  if (score <= 60) return { label: 'Moderate', color: '#F4A261' };
  if (score <= 80) return { label: 'High', color: MODULE_COLORS['module-2'].color };
  return { label: 'Very High', color: '#E63946' };
};

const generatePiePaths = (holdings, size) => {
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
    const path = {
      d: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: h.color ?? Colors.primary,
      pct: Math.round(pct * 100),
      assetId: h.assetId,
    };
    startAngle = endAngle;
    return path;
  }).filter(Boolean);
};

const formatCoin = (n) => (n ?? 0).toLocaleString();

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PortfolioModal({ visible, onClose, sim, onSimUpdate }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Overview');

  // Rebalance state
  const [rebalanceAllocations, setRebalanceAllocations] = useState({});
  const [rebalancing, setRebalancing] = useState(false);
  const [rebalanceDone, setRebalanceDone] = useState(false);

  // Assets state
  const [addingAsset, setAddingAsset] = useState(null);
  const [addAllocation, setAddAllocation] = useState(10);
  const [removingAsset, setRemovingAsset] = useState(null);
  const [assetBusy, setAssetBusy] = useState(false);

  // Projections state
  const [whatIfDCA, setWhatIfDCA] = useState(0);
  const [whatIfReturn, setWhatIfReturn] = useState(7);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ─── Derived data ────────────────────────────────────────────────────────

  const investmentWallet = (sim?.wallets ?? []).find(w => w.type === 'investment');
  const portfolioBalance = investmentWallet?.balance ?? 0;
  const holdings = investmentWallet?.holdings ?? [];
  const currentAllocations = sim?.portfolioAllocations ?? {};
  const targetAllocations = sim?.portfolioAllocations ?? {};
  const monthlyDCA = sim?.monthlyDCA ?? 0;
  const vehicleId = sim?.investmentVehicle?.id ?? 'nestvault';

  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      // seed rebalance sliders
      const seed = {};
      holdings.forEach(h => { seed[h.assetId] = h.allocation ?? 0; });
      setRebalanceAllocations(seed);
      setRebalanceDone(false);
    }
  }, [visible, sim]);

  // ─── Projection helpers ──────────────────────────────────────────────────

  const projectPortfolio = (annualReturn, dca, years) => {
    let balance = portfolioBalance;
    const monthlyRate = annualReturn / 100 / 12;
    for (let m = 0; m < years * 12; m++) {
      balance += dca;
      balance *= (1 + monthlyRate);
    }
    return Math.round(balance);
  };

  const yearsToFI = (scenario) => {
    let balance = portfolioBalance;
    const monthlyRate = scenario.annualReturn / 100 / 12;
    const dca = monthlyDCA * scenario.dcaMultiplier;
    let months = 0;
    while (balance < (sim?.ffn ?? 999999999) && months < 600) {
      balance += dca;
      balance *= (1 + monthlyRate);
      months++;
    }
    return months < 600 ? Math.round(months / 12 * 10) / 10 : null;
  };

  // ─── Rebalance handlers ──────────────────────────────────────────────────

  const handleSliderChange = (assetId, newVal) => {
    const rounded = Math.round(newVal);
    setRebalanceAllocations(prev => {
      const next = { ...prev, [assetId]: rounded };
      const otherIds = Object.keys(next).filter(id => id !== assetId);
      const diff = Object.values(next).reduce((s, v) => s + v, 0) - 100;
      if (diff !== 0 && otherIds.length > 0) {
        let bestId = otherIds[0];
        let bestDrift = -Infinity;
        otherIds.forEach(id => {
          const drift = (next[id] ?? 0) - (targetAllocations[id] ?? 0);
          if (drift > bestDrift) { bestDrift = drift; bestId = id; }
        });
        next[bestId] = Math.max(0, (next[bestId] ?? 0) - diff);
      }
      return next;
    });
  };

  const snapToTarget = () => {
    const seed = {};
    holdings.forEach(h => { seed[h.assetId] = targetAllocations[h.assetId] ?? h.allocation ?? 0; });
    // normalise to 100
    const total = Object.values(seed).reduce((s, v) => s + v, 0);
    if (total > 0 && total !== 100) {
      const scale = 100 / total;
      Object.keys(seed).forEach(k => { seed[k] = Math.round(seed[k] * scale); });
      // fix rounding
      const diff = Object.values(seed).reduce((s, v) => s + v, 0) - 100;
      if (diff !== 0) {
        const first = Object.keys(seed)[0];
        seed[first] = Math.max(0, seed[first] - diff);
      }
    }
    setRebalanceAllocations(seed);
  };

  const handleRebalance = async () => {
    const total = Object.values(rebalanceAllocations).reduce((s, v) => s + v, 0);
    if (total !== 100 || rebalancing) return;
    setRebalancing(true);
    const uid = auth.currentUser?.uid;
    const rebalanceFee = Math.round(portfolioBalance * 0.001);
    const updatedHoldings = holdings.map(h => ({
      ...h,
      allocation: rebalanceAllocations[h.assetId] ?? h.allocation,
      value: Math.round(portfolioBalance * (rebalanceAllocations[h.assetId] ?? h.allocation) / 100),
    }));
    const newBalance = portfolioBalance - rebalanceFee;
    const updatedWallets = (sim?.wallets ?? []).map(w =>
      w.type === 'investment'
        ? { ...w, balance: newBalance, holdings: updatedHoldings,
            riskScore: calculateRiskScore(rebalanceAllocations),
            expectedReturn: calculateExpectedReturn(rebalanceAllocations) }
        : w
    );
    await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), {
      wallets: updatedWallets,
      portfolioAllocations: rebalanceAllocations,
      portfolioRiskScore: calculateRiskScore(rebalanceAllocations),
      lastRebalancedMonth: sim?.currentMonth ?? 1,
      updatedAt: Date.now(),
    });
    await firestoreUpdateDoc(firestoreDoc(db, 'users', uid), {
      finCoins: increment(-rebalanceFee),
    });
    setRebalancing(false);
    setRebalanceDone(true);
    onSimUpdate();
  };

  // ─── Asset add / remove handlers ─────────────────────────────────────────

  const handleAddAsset = async () => {
    if (!addingAsset || addAllocation <= 0) return;
    setAssetBusy(true);
    const uid = auth.currentUser?.uid;
    const largestHolding = [...holdings].sort((a, b) => (b.allocation ?? 0) - (a.allocation ?? 0))[0];
    if (!largestHolding || (largestHolding.allocation ?? 0) - addAllocation < 5) {
      setAssetBusy(false);
      return;
    }

    const newHolding = {
      assetId: addingAsset.id, name: addingAsset.name, icon: addingAsset.icon,
      color: addingAsset.color, allocation: addAllocation,
      value: Math.round(portfolioBalance * addAllocation / 100),
      annualReturn: addingAsset.annualReturn, volatilityScore: addingAsset.volatilityScore,
    };
    const updatedHoldings = holdings.map(h =>
      h.assetId === largestHolding.assetId
        ? { ...h, allocation: (h.allocation ?? 0) - addAllocation, value: Math.round(portfolioBalance * ((h.allocation ?? 0) - addAllocation) / 100) }
        : h
    );
    updatedHoldings.push(newHolding);
    const newAllocations = Object.fromEntries(updatedHoldings.map(h => [h.assetId, h.allocation]));
    const updatedWallets = (sim?.wallets ?? []).map(w =>
      w.type === 'investment' ? { ...w, holdings: updatedHoldings, riskScore: calculateRiskScore(newAllocations), expectedReturn: calculateExpectedReturn(newAllocations) } : w
    );
    await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), {
      wallets: updatedWallets, portfolioAllocations: newAllocations,
      portfolioRiskScore: calculateRiskScore(newAllocations), updatedAt: Date.now(),
    });
    setAddingAsset(null);
    setAddAllocation(10);
    setAssetBusy(false);
    onSimUpdate();
  };

  const handleRemoveAsset = async (asset) => {
    if (holdings.length <= 1 || assetBusy) return;
    setAssetBusy(true);
    const uid = auth.currentUser?.uid;
    const removedAlloc = asset.allocation ?? 0;
    const remaining = holdings.filter(h => h.assetId !== asset.assetId);
    const splitEach = Math.floor(removedAlloc / remaining.length);
    let leftover = removedAlloc - splitEach * remaining.length;
    const updatedHoldings = remaining.map((h, i) => {
      const extra = i === 0 ? leftover : 0;
      return {
        ...h,
        allocation: (h.allocation ?? 0) + splitEach + extra,
        value: Math.round(portfolioBalance * ((h.allocation ?? 0) + splitEach + extra) / 100),
      };
    });
    const newAllocations = Object.fromEntries(updatedHoldings.map(h => [h.assetId, h.allocation]));
    const updatedWallets = (sim?.wallets ?? []).map(w =>
      w.type === 'investment' ? { ...w, holdings: updatedHoldings, riskScore: calculateRiskScore(newAllocations), expectedReturn: calculateExpectedReturn(newAllocations) } : w
    );
    await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), {
      wallets: updatedWallets, portfolioAllocations: newAllocations,
      portfolioRiskScore: calculateRiskScore(newAllocations), updatedAt: Date.now(),
    });
    setRemovingAsset(null);
    setAssetBusy(false);
    onSimUpdate();
  };

  // ─── Coin image helper ──────────────────────────────────────────────────

  const CoinIcon = ({ size = 16 }) => (
    <Image source={COIN} style={{ width: size, height: size }} />
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  const Header = () => (
    <View style={[p.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
        <Text style={p.headerBack}>← Back</Text>
      </TouchableOpacity>
      <Text style={p.headerTitle}>Portfolio</Text>
      <View style={{ width: 60 }} />
    </View>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  TAB BAR
  // ═══════════════════════════════════════════════════════════════════════════

  const TABS = ['Overview', 'Rebalance', 'Assets', 'Projections'];

  const TabBar = () => (
    <View style={p.tabBar}>
      {TABS.map(t => {
        const active = activeTab === t;
        return (
          <TouchableOpacity
            key={t}
            style={[p.tab, active && p.tabActive]}
            onPress={() => setActiveTab(t)}
            activeOpacity={0.75}
          >
            <Text style={[p.tabText, active && p.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  TAB 1 — OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  const renderOverview = () => {
    const riskScore = calculateRiskScore(currentAllocations);
    const expReturn = calculateExpectedReturn(currentAllocations);
    const risk = getRiskLabel(riskScore);
    const piePaths = generatePiePaths(holdings, 180);
    const pieSize = 180;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={p.content} showsVerticalScrollIndicator={false}>
        {/* Portfolio balance hero */}
        <View style={p.card}>
          <Text style={p.sectionTitle}>PORTFOLIO VALUE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CoinIcon size={22} />
            <Text style={p.heroNumber}>{formatCoin(portfolioBalance)}</Text>
          </View>
          {monthlyDCA > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <Text style={p.metaText}>Monthly DCA:</Text>
              <CoinIcon size={13} />
              <Text style={[p.metaText, { fontFamily: Fonts.bold }]}>{formatCoin(monthlyDCA)}</Text>
            </View>
          )}
        </View>

        {/* Pie chart */}
        {holdings.length > 0 && (
          <View style={p.card}>
            <Text style={p.sectionTitle}>ALLOCATION</Text>
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <Svg width={pieSize} height={pieSize}>
                <G>
                  {piePaths.map((seg, i) => (
                    <Path key={i} d={seg.d} fill={seg.color} />
                  ))}
                </G>
              </Svg>
              {/* Center label */}
              <View style={{ position: 'absolute', top: pieSize / 2 - 18 + 12, alignSelf: 'center' }}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, textAlign: 'center' }}>{holdings.length}</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'center' }}>Assets</Text>
              </View>
            </View>

            {/* Legend */}
            <View style={{ gap: 6 }}>
              {holdings.map(h => (
                <View key={h.assetId} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: h.color ?? Colors.primary }} />
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, flex: 1 }}>{h.name}</Text>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary }}>{h.allocation ?? 0}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Risk & Return summary */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={[p.card, { flex: 1, marginBottom: 0 }]}>
            <Text style={p.sectionTitle}>RISK SCORE</Text>
            <Text style={[p.heroSmall, { color: risk.color }]}>{riskScore}</Text>
            <View style={{ marginTop: 6, height: 6, borderRadius: 3, backgroundColor: Colors.lightGray }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: risk.color, width: `${riskScore}%` }} />
            </View>
            <Text style={[p.metaText, { color: risk.color, marginTop: 4 }]}>{risk.label}</Text>
          </View>
          <View style={[p.card, { flex: 1, marginBottom: 0 }]}>
            <Text style={p.sectionTitle}>EXPECTED RETURN</Text>
            <Text style={[p.heroSmall, { color: Colors.successDark }]}>{expReturn.toFixed(1)}%</Text>
            <Text style={[p.metaText, { marginTop: 6 }]}>per year (est.)</Text>
          </View>
        </View>

        {/* Holdings list with drift */}
        <View style={p.card}>
          <Text style={p.sectionTitle}>HOLDINGS</Text>
          {holdings.map(h => {
            const target = targetAllocations[h.assetId] ?? h.allocation ?? 0;
            const actual = h.allocation ?? 0;
            const drift = actual - target;
            const driftColor = drift > 2 ? Colors.danger : drift < -2 ? MODULE_COLORS['module-1'].color : Colors.successDark;
            return (
              <View key={h.assetId} style={p.holdingRow}>
                <View style={[p.holdingIcon, { backgroundColor: (h.color ?? Colors.primary) + '18' }]}>
                  <Text style={{ fontSize: 18 }}>{h.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={p.holdingName}>{h.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CoinIcon size={12} />
                    <Text style={p.holdingValue}>{formatCoin(h.value ?? Math.round(portfolioBalance * actual / 100))}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[p.holdingPct, { color: h.color ?? Colors.primary }]}>{actual}%</Text>
                  {drift !== 0 && (
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 10, color: driftColor }}>
                      {drift > 0 ? '+' : ''}{drift}% drift
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Performance sparkline */}
        {sim?.history?.length > 1 && (() => {
          const invHistory = sim.history.slice(-6).map(h => {
            const invSnapshot = h.walletSnapshots?.investment ?? 0;
            return invSnapshot;
          });
          const maxVal = Math.max(...invHistory, 1);
          const barWidth = (SW - 80) / invHistory.length;
          return (
            <View style={p.sparklineCard}>
              <Text style={p.sparklineTitle}>PORTFOLIO GROWTH</Text>
              <View style={p.sparklineBars}>
                {invHistory.map((val, i) => (
                  <View key={i} style={[p.sparklineBar, {
                    height: Math.max(4, (val / maxVal) * 60),
                    backgroundColor: MODULE_COLORS['module-4'].color,
                    opacity: 0.4 + (i / invHistory.length) * 0.6,
                    width: barWidth - 4,
                  }]} />
                ))}
              </View>
              <Text style={p.sparklineSub}>Last {invHistory.length} months</Text>
            </View>
          );
        })()}

        {/* Fin advisor card */}
        <View style={p.finCard}>
          <View style={p.finCardTop}>
            <View style={p.finCardAvatar}>
              <Text style={{ fontSize: 16 }}>🦉</Text>
            </View>
            <View style={p.finCardLabel}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase' }}>FIN TIP</Text>
            </View>
          </View>
          <Text style={p.finCardText}>
            Diversification reduces risk without necessarily reducing returns. Check the Rebalance tab if your allocations have drifted from your targets.
          </Text>
        </View>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  TAB 2 — REBALANCE
  // ═══════════════════════════════════════════════════════════════════════════

  const renderRebalance = () => {
    const totalAlloc = Object.values(rebalanceAllocations).reduce((s, v) => s + v, 0);
    const isValid = totalAlloc === 100;
    const rebalanceFee = Math.round(portfolioBalance * 0.001);
    const newRisk = calculateRiskScore(rebalanceAllocations);
    const newReturn = calculateExpectedReturn(rebalanceAllocations);
    const riskInfo = getRiskLabel(newRisk);

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={p.content} showsVerticalScrollIndicator={false}>
        {rebalanceDone ? (
          <View style={p.card}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.successDark, textAlign: 'center', marginBottom: 8 }}>
              Rebalance Complete
            </Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
              Your portfolio has been rebalanced successfully. The fee has been deducted from your portfolio.
            </Text>
            <TouchableOpacity style={[p.ctaBtn, { backgroundColor: Colors.successDark, marginTop: 20 }]} onPress={() => { setRebalanceDone(false); setActiveTab('Overview'); }} activeOpacity={0.8}>
              <Text style={p.ctaBtnText}>Back to Overview</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Current vs Target drift table */}
            <View style={p.card}>
              <Text style={p.sectionTitle}>CURRENT VS NEW ALLOCATION</Text>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={[p.driftHeader, { flex: 1 }]}>Asset</Text>
                <Text style={[p.driftHeader, { width: 50, textAlign: 'right' }]}>Current</Text>
                <Text style={[p.driftHeader, { width: 50, textAlign: 'right' }]}>New</Text>
                <Text style={[p.driftHeader, { width: 50, textAlign: 'right' }]}>Drift</Text>
              </View>
              {holdings.map(h => {
                const current = h.allocation ?? 0;
                const newAlloc = rebalanceAllocations[h.assetId] ?? 0;
                const drift = newAlloc - current;
                const driftColor = drift > 0 ? Colors.successDark : drift < 0 ? Colors.danger : Colors.textMuted;
                return (
                  <View key={h.assetId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border + '60' }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14 }}>{h.icon}</Text>
                      <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textPrimary }} numberOfLines={1}>{h.name}</Text>
                    </View>
                    <Text style={{ width: 50, textAlign: 'right', fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>{current}%</Text>
                    <Text style={{ width: 50, textAlign: 'right', fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary }}>{newAlloc}%</Text>
                    <Text style={{ width: 50, textAlign: 'right', fontFamily: Fonts.semiBold, fontSize: 12, color: driftColor }}>
                      {drift > 0 ? '+' : ''}{drift}%
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Sliders */}
            <View style={p.card}>
              <Text style={p.sectionTitle}>ADJUST ALLOCATIONS</Text>
              {holdings.map(h => {
                const val = rebalanceAllocations[h.assetId] ?? 0;
                return (
                  <View key={h.assetId} style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary }}>{h.icon} {h.name}</Text>
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: h.color ?? Colors.primary }}>{val}%</Text>
                    </View>
                    <Slider
                      style={{ width: '100%', height: 36 }}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={val}
                      onValueChange={(v) => handleSliderChange(h.assetId, v)}
                      minimumTrackTintColor={h.color ?? Colors.primary}
                      maximumTrackTintColor={Colors.lightGray}
                      thumbTintColor={h.color ?? Colors.primary}
                    />
                  </View>
                );
              })}

              {/* Snap to target */}
              <TouchableOpacity style={p.snapBtn} onPress={snapToTarget} activeOpacity={0.8}>
                <Text style={p.snapBtnText}>Snap to Target</Text>
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={p.card}>
              <Text style={p.sectionTitle}>REBALANCE SUMMARY</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={p.metaText}>Total allocation</Text>
                <Text style={[p.metaText, { fontFamily: Fonts.bold, color: isValid ? Colors.successDark : Colors.danger }]}>{totalAlloc}%</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={p.metaText}>New risk score</Text>
                <Text style={[p.metaText, { fontFamily: Fonts.bold, color: riskInfo.color }]}>{newRisk} ({riskInfo.label})</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={p.metaText}>Expected return</Text>
                <Text style={[p.metaText, { fontFamily: Fonts.bold, color: Colors.successDark }]}>{newReturn.toFixed(1)}%</Text>
              </View>

              {/* Fee warning */}
              <View style={p.feeWarning}>
                <Text style={p.feeText}>0.1% fee (</Text>
                <CoinIcon size={13} />
                <Text style={[p.feeText, { fontFamily: Fonts.bold }]}> {formatCoin(rebalanceFee)}</Text>
                <Text style={p.feeText}>) will be deducted</Text>
              </View>

              {!isValid && (
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.danger, textAlign: 'center', marginTop: 8 }}>
                  Total must equal 100% (currently {totalAlloc}%)
                </Text>
              )}

              {/* Confirm */}
              <TouchableOpacity
                style={[p.ctaBtn, !isValid && { opacity: 0.4 }]}
                onPress={handleRebalance}
                disabled={!isValid || rebalancing}
                activeOpacity={0.8}
              >
                {rebalancing ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={p.ctaBtnText}>Confirm Rebalance</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Fin card */}
            <View style={p.finCard}>
              <View style={p.finCardTop}>
                <View style={p.finCardAvatar}>
                  <Text style={{ fontSize: 16 }}>🦉</Text>
                </View>
                <View style={p.finCardLabel}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase' }}>FIN TIP</Text>
                </View>
              </View>
              <Text style={p.finCardText}>
                Rebalancing keeps your portfolio aligned with your risk tolerance. A small fee keeps you disciplined — real brokerages charge fees too!
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  TAB 3 — ASSETS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderAssets = () => {
    const heldIds = new Set(holdings.map(h => h.assetId));
    const newRiskIfAdded = addingAsset ? (() => {
      const tempAllocs = { ...currentAllocations };
      const largest = [...holdings].sort((a, b) => (b.allocation ?? 0) - (a.allocation ?? 0))[0];
      if (largest) {
        tempAllocs[largest.assetId] = (tempAllocs[largest.assetId] ?? 0) - addAllocation;
      }
      tempAllocs[addingAsset.id] = addAllocation;
      return calculateRiskScore(tempAllocs);
    })() : 0;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={p.content} showsVerticalScrollIndicator={false}>
        {/* Browse all assets */}
        <Text style={p.sectionTitle}>ALL ASSETS</Text>
        {ASSETS.map(asset => {
          const held = heldIds.has(asset.id);
          const isAdding = addingAsset?.id === asset.id;
          return (
            <View key={asset.id}>
              <View style={p.assetRow}>
                <View style={[p.assetIcon, { backgroundColor: asset.color + '18' }]}>
                  <Text style={{ fontSize: 20 }}>{asset.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={p.assetName}>{asset.name}</Text>
                  <Text style={p.assetMeta}>{asset.category} · {asset.volatility} risk · {asset.annualReturn}% p.a.</Text>
                </View>
                {held ? (
                  <View style={p.heldBadge}>
                    <Text style={p.heldBadgeText}>Held ✓</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={p.addBtn}
                    onPress={() => { setAddingAsset(isAdding ? null : asset); setAddAllocation(10); }}
                    activeOpacity={0.8}
                  >
                    <Text style={p.addBtnText}>{isAdding ? '✕' : '+ Add'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Inline add confirmation */}
              {isAdding && (
                <View style={p.addPanel}>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: 8 }}>
                    Add {asset.name} to portfolio
                  </Text>
                  <Text style={p.metaText}>Allocation: {addAllocation}%</Text>
                  <Slider
                    style={{ width: '100%', height: 36 }}
                    minimumValue={5}
                    maximumValue={30}
                    step={1}
                    value={addAllocation}
                    onValueChange={v => setAddAllocation(Math.round(v))}
                    minimumTrackTintColor={asset.color}
                    maximumTrackTintColor={Colors.lightGray}
                    thumbTintColor={asset.color}
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={p.metaText}>New risk score</Text>
                    <Text style={[p.metaText, { fontFamily: Fonts.bold, color: getRiskLabel(newRiskIfAdded).color }]}>{newRiskIfAdded}</Text>
                  </View>
                  <Text style={[p.metaText, { marginBottom: 8 }]}>
                    Reduces largest holding by {addAllocation}%
                  </Text>
                  <TouchableOpacity style={[p.ctaBtn, { height: 44 }]} onPress={handleAddAsset} disabled={assetBusy} activeOpacity={0.8}>
                    {assetBusy ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={p.ctaBtnText}>Confirm Add</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* Remove assets section */}
        {holdings.length > 1 && (
          <>
            <Text style={[p.sectionTitle, { marginTop: 24 }]}>REMOVE HOLDINGS</Text>
            {holdings.map(h => {
              const isRemoving = removingAsset?.assetId === h.assetId;
              return (
                <View key={h.assetId}>
                  <View style={p.assetRow}>
                    <View style={[p.assetIcon, { backgroundColor: (h.color ?? Colors.primary) + '18' }]}>
                      <Text style={{ fontSize: 20 }}>{h.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={p.assetName}>{h.name}</Text>
                      <Text style={p.assetMeta}>{h.allocation}% allocation</Text>
                    </View>
                    <TouchableOpacity
                      style={[p.removeBtn, holdings.length <= 1 && { opacity: 0.3 }]}
                      onPress={() => setRemovingAsset(isRemoving ? null : h)}
                      disabled={holdings.length <= 1}
                      activeOpacity={0.8}
                    >
                      <Text style={p.removeBtnText}>{isRemoving ? '✕' : 'Remove'}</Text>
                    </TouchableOpacity>
                  </View>

                  {isRemoving && (
                    <View style={[p.addPanel, { borderColor: Colors.danger + '30' }]}>
                      <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.danger, marginBottom: 8 }}>
                        Remove {h.name}?
                      </Text>
                      <Text style={[p.metaText, { marginBottom: 12 }]}>
                        Its {h.allocation}% allocation will be redistributed equally across remaining holdings.
                      </Text>
                      <TouchableOpacity
                        style={[p.ctaBtn, { backgroundColor: Colors.danger, height: 44 }]}
                        onPress={() => handleRemoveAsset(h)}
                        disabled={assetBusy}
                        activeOpacity={0.8}
                      >
                        {assetBusy ? (
                          <ActivityIndicator color={Colors.white} />
                        ) : (
                          <Text style={p.ctaBtnText}>Confirm Remove</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Fin card */}
        <View style={[p.finCard, { marginTop: 16 }]}>
          <View style={p.finCardTop}>
            <View style={p.finCardAvatar}>
              <Text style={{ fontSize: 16 }}>🦉</Text>
            </View>
            <View style={p.finCardLabel}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase' }}>FIN TIP</Text>
            </View>
          </View>
          <Text style={p.finCardText}>
            Adding new assets increases diversification. Watch how different risk levels affect your overall portfolio score before confirming.
          </Text>
        </View>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  TAB 4 — PROJECTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const renderProjections = () => {
    const expReturn = calculateExpectedReturn(currentAllocations);
    const ffn = sim?.ffn ?? 999999999;

    const scenarios = [
      { label: 'Conservative', annualReturn: 4, dcaMultiplier: 1, color: MODULE_COLORS['module-1'].color },
      { label: 'Current', annualReturn: expReturn, dcaMultiplier: 1, color: MODULE_COLORS['module-4'].color },
      { label: 'Aggressive', annualReturn: 9, dcaMultiplier: 1.5, color: MODULE_COLORS['module-2'].color },
    ];

    const DCA_CHIPS = [0, 200, 500, 1000];

    const whatIfProjection10 = projectPortfolio(whatIfReturn, monthlyDCA + whatIfDCA, 10);
    const whatIfProjection20 = projectPortfolio(whatIfReturn, monthlyDCA + whatIfDCA, 20);

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={p.content} showsVerticalScrollIndicator={false}>
        {/* Scenario cards */}
        <Text style={p.sectionTitle}>SCENARIOS</Text>
        {scenarios.map((sc) => {
          const proj10 = projectPortfolio(sc.annualReturn, monthlyDCA * sc.dcaMultiplier, 10);
          const proj20 = projectPortfolio(sc.annualReturn, monthlyDCA * sc.dcaMultiplier, 20);
          const yrsToFI = yearsToFI(sc);

          return (
            <View key={sc.label} style={[p.card, { borderLeftWidth: 4, borderLeftColor: sc.color }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: sc.color }}>{sc.label}</Text>
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textMuted }}>{sc.annualReturn.toFixed(1)}% p.a.</Text>
              </View>
              {sc.dcaMultiplier > 1 && (
                <Text style={[p.metaText, { marginBottom: 6 }]}>+50% DCA boost</Text>
              )}

              {/* 10yr / 20yr */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                <View style={{ flex: 1, backgroundColor: sc.color + '10', borderRadius: Radii.md, padding: 10 }}>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 2 }}>10 Years</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CoinIcon size={14} />
                    <Text style={{ fontFamily: Fonts.extraBold, fontSize: 16, color: sc.color }}>{formatCoin(proj10)}</Text>
                  </View>
                </View>
                <View style={{ flex: 1, backgroundColor: sc.color + '10', borderRadius: Radii.md, padding: 10 }}>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 2 }}>20 Years</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <CoinIcon size={14} />
                    <Text style={{ fontFamily: Fonts.extraBold, fontSize: 16, color: sc.color }}>{formatCoin(proj20)}</Text>
                  </View>
                </View>
              </View>

              {/* FI progress */}
              <View style={{ backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.textSecondary }}>FI Number Progress</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <CoinIcon size={11} />
                    <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: Colors.textPrimary }}>{formatCoin(ffn)}</Text>
                  </View>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.border, marginBottom: 4 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: sc.color, width: `${Math.min(100, (proj20 / ffn) * 100)}%` }} />
                </View>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted }}>
                  {yrsToFI ? `~${yrsToFI} years to FI` : 'FI not reached in 50 years'}
                </Text>
              </View>
            </View>
          );
        })}

        {/* What-if calculator */}
        <Text style={[p.sectionTitle, { marginTop: 8 }]}>WHAT IF CALCULATOR</Text>
        <View style={p.card}>
          {/* DCA chips */}
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: 8 }}>Extra monthly DCA</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {DCA_CHIPS.map(chip => {
              const active = whatIfDCA === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  style={[p.chip, active && p.chipActive]}
                  onPress={() => setWhatIfDCA(chip)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    {chip > 0 && <CoinIcon size={12} />}
                    <Text style={[p.chipText, active && p.chipTextActive]}>
                      {chip === 0 ? 'No extra' : `+${formatCoin(chip)}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Return slider */}
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: 4 }}>
            Annual return: {whatIfReturn.toFixed(1)}%
          </Text>
          <Slider
            style={{ width: '100%', height: 36 }}
            minimumValue={3}
            maximumValue={12}
            step={0.5}
            value={whatIfReturn}
            onValueChange={v => setWhatIfReturn(v)}
            minimumTrackTintColor={MODULE_COLORS['module-4'].color}
            maximumTrackTintColor={Colors.lightGray}
            thumbTintColor={MODULE_COLORS['module-4'].color}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={p.metaText}>3%</Text>
            <Text style={p.metaText}>12%</Text>
          </View>

          {/* Projections result */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: MODULE_COLORS['module-4'].colorLight, borderRadius: Radii.md, padding: 12 }}>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 4 }}>10 Years</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <CoinIcon size={14} />
                <Text style={{ fontFamily: Fonts.extraBold, fontSize: 16, color: MODULE_COLORS['module-4'].color }}>{formatCoin(whatIfProjection10)}</Text>
              </View>
            </View>
            <View style={{ flex: 1, backgroundColor: MODULE_COLORS['module-4'].colorLight, borderRadius: Radii.md, padding: 12 }}>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 4 }}>20 Years</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <CoinIcon size={14} />
                <Text style={{ fontFamily: Fonts.extraBold, fontSize: 16, color: MODULE_COLORS['module-4'].color }}>{formatCoin(whatIfProjection20)}</Text>
              </View>
            </View>
          </View>

          {/* FI progress for what-if */}
          {(() => {
            const whatIfYears = (() => {
              let balance = portfolioBalance;
              const mr = whatIfReturn / 100 / 12;
              const dca = monthlyDCA + whatIfDCA;
              let m = 0;
              while (balance < ffn && m < 600) {
                balance += dca;
                balance *= (1 + mr);
                m++;
              }
              return m < 600 ? Math.round(m / 12 * 10) / 10 : null;
            })();
            return (
              <View style={{ marginTop: 12, backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: 10 }}>
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.textSecondary, marginBottom: 4 }}>
                  FI Number: <CoinIcon size={11} /> {formatCoin(ffn)}
                </Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: MODULE_COLORS['module-4'].color }}>
                  {whatIfYears ? `~${whatIfYears} years to reach FI` : 'FI not reached in 50 years'}
                </Text>
              </View>
            );
          })()}
        </View>

        {/* Fin card */}
        <View style={p.finCard}>
          <View style={p.finCardTop}>
            <View style={p.finCardAvatar}>
              <Text style={{ fontSize: 16 }}>🦉</Text>
            </View>
            <View style={p.finCardLabel}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase' }}>FIN TIP</Text>
            </View>
          </View>
          <Text style={p.finCardText}>
            Small increases in your monthly DCA can shave years off your FI timeline. Compound interest is your most powerful ally — time in the market beats timing the market.
          </Text>
        </View>
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onClose}>
      <View style={p.root}>
        <Header />
        <TabBar />
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Rebalance' && renderRebalance()}
        {activeTab === 'Assets' && renderAssets()}
        {activeTab === 'Projections' && renderProjections()}
      </View>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const p = StyleSheet.create({
  // Layout
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerBack: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.primary },
  headerTitle: { fontFamily: Fonts.bold, fontSize: 17, color: Colors.textPrimary },

  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  tabTextActive: { fontFamily: Fonts.bold, color: Colors.primary },

  // Cards
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2,
    color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase',
  },

  // Hero numbers
  heroNumber: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary },
  heroSmall: { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textPrimary },
  metaText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary },

  // Holdings
  holdingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border + '50',
  },
  holdingIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  holdingName: { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  holdingValue: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary },
  holdingPct: { fontFamily: Fonts.bold, fontSize: 14 },

  // Sparkline
  sparklineCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    ...Shadows.soft, marginBottom: 12,
  },
  sparklineTitle: {
    fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2,
    color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 12,
  },
  sparklineBars: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 64,
  },
  sparklineBar: { borderRadius: 3 },
  sparklineSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 8 },

  // Drift table header
  driftHeader: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },

  // Snap button
  snapBtn: {
    backgroundColor: MODULE_COLORS['module-1'].colorLight, borderRadius: Radii.md,
    height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  snapBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: MODULE_COLORS['module-1'].color },

  // Fee warning
  feeWarning: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF6A4' + '50', borderRadius: Radii.sm,
    padding: 10, marginTop: 10, justifyContent: 'center',
  },
  feeText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary },

  // CTA
  ctaBtn: {
    backgroundColor: Colors.primary, borderRadius: Radii.lg,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },

  // Asset list
  assetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border + '50',
  },
  assetIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  assetName: { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  assetMeta: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  heldBadge: {
    backgroundColor: Colors.successDark + '18', borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heldBadgeText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.successDark },
  addBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  addBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.primary },
  removeBtn: {
    backgroundColor: Colors.danger + '12', borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  removeBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.danger },
  addPanel: {
    backgroundColor: Colors.lightGray, borderRadius: Radii.md,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.primary + '30',
  },

  // Chips (projections)
  chip: {
    backgroundColor: Colors.lightGray, borderRadius: Radii.full,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  chipActive: { backgroundColor: MODULE_COLORS['module-4'].color },
  chipText: { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },

  // Fin card
  finCard: {
    backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16,
    marginBottom: 16, ...Shadows.soft,
  },
  finCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  finCardAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: MODULE_COLORS['module-1'].colorLight,
    alignItems: 'center', justifyContent: 'center',
  },
  finCardLabel: {
    backgroundColor: MODULE_COLORS['module-1'].colorLight,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radii.full, overflow: 'hidden',
  },
  finCardText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});
