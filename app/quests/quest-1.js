// app/quests/quest-1.js
// Quest 1 — Know Your Number
// Self-contained modal quest. Props: visible, onComplete, onClose, income.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, Alert, ActivityIndicator, Image,
  StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../lib/firebase';
import { saveSimProgress, completeStage, queueFinCoins } from '../../lib/lifeSim';
import { Colors, Fonts, Radii, Shadows, Spacing, MODULE_COLORS } from '../../constants/theme';

const { width: SW } = Dimensions.get('window');
const COIN = require('../../assets/coin.png');

// ─── Data ───────────────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  { id: 'housing',    icon: '\uD83C\uDFE0', label: 'Housing',       tiers: [{ label: 'Low', amount: 600, desc: 'HDB rental room' }, { label: 'Mid', amount: 1200, desc: 'Studio apartment' }, { label: 'High', amount: 2500, desc: 'Private condo' }], defaultTier: 1 },
  { id: 'food',       icon: '\uD83C\uDF71', label: 'Food & Dining', tiers: [{ label: 'Low', amount: 300, desc: 'Hawker centres' }, { label: 'Mid', amount: 500, desc: 'Mix of hawker + cafes' }, { label: 'High', amount: 900, desc: 'Restaurants regularly' }], defaultTier: 1 },
  { id: 'transport',  icon: '\uD83D\uDE87', label: 'Transport',     tiers: [{ label: 'Low', amount: 80, desc: 'MRT & bus only' }, { label: 'Mid', amount: 200, desc: 'Public + occasional Grab' }, { label: 'High', amount: 600, desc: 'Own car or frequent taxis' }], defaultTier: 1 },
  { id: 'travel',     icon: '\u2708\uFE0F', label: 'Travel',        tiers: [{ label: 'Low', amount: 0, desc: 'Local trips only' }, { label: 'Mid', amount: 300, desc: '1\u20132 trips/year' }, { label: 'High', amount: 800, desc: 'Frequent travel' }], defaultTier: 1 },
  { id: 'healthcare', icon: '\uD83D\uDC8A', label: 'Healthcare',    tiers: [{ label: 'Low', amount: 50, desc: 'Polyclinic visits' }, { label: 'Mid', amount: 150, desc: 'GP + basic insurance' }, { label: 'High', amount: 400, desc: 'Private specialists' }], defaultTier: 1 },
  { id: 'lifestyle',  icon: '\uD83C\uDFAD', label: 'Lifestyle',     tiers: [{ label: 'Low', amount: 100, desc: 'Simple hobbies' }, { label: 'Mid', amount: 300, desc: 'Entertainment + dining' }, { label: 'High', amount: 700, desc: 'Golf, concerts, memberships' }], defaultTier: 1 },
];

const AGE_OPTIONS = [35, 40, 45, 50, 55, 60, 65];

