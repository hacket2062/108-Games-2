import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyXpGain,
  calculateCombatDamage,
  calculatePvPAttackDamage,
  calculatePvPRatingDelta,
  calculateStarRating,
  canFuseZombies,
  computeMathTowerDamage,
  computeWeaponPower,
  getComboMultiplier,
  getSpeedGrade,
  getSpeedMultiplier,
} from './combatMath.ts';
import {
  ALL_QUESTIONS,
  CHINESE_QUESTIONS,
  ENGLISH_QUESTIONS,
  getPvPMixedQuestions,
  MATH_QUESTIONS,
  SCIENCE_QUESTIONS,
} from '../data/questionBank.ts';
import { createStarterWeapon } from '../data/itemsAndGems.ts';

test('combat damage formula matches speed, combo cap, 3-path ascension, and minimum damage rules', () => {
  assert.equal(getSpeedMultiplier('PERFECT'), 1.5);
  assert.equal(getSpeedMultiplier('GREAT'), 1.25);
  assert.equal(getSpeedMultiplier('GOOD'), 1.0);
  assert.equal(getComboMultiplier(0), 1.0);
  assert.equal(getComboMultiplier(5), 1.5);
  assert.equal(getComboMultiplier(25), 2.0); // capped at 2.0x

  const res = calculateCombatDamage({
    baseAttack: 30,
    skillMultiplier: 1.5,
    isCorrect: true,
    speedGrade: 'PERFECT',
    combo: 5,
    weaponPath: 'base',
  });
  // 30 * 1.5 * 1.5 * 1.5 = 101.25 -> 101
  assert.equal(res.damage, 101);
  assert.equal(res.isBurst, true);
  assert.equal(res.isCritical, true);

  const infernoRes = calculateCombatDamage({
    baseAttack: 30,
    skillMultiplier: 1.5,
    isCorrect: true,
    speedGrade: 'GOOD',
    combo: 0,
    weaponPath: 'inferno',
  });
  assert.ok(infernoRes.damage > 45, 'Inferno ascension path must amplify attack damage');

  const wrongRes = calculateCombatDamage({
    baseAttack: 50,
    skillMultiplier: 2,
    isCorrect: false,
    speedGrade: 'PERFECT',
    combo: 10,
  });
  assert.equal(wrongRes.damage, 0);
});

test('3-path weapon power, Lv.1-5 gems, and PvP balance/Elo math work accurately', () => {
  const baseWp = createStarterWeapon();
  const basePow = computeWeaponPower(baseWp);
  const infernoWp = {
    ...baseWp,
    enhanceLevel: 10,
    ascensionPath: 'inferno' as const,
    socketedGems: [
      { uid: 'g1', element: 'gear_topaz' as const, level: 5 as const },
      { uid: 'g2', element: 'leaf_emerald' as const, level: 4 as const },
      null,
    ],
  };
  const infernoPow = computeWeaponPower(infernoWp);
  assert.ok(infernoPow.attack > basePow.attack + 60);
  assert.ok(infernoPow.hp > basePow.hp + 60);
  assert.ok(infernoPow.critChance > basePow.critChance);

  const pvpDmg = calculatePvPAttackDamage({
    speedGrade: 'PERFECT',
    combo: 3,
    weaponPath: 'mythic',
    weaponEnhanceLevel: 10,
    critChance: 0.2,
    targetShieldMitigation: 0.1,
  });
  assert.ok(pvpDmg.damage >= 40 && pvpDmg.damage <= 130);

  const winDelta = calculatePvPRatingDelta(1000, 1000, true);
  const loseDelta = calculatePvPRatingDelta(1000, 1000, false);
  assert.ok(winDelta >= 16);
  assert.ok(loseDelta <= -8);
});

test('leveling, speed grading, and star ratings behave accurately', () => {
  assert.equal(getSpeedGrade(2, 12, 'adventure'), 'PERFECT');
  assert.equal(getSpeedGrade(10, 12, 'practice'), 'GREAT');
  assert.equal(calculateStarRating(false, 10, 10, 1), 0);
  assert.equal(calculateStarRating(true, 9, 10, 0.8), 3);

  const lvl = applyXpGain(1, 100, 50);
  assert.equal(lvl.level, 2);
  assert.equal(lvl.xp, 30);
  assert.equal(lvl.leveledUp, true);
});

