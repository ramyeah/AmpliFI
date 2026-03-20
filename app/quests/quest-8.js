// app/quests/quest-8.js
// Quest 8 — Choose Your Vehicle (with Risk Profile Quiz)
// Self-contained modal quest. Props: visible, onComplete, onClose, sim.

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, ActivityIndicator, Image,
  StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { completeStage } from '../../lib/lifeSim';
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

// ─── Risk Quiz Data ─────────────────────────────────────────────────────────
const RISK_QUESTIONS = [
  { id: 'q1', question: 'You invest FC 10,000. A month later it drops to FC 7,500. What do you do?', options: [
    { label: 'Sell immediately \u2014 I cannot handle this loss', score: 0 },
    { label: 'Hold and wait \u2014 markets recover eventually', score: 1 },
    { label: 'Buy more \u2014 this is a discount opportunity', score: 2 },
  ]},
  { id: 'q2', question: 'What is your primary goal for this money?', options: [
    { label: 'Preserve it \u2014 I cannot afford to lose any', score: 0 },
    { label: 'Grow it steadily over time', score: 1 },
    { label: 'Maximise long-term growth, even if bumpy', score: 2 },
  ]},
  { id: 'q3', question: 'How would you feel if your portfolio lost 20% in a year?', options: [
    { label: 'Extremely stressed \u2014 I would lose sleep', score: 0 },
    { label: 'Uncomfortable but I would stay the course', score: 1 },
    { label: 'Fine \u2014 I know it will recover', score: 2 },
  ]},
  { id: 'q4', question: 'When do you expect to need this money?', options: [
    { label: 'Within 3 years', score: 0 },
    { label: '3 to 10 years', score: 1 },
    { label: 'More than 10 years away', score: 2 },
  ]},
  { id: 'q5', question: 'Which statement best describes you?', options: [
    { label: 'I prefer guaranteed smaller returns over uncertain bigger ones', score: 0 },
    { label: 'I want a balance between security and growth', score: 1 },
    { label: 'I am focused on maximum long-term returns and can handle volatility', score: 2 },
  ]},
];

const RISK_PROFILES = {
  conservative: {
    label: 'Conservative', icon: '\uD83D\uDEE1\uFE0F',
    color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight,
    description: 'You prioritise protecting what you have over maximising returns. Stability matters more than growth speed.',
    vehicleMatch: 'nestvault',
    vehicleReason: 'NestVault suits your profile \u2014 automated, diversified, and managed for you. Lower volatility, steady returns.',
  },
  balanced: {
    label: 'Balanced', icon: '\u2696\uFE0F',
    color: MODULE_COLORS['module-1'].color, colorLight: MODULE_COLORS['module-1'].colorLight,
    description: 'You are comfortable with moderate risk for moderate returns. You want growth without extreme swings.',
    vehicleMatch: 'drakon-rss',
    vehicleReason: 'Drakon RSS Plan fits your profile \u2014 structured monthly investing, lower fees than robo, steady accumulation.',
  },
  aggressive: {
    label: 'Aggressive', icon: '\uD83D\uDE80',
    color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight,
    description: 'You are willing to accept short-term volatility for higher long-term returns. You stay calm when markets drop.',
    vehicleMatch: 'apextrade-diy',
    vehicleReason: 'ApexTrade DIY matches your profile \u2014 lowest fees, highest potential return, maximum control. But you need to stay engaged.',
  },
};

