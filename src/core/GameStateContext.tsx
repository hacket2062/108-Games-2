import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type {
  AnyQuestion,
  AscensionPath,
  BattleItemId,
  DailyQuestProgress,
  EffectiveCombatStats,
  EquipmentSlotId,
  GemElementId,
  GemInstance,
  GradeLevel,
  GuardianId,
  ParentSettings,
  PlayMode,
  PlayerSaveData,
  PvPRunResult,
  SemesterId,
  StageProgressRecord,
  SubjectId,
  WeaponInstance,
  WorldRunResult,
  WrongRecord,
} from '../types/game';
import { useAuth } from '../auth/AuthContext';
import { applyXpGain, computeSaveCombatStats } from './combatMath';
import {
  ASCENSION_PATHS,
  BATTLE_ITEMS,
  createStarterWeapon,
  FUSION_RECIPES,
  GEM_ELEMENTS,
  getEnhanceCost,
  getEnhanceSuccessRate,
  WEAPON_CATALOG,
} from '../data/itemsAndGems';
import { GUARDIAN_SHOP_COSTS } from '../data/spiritsAndTitles';
import { soundEngine } from '../audio/soundEngine';

import { createInitialDailyQuests, todayKey } from './playerSave';
import { resolveWrongRecordOnce } from './saveIntegrity';
import { usePlayerSave } from './usePlayerSave';
import { getStageConfig } from '../data/campaignMap';
import { recordsCampaignProgress } from './gameExperience';
export { createInitialPlayerSave } from './playerSave';

function extractRevengeOptions(q: AnyQuestion): string[] {
  if (q.subject === 'chinese') {
    if (q.payload.mode === 'slash') return q.payload.options;
    if (q.payload.mode === 'radical') {
      return [q.payload.targetChar, q.payload.partA, q.payload.partB, '明'].slice(0, 4);
    }
    return [q.payload.correctChar, q.payload.wrongChar, '的', '得'];
  }
  if (q.subject === 'english') {
    if (q.payload.mode === 'spell') {
      return [q.payload.word, `${q.payload.word}s`, `un${q.payload.word}`, `${q.payload.word}ed`];
    }
    return q.payload.choices;
  }
  if (q.subject === 'math') return q.payload.options;
  return [
    q.answer,
    ...q.payload.ingredients.filter((i) => !i.isCorrect).map((i) => i.name),
    '純水蒸餾',
  ].slice(0, 4);
}

export interface ActionFeedback {
  ok: boolean;
  message: string;
}

interface GameStateContextValue {
  save: PlayerSaveData;
  combatStats: EffectiveCombatStats;
  saveNotice: string;
  cloudSyncEnabled: boolean;
  exportSaveBackup: () => void;
  equippedWeapon: WeaponInstance;
  isRestReminderVisible: boolean;
  dismissRestReminder: () => void;
  setGrade: (g: GradeLevel) => void;
  setSemester: (s: SemesterId) => void;
  setPlayMode: (m: PlayMode) => void;
  toggleMute: () => void;
  selectGuardian: (id: GuardianId) => void;
  petGuardian: () => void;
  selectTitle: (titleId: string) => void;
  recordAnswer: (question: AnyQuestion, isCorrect: boolean, responseMs?: number) => void;
  resolveWrongRecord: (questionId: string) => void;
  applyWorldResult: (result: WorldRunResult) => { leveledUp: boolean; chestDropped?: string };
  applyPvPResult: (result: PvPRunResult) => { leveledUp: boolean };
  claimDailyQuest: (questId: string) => ActionFeedback;
  // Forge
  equipWeapon: (weaponUid: string) => void;
  enhanceWeapon: (weaponUid: string, useGuardScroll: boolean) => ActionFeedback;
  ascendWeapon: (weaponUid: string, path: AscensionPath) => ActionFeedback;
  fuseWeapons: (uidA: string, uidB: string) => ActionFeedback;
  upgradeEquipmentSlot: (slot: EquipmentSlotId) => ActionFeedback;
  // Socketing
  socketGem: (weaponUid: string, slotIndex: number, gemUid: string) => ActionFeedback;
  unsocketGem: (weaponUid: string, slotIndex: number) => ActionFeedback;
  synthesizeGems: (element: GemElementId, level: 1 | 2 | 3 | 4) => ActionFeedback;
  // Shop
  buyWeapon: (templateId: string, useHonor: boolean, discountFactor?: number) => ActionFeedback;
  buyGem: (element: GemElementId, discountFactor?: number) => ActionFeedback;
  buyBattleItem: (itemId: BattleItemId, useHonor: boolean, discountFactor?: number) => ActionFeedback;
  consumeBattleItem: (itemId: BattleItemId) => boolean;
  unlockOrBondGuardian: (guardianId: GuardianId) => ActionFeedback;
  // Parent
  updateParentSettings: (patch: Partial<ParentSettings>) => void;
  buildLearningCsv: () => string;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { save, store, ready, notice, choice, accept, exportBackup, cloudEnabled } = usePlayerSave(user);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  // Execute domain transitions once, synchronously; React only subscribes.
  const setSave = useCallback((transition: (previous: PlayerSaveData) => PlayerSaveData) => {
    if (readyRef.current) store.update(transition);
  }, [store]);
  const [restDismissed, setRestDismissed] = useState(false);
  useEffect(() => { soundEngine.setMuted(save.muted); }, [save.muted]);
  useEffect(() => { setRestDismissed(false); }, [save.lastPlayDate]);
  useEffect(() => {
    let previousActive = false;
    let pendingSeconds = 0;
    const timer = window.setInterval(() => {
      if (!readyRef.current) return;
      const active = document.visibilityState === 'visible' && document.body.dataset.state === 'playing';
      if (active && previousActive) pendingSeconds++;
      const elapsed = pendingSeconds >= 10 || !active ? pendingSeconds : 0;
      if (elapsed > 0) pendingSeconds = 0;
      store.update((previous) => {
        const day = todayKey();
        if (previous.lastPlayDate !== day) return {
          ...previous, lastPlayDate: day, dailyPlaySeconds: 0, dailyQuests: createInitialDailyQuests(),
        };
        return elapsed > 0 ? { ...previous, dailyPlaySeconds: previous.dailyPlaySeconds + elapsed } : previous;
      });
      previousActive = active;
    }, 1000);
    return () => clearInterval(timer);
  }, [store]);

