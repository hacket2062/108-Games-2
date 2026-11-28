import type {
  AnyQuestion,
  ChineseQuestion,
  EnglishQuestion,
  GradeLevel,
  MathQuestion,
  PvPQuestionCard,
  ScienceQuestion,
  SemesterId,
  SubjectId,
} from '../types/game';
import { CHINESE_QUESTIONS as BASE_CHINESE } from './questions/chineseQuestions';
import { ENGLISH_QUESTIONS as BASE_ENGLISH } from './questions/englishQuestions';
import { MATH_QUESTIONS as BASE_MATH } from './questions/mathQuestions';
import { SCIENCE_QUESTIONS as BASE_SCIENCE } from './questions/scienceQuestions';
import { ADVENTURE_CHINESE, ADVENTURE_ENGLISH, ADVENTURE_MATH, ADVENTURE_SCIENCE } from './questions/adventureExpansion';
import {
  BONUS_CHINESE_QUESTIONS,
  BONUS_ENGLISH_QUESTIONS,
  BONUS_MATH_QUESTIONS,
  BONUS_SCIENCE_QUESTIONS,
} from './questions/bonusQuestions';
import {
  EPIC_CHINESE_QUESTIONS,
  EPIC_ENGLISH_QUESTIONS,
  EPIC_MATH_QUESTIONS,
  EPIC_SCIENCE_QUESTIONS,
} from './questions/epicExpansion';

export const CHINESE_QUESTIONS: ChineseQuestion[] = [
  ...BASE_CHINESE,
  ...BONUS_CHINESE_QUESTIONS,
  ...EPIC_CHINESE_QUESTIONS,
  ...ADVENTURE_CHINESE,
];
export const ENGLISH_QUESTIONS: EnglishQuestion[] = [
  ...BASE_ENGLISH,
  ...BONUS_ENGLISH_QUESTIONS,
  ...EPIC_ENGLISH_QUESTIONS,
  ...ADVENTURE_ENGLISH,
];
export const MATH_QUESTIONS: MathQuestion[] = [
  ...BASE_MATH,
  ...BONUS_MATH_QUESTIONS,
  ...EPIC_MATH_QUESTIONS,
  ...ADVENTURE_MATH,
];
export const SCIENCE_QUESTIONS: ScienceQuestion[] = [
  ...BASE_SCIENCE,
  ...BONUS_SCIENCE_QUESTIONS,
  ...EPIC_SCIENCE_QUESTIONS,
  ...ADVENTURE_SCIENCE,
];

