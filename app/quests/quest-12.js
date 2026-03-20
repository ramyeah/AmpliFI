// app/quests/quest-12.js
// Quest 12 — Rebalance Portfolio
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image,
  StyleSheet, Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc, increment } from 'firebase/firestore';
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

// ─── Assets & Helpers ─────────────────────────────────────────────────────────
const ASSETS = [
  { id: 'nestvault', name: 'NestVault', category: 'Robo-Advisor', realWorld: 'Syfe / StashAway', icon: '\uD83E\uDD16', annualReturn: 6.5, volatility: 'Medium', volatilityScore: 50, color: MODULE_COLORS['module-1'].color, description: 'Your existing robo-advisor. Diversified and automated. Keep it as your core holding or rebalance around it.', isVehicle: true },
  { id: 'drakon-rss', name: 'Drakon RSS Plan', category: 'ETF RSS Plan', realWorld: 'OCBC BCIP / Endowus', icon: '\uD83D\uDCCB', annualReturn: 5.5, volatility: 'Medium', volatilityScore: 45, color: MODULE_COLORS['module-2'].color, description: 'Your existing ETF RSS Plan. Steady monthly purchases into a diversified ETF basket. Keep it as your core holding.', isVehicle: true },
  { id: 'apextrade-diy', name: 'ApexTrade DIY', category: 'DIY ETF', realWorld: 'moomoo / Tiger Brokers', icon: '\uD83C\uDFAF', annualReturn: 6, volatility: 'Medium-High', volatilityScore: 60, color: MODULE_COLORS['module-3'].color, description: 'Your existing DIY ETF portfolio. Full control, lowest fees. Keep it as your core holding and diversify around it.', isVehicle: true },
  { id: 'apex-global', name: 'Apex Global 500 ETF', category: 'Stocks', realWorld: 'VWRA / VTI', icon: '\uD83C\uDF0D', annualReturn: 7, volatility: 'High', volatilityScore: 80, color: MODULE_COLORS['module-3'].color, description: 'Tracks 3,500+ companies across 50+ countries. Maximum diversification in a single fund.' },
  { id: 'sg-blue-chip', name: 'SG Blue Chip ETF', category: 'Stocks', realWorld: 'STI ETF (ES3)', icon: '\uD83C\uDDF8\uD83C\uDDEC', annualReturn: 5, volatility: 'Medium', volatilityScore: 55, color: '#E63946', description: 'Tracks Singapore\'s 30 largest listed companies. Lower fees, local exposure.' },
  { id: 'sg-reit', name: 'SG REIT Index', category: 'REITs', realWorld: 'Various S-REITs', icon: '\uD83C\uDFE2', annualReturn: 6, volatility: 'Medium', volatilityScore: 50, color: MODULE_COLORS['module-2'].color, description: 'Real estate investment trusts. Earn rental income + capital appreciation.' },
  { id: 'fsa-bond', name: 'FSA Government Bond', category: 'Bonds', realWorld: 'SSB / T-bills', icon: '\uD83D\uDCDC', annualReturn: 3.5, volatility: 'Low', volatilityScore: 15, color: MODULE_COLORS['module-1'].color, description: 'Government-backed bonds. Capital protection with steady, predictable returns.' },
  { id: 'drakon-fd', name: 'Drakon Fixed Deposit', category: 'Cash', realWorld: 'Bank FD', icon: '\uD83C\uDFE6', annualReturn: 2.8, volatility: 'None', volatilityScore: 0, color: '#457B9D', description: 'Fixed deposit locked for 12 months. Guaranteed return, zero volatility.' },
  { id: 'voltcoin', name: 'VoltCoin', category: 'Crypto', realWorld: 'BTC / ETH', icon: '\u26A1', annualReturn: 25, volatility: 'Extreme', volatilityScore: 100, color: '#F4A261', description: 'Extreme volatility. Can double or halve in months. Only for money you can afford to lose entirely.' },
  { id: 'gold-trust', name: 'Gold Trust ETF', category: 'Commodities', realWorld: 'GLD / SPDR Gold', icon: '\uD83E\uDD47', annualReturn: 4, volatility: 'Low-Medium', volatilityScore: 30, color: '#E9C46A', description: 'Tracks gold price. Historically performs well during market uncertainty.' },
];

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

