// app/quests/quest-11.js
// Quest 11 — Diversify Portfolio
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image,
  StyleSheet, Dimensions,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { completeStage } from '../../lib/lifeSim';
import { Colors, Fonts, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const COIN = require('../../assets/coin.png');

// ─── Confetti ────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4F46E5', '#059669', '#F59E0B', '#EC4899', '#0891B2'];
function ConfettiPiece({ delay, color, startX, size }) {
  const y = useRef(new Animated.Value(-30)).current; const x = useRef(new Animated.Value(0)).current; const opacity = useRef(new Animated.Value(0)).current; const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => { const drift = (Math.random() - 0.5) * 160; setTimeout(() => { Animated.parallel([Animated.timing(y, { toValue: SH * 0.7, duration: 2400, useNativeDriver: true }), Animated.timing(x, { toValue: drift, duration: 2400, useNativeDriver: true }), Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0, duration: 700, delay: 1500, useNativeDriver: true })]), Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true })]).start(); }, delay); }, []);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() > 0.5 ? 540 : -720}deg`] });
  return <Animated.View style={{ position: 'absolute', left: startX, top: 0, width: size, height: size, borderRadius: Math.random() > 0.5 ? size / 2 : 2, backgroundColor: color, opacity, transform: [{ translateY: y }, { translateX: x }, { rotate: spin }] }} />;
}
function QConfetti() { const pieces = Array.from({ length: 50 }, (_, i) => ({ id: i, delay: Math.random() * 1000, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], startX: Math.random() * SW, size: 6 + Math.random() * 8 })); return <View style={StyleSheet.absoluteFill} pointerEvents="none">{pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}</View>; }

// ─── Constants ───────────────────────────────────────────────────────────────
const PIE_SIZE = 200;
const PIE_RADIUS = 80;
const PIE_CENTER = PIE_SIZE / 2;

const ASSETS = [
  // Investment vehicles (from Quest 8)
  { id: 'nestvault', name: 'NestVault', category: 'Robo-Advisor', realWorld: 'Syfe / StashAway', icon: '\uD83E\uDD16', annualReturn: 6.5, volatility: 'Medium', volatilityScore: 50, color: MODULE_COLORS['module-1'].color, description: 'Your existing robo-advisor. Diversified and automated. Keep it as your core holding or rebalance around it.', isVehicle: true },
  { id: 'drakon-rss', name: 'Drakon RSS Plan', category: 'ETF RSS Plan', realWorld: 'OCBC BCIP / Endowus', icon: '\uD83D\uDCCB', annualReturn: 5.5, volatility: 'Medium', volatilityScore: 45, color: MODULE_COLORS['module-2'].color, description: 'Your existing ETF RSS Plan. Steady monthly purchases into a diversified ETF basket. Keep it as your core holding.', isVehicle: true },
  { id: 'apextrade-diy', name: 'ApexTrade DIY', category: 'DIY ETF', realWorld: 'moomoo / Tiger Brokers', icon: '\uD83C\uDFAF', annualReturn: 6, volatility: 'Medium-High', volatilityScore: 60, color: MODULE_COLORS['module-3'].color, description: 'Your existing DIY ETF portfolio. Full control, lowest fees. Keep it as your core holding and diversify around it.', isVehicle: true },
  // Additional assets
  { id: 'apex-global', name: 'Apex Global 500 ETF', category: 'Stocks', realWorld: 'VWRA / VTI', icon: '\uD83C\uDF0D', annualReturn: 7, volatility: 'High', volatilityScore: 80, color: MODULE_COLORS['module-3'].color, description: 'Tracks 3,500+ companies across 50+ countries. Maximum diversification in a single fund.' },
  { id: 'sg-blue-chip', name: 'SG Blue Chip ETF', category: 'Stocks', realWorld: 'STI ETF (ES3)', icon: '\uD83C\uDDF8\uD83C\uDDEC', annualReturn: 5, volatility: 'Medium', volatilityScore: 55, color: '#E63946', description: 'Tracks Singapore\'s 30 largest listed companies. Lower fees, local exposure.' },
  { id: 'sg-reit', name: 'SG REIT Index', category: 'REITs', realWorld: 'Various S-REITs', icon: '\uD83C\uDFE2', annualReturn: 6, volatility: 'Medium', volatilityScore: 50, color: MODULE_COLORS['module-2'].color, description: 'Real estate investment trusts. Earn rental income + capital appreciation.' },
  { id: 'fsa-bond', name: 'FSA Government Bond', category: 'Bonds', realWorld: 'SSB / T-bills', icon: '\uD83D\uDCDC', annualReturn: 3.5, volatility: 'Low', volatilityScore: 15, color: MODULE_COLORS['module-1'].color, description: 'Government-backed bonds. Capital protection with steady, predictable returns.' },
  { id: 'drakon-fd', name: 'Drakon Fixed Deposit', category: 'Cash', realWorld: 'Bank FD', icon: '\uD83C\uDFE6', annualReturn: 2.8, volatility: 'None', volatilityScore: 0, color: '#457B9D', description: 'Fixed deposit locked for 12 months. Guaranteed return, zero volatility.' },
  { id: 'voltcoin', name: 'VoltCoin', category: 'Crypto', realWorld: 'BTC / ETH', icon: '\u26A1', annualReturn: 25, volatility: 'Extreme', volatilityScore: 100, color: '#F4A261', description: 'Extreme volatility. Can double or halve in months. Only for money you can afford to lose entirely.' },
  { id: 'gold-trust', name: 'Gold Trust ETF', category: 'Commodities', realWorld: 'GLD / SPDR Gold', icon: '\uD83E\uDD47', annualReturn: 4, volatility: 'Low-Medium', volatilityScore: 30, color: '#E9C46A', description: 'Tracks gold price. Historically performs well during market uncertainty.' },
];

const getStartingAsset = (vehicleId) => {
  const directMatch = ASSETS.find(a => a.id === vehicleId);
  if (directMatch) return directMatch;
  return ASSETS.find(a => a.id === 'apex-global') ?? ASSETS[0];
};

const calculateRiskScore = (allocs) => {
  const total = Object.values(allocs).reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  return Math.round(Object.entries(allocs).reduce((sum, [id, pct]) => {
    const asset = ASSETS.find(a => a.id === id);
    return sum + (asset?.volatilityScore ?? 0) * (pct / total);
  }, 0));
};

const getRiskLabel = (score) => {
  if (score <= 20) return { label: 'Very Low', color: '#457B9D' };
  if (score <= 40) return { label: 'Low', color: MODULE_COLORS['module-1'].color };
  if (score <= 60) return { label: 'Moderate', color: '#F4A261' };
  if (score <= 80) return { label: 'High', color: MODULE_COLORS['module-2'].color };
  return { label: 'Very High', color: '#E63946' };
};

const calculateExpectedReturn = (allocs) => {
  const total = Object.values(allocs).reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  return Object.entries(allocs).reduce((sum, [id, pct]) => {
    const asset = ASSETS.find(a => a.id === id);
    return sum + (asset?.annualReturn ?? 0) * (pct / total);
  }, 0);
};

const generatePiePaths = (allocs, selected) => {
  const total = Object.values(allocs).reduce((s, v) => s + v, 0);
  if (total === 0) return [];
  let startAngle = -Math.PI / 2;
  const paths = [];
  selected.forEach(assetId => {
    const pct = (allocs[assetId] ?? 0) / total;
    if (pct <= 0) return;
    const endAngle = startAngle + pct * 2 * Math.PI;
    const asset = ASSETS.find(a => a.id === assetId);
    const x1 = PIE_CENTER + PIE_RADIUS * Math.cos(startAngle);
    const y1 = PIE_CENTER + PIE_RADIUS * Math.sin(startAngle);
    const x2 = PIE_CENTER + PIE_RADIUS * Math.cos(endAngle);
    const y2 = PIE_CENTER + PIE_RADIUS * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    paths.push({ d: `M ${PIE_CENTER} ${PIE_CENTER} L ${x1} ${y1} A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`, color: asset?.color ?? Colors.border, pct: Math.round(pct * 100), assetId });
    startAngle = endAngle;
  });
  return paths;
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function Quest11({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  // ── Derived ──────────────────────────────────────────────────────────────
  const investmentWallet = (sim?.wallets ?? []).find(w => w.type === 'investment');
  const portfolioBalance = investmentWallet?.balance ?? 0;
  const vehicle = sim?.investmentVehicle ?? { name: 'Your Portfolio', icon: '\uD83D\uDCC8', id: 'nestvault' };
  const startingAsset = getStartingAsset(vehicle.id);

  // ── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [allocations, setAllocations] = useState({ [startingAsset.id]: 100 });
  const [selectedAssets, setSelectedAssets] = useState([startingAsset.id]);
  const [saving, setSaving] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Reset on open ────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep(1);
      setAllocations({ [startingAsset.id]: 100 });
      setSelectedAssets([startingAsset.id]);
      setSaving(false);
      setShowExitConfirm(false);
      setShowError(false);
      setShowConfetti(false);
    }
  }, [visible]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (step < 5) setShowExitConfirm(true);
    else onClose();
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      const holdings = selectedAssets.map(assetId => {
        const asset = ASSETS.find(a => a.id === assetId);
        const pct = allocations[assetId] ?? 0;
        return { assetId, name: asset?.name, icon: asset?.icon, color: asset?.color, allocation: pct, value: Math.round(portfolioBalance * pct / 100), annualReturn: asset?.annualReturn, volatilityScore: asset?.volatilityScore };
      });
      const updatedWallets = (sim?.wallets ?? []).map(w => w.type === 'investment' ? { ...w, holdings, riskScore: calculateRiskScore(allocations), expectedReturn: calculateExpectedReturn(allocations), diversified: true } : w);
      await updateDoc(doc(db, 'simProgress', uid), { wallets: updatedWallets, portfolioAllocations: allocations, portfolioRiskScore: calculateRiskScore(allocations), updatedAt: Date.now() });
      setSaving(false);
      setStep(5); setShowConfetti(true);
    } catch (e) { console.error('handleSave error:', e); setSaving(false); }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      await completeStage(uid, 'stage-11', { riskScore: calculateRiskScore(allocations), assetCount: selectedAssets.length });
      onComplete();
    } catch (e) { setShowError(true); setSaving(false); }
  };

  const toggleAsset = (assetId) => {
    if (assetId === startingAsset.id) return;
    if (selectedAssets.includes(assetId)) {
      // Remove asset — redistribute its allocation to starting asset
      const removedPct = allocations[assetId] ?? 0;
      setSelectedAssets(prev => prev.filter(id => id !== assetId));
      setAllocations(prev => {
        const next = { ...prev };
        delete next[assetId];
        next[startingAsset.id] = (next[startingAsset.id] ?? 0) + removedPct;
        return next;
      });
    } else {
      // Add asset — start at 10%, reduce starting asset by 10%
      setSelectedAssets(prev => [...prev, assetId]);
      setAllocations(prev => ({
        ...prev,
        [assetId]: 10,
        [startingAsset.id]: Math.max(10, (prev[startingAsset.id] ?? 100) - 10),
      }));
    }
  };

  const handleSliderChange = (assetId, newVal) => {
    const rounded = Math.round(newVal);
    setAllocations(prev => {
      const next = { ...prev, [assetId]: rounded };
      // Compensate via starting asset
      if (assetId !== startingAsset.id) {
        const othersTotal = Object.entries(next).reduce((sum, [id, v]) => id !== startingAsset.id ? sum + v : sum, 0);
        next[startingAsset.id] = Math.max(10, 100 - othersTotal);
      }
      return next;
    });
  };

  const totalAllocation = Object.values(allocations).reduce((s, v) => s + v, 0);
  const riskScore = calculateRiskScore(allocations);
  const riskInfo = getRiskLabel(riskScore);
  const expectedReturn = calculateExpectedReturn(allocations);
  const piePaths = generatePiePaths(allocations, selectedAssets);

  const getFinAdvice = (score) => {
    if (score <= 30) return 'Very conservative allocation. Your portfolio is built for stability. Lower returns, but you will sleep well during market volatility.';
    if (score <= 55) return 'Well balanced. You have spread risk across asset classes without sacrificing too much return potential. This is where most long-term investors land.';
    if (score <= 79) return 'Aggressive but manageable. High growth potential with meaningful volatility. Make sure you have an emergency fund before going this heavy on equities.';
    return 'Extreme risk. If VoltCoin drops 80%, your portfolio will feel it significantly. Only hold crypto if you genuinely can afford to lose that portion entirely.';
  };

  // ── Header ───────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 ? (
          <TouchableOpacity style={st.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={st.backBtnText}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 11 \u00B7 Diversify Portfolio'}</Text>
      <View style={st.stepPills}>{[1,2,3,4,5].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  // ── Fin card helper ──────────────────────────────────────────────────────
  const FinCard = ({ children }) => (
    <View style={st.finCard}>
      <View style={st.finCardTop}>
        <View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View>
        <Text style={st.finCardLabel}>FIN SAYS</Text>
      </View>
      <Text style={st.finCardText}>{children}</Text>
    </View>
  );

  // ── Step 1 — Why diversify? ──────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"Don't put all your\ncoins in one basket"}</Text>

        <FinCard>You currently have 100% of your portfolio in one asset. That is concentration risk {'\u2014'} if that one asset drops, your entire portfolio drops with it. Diversification spreads your money across different asset classes that do not all move together. When stocks fall, bonds often rise. When markets are volatile, gold tends to hold. The goal is not to maximise returns {'\u2014'} it is to smooth the ride.</FinCard>

        <View style={st.scenarioContainer}>
          {/* Concentrated */}
          <View style={[st.scenarioCard, { borderLeftColor: '#E63946' }]}>
            <Text style={st.scenarioTitle}>Concentrated (100% stocks)</Text>
            <View style={st.scenarioBarRow}>
              <Text style={st.scenarioBarLabel}>Stocks</Text>
              <View style={[st.scenarioBar, { width: '60%', backgroundColor: '#E63946' }]} />
              <Text style={[st.scenarioBarValue, { color: '#E63946' }]}>-30%</Text>
            </View>
            <View style={st.scenarioDivider} />
            <View style={st.scenarioBarRow}>
              <Text style={st.scenarioBarLabel}>Portfolio</Text>
              <View style={[st.scenarioBar, { width: '60%', backgroundColor: '#E63946' }]} />
              <Text style={[st.scenarioBarValue, { color: '#E63946' }]}>-30%</Text>
            </View>
          </View>

          {/* Diversified */}
          <View style={[st.scenarioCard, { borderLeftColor: Colors.successDark }]}>
            <Text style={st.scenarioTitle}>Diversified (mixed)</Text>
            <View style={st.scenarioBarRow}>
              <Text style={st.scenarioBarLabel}>Stocks</Text>
              <View style={[st.scenarioBar, { width: '60%', backgroundColor: '#E63946' }]} />
              <Text style={[st.scenarioBarValue, { color: '#E63946' }]}>-30%</Text>
            </View>
            <View style={st.scenarioBarRow}>
              <Text style={st.scenarioBarLabel}>Bonds</Text>
              <View style={[st.scenarioBar, { width: '16%', backgroundColor: Colors.successDark }]} />
              <Text style={[st.scenarioBarValue, { color: Colors.successDark }]}>+8%</Text>
            </View>
            <View style={st.scenarioBarRow}>
              <Text style={st.scenarioBarLabel}>Gold</Text>
              <View style={[st.scenarioBar, { width: '10%', backgroundColor: Colors.successDark }]} />
              <Text style={[st.scenarioBarValue, { color: Colors.successDark }]}>+5%</Text>
            </View>
            <View style={st.scenarioDivider} />
            <View style={st.scenarioBarRow}>
              <Text style={st.scenarioBarLabel}>Portfolio</Text>
              <View style={[st.scenarioBar, { width: '24%', backgroundColor: '#E63946' }]} />
              <Text style={[st.scenarioBarValue, { color: '#E63946' }]}>-12%</Text>
            </View>
            <Text style={st.scenarioNote}>Same crash {'\u2014'} but portfolio only drops 12% instead of 30%</Text>
          </View>
        </View>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}>
            <Text style={st.ctaBtnText}>{"Build my diversified portfolio \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 2 — Choose your assets ──────────────────────────────────────────
  const renderStep2 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"Add assets to\nyour portfolio"}</Text>
        <Text style={st.questSub}>Start from your existing position. Add at least 2 more asset classes.</Text>

        {/* Current asset */}
        <View style={[st.currentAssetCard, { borderLeftColor: startingAsset.color, borderLeftWidth: 4 }]}>
          <Text style={st.currentAssetLabel}>YOUR EXISTING INVESTMENT</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Text style={{ fontSize: 24 }}>{startingAsset.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.currentAssetName}>{startingAsset.name}</Text>
              <Text style={st.currentAssetCategory}>100% {'\u00B7'} FC {Math.round(portfolioBalance).toLocaleString()} {'\u00B7'} {startingAsset.category}</Text>
            </View>
            <View style={[st.lockedBadge, { backgroundColor: startingAsset.color + '20' }]}>
              <Text style={[st.lockedBadgeText, { color: startingAsset.color }]}>Core</Text>
            </View>
          </View>
          <Text style={st.currentAssetNote}>This stays in your portfolio. Add at least 2 more asset classes around it.</Text>
        </View>

        {/* Asset picker grid */}
        <View style={st.assetGrid}>
          {ASSETS.filter(a => !a.isVehicle || a.id === vehicle.id).map(asset => {
            const isStarting = asset.id === startingAsset.id;
            const isSelected = selectedAssets.includes(asset.id);
            return (
              <TouchableOpacity
                key={asset.id}
                style={[
                  st.assetChip,
                  isSelected && { borderColor: asset.color, borderWidth: 2 },
                  isStarting && { opacity: 0.7 },
                ]}
                onPress={() => toggleAsset(asset.id)}
                activeOpacity={0.8}
                disabled={isStarting}
              >
                <Text style={{ fontSize: 22 }}>{asset.icon}</Text>
                <Text style={st.assetChipName} numberOfLines={2}>{asset.name}</Text>
                <View style={[st.volatilityBadge, { backgroundColor: asset.color + '20' }]}>
                  <Text style={[st.volatilityBadgeText, { color: asset.color }]}>{asset.volatility}</Text>
                </View>
                {isStarting && <Text style={st.assetChipCurrent}>Current</Text>}
                {isSelected && !isStarting && <Text style={[st.assetChipCurrent, { color: asset.color }]}>{'\u2713'}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity
            style={[st.ctaBtn, selectedAssets.length < 3 && st.ctaBtnDisabled]}
            onPress={() => setStep(3)}
            disabled={selectedAssets.length < 3}
            activeOpacity={0.88}
          >
            <Text style={st.ctaBtnText}>{"Set my allocations \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 3 — Set allocations + live pie chart ────────────────────────────
  const renderStep3 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"How much in each?"}</Text>
        <Text style={st.questSub}>Adjust sliders until allocations add up to 100%</Text>

        {/* Pie chart */}
        <View style={st.pieContainer}>
          <Svg width={PIE_SIZE} height={PIE_SIZE}>
            <G>
              {piePaths.map((p, i) => (
                <Path key={i} d={p.d} fill={p.color} />
              ))}
              {/* Donut hole */}
              <Path
                d={`M ${PIE_CENTER} ${PIE_CENTER - 45} A 45 45 0 1 1 ${PIE_CENTER - 0.001} ${PIE_CENTER - 45} Z`}
                fill={Colors.background}
              />
            </G>
          </Svg>
          <View style={st.pieCentre}>
            <Text style={st.pieCentreScore}>{riskScore}</Text>
            <Text style={st.pieCentreLabel}>Risk</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={st.pieStats}>
          <View style={st.pieStatItem}>
            <Text style={st.pieStatLabel}>Risk Level</Text>
            <Text style={[st.pieStatValue, { color: riskInfo.color }]}>{riskInfo.label}</Text>
          </View>
          <View style={st.pieStatItem}>
            <Text style={st.pieStatLabel}>Expected Return</Text>
            <Text style={[st.pieStatValue, { color: Colors.primary }]}>{expectedReturn.toFixed(1)}%</Text>
          </View>
          <View style={st.pieStatItem}>
            <Text style={st.pieStatLabel}>Assets</Text>
            <Text style={st.pieStatValue}>{selectedAssets.length}</Text>
          </View>
        </View>

        {/* Allocation sliders */}
        {selectedAssets.map(assetId => {
          const asset = ASSETS.find(a => a.id === assetId);
          const pct = allocations[assetId] ?? 0;
          const isStarting = assetId === startingAsset.id;
          const fcValue = Math.round(portfolioBalance * pct / 100);
          return (
            <View key={assetId} style={st.allocationRow}>
              <View style={st.allocationHeader}>
                <Text style={{ fontSize: 18 }}>{asset?.icon}</Text>
                <Text style={st.allocationName} numberOfLines={1}>{asset?.name}</Text>
                <Text style={st.allocationPct}>{pct}%</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 36 }}
                minimumValue={isStarting ? 10 : 0}
                maximumValue={100}
                step={1}
                value={pct}
                onValueChange={(val) => handleSliderChange(assetId, val)}
                minimumTrackTintColor={asset?.color}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={asset?.color}
                disabled={isStarting && selectedAssets.length > 1}
              />
              <View style={st.allocationFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Image source={COIN} style={{ width: 11, height: 11 }} />
                  <Text style={st.allocationFcValue}>{fcValue.toLocaleString()}</Text>
                </View>
                {isStarting && <Text style={st.allocationMin}>min 10%</Text>}
              </View>
            </View>
          );
        })}

        {/* Total check */}
        <View style={[st.totalCheck, totalAllocation === 100 && st.totalCheckGood, totalAllocation !== 100 && st.totalCheckBad]}>
          <Text style={st.totalCheckText}>
            {totalAllocation}% allocated {totalAllocation === 100 ? ' \u2713 Perfect' : totalAllocation > 100 ? ' \u2014 Over by ' + (totalAllocation - 100) + '%' : ' \u2014 ' + (100 - totalAllocation) + '% remaining'}
          </Text>
        </View>

        {/* Fin advice based on risk */}
        <FinCard>{getFinAdvice(riskScore)}</FinCard>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity
            style={[st.ctaBtn, totalAllocation !== 100 && st.ctaBtnDisabled]}
            onPress={() => setStep(4)}
            disabled={totalAllocation !== 100}
            activeOpacity={0.88}
          >
            <Text style={st.ctaBtnText}>{"Lock in my allocation \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 4 — Confirm ─────────────────────────────────────────────────────
  const renderStep4 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"Your diversified portfolio"}</Text>

        {/* Static pie chart */}
        <View style={st.pieContainer}>
          <Svg width={PIE_SIZE} height={PIE_SIZE}>
            <G>
              {piePaths.map((p, i) => (
                <Path key={i} d={p.d} fill={p.color} />
              ))}
              <Path
                d={`M ${PIE_CENTER} ${PIE_CENTER - 45} A 45 45 0 1 1 ${PIE_CENTER - 0.001} ${PIE_CENTER - 45} Z`}
                fill={Colors.background}
              />
            </G>
          </Svg>
          <View style={st.pieCentre}>
            <Text style={st.pieCentreScore}>{riskScore}</Text>
            <Text style={st.pieCentreLabel}>Risk</Text>
          </View>
        </View>

        {/* Breakdown list */}
        <View style={st.summaryCard}>
          {selectedAssets.map(assetId => {
            const asset = ASSETS.find(a => a.id === assetId);
            const pct = allocations[assetId] ?? 0;
            const fcValue = Math.round(portfolioBalance * pct / 100);
            return (
              <View key={assetId} style={st.confirmRow}>
                <View style={[st.confirmDot, { backgroundColor: asset?.color }]} />
                <Text style={{ fontSize: 16 }}>{asset?.icon}</Text>
                <Text style={st.confirmName} numberOfLines={1}>{asset?.name}</Text>
                <Text style={st.confirmPct}>{pct}%</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Image source={COIN} style={{ width: 11, height: 11 }} />
                  <Text style={st.confirmFc}>{fcValue.toLocaleString()}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Risk vs return summary */}
        <View style={st.riskReturnCard}>
          <View style={st.riskReturnRow}>
            <Text style={st.riskReturnLabel}>Risk score</Text>
            <Text style={[st.riskReturnValue, { color: riskInfo.color }]}>{riskScore} {'\u00B7'} {riskInfo.label}</Text>
          </View>
          <View style={st.riskReturnRow}>
            <Text style={st.riskReturnLabel}>Expected return</Text>
            <Text style={[st.riskReturnValue, { color: Colors.primary }]}>{expectedReturn.toFixed(1)}% p.a.</Text>
          </View>
          <View style={st.riskReturnRow}>
            <Text style={st.riskReturnLabel}>Asset count</Text>
            <Text style={st.riskReturnValue}>{selectedAssets.length}</Text>
          </View>
        </View>

        <FinCard>This is your diversified portfolio. Different assets, different risk profiles, different market behaviours. When one zigs, another zags. That is the point. Keep rebalancing quarterly and you will stay on target.</FinCard>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={[st.ctaBtn, saving && st.ctaBtnDisabled]} onPress={handleSave} disabled={saving} activeOpacity={0.88}>
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Save my portfolio \u2192"}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 5 — Success ─────────────────────────────────────────────────────
  const renderStep5 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"Portfolio diversified"}</Text>

        <View style={[st.unlockCard, { backgroundColor: '#E0F5F0' }]}>
          <Text style={[st.unlockPill, { color: '#059669', backgroundColor: '#D1FAE5' }]}>{'\uD83D\uDD13'} UNLOCKED</Text>
          <Text style={st.unlockText}>Portfolio diversified. Risk spread across asset classes.</Text>
          <View style={[st.unlockDivider, { backgroundColor: '#059669' }]} />
          <Text style={[st.unlockHint, { color: '#059669' }]}>{'\u2696\uFE0F'} Quest 4.6 {'\u2014'} Rebalance Portfolio now unlocked</Text>
        </View>

        <FinCard>A single-asset portfolio is a gamble. A diversified portfolio is a strategy. You have just made the most important structural improvement to your investments. Quest 4.6 teaches you how to maintain this allocation over time {'\u2014'} because markets will drift it, and you will need to correct it.</FinCard>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={[st.ctaBtn, saving && st.ctaBtnDisabled]} onPress={handleComplete} disabled={saving} activeOpacity={0.88}>
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Back to FinCity \u2192"}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
        <View style={st.backdrop}>
          <View style={st.card}>
            {showConfetti && <QConfetti />}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </View>
        </View>
      </Modal>
      <Modal visible={showExitConfirm} transparent animationType="fade"><View style={st.alertBg}><View style={st.alertCard}><Text style={st.alertEmoji}>{'\uD83D\uDC1F'}</Text><Text style={st.alertTitle}>Leave this quest?</Text><Text style={st.alertBody}>Your progress in this step won't be saved.</Text><View style={st.alertBtns}><TouchableOpacity style={st.alertCancel} onPress={() => setShowExitConfirm(false)}><Text style={st.alertCancelText}>Stay</Text></TouchableOpacity><TouchableOpacity style={st.alertConfirm} onPress={() => { setShowExitConfirm(false); onClose(); }}><Text style={st.alertConfirmText}>Leave</Text></TouchableOpacity></View></View></View></Modal>
      <Modal visible={showError} transparent animationType="fade"><View style={st.alertBg}><View style={st.alertCard}><Text style={st.alertEmoji}>{'\uD83D\uDE2C'}</Text><Text style={st.alertTitle}>Something went wrong</Text><Text style={st.alertBody}>Please try again.</Text><View style={st.alertBtns}><TouchableOpacity style={st.alertConfirm} onPress={() => setShowError(false)}><Text style={st.alertConfirmText}>OK</Text></TouchableOpacity></View></View></View></Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: Colors.background, borderRadius: 24, width: '100%', maxHeight: '90%', overflow: 'hidden' },

  header: { flexDirection: 'column', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 14 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  backBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.primary },
  headerTitle: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 13, color: Colors.textMuted },
  stepPills: { flexDirection: 'row', gap: 4, alignSelf: 'center' },
  stepPill: { height: 4, width: 24, borderRadius: 2, backgroundColor: Colors.border },
  stepPillActive: { backgroundColor: Colors.primary, width: 32 },

  content: { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 32 },
  questTitle: { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textPrimary, lineHeight: 30, marginTop: 20, marginBottom: 12, textAlign: 'center' },
  questSub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 24, marginBottom: 28, textAlign: 'center', paddingHorizontal: 8 },
  bold: { fontFamily: Fonts.extraBold },
  infoText: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, lineHeight: 26, marginBottom: 18, textAlign: 'center', paddingHorizontal: 8 },

  finCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  finCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  finCardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: MODULE_COLORS['module-1'].colorLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  finCardLabel: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: MODULE_COLORS['module-1'].colorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden' },
  finCardText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Step 1 — Scenario cards
  scenarioContainer: { gap: 12, marginBottom: 16 },
  scenarioCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, borderLeftWidth: 4, ...Shadows.soft },
  scenarioTitle: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary, marginBottom: 12 },
  scenarioBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  scenarioBarLabel: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, width: 52 },
  scenarioBar: { height: 8, borderRadius: 4 },
  scenarioBarValue: { fontFamily: Fonts.bold, fontSize: 13 },
  scenarioDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  scenarioNote: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.successDark, marginTop: 4, fontStyle: 'italic' },

  // Step 2 — Asset picker
  currentAssetCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, marginBottom: 20, ...Shadows.soft },
  currentAssetLabel: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1, color: Colors.textMuted, marginBottom: 8 },
  currentAssetName: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  currentAssetCategory: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  currentAssetNote: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
  lockedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  lockedBadgeText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.5 },
  assetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  assetChip: { width: '47%', backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.soft },
  assetChipName: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary, textAlign: 'center', lineHeight: 16 },
  assetChipCurrent: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  volatilityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full },
  volatilityBadgeText: { fontFamily: Fonts.bold, fontSize: 10 },

  // Step 3 — Pie chart + sliders
  pieContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 16, alignSelf: 'center' },
  pieCentre: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pieCentreScore: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary },
  pieCentreLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: -2 },
  pieStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, paddingHorizontal: 8 },
  pieStatItem: { alignItems: 'center', gap: 4 },
  pieStatLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  pieStatValue: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary },

  allocationRow: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, marginBottom: 10, ...Shadows.soft },
  allocationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allocationName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  allocationPct: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  allocationFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  allocationFcValue: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  allocationMin: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' },

  totalCheck: { borderRadius: Radii.lg, padding: 12, alignItems: 'center', marginBottom: 16 },
  totalCheckGood: { backgroundColor: '#D1FAE5' },
  totalCheckBad: { backgroundColor: '#FEE2E2' },
  totalCheckText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },

  // Step 4 — Confirm
  summaryCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 12, ...Shadows.soft },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  confirmDot: { width: 10, height: 10, borderRadius: 5 },
  confirmName: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  confirmPct: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary, marginRight: 4 },
  confirmFc: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  riskReturnCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  riskReturnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  riskReturnLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  riskReturnValue: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },

  // Step 5 — Success
  unlockCard: { backgroundColor: MODULE_COLORS['module-1'].colorLight, borderRadius: Radii.lg, padding: 16, marginBottom: 16, width: '100%' },
  unlockPill: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: MODULE_COLORS['module-1'].colorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 8 },
  unlockText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginBottom: 10 },
  unlockDivider: { height: 1, backgroundColor: MODULE_COLORS['module-1'].color, opacity: 0.2, marginBottom: 10 },
  unlockHint: { fontFamily: Fonts.regular, fontSize: 12, color: MODULE_COLORS['module-1'].color },

  ctaBtn: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },

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
});
