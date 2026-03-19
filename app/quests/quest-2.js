// app/quests/quest-2.js
// Quest 2 — Open Your Bank Account
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, Alert, ActivityIndicator, Image,
  StyleSheet, Dimensions, Easing,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../lib/firebase';
import { setBankAccount, completeStage, queueFinCoins } from '../../lib/lifeSim';
import { Colors, Fonts, Radii, Shadows, Spacing, MODULE_COLORS } from '../../constants/theme';

const { width: SW } = Dimensions.get('window');
const COIN = require('../../assets/coin.png');

// ─── Data ───────────────────────────────────────────────────────────────────
const ACCOUNT_TYPES = [
  { id: 'basic', label: 'Basic Savings', icon: '\uD83C\uDFE6', rate: 0.0005, rateLabel: '0.05% p.a.', tagline: 'Simple and safe',
    pros: ['No conditions required', 'Always earns interest', 'Easy to manage'], cons: ['Barely earns anything', 'No bonus tiers'],
    color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight },
  { id: 'hysa', label: 'High-Yield Savings', icon: '\uD83D\uDCC8', rate: 0.0465, rateLabel: 'Up to 4.65% p.a.', tagline: 'Earn 60\u00D7 more',
    pros: ['Much higher interest', 'Rewards good habits'], cons: ['Conditions required', 'Rate varies monthly'],
    color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight },
];

