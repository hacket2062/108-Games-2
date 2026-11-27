import {
  EliteAffixId,
  GuardianId,
  HeroClassBranch,
  HeroClassId,
  HeroProgression,
  HeroTierId,
  RoguelikeRelicId,
  SubjectId,
} from '../types/game';

export interface HeroTierDef {
  tier: HeroTierId;
  name: string;
  subtitle: string;
  minLevel: number;
  badgeCost: number;
  coinCost: number;
  attackBonusPct: number;
  hpBonusPct: number;
  auraColor: string;
  unlockNote: string;
}

export const HERO_TIERS: Record<HeroTierId, HeroTierDef> = {
  1: {
    tier: 1,
    name: '一階・見習守護者',
    subtitle: '初探智光學園的新星勇者',
    minLevel: 1,
    badgeCost: 0,
    coinCost: 0,
    attackBonusPct: 0,
    hpBonusPct: 0,
    auraColor: '#38BDF8',
    unlockNote: '起始階級，掌握四大科目基礎戰技',
  },
  2: {
    tier: 2,
    name: '二階・菁英守護者',
    subtitle: '覺醒專屬武器光環與一轉職業',
    minLevel: 10,
    badgeCost: 6,
    coinCost: 220,
    attackBonusPct: 18,
    hpBonusPct: 20,
    auraColor: '#F59E0B',
    unlockNote: '解鎖「一轉職業選擇」（劍豪／魔導士／聖光守衛）',
  },
  3: {
    tier: 3,
    name: '三階・大師守護者',
    subtitle: '施展覺醒奧義的二轉終極強者',
    minLevel: 25,
    badgeCost: 14,
    coinCost: 480,
    attackBonusPct: 40,
    hpBonusPct: 42,
    auraColor: '#C084FC',
    unlockNote: '解鎖「二轉終極職業」（無雙戰神／星界大賢者／萬靈御獸師）',
  },
  4: {
    tier: 4,
    name: '四階・傳說智光聖者',
    subtitle: '展開金色聖光之翼的全職共鳴傳說',
    minLevel: 40,
    badgeCost: 24,
    coinCost: 900,
    attackBonusPct: 68,
    hpBonusPct: 70,
    auraColor: '#FDE047',
    unlockNote: '展開金色聖光翅膀＋全職業被動共鳴加成',
  },
};

export interface HeroClassDef {
  id: HeroClassId;
  branch: HeroClassBranch;
  requiredTier: HeroTierId;
  name: string;
  branchLabel: string;
  tagline: string;
  passiveTitle: string;
  passiveDesc: string;
  visualEffectDesc: string;
  accentColor: string;
  badgeColor: string;
  attackBonus: number;
  hpBonus: number;
  critBonus: number;
  thinkTimeBonusSec: number;
}

