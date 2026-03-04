import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import useUserStore from '../store/userStore';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const setProfile = useUserStore((state) => state.setProfile);
  const clearProfile = useUserStore((state) => state.clearProfile);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data());
            setTimeout(() => router.replace('/(tabs)/home'), 100);
          } else {
            setTimeout(() => router.replace('/onboarding'), 100);
          }
        } else {
          clearProfile();
          setTimeout(() => router.replace('/login'), 100);
        }
      } catch (e) {
        setTimeout(() => router.replace('/login'), 100);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1F4E79" />
      </View>
    );
  }

  return <Slot />;
}