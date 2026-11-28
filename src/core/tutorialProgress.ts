import type { SubjectId } from '../types/game';

export type TutorialStatus = 'completed' | 'skipped';
export type TutorialProgress = Partial<Record<SubjectId, TutorialStatus>>;
const subjects: SubjectId[] = ['chinese', 'english', 'math', 'science'];

// Local UI preferences only. Never reuse a campaign/save key or copy between accounts.
export function tutorialStorageKey(provider: string, uid: string): string {
  return `zhiguang_tutorial_v1:${provider}:${uid}`;
}

export function readTutorialProgress(storage: Pick<Storage, 'getItem'>, key: string): TutorialProgress {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const result: TutorialProgress = {};
    for (const subject of subjects) {
      const status = (value as Record<string, unknown>)[subject];
      if (status === 'completed' || status === 'skipped') result[subject] = status;
    }
    return result;
  } catch { return {}; }
}

export function saveTutorialProgress(storage: Pick<Storage, 'setItem'>, key: string, progress: TutorialProgress): void {
  try { storage.setItem(key, JSON.stringify(progress)); } catch { /* Tutorial remains usable when browser storage is unavailable. */ }
}