// ─── Vehicle Data ───────────────────────────────────────────────────────────
const VEHICLES = [
  {
    id: 'nestvault', name: 'NestVault', type: 'Robo-Advisor', icon: '\uD83E\uDD16',
    annualReturn: { min: 6, max: 7, display: '6\u20137%' }, ter: 0.65,
    effort: 'None', effortIcon: '\uD83D\uDE34',
    color: MODULE_COLORS['module-1'].color, colorLight: MODULE_COLORS['module-1'].colorLight,
    tagline: 'Set it and forget it',
    description: 'NestVault manages everything automatically. You deposit monthly and the algorithm handles allocation, rebalancing, and reinvestment. Best for people who want returns without effort.',
    pros: ['Zero effort required', 'Auto-rebalancing', 'Diversified by default'],
    cons: ['Highest fee at 0.65%', 'Less control over holdings'],
    bestFor: 'Beginners and busy people',
    finNote: 'NestVault is the easiest on-ramp to investing. The fee is higher than DIY, but you pay for the automation. For most fresh grads, this is the right starting point.',
  },
  {
    id: 'drakon-rss', name: 'Drakon RSS Plan', type: 'ETF RSS Plan', icon: '\uD83D\uDCCB',
    annualReturn: { min: 5, max: 6, display: '5\u20136%' }, ter: 0.30,
    effort: 'Low', effortIcon: '\u2615',
    color: MODULE_COLORS['module-2'].color, colorLight: MODULE_COLORS['module-2'].colorLight,
    tagline: 'Structured and affordable',
    description: 'Drakon RSS Plan is a Regular Savings Plan \u2014 you commit to a fixed monthly amount and it automatically buys ETF units. Lower fee than robo, more structured than DIY.',
    pros: ['Lower fee than robo', 'Automatic monthly purchase', 'Simple to understand'],
    cons: ['Less flexible than DIY', 'Fixed ETF selection'],
    bestFor: 'Disciplined savers who want lower fees',
    finNote: 'The RSS Plan sits between robo and DIY. You get automation with lower fees. The return range is slightly lower, but the fee saving compounds significantly over decades.',
  },
  {
    id: 'apextrade-diy', name: 'ApexTrade DIY', type: 'DIY ETF Portfolio', icon: '\uD83C\uDFAF',
    annualReturn: { min: 4, max: 8, display: '4\u20138%' }, ter: 0.20,
    effort: 'Medium', effortIcon: '\uD83D\uDCCA',
    color: MODULE_COLORS['module-3'].color, colorLight: MODULE_COLORS['module-3'].colorLight,
    tagline: 'Maximum control, lowest cost',
    description: 'ApexTrade DIY means you choose your own ETFs, execute your own trades, and manage your own rebalancing. Lowest fee, highest potential return \u2014 but requires engagement.',
    pros: ['Lowest fee at 0.20%', 'Full control over allocation', 'Highest potential return'],
    cons: ['Requires active management', 'Risk of emotional decisions'],
    bestFor: 'Engaged investors who enjoy the process',
    finNote: 'DIY has the best numbers on paper \u2014 lowest fee, widest return range. But it only works if you actually manage it. If you go DIY and ignore it for months, you would have been better off with NestVault.',
  },
];

const calculate30YearValue = (vehicle, monthlyInv) => {
  let balance = 0;
  const monthlyRate = ((vehicle.annualReturn.min + vehicle.annualReturn.max) / 2) / 100 / 12;
  const monthlyFee = vehicle.ter / 100 / 12;
  for (let m = 0; m < 360; m++) { balance += monthlyInv; balance *= (1 + monthlyRate); balance *= (1 - monthlyFee); }
  return Math.round(balance);
};

