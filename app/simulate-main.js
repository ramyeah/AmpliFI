import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { ASSET_CLASSES, RISK_PROFILES, SINGAPORE_EVENTS, INFLATION_RATE } from '../constants/simulation';
import useUserStore from '../store/userStore';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SimulateMainScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);
  const setProfile = useUserStore((state) => state.setProfile);

  const riskProfile = profile?.riskProfile || 'balanced';
  const defaultAllocation = RISK_PROFILES[riskProfile];

  const initialCoins = Math.min(profile?.finCoins || 100, 500);

  const [allocation, setAllocation] = useState(defaultAllocation);
  const [month, setMonth] = useState(0);
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [event, setEvent] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [insightReport, setInsightReport] = useState(null);

  const MAX_MONTHS = 12;

  const startSimulation = () => {
    // Build initial portfolio based on allocation
    const initial = {};
    ASSET_CLASSES.forEach(asset => {
      initial[asset.id] = (initialCoins * allocation[asset.id]) / 100;
    });
    setPortfolio(initial);
    setHistory([initialCoins]);
    setStarted(true);
    setMonth(1);
  };

  const simulateMonth = () => {
    if (!portfolio) return;

    // Pick random event
    const randomEvent = SINGAPORE_EVENTS[Math.floor(Math.random() * SINGAPORE_EVENTS.length)];
    setEvent(randomEvent.text);

    // Calculate new portfolio value
    const newPortfolio = {};
    let totalValue = 0;

    ASSET_CLASSES.forEach(asset => {
      const currentValue = portfolio[asset.id];
      // Base monthly return with volatility
      const baseReturn = asset.avgReturn / 12;
      const volatilityFactor = (Math.random() - 0.5) * asset.volatility / 6;
      const eventEffect = randomEvent.effect[asset.id] || 0;

      // Apply inflation drag
      const monthlyReturn = baseReturn + volatilityFactor + eventEffect - INFLATION_RATE;
      newPortfolio[asset.id] = currentValue * (1 + monthlyReturn);
      totalValue += newPortfolio[asset.id];
    });

    setPortfolio(newPortfolio);
    setHistory(prev => [...prev, Math.round(totalValue)]);

    // Set explanation
    const bestAsset = ASSET_CLASSES.reduce((best, asset) =>
      newPortfolio[asset.id] > newPortfolio[best.id] ? asset : best
    );
    setExplanation(
      `This month: ${randomEvent.text}\n\nYour best performer was ${bestAsset.name} (${bestAsset.icon}). ` +
      `Inflation drag of ${(INFLATION_RATE * 100).toFixed(2)}% was applied to all assets. ` +
      `Total portfolio: ${totalValue.toFixed(0)} FinCoins.`
    );

    if (month >= MAX_MONTHS) {
      finishSimulation(totalValue);
    } else {
      setMonth(m => m + 1);
    }
  };

  const finishSimulation = async (finalValue) => {
    setFinished(true);
    const gain = finalValue - initialCoins;
    const gainPct = ((gain / initialCoins) * 100).toFixed(1);

    // Award FinCoins for completing simulation
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), {
        finCoins: increment(100)
      });
      setProfile({ ...profile, finCoins: (profile?.finCoins || 0) + 100 });
    }

    setInsightReport({
      gain: gain.toFixed(0),
      gainPct,
      finalValue: finalValue.toFixed(0),
      initialValue: initialCoins,
      riskProfile,
    });
  };

  const AllocationBar = ({ asset }) => {
    const pct = allocation[asset.id];
    return (
      <View style={styles.allocationRow}>
        <Text style={styles.assetIcon}>{asset.icon}</Text>
        <View style={styles.allocationInfo}>
          <Text style={styles.assetName}>{asset.name}</Text>
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: asset.color }]} />
          </View>
        </View>
        <Text style={styles.allocationPct}>{pct}%</Text>
      </View>
    );
  };

  // Setup screen
  if (!started) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Investment Simulator 📈</Text>
        <Text style={styles.subtitle}>
          You'll invest {initialCoins} FinCoins over 12 simulated months
        </Text>

        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>
            Risk Profile: {riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Your Portfolio Allocation</Text>
        <Text style={styles.sectionSubtitle}>Based on your risk profile. You can adjust after starting.</Text>

        {ASSET_CLASSES.map(asset => (
          <AllocationBar key={asset.id} asset={asset} />
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What to expect</Text>
          <Text style={styles.infoText}>• 12 monthly simulation rounds</Text>
          <Text style={styles.infoText}>• Random Singapore market events each month</Text>
          <Text style={styles.infoText}>• 2.5% p.a. inflation drag applied</Text>
          <Text style={styles.infoText}>• Financial Insight Report at the end</Text>
          <Text style={styles.infoText}>• Earn 100 FinCoins on completion</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={startSimulation}>
          <Text style={styles.btnText}>Start Simulation →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Results screen
  if (finished && insightReport) {
    const gained = parseFloat(insightReport.gain) >= 0;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Simulation Complete! 🎉</Text>

        <LineChart
          data={{
            labels: history.map((_, i) => i === 0 ? 'Start' : i % 3 === 0 ? `M${i}` : ''),
            datasets: [{ data: history }]
          }}
          width={SCREEN_WIDTH - 48}
          height={200}
          chartConfig={{
            backgroundColor: '#1F4E79',
            backgroundGradientFrom: '#1F4E79',
            backgroundGradientTo: '#2E75B6',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          bezier
          style={styles.chart}
        />

        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>📊 Financial Insight Report</Text>
          <Text style={styles.reportRow}>Starting capital: {insightReport.initialValue} FinCoins</Text>
          <Text style={styles.reportRow}>Final value: {insightReport.finalValue} FinCoins</Text>
          <Text style={[styles.reportGain, { color: gained ? '#27AE60' : '#E74C3C' }]}>
            {gained ? '▲' : '▼'} {Math.abs(insightReport.gain)} FinCoins ({insightReport.gainPct}%)
          </Text>
          <Text style={styles.reportProfile}>
            Risk profile: {insightReport.riskProfile}
          </Text>
          <Text style={styles.reportTip}>
            💡 Tip: {insightReport.riskProfile === 'conservative'
              ? 'Consider gradually increasing your equity exposure as your knowledge grows.'
              : insightReport.riskProfile === 'aggressive'
              ? 'Remember to diversify — high returns come with high volatility.'
              : 'A balanced portfolio is great for steady long-term growth.'}
          </Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/simulate')}>
          <Text style={styles.btnText}>Back to Simulate</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Simulation screen
  const totalPortfolioValue = portfolio
    ? Object.values(portfolio).reduce((a, b) => a + b, 0)
    : initialCoins;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Month {month} of {MAX_MONTHS}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(month / MAX_MONTHS) * 100}%` }]} />
      </View>

      <View style={styles.valueCard}>
        <Text style={styles.valueLabel}>Portfolio Value</Text>
        <Text style={styles.valueAmount}>{totalPortfolioValue.toFixed(0)} FinCoins</Text>
        <Text style={[styles.valueChange, {
          color: totalPortfolioValue >= initialCoins ? '#27AE60' : '#E74C3C'
        }]}>
          {totalPortfolioValue >= initialCoins ? '▲' : '▼'}
          {Math.abs(totalPortfolioValue - initialCoins).toFixed(0)} from start
        </Text>
      </View>

      {history.length > 1 && (
        <LineChart
          data={{
            labels: history.map((_, i) => i === 0 ? 'Start' : `M${i}`),
            datasets: [{ data: history }]
          }}
          width={SCREEN_WIDTH - 48}
          height={180}
          chartConfig={{
            backgroundColor: '#1F4E79',
            backgroundGradientFrom: '#1F4E79',
            backgroundGradientTo: '#2E75B6',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          bezier
          style={styles.chart}
        />
      )}

      {event && (
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>This Month's Event</Text>
          <Text style={styles.eventText}>{event}</Text>
        </View>
      )}

      {explanation && (
        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>💡 Explanation Panel</Text>
          <Text style={styles.explanationText}>{explanation}</Text>
        </View>
      )}

      {ASSET_CLASSES.map(asset => (
        <View key={asset.id} style={styles.assetRow}>
          <Text style={styles.assetIcon}>{asset.icon}</Text>
          <View style={styles.assetInfo}>
            <Text style={styles.assetName}>{asset.name}</Text>
            <Text style={styles.assetValue}>
              {portfolio ? portfolio[asset.id].toFixed(1) : 0} FinCoins
            </Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.btn}
        onPress={month <= MAX_MONTHS ? simulateMonth : () => finishSimulation(totalPortfolioValue)}
      >
        <Text style={styles.btnText}>
          {month < MAX_MONTHS ? `Simulate Month ${month} →` : 'See Results →'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 24, paddingTop: 48 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#1F4E79', fontSize: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  profileBadge: { backgroundColor: '#D6E4F0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 24 },
  profileBadgeText: { color: '#1F4E79', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  allocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  assetIcon: { fontSize: 24, marginRight: 12 },
  allocationInfo: { flex: 1 },
  assetName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  barContainer: { height: 8, backgroundColor: '#eee', borderRadius: 4 },
  barFill: { height: 8, borderRadius: 4 },
  allocationPct: { fontSize: 14, fontWeight: 'bold', color: '#1F4E79', marginLeft: 8, width: 35 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginVertical: 16 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#555', marginBottom: 4 },
  btn: { backgroundColor: '#1F4E79', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 32 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 16 },
  progressFill: { height: 6, backgroundColor: '#1F4E79', borderRadius: 3 },
  valueCard: { backgroundColor: '#1F4E79', borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center' },
  valueLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  valueAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  valueChange: { fontSize: 14, fontWeight: '600' },
  chart: { borderRadius: 12, marginBottom: 16 },
  eventCard: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#F39C12' },
  eventTitle: { fontSize: 12, fontWeight: 'bold', color: '#F39C12', marginBottom: 4 },
  eventText: { fontSize: 15, color: '#333', fontWeight: '600' },
  explanationCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  explanationTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8 },
  explanationText: { fontSize: 14, color: '#555', lineHeight: 22 },
  assetRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8 },
  assetInfo: { flex: 1 },
  assetValue: { fontSize: 13, color: '#666' },
  reportCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16 },
  reportTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F4E79', marginBottom: 16 },
  reportRow: { fontSize: 15, color: '#333', marginBottom: 8 },
  reportGain: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  reportProfile: { fontSize: 14, color: '#666', marginBottom: 12 },
  reportTip: { fontSize: 14, color: '#555', lineHeight: 22, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8 },
});