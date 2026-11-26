import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';

// Firebase Web App Configuration (Project: games-2-c3050)
export const firebaseConfig = {
  apiKey: 'AIzaSyB4ulK0Zz4yf2A56XsatxSHxviEa2DtrhQ',
  authDomain: 'games-2-c3050.firebaseapp.com',
  projectId: 'games-2-c3050',
  storageBucket: 'games-2-c3050.firebasestorage.app',
  messagingSenderId: '439110038901',
  appId: '1:439110038901:web:b034a7b287540175c00f3c',
  measurementId: 'G-206MCJ224P',
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let analyticsInstance: Analytics | null = null;
let firebaseAvailable = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    firebaseAvailable = true;

    if (typeof window !== 'undefined') {
      const initializedApp = app;
      isSupported()
        .then((supported) => {
          if (supported) {
            analyticsInstance = getAnalytics(initializedApp);
          }
        })
        .catch(() => {
          // Ignore analytics initialization errors in restricted browser environments
        });
    }
  }
} catch (err) {
  console.warn('Firebase initialization skipped, using local mode:', err);
  firebaseAvailable = false;
}

export const firebaseApp = app;
export const auth = authInstance;
export const db = dbInstance;
export const getAnalyticsInstance = () => analyticsInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const isFirebaseReady = () => firebaseAvailable && authInstance !== null && dbInstance !== null;

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authInstance?.currentUser?.uid ?? null,
      email: authInstance?.currentUser?.email ?? null,
      emailVerified: authInstance?.currentUser?.emailVerified ?? null,
      isAnonymous: authInstance?.currentUser?.isAnonymous ?? null,
      tenantId: authInstance?.currentUser?.tenantId ?? null,
      providerInfo:
        authInstance?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!dbInstance) return;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}