// ─── Component ──────────────────────────────────────────────────────────────
export default function Quest8({ visible, onComplete, onClose, sim }) {
  const insets = useSafeAreaInsets();

  const monthlyIncome = sim?.income ?? 4500;
  const monthlyInvestment = Math.round(monthlyIncome * 0.20);

  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // Risk quiz state
  const [riskAnswers, setRiskAnswers] = useState({});
  const [riskProfile, setRiskProfile] = useState(null);
  const [showRiskResult, setShowRiskResult] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Step 3 preview
  const [previewMonth, setPreviewMonth] = useState(0);
  const [previewRunning, setPreviewRunning] = useState(false);
  const [previewComplete, setPreviewComplete] = useState(false);
  const vehicleBalances = useRef({ nestvault: 0, 'drakon-rss': 0, 'apextrade-diy': 0 });
  const [displayBalances, setDisplayBalances] = useState({ nestvault: 0, 'drakon-rss': 0, 'apextrade-diy': 0 });

  const calculateRiskProfile = (answers) => {
    const total = Object.values(answers).reduce((sum, val) => sum + val, 0);
    if (total <= 3) return 'conservative';
    if (total <= 6) return 'balanced';
    return 'aggressive';
  };

  // Reset on open
  useEffect(() => {
    if (visible) {
      setStep(1); setSelectedVehicle(null); setSaving(false); setShowConfetti(false);
      setShowExitConfirm(false); setShowError(false);
      setRiskAnswers({}); setRiskProfile(null); setShowRiskResult(false); setCurrentQuestion(0);
      setPreviewMonth(0); setPreviewRunning(false); setPreviewComplete(false);
      vehicleBalances.current = { nestvault: 0, 'drakon-rss': 0, 'apextrade-diy': 0 };
      setDisplayBalances({ nestvault: 0, 'drakon-rss': 0, 'apextrade-diy': 0 });
    }
  }, [visible]);

  // Pre-select recommended vehicle when step 4 first renders
  useEffect(() => {
    if (step === 4 && riskProfile && !selectedVehicle) {
      const recommended = VEHICLES.find(v => v.id === RISK_PROFILES[riskProfile].vehicleMatch);
      if (recommended) setSelectedVehicle(recommended);
    }
  }, [step, riskProfile]);

  // Step 3 preview animation
  useEffect(() => {
    if (step !== 3) return;
    vehicleBalances.current = { nestvault: 0, 'drakon-rss': 0, 'apextrade-diy': 0 };
    setDisplayBalances({ nestvault: 0, 'drakon-rss': 0, 'apextrade-diy': 0 });
    setPreviewMonth(0); setPreviewComplete(false);
    let cancelled = false;
    const run = async () => {
      setPreviewRunning(true);
      await new Promise(r => setTimeout(r, 800));
      if (cancelled) return;
      for (let month = 1; month <= 3; month++) {
        if (cancelled) return;
        VEHICLES.forEach(v => {
          const prev = vehicleBalances.current[v.id];
          const afterDeposit = prev + monthlyInvestment;
          const midReturn = (v.annualReturn.min + v.annualReturn.max) / 2 / 100 / 12;
          const afterReturn = afterDeposit * (1 + midReturn);
          const afterFee = afterReturn * (1 - v.ter / 100 / 12);
          vehicleBalances.current[v.id] = afterFee;
        });
        setPreviewMonth(month);
        const targets = { ...vehicleBalances.current };
        const start = Date.now();
        await new Promise(resolve => {
          const iv = setInterval(() => {
            if (cancelled) { clearInterval(iv); resolve(); return; }
            const p = Math.min((Date.now() - start) / 800, 1);
            const e = 1 - Math.pow(1 - p, 3);
            const nb = {};
            VEHICLES.forEach(v => { nb[v.id] = Math.round(targets[v.id] * e); });
            setDisplayBalances(nb);
            if (p >= 1) { clearInterval(iv); resolve(); }
          }, 16);
        });
        if (month < 3) await new Promise(r => setTimeout(r, 600));
      }
      if (!cancelled) { setPreviewRunning(false); setPreviewComplete(true); }
    };
    run();
    return () => { cancelled = true; };
  }, [step]);

  const handleBack = () => {
    if (step === 1 && !showRiskResult) {
      if (currentQuestion > 0) setCurrentQuestion(q => q - 1);
    } else if (step === 1 && showRiskResult) {
      setShowRiskResult(false);
      setCurrentQuestion(RISK_QUESTIONS.length - 1);
    } else {
      setStep(s => s - 1);
    }
  };

  const handleClose = () => {
    if (step < 5) setShowExitConfirm(true);
    else onClose();
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      await updateDoc(doc(db, 'users', uid), { riskProfile });
      await updateDoc(doc(db, 'simProgress', uid), {
        investmentVehicle: {
          id: selectedVehicle.id, name: selectedVehicle.name, type: selectedVehicle.type,
          ter: selectedVehicle.ter, annualReturn: selectedVehicle.annualReturn,
          effort: selectedVehicle.effort, icon: selectedVehicle.icon,
        },
        updatedAt: Date.now(),
      });
      await completeStage(uid, 'stage-8', { vehicleId: selectedVehicle.id, vehicleName: selectedVehicle.name, riskProfile });
      setShowConfetti(true);
      onComplete();
    } catch (e) { setShowError(true); setSaving(false); }
  };

  // ── Header ──────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <View style={st.headerTopRow}>
        {(step > 1 || (step === 1 && (currentQuestion > 0 || showRiskResult))) ? (
          <TouchableOpacity style={st.backBtn} onPress={handleBack}>
            <Text style={st.backBtnText}>{'\u2039'} Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <TouchableOpacity style={st.closeBtn} onPress={handleClose}><Text style={st.closeBtnText}>{'\u2715'}</Text></TouchableOpacity>
      </View>
      <Text style={st.headerTitle}>{'Quest 4.2 \u00B7 Choose Your Vehicle'}</Text>
      <View style={st.stepPills}>{[1,2,3,4,5].map(i => <View key={i} style={[st.stepPill, step >= i && st.stepPillActive]} />)}</View>
    </View>
  );

  const FinCard = ({ children }) => (
    <View style={st.finCard}>
      <View style={st.finCardTop}>
        <View style={st.finCardAvatar}><Text style={{ fontSize: 16 }}>{'\uD83D\uDC1F'}</Text></View>
        <Text style={st.finCardLabel}>FIN SAYS</Text>
      </View>
      <Text style={st.finCardText}>{children}</Text>
    </View>
  );

  // ── Step 1 — Risk Profile Quiz ────────────────────────────────────────
  const renderStep1 = () => {
    if (showRiskResult && riskProfile) {
      const profile = RISK_PROFILES[riskProfile];
      return (
        <>
          <Header />
          <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
            <View style={[st.profileCard, { backgroundColor: profile.colorLight, borderColor: profile.color }]}>
              <Text style={st.profileIcon}>{profile.icon}</Text>
              <Text style={[st.profileLabel, { color: profile.color }]}>{profile.label} Investor</Text>
              <Text style={st.profileDesc}>{profile.description}</Text>
            </View>
            <View style={st.scoreCard}>
              <Text style={st.scoreTitle}>YOUR ANSWERS</Text>
              {RISK_QUESTIONS.map(q => {
                const answered = riskAnswers[q.id];
                const option = q.options.find(o => o.score === answered);
                return (
                  <View key={q.id} style={st.scoreRow}>
                    <View style={[st.scoreDot, { backgroundColor: profile.color }]} />
                    <Text style={st.scoreAnswer} numberOfLines={2}>{option?.label ?? '\u2014'}</Text>
                  </View>
                );
              })}
            </View>
            <View style={[st.vehiclePreviewCard, { borderLeftColor: profile.color }]}>
              <Text style={st.vehiclePreviewLabel}>RECOMMENDED FOR YOU</Text>
              <Text style={st.vehiclePreviewName}>{VEHICLES.find(v => v.id === profile.vehicleMatch)?.name}</Text>
              <Text style={st.vehiclePreviewReason}>{profile.vehicleReason}</Text>
            </View>
            <FinCard>{riskProfile === 'conservative'
              ? 'A conservative profile is nothing to be embarrassed about. Protecting capital and sleeping well at night is a legitimate strategy. The key is making sure your money is still growing \u2014 just with less volatility.'
              : riskProfile === 'balanced'
              ? 'Balanced investors tend to build the most sustainable long-term wealth. You are not chasing highs or panicking at lows. That consistency is what compounding needs to do its job.'
              : 'An aggressive profile only works if you genuinely stay the course when markets drop. The biggest risk for aggressive investors is not volatility \u2014 it is panic selling at the bottom. If you hold through the dips, the math is strongly in your favour.'
            }</FinCard>
            <View style={{ paddingBottom: insets.bottom + 32 }}>
              <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(2)} activeOpacity={0.88}>
                <Text style={st.ctaBtnText}>{"See the vehicles \u2192"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      );
    }

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>{"What kind of\ninvestor are you?"}</Text>
          <FinCard>Before you pick a vehicle, you need to know your risk tolerance. There is no right or wrong answer here. Answer honestly \u2014 the goal is to match you with an investment approach you will actually stick to. The best strategy is the one you will not abandon when markets get rough.</FinCard>
          <View style={st.questionCard}>
            <Text style={st.questionProgress}>Question {currentQuestion + 1} of {RISK_QUESTIONS.length}</Text>
            <View style={st.questionProgressBar}><View style={[st.questionProgressFill, { width: `${((currentQuestion + 1) / RISK_QUESTIONS.length) * 100}%` }]} /></View>
            <Text style={st.questionText}>{RISK_QUESTIONS[currentQuestion].question}</Text>
            {RISK_QUESTIONS[currentQuestion].options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[st.answerOption, riskAnswers[RISK_QUESTIONS[currentQuestion].id] === opt.score && st.answerOptionSelected]}
                onPress={() => {
                  const newAnswers = { ...riskAnswers, [RISK_QUESTIONS[currentQuestion].id]: opt.score };
                  setRiskAnswers(newAnswers);
                  setTimeout(() => {
                    if (currentQuestion < RISK_QUESTIONS.length - 1) {
                      setCurrentQuestion(q => q + 1);
                    } else {
                      const profile = calculateRiskProfile(newAnswers);
                      setRiskProfile(profile);
                      setShowRiskResult(true);
                    }
                  }, 300);
                }}
                activeOpacity={0.85}
              >
                <Text style={[st.answerText, riskAnswers[RISK_QUESTIONS[currentQuestion].id] === opt.score && st.answerTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 2 — What is an investment vehicle? ───────────────────────────
  const renderStep2 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>{'How your money\ngets to the market'}</Text>
        <FinCard>Investing is not just buying stocks. Before you invest a single coin, you need a vehicle {'\u2014'} the platform or product that actually puts your money into the market. Different vehicles have different fees, different levels of effort, and different expected returns. Choosing the right one for your life matters more than most people realise.</FinCard>
        <View style={st.conceptTile}><Text style={st.conceptIcon}>{'\uD83D\uDCB8'}</Text><View style={{ flex: 1 }}><Text style={st.conceptTitle}>TER {'\u2014'} Total Expense Ratio</Text><Text style={st.conceptDesc}>The annual fee deducted from your returns. 0.20% vs 0.65% sounds small {'\u2014'} over 30 years it is not.</Text></View></View>
        <View style={st.conceptTile}><Text style={st.conceptIcon}>{'\uD83D\uDCC8'}</Text><View style={{ flex: 1 }}><Text style={st.conceptTitle}>Expected Return</Text><Text style={st.conceptDesc}>The historical average annual return. A range, not a guarantee. Higher potential = higher risk.</Text></View></View>
        <View style={st.conceptTile}><Text style={st.conceptIcon}>{'\u26A1'}</Text><View style={{ flex: 1 }}><Text style={st.conceptTitle}>Effort Level</Text><Text style={st.conceptDesc}>How much active management the vehicle requires. None to medium. Be honest about your actual habits.</Text></View></View>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 12, marginBottom: 20 }}>You have FC {monthlyInvestment.toLocaleString()} to invest each month. Let us see what each vehicle does with it.</Text>
        <View style={{ paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={st.ctaBtn} onPress={() => setStep(3)} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"See the 3-month preview \u2192"}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 3 — 3-month animated preview ─────────────────────────────────
  const renderStep3 = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <Text style={st.questTitle}>FC {monthlyInvestment.toLocaleString()} invested monthly</Text>
        <Text style={st.questSub}>Watch 3 months play out across all three vehicles</Text>
        {VEHICLES.map(v => (
          <View key={v.id} style={[st.previewCard, { borderLeftWidth: 4, borderLeftColor: v.color }]}>
            <View style={st.previewCardTop}>
              <View style={[st.previewIconCircle, { backgroundColor: v.colorLight }]}><Text style={{ fontSize: 20 }}>{v.icon}</Text></View>
              <View style={{ flex: 1 }}><Text style={st.previewVehicleName}>{v.name}</Text><Text style={st.previewVehicleType}>{v.type}</Text></View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN} style={{ width: 14, height: 14 }} /><Text style={[st.previewBalance, { color: v.color }]}>{(displayBalances[v.id] ?? 0).toLocaleString()}</Text></View>
                <Text style={st.previewFee}>TER {v.ter}%</Text>
              </View>
            </View>
            <View style={st.previewMonthDots}>
              {[1,2,3].map(m => <View key={m} style={[st.previewDot, previewMonth >= m && { backgroundColor: v.color }]} />)}
              <Text style={st.previewMonthLabel}>Month {previewMonth}/3</Text>
            </View>
          </View>
        ))}
        {previewComplete && (
          <View style={st.comparisonCard}>
            <Text style={st.comparisonTitle}>After 3 months at FC {monthlyInvestment.toLocaleString()}/month:</Text>
            {VEHICLES.map(v => (
              <View key={v.id} style={st.comparisonRow}>
                <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, flex: 1 }}>{v.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN} style={{ width: 12, height: 12 }} /><Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: v.color }}>{(displayBalances[v.id] ?? 0).toLocaleString()}</Text></View>
              </View>
            ))}
            <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, fontStyle: 'italic', marginTop: 8 }}>Over 30 years, the fee difference becomes FC {Math.abs(calculate30YearValue(VEHICLES[0], monthlyInvestment) - calculate30YearValue(VEHICLES[2], monthlyInvestment)).toLocaleString()}.</Text>
          </View>
        )}
        {previewComplete && <FinCard>The 3-month difference looks small. But compound the fee drag over 30 years and NestVault costs you significantly more than DIY. The question is whether the automation is worth it to you personally.</FinCard>}
        <View style={{ paddingBottom: insets.bottom + 32 }}>
          <TouchableOpacity style={[st.ctaBtn, !previewComplete && st.ctaBtnDisabled]} onPress={() => setStep(4)} disabled={!previewComplete} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"Choose my vehicle \u2192"}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  // ── Step 4 — Deep dive + pick ─────────────────────────────────────────
  const renderStep4 = () => {
    const profile = riskProfile ? RISK_PROFILES[riskProfile] : null;
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>Pick your vehicle</Text>
          <Text style={st.questSub}>This will be your investment home. Choose carefully.</Text>
          {VEHICLES.map(v => {
            const isSelected = selectedVehicle?.id === v.id;
            const isRecommended = profile?.vehicleMatch === v.id;
            return (
              <TouchableOpacity key={v.id} style={[st.vehicleCard, isSelected && { borderColor: v.color, borderWidth: 2, backgroundColor: v.colorLight }]} onPress={() => setSelectedVehicle(v)} activeOpacity={0.82}>
                {isRecommended && <View style={[st.recommendedBadge, { backgroundColor: v.color }]}><Text style={st.recommendedBadgeText}>{'\u2713'} Recommended for your profile</Text></View>}
                <View style={st.vehicleCardHeader}>
                  <View style={[st.vehicleIconCircle, { backgroundColor: v.colorLight }]}><Text style={{ fontSize: 22 }}>{v.icon}</Text></View>
                  <View style={{ flex: 1 }}><Text style={st.vehicleCardName}>{v.name}</Text><Text style={st.vehicleCardType}>{v.type}</Text></View>
                  {isSelected && <Text style={[st.vehicleCheck, { color: v.color }]}>{'\u2713'}</Text>}
                </View>
                <View style={st.vehicleStats}>
                  <View style={st.vehicleStat}><Text style={st.vehicleStatLabel}>RETURN</Text><Text style={[st.vehicleStatValue, { color: v.color }]}>{v.annualReturn.display}</Text></View>
                  <View style={st.vehicleStatDivider} />
                  <View style={st.vehicleStat}><Text style={st.vehicleStatLabel}>FEE</Text><Text style={[st.vehicleStatValue, { color: v.color }]}>{v.ter}%</Text></View>
                  <View style={st.vehicleStatDivider} />
                  <View style={st.vehicleStat}><Text style={st.vehicleStatLabel}>EFFORT</Text><Text style={st.vehicleStatValue}>{v.effortIcon} {v.effort}</Text></View>
                </View>
                <Text style={st.vehicleTagline}>{v.tagline}</Text>
                {isSelected && (
                  <View style={st.vehicleExpanded}>
                    <Text style={st.vehicleDesc}>{v.description}</Text>
                    <View style={st.vehicleProscons}>
                      {v.pros.map((p, i) => <Text key={`pro-${i}`} style={st.vehiclePro}>{'\u2713'} {p}</Text>)}
                      {v.cons.map((c, i) => <Text key={`con-${i}`} style={st.vehicleCon}>{'\u2717'} {c}</Text>)}
                    </View>
                    <Text style={st.vehicleBestFor}>Best for: {v.bestFor}</Text>
                    <View style={[st.vehicleFinNote, { borderLeftColor: v.color }]}><Text style={st.vehicleFinNoteLabel}>{'\uD83D\uDC1F'} FIN</Text><Text style={st.vehicleFinNoteText}>{v.finNote}</Text></View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          {selectedVehicle && (
            <View style={st.longTermCard}>
              <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 8 }}>YOUR CHOICE: {selectedVehicle.name}</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, marginBottom: 4 }}>After 30 years investing FC {monthlyInvestment.toLocaleString()}/month:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}><Image source={COIN} style={{ width: 16, height: 16 }} /><Text style={{ fontFamily: Fonts.extraBold, fontSize: 22, color: selectedVehicle.color }}>{calculate30YearValue(selectedVehicle, monthlyInvestment).toLocaleString()}</Text></View>
              {selectedVehicle.id !== 'nestvault' && (() => {
                const diff = calculate30YearValue(selectedVehicle, monthlyInvestment) - calculate30YearValue(VEHICLES[0], monthlyInvestment);
                return <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: diff >= 0 ? MODULE_COLORS['module-3'].color : Colors.warningDark }}>vs NestVault: FC {Math.abs(diff).toLocaleString()} {diff >= 0 ? 'more' : 'less'}</Text>;
              })()}
            </View>
          )}
          <View style={{ paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={[st.ctaBtn, !selectedVehicle && st.ctaBtnDisabled]} onPress={() => { setStep(5); setShowConfetti(true); }} disabled={!selectedVehicle} activeOpacity={0.88}><Text style={st.ctaBtnText}>{"This is my vehicle \u2192"}</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

  // ── Step 5 — Success ──────────────────────────────────────────────────
  const renderStep5 = () => {
    const v = selectedVehicle;
    const finMessage = v?.id === 'nestvault'
      ? 'You picked automation. Smart for a first-time investor. NestVault handles everything \u2014 just make sure you keep depositing every month. Consistency matters more than the vehicle.'
      : v?.id === 'drakon-rss'
        ? 'Good balance of cost and convenience. The RSS Plan automates your monthly purchase and keeps fees low. Stay consistent and the compounding does the work.'
        : 'You chose control. The lowest fees give you a mathematical edge \u2014 but only if you stay engaged. Set a monthly reminder to review your allocation. Do not let it go stale.';
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
          <Text style={st.questTitle}>{v?.name ?? 'Vehicle'} chosen</Text>
          <Text style={st.questSub}>{v?.type}</Text>
          <View style={st.successVehicleCard}>
            <Text style={{ fontSize: 48 }}>{v?.icon}</Text>
            <Text style={{ fontFamily: Fonts.extraBold, fontSize: 20, color: Colors.textPrimary, marginTop: 8 }}>{v?.name}</Text>
            <View style={st.statChipRow}>
              <View style={st.statChip}><Text style={st.statChipLabel}>RETURN</Text><Text style={[st.statChipValue, { color: v?.color }]}>{v?.annualReturn.display}</Text></View>
              <View style={st.statChip}><Text style={st.statChipLabel}>FEE</Text><Text style={[st.statChipValue, { color: v?.color }]}>{v?.ter}%</Text></View>
              <View style={st.statChip}><Text style={st.statChipLabel}>EFFORT</Text><Text style={[st.statChipValue, { color: v?.color }]}>{v?.effortIcon} {v?.effort}</Text></View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Image source={COIN} style={{ width: 14, height: 14 }} /><Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: Colors.textSecondary }}>FC {monthlyInvestment.toLocaleString()} invested monthly</Text></View>
          </View>
          <View style={st.unlockCard}>
            <Text style={st.unlockPill}>{'\uD83D\uDD13'} UNLOCKED</Text>
            <Text style={st.unlockText}>Investment vehicle chosen. Ready to put money to work.</Text>
            <View style={st.unlockDivider} />
            <Text style={st.unlockHint}>{'\uD83D\uDCC8'} Quest 4.3 {'\u2014'} First Investment now unlocked</Text>
          </View>
          <FinCard>{finMessage}</FinCard>
          <View style={{ paddingBottom: insets.bottom + 32 }}>
            <TouchableOpacity style={[st.ctaBtn, saving && st.ctaBtnDisabled]} onPress={handleComplete} disabled={saving} activeOpacity={0.88}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={st.ctaBtnText}>{"Back to FinCity \u2192"}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  };

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
          {step === 5 && renderStep5()}
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

  ctaBtn: { backgroundColor: Colors.primary, borderRadius: Radii.lg, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaBtnText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },

  unlockCard: { backgroundColor: MODULE_COLORS['module-1'].colorLight, borderRadius: Radii.lg, padding: 16, marginBottom: 16, width: '100%' },
  unlockPill: { fontFamily: Fonts.bold, fontSize: 10, color: MODULE_COLORS['module-1'].color, letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, overflow: 'hidden', alignSelf: 'flex-start', marginBottom: 8 },
  unlockText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginBottom: 10 },
  unlockDivider: { height: 1, backgroundColor: MODULE_COLORS['module-1'].color, opacity: 0.2, marginBottom: 10 },
  unlockHint: { fontFamily: Fonts.regular, fontSize: 12, color: MODULE_COLORS['module-1'].color },

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

  // Risk quiz
  questionCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 16, ...Shadows.soft },
  questionProgress: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  questionProgressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  questionProgressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  questionText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary, lineHeight: 22, marginBottom: 16 },
  answerOption: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 8, backgroundColor: Colors.white },
  answerOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  answerText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  answerTextSelected: { color: Colors.primary, fontFamily: Fonts.bold },

  // Profile result
  profileCard: { borderRadius: 16, borderWidth: 2, padding: 20, alignItems: 'center', marginBottom: 16 },
  profileIcon: { fontSize: 48, marginBottom: 8 },
  profileLabel: { fontFamily: Fonts.extraBold, fontSize: 22, marginBottom: 8 },
  profileDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  scoreCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 16, ...Shadows.soft },
  scoreTitle: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 1, color: Colors.textMuted, marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  scoreDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  scoreAnswer: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  vehiclePreviewCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 4, ...Shadows.soft },
  vehiclePreviewLabel: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 1, color: Colors.textMuted, marginBottom: 4 },
  vehiclePreviewName: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary, marginBottom: 4 },
  vehiclePreviewReason: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  recommendedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  recommendedBadgeText: { fontFamily: Fonts.bold, fontSize: 10, color: Colors.white, letterSpacing: 0.5 },

  // Concept tiles
  conceptTile: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, gap: 10, ...Shadows.soft },
  conceptIcon: { fontSize: 20, width: 32, textAlign: 'center' },
  conceptTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 2 },
  conceptDesc: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  // Preview
  previewCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, ...Shadows.soft },
  previewCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  previewIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  previewVehicleName: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textPrimary },
  previewVehicleType: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  previewBalance: { fontFamily: Fonts.extraBold, fontSize: 18 },
  previewFee: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  previewMonthDots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  previewMonthLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginLeft: 4 },
  comparisonCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 16, ...Shadows.soft },
  comparisonTitle: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary, marginBottom: 10 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },

  // Vehicle cards
  vehicleCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: Colors.border, ...Shadows.soft },
  vehicleCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  vehicleIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  vehicleCardName: { fontFamily: Fonts.extraBold, fontSize: 16, color: Colors.textPrimary },
  vehicleCardType: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  vehicleCheck: { fontFamily: Fonts.extraBold, fontSize: 22 },
  vehicleStats: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 10, padding: 12, marginBottom: 10 },
  vehicleStat: { flex: 1, alignItems: 'center' },
  vehicleStatDivider: { width: 1, backgroundColor: Colors.border },
  vehicleStatLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  vehicleStatValue: { fontFamily: Fonts.extraBold, fontSize: 14, color: Colors.textPrimary },
  vehicleTagline: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, fontStyle: 'italic', marginBottom: 4 },
  vehicleExpanded: { marginTop: 10, gap: 8 },
  vehicleDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  vehicleProscons: { gap: 4 },
  vehiclePro: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.successDark },
  vehicleCon: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  vehicleBestFor: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textSecondary },
  vehicleFinNote: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 4 },
  vehicleFinNoteLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 1, marginBottom: 2 },
  vehicleFinNoteText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },
  longTermCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 16, ...Shadows.soft },

  // Success
  successVehicleCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 20, width: '100%', alignItems: 'center', marginBottom: 16, ...Shadows.medium },
  statChipRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 },
  statChip: { flex: 1, backgroundColor: Colors.background, borderRadius: 10, padding: 10, alignItems: 'center', gap: 2 },
  statChipLabel: { fontFamily: Fonts.bold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.8 },
  statChipValue: { fontFamily: Fonts.extraBold, fontSize: 13 },
});
