// app/quests/quest-4.js
// Quest 4 — Build Your Budget
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView, Animated,
  StyleSheet, Alert, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../lib/firebase';
import { saveSimProgress, completeStage } from '../../lib/lifeSim';
import { Colors, Fonts, Radii, Shadows, Spacing, MODULE_COLORS } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const COIN = require('../../assets/coin.png');

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4F46E5', '#059669', '#F59E0B', '#EC4899', '#0891B2'];
function ConfettiPiece({ delay, color, startX, size }) {
  const y = useRef(new Animated.Value(-30)).current; const x = useRef(new Animated.Value(0)).current; const opacity = useRef(new Animated.Value(0)).current; const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => { const drift = (Math.random() - 0.5) * 160; setTimeout(() => { Animated.parallel([Animated.timing(y, { toValue: SH * 0.7, duration: 2400, useNativeDriver: true }), Animated.timing(x, { toValue: drift, duration: 2400, useNativeDriver: true }), Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0, duration: 700, delay: 1500, useNativeDriver: true })]), Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true })]).start(); }, delay); }, []);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() > 0.5 ? 540 : -720}deg`] });
  return <Animated.View style={{ position: 'absolute', left: startX, top: 0, width: size, height: size, borderRadius: Math.random() > 0.5 ? size / 2 : 2, backgroundColor: color, opacity, transform: [{ translateY: y }, { translateX: x }, { rotate: spin }] }} />;
}
function QConfetti() { const pieces = Array.from({ length: 50 }, (_, i) => ({ id: i, delay: Math.random() * 1000, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], startX: Math.random() * SW, size: 6 + Math.random() * 8 })); return <View style={StyleSheet.absoluteFill} pointerEvents="none">{pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}</View>; }

const METHODS = [
  { id: '50/30/20', label: '50/30/20', tagline: 'Simple & structured', sub: '50% needs, 30% wants, 20% savings', icon: '\uD83D\uDCCA',
    finLine: 'Simple, proven, and actually sustainable. 50% covers your essentials, 30% means you still have a life, and 20% builds your future. For a fresh grad this is the best starting framework.' },
  { id: 'zero-based', label: 'Zero-Based', tagline: 'Maximum control', sub: 'Income minus all expenses = 0', icon: '\uD83C\uDFAF',
    finLine: 'Every coin has a job before the month starts. It takes more discipline but gives you maximum visibility over where your money goes. Best for people who want total control.' },
  { id: 'pay-yourself-first', label: 'Pay Yourself First', tagline: 'Savings-focused', sub: 'Set savings aside first, spend the rest', icon: '\uD83D\uDCB0',
    finLine: 'Transfer your savings the moment your salary lands \u2014 before you spend a single coin. Whatever is left is yours to spend guilt-free. This method removes willpower from the equation entirely.' },
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function Quest3({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  const [step, setStep]             = useState(1);
  const [method, setMethod]         = useState('50/30/20');
  const [needsPct, setNeedsPct]     = useState(50);
  const [savingsPct, setSavingsPct] = useState(20);
  const [saving, setSaving]         = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError]   = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const income   = sim?.income ?? 0;
  const wantsPct = Math.max(0, 100 - needsPct - savingsPct);
  const needsAmt   = Math.round(income * needsPct / 100);
  const wantsAmt   = Math.round(income * wantsPct / 100);
  const savingsAmt = Math.round(income * savingsPct / 100);

  useEffect(() => {
    if (visible) { setStep(1); setMethod('50/30/20'); setNeedsPct(50); setSavingsPct(20); setSaving(false); setShowConfetti(false); }
  }, [visible]);

  const handleClose = () => {
    if (step < 5) setShowExitConfirm(true);
    else onClose();
  };

  const handleNeedsChange = (v) => {
    const n = Math.round(v);
    if (100 - n - savingsPct < 0) return;
    setNeedsPct(n);
  };

  const handleSavingsChange = (v) => {
    const s = Math.max(10, Math.round(v));
    if (100 - needsPct - s < 0) return;
    setSavingsPct(s);
  };

  const handleLockIn = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      const budgetData = { method, needsPct, wantsPct, savingsPct, needsAmt, wantsAmt, savingsAmt };
      await saveSimProgress(uid, { monthlyBudget: budgetData });
      await completeStage(uid, 'stage-4', budgetData);
      setSaving(false);
      setShowConfetti(true);
      setStep(5);
    } catch (e) {
      setShowError(true);
      setSaving(false);
    }
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 && !saving ? <TouchableOpacity style={st.backBtn} onPress={() => setStep(step - 1)}><Text style={st.backBtnText}>{'\u2039'} Back</Text></TouchableOpacity> : <View style={{ width: 60 }} />}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 4 · Build Your Budget'}</Text>
      <View style={st.stepPills}>{[1,2,3,4,5].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  const FinCard = ({ text }) => (
    <View style={st.finCard}>
      <View style={st.finCardTop}><View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View><Text style={st.finCardLabel}>FIN SAYS</Text></View>
      <Text style={st.finCardText}>{text}</Text>
    </View>
  );

  // ── Step 1 — Why budget? ──────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Why budget?</Text>
        <FinCard text={'Most people spend first and save whatever is left. That\'s why most people have nothing saved. You\'re going to do it the other way \u2014 decide your savings rate first, then live on the rest. This one habit is responsible for more financial independence stories than any investment return.'} />
        <View style={st.infoGrid}>
          <View style={st.infoTile}><Text style={st.infoTileIcon}>{'\uD83E\uDDE0'}</Text><Text style={st.infoTileTitle}>Most people</Text><Text style={st.infoTileText}>Spend first, save what's left</Text></View>
          <View style={st.infoTile}><Text style={st.infoTileIcon}>{'\u26A1'}</Text><Text style={st.infoTileTitle}>Smart move</Text><Text style={st.infoTileText}>Save first, spend what's left</Text></View>
        </View>
        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Show me the methods \u2192"}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 2 — Choose method ────────────────────────────────────────────
  const renderStep2 = () => {
    const selectedMethod = METHODS.find(m => m.id === method);
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>Choose your{'\n'}method</Text>
          {METHODS.map(m => (
            <TouchableOpacity key={m.id} style={[st.methodCard, method === m.id && st.methodCardActive]} onPress={() => setMethod(m.id)} activeOpacity={0.85}>
              <View style={st.methodHeader}>
                <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.methodLabel}>{m.label}</Text>
                  <Text style={st.methodTagline}>{m.tagline}</Text>
                </View>
                {method === m.id && <Text style={st.methodCheck}>{'\u2713'}</Text>}
              </View>
              <Text style={st.methodSub}>{m.sub}</Text>
            </TouchableOpacity>
          ))}
          <FinCard text={selectedMethod?.finLine ?? ''} />
          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(3)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Use this method \u2192"}</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 3 — Set your split ───────────────────────────────────────────
  const renderStep3 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Set your split</Text>
        <View style={st.incomeRow}>
          <Text style={st.incomeLabel}>Your monthly income</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN} style={{ width: 16, height: 16 }} /><Text style={st.incomeValue}>{income.toLocaleString()}</Text></View>
        </View>

        {/* Needs slider */}
        <View style={st.sliderCard}>
          <View style={st.sliderHeader}>
            <Text style={{ fontSize: 16 }}>{'\uD83C\uDFE0'}</Text>
            <Text style={st.sliderLabel}>Needs</Text>
            <Text style={[st.sliderPct, { color: MODULE_COLORS['module-2'].color }]}>{needsPct}%</Text>
          </View>
          <Slider style={{ width: '100%', height: 36 }} minimumValue={30} maximumValue={70} step={1} value={needsPct} onValueChange={handleNeedsChange} minimumTrackTintColor={MODULE_COLORS['module-2'].color} thumbTintColor={MODULE_COLORS['module-2'].color} />
          <View style={st.sliderAmtRow}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={[st.sliderAmt, { color: MODULE_COLORS['module-2'].color }]}>{needsAmt.toLocaleString()}</Text></View>
        </View>

        {/* Wants — display only */}
        <View style={st.sliderCard}>
          <View style={st.sliderHeader}>
            <Text style={{ fontSize: 16 }}>{'\uD83C\uDFAF'}</Text>
            <Text style={st.sliderLabel}>Wants</Text>
            <Text style={[st.sliderPct, { color: Colors.primary }]}>{wantsPct}%</Text>
          </View>
          <View style={st.wantsBar}><View style={[st.wantsFill, { width: `${wantsPct}%` }]} /></View>
          <View style={st.sliderAmtRow}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={[st.sliderAmt, { color: Colors.primary }]}>{wantsAmt.toLocaleString()}</Text></View>
          <Text style={st.wantsNote}>Auto-calculated: 100% - Needs - Savings</Text>
        </View>

        {/* Savings slider */}
        <View style={st.sliderCard}>
          <View style={st.sliderHeader}>
            <Text style={{ fontSize: 16 }}>{'\uD83D\uDCB0'}</Text>
            <Text style={st.sliderLabel}>Savings</Text>
            <Text style={[st.sliderPct, { color: MODULE_COLORS['module-3'].color }]}>{savingsPct}%</Text>
          </View>
          <Slider style={{ width: '100%', height: 36 }} minimumValue={10} maximumValue={40} step={1} value={savingsPct} onValueChange={handleSavingsChange} minimumTrackTintColor={MODULE_COLORS['module-3'].color} thumbTintColor={MODULE_COLORS['module-3'].color} />
          <View style={st.sliderAmtRow}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={[st.sliderAmt, { color: MODULE_COLORS['module-3'].color }]}>{savingsAmt.toLocaleString()}</Text></View>
          {savingsPct <= 10 && <Text style={st.savingsWarn}>Saving less than 10% makes it very hard to reach your FI number.</Text>}
        </View>
        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(4)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"This looks right \u2192"}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 4 — Summary + lock in ────────────────────────────────────────
  const renderStep4 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Your Budget Plan</Text>
        <View style={st.allocCard}>
          {[
            { icon: '\uD83C\uDFE0', label: 'Needs', pct: needsPct, amt: needsAmt, color: MODULE_COLORS['module-2'].color },
            { icon: '\uD83C\uDFAF', label: 'Wants', pct: wantsPct, amt: wantsAmt, color: Colors.primary },
            { icon: '\uD83D\uDCB0', label: 'Savings', pct: savingsPct, amt: savingsAmt, color: MODULE_COLORS['module-3'].color },
          ].map((r, i) => (
            <View key={i} style={st.allocRow}>
              <Text style={{ fontSize: 18 }}>{r.icon}</Text>
              <Text style={st.allocLabel}>{r.label}</Text>
              <Text style={[st.allocPct, { color: r.color }]}>{r.pct}%</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN} style={{ width: 12, height: 12 }} /><Text style={[st.allocAmt, { color: r.color }]}>{r.amt.toLocaleString()}</Text></View>
            </View>
          ))}
        </View>
        <FinCard text={'Needs are locked and auto-deduct every month. Savings move automatically. The wants budget is yours to manage \u2014 life events will test it. You\'re set up. Now let time do its work.'} />
        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={[st.ctaBtn, saving && st.ctaBtnDisabled]} onPress={handleLockIn} disabled={saving} activeOpacity={0.88}>
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Lock it in \u2192"}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 5 — What happens next ────────────────────────────────────────
  const renderStep5 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[st.content, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>You're set up</Text>
        <View style={st.timelineCard}>
          {[
            { icon: '\uD83D\uDCC5', title: 'Every month', text: `FC ${needsAmt.toLocaleString()} auto-deducted for needs` },
            { icon: '\uD83D\uDCB8', title: 'Every month', text: `FC ${savingsAmt.toLocaleString()} moves to savings` },
            { icon: '\uD83C\uDFAF', title: 'Your call', text: `FC ${wantsAmt.toLocaleString()} is yours to spend or save` },
          ].map((item, i) => (
            <View key={i} style={st.timelineRow}>
              <View style={st.timelineIcon}><Text style={{ fontSize: 18 }}>{item.icon}</Text></View>
              <View style={{ flex: 1 }}><Text style={st.timelineTitle}>{item.title}</Text><Text style={st.timelineText}>{item.text}</Text></View>
            </View>
          ))}
        </View>
        <FinCard text={`Budget active. Every month from now, FC ${needsAmt.toLocaleString()} auto-deducts for needs and FC ${savingsAmt.toLocaleString()} moves to savings. The only variable is how much of your wants budget you actually spend. That's where the interesting decisions happen.`} />
        <View style={st.unlockCard}>
          <Text style={st.unlockPill}>{'\uD83D\uDD13'} UNLOCKED</Text>
          <Text style={st.unlockText}>Budget locked in. Your money now has a plan.</Text>
          <View style={st.unlockDivider} />
          <Text style={st.unlockHint}>{'\uD83D\uDCB8'} Needs auto-deducted each month</Text>
        </View>
        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32, width: '100%' }}>
          <TouchableOpacity style={st.ctaBtn} onPress={onComplete} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Back to FinCity \u2192"}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
        <View style={st.backdrop}><View style={st.card}>
          {showConfetti && <QConfetti />}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </View></View>
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

  finCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  finCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  finCardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: MODULE_COLORS['module-1'].colorLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  finCardLabel: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: MODULE_COLORS['module-1'].colorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden' },
  finCardText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  infoTile: { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, alignItems: 'center', gap: 6, ...Shadows.soft },
  infoTileIcon: { fontSize: 24 },
  infoTileTitle: { fontFamily: Fonts.extraBold, fontSize: 13, color: Colors.textPrimary, textAlign: 'center' },
  infoTileText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },

  // Method cards
  methodCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: Colors.border, ...Shadows.soft },
  methodCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  methodHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  methodLabel: { fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary },
  methodTagline: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  methodCheck: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.primary },
  methodSub: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, marginLeft: 30 },

  // Slider cards
  incomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, ...Shadows.soft },
  incomeLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  incomeValue: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary },
  sliderCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 12, ...Shadows.soft },
  sliderHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  sliderPct: { fontFamily: Fonts.extraBold, fontSize: 18 },
  sliderAmtRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  sliderAmt: { fontFamily: Fonts.bold, fontSize: 14 },
  wantsBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginVertical: 12, overflow: 'hidden' },
  wantsFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  wantsNote: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  savingsWarn: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.warningDark, marginTop: 6, backgroundColor: Colors.warningLight, borderRadius: Radii.sm, padding: 8 },

  // Allocation summary
  allocCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, ...Shadows.soft },
  allocRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  allocLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  allocPct: { fontFamily: Fonts.extraBold, fontSize: 15, width: 40, textAlign: 'right' },
  allocAmt: { fontFamily: Fonts.bold, fontSize: 13 },

  // Timeline
  timelineCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, width: '100%', ...Shadows.soft },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  timelineIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  timelineTitle: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  timelineText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textPrimary, marginTop: 2 },

  // Reward
  unlockCard: { backgroundColor: MODULE_COLORS['module-1'].colorLight, borderRadius: Radii.lg, padding: 16, marginBottom: 16, width: '100%' },
  unlockPill: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 8 },
  unlockText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginBottom: 10 },
  unlockDivider: { height: 1, backgroundColor: MODULE_COLORS['module-1'].color, opacity: 0.2, marginBottom: 10 },
  unlockHint: { fontFamily: Fonts.regular, fontSize: 12, color: MODULE_COLORS['module-1'].color },

  ctaContainer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
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
