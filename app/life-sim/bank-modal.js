/**
 * app/life-sim/bank-modal.js
 * Full-screen bank management modal — Accounts, Transfers, Salary, Goals
 */

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image, TextInput,
  StyleSheet, Dimensions, Easing,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc as firestoreDoc, updateDoc as firestoreUpdateDoc, getDoc as firestoreGetDoc, increment } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { setBankAccount, transferBetweenWallets, openSavingsGoalAccount, closeSavingsGoalAccount } from '../../lib/lifeSim';
import { Colors, Fonts, Radii, Shadows, Spacing, MODULE_COLORS } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const COIN = require('../../assets/coin.png');

// ─── Bank data ──────────────────────────────────────────────────────────────

const ACCOUNT_TYPES = [
  { id: 'basic', label: 'Basic Savings', icon: '📋', rate: 0.0005, rateLabel: '0.05% p.a.', tagline: 'Standard savings. Low interest, no minimum balance.',
    color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight },
  { id: 'hysa', label: 'High-Yield Savings', icon: '⚡', rate: 0.078, rateLabel: 'Up to 7.8% p.a.', tagline: 'Earn more. Best for growing your savings fast.',
    color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight },
];

const BANKS = [
  { id: 'unison', name: 'Unison Bank', icon: '🏛️', bank: 'Unison', rate: 0.078, rateLabel: 'Up to 7.8% p.a.',
    color: '#F4A261', colorLight: '#F4A26120' },
  { id: 'orbit', name: 'Orbit Bank', icon: '🪐', bank: 'Orbit', rate: 0.0465, rateLabel: 'Up to 4.65% p.a.',
    color: MODULE_COLORS['module-1'].color, colorLight: MODULE_COLORS['module-1'].colorLight },
  { id: 'vertex', name: 'Vertex Bank', icon: '🔷', bank: 'Vertex', rate: 0.035, rateLabel: '3.5% p.a.',
    color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight },
  { id: 'pinnacle', name: 'Pinnacle Bank', icon: '🏔️', bank: 'Pinnacle', rate: 0.025, rateLabel: '2.5% p.a.',
    color: MODULE_COLORS['module-4'].color, colorLight: MODULE_COLORS['module-4'].colorLight },
];

const WALLET_CYCLE = [
  { color: MODULE_COLORS['module-1'].color, colorLight: MODULE_COLORS['module-1'].colorLight },
  { color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight },
  { color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight },
  { color: MODULE_COLORS['module-4'].color, colorLight: MODULE_COLORS['module-4'].colorLight },
];

