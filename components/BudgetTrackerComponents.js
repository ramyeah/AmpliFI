// components/BudgetTrackerComponents.js
//
// Shared components for the budget tracker.
//
// Exports:
//   BudgetBar       — three-bar depletion display (Needs / Wants / Savings)
//   EntrySheet      — bottom-sheet modal for adding a transaction
//   TransactionRow  — single transaction list item with swipe-to-delete

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Modal, ScrollView, Animated,
  Dimensions, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../constants/theme';
import { SUBCATEGORIES, CATEGORY_META } from '../lib/budgetTracker';

const { width: SW } = Dimensions.get('window');

// ─── Today's date as 'YYYY-MM-DD' ────────────────────────────────────────────
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDisplayDate = (iso) => {
  if (!iso) return 'Today';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
};

// ═══════════════════════════════════════════════════════
// BudgetBar
// Shows three horizontal bars (Needs / Wants / Savings)
// against the user's monthly budget allocations.
// Props:
//   totals   { needs, wants, savings }  — spent so far
//   budget   { needsAmt, wantsAmt, savingsAmt }  — from sim monthlyBudget
// ═══════════════════════════════════════════════════════
export function BudgetBar({ totals, budget }) {
  if (!budget) return null;

  const rows = [
    { key: 'needs',   label: 'Needs',   spent: totals.needs   ?? 0, budgeted: budget.needsAmt   ?? 0, ...CATEGORY_META.needs   },
    { key: 'wants',   label: 'Wants',   spent: totals.wants   ?? 0, budgeted: budget.wantsAmt   ?? 0, ...CATEGORY_META.wants   },
    { key: 'savings', label: 'Savings', spent: totals.savings ?? 0, budgeted: budget.savingsAmt ?? 0, ...CATEGORY_META.savings },
  ];

  return (
    <View style={bb.wrap}>
      <Text style={bb.title}>This month's budget</Text>
      {rows.map(row => {
        const pct      = row.budgeted > 0 ? Math.min(row.spent / row.budgeted, 1) : 0;
        const over     = row.spent > row.budgeted;
        const nearFull = pct >= 0.75 && !over;
        const barColor = over ? Colors.danger : nearFull ? Colors.warningDark : row.color;
        const remaining = Math.max(0, row.budgeted - row.spent);

        return (
          <View key={row.key} style={bb.row}>
            <View style={bb.labelRow}>
              <Text style={bb.icon}>{row.icon}</Text>
              <Text style={bb.label}>{row.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[bb.spent, { color: barColor }]}>
                ${row.spent.toFixed(0)}
              </Text>
              <Text style={bb.budget}> / ${row.budgeted.toFixed(0)}</Text>
            </View>
            <View style={bb.track}>
              <Animated.View
                style={[bb.fill, {
                  width: `${pct * 100}%`,
                  backgroundColor: barColor,
                }]}
              />
            </View>
            <Text style={[bb.remaining, { color: over ? Colors.danger : Colors.textMuted }]}>
              {over
                ? `$${(row.spent - row.budgeted).toFixed(0)} over budget`
                : `$${remaining.toFixed(0)} remaining`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const bb = StyleSheet.create({
  wrap:       { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  title:      { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: Spacing.md },
  row:        { marginBottom: Spacing.md },
  labelRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 4 },
  icon:       { fontSize: 14 },
  label:      { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  spent:      { fontFamily: Fonts.bold, fontSize: 13 },
  budget:     { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  track:      { height: 8, backgroundColor: Colors.lightGray, borderRadius: 4, overflow: 'hidden' },
  fill:       { height: 8, borderRadius: 4 },
  remaining:  { fontFamily: Fonts.regular, fontSize: 11, marginTop: 3 },
});

// ═══════════════════════════════════════════════════════
// TransactionRow
// Single transaction item. Long-press to reveal delete.
// Props:
//   txn       — transaction object
//   onDelete  — callback(txnId)
// ═══════════════════════════════════════════════════════
export function TransactionRow({ txn, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const meta = CATEGORY_META[txn.category] ?? CATEGORY_META.wants;

  return (
    <TouchableOpacity
      style={tr.row}
      onLongPress={() => setShowDelete(v => !v)}
      activeOpacity={0.85}
    >
      <View style={[tr.catDot, { backgroundColor: meta.colorLight }]}>
        <Text style={tr.catIcon}>{meta.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={tr.merchant}>{txn.merchant}</Text>
        <Text style={tr.sub}>{txn.subcategory}  ·  {formatDisplayDate(txn.date)}</Text>
      </View>
      <Text style={[tr.amount, { color: meta.color }]}>-${txn.amount.toFixed(2)}</Text>
      {showDelete && (
        <TouchableOpacity
          style={tr.deleteBtn}
          onPress={() => { setShowDelete(false); onDelete(txn.id); }}
        >
          <Text style={tr.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const tr = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radii.md, padding: Spacing.sm, marginBottom: 8, gap: 10, ...Shadows.soft },
  catDot:     { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catIcon:    { fontSize: 18 },
  merchant:   { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary },
  sub:        { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  amount:     { fontFamily: Fonts.extraBold, fontSize: 15 },
  deleteBtn:  { backgroundColor: Colors.dangerLight, borderRadius: Radii.sm, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 6 },
  deleteText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.danger },
});

// ═══════════════════════════════════════════════════════
// EntrySheet
// Bottom-sheet modal for adding a transaction.
// Props:
//   visible        bool
//   onClose        fn
//   onAdd          fn(txnData)  — called with validated transaction
//   defaultCategory string | null
// ═══════════════════════════════════════════════════════
export function EntrySheet({ visible, onClose, onAdd, defaultCategory = 'wants' }) {
  const slideAnim = useRef(new Animated.Value(400)).current;

  const [merchant,    setMerchant]    = useState('');
  const [date,        setDate]        = useState(todayISO());
  const [category,    setCategory]    = useState(defaultCategory);
  const [subcategory, setSubcategory] = useState('');
  const [amount,      setAmount]      = useState('');
  const [error,       setError]       = useState('');

  // Auto-select first subcategory when category changes
  useEffect(() => {
    setSubcategory(SUBCATEGORIES[category]?.[0] ?? '');
  }, [category]);

  // Slide animation
  useEffect(() => {
    if (visible) {
      setError('');
      Animated.spring(slideAnim, {
        toValue: 0, friction: 8, tension: 80, useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500, duration: 250, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleAdd = () => {
    if (!merchant.trim()) { setError('Enter a merchant name'); return; }
    const amt = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!amt || amt <= 0)  { setError('Enter a valid amount'); return; }
    if (!subcategory)      { setError('Pick a subcategory'); return; }
    setError('');
    onAdd({ merchant: merchant.trim(), date, category, subcategory, amount: amt });
    // Reset
    setMerchant(''); setAmount(''); setDate(todayISO());
    setCategory(defaultCategory);
  };

  const CATS = [
    { id: 'needs',   ...CATEGORY_META.needs   },
    { id: 'wants',   ...CATEGORY_META.wants   },
    { id: 'savings', ...CATEGORY_META.savings },
  ];

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={es.backdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[es.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={es.handle} />
          <Text style={es.sheetTitle}>Add Transaction</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Merchant */}
            <Text style={es.fieldLabel}>Merchant / Description</Text>
            <TextInput
              style={es.input}
              placeholder="e.g. GrabFood, NTUC FairPrice, Spotify"
              placeholderTextColor={Colors.textMuted}
              value={merchant}
              onChangeText={setMerchant}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/* Date */}
            <Text style={es.fieldLabel}>Date</Text>
            <TextInput
              style={es.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
              value={date}
              onChangeText={setDate}
              keyboardType="numbers-and-punctuation"
              returnKeyType="next"
            />
            <Text style={es.dateHint}>Today: {formatDisplayDate(todayISO())}</Text>

            {/* Category */}
            <Text style={es.fieldLabel}>Category</Text>
            <View style={es.catRow}>
              {CATS.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[es.catPill, category === cat.id && {
                    backgroundColor: cat.color, borderColor: cat.color,
                  }]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.75}
                >
                  <Text style={es.catPillIcon}>{cat.icon}</Text>
                  <Text style={[es.catPillText, category === cat.id && { color: Colors.white }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subcategory */}
            <Text style={es.fieldLabel}>Subcategory</Text>
            <View style={es.subRow}>
              {(SUBCATEGORIES[category] ?? []).map(sub => (
                <TouchableOpacity
                  key={sub}
                  style={[es.subChip, subcategory === sub && {
                    backgroundColor: CATEGORY_META[category].colorLight,
                    borderColor: CATEGORY_META[category].color,
                  }]}
                  onPress={() => setSubcategory(sub)}
                  activeOpacity={0.75}
                >
                  <Text style={[es.subChipText, subcategory === sub && {
                    color: CATEGORY_META[category].color, fontFamily: Fonts.bold,
                  }]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text style={es.fieldLabel}>Amount (SGD)</Text>
            <View style={es.amountRow}>
              <Text style={es.amountPrefix}>$</Text>
              <TextInput
                style={[es.input, { flex: 1 }]}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>

            {/* Error */}
            {!!error && <Text style={es.error}>{error}</Text>}

            {/* Add button */}
            <TouchableOpacity
              style={[es.addBtn, { backgroundColor: CATEGORY_META[category].color }]}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Text style={es.addBtnText}>Add transaction →</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const es = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:        { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingTop: Spacing.sm, maxHeight: '90%' },
  handle:       { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  sheetTitle:   { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary, marginBottom: Spacing.lg },
  fieldLabel:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6, marginTop: Spacing.sm },
  input:        { backgroundColor: Colors.lightGray, borderRadius: Radii.md, padding: Spacing.md, fontFamily: Fonts.regular, fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  dateHint:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: Spacing.sm },
  catRow:       { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  catPill:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.full, paddingVertical: 10, backgroundColor: Colors.white },
  catPillIcon:  { fontSize: 16 },
  catPillText:  { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  subRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  subChip:      { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.white },
  subChipText:  { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary },
  amountRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amountPrefix: { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textMuted },
  error:        { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.danger, marginBottom: Spacing.sm },
  addBtn:       { borderRadius: Radii.lg, paddingVertical: 15, alignItems: 'center', marginTop: Spacing.md },
  addBtnText:   { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});