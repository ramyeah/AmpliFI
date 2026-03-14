// app/life-sim/stage1.js
//
// Stage 1 — Know Your FI Number
//
// Card-by-card learning exercise. 5 cards:
//   Card 1: What is the FI Number?
//   Card 2: The 4% Rule
//   Card 3: What does retirement cost? (lifestyle cost builder)
//   Card 4: Your FI Number (calculator + Fin's honest assessment)
//   Card 5: Your Checklist (summary + lock in)
//
// Fin gives a short AI-generated note on each card via RAG (/ask).
// FI Number + cost breakdown saved to Firestore on completion.

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';
import { setGoals, completeStage, loadSimProgress } from '../../lib/lifeSim';
import { getIncomeBracket, formatDual, STAGES } from '../../constants/lifeSimStages';
import { getAvatar, getUnlockedOutfits, getNewOutfit } from '../../constants/avatars';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../../constants/theme';
import { auth } from '../../lib/firebase';
import { simFrameAge, simFrameLifestyle, simReactFFN, ragAsk } from '../../lib/api';
import { FinBubble, DualAmount, StageHeader, StageCompleteModal } from '../../components/LifeSimComponents';

const { width: SW } = Dimensions.get('window');
const STAGE = STAGES.find(s => s.id === 'stage-1');
const TOTAL_CARDS = 5;

// ─── Lifestyle cost categories ────────────────────────────────────────────────
const COST_CATEGORIES = [
  { id: 'housing',   icon: '🏠', label: 'Housing',           tiers: [800,  1200, 2500], default: 1 },
  { id: 'food',      icon: '🍜', label: 'Food & dining',     tiers: [400,   650, 1200], default: 1 },
  { id: 'transport', icon: '🚇', label: 'Transport',         tiers: [150,   250,  500], default: 1 },
  { id: 'health',    icon: '🏥', label: 'Healthcare',        tiers: [200,   400,  800], default: 1 },
  { id: 'travel',    icon: '✈️', label: 'Travel & holidays', tiers: [0,     400, 1500], default: 1 },
  { id: 'misc',      icon: '🎯', label: 'Personal & misc',   tiers: [200,   350,  700], default: 1 },
];
const TIER_LABELS = ['Low', 'Medium', 'High'];
const TIER_BG     = [Colors.successLight, Colors.warningLight, Colors.dangerLight];
const TIER_COLOR  = [Colors.successDark,  Colors.warningDark,  Colors.danger];

function calcFFN(monthlyTotal) {
  return Math.round(monthlyTotal * 12 * 25);
}

function calcProjection(monthlySavings, years) {
  const r = 0.06 / 12;
  const n = years * 12;
  return r > 0 ? Math.round(monthlySavings * ((Math.pow(1 + r, n) - 1) / r)) : monthlySavings * n;
}

// ─── Progress dots ────────────────────────────────────────────────────────────
function ProgressDots({ current, total, color }) {
  return (
    <View style={pd.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            pd.dot,
            i < current   && { backgroundColor: color },
            i === current  && [pd.dotActive, { backgroundColor: color }],
            i > current    && { backgroundColor: Colors.border },
          ]}
        />
      ))}
    </View>
  );
}
const pd = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 12, height: 12, borderRadius: 6 },
});

