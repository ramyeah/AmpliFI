// app/sim/networth.js
//
// Net Worth Dashboard — the user's full financial picture at a glance.
//
// Sections:
//   1. Hero — total net worth, monthly delta (↑↓), FI progress ring
//   2. FI projection — current trajectory, projected FI date
//   3. Breakdown — every account grouped by type with balances
//   4. Net worth history — bar chart (monthly snapshots from sim.history)
//   5. Fin insight — one contextual observation
//
// Routing: /sim/networth
// Accessible from: hub hero card, world grid "Net Worth" card
// No lesson gate — always accessible once simulation is started.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../../store/userStore';
import { loadSimProgress } from '../../lib/lifeSim';
import { Colors, Fonts, Spacing, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';
import { auth } from '../../lib/firebase';
import { useSafeBack } from '../../hooks/useHardwareBack';

const { width: SW } = Dimensions.get('window');

// ─── Account type metadata ────────────────────────────────────────────────────

const ACCOUNT_META = {
  wallet:     { label: 'Cash',             icon: '💵', group: 'liquid',     order: 0 },
  bank:       { label: 'Bank Account',     icon: '🏦', group: 'liquid',     order: 1 },
  hysa:       { label: 'HYSA',             icon: '⚡', group: 'liquid',     order: 2 },
  emergency:  { label: 'Emergency Fund',   icon: '🛡️', group: 'fund',       order: 3 },
  fund:       { label: 'Savings Fund',     icon: '🛡️', group: 'fund',       order: 3 },
  goal:       { label: 'Savings Goal',     icon: '🪣', group: 'goal',       order: 4 },
  investment: { label: 'Investments',      icon: '📈', group: 'investment', order: 5 },
  cpf:        { label: 'CPF',              icon: '🏛️', group: 'cpf',        order: 6 },
};

const GROUP_META = {
  liquid:     { label: 'Liquid Cash & Savings',  color: MODULE_COLORS['module-2'].color },
  fund:       { label: 'Protected Funds',         color: MODULE_COLORS['module-3'].color },
  goal:       { label: 'Goal Savings',            color: MODULE_COLORS['module-1'].color },
  investment: { label: 'Investments',             color: MODULE_COLORS['module-3'].color },
  cpf:        { label: 'CPF',                     color: MODULE_COLORS['module-4'].color },
};

// ─── Calculations ─────────────────────────────────────────────────────────────

function calcNetWorth(sim) {
  return (sim?.wallets ?? []).reduce((s, w) => s + (w.balance ?? 0), 0);
}

function calcPrevNetWorth(sim) {
  const history = sim?.history ?? [];
  if (history.length < 2) return null;
  const prev = history[history.length - 2];
  if (!prev?.walletSnapshots) return null;
  return Object.values(prev.walletSnapshots).reduce((s, v) => s + v, 0);
}

function calcFIProgress(sim) {
  if (!sim?.ffn || sim.ffn <= 0) return { pct: 0, invested: 0 };
  const invested = (sim.wallets ?? [])
    .filter(w => w.type === 'investment')
    .reduce((s, w) => s + (w.balance ?? 0), 0);
  return { pct: Math.min(invested / sim.ffn, 1), invested };
}

function projectedFIDate(sim) {
  if (!sim?.ffn || !sim?.monthlyBudget?.savingsAmt) return null;
  const { invested } = calcFIProgress(sim);
  const gap           = sim.ffn - invested;
  if (gap <= 0) return 'Already there!';
  // Very rough: savings rate + 6% annual return
  const monthlyReturn = 0.005; // 6% / 12
  const monthly       = sim.monthlyBudget.savingsAmt;
  if (monthly <= 0) return null;
  // Approximate months via future value of annuity formula solved for n
  // FV = PMT × [(1+r)^n - 1] / r  → simplified iterative
  let balance  = invested;
  let months   = 0;
  while (balance < sim.ffn && months < 600) {
    balance = balance * (1 + monthlyReturn) + monthly;
    months++;
  }
  if (months >= 600) return 'Over 50 years away';
  const now  = new Date();
  const then = new Date(now.getFullYear(), now.getMonth() + months);
  const yr   = then.getFullYear();
  if (months < 24) return `~${months} months`;
  return `~${yr}`;
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
// Draws a simple inline bar chart from simProgress.history snapshots.

function NetWorthChart({ history, color }) {
  const BAR_COUNT = Math.min(history.length, 12);
  const recent    = history.slice(-BAR_COUNT);
  const CHART_H   = 80;

  if (recent.length === 0) {
    return (
      <View style={[chart.empty, { height: CHART_H }]}>
        <Text style={chart.emptyText}>Net worth history will appear here as you advance months.</Text>
      </View>
    );
  }

  const values = recent.map(h =>
    Object.values(h.walletSnapshots ?? {}).reduce((s, v) => s + v, 0)
  );
  const maxVal = Math.max(...values, 1);
  const barW   = Math.floor(((SW - Spacing.lg * 2 - Spacing.xl * 2) / BAR_COUNT) - 4);

  return (
    <View style={chart.wrap}>
      <View style={[chart.bars, { height: CHART_H }]}>
        {values.map((v, i) => {
          const h    = Math.max(4, Math.round((v / maxVal) * CHART_H));
          const prev = i > 0 ? values[i - 1] : v;
          const up   = v >= prev;
          return (
            <View key={i} style={chart.barCol}>
              <View style={[chart.bar, { height: h, backgroundColor: up ? color : Colors.danger + 'CC', width: barW }]} />
            </View>
          );
        })}
      </View>
      <View style={chart.labels}>
        {recent.map((h, i) => (
          <Text key={i} style={[chart.barLabel, { width: barW + 4 }]}>
            {i === 0 ? 'M1' : i === recent.length - 1 ? `M${recent.length}` : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

const chart = StyleSheet.create({
  wrap:      { gap: 4 },
  bars:      { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barCol:    { alignItems: 'center', justifyContent: 'flex-end' },
  bar:       { borderRadius: 3 },
  labels:    { flexDirection: 'row', gap: 4 },
  barLabel:  { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  empty:     { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.lightGray, borderRadius: Radii.md },
  emptyText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.lg },
});

// ─── FI ring ──────────────────────────────────────────────────────────────────
// Simple SVG-free progress ring using border-radius trick.

function FIRing({ pct, color, size = 120 }) {
  const deg = Math.round(pct * 360);
  // Two-layer conic gradient approximation using absolute positioned views
  return (
    <View style={[ring.outer, { width: size, height: size, borderRadius: size / 2, borderColor: color + '22' }]}>
      {/* Fill arc — simplified: just a thick border with rotation clip */}
      <View style={[ring.fill, {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 8,
        borderColor: 'transparent',
        borderTopColor: pct > 0 ? color : 'transparent',
        borderRightColor: pct > 0.25 ? color : 'transparent',
        borderBottomColor: pct > 0.5 ? color : 'transparent',
        borderLeftColor: pct > 0.75 ? color : 'transparent',
      }]} />
      <View style={ring.inner}>
        <Text style={[ring.pct, { color }]}>{Math.round(pct * 100)}%</Text>
        <Text style={ring.label}>to FI</Text>
      </View>
    </View>
  );
}

const ring = StyleSheet.create({
  outer: { borderWidth: 8, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fill:  { position: 'absolute', top: -8, left: -8 },
  inner: { alignItems: 'center' },
  pct:   { fontFamily: Fonts.extraBold, fontSize: 22 },
  label: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
});

// ─── Account row ──────────────────────────────────────────────────────────────

function AccountRow({ wallet }) {
  const meta    = ACCOUNT_META[wallet.type] ?? ACCOUNT_META.bank;
  const color   = wallet.color ?? MODULE_COLORS['module-1'].color;
  const balance = wallet.balance ?? 0;
  const pct     = wallet.target > 0 ? Math.min((balance / wallet.target), 1) : null;

  return (
    <View style={ar.row}>
      <View style={[ar.iconWrap, { backgroundColor: color + '18' }]}>
        <Text style={ar.icon}>{wallet.icon ?? meta.icon}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={ar.top}>
          <Text style={ar.name}>{wallet.label ?? meta.label}</Text>
          <Text style={[ar.bal, { color }]}>${Math.round(balance).toLocaleString()}</Text>
        </View>
        {wallet.institution && (
          <Text style={ar.sub}>{wallet.institution}{wallet.accountType === 'hysa' ? ' · HYSA ⚡' : ''}</Text>
        )}
        {wallet.interestRate > 0 && (
          <Text style={ar.rate}>
            {(wallet.interestRate * 100).toFixed(2)}% p.a.
            {' · '}~${Math.round(balance * wallet.interestRate)}/yr interest
          </Text>
        )}
        {pct !== null && (
          <View style={ar.progWrap}>
            <View style={ar.progTrack}>
              <View style={[ar.progFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
            </View>
            <Text style={ar.progPct}>{Math.round(pct * 100)}% of ${Math.round(wallet.target).toLocaleString()} target</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const ar = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: Spacing.sm },
  iconWrap:  { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  icon:      { fontSize: 18 },
  top:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name:      { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  bal:       { fontFamily: Fonts.extraBold, fontSize: 16 },
  sub:       { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  rate:      { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  progWrap:  { gap: 3, marginTop: 2 },
  progTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progFill:  { height: 4, borderRadius: 2 },
  progPct:   { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
});

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ children, style }) {
  return <View style={[sc.card, style]}>{children}</View>;
}
const sc = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, ...Shadows.soft },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function NetWorthScreen() {
  const router  = useRouter();
  const goBack  = useSafeBack('/(tabs)/simulate');
  const insets  = useSafeAreaInsets();
  const profile = useUserStore(s => s.profile);

  const [sim,     setSim]     = useState(null);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  const loadSim = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await loadSimProgress(uid);
      setSim(data);
    } catch (e) { console.error('networth load:', e); }
    finally     { setLoading(false); }
  }, [uid]);

  useEffect(() => { loadSim(); }, [loadSim]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const wallets      = sim?.wallets ?? [];
  const netWorth     = calcNetWorth(sim);
  const prevNetWorth = calcPrevNetWorth(sim);
  const delta        = prevNetWorth !== null ? netWorth - prevNetWorth : null;
  const { pct: fiPct, invested } = calcFIProgress(sim);
  const fiDate       = projectedFIDate(sim);
  const tealColor    = MODULE_COLORS['module-1'].color;
  const history      = sim?.history ?? [];

  // Group wallets
  const grouped = {};
  wallets.forEach(w => {
    const meta  = ACCOUNT_META[w.type] ?? ACCOUNT_META.bank;
    const group = meta.group;
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(w);
  });
  const groupKeys = Object.keys(grouped).sort((a, b) => {
    const orderA = Object.values(ACCOUNT_META).find(m => m.group === a)?.order ?? 99;
    const orderB = Object.values(ACCOUNT_META).find(m => m.group === b)?.order ?? 99;
    return orderA - orderB;
  });

  // Fin's contextual insight
  const finInsight = (() => {
    if (!sim) return null;
    const fundW = wallets.find(w => w.id === 'emergency-fund');
    if (!fundW) return "You don't have an emergency fund yet. One unexpected expense could wipe your monthly budget. Build it before you think about investing.";
    const fundPct = (fundW.balance ?? 0) / (fundW.target || 1);
    if (fundPct < 1) return `Your emergency fund is ${Math.round(fundPct * 100)}% full. Keep going — once it's complete, every extra dollar can go towards your real goals.`;
    if (fiPct < 0.01) return "Your emergency fund is solid. The next step is getting money into investments — cash in a savings account earns interest, but won't grow fast enough to reach FI.";
    if (fiPct < 0.1) return `You've invested ${Math.round(fiPct * 100)}% of your FI number. The early stage feels slow — but compound growth accelerates dramatically in later years.`;
    return `Your net worth is $${Math.round(netWorth).toLocaleString()}. You're ${Math.round(fiPct * 100)}% of the way to financial independence. Keep the savings rate up.`;
  })();

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={s.loadWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: Colors.background }]}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={goBack} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Net Worth</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero card ────────────────────────────────────────────────── */}
        <SectionCard style={{ gap: Spacing.lg }}>
          <View style={s.heroRow}>
            {/* Left: net worth */}
            <View style={{ flex: 1 }}>
              <Text style={s.heroLabel}>TOTAL NET WORTH</Text>
              <Text style={[s.heroAmt, { color: tealColor }]}>
                ${Math.round(netWorth).toLocaleString()}
              </Text>
              {delta !== null && (
                <View style={s.deltaRow}>
                  <Text style={[s.delta, { color: delta >= 0 ? Colors.successDark : Colors.danger }]}>
                    {delta >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(delta)).toLocaleString()} this month
                  </Text>
                </View>
              )}
              {sim?.ffn && (
                <View style={s.fiTargetRow}>
                  <Text style={s.fiTargetLabel}>FI target: </Text>
                  <Text style={s.fiTargetVal}>${Math.round(sim.ffn).toLocaleString()}</Text>
                </View>
              )}
            </View>
            {/* Right: FI ring */}
            <FIRing pct={fiPct} color={tealColor} size={110} />
          </View>

          {/* FI bar */}
          <View style={s.fiBarSection}>
            <View style={s.fiBarRow}>
              <Text style={s.fiBarLabel}>Financial Independence progress</Text>
              <Text style={[s.fiBarPct, { color: tealColor }]}>{Math.round(fiPct * 100)}%</Text>
            </View>
            <View style={s.fiTrack}>
              <View style={[s.fiFill, { width: `${Math.round(fiPct * 100)}%`, backgroundColor: tealColor }]} />
            </View>
            {fiDate && (
              <Text style={s.fiProjection}>
                At current savings rate — projected FI: <Text style={{ color: tealColor, fontFamily: Fonts.bold }}>{fiDate}</Text>
              </Text>
            )}
            {!sim?.ffn && (
              <Text style={s.fiProjection}>Set your FI number to see your projected independence date.</Text>
            )}
          </View>
        </SectionCard>

        {/* ── Accounts breakdown ───────────────────────────────────────── */}
        <SectionCard style={{ gap: Spacing.md }}>
          <Text style={s.sectionTitle}>Your accounts</Text>

          {wallets.length === 0 ? (
            <Text style={s.emptyNote}>No accounts yet. Open a bank account to get started.</Text>
          ) : groupKeys.map(groupKey => {
            const groupWallets = grouped[groupKey];
            const groupMeta    = GROUP_META[groupKey] ?? { label: groupKey, color: Colors.textMuted };
            const groupTotal   = groupWallets.reduce((s, w) => s + (w.balance ?? 0), 0);
            return (
              <View key={groupKey}>
                <View style={s.groupHeader}>
                  <Text style={[s.groupLabel, { color: groupMeta.color }]}>{groupMeta.label}</Text>
                  <Text style={[s.groupTotal, { color: groupMeta.color }]}>${Math.round(groupTotal).toLocaleString()}</Text>
                </View>
                <View style={s.divider} />
                {groupWallets.map((w, i) => (
                  <View key={w.id}>
                    <AccountRow wallet={w} />
                    {i < groupWallets.length - 1 && <View style={s.rowDivider} />}
                  </View>
                ))}
              </View>
            );
          })}
        </SectionCard>

        {/* ── Net worth history ────────────────────────────────────────── */}
        <SectionCard style={{ gap: Spacing.md }}>
          <View style={s.chartHeader}>
            <Text style={s.sectionTitle}>Net worth over time</Text>
            {history.length > 0 && (
              <Text style={s.chartMonths}>{history.length} month{history.length !== 1 ? 's' : ''}</Text>
            )}
          </View>
          <NetWorthChart history={history} color={tealColor} />
        </SectionCard>

        {/* ── Interest earned summary ───────────────────────────────────── */}
        {(() => {
          const bankW = wallets.find(w => w.type === 'bank' || w.type === 'hysa');
          const totalInterest = (bankW?.interestLog ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
          if (totalInterest <= 0) return null;
          return (
            <SectionCard>
              <View style={s.interestRow}>
                <Text style={s.interestEmoji}>💰</Text>
                <View>
                  <Text style={s.interestTitle}>Total interest earned</Text>
                  <Text style={[s.interestAmt, { color: Colors.successDark }]}>${Math.round(totalInterest).toLocaleString()}</Text>
                  <Text style={s.interestNote}>Interest your bank has paid you — money earned by doing nothing.</Text>
                </View>
              </View>
            </SectionCard>
          );
        })()}

        {/* ── Fin insight ──────────────────────────────────────────────── */}
        {finInsight && (
          <View style={s.finWrap}>
            <Text style={s.finEmoji}>🦉</Text>
            <View style={s.finBubble}>
              <Text style={s.finText}>{finInsight}</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.background },
  loadWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.background },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.border },
  backIcon:      { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary },
  headerTitle:   { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary },

  // Scroll
  scroll:        { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md },

  // Hero
  heroRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel:     { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  heroAmt:       { fontFamily: Fonts.extraBold, fontSize: 38 },
  deltaRow:      { marginTop: 4 },
  delta:         { fontFamily: Fonts.bold, fontSize: 13 },
  fiTargetRow:   { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  fiTargetLabel: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  fiTargetVal:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSecondary },

  // FI bar
  fiBarSection:  { gap: 6 },
  fiBarRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  fiBarLabel:    { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textSecondary },
  fiBarPct:      { fontFamily: Fonts.extraBold, fontSize: 15 },
  fiTrack:       { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fiFill:        { height: 8, borderRadius: 4 },
  fiProjection:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  // Section titles
  sectionTitle:  { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  emptyNote:     { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },

  // Account groups
  groupHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  groupLabel:    { fontFamily: Fonts.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  groupTotal:    { fontFamily: Fonts.extraBold, fontSize: 15 },
  divider:       { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  rowDivider:    { height: 1, backgroundColor: Colors.lightGray, marginLeft: 52 },

  // Chart header
  chartHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chartMonths:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  // Interest
  interestRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  interestEmoji: { fontSize: 28, marginTop: 2 },
  interestTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  interestAmt:   { fontFamily: Fonts.extraBold, fontSize: 22, marginBottom: 2 },
  interestNote:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  // Fin
  finWrap:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, ...Shadows.soft },
  finEmoji:  { fontSize: 26, marginTop: 2 },
  finBubble: { flex: 1 },
  finText:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
});