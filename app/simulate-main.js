// app/simulate-main.js
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  StyleSheet, Dimensions, ActivityIndicator, Animated, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import {
  SIM_CONFIG, ASSET_CLASSES, RISK_PROFILES, INVESTING_EVENTS,
  MONTHLY_EVENTS, SAVING_ACCOUNTS, SAVING_EVENTS, ADVISOR,
  getIncomeBracket, createInitialState, computeNewState,
} from '../constants/simulation';
import { Colors, Fonts, Spacing, Radii, Shadows, MODULE_COLORS } from '../constants/theme';
import useUserStore from '../store/userStore';
import { simulateMonth, askFin, getSimInsight } from '../lib/api';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const { width: SW, height: SH } = Dimensions.get('window');
const STATS_BAR_HEIGHT = 72;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (n) => `$${Math.round(n).toLocaleString()}`;
const fmtK = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);

// Animated counter hook — smoothly ticks a number to a new value
function useAnimatedCounter(target, duration = 600) {
  const anim    = useRef(new Animated.Value(target)).current;
  const display = useRef(target);
  const [val, setVal] = useState(target);

  useEffect(() => {
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
    const id = anim.addListener(({ value }) => {
      const rounded = Math.round(value);
      if (rounded !== display.current) { display.current = rounded; setVal(rounded); }
    });
    return () => anim.removeListener(id);
  }, [target]);

  return val;
}

// ─── Floating toast ───────────────────────────────────────────────────────────
function FloatToast({ amount, visible, color }) {
  const y   = useRef(new Animated.Value(0)).current;
  const op  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    y.setValue(0); op.setValue(0);
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(y,  { toValue: -60, duration: 800, useNativeDriver: true }),
    ]).start(() => Animated.timing(op, { toValue: 0, duration: 300, useNativeDriver: true }).start());
  }, [visible, amount]);

  if (!visible) return null;
  return (
    <Animated.View style={[ft.wrap, { opacity: op, transform: [{ translateY: y }], borderColor: color }]}>
      <Text style={[ft.text, { color }]}>{amount >= 0 ? '+' : ''}{fmt(amount)}</Text>
    </Animated.View>
  );
}
const ft = StyleSheet.create({
  wrap: { position: 'absolute', alignSelf: 'center', top: 0, borderWidth: 1.5, borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.white, zIndex: 100, ...Shadows.medium },
  text: { fontFamily: Fonts.extraBold, fontSize: 18 },
});

// ─── FinCoin reward toast ──────────────────────────────────────────────────────
function CoinToast({ amount, visible }) {
  const y  = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !amount) return;
    y.setValue(0); op.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(y,  { toValue: -80, friction: 6, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(1000),
      Animated.timing(op, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [visible, amount]);

  if (!visible) return null;
  return (
    <Animated.View style={[ct.wrap, { opacity: op, transform: [{ translateY: y }] }]}>
      <Text style={ct.text}>+{amount} 🪙</Text>
    </Animated.View>
  );
}
const ct = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 80, alignSelf: 'center', backgroundColor: Colors.warningDark, borderRadius: Radii.full, paddingHorizontal: 20, paddingVertical: 10, zIndex: 200, ...Shadows.medium },
  text: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.white },
});

