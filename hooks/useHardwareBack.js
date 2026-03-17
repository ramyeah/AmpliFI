// hooks/useHardwareBack.js
//
// Safe back-navigation hook for Expo Router.
//
// Problem: calling router.back() on screens reached via router.replace()
// crashes with "cannot read property stale of undefined" because there is
// nothing in the navigation stack to go back to.
//
// This hook provides:
//   goBack()              — safe replacement for router.back()
//   useHardwareBack()     — also intercepts Android's hardware back button

import { useCallback, useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';

const DEFAULT_FALLBACK = '/(tabs)/home';

/**
 * Returns a safe `goBack` function that falls back to `router.replace(fallback)`
 * when there is nothing in the navigation stack.
 */
export function useSafeBack(fallback = DEFAULT_FALLBACK) {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [router, fallback]);

  return goBack;
}

/**
 * Same as useSafeBack but also intercepts Android's hardware / gesture back
 * button so it uses the same safe logic.
 */
export default function useHardwareBack(fallback = DEFAULT_FALLBACK) {
  const goBack = useSafeBack(fallback);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true; // prevent default (which would crash)
    });

    return () => sub.remove();
  }, [goBack]);

  return goBack;
}
