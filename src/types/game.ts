import type {
  LearningMilestoneLog,
  SubjectProfiles,
  TagMasteryRecord,
  TodayPracticeItem,
} from './progression';

export type SubjectId = 'chinese' | 'english' | 'math' | 'science';
export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type SemesterId = 'upper' | 'lower';
export type PlayMode = 'adventure' | 'practice';
export type GuardianId = 'qilin' | 'stardragon' | 'griffin' | 'deer';
export type SpeedGrade = 'PERFECT' | 'GREAT' | 'GOOD';
export type PlayerCount = 1 | 2 | 3 | 4;
export type QuestionDifficultyTier = 1 | 2 | 3;

export type HeroTierId = 1 | 2 | 3 | 4;
export type HeroClassBranch = 'none' | 'blade' | 'arcane' | 'guardian';
export type HeroClassId =
  | 'novice'
  | 'star_swordsman'
  | 'peerless_warlord'
  | 'element_mage'
  | 'astral_archmage'
  | 'holy_sentinel'
  | 'beast_sovereign';

export interface HeroProgression {
  tier: HeroTierId;
  classBranch: HeroClassBranch;
  classId: HeroClassId;
  badges: number;
  secondaryGuardian: GuardianId;
}

export type EliteAffixId =
  | 'swift_assault'
  | 'regen_field'
  | 'mirror_clone'
  | 'mind_pressure'
  | 'flame_backlash'
  | 'iron_grammar'
  | 'void_shield'
  | 'chaos_warp';

export type RoguelikeRelicId =
  | 'chain_lightning'
  | 'absolute_zero'
  | 'double_cast'
  | 'wisdom_drain'
  | 'blade_flurry'
  | 'golden_aegis';

// ==================== QUESTIONS ====================
export interface BaseQuestion {
  id: string;
  grade: GradeLevel;
  semester: SemesterId;
  subject: SubjectId;
  type: string;
  prompt: string;
  answer: string;
  explanation: string;
  hint: string;
  knowledgeTag: string;
  difficulty?: QuestionDifficultyTier;
}

export interface ChineseSlashPayload {
  mode: 'slash';
  options: string[];
  correctIndex: number;
}

export interface ChineseRadicalPayload {
  mode: 'radical';
  partA: string;
  partB: string;
  pool: string[];
  targetChar: string;
  meaning: string;
}

export interface ChineseTypoPayload {
  mode: 'typo';
  sentence: string;
  typoIndex: number;
  wrongChar: string;
  correctChar: string;
}

export type ChinesePayload =
  | ChineseSlashPayload
  | ChineseRadicalPayload
  | ChineseTypoPayload;

export interface ChineseQuestion extends BaseQuestion {
  subject: 'chinese';
  type: 'slash' | 'radical' | 'typo';
  payload: ChinesePayload;
}

export interface EnglishDronePayload {
  mode: 'listen' | 'fill';
  speakText: string;
  zhMeaning: string;
  choices: string[];
  correctIndex: number;
}

export interface EnglishSpellPayload {
  mode: 'spell';
  speakText: string;
  zhMeaning: string;
  word: string;
  distractorLetters: string[];
}

export type EnglishPayload = EnglishDronePayload | EnglishSpellPayload;

export interface EnglishQuestion extends BaseQuestion {
  subject: 'english';
  type: 'listen' | 'fill' | 'spell';
  payload: EnglishPayload;
}

export interface MathPayload {
  formulaShield: string;
  options: string[];
  correctIndex: number;
  unit?: string;
}

export interface MathQuestion extends BaseQuestion {
  subject: 'math';
  type: 'calc' | 'geometry' | 'fraction';
  payload: MathPayload;
}

export interface ScienceIngredient {
  id: string;
  name: string;
  categoryTag: string;
  color: string;
  accent: string;
  isCorrect: boolean;
  wrongReason?: string;
}

export type TempZone = 'freeze' | 'simmer' | 'boil';
export type PhType = 'acid' | 'neutral' | 'alkali';

export interface SciencePayload {
  dishName: string;
  orderRequirement: string;
  neededCount: number;
  ingredients: ScienceIngredient[];
  targetTempZone: TempZone;
  targetTempLabel: string;
  targetPh: PhType;
  targetPhLabel: string;
  effectStyle: 'fire' | 'ice' | 'rainbow' | 'nature';
}

export interface ScienceQuestion extends BaseQuestion {
  subject: 'science';
  type: 'dish';
  payload: SciencePayload;
}

export type AnyQuestion =
  | ChineseQuestion
  | EnglishQuestion
  | MathQuestion
  | ScienceQuestion;

