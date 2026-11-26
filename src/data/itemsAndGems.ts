import {
  AscensionPath,
  BattleItemId,
  GemElementId,
  WeaponInstance,
} from '../types/game';

export interface BattleItemDef {
  id: BattleItemId;
  name: string;
  shortTag: string;
  description: string;
  priceCoins: number;
  priceHonor?: number;
  color: string;
  iconKey: 'potion' | 'charm' | 'shield' | 'hourglass' | 'anvil';
}

export const BATTLE_ITEMS: Record<BattleItemId, BattleItemDef> = {
  wisdom_potion: {
    id: 'wisdom_potion',
    name: '智光回復藥水',
    shortTag: '回復 45% HP',
    description: '戰鬥中立刻恢復 45% 最大生命值並驅散異常狀態。',
    priceCoins: 80,
    color: '#10B981',
    iconKey: 'potion',
  },
  combo_charm: {
    id: 'combo_charm',
    name: '連擊護符',
    shortTag: '連擊 +3 & 2x 傷',
    description: '立刻獲得連擊加成並讓下一次正確攻擊造成雙倍傷害。',
    priceCoins: 110,
    color: '#F59E0B',
    iconKey: 'charm',
  },
  shield_scroll: {
    id: 'shield_scroll',
    name: '結界反震卷軸',
    shortTag: '抵擋 1 次傷害',
    description: '展開黃金知識結界，完美格擋一次敵人攻擊或對戰干擾魔法。',
    priceCoins: 100,
    priceHonor: 30,
    color: '#38BDF8',
    iconKey: 'shield',
  },
  time_hourglass: {
    id: 'time_hourglass',
    name: '星辰緩時沙漏',
    shortTag: '倒數暫停 8 秒',
    description: '凍結冒險與競技場倒數計時 8 秒，從容解出完美答案！',
    priceCoins: 120,
    priceHonor: 35,
    color: '#A855F7',
    iconKey: 'hourglass',
  },
  forge_guard: {
    id: 'forge_guard',
    name: '神匠保護卷軸',
    shortTag: '強化失敗不掉階',
    description: '在神兵鍛造屋強化 +7 以上裝備時自動防護，確保失敗絕不掉階。',
    priceCoins: 180,
    priceHonor: 55,
    color: '#FB7185',
    iconKey: 'anvil',
  },
};

export interface GemElementDef {
  id: GemElementId;
  name: string;
  subjectLabel: string;
  color: string;
  glow: string;
  statLabel: string;
  attackPerLevel: number;
  hpPerLevel: number;
  critPerLevel: number; // e.g. 0.03 = 3%
  ultBonusPerLevel: number; // e.g. 4 = +4% ult gain
  shopPriceCoins: number;
}

export const GEM_ELEMENTS: Record<GemElementId, GemElementDef> = {
  ink_ruby: {
    id: 'ink_ruby',
    name: '文華紅寶石',
    subjectLabel: '國語火炎',
    color: '#F43F5E',
    glow: 'rgba(244, 63, 94, 0.55)',
    statLabel: '攻擊力＋暴擊率',
    attackPerLevel: 5,
    hpPerLevel: 4,
    critPerLevel: 0.03,
    ultBonusPerLevel: 1,
    shopPriceCoins: 120,
  },
  star_sapphire: {
    id: 'star_sapphire',
    name: '星語藍寶石',
    subjectLabel: '英語星能',
    color: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.55)',
    statLabel: '必殺充能＋攻速',
    attackPerLevel: 3,
    hpPerLevel: 6,
    critPerLevel: 0.02,
    ultBonusPerLevel: 4,
    shopPriceCoins: 120,
  },
  gear_topaz: {
    id: 'gear_topaz',
    name: '數律金黃石',
    subjectLabel: '數學精密',
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.55)',
    statLabel: '高暴擊＋破防傷害',
    attackPerLevel: 6,
    hpPerLevel: 2,
    critPerLevel: 0.04,
    ultBonusPerLevel: 2,
    shopPriceCoins: 130,
  },
  leaf_emerald: {
    id: 'leaf_emerald',
    name: '森羅翠綠石',
    subjectLabel: '自然生機',
    color: '#10B981',
    glow: 'rgba(16, 185, 129, 0.55)',
    statLabel: '最大生命＋減傷護盾',
    attackPerLevel: 2,
    hpPerLevel: 18,
    critPerLevel: 0.01,
    ultBonusPerLevel: 2,
    shopPriceCoins: 115,
  },
};

export interface AscensionPathDef {
  id: AscensionPath;
  name: string;
  subtitle: string;
  auraPrimary: string;
  auraSecondary: string;
  passiveTitle: string;
  passiveDesc: string;
  attackMultiplier: number;
  hpBonus: number;
  critBonus: number;
  shieldMitigation: number; // 0..0.3
  ultBonus: number;
  crystalCost: number;
  coinCost: number;
  minEnhanceLevel: number;
}

