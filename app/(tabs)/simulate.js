// app/(tabs)/simulate.js
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Modal, Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import useUserStore from '../../store/userStore';
import { loadSimProgress } from '../../lib/lifeSim';
import {
  STAGES, STAGE_GATES, getStageStatus,
  canAdvanceMonth, formatCountdown, formatDual,
  getIncomeBracket,
} from '../../constants/lifeSimStages';
import { AvatarDisplay, getAvatarState, getUnlockedOutfits } from '../../constants/avatars';
import { ADVISOR } from '../../constants/simulation';
import { Colors, Fonts, Spacing, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';
import { auth } from '../../lib/firebase';

const { width: SW } = Dimensions.get('window');

// ─── Wallet chip rail ─────────────────────────────────────────────────────────

function WalletRail({ wallets, onTapWallet }) {
  if (!wallets?.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={wr.rail}
    >
      {wallets.map(wallet => {
        const dual      = formatDual(wallet.balance ?? 0);
        const hasTarget = wallet.target != null && wallet.target > 0;
        const pct       = hasTarget ? Math.min((wallet.balance ?? 0) / wallet.target, 1) : null;
        return (
          <TouchableOpacity
            key={wallet.id}
            style={[wr.chip, { borderColor: (wallet.color ?? Colors.border) + '50' }]}
            onPress={() => onTapWallet(wallet)}
            activeOpacity={0.7}
          >
            <View style={[wr.iconDot, { backgroundColor: (wallet.color ?? Colors.textMuted) + '18' }]}>
              <Text style={wr.chipIcon}>{wallet.icon}</Text>
            </View>
            <View>
              <Text style={[wr.chipLabel, { color: wallet.color ?? Colors.textMuted }]} numberOfLines={1}>
                {wallet.label}
              </Text>
              <Text style={wr.chipSgd}>{dual.sgd}</Text>
              <Text style={wr.chipCoins}>{dual.coins}</Text>
            </View>
            {pct !== null && (
              <View style={wr.progressTrack}>
                <View style={[wr.progressFill, {
                  width: `${Math.round(pct * 100)}%`,
                  backgroundColor: wallet.color ?? Colors.primary,
                }]} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const wr = StyleSheet.create({
  rail:          { paddingHorizontal: Spacing.lg, paddingVertical: 10, gap: 10 },
  chip:          { backgroundColor: Colors.white, borderRadius: Radii.md, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, minWidth: 108, maxWidth: 128, ...Shadows.soft },
  iconDot:       { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  chipIcon:      { fontSize: 14 },
  chipLabel:     { fontFamily: Fonts.bold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 },
  chipSgd:       { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary },
  chipCoins:     { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  progressTrack: { height: 3, backgroundColor: Colors.lightGray, borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  progressFill:  { height: 3, borderRadius: 2 },
});

// ─── Wallet detail sheet ──────────────────────────────────────────────────────

function WalletSheet({ wallet, visible, onClose, sim }) {
  if (!wallet) return null;
  const dual        = formatDual(wallet.balance ?? 0);
  const hasTarget   = wallet.target != null && wallet.target > 0;
  const pct         = hasTarget ? Math.min((wallet.balance ?? 0) / wallet.target, 1) : null;
  const annualEarns = wallet.interestRate > 0
    ? `$${((wallet.balance ?? 0) * wallet.interestRate).toFixed(2)}/year` : null;
  const history = (sim?.history ?? [])
    .filter(h => h.walletSnapshots?.[wallet.id] != null)
    .slice(-5).reverse();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={ws.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={ws.sheet}>
          <View style={[ws.handle, { backgroundColor: wallet.color ?? Colors.primary }]} />
          <View style={ws.headerRow}>
            <View style={[ws.iconCircle, { backgroundColor: (wallet.color ?? Colors.primary) + '18' }]}>
              <Text style={{ fontSize: 26 }}>{wallet.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ws.title, { color: wallet.color ?? Colors.textPrimary }]}>{wallet.label}</Text>
              {wallet.institution && <Text style={ws.institution}>{wallet.institution}</Text>}
            </View>
          </View>
          <Text style={ws.balance}>{dual.sgd}</Text>
          <Text style={ws.balanceCoins}>{dual.coins}</Text>
          {hasTarget && pct !== null && (
            <>
              <View style={ws.targetRow}>
                <Text style={ws.targetLabel}>Target: {formatDual(wallet.target).sgd}</Text>
                <Text style={[ws.targetPct, { color: wallet.color ?? Colors.primary }]}>{Math.round(pct * 100)}%</Text>
              </View>
              <View style={ws.barTrack}>
                <View style={[ws.barFill, { width: `${pct * 100}%`, backgroundColor: wallet.color ?? Colors.primary }]} />
              </View>
            </>
          )}
          {wallet.interestRate > 0 && (
            <View style={ws.rateRow}>
              <Text style={ws.rateLabel}>Interest rate</Text>
              <Text style={ws.rateValue}>{(wallet.interestRate * 100).toFixed(2)}% p.a.{annualEarns ? ` · ~${annualEarns}` : ''}</Text>
            </View>
          )}
          {wallet.linkedTo && (
            <View style={ws.linkedRow}>
              <Text style={ws.linkedLabel}>↳ Ring-fenced inside</Text>
              <Text style={[ws.linkedValue, { color: wallet.color ?? Colors.primary }]}>
                {(sim?.wallets ?? []).find(w => w.id === wallet.linkedTo)?.label ?? wallet.linkedTo}
              </Text>
            </View>
          )}
          {history.length > 0 && (
            <>
              <Text style={ws.historyTitle}>Balance history</Text>
              {history.map((h, i) => (
                <View key={i} style={ws.historyRow}>
                  <Text style={ws.historyMonth}>Month {h.month}</Text>
                  <Text style={ws.historyVal}>{formatDual(h.walletSnapshots[wallet.id]).sgd}</Text>
                </View>
              ))}
            </>
          )}
          <TouchableOpacity style={[ws.closeBtn, { backgroundColor: wallet.color ?? Colors.primary }]} onPress={onClose}>
            <Text style={ws.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const ws = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.xl, paddingTop: Spacing.md },
  handle:       { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  headerRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  iconCircle:   { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  title:        { fontFamily: Fonts.extraBold, fontSize: 20 },
  institution:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  balance:      { fontFamily: Fonts.extraBold, fontSize: 34, color: Colors.textPrimary, marginBottom: 2 },
  balanceCoins: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.md },
  targetRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  targetLabel:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  targetPct:    { fontFamily: Fonts.bold, fontSize: 13 },
  barTrack:     { height: 8, backgroundColor: Colors.lightGray, borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.md },
  barFill:      { height: 8, borderRadius: 4 },
  rateRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: Colors.border },
  rateLabel:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  rateValue:    { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  linkedRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4 },
  linkedLabel:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  linkedValue:  { fontFamily: Fonts.bold, fontSize: 12 },
  historyTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 8, marginTop: Spacing.md },
  historyRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  historyMonth: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  historyVal:   { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  closeBtn:     { borderRadius: Radii.lg, padding: 14, alignItems: 'center', marginTop: Spacing.xl },
  closeBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});

// ─── Stage card ───────────────────────────────────────────────────────────────

function StageCard({ stage, status, sim, onPress }) {
  const isComplete = status === 'complete';
  const isActive   = status === 'active';
  const isLocked   = status === 'locked';
  const gate       = STAGE_GATES[stage.id];
  const summary    = buildSummary(stage, sim);

  return (
    <TouchableOpacity
      style={sc.row}
      onPress={onPress}
      activeOpacity={isLocked ? 0.5 : 0.8}
    >
      {/* Left — step indicator + connector */}
      <View style={sc.leftCol}>
        <View style={[
          sc.stepCircle,
          isComplete && { backgroundColor: stage.color },
          isActive   && { backgroundColor: 'transparent', borderWidth: 2.5, borderColor: stage.color },
          isLocked   && { backgroundColor: Colors.lightGray },
        ]}>
          {isComplete
            ? <Text style={sc.checkmark}>✓</Text>
            : <Text style={[sc.stepNum, isActive && { color: stage.color }, isLocked && { color: Colors.textMuted }]}>
                {stage.number}
              </Text>
          }
        </View>
        {stage.number < 5 && (
          <View style={[sc.connector, isComplete && { backgroundColor: stage.color + '50' }]} />
        )}
      </View>

      {/* Right — card content */}
      <View style={[
        sc.card,
        isActive   && { borderColor: stage.color, borderWidth: 1.5 },
        isComplete && { borderColor: stage.color + '40', borderWidth: 1 },
        isLocked   && { opacity: 0.55 },
      ]}>
        {/* Header row */}
        <View style={sc.cardHeader}>
          <Text style={[sc.cardIcon, isLocked && { opacity: 0.4 }]}>{stage.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[sc.cardTitle, isLocked && { color: Colors.textMuted }]}>{stage.title}</Text>
            <Text style={sc.cardSubtitle}>{stage.subtitle}</Text>
          </View>
          {isActive && (
            <View style={[sc.goBtn, { backgroundColor: stage.color }]}>
              <Text style={sc.goBtnText}>Go →</Text>
            </View>
          )}
          {isLocked && <Text style={sc.lockIcon}>🔒</Text>}
        </View>

        {/* Description */}
        {!isComplete && (
          <Text style={[sc.description, isLocked && { color: Colors.textMuted }]}>
            {stage.description}
          </Text>
        )}

        {/* Completed summary */}
        {isComplete && summary && (
          <View style={[sc.summaryBox, { backgroundColor: stage.color + '10' }]}>
            <Text style={[sc.summaryText, { color: stage.color }]}>{summary}</Text>
            <Text style={[sc.reviewLink, { color: stage.color }]}>Review →</Text>
          </View>
        )}

        {/* Footer */}
        <View style={sc.cardFooter}>
          <View style={[sc.conceptTag, { backgroundColor: isLocked ? Colors.lightGray : stage.color + '12' }]}>
            <Text style={[sc.conceptText, { color: isLocked ? Colors.textMuted : stage.color }]}>
              {stage.conceptTag}
            </Text>
          </View>
          {isLocked && gate && (
            <Text style={sc.lockHint} numberOfLines={1}>Finish "{gate.lessonTitle}"</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function buildSummary(stage, sim) {
  if (!sim) return null;
  switch (stage.id) {
    case 'stage-1': return sim.ffn ? `FFN ${formatDual(sim.ffn).sgd} · Retire at ${sim.ffnAge}` : null;
    case 'stage-2': {
      const b = sim.monthlyBudget;
      return b ? `${b.needs}% Needs · ${b.wants}% Wants · ${b.savings}% Savings` : null;
    }
    case 'stage-3': return sim.stage3Cut ? `Cut ${sim.stage3Cut.label} · saved ${formatDual(sim.stage3Cut.amount).sgd}/mo` : null;
    case 'stage-4': {
      if (!sim.bankAccountId) return null;
      const w = (sim.wallets ?? []).find(w => w.id === sim.bankAccountId);
      return `${w?.institution ?? 'Bank'} · ${formatDual(w?.balance ?? 0).sgd}`;
    }
    case 'stage-5': {
      const fund = (sim.wallets ?? []).find(w => w.id === 'emergency-fund');
      if (!fund) return null;
      const pct = fund.target > 0 ? Math.round((fund.balance / fund.target) * 100) : 0;
      return `${formatDual(fund.balance).sgd} saved · ${pct}% of target`;
    }
    default: return null;
  }
}

const sc = StyleSheet.create({
  row:         { flexDirection: 'row', marginBottom: 4 },
  leftCol:     { width: 44, alignItems: 'center', paddingTop: 4 },
  stepCircle:  { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  checkmark:   { fontFamily: Fonts.extraBold, fontSize: 13, color: Colors.white },
  stepNum:     { fontFamily: Fonts.extraBold, fontSize: 13, color: Colors.textPrimary },
  connector:   { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 3, minHeight: 16 },
  card:        { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.soft },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  cardIcon:    { fontSize: 22, marginTop: 1 },
  cardTitle:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 1 },
  cardSubtitle:{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  goBtn:       { borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 5 },
  goBtnText:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.white },
  lockIcon:    { fontSize: 14, marginTop: 2 },
  description: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  summaryBox:  { borderRadius: Radii.sm, padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryText: { fontFamily: Fonts.semiBold, fontSize: 11, flex: 1 },
  reviewLink:  { fontFamily: Fonts.bold, fontSize: 11 },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  conceptTag:  { borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  conceptText: { fontFamily: Fonts.bold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.3 },
  lockHint:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, fontStyle: 'italic', flex: 1 },
});

// ─── Future module cards ──────────────────────────────────────────────────────

const FUTURE_MODULES = [
  {
    id: 'mod2', title: 'Module 2 — Banking & Saving', icon: '🏦',
    color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight,
    stages: ['High-Yield Savings Account', 'Singapore Savings Bond', 'Fixed Deposits', 'T-Bills'],
    hint: 'Complete Module 2 lessons to unlock',
  },
  {
    id: 'mod3', title: 'Module 3 — Investing', icon: '📈',
    color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight,
    stages: ['CDP & Brokerage Account', 'STI ETF & SG Stocks', 'Robo-Advisors', 'Dollar-Cost Averaging', 'CPFIS'],
    hint: 'Complete Module 3 lessons to unlock',
  },
];

function FutureModuleCard({ mod }) {
  return (
    <View style={[fm.card, { borderColor: mod.color + '25' }]}>
      <View style={fm.header}>
        <View style={[fm.iconWrap, { backgroundColor: mod.colorLight }]}>
          <Text style={{ fontSize: 20 }}>{mod.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[fm.title, { color: mod.color }]}>{mod.title}</Text>
          <Text style={fm.hint}>{mod.hint}</Text>
        </View>
        <Text style={{ opacity: 0.35, fontSize: 14 }}>🔒</Text>
      </View>
      <View style={fm.pills}>
        {mod.stages.map((stage, i) => (
          <View key={i} style={[fm.pill, { backgroundColor: mod.color + '10' }]}>
            <Text style={[fm.pillText, { color: mod.color }]}>{stage}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const fm = StyleSheet.create({
  card:    { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, opacity: 0.65, ...Shadows.soft },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconWrap:{ width: 38, height: 38, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  title:   { fontFamily: Fonts.bold, fontSize: 13, marginBottom: 2 },
  hint:    { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  pills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill:    { borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:{ fontFamily: Fonts.semiBold, fontSize: 10 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SimulateScreen() {
  const router     = useRouter();
  const profile    = useUserStore(s => s.profile);

  const [sim,         setSim]         = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [walletSheet, setWalletSheet] = useState(null);

  const uid              = auth.currentUser?.uid;
  const finCoins         = profile?.finCoins        ?? 0;
  const completedLessons = profile?.completedLessons ?? [];
  const avatarId         = profile?.avatarId         ?? 'alex';
  const displayName      = profile?.name?.split(' ')[0] ?? 'there';
  const bracket          = getIncomeBracket(finCoins);

  const loadSim = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await loadSimProgress(uid);
      setSim(data);
    } catch (e) {
      console.error('loadSim error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => { loadSim(); }, [loadSim]);
  useFocusEffect(useCallback(() => { loadSim(); }, [loadSim]));

  const onRefresh = () => { setRefreshing(true); loadSim(); };

  const handleStagePress = (stage, status) => {
    if (status === 'locked') {
      const gate = STAGE_GATES[stage.id];
      if (gate?.lessonId) router.push({ pathname: '/lesson/[id]', params: { id: gate.lessonId } });
      return;
    }
    const routeName = stage.id.replace('-', '');
    router.push(`/life-sim/${routeName}`);
  };

  const completedStages = sim?.completedStages ?? [];
  const unlockedOutfits = getUnlockedOutfits(completedStages).map(o => o.id);
  const avatarState     = getAvatarState({ screen: 'stagemap' });

  const { canAdvance, msRemaining } = canAdvanceMonth(sim?.nextMonthAvailableAt);
  const countdown = formatCountdown(msRemaining);

  const finMessage = () => {
    if (!sim) return `Welcome, ${displayName}. Let's build your financial life.`;
    const active = STAGES.find(s => getStageStatus(s.id, completedLessons, completedStages) === 'active');
    if (!active) return `Module 1 complete, ${displayName}. Complete Module 2 lessons to continue.`;
    if (completedStages.length === 0) return `Every decision you make carries forward — just like real life. Start with Stage 1.`;
    return `Stage ${active.number} is ready: ${active.title}. ${active.description}`;
  };

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={s.loadingText}>Loading your financial life…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* ── Hero ── */}
        <View style={s.hero}>
          <View style={s.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroEyebrow}>🎮  Life Simulation</Text>
              <Text style={s.heroTitle}>Your Financial Life</Text>
            </View>
            <View style={s.coinChip}>
              <Text style={s.coinText}>{finCoins} 🪙</Text>
            </View>
          </View>
          <Text style={s.heroBody}>
            A persistent world where every financial decision carries forward. Set goals, budget your income, build your emergency fund — and watch your money grow across months.
          </Text>
          <View style={s.incomePill}>
            <Text style={s.incomePillText}>
              {bracket.emoji}  {bracket.label} · {formatDual(bracket.income).combined}/month
            </Text>
          </View>
        </View>

        {/* ── Wallet rail ── */}
        {sim?.wallets?.length > 0 && (
          <View style={s.walletSection}>
            <Text style={s.walletSectionLabel}>Your Accounts</Text>
            <WalletRail wallets={sim.wallets} onTapWallet={w => setWalletSheet(w)} />
          </View>
        )}

        {/* ── Content area ── */}
        <View style={s.body}>

          {/* Fin dialogue */}
          <View style={s.finRow}>
            <AvatarDisplay
              avatarId={avatarId}
              state={avatarState}
              size={52}
              unlockedOutfits={unlockedOutfits}
            />
            <View style={s.finBubble}>
              <Text style={s.finName}>🦉 {ADVISOR.name}</Text>
              <Text style={s.finText}>{finMessage()}</Text>
            </View>
          </View>

          {/* Time gate */}
          {!canAdvance && countdown && (
            <View style={s.gateBar}>
              <Text style={s.gateText}>⏱  Next month available in {countdown}</Text>
            </View>
          )}

          {/* Stage map */}
          <Text style={s.sectionLabel}>Module 1 — Money Foundations</Text>
          <View>
            {STAGES.map(stage => {
              const status = getStageStatus(stage.id, completedLessons, completedStages);
              return (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  status={status}
                  sim={sim}
                  onPress={() => handleStagePress(stage, status)}
                />
              );
            })}
          </View>

          {/* Coming next */}
          <Text style={[s.sectionLabel, { marginTop: Spacing.lg }]}>Coming Next</Text>
          {FUTURE_MODULES.map(mod => <FutureModuleCard key={mod.id} mod={mod} />)}

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <WalletSheet
        wallet={walletSheet}
        visible={!!walletSheet}
        onClose={() => setWalletSheet(null)}
        sim={sim}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.background },
  loadingWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: Colors.background },
  loadingText:        { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  scroll:             { flex: 1 },
  content:            { paddingBottom: 60 },

  // Hero — coral header with intro copy
  hero:               { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingTop: 52, paddingBottom: Spacing.xl },
  heroTopRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  heroEyebrow:        { fontFamily: Fonts.bold, fontSize: 10, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  heroTitle:          { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.white },
  heroBody:           { fontFamily: Fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 16 },
  coinChip:           { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  coinText:           { fontFamily: Fonts.extraBold, fontSize: 13, color: Colors.white },
  incomePill:         { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 7 },
  incomePillText:     { fontFamily: Fonts.bold, fontSize: 12, color: Colors.white },

  // Wallet section — white strip below hero
  walletSection:      { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingTop: Spacing.sm },
  walletSectionLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: Spacing.lg, paddingTop: 6, marginBottom: 0 },

  // Body content
  body:               { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  finRow:             { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: Spacing.lg },
  finBubble:          { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.lg, borderTopLeftRadius: 4, padding: 12, borderWidth: 1, borderColor: Colors.border, ...Shadows.soft },
  finName:            { fontFamily: Fonts.bold, fontSize: 10, color: Colors.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  finText:            { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  gateBar:            { backgroundColor: Colors.warningLight, borderRadius: Radii.md, paddingVertical: 10, paddingHorizontal: 14, marginBottom: Spacing.md, alignItems: 'center' },
  gateText:           { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.warningDark },
  sectionLabel:       { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
});