export interface PvPQuestionCard {
  id: string;
  subject: SubjectId;
  grade: GradeLevel;
  prompt: string;
  options: string[];
  correctIndex: number;
  answer: string;
  explanation: string;
  knowledgeTag: string;
  speakText?: string;
  speakLang?: 'zh-TW' | 'en-US';
}

// ==================== FORGE / WEAPONS / GEMS / ITEMS ====================
export type AscensionPath = 'base' | 'hero' | 'mythic' | 'inferno';
export type GemElementId = 'ink_ruby' | 'star_sapphire' | 'gear_topaz' | 'leaf_emerald';
export type BattleItemId =
  | 'wisdom_potion'
  | 'combo_charm'
  | 'shield_scroll'
  | 'time_hourglass'
  | 'forge_guard';

export interface GemInstance {
  uid: string;
  element: GemElementId;
  level: 1 | 2 | 3 | 4 | 5;
}

export interface WeaponInstance {
  uid: string;
  templateId: string;
  name: string;
  baseAttack: number;
  enhanceLevel: number; // 0..15
  ascensionPath: AscensionPath;
  rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
  isFused?: boolean;
  socketedGems: (GemInstance | null)[]; // 3 slots
}

export interface WrongRecord {
  questionId: string;
  subject: SubjectId;
  grade: GradeLevel;
  prompt: string;
  correctAnswer: string;
  explanation: string;
  knowledgeTag: string;
  wrongCount: number;
  lastWrongAt: number;
  revengeOptions?: string[];
}

export interface SubjectStats {
  answered: number;
  correct: number;
  bestScore: number;
  starsEarned: number;
  clears: number;
}

export type EquipmentSlotId = 'weapon' | 'helm' | 'armor' | 'gloves' | 'boots' | 'amulet';

export interface EquipmentLevels {
  weapon: number;
  helm?: number;
  armor: number;
  gloves?: number;
  boots: number;
  amulet?: number;
}

export type StageTier = 'explore' | 'trial' | 'elite' | 'brawl' | 'boss';

export interface CampaignStageConfig {
  stageKey: string; // e.g. "chinese_g4_c1_s1"
  subject: SubjectId;
  grade: GradeLevel;
  chapterIndex: 1 | 2 | 3;
  chapterTitle: string;
  stageNumber: number; // 1..10
  title: string;
  subtitle: string;
  tier: StageTier;
  enemyName: string;
  bossPhase2Name?: string;
  enemyHpScale: number;
  enemySpeedScale: number;
  waveCount: number;
  comboRewardMultiplier: number;
  focusTags: string[];
  starChestReward?: {
    coins: number;
    crystals: number;
    weaponTemplateId?: string;
    label: string;
  };
}

export interface CampaignChapter {
  id: string;
  subject: SubjectId;
  grade: GradeLevel;
  chapterIndex: 1 | 2 | 3;
  title: string;
  unitSummary: string;
  themeColor: string;
  bossName: string;
  stages: CampaignStageConfig[];
}

export interface StageProgressRecord {
  cleared: boolean;
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  chestClaimed?: boolean;
}

export interface LearningTrajectoryEntry {
  id: string;
  timestamp: number;
  subject: SubjectId | 'pvp';
  grade: GradeLevel;
  correctCount: number;
  totalAttempts: number;
  score: number;
  durationSeconds: number;
  victory: boolean;
  note: string;
}

export interface DailyQuestProgress {
  id: string;
  title: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardCrystals: number;
  claimed: boolean;
}

export interface ParentSettings {
  pinCode: string; // 4-digit parent PIN
  dailyLimitMinutes: number; // 15..120
  pvpEnabled: boolean;
  forcePracticeMode: boolean;
}

export interface PvPProfileStats {
  rating: number;
  wins: number;
  losses: number;
  winStreak: number;
  bestWinStreak: number;
  honorTokens: number;
}

export interface PlayerSaveData {
  level: number;
  xp: number;
  coins: number;
  crystals: number;
  bestStreak: number;
  selectedGuardian: GuardianId;
  unlockedGuardians: GuardianId[];
  guardianBonds: Record<GuardianId, number>;
  equipment: EquipmentLevels;
  weapons: WeaponInstance[];
  equippedWeaponUid: string;
  gemBag: GemInstance[];
  items: Record<BattleItemId, number>;
  selectedTitle: string;
  unlockedTitles: string[];
  grade: GradeLevel;
  semester: SemesterId;
  playMode: PlayMode;
  muted: boolean;
  subjectStats: Record<SubjectId, SubjectStats>;
  wrongRecords: WrongRecord[];
  unlockedCards: string[];
  trajectory: LearningTrajectoryEntry[];
  dailyQuests: DailyQuestProgress[];
  dailyPlaySeconds: number;
  lastPlayDate: string; // YYYY-MM-DD
  pvp: PvPProfileStats;
  parentSettings: ParentSettings;
  stageProgress?: Record<string, StageProgressRecord>;
  masteredQuestionIds?: string[];
  knowledgeMastery?: Record<string, { subject: SubjectId; tag: string; answered: number; correct: number }>;
  rapidGuessCount?: number;
  playerCount?: PlayerCount;
  heroProgression?: HeroProgression;
  towerBestFloor?: number;
  discoveredBestiary?: string[];
  subjectProfiles?: SubjectProfiles;
  learningMilestones?: LearningMilestoneLog[];
  tagMastery?: Record<string, TagMasteryRecord>;
  todayPracticeQueue?: TodayPracticeItem[];
}

