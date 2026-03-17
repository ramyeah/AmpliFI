// app/life-sim/dashboard.js
//
// Financial Dashboard — the user's complete financial picture at a glance.
//
// Accessible via 📊 button in the simulation top bar.
// Works independently of the narrative — can be opened at any point.
//
// Sections (in order):
//   1. Net Worth hero — big number, monthly delta, FI progress ring
//   2. FI target card — your number, % reached, projected date
//   3. Accounts breakdown — every wallet grouped and detailed
//   4. Monthly history bar chart — net worth over time
//   5. Budget vs Actual — this month's spend against plan
//   6. Interest earned — lifetime total across all accounts
//   7. Fin insight — one contextual observation at the bottom

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadSimProgress } from '../../lib/lifeSim';
import { Colors, Fonts, Spacing, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';
import { auth } from '../../lib/firebase';
import { useSafeBack } from '../../hooks/useHardwareBack';

const { width: SW } = Dimensions.get('window');
const TEAL   = MODULE_COLORS['module-1'].color;
const ORANGE = MODULE_COLORS['module-2'].color;
const GREEN  = MODULE_COLORS['module-3'].color;
const PURPLE = MODULE_COLORS['module-4'].color;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcNetWorth(sim) {
  return (sim?.wallets ?? []).reduce((s, w) => s + (w.balance ?? 0), 0);
}

function calcPrevNetWorth(sim) {
  const h = sim?.history ?? [];
  if (h.length < 1) return null;
  const snap = h[h.length - 1]?.walletSnapshots ?? {};
  return Object.values(snap).reduce((s, v) => s + v, 0);
}

function projectedFIMonths(sim) {
  if (!sim?.ffn || !sim?.monthlyBudget?.savingsAmt) return null;
  const invested   = (sim.wallets ?? []).filter(w => w.type === 'investment').reduce((s, w) => s + (w.balance ?? 0), 0);
  const gap        = sim.ffn - invested;
  if (gap <= 0) return 0;
  const monthly    = sim.monthlyBudget.savingsAmt;
  const monthlyRet = 0.005;
  let bal = invested, months = 0;
  while (bal < sim.ffn && months < 600) { bal = bal * (1 + monthlyRet) + monthly; months++; }
  return months >= 600 ? null : months;
}

function fmtMoney(n) {
  return '$' + Math.round(n ?? 0).toLocaleString();
}

// ─── FI Progress Ring (SVG-free, border trick) ────────────────────────────────

function FIRing({ pct, size = 120, color = TEAL }) {
  const filled = Math.min(Math.max(pct, 0), 1);
  const deg    = Math.round(filled * 360);
  // We fake a conic arc using a clipped two-halves approach with Animated
  // For simplicity: use nested Views with border-radius + rotate trick
  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(rotation, { toValue: deg, duration: 900, useNativeDriver: false }).start();
  }, [deg]);

  return (
    <View style={[rg.outer, { width: size, height: size, borderRadius: size / 2, borderColor: color + '22' }]}>
      {/* Track ring */}
      <View style={[rg.track, { width: size, height: size, borderRadius: size / 2, borderWidth: size * 0.1 }]} />
      {/* Fill — approximated with border coloring per quadrant */}
      <View style={[rg.fill, {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: size * 0.1,
        borderTopColor:    filled > 0      ? color : 'transparent',
        borderRightColor:  filled > 0.25   ? color : 'transparent',
        borderBottomColor: filled > 0.5    ? color : 'transparent',
        borderLeftColor:   filled > 0.75   ? color : 'transparent',
      }]} />
      <View style={rg.inner}>
        <Text style={[rg.pct, { color, fontSize: size * 0.22 }]}>{Math.round(filled * 100)}%</Text>
        <Text style={rg.label}>to FI</Text>
      </View>
    </View>
  );
}

