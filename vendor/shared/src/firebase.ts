import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { initializeAuth, getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo-barber-app.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-barber-app',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo-barber-app.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:000000000000:web:0000000000000000000000',
};

const useEmulator = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

// EXPO_PUBLIC_EMULATOR_HOST should be your machine's LAN IP (e.g. 192.168.1.5) when
// testing on a physical device or Android emulator (10.0.2.2 also works on Android emulator).
const emulatorHost = process.env.EXPO_PUBLIC_EMULATOR_HOST ?? 'localhost';

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// getReactNativePersistence (AsyncStorage-backed auth persistence) only exists on
// @firebase/auth's "react-native" build, which Metro resolves for iOS/Android but not
// for the Expo web target — so web must fall back to the plain browser getAuth().
export const auth: Auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: require('@firebase/auth').getReactNativePersistence(AsyncStorage),
      });

export const db: Firestore = initializeFirestore(app, {});

export const functions: Functions = getFunctions(app);

export const storage: FirebaseStorage = getStorage(app);

if (useEmulator) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectFunctionsEmulator(functions, emulatorHost, 5001);
  connectStorageEmulator(storage, emulatorHost, 9199);
}

export { app };