  const equippedWeapon = useMemo(
    () => save.weapons.find((w) => w.uid === save.equippedWeaponUid) ?? save.weapons[0] ?? createStarterWeapon(),
    [save.weapons, save.equippedWeaponUid]
  );

  const combatStats = useMemo(() => computeSaveCombatStats(save), [save]);

  const isRestReminderVisible =
    !restDismissed && save.dailyPlaySeconds >= save.parentSettings.dailyLimitMinutes * 60;

  const setGrade = useCallback((grade: GradeLevel) => setSave((p) => ({ ...p, grade })), []);
  const setSemester = useCallback((semester: SemesterId) => setSave((p) => ({ ...p, semester })), []);
  const setPlayMode = useCallback((playMode: PlayMode) => setSave((p) => ({ ...p, playMode })), []);
  const toggleMute = useCallback(() => setSave((p) => ({ ...p, muted: !p.muted })), []);

  const selectGuardian = useCallback((id: GuardianId) => {
    setSave((p) => ({ ...p, selectedGuardian: id }));
  }, []);

  const petGuardian = useCallback(() => {
    setSave((p) => ({
      ...p,
      guardianBonds: {
        ...p.guardianBonds,
        [p.selectedGuardian]: (p.guardianBonds[p.selectedGuardian] ?? 1) + 1,
      },
    }));
  }, []);

  const selectTitle = useCallback((titleId: string) => {
    setSave((p) => (p.unlockedTitles.includes(titleId) ? { ...p, selectedTitle: titleId } : p));
  }, []);

  const recordAnswer = useCallback(
    (question: AnyQuestion, isCorrect: boolean, responseMs?: number) => {
      setSave((prev) => {
        const curr = prev.subjectStats[question.subject];
        const nextStats = {
          ...prev.subjectStats,
          [question.subject]: {
            ...curr,
            answered: curr.answered + 1,
            correct: curr.correct + (isCorrect ? 1 : 0),
          },
        };

        let nextWrong = [...prev.wrongRecords];
        if (!isCorrect) {
          const idx = nextWrong.findIndex((w) => w.questionId === question.id);
          const rec: WrongRecord = {
            questionId: question.id,
            subject: question.subject,
            grade: question.grade,
            prompt: question.prompt,
            correctAnswer: question.answer,
            explanation: question.explanation,
            knowledgeTag: question.knowledgeTag,
            wrongCount: idx >= 0 ? nextWrong[idx].wrongCount + 1 : 1,
            lastWrongAt: Date.now(),
            revengeOptions: extractRevengeOptions(question),
          };
          if (idx >= 0) nextWrong[idx] = rec;
          else nextWrong = [rec, ...nextWrong].slice(0, 60);
        }

        // Track mastered question IDs for zero-repeat prioritization
        const masteredSet = new Set(prev.masteredQuestionIds ?? []);
        if (isCorrect) masteredSet.add(question.id);
        else masteredSet.delete(question.id);

        // Track per-knowledgeTag mastery for Parent Heatmap
        const tagKey = `${question.subject}:${question.knowledgeTag}`;
        const prevMap = prev.knowledgeMastery ?? {};
        const prevEntry = prevMap[tagKey] ?? {
          subject: question.subject,
          tag: question.knowledgeTag,
          answered: 0,
          correct: 0,
        };
        const nextKnowledgeMastery = {
          ...prevMap,
          [tagKey]: {
            ...prevEntry,
            answered: prevEntry.answered + 1,
            correct: prevEntry.correct + (isCorrect ? 1 : 0),
          },
        };

        // Detect rapid random guessing (<1.8s and wrong)
        const isRapidGuess = !isCorrect && typeof responseMs === 'number' && responseMs < 1800;

        const nextQuests = prev.dailyQuests.map((q) =>
          q.id === 'q_answer_5' && isCorrect ? { ...q, current: Math.min(q.target, q.current + 1) } : q
        );

        return {
          ...prev,
          subjectStats: nextStats,
          wrongRecords: nextWrong,
          dailyQuests: nextQuests,
          masteredQuestionIds: Array.from(masteredSet).slice(-350),
          knowledgeMastery: nextKnowledgeMastery,
          rapidGuessCount: (prev.rapidGuessCount ?? 0) + (isRapidGuess ? 1 : 0),
        };
      });
    },
    []
  );

