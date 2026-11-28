import test from 'node:test';
import assert from 'node:assert/strict';
import { getChineseQuestions, getEnglishQuestions } from '../data/questionBank';
import { createRunReview, selectReviewRecords } from './runReview';
import { readTutorialProgress, saveTutorialProgress, tutorialStorageKey } from './tutorialProgress';
import type { WrongRecord } from '../types/game';

test('tutorial preferences are isolated by account, preserve unrelated saves and distinguish skips', () => {
  const data = new Map<string, string>([['player-save', 'keep-existing-assets']]);
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  const studentA = tutorialStorageKey('local', 'a');
  const studentB = tutorialStorageKey('local', 'b');
  saveTutorialProgress(storage, studentA, { chinese: 'completed', english: 'skipped' });
  assert.deepEqual(readTutorialProgress(storage, studentA), { chinese: 'completed', english: 'skipped' });
  assert.deepEqual(readTutorialProgress(storage, studentB), {});
  assert.notEqual(tutorialStorageKey('google', 'a'), studentA);
  assert.equal(data.get('player-save'), 'keep-existing-assets');
});

test('corrupt or unavailable tutorial storage falls back without blocking play', () => {
  for (const value of ['bad-json', 'null', '[]', '{"chinese":true,"math":"completed","unknown":"completed"}']) {
    const result = readTutorialProgress({ getItem: () => value }, 'key');
    assert.deepEqual(result, value.startsWith('{') ? { math: 'completed' } : {});
  }
  assert.deepEqual(readTutorialProgress({ getItem: () => { throw new Error('blocked'); } }, 'key'), {});
  assert.doesNotThrow(() => saveTutorialProgress({ setItem: () => { throw new Error('quota'); } }, 'key', { math: 'completed' }));
});

test('run review records only current subject/grade, keeps unique wrong questions and freezes at settlement', () => {
  const question = getChineseQuestions(4, 'upper')[0];
  const review = createRunReview('new-run', 'chinese', 4);
  assert.equal(review.record('old-run', question, false), false);
  assert.equal(review.record('new-run', getEnglishQuestions(4, 'upper')[0], false), false);
  assert.equal(review.record('new-run', { ...question, grade: 3 }, false), false);
  assert.equal(review.record('new-run', question, false), true);
  assert.equal(review.record('new-run', question, false), true);
  assert.equal(review.record('new-run', question, true), true);
  assert.equal(review.finish('old-run'), null);
  const result = review.finish('new-run');
  assert.equal(result?.length, 1);
  assert.equal(result?.[0].questionId, question.id);
  assert.equal(review.record('new-run', question, false), false);
  assert.equal(review.finish('new-run'), null);
  assert.deepEqual(createRunReview('retry', 'chinese', 4).finish('retry'), []);
});

test('recent review filters and highlights only this run without mutating historical records', () => {
  const base: WrongRecord = { questionId: 'old', subject: 'math', grade: 4, prompt: '題目', correctAnswer: '5', explanation: '解析', knowledgeTag: '加法', wrongCount: 1, lastWrongAt: 100 };
  const records = [base, { ...base, questionId: 'recent', lastWrongAt: 10 }, { ...base, questionId: 'other-subject', subject: 'english' as const }];
  const original = structuredClone(records);
  const focus = { subject: 'math' as const, questionIds: ['recent', 'removed'] };
  assert.deepEqual(selectReviewRecords(records, 'math', focus, true).map((r) => r.questionId), ['recent']);
  assert.deepEqual(selectReviewRecords(records, 'math', focus).map((r) => r.questionId), ['recent', 'old']);
  assert.equal(selectReviewRecords(records, 'all').length, 3);
  assert.deepEqual(records, original);
});
