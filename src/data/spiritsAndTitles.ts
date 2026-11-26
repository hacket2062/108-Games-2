import { GuardianId } from '../types/game';
import { GUARDIANS, GUARDIAN_LIST, GuardianConfig } from './guardians';

export { GUARDIANS, GUARDIAN_LIST };
export type { GuardianConfig };

export interface TitleDef {
  id: string;
  name: string;
  category: 'learning' | 'arena' | 'forge';
  unlockHint: string;
  badgeColor: string;
}

export const GAME_TITLES: TitleDef[] = [
  {
    id: 'title_novice',
    name: '智光見習守護者',
    category: 'learning',
    unlockHint: '初始學園稱號',
    badgeColor: '#94A3B8',
  },
  {
    id: 'title_combo5',
    name: '連擊破陣新星',
    category: 'learning',
    unlockHint: '達成 5 連擊即可解鎖',
    badgeColor: '#38BDF8',
  },
  {
    id: 'title_quad_clear',
    name: '四界通關賢者',
    category: 'learning',
    unlockHint: '四個科目世界皆通關至少 1 次',
    badgeColor: '#10B981',
  },
  {
    id: 'title_forge_master',
    name: '神兵覺醒大匠',
    category: 'forge',
    unlockHint: '將任一神兵升階為英雄／神話／地獄路線',
    badgeColor: '#F59E0B',
  },
  {
    id: 'title_arena_winner',
    name: '競技場閃耀騎士',
    category: 'arena',
    unlockHint: '線上對戰獲得 1 場勝利',
    badgeColor: '#A855F7',
  },
  {
    id: 'title_mythic_grandmaster',
    name: '神話智光宗師',
    category: 'arena',
    unlockHint: '對戰積分達 1500 分或最高連擊達 15x',
    badgeColor: '#F43F5E',
  },
];

export interface PvPRankTier {
  id: string;
  name: string;
  minRating: number;
  color: string;
  emblem: string;
}

export const PVP_RANK_TIERS: PvPRankTier[] = [
  { id: 'bronze', name: '青銅見習', minRating: 0, color: '#D97706', emblem: '銅' },
  { id: 'silver', name: '白銀騎士', minRating: 1050, color: '#CBD5E1', emblem: '銀' },
  { id: 'gold', name: '黃金導師', minRating: 1200, color: '#FACC15', emblem: '金' },
  { id: 'platinum', name: '鉑金賢者', minRating: 1380, color: '#38BDF8', emblem: '鉑' },
  { id: 'diamond', name: '鑽石守護', minRating: 1580, color: '#A855F7', emblem: '鑽' },
  { id: 'mythic', name: '神話宗師', minRating: 1800, color: '#F43F5E', emblem: '神' },
];

export function getPvPRankTier(rating: number): PvPRankTier {
  let matched = PVP_RANK_TIERS[0];
  for (const tier of PVP_RANK_TIERS) {
    if (rating >= tier.minRating) matched = tier;
  }
  return matched;
}

export const GUARDIAN_SHOP_COSTS: Record<GuardianId, { coins: number; crystals: number }> = {
  qilin: { coins: 0, crystals: 0 },
  stardragon: { coins: 260, crystals: 6 },
  griffin: { coins: 260, crystals: 6 },
  deer: { coins: 260, crystals: 6 },
};
