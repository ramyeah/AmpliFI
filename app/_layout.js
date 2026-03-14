import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import useUserStore from '../store/userStore';
import { View, ActivityIndicator } from 'react-native';
import { useLessonStore } from '../store/useLessonStore';
import { Colors } from '../constants/theme';
import { useFonts } from 'expo-font';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

export default function RootLayout() {
  const [authLoading, setAuthLoading] = useState(true);
  const [redirectTo,  setRedirectTo]  = useState(null);
  const router       = useRouter();
  const setProfile   = useUserStore((state) => state.setProfile);
  const clearProfile = useUserStore((state) => state.clearProfile);

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Step 1 — resolve auth, store destination, don't navigate yet
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            setProfile(profileDoc.data());
            await useLessonStore.getState().loadProgress(user.uid);
            setRedirectTo('/(tabs)/home');
          } else {
            setRedirectTo('/onboarding');
          }
        } else {
          clearProfile();
          setRedirectTo('/login');
        }
      } catch (e) {
        setRedirectTo('/login');
      } finally {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Step 2 — only navigate once BOTH fonts and auth are ready
  useEffect(() => {
    if (!authLoading && fontsLoaded && redirectTo) {
      router.replace(redirectTo);
    }
  }, [authLoading, fontsLoaded, redirectTo]);

  // Show spinner until both are ready
  if (authLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Slot />;
}