const BANKS = {
  basic: [
    { id: 'drakon', name: 'Drakon Bank', icon: '\uD83C\uDFDB\uFE0F', rate: 0.0005, rateLabel: '0.05% p.a.', bank: 'Drakon',
      conditions: [], bestFor: 'Best app, most ATMs, simplest setup',
      finNote: "Drakon is the default choice for most people. The app is excellent, transfers are instant, and it's the easiest account to open.",
      colorLight: MODULE_COLORS['module-2'].colorLight, color: MODULE_COLORS['module-2'].color },
  ],
  hysa: [
    { id: 'orbit', name: 'Orbit Bank', icon: '\uD83D\uDD35', rate: 0.0465, rateLabel: 'Up to 4.65% p.a.', bank: 'Orbit',
      conditions: ['Salary credit', 'Card spend min. \uD83E\uDE99300/mo', 'GIRO payment'], bestFor: 'Best for salary earners who spend regularly',
      finNote: "Orbit's bonus tiers are generous. Meet salary credit alone and you already jump to 2.8%. Great if you'll have a regular income.",
      colorLight: MODULE_COLORS['module-3'].colorLight, color: MODULE_COLORS['module-3'].color },
    { id: 'unison', name: 'Unison Bank', icon: '\uD83D\uDFE1', rate: 0.078, rateLabel: 'Up to 7.8% p.a.', bank: 'Unison',
      conditions: ['Min. \uD83E\uDE99500 card spend/mo', 'GIRO payment', 'Salary credit'], bestFor: 'Highest rate if you meet all conditions',
      finNote: "Unison has the highest potential rate in FinCity \u2014 but you need to meet all three conditions every month. Miss one and the rate drops sharply.",
      colorLight: MODULE_COLORS['module-4'].colorLight, color: MODULE_COLORS['module-4'].color },
  ],
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function Quest2({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  const [step, setStep]           = useState(1);
  const [accountType, setType]    = useState(null);
  const [selectedBank, setBank]   = useState(null);
  const [depositAmount, setDeposit] = useState(0);
  const [saving, setSaving]       = useState(false);
  const [transferDone, setTransferDone] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Derived ─────────────────────────────────────────────────────────────
  const cashBalance    = (sim?.wallets ?? []).find(w => w.id === 'wallet')?.balance ?? 0;
  const maxDeposit     = cashBalance;
  const minDeposit     = Math.min(100, cashBalance);
  const annualInterest = selectedBank ? Math.round(depositAmount * selectedBank.rate) : 0;

  // ── Reset ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep(1); setType(null); setBank(null); setSaving(false); setTransferDone(false);
      setDeposit(Math.round(cashBalance * 0.5));
      progressAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    if (!transferDone)
      Alert.alert('Leave this quest?', 'Your progress here will be lost.', [{ text: 'Keep going', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: onClose }]);
    else onClose();
  };

  const handleDeposit = async () => {
    if (saving) return;
    setSaving(true);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start();
    try {
      const uid = auth.currentUser?.uid;
      await setBankAccount(uid, { ...selectedBank, baseRate: selectedBank.rate, openingBalance: depositAmount });
      await completeStage(uid, 'stage-2', { bankId: selectedBank.id, bankName: selectedBank.name, accountType, openingBalance: depositAmount });
      await queueFinCoins(uid, 15);
      setTimeout(() => { setSaving(false); setTransferDone(true); }, 1600);
    } catch (e) {
      Alert.alert('Something went wrong', 'Please try again.');
      progressAnim.setValue(0); setSaving(false);
    }
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 && !saving ? <TouchableOpacity style={st.backBtn} onPress={() => setStep(s => s - 1)}><Text style={st.backBtnText}>{'\u2039'} Back</Text></TouchableOpacity> : <View style={{ width: 60 }} />}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 2 · Open Your Bank Account'}</Text>
      <View style={st.stepPills}>{[1,2,3,4].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  // ── Step 1 — Welcome ──────────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Welcome to{'\n'}Drakon Bank</Text>
        <View style={st.finCard}>
          <View style={st.finCardTop}><View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View><Text style={st.finCardLabel}>FIN SAYS</Text></View>
          <Text style={st.finCardText}>"Your FinCoins are sitting in cash. A bank account does two things: keeps your money safe, and makes it grow. Let's get you set up."</Text>
        </View>
        <View style={st.infoGrid}>
          <View style={st.infoTile}><Text style={st.infoTileIcon}>{'\uD83D\uDEE1\uFE0F'}</Text><Text style={st.infoTileTitle}>Protected</Text><Text style={st.infoTileText}>Your deposits are protected up to {'\uD83E\uDE99'}75,000 by the FSDC</Text></View>
          <View style={st.infoTile}><Text style={st.infoTileIcon}>{'\uD83D\uDCA1'}</Text><Text style={st.infoTileTitle}>60{'\u00D7'} more</Text><Text style={st.infoTileText}>The right account earns 60{'\u00D7'} more interest than the wrong one</Text></View>
        </View>
      </ScrollView>
      <View style={[st.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Show me my options \u2192"}</Text></TouchableOpacity>
      </View>
    </>
  );

  // ── Step 2 — Account type ─────────────────────────────────────────────
  const renderStep2 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Which type of{'\n'}account?</Text>
        <Text style={st.questSub}>Same money. Very different returns.</Text>
        <View style={st.accountTypeRow}>
          {ACCOUNT_TYPES.map(type => (
            <TouchableOpacity key={type.id} style={[st.accountTypeCard, accountType === type.id && { borderColor: type.color, borderWidth: 2 }]} onPress={() => { setType(type.id); setBank(null); setTimeout(() => setStep(3), 350); }} activeOpacity={0.85}>
              <Text style={st.accountTypeIcon}>{type.icon}</Text>
              <Text style={st.accountTypeRate}>{type.rateLabel}</Text>
              <Text style={st.accountTypeLabel}>{type.label}</Text>
              <Text style={st.accountTypeTagline}>{type.tagline}</Text>
              <View style={st.accountTypePros}>
                {type.pros.map((p, i) => <Text key={`p${i}`} style={st.accountTypePro}>{'\u2713'} {p}</Text>)}
                {type.cons.map((c, i) => <Text key={`c${i}`} style={st.accountTypeCon}>{'\u2717'} {c}</Text>)}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={st.calcPreview}>
          <Text style={st.calcPreviewTitle}>If you deposit {'\uD83E\uDE99'}5,000...</Text>
          <View style={st.calcPreviewRow}><Text style={st.calcPreviewLabel}>Basic savings</Text><Text style={st.calcPreviewValue}>{'\uD83E\uDE99'}{Math.round(5000 * 0.0005)}/year</Text></View>
          <View style={st.calcPreviewRow}><Text style={st.calcPreviewLabel}>HYSA (optimised)</Text><Text style={[st.calcPreviewValue, { color: MODULE_COLORS['module-3'].color }]}>{'\uD83E\uDE99'}{Math.round(5000 * 0.0465)}/year</Text></View>
          <Text style={st.calcPreviewSub}>Same balance. {Math.round(0.0465 / 0.0005)}{'\u00D7'} difference.</Text>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 3 — Pick bank ────────────────────────────────────────────────
  const renderStep3 = () => {
    const banks = BANKS[accountType] ?? [];
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>Pick your bank</Text>
          <Text style={st.questSub}>{accountType === 'basic' ? 'One clear choice for simplicity.' : 'Two options \u2014 different conditions, different rewards.'}</Text>
          {banks.map(bank => (
            <TouchableOpacity key={bank.id} style={[st.bankCard, selectedBank?.id === bank.id && { borderColor: bank.color, borderWidth: 2 }]} onPress={() => { setBank(bank); setTimeout(() => setStep(4), 350); }} activeOpacity={0.85}>
              <View style={st.bankCardTop}>
                <View style={[st.bankIconCircle, { backgroundColor: bank.colorLight }]}><Text style={{ fontSize: 22 }}>{bank.icon}</Text></View>
                <View style={{ flex: 1 }}><Text style={st.bankName}>{bank.name}</Text><Text style={[st.bankRate, { color: bank.color }]}>{bank.rateLabel}</Text></View>
                {selectedBank?.id === bank.id && <Text style={[st.bankCheck, { color: bank.color }]}>{'\u2713'}</Text>}
              </View>
              {bank.conditions.length > 0 && <View style={st.bankConditions}><Text style={st.bankConditionsLabel}>CONDITIONS</Text>{bank.conditions.map((c, i) => <Text key={i} style={st.bankCondition}>{'\u00B7'} {c}</Text>)}</View>}
              <Text style={st.bankBestFor}>Best for: {bank.bestFor}</Text>
              <View style={[st.bankFinNote, { borderLeftColor: bank.color }]}><Text style={st.bankFinNoteLabel}>{'\uD83D\uDC1F'} FIN</Text><Text style={st.bankFinNoteText}>"{bank.finNote}"</Text></View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </>
    );
  };

  // ── Step 4 — Deposit + Transfer + Success ─────────────────────────────
  const renderStep4 = () => {
    // Success state
    if (transferDone) {
      return (
        <>
          <Header />
          <ScrollView contentContainerStyle={[st.content, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 56, marginTop: 8, marginBottom: 4 }}>{'\uD83C\uDF89'}</Text>
            <Text style={st.successTitle}>Account opened!</Text>
            <View style={[st.summaryCard, { width: '100%' }]}>
              {[
                { label: 'Bank', value: selectedBank?.name },
                { label: 'Type', value: accountType === 'basic' ? 'Basic Savings' : 'High-Yield Savings' },
                { label: 'Deposited', value: null, coin: Math.round(depositAmount) },
                { label: 'Interest rate', value: selectedBank?.rateLabel, color: selectedBank?.color },
                { label: 'Est. interest', value: null, coin: annualInterest, color: selectedBank?.color, suffix: '/year' },
              ].map((row, i, arr) => (
                <View key={i} style={[st.summaryRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={st.summaryLabel}>{row.label}</Text>
                  {row.coin != null ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Image source={COIN} style={{ width: 13, height: 13 }} />
                      <Text style={[st.summaryValue, row.color && { color: row.color }]}>{row.coin.toLocaleString()}{row.suffix ?? ''}</Text>
                    </View>
                  ) : (
                    <Text style={[st.summaryValue, row.color && { color: row.color }]}>{row.value}</Text>
                  )}
                </View>
              ))}
            </View>
            <View style={[st.finCard, { width: '100%' }]}>
              <View style={st.finCardTop}><View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View><Text style={st.finCardLabel}>FIN SAYS</Text></View>
              <Text style={st.finCardText}>"Your money has a home now. Check your Bank to see your new account. Next {'\u2014'} let's set a budget before your first paycheck arrives."</Text>
            </View>
            <View style={st.rewardRow}><Image source={COIN} style={{ width: 16, height: 16 }} /><Text style={st.rewardText}>+15 FinCoins queued</Text><Text style={st.rewardSub}> · arrives on payday</Text></View>
          </ScrollView>
          <View style={[st.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={st.ctaBtn} onPress={onComplete} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Continue \u2192"}</Text></TouchableOpacity>
          </View>
        </>
      );
    }

    // Deposit UI
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>Make your first{'\n'}deposit</Text>
          <View style={[st.depositBankRow, { backgroundColor: selectedBank?.colorLight }]}>
            <Text style={{ fontSize: 24 }}>{selectedBank?.icon}</Text>
            <View style={{ flex: 1 }}><Text style={st.depositBankName}>{selectedBank?.name}</Text><Text style={[st.depositBankRate, { color: selectedBank?.color }]}>{selectedBank?.rateLabel}</Text></View>
          </View>
          <View style={st.walletRow}><Text style={st.walletLabel}>Available in wallet</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN} style={{ width: 14, height: 14 }} /><Text style={st.walletValue}>{Math.round(cashBalance).toLocaleString()}</Text></View></View>
          <View style={st.depositAmountCard}>
            <Text style={st.depositAmountLabel}>Depositing</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}><Image source={COIN} style={{ width: 28, height: 28 }} /><Text style={st.depositAmountValue}>{Math.round(depositAmount).toLocaleString()}</Text></View>
          </View>
          <Slider style={{ width: '100%', height: 40, marginVertical: 8 }} minimumValue={minDeposit} maximumValue={Math.max(minDeposit + 100, maxDeposit)} step={100} value={depositAmount} onValueChange={v => setDeposit(Math.round(v))} minimumTrackTintColor={Colors.primary} thumbTintColor={Colors.primary} />
          <View style={st.sliderLabels}><Text style={st.sliderLabel}>Min {'\uD83E\uDE99'}{minDeposit}</Text><Text style={st.sliderLabel}>All {'\uD83E\uDE99'}{Math.round(cashBalance).toLocaleString()}</Text></View>
          <View style={st.interestPreview}>
            <Text style={st.interestPreviewTitle}>Interest preview</Text>
            <View style={st.interestPreviewRow}><Text style={st.interestPreviewLabel}>At {selectedBank?.rateLabel}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={[st.interestPreviewValue, { color: selectedBank?.color }]}>{annualInterest}/year</Text></View></View>
            <Text style={st.interestPreviewSub}>{cashBalance - depositAmount > 0 ? `\uD83E\uDE99${Math.round(cashBalance - depositAmount).toLocaleString()} stays in your wallet` : 'Transferring your full balance'}</Text>
          </View>
        </ScrollView>

        {saving ? (
          <View style={[st.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={st.transferBar}>
              <View style={st.transferBarHeader}>
                <Text style={st.transferBarLabel}>Transferring to {selectedBank?.name}...</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={st.transferBarAmount}>{Math.round(depositAmount).toLocaleString()}</Text></View>
              </View>
              <View style={st.transferTrack}><Animated.View style={[st.transferFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /></View>
            </View>
          </View>
        ) : (
          <View style={[st.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={[st.ctaBtn, depositAmount < minDeposit && st.ctaBtnDisabled]} onPress={handleDeposit} disabled={depositAmount < minDeposit} activeOpacity={0.88}>
              <Text style={st.ctaBtnText}>{"Open my account \u2192"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <View style={st.backdrop}><View style={st.card}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </View></View>
    </Modal>
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

  accountTypeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  accountTypeCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 16, borderWidth: 2, borderColor: Colors.border, ...Shadows.soft },
  accountTypeIcon: { fontSize: 28, marginBottom: 6 },
  accountTypeRate: { fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 2 },
  accountTypeLabel: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary, marginBottom: 2 },
  accountTypeTagline: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 10 },
  accountTypePros: { gap: 3 },
  accountTypePro: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.successDark },
  accountTypeCon: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },

  calcPreview: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, ...Shadows.soft },
  calcPreviewTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 10 },
  calcPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  calcPreviewLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  calcPreviewValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  calcPreviewSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 6 },

  bankCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.medium },
  bankCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  bankIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  bankName: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  bankRate: { fontFamily: Fonts.bold, fontSize: 13, marginTop: 2 },
  bankCheck: { fontFamily: Fonts.extraBold, fontSize: 20 },
  bankConditions: { marginBottom: 10 },
  bankConditionsLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  bankCondition: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  bankBestFor: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 10 },
  bankFinNote: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 4 },
  bankFinNoteLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1, marginBottom: 2 },
  bankFinNoteText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },

  depositBankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: Radii.lg, padding: 14, marginBottom: 16 },
  depositBankName: { fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary },
  depositBankRate: { fontFamily: Fonts.bold, fontSize: 12, marginTop: 2 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  walletLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  walletValue: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  depositAmountCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 20, alignItems: 'center', marginBottom: 8, ...Shadows.soft },
  depositAmountLabel: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  depositAmountValue: { fontFamily: Fonts.extraBold, fontSize: 36, color: Colors.textPrimary },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sliderLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  interestPreview: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, ...Shadows.soft },
  interestPreviewTitle: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  interestPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  interestPreviewLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  interestPreviewValue: { fontFamily: Fonts.extraBold, fontSize: 16 },
  interestPreviewSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 6 },

  transferBar: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, width: '100%', ...Shadows.soft },
  transferBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  transferBarLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  transferBarAmount: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary },
  transferTrack: { height: 8, backgroundColor: Colors.lightGray, borderRadius: 4, overflow: 'hidden' },
  transferFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },

  successTitle: { fontFamily: Fonts.extraBold, fontSize: 26, color: Colors.textPrimary, marginBottom: 20, textAlign: 'center' },
  summaryCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, ...Shadows.soft },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 8 },
  rewardText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.warningDark },
  rewardSub: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  ctaContainer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  ctaBtn: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});
