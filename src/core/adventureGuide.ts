import type { PlayerSaveData, SubjectId } from '../types/game';
import { getChaptersForWorld, isStageUnlocked } from '../data/campaignMap';

/** Resume an available stage in the most recently played subject, at this grade.
 * Read-only: this recommendation never grants progress or bypasses unlocks. */
export function getNextAdventure(save: PlayerSaveData) {
  const latest = save.trajectory
    .filter((entry) => entry.grade === save.grade && entry.subject !== 'pvp')
    .reduce<(typeof save.trajectory)[number] | undefined>(
      (best, entry) => !best || entry.timestamp > best.timestamp ? entry : best, undefined);
  const subject: SubjectId = latest && latest.subject !== 'pvp' ? latest.subject : 'chinese';
  const stages = getChaptersForWorld(subject, save.grade).flatMap((chapter) => chapter.stages);
  const available = stages.filter((stage) => isStageUnlocked(stage, save.stageProgress));
  const stage = available.find((stage) => !save.stageProgress?.[stage.stageKey]?.cleared)
    ?? available[available.length - 1];
  return { stage, replay: Boolean(save.stageProgress?.[stage.stageKey]?.cleared) };
}