export const HERO_CLASSES: Record<HeroClassId, HeroClassDef> = {
  novice: {
    id: 'novice',
    branch: 'none',
    requiredTier: 1,
    name: '見習學園劍士',
    branchLabel: '基礎平衡系',
    tagline: '均衡發展的智光學園冒險者',
    passiveTitle: '智光初心',
    passiveDesc: '各科目穩定發揮，累積經驗與進階徽章準備轉職。',
    visualEffectDesc: '湛藍智光紋章環繞',
    accentColor: '#38BDF8',
    badgeColor: '#0284C7',
    attackBonus: 0,
    hpBonus: 0,
    critBonus: 0,
    thinkTimeBonusSec: 0,
  },
  star_swordsman: {
    id: 'star_swordsman',
    branch: 'blade',
    requiredTier: 2,
    name: '星痕劍豪',
    branchLabel: '破軍武聖系・一轉',
    tagline: '極致爆發・連擊無雙流',
    passiveTitle: '三連星痕劍氣',
    passiveDesc: '答對題目額外發射 3 道穿透劍氣，連擊越高暴擊傷害倍率最高達 300%！',
    visualEffectDesc: '赤金穿透劍氣與烈焰殘影',
    accentColor: '#F97316',
    badgeColor: '#EA580C',
    attackBonus: 18,
    hpBonus: 15,
    critBonus: 0.14,
    thinkTimeBonusSec: 0,
  },
  peerless_warlord: {
    id: 'peerless_warlord',
    branch: 'blade',
    requiredTier: 3,
    name: '無雙戰神',
    branchLabel: '破軍武聖系・二轉終極',
    tagline: '連續 3 題覺醒・全螢幕震波',
    passiveTitle: '無雙覺醒狀態',
    passiveDesc: '連續答對 3 題進入 10 秒「無雙覺醒」（攻速翻倍＋普攻附帶全螢幕劍氣震波）！',
    visualEffectDesc: '黃金烈焰戰氣＋全螢幕劍氣震波',
    accentColor: '#EF4444',
    badgeColor: '#DC2626',
    attackBonus: 36,
    hpBonus: 35,
    critBonus: 0.24,
    thinkTimeBonusSec: 0,
  },
  element_mage: {
    id: 'element_mage',
    branch: 'arcane',
    requiredTier: 2,
    name: '元素魔導士',
    branchLabel: '奧術賢者系・一轉',
    tagline: '元素控場・連鎖擴散流',
    passiveTitle: '雷冰連鎖擴散',
    passiveDesc: '答對題目引發連鎖閃電＋冰霜減速，傷害擴散全場並使敵人緩速 35%！',
    visualEffectDesc: '紫藍星辰法陣與連鎖電弧',
    accentColor: '#A855F7',
    badgeColor: '#7E22CE',
    attackBonus: 14,
    hpBonus: 18,
    critBonus: 0.08,
    thinkTimeBonusSec: 1.5,
  },
  astral_archmage: {
    id: 'astral_archmage',
    branch: 'arcane',
    requiredTier: 3,
    name: '星界大賢者',
    branchLabel: '奧術賢者系・二轉終極',
    tagline: '思維延伸・天降流星雨',
    passiveTitle: '三星隕落奧義',
    passiveDesc: '答題思考時間 +3 秒！每答對集 1 顆元素星辰，集滿 3 顆自動召喚「天降流星雨」破盾轟炸全場！',
    visualEffectDesc: '三顆繞行元素星辰＋天降流星雨',
    accentColor: '#818CF8',
    badgeColor: '#4F46E5',
    attackBonus: 28,
    hpBonus: 30,
    critBonus: 0.14,
    thinkTimeBonusSec: 3,
  },
  holy_sentinel: {
    id: 'holy_sentinel',
    branch: 'guardian',
    requiredTier: 2,
    name: '聖光守衛',
    branchLabel: '聖盾御獸師系・一轉',
    tagline: '鋼鐵反傷・能量護盾流',
    passiveTitle: '智慧反射聖盾',
    passiveDesc: '每次答對立即展開「智慧能量護盾」，受擊將 120% 傷害反彈給敵人並大幅提升生存！',
    visualEffectDesc: '六角金色光盾與反傷聖紋',
    accentColor: '#10B981',
    badgeColor: '#059669',
    attackBonus: 10,
    hpBonus: 48,
    critBonus: 0.06,
    thinkTimeBonusSec: 1,
  },
  beast_sovereign: {
    id: 'beast_sovereign',
    branch: 'guardian',
    requiredTier: 3,
    name: '萬靈御獸師',
    branchLabel: '聖盾御獸師系・二轉終極',
    tagline: '雙精靈協戰・合體技 +50%',
    passiveTitle: '雙靈共鳴契約',
    passiveDesc: '同時派出 2 隻守護精靈協戰攻擊與回血！2～4 人同樂「合體無雙技」威力額外 +50%！',
    visualEffectDesc: '雙守護精靈環繞＋翡翠金翼光環',
    accentColor: '#14B8A6',
    badgeColor: '#0D9488',
    attackBonus: 24,
    hpBonus: 82,
    critBonus: 0.12,
    thinkTimeBonusSec: 1.5,
  },
};

export function createInitialHeroProgression(): HeroProgression {
  return {
    tier: 1,
    classBranch: 'none',
    classId: 'novice',
    badges: 8, // Starter badges so players can experience progression smoothly once level is reached
    secondaryGuardian: 'stardragon',
  };
}

export function canAdvanceHeroTier(
  level: number,
  coins: number,
  progression: HeroProgression
): { ok: boolean; nextTier?: HeroTierDef; reason?: string } {
  if (progression.tier >= 4) {
    return { ok: false, reason: '已達最高階級「四階・傳說智光聖者」！' };
  }
  const next = HERO_TIERS[(progression.tier + 1) as HeroTierId];
  if (level < next.minLevel) {
    return { ok: false, nextTier: next, reason: `需要英雄等級達 Lv.${next.minLevel}（目前 Lv.${level}）` };
  }
  if (progression.badges < next.badgeCost) {
    return { ok: false, nextTier: next, reason: `進階徽章不足（需要 ${next.badgeCost} 枚）` };
  }
  if (coins < next.coinCost) {
    return { ok: false, nextTier: next, reason: `金幣不足（需要 ${next.coinCost}）` };
  }
  return { ok: true, nextTier: next };
}

