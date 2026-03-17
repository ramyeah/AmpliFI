// app/life-sim/stage4.js
//
// Stage 4 — Open a Bank Account
//
// Flow:
//   1. StageHeader + wallet balance context card (animated counter)
//   2. Fin RAG recommendation based on Stage 3 spending profile
//   3. Three bank comparison cards — DBS / OCBC / UOB (expandable)
//   4. Select a bank → transfer confirmation sheet → open account CTA
//   5. Transfer animation: wallet → bank account (progress bar)
//   6. Interest preview card: "You'll earn $X this year"
//   7. StageCompleteModal → outfit 'card' unlocked
//
// Saves: bankAccountId, bankChosen, openingBalance
// Gate:  lesson '4-1' — The Big Three Local Banks
// Outfit unlock: 'card'

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';
import { completeStage, loadSimProgress, saveSimProgress } from '../../lib/lifeSim';
import { STAGES, BANK_ACCOUNTS, formatDual, WALLET_TEMPLATES } from '../../constants/lifeSimStages';
import { getUnlockedOutfits, getNewOutfit } from '../../constants/avatars';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../../constants/theme';
import { auth } from '../../lib/firebase';
import { ragAsk } from '../../lib/api';
import { FinBubble, StageHeader, StageCompleteModal } from '../../components/LifeSimComponents';

const STAGE = STAGES.find(s => s.id === 'stage-2');

