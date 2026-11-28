import type { AnyQuestion, GradeLevel, SubjectId, WrongRecord } from '../types/game';

export type RunMistake = Pick<WrongRecord, 'questionId' | 'subject' | 'grade' | 'prompt' | 'correctAnswer' | 'explanation' | 'knowledgeTag'>;
export interface ReviewFocus { subject: SubjectId; questionIds: readonly string[]; }

/** Short-lived per-run notes; no rewards, mastery or persistent saves. */
export function createRunReview(runId: string, subject: SubjectId, grade: GradeLevel) {
  const mistakes = new Map<string, RunMistake>();
  let finished = false;
  return {
    record(attemptRunId: string, question: AnyQuestion, correct: boolean): boolean {
      if (finished || attemptRunId !== runId || question.subject !== subject || question.grade !== grade) return false;
      if (!correct) mistakes.set(question.id, {
        questionId: question.id, subject: question.subject, grade: question.grade,
        prompt: question.prompt, correctAnswer: question.answer, explanation: question.explanation, knowledgeTag: question.knowledgeTag,
      });
      return true;
    },
    finish(attemptRunId: string): RunMistake[] | null {
      if (finished || attemptRunId !== runId) return null;
      finished = true;
      return Array.from(mistakes.values());
    },
  };
}

export function selectReviewRecords(records: readonly WrongRecord[], subject: SubjectId | 'all', focus?: ReviewFocus, onlyRecent = false): WrongRecord[] {
  const ids = new Set(focus?.questionIds ?? []);
  return records.filter((record) => (subject === 'all' || record.subject === subject)
    && (!onlyRecent || (record.subject === focus?.subject && ids.has(record.questionId))))
    .sort((a, b) => Number(ids.has(b.questionId)) - Number(ids.has(a.questionId)) || b.lastWrongAt - a.lastWrongAt);
}
