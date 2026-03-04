import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';

export default function HomeScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome back,</Text>
      <Text style={styles.name}>{profile?.name || 'Investor'} 👋</Text>
      <Text style={styles.goal}>Goal: {profile?.goal}</Text>
      <Text style={styles.coins}>💰 FinCoins: {profile?.finCoins || 0}</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  greeting: { fontSize: 18, color: '#666' },
  name: { fontSize: 32, fontWeight: 'bold', color: '#1F4E79', marginBottom: 16 },
  goal: { fontSize: 16, color: '#333', marginBottom: 8 },
  coins: { fontSize: 16, color: '#333', marginBottom: 32 },
  button: { backgroundColor: '#1F4E79', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});