export interface WorldRunResult {
  subject: SubjectId;
  stageKey?: string;
  stageLabel?: string;
  victory: boolean;
  score: number;
  stars: 0 | 1 | 2 | 3;
  correctCount: number;
  totalAttempts: number;
  maxCombo: number;
  clearSeconds: number;
  coinsEarned: number;
  xpEarned: number;
  crystalsEarned: number;
  knowledgeTags: string[];
  progressSummary: string;
  chestRewardText?: string;
}

export interface PvPRunResult {
  victory: boolean;
  opponentName: string;
  isOnlineRealPlayer: boolean;
  roomCode?: string;
  myScore: number;
  opponentScore: number;
  correctCount: number;
  totalAttempts: number;
  maxCombo: number;
  ratingDelta: number;
  newRating: number;
  honorEarned: number;
  coinsEarned: number;
  xpEarned: number;
  durationSeconds: number;
}

export interface EffectiveCombatStats {
  baseAttack: number;
  maxHp: number;
  speedBonus: number;
  bondLevel: number;
  critChance: number;
  shieldMitigation: number;
  ultChargeBonus: number;
  weaponPath: AscensionPath;
  weaponEnhanceLevel: number;
  weaponName: string;
  heroTier: HeroTierId;
  heroClassId: HeroClassId;
  heroClassBranch: HeroClassBranch;
  thinkTimeBonusSec: number;
  bestiaryBonusPct: number;
  secondaryGuardian: GuardianId;
}

export interface EngineCommonProps {
  appearance?: import('../core/equipmentAppearance').EquipmentAppearance;
  grade: GradeLevel;
  semester: SemesterId;
  playMode: PlayMode;
  guardianId: GuardianId;
  playerStats: EffectiveCombatStats;
  playerCount?: PlayerCount;
  stageConfig?: CampaignStageConfig;
  masteredQuestionIds?: string[];
  wrongQuestionIds?: string[];
  onAnswerResult: (
    question: AnyQuestion,
    isCorrect: boolean,
    responseMs?: number,
    usedHint?: boolean
  ) => void;
  onDiscoverMonster?: (monsterId: string) => void;
  onFinish: (result: WorldRunResult) => void;
  onExit: () => void;
}

// ==================== AUTH & NAVIGATION ====================
export interface AppUserAccount {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  provider: 'google' | 'local';
  avatarColor: string;
  emailVerified: boolean;
}

export type ActiveScreen =
  | 'lobby'
  | 'subject_hub'
  | 'stage_select'
  | 'world_chinese'
  | 'world_english'
  | 'world_math'
  | 'world_science'
  | 'trial_tower'
  | 'bestiary'
  | 'pvp_arena'
  | 'forge'
  | 'socketing'
  | 'shop'
  | 'parent_dashboard';

// ==================== PVP NETWORK TYPES ====================
export type PvPJammerType = 'jam_fog' | 'jam_haste' | 'jam_shield';
export type PvPActionType = 'attack' | PvPJammerType | 'ultimate';

export interface PvPRoomState {
  roomCode: string;
  status: 'waiting' | 'playing' | 'finished';
  grade: GradeLevel;
  subjectFilter: SubjectId | 'all';
  hostUid: string;
  hostName: string;
  hostWeaponPath: AscensionPath;
  hostWeaponLevel: number;
  hostGuardian: GuardianId;
  hostHp: number;
  hostScore: number;
  hostCombo: number;
  guestUid: string;
  guestName: string;
  guestWeaponPath: AscensionPath;
  guestWeaponLevel: number;
  guestGuardian: GuardianId;
  guestHp: number;
  guestScore: number;
  guestCombo: number;
  winnerUid: string;
  questionSeed: number;
}

export interface PvPCombatEvent {
  id: string;
  senderUid: string;
  actionType: PvPActionType;
  damage: number;
  label: string;
  timestamp: number;
}
