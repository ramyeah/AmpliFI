// app/quests/quest-10.js
// Quest 10 — Survive Market Dip
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image,
  StyleSheet, Dimensions, Easing,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { completeStage } from '../../lib/lifeSim';
import { Colors, Fonts, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const COIN = require('../../assets/coin.png');

// ── Confetti ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4F46E5', '#059669', '#F59E0B', '#EC4899', '#0891B2'];
function ConfettiPiece({ delay, color, startX, size }) {
  const y = useRef(new Animated.Value(-30)).current; const x = useRef(new Animated.Value(0)).current; const opacity = useRef(new Animated.Value(0)).current; const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => { const drift = (Math.random() - 0.5) * 160; setTimeout(() => { Animated.parallel([Animated.timing(y, { toValue: SH * 0.7, duration: 2400, useNativeDriver: true }), Animated.timing(x, { toValue: drift, duration: 2400, useNativeDriver: true }), Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0, duration: 700, delay: 1500, useNativeDriver: true })]), Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true })]).start(); }, delay); }, []);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() > 0.5 ? 540 : -720}deg`] });
  return <Animated.View style={{ position: 'absolute', left: startX, top: 0, width: size, height: size, borderRadius: Math.random() > 0.5 ? size / 2 : 2, backgroundColor: color, opacity, transform: [{ translateY: y }, { translateX: x }, { rotate: spin }] }} />;
}
function QConfetti() { const pieces = Array.from({ length: 50 }, (_, i) => ({ id: i, delay: Math.random() * 1000, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], startX: Math.random() * SW, size: 6 + Math.random() * 8 })); return <View style={StyleSheet.absoluteFill} pointerEvents="none">{pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}</View>; }

// ── Component ─────────────────────────────────────────────────────────────────
export default function Quest10({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  // ── Derived values ──────────────────────────────────────────────────────
  const investmentWallet = (sim?.wallets ?? []).find(w => w.type === 'investment');
  const portfolioBalance = investmentWallet?.balance ?? 0;
  const vehicle = sim?.investmentVehicle ?? { name: 'Your Portfolio', icon: '\uD83D\uDCC8', annualReturn: { min: 6, max: 7 }, ter: 0.65 };
  const bankWallet = (sim?.wallets ?? []).find(w => w.type === 'bank');
  const bankBalance = bankWallet?.balance ?? 0;
  const DIP_PCT = 0.15;
  const dippedValue = Math.round(portfolioBalance * (1 - DIP_PCT));
  const lossAmount = portfolioBalance - dippedValue;

  // ── State ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [choice, setChoice] = useState(null); // 'hold' | 'buy' | 'sell'
  const [buyAmount, setBuyAmount] = useState(Math.min(Math.round(bankBalance * 0.3), 2000));
  const [saving, setSaving] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [displayValue, setDisplayValue] = useState(portfolioBalance);
  const [ffMonth, setFfMonth] = useState(0);
  const [fastForwardComplete, setFastForwardComplete] = useState(false);
  const coinFlowAnim = useRef(new Animated.Value(0)).current;

  // ── Reset on open ───────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep(1);
      setChoice(null);
      setBuyAmount(Math.min(Math.round(bankBalance * 0.3), 2000));
      setSaving(false);
      setShowExitConfirm(false);
      setShowError(false);
      setShowConfetti(false);
      setDisplayValue(portfolioBalance);
      setFfMonth(0);
      setFastForwardComplete(false);
      coinFlowAnim.setValue(0);
    }
  }, [visible]);

  // ── Outcome calculation ─────────────────────────────────────────────────
  const outcome = useMemo(() => {
    if (!choice) return null;
    const midReturn = ((vehicle.annualReturn?.min ?? 6) + (vehicle.annualReturn?.max ?? 7)) / 2 / 100;
    const monthlyRate = midReturn / 12;
    const monthlyFee = (vehicle.ter ?? 0.65) / 100 / 12;
    const monthlyDCA = sim?.monthlyDCA ?? 0;

    if (choice === 'hold') {
      let bal = dippedValue;
      for (let m = 0; m < 3; m++) { bal += monthlyDCA; bal *= (1 + monthlyRate); bal *= (1 - monthlyFee); }
      return { finalValue: Math.round(bal), vsOriginal: Math.round(bal) - portfolioBalance, label: 'You held through the dip', outcome: 'positive', lesson: 'Markets recover. Investors who hold through downturns capture the full recovery. The only people who actually lose money in a market dip are the ones who sell.' };
    }
    if (choice === 'buy') {
      let bal = dippedValue + buyAmount;
      for (let m = 0; m < 3; m++) { bal += monthlyDCA; bal *= (1 + monthlyRate); bal *= (1 - monthlyFee); }
      let holdBal = dippedValue;
      for (let m = 0; m < 3; m++) { holdBal += monthlyDCA; holdBal *= (1 + monthlyRate); holdBal *= (1 - monthlyFee); }
      return { finalValue: Math.round(bal), vsOriginal: Math.round(bal) - portfolioBalance, extraGain: Math.round(bal) - Math.round(holdBal), label: 'You bought the dip', outcome: 'excellent', lesson: 'Buying during a dip means you purchase more units at a lower price. When the market recovers, those extra units are worth more. Downturns are not disasters \u2014 they are discounts.' };
    }
    if (choice === 'sell') {
      let missedBal = dippedValue;
      for (let m = 0; m < 3; m++) { missedBal += monthlyDCA; missedBal *= (1 + monthlyRate); missedBal *= (1 - monthlyFee); }
      return { finalValue: dippedValue, vsOriginal: dippedValue - portfolioBalance, missedRecovery: Math.round(missedBal) - dippedValue, label: 'You sold at the bottom', outcome: 'negative', lesson: 'Selling during a dip locks in a permanent loss and removes you from the recovery. The market recovered 3 months later \u2014 but you were no longer in it. This is the single most common and most costly investing mistake.' };
    }
    return null;
  }, [choice, buyAmount, dippedValue]);

  // ── Step 2 dip animation ────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    setDisplayValue(portfolioBalance);
    const dur = 1500; const start = Date.now();
    const iv = setInterval(() => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 2);
      setDisplayValue(Math.round(portfolioBalance + (dippedValue - portfolioBalance) * e));
      if (p >= 1) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [step]);

  // ── Step 4 fast-forward animation ───────────────────────────────────────
  useEffect(() => {
    if (step !== 4) return;
    setFfMonth(0); setFastForwardComplete(false);
    const run = async () => {
      for (let m = 1; m <= 3; m++) { await new Promise(r => setTimeout(r, 900)); setFfMonth(m); }
      await new Promise(r => setTimeout(r, 500));
      setFastForwardComplete(true);
    };
    run();
  }, [step]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (step < 5) setShowExitConfirm(true);
    else onClose();
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      const oc = outcome;
      const updatedWallets = (sim?.wallets ?? []).map(w => {
        if (w.type === 'investment') return { ...w, balance: oc.finalValue };
        if (w.type === 'bank' && choice === 'buy') return { ...w, balance: Math.max(0, (w.balance ?? 0) - buyAmount) };
        if (w.type === 'bank' && choice === 'sell') return { ...w, balance: (w.balance ?? 0) + dippedValue };
        return w;
      });
      const finalWallets = choice === 'sell' ? updatedWallets.filter(w => w.type !== 'investment') : updatedWallets;
      await updateDoc(doc(db, 'simProgress', uid), { wallets: finalWallets, marketDipChoice: choice, marketDipOutcome: oc.finalValue, updatedAt: Date.now() });
      const realFCDelta = oc.finalValue - dippedValue;
      if (realFCDelta !== 0 && choice !== 'sell') {
        await updateDoc(doc(db, 'users', uid), { finCoins: increment(realFCDelta) });
      }
      await completeStage(uid, 'stage-10', { choice, finalValue: oc.finalValue });
      if (choice !== 'sell') setShowConfetti(true);
      onComplete();
    } catch (e) { setShowError(true); setSaving(false); }
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 && step !== 4 && step !== 5 ? (
          <TouchableOpacity style={st.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={st.backBtnText}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 10 \u00B7 Survive Market Dip'}</Text>
      <View style={st.stepPills}>{[1,2,3,4,5].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  // ── Fin card helper ─────────────────────────────────────────────────────
  const FinCard = ({ children }) => (
    <View style={st.finCard}>
      <View style={st.finCardTop}>
        <View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View>
        <Text style={st.finCardLabel}>FIN SAYS</Text>
      </View>
      <Text style={st.finCardText}>{children}</Text>
    </View>
  );

  // ── Step 1 — Market news breaks ─────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <View style={st.newsCard}>
          <View style={st.newsTicker}>
            <Text style={st.newsTickerText}>BREAKING NEWS</Text>
          </View>
          <Text style={st.newsHeadline}>Global Markets Plunge on Economic Fears</Text>
          <Text style={st.newsBody}>
            A wave of panic selling has swept through global markets overnight. Investors are rushing to exit positions as recession fears mount. All major indices are deep in the red.
          </Text>
          <View style={st.newsStatsRow}>
            <View style={st.newsStat}>
              <Text style={st.newsStatLabel}>S&P 500</Text>
              <Text style={st.newsStatValue}>-15.2%</Text>
            </View>
            <View style={st.newsStat}>
              <Text style={st.newsStatLabel}>Global ETF</Text>
              <Text style={st.newsStatValue}>-14.8%</Text>
            </View>
            <View style={st.newsStat}>
              <Text style={st.newsStatLabel}>Sentiment</Text>
              <Text style={[st.newsStatValue, { color: '#FF4444' }]}>FEAR</Text>
            </View>
          </View>
        </View>

        <View style={st.impactPreview}>
          <Text style={st.impactPreviewTitle}>Portfolio Impact</Text>
          <View style={st.impactRow}>
            <View style={st.impactCol}>
              <Text style={st.impactLabel}>Before</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Image source={COIN} style={{ width: 14, height: 14 }} />
                <Text style={st.impactValueGreen}>{portfolioBalance.toLocaleString()}</Text>
              </View>
            </View>
            <Text style={st.impactArrow}>{'\u2192'}</Text>
            <View style={st.impactCol}>
              <Text style={st.impactLabel}>After (-15%)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Image source={COIN} style={{ width: 14, height: 14 }} />
                <Text style={st.impactValueRed}>{dippedValue.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>

        <FinCard>
          This is your first real test as an investor. Every serious investor faces this moment. What you do in the next few minutes will determine whether you build wealth or destroy it. Take a breath. Think carefully.
        </FinCard>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}>
            <Text style={st.ctaBtnText}>{"See my portfolio \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 2 — Portfolio after the dip ────────────────────────────────────
  const renderStep2 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Your portfolio{'\n'}after the dip</Text>

        <View style={st.dipPortfolioCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Image source={COIN} style={{ width: 28, height: 28 }} />
            <Text style={[st.dipPortfolioValue, displayValue <= dippedValue && { color: Colors.danger }]}>
              {displayValue.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={st.lossBar}>
          <View style={[st.lossBarSegment, { flex: 85, backgroundColor: Colors.successDark, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }]}>
            <Text style={st.lossBarLabel}>85%</Text>
          </View>
          <View style={[st.lossBarSegment, { flex: 15, backgroundColor: Colors.danger, borderTopRightRadius: 8, borderBottomRightRadius: 8 }]}>
            <Text style={st.lossBarLabel}>-15%</Text>
          </View>
        </View>

        <View style={st.historyCard}>
          <Text style={st.historyCardTitle}>Historical context</Text>
          {[
            { year: '2008', dip: '-57%', recovery: '4 years' },
            { year: '2020', dip: '-34%', recovery: '5 months' },
            { year: '2022', dip: '-25%', recovery: '18 months' },
            { year: 'This dip', dip: '-15%', recovery: '?' },
          ].map((row, i) => (
            <View key={i} style={st.historyRow}>
              <Text style={st.historyYear}>{row.year}</Text>
              <Text style={st.historyDip}>{row.dip}</Text>
              <Text style={st.historyRecovery}>{row.recovery}</Text>
            </View>
          ))}
        </View>

        <FinCard>
          Every dip in that table recovered. Every single one. A 15% drop is painful to look at but historically it is noise {'\u2014'} not a permanent loss, unless you sell. The question now is what you do with that information.
        </FinCard>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(3)} activeOpacity={0.88}>
            <Text style={st.ctaBtnText}>{"Make my decision \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 3 — Make your decision ─────────────────────────────────────────
  const renderStep3 = () => {
    const buyDisabled = bankBalance < 500;
    const canProceed = choice !== null;

    const getFinText = () => {
      if (!choice) return 'Three choices. One of them permanently costs you money. Think carefully before you tap.';
      if (choice === 'hold') return 'Solid. You are thinking like a long-term investor. Markets have recovered from every dip in history. Staying put is usually the right call.';
      if (choice === 'buy') return 'Bold move. Buying at a discount amplifies your gains when the market recovers. This is what sophisticated investors do \u2014 but only if you have the cash to spare.';
      if (choice === 'sell') return 'Are you sure? Selling now locks in a real loss. The market may recover next month. Once you sell, you miss that recovery entirely.';
    };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>What do you do?</Text>
          <Text style={st.questSub}>This is the moment that separates investors from speculators.</Text>

          {/* Hold */}
          <TouchableOpacity
            style={[st.decisionCard, choice === 'hold' && { borderColor: Colors.successDark }]}
            onPress={() => setChoice('hold')}
            activeOpacity={0.82}
          >
            <View style={st.decisionCardHeader}>
              <Text style={st.decisionIcon}>{'\uD83E\uDDD8'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.decisionTitle}>Hold</Text>
                <Text style={st.decisionDesc}>Do nothing. Stay invested.</Text>
              </View>
            </View>
            <View style={[st.decisionTag, { backgroundColor: 'rgba(5,150,105,0.1)' }]}>
              <Text style={[st.decisionTagText, { color: Colors.successDark }]}>What most long-term investors do</Text>
            </View>
          </TouchableOpacity>

          {/* Buy more */}
          <TouchableOpacity
            style={[st.decisionCard, choice === 'buy' && { borderColor: Colors.primary }, buyDisabled && { opacity: 0.5 }]}
            onPress={() => !buyDisabled && setChoice('buy')}
            activeOpacity={0.82}
            disabled={buyDisabled}
          >
            <View style={st.decisionCardHeader}>
              <Text style={st.decisionIcon}>{'\uD83D\uDED2'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.decisionTitle}>Buy more</Text>
                <Text style={st.decisionDesc}>Invest extra cash at the lower price.</Text>
              </View>
            </View>
            {choice === 'buy' && !buyDisabled && (
              <View style={st.buySliderContainer}>
                <Text style={st.buySliderLabel}>
                  Buy amount: <Image source={COIN} style={{ width: 12, height: 12 }} /> {buyAmount.toLocaleString()}
                </Text>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={500}
                  maximumValue={Math.min(bankBalance, 5000)}
                  step={100}
                  value={buyAmount}
                  onValueChange={v => setBuyAmount(Math.round(v))}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor={Colors.primary}
                />
                <Text style={st.buySliderHint}>
                  Bank balance: <Image source={COIN} style={{ width: 11, height: 11 }} /> {bankBalance.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={[st.decisionTag, { backgroundColor: 'rgba(79,70,229,0.1)' }]}>
              <Text style={[st.decisionTagText, { color: Colors.primary }]}>Advanced move {'\u2014'} requires available cash</Text>
            </View>
          </TouchableOpacity>

          {/* Sell */}
          <TouchableOpacity
            style={[st.decisionCard, choice === 'sell' && { borderColor: Colors.danger }]}
            onPress={() => setChoice('sell')}
            activeOpacity={0.82}
          >
            <View style={st.decisionCardHeader}>
              <Text style={st.decisionIcon}>{'\uD83D\uDEA8'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={st.decisionTitle}>Sell everything</Text>
                <Text style={st.decisionDesc}>Cash out now before it drops more.</Text>
              </View>
            </View>
            <View style={[st.decisionTag, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Text style={[st.decisionTagText, { color: Colors.danger }]}>{'\u26A0\uFE0F'} This locks in your loss permanently</Text>
            </View>
          </TouchableOpacity>

          <FinCard>{getFinText()}</FinCard>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity
              style={[
                st.ctaBtn,
                !canProceed && st.ctaBtnDisabled,
                choice === 'sell' && { backgroundColor: Colors.danger },
              ]}
              onPress={() => canProceed && setStep(4)}
              disabled={!canProceed}
              activeOpacity={0.88}
            >
              <Text style={st.ctaBtnText}>
                {choice === 'sell' ? 'Sell everything \u2192' : 'Fast forward 3 months \u2192'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 4 — Fast forward 3 months ──────────────────────────────────────
  const renderStep4 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>3 months later...</Text>

        <View style={st.ffContainer}>
          {[1, 2, 3].map(m => (
            <View
              key={m}
              style={[
                st.ffMonthCard,
                ffMonth >= m && st.ffMonthCardActive,
              ]}
            >
              <Text style={[st.ffMonthLabel, ffMonth >= m && st.ffMonthLabelActive]}>Month {m}</Text>
              <Text style={[st.ffMonthStatus, ffMonth >= m && st.ffMonthStatusActive]}>
                {ffMonth >= m
                  ? (choice === 'sell' ? 'Sitting in cash' : 'Recovering...')
                  : '\u2014'}
              </Text>
            </View>
          ))}
        </View>

        {!fastForwardComplete && (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 12 }}>
              Simulating market activity...
            </Text>
          </View>
        )}

        {fastForwardComplete && outcome && (
          <View style={[st.outcomeCard, {
            borderLeftColor: outcome.outcome === 'negative' ? Colors.danger : outcome.outcome === 'excellent' ? Colors.primary : Colors.successDark,
          }]}>
            <Text style={st.outcomeEmoji}>
              {outcome.outcome === 'negative' ? '\uD83D\uDCC9' : outcome.outcome === 'excellent' ? '\uD83D\uDE80' : '\uD83D\uDCC8'}
            </Text>
            <Text style={st.outcomeLabel}>{outcome.label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Image source={COIN} style={{ width: 22, height: 22 }} />
              <Text style={st.outcomeValue}>{outcome.finalValue.toLocaleString()}</Text>
            </View>
            <Text style={[st.outcomeDelta, {
              color: outcome.vsOriginal >= 0 ? Colors.successDark : Colors.danger,
            }]}>
              {outcome.vsOriginal >= 0 ? '+' : ''}{outcome.vsOriginal.toLocaleString()} vs original
            </Text>
          </View>
        )}

        {fastForwardComplete && (
          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity
              style={st.ctaBtn}
              onPress={() => { setStep(5); if (choice !== 'sell') setShowConfetti(true); }}
              activeOpacity={0.88}
            >
              <Text style={st.ctaBtnText}>{"See the full result \u2192"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );

  // ── Step 5 — The consequence ────────────────────────────────────────────
  const renderStep5 = () => {
    const isGood = choice !== 'sell';
    const titleColor = isGood ? Colors.successDark : Colors.danger;
    const titleText = choice === 'hold'
      ? 'You held the line'
      : choice === 'buy'
        ? 'You bought the dip'
        : 'You sold at the bottom';

    const getFinText = () => {
      if (choice === 'hold') return 'Well handled. Volatility is the price of admission for long-term returns. Every time you hold through a dip, you are reinforcing the most important investing habit you can build. Stay the course.';
      if (choice === 'buy') return 'That was the move. You bought more units at a discount and your portfolio shows it. Not everyone has the conviction or the cash to do this. When you do, the returns follow.';
      return 'This is the lesson most investors learn the hard way. You did not lose money to the market \u2014 you locked in the loss yourself by selling. The market recovered. Next time, remember this moment before you touch the sell button.';
    };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={[st.questTitle, { color: titleColor }]}>{titleText}</Text>

          {outcome && (
            <View style={st.outcomeDetailCard}>
              <Text style={st.outcomeDetailTitle}>Portfolio outcome</Text>
              <View style={st.outcomeDetailRow}>
                <Text style={st.outcomeDetailLabel}>Before dip</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Image source={COIN} style={{ width: 13, height: 13 }} />
                  <Text style={st.outcomeDetailValue}>{portfolioBalance.toLocaleString()}</Text>
                </View>
              </View>
              <View style={st.outcomeDetailRow}>
                <Text style={st.outcomeDetailLabel}>After recovery</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Image source={COIN} style={{ width: 13, height: 13 }} />
                  <Text style={[st.outcomeDetailValue, { color: isGood ? Colors.successDark : Colors.danger }]}>
                    {outcome.finalValue.toLocaleString()}
                  </Text>
                </View>
              </View>
              <View style={st.outcomeDetailDivider} />
              <View style={st.outcomeDetailRow}>
                <Text style={[st.outcomeDetailLabel, { fontFamily: Fonts.bold }]}>Net change</Text>
                <Text style={[st.outcomeDetailValue, { fontFamily: Fonts.extraBold, color: outcome.vsOriginal >= 0 ? Colors.successDark : Colors.danger }]}>
                  {outcome.vsOriginal >= 0 ? '+' : ''}{outcome.vsOriginal.toLocaleString()}
                </Text>
              </View>
              {choice === 'buy' && outcome.extraGain != null && (
                <View style={st.outcomeDetailRow}>
                  <Text style={st.outcomeDetailLabel}>Extra gain from buying dip</Text>
                  <Text style={[st.outcomeDetailValue, { color: Colors.primary }]}>+{outcome.extraGain.toLocaleString()}</Text>
                </View>
              )}
              {choice === 'sell' && outcome.missedRecovery != null && (
                <View style={st.outcomeDetailRow}>
                  <Text style={st.outcomeDetailLabel}>Missed recovery</Text>
                  <Text style={[st.outcomeDetailValue, { color: Colors.danger }]}>+{outcome.missedRecovery.toLocaleString()}</Text>
                </View>
              )}
            </View>
          )}

          {outcome && (
            <View style={[st.lessonCard, {
              borderLeftColor: outcome.outcome === 'negative' ? Colors.danger : outcome.outcome === 'excellent' ? Colors.primary : Colors.successDark,
            }]}>
              <Text style={st.lessonTitle}>The lesson</Text>
              <Text style={st.lessonText}>{outcome.lesson}</Text>
            </View>
          )}

          <FinCard>{getFinText()}</FinCard>

          <View style={[st.unlockCard, { backgroundColor: isGood ? 'rgba(13,148,136,0.1)' : 'rgba(245,158,11,0.1)' }]}>
            <Text style={[st.unlockPill, { color: isGood ? '#0D9488' : '#D97706', backgroundColor: isGood ? 'rgba(13,148,136,0.15)' : 'rgba(245,158,11,0.15)' }]}>
              {isGood ? '\uD83D\uDD13 UNLOCKED' : '\uD83D\uDCD6 LESSON LEARNED'}
            </Text>
            <Text style={st.unlockText}>
              {isGood
                ? 'Market dip survived. Behavioural edge established.'
                : 'You experienced the most common investing mistake. Now you know.'}
            </Text>
            <View style={[st.unlockDivider, { backgroundColor: isGood ? '#0D9488' : '#D97706' }]} />
            <Text style={[st.unlockHint, { color: isGood ? '#0D9488' : '#D97706' }]}>
              {'\uD83C\uDF0D'} Quest 4.5 {'\u2014'} Diversify Portfolio now unlocked
            </Text>
          </View>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={[st.ctaBtn, saving && st.ctaBtnDisabled]} onPress={handleComplete} disabled={saving} activeOpacity={0.88}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Back to FinCity \u2192"}</Text>}
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

// ── Styles ─────────────────────────────────────────────────────────────────────
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

  // News card (Step 1)
  newsCard: { backgroundColor: '#1A1A2E', borderRadius: Radii.xl, padding: 20, marginBottom: 16, ...Shadows.medium },
  newsTicker: { backgroundColor: '#FF4444', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginBottom: 14 },
  newsTickerText: { fontFamily: Fonts.extraBold, fontSize: 10, color: '#FFFFFF', letterSpacing: 1.5, textTransform: 'uppercase' },
  newsHeadline: { fontFamily: Fonts.extraBold, fontSize: 18, color: '#FFFFFF', lineHeight: 24, marginBottom: 10 },
  newsBody: { fontFamily: Fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20, marginBottom: 16 },
  newsStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  newsStat: { alignItems: 'center' },
  newsStatLabel: { fontFamily: Fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  newsStatValue: { fontFamily: Fonts.extraBold, fontSize: 16, color: '#FF4444' },

  // Impact preview (Step 1)
  impactPreview: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  impactPreviewTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12, textAlign: 'center' },
  impactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  impactCol: { alignItems: 'center' },
  impactLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  impactValueGreen: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.successDark },
  impactValueRed: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.danger },
  impactArrow: { fontSize: 20, color: Colors.textMuted },

  // Dip portfolio card (Step 2)
  dipPortfolioCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 24, marginBottom: 16, alignItems: 'center', ...Shadows.medium },
  dipPortfolioValue: { fontFamily: Fonts.extraBold, fontSize: 36, color: Colors.textPrimary },

  // Loss bar (Step 2)
  lossBar: { flexDirection: 'row', height: 36, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  lossBarSegment: { alignItems: 'center', justifyContent: 'center' },
  lossBarLabel: { fontFamily: Fonts.bold, fontSize: 11, color: '#FFFFFF' },

  // History card (Step 2)
  historyCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  historyCardTitle: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary, marginBottom: 12 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyYear: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, flex: 1 },
  historyDip: { fontFamily: Fonts.extraBold, fontSize: 13, color: Colors.danger, flex: 1, textAlign: 'center' },
  historyRecovery: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1, textAlign: 'right' },

  // Decision cards (Step 3)
  decisionCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: Colors.border, ...Shadows.soft },
  decisionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  decisionIcon: { fontSize: 28 },
  decisionTitle: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  decisionDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  decisionTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radii.full, alignSelf: 'flex-start' },
  decisionTagText: { fontFamily: Fonts.bold, fontSize: 11 },

  // Buy slider (Step 3)
  buySliderContainer: { marginTop: 8, marginBottom: 8, paddingHorizontal: 4 },
  buySliderLabel: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 4 },
  buySliderHint: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Fast forward (Step 4)
  ffContainer: { gap: 10, marginBottom: 16 },
  ffMonthCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ffMonthCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  ffMonthLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted },
  ffMonthLabelActive: { color: Colors.primary },
  ffMonthStatus: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  ffMonthStatusActive: { color: Colors.primary },

  // Outcome card (Step 4)
  outcomeCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 20, borderLeftWidth: 4, marginBottom: 16, alignItems: 'center', ...Shadows.medium },
  outcomeEmoji: { fontSize: 36, marginBottom: 8 },
  outcomeLabel: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  outcomeValue: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary },
  outcomeDelta: { fontFamily: Fonts.bold, fontSize: 14, marginTop: 6 },

  // Outcome detail card (Step 5)
  outcomeDetailCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, ...Shadows.medium },
  outcomeDetailTitle: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.6 },
  outcomeDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  outcomeDetailLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  outcomeDetailValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  outcomeDetailDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },

  // Lesson card (Step 5)
  lessonCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, borderLeftWidth: 4, marginBottom: 16, ...Shadows.soft },
  lessonTitle: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary, marginBottom: 8 },
  lessonText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Unlock card
  unlockCard: { borderRadius: Radii.lg, padding: 16, marginBottom: 16, width: '100%' },
  unlockPill: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 8 },
  unlockText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginBottom: 10 },
  unlockDivider: { height: 1, opacity: 0.2, marginBottom: 10 },
  unlockHint: { fontFamily: Fonts.regular, fontSize: 12 },

  // CTA
  ctaBtn: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },

  // Alert modals
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
