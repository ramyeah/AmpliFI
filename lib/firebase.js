import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVmW5BeMDuDzfLi4QwonhJqb-YB267CIc",
  authDomain: "amplifi-bc19f.firebaseapp.com",
  projectId: "amplifi-bc19f",
  storageBucket: "amplifi-bc19f.firebasestorage.app",
  messagingSenderId: "619424832149",
  appId: "1:619424832149:web:fb5f17bdf6fb420d65999c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);