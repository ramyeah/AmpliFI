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
  { id: 'basic', label: 'Basic Savings', icon: '🏦', rate: 0.0005, rateLabel: '0.05% p.a.', tagline: 'Simple and safe',
    color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight },
  { id: 'hysa', label: 'High-Yield Savings', icon: '📈', rate: 0.0465, rateLabel: 'Up to 4.65% p.a.', tagline: 'Earn 60× more',
    color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight },
];

const BANKS = {
  basic: [
    { id: 'drakon', name: 'Drakon Bank', icon: '🏛️', rate: 0.0005, rateLabel: '0.05% p.a.', bank: 'Drakon',
      colorLight: MODULE_COLORS['module-2'].colorLight, color: MODULE_COLORS['module-2'].color },
  ],
  hysa: [
    { id: 'orbit', name: 'Orbit Bank', icon: '🔵', rate: 0.0465, rateLabel: 'Up to 4.65% p.a.', bank: 'Orbit',
      colorLight: MODULE_COLORS['module-3'].colorLight, color: MODULE_COLORS['module-3'].color },
    { id: 'unison', name: 'Unison Bank', icon: '🟡', rate: 0.078, rateLabel: 'Up to 7.8% p.a.', bank: 'Unison',
      colorLight: MODULE_COLORS['module-4'].colorLight, color: MODULE_COLORS['module-4'].color },
  ],
};

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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function BankModal({ visible, onClose, sim, onSimUpdate }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Accounts');

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
  }, [activeTab]);

  // ─── Header ─────────────────────────────────────────────────────────────────

  const Header = () => (
    <View style={[b.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={onClose} style={b.closeBtn}>
        <Text style={{ fontSize: 18, color: Colors.textPrimary }}>←</Text>
      </TouchableOpacity>
      <Text style={{ fontFamily: Fonts.bold, fontSize: 17, color: Colors.textPrimary }}>Bank</Text>
      <TouchableOpacity onPress={onClose} style={b.closeBtn}>
        <Text style={{ fontSize: 16, color: Colors.textSecondary }}>✕</Text>
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
        await setBankAccount(uid, {
          id: selectedBank.id,
          name: selectedBank.name,
          bank: selectedBank.bank,
          accountType: selectedType,
          baseRate: selectedBank.rate,
          color: selectedBank.color,
          colorLight: selectedBank.colorLight,
          openingBalance: depositAmount,
        });
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
      const available = ACCOUNT_TYPES.filter(t => !existingAccountTypes.includes(t.id));
      return (
        <View style={b.content}>
          <Text style={b.sectionTitle}>Choose Account Type</Text>
          {available.length === 0 && (
            <View style={b.card}>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary }}>You already have all available account types.</Text>
            </View>
          )}
          {available.map(t => (
            <TouchableOpacity key={t.id} style={[b.card, { borderWidth: 2, borderColor: t.colorLight }]} onPress={() => setSelectedType(t.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colorLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{t.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary }}>{t.label}</Text>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary }}>{t.tagline}</Text>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: t.color, marginTop: 2 }}>{t.rateLabel}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setCreatingAccount(false)} style={{ marginTop: 8, alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textMuted }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Step 2: Pick bank
    if (!selectedBank) {
      const bankList = BANKS[selectedType] ?? [];
      return (
        <View style={b.content}>
          <Text style={b.sectionTitle}>Choose a Bank</Text>
          {bankList.map(bank => (
            <TouchableOpacity key={bank.id} style={[b.card, { borderWidth: 2, borderColor: bank.colorLight }]} onPress={() => { setSelectedBank(bank); setDepositAmount(Math.min(100, cashBalance)); }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bank.colorLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{bank.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary }}>{bank.name}</Text>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: bank.color }}>{bank.rateLabel}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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

              {isSavingsGoal && w.targetAmount > 0 && (
                <View style={{ marginTop: 4 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.lightGray, overflow: 'hidden' }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: wColor, width: `${Math.min(100, ((w.balance ?? 0) / w.targetAmount) * 100)}%` }} />
                  </View>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
                    {Math.round(((w.balance ?? 0) / w.targetAmount) * 100)}% of target
                  </Text>
                </View>
              )}

              {isEmergency && w.monthsCovered != null && (
                <View style={{ marginTop: 4 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.lightGray, overflow: 'hidden' }}>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: wColor, width: `${Math.min(100, (w.monthsCovered / 6) * 100)}%` }} />
                  </View>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
                    {w.monthsCovered} months covered
                  </Text>
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

  const WalletPicker = ({ label, selected, onSelect, exclude }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={b.sectionTitle}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        {wallets.filter(w => w.id !== exclude).map((w, idx) => {
          const isActive = selected?.id === w.id;
          const cycle = WALLET_CYCLE[idx % WALLET_CYCLE.length];
          const wColor = w.color ?? cycle.color;
          const wColorLight = w.colorLight ?? cycle.colorLight;
          return (
            <TouchableOpacity
              key={w.id}
              onPress={() => onSelect(w)}
              style={{
                backgroundColor: isActive ? wColor : wColorLight,
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radii.md,
                marginRight: 8, minWidth: 100, alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 2 }}>{w.icon ?? '💰'}</Text>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 11, color: isActive ? Colors.white : Colors.textPrimary }} numberOfLines={1}>{w.label}</Text>
              <CoinAmount value={w.balance ?? 0} size={10} fontSize={10} fontFamily={Fonts.semiBold} color={isActive ? Colors.white : Colors.textSecondary} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTransfers = () => {
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

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={b.content} showsVerticalScrollIndicator={false}>
        <WalletPicker label="From" selected={fromWallet} onSelect={(w) => { setFromWallet(w); setTransferAmount(0); }} exclude={toWallet?.id} />
        <WalletPicker label="To" selected={toWallet} onSelect={setToWallet} exclude={fromWallet?.id} />

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
            {transferring
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={b.ctaBtnText}>Transfer</Text>
            }
          </TouchableOpacity>
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
        await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), {
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
        });
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
      await openSavingsGoalAccount(uid, { goalName, targetAmount: goalTarget, monthlyContribution: goalContribution });
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
      await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), { wallets: updatedWallets, updatedAt: Date.now() });
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
      await firestoreUpdateDoc(firestoreDoc(db, 'simProgress', uid), { wallets: updatedWallets, updatedAt: Date.now() });
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
          const progress = w.targetAmount > 0 ? Math.min(1, (w.balance ?? 0) / w.targetAmount) : 0;
          const contribution = w.monthlyContribution ?? 0;
          const remaining = Math.max(0, (w.targetAmount ?? 0) - (w.balance ?? 0));
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
              {w.targetAmount > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: Colors.lightGray, overflow: 'hidden' }}>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: wColor, width: `${progress * 100}%` }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted }}>
                      {Math.round(progress * 100)}% of target
                    </Text>
                    <CoinAmount value={w.targetAmount} size={10} fontSize={11} color={Colors.textMuted} fontFamily={Fonts.regular} />
                  </View>
                </View>
              )}

              {/* Contribution + ETA */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                {contribution > 0 && (
                  <View style={{ flex: 1, backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: 8 }}>
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted }}>Monthly</Text>
                    <CoinAmount value={contribution} size={10} fontSize={12} fontFamily={Fonts.semiBold} />
                  </View>
                )}
                {eta != null && (
                  <View style={{ flex: 1, backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: 8 }}>
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted }}>ETA</Text>
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textPrimary }}>~{eta} months</Text>
                  </View>
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

              {isEditing && editField === 'contribution' && (
                <View style={{ backgroundColor: Colors.lightGray, borderRadius: Radii.sm, padding: 12, marginBottom: 8 }}>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textPrimary, marginBottom: 8 }}>Monthly Contribution</Text>
                  <View style={{ alignItems: 'center', marginBottom: 4 }}>
                    <CoinAmount value={editValue} size={16} fontSize={18} fontFamily={Fonts.bold} />
                  </View>
                  <Slider
                    minimumValue={0}
                    maximumValue={Math.min(income || 500, w.targetAmount ?? 1000)}
                    step={10}
                    value={editValue}
                    onValueChange={setEditValue}
                    minimumTrackTintColor={wColor}
                    maximumTrackTintColor={Colors.border}
                    thumbTintColor={wColor}
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      style={{ flex: 1, backgroundColor: wColor, borderRadius: Radii.sm, paddingVertical: 8, alignItems: 'center' }}
                      onPress={() => handleUpdateGoalContribution(w, editValue)}
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
                    onPress={() => { setEditingGoal(w.id); setEditField('target'); setEditValue(w.targetAmount ?? 500); }}
                  >
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: wColor }}>Change Target</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: wColorLight, borderRadius: Radii.sm, paddingVertical: 8, alignItems: 'center' }}
                    onPress={() => { setEditingGoal(w.id); setEditField('contribution'); setEditValue(w.monthlyContribution ?? 50); }}
                  >
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, color: wColor }}>Contribution</Text>
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
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center',
  },
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
});