// ─── Lifestyle cost builder ───────────────────────────────────────────────────
function LifestyleBuilder({ tiers, onTierChange, total }) {
  return (
    <View style={lb.wrap}>
      {COST_CATEGORIES.map(cat => {
        const tier   = tiers[cat.id] ?? cat.default;
        const amount = cat.tiers[tier];
        return (
          <TouchableOpacity
            key={cat.id}
            style={lb.row}
            onPress={() => onTierChange(cat.id, (tier + 1) % 3)}
            activeOpacity={0.72}
          >
            <Text style={lb.icon}>{cat.icon}</Text>
            <View style={lb.labelCol}>
              <Text style={lb.label}>{cat.label}</Text>
              <View style={[lb.tierPill, { backgroundColor: TIER_BG[tier] }]}>
                <Text style={[lb.tierText, { color: TIER_COLOR[tier] }]}>{TIER_LABELS[tier]}</Text>
              </View>
            </View>
            <Text style={[lb.amount, { color: TIER_COLOR[tier] }]}>${amount.toLocaleString()}</Text>
            <Text style={lb.tap}>tap ↻</Text>
          </TouchableOpacity>
        );
      })}
      <View style={lb.totalRow}>
        <Text style={lb.totalLabel}>Monthly total</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={lb.totalSgd}>{formatDual(total).sgd}</Text>
          <Text style={lb.totalCoins}>{formatDual(total).coins}</Text>
        </View>
      </View>
    </View>
  );
}
const lb = StyleSheet.create({
  wrap:      { borderRadius: Radii.lg, overflow: 'hidden', ...Shadows.soft, marginBottom: Spacing.md },
  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 10 },
  icon:      { fontSize: 20, width: 26 },
  labelCol:  { flex: 1, gap: 3 },
  label:     { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  tierPill:  { alignSelf: 'flex-start', borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  tierText:  { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  amount:    { fontFamily: Fonts.extraBold, fontSize: 15, minWidth: 56, textAlign: 'right' },
  tap:       { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  totalRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.lightGray },
  totalLabel:{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  totalSgd:  { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary },
  totalCoins:{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
});

// ─── Checklist item ───────────────────────────────────────────────────────────
function CheckItem({ done, label, sub }) {
  return (
    <View style={ci.row}>
      <View style={[ci.circle, done && ci.circleDone]}>
        {done && <Text style={ci.tick}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[ci.label, done && ci.labelDone]}>{label}</Text>
        {sub ? <Text style={ci.sub}>{sub}</Text> : null}
      </View>
    </View>
  );
}
const ci = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  circle:    { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  circleDone:{ backgroundColor: STAGE?.color ?? Colors.primary, borderColor: STAGE?.color ?? Colors.primary },
  tick:      { fontFamily: Fonts.extraBold, fontSize: 13, color: Colors.white },
  label:     { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textMuted },
  labelDone: { color: Colors.textPrimary },
  sub:       { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
export default function Stage1() {
  const router     = useRouter();
  const profile    = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);

  const uid       = auth.currentUser?.uid;
  const finCoins  = profile?.finCoins ?? 0;
  const avatarId  = profile?.avatarId ?? 'alex';
  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const bracket   = getIncomeBracket(finCoins);

  // Card state
  const [card, setCard] = useState(0);  // 0-4

  // Lifestyle cost builder
  const [costTiers, setCostTiers] = useState(() => {
    const init = {};
    COST_CATEGORIES.forEach(c => { init[c.id] = c.default; });
    return init;
  });

  // FFN data
  const [retireAge, setRetireAge] = useState(55);  // default — user can adjust on card 4
  const [ffnData,   setFfnData]   = useState(null);

  // Fin AI messages — one per card
  const [finMsg,      setFinMsg]      = useState({});  // { 0: "...", 1: "...", etc }
  const [finLoading,  setFinLoading]  = useState({});  // { 0: true, etc }

  // Completion
  const [saving,       setSaving]       = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  // ── Derived values ─────────────────────────────────────────────────────────
  const monthlyTotal = COST_CATEGORIES.reduce(
    (sum, cat) => sum + cat.tiers[costTiers[cat.id] ?? cat.default], 0
  );
  const ffn           = calcFFN(monthlyTotal);
  const years         = retireAge - 24;
  const savings20     = Math.round(bracket.income * 0.2);
  const projection    = calcProjection(savings20, years);
  const reachable     = projection >= ffn;
  const shortfall     = Math.max(0, ffn - projection);

  // ── Load Fin's AI message for the current card ─────────────────────────────
  useEffect(() => {
    loadFinMessage(card);
  }, [card]);

  const loadFinMessage = async (cardIndex) => {
    if (finMsg[cardIndex]) return; // already loaded
    setFinLoading(prev => ({ ...prev, [cardIndex]: true }));
    try {
      let result;
      if (cardIndex === 0) {
        result = await simFrameAge({
          userName: firstName, income: bracket.income, incomeLabel: bracket.label,
        });
      } else if (cardIndex === 1) {
        result = await ragAsk(
          '4% rule safe withdrawal rate financial independence Trinity Study history',
          `You are Fin, a direct financial advisor. Explain in 2 sentences why the 4% rule works — it comes from the Trinity Study (1998), which found that withdrawing 4% annually from a diversified portfolio has historically sustained 30+ years of retirement. Make it relevant to someone in Singapore earning $${bracket.income.toLocaleString()}/month. Direct, no fluff.`,
          { name: firstName }
        );
      } else if (cardIndex === 2) {
        result = await simFrameLifestyle({
          userName: firstName, income: bracket.income, retireAge,
        });
      } else if (cardIndex === 3) {
        result = await simReactFFN({
          userName: firstName, income: bracket.income,
          incomeLabel: bracket.label, retireAge,
          monthlyTotal, ffn,
        });
        setFfnData(result);
      } else {
        result = { response: `You've done what most people never do — you've actually calculated your FI Number. $${ffn.toLocaleString()} is your target. Every financial decision from here either moves you toward it or away from it.` };
      }
      setFinMsg(prev => ({ ...prev, [cardIndex]: result?.response ?? '' }));
    } catch (e) {
      console.error('Fin message error:', e);
      setFinMsg(prev => ({ ...prev, [cardIndex]: getFallback(cardIndex) }));
    } finally {
      setFinLoading(prev => ({ ...prev, [cardIndex]: false }));
    }
  };

  const getFallback = (cardIndex) => {
    const msgs = {
      0: `Most people spend decades working without ever calculating the number that would set them free. Your FI Number is that figure — and on $${bracket.income.toLocaleString()}/month, understanding it changes how you see every financial decision.`,
      1: `The 4% rule comes from the Trinity Study — researchers found that withdrawing 4% of your portfolio annually has historically sustained 30+ years of retirement across most market conditions. Multiply your annual expenses by 25 and you get the same number.`,
      2: `Most people underestimate their retirement costs by 30–40%. The big surprises are healthcare ($500–800/month out-of-pocket after 60 even with MediShield) and the simple fact that more free time means more spending, not less.`,
      3: reachable
        ? `Saving $${savings20.toLocaleString()}/month and investing at 6% annually for ${years} years gets you to ~$${projection.toLocaleString()} — which covers your FI Number of $${ffn.toLocaleString()}. The math works if you start now and stay consistent.`
        : `Your FI Number is $${ffn.toLocaleString()}. At $${savings20.toLocaleString()}/month invested at 6% for ${years} years, you'd reach ~$${projection.toLocaleString()} — $${shortfall.toLocaleString()} short. You'd need a higher savings rate, better returns, or lower retirement costs.`,
      4: `You've done what most people never do — actually calculated your FI Number. $${ffn.toLocaleString()} is your target. Every financial decision from here either moves you toward it or away from it.`,
    };
    return msgs[cardIndex] ?? '';
  };

  // ── Navigate cards ─────────────────────────────────────────────────────────
  const goToCard = (next) => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0,   duration: 180, useNativeDriver: true }),
    ]).start();
    setCard(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // ── Lock in ────────────────────────────────────────────────────────────────
  const handleLockIn = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const sim = await loadSimProgress(uid);
      const costBreakdown = Object.fromEntries(
        COST_CATEGORIES.map(c => [c.id, c.tiers[costTiers[c.id] ?? c.default]])
      );

      await setGoals(uid, {
        ffn,
        ffnAge:                  retireAge,
        planningIncome:          bracket.income,
        monthlyRetirementIncome: monthlyTotal,
        goals: [],
        costBreakdown,
      });

      await completeStage(uid, 'stage-1', {
        ffn, retireAge, monthlyTotal, costBreakdown,
        projection, reachable,
      }, sim?.wallets ?? []);

      setProfile({ ...profile, finCoins: finCoins + 50 });
      setShowComplete(true);
    } catch (e) {
      console.error('Stage1 lockIn:', e);
    } finally {
      setSaving(false);
    }
  };

  // ── Outfit ─────────────────────────────────────────────────────────────────
  const completedStages = profile?.completedStages ?? [];
  const newOutfit       = getNewOutfit('stage-1');
  const unlockedOutfits = [
    ...getUnlockedOutfits(completedStages).map(o => o.id),
    ...(showComplete && newOutfit ? [newOutfit.id] : []),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <StageHeader
        title="Know Your FI Number"
        color={STAGE.color}
        sim={null}
        onBack={() => router.back()}
      />

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <ProgressDots current={card} total={TOTAL_CARDS} color={STAGE.color} />

        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>

          {/* ═══════════════════════════════════ CARD 0 — What is FI? */}
          {card === 0 && (
            <View style={s.card}>
              <View style={[s.cardIconWrap, { backgroundColor: STAGE.colorLight }]}>
                <Text style={s.cardIcon}>🎯</Text>
              </View>
              <Text style={[s.cardTitle, { color: STAGE.color }]}>
                What is Financial Independence?
              </Text>

              <Text style={s.bodyText}>
                Financial Independence (FI) means having enough invested that you could live off the returns — indefinitely — without ever needing to work again.
              </Text>
              <Text style={s.bodyText}>
                It doesn't mean you stop working. It means you{' '}
                <Text style={s.bold}>choose</Text> whether to.
              </Text>

              <View style={[s.callout, { backgroundColor: STAGE.colorLight, borderColor: STAGE.color + '40' }]}>
                <Text style={[s.calloutLabel, { color: STAGE.color }]}>The FI Number</Text>
                <Text style={s.calloutText}>
                  The specific amount of money you need invested to be financially independent. Once you hit it, your portfolio generates enough to cover your lifestyle — forever.
                </Text>
              </View>

              <View style={[s.callout, { backgroundColor: Colors.warningLight, borderColor: Colors.warningDark + '40' }]}>
                <Text style={[s.calloutLabel, { color: Colors.warningDark }]}>📊 Real numbers</Text>
                <Text style={s.calloutText}>
                  Only 3% of Singaporeans are financially independent by 55. Most people never calculate their number — which means they're working toward a target they can't see.
                </Text>
              </View>

              {/* Fin's AI note */}
              {(finLoading[0] || finMsg[0]) && (
                <FinBubble text={finMsg[0] ?? ''} loading={!!finLoading[0]} small />
              )}

              <TouchableOpacity
                style={[s.nextBtn, { backgroundColor: STAGE.color }]}
                onPress={() => goToCard(1)}
              >
                <Text style={s.nextBtnText}>Got it →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════════════════════════════ CARD 1 — The 4% Rule */}
          {card === 1 && (
            <View style={s.card}>
              <View style={[s.cardIconWrap, { backgroundColor: STAGE.colorLight }]}>
                <Text style={s.cardIcon}>📐</Text>
              </View>
              <Text style={[s.cardTitle, { color: STAGE.color }]}>The 4% Rule</Text>

              <Text style={s.bodyText}>
                The FI Number is calculated using the{' '}
                <Text style={s.bold}>4% rule</Text> — a principle from the Trinity Study (1998), which found that withdrawing 4% of your portfolio annually has historically lasted 30+ years without running out of money.
              </Text>

              {/* Formula visual */}
              <View style={s.formulaCard}>
                <View style={s.formulaRow}>
                  <View style={s.formulaBox}>
                    <Text style={s.formulaLabel}>Monthly expenses</Text>
                    <Text style={[s.formulaValue, { color: STAGE.color }]}>$X,XXX</Text>
                  </View>
                  <Text style={s.formulaOp}>×</Text>
                  <View style={s.formulaBox}>
                    <Text style={s.formulaLabel}>12 months</Text>
                    <Text style={[s.formulaValue, { color: STAGE.color }]}>12</Text>
                  </View>
                  <Text style={s.formulaOp}>×</Text>
                  <View style={s.formulaBox}>
                    <Text style={s.formulaLabel}>4% rule</Text>
                    <Text style={[s.formulaValue, { color: STAGE.color }]}>25</Text>
                  </View>
                </View>
                <View style={[s.formulaResult, { backgroundColor: STAGE.colorLight }]}>
                  <Text style={s.formulaResultLabel}>= Your FI Number</Text>
                </View>
              </View>

              <View style={[s.callout, { backgroundColor: Colors.secondaryLight, borderColor: Colors.textMuted + '30' }]}>
                <Text style={[s.calloutLabel, { color: Colors.textSecondary }]}>Why × 25?</Text>
                <Text style={s.calloutText}>
                  If you withdraw 4% per year, you need 100 ÷ 4 = 25 years worth of expenses invested. A diversified portfolio historically grows enough to sustain this withdrawal rate indefinitely.
                </Text>
              </View>

              {(finLoading[1] || finMsg[1]) && (
                <FinBubble text={finMsg[1] ?? ''} loading={!!finLoading[1]} small />
              )}

              <TouchableOpacity
                style={[s.nextBtn, { backgroundColor: STAGE.color }]}
                onPress={() => goToCard(2)}
              >
                <Text style={s.nextBtnText}>Got it →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════════════════════════════ CARD 2 — Cost builder */}
          {card === 2 && (
            <View style={s.card}>
              <View style={[s.cardIconWrap, { backgroundColor: STAGE.colorLight }]}>
                <Text style={s.cardIcon}>🏗️</Text>
              </View>
              <Text style={[s.cardTitle, { color: STAGE.color }]}>
                Step 1: What does retirement cost you?
              </Text>

              <Text style={s.bodyText}>
                Tap each category to cycle through Low / Medium / High. Be honest — most people underestimate this.
              </Text>

              {(finLoading[2] || finMsg[2]) && (
                <FinBubble text={finMsg[2] ?? ''} loading={!!finLoading[2]} small />
              )}

              <LifestyleBuilder
                tiers={costTiers}
                onTierChange={(id, tier) => setCostTiers(prev => ({ ...prev, [id]: tier }))}
                total={monthlyTotal}
              />

              {/* Live FI Number preview */}
              <View style={[s.previewCard, { borderColor: STAGE.color + '40', backgroundColor: STAGE.colorLight }]}>
                <Text style={s.previewLabel}>{formatDual(monthlyTotal).sgd}/month × 12 × 25 =</Text>
                <DualAmount sgd={ffn} size="lg" color={STAGE.color} />
                <Text style={s.previewHint}>This is your FI Number at current settings</Text>
              </View>

              <TouchableOpacity
                style={[s.nextBtn, { backgroundColor: STAGE.color }]}
                onPress={() => goToCard(3)}
              >
                <Text style={s.nextBtnText}>Calculate my number →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════════════════════════════ CARD 3 — FI Number result */}
          {card === 3 && (
            <View style={s.card}>
              <View style={[s.cardIconWrap, { backgroundColor: STAGE.colorLight }]}>
                <Text style={s.cardIcon}>🔢</Text>
              </View>
              <Text style={[s.cardTitle, { color: STAGE.color }]}>
                Step 2: Your FI Number
              </Text>

              {/* Big FI Number display */}
              <View style={[s.fiNumberCard, { borderColor: STAGE.color }]}>
                <Text style={s.fiNumberLabel}>Your FI Number</Text>
                <DualAmount sgd={ffn} size="lg" color={STAGE.color} />
                <Text style={s.fiNumberFormula}>
                  {formatDual(monthlyTotal).sgd}/mo × 12 × 25
                </Text>
              </View>

              {/* Projection */}
              <View style={[s.projCard, { borderColor: reachable ? Colors.successDark : Colors.warningDark }]}>
                <Text style={s.projTitle}>Can you reach it?</Text>
                <Text style={s.projSub}>
                  Saving 20% of income (${savings20.toLocaleString()}/mo) invested at 6%/year for {years} years:
                </Text>

                <View style={s.projRow}>
                  <View style={s.projItem}>
                    <Text style={s.projItemLabel}>You'd have</Text>
                    <Text style={[s.projItemValue, { color: reachable ? Colors.successDark : Colors.warningDark }]}>
                      ${projection.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={s.projVs}>vs</Text>
                  <View style={s.projItem}>
                    <Text style={s.projItemLabel}>You need</Text>
                    <Text style={[s.projItemValue, { color: STAGE.color }]}>
                      ${ffn.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={[s.projStatus, {
                  backgroundColor: reachable ? Colors.successLight : Colors.warningLight,
                }]}>
                  <Text style={[s.projStatusText, {
                    color: reachable ? Colors.successDark : Colors.warningDark,
                  }]}>
                    {reachable
                      ? `✓  On track — your projected portfolio covers your FI Number`
                      : `⚠  $${shortfall.toLocaleString()} gap — adjust lifestyle costs or savings rate`}
                  </Text>
                </View>
              </View>

              {/* Retire age adjuster */}
              <View style={s.ageRow}>
                <Text style={s.ageLabel}>Target retirement age:</Text>
                <View style={s.ageChips}>
                  {[45, 50, 55, 60, 65].map(age => (
                    <TouchableOpacity
                      key={age}
                      style={[s.ageChip, retireAge === age && { backgroundColor: STAGE.color, borderColor: STAGE.color }]}
                      onPress={() => {
                        setRetireAge(age);
                        setFinMsg(prev => ({ ...prev, 3: null }));
                        setFfnData(null);
                        // Reload Fin's message with new age
                        setTimeout(() => loadFinMessage(3), 100);
                      }}
                    >
                      <Text style={[s.ageChipText, retireAge === age && { color: Colors.white }]}>{age}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fin's honest assessment */}
              {(finLoading[3] || finMsg[3]) && (
                <FinBubble text={finMsg[3] ?? ''} loading={!!finLoading[3]} />
              )}

              <View style={s.twoButtons}>
                <TouchableOpacity
                  style={[s.outlineBtn, { borderColor: STAGE.color }]}
                  onPress={() => goToCard(2)}
                >
                  <Text style={[s.outlineBtnText, { color: STAGE.color }]}>← Adjust costs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.nextBtn, { backgroundColor: STAGE.color, flex: 1 }]}
                  onPress={() => goToCard(4)}
                >
                  <Text style={s.nextBtnText}>This is my number →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ═══════════════════════════════════ CARD 4 — Checklist */}
          {card === 4 && (
            <View style={s.card}>
              <View style={[s.cardIconWrap, { backgroundColor: STAGE.colorLight }]}>
                <Text style={s.cardIcon}>✅</Text>
              </View>
              <Text style={[s.cardTitle, { color: STAGE.color }]}>
                Your FI Checklist
              </Text>

              <View style={[s.checklistCard, { borderColor: STAGE.color + '30' }]}>
                <CheckItem done label="Understand what the FI Number is" sub="The amount invested that funds your lifestyle forever" />
                <View style={s.checkDivider} />
                <CheckItem done label="Learn the 4% rule" sub="Monthly expenses × 12 × 25 = FI Number" />
                <View style={s.checkDivider} />
                <CheckItem done label="Estimate your retirement costs" sub={`$${monthlyTotal.toLocaleString()}/month across 6 categories`} />
                <View style={s.checkDivider} />
                <CheckItem done label="Calculate your FI Number" sub={`${formatDual(ffn).combined} — retire by ${retireAge}`} />
              </View>

              {/* Summary */}
              <View style={[s.summaryCard, { borderColor: STAGE.color }]}>
                <Text style={[s.summaryTitle, { color: STAGE.color }]}>Your FI Blueprint</Text>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>🎯  FI Number</Text>
                  <DualAmount sgd={ffn} size="md" color={STAGE.color} />
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>💸  Monthly retirement budget</Text>
                  <Text style={s.summaryValue}>{formatDual(monthlyTotal).sgd}</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>📅  Target retirement age</Text>
                  <Text style={s.summaryValue}>{retireAge}</Text>
                </View>
                <View style={[s.summaryStatus, {
                  backgroundColor: reachable ? Colors.successLight : Colors.warningLight,
                }]}>
                  <Text style={[s.summaryStatusText, {
                    color: reachable ? Colors.successDark : Colors.warningDark,
                  }]}>
                    {reachable
                      ? `✓  Projected portfolio: $${projection.toLocaleString()} — covers FI Number`
                      : `⚠  $${shortfall.toLocaleString()} gap to close through higher savings or adjusted lifestyle`}
                  </Text>
                </View>
              </View>

              {(finLoading[4] || finMsg[4]) && (
                <FinBubble text={finMsg[4] ?? ''} loading={!!finLoading[4]} small />
              )}

              <TouchableOpacity
                style={[s.nextBtn, {
                  backgroundColor: saving ? Colors.border : STAGE.color,
                  paddingVertical: 16,
                }]}
                onPress={handleLockIn}
                disabled={saving}
              >
                <Text style={[s.nextBtnText, { fontSize: 16 }, saving && { color: Colors.textMuted }]}>
                  {saving ? 'Saving…' : 'Save my FI Blueprint →'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <StageCompleteModal
        visible={showComplete}
        stageTitle="Know Your FI Number"
        outfitItem={newOutfit}
        avatarId={avatarId}
        unlockedOutfits={unlockedOutfits}
        onContinue={() => { setShowComplete(false); router.replace('/(tabs)/simulate'); }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  scroll:          { flex: 1 },
  content:         { padding: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 60 },

  card:            { backgroundColor: Colors.white, borderRadius: Radii.lg, padding: Spacing.lg, ...Shadows.soft },

  cardIconWrap:    { width: 56, height: 56, borderRadius: Radii.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  cardIcon:        { fontSize: 30 },
  cardTitle:       { fontFamily: Fonts.extraBold, fontSize: 20, marginBottom: Spacing.md, lineHeight: 28 },

  bodyText:        { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.md },
  bold:            { fontFamily: Fonts.bold, color: Colors.textPrimary },

  callout:         { borderWidth: 1, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md },
  calloutLabel:    { fontFamily: Fonts.bold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  calloutText:     { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  // Formula card
  formulaCard:     { backgroundColor: Colors.lightGray, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md },
  formulaRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: Spacing.sm },
  formulaBox:      { backgroundColor: Colors.white, borderRadius: Radii.sm, padding: Spacing.sm, alignItems: 'center', minWidth: 72, ...Shadows.soft },
  formulaLabel:    { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginBottom: 2, textAlign: 'center' },
  formulaValue:    { fontFamily: Fonts.extraBold, fontSize: 18 },
  formulaOp:       { fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textMuted },
  formulaResult:   { borderRadius: Radii.sm, padding: Spacing.sm, alignItems: 'center' },
  formulaResultLabel: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },

  // Cost builder preview
  previewCard:     { borderWidth: 1.5, borderRadius: Radii.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  previewLabel:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  previewHint:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  // FI Number card
  fiNumberCard:    { borderWidth: 2, borderRadius: Radii.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md, backgroundColor: Colors.white, ...Shadows.soft },
  fiNumberLabel:   { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  fiNumberFormula: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 6 },

  // Projection card
  projCard:        { borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, backgroundColor: Colors.white, ...Shadows.soft },
  projTitle:       { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  projSub:         { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 18 },
  projRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: Spacing.sm },
  projItem:        { alignItems: 'center' },
  projItemLabel:   { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  projItemValue:   { fontFamily: Fonts.extraBold, fontSize: 18 },
  projVs:          { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textMuted },
  projStatus:      { borderRadius: Radii.sm, padding: Spacing.sm },
  projStatusText:  { fontFamily: Fonts.bold, fontSize: 12, textAlign: 'center' },

  // Retire age selector
  ageRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md, flexWrap: 'wrap' },
  ageLabel:        { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.textPrimary },
  ageChips:        { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ageChip:         { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.full, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.white },
  ageChipText:     { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },

  // Checklist
  checklistCard:   { backgroundColor: Colors.white, borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  checkDivider:    { height: 0.5, backgroundColor: Colors.border, marginVertical: 2 },

  // Summary
  summaryCard:     { borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.white, ...Shadows.soft },
  summaryTitle:    { fontFamily: Fonts.extraBold, fontSize: 16, marginBottom: Spacing.md },
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  summaryLabel:    { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, flex: 1 },
  summaryValue:    { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  summaryStatus:   { borderRadius: Radii.sm, padding: Spacing.sm, marginTop: Spacing.sm },
  summaryStatusText:{ fontFamily: Fonts.bold, fontSize: 12, textAlign: 'center' },

  // Buttons
  nextBtn:         { borderRadius: Radii.lg, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.md },
  nextBtnText:     { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
  twoButtons:      { flexDirection: 'row', gap: 10, marginTop: Spacing.md },
  outlineBtn:      { borderWidth: 1.5, borderRadius: Radii.lg, paddingVertical: 14, paddingHorizontal: Spacing.lg, alignItems: 'center', alignSelf: 'stretch', minWidth: 130 },
  outlineBtnText:  { fontFamily: Fonts.bold, fontSize: 14 },
});