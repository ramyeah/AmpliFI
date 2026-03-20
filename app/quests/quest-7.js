// app/quests/quest-7.js
// Quest 7 — Compound Interest Calculator
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image,
  StyleSheet, Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../lib/firebase';
import { completeStage } from '../../lib/lifeSim';
import { Colors, Fonts, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const COIN = require('../../assets/coin.png');

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4F46E5', '#059669', '#F59E0B', '#EC4899', '#0891B2'];
function ConfettiPiece({ delay, color, startX, size }) {
  const y = useRef(new Animated.Value(-30)).current; const x = useRef(new Animated.Value(0)).current; const opacity = useRef(new Animated.Value(0)).current; const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => { const drift = (Math.random() - 0.5) * 160; setTimeout(() => { Animated.parallel([Animated.timing(y, { toValue: SH * 0.7, duration: 2400, useNativeDriver: true }), Animated.timing(x, { toValue: drift, duration: 2400, useNativeDriver: true }), Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0, duration: 700, delay: 1500, useNativeDriver: true })]), Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true })]).start(); }, delay); }, []);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() > 0.5 ? 540 : -720}deg`] });
  return <Animated.View style={{ position: 'absolute', left: startX, top: 0, width: size, height: size, borderRadius: Math.random() > 0.5 ? size / 2 : 2, backgroundColor: color, opacity, transform: [{ translateY: y }, { translateX: x }, { rotate: spin }] }} />;
}
function QConfetti() { const pieces = Array.from({ length: 50 }, (_, i) => ({ id: i, delay: Math.random() * 1000, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], startX: Math.random() * SW, size: 6 + Math.random() * 8 })); return <View style={StyleSheet.absoluteFill} pointerEvents="none">{pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}</View>; }

// ─── Component ──────────────────────────────────────────────────────────────
export default function Quest7({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  // ── Derived from sim ────────────────────────────────────────────────────
  const totalWalletBalance = (sim?.wallets ?? []).reduce((s, w) => s + (w.balance ?? 0), 0);
  const monthlyIncome = sim?.income ?? 4500;
  const ffn = sim?.ffn ?? 150000;
  const ffnAge = sim?.ffnAge ?? 55;
  const currentAge = 23;
  const yearsToFI = Math.max(1, ffnAge - currentAge);

  // ── State ───────────────────────────────────────────────────────────────
  const [step, setStep]                       = useState(1);
  const [saving, setSaving]                   = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError]             = useState(false);
  const [showConfetti, setShowConfetti]       = useState(false);

  // Step 2 state
  const [startAmount, setStartAmount] = useState(Math.max(1000, Math.min(totalWalletBalance, 5000)));
  const [returnRate, setReturnRate]   = useState(7);
  const [years, setYears]             = useState(20);

  // Step 3 state
  const [selectedRule, setSelectedRule] = useState(7);

  // ── Step 2 computed ─────────────────────────────────────────────────────
  const compoundResult = Math.round(startAmount * Math.pow(1 + returnRate / 100, years));
  const simpleResult   = Math.round(startAmount + startAmount * (returnRate / 100) * years);
  const gain           = compoundResult - startAmount;
  const gainVsSimple   = compoundResult - simpleResult;

  // ── Step 4 computed ─────────────────────────────────────────────────────
  const investPct         = 0.20;
  const monthlyInvestment = Math.round(monthlyIncome * investPct);
  const monthlyRate       = 0.07 / 12;
  const fvMonthly         = monthlyInvestment * ((Math.pow(1 + monthlyRate, yearsToFI * 12) - 1) / monthlyRate);
  const fvExisting        = totalWalletBalance * Math.pow(1.07, yearsToFI);
  const projectedTotal    = Math.round(fvMonthly + fvExisting);
  const willHitFI         = projectedTotal >= ffn;
  const fiPct             = Math.min(100, Math.round((projectedTotal / ffn) * 100));

  const todayVal      = Math.round(monthlyInvestment * ((Math.pow(1 + monthlyRate, yearsToFI * 12) - 1) / monthlyRate));
  const lateVal       = Math.round(monthlyInvestment * ((Math.pow(1 + monthlyRate, (yearsToFI - 5) * 12) - 1) / monthlyRate));
  const costOfWaiting = todayVal - lateVal;

  // ── Slider bounds ───────────────────────────────────────────────────────
  const sliderMin = totalWalletBalance < 100 ? 100 : Math.min(100, totalWalletBalance);
  const sliderMax = totalWalletBalance < 100 ? 5000 : Math.min(totalWalletBalance, 10000);

  // ── Reset on open ───────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep(1);
      setSaving(false);
      setShowConfetti(false);
      setShowExitConfirm(false);
      setShowError(false);
      setStartAmount(Math.max(1000, Math.min(totalWalletBalance, 5000)));
      setReturnRate(7);
      setYears(20);
      setSelectedRule(7);
    }
  }, [visible]);

  const handleClose = () => {
    if (step < 5) setShowExitConfirm(true);
    else onClose();
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      await completeStage(uid, 'stage-7', { compoundResult, projectedTotal, fiPct });
      onComplete();
    } catch (e) {
      setShowError(true);
      setSaving(false);
    }
  };

  // ── Chart helpers ───────────────────────────────────────────────────────
  const chartW = SW - 120;
  const chartH = 140;

  const generatePoints = (start, rate, yrs, compound) => {
    const pts = [];
    for (let t = 0; t <= yrs; t++) {
      pts.push(compound ? start * Math.pow(1 + rate / 100, t) : start + start * (rate / 100) * t);
    }
    return pts;
  };

  const renderLine = (pts, maxVal, color, isDashed) => {
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const x1 = (i / (pts.length - 1)) * chartW;
      const y1 = chartH - (pts[i] / maxVal) * (chartH - 10);
      const x2 = ((i + 1) / (pts.length - 1)) * chartW;
      const y2 = chartH - (pts[i + 1] / maxVal) * (chartH - 10);
      const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const ang = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
      segs.push(
        <View key={i} style={{
          position: 'absolute',
          left: (x1 + x2) / 2 - len / 2,
          top: (y1 + y2) / 2 - 1.25,
          width: len,
          height: 2.5,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: `${ang}deg` }],
          opacity: isDashed ? 0.4 : 1,
        }} />
      );
    }
    return segs;
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 ? (
          <TouchableOpacity style={st.backBtn} onPress={() => { if (step === 5) return; setStep(step - 1); }}>
            <Text style={st.backBtnText}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 7 \u00B7 Compound Interest'}</Text>
      <View style={st.stepPills}>{[1,2,3,4,5].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  // ── FinCard helper ──────────────────────────────────────────────────────
  const FinCard = ({ children }) => (
    <View style={st.finCard}>
      <View style={st.finCardTop}>
        <View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View>
        <Text style={st.finCardLabel}>FIN SAYS</Text>
      </View>
      <Text style={st.finCardText}>{children}</Text>
    </View>
  );

  // ── Step 1 — The concept ────────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"The most powerful\nforce in finance"}</Text>

        <FinCard>
          Compound interest is interest on interest. Every return you earn gets added to your balance {'\u2014'} and next period, you earn returns on that larger balance too. The longer this runs, the more dramatic the effect. Einstein reportedly called it the eighth wonder of the world. Whether he said it or not, the math is real.
        </FinCard>

        <View style={st.infoGrid}>
          <View style={[st.infoGridCard, { backgroundColor: Colors.border }]}>
            <Text style={[st.infoGridIcon]}>{'\uD83D\uDCA4'}</Text>
            <Text style={[st.infoGridTitle, { color: Colors.textMuted }]}>Simple Savings</Text>
            <Text style={[st.infoGridDesc, { color: Colors.textMuted }]}>FC 1,000 at 7% for 30 years</Text>
            <Text style={[st.infoGridValue, { color: Colors.textMuted }]}>FC 3,100</Text>
          </View>
          <View style={[st.infoGridCard, { backgroundColor: MODULE_COLORS['module-3'].colorLight }]}>
            <Text style={st.infoGridIcon}>{'\u26A1'}</Text>
            <Text style={[st.infoGridTitle, { color: MODULE_COLORS['module-3'].color }]}>Compound Growth</Text>
            <Text style={[st.infoGridDesc, { color: MODULE_COLORS['module-3'].color }]}>FC 1,000 at 7% for 30 years</Text>
            <Text style={[st.infoGridValue, { color: MODULE_COLORS['module-3'].color }]}>FC 7,612</Text>
          </View>
        </View>

        <Text style={st.italicMuted}>Same money. Same rate. 30 years difference: FC 4,512 extra {'\u2014'} just from compounding.</Text>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}>
            <Text style={st.ctaBtnText}>{"Show me the calculator \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 2 — The Calculator ─────────────────────────────────────────────
  const renderStep2 = () => {
    const compPts   = generatePoints(startAmount, returnRate, years, true);
    const simplePts = generatePoints(startAmount, returnRate, years, false);
    const maxVal    = Math.max(...compPts, ...simplePts) * 1.05;

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>{"See it for yourself"}</Text>

          {/* Starting amount slider */}
          <Text style={st.sliderLabel}>Starting amount</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={sliderMin}
            maximumValue={sliderMax}
            step={100}
            value={startAmount}
            onValueChange={(v) => setStartAmount(Math.round(v))}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.primary}
          />
          <Text style={st.sliderValue}>FC {startAmount.toLocaleString()}</Text>

          {/* Return rate pills */}
          <Text style={st.sliderLabel}>Return rate</Text>
          <View style={st.pillRow}>
            {[
              { rate: 4, label: 'Conservative', desc: 'SSB / low-risk ETF' },
              { rate: 7, label: 'Realistic', desc: 'Global index fund (historical avg)' },
              { rate: 10, label: 'Optimistic', desc: 'High-growth portfolio' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.rate}
                style={[st.selectPill, returnRate === opt.rate && st.selectPillActive]}
                onPress={() => setReturnRate(opt.rate)}
                activeOpacity={0.8}
              >
                <Text style={[st.selectPillText, returnRate === opt.rate && st.selectPillTextActive]}>{opt.rate}%</Text>
                <Text style={[st.selectPillSub, returnRate === opt.rate && st.selectPillSubActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={st.pillDescRow}>
            {[
              'SSB / low-risk ETF',
              'Global index fund (historical avg)',
              'High-growth portfolio',
            ].map((d, i) => (
              <Text key={i} style={st.pillDesc}>{d}</Text>
            ))}
          </View>

          {/* Time horizon pills */}
          <Text style={[st.sliderLabel, { marginTop: 16 }]}>Time horizon</Text>
          <View style={st.pillRow}>
            {[10, 20, 30].map(y => (
              <TouchableOpacity
                key={y}
                style={[st.selectPill, years === y && st.selectPillActive]}
                onPress={() => setYears(y)}
                activeOpacity={0.8}
              >
                <Text style={[st.selectPillText, years === y && st.selectPillTextActive]}>{y} years</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart */}
          <View style={[st.chartContainer, { width: chartW, height: chartH }]}>
            {renderLine(compPts, maxVal, Colors.primary, false)}
            {renderLine(simplePts, maxVal, Colors.textMuted, true)}
          </View>
          <View style={st.legendRow}>
            <View style={st.legendItem}><View style={[st.legendDot, { backgroundColor: Colors.primary }]} /><Text style={st.legendText}>Compound</Text></View>
            <View style={st.legendItem}><View style={[st.legendDot, { backgroundColor: Colors.textMuted, opacity: 0.4 }]} /><Text style={st.legendText}>Simple</Text></View>
          </View>

          {/* Result card */}
          <View style={st.resultCard}>
            <Text style={[st.resultBig, { color: MODULE_COLORS['module-3'].color }]}>FC {compoundResult.toLocaleString()}</Text>
            <Text style={st.resultSub}>after {years} years at {returnRate}%</Text>
            <Text style={st.resultDetail}>That is FC {gain.toLocaleString()} earned on your FC {startAmount.toLocaleString()}</Text>
            <Text style={st.resultDetail}>FC {gainVsSimple.toLocaleString()} more than simple savings</Text>
          </View>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(3)} activeOpacity={0.88}>
              <Text style={st.ctaBtnText}>{"What is the Rule of 72? \u2192"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 3 — Rule of 72 ─────────────────────────────────────────────────
  const renderStep3 = () => {
    const ruleOptions = [
      { rate: 4, icon: '\uD83D\uDCB0' },
      { rate: 7, icon: '\u26A1' },
      { rate: 10, icon: '\uD83D\uDE80' },
    ];
    const maxBar = 72 / 4; // 4% = longest bar

    const getFinReact = (rate) => {
      if (rate === 4) return `Conservative but still powerful. In 36 years, FC ${startAmount.toLocaleString()} becomes FC ${(startAmount * 4).toLocaleString()}. Not bad for doing nothing.`;
      if (rate === 7) return `This is the historical average of a global index fund. In 30 years, FC ${startAmount.toLocaleString()} becomes FC ${Math.round(startAmount * Math.pow(1.07, 30)).toLocaleString()}. That is the power of just staying invested.`;
      return 'Aggressive but achievable in growth portfolios. The risk is higher \u2014 but so is the reward.';
    };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>{"The Rule of 72"}</Text>

          <FinCard>
            Divide 72 by your annual return rate and you get the number of years it takes to double your money. It is a mental shortcut that works surprisingly well. At 7%, your money doubles every 10 years. At 4%, every 18 years. At 1% in a savings account, every 72 years.
          </FinCard>

          {ruleOptions.map(opt => {
            const doublingYears = Math.round(72 / opt.rate * 10) / 10;
            const barPct = ((72 / opt.rate) / maxBar) * 100;
            const isSelected = selectedRule === opt.rate;
            return (
              <TouchableOpacity
                key={opt.rate}
                style={[st.ruleCard, isSelected && st.ruleCardSelected]}
                onPress={() => setSelectedRule(opt.rate)}
                activeOpacity={0.8}
              >
                <View style={st.ruleCardHeader}>
                  <Text style={st.ruleCardIcon}>{opt.icon}</Text>
                  <Text style={st.ruleCardTitle}>At {opt.rate}% {'\u2014'} doubles every {doublingYears} years</Text>
                </View>
                <Text style={st.ruleCardValues}>
                  FC {startAmount.toLocaleString()} {'\u2192'} FC {(startAmount * 2).toLocaleString()} {'\u2192'} FC {(startAmount * 4).toLocaleString()}
                </Text>
                <View style={st.ruleBarBg}>
                  <View style={[st.ruleBarFill, { width: `${barPct}%`, backgroundColor: isSelected ? Colors.primary : Colors.textMuted }]} />
                </View>
              </TouchableOpacity>
            );
          })}

          <FinCard>{getFinReact(selectedRule)}</FinCard>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(4)} activeOpacity={0.88}>
              <Text style={st.ctaBtnText}>{"Show me my numbers \u2192"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 4 — Your Numbers ───────────────────────────────────────────────
  const renderStep4 = () => {
    const progressColor = fiPct >= 100 ? Colors.successDark : fiPct >= 50 ? Colors.primary : Colors.warningDark;

    const getFinReact = () => {
      if (willHitFI) return `At 20% of your salary invested monthly, you are on track to hit your FI Number by age ${ffnAge}. The math works. The only variable is whether you stay consistent.`;
      if (fiPct >= 75) return `You are close. At 20% invested, you reach ${fiPct}% of your FI Number by ${ffnAge}. A small increase in your savings rate closes the gap significantly.`;
      return `The gap is real. But you are ${yearsToFI} years away from ${ffnAge} \u2014 there is time. Every percentage point of salary you redirect to investments now is worth multiples later.`;
    };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>{`Your path to\nFC ${ffn.toLocaleString()}`}</Text>

          {/* Projection card */}
          <View style={st.projectionCard}>
            <Text style={st.projectionLabel}>YOUR FI PROJECTION</Text>

            <View style={st.projectionRow}>
              <Text style={st.projectionRowLabel}>Monthly investment (20% of salary)</Text>
              <View style={st.projectionRowValue}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={st.projectionRowValueText}>FC {monthlyInvestment.toLocaleString()}</Text></View>
            </View>
            <View style={st.projectionRow}>
              <Text style={st.projectionRowLabel}>Years to target age ({ffnAge})</Text>
              <Text style={st.projectionRowValueText}>{yearsToFI} years</Text>
            </View>
            <View style={st.projectionRow}>
              <Text style={st.projectionRowLabel}>Projected portfolio at {ffnAge}</Text>
              <View style={st.projectionRowValue}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={st.projectionRowValueText}>FC {projectedTotal.toLocaleString()} at 7% p.a.</Text></View>
            </View>
            <View style={st.projectionRow}>
              <Text style={st.projectionRowLabel}>Your FI Number</Text>
              <View style={st.projectionRowValue}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={st.projectionRowValueText}>FC {ffn.toLocaleString()}</Text></View>
            </View>

            <View style={st.progressBarBg}>
              <View style={[st.progressBarFill, { width: `${fiPct}%`, backgroundColor: progressColor }]} />
            </View>
            <Text style={[st.progressLabel, { color: progressColor }]}>{fiPct}% of your FI Number</Text>
          </View>

          <FinCard>{getFinReact()}</FinCard>

          {/* Comparison cards */}
          <View style={st.infoGrid}>
            <View style={[st.comparisonCard]}>
              <Text style={st.comparisonTitle}>Start today</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Image source={COIN} style={{ width: 14, height: 14 }} />
                <Text style={st.comparisonValue}>FC {todayVal.toLocaleString()}</Text>
              </View>
              <Text style={st.comparisonYears}>{yearsToFI} yrs</Text>
            </View>
            <View style={[st.comparisonCard]}>
              <Text style={st.comparisonTitle}>Start in 5 years</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Image source={COIN} style={{ width: 14, height: 14 }} />
                <Text style={st.comparisonValue}>FC {lateVal.toLocaleString()}</Text>
              </View>
              <Text style={st.comparisonYears}>{yearsToFI - 5} yrs</Text>
            </View>
          </View>

          <Text style={st.italicMuted}>Starting 5 years late costs you FC {costOfWaiting.toLocaleString()}. That is the price of waiting.</Text>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={st.ctaBtn} onPress={() => { setStep(5); setShowConfetti(true); }} activeOpacity={0.88}>
              <Text style={st.ctaBtnText}>{"I am ready to invest \u2192"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 5 — Success ────────────────────────────────────────────────────
  const renderStep5 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"You understand\ncompounding"}</Text>
        <Text style={st.questSub}>Chapter 4 {'\u00B7'} Investing</Text>

        <View style={st.insightRow}>
          {[
            { icon: '\u23F3', label: 'Time matters most' },
            { icon: '\uD83D\uDCD0', label: 'Rule of 72' },
            { icon: '\uD83D\uDCA1', label: '7% avg return' },
          ].map((chip, i) => (
            <View key={i} style={st.insightChip}>
              <Text style={st.insightIcon}>{chip.icon}</Text>
              <Text style={st.insightLabel}>{chip.label}</Text>
            </View>
          ))}
        </View>

        <View style={st.unlockCard}>
          <Text style={st.unlockPill}>{'\uD83D\uDD13'} UNLOCKED</Text>
          <Text style={st.unlockText}>You understand compounding. Time is now your ally.</Text>
          <View style={st.unlockDivider} />
          <Text style={st.unlockHint}>{'\u23F3'} Quest 4.2 {'\u2014'} Choose Your Vehicle now unlocked</Text>
        </View>

        <FinCard>
          The calculator showed you the theory. Quest 4.2 is where you pick the actual vehicle {'\u2014'} robo-advisor, ETF plan, or DIY portfolio. Each has different fees, effort levels, and expected returns. The right one depends on you.
        </FinCard>

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
  // Shared base styles (same as quest-1)
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

  // ── Quest-7 specific styles ─────────────────────────────────────────────
  // Step 1 — info grid (comparison cards)
  infoGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoGridCard: { flex: 1, borderRadius: Radii.lg, padding: 14, alignItems: 'center', gap: 4 },
  infoGridIcon: { fontSize: 20 },
  infoGridTitle: { fontFamily: Fonts.bold, fontSize: 12, textAlign: 'center' },
  infoGridDesc: { fontFamily: Fonts.regular, fontSize: 10, textAlign: 'center', lineHeight: 14 },
  infoGridValue: { fontFamily: Fonts.extraBold, fontSize: 18, marginTop: 4 },

  italicMuted: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', lineHeight: 20, marginBottom: 8, paddingHorizontal: 8 },

  // Step 2 — Slider & pills
  sliderLabel: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginTop: 12, marginBottom: 4 },
  sliderValue: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.primary, textAlign: 'center', marginBottom: 8 },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  selectPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  selectPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  selectPillText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  selectPillTextActive: { color: Colors.white },
  selectPillSub: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted, marginTop: 2 },
  selectPillSubActive: { color: 'rgba(255,255,255,0.8)' },

  pillDescRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  pillDesc: { flex: 1, fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted, textAlign: 'center', lineHeight: 12 },

  // Step 2 — Chart
  chartContainer: { alignSelf: 'center', marginVertical: 16, position: 'relative' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 3, borderRadius: 1.5 },
  legendText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },

  // Step 2 — Result card
  resultCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 20, alignItems: 'center', marginBottom: 12, ...Shadows.soft },
  resultBig: { fontFamily: Fonts.extraBold, fontSize: 28 },
  resultSub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  resultDetail: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  // Step 3 — Rule cards
  ruleCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: Colors.border, ...Shadows.soft },
  ruleCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  ruleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  ruleCardIcon: { fontSize: 18 },
  ruleCardTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  ruleCardValues: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  ruleBarBg: { height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' },
  ruleBarFill: { height: 6, borderRadius: 3 },

  // Step 4 — Projection card
  projectionCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 20, marginBottom: 16, ...Shadows.medium },
  projectionLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  projectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  projectionRowLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1, marginRight: 8 },
  projectionRowValue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  projectionRowValueText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: Colors.border, overflow: 'hidden', marginTop: 8, marginBottom: 8 },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressLabel: { fontFamily: Fonts.bold, fontSize: 13, textAlign: 'center' },

  // Step 4 — Comparison cards
  comparisonCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, alignItems: 'center', ...Shadows.soft },
  comparisonTitle: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary },
  comparisonValue: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.primary },
  comparisonYears: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  // Step 5 — Insight chips
  insightRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  insightChip: { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 10, alignItems: 'center', ...Shadows.soft },
  insightIcon: { fontSize: 18, marginBottom: 4 },
  insightLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textPrimary, textAlign: 'center' },
});
