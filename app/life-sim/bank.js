// app/life-sim/bank.js
//
// The Bank — a place you return to, not a stage you complete.
//
// Two modes, same file:
//
//   FIRST VISIT (no account yet)
//   ─────────────────────────────
//   The existing 3-step wizard is preserved exactly:
//     Step 1 — Account type choice (Basic vs HYSA)
//     Step 2 — Bank picker (DBS / OCBC / UOB)
//     Step 3 — Opening ceremony (transfer animation)
//
//   RETURNING (account already open)  ← this is what was rebuilt
//   ──────────────────────────────────
//   Full bank lobby with four tabs:
//
//     Accounts    — all open accounts with live balances, interest rates,
//                   progress bars for funds; tap any account to manage it
//     Transfer    — move money between any two accounts
//     Products    — open new accounts (emergency fund, second account,
//                   fixed deposit teaser, HYSA upgrade teaser)
//     History     — interest log per account, month-by-month
//
// Manages:
//   — Opening a second account (emergency fund, goal savings)
//   — Transferring between accounts (bank → emergency, bank → goal)
//   — Closing an account (moves balance back to main bank account)
//   — Interest log display (wallet.interestLog[])
//   — HYSA criteria tracker (salary credit, card spend)
//   — Fall-below-fee warning
//
// Data written to Firestore via lifeSim.js helpers (no direct Firestore here).

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Modal, Dimensions,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../../store/userStore';
import {
  loadSimProgress, saveSimProgress,
  transferBetweenWallets, addWallet, updateWallet,
} from '../../lib/lifeSim';
import {
  ACCOUNT_TYPES, BANK_ACCOUNTS, WALLET_TEMPLATES,
  formatDual, calcInterestComparison,
} from '../../constants/lifeSimStages';
import { Colors, Fonts, Spacing, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';
import { auth } from '../../lib/firebase';
import { useSafeBack } from '../../hooks/useHardwareBack';

const { width: SW } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const ORANGE  = MODULE_COLORS['module-2'].color;       // #F5883A
const GREEN   = MODULE_COLORS['module-3'].color;       // #5BBF8A
const TEAL    = MODULE_COLORS['module-1'].color;       // #3AAECC

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-components (used in both modes)
// ─────────────────────────────────────────────────────────────────────────────

function FinNote({ text, color }) {
  if (!text) return null;
  return (
    <View style={[fn.wrap, { backgroundColor: (color ?? Colors.primary) + '12' }]}>
      <Text style={fn.owl}>🦉</Text>
      <Text style={[fn.text, { color: color ?? Colors.primary }]}>{text}</Text>
    </View>
  );
}
const fn = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8, borderRadius: Radii.md, padding: Spacing.sm, alignItems: 'flex-start', marginBottom: Spacing.sm },
  owl:  { fontSize: 16, marginTop: 1 },
  text: { fontFamily: Fonts.semiBold, fontSize: 12, flex: 1, lineHeight: 18 },
});

function SectionLabel({ children }) {
  return <Text style={sl.text}>{children}</Text>;
}
const sl = StyleSheet.create({
  text: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.md },
});

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD — first-visit account opening (Steps 1–3)
// Preserved from original bank.js with minor cleanup.
// ─────────────────────────────────────────────────────────────────────────────

