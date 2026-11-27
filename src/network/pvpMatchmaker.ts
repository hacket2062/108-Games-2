import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type {
  AscensionPath,
  GradeLevel,
  GuardianId,
  PvPActionType,
  PvPCombatEvent,
  PvPRoomState,
  SubjectId,
} from '../types/game';
import { db, handleFirestoreError, isFirebaseReady, OperationType } from '../core/firebase';
import { ONLINE_MATCHES_READY, ONLINE_SAFETY_NOTICE } from './onlineSafety';

export interface PlayerLoadout {
  uid: string;
  name: string;
  weaponPath: AscensionPath;
  weaponLevel: number;
  guardian: GuardianId;
  rating: number;
  canUseOnlineFirestore: boolean;
}

export interface SmartRivalProfile {
  uid: string;
  name: string;
  schoolTag: string;
  weaponPath: AscensionPath;
  weaponLevel: number;
  guardian: GuardianId;
  rating: number;
  avgReactionSeconds: number;
  accuracy: number;
}

const SMART_RIVAL_POOL: Omit<SmartRivalProfile, 'rating'>[] = [
  {
    uid: 'rival_lin',
    name: '林小軒',
    schoolTag: '台中北屯學園',
    weaponPath: 'hero',
    weaponLevel: 6,
    guardian: 'qilin',
    avgReactionSeconds: 4.8,
    accuracy: 0.78,
  },
  {
    uid: 'rival_chen',
    name: '陳星語',
    schoolTag: '台北大安書院',
    weaponPath: 'mythic',
    weaponLevel: 8,
    guardian: 'stardragon',
    avgReactionSeconds: 4.3,
    accuracy: 0.82,
  },
  {
    uid: 'rival_chang',
    name: '張數律',
    schoolTag: '高雄鳳山工坊',
    weaponPath: 'inferno',
    weaponLevel: 7,
    guardian: 'griffin',
    avgReactionSeconds: 4.6,
    accuracy: 0.8,
  },
  {
    uid: 'rival_huang',
    name: '黃森羅',
    schoolTag: '台南安平實驗室',
    weaponPath: 'hero',
    weaponLevel: 5,
    guardian: 'deer',
    avgReactionSeconds: 5.1,
    accuracy: 0.75,
  },
];

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function pickSmartRival(playerRating: number): SmartRivalProfile {
  const base = SMART_RIVAL_POOL[Math.floor(Math.random() * SMART_RIVAL_POOL.length)];
  const offset = Math.floor((Math.random() - 0.5) * 140);
  return {
    ...base,
    rating: Math.max(850, playerRating + offset),
  };
}

export async function createOnlinePvPRoom(
  loadout: PlayerLoadout,
  grade: GradeLevel,
  subjectFilter: SubjectId | 'all'
): Promise<PvPRoomState | null> {
  if (!ONLINE_MATCHES_READY) return null;
  if (!loadout.canUseOnlineFirestore || !isFirebaseReady() || !db) return null;

  const roomCode = generateRoomCode();
  const seed = Math.floor(10000 + Math.random() * 900000);
  const roomState: PvPRoomState = {
    roomCode,
    status: 'waiting',
    grade,
    subjectFilter,
    hostUid: loadout.uid,
    hostName: loadout.name.slice(0, 40) || '智光守護者',
    hostWeaponPath: loadout.weaponPath,
    hostWeaponLevel: Math.min(15, Math.max(0, loadout.weaponLevel)),
    hostGuardian: loadout.guardian,
    hostHp: 260,
    hostScore: 0,
    hostCombo: 0,
    guestUid: '',
    guestName: '',
    guestWeaponPath: 'base',
    guestWeaponLevel: 0,
    guestGuardian: 'qilin',
    guestHp: 260,
    guestScore: 0,
    guestCombo: 0,
    winnerUid: '',
    questionSeed: seed,
  };

  const path = `pvpRooms/${roomCode}`;
  try {
    await setDoc(doc(db, 'pvpRooms', roomCode), {
      ...roomState,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return roomState;
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.CREATE, path);
    } catch {
      return null;
    }
  }
}

export async function joinOnlinePvPRoom(
  rawCode: string,
  loadout: PlayerLoadout
): Promise<{ room: PvPRoomState | null; error?: string }> {
  if (!ONLINE_MATCHES_READY) return { room: null, error: ONLINE_SAFETY_NOTICE };
  const roomCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (roomCode.length < 4) return { room: null, error: '請輸入正確的 6 碼好友房號。' };
  if (!loadout.canUseOnlineFirestore || !isFirebaseReady() || !db) {
    return { room: null, error: '加入線上好友房間需先使用 Google 帳號登入。' };
  }

  const path = `pvpRooms/${roomCode}`;
  try {
    const ref = doc(db, 'pvpRooms', roomCode);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { room: null, error: `找不到房號「${roomCode}」，請確認房號是否正確。` };

    const data = snap.data() as PvPRoomState;
    if (data.status !== 'waiting' || data.guestUid !== '') {
      return { room: null, error: '此房間已在對戰中或已結束。' };
    }
    if (data.hostUid === loadout.uid) {
      return { room: null, error: '無法加入自己建立的房間。' };
    }

    const patch = {
      guestUid: loadout.uid,
      guestName: loadout.name.slice(0, 40) || '挑戰者',
      guestWeaponPath: loadout.weaponPath,
      guestWeaponLevel: Math.min(15, Math.max(0, loadout.weaponLevel)),
      guestGuardian: loadout.guardian,
      status: 'playing' as const,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(ref, patch);
    return {
      room: {
        ...data,
        guestUid: patch.guestUid,
        guestName: patch.guestName,
        guestWeaponPath: patch.guestWeaponPath,
        guestWeaponLevel: patch.guestWeaponLevel,
        guestGuardian: patch.guestGuardian,
        status: 'playing',
      },
    };
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } catch {
      return { room: null, error: '加入房間失敗，請稍後再試或改用快速配對。' };
    }
  }
}