export function canSelectHeroClass(
  targetClass: HeroClassId,
  progression: HeroProgression
): { ok: boolean; reason?: string } {
  const def = HERO_CLASSES[targetClass];
  if (progression.tier < def.requiredTier) {
    return {
      ok: false,
      reason: `需先突破至「${HERO_TIERS[def.requiredTier].name}」才可轉職！`,
    };
  }
  return { ok: true };
}

// ==================== 8 ELITE AFFIXES ====================
export interface EliteAffixDef {
  id: EliteAffixId;
  badge: string;
  name: string;
  desc: string;
  color: string;
}

export const ELITE_AFFIXES: Record<EliteAffixId, EliteAffixDef> = {
  swift_assault: {
    id: 'swift_assault',
    badge: '⚡ 疾風突襲',
    name: '疾風突襲',
    desc: '移動與攻擊速度 +40%，迫使玩家優先集火！',
    color: '#FBBF24',
  },
  regen_field: {
    id: 'regen_field',
    badge: '🛡️ 再生力場',
    name: '再生力場',
    desc: '每 4 秒未受答題傷害自動回復 15% 護盾！',
    color: '#34D399',
  },
  mirror_clone: {
    id: 'mirror_clone',
    badge: '👥 鏡像分身',
    name: '鏡像分身',
    desc: '血量低於 50% 分裂出 2 隻分身干擾！',
    color: '#A78BFA',
  },
  mind_pressure: {
    id: 'mind_pressure',
    badge: '⏳ 思維壓迫',
    name: '思維壓迫',
    desc: '縮短答題倒數，答對給予雙倍暴擊獎勵！',
    color: '#FB7185',
  },
  flame_backlash: {
    id: 'flame_backlash',
    badge: '🔥 烈焰反噬',
    name: '烈焰反噬',
    desc: '定時發射火球彈幕或前排灼燒！',
    color: '#F97316',
  },
  iron_grammar: {
    id: 'iron_grammar',
    badge: '🪨 知識重甲',
    name: '知識重甲',
    desc: '常規普攻傷害再減半，需連擊破甲！',
    color: '#94A3B8',
  },
  void_shield: {
    id: 'void_shield',
    badge: '🌀 虛空結界',
    name: '虛空結界',
    desc: '開局自帶 2 層吸收護盾！',
    color: '#38BDF8',
  },
  chaos_warp: {
    id: 'chaos_warp',
    badge: '✨ 混沌閃現',
    name: '混沌閃現',
    desc: '受擊後短暫加速突進！',
    color: '#E879F9',
  },
};

export const ALL_ELITE_AFFIX_IDS = Object.keys(ELITE_AFFIXES) as EliteAffixId[];

