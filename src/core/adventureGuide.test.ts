import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialPlayerSave } from './playerSave';
import { getNextAdventure } from './adventureGuide';
import { getChaptersForWorld, isStageUnlocked } from '../data/campaignMap';

test('adventure guide starts at an unlocked stage and never mutates a new save', () => {
  const save = createInitialPlayerSave();
  const before = structuredClone(save);
  const { stage, replay } = getNextAdventure(save);
  assert.equal(stage.subject, 'chinese');
  assert.equal(stage.stageNumber, 1);
  assert.equal(replay, false);
  assert.equal(isStageUnlocked(stage, save.stageProgress), true);
  assert.deepEqual(save, before);
});

test('adventure guide advances after a clear and respects chapter boss gates', () => {
  const save = createInitialPlayerSave();
  save.stageProgress = {};
  const stages = getChaptersForWorld('chinese', save.grade).flatMap((c) => c.stages);
  for (const stage of stages.slice(0, 9)) {
    save.stageProgress[stage.stageKey] = { cleared: true, stars: 1, bestScore: 100 };
  }
  assert.equal(getNextAdventure(save).stage.stageKey, stages[9].stageKey);
  save.stageProgress[stages[9].stageKey] = { cleared: true, stars: 1, bestScore: 100 };
  assert.equal(getNextAdventure(save).stage.stageKey, stages[10].stageKey);
});

test('adventure guide uses latest same-grade subject and ignores PvP and other grades', () => {
  const save = createInitialPlayerSave();
  const entry = { id: 'run', timestamp: 1, subject: 'math' as const, grade: save.grade,
    correctCount: 1, totalAttempts: 1, score: 1, durationSeconds: 10, victory: true, note: '' };
  save.trajectory = [
    { ...entry, timestamp: 3, subject: 'science' },
    { ...entry, timestamp: 2 },
    { ...entry, timestamp: 4, subject: 'pvp' },
    { ...entry, timestamp: 5, grade: save.grade === 6 ? 3 : 6 },
  ];
  assert.equal(getNextAdventure(save).stage.subject, 'science');
});

test('adventure guide offers a replay after all stages are cleared', () => {
  const save = createInitialPlayerSave();
  save.stageProgress = {};
  const stages = getChaptersForWorld('chinese', save.grade).flatMap((c) => c.stages);
  for (const stage of stages) save.stageProgress[stage.stageKey] = { cleared: true, stars: 3, bestScore: 100 };
  const next = getNextAdventure(save);
  assert.equal(next.stage.stageKey, stages[29].stageKey);
  assert.equal(next.replay, true);
});