// ─── Component ──────────────────────────────────────────────────────────────
export default function Quest1({ visible, onComplete, onClose, income = 4500 }) {
  const insets    = useSafeAreaInsets();
  const countAnim = useRef(new Animated.Value(0)).current;

  const [step, setStep]               = useState(1);
  const [tiers, setTiers]             = useState(Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.id, c.defaultTier])));
  const [retirementAge, setAge]       = useState(null);
  const [saving, setSaving]           = useState(false);
  const [displayedFI, setDisplayedFI] = useState(0);

  // ── Derived ─────────────────────────────────────────────────────────────
  const monthlyTotal  = EXPENSE_CATEGORIES.reduce((sum, c) => sum + c.tiers[tiers[c.id]].amount, 0);
  const annualTotal   = monthlyTotal * 12;
  const fiNumber      = annualTotal * 25;
  const currentAge    = 23;
  const yearsToRetire = retirementAge ? retirementAge - currentAge : null;
  const r             = 0.07 / 12;
  const n             = yearsToRetire ? yearsToRetire * 12 : 1;
  const monthlyNeeded = yearsToRetire ? Math.round((fiNumber * r) / (Math.pow(1 + r, n) - 1)) : null;

  const getFinVerdict = () => {
    if (!monthlyNeeded || !yearsToRetire) return null;
    if (monthlyNeeded < 500)
      return { emoji: '\uD83D\uDFE2', label: 'Very Achievable', color: Colors.successDark, text: `At \uD83E\uDE99${monthlyNeeded.toLocaleString()}/month, you'd barely notice it leaving your account. Compounding will do the heavy lifting over ${yearsToRetire} years.` };
    if (monthlyNeeded < 1200)
      return { emoji: '\uD83D\uDFE2', label: 'Achievable', color: Colors.successDark, text: `\uD83E\uDE99${monthlyNeeded.toLocaleString()}/month is realistic on a grad salary. Start small, increase as your income grows \u2014 you'll get there in ${yearsToRetire} years.` };
    if (monthlyNeeded < 2500)
      return { emoji: '\uD83D\uDFE1', label: 'Challenging', color: Colors.warningDark, text: `\uD83E\uDE99${monthlyNeeded.toLocaleString()}/month is a stretch on an entry salary \u2014 but very doable as your career grows. Consider a later retirement age if the number feels tight.` };
    return { emoji: '\uD83D\uDD34', label: 'Very Difficult', color: Colors.danger, text: `\uD83E\uDE99${monthlyNeeded.toLocaleString()}/month would be tough to sustain. Try a later retirement age or reduce your monthly expenses \u2014 small changes have a big impact over time.` };
  };

  // ── Reset on open ───────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep(1); setAge(null); setDisplayedFI(0); setSaving(false);
      countAnim.setValue(0);
      setTiers(Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.id, c.defaultTier])));
    }
  }, [visible]);

  // ── Count-up on step 3 ─────────────────────────────────────────────────
  useEffect(() => {
    if (step === 3) {
      countAnim.setValue(0); setDisplayedFI(0);
      const id = countAnim.addListener(({ value }) => setDisplayedFI(Math.round(value)));
      Animated.timing(countAnim, { toValue: fiNumber, duration: 1400, useNativeDriver: false }).start();
      return () => countAnim.removeListener(id);
    }
  }, [step]);

  const handleClose = () => {
    if (step < 5) Alert.alert('Leave this quest?', 'Your progress here will be lost.', [{ text: 'Keep going', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: onClose }]);
    else onClose();
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      await saveSimProgress(uid, {
        ffn: fiNumber, ffnAge: retirementAge, monthlyRetirementIncome: monthlyTotal,
        stage1Data: { ffn: fiNumber, ffnAge: retirementAge, monthlyTotal, annualTotal, monthlyNeeded,
          expenses: EXPENSE_CATEGORIES.map(c => ({ id: c.id, label: c.label, amount: c.tiers[tiers[c.id]].amount })),
        },
      });
      await completeStage(uid, 'stage-1', { ffn: fiNumber, ffnAge: retirementAge });
      await queueFinCoins(uid, 15);
      onComplete();
    } catch (e) {
      Alert.alert('Something went wrong', 'Please try again.');
      setSaving(false);
    }
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 ? (
          <TouchableOpacity style={st.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={st.backBtnText}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 1 · Know Your Number'}</Text>
      <View style={st.stepPills}>{[1,2,3,4,5].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  // ── Fin card helper ─────────────────────────────────────────────────────
  const FinCard = ({ children }) => (
    <View style={st.finCard}>
      <View style={st.finCardTop}>
        <View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View>
        <Text style={st.finCardLabel}>FIN SAYS</Text>
      </View>
      <Text style={st.finCardText}>{children}</Text>
    </View>
  );

  // ── Step 1 — What is a FI Number? ──────────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>What is a{'\n'}FI Number?</Text>
        <Text style={st.infoText}>
          Financial Independence means having enough invested that you never <Text style={st.bold}>have</Text> to work again.
        </Text>
        <Text style={st.infoText}>
          Your FI Number is the exact portfolio value that makes this possible. Once you hit it, your investments generate enough income to live on {'\u2014'} forever.
        </Text>
        <View style={st.explainerCard}>
          <Text style={st.explainerTitle}>How it works</Text>
          {[{ icon: '\uD83D\uDCB0', text: 'Figure out your monthly expenses' }, { icon: '\uD83D\uDCD0', text: "Apply the 4% rule (we'll explain this)" }, { icon: '\uD83C\uDFAF', text: "That's your FI Number" }].map((row, i) => (
            <View key={i} style={st.explainerRow}><Text style={st.explainerIcon}>{row.icon}</Text><Text style={st.explainerText}>{row.text}</Text></View>
          ))}
        </View>
      </ScrollView>
      <View style={[st.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Let's figure out my expenses \u2192"}</Text></TouchableOpacity>
      </View>
    </>
  );

  // ── Step 2 — Build expenses ────────────────────────────────────────────
  const renderStep2 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>What does your{'\n'}retired life cost?</Text>
        <Text style={st.questSub}>Tap Low, Mid, or High for each category.</Text>
        {EXPENSE_CATEGORIES.map(cat => (
          <View key={cat.id} style={st.categoryCard}>
            <View style={st.categoryHeader}>
              <Text style={st.categoryIcon}>{cat.icon}</Text>
              <Text style={st.categoryLabel}>{cat.label}</Text>
              <View style={st.categorySelectedAmt}><Image source={COIN} style={{ width: 12, height: 12 }} /><Text style={st.categorySelectedAmtText}>{cat.tiers[tiers[cat.id]].amount.toLocaleString()}</Text></View>
            </View>
            <View style={st.tierRow}>
              {cat.tiers.map((tier, i) => (
                <TouchableOpacity key={i} style={[st.tierPill, tiers[cat.id] === i && st.tierPillActive]} onPress={() => setTiers(t => ({ ...t, [cat.id]: i }))} activeOpacity={0.8}>
                  <Text style={[st.tierPillText, tiers[cat.id] === i && st.tierPillTextActive]}>{tier.label}</Text>
                  <Text style={[st.tierPillAmt, tiers[cat.id] === i && st.tierPillAmtActive]}>{'\uD83E\uDE99'}{tier.amount >= 1000 ? `${(tier.amount/1000).toFixed(1)}k` : tier.amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={[st.totalBar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={st.totalBarLabel}>Monthly expenses</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Image source={COIN} style={{ width: 18, height: 18 }} /><Text style={st.totalBarValue}>{monthlyTotal.toLocaleString()}</Text></View>
        </View>
        <TouchableOpacity style={st.ctaBtnSmall} onPress={() => setStep(3)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Looks right \u2192"}</Text></TouchableOpacity>
      </View>
    </>
  );

  // ── Step 3 — 4% Rule + FI Number ──────────────────────────────────────
  const renderStep3 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>The 4% Rule</Text>
        <Text style={st.infoText}>
          If you invest enough, your portfolio grows ~7% per year. You can safely withdraw 4% annually {'\u2014'} forever {'\u2014'} without running out.
        </Text>
        <Text style={st.infoText}>
          This means your FI Number is simply your annual expenses {'\u00D7'} 25. It's called the 4% rule.
        </Text>
        <View style={st.calcCard}>
          <Text style={st.calcCardTitle}>Your calculation</Text>
          <View style={st.calcRow}><Text style={st.calcLabel}>Monthly expenses</Text><View style={st.calcValueRow}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={st.calcValue}>{monthlyTotal.toLocaleString()}</Text></View></View>
          <View style={st.calcRow}><Text style={st.calcLabel}>{'\u00D7'} 12 months</Text><View style={st.calcValueRow}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={st.calcValue}>{annualTotal.toLocaleString()}/yr</Text></View></View>
          <View style={st.calcRow}><Text style={st.calcLabel}>{'\u00D7'} 25 (4% rule)</Text><Text style={st.calcLabel}>= FI Number</Text></View>
          <View style={st.calcDivider} />
          <View style={st.calcHeroRow}><Image source={COIN} style={{ width: 24, height: 24 }} /><Text style={st.calcHeroNumber}>{displayedFI.toLocaleString()}</Text></View>
        </View>
      </ScrollView>
      <View style={[st.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(4)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Now pick my retirement age \u2192"}</Text></TouchableOpacity>
      </View>
    </>
  );

  // ── Step 4 — Retirement age ────────────────────────────────────────────
  const renderStep4 = () => {
    const verdict = getFinVerdict();
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>When do you want{'\n'}to retire?</Text>
          <Text style={st.questSub}>Your FI Number is {'\uD83E\uDE99'}{fiNumber.toLocaleString()}. When do you want to reach it?</Text>
          <View style={st.ageGrid}>
            {AGE_OPTIONS.map(age => (
              <TouchableOpacity key={age} style={[st.agePill, retirementAge === age && st.agePillSelected]} onPress={() => setAge(age)} activeOpacity={0.82}>
                <Text style={[st.ageText, retirementAge === age && st.ageTextSelected]}>{age}</Text>
                {retirementAge === age && <Text style={st.ageYears}>{age - currentAge}yr</Text>}
              </TouchableOpacity>
            ))}
          </View>
          {verdict && retirementAge && (
            <View style={[st.verdictCard, { borderLeftColor: verdict.color }]}>
              <View style={st.verdictHeader}><Text style={st.verdictEmoji}>{verdict.emoji}</Text><Text style={[st.verdictLabel, { color: verdict.color }]}>{verdict.label}</Text></View>
              <FinCard>{verdict.text}</FinCard>
              <View style={st.verdictStat}><Text style={st.verdictStatLabel}>Monthly investment needed</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN} style={{ width: 14, height: 14 }} /><Text style={[st.verdictStatValue, { color: verdict.color }]}>{monthlyNeeded?.toLocaleString()}</Text></View></View>
            </View>
          )}
        </ScrollView>
        <View style={[st.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={[st.ctaBtn, !retirementAge && st.ctaBtnDisabled]} onPress={() => retirementAge && setStep(5)} activeOpacity={retirementAge ? 0.88 : 1}><Text style={st.ctaBtnText}>{"See my summary \u2192"}</Text></TouchableOpacity>
        </View>
      </>
    );
  };

  // ── Step 5 — Summary ──────────────────────────────────────────────────
  const renderStep5 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>Your FI Number</Text>
        <Text style={st.questSub}>Here's everything you've worked out.</Text>

        <View style={st.summaryCard}>
          <Text style={st.summaryCardTitle}>Monthly Expenses</Text>
          {EXPENSE_CATEGORIES.map(cat => (
            <View key={cat.id} style={st.summaryRow}><Text style={st.summaryRowIcon}>{cat.icon}</Text><Text style={st.summaryRowLabel}>{cat.label}</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN} style={{ width: 11, height: 11 }} /><Text style={st.summaryRowValue}>{cat.tiers[tiers[cat.id]].amount.toLocaleString()}</Text></View></View>
          ))}
          <View style={st.summaryDivider} />
          <View style={st.summaryRow}><Text style={[st.summaryRowLabel, st.bold]}>Monthly total</Text><View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={[st.summaryRowValue, st.bold]}>{monthlyTotal.toLocaleString()}</Text></View></View>
        </View>

        <View style={st.fiHeroCard}>
          <Text style={st.fiHeroLabel}>YOUR FI NUMBER</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}><Image source={COIN} style={{ width: 28, height: 28 }} /><Text style={st.fiHeroNumber}>{fiNumber.toLocaleString()}</Text></View>
        </View>

        <View style={st.summaryCard}>
          <Text style={st.summaryCardTitle}>Your Timeline</Text>
          {[{ label: 'Target retirement age', value: `${retirementAge}` }, { label: 'Years to retirement', value: `${yearsToRetire} years` }, { label: 'Monthly investment', value: `\uD83E\uDE99${monthlyNeeded?.toLocaleString()}` }].map((row, i) => (
            <View key={i} style={st.summaryRow}><Text style={st.summaryRowLabel}>{row.label}</Text><Text style={[st.summaryRowValue, { color: Colors.primary }]}>{row.value}</Text></View>
          ))}
        </View>

        <FinCard>{"Invest \uD83E\uDE99"}{monthlyNeeded?.toLocaleString()}{" every month and you'll never have to worry about money again. That's the goal. Everything else in this simulation builds toward this number."}</FinCard>

        <View style={st.rewardRow}><Image source={COIN} style={{ width: 16, height: 16 }} /><Text style={st.rewardText}>+15 FinCoins queued</Text><Text style={st.rewardSub}> · arrives on payday</Text></View>
      </ScrollView>
      <View style={[st.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[st.ctaBtn, saving && st.ctaBtnDisabled]} onPress={handleComplete} disabled={saving} activeOpacity={0.88}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Lock in my FI Number \uD83C\uDFAF"}</Text>}
        </TouchableOpacity>
      </View>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
      <View style={st.backdrop}>
        <View style={st.card}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: Colors.background, borderRadius: 24, width: '100%', maxHeight: '90%', overflow: 'hidden' },

  header: { flexDirection: 'column', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 14 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  backBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.primary },
  headerTitle: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.lightGray, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 13, color: Colors.textMuted },
  stepPills: { flexDirection: 'row', gap: 4, alignSelf: 'center' },
  stepPill: { height: 4, width: 24, borderRadius: 2, backgroundColor: Colors.border },
  stepPillActive: { backgroundColor: Colors.primary, width: 32 },

  content: { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 32 },
  questTitle: { fontFamily: Fonts.extraBold, fontSize: 22, color: Colors.textPrimary, lineHeight: 30, marginTop: 20, marginBottom: 12, textAlign: 'center' },
  questSub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 24, marginBottom: 28, textAlign: 'center', paddingHorizontal: 8 },
  bold: { fontFamily: Fonts.extraBold },
  infoText: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, lineHeight: 26, marginBottom: 18, textAlign: 'center', paddingHorizontal: 8 },

  finCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  finCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  finCardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: MODULE_COLORS['module-1'].colorLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  finCardLabel: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: MODULE_COLORS['module-1'].colorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden' },
  finCardText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  explainerCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, gap: 14, ...Shadows.soft },
  explainerTitle: { fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  explainerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  explainerIcon: { fontSize: 20, width: 28 },
  explainerText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, flex: 1 },

  categoryCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, marginBottom: 10, ...Shadows.soft },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  categoryIcon: { fontSize: 20 },
  categoryLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, flex: 1 },
  categorySelectedAmt: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  categorySelectedAmtText: { fontFamily: Fonts.extraBold, fontSize: 13, color: Colors.primary },
  tierRow: { flexDirection: 'row', gap: 8 },
  tierPill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radii.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.lightGray },
  tierPillActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  tierPillText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
  tierPillTextActive: { color: Colors.primary },
  tierPillAmt: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  tierPillAmtActive: { color: Colors.primary },

  totalBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  totalBarLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  totalBarValue: { fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.textPrimary },
  ctaBtnSmall: { backgroundColor: Colors.primary, borderRadius: Radii.lg, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },

  calcCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 20, marginBottom: 16, ...Shadows.medium },
  calcCardTitle: { fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 16 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  calcLabel: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  calcValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calcValue: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  calcDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  calcHeroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  calcHeroNumber: { fontFamily: Fonts.extraBold, fontSize: 38, color: Colors.primary },

  ageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  agePill: { width: '30%', paddingVertical: 14, borderRadius: Radii.lg, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', ...Shadows.soft },
  agePillSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  ageText: { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textMuted },
  ageTextSelected: { color: Colors.primary },
  ageYears: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.primary, marginTop: 2 },

  verdictCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 16, borderLeftWidth: 4, marginBottom: 16, ...Shadows.soft },
  verdictHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  verdictEmoji: { fontSize: 18 },
  verdictLabel: { fontFamily: Fonts.extraBold, fontSize: 15 },
  verdictStat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  verdictStatLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  verdictStatValue: { fontFamily: Fonts.extraBold, fontSize: 18 },

  summaryCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 12, ...Shadows.soft },
  summaryCardTitle: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  summaryRowIcon: { fontSize: 16, width: 28 },
  summaryRowLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1 },
  summaryRowValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  summaryDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },

  fiHeroCard: { backgroundColor: Colors.primary, borderRadius: Radii.xl, padding: 20, alignItems: 'center', marginBottom: 12, ...Shadows.medium },
  fiHeroLabel: { fontFamily: Fonts.bold, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2, textTransform: 'uppercase' },
  fiHeroNumber: { fontFamily: Fonts.extraBold, fontSize: 36, color: Colors.white },

  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 8, backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 8 },
  rewardText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.warningDark },
  rewardSub: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },

  ctaContainer: { paddingHorizontal: 24, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  ctaBtn: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});