export async function tryFindWaitingOnlineRoom(
  loadout: PlayerLoadout,
  grade: GradeLevel
): Promise<PvPRoomState | null> {
  if (!ONLINE_MATCHES_READY) return null;
  if (!loadout.canUseOnlineFirestore || !isFirebaseReady() || !db) return null;
  const path = 'pvpRooms';
  try {
    const q = query(
      collection(db, 'pvpRooms'),
      where('status', '==', 'waiting'),
      where('grade', '==', grade),
      limit(5)
    );
    const snaps = await getDocs(q);
    for (const d of snaps.docs) {
      const data = d.data() as PvPRoomState;
      if (data.hostUid && data.hostUid !== loadout.uid && data.guestUid === '') {
        const joined = await joinOnlinePvPRoom(data.roomCode, loadout);
        if (joined.room) return joined.room;
      }
    }
    return null;
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.LIST, path);
    } catch {
      return null;
    }
  }
}

export function subscribeOnlineRoom(
  roomCode: string,
  onRoom: (room: PvPRoomState) => void
): () => void {
  if (!isFirebaseReady() || !db) return () => {};
  const path = `pvpRooms/${roomCode}`;
  return onSnapshot(
    doc(db, 'pvpRooms', roomCode),
    (snap) => {
      if (snap.exists()) {
        onRoom(snap.data() as PvPRoomState);
      }
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch {
        // non-fatal
      }
    }
  );
}

export function subscribeOnlineRoomEvents(
  roomCode: string,
  myUid: string,
  onEvent: (evt: PvPCombatEvent) => void
): () => void {
  if (!isFirebaseReady() || !db) return () => {};
  const seen = new Set<string>();
  const path = `pvpRooms/${roomCode}/events`;
  const q = query(
    collection(db, 'pvpRooms', roomCode, 'events'),
    orderBy('createdAt', 'desc'),
    limit(15)
  );
  return onSnapshot(
    q,
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== 'added' || seen.has(change.doc.id)) return;
        seen.add(change.doc.id);
        const d = change.doc.data();
        if (d.senderUid !== myUid) {
          onEvent({
            id: change.doc.id,
            senderUid: d.senderUid,
            actionType: d.actionType as PvPActionType,
            damage: Number(d.damage) || 0,
            label: String(d.label || ''),
            timestamp: Date.now(),
          });
        }
      });
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch {
        // non-fatal
      }
    }
  );
}

export async function pushOnlineCombatUpdate(params: {
  roomCode: string;
  isHost: boolean;
  hostHp: number;
  guestHp: number;
  myScore: number;
  myCombo: number;
  status: 'playing' | 'finished';
  winnerUid: string;
}) {
  if (!isFirebaseReady() || !db) return;
  const path = `pvpRooms/${params.roomCode}`;
  try {
    const patch = params.isHost
      ? {
          hostHp: Math.max(0, Math.min(500, Math.round(params.hostHp))),
          guestHp: Math.max(0, Math.min(500, Math.round(params.guestHp))),
          hostScore: Math.max(0, Math.round(params.myScore)),
          hostCombo: Math.max(0, Math.min(99, params.myCombo)),
          status: params.status,
          winnerUid: params.winnerUid,
          updatedAt: serverTimestamp(),
        }
      : {
          hostHp: Math.max(0, Math.min(500, Math.round(params.hostHp))),
          guestHp: Math.max(0, Math.min(500, Math.round(params.guestHp))),
          guestScore: Math.max(0, Math.round(params.myScore)),
          guestCombo: Math.max(0, Math.min(99, params.myCombo)),
          status: params.status,
          winnerUid: params.winnerUid,
          updatedAt: serverTimestamp(),
        };
    await updateDoc(doc(db, 'pvpRooms', params.roomCode), patch);
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.UPDATE, path);
    } catch {
      // ignore terminal race if opponent already finished
    }
  }
}

export async function pushOnlineCombatEvent(params: {
  roomCode: string;
  senderUid: string;
  hostUid: string;
  guestUid: string;
  actionType: PvPActionType;
  damage: number;
  label: string;
}) {
  if (!isFirebaseReady() || !db) return;
  const path = `pvpRooms/${params.roomCode}/events`;
  try {
    await addDoc(collection(db, 'pvpRooms', params.roomCode, 'events'), {
      senderUid: params.senderUid,
      hostUid: params.hostUid,
      guestUid: params.guestUid,
      actionType: params.actionType,
      damage: Math.max(0, Math.min(250, Math.round(params.damage))),
      label: params.label.slice(0, 64),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.CREATE, path);
    } catch {
      // non-fatal
    }
  }
}

export async function cancelWaitingOnlineRoom(roomCode: string) {
  if (!isFirebaseReady() || !db) return;
  const path = `pvpRooms/${roomCode}`;
  try {
    await deleteDoc(doc(db, 'pvpRooms', roomCode));
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, path);
    } catch {
      // ignore if already joined or removed
    }
  }
}
