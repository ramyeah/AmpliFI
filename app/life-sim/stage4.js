// app/life-sim/stage4.js
//
// Stage 4 — Your First Paycheck
//
// The salary lands. That's it. No sliders, no budget allocation — that comes
// in Stage 5 AFTER the user has tracked their spending and knows their numbers.
// Here the experience is purely emotional: the money arriving, the balance
// animating up, Fin acknowledging the moment.
//
// Flow:
//   1. Screen loads — bank balance shown before paycheck
//   2. "Receive paycheck" CTA → confetti + animated balance tick up
//   3. Fin says a couple of lines about what just happened
//   4. Complete stage → back to simulation
//
// Saves: stage4Data { income, bankBalance, paycheckCredited: true }
// Gate:  null — narrative flow after stage-3 (track spending)

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';
import { completeStage, loadSimProgress, updateWallet, saveSimProgress } from '../../lib/lifeSim';
import { getIncomeBracket, formatDual, STAGES } from '../../constants/lifeSimStages';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../../constants/theme';
import { auth } from '../../lib/firebase';
import { StageHeader, StageCompleteModal } from '../../components/LifeSimComponents';

const STAGE   = STAGES.find(s => s.id === 'stage-4');
const { width: SW, height: SH } = Dimensions.get('window');
const CONFETTI_COUNT  = 28;
const CONFETTI_COLORS = ['#F97B8B', '#3AAECC', '#5BBF8A', '#F5883A', '#8B6FD4', '#E6A800', '#FFFFFF'];

// ─── Confetti particle ────────────────────────────────────────────────────────

function ConfettiParticle({ index }) {
  const startX   = Math.random() * SW;
  const y        = useRef(new Animated.Value(-20)).current;
  const rotate   = useRef(new Animated.Value(0)).current;
  const opacity  = useRef(new Animated.Value(1)).current;
  const size     = 6 + Math.random() * 8;
  const color    = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const duration = 1200 + Math.random() * 800;
  const delay    = Math.random() * 400;
  const isRect   = index % 3 !== 0;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y,      { toValue: SH * 0.75, duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 720 + Math.random() * 360, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(opacity, { toValue: 0, duration: duration * 0.4, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1080], outputRange: ['0deg', '1080deg'] });

  return (
    <Animated.View style={{
      position:        'absolute',
      top:             0,
      width:           isRect ? size : size * 1.2,
      height:          isRect ? size * 0.4 : size * 1.2,
      borderRadius:    isRect ? 2 : size * 0.6,
      backgroundColor: color,
      opacity,
      transform:       [{ translateX: startX }, { translateY: y }, { rotate: rotateDeg }],
    }} />
  );
}

// ─── Animated balance counter ─────────────────────────────────────────────────

function AnimatedBalance({ from, to, duration = 1400, color }) {
  const anim = useRef(new Animated.Value(from)).current;
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    Animated.timing(anim, { toValue: to, duration, useNativeDriver: false }).start();
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [to]);

  return (
    <Text style={[an.balance, { color }]}>
      ${display.toLocaleString()}
    </Text>
  );
}

