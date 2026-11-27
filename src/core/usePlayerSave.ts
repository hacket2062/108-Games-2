import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { AppUserAccount, PlayerSaveData } from '../types/game';
import { db, isFirebaseReady } from './firebase';
import { createInitialPlayerSave, hydrateSave } from './playerSave';
import { completeSaveData, fingerprint } from './saveIntegrity';
import { createSnapshotStore } from './snapshotStore';

const PREFIX = 'zhiguang_108_save_v2_';
type Choice = { local: PlayerSaveData; cloud?: PlayerSaveData; cloudFingerprint: string | null };

/** Per-account loading barrier and serialized, compare-before-write cloud saves.
 * These are personal, untrusted practice saves, never authoritative PvP assets. */
export function usePlayerSave(user: AppUserAccount) {
  const store = useMemo(() => createSnapshotStore(createInitialPlayerSave()), [user.uid]);
  const save = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [ready, setReady] = useState(false);
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [notice, setNotice] = useState('正在安全載入學習存檔…');
  const [choice, setChoice] = useState<Choice | null>(null);
  const [rawBackup, setRawBackup] = useState('');
  const generation = useRef(0);
  const expectedCloud = useRef<string | null>(null);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const lastPersisted = useRef('');
  const syncAllowed = useRef(false);

  const keepBackup = useCallback((data: string) => {
    localStorage.setItem(`${PREFIX}${user.uid}_backup_${crypto.randomUUID()}`, data);
  }, [user.uid]);

  const accept = useCallback((data: PlayerSaveData, online: boolean, remoteFingerprint: string | null) => {
    try {
      const serialized = JSON.stringify(completeSaveData(data));
      const old = localStorage.getItem(PREFIX + user.uid);
      if (old && old !== serialized) keepBackup(old);
      localStorage.setItem(PREFIX + user.uid, serialized);
      expectedCloud.current = remoteFingerprint;
      lastPersisted.current = serialized;
      store.update(() => data);
      syncAllowed.current = online;
      setCloudEnabled(online);
      setChoice(null);
      setNotice(online ? '雲端存檔已載入' : '本機模式：雲端同步暫停，資料保存在這台裝置。');
      setReady(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '無法保存備份，尚未取代任何存檔。');
    }
  }, [keepBackup, store, user.uid]);

  useEffect(() => {
    const ticket = ++generation.current;
    let cancelled = false;
    syncAllowed.current = false;
    setReady(false);
    setCloudEnabled(false);
    setChoice(null);
    const load = async () => {
      let local = createInitialPlayerSave();
      let raw: string | null;
      try {
        raw = localStorage.getItem(PREFIX + user.uid);
        if (raw) {
          setRawBackup(raw);
          local = hydrateSave(JSON.parse(raw));
        }
      } catch {
        if (!cancelled) setNotice('本機存檔無法讀取或格式損壞；已停止載入及覆寫。請先匯出原始備份。');
        return;
      }
      if (cancelled || ticket !== generation.current) return;
      store.update(() => local);
      if (user.provider !== 'google' || !user.emailVerified || !isFirebaseReady() || !db) {
        accept(local, false, null);
        return;
      }
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const snapshot = await Promise.race([
          getDocFromServer(doc(db, 'users', user.uid)),
          new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('載入逾時')), 12000); }),
        ]);
        if (cancelled || ticket !== generation.current) return;
        if (!snapshot.exists()) { accept(local, true, null); return; }
        const rawCloud: unknown = snapshot.data().saveData;
        if (!rawCloud || typeof rawCloud !== 'object' || Array.isArray(rawCloud)) throw new Error('雲端存檔格式不正確');
        // Legacy uploads omitted daily state and unlocks. Keep those local fields
        // only for this same account instead of silently resetting them.
        const cloud = hydrateSave({ ...local, ...rawCloud });
        const remoteFingerprint = fingerprint(rawCloud);
        if (raw && fingerprint(local) !== fingerprint(cloud)) {
          setChoice({ local, cloud, cloudFingerprint: remoteFingerprint });
          setNotice('本機與雲端進度不同。請選擇要繼續的版本；取代本機前會先保留備份。');
        } else {
          accept(cloud, true, remoteFingerprint);
        }
      } catch {
        if (!cancelled && ticket === generation.current) {
          setChoice({ local, cloudFingerprint: null });
          setNotice('無法確認雲端進度。可使用本機存檔繼續；本次不會以本機資料覆蓋雲端。');
        }
      } finally {
        if (timeout !== undefined) clearTimeout(timeout);
      }
    };
    void load();
    return () => { cancelled = true; generation.current++; syncAllowed.current = false; };
  }, [accept, store, user.uid, user.provider, user.emailVerified]);

  useEffect(() => {
    if (!ready) return;
    let serialized: string;
    let complete: PlayerSaveData;
    try {
      complete = completeSaveData(save);
      serialized = JSON.stringify(complete);
      if (serialized !== lastPersisted.current) {
        localStorage.setItem(PREFIX + user.uid, serialized);
        lastPersisted.current = serialized;
      }
    } catch (error) {
      syncAllowed.current = false;
      setCloudEnabled(false);
      setNotice(error instanceof Error ? error.message : '存檔未成功，請立即匯出備份。');
      return;
    }
    if (!cloudEnabled || !syncAllowed.current || !db) return;
    const firestoreDb = db;
    const ticket = generation.current;
    const timer = setTimeout(() => {
      writes.current = writes.current.then(async () => {
        if (ticket !== generation.current || !syncAllowed.current) return;
        const nextFingerprint = fingerprint(complete);
        if (expectedCloud.current === nextFingerprint) return;
        const reference = doc(firestoreDb, 'users', user.uid);
        await runTransaction(firestoreDb, async (transaction) => {
          const remote = await transaction.get(reference);
          if (ticket !== generation.current || !syncAllowed.current) throw new Error('session-changed');
          const actual = remote.exists() ? fingerprint(remote.data().saveData) : null;
          if (actual !== expectedCloud.current) throw new Error('save-conflict');
          transaction.set(reference, {
            uid: user.uid, displayName: user.displayName.slice(0, 60) || '智光守護者',
            level: complete.level, xp: complete.xp, coins: complete.coins, crystals: complete.crystals,
            honorTokens: complete.pvp.honorTokens, pvpRating: complete.pvp.rating,
            pvpWins: complete.pvp.wins, pvpLosses: complete.pvp.losses,
            grade: complete.grade, semester: complete.semester, selectedGuardian: complete.selectedGuardian,
            saveData: complete,
            createdAt: remote.exists() ? remote.data().createdAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        if (ticket === generation.current) {
          expectedCloud.current = nextFingerprint;
          setNotice('學習進度已同步至雲端');
        }
      }).catch((error: unknown) => {
        if (ticket !== generation.current) return;
        syncAllowed.current = false;
        setCloudEnabled(false);
        setNotice(error instanceof Error && error.message === 'save-conflict'
          ? '偵測到另一裝置更新。已保留本機進度並停止覆寫；請匯出備份後重新載入比較。'
          : '雲端同步未成功，已保留本機進度。請匯出備份並檢查連線後重新載入。');
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [save, ready, cloudEnabled, user.uid, user.displayName]);

  const exportBackup = useCallback(() => {
    const content = !ready && rawBackup ? rawBackup : JSON.stringify(store.getSnapshot(), null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `智光學習備份-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [rawBackup, ready, store]);

  return { save, store, ready, notice, choice, accept, exportBackup, cloudEnabled };
}