export const ASCENSION_PATHS: Record<AscensionPath, AscensionPathDef> = {
  base: {
    id: 'base',
    name: '學園制式',
    subtitle: '均衡堅實的初階神兵',
    auraPrimary: '#94A3B8',
    auraSecondary: '#E2E8F0',
    passiveTitle: '智光啟蒙',
    passiveDesc: '強化達 +5 後即可於神兵鍛造屋覺醒為英雄、神話或地獄三路線！',
    attackMultiplier: 1.0,
    hpBonus: 0,
    critBonus: 0,
    shieldMitigation: 0,
    ultBonus: 0,
    crystalCost: 0,
    coinCost: 0,
    minEnhanceLevel: 0,
  },
  hero: {
    id: 'hero',
    name: '英雄路線・聖光守護',
    subtitle: '金色聖盾光環・高容錯穩健型',
    auraPrimary: '#FACC15',
    auraSecondary: '#FEF08A',
    passiveTitle: '聖光庇護',
    passiveDesc: '最大生命 +65、減傷 18%、攻擊 +18%，對戰與 Boss 戰最耐打！',
    attackMultiplier: 1.18,
    hpBonus: 65,
    critBonus: 0.05,
    shieldMitigation: 0.18,
    ultBonus: 6,
    crystalCost: 12,
    coinCost: 350,
    minEnhanceLevel: 5,
  },
  mythic: {
    id: 'mythic',
    name: '神話路線・星辰賢者',
    subtitle: '星藍紫霞光環・高速必殺連擊型',
    auraPrimary: '#38BDF8',
    auraSecondary: '#A855F7',
    passiveTitle: '星軌迴響',
    passiveDesc: '攻擊 +26%、必殺充能 +16%、暴擊率 +12%，必殺特寫連發！',
    attackMultiplier: 1.26,
    hpBonus: 30,
    critBonus: 0.12,
    shieldMitigation: 0.08,
    ultBonus: 16,
    crystalCost: 16,
    coinCost: 420,
    minEnhanceLevel: 5,
  },
  inferno: {
    id: 'inferno',
    name: '地獄路線・緋紅破滅',
    subtitle: '熾紅黑焰光環・極致爆發暴擊型',
    auraPrimary: '#F43F5E',
    auraSecondary: '#FB923C',
    passiveTitle: '緋焰審判',
    passiveDesc: '攻擊 +40%、暴擊率 +22%，單發答題即可轟出破表紅字暴擊！',
    attackMultiplier: 1.4,
    hpBonus: 10,
    critBonus: 0.22,
    shieldMitigation: 0.04,
    ultBonus: 8,
    crystalCost: 18,
    coinCost: 480,
    minEnhanceLevel: 5,
  },
};

export interface WeaponShopTemplate {
  templateId: string;
  name: string;
  baseAttack: number;
  rarity: 'rare' | 'epic' | 'legendary' | 'mythic';
  priceCoins: number;
  priceHonor?: number;
  description: string;
}

export const WEAPON_CATALOG: WeaponShopTemplate[] = [
  {
    templateId: 'wp_starter_pen',
    name: '學園墨光短刃',
    baseAttack: 24,
    rarity: 'rare',
    priceCoins: 180,
    description: '輕巧好上手的學園基礎神兵，含 3 個寶石鑲嵌槽。',
  },
  {
    templateId: 'wp_star_lance',
    name: '星輝脈衝長槍',
    baseAttack: 32,
    rarity: 'epic',
    priceCoins: 420,
    description: '匯聚星際機甲能量，適合高速連擊與融合素材。',
  },
  {
    templateId: 'wp_golden_compass',
    name: '黃金比例裁決杖',
    baseAttack: 38,
    rarity: 'legendary',
    priceCoins: 680,
    description: '數境建築師打造的傳說級法杖，內建精密暴擊刻紋。',
  },
  {
    templateId: 'wp_arena_scepter',
    name: '智光競技王權戟',
    baseAttack: 45,
    rarity: 'mythic',
    priceCoins: 0,
    priceHonor: 180,
    description: '僅能於競技榮譽商店兌換的神話級神兵，自帶王者光環！',
  },
];

export interface FusionRecipe {
  id: string;
  resultName: string;
  resultTemplateId: string;
  resultBaseAttack: number;
  resultRarity: 'legendary' | 'mythic';
  coinCost: number;
  crystalCost: number;
  description: string;
}

export const FUSION_RECIPES: FusionRecipe[] = [
  {
    id: 'fuse_aurora_blade',
    resultName: '極光萬卷破曉劍',
    resultTemplateId: 'wp_fused_aurora',
    resultBaseAttack: 52,
    resultRarity: 'mythic',
    coinCost: 500,
    crystalCost: 15,
    description: '將任意兩把神兵融合鍛造，繼承最高強化等級並躍升為基礎攻擊 52 的神話融合武器！',
  },
];

export function getEnhanceSuccessRate(currentLevel: number): number {
  if (currentLevel < 4) return 100;
  if (currentLevel < 7) return 85;
  if (currentLevel < 10) return 68;
  if (currentLevel < 13) return 52;
  return 38;
}

export function getEnhanceCost(currentLevel: number): { coins: number; crystals: number } {
  return {
    coins: Math.round(70 + currentLevel * 45),
    crystals: currentLevel >= 6 ? Math.floor((currentLevel - 4) * 1.5) : 0,
  };
}

export function createStarterWeapon(): WeaponInstance {
  return {
    uid: 'wp-starter-01',
    templateId: 'wp_starter_pen',
    name: '學園墨光短刃',
    baseAttack: 24,
    enhanceLevel: 2,
    ascensionPath: 'base',
    rarity: 'rare',
    socketedGems: [
      { uid: 'gem-init-1', element: 'ink_ruby', level: 1 },
      null,
      null,
    ],
  };
}
