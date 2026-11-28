import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_QUESTIONS,
  getChineseQuestions,
  getEnglishQuestions,
  getMathQuestions,
  getScienceQuestions,
} from '../data/questionBank';
import { QuestionManager } from './questionManager';
import {
  getChaptersForWorld,
  getStageConfig,
  isStageUnlocked,
  getWorldTotalStars,
} from '../data/campaignMap';
import { GradeLevel, StageProgressRecord, SubjectId } from '../types/game';

test('Question bank has 400+ original Taiwan 108 Curriculum questions with >= 25 per grade × subject and unique IDs', () => {
  assert.ok(ALL_QUESTIONS.length >= 400, `Expected >= 400 questions, got ${ALL_QUESTIONS.length}`);

  const ids = new Set<string>();
  for (const q of ALL_QUESTIONS) {
    assert.ok(!ids.has(q.id), `Duplicate question ID detected: ${q.id}`);
    ids.add(q.id);
    assert.ok(q.prompt.trim().length > 0, `Empty prompt on ${q.id}`);
    assert.ok(q.explanation.trim().length > 0, `Empty explanation on ${q.id}`);
    assert.ok(q.knowledgeTag.trim().length > 0, `Empty knowledgeTag on ${q.id}`);
  }

  const subjects: SubjectId[] = ['chinese', 'english', 'math', 'science'];
  const grades: GradeLevel[] = [1, 2, 3, 4, 5, 6];
  for (const s of subjects) {
    for (const g of grades) {
      const bucket = ALL_QUESTIONS.filter((q) => q.subject === s && q.grade === g);
      assert.ok(
        bucket.length >= 25,
        `Expected >= 25 questions for ${s} grade ${g}, got ${bucket.length}`
      );
    }
  }

  for (const g of grades) {
    assert.ok(getChineseQuestions(g, 'upper', 'slash').length > 0);
    assert.ok(getChineseQuestions(g, 'upper', 'radical').length > 0);
    assert.ok(getChineseQuestions(g, 'upper', 'typo').length > 0);
    assert.ok(getEnglishQuestions(g, 'upper', 'listen').length > 0);
    assert.ok(getEnglishQuestions(g, 'upper', 'spell').length > 0);
    assert.ok(getMathQuestions(g, 'upper').length > 0);
    assert.ok(getScienceQuestions(g, 'upper').length > 0);
  }
});

test('QuestionManager guarantees zero repeats inside a full pass and prioritizes wrong -> focus -> unmastered -> mastered', () => {
  const realSample = getMathQuestions(4, 'upper').slice(0, 4);
  assert.equal(realSample.length, 4);

  const [qMastered, qGeneral, qFocus, qWrong] = realSample;
  const focusTag = '__FOCUS_TEST_TAG__';
  const pool = [
    { ...qMastered, id: 'q-mastered', knowledgeTag: '其他' },
    { ...qGeneral, id: 'q-general', knowledgeTag: '一般' },
    { ...qFocus, id: 'q-focus', knowledgeTag: focusTag },
    { ...qWrong, id: 'q-wrong', knowledgeTag: '錯題' },
  ];

  const mgr = new QuestionManager(pool, {
    wrongQuestionIds: ['q-wrong'],
    focusTags: [focusTag],
    masteredQuestionIds: ['q-mastered'],
  });

  const drawn = [mgr.next().id, mgr.next().id, mgr.next().id, mgr.next().id];
  assert.deepEqual(drawn, ['q-wrong', 'q-focus', 'q-general', 'q-mastered']);
  assert.equal(new Set(drawn).size, 4, 'Zero duplicates within single pass');

  const fifth = mgr.next().id;
  assert.notEqual(fifth, 'q-mastered', 'Should never immediately repeat the previous question on recycle');
});

test('Campaign map has 3 chapters × 10 progressive stages per subject/grade with Stage 7 Elite, Stage 10 Mega-Boss, and sequential unlock', () => {
  const subjects: SubjectId[] = ['chinese', 'english', 'math', 'science'];
  for (const s of subjects) {
    const chapters = getChaptersForWorld(s, 4);
    assert.equal(chapters.length, 3, `${s} should have 3 chapters`);

    for (const ch of chapters) {
      assert.equal(ch.stages.length, 10, `${s} ch${ch.chapterIndex} should have 10 stages`);
      assert.equal(ch.stages[0].tier, 'explore');
      assert.equal(ch.stages[3].tier, 'trial');
      assert.equal(ch.stages[6].tier, 'elite');
      assert.equal(ch.stages[7].tier, 'brawl');
      assert.equal(ch.stages[9].tier, 'boss');
      assert.ok(ch.stages[9].enemyName.length > 0);
      assert.ok(ch.stages[9].starChestReward && ch.stages[9].starChestReward.label.length > 0);
    }

    const stage1 = getStageConfig(s, 4, 1, 1);
    const stage2 = getStageConfig(s, 4, 1, 2);
    const ch2Stage1 = getStageConfig(s, 4, 2, 1);
    const ch1Stage10 = getStageConfig(s, 4, 1, 10);

    assert.equal(isStageUnlocked(stage1, {}), true, 'Stage 1-1 always unlocked');
    assert.equal(isStageUnlocked(stage2, {}), false, 'Stage 1-2 locked initially');

    const progressAfter1: Record<string, StageProgressRecord> = {
      [stage1.stageKey]: { cleared: true, stars: 3, bestScore: 1200 },
    };
    assert.equal(isStageUnlocked(stage2, progressAfter1), true, 'Stage 1-2 unlocks after clearing 1-1');
    assert.equal(isStageUnlocked(ch2Stage1, progressAfter1), false, 'Ch2-1 locked until Ch1-10 cleared');

    const progressAfterCh1Boss: Record<string, StageProgressRecord> = {
      ...progressAfter1,
      [ch1Stage10.stageKey]: { cleared: true, stars: 2, bestScore: 2500 },
    };
    assert.equal(isStageUnlocked(ch2Stage1, progressAfterCh1Boss), true, 'Ch2-1 unlocks after Ch1-10 cleared');
    assert.equal(getWorldTotalStars(s, 4, progressAfterCh1Boss).earned, 5);
  }
});

import { generateProceduralMathQuestions } from '../data/proceduralQuestions';

test('Expanded 108-curriculum question pool reaches 600+ and procedural math generator produces valid distinct options for Grades 3-6', () => {
  assert.ok(ALL_QUESTIONS.length >= 600, `Expected >= 600 questions, got ${ALL_QUESTIONS.length}`);

  for (const g of [3, 4, 5, 6] as const) {
    const batchA = generateProceduralMathQuestions(g, 'upper', 1, 8);
    const batchB = generateProceduralMathQuestions(g, 'lower', 10, 8);
    assert.equal(batchA.length, 8);
    assert.equal(batchB.length, 8);
    for (const q of [...batchA, ...batchB]) {
      assert.equal(q.grade, g);
      assert.equal(q.payload.options.length, 4);
      assert.equal(new Set(q.payload.options).size, 4, `Duplicate math option on ${q.id}`);
      assert.equal(q.payload.options[q.payload.correctIndex], q.answer);
    }
  }
});