  const resolveWrongRecord = useCallback((questionId: string) => {
    setSave((prev) => resolveWrongRecordOnce(prev, questionId));
  }, []);

  const applyWorldResult = useCallback(
    (result: WorldRunResult): { leveledUp: boolean; chestDropped?: string } => {
      let didLevel = false;
      let chestDropped: string | undefined;
      setSave((prev) => {
        const xpOutcome = applyXpGain(prev.level, prev.xp, result.xpEarned);
        didLevel = xpOutcome.leveledUp;
        const st = prev.subjectStats[result.subject];
        const nextSubjectStats = {
          ...prev.subjectStats,
          [result.subject]: {
            ...st,
            bestScore: Math.max(st.bestScore, result.score),
            starsEarned: Math.max(st.starsEarned, result.stars),
            clears: st.clears + (result.victory ? 1 : 0),
          },
        };

        const nextStreak = Math.max(prev.bestStreak, result.maxCombo);
        const nextTitles = new Set(prev.unlockedTitles);
        if (nextStreak >= 5) nextTitles.add('title_combo5');
        if (nextStreak >= 15) nextTitles.add('title_mythic_grandmaster');
        if (
          nextSubjectStats.chinese.clears > 0 &&
          nextSubjectStats.english.clears > 0 &&
          nextSubjectStats.math.clears > 0 &&
          nextSubjectStats.science.clears > 0
        ) {
          nextTitles.add('title_quad_clear');
        }

        const nextQuests = prev.dailyQuests.map((q) =>
          q.id === 'q_clear_1' && result.victory && recordsCampaignProgress(result) && result.stageKey?.endsWith('_s10')
            ? { ...q, current: q.target } : q
        );

        // Update 10-stage campaign progress & Stage 10 3-star Boss chest reward
        const nextStageProgress: Record<string, StageProgressRecord> = {
          ...(prev.stageProgress ?? {}),
        };
        let bonusCoins = 0;
        let bonusCrystals = 0;
        const nextWeapons = [...prev.weapons];

        if (result.stageKey && recordsCampaignProgress(result)) {
          const prevRec = nextStageProgress[result.stageKey];
          const bestStars = Math.max(prevRec?.stars ?? 0, result.victory ? result.stars : 0) as
            | 0
            | 1
            | 2
            | 3;
          const isBossStage = result.stageKey.endsWith('_s10');
          const shouldDropChest =
            isBossStage && result.victory && result.stars >= 3 && !prevRec?.chestClaimed;

          if (shouldDropChest) {
            const parts = /^(chinese|english|math|science)_g([3-6])_c([1-3])_s10$/.exec(result.stageKey);
            const reward = parts ? getStageConfig(parts[1] as SubjectId, Number(parts[2]) as GradeLevel, Number(parts[3]) as 1 | 2 | 3, 10).starChestReward : undefined;
            const tpl = WEAPON_CATALOG.find((weapon) => weapon.templateId === reward?.weaponTemplateId);
            bonusCoins = reward?.coins ?? 0;
            bonusCrystals = reward?.crystals ?? 0;
            if (tpl) {
              nextWeapons.push({
                uid: `wp-boss-${crypto.randomUUID()}`,
                templateId: tpl.templateId,
                name: `${tpl.name}・星辰`,
                baseAttack: tpl.baseAttack + 4,
                enhanceLevel: 3,
                ascensionPath: 'base',
                rarity: 'legendary',
                socketedGems: [null, null, null],
              });
            }
            chestDropped = `三星大魔王寶箱：+${bonusCoins} 金幣、+${bonusCrystals} 晶石${tpl ? `與${tpl.name}` : ''}！`;
          }

          nextStageProgress[result.stageKey] = {
            cleared: Boolean(prevRec?.cleared || result.victory),
            stars: bestStars,
            bestScore: Math.max(prevRec?.bestScore ?? 0, result.score),
            chestClaimed: Boolean(prevRec?.chestClaimed || shouldDropChest),
          };
        }

        const newEntry = {
          id: `tr-${Date.now()}`,
          timestamp: Date.now(),
          subject: result.subject,
          grade: prev.grade,
          correctCount: result.correctCount,
          totalAttempts: result.totalAttempts,
          score: result.score,
          durationSeconds: result.clearSeconds,
          victory: result.victory,
          note: `${result.playMode === 'practice' ? '【練習】' : ''}${result.stageLabel
            ? `${result.stageLabel}｜${result.progressSummary}`
            : result.progressSummary}`,
        };

        // Drop a random Lv.1 knowledge gem on victory!
        const subjectGemMap: Record<SubjectId, GemElementId> = {
          chinese: 'ink_ruby',
          english: 'star_sapphire',
          math: 'gear_topaz',
          science: 'leaf_emerald',
        };
        const droppedGem: GemInstance | null = result.victory
          ? {
              uid: `gem-drop-${Date.now().toString(36)}`,
              element: subjectGemMap[result.subject],
              level: 1,
            }
          : null;

        return {
          ...prev,
          level: xpOutcome.level,
          xp: xpOutcome.xp,
          coins: prev.coins + result.coinsEarned + bonusCoins,
          crystals: prev.crystals + result.crystalsEarned + bonusCrystals,
          bestStreak: nextStreak,
          subjectStats: nextSubjectStats,
          unlockedTitles: Array.from(nextTitles),
          unlockedCards: Array.from(new Set([...prev.unlockedCards, ...result.knowledgeTags])),
          trajectory: [newEntry, ...prev.trajectory].slice(0, 50),
          dailyQuests: nextQuests,
          gemBag: droppedGem ? [droppedGem, ...prev.gemBag] : prev.gemBag,
          weapons: nextWeapons,
          stageProgress: nextStageProgress,
        };
      });
      return { leveledUp: didLevel, chestDropped };
    },
    []
  );