export function rollEliteAffixes(stageNumber: number, seedOffset = 0): EliteAffixId[] {
  if (stageNumber < 3) return [];
  const count = stageNumber >= 7 ? 2 : 1;
  const pool = [...ALL_ELITE_AFFIX_IDS];
  const out: EliteAffixId[] = [];
  let s = stageNumber * 31 + seedOffset * 17 + 7;
  for (let i = 0; i < count && pool.length > 0; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % pool.length;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

// ==================== ROGUELIKE 3-CARD AWAKENING RELICS ====================
export interface RoguelikeRelicDef {
  id: RoguelikeRelicId;
  icon: string;
  name: string;
  shortEffect: string;
  detail: string;
  accent: string;
}

export const ROGUELIKE_RELICS: Record<RoguelikeRelicId, RoguelikeRelicDef> = {
  chain_lightning: {
    id: 'chain_lightning',
    icon: '⚡',
    name: '連鎖雷鳴',
    shortEffect: '答對額外劈下 3 道天雷',
    detail: '每次答對題目額外對場上最多 3 名敵人造成高壓連鎖雷擊！',
    accent: '#FACC15',
  },
  absolute_zero: {
    id: 'absolute_zero',
    icon: '❄️',
    name: '絕對零度',
    shortEffect: '攻擊附帶 2 秒冰凍緩速',
    detail: '每次命中敵人皆附加 2 秒寒冰緩速，大幅減緩敵軍推進與攻擊！',
    accent: '#38BDF8',
  },
  double_cast: {
    id: 'double_cast',
    icon: '⚔️',
    name: '雙重施法',
    shortEffect: '30% 機率雙倍技能連發',
    detail: '答對題目時有 30% 機率讓攻擊傷害與破甲效果連續觸發兩次！',
    accent: '#F43F5E',
  },
  wisdom_drain: {
    id: 'wisdom_drain',
    icon: '💖',
    name: '智慧汲取',
    shortEffect: '回血 +12% 與必殺 +20%',
    detail: '每次擊敗敵人或完成料理回復 12% 生命並額外增加 20% 必殺能量！',
    accent: '#34D399',
  },
  blade_flurry: {
    id: 'blade_flurry',
    icon: '🌪️',
    name: '疾風連斬',
    shortEffect: '暴擊傷害 +35% 與攻速加速',
    detail: '大幅提升連擊倍率上限與所有技能／砲塔充能速度 +20%！',
    accent: '#FB923C',
  },
  golden_aegis: {
    id: 'golden_aegis',
    icon: '🛡️',
    name: '黃金神盾',
    shortEffect: '立即回滿 25% 血＋減傷 25%',
    detail: '立刻回復 25% 生命／城門耐力，本場戰鬥受到的敵方傷害降低 25%！',
    accent: '#A78BFA',
  },
};

export function rollRoguelikeChoices(seed = Date.now(), count = 3): RoguelikeRelicDef[] {
  const all = Object.values(ROGUELIKE_RELICS);
  const copy = [...all];
  let s = Math.abs(Math.floor(seed)) || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

// ==================== 16-ENTRY MONSTER BESTIARY ====================
export interface BestiaryMonsterDef {
  id: string;
  name: string;
  title: string;
  world: SubjectId | 'tower';
  renderKind: 'ink_poring' | 'ink_slime' | 'ink_boss' | 'zombie_zero' | 'zombie_bucket' | 'zombie_hopper' | 'zombie_sprinter' | 'zombie_mage' | 'zombie_fusion' | 'dragon_lord' | 'mecha_drone' | 'tower_lord';
  weakness: string;
  trivia: string;
  hpTier: string;
}

export type BestiaryEntry = BestiaryMonsterDef;

export const BESTIARY_CATALOG: BestiaryMonsterDef[] = [
  {
    id: 'bst_ink_poring',
    name: '錯字墨妖',
    title: '墨靈幻境・巡邏先鋒',
    world: 'chinese',
    renderKind: 'ink_poring',
    weakness: '成語快斬・破邪斬句',
    trivia: '108 課綱小知識：形近字如「已／己／巳」可從封口高度辨別，別讓錯字妖有機可乘！',
    hpTier: '基礎巡邏',
  },
  {
    id: 'bst_ink_slime',
    name: '病句護法妖',
    title: '墨靈幻境・重盾菁英',
    world: 'chinese',
    renderKind: 'ink_slime',
    weakness: '印璽醫者破盾斬字',
    trivia: '108 課綱小知識：譬喻修辭常用「像、彷彿、猶如」，擬人則賦予景物人類情感動作。',
    hpTier: '護盾菁英',
  },
  {
    id: 'bst_ink_boss',
    name: '深淵墨魔首領',
    title: '墨靈幻境・三波大魔王',
    world: 'chinese',
    renderKind: 'ink_boss',
    weakness: '連擊破盾＋萬墨歸宗',
    trivia: '108 課綱小知識：六書中的「形聲字」由形符表意、聲符表音，佔常用漢字八成以上！',
    hpTier: '二階魔王',
  },
  {
    id: 'bst_eng_drone',
    name: '星際字彙戰機',
    title: '星際機甲戰線・音韻編隊',
    world: 'english',
    renderKind: 'mecha_drone',
    weakness: '手動鎖定高能離子束',
    trivia: '108 課綱小知識：拆解自然發音音節（Phonics）如 li-bra-ry，背長單字事半功倍！',
    hpTier: '高速機群',
  },
  {
    id: 'bst_eng_twin',
    name: '雙子同反義護衛機',
    title: '星際機甲戰線・雙聯防禦',
    world: 'english',
    renderKind: 'mecha_drone',
    weakness: '精準點名鎖定連破',
    trivia: '108 課綱小知識：記單字時把反義字配對記憶（hot/cold, early/late），記憶力加倍！',
    hpTier: '雙聯菁英',
  },
  {
    id: 'bst_eng_mothership',
    name: '虛空語皇母艦',
    title: '星際機甲戰線・拼字巨艦',
    world: 'english',
    renderKind: 'tower_lord',
    weakness: '字母順序精準爆破',
    trivia: '108 課綱小知識：現在進行式記得搭配 be 動詞 + V-ing，過去式要注意不規則動詞變化！',
    hpTier: '終極母艦',
  },
  {
    id: 'bst_math_zero',
    name: '歸零算術殭屍',
    title: '數境建築王國・裝甲步兵',
    world: 'math',
    renderKind: 'zombie_zero',
    weakness: '超頻砲塔破甲穿刺',
    trivia: '108 課綱小知識：任何數乘以 0 都是 0，但 0 絕對不能當除數喔！',
    hpTier: '算甲步兵',
  },
  {
    id: 'bst_math_bucket',
    name: '鐵桶負數殭屍',
    title: '數境建築王國・重裝盾兵',
    world: 'math',
    renderKind: 'zombie_bucket',
    weakness: '算式狙擊擊飛鐵桶',
    trivia: '108 課綱小知識：四則運算牢記「括號最先算、先乘除後加減、由左而右」！',
    hpTier: '重甲鐵桶',
  },
  {
    id: 'bst_math_hopper',
    name: '跳跳分數殭屍',
    title: '數境建築王國・越塔突擊',
    world: 'math',
    renderKind: 'zombie_hopper',
    weakness: '貓頭鷹冰凍塔＋天雷',
    trivia: '108 課綱小知識：異分母分數加減要先通分找最小公倍數，分子再相加減！',
    hpTier: '越塔奇兵',
  },
  {
    id: 'bst_math_sprinter',
    name: '極速小數殭屍',
    title: '數境建築王國・疾風先鋒',
    world: 'math',
    renderKind: 'zombie_sprinter',
    weakness: '冰封卷軸＋機槍超頻',
    trivia: '108 課綱小知識：小數乘法先當整數乘，最後把兩數的小數位數加起來點回小數點！',
    hpTier: '極速奇襲',
  },
  {
    id: 'bst_math_mage',
    name: '護盾算術法師',
    title: '數境建築王國・團隊輔師',
    world: 'math',
    renderKind: 'zombie_mage',
    weakness: '質數天雷優先斬首',
    trivia: '108 課綱小知識：2 是最小的質數，也是唯一一個偶數質數！',
    hpTier: '修復輔師',
  },
  {
    id: 'bst_math_fusion',
    name: '雷電融合變異王',
    title: '數境建築王國・合體巨獸',
    world: 'math',
    renderKind: 'zombie_fusion',
    weakness: '黃金比例轟炸＋連答破盾',
    trivia: '108 課綱小知識：速率＝距離÷時間；掌握三個量的三角關係就能秒殺應用題！',
    hpTier: '融合魔王',
  },
  {
    id: 'bst_sci_glutton',
    name: '深淵饕餮龍王',
    title: '元素料理大亂鬥・災厄暴君',
    world: 'science',
    renderKind: 'dragon_lord',
    weakness: '五星元素控溫料理',
    trivia: '108 課綱小知識：紫色高麗菜汁遇酸變紅、中性呈紫、遇鹼變藍綠，是天然酸鹼指示劑！',
    hpTier: '二階龍王',
  },
  {
    id: 'bst_sci_steam',
    name: '暴走熱浪炎魔',
    title: '元素料理大亂鬥・沸騰干擾',
    world: 'science',
    renderKind: 'ink_boss',
    weakness: '急凍零度聖代壓制',
    trivia: '108 課綱小知識：熱傳播有三種方式：固體靠傳導、液氣體靠對流、真空靠輻射！',
    hpTier: '元素菁英',
  },
  {
    id: 'bst_tower_warden',
    name: '智光試煉守門領主',
    title: '無盡試煉之塔・雙詞綴領主',
    world: 'tower',
    renderKind: 'tower_lord',
    weakness: '跨科全能連擊＋合體無雙',
    trivia: '108 課綱小知識：跨學科整合思考（素養導向）正是 108 課綱最重視的核心能力！',
    hpTier: '雙詞綴王',
  },
  {
    id: 'bst_tower_emperor',
    name: '星界知識古龍皇',
    title: '無盡試煉之塔・終極霸主',
    world: 'tower',
    renderKind: 'dragon_lord',
    weakness: '四階聖者覺醒奧義',
    trivia: '108 課綱小知識：每日穩定練習與整理錯題本，比考前熬夜死背效率高出三倍以上！',
    hpTier: '神話霸主',
  },
];

export function getBestiaryBonusPercent(discoveredIds: string[]): number {
  const unique = new Set(discoveredIds).size;
  // Every 2 discovered monsters grants +3% permanent All-Class ATK & HP bonus (up to +24%)
  return Math.min(24, Math.floor(unique / 2) * 3);
}
