export type SubjectId = 'chinese' | 'english' | 'math' | 'science';
export type ElementaryGrade = 1 | 2 | 3 | 4 | 5 | 6;
export type NumericSemester = 1 | 2;

export interface GrowthTreeNodeState {
  nodeId: string;
  branch: string;
  level: number;
  maxLevel: number;
  unlockedAt?: string;
  unlockedInGrade?: ElementaryGrade;
  unlockedInSemester?: NumericSemester;
  contributingTags: string[]; // 貢獻解鎖的 108 課綱知識點
}

// 1. 國語 RPG 專屬狀態（文心修煉道場）
export interface MandarinRpgProfile {
  characterTitle: string;
  rpgLevel: number;
  exp: number;
  skillPoints: number; // 文心點數
  equippedWeaponId: string; // 毛筆 / 竹簡劍 / 墨韻扇
  unlockedWeaponIds: string[];
  equippedArmorId: string; // 書卷披風 / 玉佩護符
  unlockedArmorIds: string[];
  socketedGemIds: string[];
  consumables: Record<string, number>; // 靈感墨水 / 定心丹 / 雙倍文氣符
  guardianSpiritId: string; // 字靈 / 詩靈夥伴
  growthTree: Record<string, GrowthTreeNodeState>; // 字音字形 / 詞語成語 / 閱讀理解 / 修辭寫作
}

// 2. 英文戰鬥機專屬狀態（王牌航電機庫 — 模組化機庫，嚴禁 RPG 劍盾與技能樹）
export interface EnglishHangarProfile {
  pilotRank: string;
  flightMiles: number;
  hangarCores: number; // 航電核心貨幣
  activeJetId: string; // 當前出擊機體
  unlockedJetIds: string[]; // 已解鎖機庫藍圖
  unlockedModuleIds: string[]; // 已解鎖機翼 / 武器莢艙 / 航電晶片
  loadout: {
    wingModuleId: string; // 機翼 / 推進器
    weaponPodId: string; // 雷射 / 追蹤飛彈 / 電磁脈衝網莢艙
    avionicsChipId: string; // 航電 / 護盾晶片
  };
  tacticalItems: Record<string, number>; // 緊急維修無人機 / 時間減速力場 / 語音翻譯信標
  copilotSpiritId: string; // 機載 AI 領航精靈
}

// 3. 數學塔防專屬狀態（算力防線指揮部）
export interface MathDefenseProfile {
  commanderRank: string;
  techGears: number; // 算力齒輪點數
  turretUpgrades: Record<string, number>; // 各類砲台等級
  activeDeckTurretIds: string[]; // 出戰砲台配置
  tacticalTraps: Record<string, number>; // 液態氮冰凍炸彈 / 算力超頻器 / 防線修復扳手
  guardianSpiritId: string; // 數靈 / 幾何精靈
  growthTree: Record<string, GrowthTreeNodeState>; // 數與計算 / 幾何與空間 / 量與實測 / 代數與應用邏輯
}

// 4. 自然料理專屬狀態（元素實驗廚房）
export interface ScienceCookingProfile {
  chefTitle: string;
  labCrystals: number; // 實驗結晶點數
  equippedCookwareId: string; // 控溫電磁爐 / 量杯組 / 顯微調味罐 / 離心攪拌器
  unlockedCookwareIds: string[];
  seasoningInventory: Record<string, number>; // 火候穩定劑 / 黃金秘製醬料 / 時間沙漏
  foodSpiritId: string; // 元素食靈
  growthTree: Record<string, GrowthTreeNodeState>; // 物質與變化 / 生物與生態 / 地球與環境 / 能量與力
}

export interface SubjectProfiles {
  chinese: MandarinRpgProfile;
  english: EnglishHangarProfile;
  math: MathDefenseProfile;
  science: ScienceCookingProfile;
}