// ─── Sticky stats bar ─────────────────────────────────────────────────────────
function StatsBar({ state, color, onTapBank, onTapFund, onTapDebt }) {
  const monthsEmergency = state.income > 0
    ? (state.savingsBalance / (state.income / 3))
    : 0;
  const fundPct = Math.min(monthsEmergency / 3, 1);

  return (
    <View style={[sb.bar, { borderBottomColor: color + '30' }]}>
      {/* Bank */}
      <TouchableOpacity style={sb.chip} onPress={onTapBank} activeOpacity={0.7}>
        <Text style={sb.chipIcon}>🏦</Text>
        <View>
          <Text style={sb.chipLabel}>Bank</Text>
          <Text style={[sb.chipValue, { color }]}>{fmtK(state.bankBalance)}</Text>
        </View>
      </TouchableOpacity>

      <View style={sb.divider} />

      {/* Emergency fund */}
      <TouchableOpacity style={sb.chip} onPress={onTapFund} activeOpacity={0.7}>
        <Text style={sb.chipIcon}>🛡️</Text>
        <View>
          <Text style={sb.chipLabel}>Fund</Text>
          <View style={sb.fundRow}>
            <Text style={[sb.chipValue, { color: fundPct >= 1 ? Colors.successDark : Colors.warningDark }]}>
              {monthsEmergency.toFixed(1)}mo
            </Text>
            <View style={sb.fundTrack}>
              <View style={[sb.fundFill, { width: `${fundPct * 100}%`, backgroundColor: fundPct >= 1 ? Colors.successDark : color }]} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Debt — only show if > 0 */}
      {state.creditCardDebt > 0 && (
        <>
          <View style={sb.divider} />
          <TouchableOpacity style={sb.chip} onPress={onTapDebt} activeOpacity={0.7}>
            <Text style={sb.chipIcon}>💳</Text>
            <View>
              <Text style={sb.chipLabel}>Debt</Text>
              <Text style={[sb.chipValue, { color: Colors.danger }]}>{fmtK(state.creditCardDebt)}</Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
const sb = StyleSheet.create({
  bar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderBottomWidth: 1, ...Shadows.soft, zIndex: 50 },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  chipIcon:  { fontSize: 22 },
  chipLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipValue: { fontFamily: Fonts.extraBold, fontSize: 15 },
  divider:   { width: 1, height: 36, backgroundColor: Colors.border, marginHorizontal: 8 },
  fundRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fundTrack: { width: 36, height: 4, backgroundColor: Colors.lightGray, borderRadius: 2, overflow: 'hidden' },
  fundFill:  { height: 4, borderRadius: 2 },
});

// ─── Stats modal ──────────────────────────────────────────────────────────────
function StatsModal({ visible, onClose, state, color, type }) {
  if (!state) return null;
  const monthsEmergency = state.income > 0 ? (state.savingsBalance / (state.income / 3)) : 0;
  const interestCost    = state.creditCardDebt > 0 ? Math.round(state.creditCardDebt * 0.25 / 12) : 0;
  const fundTarget      = state.income * 3;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sm.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={sm.sheet}>
          <View style={[sm.handle, { backgroundColor: color }]} />
          {type === 'bank' && (
            <>
              <Text style={sm.title}>Bank Account</Text>
              <Row l="Monthly income"  v={fmt(state.income)} />
              <Row l="Fixed needs"     v={`- ${fmt(state.monthlyNeeds)}`} vc={Colors.danger} />
              <Row l="After needs"     v={fmt(state.income - state.monthlyNeeds)} bold />
              <View style={sm.divider} />
              <Row l="Current balance" v={fmt(state.bankBalance)} vc={color} bold />
              {state.creditCardDebt > 0 && <Row l="Debt interest this month" v={`- ${fmt(interestCost)}`} vc={Colors.danger} />}
            </>
          )}
          {type === 'fund' && (
            <>
              <Text style={sm.title}>Emergency Fund</Text>
              <Row l="Current fund"   v={fmt(state.savingsBalance)} />
              <Row l="Target (3 mo)"  v={fmt(fundTarget)} />
              <Row l="Progress"       v={`${monthsEmergency.toFixed(1)} / 3 months`} vc={monthsEmergency >= 3 ? Colors.successDark : Colors.warningDark} bold />
              <View style={sm.fundMeter}>
                <View style={[sm.fundFill, { width: `${Math.min(monthsEmergency / 3, 1) * 100}%`, backgroundColor: monthsEmergency >= 3 ? Colors.successDark : color }]} />
                <View style={[sm.marker, { left: '33%' }]} /><View style={[sm.marker, { left: '66%' }]} />
              </View>
              <Text style={sm.hint}>3 months of expenses protects you from job loss, medical emergencies, and unexpected repairs.</Text>
            </>
          )}
          {type === 'debt' && (
            <>
              <Text style={sm.title}>Credit Card Debt</Text>
              <Row l="Outstanding"     v={fmt(state.creditCardDebt)} vc={Colors.danger} bold />
              <Row l="Interest rate"   v="25% p.a." />
              <Row l="Monthly interest" v={fmt(interestCost)} vc={Colors.danger} />
              <Row l="Annual cost"     v={fmt(interestCost * 12)} vc={Colors.danger} />
              <Text style={sm.hint}>Every month you carry this balance, {fmt(interestCost)} disappears in interest. Paying it off is a guaranteed 25% return.</Text>
            </>
          )}
          <TouchableOpacity style={[sm.closeBtn, { backgroundColor: color }]} onPress={onClose}>
            <Text style={sm.closeBtnText}>Got it</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
function Row({ l, v, vc, bold }) {
  return (
    <View style={sm.row}>
      <Text style={sm.rowLabel}>{l}</Text>
      <Text style={[sm.rowValue, vc && { color: vc }, bold && { fontFamily: Fonts.bold }]}>{v}</Text>
    </View>
  );
}
const sm = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingTop: Spacing.md },
  handle:       { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  title:        { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary, marginBottom: Spacing.lg },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  rowLabel:     { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  rowValue:     { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary },
  divider:      { height: 8 },
  fundMeter:    { height: 12, backgroundColor: Colors.lightGray, borderRadius: 6, overflow: 'hidden', marginVertical: Spacing.md, position: 'relative' },
  fundFill:     { height: '100%', borderRadius: 6 },
  marker:       { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.15)' },
  hint:         { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, lineHeight: 20, marginTop: Spacing.md },
  closeBtn:     { borderRadius: Radii.lg, padding: 14, alignItems: 'center', marginTop: Spacing.xl },
  closeBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});

// ─── Allocation sliders ───────────────────────────────────────────────────────
function AllocationSliders({ income, allocation, onChange, color }) {
  const needs   = allocation.needs   ?? 50;
  const wants   = allocation.wants   ?? 30;
  const savings = allocation.savings ?? 20;
  const total   = needs + wants + savings;

  const updateClamped = (key, val) => {
    const others = total - allocation[key];
    const clamped = Math.max(0, Math.min(val, 100 - others));
    onChange({ ...allocation, [key]: clamped });
  };

  const categories = [
    { key: 'needs',   label: 'Needs',   icon: '🏠', color: MODULE_COLORS['module-1'].color, target: 50, value: needs },
    { key: 'wants',   label: 'Wants',   icon: '🎉', color: MODULE_COLORS['module-2'].color, target: 30, value: wants },
    { key: 'savings', label: 'Savings', icon: '💰', color: MODULE_COLORS['module-3'].color, target: 20, value: savings },
  ];

  return (
    <View style={al.wrap}>
      <View style={al.totalRow}>
        <Text style={al.totalLabel}>Allocate your income</Text>
        <Text style={[al.totalPct, { color: total === 100 ? Colors.successDark : Colors.warningDark }]}>
          {total}% {total === 100 ? '✓' : total > 100 ? '↑ over' : `(${100 - total}% free)`}
        </Text>
      </View>

      {categories.map(cat => {
        const dollarAmt = Math.round((cat.value / 100) * income);
        const atTarget  = cat.value === cat.target;
        return (
          <View key={cat.key} style={al.row}>
            <View style={al.rowHeader}>
              <View style={[al.iconCircle, { backgroundColor: cat.color + '20' }]}>
                <Text style={al.icon}>{cat.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={al.labelRow}>
                  <Text style={al.label}>{cat.label}</Text>
                  {atTarget && <View style={[al.targetPill, { backgroundColor: cat.color + '20' }]}><Text style={[al.targetText, { color: cat.color }]}>target</Text></View>}
                </View>
                <Text style={[al.dollar, { color: cat.color }]}>{fmt(dollarAmt)}/mo</Text>
              </View>
              <Text style={[al.pct, { color: cat.color }]}>{cat.value}%</Text>
            </View>
            <Slider
              style={al.slider}
              minimumValue={0}
              maximumValue={Math.max(cat.value, 100 - (total - cat.value))}
              step={1}
              value={cat.value}
              onValueChange={v => updateClamped(cat.key, Math.round(v))}
              minimumTrackTintColor={cat.color}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={cat.color}
            />
            {/* Target marker line */}
            <View style={al.targetLine}>
              <View style={[al.targetMarker, { left: `${cat.target}%`, backgroundColor: cat.color + '60' }]} />
              <Text style={[al.targetMarkerLabel, { left: `${cat.target}%`, color: cat.color }]}>
                {cat.target}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
const al = StyleSheet.create({
  wrap:              { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.soft },
  totalRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  totalLabel:        { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary },
  totalPct:          { fontFamily: Fonts.bold, fontSize: 14 },
  row:               { marginBottom: Spacing.md },
  rowHeader:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  iconCircle:        { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  icon:              { fontSize: 18 },
  labelRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label:             { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  targetPill:        { borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 2 },
  targetText:        { fontFamily: Fonts.bold, fontSize: 10 },
  dollar:            { fontFamily: Fonts.regular, fontSize: 12 },
  pct:               { fontFamily: Fonts.extraBold, fontSize: 18, minWidth: 42, textAlign: 'right' },
  slider:            { width: '100%', height: 36 },
  targetLine:        { position: 'relative', height: 16 },
  targetMarker:      { position: 'absolute', width: 2, height: 10, borderRadius: 1, top: 0 },
  targetMarkerLabel: { position: 'absolute', fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted, top: 8 },
});

// ─── Per-scenario interactive components ─────────────────────────────────────

// Month 2 — GrabFood delivery tracker
function DeliveryTracker({ income, onDataChange }) {
  const [deliveryDays, setDeliveryDays] = useState(5);
  const deliveryCost  = 18;
  const hawkerCost    = 5;
  const weeklyExtra   = deliveryDays * (deliveryCost - hawkerCost);
  const monthlyExtra  = weeklyExtra * 4;
  const pctOfWants    = income > 0 ? ((monthlyExtra / (income * 0.30)) * 100).toFixed(0) : 0;

  useEffect(() => { onDataChange({ deliveryDays, monthlyExtra }); }, [deliveryDays]);

  return (
    <View style={sc.card}>
      <Text style={sc.cardTitle}>🍜 Delivery vs Hawker — this week</Text>
      <Text style={sc.cardSub}>Drag to set how many evenings you ordered delivery</Text>
      <View style={sc.mealRow}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={[sc.mealDot, { backgroundColor: i < deliveryDays ? MODULE_COLORS['module-2'].color : Colors.successDark }]}>
            <Text style={sc.mealDotText}>{i < deliveryDays ? '📱' : '🍚'}</Text>
          </View>
        ))}
      </View>
      <Slider
        style={{ width: '100%', height: 36 }}
        minimumValue={0} maximumValue={7} step={1} value={deliveryDays}
        onValueChange={v => setDeliveryDays(Math.round(v))}
        minimumTrackTintColor={MODULE_COLORS['module-2'].color}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={MODULE_COLORS['module-2'].color}
      />
      <View style={sc.statGrid}>
        <View style={sc.statItem}>
          <Text style={sc.statVal}>{deliveryDays}×/week</Text>
          <Text style={sc.statLab}>delivery nights</Text>
        </View>
        <View style={sc.statItem}>
          <Text style={[sc.statVal, { color: Colors.danger }]}>{fmt(monthlyExtra)}</Text>
          <Text style={sc.statLab}>extra per month</Text>
        </View>
        <View style={sc.statItem}>
          <Text style={[sc.statVal, { color: Colors.danger }]}>{pctOfWants}%</Text>
          <Text style={sc.statLab}>of your Wants budget</Text>
        </View>
      </View>
    </View>
  );
}

// Month 3 — Market drop chart
function MarketDropChart({ color }) {
  const basePrice = 3.42;
  const data      = [3.42, 3.38, 3.51, 3.45, 3.29, 3.11, 2.91].map(v => parseFloat(v.toFixed(2)));
  const drop      = (((data[data.length - 1] - data[0]) / data[0]) * 100).toFixed(1);
  const invested  = 500;
  const paperLoss = Math.round(invested * Math.abs(parseFloat(drop)) / 100);

  return (
    <View style={sc.card}>
      <View style={sc.marketHeader}>
        <View>
          <Text style={sc.cardTitle}>📉 STI ETF — last 7 days</Text>
          <Text style={[sc.dropLabel, { color: Colors.danger }]}>{drop}% · Paper loss: {fmt(paperLoss)}</Text>
        </View>
        <View style={[sc.paperLossBadge]}>
          <Text style={sc.paperLossText}>NOT SOLD</Text>
        </View>
      </View>
      <LineChart
        data={{ labels: ['Mon','Tue','Wed','Thu','Fri','Mon','Tue'], datasets: [{ data }] }}
        width={SW - 80} height={120}
        chartConfig={{ backgroundColor: 'transparent', backgroundGradientFrom: Colors.white, backgroundGradientTo: Colors.white, decimalPlaces: 2, color: (o = 1) => Colors.danger, labelColor: () => Colors.textMuted, propsForDots: { r: '3', strokeWidth: '1.5', stroke: Colors.danger } }}
        bezier style={{ borderRadius: Radii.md }} withInnerLines={false} withOuterLines={false}
      />
      <Text style={sc.paperNote}>💡 A paper loss only becomes real when you sell. You have {fmt(invested)} invested.</Text>
    </View>
  );
}

// Month 4 — Ang bao allocation buckets
function AngBaoAllocator({ income, onDataChange }) {
  const windfall = Math.round(income * 0.15);
  const [debtPct, setDebtPct]   = useState(0);
  const [fundPct, setFundPct]   = useState(50);
  const [treatPct, setTreatPct] = useState(50);

  const debtAmt  = Math.round((debtPct  / 100) * windfall);
  const fundAmt  = Math.round((fundPct  / 100) * windfall);
  const treatAmt = Math.round((treatPct / 100) * windfall);
  const total    = debtPct + fundPct + treatPct;

  const updateDebt = (v) => {
    const d = Math.round(v);
    const rem = 100 - d;
    setDebtPct(d); setFundPct(Math.round(rem * 0.6)); setTreatPct(Math.round(rem * 0.4));
  };

  useEffect(() => { onDataChange({ debtPct, fundPct, treatPct, windfall }); }, [debtPct, fundPct, treatPct]);

  return (
    <View style={sc.card}>
      <Text style={sc.cardTitle}>🧧 Ang bao windfall: {fmt(windfall)}</Text>
      <Text style={sc.cardSub}>Drag to allocate your windfall — watch the buckets fill</Text>

      {[
        { label: 'Pay off debt 💳', pct: debtPct, amt: debtAmt, color: Colors.danger, onChange: updateDebt, ideal: true },
        { label: 'Emergency fund 🛡️', pct: fundPct, amt: fundAmt, color: MODULE_COLORS['module-3'].color },
        { label: 'Treat yourself 🎉',  pct: treatPct, amt: treatAmt, color: MODULE_COLORS['module-2'].color },
      ].map((b, i) => (
        <View key={i} style={sc.bucketRow}>
          <View style={sc.bucketLabelRow}>
            <Text style={sc.bucketLabel}>{b.label}</Text>
            <Text style={[sc.bucketAmt, { color: b.color }]}>{fmt(b.amt)}</Text>
          </View>
          <View style={sc.bucketTrack}>
            <View style={[sc.bucketFill, { width: `${b.pct}%`, backgroundColor: b.color }]} />
          </View>
          {i === 0 && (
            <Slider
              style={{ width: '100%', height: 32 }}
              minimumValue={0} maximumValue={100} step={5} value={debtPct}
              onValueChange={updateDebt}
              minimumTrackTintColor={b.color} maximumTrackTintColor={Colors.border} thumbTintColor={b.color}
            />
          )}
        </View>
      ))}
      <Text style={sc.bucketNote}>Tip: paying off 25% p.a. debt first is a guaranteed {((0.25 / 12) * 100 * 12).toFixed(0)}% annual return — better than any savings account.</Text>
    </View>
  );
}

// Month 5 — Rent hike lever selector
function RentHikeLever({ income, onDataChange }) {
  const rentHike    = Math.round(income * 0.05);
  const oldNeeds    = Math.round(income * 0.50);
  const newNeeds    = oldNeeds + rentHike;
  const newNeedsPct = Math.round((newNeeds / income) * 100);
  const [lever, setLever] = useState(null); // 'wants' | 'savings' | 'other'

  useEffect(() => { onDataChange({ lever, rentHike }); }, [lever]);

  const levers = [
    { id: 'wants',   label: 'Cut Wants',   icon: '✂️', description: `Reduce dining out and subscriptions by ${fmt(rentHike)}/mo`, color: MODULE_COLORS['module-2'].color, correct: true },
    { id: 'savings', label: 'Cut Savings', icon: '⚠️', description: `Reduce monthly savings contribution by ${fmt(rentHike)}/mo`, color: Colors.danger, correct: false },
    { id: 'other',   label: 'Find cheaper flat', icon: '🏠', description: 'Move to save money — calculate total cost first', color: Colors.textMuted, correct: false },
  ];

  return (
    <View style={sc.card}>
      <Text style={sc.cardTitle}>🏠 Rent hiked by {fmt(rentHike)}/month</Text>
      <View style={sc.needsMeter}>
        <View style={sc.needsMeterRow}>
          <Text style={sc.needsMeterLabel}>Needs</Text>
          <Text style={[sc.needsMeterPct, { color: newNeedsPct > 50 ? Colors.danger : Colors.successDark }]}>{newNeedsPct}% of income</Text>
        </View>
        <View style={sc.needsTrack}>
          <View style={[sc.needsFill, { width: `${Math.min(newNeedsPct, 100)}%`, backgroundColor: newNeedsPct > 55 ? Colors.danger : Colors.warningDark }]} />
          <View style={[sc.needsMarker, { left: '50%' }]} />
        </View>
        <Text style={sc.needsHint}>{fmt(oldNeeds)} → {fmt(newNeeds)}/mo · Target: 50% ({fmt(Math.round(income * 0.5))})</Text>
      </View>
      <Text style={sc.cardSub}>Which lever do you pull to rebalance?</Text>
      {levers.map(l => (
        <TouchableOpacity
          key={l.id}
          style={[sc.leverCard, lever === l.id && { borderColor: l.color, backgroundColor: l.color + '12' }]}
          onPress={() => setLever(l.id)}
          activeOpacity={0.75}
        >
          <Text style={sc.leverIcon}>{l.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[sc.leverLabel, lever === l.id && { color: l.color }]}>{l.label}</Text>
            <Text style={sc.leverDesc}>{l.description}</Text>
          </View>
          {lever === l.id && <Text style={{ color: l.color, fontSize: 18 }}>●</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Month 6 — Surplus jar allocator
function SurplusJars({ income, onDataChange }) {
  const surplus = Math.round(income * 0.08);
  const [spendPct, setSpendPct] = useState(40);
  const [savePct,  setSavePct]  = useState(40);
  const [investPct, setInvestPct] = useState(20);

  const spendAmt  = Math.round((spendPct  / 100) * surplus);
  const saveAmt   = Math.round((savePct   / 100) * surplus);
  const investAmt = Math.round((investPct / 100) * surplus);

  // 5-year projection for invest amount at 7% p.a.
  const futureValue = Math.round(investAmt * Math.pow(1.07, 5));

  const updateSpend = (v) => {
    const s = Math.round(v);
    const rem = 100 - s;
    setSpendPct(s); setSavePct(Math.round(rem * 0.6)); setInvestPct(Math.round(rem * 0.4));
  };

  useEffect(() => { onDataChange({ spendPct, savePct, investPct, surplus }); }, [spendPct, savePct, investPct]);

  const jars = [
    { label: 'Spend', icon: '🎉', pct: spendPct, amt: spendAmt, color: MODULE_COLORS['module-2'].color },
    { label: 'Save',  icon: '🛡️', pct: savePct,  amt: saveAmt,  color: MODULE_COLORS['module-3'].color },
    { label: 'Invest', icon: '📈', pct: investPct, amt: investAmt, color: MODULE_COLORS['module-4'].color },
  ];

  return (
    <View style={sc.card}>
      <Text style={sc.cardTitle}>✅ Month-end surplus: {fmt(surplus)}</Text>
      <Text style={sc.cardSub}>Drag to split — see what your investment grows to in 5 years</Text>
      <View style={sc.jarsRow}>
        {jars.map(j => (
          <View key={j.label} style={sc.jar}>
            <View style={sc.jarVisual}>
              <View style={[sc.jarFill, { height: `${j.pct}%`, backgroundColor: j.color }]} />
            </View>
            <Text style={sc.jarEmoji}>{j.icon}</Text>
            <Text style={[sc.jarPct, { color: j.color }]}>{j.pct}%</Text>
            <Text style={sc.jarAmt}>{fmt(j.amt)}</Text>
          </View>
        ))}
      </View>
      <Slider
        style={{ width: '100%', height: 36 }}
        minimumValue={0} maximumValue={100} step={5} value={spendPct}
        onValueChange={updateSpend}
        minimumTrackTintColor={MODULE_COLORS['module-2'].color}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={MODULE_COLORS['module-2'].color}
      />
      <Text style={sc.jarNote}>
        {fmt(investAmt)} invested today → <Text style={{ fontFamily: Fonts.bold, color: MODULE_COLORS['module-4'].color }}>{fmt(futureValue)}</Text> in 5 years at 7% p.a.
      </Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card:             { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.soft },
  cardTitle:        { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  cardSub:          { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.md },
  statGrid:         { flexDirection: 'row', gap: 8, marginTop: Spacing.sm },
  statItem:         { flex: 1, backgroundColor: Colors.lightGray, borderRadius: Radii.md, padding: Spacing.sm, alignItems: 'center' },
  statVal:          { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  statLab:          { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  mealRow:          { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  mealDot:          { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  mealDotText:      { fontSize: 18 },
  paperNote:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: Spacing.sm, lineHeight: 18 },
  marketHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  dropLabel:        { fontFamily: Fonts.bold, fontSize: 13 },
  paperLossBadge:   { backgroundColor: Colors.warningLight, borderRadius: Radii.sm, paddingHorizontal: 8, paddingVertical: 4 },
  paperLossText:    { fontFamily: Fonts.extraBold, fontSize: 10, color: Colors.warningDark, letterSpacing: 1 },
  bucketRow:        { marginBottom: Spacing.sm },
  bucketLabelRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bucketLabel:      { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  bucketAmt:        { fontFamily: Fonts.bold, fontSize: 13 },
  bucketTrack:      { height: 12, backgroundColor: Colors.lightGray, borderRadius: 6, overflow: 'hidden', marginBottom: 2 },
  bucketFill:       { height: '100%', borderRadius: 6 },
  bucketNote:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: Spacing.sm, lineHeight: 17 },
  needsMeter:       { marginBottom: Spacing.md },
  needsMeterRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  needsMeterLabel:  { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  needsMeterPct:    { fontFamily: Fonts.bold, fontSize: 13 },
  needsTrack:       { height: 12, backgroundColor: Colors.lightGray, borderRadius: 6, overflow: 'hidden', position: 'relative', marginBottom: 4 },
  needsFill:        { height: '100%', borderRadius: 6 },
  needsMarker:      { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.2)' },
  needsHint:        { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  leverCard:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.sm },
  leverIcon:        { fontSize: 24 },
  leverLabel:       { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  leverDesc:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  jarsRow:          { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  jar:              { flex: 1, alignItems: 'center' },
  jarVisual:        { width: 48, height: 80, backgroundColor: Colors.lightGray, borderRadius: Radii.md, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 6 },
  jarFill:          { width: '100%', borderRadius: Radii.sm },
  jarEmoji:         { fontSize: 20, marginBottom: 2 },
  jarPct:           { fontFamily: Fonts.bold, fontSize: 14 },
  jarAmt:           { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  jarNote:          { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
});

// ─── Fin chat bubble (no purple) ──────────────────────────────────────────────
function FinBubble({ text, loading }) {
  return (
    <View style={fb.wrap}>
      <Text style={fb.emoji}>{ADVISOR.emoji}</Text>
      <View style={fb.bubble}>
        {loading
          ? <View style={fb.row}><ActivityIndicator size="small" color={Colors.primary} /><Text style={fb.loading}>Fin is thinking…</Text></View>
          : <Text style={fb.text}>{text}</Text>
        }
      </View>
    </View>
  );
}
const fb = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: Spacing.md },
  emoji:   { fontSize: 26, marginTop: 2 },
  bubble:  { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.lg, borderTopLeftRadius: 4, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.soft },
  text:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loading: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
});

// ─── Option card ──────────────────────────────────────────────────────────────
function OptionCard({ option, selected, onSelect, revealed, color }) {
  const isChosen = selected === option.id;
  let bg = Colors.white, borderColor = Colors.border, borderWidth = 1;
  if (isChosen && !revealed)               { bg = color + '10'; borderColor = color; borderWidth = 2; }
  if (revealed && isChosen && option.is_correct)  { bg = Colors.successLight; borderColor = Colors.successDark; borderWidth = 2; }
  if (revealed && isChosen && !option.is_correct) { bg = Colors.dangerLight;  borderColor = Colors.danger;      borderWidth = 2; }

  return (
    <TouchableOpacity style={[oc.card, { backgroundColor: bg, borderColor, borderWidth }]} onPress={() => !revealed && onSelect(option.id)} activeOpacity={revealed ? 1 : 0.75}>
      <Text style={[oc.text, isChosen && !revealed && { color }]}>{option.text}</Text>
      {revealed && isChosen && (
        <View style={[oc.pill, { backgroundColor: option.is_correct ? Colors.successDark : Colors.danger }]}>
          <Text style={oc.pillText}>{option.bias_label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
const oc = StyleSheet.create({
  card:     { borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.sm },
  text:     { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
  pill:     { alignSelf: 'flex-start', borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 },
  pillText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.white },
});

// ═══════════════════════════════════════════════════════
// BUDGETING SIM SCREEN
// ═══════════════════════════════════════════════════════
function BudgetingSimScreen({ profile, setProfile, router }) {
  const config       = SIM_CONFIG.budgeting;
  const userFinCoins = profile?.finCoins ?? 0;
  const bracket      = getIncomeBracket(userFinCoins);

  // Phase: 'setup' | 'allocate' | 'scenario' | 'decision' | 'outcome' | 'finished'
  const [phase,          setPhase]          = useState('setup');
  const [month,          setMonth]          = useState(1);
  const [charState,      setCharState]      = useState(null);

  // Allocation (set each month before scenario)
  const [allocation, setAllocation] = useState({ needs: 50, wants: 30, savings: 20 });

  // Per-scenario interactive data
  const [scenarioData,   setScenarioData]   = useState({});

  // AI options
  const [aiOptions,      setAiOptions]      = useState(null);
  const [situationText,  setSituationText]  = useState('');
  const [finNudge,       setFinNudge]       = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Decision
  const [selectedOption, setSelectedOption] = useState(null);
  const [revealed,       setRevealed]       = useState(false);
  const [outcome,        setOutcome]        = useState(null);

  // Fin chat
  const [finInput,    setFinInput]    = useState('');
  const [finMessages, setFinMessages] = useState([]);
  const [loadingFin,  setLoadingFin]  = useState(false);
  const [showFinChat, setShowFinChat] = useState(false);

  // Stats modal
  const [statsModal,  setStatsModal]  = useState(null); // 'bank'|'fund'|'debt'|null

  // Toasts
  const [paycheckToast,  setPaycheckToast]  = useState(false);
  const [coinToastAmt,   setCoinToastAmt]   = useState(0);
  const [coinToastVis,   setCoinToastVis]   = useState(false);

  // Animated card entrance
  const scenarioAnim = useRef(new Animated.Value(60)).current;
  const scenarioOp   = useRef(new Animated.Value(0)).current;

  const choicesRef   = useRef([]);
  const scrollRef    = useRef(null);

  const currentEvent = MONTHLY_EVENTS[month - 1];
  const color        = config.color;

  // ── Start ──
  const startSim = () => {
    const initial = createInitialState(bracket.income, userFinCoins);
    setCharState({ ...initial, incomeLabel: bracket.label });
    choicesRef.current = [];
    setMonth(1);
    setPhase('allocate');
    // Animate paycheck arrival
    setTimeout(() => { setPaycheckToast(true); setTimeout(() => setPaycheckToast(false), 2000); }, 400);
  };

  // ── Lock allocation → trigger scenario ──
  const lockAllocation = () => {
    // Apply allocation to state immediately so the stats bar reflects it
    const savingsAmt = Math.round((allocation.savings / 100) * bracket.income);
    setCharState(prev => ({ ...prev, savingsRate: allocation.savings }));
    setPhase('scenario');
    // Animate scenario card in
    scenarioAnim.setValue(60);
    scenarioOp.setValue(0);
    Animated.parallel([
      Animated.spring(scenarioAnim, { toValue: 0, friction: 7, tension: 60, useNativeDriver: true }),
      Animated.timing(scenarioOp,   { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // ── Proceed to decision — load AI options ──
  const proceedToDecision = async () => {
    setPhase('decision');
    setAiOptions(null);
    setSelectedOption(null);
    setRevealed(false);
    setOutcome(null);
    setFinMessages([]);
    setShowFinChat(false);
    setLoadingOptions(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });

    const result = await simulateMonth(
      { ...charState, incomeLabel: bracket.label },
      month,
      currentEvent,
      choicesRef.current.map(c => ({ month: c.month, bias_label: c.bias_label, was_correct: c.is_correct }))
    );
    setLoadingOptions(false);

    if (!result?.options?.length) { setAiOptions([]); return; }
    setSituationText(result.situation_summary || '');
    setFinNudge(result.fin_nudge || '');
    setAiOptions(result.options);
  };

  // ── Confirm choice ──
  const confirmChoice = () => {
    if (!selectedOption || !aiOptions) return;
    const chosen = aiOptions.find(o => o.id === selectedOption);
    if (!chosen) return;

    const newState = computeNewState(charState, chosen, currentEvent);
    setCharState(newState);
    setRevealed(true);
    setOutcome({ option: chosen, newState });

    choicesRef.current.push({
      month,
      concept:    currentEvent.concept,
      bias_label: chosen.bias_label,
      is_correct: chosen.is_correct,
      coin_delta: chosen.coin_delta ?? 0,
    });

    // Award FinCoins for correct choice
    if (chosen.is_correct) {
      const coinAward = 15;
      setCoinToastAmt(coinAward);
      setCoinToastVis(true);
      setTimeout(() => setCoinToastVis(false), 2000);
      updateDoc(doc(db, 'users', auth.currentUser?.uid), { finCoins: increment(coinAward) }).catch(() => {});
      setProfile({ ...profile, finCoins: userFinCoins + coinAward });
    }

    setPhase('outcome');
  };

  // ── Next month ──
  const goNextMonth = () => {
    if (month >= config.months) { finishSim(); return; }
    const next = month + 1;
    setMonth(next);
    setAllocation({ needs: 50, wants: 30, savings: 20 });
    setScenarioData({});
    setPhase('allocate');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    // Paycheck animation each month
    setTimeout(() => { setPaycheckToast(true); setTimeout(() => setPaycheckToast(false), 2000); }, 300);
  };

  // ── Finish ──
  const finishSim = async () => {
    setPhase('finished');
    const correctCount = choicesRef.current.filter(c => c.is_correct).length;
    const bonus = correctCount >= 5 ? 50 : correctCount >= 4 ? 35 : correctCount >= 3 ? 20 : 10;
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { finCoins: increment(bonus + config.xpReward), xp: increment(config.xpReward) });
      setProfile({ ...profile, finCoins: userFinCoins + bonus + config.xpReward, xp: (profile?.xp || 0) + config.xpReward });
    }
    // Get insight report
    const result = await getSimInsight({
      income: bracket.income, income_label: bracket.label,
      start_balance: userFinCoins * 10, final_balance: charState?.bankBalance ?? 0,
      start_coins: userFinCoins, final_coins: userFinCoins + bonus,
      correct_count: correctCount, choices: choicesRef.current,
    });
    setOutcome({ finalCoins: userFinCoins + bonus, correctCount, bonus, report: result?.report ?? null });
  };

  // ── Ask Fin ──
  const sendFin = async () => {
    const q = finInput.trim();
    if (!q || loadingFin) return;
    setFinInput('');
    setFinMessages(p => [...p, { role: 'user', text: q }]);
    setLoadingFin(true);
    const r = await askFin(q, { ...charState, incomeLabel: bracket.label }, month, currentEvent, aiOptions || []);
    setFinMessages(p => [...p, { role: 'fin', text: r?.response || 'Unable to reach Fin.' }]);
    setLoadingFin(false);
  };

  // ─── SETUP ───────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backText}>← Back</Text></TouchableOpacity>
        <View style={[s.iconBadge, { backgroundColor: config.colorLight }]}><Text style={s.iconEmoji}>{config.icon}</Text></View>
        <Text style={s.title}>{config.title}</Text>
        <Text style={s.subtitle}>{config.description}</Text>

        <View style={[s.briefCard, { borderColor: color }]}>
          <Text style={s.briefLabel}>{ADVISOR.emoji} {ADVISOR.name} says</Text>
          <Text style={s.briefText}>
            {"You've just landed your first job. Based on your studies, you earn "}
            <Text style={[s.briefBold, { color }]}>{fmt(bracket.income)}/month</Text>
            {" — "}
            <Text style={[s.briefBold, { color }]}>{bracket.emoji} {bracket.label} level</Text>
            {". Study more lessons to unlock a higher income bracket.\n\nEach month you'll: set your budget, face a Singapore life event, then make a decision. Your bank balance, savings, and debt all carry forward."}
          </Text>
        </View>

        <View style={s.bracketCard}>
          <Text style={s.bracketTitle}>Income brackets</Text>
          {[
            { minCoins: 500, income: 3800, label: 'Mid-level exec', emoji: '💼' },
            { minCoins: 300, income: 2800, label: 'Fresh grad',     emoji: '🎓' },
            { minCoins: 150, income: 2000, label: 'Part-time',      emoji: '📚' },
            { minCoins:   0, income: 1200, label: 'Student',        emoji: '🌱' },
          ].map(b => (
            <View key={b.minCoins} style={[s.bracketRow, bracket.income === b.income && { backgroundColor: color + '10' }]}>
              <Text style={s.bracketEmoji}>{b.emoji}</Text>
              <Text style={s.bracketLabel}>{b.label}</Text>
              <Text style={[s.bracketIncome, bracket.income === b.income && { color }]}>{fmt(b.income)}/mo</Text>
              {bracket.income === b.income && <Text style={[s.bracketYou, { color }]}>← you</Text>}
            </View>
          ))}
        </View>

        <View style={s.infoCard}>
          <Text style={s.infoTitle}>What to expect</Text>
          <Text style={s.infoItem}>• 6 months of real Singapore financial life</Text>
          <Text style={s.infoItem}>• Set your budget with sliders each month</Text>
          <Text style={s.infoItem}>• A life event hits — interactive components to explore it</Text>
          <Text style={s.infoItem}>• AI-generated decisions based on YOUR exact numbers</Text>
          <Text style={s.infoItem}>• Ask Fin questions before committing</Text>
          <Text style={s.infoItem}>• Correct choices earn FinCoins. Consequences carry forward.</Text>
        </View>

        <TouchableOpacity style={[s.btn, { backgroundColor: color }]} onPress={startSim}>
          <Text style={s.btnText}>Start Simulation →</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ─── FINISHED ────────────────────────────────────────────────────────────
  if (phase === 'finished') {
    const correctCount = outcome?.correctCount ?? 0;
    const stars = correctCount >= 5 ? '⭐⭐⭐' : correctCount >= 4 ? '⭐⭐' : correctCount >= 3 ? '⭐' : '';
    const chartData = charState?.history ?? [];

    return (
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Simulation Complete! 🎉</Text>
        <Text style={s.subtitle}>{stars}  {correctCount}/6 correct decisions</Text>

        {chartData.length > 1 && (
          <LineChart
            data={{ labels: chartData.map((_, i) => `M${i + 1}`), datasets: [{ data: chartData }] }}
            width={SW - 32} height={180}
            chartConfig={{ backgroundColor: color, backgroundGradientFrom: color, backgroundGradientTo: color + 'CC', decimalPlaces: 0, color: (o = 1) => `rgba(255,255,255,${o})`, labelColor: (o = 1) => `rgba(255,255,255,${o})`, propsForDots: { r: '4', strokeWidth: '2', stroke: '#fff' } }}
            bezier style={s.chart}
          />
        )}

        <View style={s.reportCard}>
          <Text style={s.reportTitle}>Your Results</Text>
          <View style={s.reportRow}><Text style={s.reportLabel}>Income bracket</Text><Text style={s.reportValue}>{bracket.emoji} {bracket.label}</Text></View>
          <View style={s.reportRow}><Text style={s.reportLabel}>Correct choices</Text><Text style={[s.reportValue, { color }]}>{correctCount} of 6</Text></View>
          <View style={s.reportRow}><Text style={s.reportLabel}>Completion bonus</Text><Text style={[s.reportValue, { color: Colors.warningDark }]}>+{outcome?.bonus ?? 0} 🪙</Text></View>
          {charState && <View style={s.reportRow}><Text style={s.reportLabel}>Final bank balance</Text><Text style={s.reportValue}>{fmt(charState.bankBalance)}</Text></View>}
        </View>

        <View style={[s.insightCard, { borderColor: color }]}>
          <View style={s.insightHeader}>
            <Text style={s.insightEmoji}>{ADVISOR.emoji}</Text>
            <View><Text style={[s.insightTitle, { color }]}>Financial Insight Report</Text><Text style={s.insightSub}>{ADVISOR.name} · {ADVISOR.title}</Text></View>
          </View>
          {outcome?.report
            ? <Text style={s.insightText}>{outcome.report}</Text>
            : <View style={s.loadingRow}><ActivityIndicator color={color} size="small" /><Text style={s.loadingText}>Fin is writing your report…</Text></View>
          }
        </View>

        <TouchableOpacity style={[s.btn, { backgroundColor: color }]} onPress={() => router.replace('/(tabs)/simulate')}>
          <Text style={s.btnText}>Back to Simulation City</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ─── RUNNING PHASES ───────────────────────────────────────────────────────
  const progressPct = ((month - 1) / config.months) * 100;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1 }}>

        {/* ── Sticky stats bar ── */}
        {charState && (
          <StatsBar
            state={charState}
            color={color}
            onTapBank={() => setStatsModal('bank')}
            onTapFund={() => setStatsModal('fund')}
            onTapDebt={() => setStatsModal('debt')}
          />
        )}

        <ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Progress ── */}
          <View style={s.monthRow}>
            <Text style={s.monthLabel}>Month {month} of {config.months}</Text>
            <View style={[s.phasePill, { backgroundColor: color + '20' }]}>
              <Text style={[s.phaseText, { color }]}>
                {phase === 'allocate' ? '📊 Set budget' : phase === 'scenario' ? `${currentEvent?.icon} Event` : phase === 'decision' ? '🤔 Decide' : '✅ Outcome'}
              </Text>
            </View>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${progressPct}%`, backgroundColor: color }]} />
          </View>

          {/* ── ALLOCATE PHASE ── */}
          {phase === 'allocate' && (
            <>
              {/* Paycheck toast */}
              <View style={{ position: 'relative', height: 60, marginBottom: 8 }}>
                <FloatToast amount={bracket.income} visible={paycheckToast} color={Colors.successDark} />
                <View style={[s.paycheckBanner, { backgroundColor: color + '15', borderColor: color + '40' }]}>
                  <Text style={s.paycheckText}>💸  Paycheck arrived — {fmt(bracket.income)}</Text>
                </View>
              </View>

              <AllocationSliders income={bracket.income} allocation={allocation} onChange={setAllocation} color={color} />

              <TouchableOpacity
                style={[s.btn, { backgroundColor: (allocation.needs + allocation.wants + allocation.savings) === 100 ? color : Colors.border }]}
                onPress={(allocation.needs + allocation.wants + allocation.savings) === 100 ? lockAllocation : undefined}
              >
                <Text style={[s.btnText, (allocation.needs + allocation.wants + allocation.savings) !== 100 && { color: Colors.textMuted }]}>
                  {(allocation.needs + allocation.wants + allocation.savings) === 100 ? 'Lock in budget →' : 'Allocate exactly 100% to continue'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── SCENARIO PHASE ── */}
          {(phase === 'scenario' || phase === 'decision' || phase === 'outcome') && currentEvent && (
            <Animated.View style={{ transform: [{ translateY: scenarioAnim }], opacity: scenarioOp }}>
              <View style={[s.eventCard, { borderColor: color }]}>
                <View style={s.eventHeader}>
                  <Text style={s.eventIcon}>{currentEvent.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.eventTitle, { color }]}>{currentEvent.text}</Text>
                    <Text style={s.eventDetail}>{currentEvent.detail}</Text>
                  </View>
                </View>
                <View style={[s.conceptPill, { backgroundColor: color + '15' }]}>
                  <Text style={[s.conceptText, { color }]}>{currentEvent.concept}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Per-scenario interactive component ── */}
          {(phase === 'scenario' || phase === 'decision') && charState && (
            <>
              {currentEvent?.id === 'grabfood-creep' && (
                <DeliveryTracker income={bracket.income} onDataChange={d => setScenarioData(d)} />
              )}
              {currentEvent?.id === 'market-shock' && (
                <MarketDropChart color={color} />
              )}
              {currentEvent?.id === 'angbao' && (
                <AngBaoAllocator income={bracket.income} onDataChange={d => setScenarioData(d)} />
              )}
              {currentEvent?.id === 'rent-hike' && (
                <RentHikeLever income={bracket.income} onDataChange={d => setScenarioData(d)} />
              )}
              {currentEvent?.id === 'bonus-surplus' && (
                <SurplusJars income={bracket.income} onDataChange={d => setScenarioData(d)} />
              )}

              {phase === 'scenario' && (
                <TouchableOpacity style={[s.btn, { backgroundColor: color }]} onPress={proceedToDecision}>
                  <Text style={s.btnText}>See your options →</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ── DECISION PHASE ── */}
          {phase === 'decision' && (
            <>
              {loadingOptions && (
                <View style={s.loadingCard}>
                  <ActivityIndicator color={color} size="small" />
                  <Text style={s.loadingCardText}>Fin is assessing your situation…</Text>
                </View>
              )}

              {!loadingOptions && aiOptions?.length === 0 && (
                <View style={s.errorCard}>
                  <Text style={s.errorText}>Couldn't load options — check your connection.</Text>
                  <TouchableOpacity style={[s.btn, { backgroundColor: color }]} onPress={proceedToDecision}>
                    <Text style={s.btnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!loadingOptions && aiOptions && aiOptions.length > 0 && (
                <>
                  {situationText ? <Text style={s.situationText}>{situationText}</Text> : null}
                  {finNudge ? <FinBubble text={finNudge} /> : null}

                  <Text style={s.chooseLabel}>What do you do?</Text>
                  {aiOptions.map(opt => (
                    <OptionCard key={opt.id} option={opt} selected={selectedOption} onSelect={setSelectedOption} revealed={false} color={color} />
                  ))}

                  {selectedOption && (
                    <TouchableOpacity style={[s.btn, { backgroundColor: color }]} onPress={confirmChoice}>
                      <Text style={s.btnText}>Confirm →</Text>
                    </TouchableOpacity>
                  )}

                  {/* Ask Fin */}
                  <View style={s.askFinSection}>
                    <TouchableOpacity onPress={() => setShowFinChat(f => !f)} style={s.askFinToggle}>
                      <Text style={[s.askFinToggleText, { color }]}>{showFinChat ? 'Hide Fin ▲' : `Ask ${ADVISOR.name} a question ${ADVISOR.emoji}`}</Text>
                    </TouchableOpacity>
                    {showFinChat && (
                      <>
                        {finMessages.map((msg, i) => (
                          <View key={i}>
                            {msg.role === 'fin'
                              ? <FinBubble text={msg.text} />
                              : <View style={s.userBubble}><Text style={s.userBubbleText}>{msg.text}</Text></View>
                            }
                          </View>
                        ))}
                        {loadingFin && <FinBubble loading />}
                        <View style={s.finInputRow}>
                          <TextInput style={s.finInput} value={finInput} onChangeText={setFinInput} placeholder="Ask Fin anything..." placeholderTextColor={Colors.textMuted} returnKeyType="send" onSubmitEditing={sendFin} />
                          <TouchableOpacity style={[s.finSend, { backgroundColor: color }]} onPress={sendFin} disabled={!finInput.trim() || loadingFin}>
                            <Text style={s.finSendText}>↑</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                </>
              )}
            </>
          )}

          {/* ── OUTCOME PHASE ── */}
          {phase === 'outcome' && outcome && (
            <>
              <View style={[s.outcomeCard, { borderColor: outcome.option.is_correct ? Colors.successDark : Colors.danger, backgroundColor: outcome.option.is_correct ? Colors.successLight : Colors.dangerLight }]}>
                <Text style={[s.outcomeHeader, { color: outcome.option.is_correct ? Colors.successDark : Colors.danger }]}>
                  {outcome.option.is_correct ? '✓ Financially literate' : `✗ ${outcome.option.bias_label}`}
                </Text>
                <Text style={s.outcomeExplain}>{outcome.option.explanation}</Text>
                {outcome.option.is_correct && (
                  <View style={s.coinEarned}><Text style={s.coinEarnedText}>+15 🪙 earned</Text></View>
                )}
                {(outcome.option.savings_delta ?? 0) !== 0 && (
                  <Text style={s.stateChange}>Emergency fund: {fmt(outcome.newState.savingsBalance)}</Text>
                )}
                {outcome.newState.creditCardDebt > 0 && (
                  <Text style={[s.stateChange, { color: Colors.danger }]}>Debt: {fmt(outcome.newState.creditCardDebt)} (25% p.a. interest accruing)</Text>
                )}
              </View>

              <TouchableOpacity style={[s.btn, { backgroundColor: color }]} onPress={goNextMonth}>
                <Text style={s.btnText}>{month >= config.months ? 'See Results →' : `Month ${month + 1} →`}</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* ── Floating toasts ── */}
        <CoinToast amount={coinToastAmt} visible={coinToastVis} />
      </View>

      {/* ── Stats modals ── */}
      <StatsModal visible={!!statsModal} onClose={() => setStatsModal(null)} state={charState} color={color} type={statsModal} />
    </KeyboardAvoidingView>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN ROUTER — routes to budgeting sim or saving/investing
// ═══════════════════════════════════════════════════════
export default function SimulateMainScreen() {
  const router      = useRouter();
  const { simType = 'investing' } = useLocalSearchParams();
  const profile     = useUserStore(s => s.profile);
  const setProfile  = useUserStore(s => s.setProfile);

  if (simType === 'budgeting') {
    return <BudgetingSimScreen profile={profile} setProfile={setProfile} router={router} />;
  }

  // ── Saving / Investing (unchanged) ───────────────────────────────────────
  const config       = SIM_CONFIG[simType];
  const userFinCoins = profile?.finCoins ?? 0;
  const bracket      = getIncomeBracket(userFinCoins);
  const riskProfile  = profile?.riskProfile || 'balanced';
  const initialCoins = Math.min(userFinCoins, 500);

  const [phase,        setPhase]        = useState('setup');
  const [savingAlloc,  setSavingAlloc]  = useState({ basic: 40, hysa: 30, ssb: 20, cpf_oa: 10 });
  const [savingBal,    setSavingBal]    = useState(2000);
  const [savingHist,   setSavingHist]   = useState([]);
  const [investAlloc,  setInvestAlloc]  = useState({ ...RISK_PROFILES[riskProfile] });
  const [portfolio,    setPortfolio]    = useState(null);
  const [investHist,   setInvestHist]   = useState([]);
  const [siMonth,      setSiMonth]      = useState(1);
  const [siEvent,      setSiEvent]      = useState(null);
  const [siExplain,    setSiExplain]    = useState(null);
  const [insightReport, setInsight]     = useState(null);
  const siDecisions = useRef({});

  const updateSaving = (key, v) => setSavingAlloc(prev => {
    const others = Object.entries(prev).filter(([k]) => k !== key).reduce((s, [, x]) => s + x, 0);
    return { ...prev, [key]: Math.max(0, Math.min(v, 100 - others)) };
  });
  const updateInvest = (key, v) => setInvestAlloc(prev => {
    const others = Object.entries(prev).filter(([k]) => k !== key).reduce((s, [, x]) => s + x, 0);
    return { ...prev, [key]: Math.max(0, Math.min(v, 100 - others)) };
  });
  const savingTotal = Object.values(savingAlloc).reduce((a, b) => a + b, 0);
  const investTotal = Object.values(investAlloc).reduce((a, b) => a + b, 0);

  const startOther = () => {
    if (simType === 'saving') { setSavingHist([2000]); siDecisions.current = { allocation: { ...savingAlloc }, withdrawals: 0 }; }
    if (simType === 'investing') {
      const init = {}; ASSET_CLASSES.forEach(a => { init[a.id] = (initialCoins * investAlloc[a.id]) / 100; });
      setPortfolio(init); setInvestHist([initialCoins]);
      siDecisions.current = { riskProfile, allocation: { ...investAlloc } };
    }
    setSiMonth(1); setPhase('running');
  };

  const stepSaving = () => {
    const ev = SAVING_EVENTS[Math.floor(Math.random() * SAVING_EVENTS.length)];
    let bal  = savingBal;
    SAVING_ACCOUNTS.forEach(a => { const share = (savingAlloc[a.id] || 0) / 100; bal += savingBal * share * ((a.baseRate + a.bonusRate) / 12); });
    if (ev.effect.withdraw) { bal -= ev.effect.withdraw; siDecisions.current.withdrawals = (siDecisions.current.withdrawals || 0) + ev.effect.withdraw; }
    bal = Math.max(0, bal);
    setSavingBal(bal); setSavingHist(h => [...h, Math.round(bal)]);
    setSiEvent(ev.text); setSiExplain(ev.tip);
    if (siMonth >= config.months) finishOther({ finalBalance: Math.round(bal), startBalance: 2000 });
    else setSiMonth(m => m + 1);
  };

  const stepInvesting = () => {
    const ev = INVESTING_EVENTS[Math.floor(Math.random() * INVESTING_EVENTS.length)];
    const np = {}; let total = 0;
    ASSET_CLASSES.forEach(a => { const v = portfolio[a.id]; const ret = a.avgReturn / 12 + (Math.random() - 0.5) * a.volatility / 6 + (ev.effect[a.id] || 0) - (0.025 / 12); np[a.id] = v * (1 + ret); total += np[a.id]; });
    setPortfolio(np); setInvestHist(h => [...h, Math.round(total)]);
    const best = ASSET_CLASSES.reduce((b, a) => np[a.id] > np[b.id] ? a : b);
    const worst = ASSET_CLASSES.reduce((b, a) => np[a.id] < np[b.id] ? a : b);
    siDecisions.current.bestAsset = best.name; siDecisions.current.worstAsset = worst.name;
    setSiEvent(ev.text); setSiExplain(`Best: ${best.name} ${best.icon}  ·  Worst: ${worst.name} ${worst.icon}`);
    if (siMonth >= config.months) finishOther({ finalBalance: Math.round(total), startBalance: initialCoins, gainPct: (((total - initialCoins) / initialCoins) * 100).toFixed(1) });
    else setSiMonth(m => m + 1);
  };

  const finishOther = async (result) => {
    setPhase('finished');
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { finCoins: increment(config.fincoinReward ?? 100), xp: increment(config.xpReward) });
      setProfile({ ...profile, finCoins: userFinCoins + (config.fincoinReward ?? 100), xp: (profile?.xp || 0) + config.xpReward });
    }
    setInsight(result);
  };

  const chartArr = simType === 'investing' ? investHist : savingHist;
  const displayVal = simType === 'investing' && portfolio ? Object.values(portfolio).reduce((a, b) => a + b, 0) : savingBal;
  const progressPct = ((siMonth - 1) / config.months) * 100;
  const canStart = simType === 'saving' ? savingTotal <= 100 : investTotal === 100;

  if (phase === 'setup') return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <View style={[s.iconBadge, { backgroundColor: config.colorLight }]}><Text style={s.iconEmoji}>{config.icon}</Text></View>
      <Text style={s.title}>{config.title}</Text>
      <Text style={s.subtitle}>{config.description}</Text>
      {simType === 'saving' && (
        <>{SAVING_ACCOUNTS.map(acc => (<View key={acc.id}><AllocationSlider label={acc.name} icon={acc.icon} color={acc.color} value={savingAlloc[acc.id] || 0} onChange={v => updateSaving(acc.id, v)} total={savingTotal} /><Text style={s.rateHint}>{((acc.baseRate + acc.bonusRate) * 100).toFixed(2)}% p.a.</Text></View>))}<View style={s.totalRow}><Text style={s.totalLabel}>Total: {savingTotal}%</Text><Text style={[s.totalHint, savingTotal === 100 && { color: Colors.successDark }]}>{savingTotal === 100 ? '✓ Perfect' : `${100 - savingTotal}% unallocated`}</Text></View></>
      )}
      {simType === 'investing' && (
        <>{ASSET_CLASSES.map(a => <AllocationSlider key={a.id} label={a.name} icon={a.icon} color={a.color} value={investAlloc[a.id]} onChange={v => updateInvest(a.id, v)} total={investTotal} />)}<View style={s.totalRow}><Text style={[s.totalLabel, investTotal > 100 && { color: Colors.danger }]}>Total: {investTotal}%</Text><Text style={[s.totalHint, investTotal === 100 && { color: Colors.successDark }]}>{investTotal === 100 ? '✓ Perfect' : investTotal > 100 ? 'Over 100%' : `${100 - investTotal}% left`}</Text></View></>
      )}
      <TouchableOpacity style={[s.btn, { backgroundColor: canStart ? config.color : Colors.border }]} onPress={canStart ? startOther : undefined}><Text style={[s.btnText, !canStart && { color: Colors.textMuted }]}>{canStart ? 'Start →' : 'Set allocation to 100% first'}</Text></TouchableOpacity>
    </ScrollView>
  );

  if (phase === 'finished') return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Simulation Complete! 🎉</Text>
      {chartArr.length > 1 && <LineChart data={{ labels: chartArr.map((_, i) => i === 0 ? 'Start' : `M${i}`), datasets: [{ data: chartArr }] }} width={SW - 32} height={180} chartConfig={{ backgroundColor: config.color, backgroundGradientFrom: config.color, backgroundGradientTo: config.color + 'CC', decimalPlaces: 0, color: (o = 1) => `rgba(255,255,255,${o})`, labelColor: (o = 1) => `rgba(255,255,255,${o})` }} bezier style={s.chart} />}
      <View style={s.reportCard}>
        <Text style={s.reportTitle}>Results</Text>
        {insightReport && <><View style={s.reportRow}><Text style={s.reportLabel}>Starting balance</Text><Text style={s.reportValue}>{insightReport.startBalance} FinCoins</Text></View><View style={s.reportRow}><Text style={s.reportLabel}>Final balance</Text><Text style={s.reportValue}>{insightReport.finalBalance} FinCoins</Text></View>{simType === 'investing' && insightReport.gainPct && <Text style={[s.gainText, { color: parseFloat(insightReport.gainPct) >= 0 ? Colors.successDark : Colors.danger }]}>{parseFloat(insightReport.gainPct) >= 0 ? '▲' : '▼'} {insightReport.gainPct}%</Text>}</>}
      </View>
      <TouchableOpacity style={[s.btn, { backgroundColor: config.color }]} onPress={() => router.replace('/(tabs)/simulate')}><Text style={s.btnText}>Back to Simulation City</Text></TouchableOpacity>
    </ScrollView>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.monthRow}><Text style={s.monthLabel}>Month {siMonth} of {config.months}</Text></View>
      <View style={s.progressBg}><View style={[s.progressFill, { width: `${progressPct}%`, backgroundColor: config.color }]} /></View>
      <View style={[s.valueCard, { backgroundColor: config.color }]}><Text style={s.valueLabel}>{simType === 'investing' ? 'Portfolio Value' : 'Savings Balance'}</Text><Text style={s.valueAmount}>{Math.round(displayVal)} FinCoins</Text></View>
      {chartArr.length > 1 && <LineChart data={{ labels: chartArr.map((_, i) => i === 0 ? 'Start' : `M${i}`), datasets: [{ data: chartArr }] }} width={SW - 32} height={140} chartConfig={{ backgroundColor: config.color, backgroundGradientFrom: config.color, backgroundGradientTo: config.color + 'CC', decimalPlaces: 0, color: (o = 1) => `rgba(255,255,255,${o})`, labelColor: (o = 1) => `rgba(255,255,255,${o})` }} bezier style={s.chart} />}
      {siEvent && <View style={[s.eventCard, { borderColor: config.color }]}><Text style={[s.eventTitle, { color: config.color }]}>{siEvent}</Text></View>}
      {siExplain && <View style={s.explanationCard}><Text style={s.explanationText}>{siExplain}</Text></View>}
      {simType === 'investing' && portfolio && ASSET_CLASSES.map(a => <View key={a.id} style={s.assetRow}><View style={[s.assetDot, { backgroundColor: a.color }]} /><Text style={s.assetIcon}>{a.icon}</Text><View style={{ flex: 1 }}><Text style={s.assetName}>{a.name}</Text><Text style={s.assetVal}>{portfolio[a.id].toFixed(1)} FinCoins</Text></View><Text style={[s.assetPct, { color: a.color }]}>{investAlloc[a.id]}%</Text></View>)}
      {simType === 'saving' && SAVING_ACCOUNTS.map(acc => <View key={acc.id} style={s.assetRow}><View style={[s.assetDot, { backgroundColor: acc.color }]} /><Text style={s.assetIcon}>{acc.icon}</Text><View style={{ flex: 1 }}><Text style={s.assetName}>{acc.name}</Text><Text style={s.assetVal}>{((acc.baseRate + acc.bonusRate) * 100).toFixed(2)}% p.a.</Text></View><Text style={[s.assetPct, { color: acc.color }]}>{savingAlloc[acc.id] || 0}%</Text></View>)}
      <TouchableOpacity style={[s.btn, { backgroundColor: config.color, marginTop: Spacing.lg }]} onPress={simType === 'investing' ? stepInvesting : stepSaving}><Text style={s.btnText}>{siMonth < config.months ? `Simulate Month ${siMonth} →` : 'See Results →'}</Text></TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Shared allocation slider (saving + investing) ────────────────────────────
function AllocationSlider({ label, icon, color, value, onChange, total }) {
  return (
    <View style={[s.sliderRow, Shadows.soft]}>
      <View style={s.sliderTop}><Text style={{ fontSize: 20, marginRight: 8 }}>{icon}</Text><Text style={s.sliderLabel}>{label}</Text><View style={{ flex: 1 }} /><Text style={[s.sliderPct, { color }]}>{value}%</Text></View>
      <Slider style={{ width: '100%', height: 36 }} minimumValue={0} maximumValue={Math.max(value, 100 - (total - value))} step={1} value={value} onValueChange={v => onChange(Math.round(v))} minimumTrackTintColor={color} maximumTrackTintColor={Colors.border} thumbTintColor={color} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scroll:       { flex: 1, backgroundColor: Colors.background },
  content:      { padding: Spacing.lg, paddingTop: Spacing.xxxl },
  scrollContent:{ padding: Spacing.lg, paddingTop: Spacing.md },
  backBtn:      { marginBottom: Spacing.lg },
  backText:     { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.primary },
  iconBadge:    { width: 64, height: 64, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  iconEmoji:    { fontSize: 32 },
  title:        { fontSize: 26, fontFamily: Fonts.extraBold, color: Colors.textPrimary, marginBottom: 6 },
  subtitle:     { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textMuted, marginBottom: Spacing.lg, lineHeight: 22 },

  briefCard:    { borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: Colors.white },
  briefLabel:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  briefText:    { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 23 },
  briefBold:    { fontFamily: Fonts.bold },

  bracketCard:  { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.soft },
  bracketTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: Spacing.md },
  bracketRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: Radii.sm, marginBottom: 4 },
  bracketEmoji: { fontSize: 18, marginRight: 8, width: 24 },
  bracketLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1 },
  bracketIncome:{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  bracketYou:   { fontFamily: Fonts.bold, fontSize: 11, marginLeft: 8 },

  infoCard:     { backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.lg, marginBottom: Spacing.lg },
  infoTitle:    { fontSize: 15, fontFamily: Fonts.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  infoItem:     { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textSecondary, marginBottom: 4 },

  btn:          { padding: 16, borderRadius: Radii.lg, alignItems: 'center', marginBottom: 8 },
  btnText:      { fontSize: 15, fontFamily: Fonts.bold, color: Colors.white },

  paycheckBanner: { borderWidth: 1, borderRadius: Radii.md, padding: Spacing.md, alignItems: 'center', justifyContent: 'center', height: 50 },
  paycheckText:   { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary },

  monthRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  monthLabel:   { fontSize: 18, fontFamily: Fonts.bold, color: Colors.textPrimary },
  phasePill:    { borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 5 },
  phaseText:    { fontFamily: Fonts.bold, fontSize: 12 },
  progressBg:   { height: 6, backgroundColor: Colors.lightGray, borderRadius: 3, marginBottom: Spacing.lg, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  eventCard:    { borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.white, ...Shadows.soft },
  eventHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  eventIcon:    { fontSize: 32 },
  eventTitle:   { fontFamily: Fonts.bold, fontSize: 16, marginBottom: 4 },
  eventDetail:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  conceptPill:  { alignSelf: 'flex-start', borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 5 },
  conceptText:  { fontFamily: Fonts.bold, fontSize: 11 },

  loadingCard:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.lightGray, borderRadius: Radii.md, padding: Spacing.lg, marginBottom: Spacing.md },
  loadingCardText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  errorCard:       { backgroundColor: Colors.dangerLight, borderRadius: Radii.md, padding: Spacing.lg, marginBottom: Spacing.md },
  errorText:       { fontFamily: Fonts.regular, fontSize: 13, color: Colors.danger, marginBottom: Spacing.md },
  situationText:   { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginBottom: Spacing.md },
  chooseLabel:     { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary, marginBottom: Spacing.sm },

  askFinSection:    { borderTopWidth: 0.5, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.md },
  askFinToggle:     { alignSelf: 'flex-start', marginBottom: Spacing.sm },
  askFinToggleText: { fontFamily: Fonts.semiBold, fontSize: 13 },
  userBubble:       { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderRadius: Radii.lg, borderBottomRightRadius: 4, padding: Spacing.md, marginBottom: Spacing.sm, maxWidth: '80%' },
  userBubbleText:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.white },
  finInputRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.sm },
  finInput:         { flex: 1, backgroundColor: Colors.lightGray, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 10, fontFamily: Fonts.regular, fontSize: 13, color: Colors.textPrimary },
  finSend:          { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  finSendText:      { fontFamily: Fonts.bold, fontSize: 18, color: Colors.white },

  outcomeCard:      { borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  outcomeHeader:    { fontFamily: Fonts.bold, fontSize: 15, marginBottom: 8 },
  outcomeExplain:   { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 21, marginBottom: Spacing.sm },
  coinEarned:       { alignSelf: 'flex-start', backgroundColor: Colors.warningDark, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 6 },
  coinEarnedText:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.white },
  stateChange:      { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, marginTop: 4 },

  reportCard:   { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.soft },
  reportTitle:  { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.md },
  reportRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  reportLabel:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  reportValue:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  gainText:     { fontSize: 26, fontFamily: Fonts.extraBold, marginTop: 4 },
  chart:        { borderRadius: Radii.md, marginBottom: Spacing.md },
  insightCard:  { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1.5, ...Shadows.soft },
  insightHeader:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  insightEmoji: { fontSize: 32 },
  insightTitle: { fontSize: 15, fontFamily: Fonts.bold },
  insightSub:   { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted },
  insightText:  { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textSecondary, lineHeight: 23 },
  loadingRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 8 },
  loadingText:  { fontSize: 13, fontFamily: Fonts.regular, color: Colors.textMuted },

  sliderRow:    { backgroundColor: Colors.white, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.sm },
  sliderTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sliderLabel:  { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  sliderPct:    { fontFamily: Fonts.extraBold, fontSize: 16, minWidth: 38, textAlign: 'right' },
  rateHint:     { fontSize: 11, fontFamily: Fonts.regular, color: Colors.textMuted, marginTop: -4, marginBottom: Spacing.sm, paddingHorizontal: 4 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md, paddingHorizontal: 4 },
  totalLabel:   { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  totalHint:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  valueCard:    { borderRadius: Radii.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md, ...Shadows.medium },
  valueLabel:   { fontSize: 13, fontFamily: Fonts.regular, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  valueAmount:  { fontSize: 34, fontFamily: Fonts.extraBold, color: Colors.white },
  explanationCard: { backgroundColor: Colors.white, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  explanationText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  assetRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radii.sm, padding: Spacing.md, marginBottom: 6, ...Shadows.soft },
  assetDot:     { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  assetIcon:    { fontSize: 20, marginRight: 8 },
  assetName:    { fontSize: 13, fontFamily: Fonts.semiBold, color: Colors.textPrimary },
  assetVal:     { fontSize: 12, fontFamily: Fonts.regular, color: Colors.textMuted },
  assetPct:     { fontSize: 14, fontFamily: Fonts.bold },
});