const an = StyleSheet.create({
  balance: { fontFamily: Fonts.extraBold, fontSize: 52, textAlign: 'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Stage4() {
  const router     = useRouter();
  const profile    = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);

  const uid       = auth.currentUser?.uid;
  const finCoins  = profile?.finCoins ?? 0;
  const firstName = profile?.name?.split(' ')[0] ?? 'there';
  const bracket   = getIncomeBracket(finCoins);
  const income    = bracket.income;

  const [sim,           setSim]           = useState(null);
  const [phase,         setPhase]         = useState('pre');   // pre | confetti | done
  const [prevBalance,   setPrevBalance]   = useState(0);
  const [newBalance,    setNewBalance]    = useState(0);
  const [showConfetti,  setShowConfetti]  = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [showComplete,  setShowComplete]  = useState(false);

  useEffect(() => {
    if (!uid) return;
    loadSimProgress(uid).then(simData => {
      setSim(simData);
      const bankId = simData?.stage2Data?.bankId ?? simData?.bankAccountId;
      const wallet = bankId
        ? (simData?.wallets ?? []).find(w => w.id === bankId)
        : (simData?.wallets ?? []).find(w => w.type === 'bank') ?? (simData?.wallets ?? []).find(w => w.id === 'wallet');
      const currentBalance = wallet?.balance ?? 0;
      setPrevBalance(currentBalance);
      setNewBalance(currentBalance + income);
    }).catch(console.error);
  }, [uid]);

  const bankWallet = (sim?.wallets ?? []).find(w => w.type === 'bank');
  const bankName   = bankWallet?.institution ?? sim?.stage2Data?.bankName ?? 'your account';

  const handleReceivePaycheck = async () => {
    if (saving) return;
    setSaving(true);
    setShowConfetti(true);

    try {
      const freshSim = await loadSimProgress(uid);
      const bankId   = freshSim?.stage2Data?.bankId ?? freshSim?.bankAccountId;
      const wallet   = bankId
        ? (freshSim?.wallets ?? []).find(w => w.id === bankId)
        : (freshSim?.wallets ?? []).find(w => w.type === 'bank') ?? (freshSim?.wallets ?? []).find(w => w.id === 'wallet');

      if (wallet) {
        await updateWallet(uid, wallet.id, income);
      }

      const stage4Data = {
        income,
        bankBalance: (wallet?.balance ?? 0) + income,
        paycheckCredited: true,
      };

      await completeStage(uid, 'stage-4', stage4Data, freshSim?.wallets ?? []);

      // Reload after completeStage so we don't wipe completedStages
      const postSim = await loadSimProgress(uid);
      await saveSimProgress(uid, { ...postSim, stage4Data });

      setProfile({ ...profile, finCoins: finCoins + 50 });

      // Let confetti run for a moment then show complete
      setTimeout(() => {
        setShowConfetti(false);
        setPhase('done');
      }, 1800);

    } catch (e) {
      console.error('Stage4 paycheck:', e);
      setSaving(false);
    }
  };

  const handleComplete = () => {
    setShowComplete(true);
  };

  return (
    <View style={s.container}>
      {/* Confetti layer */}
      {showConfetti && (
        <View style={s.confettiLayer} pointerEvents="none">
          {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </View>
      )}

      <StageHeader
        title={STAGE?.title ?? 'Your First Paycheck'}
        color={STAGE?.color ?? Colors.primary}
        sim={sim}
        onBack={() => router.back()}
      />

      <View style={s.body}>

        {/* Bank account context */}
        <View style={[s.bankCard, { borderColor: (STAGE?.color ?? Colors.primary) + '30' }]}>
          <Text style={s.bankCardLabel}>💳  {bankName}</Text>
          <Text style={s.bankCardSub}>
            {phase === 'pre'
              ? 'Awaiting first salary deposit'
              : 'Salary received'}
          </Text>
        </View>

        {/* Balance display */}
        <View style={s.balanceWrap}>
          {phase === 'pre' ? (
            <>
              <Text style={s.balanceLabel}>Current balance</Text>
              <Text style={[s.balanceStatic, { color: STAGE?.color ?? Colors.primary }]}>
                ${prevBalance.toLocaleString()}
              </Text>
            </>
          ) : (
            <>
              <Text style={s.balanceLabel}>New balance</Text>
              <AnimatedBalance
                from={prevBalance}
                to={newBalance}
                color={STAGE?.color ?? Colors.primary}
              />
              <Text style={s.incomeTag}>
                +{formatDual(income).sgd} salary credited
              </Text>
            </>
          )}
        </View>

        {/* Fin's message */}
        <View style={[s.finCard, { borderColor: (STAGE?.color ?? Colors.primary) + '25' }]}>
          <Text style={s.finOwl}>🦉</Text>
          <Text style={s.finText}>
            {phase === 'pre'
              ? `Your first Singapore salary is ready to land, ${firstName}. ${formatDual(income).sgd} — that's ${bracket.emoji} ${bracket.label} money. Tap below to receive it.`
              : `There it is. ${formatDual(income).sgd} in your ${bankName} account. Now you know what you're working with every month.`
            }
          </Text>
        </View>

        {/* CTA */}
        {phase === 'pre' && (
          <TouchableOpacity
            style={[s.cta, { backgroundColor: saving ? Colors.border : (STAGE?.color ?? Colors.primary) }]}
            onPress={handleReceivePaycheck}
            disabled={saving}
            activeOpacity={0.88}
          >
            <Text style={[s.ctaText, saving && { color: Colors.textMuted }]}>
              {saving ? 'Crediting…' : `Receive ${formatDual(income).sgd} →`}
            </Text>
          </TouchableOpacity>
        )}

        {phase === 'done' && (
          <TouchableOpacity
            style={[s.cta, { backgroundColor: STAGE?.color ?? Colors.primary }]}
            onPress={handleComplete}
            activeOpacity={0.88}
          >
            <Text style={s.ctaText}>Continue →</Text>
          </TouchableOpacity>
        )}

      </View>

      <StageCompleteModal
        visible={showComplete}
        stageTitle={STAGE?.title ?? 'Your First Paycheck'}
        chapterNum={STAGE?.number}
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
  confettiLayer:  { ...StyleSheet.absoluteFillObject, zIndex: 10 },

  body:           { flex: 1, padding: Spacing.lg, justifyContent: 'center', gap: Spacing.lg },

  bankCard:       { backgroundColor: Colors.white, borderWidth: 1.5, borderRadius: Radii.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, ...Shadows.soft },
  bankCardLabel:  { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  bankCardSub:    { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  balanceWrap:    { alignItems: 'center', paddingVertical: Spacing.lg },
  balanceLabel:   { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  balanceStatic:  { fontFamily: Fonts.extraBold, fontSize: 52, textAlign: 'center' },
  incomeTag:      { fontFamily: Fonts.semiBold, fontSize: 13, color: Colors.successDark, marginTop: 8 },

  finCard:        { backgroundColor: Colors.white, borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.md, flexDirection: 'row', gap: 10, alignItems: 'flex-start', ...Shadows.soft },
  finOwl:         { fontSize: 24, marginTop: 2 },
  finText:        { fontFamily: Fonts.semiBold, fontSize: 14, color: Colors.textPrimary, lineHeight: 22, flex: 1 },

  cta:            { borderRadius: Radii.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText:        { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});