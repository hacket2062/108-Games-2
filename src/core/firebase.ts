import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import type { Analytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

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

    // Optional analytics remains off until a separate, explicit consent flow
    // is implemented. Authentication and saves do not require Analytics.

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
    error: typeof (error as { code?: unknown } | null)?.code === 'string'
      ? String((error as { code: string }).code) : 'firestore-operation-failed',
    authInfo: {},
    operationType,
    // Do not put student UIDs or e-mail into logs, even on denied requests.
    path: path ? path.split('/').map((part, index) => index % 2 === 1 ? '[id]' : part).join('/') : null,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

