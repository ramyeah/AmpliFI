// app/budget-tracker.js
//
// Persistent budget tracker — accessible after Stage 3 completes.
// Shows current month's transactions, budget depletion bars,
// and Fin's AI tip after every 3 transactions logged.
//
// Navigation: linked from app/(tabs)/simulate.js header

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useUserStore from '../store/userStore';
import { auth } from '../lib/firebase';
import { loadSimProgress } from '../lib/lifeSim';
import {
  addTransaction, getTransactions, deleteTransaction,
  getMonthlyTotalsFromList, currentMonthKey, CATEGORY_META,
} from '../lib/budgetTracker';
import { ragAsk } from '../lib/api';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../constants/theme';
import { BudgetBar, EntrySheet, TransactionRow } from '../components/BudgetTrackerComponents';
import { FinBubble } from '../components/LifeSimComponents';

const FIN_TIP_INTERVAL = 3; // Fin fires after every Nth transaction added this session

export default function BudgetTrackerScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const profile  = useUserStore(s => s.profile);
  const uid      = auth.currentUser?.uid;
  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  const [transactions,  setTransactions]  = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [showEntry,     setShowEntry]     = useState(false);

  // Fin tip state
  const [finTip,        setFinTip]        = useState(null);
  const [loadingTip,    setLoadingTip]    = useState(false);
  const sessionAddCount = useRef(0); // how many transactions added this session

  const month = currentMonthKey();

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!uid) return;
    try {
      const [txns, sim] = await Promise.all([
        getTransactions(uid, month),
        loadSimProgress(uid),
      ]);
      setTransactions(txns);
      setMonthlyBudget(sim?.monthlyBudget ?? null);
    } catch (e) {
      console.error('BudgetTracker loadData:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid, month]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // ── Derived totals ─────────────────────────────────────────────────────────
  const totals = getMonthlyTotalsFromList(transactions);

  // ── Add transaction ────────────────────────────────────────────────────────
  const handleAdd = async (txnData) => {
    setShowEntry(false);
    try {
      const newTxn = await addTransaction(uid, txnData);
      const updated = [newTxn, ...transactions];
      setTransactions(updated);
      sessionAddCount.current += 1;

      // Fire Fin tip after every 3rd transaction added this session
      if (sessionAddCount.current % FIN_TIP_INTERVAL === 0) {
        fireFintip(updated);
      }
    } catch (e) {
      console.error('BudgetTracker addTransaction:', e);
    }
  };

  // ── Fin tip ────────────────────────────────────────────────────────────────
  const fireFintip = async (allTxns) => {
    setFinTip(null);
    setLoadingTip(true);
    const recent   = allTxns.slice(0, 3);
    const newTotals = getMonthlyTotalsFromList(allTxns);

    try {
      const result = await ragAsk(
        'spending habits budget tracking Singapore student present bias',
        `You are Fin, a direct financial advisor. ${firstName} is tracking their spending this month.

Recent transactions logged:
${recent.map(t => `- ${t.merchant} (${t.subcategory}): $${t.amount.toFixed(2)} [${t.category}]`).join('\n')}

Month totals so far:
- Needs: $${newTotals.needs.toFixed(0)}${monthlyBudget ? ` of $${monthlyBudget.needsAmt} budgeted` : ''}
- Wants: $${newTotals.wants.toFixed(0)}${monthlyBudget ? ` of $${monthlyBudget.wantsAmt} budgeted` : ''}
- Savings: $${newTotals.savings.toFixed(0)}${monthlyBudget ? ` of $${monthlyBudget.savingsAmt} budgeted` : ''}

Give ONE short, specific observation (1-2 sentences) about their recent spending. 
Be direct and useful — reference what they actually just logged. 
Don't summarise, don't say "Great job tracking!" — say something genuinely insightful about the pattern or the specific transactions.`,
        { name: firstName }
      );
      setFinTip(result?.response ?? null);
    } catch {
      setFinTip(null);
    } finally {
      setLoadingTip(false);
    }
  };

  // ── Delete transaction ─────────────────────────────────────────────────────
  const handleDelete = async (txnId) => {
    try {
      await deleteTransaction(uid, txnId);
      setTransactions(prev => prev.filter(t => t.id !== txnId));
    } catch (e) {
      console.error('BudgetTracker delete:', e);
    }
  };

  // ── Group transactions by date ─────────────────────────────────────────────
  const grouped = transactions.reduce((acc, txn) => {
    const key = txn.date ?? 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(txn);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatGroupDate = (iso) => {
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const todayISO     = today.toISOString().split('T')[0];
    const yesterdayISO = yesterday.toISOString().split('T')[0];
    if (iso === todayISO)     return 'Today';
    if (iso === yesterdayISO) return 'Yesterday';
    const [y, m, d] = iso.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d} ${months[parseInt(m) - 1]}`;
  };

  // ── Month display ──────────────────────────────────────────────────────────
  const [y, m] = month.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthDisplay = `${months[parseInt(m) - 1]} ${y}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Budget Tracker</Text>
          <Text style={s.headerSub}>{monthDisplay}</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => setShowEntry(true)}
        >
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />
        ) : (
          <>
            {/* Budget bars */}
            <BudgetBar totals={totals} budget={monthlyBudget} />

            {/* Total spending chip */}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total spent this month</Text>
              <Text style={s.totalValue}>${totals.total.toFixed(2)}</Text>
            </View>

            {/* Fin tip (fires every 3 adds) */}
            {(loadingTip || finTip) && (
              <View style={s.finWrap}>
                <FinBubble
                  text={finTip ?? ''}
                  loading={loadingTip}
                  small
                />
                {finTip && (
                  <TouchableOpacity
                    style={s.dismissTip}
                    onPress={() => setFinTip(null)}
                  >
                    <Text style={s.dismissTipText}>Dismiss</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Transaction list */}
            {transactions.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📋</Text>
                <Text style={s.emptyTitle}>No transactions yet</Text>
                <Text style={s.emptySub}>
                  Tap "+ Add" to log your first transaction this month.
                </Text>
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => setShowEntry(true)}
                >
                  <Text style={s.emptyBtnText}>Log a transaction →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              sortedDates.map(dateKey => (
                <View key={dateKey}>
                  <Text style={s.dateHeader}>{formatGroupDate(dateKey)}</Text>
                  {grouped[dateKey].map(txn => (
                    <TransactionRow
                      key={txn.id}
                      txn={txn}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <EntrySheet
        visible={showEntry}
        onClose={() => setShowEntry(false)}
        onAdd={handleAdd}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, ...Shadows.soft },
  backBtn:      { marginRight: Spacing.md },
  backText:     { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.primary },
  headerTitle:  { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  headerSub:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  addBtn:       { marginLeft: 'auto', backgroundColor: Colors.primary, borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText:   { fontFamily: Fonts.bold, fontSize: 13, color: Colors.white },
  scroll:       { flex: 1 },
  content:      { padding: Spacing.lg, paddingTop: Spacing.md },

  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  totalLabel:   { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textMuted },
  totalValue:   { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary },

  finWrap:      { marginBottom: Spacing.md },
  dismissTip:   { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 4 },
  dismissTipText: { fontFamily: Fonts.semiBold, fontSize: 12, color: Colors.textMuted },

  dateHeader:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: Spacing.md },

  empty:        { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl },
  emptyIcon:    { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle:   { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textPrimary, marginBottom: 8 },
  emptySub:     { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: Spacing.lg },
  emptyBtn:     { backgroundColor: Colors.primary, borderRadius: Radii.lg, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
});