  const applyPvPResult = useCallback((result: PvPRunResult): { leveledUp: boolean } => {
    // A client result must never certify a real online match.
    if (result.isOnlineRealPlayer) return { leveledUp: false };
    let didLevel = false;
    setSave((prev) => {
      const xpOutcome = applyXpGain(prev.level, prev.xp, result.xpEarned);
      didLevel = xpOutcome.leveledUp;
      const nextWinStreak = result.victory ? prev.pvp.winStreak + 1 : 0;
      const nextRating = prev.pvp.rating;
      const nextTitles = new Set(prev.unlockedTitles);
      // AI practice does not grant competitive titles.
      if (nextRating >= 1500) nextTitles.add('title_mythic_grandmaster');

      const nextQuests = prev.dailyQuests.map((q) =>
        q
      );

      const newEntry = {
        id: `tr-pvp-${Date.now()}`,
        timestamp: Date.now(),
        subject: 'pvp' as const,
        grade: prev.grade,
        correctCount: result.correctCount,
        totalAttempts: result.totalAttempts,
        score: result.myScore,
        durationSeconds: result.durationSeconds,
        victory: result.victory,
        note: `AI 知識練習 ${result.opponentName}（${result.victory ? '完成' : '再接再厲'}；不計真人排位）`,
      };

      return {
        ...prev,
        level: xpOutcome.level,
        xp: xpOutcome.xp,
        coins: prev.coins + result.coinsEarned,
        bestStreak: Math.max(prev.bestStreak, result.maxCombo),
        unlockedTitles: Array.from(nextTitles),
        trajectory: [newEntry, ...prev.trajectory].slice(0, 50),
        dailyQuests: nextQuests,
        pvp: prev.pvp,
      };
    });
    return { leveledUp: didLevel };
  }, []);

  const claimDailyQuest = useCallback((questId: string): ActionFeedback => {
    let feedback: ActionFeedback = { ok: false, message: '任務尚未達成或已領取。' };
    setSave((prev) => {
      const target = prev.dailyQuests.find((q) => q.id === questId);
      if (!target || target.claimed || target.current < target.target) return prev;
      feedback = {
        ok: true,
        message: `領取成功！獲得 +${target.rewardCoins} 金幣、+${target.rewardCrystals} 智光晶石！`,
      };
      return {
        ...prev,
        coins: prev.coins + target.rewardCoins,
        crystals: prev.crystals + target.rewardCrystals,
        dailyQuests: prev.dailyQuests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
      };
    });
    return feedback;
  }, []);

  // ==================== FORGE SYSTEM ====================
  const equipWeapon = useCallback((weaponUid: string) => {
    setSave((prev) =>
      prev.weapons.some((w) => w.uid === weaponUid) ? { ...prev, equippedWeaponUid: weaponUid } : prev
    );
  }, []);