// 家長端學習歷程事件紀錄
export interface LearningMilestoneLog {
  id: string;
  timestamp: string;
  subject: SubjectId;
  grade: ElementaryGrade;
  semester: NumericSemester;
  eventType: 'tree_unlock' | 'blueprint_unlock' | 'tag_mastered' | 'mistake_overcome';
  title: string; // 例如：「解鎖數學防線『幾何冰凍塔』」
  curriculumEvidence: string; // 例如：「完成四年級『三角形分類』3 題無提示作答」
}

// 嚴格區分「無提示獨立答對」與「使用提示後答對」的知識點掌握度
export interface TagMasteryRecord {
  subject: SubjectId;
  grade: ElementaryGrade;
  semester: NumericSemester;
  tag: string;
  attempts: number;
  unassistedCorrect: number;
  hintedCorrect: number;
  wrongCount: number;
  lastPracticedAt: string;
}

// 家長指派的「今日練習清單」項目
export interface TodayPracticeItem {
  id: string;
  subject: SubjectId;
  grade: ElementaryGrade;
  knowledgeTag: string;
  questionId?: string;
  prompt?: string;
  addedAt: string;
  completed: boolean;
}

export interface LegacySaveLike {
  level?: number;
  xp?: number;
  crystals?: number;
  grade?: number;
  semester?: 'upper' | 'lower';
  subjectStats?: Partial<
    Record<SubjectId, { answered?: number; correct?: number; clears?: number; starsEarned?: number }>
  >;
  weapons?: Array<{ templateId?: string; enhanceLevel?: number; socketedGems?: Array<{ element?: string; level?: number } | null> }>;
  items?: Record<string, number>;
  knowledgeMastery?: Record<string, { subject: SubjectId; tag: string; answered: number; correct: number }>;
  subjectProfiles?: Partial<SubjectProfiles>;
}

export function semesterToNumber(semester?: 'upper' | 'lower'): NumericSemester {
  return semester === 'lower' ? 2 : 1;
}

export function clampElementaryGrade(grade?: number): ElementaryGrade {
  if (grade === 1 || grade === 2 || grade === 3 || grade === 4 || grade === 5 || grade === 6) {
    return grade;
  }
  return 4;
}

export function createInitialMandarinTree(): Record<string, GrowthTreeNodeState> {
  return {
    chi_phonetics_1: { nodeId: 'chi_phonetics_1', branch: '字音字形', level: 0, maxLevel: 5, contributingTags: [] },
    chi_phonetics_2: { nodeId: 'chi_phonetics_2', branch: '字音字形', level: 0, maxLevel: 5, contributingTags: [] },
    chi_idiom_1: { nodeId: 'chi_idiom_1', branch: '詞語成語', level: 0, maxLevel: 5, contributingTags: [] },
    chi_idiom_2: { nodeId: 'chi_idiom_2', branch: '詞語成語', level: 0, maxLevel: 5, contributingTags: [] },
    chi_reading_1: { nodeId: 'chi_reading_1', branch: '閱讀理解', level: 0, maxLevel: 5, contributingTags: [] },
    chi_reading_2: { nodeId: 'chi_reading_2', branch: '閱讀理解', level: 0, maxLevel: 5, contributingTags: [] },
    chi_rhetoric_1: { nodeId: 'chi_rhetoric_1', branch: '修辭寫作', level: 0, maxLevel: 5, contributingTags: [] },
    chi_rhetoric_2: { nodeId: 'chi_rhetoric_2', branch: '修辭寫作', level: 0, maxLevel: 5, contributingTags: [] },
  };
}