const TABS = ['Accounts', 'Transfers', 'Salary', 'Goals'];
const PROMOTION_ELIGIBLE_MONTHS = 24;
const COOLDOWN_MONTHS = 3;

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) => {
  if (n == null) return '0';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const CoinAmount = ({ value, size = 16, fontSize = 16, fontFamily = Fonts.bold, color = Colors.textPrimary }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <Image source={COIN} style={{ width: size, height: size }} />
    <Text style={{ fontFamily, fontSize, color }}>{fmt(value)}</Text>
  </View>
);

const FinCard = ({ text }) => (
  <View style={b.finCard}>
    <View style={b.finCardTop}>
      <View style={b.finCardAvatar}><Text style={{ fontSize: 16 }}>🐟</Text></View>
      <Text style={b.finCardLabel}>FIN SAYS</Text>
    </View>
    <Text style={b.finCardText}>{text}</Text>
  </View>
);

const deepClean = (obj) => {
  if (Array.isArray(obj)) return obj.map(deepClean);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, deepClean(v)])
    );
  }
  return obj;
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function BankModal({ visible, onClose, sim, onSimUpdate, initialTab = 'Accounts' }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Reset to initialTab whenever modal opens
  useEffect(() => {
    if (visible) setActiveTab(initialTab);
  }, [visible, initialTab]);

  // Accounts state
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [accountTransferring, setAccountTransferring] = useState(false);
  const [accountDone, setAccountDone] = useState(false);
  const accountBarAnim = useRef(new Animated.Value(0)).current;

  // Transfers state
  const [fromWallet, setFromWallet] = useState(null);
  const [toWallet, setToWallet] = useState(null);
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferring, setTransferring] = useState(false);
  const [transferDone, setTransferDone] = useState(false);
  const transferBarAnim = useRef(new Animated.Value(0)).current;
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Salary state
  const [promotionBusy, setPromotionBusy] = useState(false);
  const [promotionResult, setPromotionResult] = useState(null);
  const promotionAnim = useRef(new Animated.Value(0)).current;

  // Goals state
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [goalStep, setGoalStep] = useState(1);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState(500);
  const [goalContribution, setGoalContribution] = useState(50);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState(0);
  const [closingGoal, setClosingGoal] = useState(null);
  const [editingAutoGoalId, setEditingAutoGoalId] = useState(null);
  const [autoAmount, setAutoAmount] = useState('');
  const [confirmDisableAuto, setConfirmDisableAuto] = useState(null);
  const [editingInvestAutoId, setEditingInvestAutoId] = useState(null);
  const [investAutoAmount, setInvestAutoAmount] = useState('');

  const wallets = sim?.wallets ?? [];
  const cashWallet = wallets.find(w => w.id === 'wallet');
  const cashBalance = cashWallet?.balance ?? 0;

  // Reset sub-state when tab changes
  useEffect(() => {
    setCreatingAccount(false);
    setSelectedType(null);
    setSelectedBank(null);
    setAccountDone(false);
    setTransferDone(false);
    setPromotionResult(null);
    setCreatingGoal(false);
    setShowFromPicker(false);
    setShowToPicker(false);
  }, [activeTab]);

  // ─── Header ─────────────────────────────────────────────────────────────────

  const Header = () => (
    <View style={[b.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={onClose} style={b.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={b.backBtnText}>←</Text>
      </TouchableOpacity>
      <Text style={{ fontFamily: Fonts.bold, fontSize: 17, color: Colors.textPrimary }}>Bank</Text>
      <TouchableOpacity onPress={onClose} style={b.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={b.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Tab Bar ────────────────────────────────────────────────────────────────

  const TabBar = () => (
    <View style={b.tabBar}>
      {TABS.map(t => (
        <TouchableOpacity
          key={t}
          style={[b.tab, activeTab === t && b.tabActive]}
          onPress={() => setActiveTab(t)}
        >
          <Text style={[b.tabText, activeTab === t && b.tabTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ─── Animated progress bar helper ──────────────────────────────────────────

  const AnimatedBar = ({ anim, color = Colors.primary }) => {
    const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    return (
      <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.lightGray, marginTop: 12, overflow: 'hidden' }}>
        <Animated.View style={{ height: 6, borderRadius: 3, backgroundColor: color, width }} />
      </View>
    );
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // TAB 1 — ACCOUNTS
  // ═════════════════════════════════════════════════════════════════════════════

  const existingAccountTypes = wallets.filter(w => w.type === 'bank').map(w => w.accountType);

  const handleOpenAccount = async () => {
    if (!selectedBank) return;
    setAccountTransferring(true);
    accountBarAnim.setValue(0);

    Animated.timing(accountBarAnim, {
      toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start(async () => {
      try {
        const uid = auth.currentUser?.uid;
        await setBankAccount(uid, deepClean({
          id: selectedBank.id,
          name: selectedBank.name,
          bank: selectedBank.bank,
          accountType: selectedType,
          baseRate: selectedBank.rate,
          color: selectedBank.color,
          colorLight: selectedBank.colorLight,
          openingBalance: depositAmount ?? 0,
        }));
        await onSimUpdate();
        setAccountDone(true);
      } catch (e) {
        console.error('Open account error:', e);
      } finally {
        setAccountTransferring(false);
      }
    });
  };

  const renderAccountCreation = () => {
    if (accountDone) {
      return (
        <View style={b.content}>
          <View style={[b.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.textPrimary, marginBottom: 4 }}>Account Opened!</Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 }}>
              Your {selectedBank?.name} account is ready.
            </Text>
            <CoinAmount value={depositAmount} size={20} fontSize={20} fontFamily={Fonts.extraBold} />
          </View>
          <FinCard text="Having a dedicated savings account means your money grows even while you sleep. The earlier you start, the more compound interest works in your favour." />
          <TouchableOpacity style={b.ctaBtn} onPress={() => { setCreatingAccount(false); setAccountDone(false); setSelectedType(null); setSelectedBank(null); }}>
            <Text style={b.ctaBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Step 1: Pick account type
    if (!selectedType) {
      return (
        <View style={b.content}>
          <Text style={b.sectionTitle}>Choose Account Type</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {ACCOUNT_TYPES.map(t => {
              const alreadyHeld = existingAccountTypes.includes(t.id);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[b.accountTypeCard, alreadyHeld && { opacity: 0.5 }]}
                  onPress={() => !alreadyHeld && setSelectedType(t.id)}
                  disabled={alreadyHeld}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                  <Text style={b.accountTypeLabel}>{t.label}</Text>
                  <Text style={b.accountTypeRate}>{t.rateLabel}</Text>
                  <Text style={b.accountTypeDesc} numberOfLines={3}>{t.tagline}</Text>
                  {alreadyHeld && (
                    <View style={b.accountTypeHeldBadge}>
                      <Text style={b.accountTypeHeldText}>Already held</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => setCreatingAccount(false)} style={{ marginTop: 8, alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textMuted }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Step 2: Pick bank
    if (!selectedBank) {
      const bankList = BANKS;
      return (
        <View style={b.content}>
          <Text style={b.sectionTitle}>Choose a Bank</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {bankList.map(bank => (
              <TouchableOpacity key={bank.id} style={[b.card, { width: (SW - 52) / 2, borderWidth: 2, borderColor: selectedBank?.id === bank.id ? bank.color : Colors.border }]} onPress={() => { setSelectedBank(bank); setDepositAmount(Math.min(100, cashBalance)); }}>
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bank.colorLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{bank.icon}</Text>
                  </View>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, textAlign: 'center' }}>{bank.name}</Text>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: bank.color }}>{bank.rateLabel}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => setSelectedType(null)} style={{ marginTop: 8, alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textMuted }}>Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Step 3: Choose deposit amount
    return (
      <View style={b.content}>
        <Text style={b.sectionTitle}>Opening Deposit</Text>
        <View style={b.card}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginBottom: 4 }}>Deposit Amount</Text>
            <CoinAmount value={depositAmount} size={24} fontSize={28} fontFamily={Fonts.extraBold} />
          </View>
          <Slider
            minimumValue={0}
            maximumValue={cashBalance}
            step={1}
            value={depositAmount}
            onValueChange={setDepositAmount}
            minimumTrackTintColor={selectedBank.color}
            maximumTrackTintColor={Colors.lightGray}
            thumbTintColor={selectedBank.color}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted }}>
              Available:
            </Text>
            <CoinAmount value={cashBalance} size={12} fontSize={12} fontFamily={Fonts.semiBold} color={Colors.textSecondary} />
          </View>
          {accountTransferring && <AnimatedBar anim={accountBarAnim} color={selectedBank.color} />}
        </View>
        <FinCard text={`${selectedBank.name} offers ${selectedBank.rateLabel}. Even a small opening deposit starts the compounding clock.`} />
        <TouchableOpacity
          style={[b.ctaBtn, accountTransferring && { opacity: 0.6 }]}
          onPress={handleOpenAccount}
          disabled={accountTransferring || depositAmount <= 0}
        >
          {accountTransferring
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={b.ctaBtnText}>Open Account</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedBank(null)} style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textMuted }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAccounts = () => {
    if (creatingAccount) return renderAccountCreation();

    const bankWallets = wallets.filter(w => w.type === 'bank' || w.type === 'savings-goal' || w.type === 'emergency');

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={b.content} showsVerticalScrollIndicator={false}>
        <Text style={b.sectionTitle}>Your Wallets</Text>
        {wallets.map((w, idx) => {
          const cycle = WALLET_CYCLE[idx % WALLET_CYCLE.length];
          const wColor = w.color ?? cycle.color;
          const wColorLight = w.colorLight ?? cycle.colorLight;
          const isSavingsGoal = w.type === 'savings-goal';
          const isEmergency = w.type === 'emergency';
          const isBank = w.type === 'bank';

          return (
            <View key={w.id} style={[b.card, { borderLeftWidth: 4, borderLeftColor: wColor }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: wColorLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>{w.icon ?? (isBank ? '🏦' : isSavingsGoal ? '🎯' : isEmergency ? '🛡️' : '💰')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary }}>{w.label}</Text>
                  {w.institution && (
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted }}>
                      {w.institution} {w.interestRate ? `· ${(w.interestRate * 100).toFixed(2)}% p.a.` : ''}
                    </Text>
                  )}
                </View>
                <CoinAmount value={w.balance ?? 0} size={14} fontSize={16} fontFamily={Fonts.extraBold} />
              </View>

              {isBank && w.accountType && (
                <View style={{ alignSelf: 'flex-start', backgroundColor: wColorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, marginBottom: 4 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 10, color: wColor, textTransform: 'uppercase' }}>
                    {w.accountType === 'hysa' ? 'High-Yield' : 'Basic'} Savings
                  </Text>
                </View>
              )}

              {isSavingsGoal && (w.target ?? w.targetAmount ?? 0) > 0 && (
                <View style={{ marginTop: 4 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.lightGray, overflow: 'hidden' }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: wColor, width: `${Math.min(100, ((w.balance ?? 0) / (w.target ?? w.targetAmount)) * 100)}%` }} />
                  </View>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
                    {Math.round(((w.balance ?? 0) / (w.target ?? w.targetAmount)) * 100)}% of target
                  </Text>
                </View>
              )}

              {isEmergency && (
                <View style={{ marginTop: 4 }}>
                  {(() => {
                    const monthlyNeeds = sim?.monthlyBudget?.needsAmt ?? 0;
                    const monthsCovered = monthlyNeeds > 0 ? Math.floor((w.balance ?? 0) / monthlyNeeds) : 0;
                    const targetMonths = monthlyNeeds > 0 && w.target ? Math.round(w.target / monthlyNeeds) : null;
                    const pct = w.target > 0 ? Math.min(100, Math.round(((w.balance ?? 0) / w.target) * 100)) : 0;
                    return (
                      <>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.lightGray, overflow: 'hidden' }}>
                          <View style={{ height: 6, borderRadius: 3, backgroundColor: wColor, width: `${pct}%` }} />
                        </View>
                        <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
                          {monthlyNeeds > 0
                            ? (targetMonths ? `${monthsCovered} of ${targetMonths} months covered` : `${monthsCovered} months covered`)
                            : `${pct}% funded`}
                        </Text>
                      </>
                    );
                  })()}
                </View>
              )}
            </View>
          );
        })}

        {existingAccountTypes.length < ACCOUNT_TYPES.length && (
          <TouchableOpacity style={b.ctaBtn} onPress={() => setCreatingAccount(true)}>
            <Text style={b.ctaBtnText}>Open New Account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // TAB 2 — TRANSFERS
  // ═════════════════════════════════════════════════════════════════════════════

  const maxTransfer = fromWallet ? (fromWallet.balance ?? 0) : 0;
  const toRate = toWallet?.interestRate ?? 0;

  const getTransferFinMessage = () => {
    const fromType = fromWallet?.type;
    const toType = toWallet?.type;
    if (fromType === 'cash' && toType === 'bank')
      return 'Your cash is now earning interest. Every FC in a savings account is working harder than every FC sitting idle.';
    if (toType === 'investment')
      return 'Moving money into investments is a one-way door in the short term. Make sure you won\'t need this for at least 3 years.';
    if (toType === 'emergency' || toType === 'savings-goal')
      return 'Building your safety net. Every contribution brings you closer to the point where nothing can derail your financial plan.';
    return 'Transfer complete. Your money is exactly where you put it.';
  };

  const handleTransfer = async () => {
    if (!fromWallet || !toWallet || transferAmount <= 0) return;
    setTransferring(true);
    transferBarAnim.setValue(0);

    Animated.timing(transferBarAnim, {
      toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start(async () => {
      try {
        const uid = auth.currentUser?.uid;
        await transferBetweenWallets(uid, fromWallet.id, toWallet.id, transferAmount);
        await onSimUpdate();
        setTransferDone(true);
      } catch (e) {
        console.error('Transfer error:', e);
      } finally {
        setTransferring(false);
      }
    });
  };

  const renderTransfers = () => {
    const recentTransfers = (() => {
      const history = sim?.history ?? [];
      const transfers = [];
      for (let i = history.length - 1; i >= 0 && transfers.length < 10; i--) {
        const h = history[i];
        if ((h.salaryCredit ?? 0) > 0) transfers.push({
          id: `salary-${h.month}`, month: h.month, icon: '💼',
          label: 'Salary credited', from: 'Luminary', to: 'Bank',
          amount: h.salaryCredit, type: 'credit',
        });
        if ((h.savingsContribution ?? 0) > 0) transfers.push({
          id: `savings-${h.month}`, month: h.month, icon: '🎯',
          label: 'Savings goal', from: 'Bank', to: 'Savings',
          amount: h.savingsContribution, type: 'debit',
        });
        if ((h.efContribution ?? 0) > 0) transfers.push({
          id: `ef-${h.month}`, month: h.month, icon: '🛡️',
          label: 'Emergency fund', from: 'Bank', to: 'Emergency Fund',
          amount: h.efContribution, type: 'debit',
        });
        if ((h.dcaContribution ?? 0) > 0) transfers.push({
          id: `dca-${h.month}`, month: h.month, icon: '📈',
          label: 'Investment DCA', from: 'Bank', to: 'Portfolio',
          amount: h.dcaContribution, type: 'debit',
        });
        if ((h.needsDebit ?? 0) > 0) transfers.push({
          id: `needs-${h.month}`, month: h.month, icon: '🏠',
          label: 'Monthly needs', from: 'Bank', to: 'Expenses',
          amount: h.needsDebit, type: 'debit',
        });
      }
      return transfers.slice(0, 10);
    })();

    if (transferDone) {
      return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={b.content} showsVerticalScrollIndicator={false}>
          <View style={[b.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>✅</Text>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.textPrimary, marginBottom: 8 }}>Transfer Complete</Text>
            <CoinAmount value={transferAmount} size={22} fontSize={24} fontFamily={Fonts.extraBold} />
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 8 }}>
              {fromWallet?.label} → {toWallet?.label}
            </Text>
          </View>
          <FinCard text={getTransferFinMessage()} />
          <TouchableOpacity style={b.ctaBtn} onPress={() => { setTransferDone(false); setFromWallet(null); setToWallet(null); setTransferAmount(0); }}>
            <Text style={b.ctaBtnText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    const fromWalletColor = fromWallet?.color ?? WALLET_CYCLE[wallets.indexOf(fromWallet) % WALLET_CYCLE.length]?.color ?? Colors.primary;
    const toWalletColor = toWallet?.color ?? WALLET_CYCLE[wallets.indexOf(toWallet) % WALLET_CYCLE.length]?.color ?? Colors.primary;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={b.content} showsVerticalScrollIndicator={false}>
        {/* FROM */}
        <View style={b.transferSection}>
          <Text style={b.transferSectionLabel}>FROM</Text>
          <TouchableOpacity style={b.transferWalletCard} onPress={() => setShowFromPicker(true)} activeOpacity={0.85}>
            {fromWallet ? (
              <View style={b.transferWalletSelected}>
                <View style={[b.transferWalletDot, { backgroundColor: fromWalletColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={b.transferWalletName}>{fromWallet.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Image source={COIN} style={{ width: 12, height: 12 }} />
                    <Text style={b.transferWalletBalance}>{Math.round(fromWallet.balance ?? 0).toLocaleString()} available</Text>
                  </View>
                </View>
                <Text style={b.transferChevron}>›</Text>
              </View>
            ) : (
              <Text style={b.transferWalletPlaceholder}>Select account →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Arrow */}
        <View style={b.transferArrowRow}>
          <View style={b.transferArrowLine} />
          <View style={b.transferArrowCircle}>
            <Text style={b.transferArrowText}>↓</Text>
          </View>
          <View style={b.transferArrowLine} />
        </View>

        {/* TO */}
        <View style={b.transferSection}>
          <Text style={b.transferSectionLabel}>TO</Text>
          <TouchableOpacity style={b.transferWalletCard} onPress={() => setShowToPicker(true)} activeOpacity={0.85}>
            {toWallet ? (
              <View style={b.transferWalletSelected}>
                <View style={[b.transferWalletDot, { backgroundColor: toWalletColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={b.transferWalletName}>{toWallet.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Image source={COIN} style={{ width: 12, height: 12 }} />
                    <Text style={b.transferWalletBalance}>{Math.round(toWallet.balance ?? 0).toLocaleString()} balance</Text>
                  </View>
                </View>
                <Text style={b.transferChevron}>›</Text>
              </View>
            ) : (
              <Text style={b.transferWalletPlaceholder}>Select account →</Text>
            )}
          </TouchableOpacity>
        </View>

        {fromWallet && toWallet && (
          <View style={b.card}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginBottom: 4 }}>Transfer Amount</Text>
              <CoinAmount value={transferAmount} size={24} fontSize={28} fontFamily={Fonts.extraBold} />
            </View>
            <Slider
              minimumValue={0}
              maximumValue={maxTransfer}
              step={1}
              value={transferAmount}
              onValueChange={setTransferAmount}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.lightGray}
              thumbTintColor={Colors.primary}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted }}>Available:</Text>
              <CoinAmount value={maxTransfer} size={12} fontSize={12} fontFamily={Fonts.semiBold} color={Colors.textSecondary} />
            </View>
            {toRate > 0 && transferAmount > 0 && (
              <View style={{ marginTop: 12, backgroundColor: Colors.successLight, borderRadius: Radii.sm, padding: 10 }}>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.successDark }}>
                  Interest preview: ~{fmt(transferAmount * toRate)} /year at {(toRate * 100).toFixed(2)}% p.a.
                </Text>
              </View>
            )}
            {transferring && <AnimatedBar anim={transferBarAnim} />}
          </View>
        )}

        {fromWallet && toWallet && (
          <TouchableOpacity
            style={[b.ctaBtn, (transferring || transferAmount <= 0) && { opacity: 0.6 }]}
            onPress={handleTransfer}
            disabled={transferring || transferAmount <= 0}
          >
            {transferring ? <ActivityIndicator color={Colors.white} /> : <Text style={b.ctaBtnText}>Transfer</Text>}
          </TouchableOpacity>
        )}

        {/* FROM Picker Modal */}
        {showFromPicker && (
          <Modal transparent animationType="fade">
            <TouchableOpacity style={b.pickerBackdrop} activeOpacity={1} onPress={() => setShowFromPicker(false)}>
              <View style={b.pickerSheet} onStartShouldSetResponder={() => true}>
                <Text style={b.pickerTitle}>Transfer from</Text>
                {wallets.filter(w => w.id !== toWallet?.id).map(w => (
                  <TouchableOpacity key={w.id} style={b.pickerRow} onPress={() => { setFromWallet(w); setShowFromPicker(false); setTransferAmount(0); }} activeOpacity={0.85}>
                    <Text style={{ fontSize: 20 }}>{w.icon ?? '💰'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={b.pickerRowName}>{w.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Image source={COIN} style={{ width: 11, height: 11 }} />
                        <Text style={b.pickerRowBalance}>{Math.round(w.balance ?? 0).toLocaleString()}</Text>
                      </View>
                    </View>
                    {fromWallet?.id === w.id && <Text style={{ color: Colors.primary, fontSize: 18 }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* TO Picker Modal */}
        {showToPicker && (
          <Modal transparent animationType="fade">
            <TouchableOpacity style={b.pickerBackdrop} activeOpacity={1} onPress={() => setShowToPicker(false)}>
              <View style={b.pickerSheet} onStartShouldSetResponder={() => true}>
                <Text style={b.pickerTitle}>Transfer to</Text>
                {wallets.filter(w => w.id !== fromWallet?.id).map(w => (
                  <TouchableOpacity key={w.id} style={b.pickerRow} onPress={() => { setToWallet(w); setShowToPicker(false); }} activeOpacity={0.85}>
                    <Text style={{ fontSize: 20 }}>{w.icon ?? '💰'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={b.pickerRowName}>{w.label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Image source={COIN} style={{ width: 11, height: 11 }} />
                        <Text style={b.pickerRowBalance}>{Math.round(w.balance ?? 0).toLocaleString()}</Text>
                      </View>
                    </View>
                    {toWallet?.id === w.id && <Text style={{ color: Colors.primary, fontSize: 18 }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* AUTOMATED TRANSFERS */}
        <View style={b.autoTransferSection}>
          <View style={b.autoTransferHeader}>
            <Text style={b.sectionEyebrow}>AUTOMATED TRANSFERS</Text>
            <Text style={b.autoTransferSub}>Runs every month when you advance time</Text>
          </View>

          {(() => {
            const automations = [];
            const goalWallets = (sim?.wallets ?? []).filter(w => w.type === 'savings-goal' || w.type === 'emergency');
            for (const w of goalWallets) {
              automations.push({
                id: w.id, icon: w.type === 'emergency' ? '🛡️' : '🎯',
                label: w.label ?? 'Savings Goal', amount: w.monthlyContribution ?? 0,
                color: w.type === 'emergency' ? MODULE_COLORS['module-3'].color : MODULE_COLORS['module-2'].color,
                colorLight: w.type === 'emergency' ? MODULE_COLORS['module-3'].colorLight : MODULE_COLORS['module-2'].colorLight,
                type: 'goal', walletId: w.id,
              });
            }
            const investWallets = (sim?.wallets ?? []).filter(w => w.type === 'investment');
            for (const w of investWallets) {
              automations.push({
                id: w.id, icon: w.icon ?? '📈',
                label: w.label ?? 'Investment', amount: w.monthlyDCA ?? 0,
                color: MODULE_COLORS['module-4'].color, colorLight: MODULE_COLORS['module-4'].colorLight,
                type: 'investment', walletId: w.id,
              });
            }

            if (automations.length === 0) {
              return (
                <View style={b.autoEmptyState}>
                  <Text style={b.autoEmptyText}>No automation set up yet. Complete Quest 3.1 to create your first savings goal.</Text>
                </View>
              );
            }

            return (
              <View style={b.automationList}>
                {automations.map(auto => (
                  <View key={auto.id} style={b.automationRow}>
                    <View style={[b.automationRowIcon, { backgroundColor: auto.colorLight }]}>
                      <Text style={{ fontSize: 16 }}>{auto.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={b.automationRowLabel}>{auto.label}</Text>
                      <Text style={b.automationRowFrom}>From: Bank account</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      {auto.amount > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Image source={COIN} style={{ width: 11, height: 11 }} />
                          <Text style={[b.automationRowAmt, { color: auto.color }]}>{Math.round(auto.amount).toLocaleString()}/mo</Text>
                        </View>
                      ) : (
                        <Text style={b.automationRowNotSet}>Not set</Text>
                      )}
                      <TouchableOpacity
                        style={[b.automationRowEditBtn, { backgroundColor: auto.colorLight }]}
                        onPress={() => {
                          if (auto.type === 'investment') {
                            setEditingInvestAutoId(auto.walletId);
                            setInvestAutoAmount(String(auto.amount || ''));
                          } else {
                            setEditingAutoGoalId(auto.walletId);
                            setAutoAmount(String(auto.amount || ''));
                          }
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[b.automationRowEditText, { color: auto.color }]}>{auto.amount > 0 ? 'Edit' : 'Set up'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {automations.some(a => a.amount > 0) && (
                  <View style={b.automationTotal}>
                    <Text style={b.automationTotalLabel}>Total automated /month</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Image source={COIN} style={{ width: 13, height: 13 }} />
                      <Text style={b.automationTotalAmt}>{automations.reduce((s, a) => s + (a.amount ?? 0), 0).toLocaleString()}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}
        </View>

        {/* Fin suggestion */}
        {(() => {
          const goalWallets = (sim?.wallets ?? []).filter(w => w.type === 'savings-goal' || w.type === 'emergency');
          const investWallets = (sim?.wallets ?? []).filter(w => w.type === 'investment');
          const unautomatedGoals = goalWallets.filter(w => !(w.monthlyContribution > 0));
          const unautomatedInvest = investWallets.filter(w => !(w.monthlyDCA > 0));
          const total = unautomatedGoals.length + unautomatedInvest.length;

          if (total === 0 && (goalWallets.length + investWallets.length) > 0) {
            return (
              <View style={b.finSuggestionCard}>
                <View style={b.finSuggestionTop}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text><Text style={b.finSuggestionLabel}>FIN SAYS</Text></View>
                <Text style={b.finSuggestionText}>All your accounts are automated. Every month advance moves money exactly where it should go — no manual transfers needed. This is what a well-structured financial system looks like.</Text>
              </View>
            );
          }
          if (total === 0) return null;
          const parts = [];
          if (unautomatedGoals.length > 0) { const names = unautomatedGoals.map(w => w.label).join(', '); parts.push(`${names} ${unautomatedGoals.length === 1 ? 'has' : 'have'} no monthly contribution set`); }
          if (unautomatedInvest.length > 0) { const names = unautomatedInvest.map(w => w.label).join(', '); parts.push(`${names} ${unautomatedInvest.length === 1 ? 'has' : 'have'} no DCA set`); }
          return (
            <View style={b.finSuggestionCard}>
              <View style={b.finSuggestionTop}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text><Text style={b.finSuggestionLabel}>FIN SAYS</Text></View>
              <Text style={b.finSuggestionText}>{parts.join('. ')}. Automation means your money moves without you having to think about it — set it up and every month advance does the work for you.</Text>
            </View>
          );
        })()}

        {/* Recent activity */}
        {recentTransfers.length > 0 && (
          <View style={b.recentSection}>
            <Text style={b.sectionEyebrow}>RECENT ACTIVITY</Text>
            {recentTransfers.map(t => (
              <View key={t.id} style={b.recentRow}>
                <View style={b.recentIconCircle}>
                  <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={b.recentLabel}>{t.label}</Text>
                  <Text style={b.recentMeta}>
                    {t.from} → {t.to} · Month {t.month}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Image source={COIN} style={{ width: 11, height: 11 }} />
                  <Text style={[b.recentAmt, {
                    color: t.type === 'credit'
                      ? MODULE_COLORS['module-3'].color
                      : Colors.textPrimary,
                  }]}>
                    {t.type === 'credit' ? '+' : '-'}{Math.round(t.amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // TAB 3 — SALARY
  // ═════════════════════════════════════════════════════════════════════════════

  const jobTitle = sim?.jobTitle ?? 'Experience Architect';
  const company = sim?.company ?? 'Luminary';
  const income = sim?.income ?? 0;
  const incomeStartMonth = sim?.incomeStartMonth ?? 0;
  const currentMonth = sim?.currentMonth ?? 0;
  const monthsAtSalary = currentMonth - incomeStartMonth;
  const lastAttempt = sim?.lastPromotionAttempt ?? -999;
  const monthsSinceAttempt = currentMonth - lastAttempt;
  const isEligible = monthsAtSalary >= PROMOTION_ELIGIBLE_MONTHS;
  const isOnCooldown = monthsSinceAttempt < COOLDOWN_MONTHS;
  const canRequestPromotion = isEligible && !isOnCooldown;
  const promotionHistory = sim?.promotionHistory ?? [];

  const handlePromotion = async () => {
    setPromotionBusy(true);
    setPromotionResult(null);
    promotionAnim.setValue(0);

    Animated.timing(promotionAnim, {
      toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: false,
    }).start(async () => {
      const success = Math.random() < 0.6;
      const increasePercent = success ? Math.round(10 + Math.random() * 15) : 0;
      const newSalary = success ? Math.round(income * (1 + increasePercent / 100)) : income;

      try {
        const uid = auth.currentUser?.uid;
        await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), deepClean({
          lastPromotionAttempt: currentMonth,
          ...(success && {
            income: newSalary,
            incomeStartMonth: currentMonth,
            promotionHistory: [...promotionHistory, {
              month: currentMonth,
              oldSalary: income,
              newSalary,
              increasePercent,
            }],
          }),
        }));
        await onSimUpdate();
        setPromotionResult({ success, increasePercent, newSalary, oldSalary: income });
      } catch (e) {
        console.error('Promotion error:', e);
      } finally {
        setPromotionBusy(false);
      }
    });
  };

  const renderSalary = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={b.content} showsVerticalScrollIndicator={false}>
      {/* Current salary card */}
      <View style={b.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: MODULE_COLORS['module-1'].colorLight, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24 }}>💼</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary }}>{jobTitle}</Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>{company}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <View>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 2 }}>Monthly</Text>
            <CoinAmount value={income} size={14} fontSize={16} fontFamily={Fonts.bold} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 2 }}>Yearly</Text>
            <CoinAmount value={income * 12} size={14} fontSize={16} fontFamily={Fonts.bold} />
          </View>
        </View>
        <View style={{ backgroundColor: Colors.lightGray, borderRadius: Radii.sm, paddingHorizontal: 10, paddingVertical: 6, marginTop: 4 }}>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
            {monthsAtSalary} month{monthsAtSalary !== 1 ? 's' : ''} at current salary
          </Text>
        </View>
      </View>

      {/* Promotion section */}
      <Text style={b.sectionTitle}>Promotion</Text>

      {promotionResult ? (
        <View style={b.card}>
          {promotionResult.success ? (
            <>
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.successDark, marginBottom: 4 }}>Promotion Approved!</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 12 }}>
                  +{promotionResult.increasePercent}% raise
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <CoinAmount value={promotionResult.oldSalary} size={14} fontSize={14} color={Colors.textMuted} fontFamily={Fonts.regular} />
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted }}>→</Text>
                  <CoinAmount value={promotionResult.newSalary} size={18} fontSize={20} fontFamily={Fonts.extraBold} color={Colors.successDark} />
                </View>
              </View>
              <FinCard text="A promotion is more than a raise — it resets the compound curve on your earning power. Invest the difference and you accelerate twice." />
            </>
          ) : (
            <>
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ fontSize: 40, marginBottom: 8 }}>😔</Text>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 18, color: Colors.textPrimary, marginBottom: 4 }}>Not This Time</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>
                  Your manager noted your effort but there are no openings right now. Try again in {COOLDOWN_MONTHS} months.
                </Text>
              </View>
              <FinCard text="Rejection is redirection. Keep building skills and evidence of impact. The next window will open." />
            </>
          )}
          <TouchableOpacity style={[b.ctaBtn, { marginTop: 12 }]} onPress={() => setPromotionResult(null)}>
            <Text style={b.ctaBtnText}>OK</Text>
          </TouchableOpacity>
        </View>
      ) : promotionBusy ? (
        <View style={[b.card, { alignItems: 'center', paddingVertical: 24 }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textSecondary, marginTop: 12 }}>Scheduling performance review...</Text>
          <AnimatedBar anim={promotionAnim} color={MODULE_COLORS['module-1'].color} />
        </View>
      ) : !isEligible ? (
        <View style={b.card}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary, marginBottom: 8 }}>Not Eligible Yet</Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, marginBottom: 12 }}>
            You need {PROMOTION_ELIGIBLE_MONTHS} months at your current salary before requesting a promotion.
          </Text>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.lightGray, overflow: 'hidden' }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: MODULE_COLORS['module-1'].color, width: `${Math.min(100, (monthsAtSalary / PROMOTION_ELIGIBLE_MONTHS) * 100)}%` }} />
          </View>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 6 }}>
            {monthsAtSalary} / {PROMOTION_ELIGIBLE_MONTHS} months
          </Text>
        </View>
      ) : isOnCooldown ? (
        <View style={b.card}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 }}>Cooldown Period</Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary }}>
            You can request a promotion again in {COOLDOWN_MONTHS - monthsSinceAttempt} month{COOLDOWN_MONTHS - monthsSinceAttempt !== 1 ? 's' : ''}.
          </Text>
        </View>
      ) : (
        <View style={b.card}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.successDark, marginBottom: 4 }}>You are eligible for a promotion!</Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, marginBottom: 12 }}>
            60% chance of success. If approved, you will receive a 10-25% raise.
          </Text>
          <TouchableOpacity style={b.ctaBtn} onPress={handlePromotion}>
            <Text style={b.ctaBtnText}>Request Promotion</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Promotion history */}
      {promotionHistory.length > 0 && (
        <>
          <Text style={[b.sectionTitle, { marginTop: 20 }]}>Promotion History</Text>
          {promotionHistory.map((p, i) => (
            <View key={i} style={[b.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16 }}>📈</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary }}>+{p.increasePercent}% raise</Text>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted }}>Month {p.month}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <CoinAmount value={p.oldSalary} size={10} fontSize={11} color={Colors.textMuted} fontFamily={Fonts.regular} />
                <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted }}>→</Text>
                <CoinAmount value={p.newSalary} size={12} fontSize={13} fontFamily={Fonts.bold} color={Colors.successDark} />
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // TAB 4 — GOALS
  // ═════════════════════════════════════════════════════════════════════════════

  const goalWallets = wallets.filter(w => w.type === 'savings-goal' || w.type === 'emergency');

  const handleCreateGoal = async () => {
    try {
      const uid = auth.currentUser?.uid;
      await openSavingsGoalAccount(uid, deepClean({
        goalName: goalName || 'Savings Goal',
        targetAmount: goalTarget ?? 500,
        monthlyContribution: goalContribution ?? 50,
        targetDate: null,
      }));
      await onSimUpdate();
      setCreatingGoal(false);
      setGoalStep(1);
      setGoalName('');
      setGoalTarget(500);
      setGoalContribution(50);
    } catch (e) {
      console.error('Create goal error:', e);
    }
  };

  const handleCloseGoal = async (walletId) => {
    try {
      const uid = auth.currentUser?.uid;
      await closeSavingsGoalAccount(uid, walletId);
      await onSimUpdate();
      setClosingGoal(null);
    } catch (e) {
      console.error('Close goal error:', e);
    }
  };

  const handleUpdateGoalTarget = async (wallet, newTarget) => {
    try {
      const uid = auth.currentUser?.uid;
      const updatedWallets = wallets.map(w =>
        w.id === wallet.id ? { ...w, targetAmount: newTarget } : w
      );
      await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), deepClean({ wallets: updatedWallets, updatedAt: Date.now() }));
      await onSimUpdate();
      setEditingGoal(null);
      setEditField(null);
    } catch (e) {
      console.error('Update goal target error:', e);
    }
  };

  const handleUpdateGoalContribution = async (wallet, newContribution) => {
    try {
      const uid = auth.currentUser?.uid;
      const updatedWallets = wallets.map(w =>
        w.id === wallet.id ? { ...w, monthlyContribution: newContribution } : w
      );
      await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), deepClean({ wallets: updatedWallets, updatedAt: Date.now() }));
      await onSimUpdate();
      setEditingGoal(null);
      setEditField(null);
    } catch (e) {
      console.error('Update contribution error:', e);
    }
  };

  const renderGoalCreation = () => {
    if (goalStep === 1) {
      return (
        <View style={b.content}>
          <Text style={b.sectionTitle}>New Savings Goal</Text>
          <View style={b.card}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: 8 }}>Goal Name</Text>
            <TextInput
              style={{
                fontFamily: Fonts.regular, fontSize: 15, color: Colors.textPrimary,
                borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.sm,
                paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16,
              }}
              placeholder="e.g. Vacation fund, New laptop"
              placeholderTextColor={Colors.textMuted}
              value={goalName}
              onChangeText={setGoalName}
            />
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary, marginBottom: 8 }}>Target Amount</Text>
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <CoinAmount value={goalTarget} size={20} fontSize={22} fontFamily={Fonts.extraBold} />
            </View>
            <Slider
              minimumValue={100}
              maximumValue={10000}
              step={50}
              value={goalTarget}
              onValueChange={setGoalTarget}
              minimumTrackTintColor={MODULE_COLORS['module-3'].color}
              maximumTrackTintColor={Colors.lightGray}
              thumbTintColor={MODULE_COLORS['module-3'].color}
            />
          </View>
          <TouchableOpacity
            style={[b.ctaBtn, (!goalName.trim()) && { opacity: 0.5 }]}
            onPress={() => { if (goalName.trim()) setGoalStep(2); }}
            disabled={!goalName.trim()}
          >
            <Text style={b.ctaBtnText}>Next</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setCreatingGoal(false); setGoalStep(1); }} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textMuted }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Step 2: Monthly contribution
    return (
      <View style={b.content}>
        <Text style={b.sectionTitle}>Monthly Contribution</Text>
        <View style={b.card}>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, marginBottom: 12 }}>
            How much will you set aside each month for "{goalName}"?
          </Text>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <CoinAmount value={goalContribution} size={20} fontSize={22} fontFamily={Fonts.extraBold} />
          </View>
          <Slider
            minimumValue={10}
            maximumValue={Math.min(income || 500, goalTarget)}
            step={10}
            value={goalContribution}
            onValueChange={setGoalContribution}
            minimumTrackTintColor={MODULE_COLORS['module-3'].color}
            maximumTrackTintColor={Colors.lightGray}
            thumbTintColor={MODULE_COLORS['module-3'].color}
          />
          <View style={{ backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: 10, marginTop: 12 }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>
              Estimated time to goal: ~{goalContribution > 0 ? Math.ceil(goalTarget / goalContribution) : '∞'} months
            </Text>
          </View>
        </View>
        <TouchableOpacity style={b.ctaBtn} onPress={handleCreateGoal}>
          <Text style={b.ctaBtnText}>Create Goal</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setGoalStep(1)} style={{ marginTop: 12, alignItems: 'center' }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textMuted }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGoals = () => {
    if (creatingGoal) return <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>{renderGoalCreation()}</ScrollView>;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={b.content} showsVerticalScrollIndicator={false}>
        {goalWallets.length === 0 && (
          <View style={[b.card, { alignItems: 'center', paddingVertical: 20 }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 4 }}>No Goals Yet</Text>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' }}>
              Create a savings goal to start building towards something meaningful.
            </Text>
          </View>
        )}

        {goalWallets.map((w, idx) => {
          const cycle = WALLET_CYCLE[idx % WALLET_CYCLE.length];
          const wColor = w.color ?? cycle.color;
          const wColorLight = w.colorLight ?? cycle.colorLight;
          const wTarget = w.target ?? w.targetAmount ?? 0;
          const progress = wTarget > 0 ? Math.min(1, (w.balance ?? 0) / wTarget) : 0;
          const contribution = w.monthlyContribution ?? 0;
          const remaining = Math.max(0, wTarget - (w.balance ?? 0));
          const eta = contribution > 0 ? Math.ceil(remaining / contribution) : null;
          const isEditing = editingGoal === w.id;

          return (
            <View key={w.id} style={[b.card, { borderLeftWidth: 4, borderLeftColor: wColor }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: wColorLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{w.icon ?? '🎯'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary }}>{w.label}</Text>
                  {w.institution && (
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted }}>{w.institution}</Text>
                  )}
                </View>
                <CoinAmount value={w.balance ?? 0} size={14} fontSize={16} fontFamily={Fonts.extraBold} />
              </View>

              {/* Progress */}
              {wTarget > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: Colors.lightGray, overflow: 'hidden' }}>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: wColor, width: `${progress * 100}%` }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted }}>
                      {Math.round(progress * 100)}% of target
                    </Text>
                    <CoinAmount value={wTarget} size={10} fontSize={11} color={Colors.textMuted} fontFamily={Fonts.regular} />
                  </View>
                </View>
              )}

              {/* Automation section */}
              <View style={b.automationSection}>
                <Text style={b.automationTitle}>MONTHLY AUTOMATION</Text>

                <View style={b.automationOptions}>
                  {/* Manual option */}
                  <TouchableOpacity
                    style={[b.automationOption, (w.monthlyContribution ?? 0) === 0 && b.automationOptionActive]}
                    onPress={() => {
                      if ((w.monthlyContribution ?? 0) === 0) return;
                      setConfirmDisableAuto(w.id);
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={[b.automationRadio, (w.monthlyContribution ?? 0) === 0 && b.automationRadioActive]} />
                    <View>
                      <Text style={b.automationOptionLabel}>Manual</Text>
                      <Text style={b.automationOptionSub}>Transfer yourself each month</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Automated option */}
                  <TouchableOpacity
                    style={[b.automationOption, (w.monthlyContribution ?? 0) > 0 && b.automationOptionActive]}
                    onPress={() => setEditingAutoGoalId(w.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[b.automationRadio, (w.monthlyContribution ?? 0) > 0 && b.automationRadioActive]} />
                    <View style={{ flex: 1 }}>
                      <Text style={b.automationOptionLabel}>Automated</Text>
                      {(w.monthlyContribution ?? 0) > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Image source={COIN} style={{ width: 11, height: 11 }} />
                          <Text style={[b.automationOptionSub, { color: MODULE_COLORS['module-3'].color, fontFamily: Fonts.bold }]}>
                            {Math.round(w.monthlyContribution).toLocaleString()}/month
                          </Text>
                        </View>
                      ) : (
                        <Text style={b.automationOptionSub}>Set a monthly amount</Text>
                      )}
                    </View>
                    {(w.monthlyContribution ?? 0) > 0 && (
                      <TouchableOpacity
                        onPress={() => setEditingAutoGoalId(w.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={b.automationEditBtn}>Edit</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>

                {/* ETA if automated */}
                {(w.monthlyContribution ?? 0) > 0 && (w.target ?? 0) > 0 && (
                  (() => {
                    const autoRemaining = Math.max(0, (w.target ?? 0) - (w.balance ?? 0));
                    const autoMonths = autoRemaining > 0 ? Math.ceil(autoRemaining / w.monthlyContribution) : 0;
                    return (
                      <Text style={b.automationETA}>
                        {autoMonths === 0
                          ? '✓ Goal reached'
                          : `On track to reach goal in ${autoMonths} month${autoMonths !== 1 ? 's' : ''}`}
                      </Text>
                    );
                  })()
                )}
              </View>

              {/* Edit inline */}
              {isEditing && editField === 'target' && (
                <View style={{ backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: 12, marginBottom: 8 }}>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textPrimary, marginBottom: 8 }}>New Target</Text>
                  <View style={{ alignItems: 'center', marginBottom: 4 }}>
                    <CoinAmount value={editValue} size={16} fontSize={18} fontFamily={Fonts.bold} />
                  </View>
                  <Slider
                    minimumValue={100}
                    maximumValue={10000}
                    step={50}
                    value={editValue}
                    onValueChange={setEditValue}
                    minimumTrackTintColor={wColor}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={wColor}
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: wColor, borderRadius: Radii.sm, paddingVertical: 8, alignItems: 'center' }}
                      onPress={() => handleUpdateGoalTarget(w, editValue)}
                    >
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.white }}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: Colors.white, borderRadius: Radii.sm, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}
                      onPress={() => { setEditingGoal(null); setEditField(null); }}
                    >
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSecondary }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Close confirmation */}
              {closingGoal === w.id ? (
                <View style={{ backgroundColor: Colors.dangerLight, borderRadius: Radii.sm, padding: 12, marginBottom: 4 }}>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.danger, marginBottom: 8 }}>
                    Close this account? The balance will be transferred to your bank account.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: Colors.danger, borderRadius: Radii.sm, paddingVertical: 8, alignItems: 'center' }}
                      onPress={() => handleCloseGoal(w.id)}
                    >
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.white }}>Confirm Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: Colors.white, borderRadius: Radii.sm, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}
                      onPress={() => setClosingGoal(null)}
                    >
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSecondary }}>Keep Open</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Action buttons */
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: wColorLight, borderRadius: Radii.sm, paddingVertical: 8, alignItems: 'center' }}
                    onPress={() => { setEditingGoal(w.id); setEditField('target'); setEditValue(wTarget || 500); }}
                  >
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: wColor }}>Change Target</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: Colors.dangerLight, borderRadius: Radii.sm, paddingVertical: 8, alignItems: 'center' }}
                    onPress={() => setClosingGoal(w.id)}
                  >
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: Colors.danger }}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={b.ctaBtn} onPress={() => setCreatingGoal(true)}>
          <Text style={b.ctaBtnText}>Create New Goal</Text>
        </TouchableOpacity>

        {goalWallets.length > 0 && (
          <FinCard text="Goals give your money a job. When every FC has a destination, you spend less on things that do not matter." />
        )}
      </ScrollView>
    );
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onClose}>
      <View style={b.root}>
        <Header />
        <TabBar />
        {activeTab === 'Accounts' && renderAccounts()}
        {activeTab === 'Transfers' && renderTransfers()}
        {activeTab === 'Salary' && renderSalary()}
        {activeTab === 'Goals' && renderGoals()}
      </View>

      {/* Automation amount editor */}
      {editingAutoGoalId && (() => {
        const goalWallet = (sim?.wallets ?? []).find(w => w.id === editingAutoGoalId);
        const currentContrib = goalWallet?.monthlyContribution ?? 0;
        const maxAmt = Math.round((sim?.monthlyBudget?.savingsAmt ?? 0));

        return (
          <Modal transparent animationType="fade">
            <View style={b.autoModalBackdrop}>
              <View style={b.autoModalCard}>
                <Text style={b.autoModalTitle}>Monthly automation</Text>
                <Text style={b.autoModalSub}>{goalWallet?.label ?? 'Savings Goal'}</Text>

                <View style={b.autoModalInput}>
                  <Image source={COIN} style={{ width: 16, height: 16 }} />
                  <TextInput
                    style={b.autoModalInputText}
                    value={autoAmount || (currentContrib > 0 ? String(currentContrib) : '')}
                    onChangeText={setAutoAmount}
                    placeholder={currentContrib > 0 ? String(currentContrib) : 'e.g. 500'}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    autoFocus
                    maxLength={6}
                  />
                  <Text style={b.autoModalUnit}>/month</Text>
                </View>

                {maxAmt > 0 && (
                  <Text style={b.autoModalHint}>
                    Savings budget: {maxAmt.toLocaleString()} available
                  </Text>
                )}

                {/* Quick amounts */}
                <View style={b.autoQuickRow}>
                  {[
                    Math.round(maxAmt * 0.25),
                    Math.round(maxAmt * 0.5),
                    Math.round(maxAmt * 0.75),
                    maxAmt,
                  ].filter(v => v > 0).map(v => (
                    <TouchableOpacity
                      key={v}
                      style={b.autoQuickChip}
                      onPress={() => setAutoAmount(String(v))}
                      activeOpacity={0.85}
                    >
                      <Text style={b.autoQuickChipText}>{v.toLocaleString()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={b.autoModalBtns}>
                  <TouchableOpacity
                    style={b.autoModalCancel}
                    onPress={() => { setEditingAutoGoalId(null); setAutoAmount(''); }}
                    activeOpacity={0.85}
                  >
                    <Text style={b.autoModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={b.autoModalConfirm}
                    onPress={async () => {
                      const val = parseInt(autoAmount, 10);
                      if (!val || val <= 0) return;
                      const uid = auth.currentUser?.uid;
                      const updatedWallets = (sim?.wallets ?? []).map(w =>
                        w.id === editingAutoGoalId
                          ? { ...w, monthlyContribution: val }
                          : w
                      );
                      await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), {
                        wallets: updatedWallets,
                        updatedAt: Date.now(),
                      });
                      setEditingAutoGoalId(null);
                      setAutoAmount('');
                      onSimUpdate();
                    }}
                    activeOpacity={0.88}
                  >
                    <Text style={b.autoModalConfirmText}>Save {'\u2192'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* Disable automation confirmation */}
      {/* Investment DCA edit modal */}
      {editingInvestAutoId && (
        <Modal transparent animationType="fade">
          <View style={b.autoModalBackdrop}>
            <View style={b.autoModalCard}>
              <Text style={b.autoModalTitle}>Monthly DCA</Text>
              <Text style={b.autoModalSub}>{(sim?.wallets ?? []).find(w => w.id === editingInvestAutoId)?.label ?? 'Investment'}</Text>
              <View style={b.autoModalInput}>
                <Image source={COIN} style={{ width: 16, height: 16 }} />
                <TextInput
                  style={b.autoModalInputText}
                  value={investAutoAmount}
                  onChangeText={setInvestAutoAmount}
                  placeholder="e.g. 500"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  autoFocus
                  maxLength={6}
                />
                <Text style={b.autoModalUnit}>/month</Text>
              </View>
              <View style={b.autoModalBtns}>
                <TouchableOpacity
                  style={b.autoModalCancel}
                  onPress={() => { setEditingInvestAutoId(null); setInvestAutoAmount(''); }}
                  activeOpacity={0.85}
                >
                  <Text style={b.autoModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={b.autoModalConfirm}
                  onPress={async () => {
                    const val = parseInt(investAutoAmount, 10);
                    if (!val || val < 0) return;
                    const uid = auth.currentUser?.uid;
                    const updatedWallets = (sim?.wallets ?? []).map(w =>
                      w.id === editingInvestAutoId ? { ...w, monthlyDCA: val } : w
                    );
                    await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), {
                      wallets: updatedWallets, updatedAt: Date.now(),
                    });
                    setEditingInvestAutoId(null);
                    setInvestAutoAmount('');
                    onSimUpdate();
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={b.autoModalConfirmText}>Save {'\u2192'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {confirmDisableAuto && (
        <Modal transparent animationType="fade">
          <View style={b.autoModalBackdrop}>
            <View style={b.autoModalCard}>
              <Text style={b.autoModalTitle}>Turn off automation?</Text>
              <Text style={b.autoModalSub}>
                You'll need to transfer manually each month.
              </Text>
              <View style={b.autoModalBtns}>
                <TouchableOpacity
                  style={b.autoModalCancel}
                  onPress={() => setConfirmDisableAuto(null)}
                  activeOpacity={0.85}
                >
                  <Text style={b.autoModalCancelText}>Keep it</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[b.autoModalConfirm, { backgroundColor: '#FF4444' }]}
                  onPress={async () => {
                    const uid = auth.currentUser?.uid;
                    const updatedWallets = (sim?.wallets ?? []).map(w =>
                      w.id === confirmDisableAuto
                        ? { ...w, monthlyContribution: 0 }
                        : w
                    );
                    await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), {
                      wallets: updatedWallets,
                      updatedAt: Date.now(),
                    });
                    setConfirmDisableAuto(null);
                    onSimUpdate();
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={b.autoModalConfirmText}>Turn off</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════

const b = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: { padding: 4 },
  closeBtnText: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted },
  backBtn: { padding: 4 },
  backBtnText: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textMuted },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2,
    color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase',
  },
  ctaBtn: {
    backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  // Fin card
  finCard: {
    backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16,
    marginBottom: 16, ...Shadows.soft,
  },
  finCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  finCardAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: MODULE_COLORS['module-1'].colorLight,
    alignItems: 'center', justifyContent: 'center',
  },
  finCardLabel: {
    fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color,
    letterSpacing: 1.2, textTransform: 'uppercase',
    backgroundColor: MODULE_COLORS['module-1'].colorLight,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden',
  },
  finCardText: {
    fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22,
  },
  // Transfer styles
  transferSection: { marginBottom: 8 },
  transferSectionLabel: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 6, textTransform: 'uppercase' },
  transferWalletCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: Colors.border },
  transferWalletSelected: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transferWalletDot: { width: 12, height: 12, borderRadius: 6 },
  transferWalletName: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 2 },
  transferWalletBalance: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  transferWalletPlaceholder: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  transferChevron: { fontSize: 22, color: Colors.textMuted },
  transferArrowRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  transferArrowLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  transferArrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  transferArrowText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.primary },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  pickerTitle: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, marginBottom: 16 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerRowName: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  pickerRowBalance: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  // Account type card styles
  accountTypeCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  accountTypeLabel: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  accountTypeRate: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.primary },
  accountTypeDesc: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  accountTypeHeldBadge: { backgroundColor: Colors.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  accountTypeHeldText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted },
  // Automation
  automationSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  automationTitle: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.2, color: Colors.textMuted, marginBottom: 10 },
  automationOptions: { gap: 8 },
  automationOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  automationOptionActive: { borderColor: MODULE_COLORS['module-3'].color, backgroundColor: MODULE_COLORS['module-3'].colorLight },
  automationRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border },
  automationRadioActive: { borderColor: MODULE_COLORS['module-3'].color, backgroundColor: MODULE_COLORS['module-3'].color },
  automationOptionLabel: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  automationOptionSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  automationEditBtn: { fontFamily: Fonts.bold, fontSize: 12, color: MODULE_COLORS['module-3'].color },
  automationETA: { fontFamily: Fonts.regular, fontSize: 11, color: MODULE_COLORS['module-3'].color, marginTop: 8, fontStyle: 'italic' },
  autoModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  autoModalCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, width: '100%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  autoModalTitle: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, marginBottom: 4 },
  autoModalSub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginBottom: 20 },
  autoModalInput: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.background, borderRadius: 12, padding: 14, marginBottom: 8 },
  autoModalInputText: { flex: 1, fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textPrimary, paddingVertical: 0 },
  autoModalUnit: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  autoModalHint: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 12 },
  autoQuickRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  autoQuickChip: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  autoQuickChipText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.primary },
  autoModalBtns: { flexDirection: 'row', gap: 10 },
  autoModalCancel: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  autoModalCancelText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textSecondary },
  autoModalConfirm: { flex: 2, backgroundColor: MODULE_COLORS['module-3'].color, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  autoModalConfirmText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
  // Transfers tab — section eyebrow
  sectionEyebrow: {
    fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1.2,
    color: Colors.textMuted, marginBottom: 4,
  },
  // Automated transfers
  autoTransferSection: {
    marginTop: 24, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  autoTransferHeader: { marginBottom: 16 },
  autoTransferSub: {
    fontFamily: Fonts.regular, fontSize: 12,
    color: Colors.textMuted, marginTop: 3,
  },
  autoEmptyState: {
    backgroundColor: Colors.background, borderRadius: 12, padding: 14,
  },
  autoEmptyText: {
    fontFamily: Fonts.regular, fontSize: 13,
    color: Colors.textMuted, lineHeight: 20,
  },
  automationList: { gap: 0 },
  automationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  automationRowIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  automationRowLabel: {
    fontFamily: Fonts.bold, fontSize: 13,
    color: Colors.textPrimary, marginBottom: 2,
  },
  automationRowFrom: {
    fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted,
  },
  automationRowAmt: { fontFamily: Fonts.extraBold, fontSize: 14 },
  automationRowNotSet: {
    fontFamily: Fonts.regular, fontSize: 12,
    color: Colors.textMuted, fontStyle: 'italic',
  },
  automationRowEditBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  automationRowEditText: { fontFamily: Fonts.bold, fontSize: 12 },
  automationTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 12, marginTop: 4,
  },
  automationTotalLabel: {
    fontFamily: Fonts.bold, fontSize: 12, color: Colors.textSecondary,
  },
  automationTotalAmt: {
    fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary,
  },
  // Fin suggestion card
  finSuggestionCard: {
    backgroundColor: MODULE_COLORS['module-1'].colorLight,
    borderRadius: 14, padding: 14, marginTop: 20,
  },
  finSuggestionTop: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  finSuggestionLabel: {
    fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1.1,
    color: MODULE_COLORS['module-1'].color,
    backgroundColor: MODULE_COLORS['module-1'].colorLight,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden',
  },
  finSuggestionText: {
    fontFamily: Fonts.regular, fontSize: 13,
    color: Colors.textSecondary, lineHeight: 20,
  },
  // Recent activity
  recentSection: {
    marginTop: 24, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  recentIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  recentLabel: {
    fontFamily: Fonts.bold, fontSize: 13,
    color: Colors.textPrimary, marginBottom: 2,
  },
  recentMeta: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  recentAmt: { fontFamily: Fonts.bold, fontSize: 13 },
});