const rg = StyleSheet.create({
  outer: { borderWidth: 0, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  track: { position: 'absolute', top: 0, left: 0, borderColor: Colors.border },
  fill:  { position: 'absolute', top: 0, left: 0 },
  inner: { alignItems: 'center', gap: 2 },
  pct:   { fontFamily: Fonts.extraBold },
  label: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
});

// ─── Bar chart ────────────────────────────────────────────────────────────────

function NetWorthChart({ history }) {
  if (!history?.length) {
    return (
      <View style={ch.empty}>
        <Text style={ch.emptyText}>Net worth history will appear here as months advance.</Text>
      </View>
    );
  }
  const recent = history.slice(-12);
  const values = recent.map(h =>
    Object.values(h.walletSnapshots ?? {}).reduce((s, v) => s + v, 0)
  );
  const maxVal   = Math.max(...values, 1);
  const barW     = Math.max(Math.floor((SW - 80) / recent.length) - 4, 8);
  const CHART_H  = 90;

  return (
    <View style={ch.wrap}>
      <View style={[ch.bars, { height: CHART_H }]}>
        {values.map((v, i) => {
          const h    = Math.max(4, Math.round((v / maxVal) * CHART_H));
          const prev = i > 0 ? values[i - 1] : v;
          const up   = v >= prev;
          return (
            <View key={i} style={[ch.barCol, { height: CHART_H }]}>
              <View style={[ch.bar, {
                height: h,
                width:  barW,
                backgroundColor: up ? TEAL : Colors.dangerMid,
                borderRadius: 3,
              }]} />
            </View>
          );
        })}
      </View>
      <View style={ch.labels}>
        {recent.map((_, i) => (
          <Text key={i} style={[ch.barLabel, { width: barW + 4 }]}>
            {i === 0 ? 'M1' : i === recent.length - 1 ? `M${recent.length}` : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  wrap:      { gap: 4 },
  bars:      { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barCol:    { justifyContent: 'flex-end' },
  bar:       {},
  labels:    { flexDirection: 'row', gap: 4 },
  barLabel:  { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  empty:     { backgroundColor: Colors.lightGray, borderRadius: Radii.md, padding: Spacing.lg, alignItems: 'center' },
  emptyText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});

// ─── Section card ─────────────────────────────────────────────────────────────

function Card({ children, style }) {
  return <View style={[cd.card, style]}>{children}</View>;
}
const cd = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, ...Shadows.soft },
});

// ─── Account row ─────────────────────────────────────────────────────────────

function AccountRow({ wallet, last }) {
  const color  = wallet.color ?? TEAL;
  const bal    = wallet.balance ?? 0;
  const pct    = wallet.target > 0 ? Math.min(bal / wallet.target, 1) : null;
  const isHYSA = wallet.accountType === 'hysa';

  return (
    <View style={[ar.row, !last && ar.border]}>
      <View style={[ar.icon, { backgroundColor: color + '18' }]}>
        <Text style={{ fontSize: 18 }}>{wallet.icon ?? '🏦'}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={ar.nameRow}>
          <Text style={ar.name}>{wallet.label}</Text>
          {isHYSA && (
            <View style={[ar.badge, { backgroundColor: color + '20' }]}>
              <Text style={[ar.badgeText, { color }]}>HYSA ⚡</Text>
            </View>
          )}
        </View>
        {wallet.institution && <Text style={ar.inst}>{wallet.institution}</Text>}
        {wallet.interestRate > 0 && (
          <Text style={ar.rate}>
            {(wallet.interestRate * 100).toFixed(2)}% p.a. · ~{fmtMoney(bal * wallet.interestRate)}/yr
          </Text>
        )}
        {pct !== null && (
          <View style={ar.progWrap}>
            <View style={ar.progTrack}>
              <View style={[ar.progFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
            </View>
            <Text style={ar.progLabel}>{Math.round(pct * 100)}% of {fmtMoney(wallet.target)} target</Text>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={[ar.bal, { color }]}>{fmtMoney(bal)}</Text>
        <Text style={ar.coins}>{Math.round(bal / 10)}🪙</Text>
      </View>
    </View>
  );
}

const ar = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: Spacing.sm },
  border:   { borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  icon:     { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name:     { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  inst:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  badge:    { borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:{ fontFamily: Fonts.bold, fontSize: 9 },
  rate:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.successDark },
  progWrap: { gap: 3, marginTop: 2 },
  progTrack:{ height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progFill: { height: 4, borderRadius: 2 },
  progLabel:{ fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  bal:      { fontFamily: Fonts.extraBold, fontSize: 18 },
  coins:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
});

// ─── Budget vs actual bar ─────────────────────────────────────────────────────

function BudgetBar({ label, color, budgeted, actual }) {
  const over = actual > budgeted && budgeted > 0;
  const pct  = budgeted > 0 ? Math.min(actual / budgeted, 1) : 0;
  return (
    <View style={bb.row}>
      <View style={bb.labelRow}>
        <Text style={bb.label}>{label}</Text>
        <Text style={[bb.amt, { color: over ? Colors.danger : color }]}>
          {fmtMoney(actual)}
          <Text style={bb.of}> / {fmtMoney(budgeted)}</Text>
        </Text>
      </View>
      <View style={bb.track}>
        <View style={[bb.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: over ? Colors.danger : color }]} />
      </View>
      {over && <Text style={bb.over}>+{fmtMoney(actual - budgeted)} over budget</Text>}
    </View>
  );
}

const bb = StyleSheet.create({
  row:      { gap: 5, marginBottom: Spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label:    { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  amt:      { fontFamily: Fonts.extraBold, fontSize: 16 },
  of:       { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  track:    { height: 8, backgroundColor: Colors.lightGray, borderRadius: 4, overflow: 'hidden' },
  fill:     { height: 8, borderRadius: 4 },
  over:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.danger },
});

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return <Text style={st.t}>{children}</Text>;
}
const st = StyleSheet.create({ t: { fontFamily: Fonts.extraBold, fontSize: 17, color: Colors.textPrimary, marginBottom: Spacing.sm } });

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router  = useRouter();
  const goBack  = useSafeBack('/(tabs)/simulate');
  const insets  = useSafeAreaInsets();

  const [sim,     setSim]     = useState(null);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  const load = useCallback(async () => {
    if (!uid) return;
    try { const d = await loadSimProgress(uid); setSim(d); }
    catch (e) { console.error('dashboard load:', e); }
    finally   { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const wallets     = sim?.wallets ?? [];
  const netWorth    = calcNetWorth(sim);
  const prevNW      = calcPrevNetWorth(sim);
  const delta       = prevNW !== null ? netWorth - prevNW : null;
  const invested    = wallets.filter(w => w.type === 'investment').reduce((s, w) => s + (w.balance ?? 0), 0);
  const fiPct       = sim?.ffn ? Math.min(invested / sim.ffn, 1) : 0;
  const projMonths  = projectedFIMonths(sim);
  const history     = sim?.history ?? [];
  const lastReport  = (sim?.spendHistory ?? []).slice(-1)[0] ?? null;
  const totalInterest = wallets.reduce((s, w) =>
    s + (w.interestLog ?? []).reduce((a, e) => a + (e.amount ?? 0), 0), 0
  );

  const budget = sim?.monthlyBudget;

  // Group wallets
  const accountWallets = wallets.filter(w => w.type !== 'wallet' && !w.closedMonth);
  const cashWallet     = wallets.find(w => w.id === 'wallet');

  const finInsight = (() => {
    if (!sim) return "Start your simulation to see your financial dashboard.";
    const fundW = wallets.find(w => w.id === 'emergency-fund');
    if (!fundW) return "You don't have an emergency fund yet. One unexpected expense could derail your budget.";
    const fundPct = (fundW.balance ?? 0) / (fundW.target || 1);
    if (fundPct < 1) return `Your emergency fund is ${Math.round(fundPct * 100)}% full. Once complete, every extra dollar can go toward building wealth.`;
    if (fiPct < 0.01) return "Emergency fund solid. Your next step is getting money into investments — savings accounts earn interest, but investing is how you reach FI.";
    if (projMonths !== null) {
      const yrs = Math.round(projMonths / 12);
      return `At your current savings rate, you're projected to reach financial independence in about ${yrs} year${yrs !== 1 ? 's' : ''}. Keep the rate up.`;
    }
    return `Net worth: ${fmtMoney(netWorth)}. You're ${Math.round(fiPct * 100)}% of the way to financial independence.`;
  })();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: Colors.background }]}>

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={goBack} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Dashboard</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. Net Worth hero ── */}
        <Card>
          <View style={s.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroLabel}>TOTAL NET WORTH</Text>
              <Text style={[s.heroAmt, { color: TEAL }]}>{fmtMoney(netWorth)}</Text>
              {delta !== null && (
                <View style={s.deltaRow}>
                  <Text style={[s.delta, { color: delta >= 0 ? GREEN : Colors.danger }]}>
                    {delta >= 0 ? '▲' : '▼'} {fmtMoney(Math.abs(delta))} this month
                  </Text>
                </View>
              )}
              {sim?.ffn && (
                <View style={s.fiTargetRow}>
                  <Text style={s.fiTargetLabel}>FI target </Text>
                  <Text style={s.fiTargetAmt}>{fmtMoney(sim.ffn)}</Text>
                </View>
              )}
            </View>
            <FIRing pct={fiPct} color={TEAL} size={110} />
          </View>

          {/* FI progress bar */}
          <View style={s.fiBarWrap}>
            <View style={s.fiBarRow}>
              <Text style={s.fiBarLabel}>FI progress</Text>
              <Text style={[s.fiBarPct, { color: TEAL }]}>{Math.round(fiPct * 100)}%</Text>
            </View>
            <View style={s.fiTrack}>
              <View style={[s.fiFill, { width: `${Math.round(fiPct * 100)}%` }]} />
            </View>
            {projMonths !== null && (
              <Text style={s.fiProjection}>
                At current rate — FI in ~{projMonths < 24
                  ? `${projMonths} months`
                  : `${Math.round(projMonths / 12)} years`}
              </Text>
            )}
            {!sim?.ffn && (
              <Text style={s.fiProjection}>Set your FI number in the simulation to see progress.</Text>
            )}
          </View>
        </Card>

        {/* ── 2. Accounts ── */}
        <Card>
          <SectionTitle>Your accounts</SectionTitle>
          {cashWallet && (cashWallet.balance ?? 0) > 0 && (
            <AccountRow wallet={{ ...cashWallet, label: 'Cash Wallet', icon: '💵', color: Colors.textMuted }} last={accountWallets.length === 0} />
          )}
          {accountWallets.length === 0 && !(cashWallet?.balance) ? (
            <Text style={s.emptyNote}>No accounts yet. Follow Fin to open one.</Text>
          ) : (
            accountWallets.map((w, i) => (
              <AccountRow key={w.id} wallet={w} last={i === accountWallets.length - 1} />
            ))
          )}
        </Card>

        {/* ── 3. Net worth history ── */}
        <Card>
          <View style={s.chartHeader}>
            <SectionTitle>Net worth over time</SectionTitle>
            {history.length > 0 && (
              <Text style={s.chartMonths}>{history.length} month{history.length !== 1 ? 's' : ''}</Text>
            )}
          </View>
          <NetWorthChart history={history} />
        </Card>

        {/* ── 4. Budget vs Actual (most recent month) ── */}
        {(budget || lastReport) && (
          <Card>
            <SectionTitle>
              {lastReport ? `Month ${lastReport.month} spending` : 'Budget'}
            </SectionTitle>
            <BudgetBar
              label="Needs"
              color={TEAL}
              budgeted={budget?.needsAmt ?? 0}
              actual={lastReport?.needsSpent ?? 0}
            />
            <BudgetBar
              label="Wants"
              color={ORANGE}
              budgeted={budget?.wantsAmt ?? 0}
              actual={lastReport?.wantsSpent ?? 0}
            />
            <BudgetBar
              label="Savings"
              color={GREEN}
              budgeted={budget?.savingsAmt ?? 0}
              actual={lastReport?.savingsAmt ?? 0}
            />
            {!lastReport && budget && (
              <Text style={s.noReportNote}>Budget set — spending data will appear after your first month closes.</Text>
            )}
          </Card>
        )}

        {/* ── 5. Interest earned ── */}
        {totalInterest > 0 && (
          <Card style={s.interestCard}>
            <View style={s.interestRow}>
              <Text style={{ fontSize: 28 }}>💰</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.interestTitle}>Total interest earned</Text>
                <Text style={[s.interestAmt, { color: GREEN }]}>{fmtMoney(totalInterest)}</Text>
                <Text style={s.interestNote}>Money your bank has paid you — without you doing anything.</Text>
              </View>
            </View>
          </Card>
        )}

        {/* ── 6. Fin insight ── */}
        <View style={s.finWrap}>
          <Text style={s.finOwl}>🦉</Text>
          <View style={s.finBubble}>
            <Text style={s.finText}>{finInsight}</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.background },
  backBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.border },
  backIcon:      { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary },
  headerTitle:   { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary },
  scroll:        { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.md },

  // Net Worth hero
  heroRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  heroLabel:     { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  heroAmt:       { fontFamily: Fonts.extraBold, fontSize: 38 },
  deltaRow:      { marginTop: 4 },
  delta:         { fontFamily: Fonts.bold, fontSize: 13 },
  fiTargetRow:   { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  fiTargetLabel: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  fiTargetAmt:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSecondary },

  // FI bar
  fiBarWrap:     { gap: 6 },
  fiBarRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  fiBarLabel:    { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSecondary },
  fiBarPct:      { fontFamily: Fonts.extraBold, fontSize: 15 },
  fiTrack:       { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fiFill:        { height: 8, borderRadius: 4, backgroundColor: TEAL },
  fiProjection:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  // Chart
  chartHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chartMonths:   { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  // Misc
  emptyNote:     { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, paddingVertical: Spacing.sm },
  noReportNote:  { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: -Spacing.sm },

  // Interest
  interestCard:  {},
  interestRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  interestTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  interestAmt:   { fontFamily: Fonts.extraBold, fontSize: 24, marginBottom: 2 },
  interestNote:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, lineHeight: 18 },

  // Fin
  finWrap:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.white, borderRadius: Radii.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, ...Shadows.soft },
  finOwl:   { fontSize: 26, marginTop: 2 },
  finBubble:{ flex: 1 },
  finText:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
});