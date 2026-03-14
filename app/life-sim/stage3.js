// app/life-sim/stage2.js
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
export default function Stage2() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Stage 2 — coming soon</Text>
      <TouchableOpacity onPress={() => router.back()}><Text>← Back</Text></TouchableOpacity>
    </View>
  );
}