export function createInitialMathTree(): Record<string, GrowthTreeNodeState> {
  return {
    math_calc_1: { nodeId: 'math_calc_1', branch: '數與計算', level: 0, maxLevel: 5, contributingTags: [] },
    math_calc_2: { nodeId: 'math_calc_2', branch: '數與計算', level: 0, maxLevel: 5, contributingTags: [] },
    math_geo_1: { nodeId: 'math_geo_1', branch: '幾何與空間', level: 0, maxLevel: 5, contributingTags: [] },
    math_geo_2: { nodeId: 'math_geo_2', branch: '幾何與空間', level: 0, maxLevel: 5, contributingTags: [] },
    math_measure_1: { nodeId: 'math_measure_1', branch: '量與實測', level: 0, maxLevel: 5, contributingTags: [] },
    math_measure_2: { nodeId: 'math_measure_2', branch: '量與實測', level: 0, maxLevel: 5, contributingTags: [] },
    math_algebra_1: { nodeId: 'math_algebra_1', branch: '代數與應用邏輯', level: 0, maxLevel: 5, contributingTags: [] },
    math_algebra_2: { nodeId: 'math_algebra_2', branch: '代數與應用邏輯', level: 0, maxLevel: 5, contributingTags: [] },
  };
}

export function createInitialScienceTree(): Record<string, GrowthTreeNodeState> {
  return {
    sci_matter_1: { nodeId: 'sci_matter_1', branch: '物質與變化', level: 0, maxLevel: 5, contributingTags: [] },
    sci_matter_2: { nodeId: 'sci_matter_2', branch: '物質與變化', level: 0, maxLevel: 5, contributingTags: [] },
    sci_bio_1: { nodeId: 'sci_bio_1', branch: '生物與生態', level: 0, maxLevel: 5, contributingTags: [] },
    sci_bio_2: { nodeId: 'sci_bio_2', branch: '生物與生態', level: 0, maxLevel: 5, contributingTags: [] },
    sci_earth_1: { nodeId: 'sci_earth_1', branch: '地球與環境', level: 0, maxLevel: 5, contributingTags: [] },
    sci_earth_2: { nodeId: 'sci_earth_2', branch: '地球與環境', level: 0, maxLevel: 5, contributingTags: [] },
    sci_energy_1: { nodeId: 'sci_energy_1', branch: '能量與力', level: 0, maxLevel: 5, contributingTags: [] },
    sci_energy_2: { nodeId: 'sci_energy_2', branch: '能量與力', level: 0, maxLevel: 5, contributingTags: [] },
  };
}

export function createInitialSubjectProfiles(): SubjectProfiles {
  return {
    chinese: {
      characterTitle: '見習書童',
      rpgLevel: 1,
      exp: 0,
      skillPoints: 2,
      equippedWeaponId: 'chi_wp_brush',
      unlockedWeaponIds: ['chi_wp_brush'],
      equippedArmorId: 'chi_ar_scroll_cloak',
      unlockedArmorIds: ['chi_ar_scroll_cloak'],
      socketedGemIds: ['gem_wenxin_ink'],
      consumables: {
        ink_inspiration: 3,
        calm_elixir: 2,
        double_aura_talisman: 2,
      },
      guardianSpiritId: 'spirit_zi_ling',
      growthTree: createInitialMandarinTree(),
    },
    english: {
      pilotRank: '見習領航員',
      flightMiles: 0,
      hangarCores: 40,
      activeJetId: 'jet_sparrow',
      unlockedJetIds: ['jet_sparrow'],
      unlockedModuleIds: ['wing_standard', 'pod_dual_laser', 'chip_deflector'],
      loadout: {
        wingModuleId: 'wing_standard',
        weaponPodId: 'pod_dual_laser',
        avionicsChipId: 'chip_deflector',
      },
      tacticalItems: {
        repair_drone: 2,
        chrono_field: 2,
        voice_beacon: 3,
      },
      copilotSpiritId: 'ai_echo7',
    },
    math: {
      commanderRank: '初階算術工程師',
      techGears: 2,
      turretUpgrades: {
        turret_addsub: 1,
        turret_muldiv: 1,
        turret_geo_frost: 1,
        turret_frac_mortar: 1,
      },
      activeDeckTurretIds: ['turret_addsub', 'turret_muldiv', 'turret_geo_frost', 'turret_frac_mortar'],
      tacticalTraps: {
        nitrogen_bomb: 2,
        overclock_core: 2,
        bastion_wrench: 2,
      },
      guardianSpiritId: 'spirit_archi',
      growthTree: createInitialMathTree(),
    },
    science: {
      chefTitle: '見習實驗小廚',
      labCrystals: 2,
      equippedCookwareId: 'cook_induction',
      unlockedCookwareIds: ['cook_induction', 'cook_beaker_set'],
      seasoningInventory: {
        heat_stabilizer: 2,
        golden_sauce: 2,
        lab_hourglass: 2,
      },
      foodSpiritId: 'spirit_flame_chef',
      growthTree: createInitialScienceTree(),
    },
  };
}

