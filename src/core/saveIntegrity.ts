import type { PlayerSaveData } from '../types/game';

const subjects = ['chinese', 'english', 'math', 'science'] as const;
const guardians = ['qilin', 'stardragon', 'griffin', 'deer'] as const;
const paths = ['base', 'hero', 'mythic', 'inferno'];
const elements = ['ink_ruby', 'star_sapphire', 'gear_topaz', 'leaf_emerald'];

export class SaveIntegrityError extends Error {
  constructor(message: string) { super(message); this.name = 'SaveIntegrityError'; }
}

function requireValue(ok: boolean, field: string): asserts ok {
  if (!ok) throw new SaveIntegrityError(`存檔欄位「${field}」格式不正確；原始資料未被覆寫。`);
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function natural(value: unknown, max = 1_000_000_000): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;
}

function text(value: unknown, max = 20000): value is string {
  return typeof value === 'string' && value.length <= max;
}

function list(value: unknown, field: string): asserts value is unknown[] {
  requireValue(Array.isArray(value) && value.length <= 20000, field);
}

function gem(value: unknown): boolean {
  return record(value) && text(value.uid, 160) && elements.includes(String(value.element))
    && natural(value.level, 5) && value.level >= 1;
}

/** Validate the hydrated shape before it reaches combat/rendering or replaces a backup.
 * This prevents accidental corruption; it does not authenticate client-earned assets. */
