// app/quests/quest-3.js
// Quest 3 — First Paycheck
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Image, Animated,
  StyleSheet, Dimensions, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../lib/firebase';
import { saveSimProgress, completeStage, updateWallet } from '../../lib/lifeSim';
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

// ─── Component ──────────────────────────────────────────────────────────────
export default function Quest3({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [credited, setCredited] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const income = sim?.income ?? 0;
  const bankWallet = (sim?.wallets ?? []).find(w => w.type === 'bank');
  const bankName = bankWallet?.label ?? 'Bank';
  const bankIcon = bankWallet?.icon ?? '\uD83C\uDFE6';
  const bankBalance = bankWallet?.balance ?? 0;

  useEffect(() => {
    if (visible) { setStep(1); setSaving(false); setCredited(false); setShowConfetti(false); progressAnim.setValue(0); }
  }, [visible]);

  const handleClose = () => {
    if (!credited) setShowExitConfirm(true);
    else onClose();
  };

  const handleCredit = async () => {
    if (saving) return;
    setSaving(true);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
    try {
      const uid = auth.currentUser?.uid;
      // Credit salary to bank wallet
      if (bankWallet) {
        await updateWallet(uid, bankWallet.id, income);
      }
      // Also increment real finCoins
      const { doc: firestoreDoc, updateDoc, increment } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      await updateDoc(firestoreDoc(db, 'users', uid), { finCoins: increment(income) });

      await saveSimProgress(uid, {
        stage3Data: { income, bankBalance: bankBalance + income, paycheckCredited: true },
      });
      await completeStage(uid, 'stage-3', { income, bankBalance: bankBalance + income });
      setTimeout(() => { setSaving(false); setCredited(true); setShowConfetti(true); setStep(3); }, 2000);
    } catch (e) {
      setShowError(true);
      progressAnim.setValue(0); setSaving(false);
    }
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 && !saving ? <TouchableOpacity style={st.backBtn} onPress={() => setStep(step - 1)}><Text style={st.backBtnText}>{'\u2039'} Back</Text></TouchableOpacity> : <View style={{ width: 60 }} />}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 3 \u00B7 First Paycheck'}</Text>
      <View style={st.stepPills}>{[1,2,3].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  const FinCard = ({ text }) => (
    <View style={st.finCard}>
      <View style={st.finCardTop}><View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View><Text style={st.finCardLabel}>FIN SAYS</Text></View>
      <Text style={st.finCardText}>{text}</Text>
    </View>
  );

  // ── Step 1 — Your salary is ready ─────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Your first{'\n'}paycheck</Text>
        <FinCard text={`FC ${income.toLocaleString()} a month. That\u2019s what Luminary is paying you as an Experience Architect. This is the engine of everything that follows \u2014 your salary is the single biggest lever on your financial future. Watch it land.`} />
        <View style={st.salaryCard}>
          <Text style={st.salaryLabel}>MONTHLY SALARY</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}><Image source={COIN} style={{ width: 28, height: 28 }} /><Text style={st.salaryValue}>{income.toLocaleString()}</Text></View>
        </View>
        <View style={st.infoGrid}>
          <View style={st.infoTile}><Text style={st.infoTileIcon}>{'\uD83C\uDFE6'}</Text><Text style={st.infoTileTitle}>Lands in</Text><Text style={st.infoTileText}>{bankName}</Text></View>
          <View style={st.infoTile}><Text style={st.infoTileIcon}>{'\uD83D\uDCC5'}</Text><Text style={st.infoTileTitle}>Every month</Text><Text style={st.infoTileText}>Automatic credit</Text></View>
        </View>
        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Receive my paycheck \u2192"}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 2 — Credit animation ─────────────────────────────────────────
  const renderStep2 = () => {
    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>Depositing{'\n'}your salary</Text>
          <View style={st.depositVisual}>
            <View style={st.depositEndpoint}><Text style={{ fontSize: 28 }}>{'\uD83D\uDCBC'}</Text><Text style={st.depositEndpointLabel}>Employer</Text></View>
            <View style={st.depositMiddle}>
              <View style={st.depositTrack}><Animated.View style={[st.depositFill, { width: progressWidth }]} /></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}><Image source={COIN} style={{ width: 14, height: 14 }} /><Text style={st.depositAmount}>{income.toLocaleString()}</Text></View>
            </View>
            <View style={st.depositEndpoint}><Text style={{ fontSize: 28 }}>{bankIcon}</Text><Text style={st.depositEndpointLabel}>{bankName}</Text></View>
          </View>
          <View style={st.balanceCard}>
            <Text style={st.balanceLabel}>BANK BALANCE AFTER</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}><Image source={COIN} style={{ width: 20, height: 20 }} /><Text style={st.balanceValue}>{(bankBalance + income).toLocaleString()}</Text></View>
          </View>
          {saving && <Text style={st.depositStatus}>Depositing your salary...</Text>}
          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={[st.ctaBtn, saving && st.ctaBtnDisabled]} onPress={handleCredit} disabled={saving} activeOpacity={0.88}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Credit to my account \u2192"}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 3 — Success ──────────────────────────────────────────────────
  const renderStep3 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[st.content, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 56, marginTop: 8, marginBottom: 4 }}>{'\uD83C\uDF89'}</Text>
        <Text style={st.successTitle}>Paycheck received!</Text>
        <View style={[st.summaryCard, { width: '100%' }]}>
          {[
            { label: 'Salary', coin: income },
            { label: 'Deposited to', value: bankName },
            { label: 'New balance', coin: bankBalance + income, color: MODULE_COLORS['module-3'].color },
          ].map((row, i, arr) => (
            <View key={i} style={[st.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={st.summaryLabel}>{row.label}</Text>
              {row.coin != null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={[st.summaryValue, row.color && { color: row.color }]}>{row.coin.toLocaleString()}</Text></View>
              ) : (<Text style={st.summaryValue}>{row.value}</Text>)}
            </View>
          ))}
        </View>
        <FinCard text={`First salary landed. From now on, every month advance credits FC ${income.toLocaleString()} directly to your bank. Your job is to make sure as little of it as possible gets wasted. Quest 4 sets up the plan.`} />
        <View style={[st.unlockCard, { width: '100%' }]}>
          <Text style={st.unlockPill}>{'\uD83D\uDD13'} UNLOCKED</Text>
          <Text style={st.unlockText}>First salary landed. Welcome to working life.</Text>
          <View style={st.unlockDivider} />
          <Text style={st.unlockHint}>{'\uD83D\uDCB0'} Salary now credits automatically each month</Text>
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

  finCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  finCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  finCardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: MODULE_COLORS['module-1'].colorLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  finCardLabel: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: MODULE_COLORS['module-1'].colorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden' },
  finCardText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  salaryCard: { backgroundColor: Colors.primary, borderRadius: Radii.xl, padding: 20, alignItems: 'center', marginBottom: 16, ...Shadows.medium },
  salaryLabel: { fontFamily: Fonts.bold, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2, textTransform: 'uppercase' },
  salaryValue: { fontFamily: Fonts.extraBold, fontSize: 36, color: Colors.white },

  infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  infoTile: { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, alignItems: 'center', gap: 6, ...Shadows.soft },
  infoTileIcon: { fontSize: 24 },
  infoTileTitle: { fontFamily: Fonts.extraBold, fontSize: 13, color: Colors.textPrimary, textAlign: 'center' },
  infoTileText: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },

  depositVisual: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24, marginTop: 16 },
  depositEndpoint: { alignItems: 'center', gap: 6, width: 70 },
  depositEndpointLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  depositMiddle: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  depositTrack: { width: '100%', height: 8, backgroundColor: Colors.lightGray, borderRadius: 4, overflow: 'hidden' },
  depositFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  depositAmount: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  depositStatus: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },

  balanceCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, alignItems: 'center', ...Shadows.soft },
  balanceLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  balanceValue: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary },

  successTitle: { fontFamily: Fonts.extraBold, fontSize: 26, color: Colors.textPrimary, marginBottom: 20, textAlign: 'center' },
  summaryCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, ...Shadows.soft },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },

  unlockCard: { backgroundColor: MODULE_COLORS['module-1'].colorLight, borderRadius: Radii.lg, padding: 16, marginBottom: 16 },
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