export const ALL_QUESTIONS: AnyQuestion[] = [
  ...CHINESE_QUESTIONS,
  ...ENGLISH_QUESTIONS,
  ...MATH_QUESTIONS,
  ...SCIENCE_QUESTIONS,
];

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let s = Math.max(1, seed % 2147483647);
  const nextRand = () => {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getChineseQuestions(
  grade: GradeLevel,
  semester: SemesterId,
  mode?: 'slash' | 'radical' | 'typo'
): ChineseQuestion[] {
  const byGrade = CHINESE_QUESTIONS.filter((q) => q.grade === grade && (!mode || q.type === mode));
  const exactSemester = byGrade.filter((q) => q.semester === semester);
  const othersInGrade = byGrade.filter((q) => q.semester !== semester);
  return [...shuffleArray(exactSemester), ...shuffleArray(othersInGrade)];
}

export function getEnglishQuestions(
  grade: GradeLevel,
  semester: SemesterId,
  mode?: 'listen' | 'fill' | 'spell'
): EnglishQuestion[] {
  const byGrade = ENGLISH_QUESTIONS.filter((q) => q.grade === grade && (!mode || q.type === mode));
  const exactSemester = byGrade.filter((q) => q.semester === semester);
  const othersInGrade = byGrade.filter((q) => q.semester !== semester);
  return [...shuffleArray(exactSemester), ...shuffleArray(othersInGrade)];
}

export function getMathQuestions(grade: GradeLevel, semester: SemesterId): MathQuestion[] {
  const byGrade = MATH_QUESTIONS.filter((q) => q.grade === grade);
  const exactSemester = byGrade.filter((q) => q.semester === semester);
  const othersInGrade = byGrade.filter((q) => q.semester !== semester);
  return [...shuffleArray(exactSemester), ...shuffleArray(othersInGrade)];
}

export function getScienceQuestions(grade: GradeLevel, semester: SemesterId): ScienceQuestion[] {
  const byGrade = SCIENCE_QUESTIONS.filter((q) => q.grade === grade);
  const exactSemester = byGrade.filter((q) => q.semester === semester);
  const othersInGrade = byGrade.filter((q) => q.semester !== semester);
  return [...shuffleArray(exactSemester), ...shuffleArray(othersInGrade)];
}

export function getQuestionCountBySubject(): Record<SubjectId, number> {
  return {
    chinese: CHINESE_QUESTIONS.length,
    english: ENGLISH_QUESTIONS.length,
    math: MATH_QUESTIONS.length,
    science: SCIENCE_QUESTIONS.length,
  };
}

/**
 * Converts cross-subject 108 Curriculum questions into fast, fair, deterministic PvP Arena cards.
 * Uses `seed` so two online players in the same Firestore room receive the exact same sequence.
 */
export function getPvPMixedQuestions(
  grade: GradeLevel,
  subjectFilter: SubjectId | 'all',
  seed: number
): PvPQuestionCard[] {
  const cards: PvPQuestionCard[] = [];

  const subjects: SubjectId[] =
    subjectFilter === 'all' ? ['chinese', 'english', 'math', 'science'] : [subjectFilter];

  if (subjects.includes('chinese')) {
    for (const q of CHINESE_QUESTIONS) {
      if (q.grade !== grade) continue;
      if (q.payload.mode === 'slash') {
        cards.push({
          id: q.id,
          subject: 'chinese',
          grade: q.grade,
          prompt: q.prompt,
          options: q.payload.options,
          correctIndex: q.payload.correctIndex,
          answer: q.answer,
          explanation: q.explanation,
          knowledgeTag: q.knowledgeTag,
          speakText: q.prompt,
          speakLang: 'zh-TW',
        });
      }
    }
  }

  if (subjects.includes('english')) {
    for (const q of ENGLISH_QUESTIONS) {
      if (q.grade !== grade) continue;
      if (q.payload.mode === 'listen' || q.payload.mode === 'fill') {
        cards.push({
          id: q.id,
          subject: 'english',
          grade: q.grade,
          prompt: `${q.prompt}（${q.payload.zhMeaning}）`,
          options: q.payload.choices,
          correctIndex: q.payload.correctIndex,
          answer: q.answer,
          explanation: q.explanation,
          knowledgeTag: q.knowledgeTag,
          speakText: q.payload.speakText,
          speakLang: 'en-US',
        });
      }
    }
  }

  if (subjects.includes('math')) {
    for (const q of MATH_QUESTIONS) {
      if (q.grade !== grade) continue;
      cards.push({
        id: q.id,
        subject: 'math',
        grade: q.grade,
        prompt: `${q.prompt}【${q.payload.formulaShield}】`,
        options: q.payload.options,
        correctIndex: q.payload.correctIndex,
        answer: q.answer,
        explanation: q.explanation,
        knowledgeTag: q.knowledgeTag,
        speakText: q.prompt,
        speakLang: 'zh-TW',
      });
    }
  }

  if (subjects.includes('science')) {
    for (const q of SCIENCE_QUESTIONS) {
      if (q.grade !== grade) continue;
      const correctIng = q.payload.ingredients.find((i) => i.isCorrect);
      const wrongIngs = q.payload.ingredients.filter((i) => !i.isCorrect);
      if (correctIng && wrongIngs.length >= 2) {
        const rawOpts = [
          correctIng.name,
          wrongIngs[0].name,
          wrongIngs[1].name,
          `${q.payload.targetPhLabel}（純試劑）`,
        ];
        const shuffledOpts = seededShuffle(rawOpts, seed + q.id.length * 13);
        const correctIdx = shuffledOpts.indexOf(correctIng.name);
        cards.push({
          id: q.id,
          subject: 'science',
          grade: q.grade,
          prompt: `【自然實驗】${q.payload.dishName}：哪一項符合「${q.knowledgeTag}」正確食材？`,
          options: shuffledOpts,
          correctIndex: correctIdx,
          answer: correctIng.name,
          explanation: q.explanation,
          knowledgeTag: q.knowledgeTag,
          speakText: `${q.payload.dishName}，哪一項符合${q.knowledgeTag}？`,
          speakLang: 'zh-TW',
        });
      }
    }
  }

  return seededShuffle(cards, seed);
}
