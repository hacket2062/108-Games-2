import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyXpGain,
  calculateCombatDamage,
  calculatePvPAttackDamage,
  calculatePvPRatingDelta,
  calculateStarRating,
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
