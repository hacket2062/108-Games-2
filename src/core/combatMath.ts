import type {
  AscensionPath,
  EffectiveCombatStats,
  EquipmentLevels,
  GuardianId,
  PlayMode,
  PlayerSaveData,
  SpeedGrade,
  SubjectStats,
  WeaponInstance,
} from '../types/game';
import { ASCENSION_PATHS, GEM_ELEMENTS } from '../data/itemsAndGems';

export interface DamageCalculationInput {
  baseAttack: number;
  skillMultiplier: number;
  isCorrect: boolean;
  speedGrade: SpeedGrade;
  combo: number;
  guardianId?: GuardianId;
  doubleNextAttack?: boolean;
  weaponPath?: AscensionPath;
  critChance?: number;
}

export interface DamageCalculationResult {
  damage: number;
  speedMultiplier: number;
  comboMultiplier: number;
  isCritical: boolean;
  isBurst: boolean;
}

export function getSpeedGrade(
  elapsedSeconds: number,
  timeLimitSeconds: number,
  playMode: PlayMode,
  guardianId?: GuardianId
): SpeedGrade {
  if (playMode === 'practice') {
    return elapsedSeconds <= 6 ? 'PERFECT' : 'GREAT';
  }
  const extraGrace = guardianId === 'griffin' ? 2 : 0;
  const effectiveLimit = Math.max(4, timeLimitSeconds + extraGrace);
  const ratio = elapsedSeconds / effectiveLimit;
  if (ratio <= 0.38) return 'PERFECT';
  if (ratio <= 0.72) return 'GREAT';
  return 'GOOD';
}

export function getSpeedMultiplier(speedGrade: SpeedGrade, guardianId?: GuardianId): number {
  const starBonus = guardianId === 'stardragon' && speedGrade === 'PERFECT' ? 0.15 : 0;
  switch (speedGrade) {
    case 'PERFECT':
      return Number((1.5 + starBonus).toFixed(2));
    case 'GREAT':
      return 1.25;
    case 'GOOD':
    default:
      return 1.0;
  }
}

export function getComboMultiplier(combo: number): number {
  const clampedCombo = Math.max(0, Math.floor(combo));
  return Number(Math.min(2.0, 1 + 0.1 * clampedCombo).toFixed(2));
}

export function calculateCombatDamage(input: DamageCalculationInput): DamageCalculationResult {
  const correctFactor = input.isCorrect ? 1.0 : 0;
  if (correctFactor === 0) {
    return {
      damage: 0,
      speedMultiplier: 1.0,
      comboMultiplier: 1.0,
      isCritical: false,
      isBurst: false,
    };
  }

  const speedMultiplier = getSpeedMultiplier(input.speedGrade, input.guardianId);
  const comboMultiplier = getComboMultiplier(input.combo);
  const qilinBonus = input.guardianId === 'qilin' ? 1.12 : 1.0;
  const activeBoost = input.doubleNextAttack ? 2.0 : 1.0;
  const pathBonus = input.weaponPath ? ASCENSION_PATHS[input.weaponPath].attackMultiplier : 1.0;
  const critRoll =
    input.critChance && input.critChance > 0 && Math.random() < input.critChance ? 1.25 : 1.0;

  const raw =
    input.baseAttack *
    qilinBonus *
    pathBonus *
    input.skillMultiplier *
    correctFactor *
    speedMultiplier *
    comboMultiplier *
    activeBoost *
    critRoll;

  const damage = Math.max(1, Math.round(raw));
  const isBurst = input.combo >= 5;
  const isCritical =
    input.speedGrade === 'PERFECT' ||
    input.doubleNextAttack === true ||
    isBurst ||
    critRoll > 1.0;

  return {
    damage,
    speedMultiplier,
    comboMultiplier,
    isCritical,
    isBurst,
  };
}

/**
 * Balanced PvP Arena attack formula:
 * Weapon ascension & enhance level grant a rewarding edge (capped at +22%) so knowledge speed & combo remain decisive!
 */