test('108 Curriculum question bank has 240+ verified questions & deterministic PvP decks', () => {
  assert.ok(ALL_QUESTIONS.length >= 240, `Expected 240+ questions, got ${ALL_QUESTIONS.length}`);
  assert.ok(CHINESE_QUESTIONS.length >= 60);
  assert.ok(ENGLISH_QUESTIONS.length >= 60);
  assert.ok(MATH_QUESTIONS.length >= 60);
  assert.ok(SCIENCE_QUESTIONS.length >= 56);

  for (const grade of [3, 4, 5, 6] as const) {
    assert.ok(CHINESE_QUESTIONS.filter((q) => q.grade === grade).length >= 14);
    assert.ok(ENGLISH_QUESTIONS.filter((q) => q.grade === grade).length >= 14);
    assert.ok(MATH_QUESTIONS.filter((q) => q.grade === grade).length >= 14);
    assert.ok(SCIENCE_QUESTIONS.filter((q) => q.grade === grade).length >= 13);

    const deckA = getPvPMixedQuestions(grade, 'all', 123456);
    const deckB = getPvPMixedQuestions(grade, 'all', 123456);
    assert.ok(deckA.length >= 20, `Grade ${grade} PvP deck must have 20+ cards`);
    assert.deepEqual(
      deckA.map((c) => c.id),
      deckB.map((c) => c.id),
      'Seeded PvP deck must be deterministic across clients'
    );
  }

  for (const q of CHINESE_QUESTIONS) {
    if (q.payload.mode === 'typo') {
      assert.equal(
        q.payload.sentence[q.payload.typoIndex],
        q.payload.wrongChar,
        `Chinese typo index mismatch on ${q.id}`
      );
    }
    if (q.payload.mode === 'radical') {
      assert.ok(q.payload.pool.includes(q.payload.partA), `${q.id} missing partA`);
      assert.ok(q.payload.pool.includes(q.payload.partB), `${q.id} missing partB`);
    }
  }

  for (const q of SCIENCE_QUESTIONS) {
    const correctCount = q.payload.ingredients.filter((i) => i.isCorrect).length;
    assert.equal(correctCount, q.payload.neededCount, `Science ${q.id} neededCount mismatch`);
  }
});

test('Math Tower Defense hardcore armor scratch damage and zombie fusion rules', () => {
  // Un-overclocked tower hitting armored zombie deals only 10% scratch damage!
  const scratched = computeMathTowerDamage(50, 80, false);
  assert.equal(scratched.hpDamage, 5);
  assert.equal(scratched.armorDamage, 5);
  assert.equal(scratched.pierced, false);

  // Overclocked tower (after solving math) shatters armor and deals full damage!
  const overclocked = computeMathTowerDamage(50, 80, true);
  assert.equal(overclocked.hpDamage, 50);
  assert.ok(overclocked.armorDamage >= 70);
  assert.equal(overclocked.pierced, true);

  // Unarmored zombie takes 100% damage even without overclock
  const unarmored = computeMathTowerDamage(50, 0, false);
  assert.equal(unarmored.hpDamage, 50);
  assert.equal(unarmored.armorDamage, 0);
  assert.equal(unarmored.pierced, true);

  // Zombie fusion: two distinct nearby non-boss zombies on normalized x (0..1) can fuse
  assert.equal(
    canFuseZombies(
      { kind: 'zero', lane: 1, x: 0.5 },
      { kind: 'bucket', lane: 1, x: 0.54 }
    ),
    true
  );
  // Same kind cannot fuse
  assert.equal(
    canFuseZombies(
      { kind: 'zero', lane: 1, x: 0.5 },
      { kind: 'zero', lane: 1, x: 0.52 }
    ),
    false
  );
  // Boss or fusion mutant cannot fuse again
  assert.equal(
    canFuseZombies(
      { kind: 'boss', lane: 1, x: 0.5 },
      { kind: 'sprinter', lane: 1, x: 0.52 }
    ),
    false
  );
  assert.equal(
    canFuseZombies(
      { kind: 'fusion', lane: 1, x: 0.5 },
      { kind: 'mage', lane: 1, x: 0.52 }
    ),
    false
  );
  // Too far apart cannot fuse
  assert.equal(
    canFuseZombies(
      { kind: 'sprinter', lane: 0, x: 0.25 },
      { kind: 'hopper', lane: 2, x: 0.72 }
    ),
    false
  );
});

