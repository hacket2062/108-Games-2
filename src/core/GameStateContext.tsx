import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  AnyQuestion,
  AscensionPath,
  BattleItemId,
  DailyQuestProgress,
  EffectiveCombatStats,
  EquipmentSlotId,
  GemElementId,
  GemInstance,
  GradeLevel,
  GuardianId,
  HeroClassId,
  HeroTierId,
  ParentSettings,
  PlayMode,
  PlayerCount,
  PlayerSaveData,
  PvPRunResult,
  SemesterId,
  StageProgressRecord,
  SubjectId,
  WeaponInstance,
  WorldRunResult,
  WrongRecord,
} from '../types/game';
import { useAuth } from '../auth/AuthContext';
import { db, handleFirestoreError, isFirebaseReady, OperationType } from './firebase';
import { applyXpGain, computeSaveCombatStats } from './combatMath';
import {
  ASCENSION_PATHS,
  BATTLE_ITEMS,
  createStarterWeapon,
  FUSION_RECIPES,
  GEM_ELEMENTS,
  getEnhanceCost,
  getEnhanceSuccessRate,
  WEAPON_CATALOG,
} from '../data/itemsAndGems';
import { GUARDIAN_SHOP_COSTS } from '../data/spiritsAndTitles';
import {
  canAdvanceHeroTier,
  canSelectHeroClass,
  createInitialHeroProgression,
  HERO_CLASSES,
} from '../data/heroProgression';
import { soundEngine } from '../audio/soundEngine';
import {
  clampElementaryGrade,
  createInitialSubjectProfiles,
  LearningMilestoneLog,
  migrateLegacySaveToSubjectProfiles,
  semesterToNumber,
  SubjectProfiles,
  TagMasteryRecord,
  TodayPracticeItem,
} from '../types/progression';
import {
  computeEnglishPilotRank,
  computeMandarinTitle,
  computeMathCommanderRank,
  computeScienceChefTitle,
  ENGLISH_JETS,
  ENGLISH_MODULES,
  MANDARIN_ARMORS,
  MANDARIN_GROWTH_TREE,
  MANDARIN_WEAPONS,
  MATH_GROWTH_TREE,
  MATH_TURRET_ARSENAL,
  SCIENCE_COOKWARE,
  SCIENCE_GROWTH_TREE,
} from '../data/subjectProgressionData';

const SAVE_PREFIX = 'zhiguang_108_save_v2_';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function createInitialDailyQuests(): DailyQuestProgress[] {
  return [
    {
      id: 'q_answer_5',
      title: '答對 5 道 108 課綱題目',
      target: 5,
      current: 0,
      rewardCoins: 120,
      rewardCrystals: 3,
      claimed: false,
    },
    {
      id: 'q_clear_1',
      title: '通關任一科目世界 Boss',
      target: 1,
      current: 0,
      rewardCoins: 160,
      rewardCrystals: 4,
      claimed: false,
    },
    {
      id: 'q_pvp_1',
      title: '完成 1 場線上知識競技對戰',
      target: 1,
      current: 0,
      rewardCoins: 180,
      rewardCrystals: 5,
      claimed: false,
    },
  ];
}

export function createInitialPlayerSave(): PlayerSaveData {
  const starterWeapon = createStarterWeapon();
  return {
    level: 1,
    xp: 0,
    coins: 520,
    crystals: 20,
    bestStreak: 0,
    selectedGuardian: 'qilin',
    unlockedGuardians: ['qilin', 'stardragon', 'griffin', 'deer'],
    guardianBonds: {
      qilin: 2,
      stardragon: 1,
      griffin: 1,
      deer: 1,
    },
    equipment: {
      weapon: 1,
      helm: 1,
      armor: 1,
      gloves: 1,
      boots: 1,
      amulet: 1,
    },
    weapons: [
      starterWeapon,
      {
        uid: 'wp-starter-02',
        templateId: 'wp_star_lance',
        name: '星輝脈衝長槍',
        baseAttack: 32,
        enhanceLevel: 5,
        ascensionPath: 'base',
        rarity: 'epic',
        socketedGems: [null, null, null],
      },
    ],
    equippedWeaponUid: 'wp-starter-02',
    gemBag: [
      { uid: 'g-seed-1', element: 'ink_ruby', level: 1 },
      { uid: 'g-seed-2', element: 'ink_ruby', level: 1 },
      { uid: 'g-seed-3', element: 'ink_ruby', level: 1 },
      { uid: 'g-seed-4', element: 'star_sapphire', level: 1 },
      { uid: 'g-seed-5', element: 'gear_topaz', level: 1 },
      { uid: 'g-seed-6', element: 'leaf_emerald', level: 1 },
    ],
    items: {
      wisdom_potion: 2,
      combo_charm: 2,
      shield_scroll: 2,
      time_hourglass: 2,
      forge_guard: 2,
    },
    selectedTitle: 'title_novice',
    unlockedTitles: ['title_novice'],
    grade: 4,
    semester: 'upper',
    playMode: 'adventure',
    muted: false,
    subjectStats: {
      chinese: { answered: 0, correct: 0, bestScore: 0, starsEarned: 0, clears: 0 },
      english: { answered: 0, correct: 0, bestScore: 0, starsEarned: 0, clears: 0 },
      math: { answered: 0, correct: 0, bestScore: 0, starsEarned: 0, clears: 0 },
      science: { answered: 0, correct: 0, bestScore: 0, starsEarned: 0, clears: 0 },
    },
    wrongRecords: [],
    unlockedCards: [],
    trajectory: [],
    dailyQuests: createInitialDailyQuests(),
    dailyPlaySeconds: 0,
    lastPlayDate: todayKey(),
    pvp: {
      rating: 1000,
      wins: 0,
      losses: 0,
      winStreak: 0,
      bestWinStreak: 0,
      honorTokens: 60,
    },
    parentSettings: {
      pinCode: '1234',
      dailyLimitMinutes: 45,
      pvpEnabled: true,
      forcePracticeMode: false,
    },
    stageProgress: {},
    masteredQuestionIds: [],
    knowledgeMastery: {},
    rapidGuessCount: 0,
    playerCount: 1,
    heroProgression: createInitialHeroProgression(),
    towerBestFloor: 0,
    discoveredBestiary: ['bst_chi_moth', 'bst_eng_drone', 'bst_math_zero', 'bst_sci_glutton'],
    subjectProfiles: createInitialSubjectProfiles(),
    learningMilestones: [],
    tagMastery: {},
    todayPracticeQueue: [],
  };
}

function hydrateSave(raw: Partial<PlayerSaveData> | null | undefined): PlayerSaveData {
  const base = createInitialPlayerSave();
  if (!raw) return base;
  const merged: PlayerSaveData = {
    ...base,
    ...raw,
    guardianBonds: { ...base.guardianBonds, ...(raw.guardianBonds || {}) },
    equipment: { ...base.equipment, ...(raw.equipment || {}) },
    items: { ...base.items, ...(raw.items || {}) },
    subjectStats: {
      chinese: { ...base.subjectStats.chinese, ...(raw.subjectStats?.chinese || {}) },
      english: { ...base.subjectStats.english, ...(raw.subjectStats?.english || {}) },
      math: { ...base.subjectStats.math, ...(raw.subjectStats?.math || {}) },
      science: { ...base.subjectStats.science, ...(raw.subjectStats?.science || {}) },
    },
    pvp: { ...base.pvp, ...(raw.pvp || {}) },
    parentSettings: { ...base.parentSettings, ...(raw.parentSettings || {}) },
    weapons: Array.isArray(raw.weapons) && raw.weapons.length > 0 ? raw.weapons : base.weapons,
    gemBag: Array.isArray(raw.gemBag) ? raw.gemBag : base.gemBag,
    wrongRecords: Array.isArray(raw.wrongRecords) ? raw.wrongRecords : [],
    trajectory: Array.isArray(raw.trajectory) ? raw.trajectory : [],
    dailyQuests:
      Array.isArray(raw.dailyQuests) && raw.dailyQuests.length > 0
        ? raw.dailyQuests
        : base.dailyQuests,
    stageProgress: raw.stageProgress && typeof raw.stageProgress === 'object' ? raw.stageProgress : {},
    masteredQuestionIds: Array.isArray(raw.masteredQuestionIds) ? raw.masteredQuestionIds : [],
    knowledgeMastery:
      raw.knowledgeMastery && typeof raw.knowledgeMastery === 'object' ? raw.knowledgeMastery : {},
    rapidGuessCount: typeof raw.rapidGuessCount === 'number' ? raw.rapidGuessCount : 0,
    playerCount:
      raw.playerCount === 1 || raw.playerCount === 2 || raw.playerCount === 3 || raw.playerCount === 4
        ? raw.playerCount
        : 1,
    heroProgression: {
      ...createInitialHeroProgression(),
      ...(raw.heroProgression || {}),
    },
    towerBestFloor: typeof raw.towerBestFloor === 'number' ? raw.towerBestFloor : 0,
    discoveredBestiary:
      Array.isArray(raw.discoveredBestiary) && raw.discoveredBestiary.length > 0
        ? Array.from(new Set(raw.discoveredBestiary))
        : base.discoveredBestiary,
    grade: clampElementaryGrade(raw.grade ?? base.grade),
    subjectProfiles: migrateLegacySaveToSubjectProfiles(raw),
    learningMilestones: Array.isArray(raw.learningMilestones) ? raw.learningMilestones : [],
    tagMastery: raw.tagMastery && typeof raw.tagMastery === 'object' ? raw.tagMastery : {},
    todayPracticeQueue: Array.isArray(raw.todayPracticeQueue) ? raw.todayPracticeQueue : [],
  };
  if (merged.lastPlayDate !== todayKey()) {
    merged.lastPlayDate = todayKey();
    merged.dailyPlaySeconds = 0;
    merged.dailyQuests = createInitialDailyQuests();
  }
  return merged;
}

function extractRevengeOptions(q: AnyQuestion): string[] {
  if (q.subject === 'chinese') {
    if (q.payload.mode === 'slash') return q.payload.options;
    if (q.payload.mode === 'radical') {
      return [q.payload.targetChar, q.payload.partA, q.payload.partB, '明'].slice(0, 4);
    }
    return [q.payload.correctChar, q.payload.wrongChar, '的', '得'];
  }
  if (q.subject === 'english') {
    if (q.payload.mode === 'spell') {
      return [q.payload.word, `${q.payload.word}s`, `un${q.payload.word}`, `${q.payload.word}ed`];
    }
    return q.payload.choices;
  }
  if (q.subject === 'math') return q.payload.options;
  return [
    q.answer,
    ...q.payload.ingredients.filter((i) => !i.isCorrect).map((i) => i.name),
    '純水蒸餾',
  ].slice(0, 4);
}

export interface ActionFeedback {
  ok: boolean;
  message: string;
}