function mergeTree(
  baseTree: Record<string, GrowthTreeNodeState>,
  incoming?: Record<string, GrowthTreeNodeState>
): Record<string, GrowthTreeNodeState> {
  if (!incoming || typeof incoming !== 'object') return baseTree;
  const merged: Record<string, GrowthTreeNodeState> = {};
  for (const [key, def] of Object.entries(baseTree)) {
    const raw = incoming[key];
    if (raw && typeof raw === 'object') {
      merged[key] = {
        ...def,
        ...raw,
        level: Math.max(0, Math.min(def.maxLevel, Number(raw.level) || 0)),
        contributingTags: Array.isArray(raw.contributingTags) ? raw.contributingTags : [],
      };
    } else {
      merged[key] = def;
    }
  }
  return merged;
}

/**
 * Lossless migration from legacy single-hero PlayerSaveData to independent 4-subject profiles.
 * Converts historical progress into subject-specific starter points without wiping legacy fields.
 */
export function migrateLegacySaveToSubjectProfiles(
  legacySave: LegacySaveLike | null | undefined
): SubjectProfiles {
  const base = createInitialSubjectProfiles();
  if (!legacySave) return base;

  const existing = legacySave.subjectProfiles;
  const chineseStats = legacySave.subjectStats?.chinese;
  const englishStats = legacySave.subjectStats?.english;
  const mathStats = legacySave.subjectStats?.math;
  const scienceStats = legacySave.subjectStats?.science;

  // If already migrated, deeply hydrate while preserving every unlocked node & module
  if (existing && (existing.chinese || existing.english || existing.math || existing.science)) {
    return {
      chinese: {
        ...base.chinese,
        ...(existing.chinese || {}),
        unlockedWeaponIds: Array.isArray(existing.chinese?.unlockedWeaponIds) && existing.chinese.unlockedWeaponIds.length > 0
          ? Array.from(new Set(existing.chinese.unlockedWeaponIds))
          : base.chinese.unlockedWeaponIds,
        unlockedArmorIds: Array.isArray(existing.chinese?.unlockedArmorIds) && existing.chinese.unlockedArmorIds.length > 0
          ? Array.from(new Set(existing.chinese.unlockedArmorIds))
          : base.chinese.unlockedArmorIds,
        socketedGemIds: Array.isArray(existing.chinese?.socketedGemIds)
          ? existing.chinese.socketedGemIds
          : base.chinese.socketedGemIds,
        consumables: { ...base.chinese.consumables, ...(existing.chinese?.consumables || {}) },
        growthTree: mergeTree(base.chinese.growthTree, existing.chinese?.growthTree),
      },
      english: {
        ...base.english,
        ...(existing.english || {}),
        unlockedJetIds: Array.isArray(existing.english?.unlockedJetIds) && existing.english.unlockedJetIds.length > 0
          ? Array.from(new Set(existing.english.unlockedJetIds))
          : base.english.unlockedJetIds,
        unlockedModuleIds: Array.isArray(existing.english?.unlockedModuleIds) && existing.english.unlockedModuleIds.length > 0
          ? Array.from(new Set(existing.english.unlockedModuleIds))
          : base.english.unlockedModuleIds,
        loadout: { ...base.english.loadout, ...(existing.english?.loadout || {}) },
        tacticalItems: { ...base.english.tacticalItems, ...(existing.english?.tacticalItems || {}) },
      },
      math: {
        ...base.math,
        ...(existing.math || {}),
        turretUpgrades: { ...base.math.turretUpgrades, ...(existing.math?.turretUpgrades || {}) },
        activeDeckTurretIds: Array.isArray(existing.math?.activeDeckTurretIds) && existing.math.activeDeckTurretIds.length > 0
          ? existing.math.activeDeckTurretIds
          : base.math.activeDeckTurretIds,
        tacticalTraps: { ...base.math.tacticalTraps, ...(existing.math?.tacticalTraps || {}) },
        growthTree: mergeTree(base.math.growthTree, existing.math?.growthTree),
      },
      science: {
        ...base.science,
        ...(existing.science || {}),
        unlockedCookwareIds: Array.isArray(existing.science?.unlockedCookwareIds) && existing.science.unlockedCookwareIds.length > 0
          ? Array.from(new Set(existing.science.unlockedCookwareIds))
          : base.science.unlockedCookwareIds,
        seasoningInventory: { ...base.science.seasoningInventory, ...(existing.science?.seasoningInventory || {}) },
        growthTree: mergeTree(base.science.growthTree, existing.science?.growthTree),
      },
    };
  }

  // First-time lossless conversion from legacy progress
  const legacyLevel = Math.max(1, Number(legacySave.level) || 1);
  const chiCorrect = Math.max(0, Number(chineseStats?.correct) || 0);
  const engCorrect = Math.max(0, Number(englishStats?.correct) || 0);
  const mathCorrect = Math.max(0, Number(mathStats?.correct) || 0);
  const sciCorrect = Math.max(0, Number(scienceStats?.correct) || 0);

  const chiSkillPoints = base.chinese.skillPoints + Math.floor(chiCorrect / 4) + Math.floor((legacyLevel - 1) / 3);
  const engCores = base.english.hangarCores + engCorrect * 8 + (englishStats?.clears ?? 0) * 20;
  const mathGears = base.math.techGears + Math.floor(mathCorrect / 4) + (mathStats?.clears ?? 0);
  const sciCrystals = base.science.labCrystals + Math.floor(sciCorrect / 4) + (scienceStats?.clears ?? 0);

  return {
    chinese: {
      ...base.chinese,
      rpgLevel: Math.max(1, 1 + Math.floor(chiCorrect / 5) + Math.floor((legacyLevel - 1) / 2)),
      exp: (chiCorrect % 5) * 20,
      skillPoints: chiSkillPoints,
      consumables: {
        ink_inspiration: base.chinese.consumables.ink_inspiration + Math.min(3, legacySave.items?.wisdom_potion ?? 0),
        calm_elixir: base.chinese.consumables.calm_elixir + Math.min(3, legacySave.items?.shield_scroll ?? 0),
        double_aura_talisman: base.chinese.consumables.double_aura_talisman + Math.min(3, legacySave.items?.combo_charm ?? 0),
      },
    },
    english: {
      ...base.english,
      flightMiles: engCorrect * 120 + (englishStats?.clears ?? 0) * 450,
      hangarCores: engCores,
      pilotRank: engCorrect >= 30 ? '星際王牌飛官' : engCorrect >= 12 ? '音速中隊長' : '見習領航員',
      tacticalItems: {
        repair_drone: base.english.tacticalItems.repair_drone + Math.min(3, legacySave.items?.shield_scroll ?? 0),
        chrono_field: base.english.tacticalItems.chrono_field + Math.min(3, legacySave.items?.time_hourglass ?? 0),
        voice_beacon: base.english.tacticalItems.voice_beacon + Math.min(3, legacySave.items?.wisdom_potion ?? 0),
      },
    },
    math: {
      ...base.math,
      techGears: mathGears,
      commanderRank: mathCorrect >= 30 ? '首席數理總工程師' : mathCorrect >= 12 ? '防線結構技師' : '初階算術工程師',
    },
    science: {
      ...base.science,
      labCrystals: sciCrystals,
      chefTitle: sciCorrect >= 30 ? '星級元素實驗主廚' : sciCorrect >= 12 ? '精密調味研究員' : '見習實驗小廚',
    },
  };
}
