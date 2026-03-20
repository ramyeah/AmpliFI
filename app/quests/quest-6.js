// app/quests/quest-6.js
// Quest 6 — Build Emergency Fund
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image,
  StyleSheet, Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../lib/firebase';
import { openEmergencyFundAccount, completeStage } from '../../lib/lifeSim';
import { Colors, Fonts, Radii, Shadows, MODULE_COLORS } from '../../constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const COIN = require('../../assets/coin.png');

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4F46E5', '#059669', '#F59E0B', '#EC4899', '#0891B2'];
function ConfettiPiece({ delay, color, startX, size }) {
  const y = useRef(new Animated.Value(-30)).current; const x = useRef(new Animated.Value(0)).current; const opacity = useRef(new Animated.Value(0)).current; const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => { const drift = (Math.random() - 0.5) * 160; setTimeout(() => { Animated.parallel([Animated.timing(y, { toValue: SH * 0.7, duration: 2400, useNativeDriver: true }), Animated.timing(x, { toValue: drift, duration: 2400, useNativeDriver: true }), Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0, duration: 700, delay: 1500, useNativeDriver: true })]), Animated.timing(rotate, { toValue: 1, duration: 2400, useNativeDriver: true })]).start(); }, delay); }, []);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() > 0.5 ? 540 : -720}deg`] });
  return <Animated.View style={{ position: 'absolute', left: startX, top: 0, width: size, height: size, borderRadius: Math.random() > 0.5 ? size / 2 : 2, backgroundColor: color, opacity, transform: [{ translateY: y }, { translateX: x }, { rotate: spin }] }} />;
}
function QConfetti() { const pieces = Array.from({ length: 50 }, (_, i) => ({ id: i, delay: Math.random() * 1000, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], startX: Math.random() * SW, size: 6 + Math.random() * 8 })); return <View style={StyleSheet.absoluteFill} pointerEvents="none">{pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}</View>; }

// ─── Coverage options ────────────────────────────────────────────────────────
const COVERAGE_OPTIONS = [
  { months: 3, label: '3 months', tag: 'Recommended', desc: 'Good starting point for employed fresh grads' },
  { months: 4, label: '4 months', tag: 'Comfortable', desc: 'Extra buffer for unexpected job transitions' },
  { months: 6, label: '6 months', tag: 'Conservative', desc: 'Maximum security \u2014 ideal if your income is variable' },
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function Quest6({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  const [step, setStep]                   = useState(1);
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [contribution, setContribution]   = useState(0);
  const [saving, setSaving]               = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError]         = useState(false);
  const [showConfetti, setShowConfetti]   = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────
  const needsAmt       = sim?.monthlyBudget?.needsAmt ?? 0;
  const savingsAmt     = sim?.monthlyBudget?.savingsAmt ?? 0;
  const wantsAmt       = sim?.monthlyBudget?.wantsAmt ?? 0;
  const targetAmount   = needsAmt * selectedMonths;
  const monthsToFund   = contribution > 0 ? Math.ceil(targetAmount / contribution) : 0;

  // ── Reset on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setStep(1); setSelectedMonths(3); setSaving(false); setShowConfetti(false);
      setShowExitConfirm(false); setShowError(false);
      const sa = sim?.monthlyBudget?.savingsAmt ?? 0;
      setContribution(sa > 0 ? Math.round(sa * 0.5) : Math.round(((sim?.monthlyBudget?.needsAmt ?? 0) * 3) / 6));
    }
  }, [visible]);

  // Update contribution default when selectedMonths changes
  useEffect(() => {
    setContribution(savingsAmt > 0 ? Math.round(savingsAmt * 0.5) : Math.round((needsAmt * selectedMonths) / 6));
  }, [selectedMonths]);

  const handleClose = () => {
    if (step < 4) setShowExitConfirm(true);
    else onClose();
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      await openEmergencyFundAccount(uid, selectedMonths, contribution);
      await completeStage(uid, 'stage-6', { monthsCovered: selectedMonths, monthlyContribution: contribution });
      setShowConfetti(true);
      onComplete();
    } catch (e) {
      setShowError(true);
      setSaving(false);
    }
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {step > 1 ? (
          <TouchableOpacity style={st.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={st.backBtnText}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 6 \u00B7 Build Emergency Fund'}</Text>
      <View style={st.stepPills}>{[1,2,3,4].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  // ── Fin card helper ───────────────────────────────────────────────────
  const FinCard = ({ children }) => (
    <View style={st.finCard}>
      <View style={st.finCardTop}>
        <View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View>
        <Text style={st.finCardLabel}>FIN SAYS</Text>
      </View>
      <Text style={st.finCardText}>{children}</Text>
    </View>
  );

  // ── Step 1 — Why an emergency fund? ──────────────────────────────────
  const renderStep1 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"Your financial\nsafety net"}</Text>

        <FinCard>Most people are one bad month away from financial crisis. A broken laptop, a medical bill, a job loss {'\u2014'} without an emergency fund, any of these forces you into debt or forces you to raid your investments at the worst possible time. This account exists for one reason: so nothing can derail you.</FinCard>

        {[
          { emoji: '\uD83D\uDE2C', title: 'No emergency fund', color: Colors.danger, text: 'Laptop breaks \u2192 credit card debt \u2192 interest charges \u2192 months to recover' },
          { emoji: '\uD83D\uDE10', title: 'Partial fund', color: Colors.warningDark, text: 'Medical bill \u2192 fund covers half \u2192 bank covers rest \u2192 minor setback' },
          { emoji: '\uD83D\uDE0C', title: 'Full emergency fund', color: MODULE_COLORS['module-3'].color, text: 'Any emergency \u2192 fund absorbs it \u2192 zero impact on financial plan' },
        ].map((scenario, i) => (
          <View key={i} style={[st.scenarioCard, { borderLeftColor: scenario.color }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 18 }}>{scenario.emoji}</Text>
              <Text style={st.scenarioTitle}>{scenario.title}</Text>
            </View>
            <Text style={st.scenarioText}>{scenario.text}</Text>
          </View>
        ))}

        <View style={[st.finCard, { marginTop: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Text style={{ fontSize: 20 }}>{'\uD83C\uDFE6'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 4 }}>Sub-account of {sim?.stage2Data?.bankName ?? 'your bank'}</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 }}>
                {sim?.stage2Data?.accountType === 'hysa'
                  ? `Earns ${((sim?.wallets?.find(w => w.type === 'bank')?.interestRate ?? 0) * 100).toFixed(2)}% p.a. \u2014 same as your HYSA`
                  : 'Earns 0.05% p.a. \u2014 upgrade to HYSA to earn more on this account too'
                }
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}>
            <Text style={st.ctaBtnText}>{"Build my safety net \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 2 — Choose your coverage ────────────────────────────────────
  const renderStep2 = () => {
    const getFinText = () => {
      if (selectedMonths === 3) return `3 months of needs is FC ${(needsAmt * 3).toLocaleString()}. At FC ${savingsAmt.toLocaleString()} savings per month, that is ${savingsAmt > 0 ? Math.ceil((needsAmt * 3) / savingsAmt) : '?'} months to fully fund it. Start building now.`;
      if (selectedMonths === 4) return 'A solid buffer. If your industry has longer hiring cycles or your income varies, this gives you real breathing room.';
      return 'Maximum security. If you are risk-averse or in a volatile field, six months means almost nothing can derail you.';
    };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>{"Choose your\ncoverage"}</Text>

          <View style={st.budgetContext}>
            <View style={st.budgetContextRow}>
              <Text style={st.budgetContextLabel}>{'\uD83C\uDFE0'} Monthly needs</Text>
              <View style={st.budgetContextAmount}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={st.budgetContextValue}>{needsAmt.toLocaleString()}</Text></View>
            </View>
            <View style={st.budgetContextRow}>
              <Text style={st.budgetContextLabel}>{'\uD83D\uDCB0'} Monthly savings budget</Text>
              <View style={st.budgetContextAmount}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={[st.budgetContextValue, { color: MODULE_COLORS['module-3'].color }]}>{savingsAmt.toLocaleString()}</Text></View>
            </View>
            <View style={st.budgetContextRow}>
              <Text style={st.budgetContextLabel}>{'\uD83D\uDECD\uFE0F'} Monthly wants budget</Text>
              <View style={st.budgetContextAmount}><Image source={COIN} style={{ width: 13, height: 13 }} /><Text style={st.budgetContextValue}>{wantsAmt.toLocaleString()}</Text></View>
            </View>
          </View>

          {COVERAGE_OPTIONS.map(opt => {
            const isSelected = selectedMonths === opt.months;
            return (
              <TouchableOpacity
                key={opt.months}
                style={[st.coverageCard, isSelected && { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }]}
                onPress={() => setSelectedMonths(opt.months)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={st.coverageLabel}>{opt.label} {'\u00B7'} {opt.tag}</Text>
                  {isSelected && <Text style={{ fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.primary }}>{'\u2713'}</Text>}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <Text style={st.coveragePrefix}>FC</Text>
                  <Image source={COIN} style={{ width: 14, height: 14 }} />
                  <Text style={[st.coverageAmount, isSelected && { color: Colors.primary }]}>{(needsAmt * opt.months).toLocaleString()}</Text>
                </View>
                <Text style={st.coverageDesc}>{opt.desc}</Text>
              </TouchableOpacity>
            );
          })}

          <FinCard>{getFinText()}</FinCard>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(3)} activeOpacity={0.88}>
              <Text style={st.ctaBtnText}>{"This is my target \u2192"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 3 — Build the plan ──────────────────────────────────────────
  const renderStep3 = () => {
    const sliderMin = savingsAmt > 0 ? Math.max(50, Math.round(savingsAmt * 0.1)) : 100;
    const sliderMax = savingsAmt > 0 ? savingsAmt : Math.max(sliderMin + 50, Math.round(targetAmount / 3));
    const totalMonths = contribution > 0 ? Math.ceil(targetAmount / contribution) : 0;
    const halfSavings = Math.round(savingsAmt * 0.5);
    const quarterSavings = Math.round(savingsAmt * 0.25);

    // Build timeline entries
    const timelineEntries = [];
    if (totalMonths > 0) {
      const showCount = Math.min(3, totalMonths);
      for (let m = 1; m <= showCount; m++) {
        timelineEntries.push({ month: m, amount: contribution * m, final: false });
      }
      if (totalMonths > 5) {
        timelineEntries.push({ ellipsis: true });
      } else if (totalMonths > 3) {
        for (let m = 4; m < totalMonths; m++) {
          timelineEntries.push({ month: m, amount: contribution * m, final: false });
        }
      }
      if (totalMonths > 3) {
        timelineEntries.push({ month: totalMonths, amount: targetAmount, final: true });
      } else if (totalMonths <= 3 && totalMonths > 0) {
        if (timelineEntries.length > 0) {
          timelineEntries[timelineEntries.length - 1].final = true;
          timelineEntries[timelineEntries.length - 1].amount = targetAmount;
        }
      }
    }

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>{"Build the plan"}</Text>

          <View style={st.targetCard}>
            <Text style={st.targetLabel}>TARGET</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Image source={COIN} style={{ width: 24, height: 24 }} />
              <Text style={st.targetValue}>{targetAmount.toLocaleString()}</Text>
            </View>
            <Text style={st.targetSub}>{selectedMonths} months of needs covered</Text>
          </View>

          {savingsAmt > 0 ? (
            <View style={st.quickSelect}>
              <Text style={st.quickSelectLabel}>Quick select:</Text>
              <View style={st.quickSelectRow}>
                <TouchableOpacity style={[st.quickBtn, contribution === quarterSavings && st.quickBtnActive]} onPress={() => setContribution(quarterSavings)}>
                  <Text style={[st.quickBtnText, contribution === quarterSavings && st.quickBtnTextActive]}>Quarter</Text>
                  <Text style={[st.quickBtnSub, contribution === quarterSavings && st.quickBtnTextActive]}>FC {quarterSavings.toLocaleString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.quickBtn, contribution === halfSavings && st.quickBtnActive]} onPress={() => setContribution(halfSavings)}>
                  <Text style={[st.quickBtnText, contribution === halfSavings && st.quickBtnTextActive]}>Half savings</Text>
                  <Text style={[st.quickBtnSub, contribution === halfSavings && st.quickBtnTextActive]}>FC {halfSavings.toLocaleString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.quickBtn, contribution === savingsAmt && st.quickBtnActive]} onPress={() => setContribution(savingsAmt)}>
                  <Text style={[st.quickBtnText, contribution === savingsAmt && st.quickBtnTextActive]}>All savings</Text>
                  <Text style={[st.quickBtnSub, contribution === savingsAmt && st.quickBtnTextActive]}>FC {savingsAmt.toLocaleString()}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={st.calcCard}><Text style={st.calcSub}>Complete Quest 4 to set your budget first</Text></View>
          )}

          <View style={st.sliderCard}>
            <Text style={st.sliderTitle}>Monthly contribution</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 4 }}>
              <Image source={COIN} style={{ width: 16, height: 16 }} />
              <Text style={{ fontFamily: Fonts.extraBold, fontSize: 24, color: Colors.textPrimary }}>{contribution.toLocaleString()}</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40, marginVertical: 4 }}
              minimumValue={sliderMin}
              maximumValue={sliderMax}
              step={50}
              value={contribution}
              onValueChange={v => setContribution(Math.round(v))}
              minimumTrackTintColor={Colors.primary}
              thumbTintColor={Colors.primary}
              disabled={savingsAmt === 0}
            />
            <View style={st.sliderLabels}>
              <Text style={st.sliderLabel}>FC {sliderMin.toLocaleString()}</Text>
              <Text style={st.sliderLabel}>FC {sliderMax.toLocaleString()}</Text>
            </View>
          </View>

          {contribution > 0 && (
            <View style={st.calcCard}>
              <Text style={st.calcLine}>At FC {contribution.toLocaleString()}/month {'\u2192'} funded in {totalMonths} months</Text>
              {savingsAmt > 0 && <Text style={st.calcSub}>Using {Math.round((contribution / savingsAmt) * 100)}% of your FC {savingsAmt.toLocaleString()} savings budget</Text>}
              {contribution === savingsAmt && <Text style={st.calcWarning}>{'\u26A0\uFE0F'} This uses your entire savings budget. Nothing left for your savings goal account.</Text>}
              {contribution > savingsAmt * 0.8 && contribution < savingsAmt && <Text style={st.calcNote}>This leaves FC {(savingsAmt - contribution).toLocaleString()} of your savings budget for other goals.</Text>}
            </View>
          )}

          {timelineEntries.length > 0 && (
            <View style={st.timelineCard}>
              {timelineEntries.map((entry, i) => {
                if (entry.ellipsis) {
                  return <Text key={`e${i}`} style={st.timelineEllipsis}>...</Text>;
                }
                return (
                  <View key={`m${entry.month}`} style={st.timelineRow}>
                    <View style={[st.timelineDot, entry.final && { backgroundColor: Colors.primary }]} />
                    <Text style={st.timelineMonth}>Month {entry.month}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
                      <Image source={COIN} style={{ width: 11, height: 11 }} />
                      <Text style={[st.timelineAmount, entry.final && { color: Colors.primary, fontFamily: Fonts.extraBold }]}>{entry.amount.toLocaleString()}</Text>
                      {entry.final && <Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: Colors.primary }}> {'\u2713'} FUNDED</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <FinCard>You have FC {savingsAmt.toLocaleString()} in your savings budget each month. Putting all of it here gets your fund built fastest {'\u2014'} but leaves nothing for your savings goal. Half and half is usually the right balance.</FinCard>

          <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={st.ctaBtn} onPress={() => { handleComplete(); setStep(4); }} activeOpacity={0.88}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Start building \u2192"}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 4 — Success ─────────────────────────────────────────────────
  const renderStep4 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[st.content, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{"Emergency fund\ncreated!"}</Text>

        <View style={[st.summaryCard, { width: '100%' }]}>
          <Text style={{ fontFamily: Fonts.extraBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 12 }}>{'\uD83D\uDEE1\uFE0F'} Emergency Fund</Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 14 }}>Sub-account of {sim?.stage2Data?.bankName ?? 'Your Bank'}</Text>

          <View style={st.summaryRow}>
            <Text style={st.summaryLabel}>Target</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted }}>FC</Text>
              <Image source={COIN} style={{ width: 13, height: 13 }} />
              <Text style={st.summaryValue}>{targetAmount.toLocaleString()} ({selectedMonths} months of needs)</Text>
            </View>
          </View>

          <View style={st.summaryRow}>
            <Text style={st.summaryLabel}>Monthly contribution</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted }}>FC</Text>
              <Image source={COIN} style={{ width: 13, height: 13 }} />
              <Text style={st.summaryValue}>{contribution.toLocaleString()}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 8 }}>0% funded {'\u00B7'} FC 0 / FC {targetAmount.toLocaleString()}</Text>
            <View style={st.progressTrack}><View style={[st.progressFill, { width: '0%' }]} /></View>
          </View>
        </View>

        {sim?.stage2Data?.accountType !== 'hysa' && (
          <View style={{ backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, marginBottom: 12, width: '100%' }}>
            <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.warningDark, lineHeight: 18 }}>{'\u26A0\uFE0F'} Upgrade to HYSA in the side quests to earn more interest on this account</Text>
          </View>
        )}
        <View style={[st.unlockCard, { width: '100%' }]}>
          <Text style={st.unlockPill}>{'\uD83D\uDD13'} UNLOCKED</Text>
          <Text style={st.unlockText}>Safety net created. Life events can no longer derail you.</Text>
          <View style={st.unlockDivider} />
          <Text style={st.unlockHint}>{'\uD83D\uDEE1\uFE0F'} Emergency fund wallet appears on your dashboard</Text>
          <Text style={[st.unlockHint, { marginTop: 4 }]}>{'\u26A1'} Emergency life events now absorbed by your fund (once funded)</Text>
        </View>

        <FinCard>{sim?.stage2Data?.accountType === 'hysa' ? `Your emergency fund earns the same rate as your HYSA \u2014 ${((sim?.wallets?.find(w => w.type === 'bank')?.interestRate ?? 0) * 100).toFixed(2)}% a year. Even while it sits there doing nothing, it grows.` : 'Your emergency fund is in a basic account earning almost nothing. Complete the HYSA upgrade side quest in Chapter 3 to fix that.'}</FinCard>

        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 32, width: '100%' }}>
          <TouchableOpacity style={st.ctaBtn} onPress={onComplete} activeOpacity={0.88}>
            <Text style={st.ctaBtnText}>{"Back to FinCity \u2192"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleClose}>
        <View style={st.backdrop}><View style={st.card}>
          {showConfetti && <QConfetti />}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </View></View>
      </Modal>
      <Modal visible={showExitConfirm} transparent animationType="fade"><View style={st.alertBg}><View style={st.alertCard}><Text style={st.alertEmoji}>{'\uD83D\uDC1F'}</Text><Text style={st.alertTitle}>Leave this quest?</Text><Text style={st.alertBody}>Your progress in this step won't be saved.</Text><View style={st.alertBtns}><TouchableOpacity style={st.alertCancel} onPress={() => setShowExitConfirm(false)}><Text style={st.alertCancelText}>Stay</Text></TouchableOpacity><TouchableOpacity style={st.alertConfirm} onPress={() => { setShowExitConfirm(false); onClose(); }}><Text style={st.alertConfirmText}>Leave</Text></TouchableOpacity></View></View></View></Modal>
      <Modal visible={showError} transparent animationType="fade"><View style={st.alertBg}><View style={st.alertCard}><Text style={st.alertEmoji}>{'\uD83D\uDE2C'}</Text><Text style={st.alertTitle}>Something went wrong</Text><Text style={st.alertBody}>Please try again.</Text><View style={st.alertBtns}><TouchableOpacity style={st.alertConfirm} onPress={() => setShowError(false)}><Text style={st.alertConfirmText}>OK</Text></TouchableOpacity></View></View></View></Modal>
    </>
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

  finCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  finCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  finCardAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: MODULE_COLORS['module-1'].colorLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  finCardLabel: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', backgroundColor: MODULE_COLORS['module-1'].colorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden' },
  finCardText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },

  // Step 1 — scenario cards
  scenarioCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, marginBottom: 10, borderLeftWidth: 4, ...Shadows.soft },
  scenarioTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  scenarioText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // Step 2 — needs & coverage
  needsCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 20, alignItems: 'center', marginBottom: 20, ...Shadows.soft },
  needsLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  needsPrefix: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  needsValue: { fontFamily: Fonts.extraBold, fontSize: 28, color: Colors.textPrimary },
  needsSub: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 6 },

  coverageCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: Colors.border, ...Shadows.soft },
  coverageLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  coveragePrefix: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  coverageAmount: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary },
  coverageDesc: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  // Step 3 — plan
  targetCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 20, alignItems: 'center', marginBottom: 20, ...Shadows.medium },
  targetLabel: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  targetPrefix: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  targetValue: { fontFamily: Fonts.extraBold, fontSize: 32, color: Colors.primary },
  targetSub: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, marginTop: 6 },

  sliderCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  sliderTitle: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },

  // Budget context (Step 2)
  budgetContext: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, marginBottom: 16, gap: 8 },
  budgetContextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetContextLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  budgetContextAmount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  budgetContextValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },

  // Quick select (Step 3)
  quickSelect: { marginBottom: 12 },
  quickSelectLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 8 },
  quickSelectRow: { flexDirection: 'row', gap: 8 },
  quickBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, padding: 10, alignItems: 'center' },
  quickBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  quickBtnText: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textSecondary },
  quickBtnSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  quickBtnTextActive: { color: Colors.primary },

  // Calc card (Step 3)
  calcCard: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, marginBottom: 16, gap: 6 },
  calcLine: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  calcSub: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  calcWarning: { fontFamily: Fonts.semiBold, fontSize: 12, color: '#FF4444' },
  calcNote: { fontFamily: Fonts.regular, fontSize: 12, color: MODULE_COLORS['module-2'].color },

  calcPreview: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 14, marginBottom: 16, ...Shadows.soft },
  calcPreviewText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22, textAlign: 'center' },

  timelineCard: { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: 16, marginBottom: 16, ...Shadows.soft },
  timelineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border, marginRight: 12 },
  timelineMonth: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, width: 70 },
  timelineAmount: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textPrimary },
  timelineEllipsis: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textMuted, textAlign: 'center', paddingVertical: 4 },

  // Step 4 — success
  summaryCard: { backgroundColor: Colors.white, borderRadius: Radii.xl, padding: 18, marginBottom: 16, ...Shadows.soft },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },

  progressTrack: { height: 8, backgroundColor: Colors.lightGray, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },

  unlockCard: { backgroundColor: MODULE_COLORS['module-1'].colorLight, borderRadius: Radii.lg, padding: 16, marginBottom: 16, width: '100%' },
  unlockPill: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 8 },
  unlockText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginBottom: 10 },
  unlockDivider: { height: 1, backgroundColor: MODULE_COLORS['module-1'].color, opacity: 0.2, marginBottom: 10 },
  unlockHint: { fontFamily: Fonts.regular, fontSize: 12, color: MODULE_COLORS['module-1'].color },

  ctaBtn: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },

  alertBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  alertCard: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, marginHorizontal: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8, width: '100%' },
  alertEmoji: { fontSize: 36, marginBottom: 12 },
  alertTitle: { fontFamily: Fonts.extraBold, fontSize: 18, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  alertBody: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  alertBtns: { flexDirection: 'row', gap: 8, width: '100%' },
  alertCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  alertCancelText: { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textSecondary },
  alertConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  alertConfirmText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
});