interface GameStateContextValue {
  save: PlayerSaveData;
  combatStats: EffectiveCombatStats;
  equippedWeapon: WeaponInstance;
  isRestReminderVisible: boolean;
  dismissRestReminder: () => void;
  setGrade: (g: GradeLevel) => void;
  setSemester: (s: SemesterId) => void;
  setPlayMode: (m: PlayMode) => void;
  toggleMute: () => void;
  selectGuardian: (id: GuardianId) => void;
  petGuardian: () => void;
  selectTitle: (titleId: string) => void;
  recordAnswer: (
    question: AnyQuestion,
    isCorrect: boolean,
    responseMs?: number,
    usedHint?: boolean
  ) => void;
  resolveWrongRecord: (questionId: string) => void;
  applyWorldResult: (result: WorldRunResult) => { leveledUp: boolean; chestDropped?: string };
  applyPvPResult: (result: PvPRunResult) => { leveledUp: boolean };
  claimDailyQuest: (questId: string) => ActionFeedback;
  // Forge
  equipWeapon: (weaponUid: string) => void;
  enhanceWeapon: (weaponUid: string, useGuardScroll: boolean) => ActionFeedback;
  ascendWeapon: (weaponUid: string, path: AscensionPath) => ActionFeedback;
  fuseWeapons: (uidA: string, uidB: string) => ActionFeedback;
  upgradeEquipmentSlot: (slot: EquipmentSlotId) => ActionFeedback;
  // Socketing
  socketGem: (weaponUid: string, slotIndex: number, gemUid: string) => ActionFeedback;
  unsocketGem: (weaponUid: string, slotIndex: number) => ActionFeedback;
  synthesizeGems: (element: GemElementId, level: 1 | 2 | 3 | 4) => ActionFeedback;
  // Shop
  buyWeapon: (templateId: string, useHonor: boolean, discountFactor?: number) => ActionFeedback;
  buyGem: (element: GemElementId, discountFactor?: number) => ActionFeedback;
  buyBattleItem: (itemId: BattleItemId, useHonor: boolean, discountFactor?: number) => ActionFeedback;
  consumeBattleItem: (itemId: BattleItemId) => boolean;
  unlockOrBondGuardian: (guardianId: GuardianId) => ActionFeedback;
  // Hero Progression, Co-op, Tower & Bestiary
  setPlayerCount: (count: PlayerCount) => void;
  advanceHeroTier: () => ActionFeedback;
  selectHeroClass: (classId: HeroClassId) => ActionFeedback;
  setSecondaryGuardian: (guardianId: GuardianId) => void;
  recordDiscoveredMonster: (monsterId: string) => void;
  applyTowerResult: (params: {
    floorReached: number;
    correctCount: number;
    totalAttempts: number;
    coinsEarned: number;
    xpEarned: number;
    badgesEarned: number;
    crystalsEarned: number;
  }) => { leveledUp: boolean; isNewRecord: boolean };
  // Subject-Specific Independent Hubs & Progression
  subjectProfiles: SubjectProfiles;
  upgradeSubjectTreeNode: (subject: 'chinese' | 'math' | 'science', nodeId: string) => ActionFeedback;
  equipOrUnlockMandarinGear: (slot: 'weapon' | 'armor', itemId: string) => ActionFeedback;
  selectMandarinSpirit: (spiritId: string) => void;
  unlockOrSelectEnglishJet: (jetId: string) => ActionFeedback;
  unlockOrEquipEnglishModule: (moduleId: string) => ActionFeedback;
  selectEnglishCopilot: (spiritId: string) => void;
  upgradeMathTurret: (turretId: string) => ActionFeedback;
  toggleMathDeckTurret: (turretId: string) => ActionFeedback;
  selectMathSpirit: (spiritId: string) => void;
  equipOrUnlockScienceCookware: (cookwareId: string) => ActionFeedback;
  selectScienceSpirit: (spiritId: string) => void;
  buySubjectConsumable: (
    subject: SubjectId,
    itemId: string,
    costCoins: number,
    itemName: string
  ) => ActionFeedback;
  // Parent Learning Trajectory & Practice Queue
  updateParentSettings: (patch: Partial<ParentSettings>) => void;
  addToTodayPracticeQueue: (
    item: Omit<TodayPracticeItem, 'id' | 'addedAt' | 'completed'>
  ) => ActionFeedback;
  removeFromTodayPracticeQueue: (id: string) => void;
  completeTodayPracticeItem: (id: string) => void;
  buildLearningCsv: () => string;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [save, setSave] = useState<PlayerSaveData>(() => {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + user.uid);
      return hydrateSave(raw ? (JSON.parse(raw) as Partial<PlayerSaveData>) : null);
    } catch {
      return createInitialPlayerSave();
    }
  });
  const [restDismissed, setRestDismissed] = useState(false);

  // Reload per-account save whenever user switches account (Google or local)
  useEffect(() => {
    let cancelled = false;
    const loadAccountSave = async () => {
      let localLoaded = createInitialPlayerSave();
      try {
        const raw = localStorage.getItem(SAVE_PREFIX + user.uid);
        if (raw) localLoaded = hydrateSave(JSON.parse(raw) as Partial<PlayerSaveData>);
      } catch {
        // fallback to default
      }
      if (!cancelled) {
        setSave(localLoaded);
        soundEngine.setMuted(localLoaded.muted);
      }

      // If authenticated via verified Google account, sync from Firestore /users/{uid}
      if (user.provider === 'google' && user.emailVerified && isFirebaseReady() && db) {
        const path = `users/${user.uid}`;
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (!cancelled && snap.exists()) {
            const data = snap.data();
            if (data && data.saveData && typeof data.saveData === 'object') {
              const cloudSave = hydrateSave(data.saveData as Partial<PlayerSaveData>);
              setSave(cloudSave);
              soundEngine.setMuted(cloudSave.muted);
              try {
                localStorage.setItem(SAVE_PREFIX + user.uid, JSON.stringify(cloudSave));
              } catch {
                // ignore
              }
            }
          }
        } catch (err) {
          // Do not crash offline preview, log structured error via helper
          try {
            handleFirestoreError(err, OperationType.GET, path);
          } catch {
            // gracefully keep local save
          }
        }
      }
    };
    loadAccountSave();
    return () => {
      cancelled = true;
    };
  }, [user.uid, user.provider, user.emailVerified]);

  // Persist save to localStorage + debounced Firestore cloud sync for Google users
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_PREFIX + user.uid, JSON.stringify(save));
    } catch {
      // ignore
    }
    soundEngine.setMuted(save.muted);

    if (user.provider !== 'google' || !user.emailVerified || !isFirebaseReady() || !db) return;
    const firestoreDb = db;
    const timer = window.setTimeout(async () => {
      const path = `users/${user.uid}`;
      try {
        const ref = doc(firestoreDb, 'users', user.uid);
        const existingSnap = await getDoc(ref);
        const compactSaveData = {
          level: save.level,
          xp: save.xp,
          coins: save.coins,
          crystals: save.crystals,
          bestStreak: save.bestStreak,
          selectedGuardian: save.selectedGuardian,
          guardianBonds: save.guardianBonds,
          equipment: save.equipment,
          weapons: save.weapons.slice(0, 12),
          equippedWeaponUid: save.equippedWeaponUid,
          gemBag: save.gemBag.slice(0, 40),
          items: save.items,
          selectedTitle: save.selectedTitle,
          unlockedTitles: save.unlockedTitles.slice(0, 12),
          grade: save.grade,
          semester: save.semester,
          playMode: save.playMode,
          muted: save.muted,
          subjectStats: save.subjectStats,
          wrongRecords: save.wrongRecords.slice(0, 30),
          trajectory: save.trajectory.slice(0, 25),
          pvp: save.pvp,
          parentSettings: save.parentSettings,
          stageProgress: save.stageProgress ?? {},
          masteredQuestionIds: (save.masteredQuestionIds ?? []).slice(-180),
          knowledgeMastery: save.knowledgeMastery ?? {},
          rapidGuessCount: save.rapidGuessCount ?? 0,
          playerCount: save.playerCount ?? 1,
          heroProgression: save.heroProgression ?? createInitialHeroProgression(),
          towerBestFloor: save.towerBestFloor ?? 0,
          discoveredBestiary: (save.discoveredBestiary ?? []).slice(0, 32),
          subjectProfiles: save.subjectProfiles ?? createInitialSubjectProfiles(),
          learningMilestones: (save.learningMilestones ?? []).slice(0, 40),
          tagMastery: save.tagMastery ?? {},
          todayPracticeQueue: (save.todayPracticeQueue ?? []).slice(0, 20),
        };
        const payload = {
          uid: user.uid,
          displayName: user.displayName.slice(0, 60) || '智光守護者',
          level: Math.min(200, Math.max(1, save.level)),
          xp: Math.max(0, save.xp),
          coins: Math.max(0, save.coins),
          crystals: Math.max(0, save.crystals),
          honorTokens: Math.max(0, save.pvp.honorTokens),
          pvpRating: Math.min(9999, Math.max(0, save.pvp.rating)),
          pvpWins: Math.max(0, save.pvp.wins),
          pvpLosses: Math.max(0, save.pvp.losses),
          grade: save.grade,
          semester: save.semester,
          selectedGuardian: save.selectedGuardian,
          saveData: compactSaveData,
          createdAt: existingSnap.exists() ? existingSnap.data().createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(ref, payload);
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.WRITE, path);
        } catch {
          // non-blocking sync fallback
        }
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [save, user.displayName, user.emailVerified, user.provider, user.uid]);

  // Anti-addiction healthy play timer (increments every 10s)
  useEffect(() => {
    const id = window.setInterval(() => {
      setSave((prev) => ({
        ...prev,
        dailyPlaySeconds: prev.dailyPlaySeconds + 10,
      }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const equippedWeapon = useMemo(
    () => save.weapons.find((w) => w.uid === save.equippedWeaponUid) ?? save.weapons[0] ?? createStarterWeapon(),
    [save.weapons, save.equippedWeaponUid]
  );

  const combatStats = useMemo(() => computeSaveCombatStats(save), [save]);

  const isRestReminderVisible =
    !restDismissed && save.dailyPlaySeconds >= save.parentSettings.dailyLimitMinutes * 60;

  const setGrade = useCallback((grade: GradeLevel) => setSave((p) => ({ ...p, grade })), []);
  const setSemester = useCallback((semester: SemesterId) => setSave((p) => ({ ...p, semester })), []);
  const setPlayMode = useCallback((playMode: PlayMode) => setSave((p) => ({ ...p, playMode })), []);
  const toggleMute = useCallback(() => setSave((p) => ({ ...p, muted: !p.muted })), []);

  const selectGuardian = useCallback((id: GuardianId) => {
    setSave((p) => ({ ...p, selectedGuardian: id }));
  }, []);

  const petGuardian = useCallback(() => {
    setSave((p) => ({
      ...p,
      guardianBonds: {
        ...p.guardianBonds,
        [p.selectedGuardian]: (p.guardianBonds[p.selectedGuardian] ?? 1) + 1,
      },
    }));
  }, []);

  const selectTitle = useCallback((titleId: string) => {
    setSave((p) => (p.unlockedTitles.includes(titleId) ? { ...p, selectedTitle: titleId } : p));
  }, []);

  const recordAnswer = useCallback(
    (question: AnyQuestion, isCorrect: boolean, responseMs?: number, usedHint = false) => {
      setSave((prev) => {
        const curr = prev.subjectStats[question.subject];
        const nextStats = {
          ...prev.subjectStats,
          [question.subject]: {
            ...curr,
            answered: curr.answered + 1,
            correct: curr.correct + (isCorrect ? 1 : 0),
          },
        };

        let nextWrong = [...prev.wrongRecords];
        if (!isCorrect) {
          const idx = nextWrong.findIndex((w) => w.questionId === question.id);
          const rec: WrongRecord = {
            questionId: question.id,
            subject: question.subject,
            grade: question.grade,
            prompt: question.prompt,
            correctAnswer: question.answer,
            explanation: question.explanation,
            knowledgeTag: question.knowledgeTag,
            wrongCount: idx >= 0 ? nextWrong[idx].wrongCount + 1 : 1,
            lastWrongAt: Date.now(),
            revengeOptions: extractRevengeOptions(question),
          };
          if (idx >= 0) nextWrong[idx] = rec;
          else nextWrong = [rec, ...nextWrong].slice(0, 60);
        }

        // Track mastered question IDs for zero-repeat prioritization
        const masteredSet = new Set(prev.masteredQuestionIds ?? []);
        if (isCorrect && !usedHint) masteredSet.add(question.id);
        else if (!isCorrect) masteredSet.delete(question.id);

        // Legacy per-knowledgeTag mastery
        const tagKey = `${question.subject}:${question.knowledgeTag}`;
        const prevMap = prev.knowledgeMastery ?? {};
        const prevEntry = prevMap[tagKey] ?? {
          subject: question.subject,
          tag: question.knowledgeTag,
          answered: 0,
          correct: 0,
        };
        const nextKnowledgeMastery = {
          ...prevMap,
          [tagKey]: {
            ...prevEntry,
            answered: prevEntry.answered + 1,
            correct: prevEntry.correct + (isCorrect ? 1 : 0),
          },
        };

        // Honest TagMasteryRecord separating unassisted vs hinted answers
        const qSemNum = semesterToNumber(question.semester);
        const detailedKey = `${question.subject}:g${question.grade}:${question.knowledgeTag}`;
        const prevTagMap = prev.tagMastery ?? {};
        const prevTag: TagMasteryRecord = prevTagMap[detailedKey] ?? {
          subject: question.subject,
          grade: clampElementaryGrade(question.grade),
          semester: qSemNum,
          tag: question.knowledgeTag,
          attempts: 0,
          unassistedCorrect: 0,
          hintedCorrect: 0,
          wrongCount: 0,
          lastPracticedAt: new Date().toISOString(),
        };
        const nextUnassisted = prevTag.unassistedCorrect + (isCorrect && !usedHint ? 1 : 0);
        const nextHinted = prevTag.hintedCorrect + (isCorrect && usedHint ? 1 : 0);
        const nextTagMastery: Record<string, TagMasteryRecord> = {
          ...prevTagMap,
          [detailedKey]: {
            ...prevTag,
            semester: qSemNum,
            attempts: prevTag.attempts + 1,
            unassistedCorrect: nextUnassisted,
            hintedCorrect: nextHinted,
            wrongCount: prevTag.wrongCount + (isCorrect ? 0 : 1),
            lastPracticedAt: new Date().toISOString(),
          },
        };

        // Automatically record milestone when a tag reaches independent mastery (unassisted >= 2)
        let nextMilestones = prev.learningMilestones ?? [];
        if (prevTag.unassistedCorrect < 2 && nextUnassisted >= 2) {
          const semText = qSemNum === 1 ? '上學期' : '下學期';
          const milestone: LearningMilestoneLog = {
            id: `ms-tag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            timestamp: new Date().toISOString(),
            subject: question.subject,
            grade: clampElementaryGrade(question.grade),
            semester: qSemNum,
            eventType: 'tag_mastered',
            title: `獨立掌握「${question.knowledgeTag}」`,
            curriculumEvidence: `於${question.grade}年級${semText}完成「${question.knowledgeTag}」無提示連續正確掌握（累計無提示答對 ${nextUnassisted} 題）`,
          };
          nextMilestones = [milestone, ...nextMilestones].slice(0, 80);
        }

        // Complete matching items in Parent Today Practice Queue on unassisted correct answer
        const nextPracticeQueue = (prev.todayPracticeQueue ?? []).map((item) =>
          !item.completed &&
          isCorrect &&
          !usedHint &&
          item.subject === question.subject &&
          (item.knowledgeTag === question.knowledgeTag || item.questionId === question.id)
            ? { ...item, completed: true }
            : item
        );

        // Detect rapid random guessing (<1.8s and wrong)
        const isRapidGuess = !isCorrect && typeof responseMs === 'number' && responseMs < 1800;

        const nextQuests = prev.dailyQuests.map((q) =>
          q.id === 'q_answer_5' && isCorrect ? { ...q, current: Math.min(q.target, q.current + 1) } : q
        );

        return {
          ...prev,
          subjectStats: nextStats,
          wrongRecords: nextWrong,
          dailyQuests: nextQuests,
          masteredQuestionIds: Array.from(masteredSet).slice(-350),
          knowledgeMastery: nextKnowledgeMastery,
          tagMastery: nextTagMastery,
          learningMilestones: nextMilestones,
          todayPracticeQueue: nextPracticeQueue,
          rapidGuessCount: (prev.rapidGuessCount ?? 0) + (isRapidGuess ? 1 : 0),
        };
      });
    },
    []
  );

  const resolveWrongRecord = useCallback((questionId: string) => {
    setSave((prev) => {
      const target = prev.wrongRecords.find((w) => w.questionId === questionId);
      const nextMilestones = [...(prev.learningMilestones ?? [])];
      if (target) {
        const semNum = semesterToNumber(prev.semester);
        nextMilestones.unshift({
          id: `ms-wrong-${Date.now().toString(36)}`,
          timestamp: new Date().toISOString(),
          subject: target.subject,
          grade: clampElementaryGrade(target.grade),
          semester: semNum,
          eventType: 'mistake_overcome',
          title: `克服錯題本「${target.knowledgeTag}」`,
          curriculumEvidence: `於錯題本成功複習並答對 ${target.grade} 年級「${target.knowledgeTag}」薄弱題型`,
        });
      }
      const nextPracticeQueue = (prev.todayPracticeQueue ?? []).map((item) =>
        item.questionId === questionId || (target && item.knowledgeTag === target.knowledgeTag && item.subject === target.subject)
          ? { ...item, completed: true }
          : item
      );
      return {
        ...prev,
        wrongRecords: prev.wrongRecords.filter((w) => w.questionId !== questionId),
        learningMilestones: nextMilestones.slice(0, 80),
        todayPracticeQueue: nextPracticeQueue,
        coins: prev.coins + 25,
      };
    });
  }, []);

  const applyWorldResult = useCallback(
    (result: WorldRunResult): { leveledUp: boolean; chestDropped?: string } => {
      let didLevel = false;
      let chestDropped: string | undefined;
      setSave((prev) => {
        const xpOutcome = applyXpGain(prev.level, prev.xp, result.xpEarned);
        didLevel = xpOutcome.leveledUp;
        const st = prev.subjectStats[result.subject];
        const nextSubjectStats = {
          ...prev.subjectStats,
          [result.subject]: {
            ...st,
            bestScore: Math.max(st.bestScore, result.score),
            starsEarned: Math.max(st.starsEarned, result.stars),
            clears: st.clears + (result.victory ? 1 : 0),
          },
        };

        const nextStreak = Math.max(prev.bestStreak, result.maxCombo);
        const nextTitles = new Set(prev.unlockedTitles);
        if (nextStreak >= 5) nextTitles.add('title_combo5');
        if (nextStreak >= 15) nextTitles.add('title_mythic_grandmaster');
        if (
          nextSubjectStats.chinese.clears > 0 &&
          nextSubjectStats.english.clears > 0 &&
          nextSubjectStats.math.clears > 0 &&
          nextSubjectStats.science.clears > 0
        ) {
          nextTitles.add('title_quad_clear');
        }

        const nextQuests = prev.dailyQuests.map((q) =>
          q.id === 'q_clear_1' && result.victory ? { ...q, current: q.target } : q
        );

        // Update 10-stage campaign progress & Stage 10 3-star Boss chest reward
        const nextStageProgress: Record<string, StageProgressRecord> = {
          ...(prev.stageProgress ?? {}),
        };
        let bonusCoins = 0;
        let bonusCrystals = 0;
        const nextWeapons = [...prev.weapons];

        if (result.stageKey) {
          const prevRec = nextStageProgress[result.stageKey];
          const bestStars = Math.max(prevRec?.stars ?? 0, result.victory ? result.stars : 0) as
            | 0
            | 1
            | 2
            | 3;
          const isBossStage = result.stageKey.endsWith('_s10');
          const shouldDropChest =
            isBossStage && result.victory && result.stars >= 3 && !prevRec?.chestClaimed;

          if (shouldDropChest) {
            bonusCoins += 260;
            bonusCrystals += 8;
            const tpl = WEAPON_CATALOG[WEAPON_CATALOG.length - 1];
            if (tpl) {
              nextWeapons.push({
                uid: `wp-boss-${Date.now().toString(36)}`,
                templateId: tpl.templateId,
                name: `${tpl.name}・星辰`,
                baseAttack: tpl.baseAttack + 4,
                enhanceLevel: 3,
                ascensionPath: 'base',
                rarity: 'legendary',
                socketedGems: [null, null, null],
              });
            }
            chestDropped = '三星大魔王寶箱：+260 金幣、+8 晶石與限定傳說神兵！';
          }

          nextStageProgress[result.stageKey] = {
            cleared: Boolean(prevRec?.cleared || result.victory),
            stars: bestStars,
            bestScore: Math.max(prevRec?.bestScore ?? 0, result.score),
            chestClaimed: Boolean(prevRec?.chestClaimed || shouldDropChest),
          };
        }

        const newEntry = {
          id: `tr-${Date.now()}`,
          timestamp: Date.now(),
          subject: result.subject,
          grade: prev.grade,
          correctCount: result.correctCount,
          totalAttempts: result.totalAttempts,
          score: result.score,
          durationSeconds: result.clearSeconds,
          victory: result.victory,
          note: result.stageLabel
            ? `${result.stageLabel}｜${result.progressSummary}`
            : result.progressSummary,
        };

        // Drop a random Lv.1 knowledge gem on victory!
        const subjectGemMap: Record<SubjectId, GemElementId> = {
          chinese: 'ink_ruby',
          english: 'star_sapphire',
          math: 'gear_topaz',
          science: 'leaf_emerald',
        };
        const droppedGem: GemInstance | null = result.victory
          ? {
              uid: `gem-drop-${Date.now().toString(36)}`,
              element: subjectGemMap[result.subject],
              level: 1,
            }
          : null;

        const earnedBadges = result.victory
          ? result.stageKey?.endsWith('_s10')
            ? 4
            : 2
          : result.correctCount >= 3
            ? 1
            : 0;
        const prevProg = prev.heroProgression ?? createInitialHeroProgression();

        // Any-Grade Entry proportional subject-specific growth rewards (never reset across grades!)
        const currProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
        const gradeScale = 1 + (prev.grade - 1) * 0.18;
        const nextProfiles: SubjectProfiles = {
          chinese: { ...currProfiles.chinese },
          english: { ...currProfiles.english },
          math: { ...currProfiles.math },
          science: { ...currProfiles.science },
        };
        if (result.subject === 'chinese') {
          const pts = Math.max(
            1,
            Math.round((result.correctCount * 0.35 + (result.victory ? 1.5 : 0.5)) * gradeScale)
          );
          const nextExp = currProfiles.chinese.exp + result.xpEarned;
          const levelUps = Math.floor(nextExp / 100);
          nextProfiles.chinese = {
            ...currProfiles.chinese,
            skillPoints: currProfiles.chinese.skillPoints + pts,
            rpgLevel: Math.min(60, currProfiles.chinese.rpgLevel + levelUps),
            exp: nextExp % 100,
          };
        } else if (result.subject === 'english') {
          const cores = Math.max(
            15,
            Math.round((result.correctCount * 7 + (result.victory ? 25 : 8)) * gradeScale)
          );
          const miles = Math.round((result.correctCount * 95 + (result.victory ? 320 : 80)) * gradeScale);
          const updatedEng = {
            ...currProfiles.english,
            hangarCores: currProfiles.english.hangarCores + cores,
            flightMiles: currProfiles.english.flightMiles + miles,
          };
          updatedEng.pilotRank = computeEnglishPilotRank(updatedEng);
          nextProfiles.english = updatedEng;
        } else if (result.subject === 'math') {
          const gears = Math.max(
            1,
            Math.round((result.correctCount * 0.35 + (result.victory ? 1.5 : 0.5)) * gradeScale)
          );
          const updatedMath = {
            ...currProfiles.math,
            techGears: currProfiles.math.techGears + gears,
          };
          updatedMath.commanderRank = computeMathCommanderRank(updatedMath);
          nextProfiles.math = updatedMath;
        } else if (result.subject === 'science') {
          const crystals = Math.max(
            1,
            Math.round((result.correctCount * 0.35 + (result.victory ? 1.5 : 0.5)) * gradeScale)
          );
          const updatedSci = {
            ...currProfiles.science,
            labCrystals: currProfiles.science.labCrystals + crystals,
          };
          updatedSci.chefTitle = computeScienceChefTitle(updatedSci);
          nextProfiles.science = updatedSci;
        }

        return {
          ...prev,
          level: Math.min(60, xpOutcome.level),
          xp: xpOutcome.xp,
          coins: prev.coins + result.coinsEarned + bonusCoins,
          crystals: prev.crystals + result.crystalsEarned + bonusCrystals,
          bestStreak: nextStreak,
          subjectStats: nextSubjectStats,
          unlockedTitles: Array.from(nextTitles),
          unlockedCards: Array.from(new Set([...prev.unlockedCards, ...result.knowledgeTags])),
          trajectory: [newEntry, ...prev.trajectory].slice(0, 50),
          dailyQuests: nextQuests,
          gemBag: droppedGem ? [droppedGem, ...prev.gemBag] : prev.gemBag,
          weapons: nextWeapons,
          stageProgress: nextStageProgress,
          heroProgression: {
            ...prevProg,
            badges: prevProg.badges + earnedBadges,
          },
          subjectProfiles: nextProfiles,
        };
      });
      return { leveledUp: didLevel, chestDropped };
    },
    []
  );

  const applyPvPResult = useCallback((result: PvPRunResult): { leveledUp: boolean } => {
    let didLevel = false;
    setSave((prev) => {
      const xpOutcome = applyXpGain(prev.level, prev.xp, result.xpEarned);
      didLevel = xpOutcome.leveledUp;
      const nextWinStreak = result.victory ? prev.pvp.winStreak + 1 : 0;
      const nextRating = Math.max(600, prev.pvp.rating + result.ratingDelta);
      const nextTitles = new Set(prev.unlockedTitles);
      if (result.victory) nextTitles.add('title_arena_winner');
      if (nextRating >= 1500) nextTitles.add('title_mythic_grandmaster');

      const nextQuests = prev.dailyQuests.map((q) =>
        q.id === 'q_pvp_1' ? { ...q, current: q.target } : q
      );

      const newEntry = {
        id: `tr-pvp-${Date.now()}`,
        timestamp: Date.now(),
        subject: 'pvp' as const,
        grade: prev.grade,
        correctCount: result.correctCount,
        totalAttempts: result.totalAttempts,
        score: result.myScore,
        durationSeconds: result.durationSeconds,
        victory: result.victory,
        note: `競技場對戰 ${result.opponentName}（${result.victory ? '勝利' : '惜敗'}，積分 ${result.ratingDelta >= 0 ? '+' : ''}${result.ratingDelta}）`,
      };

      return {
        ...prev,
        level: xpOutcome.level,
        xp: xpOutcome.xp,
        coins: prev.coins + result.coinsEarned,
        bestStreak: Math.max(prev.bestStreak, result.maxCombo),
        unlockedTitles: Array.from(nextTitles),
        trajectory: [newEntry, ...prev.trajectory].slice(0, 50),
        dailyQuests: nextQuests,
        pvp: {
          rating: nextRating,
          wins: prev.pvp.wins + (result.victory ? 1 : 0),
          losses: prev.pvp.losses + (result.victory ? 0 : 1),
          winStreak: nextWinStreak,
          bestWinStreak: Math.max(prev.pvp.bestWinStreak, nextWinStreak),
          honorTokens: prev.pvp.honorTokens + result.honorEarned,
        },
      };
    });
    return { leveledUp: didLevel };
  }, []);

  const claimDailyQuest = useCallback((questId: string): ActionFeedback => {
    let feedback: ActionFeedback = { ok: false, message: '任務尚未達成或已領取。' };
    setSave((prev) => {
      const target = prev.dailyQuests.find((q) => q.id === questId);
      if (!target || target.claimed || target.current < target.target) return prev;
      feedback = {
        ok: true,
        message: `領取成功！獲得 +${target.rewardCoins} 金幣、+${target.rewardCrystals} 智光晶石！`,
      };
      return {
        ...prev,
        coins: prev.coins + target.rewardCoins,
        crystals: prev.crystals + target.rewardCrystals,
        dailyQuests: prev.dailyQuests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
      };
    });
    return feedback;
  }, []);

  // ==================== FORGE SYSTEM ====================
  const equipWeapon = useCallback((weaponUid: string) => {
    setSave((prev) =>
      prev.weapons.some((w) => w.uid === weaponUid) ? { ...prev, equippedWeaponUid: weaponUid } : prev
    );
  }, []);

  const enhanceWeapon = useCallback((weaponUid: string, useGuardScroll: boolean): ActionFeedback => {
    const target = save.weapons.find((w) => w.uid === weaponUid);
    if (!target) return { ok: false, message: '找不到該神兵。' };
    if (target.enhanceLevel >= 15) return { ok: false, message: '此神兵已達最高強化 +15！' };

    const cost = getEnhanceCost(target.enhanceLevel);
    if (save.coins < cost.coins) return { ok: false, message: `金幣不足（需要 ${cost.coins}）。` };
    if (save.crystals < cost.crystals) return { ok: false, message: `智光晶石不足（需要 ${cost.crystals}）。` };
    if (useGuardScroll && save.items.forge_guard <= 0) {
      return { ok: false, message: '神匠保護卷軸不足，請至魔法商店購買。' };
    }

    const rate = getEnhanceSuccessRate(target.enhanceLevel);
    const success = Math.random() * 100 <= rate;
    const newLevel = success
      ? target.enhanceLevel + 1
      : target.enhanceLevel >= 7 && !useGuardScroll
        ? target.enhanceLevel - 1
        : target.enhanceLevel;

    setSave((prev) => ({
      ...prev,
      coins: prev.coins - cost.coins,
      crystals: prev.crystals - cost.crystals,
      items: useGuardScroll
        ? { ...prev.items, forge_guard: Math.max(0, prev.items.forge_guard - 1) }
        : prev.items,
      weapons: prev.weapons.map((w) =>
        w.uid === weaponUid ? { ...w, enhanceLevel: newLevel } : w
      ),
    }));

    if (success) {
      soundEngine.playPerfectBell();
      return { ok: true, message: `鍛造大成功！${target.name} 強化至 +${newLevel}！` };
    }
    soundEngine.playWrongBuzz();
    return {
      ok: false,
      message: useGuardScroll
        ? `強化未能突破，神匠保護卷軸發動，維持 +${newLevel} 不掉階！`
        : newLevel < target.enhanceLevel
          ? `鍛造過熱未能突破，強化暫降為 +${newLevel}（使用保護卷軸可防掉階）。`
          : `強化未能突破，但維持 +${newLevel} 不掉階！`,
    };
  }, [save.coins, save.crystals, save.items.forge_guard, save.weapons]);

  const ascendWeapon = useCallback((weaponUid: string, path: AscensionPath): ActionFeedback => {
    if (path === 'base') return { ok: false, message: '請選擇英雄、神話或地獄路線。' };
    const target = save.weapons.find((w) => w.uid === weaponUid);
    if (!target) return { ok: false, message: '找不到該神兵。' };
    const def = ASCENSION_PATHS[path];
    if (target.enhanceLevel < def.minEnhanceLevel) {
      return { ok: false, message: `需先強化至 +${def.minEnhanceLevel} 才可覺醒路線！` };
    }
    if (save.coins < def.coinCost || save.crystals < def.crystalCost) {
      return {
        ok: false,
        message: `資源不足！需要 ${def.coinCost} 金幣與 ${def.crystalCost} 智光晶石。`,
      };
    }

    soundEngine.playUltimateRoar();
    setSave((prev) => ({
      ...prev,
      coins: prev.coins - def.coinCost,
      crystals: prev.crystals - def.crystalCost,
      unlockedTitles: Array.from(new Set([...prev.unlockedTitles, 'title_forge_master'])),
      weapons: prev.weapons.map((w) =>
        w.uid === weaponUid
          ? { ...w, ascensionPath: path, rarity: path === 'inferno' || path === 'mythic' ? 'mythic' : 'legendary' }
          : w
      ),
    }));
    return { ok: true, message: `覺醒成功！${target.name} 獲得【${def.name}】專屬光環與被動！` };
  }, [save.coins, save.crystals, save.weapons]);

  const fuseWeapons = useCallback((uidA: string, uidB: string): ActionFeedback => {
    if (uidA === uidB) return { ok: false, message: '請選擇兩把不同的神兵進行融合。' };
    const wA = save.weapons.find((w) => w.uid === uidA);
    const wB = save.weapons.find((w) => w.uid === uidB);
    if (!wA || !wB) return { ok: false, message: '找不到指定的融合武器。' };

    const recipe = FUSION_RECIPES[0];
    if (save.coins < recipe.coinCost || save.crystals < recipe.crystalCost) {
      return {
        ok: false,
        message: `融合需要 ${recipe.coinCost} 金幣與 ${recipe.crystalCost} 智光晶石。`,
      };
    }

    const recoveredGems: GemInstance[] = [
      ...wA.socketedGems.filter((g): g is GemInstance => g !== null),
      ...wB.socketedGems.filter((g): g is GemInstance => g !== null),
    ];
    const inheritedEnhance = Math.min(15, Math.max(wA.enhanceLevel, wB.enhanceLevel) + 1);
    const inheritedPath = wA.ascensionPath !== 'base' ? wA.ascensionPath : wB.ascensionPath;
    const fusedWeapon: WeaponInstance = {
      uid: `wp-fused-${Date.now().toString(36)}`,
      templateId: recipe.resultTemplateId,
      name: recipe.resultName,
      baseAttack: recipe.resultBaseAttack,
      enhanceLevel: inheritedEnhance,
      ascensionPath: inheritedPath,
      rarity: recipe.resultRarity,
      isFused: true,
      socketedGems: [null, null, null],
    };

    soundEngine.playPerfectBell();
    setSave((prev) => ({
      ...prev,
      coins: prev.coins - recipe.coinCost,
      crystals: prev.crystals - recipe.crystalCost,
      weapons: [fusedWeapon, ...prev.weapons.filter((w) => w.uid !== uidA && w.uid !== uidB)],
      equippedWeaponUid: fusedWeapon.uid,
      gemBag: [...recoveredGems, ...prev.gemBag],
    }));

    return {
      ok: true,
      message: `神兵融合成功！誕生【${fusedWeapon.name} +${inheritedEnhance}】，原有寶石已無損歸還背包！`,
    };
  }, [save.coins, save.crystals, save.weapons]);

  // ==================== SOCKETING & GEM SYNTHESIS ====================
  const socketGem = useCallback((weaponUid: string, slotIndex: number, gemUid: string): ActionFeedback => {
    const weapon = save.weapons.find((w) => w.uid === weaponUid);
    const gem = save.gemBag.find((g) => g.uid === gemUid);
    if (!weapon || !gem) return { ok: false, message: '找不到指定武器或寶石。' };
    if (slotIndex < 0 || slotIndex > 2) return { ok: false, message: '無效的寶石槽位。' };

    const previousGem = weapon.socketedGems[slotIndex];
    soundEngine.playGemSynth();
    setSave((prev) => ({
      ...prev,
      gemBag: [
        ...(previousGem ? [previousGem] : []),
        ...prev.gemBag.filter((g) => g.uid !== gemUid),
      ],
      weapons: prev.weapons.map((w) => {
        if (w.uid !== weaponUid) return w;
        const nextSlots = [...w.socketedGems];
        nextSlots[slotIndex] = gem;
        return { ...w, socketedGems: nextSlots };
      }),
    }));
    return {
      ok: true,
      message: `已無損鑲嵌 Lv.${gem.level} ${GEM_ELEMENTS[gem.element].name}！戰力立即提升。`,
    };
  }, [save.gemBag, save.weapons]);

  const unsocketGem = useCallback((weaponUid: string, slotIndex: number): ActionFeedback => {
    const weapon = save.weapons.find((w) => w.uid === weaponUid);
    if (!weapon) return { ok: false, message: '找不到武器。' };
    const existingGem = weapon.socketedGems[slotIndex];
    if (!existingGem) return { ok: false, message: '此槽位目前沒有寶石。' };

    soundEngine.playClick();
    setSave((prev) => ({
      ...prev,
      gemBag: [existingGem, ...prev.gemBag],
      weapons: prev.weapons.map((w) => {
        if (w.uid !== weaponUid) return w;
        const nextSlots = [...w.socketedGems];
        nextSlots[slotIndex] = null;
        return { ...w, socketedGems: nextSlots };
      }),
    }));
    return {
      ok: true,
      message: `已無損拆下 Lv.${existingGem.level} ${GEM_ELEMENTS[existingGem.element].name} 並放回背包！`,
    };
  }, [save.weapons]);

  const synthesizeGems = useCallback((element: GemElementId, level: 1 | 2 | 3 | 4): ActionFeedback => {
    const matching = save.gemBag.filter((g) => g.element === element && g.level === level);
    if (matching.length < 3) {
      return { ok: false, message: `需要 3 顆相同的 Lv.${level} ${GEM_ELEMENTS[element].name} 才能合成升階！` };
    }
    const consumeUids = new Set(matching.slice(0, 3).map((g) => g.uid));
    const upgraded: GemInstance = {
      uid: `gem-syn-${Date.now().toString(36)}`,
      element,
      level: (level + 1) as 2 | 3 | 4 | 5,
    };
    soundEngine.playGemSynth();
    setSave((prev) => ({
      ...prev,
      gemBag: [upgraded, ...prev.gemBag.filter((g) => !consumeUids.has(g.uid))],
    }));
    return {
      ok: true,
      message: `3 合 1 寶石合成成功！獲得 Lv.${upgraded.level} ${GEM_ELEMENTS[element].name}！`,
    };
  }, [save.gemBag]);

  // ==================== MAGIC SHOP ====================
  const buyWeapon = useCallback((templateId: string, useHonor: boolean, discountFactor = 1): ActionFeedback => {
    const tpl = WEAPON_CATALOG.find((w) => w.templateId === templateId);
    if (!tpl) return { ok: false, message: '找不到該商品。' };
    if (useHonor) {
      const honorCost = tpl.priceHonor ?? 9999;
      if (save.pvp.honorTokens < honorCost) {
        return { ok: false, message: `競技榮譽幣不足（需要 ${honorCost}）。` };
      }
    } else {
      const finalCoins = Math.round(tpl.priceCoins * discountFactor);
      if (save.coins < finalCoins) {
        return { ok: false, message: `金幣不足（需要 ${finalCoins}）。` };
      }
    }

    const newWeapon: WeaponInstance = {
      uid: `wp-shop-${Date.now().toString(36)}`,
      templateId: tpl.templateId,
      name: tpl.name,
      baseAttack: tpl.baseAttack,
      enhanceLevel: tpl.rarity === 'mythic' ? 5 : 0,
      ascensionPath: 'base',
      rarity: tpl.rarity,
      socketedGems: [null, null, null],
    };

    soundEngine.playPerfectBell();
    setSave((prev) => ({
      ...prev,
      coins: useHonor ? prev.coins : prev.coins - Math.round(tpl.priceCoins * discountFactor),
      pvp: useHonor
        ? { ...prev.pvp, honorTokens: prev.pvp.honorTokens - (tpl.priceHonor ?? 0) }
        : prev.pvp,
      weapons: [newWeapon, ...prev.weapons],
    }));
    return { ok: true, message: `購買成功！已獲得【${tpl.name}】，可至鍛造屋強化與裝備！` };
  }, [save.coins, save.pvp.honorTokens]);

  const buyGem = useCallback((element: GemElementId, discountFactor = 1): ActionFeedback => {
    const def = GEM_ELEMENTS[element];
    const price = Math.round(def.shopPriceCoins * discountFactor);
    if (save.coins < price) return { ok: false, message: `金幣不足（需要 ${price}）。` };
    const gem: GemInstance = {
      uid: `gem-shop-${Date.now().toString(36)}-${Math.floor(Math.random() * 99)}`,
      element,
      level: 1,
    };
    soundEngine.playGemSynth();
    setSave((prev) => ({
      ...prev,
      coins: prev.coins - price,
      gemBag: [gem, ...prev.gemBag],
    }));
    return { ok: true, message: `購入 Lv.1 ${def.name}！集滿 3 顆可在寶石工坊合成升階。` };
  }, [save.coins]);

  const buyBattleItem = useCallback((itemId: BattleItemId, useHonor: boolean, discountFactor = 1): ActionFeedback => {
    const def = BATTLE_ITEMS[itemId];
    if (useHonor) {
      const honorCost = def.priceHonor ?? 999;
      if (save.pvp.honorTokens < honorCost) {
        return { ok: false, message: `競技榮譽幣不足（需要 ${honorCost}）。` };
      }
    } else {
      const price = Math.round(def.priceCoins * discountFactor);
      if (save.coins < price) return { ok: false, message: `金幣不足（需要 ${price}）。` };
    }
    soundEngine.playCorrectChord(2);
    setSave((prev) => ({
      ...prev,
      coins: useHonor ? prev.coins : prev.coins - Math.round(def.priceCoins * discountFactor),
      pvp: useHonor
        ? { ...prev.pvp, honorTokens: prev.pvp.honorTokens - (def.priceHonor ?? 0) }
        : prev.pvp,
      items: { ...prev.items, [itemId]: (prev.items[itemId] ?? 0) + 1 },
    }));
    return { ok: true, message: `已獲得道具【${def.name}】×1！` };
  }, [save.coins, save.pvp.honorTokens]);

  const consumeBattleItem = useCallback((itemId: BattleItemId): boolean => {
    if ((save.items[itemId] ?? 0) <= 0) return false;
    setSave((prev) => ({
      ...prev,
      items: { ...prev.items, [itemId]: Math.max(0, (prev.items[itemId] ?? 0) - 1) },
    }));
    return true;
  }, [save.items]);

  const unlockOrBondGuardian = useCallback((guardianId: GuardianId): ActionFeedback => {
    const cost = GUARDIAN_SHOP_COSTS[guardianId];
    const bondCost = 90;
    if (save.coins < bondCost) {
      return { ok: false, message: `金幣不足（餵食精靈靈果需要 ${bondCost} 金幣）。` };
    }
    soundEngine.playPetChime();
    setSave((prev) => ({
      ...prev,
      coins: prev.coins - bondCost,
      selectedGuardian: guardianId,
      unlockedGuardians: Array.from(new Set([...prev.unlockedGuardians, guardianId])),
      guardianBonds: {
        ...prev.guardianBonds,
        [guardianId]: (prev.guardianBonds[guardianId] ?? 1) + 2,
      },
    }));
    return {
      ok: true,
      message: `餵食靈果成功！守護精靈羈絆 +2（原價 ${cost.coins} 免費覺醒）！`,
    };
  }, [save.coins]);

  // ==================== PARENT CONTROLS & CSV ====================
  const updateParentSettings = useCallback((patch: Partial<ParentSettings>) => {
    setSave((prev) => {
      const nextParent = { ...prev.parentSettings, ...patch };
      return {
        ...prev,
        parentSettings: nextParent,
        playMode: nextParent.forcePracticeMode ? 'practice' : prev.playMode,
      };
    });
  }, []);

  const buildLearningCsv = useCallback((): string => {
    const header = '時間,科目/模式,年級,答對題數,總作答題數,正確率(%),得分,時長(秒),結果,學習備註';
    const subjectMap: Record<SubjectId | 'pvp', string> = {
      chinese: '國語文',
      english: '英語文',
      math: '數學',
      science: '自然科學',
      pvp: '線上知識對戰',
    };
    const rows = save.trajectory.map((t) => {
      const acc = t.totalAttempts > 0 ? Math.round((t.correctCount / t.totalAttempts) * 100) : 100;
      const dt = new Date(t.timestamp).toLocaleString('zh-TW');
      const safeNote = t.note.replace(/"/g, '""');
      return `"${dt}","${subjectMap[t.subject]}",${t.grade}年級,${t.correctCount},${t.totalAttempts},${acc},${t.score},${t.durationSeconds},"${t.victory ? '勝利/通關' : '挑戰中'}","${safeNote}"`;
    });
    const summaryRows = (['chinese', 'english', 'math', 'science'] as SubjectId[]).map((sub) => {
      const s = save.subjectStats[sub];
      const acc = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
      return `"累計統計","${subjectMap[sub]}",${save.grade}年級,${s.correct},${s.answered},${acc},${s.bestScore},0,"通關${s.clears}次","最高星數 ${s.starsEarned} 星"`;
    });
    return '\uFEFF' + [header, ...rows, ...summaryRows].join('\n');
  }, [save.grade, save.subjectStats, save.trajectory]);

  const upgradeEquipmentSlot = useCallback(
    (slot: EquipmentSlotId): ActionFeedback => {
      const currLv = save.equipment[slot] ?? 1;
      if (currLv >= 15) return { ok: false, message: '該部位裝備已達滿級 +15！' };
      const coinCost = 70 + currLv * 45;
      if (save.coins < coinCost) {
        return { ok: false, message: `金幣不足！強化需要 ${coinCost} 金幣。` };
      }
      soundEngine.playForgeHammer();
      setSave((prev) => ({
        ...prev,
        coins: prev.coins - coinCost,
        equipment: {
          ...prev.equipment,
          [slot]: Math.min(15, (prev.equipment[slot] ?? 1) + 1),
        },
      }));
      const slotNames: Record<EquipmentSlotId, string> = {
        weapon: '主武器槽',
        helm: '智慧頭冠',
        armor: '學園戰甲',
        gloves: '速寫護手',
        boots: '疾風戰靴',
        amulet: '星光護符',
      };
      return { ok: true, message: `${slotNames[slot]} 強化成功！升至 +${currLv + 1}（不爆裝保證）` };
    },
    [save.coins, save.equipment]
  );

  const setPlayerCount = useCallback((playerCount: PlayerCount) => {
    setSave((prev) => ({ ...prev, playerCount }));
  }, []);

  const advanceHeroTier = useCallback((): ActionFeedback => {
    const prog = save.heroProgression ?? createInitialHeroProgression();
    const check = canAdvanceHeroTier(save.level, save.coins, prog);
    if (!check.ok || !check.nextTier) {
      return { ok: false, message: check.reason ?? '尚未達成突破條件。' };
    }
    const nextTier = check.nextTier;
    soundEngine.playUltimateRoar();
    setSave((prev) => {
      const currProg = prev.heroProgression ?? createInitialHeroProgression();
      return {
        ...prev,
        coins: Math.max(0, prev.coins - nextTier.coinCost),
        heroProgression: {
          ...currProg,
          tier: nextTier.tier as HeroTierId,
          badges: Math.max(0, currProg.badges - nextTier.badgeCost),
        },
      };
    });
    return {
      ok: true,
      message: `突破成功！晉升【${nextTier.name}】，全屬性大幅提升！`,
    };
  }, [save.coins, save.heroProgression, save.level]);

  const selectHeroClass = useCallback(
    (classId: HeroClassId): ActionFeedback => {
      const prog = save.heroProgression ?? createInitialHeroProgression();
      const check = canSelectHeroClass(classId, prog);
      if (!check.ok) {
        return { ok: false, message: check.reason ?? '尚未解鎖此職業。' };
      }
      const def = HERO_CLASSES[classId];
      soundEngine.playPerfectBell();
      setSave((prev) => ({
        ...prev,
        heroProgression: {
          ...(prev.heroProgression ?? createInitialHeroProgression()),
          classId: def.id,
          classBranch: def.branch,
        },
      }));
      return { ok: true, message: `成功轉職【${def.name}】！被動「${def.passiveTitle}」立即生效！` };
    },
    [save.heroProgression]
  );

  const setSecondaryGuardian = useCallback((guardianId: GuardianId) => {
    setSave((prev) => ({
      ...prev,
      heroProgression: {
        ...(prev.heroProgression ?? createInitialHeroProgression()),
        secondaryGuardian: guardianId,
      },
    }));
  }, []);

  const recordDiscoveredMonster = useCallback((monsterId: string) => {
    setSave((prev) => {
      const existing = prev.discoveredBestiary ?? [];
      if (existing.includes(monsterId)) return prev;
      return {
        ...prev,
        discoveredBestiary: [...existing, monsterId],
      };
    });
  }, []);

  const applyTowerResult = useCallback(
    (params: {
      floorReached: number;
      correctCount: number;
      totalAttempts: number;
      coinsEarned: number;
      xpEarned: number;
      badgesEarned: number;
      crystalsEarned: number;
    }): { leveledUp: boolean; isNewRecord: boolean } => {
      let leveledUp = false;
      let isNewRecord = false;
      setSave((prev) => {
        const xpOutcome = applyXpGain(prev.level, prev.xp, params.xpEarned);
        leveledUp = xpOutcome.leveledUp;
        const prevBest = prev.towerBestFloor ?? 0;
        isNewRecord = params.floorReached > prevBest;
        const prevProg = prev.heroProgression ?? createInitialHeroProgression();
        const newEntry = {
          id: `tr-tower-${Date.now()}`,
          timestamp: Date.now(),
          subject: 'pvp' as const,
          grade: prev.grade,
          correctCount: params.correctCount,
          totalAttempts: params.totalAttempts,
          score: params.floorReached * 150 + params.correctCount * 40,
          durationSeconds: 60,
          victory: params.floorReached >= 5,
          note: `無盡試煉之塔：突破第 ${params.floorReached} 層（徽章 +${params.badgesEarned}）`,
        };
        return {
          ...prev,
          level: Math.min(60, xpOutcome.level),
          xp: xpOutcome.xp,
          coins: prev.coins + params.coinsEarned,
          crystals: prev.crystals + params.crystalsEarned,
          towerBestFloor: Math.max(prevBest, params.floorReached),
          heroProgression: {
            ...prevProg,
            badges: prevProg.badges + params.badgesEarned,
          },
          trajectory: [newEntry, ...prev.trajectory].slice(0, 50),
        };
      });
      return { leveledUp, isNewRecord };
    },
    []
  );

  // ==================== SUBJECT-SPECIFIC INDEPENDENT PROGRESSION ====================
  const subjectProfiles = useMemo(
    () => save.subjectProfiles ?? createInitialSubjectProfiles(),
    [save.subjectProfiles]
  );

  const collectEvidenceTags = useCallback(
    (subject: SubjectId, fallbackTags: string[]) => {
      const practiced = Object.values(save.tagMastery ?? {})
        .filter((t) => t.subject === subject && (t.unassistedCorrect > 0 || t.attempts > 0))
        .sort((a, b) => b.unassistedCorrect - a.unassistedCorrect || b.attempts - a.attempts)
        .slice(0, 3)
        .map((t) => t.tag);
      return practiced.length > 0 ? practiced : fallbackTags.slice(0, 2);
    },
    [save.tagMastery]
  );

  const upgradeSubjectTreeNode = useCallback(
    (subject: 'chinese' | 'math' | 'science', nodeId: string): ActionFeedback => {
      const profiles = save.subjectProfiles ?? createInitialSubjectProfiles();
      const catalog =
        subject === 'chinese'
          ? MANDARIN_GROWTH_TREE
          : subject === 'math'
            ? MATH_GROWTH_TREE
            : SCIENCE_GROWTH_TREE;
      const item = catalog.find((c) => c.nodeId === nodeId);
      if (!item) return { ok: false, message: '找不到該成長樹節點。' };

      const currentTree =
        subject === 'chinese'
          ? profiles.chinese.growthTree
          : subject === 'math'
            ? profiles.math.growthTree
            : profiles.science.growthTree;
      const node = currentTree[nodeId];
      if (!node) return { ok: false, message: '找不到節點資料。' };
      if (node.level >= item.maxLevel) return { ok: false, message: `【${item.name}】已達最高階 Lv.${item.maxLevel}！` };

      const currencyName =
        subject === 'chinese' ? '文心點數' : subject === 'math' ? '算力齒輪' : '實驗結晶';
      const available =
        subject === 'chinese'
          ? profiles.chinese.skillPoints
          : subject === 'math'
            ? profiles.math.techGears
            : profiles.science.labCrystals;
      if (available < item.costPerLevel) {
        return { ok: false, message: `${currencyName}不足（需要 ${item.costPerLevel}，目前 ${available}）。通關任意年級關卡即可獲得！` };
      }

      const nextLevel = node.level + 1;
      const semNum = semesterToNumber(save.semester);
      const semLabel = semNum === 1 ? '上學期' : '下學期';
      const evidenceTags = collectEvidenceTags(subject, item.sampleTags);
      const nowIso = new Date().toISOString();

      soundEngine.playPerfectBell();
      setSave((prev) => {
        const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
        const updatedNode = {
          ...node,
          level: nextLevel,
          unlockedAt: nowIso,
          unlockedInGrade: clampElementaryGrade(prev.grade),
          unlockedInSemester: semNum,
          contributingTags: Array.from(new Set([...node.contributingTags, ...evidenceTags])),
        };

        const nextProfiles: SubjectProfiles = { ...prevProfiles };
        if (subject === 'chinese') {
          const nextChi = {
            ...prevProfiles.chinese,
            skillPoints: prevProfiles.chinese.skillPoints - item.costPerLevel,
            growthTree: { ...prevProfiles.chinese.growthTree, [nodeId]: updatedNode },
          };
          nextChi.characterTitle = computeMandarinTitle(nextChi);
          nextProfiles.chinese = nextChi;
        } else if (subject === 'math') {
          const nextMath = {
            ...prevProfiles.math,
            techGears: prevProfiles.math.techGears - item.costPerLevel,
            growthTree: { ...prevProfiles.math.growthTree, [nodeId]: updatedNode },
          };
          nextMath.commanderRank = computeMathCommanderRank(nextMath);
          nextProfiles.math = nextMath;
        } else {
          const nextSci = {
            ...prevProfiles.science,
            labCrystals: prevProfiles.science.labCrystals - item.costPerLevel,
            growthTree: { ...prevProfiles.science.growthTree, [nodeId]: updatedNode },
          };
          nextSci.chefTitle = computeScienceChefTitle(nextSci);
          nextProfiles.science = nextSci;
        }

        const subjectLabel = subject === 'chinese' ? '國語文心道場' : subject === 'math' ? '數學算力防線' : '自然實驗廚房';
        const milestone: LearningMilestoneLog = {
          id: `ms-tree-${Date.now().toString(36)}`,
          timestamp: nowIso,
          subject,
          grade: clampElementaryGrade(prev.grade),
          semester: semNum,
          eventType: 'tree_unlock',
          title: `升級${subjectLabel}「${item.name}」Lv.${nextLevel}`,
          curriculumEvidence: `於${prev.grade}年級${semLabel}累積成長點亮「${item.branch}」分支（對應課綱：${evidenceTags.join('、')}）`,
        };

        return {
          ...prev,
          subjectProfiles: nextProfiles,
          learningMilestones: [milestone, ...(prev.learningMilestones ?? [])].slice(0, 80),
        };
      });

      return { ok: true, message: `已點亮【${item.name}】至 Lv.${nextLevel}（${item.effectSummary(nextLevel)}）！` };
    },
    [collectEvidenceTags, save.grade, save.semester, save.subjectProfiles]
  );

  const equipOrUnlockMandarinGear = useCallback(
    (slot: 'weapon' | 'armor', itemId: string): ActionFeedback => {
      const profiles = save.subjectProfiles ?? createInitialSubjectProfiles();
      const list = slot === 'weapon' ? MANDARIN_WEAPONS : MANDARIN_ARMORS;
      const item = list.find((x) => x.id === itemId);
      if (!item) return { ok: false, message: '找不到該道場裝備。' };

      const ownedList =
        slot === 'weapon' ? profiles.chinese.unlockedWeaponIds : profiles.chinese.unlockedArmorIds;
      const alreadyOwned = ownedList.includes(itemId);

      if (!alreadyOwned && profiles.chinese.skillPoints < item.unlockCostPoints) {
        return {
          ok: false,
          message: `文心點數不足（解鎖【${item.name}】需要 ${item.unlockCostPoints} 點）。`,
        };
      }

      soundEngine.playPerfectBell();
      setSave((prev) => {
        const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
        const chi = prevProfiles.chinese;
        const nextChi = {
          ...chi,
          skillPoints: alreadyOwned ? chi.skillPoints : chi.skillPoints - item.unlockCostPoints,
          equippedWeaponId: slot === 'weapon' ? itemId : chi.equippedWeaponId,
          unlockedWeaponIds:
            slot === 'weapon' ? Array.from(new Set([...chi.unlockedWeaponIds, itemId])) : chi.unlockedWeaponIds,
          equippedArmorId: slot === 'armor' ? itemId : chi.equippedArmorId,
          unlockedArmorIds:
            slot === 'armor' ? Array.from(new Set([...chi.unlockedArmorIds, itemId])) : chi.unlockedArmorIds,
        };
        const nextMilestones = [...(prev.learningMilestones ?? [])];
        if (!alreadyOwned) {
          const semNum = semesterToNumber(prev.semester);
          nextMilestones.unshift({
            id: `ms-chi-gear-${Date.now().toString(36)}`,
            timestamp: new Date().toISOString(),
            subject: 'chinese',
            grade: clampElementaryGrade(prev.grade),
            semester: semNum,
            eventType: 'tree_unlock',
            title: `解鎖國語道場「${item.name}」`,
            curriculumEvidence: `於${prev.grade}年級${semNum === 1 ? '上' : '下'}學期累積國語文心點數解鎖專屬${item.typeLabel}`,
          });
        }
        return {
          ...prev,
          subjectProfiles: { ...prevProfiles, chinese: nextChi },
          learningMilestones: nextMilestones.slice(0, 80),
        };
      });

      return {
        ok: true,
        message: alreadyOwned ? `已裝備【${item.name}】！` : `成功解鎖並裝備【${item.name}】！`,
      };
    },
    [save.subjectProfiles]
  );

  const selectMandarinSpirit = useCallback((spiritId: string) => {
    soundEngine.playPetChime();
    setSave((prev) => {
      const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
      return {
        ...prev,
        subjectProfiles: {
          ...prevProfiles,
          chinese: { ...prevProfiles.chinese, guardianSpiritId: spiritId },
        },
      };
    });
  }, []);

  const unlockOrSelectEnglishJet = useCallback(
    (jetId: string): ActionFeedback => {
      const profiles = save.subjectProfiles ?? createInitialSubjectProfiles();
      const jet = ENGLISH_JETS.find((j) => j.id === jetId);
      if (!jet) return { ok: false, message: '找不到該戰機藍圖。' };
      const owned = profiles.english.unlockedJetIds.includes(jetId);
      if (!owned && profiles.english.hangarCores < jet.unlockCores) {
        return {
          ok: false,
          message: `航電核心不足（解鎖【${jet.name}】需要 ${jet.unlockCores} 核心）。`,
        };
      }
      soundEngine.playPerfectBell();
      const evidenceTags = collectEvidenceTags('english', ['聽力辨字', '高頻拼字']);
      setSave((prev) => {
        const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
        const eng = prevProfiles.english;
        const nextEng = {
          ...eng,
          hangarCores: owned ? eng.hangarCores : eng.hangarCores - jet.unlockCores,
          activeJetId: jetId,
          unlockedJetIds: Array.from(new Set([...eng.unlockedJetIds, jetId])),
        };
        nextEng.pilotRank = computeEnglishPilotRank(nextEng);
        const nextMilestones = [...(prev.learningMilestones ?? [])];
        if (!owned) {
          const semNum = semesterToNumber(prev.semester);
          nextMilestones.unshift({
            id: `ms-jet-${Date.now().toString(36)}`,
            timestamp: new Date().toISOString(),
            subject: 'english',
            grade: clampElementaryGrade(prev.grade),
            semester: semNum,
            eventType: 'blueprint_unlock',
            title: `解鎖航電機庫戰機藍圖「${jet.name}」`,
            curriculumEvidence: `於${prev.grade}年級${semNum === 1 ? '上' : '下'}學期累積航電核心解鎖機體（相關英語能力：${evidenceTags.join('、')}）`,
          });
        }
        return {
          ...prev,
          subjectProfiles: { ...prevProfiles, english: nextEng },
          learningMilestones: nextMilestones.slice(0, 80),
        };
      });
      return {
        ok: true,
        message: owned ? `已切換出擊機體【${jet.name}】！` : `藍圖解鎖成功！【${jet.name}】已進駐機庫並設為出擊戰機！`,
      };
    },
    [collectEvidenceTags, save.subjectProfiles]
  );

  const unlockOrEquipEnglishModule = useCallback(
    (moduleId: string): ActionFeedback => {
      const profiles = save.subjectProfiles ?? createInitialSubjectProfiles();
      const mod = ENGLISH_MODULES.find((m) => m.id === moduleId);
      if (!mod) return { ok: false, message: '找不到該航電模組。' };
      const owned = profiles.english.unlockedModuleIds.includes(moduleId);
      if (!owned && profiles.english.hangarCores < mod.unlockCores) {
        return {
          ok: false,
          message: `航電核心不足（解鎖【${mod.name}】需要 ${mod.unlockCores} 核心）。`,
        };
      }
      soundEngine.playGemSynth();
      const evidenceTags = collectEvidenceTags('english', ['生活單字', '自然發音']);
      setSave((prev) => {
        const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
        const eng = prevProfiles.english;
        const nextLoadout = {
          ...eng.loadout,
          ...(mod.slot === 'wing'
            ? { wingModuleId: moduleId }
            : mod.slot === 'weaponPod'
              ? { weaponPodId: moduleId }
              : { avionicsChipId: moduleId }),
        };
        const nextEng = {
          ...eng,
          hangarCores: owned ? eng.hangarCores : eng.hangarCores - mod.unlockCores,
          unlockedModuleIds: Array.from(new Set([...eng.unlockedModuleIds, moduleId])),
          loadout: nextLoadout,
        };
        nextEng.pilotRank = computeEnglishPilotRank(nextEng);
        const nextMilestones = [...(prev.learningMilestones ?? [])];
        if (!owned) {
          const semNum = semesterToNumber(prev.semester);
          nextMilestones.unshift({
            id: `ms-mod-${Date.now().toString(36)}`,
            timestamp: new Date().toISOString(),
            subject: 'english',
            grade: clampElementaryGrade(prev.grade),
            semester: semNum,
            eventType: 'blueprint_unlock',
            title: `解鎖航電改裝模組「${mod.name}」`,
            curriculumEvidence: `於${prev.grade}年級${semNum === 1 ? '上' : '下'}學期完成機庫改裝（相關英語能力：${evidenceTags.join('、')}）`,
          });
        }
        return {
          ...prev,
          subjectProfiles: { ...prevProfiles, english: nextEng },
          learningMilestones: nextMilestones.slice(0, 80),
        };
      });
      return {
        ok: true,
        message: owned ? `已裝配模組【${mod.name}】！` : `已研發並裝配【${mod.name}】！戰機雷達數值已更新。`,
      };
    },
    [collectEvidenceTags, save.subjectProfiles]
  );

  const selectEnglishCopilot = useCallback((spiritId: string) => {
    soundEngine.playClick();
    setSave((prev) => {
      const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
      return {
        ...prev,
        subjectProfiles: {
          ...prevProfiles,
          english: { ...prevProfiles.english, copilotSpiritId: spiritId },
        },
      };
    });
  }, []);

  const upgradeMathTurret = useCallback(
    (turretId: string): ActionFeedback => {
      const profiles = save.subjectProfiles ?? createInitialSubjectProfiles();
      const spec = MATH_TURRET_ARSENAL.find((t) => t.id === turretId);
      if (!spec) return { ok: false, message: '找不到該砲台藍圖。' };
      const currLv = profiles.math.turretUpgrades[turretId] ?? 1;
      if (currLv >= 8) return { ok: false, message: `【${spec.name}】已達滿階 Lv.8！` };
      if (profiles.math.techGears < spec.upgradeCostPerLv) {
        return {
          ok: false,
          message: `算力齒輪不足（升級需要 ${spec.upgradeCostPerLv} 顆齒輪）。`,
        };
      }
      soundEngine.playForgeHammer();
      const evidenceTags = collectEvidenceTags('math', ['四則運算', '幾何與空間']);
      setSave((prev) => {
        const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
        const nextMath = {
          ...prevProfiles.math,
          techGears: prevProfiles.math.techGears - spec.upgradeCostPerLv,
          turretUpgrades: {
            ...prevProfiles.math.turretUpgrades,
            [turretId]: currLv + 1,
          },
        };
        nextMath.commanderRank = computeMathCommanderRank(nextMath);
        const semNum = semesterToNumber(prev.semester);
        const milestone: LearningMilestoneLog = {
          id: `ms-turret-${Date.now().toString(36)}`,
          timestamp: new Date().toISOString(),
          subject: 'math',
          grade: clampElementaryGrade(prev.grade),
          semester: semNum,
          eventType: 'tree_unlock',
          title: `強化數學砲台「${spec.name}」Lv.${currLv + 1}`,
          curriculumEvidence: `於${prev.grade}年級${semNum === 1 ? '上' : '下'}學期消耗算力齒輪升級防線砲台（相關課綱：${evidenceTags.join('、')}）`,
        };
        return {
          ...prev,
          subjectProfiles: { ...prevProfiles, math: nextMath },
          learningMilestones: [milestone, ...(prev.learningMilestones ?? [])].slice(0, 80),
        };
      });
      return { ok: true, message: `【${spec.name}】已升級至 Lv.${currLv + 1}！` };
    },
    [collectEvidenceTags, save.subjectProfiles]
  );

  const toggleMathDeckTurret = useCallback(
    (turretId: string): ActionFeedback => {
      const profiles = save.subjectProfiles ?? createInitialSubjectProfiles();
      const curr = profiles.math.activeDeckTurretIds;
      const exists = curr.includes(turretId);
      if (exists && curr.length <= 2) {
        return { ok: false, message: '防線出戰配置至少需保留 2 座砲台！' };
      }
      soundEngine.playClick();
      setSave((prev) => {
        const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
        const prevDeck = prevProfiles.math.activeDeckTurretIds;
        const nextDeck = exists
          ? prevDeck.filter((id) => id !== turretId)
          : [...prevDeck, turretId];
        return {
          ...prev,
          subjectProfiles: {
            ...prevProfiles,
            math: { ...prevProfiles.math, activeDeckTurretIds: nextDeck },
          },
        };
      });
      return { ok: true, message: exists ? '已從出戰陣容卸下該砲台。' : '已加入出戰防線陣容！' };
    },
    [save.subjectProfiles]
  );

  const selectMathSpirit = useCallback((spiritId: string) => {
    soundEngine.playPetChime();
    setSave((prev) => {
      const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
      return {
        ...prev,
        subjectProfiles: {
          ...prevProfiles,
          math: { ...prevProfiles.math, guardianSpiritId: spiritId },
        },
      };
    });
  }, []);

  const equipOrUnlockScienceCookware = useCallback(
    (cookwareId: string): ActionFeedback => {
      const profiles = save.subjectProfiles ?? createInitialSubjectProfiles();
      const item = SCIENCE_COOKWARE.find((c) => c.id === cookwareId);
      if (!item) return { ok: false, message: '找不到該科學廚具。' };
      const owned = profiles.science.unlockedCookwareIds.includes(cookwareId);
      if (!owned && profiles.science.labCrystals < item.unlockCostCrystals) {
        return {
          ok: false,
          message: `實驗結晶不足（解鎖【${item.name}】需要 ${item.unlockCostCrystals} 顆結晶）。`,
        };
      }
      soundEngine.playPerfectBell();
      const evidenceTags = collectEvidenceTags('science', ['水的三態變化', '水溶液酸鹼']);
      setSave((prev) => {
        const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
        const sci = prevProfiles.science;
        const nextSci = {
          ...sci,
          labCrystals: owned ? sci.labCrystals : sci.labCrystals - item.unlockCostCrystals,
          equippedCookwareId: cookwareId,
          unlockedCookwareIds: Array.from(new Set([...sci.unlockedCookwareIds, cookwareId])),
        };
        nextSci.chefTitle = computeScienceChefTitle(nextSci);
        const nextMilestones = [...(prev.learningMilestones ?? [])];
        if (!owned) {
          const semNum = semesterToNumber(prev.semester);
          nextMilestones.unshift({
            id: `ms-cook-${Date.now().toString(36)}`,
            timestamp: new Date().toISOString(),
            subject: 'science',
            grade: clampElementaryGrade(prev.grade),
            semester: semNum,
            eventType: 'tree_unlock',
            title: `解鎖自然實驗廚房「${item.name}」`,
            curriculumEvidence: `於${prev.grade}年級${semNum === 1 ? '上' : '下'}學期累積實驗結晶研發廚具（相關課綱：${evidenceTags.join('、')}）`,
          });
        }
        return {
          ...prev,
          subjectProfiles: { ...prevProfiles, science: nextSci },
          learningMilestones: nextMilestones.slice(0, 80),
        };
      });
      return {
        ok: true,
        message: owned ? `已切換實驗主廚具【${item.name}】！` : `解鎖並啟用科學廚具【${item.name}】！`,
      };
    },
    [collectEvidenceTags, save.subjectProfiles]
  );

  const selectScienceSpirit = useCallback((spiritId: string) => {
    soundEngine.playPetChime();
    setSave((prev) => {
      const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
      return {
        ...prev,
        subjectProfiles: {
          ...prevProfiles,
          science: { ...prevProfiles.science, foodSpiritId: spiritId },
        },
      };
    });
  }, []);

  const buySubjectConsumable = useCallback(
    (subject: SubjectId, itemId: string, costCoins: number, itemName: string): ActionFeedback => {
      if (save.coins < costCoins) {
        return { ok: false, message: `金幣不足（補充【${itemName}】需要 ${costCoins} 金幣）。` };
      }
      soundEngine.playCorrectChord(2);
      setSave((prev) => {
        const prevProfiles = prev.subjectProfiles ?? createInitialSubjectProfiles();
        const nextProfiles: SubjectProfiles = { ...prevProfiles };
        if (subject === 'chinese') {
          nextProfiles.chinese = {
            ...prevProfiles.chinese,
            consumables: {
              ...prevProfiles.chinese.consumables,
              [itemId]: (prevProfiles.chinese.consumables[itemId] ?? 0) + 1,
            },
          };
        } else if (subject === 'english') {
          nextProfiles.english = {
            ...prevProfiles.english,
            tacticalItems: {
              ...prevProfiles.english.tacticalItems,
              [itemId]: (prevProfiles.english.tacticalItems[itemId] ?? 0) + 1,
            },
          };
        } else if (subject === 'math') {
          nextProfiles.math = {
            ...prevProfiles.math,
            tacticalTraps: {
              ...prevProfiles.math.tacticalTraps,
              [itemId]: (prevProfiles.math.tacticalTraps[itemId] ?? 0) + 1,
            },
          };
        } else {
          nextProfiles.science = {
            ...prevProfiles.science,
            seasoningInventory: {
              ...prevProfiles.science.seasoningInventory,
              [itemId]: (prevProfiles.science.seasoningInventory[itemId] ?? 0) + 1,
            },
          };
        }
        return {
          ...prev,
          coins: prev.coins - costCoins,
          subjectProfiles: nextProfiles,
        };
      });
      return { ok: true, message: `已補充【${itemName}】×1！` };
    },
    [save.coins]
  );

  const addToTodayPracticeQueue = useCallback(
    (item: Omit<TodayPracticeItem, 'id' | 'addedAt' | 'completed'>): ActionFeedback => {
      const existing = (save.todayPracticeQueue ?? []).find(
        (q) => !q.completed && q.subject === item.subject && q.knowledgeTag === item.knowledgeTag
      );
      if (existing) {
        return { ok: true, message: `「${item.knowledgeTag}」已在今日練習清單中！` };
      }
      soundEngine.playCorrectChord(1);
      const created: TodayPracticeItem = {
        ...item,
        id: `tp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        addedAt: new Date().toISOString(),
        completed: false,
      };
      setSave((prev) => ({
        ...prev,
        todayPracticeQueue: [created, ...(prev.todayPracticeQueue ?? [])].slice(0, 24),
      }));
      return { ok: true, message: `已將「${item.knowledgeTag}」加入孩子的今日練習清單！` };
    },
    [save.todayPracticeQueue]
  );

  const removeFromTodayPracticeQueue = useCallback((id: string) => {
    setSave((prev) => ({
      ...prev,
      todayPracticeQueue: (prev.todayPracticeQueue ?? []).filter((q) => q.id !== id),
    }));
  }, []);

  const completeTodayPracticeItem = useCallback((id: string) => {
    setSave((prev) => ({
      ...prev,
      todayPracticeQueue: (prev.todayPracticeQueue ?? []).map((q) =>
        q.id === id ? { ...q, completed: true } : q
      ),
    }));
  }, []);

  return (
    <GameStateContext.Provider
      value={{
        save,
        combatStats,
        equippedWeapon,
        isRestReminderVisible,
        dismissRestReminder: () => setRestDismissed(true),
        setGrade,
        setSemester,
        setPlayMode,
        toggleMute,
        selectGuardian,
        petGuardian,
        selectTitle,
        recordAnswer,
        resolveWrongRecord,
        applyWorldResult,
        applyPvPResult,
        claimDailyQuest,
        equipWeapon,
        enhanceWeapon,
        ascendWeapon,
        fuseWeapons,
        upgradeEquipmentSlot,
        socketGem,
        unsocketGem,
        synthesizeGems,
        buyWeapon,
        buyGem,
        buyBattleItem,
        consumeBattleItem,
        unlockOrBondGuardian,
        setPlayerCount,
        advanceHeroTier,
        selectHeroClass,
        setSecondaryGuardian,
        recordDiscoveredMonster,
        applyTowerResult,
        subjectProfiles,
        upgradeSubjectTreeNode,
        equipOrUnlockMandarinGear,
        selectMandarinSpirit,
        unlockOrSelectEnglishJet,
        unlockOrEquipEnglishModule,
        selectEnglishCopilot,
        upgradeMathTurret,
        toggleMathDeckTurret,
        selectMathSpirit,
        equipOrUnlockScienceCookware,
        selectScienceSpirit,
        buySubjectConsumable,
        updateParentSettings,
        addToTodayPracticeQueue,
        removeFromTodayPracticeQueue,
        completeTodayPracticeItem,
        buildLearningCsv,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export function useGameState(): GameStateContextValue {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}