  const enhanceWeapon = useCallback((weaponUid: string, useGuardScroll: boolean): ActionFeedback => {
    const save = store.getSnapshot();
    const target = save.weapons.find((w) => w.uid === weaponUid);
    if (!target) return { ok: false, message: '找不到該神兵。' };
    if (target.enhanceLevel >= 15) return { ok: false, message: '此神兵已達最高強化 +15！' };

    const cost = getEnhanceCost(target.enhanceLevel);
    if (save.coins < cost.coins) return { ok: false, message: `金幣不足（需要 ${cost.coins}）。` };
    if (save.crystals < cost.crystals) return { ok: false, message: `智光晶石不足（需要 ${cost.crystals}）。` };
    if (useGuardScroll && save.items.forge_guard <= 0) {
      return { ok: false, message: '神匠保護卷軸不足，請至魔法商店購買。' };
    }

    const rate = getEnhanceSuccessRate(target.enhanceLevel);
    const success = Math.random() * 100 <= rate;
    const newLevel = success
      ? target.enhanceLevel + 1
      : target.enhanceLevel >= 7 && !useGuardScroll
        ? target.enhanceLevel - 1
        : target.enhanceLevel;

    setSave((prev) => ({
      ...prev,
      coins: prev.coins - cost.coins,
      crystals: prev.crystals - cost.crystals,
      items: useGuardScroll
        ? { ...prev.items, forge_guard: Math.max(0, prev.items.forge_guard - 1) }
        : prev.items,
      weapons: prev.weapons.map((w) =>
        w.uid === weaponUid ? { ...w, enhanceLevel: newLevel } : w
      ),
    }));

    if (success) {
      soundEngine.playPerfectBell();
      return { ok: true, message: `鍛造大成功！${target.name} 強化至 +${newLevel}！` };
    }
    soundEngine.playWrongBuzz();
    return {
      ok: false,
      message: useGuardScroll
        ? `強化未能突破，神匠保護卷軸發動，維持 +${newLevel} 不掉階！`
        : newLevel < target.enhanceLevel
          ? `鍛造過熱未能突破，強化暫降為 +${newLevel}（使用保護卷軸可防掉階）。`
          : `強化未能突破，但維持 +${newLevel} 不掉階！`,
    };
  }, [save.coins, save.crystals, save.items.forge_guard, save.weapons]);

  const ascendWeapon = useCallback((weaponUid: string, path: AscensionPath): ActionFeedback => {
    const save = store.getSnapshot();
    if (path === 'base') return { ok: false, message: '請選擇英雄、神話或地獄路線。' };
    const target = save.weapons.find((w) => w.uid === weaponUid);
    if (!target) return { ok: false, message: '找不到該神兵。' };
    const def = ASCENSION_PATHS[path];
    if (target.enhanceLevel < def.minEnhanceLevel) {
      return { ok: false, message: `需先強化至 +${def.minEnhanceLevel} 才可覺醒路線！` };
    }
    if (save.coins < def.coinCost || save.crystals < def.crystalCost) {
      return {
        ok: false,
        message: `資源不足！需要 ${def.coinCost} 金幣與 ${def.crystalCost} 智光晶石。`,
      };
    }

    soundEngine.playUltimateRoar();
    setSave((prev) => ({
      ...prev,
      coins: prev.coins - def.coinCost,
      crystals: prev.crystals - def.crystalCost,
      unlockedTitles: Array.from(new Set([...prev.unlockedTitles, 'title_forge_master'])),
      weapons: prev.weapons.map((w) =>
        w.uid === weaponUid
          ? { ...w, ascensionPath: path, rarity: path === 'inferno' || path === 'mythic' ? 'mythic' : 'legendary' }
          : w
      ),
    }));
    return { ok: true, message: `覺醒成功！${target.name} 獲得【${def.name}】專屬光環與被動！` };
  }, [save.coins, save.crystals, save.weapons]);

  const fuseWeapons = useCallback((uidA: string, uidB: string): ActionFeedback => {
    const save = store.getSnapshot();
    if (uidA === uidB) return { ok: false, message: '請選擇兩把不同的神兵進行融合。' };
    const wA = save.weapons.find((w) => w.uid === uidA);
    const wB = save.weapons.find((w) => w.uid === uidB);
    if (!wA || !wB) return { ok: false, message: '找不到指定的融合武器。' };

    const recipe = FUSION_RECIPES[0];
    if (save.coins < recipe.coinCost || save.crystals < recipe.crystalCost) {
      return {
        ok: false,
        message: `融合需要 ${recipe.coinCost} 金幣與 ${recipe.crystalCost} 智光晶石。`,
      };
    }

    const recoveredGems: GemInstance[] = [
      ...wA.socketedGems.filter((g): g is GemInstance => g !== null),
      ...wB.socketedGems.filter((g): g is GemInstance => g !== null),
    ];
    const inheritedEnhance = Math.min(15, Math.max(wA.enhanceLevel, wB.enhanceLevel) + 1);
    const inheritedPath = wA.ascensionPath !== 'base' ? wA.ascensionPath : wB.ascensionPath;
    const fusedWeapon: WeaponInstance = {
      uid: `wp-fused-${crypto.randomUUID()}`,
      templateId: recipe.resultTemplateId,
      name: recipe.resultName,
      baseAttack: recipe.resultBaseAttack,
      enhanceLevel: inheritedEnhance,
      ascensionPath: inheritedPath,
      rarity: recipe.resultRarity,
      isFused: true,
      socketedGems: [null, null, null],
    };

    soundEngine.playPerfectBell();
    setSave((prev) => ({
      ...prev,
      coins: prev.coins - recipe.coinCost,
      crystals: prev.crystals - recipe.crystalCost,
      weapons: [fusedWeapon, ...prev.weapons.filter((w) => w.uid !== uidA && w.uid !== uidB)],
      equippedWeaponUid: fusedWeapon.uid,
      gemBag: [...recoveredGems, ...prev.gemBag],
    }));

    return {
      ok: true,
      message: `神兵融合成功！誕生【${fusedWeapon.name} +${inheritedEnhance}】，原有寶石已無損歸還背包！`,
    };
  }, [save.coins, save.crystals, save.weapons]);

