import test from 'node:test';
import assert from 'node:assert/strict';
import { canEnterStage, effectivePlayMode, getLearningFeedback, recordsCampaignProgress } from './gameExperience';
import { createInitialPlayerSave } from './playerSave';
import { getStageConfig } from '../data/campaignMap';

test('adventure cannot start a locked stage, while ordinary and parent-forced practice can', () => {
  const save = createInitialPlayerSave();
  const stage = getStageConfig('science', save.grade, 3, 10);
  assert.equal(canEnterStage(stage, save), false);
  save.playMode = 'practice';
  assert.equal(canEnterStage(stage, save), true);
  save.playMode = 'adventure';
  save.parentSettings.forcePracticeMode = true;
  assert.equal(effectivePlayMode(save), 'practice');
  assert.equal(canEnterStage(stage, save), true);
  assert.deepEqual(save.stageProgress, {});
});

test('practice results never qualify for campaign writes, even when carrying a boss stage key', () => {
  const stageKey = 'math_g4_c3_s10';
  assert.equal(recordsCampaignProgress({ stageKey, playMode: 'practice' }), false);
  assert.equal(recordsCampaignProgress({ stageKey, playMode: 'adventure' }), true);
  assert.equal(recordsCampaignProgress({ stageKey }), true, 'legacy adventure results remain compatible');
  assert.equal(recordsCampaignProgress({ playMode: 'adventure' }), false);
});

test('no attempts produce no accuracy, including a nominal victory', () => {
  for (const victory of [true, false]) {
    const feedback = getLearningFeedback({ victory, correctCount: 0, totalAttempts: 0 });
    assert.equal(feedback.accuracy, null);
    assert.match(feedback.message, /還沒有作答紀錄/);
  }
});

test('learning feedback describes actual attempts without inventing mastery or near-wins', () => {
  assert.equal(getLearningFeedback({ victory: false, correctCount: 2, totalAttempts: 3 }).accuracy, 67);
  assert.match(getLearningFeedback({ victory: false, correctCount: 0, totalAttempts: 3 }).message, /先挑一道錯題/);
  assert.match(getLearningFeedback({ victory: true, correctCount: 3, totalAttempts: 3 }).message, /這一回合的題目都答對/);
});
