import { View, Text, StyleSheet } from 'react-native';

export default function SimulateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simulate 📈</Text>
      <Text style={styles.subtitle}>Your investment simulator will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666' },
});