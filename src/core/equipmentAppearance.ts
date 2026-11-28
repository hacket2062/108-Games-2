import type { AscensionPath, BattleItemId, EquipmentLevels, EquipmentSlotId, WeaponInstance } from '../types/game';

/** Presentation-only data: the existing save and class progression remain authoritative. */
export interface EquipmentAppearance { weapon: WeaponInstance; equipment: EquipmentLevels; heroClassBranch?: 'none' | 'blade' | 'arcane' | 'guardian'; }
export const PATH_ART: Record<AscensionPath, { frame: number; name: string; color: string; silhouette: string }> = {
  base: { frame: 0, name: '學園冒險者', color: '#8cbce5', silhouette: '短披風・輕裝' },
  hero: { frame: 1, name: '聖翼守護騎士', color: '#f8d583', silhouette: '翼冠・重甲・聖盾翼刃' },
  mythic: { frame: 2, name: '星環秘法賢者', color: '#b9a4ff', silhouette: '星冠・晶翼・浮遊符石' },
  inferno: { frame: 3, name: '緋焰黑曜騎士', color: '#ff8377', silhouette: '黑曜重甲・鋸刃・焰披風' },
};
export const WEAPON_ART_CELLS: Record<string, number> = {
  wp_starter_pen: 0, wp_star_lance: 1, wp_golden_compass: 2, wp_arena_scepter: 3, wp_fused_aurora: 4,
};
export const GEAR_ART_CELLS: Record<EquipmentSlotId, number> = { helm: 5, armor: 6, gloves: 7, boots: 8, amulet: 9, weapon: 10 };
export const ITEM_ART_CELLS: Record<BattleItemId, number> = { wisdom_potion: 11, combo_charm: 12, shield_scroll: 13, time_hourglass: 14, forge_guard: 15 };
export function weaponArtCell(weapon: Pick<WeaponInstance, 'templateId' | 'isFused'>): number {
  return weapon.isFused ? 4 : WEAPON_ART_CELLS[weapon.templateId] ?? 0;
}
export function equipmentArtTier(level: number): 0 | 1 | 2 | 3 {
  return level >= 15 ? 3 : level >= 10 ? 2 : level >= 5 ? 1 : 0;
}
export function heroArtPath(appearance: EquipmentAppearance): AscensionPath {
  if (appearance.heroClassBranch && appearance.heroClassBranch !== 'none') return {blade:'inferno',arcane:'mythic',guardian:'hero'}[appearance.heroClassBranch] as AscensionPath;
  if (appearance.weapon.ascensionPath !== 'base') return appearance.weapon.ascensionPath;
  return (['base', 'hero', 'mythic', 'inferno'] as const)[equipmentArtTier(appearance.equipment.armor)];
}
export function appearanceSignature(appearance: EquipmentAppearance): string {
  return [appearance.weapon.templateId, appearance.weapon.ascensionPath, appearance.weapon.enhanceLevel, Boolean(appearance.weapon.isFused),
    ...(['weapon', 'helm', 'armor', 'gloves', 'boots', 'amulet'] as const).map((slot) => appearance.equipment[slot] ?? 1)].join(':');
}