function AccountTypeCard({ type, selected, onSelect, balance }) {
  const isSelected = selected === type.id;
  const color      = type.color;
  const isHYSA     = type.id === 'hysa';
  const { basicEarned, hysaEarned } = calcInterestComparison(balance);

  return (
    <TouchableOpacity
      style={[wiz.typeCard, isSelected && { borderColor: color, borderWidth: 2.5 }]}
      onPress={() => onSelect(type.id)}
      activeOpacity={0.85}
    >
      <View style={wiz.typeHeader}>
        <View style={[wiz.typeIconBadge, { backgroundColor: color + '15' }]}>
          <Text style={wiz.typeIcon}>{type.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[wiz.typeLabel, { color }]}>{type.label}</Text>
          <Text style={wiz.typeTagline}>{type.tagline}</Text>
        </View>
        {isSelected && (
          <View style={[wiz.check, { backgroundColor: color }]}>
            <Text style={wiz.checkText}>✓</Text>
          </View>
        )}
      </View>
      <View style={[wiz.rateBox, { backgroundColor: color + '10' }]}>
        <View style={wiz.rateRow}>
          <Text style={wiz.rateLbl}>Base rate</Text>
          <Text style={[wiz.rateVal, { color }]}>0.05% p.a.</Text>
        </View>
        {isHYSA && (
          <View style={wiz.rateRow}>
            <Text style={wiz.rateLbl}>Bonus rate</Text>
            <Text style={[wiz.rateVal, { color }]}>up to 4%+ p.a.</Text>
          </View>
        )}
      </View>
      {balance > 0 && (
        <View style={wiz.dollarRow}>
          <Text style={wiz.dollarText}>
            On {formatDual(balance).sgd} → earns{' '}
            <Text style={{ fontFamily: Fonts.bold, color }}>
              ~${isHYSA ? hysaEarned : basicEarned}/year
            </Text>
          </Text>
        </View>
      )}
      {type.pros.map((p, i) => (
        <View key={i} style={wiz.proRow}>
          <Text style={[wiz.proDot, { color }]}>✓</Text>
          <Text style={wiz.proText}>{p}</Text>
        </View>
      ))}
      {type.cons.map((c, i) => (
        <View key={i} style={wiz.proRow}>
          <Text style={wiz.conDot}>–</Text>
          <Text style={wiz.conText}>{c}</Text>
        </View>
      ))}
      <TouchableOpacity
        style={[wiz.selectBtn, { backgroundColor: isSelected ? color : color + '15' }]}
        onPress={() => onSelect(type.id)}
        activeOpacity={0.8}
      >
        <Text style={[wiz.selectBtnText, { color: isSelected ? Colors.white : color }]}>
          {isSelected ? '✓ Chosen' : `Choose ${type.label}`}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function BankPickerCard({ bank, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selected === bank.id;
  const color      = bank.color;
  const isHYSA     = bank.accountType === 'hysa';

  return (
    <TouchableOpacity
      style={[wiz.bankCard, isSelected && { borderColor: color, borderWidth: 2 }]}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      <View style={wiz.bankHeader}>
        <View style={[wiz.bankLogo, { backgroundColor: bank.colorLight }]}>
          <Text style={[wiz.bankLogoText, { color }]}>{bank.bank}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={wiz.bankName}>{bank.name}</Text>
          {isHYSA && bank.bonusRate > 0 ? (
            <Text style={[wiz.bankRate, { color }]}>up to {(bank.bonusRate * 100).toFixed(1)}% p.a.</Text>
          ) : (
            <Text style={[wiz.bankRate, { color }]}>0.05% p.a.</Text>
          )}
        </View>
        {isSelected
          ? <View style={[wiz.check, { backgroundColor: color }]}><Text style={wiz.checkText}>✓</Text></View>
          : <Text style={wiz.chevron}>{expanded ? '▲' : '▼'}</Text>
        }
      </View>
      {bank.minBalance > 0 && (
        <View style={wiz.minRow}>
          <Text style={wiz.minText}>Min. ${bank.minBalance.toLocaleString()} · ${bank.fallBelowFee}/mo fee if below</Text>
        </View>
      )}
      {expanded && (
        <View style={wiz.bankExpanded}>
          <View style={wiz.divider} />
          {bank.features.map((f, i) => (
            <View key={i} style={wiz.proRow}>
              <Text style={[wiz.proDot, { color }]}>✓</Text>
              <Text style={wiz.proText}>{f}</Text>
            </View>
          ))}
          {bank.finNote && <FinNote text={bank.finNote} color={color} />}
        </View>
      )}
      <TouchableOpacity
        style={[wiz.selectBtn, { backgroundColor: isSelected ? color : color + '18', marginTop: Spacing.sm }]}
        onPress={() => onSelect(bank.id)}
        activeOpacity={0.8}
      >
        <Text style={[wiz.selectBtnText, { color: isSelected ? Colors.white : color }]}>
          {isSelected ? `✓ ${bank.bank} selected` : `Open ${bank.bank} account`}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function OpeningSheet({ visible, bank, accountType, walletBalance, onDone }) {
  const slideY   = useRef(new Animated.Value(500)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;
  const [phase,   setPhase]   = useState('confirm');
  const [earning, setEarning] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setPhase('confirm');
    fillAnim.setValue(0);
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }).start();
  }, [visible]);

  const startOpening = () => {
    setPhase('animating');
    Animated.timing(fillAnim, { toValue: 1, duration: 2000, useNativeDriver: false }).start(() => {
      const { basicEarned, hysaEarned } = calcInterestComparison(walletBalance);
      setEarning(accountType === 'hysa' ? hysaEarned : basicEarned);
      setPhase('done');
    });
  };

  if (!bank) return null;
  const color    = bank.color;
  const dual     = formatDual(walletBalance);
  const isHYSA   = accountType === 'hysa';
  const fillWidth = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const rateText = isHYSA
    ? `Up to ${(bank.bonusRate * 100).toFixed(1)}% p.a. with criteria · 0.05% base`
    : `${(bank.baseRate * 100).toFixed(2)}% p.a. — interest from day one`;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={os.backdrop}>
        <Animated.View style={[os.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={[os.handle, { backgroundColor: color }]} />
          {phase === 'confirm' && (
            <>
              <Text style={os.title}>Open your {bank.bank} account</Text>
              <Text style={os.subtitle}>Your cash wallet balance will transfer in. This is the foundation everything else is built on.</Text>
              <View style={os.transferRow}>
                <View style={os.acctBox}>
                  <Text style={os.acctIcon}>💳</Text>
                  <Text style={os.acctLabel}>Cash Wallet</Text>
                  <Text style={os.acctAmt}>{dual.sgd}</Text>
                  <Text style={os.acctSub}>→ $0 after</Text>
                </View>
                <Text style={os.arrow}>→</Text>
                <View style={[os.acctBox, { borderColor: color + '40', borderWidth: 1.5 }]}>
                  <View style={[os.bankBadge, { backgroundColor: bank.colorLight }]}>
                    <Text style={[os.bankBadgeText, { color }]}>{bank.bank}</Text>
                  </View>
                  <Text style={os.acctLabel}>{bank.name}</Text>
                  <Text style={[os.acctAmt, { color }]}>{dual.sgd}</Text>
                  {isHYSA && <View style={[os.hysaTag, { backgroundColor: color + '15' }]}><Text style={[os.hysaTagText, { color }]}>HYSA ⚡</Text></View>}
                </View>
              </View>
              <View style={os.rateInfo}>
                <Text style={os.rateInfoText}>{rateText}</Text>
              </View>
              <TouchableOpacity style={[os.btn, { backgroundColor: color }]} onPress={startOpening} activeOpacity={0.88}>
                <Text style={os.btnText}>Open account →</Text>
              </TouchableOpacity>
            </>
          )}
          {phase === 'animating' && (
            <>
              <Text style={os.title}>Opening your account…</Text>
              <Text style={os.subtitle}>Moving {dual.sgd} from your cash wallet into {bank.bank}.</Text>
              <View style={os.barTrack}>
                <Animated.View style={[os.barFill, { width: fillWidth, backgroundColor: color }]} />
              </View>
              <Text style={os.progressNote}>Verifying identity · Setting up account · Applying interest rate · Confirming deposit</Text>
            </>
          )}
          {phase === 'done' && (
            <>
              <Text style={[os.title, { color }]}>🎉  Account opened!</Text>
              <View style={[os.doneCard, { backgroundColor: bank.colorLight, borderColor: color + '30' }]}>
                <View style={[os.bankBadge, { backgroundColor: Colors.white }]}>
                  <Text style={[os.bankBadgeText, { color }]}>{bank.bank}</Text>
                </View>
                <Text style={os.doneAccountName}>{bank.name}</Text>
                <Text style={[os.doneBalance, { color }]}>{dual.sgd}</Text>
                {earning !== null && <Text style={os.doneEarning}>~${earning}/year at current rates</Text>}
              </View>
              <TouchableOpacity style={[os.btn, { backgroundColor: color }]} onPress={onDone} activeOpacity={0.88}>
                <Text style={os.btnText}>Continue →</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const wiz = StyleSheet.create({
  typeCard:       { backgroundColor: Colors.white, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  typeHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.sm },
  typeIconBadge:  { width: 42, height: 42, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  typeIcon:       { fontSize: 22 },
  typeLabel:      { fontFamily: Fonts.extraBold, fontSize: 15, marginBottom: 2 },
  typeTagline:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  check:          { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  checkText:      { fontFamily: Fonts.extraBold, fontSize: 12, color: Colors.white },
  rateBox:        { borderRadius: Radii.sm, padding: Spacing.sm, marginBottom: Spacing.sm, gap: 4 },
  rateRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  rateLbl:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  rateVal:        { fontFamily: Fonts.bold, fontSize: 13 },
  dollarRow:      { backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  dollarText:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary },
  proRow:         { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginBottom: 4 },
  proDot:         { fontFamily: Fonts.bold, fontSize: 12, marginTop: 1, width: 14 },
  proText:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 17 },
  conDot:         { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted, width: 14 },
  conText:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, flex: 1, lineHeight: 17 },
  selectBtn:      { borderRadius: Radii.md, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  selectBtnText:  { fontFamily: Fonts.bold, fontSize: 13 },
  bankCard:       { backgroundColor: Colors.white, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  bankHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  bankLogo:       { width: 48, height: 48, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  bankLogoText:   { fontFamily: Fonts.extraBold, fontSize: 12 },
  bankName:       { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 3 },
  bankRate:       { fontFamily: Fonts.extraBold, fontSize: 16 },
  chevron:        { fontSize: 12, color: Colors.textMuted },
  minRow:         { backgroundColor: Colors.warningLight, borderRadius: Radii.sm, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8 },
  minText:        { fontFamily: Fonts.regular, fontSize: 11, color: Colors.warningDark },
  bankExpanded:   { marginTop: 4 },
  divider:        { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.sm },
});

const os = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingTop: Spacing.md, maxHeight: '90%' },
  handle:         { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  title:          { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textPrimary, marginBottom: 6 },
  subtitle:       { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  transferRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  acctBox:        { flex: 1, backgroundColor: Colors.lightGray, borderRadius: Radii.md, padding: Spacing.sm, alignItems: 'center', gap: 3 },
  acctIcon:       { fontSize: 24 },
  acctLabel:      { fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  acctAmt:        { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  acctSub:        { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  arrow:          { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textMuted },
  bankBadge:      { borderRadius: Radii.sm, paddingHorizontal: 8, paddingVertical: 3 },
  bankBadgeText:  { fontFamily: Fonts.extraBold, fontSize: 11 },
  hysaTag:        { borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 2 },
  hysaTagText:    { fontFamily: Fonts.bold, fontSize: 9 },
  rateInfo:       { backgroundColor: Colors.successLight, borderRadius: Radii.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  rateInfoText:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.successDark, lineHeight: 18 },
  btn:            { borderRadius: Radii.lg, paddingVertical: 15, alignItems: 'center', marginTop: Spacing.md },
  btnText:        { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  barTrack:       { height: 12, backgroundColor: Colors.lightGray, borderRadius: 6, overflow: 'hidden', marginBottom: Spacing.md },
  barFill:        { height: 12, borderRadius: 6 },
  progressNote:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  doneCard:       { borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.lg, alignItems: 'center', gap: 4, marginBottom: Spacing.md },
  doneAccountName:{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textMuted },
  doneBalance:    { fontFamily: Fonts.extraBold, fontSize: 38 },
  doneEarning:    { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.successDark, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// LOBBY — returning mode sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS = ['Accounts', 'Transfer', 'Products', 'History'];

function TabBar({ active, onChange, color }) {
  return (
    <View style={tb.wrap}>
      {TABS.map(t => (
        <TouchableOpacity
          key={t}
          style={[tb.tab, active === t && { borderBottomColor: color, borderBottomWidth: 2 }]}
          onPress={() => onChange(t)}
          activeOpacity={0.75}
        >
          <Text style={[tb.label, active === t && { color, fontFamily: Fonts.bold }]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tb = StyleSheet.create({
  wrap:  { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab:   { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  label: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
});

// ─── Account card (lobby) ─────────────────────────────────────────────────────

function AccountCard({ wallet, onManage }) {
  const color   = wallet.color ?? TEAL;
  const balance = wallet.balance ?? 0;
  const pct     = wallet.target > 0 ? Math.min(balance / wallet.target, 1) : null;
  const isHYSA  = wallet.accountType === 'hysa';
  const belowMin = wallet.minBalance > 0 && balance < wallet.minBalance;

  return (
    <View style={[ac.card, { borderColor: color + '35' }]}>
      <View style={ac.top}>
        <View style={[ac.iconWrap, { backgroundColor: color + '15' }]}>
          <Text style={{ fontSize: 22 }}>{wallet.icon ?? '🏦'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={ac.nameRow}>
            <Text style={[ac.name, { color }]} numberOfLines={1}>{wallet.label}</Text>
            {isHYSA && <View style={[ac.badge, { backgroundColor: color + '20' }]}><Text style={[ac.badgeText, { color }]}>HYSA ⚡</Text></View>}
          </View>
          <Text style={ac.inst}>{wallet.institution}</Text>
        </View>
        <TouchableOpacity style={[ac.manageBtn, { borderColor: color + '40' }]} onPress={() => onManage(wallet)} activeOpacity={0.8}>
          <Text style={[ac.manageBtnText, { color }]}>Manage</Text>
        </TouchableOpacity>
      </View>

      <Text style={[ac.balance, { color }]}>${Math.round(balance).toLocaleString()}</Text>
      <Text style={ac.coins}>{formatDual(balance).coins}</Text>

      {belowMin && (
        <View style={ac.feeWarn}>
          <Text style={ac.feeWarnText}>⚠️  Below minimum balance — ${wallet.minBalance?.toLocaleString()} required. ${wallet.fallBelowFee ?? 2}/month fee applies.</Text>
        </View>
      )}

      <View style={ac.rates}>
        <View style={ac.rateRow}>
          <Text style={ac.rateLbl}>Interest rate</Text>
          <Text style={[ac.rateVal, { color }]}>{((wallet.interestRate ?? 0) * 100).toFixed(2)}% p.a.</Text>
        </View>
        {wallet.bonusRate > 0 && (
          <View style={ac.rateRow}>
            <Text style={ac.rateLbl}>Bonus rate (with criteria)</Text>
            <Text style={[ac.rateVal, { color }]}>up to {(wallet.bonusRate * 100).toFixed(1)}%</Text>
          </View>
        )}
        <View style={ac.rateRow}>
          <Text style={ac.rateLbl}>Projected annual interest</Text>
          <Text style={[ac.rateVal, { color: Colors.successDark }]}>
            ~${Math.round(balance * (wallet.interestRate ?? 0))}/yr
          </Text>
        </View>
      </View>

      {pct !== null && (
        <View style={ac.prog}>
          <View style={ac.progRow}>
            <Text style={ac.progLbl}>Target: ${Math.round(wallet.target).toLocaleString()}</Text>
            <Text style={[ac.progPct, { color }]}>{Math.round(pct * 100)}%</Text>
          </View>
          <View style={ac.progTrack}>
            <View style={[ac.progFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
          </View>
        </View>
      )}
    </View>
  );
}

const ac = StyleSheet.create({
  card:       { backgroundColor: Colors.white, borderWidth: 1.5, borderRadius: Radii.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.soft },
  top:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm },
  iconWrap:   { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name:       { fontFamily: Fonts.bold, fontSize: 14 },
  inst:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  badge:      { borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:  { fontFamily: Fonts.bold, fontSize: 9 },
  manageBtn:  { borderWidth: 1, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 5 },
  manageBtnText: { fontFamily: Fonts.bold, fontSize: 11 },
  balance:    { fontFamily: Fonts.extraBold, fontSize: 34, marginBottom: 2 },
  coins:      { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.sm },
  feeWarn:    { backgroundColor: Colors.warningLight, borderRadius: Radii.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  feeWarnText:{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.warningDark, lineHeight: 17 },
  rates:      { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, gap: 6 },
  rateRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  rateLbl:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  rateVal:    { fontFamily: Fonts.bold, fontSize: 12 },
  prog:       { marginTop: Spacing.sm, gap: 5 },
  progRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  progLbl:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  progPct:    { fontFamily: Fonts.bold, fontSize: 11 },
  progTrack:  { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  progFill:   { height: 6, borderRadius: 3 },
});

// ─── Manage account sheet ─────────────────────────────────────────────────────

function ManageSheet({ wallet, allWallets, visible, onClose, onTransfer, onClose_account }) {
  if (!wallet) return null;
  const color    = wallet.color ?? TEAL;
  const balance  = wallet.balance ?? 0;
  const isCash   = wallet.id === 'wallet';
  const isMain   = wallet.type === 'bank' || wallet.type === 'hysa';

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={ms.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={ms.sheet}>
          <View style={[ms.handle, { backgroundColor: color }]} />
          <Text style={ms.title}>{wallet.label}</Text>
          <Text style={[ms.balance, { color }]}>${Math.round(balance).toLocaleString()}</Text>
          <Text style={ms.inst}>{wallet.institution}</Text>

          <View style={ms.actions}>
            <TouchableOpacity style={[ms.action, { borderColor: color + '40' }]} onPress={() => { onClose(); onTransfer(wallet); }} activeOpacity={0.8}>
              <Text style={ms.actionIcon}>↔</Text>
              <Text style={[ms.actionLabel, { color }]}>Transfer</Text>
            </TouchableOpacity>

            {!isCash && !isMain && (
              <TouchableOpacity
                style={[ms.action, { borderColor: Colors.danger + '40' }]}
                onPress={() => {
                  Alert.alert(
                    'Close account?',
                    `Your balance of $${Math.round(balance).toLocaleString()} will be moved to your main bank account.`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Close', style: 'destructive', onPress: () => { onClose(); onClose_account(wallet); } },
                    ]
                  );
                }}
                activeOpacity={0.8}
              >
                <Text style={ms.actionIcon}>✕</Text>
                <Text style={[ms.actionLabel, { color: Colors.danger }]}>Close account</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={ms.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={ms.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const ms = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingTop: Spacing.md, gap: 4 },
  handle:       { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  title:        { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary },
  balance:      { fontFamily: Fonts.extraBold, fontSize: 32, marginBottom: 2 },
  inst:         { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.lg },
  actions:      { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  action:       { flex: 1, borderWidth: 1.5, borderRadius: Radii.lg, paddingVertical: Spacing.md, alignItems: 'center', gap: 4 },
  actionIcon:   { fontSize: 20, color: Colors.textPrimary },
  actionLabel:  { fontFamily: Fonts.bold, fontSize: 12 },
  closeBtn:     { backgroundColor: Colors.lightGray, borderRadius: Radii.md, paddingVertical: 13, alignItems: 'center' },
  closeBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
});

// ─── Transfer tab ─────────────────────────────────────────────────────────────

function TransferTab({ sim, onSave, initialFrom }) {
  const wallets = (sim?.wallets ?? []).filter(w => w.balance > 0 || w.type !== 'wallet');
  const [fromId,   setFromId]   = useState(initialFrom?.id ?? wallets[0]?.id ?? null);
  const [toId,     setToId]     = useState(null);
  const [amount,   setAmount]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);

  const fromWallet = wallets.find(w => w.id === fromId);
  const toWallet   = wallets.find(w => w.id === toId);
  const maxAmt     = fromWallet?.balance ?? 0;
  const numAmt     = parseFloat(amount) || 0;
  const valid      = fromId && toId && fromId !== toId && numAmt > 0 && numAmt <= maxAmt;

  useEffect(() => { if (initialFrom) setFromId(initialFrom.id); }, [initialFrom]);

  const handleTransfer = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      await transferBetweenWallets(uid, fromId, toId, numAmt);
      setDone(true);
      setAmount('');
      setTimeout(() => { setDone(false); onSave(); }, 1500);
    } catch (e) { console.error('transfer:', e); }
    finally { setSaving(false); }
  };

  const WalletPicker = ({ label, selectedId, onSelect, exclude }) => (
    <View style={tr.pickerWrap}>
      <Text style={tr.pickerLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tr.pickerRow}>
        {wallets.filter(w => w.id !== exclude).map(w => {
          const sel   = selectedId === w.id;
          const color = w.color ?? TEAL;
          return (
            <TouchableOpacity
              key={w.id}
              style={[tr.pickerChip, sel && { backgroundColor: color, borderColor: color }]}
              onPress={() => onSelect(w.id)}
              activeOpacity={0.8}
            >
              <Text style={[tr.pickerChipText, sel && { color: Colors.white }]} numberOfLines={1}>
                {w.institution ?? w.label}
              </Text>
              <Text style={[tr.pickerChipBal, sel && { color: 'rgba(255,255,255,0.8)' }]}>
                ${Math.round(w.balance ?? 0).toLocaleString()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (done) {
    return (
      <View style={tr.doneBanner}>
        <Text style={tr.doneText}>✓  ${numAmt.toLocaleString()} transferred</Text>
      </View>
    );
  }

  return (
    <View style={tr.wrap}>
      <WalletPicker label="From" selectedId={fromId} onSelect={setFromId} exclude={toId} />
      <WalletPicker label="To"   selectedId={toId}   onSelect={setToId}   exclude={fromId} />

      {fromWallet && toWallet && (
        <>
          <Text style={tr.amtLabel}>Amount</Text>
          <View style={tr.amtRow}>
            <Text style={tr.amtPrefix}>$</Text>
            <TextInput
              style={tr.amtInput}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity style={tr.maxBtn} onPress={() => setAmount(String(Math.floor(maxAmt)))}>
              <Text style={tr.maxBtnText}>Max</Text>
            </TouchableOpacity>
          </View>
          <Text style={tr.available}>Available: ${Math.floor(maxAmt).toLocaleString()}</Text>

          <FinNote
            text={`Moving money between accounts takes effect immediately. Transfers don't affect interest — it's calculated on the balance at month end.`}
            color={fromWallet.color ?? TEAL}
          />

          <TouchableOpacity
            style={[tr.btn, { backgroundColor: valid ? (fromWallet.color ?? TEAL) : Colors.border }]}
            onPress={handleTransfer}
            disabled={!valid || saving}
            activeOpacity={0.88}
          >
            {saving
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={tr.btnText}>Transfer ${numAmt > 0 ? numAmt.toLocaleString() : '—'} →</Text>
            }
          </TouchableOpacity>
        </>
      )}

      {(!fromWallet || !toWallet) && (
        <Text style={tr.hint}>Select a source and destination account above.</Text>
      )}
    </View>
  );
}

const tr = StyleSheet.create({
  wrap:           { gap: Spacing.sm },
  pickerWrap:     { gap: 6 },
  pickerLabel:    { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  pickerRow:      { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  pickerChip:     { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.lg, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.white, minWidth: 90, alignItems: 'center' },
  pickerChipText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textPrimary },
  pickerChipBal:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  amtLabel:       { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Spacing.sm },
  amtRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.lg, paddingHorizontal: Spacing.md, gap: 8 },
  amtPrefix:      { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textMuted },
  amtInput:       { flex: 1, fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary, paddingVertical: 12 },
  maxBtn:         { backgroundColor: Colors.lightGray, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  maxBtnText:     { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textSecondary },
  available:      { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  btn:            { borderRadius: Radii.lg, paddingVertical: 15, alignItems: 'center' },
  btnText:        { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  hint:           { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  doneBanner:     { backgroundColor: Colors.successLight, borderRadius: Radii.lg, padding: Spacing.xl, alignItems: 'center' },
  doneText:       { fontFamily: Fonts.bold, fontSize: 16, color: Colors.successDark },
});

// ─── Products tab ─────────────────────────────────────────────────────────────

function ProductsTab({ sim, profile, onOpenEmergencyFund }) {
  const wallets       = sim?.wallets ?? [];
  const hasBank       = wallets.some(w => w.type === 'bank');
  const hasFund       = wallets.some(w => w.id === 'emergency-fund');
  const isHYSA        = wallets.some(w => w.accountType === 'hysa');
  const lessons       = profile?.completedLessons ?? [];
  const canFund       = hasBank && lessons.includes('3-1') && lessons.includes('3-2') && !hasFund;
  const canHYSA       = hasBank && !isHYSA && lessons.includes('5-1') && lessons.includes('5-2');
  const canFD         = lessons.includes('6-2');

  const ProductCard = ({ icon, title, desc, cta, onPress, locked, lockedReason, color = ORANGE }) => (
    <View style={[pd.card, locked && pd.cardLocked]}>
      <Text style={pd.icon}>{icon}</Text>
      <Text style={[pd.title, locked && { color: Colors.textMuted }]}>{title}</Text>
      <Text style={pd.desc}>{desc}</Text>
      {locked
        ? <View style={pd.lockedTag}><Text style={pd.lockedTagText}>🔒  {lockedReason}</Text></View>
        : <TouchableOpacity style={[pd.btn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.88}>
            <Text style={pd.btnText}>{cta}</Text>
          </TouchableOpacity>
      }
    </View>
  );

  return (
    <View style={{ gap: Spacing.sm }}>
      <ProductCard
        icon="🛡️"
        title="Emergency Fund"
        desc="A ring-fenced account that sits at the same bank. Same interest rate — but separated so you can't accidentally spend it. Target: 3× your monthly expenses."
        cta="Set up emergency fund →"
        color={GREEN}
        onPress={onOpenEmergencyFund}
        locked={!canFund}
        lockedReason={hasFund ? 'Already open' : !lessons.includes('3-1') ? "Complete 'Why You Need an Emergency Fund'" : !hasBank ? 'Open a bank account first' : ''}
      />
      <ProductCard
        icon="⚡"
        title="Upgrade to HYSA"
        desc="Switch to a High-Yield Savings Account — up to 4%+ p.a. with salary credit + card spend. Same deposit protection, meaningfully higher returns."
        cta="Compare HYSA accounts →"
        color={ORANGE}
        onPress={() => {}}
        locked={!canHYSA}
        lockedReason={isHYSA ? 'Already on HYSA' : "Complete Module 2 HYSA lessons to unlock"}
      />
      <ProductCard
        icon="📜"
        title="Fixed Deposit"
        desc="Lock money for 6–12 months at 3–4% p.a. No fees, no conditions. Good for money you won't need for a while."
        cta="Open fixed deposit →"
        color={TEAL}
        onPress={() => {}}
        locked={!canFD}
        lockedReason="Complete 'Fixed Deposits in Singapore' lesson"
      />
      <ProductCard
        icon="📲"
        title="Digital Bank (GXS / MariBank)"
        desc="Higher base rates with no minimum balance. Good for a secondary savings account. Pairs well with a traditional bank for your main salary."
        cta="Explore digital banks →"
        color={MODULE_COLORS['module-4'].color}
        onPress={() => {}}
        locked={!lessons.includes('4-2')}
        lockedReason="Complete 'Digital Banks & Fintech' lesson"
      />
    </View>
  );
}

const pd = StyleSheet.create({
  card:           { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.lg, padding: Spacing.md, ...Shadows.soft },
  cardLocked:     { opacity: 0.6 },
  icon:           { fontSize: 26, marginBottom: 6 },
  title:          { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  desc:           { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  btn:            { borderRadius: Radii.md, paddingVertical: 10, alignItems: 'center' },
  btnText:        { fontFamily: Fonts.bold, fontSize: 13, color: Colors.white },
  lockedTag:      { alignSelf: 'flex-start', backgroundColor: Colors.lightGray, borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  lockedTagText:  { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted },
});

// ─── History tab ──────────────────────────────────────────────────────────────

function HistoryTab({ sim }) {
  const wallets = sim?.wallets ?? [];
  const bankW   = wallets.find(w => w.type === 'bank' || w.type === 'hysa');
  const fundW   = wallets.find(w => w.id === 'emergency-fund');
  const history = sim?.history ?? [];

  const interestWallets = wallets.filter(w => (w.interestLog ?? []).length > 0);
  const totalInterest = wallets.reduce((s, w) =>
    s + (w.interestLog ?? []).reduce((a, e) => a + (e.amount ?? 0), 0), 0
  );

  if (history.length === 0 && interestWallets.length === 0) {
    return (
      <View style={ht.empty}>
        <Text style={ht.emptyEmoji}>📋</Text>
        <Text style={ht.emptyText}>Your interest history and monthly snapshots will appear here as you advance through months.</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.md }}>
      {totalInterest > 0 && (
        <View style={ht.totalCard}>
          <Text style={ht.totalLabel}>TOTAL INTEREST EARNED</Text>
          <Text style={[ht.totalAmt, { color: Colors.successDark }]}>${Math.round(totalInterest).toLocaleString()}</Text>
          <Text style={ht.totalNote}>Across all accounts, all months</Text>
        </View>
      )}

      {interestWallets.map(w => {
        const color = w.color ?? TEAL;
        const log   = (w.interestLog ?? []).slice().reverse();
        return (
          <View key={w.id} style={ht.walletBlock}>
            <Text style={[ht.walletName, { color }]}>{w.institution ?? w.label}</Text>
            {log.map((entry, i) => (
              <View key={i} style={ht.entryRow}>
                <Text style={ht.entryMonth}>Month {entry.month}</Text>
                <Text style={[ht.entryAmt, { color: Colors.successDark }]}>+${(entry.amount ?? 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        );
      })}

      {history.length > 0 && (
        <View style={ht.walletBlock}>
          <Text style={ht.walletName}>Net worth snapshots</Text>
          {[...history].reverse().map((h, i) => {
            const total = Object.values(h.walletSnapshots ?? {}).reduce((s, v) => s + v, 0);
            return (
              <View key={i} style={ht.entryRow}>
                <Text style={ht.entryMonth}>Month {h.month}</Text>
                <Text style={ht.entryAmt}>${Math.round(total).toLocaleString()}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const ht = StyleSheet.create({
  empty:      { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptyEmoji: { fontSize: 32 },
  emptyText:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  totalCard:  { backgroundColor: Colors.successLight, borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'center', gap: 4 },
  totalLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.successDark, textTransform: 'uppercase', letterSpacing: 0.8 },
  totalAmt:   { fontFamily: Fonts.extraBold, fontSize: 28 },
  totalNote:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.successDark },
  walletBlock:{ backgroundColor: Colors.white, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, gap: 2, ...Shadows.soft },
  walletName: { fontFamily: Fonts.bold, fontSize: 13, marginBottom: 6 },
  entryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  entryMonth: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  entryAmt:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
});

// ─────────────────────────────────────────────────────────────────────────────
// LOBBY — full returning-mode bank
// ─────────────────────────────────────────────────────────────────────────────

function BankLobby({ sim, profile, onBack, onReload }) {
  const router = useRouter();
  const [activeTab,    setActiveTab]    = useState('Accounts');
  const [manageWallet, setManageWallet] = useState(null);
  const [showManage,   setShowManage]   = useState(false);
  const [transferFrom, setTransferFrom] = useState(null);
  const [saving,       setSaving]       = useState(false);

  const uid      = auth.currentUser?.uid;
  const wallets  = sim?.wallets ?? [];
  const bankW    = wallets.find(w => w.type === 'bank') ?? wallets.find(w => w.type === 'hysa');
  const color    = bankW?.color ?? ORANGE;
  const isHYSA   = bankW?.accountType === 'hysa';

  // Show accounts tab with transfer pre-filled from manage sheet
  const handleManageTransfer = (wallet) => {
    setTransferFrom(wallet);
    setActiveTab('Transfer');
  };

  // Close an account — move balance back to main bank account
  const handleCloseAccount = async (wallet) => {
    if (!bankW || !uid) return;
    setSaving(true);
    try {
      await transferBetweenWallets(uid, wallet.id, bankW.id, wallet.balance ?? 0);
      // Mark wallet as closed by setting balance to 0 and adding closedMonth
      const updatedWallets = (sim?.wallets ?? []).map(w =>
        w.id === wallet.id ? { ...w, balance: 0, closedMonth: sim?.currentMonth ?? 1 } : w
      );
      await saveSimProgress(uid, { wallets: updatedWallets });
      onReload();
    } catch (e) { console.error('closeAccount:', e); }
    finally { setSaving(false); }
  };

  // Open emergency fund
  const handleOpenEmergencyFund = async () => {
    if (!uid || !bankW) return;
    setSaving(true);
    try {
      const monthlyNeeds = sim?.monthlyBudget?.needsAmt ?? Math.round((sim?.income ?? 2000) * 0.5);
      const fundWallet = {
        ...WALLET_TEMPLATES.emergencyFund,
        target:      monthlyNeeds * 3,
        institution: bankW.institution,
        linkedTo:    bankW.id,
        interestRate: bankW.interestRate ?? 0.0005,
        color:       Colors.successDark,
        colorLight:  Colors.successLight,
        balance:     0,
        interestLog: [],
      };
      await addWallet(uid, fundWallet);
      onReload();
      setActiveTab('Accounts');
    } catch (e) { console.error('openFund:', e); }
    finally { setSaving(false); }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={lb.root}>
      {/* ── Header ── */}
      <View style={[lb.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={onBack} style={lb.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={lb.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[lb.bankName, { color }]}>{bankW?.institution ?? 'The Bank'}</Text>
          <Text style={lb.bankSub}>{isHYSA ? 'High-Yield Savings Account' : 'Savings Account'}</Text>
        </View>
        {isHYSA && (
          <View style={[lb.hysaBadge, { backgroundColor: color + '20' }]}>
            <Text style={[lb.hysaText, { color }]}>HYSA ⚡</Text>
          </View>
        )}
      </View>

      {/* ── Tab bar ── */}
      <TabBar active={activeTab} onChange={setActiveTab} color={color} />

      {/* ── Tab content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[lb.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'Accounts' && (
          <>
            {wallets
              .filter(w => w.type !== 'wallet' && !(w.closedMonth))
              .map(w => (
                <AccountCard
                  key={w.id}
                  wallet={w}
                  onManage={(wallet) => { setManageWallet(wallet); setShowManage(true); }}
                />
              ))
            }
            {wallets.filter(w => w.type !== 'wallet').length === 0 && (
              <Text style={lb.emptyNote}>No accounts open yet.</Text>
            )}
          </>
        )}

        {activeTab === 'Transfer' && (
          <TransferTab
            sim={sim}
            onSave={onReload}
            initialFrom={transferFrom}
          />
        )}

        {activeTab === 'Products' && (
          <ProductsTab
            sim={sim}
            profile={profile}
            onOpenEmergencyFund={handleOpenEmergencyFund}
          />
        )}

        {activeTab === 'History' && (
          <HistoryTab sim={sim} />
        )}
      </ScrollView>

      {/* ── Manage sheet ── */}
      <ManageSheet
        wallet={manageWallet}
        allWallets={wallets}
        visible={showManage}
        onClose={() => setShowManage(false)}
        onTransfer={handleManageTransfer}
        onClose_account={handleCloseAccount}
      />
    </View>
  );
}

const lb = StyleSheet.create({
  root:       { flex: 1, backgroundColor: Colors.background },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.lightGray, borderRadius: Radii.full },
  backIcon:   { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary },
  bankName:   { fontFamily: Fonts.extraBold, fontSize: 17 },
  bankSub:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  hysaBadge:  { borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  hysaText:   { fontFamily: Fonts.bold, fontSize: 11 },
  content:    { padding: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.xs },
  emptyNote:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main export — routes between wizard and lobby
// ─────────────────────────────────────────────────────────────────────────────

export default function BankScreen() {
  const router     = useRouter();
  const goBack     = useSafeBack('/(tabs)/simulate');
  const profile    = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);
  const insets     = useSafeAreaInsets();

  const uid      = auth.currentUser?.uid;
  const finCoins = profile?.finCoins ?? 0;

  const [sim,          setSim]          = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [step,         setStep]         = useState(1);
  const [accountType,  setAccountType]  = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [showOpening,  setShowOpening]  = useState(false);
  const [saving,       setSaving]       = useState(false);

  const scrollRef = useRef(null);

  const loadSim = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await loadSimProgress(uid);
      setSim(data);
    } catch (e) { console.error('BankScreen load:', e); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { loadSim(); }, [loadSim]);

  const walletBalance  = (sim?.wallets ?? []).find(w => w.id === 'wallet')?.balance ?? 0;
  const chosenType     = ACCOUNT_TYPES.find(t => t.id === accountType);
  const chosenBank     = BANK_ACCOUNTS.find(b => b.id === selectedBank);
  const availableBanks = accountType ? BANK_ACCOUNTS.filter(b => b.accountType === accountType) : [];

  const handleTypeSelect = (typeId) => {
    setAccountType(typeId);
    setSelectedBank(null);
    setTimeout(() => {
      setStep(2);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 300);
  };

  const handleOpenAccount = async () => {
    if (!chosenBank || saving) return;
    setSaving(true);
    try {
      const freshSim  = await loadSimProgress(uid);
      const walletBal = (freshSim?.wallets ?? []).find(w => w.id === 'wallet')?.balance ?? walletBalance;

      const bankWallet = {
        ...WALLET_TEMPLATES.bank,
        id:           chosenBank.id,
        label:        chosenBank.name,
        icon:         '🏦',
        balance:      walletBal,
        interestRate: chosenBank.baseRate,
        bonusRate:    chosenBank.bonusRate > 0 ? chosenBank.bonusRate : null,
        accountType,
        color:        chosenBank.color,
        colorLight:   chosenBank.colorLight,
        institution:  chosenBank.bank,
        minBalance:   chosenBank.minBalance,
        fallBelowFee: chosenBank.fallBelowFee,
        interestLog:  [],
        openedMonth:  freshSim?.currentMonth ?? 1,
      };

      const updatedWallets = [
        ...(freshSim?.wallets ?? []).map(w =>
          w.id === 'wallet' ? { ...w, balance: 0 } : w
        ),
        bankWallet,
      ];

      await saveSimProgress(uid, {
        wallets:       updatedWallets,
        bankAccountId: chosenBank.id,
        accountType,
        stage2Data: {
          bankId:         chosenBank.id,
          bankName:       chosenBank.bank,
          accountType,
          openingBalance: walletBal,
        },
        completedStages: [...(freshSim?.completedStages ?? []), 'stage-2'],
        updatedAt: Date.now(),
      });

      setProfile({ ...profile, finCoins: finCoins + 50 });
      await loadSim();
    } catch (e) {
      console.error('handleOpenAccount:', e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ── RETURNING MODE ─────────────────────────────────────────────────────────
  const hasAccount = !!(sim?.bankAccountId || (sim?.wallets ?? []).find(w => w.type === 'bank'));
  if (hasAccount) {
    return (
      <BankLobby
        sim={sim}
        profile={profile}
        onBack={goBack}
        onReload={loadSim}
      />
    );
  }

  // ── FIRST VISIT — lesson gate ───────────────────────────────────────────────
  const lessonDone = (profile?.completedLessons ?? []).includes('4-1');
  if (!lessonDone) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, backgroundColor: Colors.background, gap: Spacing.md }}>
        <Text style={{ fontSize: 40 }}>🔒</Text>
        <Text style={{ fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, textAlign: 'center' }}>
          Complete 'The Big Three Local Banks' first
        </Text>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 }}>
          You need to understand what you're opening before you open it. Finish lesson 4-1 in the Learn tab.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: ORANGE, borderRadius: Radii.lg, paddingVertical: 13, paddingHorizontal: 32, marginTop: 8 }}
          onPress={goBack}
          activeOpacity={0.88}
        >
          <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.white }}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── WIZARD ─────────────────────────────────────────────────────────────────
  const stageColor = ORANGE;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={[lb.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : goBack()} style={lb.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={lb.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[lb.bankName, { color: stageColor }]}>Open a Bank Account</Text>
          <Text style={lb.bankSub}>Step {step} of 2</Text>
        </View>
        <View style={{ backgroundColor: stageColor + '18', borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ fontFamily: Fonts.extraBold, fontSize: 13, color: stageColor }}>
            {formatDual(walletBalance).sgd} cash
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <>
            <Text style={{ fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary, marginBottom: Spacing.md }}>
              What kind of account?
            </Text>
            <FinNote text="Both account types have the same deposit protection. The difference is what happens to your money while it sits there." color={stageColor} />
            {walletBalance > 0 && (() => {
              const { basicEarned, hysaEarned, difference } = calcInterestComparison(walletBalance);
              return (
                <View style={{ backgroundColor: Colors.white, borderWidth: 1.5, borderColor: stageColor + '30', borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: stageColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm }}>
                    What your {formatDual(walletBalance).sgd} earns in a year
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 3 }}>Basic savings</Text>
                      <Text style={{ fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textMuted }}>${basicEarned}</Text>
                    </View>
                    <View style={{ width: 1, height: 36, backgroundColor: stageColor + '30', marginHorizontal: 4 }} />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 3 }}>HYSA (max rate)</Text>
                      <Text style={{ fontFamily: Fonts.extraBold, fontSize: 20, color: stageColor }}>${hysaEarned}</Text>
                    </View>
                    <View style={{ width: 1, height: 36, backgroundColor: stageColor + '30', marginHorizontal: 4 }} />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 3 }}>Difference</Text>
                      <Text style={{ fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.successDark }}>+${difference}</Text>
                    </View>
                  </View>
                </View>
              );
            })()}
            {ACCOUNT_TYPES.map(type => (
              <AccountTypeCard key={type.id} type={type} selected={accountType} onSelect={handleTypeSelect} balance={walletBalance} />
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <TouchableOpacity onPress={() => { setStep(1); setSelectedBank(null); }} style={{ marginBottom: Spacing.md }}>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: stageColor }}>← {chosenType?.label ?? 'Account type'}</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary, marginBottom: Spacing.md }}>
              {accountType === 'hysa' ? 'Which HYSA?' : 'Open with DBS'}
            </Text>
            {accountType === 'hysa' && (
              <FinNote text="Both OCBC and UOB offer strong bonus rates. The difference is in the conditions — expand each card to see what's required." color={stageColor} />
            )}
            {availableBanks.map(bank => (
              <BankPickerCard key={bank.id} bank={bank} selected={selectedBank} onSelect={id => setSelectedBank(id)} />
            ))}
            {selectedBank && (
              <TouchableOpacity
                style={{ backgroundColor: chosenBank?.color ?? stageColor, borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm }}
                onPress={() => setShowOpening(true)}
                activeOpacity={0.88}
              >
                <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.white }}>
                  Open {chosenBank?.bank} {accountType === 'hysa' ? 'HYSA' : 'Account'} →
                </Text>
              </TouchableOpacity>
            )}
            {!selectedBank && (
              <View style={{ backgroundColor: Colors.lightGray, borderRadius: Radii.md, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted }}>👆  Select an account above to continue</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <OpeningSheet
        visible={showOpening}
        bank={chosenBank}
        accountType={accountType}
        walletBalance={walletBalance}
        onDone={async () => {
          setShowOpening(false);
          await handleOpenAccount();
        }}
      />
    </View>
  );
}