// ─── Animated balance counter ─────────────────────────────────────────────────
function AnimatedCounter({ from, to, duration = 1400, style }) {
  const anim = useRef(new Animated.Value(from)).current;
  const [display, setDisplay] = useState(from);
  useEffect(() => {
    Animated.timing(anim, { toValue: to, duration, useNativeDriver: false }).start();
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [to]);
  return <Text style={style}>${display.toLocaleString()}</Text>;
}

// ─── Feature tag ──────────────────────────────────────────────────────────────
function FeatureTag({ text, color }) {
  return (
    <View style={[ft.tag, { backgroundColor: color + '18' }]}>
      <Text style={[ft.text, { color }]}>{text}</Text>
    </View>
  );
}
const ft = StyleSheet.create({
  tag:  { borderRadius: Radii.full, paddingHorizontal: 9, paddingVertical: 3, marginRight: 6, marginBottom: 6 },
  text: { fontFamily: Fonts.semiBold, fontSize: 10 },
});

// ─── Bank comparison card ─────────────────────────────────────────────────────
function BankCard({ bank, selected, onSelect, recommended }) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selected === bank.id;
  const annualRate = (bank.baseRate * 100).toFixed(2);

  return (
    <TouchableOpacity
      style={[bc.card,
        isSelected ? { borderColor: bank.color, borderWidth: 2 }
                   : { borderColor: Colors.border, borderWidth: 1 }]}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      {recommended && (
        <View style={[bc.ribbon, { backgroundColor: bank.color }]}>
          <Text style={bc.ribbonText}>⭐ Fin recommends</Text>
        </View>
      )}

      <View style={bc.headerRow}>
        <View style={[bc.logoBadge, { backgroundColor: bank.colorLight }]}>
          <Text style={[bc.logoText, { color: bank.color }]}>{bank.bank}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={bc.bankName}>{bank.name}</Text>
          <View style={bc.rateRow}>
            <Text style={[bc.rate, { color: bank.color }]}>{annualRate}%</Text>
            <Text style={bc.rateLabel}> p.a. base</Text>
          </View>
        </View>
        {isSelected
          ? <View style={[bc.selectBadge, { backgroundColor: bank.color }]}>
              <Text style={bc.selectBadgeText}>✓</Text>
            </View>
          : <Text style={bc.chevron}>{expanded ? '▲' : '▼'}</Text>
        }
      </View>

      {bank.minBalance > 0 && (
        <View style={bc.minRow}>
          <Text style={bc.minText}>
            Min. balance ${bank.minBalance.toLocaleString()} · ${bank.fallBelowFee}/mo fee if below
          </Text>
        </View>
      )}

      {expanded && (
        <View style={bc.expandWrap}>
          <View style={bc.divider} />
          <Text style={bc.featuresTitle}>Key features</Text>
          <View style={bc.featureTags}>
            {bank.features.map((f, i) => <FeatureTag key={i} text={f} color={bank.color} />)}
          </View>
          {bank.bonusRate > 0 && (
            <View style={[bc.bonusRow, { backgroundColor: bank.colorLight }]}>
              <Text style={[bc.bonusText, { color: bank.color }]}>
                🚀  Up to {(bank.bonusRate * 100).toFixed(0)}% p.a. with bonus criteria
              </Text>
            </View>
          )}
          <Text style={bc.finNote}>{bank.finNote}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[bc.selectBtn, { backgroundColor: isSelected ? bank.color : bank.color + '18' }]}
        onPress={() => onSelect(bank.id)}
        activeOpacity={0.8}
      >
        <Text style={[bc.selectBtnText, { color: isSelected ? Colors.white : bank.color }]}>
          {isSelected ? '✓ Selected' : 'Select this bank'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const bc = StyleSheet.create({
  card:           { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  ribbon:         { alignSelf: 'flex-start', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  ribbonText:     { fontFamily: Fonts.bold, fontSize: 10, color: Colors.white },
  headerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoBadge:      { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  logoText:       { fontFamily: Fonts.extraBold, fontSize: 11 },
  bankName:       { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 2 },
  rateRow:        { flexDirection: 'row', alignItems: 'baseline' },
  rate:           { fontFamily: Fonts.extraBold, fontSize: 16 },
  rateLabel:      { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  chevron:        { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  selectBadge:    { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  selectBadgeText:{ fontFamily: Fonts.extraBold, fontSize: 12, color: Colors.white },
  minRow:         { backgroundColor: Colors.warningLight, borderRadius: Radii.sm, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8 },
  minText:        { fontFamily: Fonts.regular, fontSize: 11, color: Colors.warningDark },
  expandWrap:     { marginTop: 4 },
  divider:        { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  featuresTitle:  { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  featureTags:    { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  bonusRow:       { borderRadius: Radii.sm, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  bonusText:      { fontFamily: Fonts.bold, fontSize: 12 },
  finNote:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  selectBtn:      { borderRadius: Radii.md, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  selectBtnText:  { fontFamily: Fonts.bold, fontSize: 13 },
});

// ─── Transfer confirmation sheet ──────────────────────────────────────────────
function TransferSheet({ visible, bank, walletBalance, onDone }) {
  const slideY    = useRef(new Animated.Value(300)).current;
  const fillAnim  = useRef(new Animated.Value(0)).current;
  const [phase,   setPhase]   = useState('ready');
  const [earning, setEarning] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setPhase('ready');
    fillAnim.setValue(0);
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
  }, [visible]);

  const startTransfer = () => {
    setPhase('transferring');
    Animated.timing(fillAnim, { toValue: 1, duration: 1600, useNativeDriver: false }).start(() => {
      setEarning(walletBalance * (bank?.baseRate ?? 0.0005));
      setPhase('done');
    });
  };

  if (!bank) return null;
  const dual = formatDual(walletBalance);
  const fillWidth = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={ts.backdrop}>
        <Animated.View style={[ts.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={[ts.handle, { backgroundColor: bank.color }]} />

          {phase === 'ready' && <>
            <Text style={ts.title}>Open {bank.bank} Account</Text>
            <Text style={ts.subtitle}>Your wallet balance transfers into your new bank account.</Text>
            <View style={ts.transferRow}>
              <View style={ts.acctBox}>
                <Text style={ts.acctIcon}>💳</Text>
                <Text style={ts.acctLabel}>Cash Wallet</Text>
                <Text style={ts.acctAmt}>{dual.sgd}</Text>
              </View>
              <Text style={ts.arrow}>→</Text>
              <View style={[ts.acctBox, { borderColor: bank.color + '40', borderWidth: 1.5 }]}>
                <View style={[ts.bankBadge, { backgroundColor: bank.colorLight }]}>
                  <Text style={[ts.bankBadgeText, { color: bank.color }]}>{bank.bank}</Text>
                </View>
                <Text style={ts.acctLabel}>{bank.name}</Text>
                <Text style={[ts.acctAmt, { color: bank.color }]}>{dual.sgd}</Text>
              </View>
            </View>
            <View style={ts.rateInfo}>
              <Text style={ts.rateInfoText}>
                {(bank.baseRate * 100).toFixed(2)}% p.a. — your money starts earning from day one.
              </Text>
            </View>
            <TouchableOpacity
              style={[ts.confirmBtn, { backgroundColor: bank.color }]}
              onPress={startTransfer} activeOpacity={0.85}
            >
              <Text style={ts.confirmBtnText}>Open Account →</Text>
            </TouchableOpacity>
          </>}

          {phase === 'transferring' && <>
            <Text style={ts.title}>Transferring…</Text>
            <Text style={ts.subtitle}>Moving {dual.sgd} into your {bank.bank} account.</Text>
            <View style={ts.barTrack}>
              <Animated.View style={[ts.barFill, { width: fillWidth, backgroundColor: bank.color }]} />
            </View>
            <Text style={ts.transferNote}>Setting up account · Applying interest rate · Confirming deposit</Text>
          </>}

          {phase === 'done' && <>
            <Text style={[ts.title, { color: bank.color }]}>🎉 Account Opened!</Text>
            <Text style={ts.subtitle}>Your money has a proper home now.</Text>
            <View style={[ts.doneCard, { backgroundColor: bank.colorLight, borderColor: bank.color + '30' }]}>
              <Text style={[ts.doneBank, { color: bank.color }]}>{bank.bank} · {bank.name}</Text>
              <Text style={ts.doneBalance}>{dual.sgd}</Text>
              <Text style={ts.doneCoins}>{dual.coins}</Text>
              {earning !== null && (
                <Text style={[ts.doneEarn, { color: bank.color }]}>
                  At {(bank.baseRate * 100).toFixed(2)}% p.a. — you'll earn ~${earning.toFixed(2)} this year
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[ts.confirmBtn, { backgroundColor: bank.color }]}
              onPress={onDone} activeOpacity={0.85}
            >
              <Text style={ts.confirmBtnText}>Complete Stage 4 →</Text>
            </TouchableOpacity>
          </>}
        </Animated.View>
      </View>
    </Modal>
  );
}

const ts = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingTop: Spacing.md },
  handle:         { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  title:          { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textPrimary, marginBottom: 6 },
  subtitle:       { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  transferRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  acctBox:        { flex: 1, backgroundColor: Colors.lightGray, borderRadius: Radii.md, padding: Spacing.sm, alignItems: 'center', gap: 4 },
  acctIcon:       { fontSize: 22 },
  acctLabel:      { fontFamily: Fonts.semiBold, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  acctAmt:        { fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary },
  arrow:          { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textMuted },
  bankBadge:      { borderRadius: Radii.sm, paddingHorizontal: 8, paddingVertical: 3 },
  bankBadgeText:  { fontFamily: Fonts.extraBold, fontSize: 11 },
  rateInfo:       { backgroundColor: Colors.successLight, borderRadius: Radii.md, padding: Spacing.sm, marginBottom: Spacing.lg },
  rateInfoText:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.successDark, lineHeight: 18 },
  confirmBtn:     { borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center' },
  confirmBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  barTrack:       { height: 10, backgroundColor: Colors.lightGray, borderRadius: 5, overflow: 'hidden', marginBottom: Spacing.md },
  barFill:        { height: 10, borderRadius: 5 },
  transferNote:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  doneCard:       { borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg, gap: 4 },
  doneBank:       { fontFamily: Fonts.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  doneBalance:    { fontFamily: Fonts.extraBold, fontSize: 34, color: Colors.textPrimary },
  doneCoins:      { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  doneEarn:       { fontFamily: Fonts.semiBold, fontSize: 12, marginTop: 4, textAlign: 'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Stage4() {
  const router     = useRouter();
  const profile    = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);

  const uid       = auth.currentUser?.uid;
  const finCoins  = profile?.finCoins ?? 0;
  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  const [sim,          setSim]          = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [recommended,  setRecommended]  = useState(null);
  const [finMsg,       setFinMsg]       = useState(null);
  const [loadingFin,   setLoadingFin]   = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!uid) return;
    loadSimProgress(uid)
      .then(data => setSim(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [uid]);

  // Fire RAG once sim data is available (uid-keyed to avoid re-firing)
  const finFired = useRef(false);
  useEffect(() => {
    if (!sim || finFired.current) return;
    finFired.current = true;
    fireFinRecommendation(sim);
  }, [sim]);

  const walletBalance = (sim?.wallets ?? []).find(w => w.id === 'wallet')?.balance ?? 0;
  const selectedBank  = BANK_ACCOUNTS.find(b => b.id === selected);

  const fireFinRecommendation = async (simData) => {
    setLoadingFin(true);
    const budget = simData?.monthlyBudget;
    const cut    = simData?.stage3Cut;
    try {
      const result = await ragAsk(
        'Singapore bank account DBS OCBC UOB comparison student savings',
        `You are Fin, a financial advisor for NTU international students in Singapore.
The user just finished tracking their first month of spending and is now choosing their first Singapore bank account.

Their financial profile:
- Monthly income: $${simData?.income ?? 2000}
- Budget split: ${budget ? `${budget.needs}% Needs / ${budget.wants}% Wants / ${budget.savings}% Savings` : 'not set'}
- Stage 3 spending cut: ${cut ? `${cut.label} ($${cut.amount}/mo saved)` : 'not set'}
- Wallet balance to transfer: $${Math.round(walletBalance)}

The three choices are:
- DBS Savings Account: 0.05% p.a., $3,000 min balance, $2/mo fee if below, best mobile app in SG, pathway to DBS Multiplier (powerful once salary credit + card spend begins)
- OCBC 360 Account: 0.05% p.a., $1,000 min balance, $2/mo fee if below, up to 4% p.a. with salary credit + card spend + investments
- UOB One Account: 0.05% p.a., $1,000 min balance, $5/mo fee if below, up to 7.8% p.a. with $500/mo card spend + GIRO

Recommend exactly ONE bank by name and explain why it fits their profile in 2 sentences. Be direct — no hedging. End your response with the bank id in parentheses: exactly one of (dbs) (ocbc) (uob).`,
        { name: firstName }
      );
      const text = result?.response ?? '';
      setFinMsg(text);
      const match = text.match(/\((dbs|ocbc|uob)\)/);
      if (match) setRecommended(match[1]);
    } catch {
      setFinMsg(`For a student just starting out, DBS is my pick — the Multiplier account becomes powerful once you're receiving a regular salary, and the digibank app is rated the best in Singapore. Set it up now and it'll grow with you. (dbs)`);
      setRecommended('dbs');
    } finally {
      setLoadingFin(false);
    }
  };

  const handleOpenAccount = async () => {
    if (!selectedBank || saving) return;
    setSaving(true);
    try {
      const freshSim  = await loadSimProgress(uid);
      const walletBal = (freshSim?.wallets ?? []).find(w => w.id === 'wallet')?.balance ?? walletBalance;

      const bankWallet = {
        ...WALLET_TEMPLATES.bank,
        id:              selectedBank.id,
        label:           selectedBank.name,
        icon:            '🏦',
        balance:         walletBal,
        interestRate:    selectedBank.baseRate,
        color:           selectedBank.color,
        colorLight:      selectedBank.colorLight,
        institution:     selectedBank.bank,
        linkedTo:        null,
        unlockedAtStage: 'stage-4',
      };

      // Zero out cash wallet, append bank wallet
      const updatedWallets = [
        ...(freshSim?.wallets ?? []).map(w =>
          w.id === 'wallet' ? { ...w, balance: 0 } : w
        ),
        bankWallet,
      ];

      await completeStage(uid, 'stage-2', {
        bankChosen:     selectedBank.bank,
        openingBalance: walletBal,
        bankAccountId:  selectedBank.id,
      }, updatedWallets);

      // Persist bankAccountId at doc root so simulate.js buildSummary finds it
      await saveSimProgress(uid, {
        ...freshSim,
        bankAccountId: selectedBank.id,
        wallets:       updatedWallets,
      });

      setProfile({ ...profile, finCoins: finCoins + 50 });
    } catch (e) {
      console.error('Stage4 handleOpenAccount:', e);
    } finally {
      setSaving(false);
    }
  };

  const completedStages = sim?.completedStages ?? [];
  const unlockedOutfits = getUnlockedOutfits([...completedStages, 'stage-4']).map(o => o.id);
  const newOutfit       = getNewOutfit('stage-4');

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <Text style={s.loadingText}>Loading your sim…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <StageHeader stage={STAGE} />

        {/* ── Wallet balance context ── */}
        <View style={[s.contextCard, { borderColor: STAGE.color + '35' }]}>
          <Text style={[s.contextLabel, { color: STAGE.color }]}>💳  Your cash wallet</Text>
          <AnimatedCounter
            from={0}
            to={walletBalance}
            style={[s.walletAmt, { color: STAGE.color }]}
          />
          <Text style={s.contextBody}>
            This transfers into your bank account when you open one. Even at a 0.05% base rate, your money earns interest from day one — and the account unlocks higher rates later.
          </Text>
        </View>

        {/* ── Fin recommendation ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>🦉 Fin's recommendation</Text>
          <FinBubble
            text={finMsg ? finMsg.replace(/\s*\((dbs|ocbc|uob)\)\s*$/, '').trim() : ''}
            loading={loadingFin}
          />
        </View>

        {/* ── Bank comparison ── */}
        <Text style={s.sectionLabel}>Compare the three major banks</Text>
        <Text style={s.sectionHint}>Tap a card to expand · Select one to open your account</Text>

        {BANK_ACCOUNTS.map(bank => (
          <BankCard
            key={bank.id}
            bank={bank}
            selected={selected}
            onSelect={id => setSelected(id)}
            recommended={recommended === bank.id}
          />
        ))}

        {/* ── CTA ── */}
        {selected ? (
          <TouchableOpacity
            style={[s.openBtn, { backgroundColor: selectedBank.color }]}
            onPress={() => setShowTransfer(true)}
            activeOpacity={0.85}
          >
            <Text style={s.openBtnText}>Open {selectedBank.bank} Account →</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.selectHint}>
            <Text style={s.selectHintText}>👆  Select a bank above to continue</Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <TransferSheet
        visible={showTransfer}
        bank={selectedBank}
        walletBalance={walletBalance}
        onDone={async () => {
          setShowTransfer(false);
          await handleOpenAccount();
          setShowComplete(true);
        }}
      />

      <StageCompleteModal
        visible={showComplete}
        stageTitle={STAGE.title}
        outfitItem={newOutfit}
        avatarId={profile?.avatarId ?? 'alex'}
        unlockedOutfits={unlockedOutfits}
        onContinue={() => {
          setShowComplete(false);
          router.replace('/(tabs)/simulate');
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  loadingWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:    { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  scroll:         { flex: 1 },
  content:        { padding: Spacing.lg, paddingTop: Spacing.md },
  contextCard:    { borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.lg, backgroundColor: Colors.white, ...Shadows.soft },
  contextLabel:   { fontFamily: Fonts.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  walletAmt:      { fontFamily: Fonts.extraBold, fontSize: 38, marginBottom: 8 },
  contextBody:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  section:        { marginBottom: Spacing.md },
  sectionLabel:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  sectionHint:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.md },
  openBtn:        { borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center', marginBottom: Spacing.md },
  openBtnText:    { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
  selectHint:     { borderRadius: Radii.md, backgroundColor: Colors.lightGray, paddingVertical: 14, alignItems: 'center', marginBottom: Spacing.md },
  selectHintText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
});