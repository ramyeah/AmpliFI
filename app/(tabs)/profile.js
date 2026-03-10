import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);

  const handleLogout = async () => {
    await signOut(auth);
    setTimeout(() => router.replace('/login'), 100);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{profile?.name || 'Investor'}</Text>
      <Text style={styles.detail}>Age: {profile?.age}</Text>
      <Text style={styles.detail}>Income: {profile?.income}</Text>
      <Text style={styles.detail}>Goal: {profile?.goal}</Text>
      <Text style={styles.detail}>Family: {profile?.familyStatus}</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1F4E79', marginBottom: 24 },
  detail: { fontSize: 16, color: '#333', marginBottom: 12 },
  button: { backgroundColor: '#1F4E79', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 32 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});