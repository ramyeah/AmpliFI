import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';

export default function SimulateScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);

  const riskLabels = {
    conservative: { label: 'Conservative 🛡️', color: '#27AE60' },
    balanced: { label: 'Balanced ⚖️', color: '#E67E22' },
    aggressive: { label: 'Aggressive 🚀', color: '#E74C3C' },
  };

  const risk = profile?.riskProfile;
  const riskInfo = riskLabels[risk];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Investment Simulator 📈</Text>
      <Text style={styles.subtitle}>
        Practice investing with FinCoins in a risk-free environment
      </Text>

      {risk ? (
        <>
          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Your Risk Profile</Text>
            <Text style={[styles.profileValue, { color: riskInfo.color }]}>
              {riskInfo.label}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push('/simulate-main')}
          >
            <Text style={styles.btnText}>Start Simulation →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => router.push('/risk-quiz')}
          >
            <Text style={[styles.btnText, { color: '#1F4E79' }]}>Retake Risk Quiz</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Before simulating, take a short quiz to determine your investment risk profile.
              This personalises your simulation experience.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push('/risk-quiz')}
          >
            <Text style={styles.btnText}>Take Risk Quiz →</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.coinsCard}>
        <Text style={styles.coinsLabel}>Available FinCoins</Text>
        <Text style={styles.coinsValue}>💰 {profile?.finCoins || 0}</Text>
        <Text style={styles.coinsHint}>Earn more by completing lessons</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 48, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  profileCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center' },
  profileLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  profileValue: { fontSize: 24, fontWeight: 'bold' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 24 },
  infoText: { fontSize: 15, color: '#555', lineHeight: 22 },
  btn: { backgroundColor: '#1F4E79', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#1F4E79' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  coinsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginTop: 8, alignItems: 'center' },
  coinsLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  coinsValue: { fontSize: 32, fontWeight: 'bold', color: '#F39C12', marginBottom: 4 },
  coinsHint: { fontSize: 12, color: '#999' },
});