// app/quests/quest-9.js
// Quest 9 — First Investment
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image,
  StyleSheet, Dimensions, Easing,
} from 'react-native';
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

// ─── Component ───────────────────────────────────────────────────────────────
export default function Quest9({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  // ── Derived ──────────────────────────────────────────────────────────────
  const savingsAmt = sim?.monthlyBudget?.savingsAmt ?? 0;
  const bankWallet = (sim?.wallets ?? []).find(w => w.type === 'bank');
  const bankBalance = bankWallet?.balance ?? 0;
  const vehicle = sim?.investmentVehicle ?? { id: 'nestvault', name: 'NestVault', type: 'Robo-Advisor', icon: '\uD83E\uDD16', ter: 0.65, annualReturn: { min: 6, max: 7, display: '6\u20137%' } };
  const midReturn = (vehicle.annualReturn.min + vehicle.annualReturn.max) / 2;

  // ── State ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [dcaPct, setDcaPct] = useState(50);
  const [saving, setSaving] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const coinFlowAnim = useRef(new Animated.Value(0)).current;

  // ── Computed ─────────────────────────────────────────────────────────────
  const dcaAmount = Math.round(savingsAmt * (dcaPct / 100));

  // ── Reset on open ────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep(1); setDcaPct(50); setSaving(false); setShowConfetti(false);
      setShowExitConfirm(false); setShowError(false);
      setProcessingStep(0); setPurchaseComplete(false);
      coinFlowAnim.setValue(0);
    }
  }, [visible]);

  // ── Step 3 processing animation ──────────────────────────────────────────
  useEffect(() => {
    if (step !== 3) return;
    coinFlowAnim.setValue(0); setProcessingStep(0); setPurchaseComplete(false);
    const run = async () => {
      await new Promise(r => setTimeout(r, 600));
      setProcessingStep(1);
      await new Promise(r => setTimeout(r, 1000));
      setProcessingStep(2);
      Animated.timing(coinFlowAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
      await new Promise(r => setTimeout(r, 1400));
      setProcessingStep(3);
      await new Promise(r => setTimeout(r, 1000));
      setProcessingStep(4);
      await new Promise(r => setTimeout(r, 800));
      setProcessingStep(5);
      setPurchaseComplete(true);
    };
    run();
  }, [step]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (step < 4) setShowExitConfirm(true);
    else onClose();
  };

  const handleCreatePortfolio = async () => {
    try {
      const uid = auth.currentUser?.uid;
      const bw = (sim?.wallets ?? []).find(w => w.type === 'bank');
      if (!bw) return;
      const investmentWallet = {
        id: 'investment', type: 'investment', label: vehicle.name, icon: vehicle.icon,
        balance: dcaAmount, interestRate: midReturn / 100,
        color: MODULE_COLORS['module-4'].color, colorLight: MODULE_COLORS['module-4'].colorLight,
        vehicle: vehicle.type, vehicleId: vehicle.id, ter: vehicle.ter,
        monthlyDCA: dcaAmount, openedMonth: sim?.currentMonth ?? 1,
      };
      const updatedWallets = [
        ...(sim?.wallets ?? []).map(w => w.id === bw.id ? { ...w, balance: Math.max(0, (w.balance ?? 0) - dcaAmount) } : w),
        investmentWallet,
      ];
      await updateDoc(doc(db, 'simProgress', uid), { wallets: updatedWallets, monthlyDCA: dcaAmount, dcaPct, updatedAt: Date.now() });
    } catch (e) { console.error('createPortfolio error:', e); }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      await completeStage(uid, 'stage-9', { vehicleId: vehicle.id, dcaAmount, dcaPct });
      setShowConfetti(true);
      onComplete();
    } catch (e) { setShowError(true); setSaving(false); }
  };

  // ── 10-year projection ───────────────────────────────────────────────────
  const project10yr = () => {
    let bal = 0;
    const mr = midReturn / 100 / 12;
    const mf = vehicle.ter / 100 / 12;
    for (let m = 0; m < 120; m++) { bal += dcaAmount; bal *= (1 + mr); bal *= (1 - mf); }
    return Math.round(bal);
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
      <Text style={st.headerTitle}>{'Quest 9 \u00B7 First Investment'}</Text>
      <View style={st.stepPills}>{[1,2,3,4].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  // ── Fin card helper ────────────────────────────────────────────────────
  const FinCard = ({ children }) => (
    <View style={st.finCard}>
      <View style={st.finCardTop}>
        <View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View>
        <Text style={st.finCardLabel}>FIN SAYS</Text>
      </View>
      <Text style={st.finCardText}>{children}</Text>
    </View>
  );

  // ── Step 1 — What is DCA? ───────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{'Dollar-Cost\nAveraging'}</Text>

        <FinCard>DCA means investing a fixed amount at regular intervals {'\u2014'} regardless of what the market is doing. You do not try to time the market. You just keep buying. When prices are high you buy fewer units. When prices are low you buy more. Over time, your average cost per unit ends up lower than if you had tried to time it perfectly.</FinCard>

        {[
          { icon: '\uD83D\uDCC5', title: 'Invest on a schedule', desc: 'Same amount, same day every month. Remove emotion from the equation.' },
          { icon: '\uD83D\uDCC9', title: 'Buy more when markets are cheap', desc: 'A fixed amount buys more units when prices drop. Downturns become buying opportunities.' },
          { icon: '\uD83E\uDDD8', title: 'Remove the stress of timing', desc: 'Nobody consistently times the market. DCA removes the need to try. Just stay consistent.' },
        ].map((card, i) => (
          <View key={i} style={st.conceptCard}>
            <Text style={st.conceptIcon}>{card.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={st.conceptTitle}>{card.title}</Text>
              <Text style={st.conceptDesc}>{card.desc}</Text>
            </View>
          </View>
        ))}

        <View style={st.vehicleContextRow}>
          <Text style={st.vehicleContextText}>{vehicle.icon} Your vehicle: {vehicle.name} {'\u00B7'} {vehicle.annualReturn.display} {'\u00B7'} {vehicle.ter}% TER</Text>
        </View>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}>
            <Text style={st.ctaBtnText}>{"Set my DCA amount \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 2 — Set DCA amount ─────────────────────────────────────────────
  const renderStep2 = () => {
    const projected10yr = project10yr();
    const totalContributed = dcaAmount * 120;
    const investmentGain = projected10yr - totalContributed;

    const getFinAdvice = () => {
      if (dcaPct <= 25) return 'A conservative start. You are protecting most of your savings while still building the investing habit. You can always increase this later.';
      if (dcaPct <= 50) return 'A solid balance. Half your savings builds your safety net, half goes to work in the market. This is the sweet spot for most fresh investors.';
      if (dcaPct <= 75) return 'Aggressive allocation. This works if your emergency fund is already funded and your savings goal is on track. Make sure you have a buffer before going this hard.';
      return 'You are putting your entire savings budget into investments. Only do this if your emergency fund is fully funded and you have no short-term savings goals.';
    };

    const quickPcts = [25, 50, 75, 100];
    const remaining = savingsAmt - dcaAmount;

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>{'How much to invest\nmonthly?'}</Text>

          <View style={st.savingsContextCard}>
            <Text style={st.savingsContextLabel}>YOUR MONTHLY SAVINGS BUDGET</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Image source={COIN} style={{ width: 18, height: 18 }} />
              <Text style={st.savingsContextValue}>{savingsAmt.toLocaleString()}</Text>
            </View>
          </View>

          <View style={st.quickSelectRow}>
            {quickPcts.map(pct => {
              const selected = dcaPct === pct;
              const amt = Math.round(savingsAmt * (pct / 100));
              return (
                <TouchableOpacity key={pct} style={[st.quickSelectBtn, selected && st.quickSelectBtnActive]} onPress={() => setDcaPct(pct)} activeOpacity={0.82}>
                  <Text style={[st.quickSelectText, selected && st.quickSelectTextActive]}>{pct}%</Text>
                  <Text style={[st.quickSelectAmt, selected && st.quickSelectAmtActive]}>FC {amt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginBottom: 20, paddingHorizontal: 4 }}>
            <Slider
              minimumValue={10}
              maximumValue={100}
              step={5}
              value={dcaPct}
              onValueChange={val => setDcaPct(val)}
              minimumTrackTintColor={MODULE_COLORS['module-4'].color}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={MODULE_COLORS['module-4'].color}
            />
          </View>

          <View style={st.dcaAmountCard}>
            <Text style={st.dcaAmountLabel}>INVESTING MONTHLY</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Image source={COIN} style={{ width: 24, height: 24 }} />
              <Text style={st.dcaAmountValue}>{dcaAmount.toLocaleString()}</Text>
            </View>
            <Text style={st.dcaAmountSub}>{dcaPct}% of your savings budget</Text>
          </View>

          <Text style={[st.remainingText, { color: remaining > 0 ? Colors.successDark : Colors.warningDark }]}>
            FC {remaining.toLocaleString()} stays as savings each month
          </Text>

          <View style={st.projectionCard}>
            <Text style={st.projectionTitle}>10-Year Projection</Text>
            <View style={st.projectionRow}>
              <Text style={st.projectionLabel}>Total invested</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Image source={COIN} style={{ width: 12, height: 12 }} />
                <Text style={st.projectionValue}>{totalContributed.toLocaleString()}</Text>
              </View>
            </View>
            <View style={st.projectionRow}>
              <Text style={st.projectionLabel}>Investment gains</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Image source={COIN} style={{ width: 12, height: 12 }} />
                <Text style={[st.projectionValue, { color: Colors.successDark }]}>+{investmentGain.toLocaleString()}</Text>
              </View>
            </View>
            <View style={st.projectionDivider} />
            <View style={st.projectionRow}>
              <Text style={[st.projectionLabel, st.bold]}>Portfolio value</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Image source={COIN} style={{ width: 14, height: 14 }} />
                <Text style={[st.projectionValueBig, { color: MODULE_COLORS['module-4'].color }]}>{projected10yr.toLocaleString()}</Text>
              </View>
            </View>
            <Text style={st.projectionNote}>At {vehicle.annualReturn.display} after {vehicle.ter}% fees</Text>
          </View>

          <FinCard>{getFinAdvice()}</FinCard>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={st.ctaBtn} onPress={async () => { await handleCreatePortfolio(); setStep(3); }} activeOpacity={0.88}>
              <Text style={st.ctaBtnText}>{`Confirm FC ${dcaAmount.toLocaleString()}/month \u2192`}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 3 — First purchase animation ────────────────────────────────────
  const renderStep3 = () => {
    const coinTranslateX = coinFlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SW * 0.4] });
    const coinOpacity = coinFlowAnim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });

    const processingItems = [
      { label: 'Order placed', stepNum: 1 },
      { label: 'Executing trade', stepNum: 2 },
      { label: 'Units purchased', stepNum: 3 },
      { label: 'Portfolio created', stepNum: 4 },
    ];

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>Placing your first order</Text>

          <View style={st.coinTransferRow}>
            <View style={st.transferSource}>
              <Text style={{ fontSize: 28 }}>{'\uD83C\uDFE6'}</Text>
              <Text style={st.transferLabel}>Bank</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                <Image source={COIN} style={{ width: 11, height: 11 }} />
                <Text style={st.transferBalance}>{bankBalance.toLocaleString()}</Text>
              </View>
            </View>

            <View style={st.transferArrowContainer}>
              <Text style={st.transferArrow}>{'\u2192'}</Text>
              <Animated.View style={{ position: 'absolute', left: 0, transform: [{ translateX: coinTranslateX }], opacity: coinOpacity }}>
                <Image source={COIN} style={{ width: 20, height: 20 }} />
              </Animated.View>
            </View>

            <View style={st.transferSource}>
              <Text style={{ fontSize: 28 }}>{vehicle.icon}</Text>
              <Text style={st.transferLabel}>{vehicle.name}</Text>
            </View>
          </View>

          <View style={st.processingContainer}>
            {processingItems.map((item, i) => {
              const done = processingStep > item.stepNum;
              const active = processingStep === item.stepNum;
              return (
                <View key={i} style={st.processingRow}>
                  <View style={[st.processingDot, done && st.processingDotDone, active && st.processingDotActive]}>
                    {done && <Text style={{ color: Colors.white, fontSize: 10, fontFamily: Fonts.bold }}>{'\u2713'}</Text>}
                    {active && <ActivityIndicator size="small" color={MODULE_COLORS['module-4'].color} />}
                  </View>
                  <Text style={[st.processingLabel, done && st.processingLabelDone]}>{item.label}</Text>
                </View>
              );
            })}
          </View>

          {purchaseComplete && (
            <View style={st.successMiniCard}>
              <View style={st.successRow}>
                <Text style={st.successLabel}>Amount invested</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Image source={COIN} style={{ width: 12, height: 12 }} />
                  <Text style={st.successValue}>{dcaAmount.toLocaleString()}</Text>
                </View>
              </View>
              <View style={st.successRow}>
                <Text style={st.successLabel}>Vehicle</Text>
                <Text style={st.successValue}>{vehicle.name}</Text>
              </View>
              <View style={st.successRow}>
                <Text style={st.successLabel}>Next purchase</Text>
                <Text style={st.successValue}>Month {(sim?.currentMonth ?? 1) + 1}</Text>
              </View>
            </View>
          )}

          {purchaseComplete && (
            <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
              <TouchableOpacity style={st.ctaBtn} onPress={() => { setStep(4); setShowConfetti(true); }} activeOpacity={0.88}>
                <Text style={st.ctaBtnText}>{"See my portfolio \u2192"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </>
    );
  };

  // ── Step 4 — Success ────────────────────────────────────────────────────
  const renderStep4 = () => {
    const getVehicleAdvice = () => {
      if (vehicle.id === 'nestvault') return `NestVault is now managing your money. Every month advance, FC ${dcaAmount.toLocaleString()} flows in automatically and the algorithm puts it to work. Your job is to not touch it when markets get scary.`;
      if (vehicle.id === 'drakon-rss') return `Your Drakon RSS Plan is active. FC ${dcaAmount.toLocaleString()} auto-invests every month into a diversified ETF basket. Low fees, steady accumulation. Let it run.`;
      if (vehicle.id === 'apextrade-diy') return `Your DIY portfolio is live. You have the lowest fees and the most control. Set a monthly reminder to review your allocation \u2014 DIY only works if you stay engaged. Do not let it go stale.`;
      return `Your portfolio with ${vehicle.name} is now live. FC ${dcaAmount.toLocaleString()} will be invested automatically every month. Stay consistent and let compounding do its work.`;
    };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>Your portfolio is live</Text>

          <View style={st.portfolioCard}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>{vehicle.icon}</Text>
            <Text style={st.portfolioName}>{vehicle.name}</Text>
            <Text style={st.portfolioType}>{vehicle.type}</Text>
            <View style={st.portfolioStatsRow}>
              <View style={st.portfolioStat}>
                <Text style={st.portfolioStatLabel}>Invested</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <Image source={COIN} style={{ width: 12, height: 12 }} />
                  <Text style={st.portfolioStatValue}>{dcaAmount.toLocaleString()}</Text>
                </View>
              </View>
              <View style={st.portfolioStat}>
                <Text style={st.portfolioStatLabel}>Monthly DCA</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <Image source={COIN} style={{ width: 12, height: 12 }} />
                  <Text style={st.portfolioStatValue}>{dcaAmount.toLocaleString()}</Text>
                </View>
              </View>
              <View style={st.portfolioStat}>
                <Text style={st.portfolioStatLabel}>Return</Text>
                <Text style={[st.portfolioStatValue, { marginTop: 2 }]}>{vehicle.annualReturn.display}</Text>
              </View>
            </View>
          </View>

          <View style={st.unlockCard}>
            <Text style={st.unlockPill}>{'\uD83D\uDD13'} UNLOCKED</Text>
            <Text style={st.unlockText}>First investment made. Your money is working for you.</Text>
            <View style={st.unlockDivider} />
            <Text style={st.unlockHint}>{'\uD83D\uDCC8'} Investment wallet appears on your dashboard</Text>
            <Text style={[st.unlockHint, { marginTop: 4 }]}>{'\uD83D\uDC9C'} Portfolio tab now accessible</Text>
          </View>

          <FinCard>{getVehicleAdvice()}</FinCard>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={[st.ctaBtn, saving && st.ctaBtnDisabled]} onPress={handleComplete} disabled={saving} activeOpacity={0.88}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Back to FinCity \u2192"}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
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
  finCardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: MODULE_COLORS['module-4'].colorLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  finCardLabel: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-4'].color, letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: MODULE_COLORS['module-4'].colorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden' },
  finCardText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Step 1 — concept cards
  conceptCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, alignItems: 'flex-start', ...Shadows.soft },
  conceptIcon: { fontSize: 22, width: 30 },
  conceptTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 3 },
  conceptDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  vehicleContextRow: { backgroundColor: Colors.white, borderRadius: Radii.lg, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8, marginBottom: 8, alignItems: 'center', ...Shadows.soft },
  vehicleContextText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  // Step 2 — DCA amount
  savingsContextCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 20, alignItems: 'center', ...Shadows.soft },
  savingsContextLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  savingsContextValue: { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.textPrimary },

  quickSelectRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickSelectBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  quickSelectBtnActive: { borderColor: MODULE_COLORS['module-4'].color, backgroundColor: MODULE_COLORS['module-4'].color },
  quickSelectText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted },
  quickSelectTextActive: { color: Colors.white },
  quickSelectAmt: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  quickSelectAmtActive: { color: 'rgba(255,255,255,0.8)' },

  dcaAmountCard: { backgroundColor: MODULE_COLORS['module-4'].colorLight, borderRadius: Radii.xl, padding: 20, alignItems: 'center', marginBottom: 12 },
  dcaAmountLabel: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-4'].color, letterSpacing: 1, textTransform: 'uppercase' },
  dcaAmountValue: { fontFamily: Fonts.extraBold, fontSize: 36, color: MODULE_COLORS['module-4'].color },
  dcaAmountSub: { fontFamily: Fonts.regular, fontSize: 13, color: MODULE_COLORS['module-4'].color, marginTop: 4 },

  remainingText: { fontFamily: Fonts.regular, fontSize: 13, textAlign: 'center', marginBottom: 20 },

  projectionCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, ...Shadows.soft },
  projectionTitle: { fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 14 },
  projectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  projectionLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  projectionValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  projectionValueBig: { fontFamily: Fonts.extraBold, fontSize: 18 },
  projectionDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  projectionNote: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 6 },

  // Step 3 — processing animation
  coinTransferRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 24, marginBottom: 20 },
  transferSource: { alignItems: 'center', width: 80 },
  transferLabel: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary, marginTop: 4 },
  transferBalance: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  transferArrowContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 30 },
  transferArrow: { fontSize: 24, color: Colors.textMuted },

  processingContainer: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, gap: 16, ...Shadows.soft },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  processingDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border },
  processingDotDone: { backgroundColor: Colors.successDark, borderColor: Colors.successDark },
  processingDotActive: { borderColor: MODULE_COLORS['module-4'].color, backgroundColor: Colors.white },
  processingLabel: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  processingLabelDone: { fontFamily: Fonts.bold, color: Colors.textPrimary },

  successMiniCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, ...Shadows.soft },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  successLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  successValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },

  // Step 4 — portfolio card
  portfolioCard: { backgroundColor: MODULE_COLORS['module-4'].color, borderRadius: Radii.xl, padding: 24, alignItems: 'center', marginBottom: 16, ...Shadows.medium },
  portfolioName: { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.white },
  portfolioType: { fontFamily: Fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: 16 },
  portfolioStatsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  portfolioStat: { alignItems: 'center', flex: 1 },
  portfolioStatLabel: { fontFamily: Fonts.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.6 },
  portfolioStatValue: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.white },

  unlockCard: { backgroundColor: '#E0F7F5', borderRadius: Radii.lg, padding: 16, marginBottom: 16, width: '100%' },
  unlockPill: { fontFamily: Fonts.bold, fontSize: 10, color: '#0D9488', letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 8 },
  unlockText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginBottom: 10 },
  unlockDivider: { height: 1, backgroundColor: '#0D9488', opacity: 0.2, marginBottom: 10 },
  unlockHint: { fontFamily: Fonts.regular, fontSize: 12, color: '#0D9488' },

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