export function calculatePvPAttackDamage(params: {
  speedGrade: SpeedGrade;
  combo: number;
  weaponPath: AscensionPath;
  weaponEnhanceLevel: number;
  critChance: number;
  targetShieldMitigation: number;
  isUltimate?: boolean;
}): { damage: number; isCritical: boolean } {
  const base = params.isUltimate ? 72 : 34;
  const speedMult = getSpeedMultiplier(params.speedGrade);
  const comboMult = Math.min(1.7, 1 + Math.max(0, params.combo - 1) * 0.12);
  const forgeBonus = Math.min(0.22, params.weaponEnhanceLevel * 0.012 + (params.weaponPath === 'inferno' ? 0.08 : params.weaponPath === 'mythic' ? 0.05 : params.weaponPath === 'hero' ? 0.03 : 0));
  const isCritical = params.speedGrade === 'PERFECT' || params.combo >= 4 || Math.random() < params.critChance;
  const critMult = isCritical ? 1.22 : 1.0;
  const mitigation = Math.min(0.22, Math.max(0, params.targetShieldMitigation));
  const damage = Math.max(
    12,
    Math.round(base * speedMult * comboMult * (1 + forgeBonus) * critMult * (1 - mitigation))
  );
  return { damage, isCritical };
}

export function calculatePvPRatingDelta(
  myRating: number,
  opponentRating: number,
  victory: boolean
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
  const k = 36;
  const raw = Math.round(k * ((victory ? 1 : 0) - expected));
  if (victory) return Math.max(16, raw);
  return Math.min(-8, Math.max(-24, raw));
}

export function getUltimateChargeGain(
  speedGrade: SpeedGrade,
  combo: number,
  guardianId?: GuardianId,
  extraUltBonus = 0
): number {
  const base = speedGrade === 'PERFECT' ? 28 : speedGrade === 'GREAT' ? 22 : 16;
  const comboBonus = Math.min(12, Math.floor(combo / 2) * 3);
  const qilinBonus = guardianId === 'qilin' ? 8 : 0;
  return base + comboBonus + qilinBonus + extraUltBonus;
}

export function computeWeaponPower(weapon: WeaponInstance): {
  attack: number;
  hp: number;
  critChance: number;
  ultBonus: number;
  shieldMitigation: number;
} {
  const path = ASCENSION_PATHS[weapon.ascensionPath];
  const enhancedAtk = Math.round((weapon.baseAttack + weapon.enhanceLevel * 5.5) * path.attackMultiplier);
  let gemAtk = 0;
  let gemHp = 0;
  let gemCrit = 0;
  let gemUlt = 0;

  for (const gem of weapon.socketedGems) {
    if (!gem) continue;
    const def = GEM_ELEMENTS[gem.element];
    gemAtk += def.attackPerLevel * gem.level;
    gemHp += def.hpPerLevel * gem.level;
    gemCrit += def.critPerLevel * gem.level;
    gemUlt += def.ultBonusPerLevel * gem.level;
  }

  return {
    attack: enhancedAtk + gemAtk,
    hp: path.hpBonus + gemHp,
    critChance: Number(Math.min(0.65, path.critBonus + gemCrit).toFixed(3)),
    ultBonus: path.ultBonus + gemUlt,
    shieldMitigation: path.shieldMitigation,
  };
}

