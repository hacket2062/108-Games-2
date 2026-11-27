import { AnyQuestion } from '../types/game';
import { shuffleArray } from '../data/questionBank';

/**
 * Zero-Repeat QuestionManager
 * Guarantees that within a single battle run (and across consecutive pulls in a chapter),
 * the same question will NEVER appear twice until the entire fresh pool is exhausted,
 * and even on deck recycle, the last asked question is strictly prevented from repeating back-to-back.
 * Priority order:
 *   1. Active Wrong Notebook questions (targeted review)
 *   2. Unseen / unmastered questions matching stage focusTags
 *   3. Unseen / unmastered questions in same grade & semester
 *   4. Previously mastered questions (shuffled)
 */
const SHUFFLE_BAG_PREFIX = 'zhiguang_shuffle_bag_v1_';

function readPersistedBag(bagKey?: string): string[] {
  if (!bagKey || typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return [];
  try {
    const raw = globalThis.localStorage.getItem(SHUFFLE_BAG_PREFIX + bagKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writePersistedBag(bagKey: string | undefined, ids: Iterable<string>): void {
  if (!bagKey || typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return;
  try {
    globalThis.localStorage.setItem(SHUFFLE_BAG_PREFIX + bagKey, JSON.stringify(Array.from(ids).slice(-400)));
  } catch {
    // ignore quota errors
  }
}

export class QuestionManager<T extends AnyQuestion> {
  private readonly allPool: T[];
  private readonly wrongIdSet: Set<string>;
  private readonly masteredIdSet: Set<string>;
  private readonly focusTags: string[];
  private readonly bagKey?: string;
  private readonly usedInRun = new Set<string>();
  private queue: T[] = [];
  private lastServedId: string | null = null;

  constructor(
    pool: T[],
    options?: {
      wrongQuestionIds?: string[];
      masteredQuestionIds?: string[];
      focusTags?: string[];
      bagKey?: string;
    }
  ) {
    // Deduplicate input pool by id
    const seen = new Set<string>();
    this.allPool = pool.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
    this.wrongIdSet = new Set(options?.wrongQuestionIds ?? []);
    this.masteredIdSet = new Set(options?.masteredQuestionIds ?? []);
    this.focusTags = options?.focusTags ?? [];
    this.bagKey = options?.bagKey;
    for (const id of readPersistedBag(this.bagKey)) {
      if (seen.has(id)) this.usedInRun.add(id);
    }
    if (this.usedInRun.size >= this.allPool.length && this.allPool.length > 0) {
      this.usedInRun.clear();
      writePersistedBag(this.bagKey, this.usedInRun);
    }
    this.rebuildQueue(false);
  }

  private matchesFocus(q: T): boolean {
    if (this.focusTags.length === 0) return false;
    return this.focusTags.some(
      (tag) => q.knowledgeTag.includes(tag) || tag.includes(q.knowledgeTag)
    );
  }

  private rebuildQueue(allowUsedRecycle: boolean): void {
    const candidates = allowUsedRecycle
      ? [...this.allPool]
      : this.allPool.filter((q) => !this.usedInRun.has(q.id));

    const wrongBucket: T[] = [];
    const focusUnmastered: T[] = [];
    const generalUnmastered: T[] = [];
    const masteredBucket: T[] = [];

    for (const q of candidates) {
      if (this.wrongIdSet.has(q.id)) {
        wrongBucket.push(q);
      } else if (!this.masteredIdSet.has(q.id)) {
        if (this.matchesFocus(q)) focusUnmastered.push(q);
        else generalUnmastered.push(q);
      } else {
        masteredBucket.push(q);
      }
    }

    const ordered = [
      ...shuffleArray(wrongBucket),
      ...shuffleArray(focusUnmastered),
      ...shuffleArray(generalUnmastered),
      ...shuffleArray(masteredBucket),
    ];

    // Prevent back-to-back repetition across deck boundaries
    if (ordered.length > 1 && this.lastServedId && ordered[0].id === this.lastServedId) {
      const swapIdx = ordered.findIndex((q) => q.id !== this.lastServedId);
      if (swapIdx > 0) {
        const [picked] = ordered.splice(swapIdx, 1);
        ordered.unshift(picked);
      }
    }

    this.queue = ordered;
  }

  /**
   * Pull the next non-repeating question. Optional predicate lets engines pull
   * e.g. a specific sub-mode ('radical' | 'typo' | 'spell') without duplicating IDs.
   */
  public next(predicate?: (q: T) => boolean): T {
    if (this.allPool.length === 0) {
      throw new Error('QuestionManager initialized with an empty pool');
    }

    const findIndexInQueue = () =>
      predicate ? this.queue.findIndex(predicate) : this.queue.length > 0 ? 0 : -1;

    let idx = findIndexInQueue();
    if (idx === -1) {
      // Recycle only if fresh pool exhausted
      this.usedInRun.clear();
      writePersistedBag(this.bagKey, this.usedInRun);
      this.rebuildQueue(true);
      idx = findIndexInQueue();
    }

    if (idx === -1) {
      // Predicate matched nothing in pool; fall back to first available non-repeating question
      idx = 0;
    }

    const [picked] = this.queue.splice(idx, 1);
    this.usedInRun.add(picked.id);
    this.lastServedId = picked.id;
    writePersistedBag(this.bagKey, this.usedInRun);
    return picked;
  }

  public getRemainingFreshCount(): number {
    return Math.max(0, this.allPool.length - this.usedInRun.size);
  }

  public getUniqueServedCount(): number {
    return this.usedInRun.size;
  }
}
