import type { PlayerSaveData, DailyQuestProgress } from '../types/game';
import { createStarterWeapon } from '../data/itemsAndGems';
import { assertPlayerSave } from './saveIntegrity';

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function createInitialDailyQuests(): DailyQuestProgress[] {
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
  };
}

export function hydrateSave(raw: Partial<PlayerSaveData> | null | undefined): PlayerSaveData {
  const base = createInitialPlayerSave();
  if (!raw) return base;
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new Error('存檔不是有效物件，原檔已保留。');
  for (const key of ['weapons', 'gemBag', 'wrongRecords', 'trajectory', 'dailyQuests'] as const) {
    if (raw[key] !== undefined && !Array.isArray(raw[key])) throw new Error('存檔陣列格式不正確，原檔已保留。');
  }
  if (raw.weapons && raw.weapons.length === 0) throw new Error('武器資料不完整，原檔已保留。');
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
  };
  assertPlayerSave(merged);
  if (merged.lastPlayDate !== todayKey()) {
    merged.lastPlayDate = todayKey();
    merged.dailyPlaySeconds = 0;
    merged.dailyQuests = createInitialDailyQuests();
  }
  return merged;
}