export function assertPlayerSave(save: PlayerSaveData): void {
  requireValue(record(save), 'root');
  for (const key of ['level', 'xp', 'coins', 'crystals', 'bestStreak', 'dailyPlaySeconds', 'rapidGuessCount'] as const) {
    requireValue(natural(save[key] ?? (key === 'rapidGuessCount' ? 0 : undefined)), key);
  }
  requireValue(save.level >= 1 && save.level <= 200, 'level');
  requireValue([3, 4, 5, 6].includes(save.grade), 'grade');
  requireValue(['upper', 'lower'].includes(save.semester), 'semester');
  requireValue(['adventure', 'practice'].includes(save.playMode), 'playMode');
  requireValue(typeof save.muted === 'boolean', 'muted');
  requireValue(guardians.includes(save.selectedGuardian), 'selectedGuardian');
  requireValue(text(save.lastPlayDate, 10) && /^\d{4}-\d{2}-\d{2}$/.test(save.lastPlayDate), 'lastPlayDate');
  for (const key of ['unlockedGuardians', 'unlockedTitles', 'unlockedCards', 'masteredQuestionIds'] as const) {
    const values = save[key] ?? [];
    list(values, key);
    requireValue(values.every((v) => text(v, 500)), key);
  }
  requireValue(text(save.selectedTitle, 160), 'selectedTitle');
  requireValue(save.recentQuestionIds===undefined || Array.isArray(save.recentQuestionIds)&&save.recentQuestionIds.length<=120&&save.recentQuestionIds.every(id=>text(id,500)), 'recentQuestionIds');
  const skills=['star_guard','flame_focus'];
  requireValue(save.unlockedSkills===undefined || Array.isArray(save.unlockedSkills)&&save.unlockedSkills.length<=2&&save.unlockedSkills.every(id=>skills.includes(id)), 'unlockedSkills');
  requireValue(save.selectedSkill===undefined || skills.includes(save.selectedSkill)&&Boolean(save.unlockedSkills?.includes(save.selectedSkill)), 'selectedSkill');
  if(save.randomMissions!==undefined){
    const board=save.randomMissions;requireValue(record(board)&&text(board.day,10)&&/^\d{4}-\d{2}-\d{2}$/.test(board.day)&&Array.isArray(board.missions)&&board.missions.length===4,'randomMissions');
    const ids=new Set<string>();
    for(const mission of board.missions){
      requireValue(record(mission)&&text(mission.id,80)&&!ids.has(mission.id)&&['answered','correct','clears'].includes(mission.metric)&&[...subjects,'all'].includes(mission.subject)&&natural(mission.target,100)&&mission.target>0&&natural(mission.baseline)&&typeof mission.claimed==='boolean','randomMission');ids.add(mission.id);
      const reward=mission.reward;requireValue(record(reward),'mission.reward');
      requireValue(reward.kind==='skill'?skills.includes(reward.id):reward.kind==='gear'?['weapon','helm','armor','gloves','boots','amulet'].includes(reward.id):reward.kind==='item'?['wisdom_potion','combo_charm','shield_scroll','time_hourglass','forge_guard'].includes(reward.id)&&natural(reward.count,10)&&reward.count>0:reward.kind==='weapon'&&['wp_starter_pen','wp_star_lance','wp_golden_compass','wp_arena_scepter'].includes(reward.id),'mission.reward.type');
    }
  }
  requireValue(save.characterJob === undefined || ['adventurer','sentinel','arcanist','ranger'].includes(save.characterJob), 'characterJob');
  if (save.guardianCare !== undefined) {
    requireValue(record(save.guardianCare) && Object.keys(save.guardianCare).every(k=>guardians.includes(k as typeof guardians[number])), 'guardianCare');
    for (const care of Object.values(save.guardianCare)) requireValue(record(care) && text(care.day,10) && /^\d{4}-\d{2}-\d{2}$/.test(String(care.day)) && natural(care.points,1000000) && typeof care.petted==='boolean' && typeof care.fed==='boolean', 'guardianCare.entry');
  }
  requireValue(record(save.guardianBonds) && guardians.every((g) => natural(save.guardianBonds[g])), 'guardianBonds');
  requireValue(record(save.equipment), 'equipment');
  for (const slot of ['weapon', 'helm', 'armor', 'gloves', 'boots', 'amulet'] as const) {
    requireValue(natural(save.equipment[slot], 15) && save.equipment[slot]! >= 1, `equipment.${slot}`);
  }
  requireValue(record(save.items) && (['wisdom_potion', 'combo_charm', 'shield_scroll', 'time_hourglass', 'forge_guard'] as const)
    .every((id) => natural(save.items[id])), 'items');
  list(save.weapons, 'weapons');
  requireValue(save.weapons.length > 0, 'weapons');
  const uids = new Set<string>();
  for (const weapon of save.weapons) {
    requireValue(record(weapon) && text(weapon.uid, 160) && !uids.has(weapon.uid), 'weapon.uid');
    uids.add(weapon.uid);
    requireValue(text(weapon.templateId, 160) && text(weapon.name, 200), 'weapon.name');
    requireValue(natural(weapon.baseAttack, 10000) && natural(weapon.enhanceLevel, 15), 'weapon.power');
    requireValue(paths.includes(weapon.ascensionPath), 'weapon.ascensionPath');
    requireValue(['rare', 'epic', 'legendary', 'mythic'].includes(weapon.rarity), 'weapon.rarity');
    requireValue(Array.isArray(weapon.socketedGems) && weapon.socketedGems.length === 3
      && weapon.socketedGems.every((g) => g === null || gem(g)), 'weapon.socketedGems');
  }
  requireValue(uids.has(save.equippedWeaponUid), 'equippedWeaponUid');
  list(save.gemBag, 'gemBag');
  requireValue(save.gemBag.every(gem), 'gemBag');
  for (const subject of subjects) {
    const stats = save.subjectStats?.[subject];
    requireValue(record(stats) && (['answered', 'correct', 'bestScore', 'starsEarned', 'clears'] as const)
      .every((key) => natural(stats[key])), `subjectStats.${subject}`);
    requireValue(Number(stats.correct) <= Number(stats.answered), `subjectStats.${subject}.correct`);
  }
  list(save.wrongRecords, 'wrongRecords');
  for (const wrong of save.wrongRecords) {
    requireValue(record(wrong) && subjects.includes(wrong.subject) && [3, 4, 5, 6].includes(wrong.grade)
      && natural(wrong.wrongCount) && natural(wrong.lastWrongAt, Number.MAX_SAFE_INTEGER), 'wrongRecord');
    for (const key of ['questionId', 'prompt', 'correctAnswer', 'explanation', 'knowledgeTag'] as const) {
      requireValue(text(wrong[key]), `wrongRecord.${key}`);
    }
    requireValue(wrong.revengeOptions === undefined || (Array.isArray(wrong.revengeOptions)
      && wrong.revengeOptions.length <= 20 && wrong.revengeOptions.every((v) => text(v))), 'wrongRecord.revengeOptions');
  }
  list(save.trajectory, 'trajectory');
  for (const entry of save.trajectory) {
    requireValue(record(entry) && [...subjects, 'pvp'].includes(entry.subject) && text(entry.id, 160)
      && text(entry.note) && [3, 4, 5, 6].includes(entry.grade) && typeof entry.victory === 'boolean', 'trajectory');
    requireValue(['timestamp', 'correctCount', 'totalAttempts', 'score', 'durationSeconds'].every((k) => natural(entry[k], Number.MAX_SAFE_INTEGER)), 'trajectory.numbers');
    requireValue(entry.correctCount <= entry.totalAttempts, 'trajectory.correctCount');
  }
  list(save.dailyQuests, 'dailyQuests');
  for (const quest of save.dailyQuests) {
    requireValue(record(quest) && text(quest.id, 160) && text(quest.title, 200) && typeof quest.claimed === 'boolean'
      && ['target', 'current', 'rewardCoins', 'rewardCrystals'].every((k) => natural(quest[k])), 'dailyQuests');
    requireValue(quest.current <= quest.target, 'dailyQuests.current');
  }
  requireValue(record(save.pvp) && (['rating', 'wins', 'losses', 'winStreak', 'bestWinStreak', 'honorTokens'] as const)
    .every((key) => natural(save.pvp[key])), 'pvp');
  requireValue(record(save.parentSettings) && /^\d{4}$/.test(save.parentSettings.pinCode)
    && natural(save.parentSettings.dailyLimitMinutes, 120) && save.parentSettings.dailyLimitMinutes >= 15
    && typeof save.parentSettings.pvpEnabled === 'boolean' && typeof save.parentSettings.forcePracticeMode === 'boolean', 'parentSettings');
  requireValue(record(save.stageProgress ?? {}), 'stageProgress');
  for (const entry of Object.values(save.stageProgress ?? {})) {
    requireValue(record(entry) && typeof entry.cleared === 'boolean' && natural(entry.stars, 3)
      && natural(entry.bestScore) && (entry.chestClaimed === undefined || typeof entry.chestClaimed === 'boolean'), 'stageProgress.entry');
  }
  requireValue(record(save.knowledgeMastery ?? {}), 'knowledgeMastery');
  for (const entry of Object.values(save.knowledgeMastery ?? {})) {
    requireValue(record(entry) && subjects.includes(entry.subject) && text(entry.tag, 500)
      && natural(entry.answered) && natural(entry.correct) && entry.correct <= entry.answered, 'knowledgeMastery.entry');
  }
}

export function completeSaveData(save: PlayerSaveData): PlayerSaveData {
  assertPlayerSave(save);
  // Strip undefined optional properties, never drop inventory or daily fields.
  const copy = JSON.parse(JSON.stringify(save)) as PlayerSaveData;
  if (new TextEncoder().encode(JSON.stringify(copy)).byteLength > 800_000) {
    throw new SaveIntegrityError('存檔已接近雲端文件容量上限；已停止上傳，請匯出備份。資產未被截斷。');
  }
  return copy;
}

export function fingerprint(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(fingerprint).join(',') + ']';
  if (record(value)) return '{' + Object.keys(value).sort().map((key) => JSON.stringify(key) + ':' + fingerprint(value[key])).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}

export function resolveWrongRecordOnce(save: PlayerSaveData, questionId: string): PlayerSaveData {
  if (!save.wrongRecords.some((wrong) => wrong.questionId === questionId)) return save;
  return { ...save, coins: save.coins + 25, wrongRecords: save.wrongRecords.filter((wrong) => wrong.questionId !== questionId) };
}