export function computePlayerCombatStats(
  level: number,
  equipment: EquipmentLevels,
  guardianId: GuardianId,
  bondLevel: number,
  equippedWeapon?: WeaponInstance | null
): EffectiveCombatStats {
  const weaponPower = equippedWeapon
    ? computeWeaponPower(equippedWeapon)
    : {
        attack: equipment.weapon * 6,
        hp: 0,
        critChance: 0.05,
        ultBonus: 0,
        shieldMitigation: 0,
      };

  const baseAttack = Math.round(18 + (level - 1) * 4 + weaponPower.attack + bondLevel * 1.5 + Math.max(0, equipment.weapon - 1) * 2);
  const rawMaxHp = 100 + (level - 1) * 10 + equipment.armor * 16 + weaponPower.hp + bondLevel * 4 + Math.max(0, (equipment.helm ?? 1) - 1) * 12;
  const maxHp = Math.round(guardianId === 'deer' ? rawMaxHp * 1.2 : rawMaxHp);
  const speedBonus = Number((equipment.boots * 0.06).toFixed(2));

  return {
    baseAttack,
    maxHp,
    speedBonus,
    bondLevel,
    critChance: Math.min(0.65, weaponPower.critChance + Math.max(0, (equipment.gloves ?? 1) - 1) * 0.012),
    shieldMitigation: weaponPower.shieldMitigation,
    ultChargeBonus: weaponPower.ultBonus + Math.max(0, (equipment.amulet ?? 1) - 1) * 5,
    weaponPath: equippedWeapon?.ascensionPath ?? 'base',
    weaponEnhanceLevel: equippedWeapon?.enhanceLevel ?? 0,
    weaponName: equippedWeapon?.name ?? '學園墨光短刃',
  };
}

export function computeSaveCombatStats(save: PlayerSaveData): EffectiveCombatStats {
  const equipped =
    save.weapons.find((w) => w.uid === save.equippedWeaponUid) ?? save.weapons[0] ?? null;
  const stats = computePlayerCombatStats(
    save.level,
    save.equipment,
    save.selectedGuardian,
    save.guardianBonds[save.selectedGuardian] ?? 1,
    equipped
  );
  if (save.level >= 5) {
    if (save.characterJob === 'sentinel') stats.maxHp = Math.round(stats.maxHp * 1.15);
    if (save.characterJob === 'arcanist') stats.baseAttack = Math.round(stats.baseAttack * 1.1);
    if (save.characterJob === 'ranger') { stats.speedBonus += .1; stats.critChance = Math.min(.65,stats.critChance+.03); }
  }
  if (save.selectedSkill && save.unlockedSkills?.includes(save.selectedSkill)) {
    if (save.selectedSkill==='star_guard') stats.maxHp=Math.round(stats.maxHp*1.08);
    if (save.selectedSkill==='flame_focus') stats.baseAttack=Math.round(stats.baseAttack*1.06);
  }
  return stats;
}

export function calculateStarRating(
  victory: boolean,
  correctCount: number,
  totalAttempts: number,
  hpRatio: number
): 0 | 1 | 2 | 3 {
  if (!victory) return 0;
  const accuracy = totalAttempts > 0 ? correctCount / totalAttempts : 0;
  if (accuracy >= 0.85 && hpRatio >= 0.5) return 3;
  if (accuracy >= 0.65 || hpRatio >= 0.3) return 2;
  return 1;
}

export function xpRequiredForLevel(level: number): number {
  const n = Math.max(0, Math.min(199, Math.floor(level) - 1));
  return Math.round(120 + n * 90 + n * n * 18);
}

export function applyXpGain(currentLevel: number, currentXp: number, xpEarned: number) {
  let level = currentLevel;
  let xp = currentXp + Math.max(0, Math.round(xpEarned));
  let leveledUp = false;
  while (level < 200 && xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
    leveledUp = true;
  }
  return { level, xp: level >= 200 ? Math.min(xp, xpRequiredForLevel(200) - 1) : xp, leveledUp };
}

export function getStreakTitle(bestStreak: number): string {
  if (bestStreak >= 20) return '傳說智光宗師';
  if (bestStreak >= 12) return '學園星耀勇者';
  if (bestStreak >= 7) return '連擊破陣達人';
  if (bestStreak >= 3) return '閃耀新星學徒';
  return '初階智光見習生';
}

export function getSubjectAccuracyPercent(stats: SubjectStats): number {
  if (stats.answered <= 0) return 0;
  return Math.round((stats.correct / stats.answered) * 100);
}
