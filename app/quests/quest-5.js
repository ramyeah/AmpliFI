// app/quests/quest-5.js
// Quest 5 — Open Savings Goal Account
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image, TextInput,
  StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../lib/firebase';
import { openSavingsGoalAccount, completeStage } from '../../lib/lifeSim';
import { Colors, Fonts, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';

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

// ─── Data ───────────────────────────────────────────────────────────────────
const PRESET_GOALS = [
  { icon: '\u2708\uFE0F', label: 'Holiday Fund' },
  { icon: '\uD83D\uDCBB', label: 'New Laptop' },
  { icon: '\uD83C\uDFE0', label: 'House Down Payment' },
  { icon: '\uD83D\uDC8D', label: 'Wedding Fund' },
  { icon: '\uD83D\uDE97', label: 'Car Fund' },
  { icon: '\uD83D\uDCE6', label: 'Moving Out Fund' },
];

const months = Array.from({ length: 36 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() + i + 1);
  return {
    key: i,
    label: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}`,
    monthsAway: i + 1,
  };
});

// ─── Component ──────────────────────────────────────────────────────────────
export default function Quest5({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  const [step, setStep]                   = useState(1);
  const [selectedGoal, setSelectedGoal]   = useState(null);
  const [customGoalName, setCustomGoalName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [targetAmount, setTargetAmount]   = useState('');
  const [selectedDateIdx, setSelectedDateIdx] = useState(null);
  const [saving, setSaving]               = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError]         = useState(false);
  const [showConfetti, setShowConfetti]   = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────
  const effectiveGoalName = showCustomInput ? customGoalName : selectedGoal;
  const parsedTarget = parseInt(targetAmount) || 0;
  const monthlyContribution = (parsedTarget > 0 && selectedDateIdx !== null)
    ? Math.ceil(parsedTarget / months[selectedDateIdx].monthsAway)
    : 0;
  const savingsAmt = sim?.monthlyBudget?.savingsAmt ?? Infinity;
  const pct = Math.round((monthlyContribution / (sim?.income ?? 1)) * 100);

  const getContributionColor = () => {
    if (monthlyContribution <= savingsAmt) return MODULE_COLORS['module-3'].color;
    if (monthlyContribution > savingsAmt * 0.5 && monthlyContribution <= savingsAmt) return Colors.warningDark;
    return Colors.danger;
  };

  const getContributionTier = () => {
    if (monthlyContribution <= savingsAmt) return 'green';
    if (monthlyContribution > savingsAmt * 0.5 && monthlyContribution <= savingsAmt) return 'amber';
    return 'red';
  };

  // ── Reset on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep(1); setSelectedGoal(null); setCustomGoalName(''); setShowCustomInput(false);
      setTargetAmount(''); setSelectedDateIdx(null); setSaving(false);
      setShowExitConfirm(false); setShowError(false); setShowConfetti(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (step < 4) setShowExitConfirm(true);
    else onClose();
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      const parsedTargetVal = parseInt(targetAmount) || 0;
      const monthsAway = months[selectedDateIdx].monthsAway;
      const monthly = Math.ceil(parsedTargetVal / monthsAway);
      await openSavingsGoalAccount(uid, {
        goalName: effectiveGoalName,
        targetAmount: parsedTargetVal,
        targetDate: months[selectedDateIdx].label,
        monthlyContribution: monthly,
      });
      await completeStage(uid, 'stage-5', { goalName: effectiveGoalName, targetAmount: parsedTargetVal });
      setShowConfetti(true);
      setSaving(false);
      setStep(4);
    } catch (e) {
      setShowError(true);
      setSaving(false);
    }
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 && !saving ? (
          <TouchableOpacity style={st.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={st.backBtnText}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 5 \u00B7 Open Savings Goal Account'}</Text>
      <View style={st.stepPills}>{[1,2,3,4].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
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

  // ── Step 1 — Why a savings goal account? ─────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Give your savings{'\n'}a job</Text>
        <FinCard>Your bank account is for spending and bills. A savings goal account is different {'\u2014'} it has one job, one name, and one target. The moment you name an account, your brain treats it differently. You stop seeing it as money you can spend.</FinCard>
        <View style={st.infoGrid}>
          <View style={st.infoTile}><Text style={st.infoTileIcon}>{'\uD83E\uDDE0'}</Text><Text style={st.infoTileTitle}>Unnamed savings</Text><Text style={st.infoTileText}>Feels spendable {'\u2014'} brain treats it as available cash</Text></View>
          <View style={st.infoTile}><Text style={st.infoTileIcon}>{'\uD83C\uDFAF'}</Text><Text style={st.infoTileTitle}>Named goal account</Text><Text style={st.infoTileText}>Feels protected {'\u2014'} 31% higher goal achievement rate</Text></View>
        </View>
        <View style={[st.finCard, { marginTop: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Text style={{ fontSize: 20 }}>{'\uD83C\uDFE6'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 4 }}>Sub-account of {sim?.stage2Data?.bankName ?? 'your bank'}</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 }}>
                {sim?.stage2Data?.accountType === 'hysa'
                  ? `Earns ${((sim?.wallets?.find(w => w.type === 'bank')?.interestRate ?? 0) * 100).toFixed(2)}% p.a. \u2014 same as your HYSA`
                  : 'Earns 0.05% p.a. \u2014 upgrade to HYSA to earn more on this account too'
                }
              </Text>
            </View>
          </View>
        </View>
        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Set my first goal \u2192"}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 2 — Choose your goal ───────────────────────────────────────
  const getStep2FinText = () => {
    if (showCustomInput) return 'Perfect. The more personal the goal, the harder you will work to protect it.';
    if (!selectedGoal) return 'Give it a name that means something to you. The more specific, the more motivated you will be to protect it.';
    if (selectedGoal === 'Holiday Fund') return 'A travel fund is one of the most motivating savings goals. You can actually see the reward.';
    if (selectedGoal === 'House Down Payment') return 'The biggest purchase of your life deserves its own dedicated account. Start early \u2014 even FC 500 a month compounds significantly.';
    return 'A clear goal with a clear name. Your brain already treats this money differently.';
  };

  const step2CtaEnabled = selectedGoal || customGoalName.length >= 3;

  const renderStep2 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Choose your goal</Text>
        <View style={st.goalGrid}>
          {PRESET_GOALS.map(goal => (
            <TouchableOpacity
              key={goal.label}
              style={[st.goalCard, selectedGoal === goal.label && !showCustomInput ? st.goalCardSelected : st.goalCardUnselected]}
              onPress={() => { setSelectedGoal(goal.label); setShowCustomInput(false); }}
              activeOpacity={0.82}
            >
              <Text style={st.goalCardIcon}>{goal.icon}</Text>
              <Text style={[st.goalCardLabel, selectedGoal === goal.label && !showCustomInput && st.goalCardLabelSelected]}>{goal.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[st.goalCardFull, showCustomInput ? st.goalCardSelected : st.goalCardUnselected]}
          onPress={() => { setShowCustomInput(true); setSelectedGoal(null); }}
          activeOpacity={0.82}
        >
          <Text style={st.goalCardIcon}>{'\u270F\uFE0F'}</Text>
          <Text style={[st.goalCardLabel, showCustomInput && st.goalCardLabelSelected]}>My own goal...</Text>
        </TouchableOpacity>
        {showCustomInput && (
          <TextInput
            style={st.customInput}
            placeholder="e.g. Emergency Fund, New Camera..."
            placeholderTextColor={Colors.textMuted}
            value={customGoalName}
            onChangeText={setCustomGoalName}
            maxLength={40}
          />
        )}
        <FinCard>{getStep2FinText()}</FinCard>
        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={[st.ctaBtn, !step2CtaEnabled && st.ctaBtnDisabled]} onPress={() => step2CtaEnabled && setStep(3)} disabled={!step2CtaEnabled} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"This is my goal \u2192"}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 3 — Set your target ────────────────────────────────────────
  const step3CtaEnabled = parsedTarget > 0 && selectedDateIdx !== null;
  const contributionColor = getContributionColor();
  const contributionTier = getContributionTier();

  const getStep3FinText = () => {
    if (contributionTier === 'green') return 'This fits comfortably within your savings budget. You are on track.';
    if (contributionTier === 'amber') return 'That is most of your savings budget. Achievable but leaves little room for anything else.';
    return 'This exceeds your savings budget. Either extend the timeline or reduce the target.';
  };

  const renderStep3 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{'\uD83C\uDFAF'} {effectiveGoalName}</Text>

        <Text style={st.questSub}>Set your target amount</Text>
        <View style={st.amountRow}>
          <Image source={COIN} style={{ width: 24, height: 24 }} />
          <TextInput
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            value={targetAmount}
            onChangeText={setTargetAmount}
            style={st.amountInput}
          />
        </View>

        <Text style={[st.questSub, { marginTop: 20 }]}>Target date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.dateScroll} contentContainerStyle={st.dateScrollContent}>
          {months.map((m, i) => (
            <TouchableOpacity
              key={m.key}
              style={[st.datePill, selectedDateIdx === i ? st.datePillSelected : st.datePillUnselected]}
              onPress={() => setSelectedDateIdx(i)}
              activeOpacity={0.82}
            >
              <Text style={[st.datePillText, selectedDateIdx === i && st.datePillTextSelected]}>{m.label}</Text>
              <Text style={[st.datePillSub, selectedDateIdx === i && st.datePillSubSelected]}>{m.monthsAway}mo</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {parsedTarget > 0 && selectedDateIdx !== null && (
          <View style={st.calcCard}>
            <Text style={st.calcCardTitle}>To reach FC {parsedTarget.toLocaleString()} by {months[selectedDateIdx].label}:</Text>
            <View style={st.calcHeroRow}>
              <Text style={st.calcLabel}>Save</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Image source={COIN} style={{ width: 18, height: 18 }} />
                <Text style={[st.calcHeroNumber, { color: contributionColor, fontSize: 28 }]}>{monthlyContribution.toLocaleString()}</Text>
                <Text style={[st.calcLabel, { marginLeft: 2 }]}>/ month</Text>
              </View>
            </View>
            <Text style={st.calcSub}>{pct}% of your monthly income</Text>
          </View>
        )}

        {parsedTarget > 0 && selectedDateIdx !== null && (
          <FinCard>{getStep3FinText()}</FinCard>
        )}

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={[st.ctaBtn, !step3CtaEnabled && st.ctaBtnDisabled]} onPress={() => step3CtaEnabled && handleComplete()} disabled={!step3CtaEnabled || saving} activeOpacity={0.88}>
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Lock in my goal \u2192"}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 4 — Success ────────────────────────────────────────────────
  const bankName = sim?.stage2Data?.bankName ?? 'Your Bank';

  const renderStep4 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[st.content, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 56, marginTop: 8, marginBottom: 4 }}>{'\uD83C\uDF89'}</Text>
        <Text style={st.successTitle}>Goal account opened!</Text>

        <View style={[st.summaryCard, { width: '100%' }]}>
          {[
            { label: 'Goal', value: effectiveGoalName, bold: true },
            { label: 'Sub-account of', value: bankName },
            { label: 'Target', value: null, coin: parsedTarget },
            { label: 'Monthly', value: null, coin: monthlyContribution },
            { label: 'Target date', value: selectedDateIdx !== null ? months[selectedDateIdx].label : '' },
            { label: 'Interest', value: `${((sim?.wallets?.find(w => w.type === 'bank')?.interestRate ?? 0.0005) * 100).toFixed(2)}% p.a.${sim?.stage2Data?.accountType === 'hysa' ? ' \u26A1 HYSA' : ''}` },
          ].map((row, i, arr) => (
            <View key={i} style={[st.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={st.summaryLabel}>{row.label}</Text>
              {row.coin != null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Image source={COIN} style={{ width: 13, height: 13 }} />
                  <Text style={[st.summaryValue, row.bold && { fontFamily: Fonts.extraBold }]}>{row.coin.toLocaleString()}</Text>
                </View>
              ) : (
                <Text style={[st.summaryValue, row.bold && { fontFamily: Fonts.extraBold }]}>{row.value}</Text>
              )}
            </View>
          ))}
        </View>

        {sim?.stage2Data?.accountType !== 'hysa' && (
          <View style={{ backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, marginBottom: 12, width: '100%' }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.warningDark, lineHeight: 18 }}>{'\u26A0\uFE0F'} Upgrade to HYSA in the side quests to earn more interest on this account</Text>
          </View>
        )}
        <View style={st.unlockCard}>
          <Text style={st.unlockPill}>{'\uD83D\uDD13'} UNLOCKED</Text>
          <Text style={st.unlockText}>Savings goal created. Your money now has a destination.</Text>
          <View style={st.unlockDivider} />
          <Text style={st.unlockHint}>{'\uD83C\uDFAF'} Savings goal wallet appears on your dashboard</Text>
        </View>

        <FinCard>{sim?.stage2Data?.accountType === 'hysa' ? `Your savings goal earns the same rate as your HYSA \u2014 ${((sim?.wallets?.find(w => w.type === 'bank')?.interestRate ?? 0) * 100).toFixed(2)}% a year. Even while it sits there building toward your goal, it grows.` : 'Your savings goal is in a basic account earning almost nothing. Complete the HYSA upgrade side quest in Chapter 3 to fix that.'}</FinCard>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32, width: '100%' }}>
          <TouchableOpacity style={st.ctaBtn} onPress={onComplete} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Back to FinCity \u2192"}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
        <View style={st.backdrop}><View style={st.card}>
          {showConfetti && <QConfetti />}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
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

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  goalCard: { width: '47%', borderRadius: Radii.lg, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1.5 },
  goalCardFull: { width: '100%', borderRadius: Radii.lg, padding: 14, alignItems: 'center', flexDirection: 'row', gap: 10, borderWidth: 1.5, marginBottom: 16 },
  goalCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  goalCardUnselected: { borderColor: Colors.border, backgroundColor: Colors.white },
  goalCardIcon: { fontSize: 24 },
  goalCardLabel: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, textAlign: 'center' },
  goalCardLabelSelected: { color: Colors.primary },
  customInput: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.white, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.border, padding: 14, marginBottom: 16 },

  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, marginBottom: 8, ...Shadows.soft },
  amountInput: { fontFamily: Fonts.extraBold, fontSize: 32, color: Colors.textPrimary, flex: 1, padding: 0 },

  dateScroll: { marginBottom: 20 },
  dateScrollContent: { gap: 8, paddingVertical: 4 },
  datePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radii.lg, borderWidth: 1.5, alignItems: 'center' },
  datePillSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  datePillUnselected: { backgroundColor: Colors.white, borderColor: Colors.border },
  datePillText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary },
  datePillTextSelected: { color: Colors.white },
  datePillSub: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  datePillSubSelected: { color: 'rgba(255,255,255,0.7)' },

  calcCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 20, marginBottom: 16, ...Shadows.medium },
  calcCardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 14 },
  calcHeroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calcHeroNumber: { fontFamily: Fonts.extraBold },
  calcLabel: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  calcSub: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  successTitle: { fontFamily: Fonts.extraBold, fontSize: 26, color: Colors.textPrimary, marginBottom: 20, textAlign: 'center' },
  summaryCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, ...Shadows.soft },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },

  unlockCard: { backgroundColor: MODULE_COLORS['module-1'].colorLight, borderRadius: Radii.lg, padding: 16, marginBottom: 16, width: '100%' },
  unlockPill: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 8 },
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
