import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCVmW5BeMDuDzfLi4QwonhJqb-YB267CIc",
  authDomain: "amplifi-bc19f.firebaseapp.com",
  projectId: "amplifi-bc19f",
  storageBucket: "amplifi-bc19f.firebasestorage.app",
  messagingSenderId: "619424832149",
  appId: "1:619424832149:web:fb5f17bdf6fb420d65999c"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);