import { computeClassDamageBonus } from './combatMath.ts';
import { applyDeadzone, transformStickForJoyCon } from './gamepadManager.ts';
import {
  BESTIARY_CATALOG,
  canAdvanceHeroTier,
  canSelectHeroClass,
  getBestiaryBonusPercent,
  rollEliteAffixes,
  rollRoguelikeChoices,
} from '../data/heroProgression.ts';

test('Hero tier advancement, 3-branch 6-class unlocks, class damage multipliers, and Bestiary bonus', () => {
  const mkProg = (
    tier: 1 | 2 | 3 | 4,
    badges: number,
    classId: 'novice' | 'star_swordsman' | 'element_mage' = 'novice'
  ) => ({
    tier,
    classBranch: classId === 'novice' ? ('none' as const) : classId === 'star_swordsman' ? ('blade' as const) : ('arcane' as const),
    classId,
    badges,
    secondaryGuardian: 'stardragon' as const,
  });

  assert.equal(canAdvanceHeroTier(9, 9999, mkProg(1, 10)).ok, false);
  assert.equal(canAdvanceHeroTier(10, 9999, mkProg(1, 5)).ok, false);
  assert.equal(canAdvanceHeroTier(10, 9999, mkProg(1, 6)).ok, true);
  assert.equal(canAdvanceHeroTier(25, 9999, mkProg(2, 14)).ok, true);
  assert.equal(canAdvanceHeroTier(40, 9999, mkProg(3, 25)).ok, true);
  assert.equal(canAdvanceHeroTier(60, 9999, mkProg(4, 99)).ok, false);

  assert.equal(canSelectHeroClass('star_swordsman', mkProg(1, 10, 'novice')).ok, false);
  assert.equal(canSelectHeroClass('star_swordsman', mkProg(2, 10, 'novice')).ok, true);
  assert.equal(canSelectHeroClass('peerless_warlord', mkProg(2, 10, 'star_swordsman')).ok, false);
  assert.equal(canSelectHeroClass('peerless_warlord', mkProg(3, 10, 'star_swordsman')).ok, true);

  assert.ok(computeClassDamageBonus('peerless_warlord', 5, true) > 1.3);
  assert.ok(computeClassDamageBonus('novice', 0, false) === 1);

  assert.equal(rollEliteAffixes(10, 42).length, 2);
  assert.equal(rollRoguelikeChoices(7).length, 3);
  assert.equal(new Set(rollRoguelikeChoices(7).map((r) => r.id)).size, 3);

  assert.equal(BESTIARY_CATALOG.length >= 16, true);
  assert.equal(getBestiaryBonusPercent([]), 0);
  assert.equal(getBestiaryBonusPercent(['a', 'b', 'c']), 3);
});

test('Bluetooth Switch Gamepad deadzone (0.18) and 90-degree Single Joy-Con rotation math', () => {
  assert.equal(applyDeadzone(0.1), 0);
  assert.equal(applyDeadzone(-0.17), 0);
  assert.ok(applyDeadzone(0.5) > 0.3 && applyDeadzone(0.5) < 0.5);
  assert.equal(applyDeadzone(1), 1);

  const fx = applyDeadzone(0.8);
  const fy = applyDeadzone(-0.4);
  const normal = transformStickForJoyCon(0.8, -0.4, false);
  assert.deepEqual(normal, { x: fx, y: fy });
  const rotatedLeft = transformStickForJoyCon(0.8, -0.4, true, false);
  assert.deepEqual(rotatedLeft, { x: fy, y: -fx });
  const rotatedRight = transformStickForJoyCon(0.8, -0.4, true, true);
  assert.deepEqual(rotatedRight, { x: -fy, y: fx });
});