  // ==================== SOCKETING & GEM SYNTHESIS ====================
  const socketGem = useCallback((weaponUid: string, slotIndex: number, gemUid: string): ActionFeedback => {
    const save = store.getSnapshot();
    const weapon = save.weapons.find((w) => w.uid === weaponUid);
    const gem = save.gemBag.find((g) => g.uid === gemUid);
    if (!weapon || !gem) return { ok: false, message: '找不到指定武器或寶石。' };
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 2) return { ok: false, message: '無效的寶石槽位。' };

    const previousGem = weapon.socketedGems[slotIndex];
    soundEngine.playGemSynth();
    setSave((prev) => ({
      ...prev,
      gemBag: [
        ...(previousGem ? [previousGem] : []),
        ...prev.gemBag.filter((g) => g.uid !== gemUid),
      ],
      weapons: prev.weapons.map((w) => {
        if (w.uid !== weaponUid) return w;
        const nextSlots = [...w.socketedGems];
        nextSlots[slotIndex] = gem;
        return { ...w, socketedGems: nextSlots };
      }),
    }));
    return {
      ok: true,
      message: `已無損鑲嵌 Lv.${gem.level} ${GEM_ELEMENTS[gem.element].name}！戰力立即提升。`,
    };
  }, [save.gemBag, save.weapons]);

  const unsocketGem = useCallback((weaponUid: string, slotIndex: number): ActionFeedback => {
    const save = store.getSnapshot();
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 2) return { ok: false, message: '無效的寶石槽位。' };
    const weapon = save.weapons.find((w) => w.uid === weaponUid);
    if (!weapon) return { ok: false, message: '找不到武器。' };
    const existingGem = weapon.socketedGems[slotIndex];
    if (!existingGem) return { ok: false, message: '此槽位目前沒有寶石。' };

    soundEngine.playClick();
    setSave((prev) => ({
      ...prev,
      gemBag: [existingGem, ...prev.gemBag],
      weapons: prev.weapons.map((w) => {
        if (w.uid !== weaponUid) return w;
        const nextSlots = [...w.socketedGems];
        nextSlots[slotIndex] = null;
        return { ...w, socketedGems: nextSlots };
      }),
    }));
    return {
      ok: true,
      message: `已無損拆下 Lv.${existingGem.level} ${GEM_ELEMENTS[existingGem.element].name} 並放回背包！`,
    };
  }, [save.weapons]);

  const synthesizeGems = useCallback((element: GemElementId, level: 1 | 2 | 3 | 4): ActionFeedback => {
    const save = store.getSnapshot();
    if (!GEM_ELEMENTS[element] || ![1, 2, 3, 4].includes(level)) return { ok: false, message: '無效的合成配方。' };
    const matching = save.gemBag.filter((g) => g.element === element && g.level === level);
    if (matching.length < 3) {
      return { ok: false, message: `需要 3 顆相同的 Lv.${level} ${GEM_ELEMENTS[element].name} 才能合成升階！` };
    }
    const consumeUids = new Set(matching.slice(0, 3).map((g) => g.uid));
    const upgraded: GemInstance = {
      uid: `gem-syn-${crypto.randomUUID()}`,
      element,
      level: (level + 1) as 2 | 3 | 4 | 5,
    };
    soundEngine.playGemSynth();
    setSave((prev) => ({
      ...prev,
      gemBag: [upgraded, ...prev.gemBag.filter((g) => !consumeUids.has(g.uid))],
    }));
    return {
      ok: true,
      message: `3 合 1 寶石合成成功！獲得 Lv.${upgraded.level} ${GEM_ELEMENTS[element].name}！`,
    };
  }, [save.gemBag]);

  // ==================== MAGIC SHOP ====================
  const buyWeapon = useCallback((templateId: string, useHonor: boolean, discountFactor = 1): ActionFeedback => {
    const save = store.getSnapshot();
    if (![0.7, 1].includes(discountFactor)) return { ok: false, message: '無效的商品價格。' };
    const tpl = WEAPON_CATALOG.find((w) => w.templateId === templateId);
    if (!tpl) return { ok: false, message: '找不到該商品。' };
    if (useHonor) {
      if (tpl.priceHonor === undefined) return { ok: false, message: '此商品無法使用榮譽幣購買。' };
      const honorCost = tpl.priceHonor ?? 9999;
      if (save.pvp.honorTokens < honorCost) {
        return { ok: false, message: `競技榮譽幣不足（需要 ${honorCost}）。` };
      }
    } else {
      const finalCoins = Math.round(tpl.priceCoins * discountFactor);
      if (save.coins < finalCoins) {
        return { ok: false, message: `金幣不足（需要 ${finalCoins}）。` };
      }
    }

    const newWeapon: WeaponInstance = {
      uid: `wp-shop-${crypto.randomUUID()}`,
      templateId: tpl.templateId,
      name: tpl.name,
      baseAttack: tpl.baseAttack,
      enhanceLevel: tpl.rarity === 'mythic' ? 5 : 0,
      ascensionPath: 'base',
      rarity: tpl.rarity,
      socketedGems: [null, null, null],
    };

    soundEngine.playPerfectBell();
    setSave((prev) => ({
      ...prev,
      coins: useHonor ? prev.coins : prev.coins - Math.round(tpl.priceCoins * discountFactor),
      pvp: useHonor
        ? { ...prev.pvp, honorTokens: prev.pvp.honorTokens - (tpl.priceHonor ?? 0) }
        : prev.pvp,
      weapons: [newWeapon, ...prev.weapons],
    }));
    return { ok: true, message: `購買成功！已獲得【${tpl.name}】，可至鍛造屋強化與裝備！` };
  }, [save.coins, save.pvp.honorTokens]);

  const buyGem = useCallback((element: GemElementId, discountFactor = 1): ActionFeedback => {
    const save = store.getSnapshot();
    if (!GEM_ELEMENTS[element] || ![0.7, 1].includes(discountFactor)) return { ok: false, message: '無效的商品或價格。' };
    const def = GEM_ELEMENTS[element];
    const price = Math.round(def.shopPriceCoins * discountFactor);
    if (save.coins < price) return { ok: false, message: `金幣不足（需要 ${price}）。` };
    const gem: GemInstance = {
      uid: `gem-shop-${Date.now().toString(36)}-${Math.floor(Math.random() * 99)}`,
      element,
      level: 1,
    };
    soundEngine.playGemSynth();
    setSave((prev) => ({
      ...prev,
      coins: prev.coins - price,
      gemBag: [gem, ...prev.gemBag],
    }));
    return { ok: true, message: `購入 Lv.1 ${def.name}！集滿 3 顆可在寶石工坊合成升階。` };
  }, [save.coins]);

  const buyBattleItem = useCallback((itemId: BattleItemId, useHonor: boolean, discountFactor = 1): ActionFeedback => {
    const save = store.getSnapshot();
    if (!BATTLE_ITEMS[itemId] || ![0.7, 1].includes(discountFactor)) return { ok: false, message: '無效的商品或價格。' };
    const def = BATTLE_ITEMS[itemId];
    if (useHonor) {
      if (def.priceHonor === undefined) return { ok: false, message: '此商品無法使用榮譽幣購買。' };
      const honorCost = def.priceHonor ?? 999;
      if (save.pvp.honorTokens < honorCost) {
        return { ok: false, message: `競技榮譽幣不足（需要 ${honorCost}）。` };
      }
    } else {
      const price = Math.round(def.priceCoins * discountFactor);
      if (save.coins < price) return { ok: false, message: `金幣不足（需要 ${price}）。` };
    }
    soundEngine.playCorrectChord(2);
    setSave((prev) => ({
      ...prev,
      coins: useHonor ? prev.coins : prev.coins - Math.round(def.priceCoins * discountFactor),
      pvp: useHonor
        ? { ...prev.pvp, honorTokens: prev.pvp.honorTokens - (def.priceHonor ?? 0) }
        : prev.pvp,
      items: { ...prev.items, [itemId]: (prev.items[itemId] ?? 0) + 1 },
    }));
    return { ok: true, message: `已獲得道具【${def.name}】×1！` };
  }, [save.coins, save.pvp.honorTokens]);

  const consumeBattleItem = useCallback((itemId: BattleItemId): boolean => {
    const save = store.getSnapshot();
    if ((save.items[itemId] ?? 0) <= 0) return false;
    setSave((prev) => ({
      ...prev,
      items: { ...prev.items, [itemId]: Math.max(0, (prev.items[itemId] ?? 0) - 1) },
    }));
    return true;
  }, [save.items]);

  const unlockOrBondGuardian = useCallback((guardianId: GuardianId): ActionFeedback => {
    const save = store.getSnapshot();
    const cost = GUARDIAN_SHOP_COSTS[guardianId];
    const bondCost = 90;
    if (save.coins < bondCost) {
      return { ok: false, message: `金幣不足（餵食精靈靈果需要 ${bondCost} 金幣）。` };
    }
    soundEngine.playPetChime();
    setSave((prev) => ({
      ...prev,
      coins: prev.coins - bondCost,
      selectedGuardian: guardianId,
      unlockedGuardians: Array.from(new Set([...prev.unlockedGuardians, guardianId])),
      guardianBonds: {
        ...prev.guardianBonds,
        [guardianId]: (prev.guardianBonds[guardianId] ?? 1) + 2,
      },
    }));
    return {
      ok: true,
      message: `餵食靈果成功！守護精靈羈絆 +2（原價 ${cost.coins} 免費覺醒）！`,
    };
  }, [save.coins]);

  // ==================== PARENT CONTROLS & CSV ====================
  const updateParentSettings = useCallback((patch: Partial<ParentSettings>) => {
    if (patch.pinCode !== undefined && !/^\d{4}$/.test(patch.pinCode)) return;
    if (patch.dailyLimitMinutes !== undefined && (!Number.isInteger(patch.dailyLimitMinutes) || patch.dailyLimitMinutes < 15 || patch.dailyLimitMinutes > 120)) return;
    setSave((prev) => {
      const nextParent = { ...prev.parentSettings, ...patch };
      return {
        ...prev,
        parentSettings: nextParent,
        playMode: nextParent.forcePracticeMode ? 'practice' : prev.playMode,
      };
    });
  }, []);

  const buildLearningCsv = useCallback((): string => {
    const header = '時間,科目/模式,年級,答對題數,總作答題數,正確率(%),得分,時長(秒),結果,學習備註';
    const subjectMap: Record<SubjectId | 'pvp', string> = {
      chinese: '國語文',
      english: '英語文',
      math: '數學',
      science: '自然科學',
      pvp: '線上知識對戰',
    };
    const rows = save.trajectory.map((t) => {
      const acc = t.totalAttempts > 0 ? Math.round((t.correctCount / t.totalAttempts) * 100) : 100;
      const dt = new Date(t.timestamp).toLocaleString('zh-TW');
      const safeNote = t.note.replace(/"/g, '""');
      return `"${dt}","${subjectMap[t.subject]}",${t.grade}年級,${t.correctCount},${t.totalAttempts},${acc},${t.score},${t.durationSeconds},"${t.victory ? '勝利/通關' : '挑戰中'}","${safeNote}"`;
    });
    const summaryRows = (['chinese', 'english', 'math', 'science'] as SubjectId[]).map((sub) => {
      const s = save.subjectStats[sub];
      const acc = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
      return `"累計統計","${subjectMap[sub]}",${save.grade}年級,${s.correct},${s.answered},${acc},${s.bestScore},0,"通關${s.clears}次","最高星數 ${s.starsEarned} 星"`;
    });
    return '\uFEFF' + [header, ...rows, ...summaryRows].join('\n');
  }, [save.grade, save.subjectStats, save.trajectory]);

  const upgradeEquipmentSlot = useCallback(
    (slot: EquipmentSlotId): ActionFeedback => {
      const save = store.getSnapshot();
      const currLv = save.equipment[slot] ?? 1;
      if (currLv >= 15) return { ok: false, message: '該部位裝備已達滿級 +15！' };
      const coinCost = 70 + currLv * 45;
      if (save.coins < coinCost) {
        return { ok: false, message: `金幣不足！強化需要 ${coinCost} 金幣。` };
      }
      soundEngine.playForgeHammer();
      setSave((prev) => ({
        ...prev,
        coins: prev.coins - coinCost,
        equipment: {
          ...prev.equipment,
          [slot]: Math.min(15, (prev.equipment[slot] ?? 1) + 1),
        },
      }));
      const slotNames: Record<EquipmentSlotId, string> = {
        weapon: '主武器槽',
        helm: '智慧頭冠',
        armor: '學園戰甲',
        gloves: '速寫護手',
        boots: '疾風戰靴',
        amulet: '星光護符',
      };
      return { ok: true, message: `${slotNames[slot]} 強化成功！升至 +${currLv + 1}（不爆裝保證）` };
    },
    [save.coins, save.equipment]
  );

  if (!ready) return (
    <main className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-bold">學習存檔保護</h1>
      <p role="status" className="max-w-xl">{notice}</p>
      {choice && <div className="flex flex-wrap gap-3">
        {choice.cloud && <button className="min-h-12 rounded-xl bg-sky-700 px-4" onClick={() => accept(choice.cloud!, true, choice.cloudFingerprint)}>使用雲端進度（先備份本機）</button>}
        <button className="min-h-12 rounded-xl bg-emerald-700 px-4" onClick={() => accept(choice.local, false, null)}>使用本機進度（暫停雲端同步）</button>
      </div>}
      <button className="min-h-12 underline" onClick={exportBackup}>匯出存檔備份</button>
      <button className="min-h-12 underline" onClick={() => window.location.reload()}>重新載入</button>
    </main>
  );

  return (
    <GameStateContext.Provider
      value={{
        save,
        combatStats,
        saveNotice: notice,
        cloudSyncEnabled: cloudEnabled,
        exportSaveBackup: exportBackup,
        equippedWeapon,
        isRestReminderVisible,
        dismissRestReminder: () => setRestDismissed(true),
        setGrade,
        setSemester,
        setPlayMode,
        toggleMute,
        selectGuardian,
        petGuardian,
        selectTitle,
        recordAnswer,
        resolveWrongRecord,
        applyWorldResult,
        applyPvPResult,
        claimDailyQuest,
        equipWeapon,
        enhanceWeapon,
        ascendWeapon,
        fuseWeapons,
        upgradeEquipmentSlot,
        socketGem,
        unsocketGem,
        synthesizeGems,
        buyWeapon,
        buyGem,
        buyBattleItem,
        consumeBattleItem,
        unlockOrBondGuardian,
        updateParentSettings,
        buildLearningCsv,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export function useGameState(): GameStateContextValue {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}
