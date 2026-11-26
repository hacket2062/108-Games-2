import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { AppUserAccount } from '../types/game';
import { auth, googleProvider, isFirebaseReady } from '../core/firebase';

const LOCAL_ACCOUNTS_KEY = 'zhiguang_108_local_accounts_v2';
const ACTIVE_ACCOUNT_KEY = 'zhiguang_108_active_uid_v2';

const DEFAULT_LOCAL_ACCOUNTS: AppUserAccount[] = [
  {
    uid: 'local_hero_01',
    displayName: '智光小勇者',
    email: 'local.hero@academy.tw',
    provider: 'local',
    avatarColor: '#F59E0B',
    emailVerified: false,
  },
  {
    uid: 'local_star_02',
    displayName: '星際小飛俠',
    email: 'local.star@academy.tw',
    provider: 'local',
    avatarColor: '#06B6D4',
    emailVerified: false,
  },
  {
    uid: 'local_chef_03',
    displayName: '森羅小廚神',
    email: 'local.chef@academy.tw',
    provider: 'local',
    avatarColor: '#10B981',
    emailVerified: false,
  },
];

interface AuthContextValue {
  user: AppUserAccount;
  firebaseUser: User | null;
  localAccounts: AppUserAccount[];
  authLoading: boolean;
  authNotice: string | null;
  clearAuthNotice: () => void;
  signInWithGoogle: () => Promise<void>;
  switchLocalAccount: (uid: string) => void;
  createLocalAccount: (displayName: string) => void;
  signOutGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadLocalAccounts(): AppUserAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) return DEFAULT_LOCAL_ACCOUNTS;
    const parsed = JSON.parse(raw) as AppUserAccount[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LOCAL_ACCOUNTS;
  } catch {
    return DEFAULT_LOCAL_ACCOUNTS;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localAccounts, setLocalAccounts] = useState<AppUserAccount[]>(() => loadLocalAccounts());
  const [activeLocalUid, setActiveLocalUid] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_ACCOUNT_KEY) || DEFAULT_LOCAL_ACCOUNTS[0].uid;
    } catch {
      return DEFAULT_LOCAL_ACCOUNTS[0].uid;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady() || !auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const activeLocal =
    localAccounts.find((a) => a.uid === activeLocalUid) ?? localAccounts[0] ?? DEFAULT_LOCAL_ACCOUNTS[0];

  const user: AppUserAccount = firebaseUser
    ? {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Google 守護者',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined,
        provider: 'google',
        avatarColor: '#38BDF8',
        emailVerified: Boolean(firebaseUser.emailVerified),
      }
    : activeLocal;

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseReady() || !auth) {
      setAuthNotice('目前為本機模擬模式，已自動啟用本機多帳號存檔。');
      return;
    }
    try {
      setAuthNotice(null);
      await signInWithPopup(auth, googleProvider);
      setAuthNotice('Google 帳號登入成功！雲端存檔與即時線上對戰已啟用。');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        setAuthNotice('已取消 Google 登入視窗，您可繼續使用本機帳號遊玩。');
      } else {
        setAuthNotice('瀏覽器阻擋彈窗或網路暫時中斷，已自動切換為本機帳號無縫遊玩。');
      }
    }
  }, []);

  const signOutGoogle = useCallback(async () => {
    if (auth && firebaseUser) {
      try {
        await signOut(auth);
        setAuthNotice('已登出 Google 帳號，切換回本機學習檔案。');
      } catch {
        setAuthNotice('已切換回本機帳號。');
      }
    }
  }, [firebaseUser]);

  const switchLocalAccount = useCallback(
    (uid: string) => {
      if (auth && firebaseUser) {
        signOut(auth).catch(() => {});
      }
      setActiveLocalUid(uid);
      try {
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, uid);
      } catch {
        // ignore quota errors
      }
      setAuthNotice(null);
    },
    [firebaseUser]
  );

  const createLocalAccount = useCallback(
    (displayName: string) => {
      const trimmed = displayName.trim().slice(0, 16);
      if (!trimmed) return;
      const palette = ['#F59E0B', '#38BDF8', '#10B981', '#EC4899', '#A855F7'];
      const next: AppUserAccount = {
        uid: `local_${Date.now().toString(36)}`,
        displayName: trimmed,
        email: `${trimmed}@local.academy`,
        provider: 'local',
        avatarColor: palette[localAccounts.length % palette.length],
        emailVerified: false,
      };
      const updated = [...localAccounts, next];
      setLocalAccounts(updated);
      setActiveLocalUid(next.uid);
      try {
        localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(updated));
        localStorage.setItem(ACTIVE_ACCOUNT_KEY, next.uid);
      } catch {
        // ignore
      }
      if (auth && firebaseUser) {
        signOut(auth).catch(() => {});
      }
      setAuthNotice(`已建立並切換至「${trimmed}」學習檔案！`);
    },
    [firebaseUser, localAccounts]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        localAccounts,
        authLoading,
        authNotice,
        clearAuthNotice: () => setAuthNotice(null),
        signInWithGoogle,
        switchLocalAccount,
        createLocalAccount,
        signOutGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