// ─── Scripted drift ───────────────────────────────────────────────────────────
const DRIFT_MAP = { 'apex-global': 8, 'sg-blue-chip': 5, 'sg-reit': 3, 'fsa-bond': -6, 'drakon-fd': -5, 'gold-trust': -2, 'voltcoin': 12, 'nestvault': 6, 'drakon-rss': 4, 'apextrade-diy': 5 };

// ─── Component ────────────────────────────────────────────────────────────────
export default function Quest12({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  // ── Derived ──────────────────────────────────────────────────────────────
  const investmentWallet = (sim?.wallets ?? []).find(w => w.type === 'investment');
  const portfolioBalance = investmentWallet?.balance ?? 0;
  const holdings = investmentWallet?.holdings ?? [];
  const targetAllocations = sim?.portfolioAllocations ?? {};

  const normalisedHoldings = (() => {
    const scripted = holdings.map(h => ({ ...h, allocation: Math.max(0, (h.allocation ?? 0) + (DRIFT_MAP[h.assetId] ?? 0)) }));
    const total = scripted.reduce((s, h) => s + (h.allocation ?? 0), 0);
    return scripted.map(h => ({ ...h, allocation: Math.round((h.allocation / (total || 1)) * 100), value: Math.round(portfolioBalance * (h.allocation / (total || 1))) }));
  })();

  // ── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [rebalanceAllocations, setRebalanceAllocations] = useState(Object.fromEntries(normalisedHoldings.map(h => [h.assetId, h.allocation])));
  const [saving, setSaving] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Reset on open ────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep(1);
      setRebalanceAllocations(Object.fromEntries(normalisedHoldings.map(h => [h.assetId, h.allocation])));
      setSaving(false);
      setShowExitConfirm(false);
      setShowError(false);
      setShowConfetti(false);
    }
  }, [visible]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (step < 3) setShowExitConfirm(true);
    else onClose();
  };

  const rebalanceFee = Math.round(portfolioBalance * 0.001);

  const handleComplete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      const newBalance = portfolioBalance - rebalanceFee;
      const updatedHoldings = normalisedHoldings.map(h => ({ ...h, allocation: rebalanceAllocations[h.assetId] ?? h.allocation, value: Math.round(newBalance * (rebalanceAllocations[h.assetId] ?? h.allocation) / 100) }));
      const updatedWallets = (sim?.wallets ?? []).map(w => w.type === 'investment' ? { ...w, balance: newBalance, holdings: updatedHoldings, riskScore: calculateRiskScore(rebalanceAllocations), expectedReturn: calculateExpectedReturn(rebalanceAllocations) } : w);
      await updateDoc(doc(db, 'users', uid), { finCoins: increment(-rebalanceFee) });
      await updateDoc(doc(db, 'simProgress', uid), { wallets: updatedWallets, portfolioAllocations: rebalanceAllocations, portfolioRiskScore: calculateRiskScore(rebalanceAllocations), lastRebalancedMonth: sim?.currentMonth ?? 1, updatedAt: Date.now() });
      await completeStage(uid, 'stage-12', { riskScore: calculateRiskScore(rebalanceAllocations), fee: rebalanceFee });
      setSaving(false);
      setStep(3);
      setShowConfetti(true);
    } catch (e) { console.error('handleComplete error:', e); setSaving(false); setShowError(true); }
  };

  const handleSliderChange = (assetId, newVal) => {
    const rounded = Math.round(newVal);
    setRebalanceAllocations(prev => {
      const next = { ...prev, [assetId]: rounded };
      // Find the most overweight other holding and compensate
      const otherIds = Object.keys(next).filter(id => id !== assetId);
      const diff = Object.values(next).reduce((s, v) => s + v, 0) - 100;
      if (diff !== 0 && otherIds.length > 0) {
        // Find the most overweight holding relative to target
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
    const targetEntries = normalisedHoldings.map(h => [h.assetId, targetAllocations[h.assetId] ?? h.allocation]);
    setRebalanceAllocations(Object.fromEntries(targetEntries));
  };

  const totalAllocation = Object.values(rebalanceAllocations).reduce((s, v) => s + v, 0);
  const riskScore = calculateRiskScore(rebalanceAllocations);
  const riskInfo = getRiskLabel(riskScore);
  const expectedReturn = calculateExpectedReturn(rebalanceAllocations);

  const getDriftColor = (drift) => {
    if (drift > 5) return '#F4A261';
    if (drift < -5) return '#457B9D';
    return Colors.textMuted;
  };

  const getDriftCount = () => {
    let big = 0; let corrected = 0;
    normalisedHoldings.forEach(h => {
      const target = targetAllocations[h.assetId] ?? 0;
      const current = rebalanceAllocations[h.assetId] ?? 0;
      const drift = Math.abs(current - target);
      if (drift > 5) big++;
      else corrected++;
    });
    return { big, corrected, total: normalisedHoldings.length };
  };

  const getFinRebalanceAdvice = () => {
    const { big, total } = getDriftCount();
    if (big > total / 2) return 'Several holdings need significant correction. The overweight assets have grown beyond their target \u2014 selling them and buying the underweight ones brings your risk profile back on track.';
    if (big > 0) return 'Getting there. Each holding you correct brings your portfolio closer to your intended risk level.';
    return 'Clean. Your portfolio is back on target. The expected return and risk profile now match what you designed in Quest 4.5.';
  };

  // ── Header ───────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 && step < 3 ? (
          <TouchableOpacity style={st.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={st.backBtnText}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 12 \u00B7 Rebalance Portfolio'}</Text>
      <View style={st.stepPills}>{[1,2,3].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
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

  // ── Step 1 — Your portfolio has drifted ──────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"Your portfolio\nhas drifted"}</Text>

        <FinCard>After the market dip and recovery, your assets grew at different rates. Stocks recovered faster than bonds. Gold moved independently. The result is that your portfolio no longer matches the allocation you carefully set. This is called drift {'\u2014'} and it happens to every portfolio. The fix is rebalancing.</FinCard>

        {/* Drift table */}
        <View style={st.driftTable}>
          <View style={st.driftTableHeader}>
            <Text style={[st.driftTableHeaderText, { flex: 1 }]}>Asset</Text>
            <Text style={[st.driftTableHeaderText, { width: 50, textAlign: 'center' }]}>Target</Text>
            <Text style={[st.driftTableHeaderText, { width: 50, textAlign: 'center' }]}>Now</Text>
            <Text style={[st.driftTableHeaderText, { width: 50, textAlign: 'center' }]}>Drift</Text>
          </View>
          {normalisedHoldings.map(h => {
            const asset = ASSETS.find(a => a.id === h.assetId);
            const target = targetAllocations[h.assetId] ?? 0;
            const drift = h.allocation - target;
            return (
              <View key={h.assetId} style={st.driftTableRow}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14 }}>{asset?.icon}</Text>
                  <Text style={st.driftTableAssetName} numberOfLines={1}>{asset?.name}</Text>
                </View>
                <Text style={[st.driftTableCell, { width: 50 }]}>{target}%</Text>
                <Text style={[st.driftTableCell, { width: 50 }]}>{h.allocation}%</Text>
                <Text style={[st.driftTableCell, { width: 50, color: getDriftColor(drift), fontFamily: Fonts.bold }]}>
                  {drift > 0 ? '+' : ''}{drift}%
                </Text>
              </View>
            );
          })}
        </View>

        {/* Explanation card */}
        <View style={st.driftExplanation}>
          <Text style={st.driftExplanationRow}>{'\uD83D\uDD34'} <Text style={st.bold}>Overweight</Text> assets grew more than expected {'\u2014'} they now take up more of your portfolio than planned.</Text>
          <Text style={st.driftExplanationRow}>{'\uD83D\uDD35'} <Text style={st.bold}>Underweight</Text> assets grew less {'\u2014'} they now take up less than planned.</Text>
          <Text style={[st.driftExplanationRow, { marginBottom: 0 }]}><Text style={st.bold}>Rebalancing sells the overweight and buys the underweight {'\u2014'} back to your target.</Text></Text>
        </View>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}>
            <Text style={st.ctaBtnText}>{"Rebalance my portfolio \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 2 — Rebalance sliders ───────────────────────────────────────────
  const renderStep2 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"Correct your allocation"}</Text>
        <Text style={st.questSub}>Adjust sliders back toward your target. Or change your target entirely.</Text>

        {/* Auto-rebalance button */}
        <TouchableOpacity style={st.snapBtn} onPress={snapToTarget} activeOpacity={0.8}>
          <Text style={st.snapBtnText}>{'\u21BA'} Snap to original target</Text>
        </TouchableOpacity>

        {/* Allocation sliders */}
        {normalisedHoldings.map(h => {
          const asset = ASSETS.find(a => a.id === h.assetId);
          const target = targetAllocations[h.assetId] ?? 0;
          const current = rebalanceAllocations[h.assetId] ?? 0;
          const drift = current - target;
          const fcValue = Math.round(portfolioBalance * current / 100);
          return (
            <View key={h.assetId} style={st.rebalanceRow}>
              <View style={st.rebalanceHeader}>
                <Text style={{ fontSize: 18 }}>{asset?.icon}</Text>
                <Text style={st.rebalanceName} numberOfLines={1}>{asset?.name}</Text>
                <Text style={st.rebalancePct}>{current}%</Text>
              </View>
              <View style={st.rebalanceTargetRow}>
                <Text style={st.rebalanceTargetLabel}>Target: {target}%</Text>
                <Text style={[st.rebalanceDriftLabel, { color: getDriftColor(drift) }]}>
                  {drift > 0 ? '+' : ''}{drift}%
                </Text>
              </View>
              {/* Dual bar */}
              <View style={st.dualBarContainer}>
                <View style={[st.dualBarTarget, { width: `${target}%` }]} />
                <View style={[st.dualBarCurrent, { width: `${current}%`, backgroundColor: asset?.color ?? Colors.primary }]} />
              </View>
              <Slider
                style={{ width: '100%', height: 36 }}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={current}
                onValueChange={(val) => handleSliderChange(h.assetId, val)}
                minimumTrackTintColor={asset?.color}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={asset?.color}
              />
              <View style={st.rebalanceFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Image source={COIN} style={{ width: 11, height: 11 }} />
                  <Text style={st.rebalanceFcValue}>{fcValue.toLocaleString()}</Text>
                </View>
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

        {/* Fin advice reacting to drift correction */}
        <FinCard>{getFinRebalanceAdvice()}</FinCard>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity
            style={[st.ctaBtn, (totalAllocation !== 100 || saving) && st.ctaBtnDisabled]}
            onPress={async () => { await handleComplete(); }}
            disabled={totalAllocation !== 100 || saving}
            activeOpacity={0.88}
          >
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Confirm rebalance \u2192"}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 3 — Success ─────────────────────────────────────────────────────
  const renderStep3 = () => {
    const changedHoldings = normalisedHoldings.filter(h => {
      const newAlloc = rebalanceAllocations[h.assetId] ?? h.allocation;
      return newAlloc !== h.allocation;
    });
    const newRiskScore = calculateRiskScore(rebalanceAllocations);
    const newRiskInfo = getRiskLabel(newRiskScore);
    const newExpectedReturn = calculateExpectedReturn(rebalanceAllocations);

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>{"Rebalance complete"}</Text>

          {/* Before/after summary */}
          {changedHoldings.length > 0 && (
            <View style={st.summaryCard}>
              <Text style={st.summaryCardTitle}>Changes Made</Text>
              <View style={st.summaryTableHeader}>
                <Text style={[st.summaryTableHeaderText, { flex: 1 }]}>Asset</Text>
                <Text style={[st.summaryTableHeaderText, { width: 50, textAlign: 'center' }]}>Before</Text>
                <Text style={[st.summaryTableHeaderText, { width: 50, textAlign: 'center' }]}>After</Text>
                <Text style={[st.summaryTableHeaderText, { width: 50, textAlign: 'center' }]}>Change</Text>
              </View>
              {changedHoldings.map(h => {
                const asset = ASSETS.find(a => a.id === h.assetId);
                const newAlloc = rebalanceAllocations[h.assetId] ?? h.allocation;
                const change = newAlloc - h.allocation;
                return (
                  <View key={h.assetId} style={st.summaryTableRow}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14 }}>{asset?.icon}</Text>
                      <Text style={st.summaryTableAssetName} numberOfLines={1}>{asset?.name}</Text>
                    </View>
                    <Text style={[st.summaryTableCell, { width: 50 }]}>{h.allocation}%</Text>
                    <Text style={[st.summaryTableCell, { width: 50 }]}>{newAlloc}%</Text>
                    <Text style={[st.summaryTableCell, { width: 50, color: change > 0 ? Colors.successDark : '#E63946', fontFamily: Fonts.bold }]}>
                      {change > 0 ? '+' : ''}{change}%
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Fee card */}
          <View style={st.feeCard}>
            <Text style={st.feeCardLabel}>REBALANCING FEE</Text>
            <View style={st.feeCardValueRow}>
              <Image source={COIN} style={{ width: 16, height: 16 }} />
              <Text style={st.feeCardValue}>-{rebalanceFee.toLocaleString()}</Text>
            </View>
            <Text style={st.feeCardNote}>0.1% of portfolio value {'\u00B7'} Covers transaction costs for buying and selling assets</Text>
          </View>

          {/* New expected return & risk score */}
          <View style={st.riskReturnCard}>
            <View style={st.riskReturnRow}>
              <Text style={st.riskReturnLabel}>Risk score</Text>
              <Text style={[st.riskReturnValue, { color: newRiskInfo.color }]}>{newRiskScore} {'\u00B7'} {newRiskInfo.label}</Text>
            </View>
            <View style={st.riskReturnRow}>
              <Text style={st.riskReturnLabel}>Expected return</Text>
              <Text style={[st.riskReturnValue, { color: Colors.primary }]}>{newExpectedReturn.toFixed(1)}% p.a.</Text>
            </View>
          </View>

          {/* Unlock card */}
          <View style={[st.unlockCard, { backgroundColor: '#E0F5F0' }]}>
            <Text style={[st.unlockPill, { color: '#059669', backgroundColor: '#D1FAE5' }]}>{'\uD83D\uDD13'} UNLOCKED</Text>
            <Text style={st.unlockText}>Portfolio rebalanced. Strategy maintained.</Text>
            <View style={[st.unlockDivider, { backgroundColor: '#059669' }]} />
            <Text style={[st.unlockHint, { color: '#059669' }]}>{'\u2696\uFE0F'} Rebalance tool now available in your Portfolio tab anytime</Text>
          </View>

          <FinCard>Rebalancing is not exciting. That is the point. It is the discipline of maintaining your strategy even when individual assets are doing well or badly. Investors who rebalance regularly outperform those who let drift accumulate. Set a reminder to check quarterly.</FinCard>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={st.ctaBtn} onPress={onComplete} activeOpacity={0.88}>
              <Text style={st.ctaBtnText}>{"Back to FinCity \u2192"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

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

  finCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  finCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  finCardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: MODULE_COLORS['module-1'].colorLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  finCardLabel: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: MODULE_COLORS['module-1'].colorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden' },
  finCardText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Step 1 — Drift table
  driftTable: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, marginBottom: 16, ...Shadows.soft },
  driftTableHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
  driftTableHeaderText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  driftTableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  driftTableAssetName: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textPrimary, flex: 1 },
  driftTableCell: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textPrimary, textAlign: 'center' },

  driftExplanation: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  driftExplanationRow: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: 10 },

  // Step 2 — Rebalance sliders
  snapBtn: { backgroundColor: Colors.primaryLight, borderRadius: Radii.lg, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'center', marginBottom: 20 },
  snapBtnText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.primary },

  rebalanceRow: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, marginBottom: 10, ...Shadows.soft },
  rebalanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rebalanceName: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  rebalancePct: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  rebalanceTargetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 4 },
  rebalanceTargetLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  rebalanceDriftLabel: { fontFamily: Fonts.bold, fontSize: 11 },
  rebalanceFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  rebalanceFcValue: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  dualBarContainer: { height: 8, borderRadius: 4, backgroundColor: Colors.border, marginBottom: 2, overflow: 'hidden', position: 'relative' },
  dualBarTarget: { position: 'absolute', top: 0, left: 0, height: 8, borderRadius: 4, backgroundColor: Colors.lightGray, opacity: 0.7 },
  dualBarCurrent: { position: 'absolute', top: 0, left: 0, height: 8, borderRadius: 4 },

  totalCheck: { borderRadius: Radii.lg, padding: 12, alignItems: 'center', marginBottom: 16 },
  totalCheckGood: { backgroundColor: '#D1FAE5' },
  totalCheckBad: { backgroundColor: '#FEE2E2' },
  totalCheckText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },

  // Step 3 — Summary
  summaryCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 12, ...Shadows.soft },
  summaryCardTitle: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryTableHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 4 },
  summaryTableHeaderText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  summaryTableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  summaryTableAssetName: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textPrimary, flex: 1 },
  summaryTableCell: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textPrimary, textAlign: 'center' },

  feeCard: { backgroundColor: '#FFF7ED', borderRadius: Radii.lg, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#F4A261' },
  feeCardLabel: { fontFamily: Fonts.bold, fontSize: 10, color: '#F4A261', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  feeCardValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  feeCardValue: { fontFamily: Fonts.extraBold, fontSize: 20, color: '#E63946' },
  feeCardNote: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  riskReturnCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  riskReturnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  riskReturnLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  riskReturnValue: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },

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
