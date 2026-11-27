import { useLazyRef } from '../core/useLazyRef';
import { useSessionScheduler } from '../core/useSessionScheduler';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, Pause, Shield, Sparkles, Compass, Swords, Wand2, BookOpen } from 'lucide-react';
import type {
  ChineseQuestion,
  ChineseRadicalPayload,
  ChineseSlashPayload,
  ChineseTypoPayload,
  EngineCommonProps,
  WorldRunResult,
} from '../types/game';
import { getChineseQuestions } from '../data/questionBank';
import { QuestionManager } from '../core/questionManager';
import { GUARDIANS } from '../data/guardians';
import {
  calculateCombatDamage,
  calculateStarRating,
  getSpeedGrade,
  getUltimateChargeGain,
} from '../core/combatMath';
import { soundEngine } from '../audio/soundEngine';
import {
  createGameFeel,
  drawInkChibiHero,
  drawInkMonster,
  drawRoundedRect,
  FloatingTextPool,
  ParticlePool,
  triggerGameFeel,
  updateGameFeel,
} from '../canvas/proceduralArt';
import {
  ExplanationBanner,
  UltimateCutIn,
  WorldPauseModal,
} from '../components/UltimateCutIn';

type InkPhase = 'explore' | 'transition' | 'battle';
type SkillMode = 'slash' | 'radical' | 'typo';

interface MapMonster {
  id: string;
  name: string;
  kind: 'poring' | 'slime' | 'boss';
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  hp: number;
  maxHp: number;
  shielded: boolean;
  defeated: boolean;
  angle: number;
}

interface MapChest {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  rewardText: string;
}

export const InkRpgEngine: React.FC<EngineCommonProps> = ({
  grade,
  semester,
  playMode,
  guardianId,
  playerStats,
  stageConfig,
  masteredQuestionIds,
  wrongQuestionIds,
  onAnswerResult,
  onFinish,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guardian = GUARDIANS[guardianId];
  const hpScale = stageConfig?.enemyHpScale ?? 1;

  // Zero-Repeat QuestionManager per skill mode
  const slashMgrRef = useLazyRef(() =>
    new QuestionManager<ChineseQuestion>(getChineseQuestions(grade, semester, 'slash'), {
      masteredQuestionIds,
      wrongQuestionIds,
      focusTags: stageConfig?.focusTags,
    })
  );
  const radicalMgrRef = useLazyRef(() =>
    new QuestionManager<ChineseQuestion>(getChineseQuestions(grade, semester, 'radical'), {
      masteredQuestionIds,
      wrongQuestionIds,
      focusTags: stageConfig?.focusTags,
    })
  );
  const typoMgrRef = useLazyRef(() =>
    new QuestionManager<ChineseQuestion>(getChineseQuestions(grade, semester, 'typo'), {
      masteredQuestionIds,
      wrongQuestionIds,
      focusTags: stageConfig?.focusTags,
    })
  );
  const [bossWarning, setBossWarning] = useState(stageConfig?.tier === 'boss');
  useEffect(() => {
    if (!bossWarning) return;
    const t = window.setTimeout(() => setBossWarning(false), 2600);
    return () => clearTimeout(t);
  }, [bossWarning]);

  const [phase, setPhase] = useState<InkPhase>('explore');
  const [paused, setPaused] = useState(false);
  const { schedule, cancelAll } = useSessionScheduler(paused);
  const [partyHp, setPartyHp] = useState(playerStats.maxHp);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [ultCharge, setUltCharge] = useState(25);
  const [guardianUsed, setGuardianUsed] = useState(false);
  const [freezeTimer, setFreezeTimer] = useState(0);
  const [doubleNext, setDoubleNext] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [atbValues, setAtbValues] = useState<[number, number, number]>([100, 65, 45]);
  const [activeSkill, setActiveSkill] = useState<SkillMode | null>(null);
  const [currentQ, setCurrentQ] = useState<ChineseQuestion | null>(null);
  const [qStartTime, setQStartTime] = useState(0);
  const [selectedRadicals, setSelectedRadicals] = useState<string[]>([]);
  const [battleEnemyUi, setBattleEnemyUi] = useState<{
    name: string;
    kind: 'poring' | 'slime' | 'boss';
    hp: number;
    maxHp: number;
    shielded: boolean;
  } | null>(null);
  const [monstersLeft, setMonstersLeft] = useState(3);
  const [banner, setBanner] = useState<{
    title: string;
    answer: string;
    explanation: string;
    tag: string;
  } | null>(null);
  const [cutIn, setCutIn] = useState(false);
  const [mapToast, setMapToast] = useState<string | null>(
    '點擊草地或用 WASD 移動，撿取古書寶箱並觸碰怪物開戰！'
  );

  // Refs synced for 60FPS loop without re-mounting canvas
  const phaseRef = useRef<InkPhase>('explore');
  const pausedRef = useRef(false);
  const freezeRef = useRef(0);
  const battleEnemyRef = useRef<MapMonster | null>(null);
  const partyHpRef = useRef(playerStats.maxHp);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const correctRef = useRef(0);
  const totalAttemptsRef = useRef(0);
  const unlockedTagsRef = useRef<Set<string>>(new Set());
  const startClockRef = useRef(Date.now());
  const finishedRef = useRef(false);
  const activeSkillRef = useRef<SkillMode | null>(null);

  // Simulation world state inside ref
  const worldRef = useRef({
    time: 0,
    width: 1200,
    height: 700,
    playerX: 180,
    playerY: 420,
    targetX: 180,
    targetY: 420,
    hasClickTarget: false,
    joyX: 0,
    joyY: 0,
    facing: 1 as 1 | -1,
    walkPhase: 0,
    trail: [
      { x: 180, y: 420 },
      { x: 135, y: 445 },
      { x: 92, y: 425 },
    ],
    keys: new Set<string>(),
    transitionAlpha: 0,
    pendingMonster: null as MapMonster | null,
    monsters: [
      {
        id: 'm1',
        name: stageConfig ? `${stageConfig.title}先鋒` : '錯字波利',
        kind: 'poring' as const,
        x: 470,
        y: 350,
        homeX: 470,
        homeY: 350,
        hp: Math.round(145 * hpScale),
        maxHp: Math.round(145 * hpScale),
        shielded: stageConfig ? stageConfig.stageNumber >= 4 : false,
        defeated: false,
        angle: 0,
      },
      {
        id: 'm2',
        name: stageConfig?.tier === 'elite' ? stageConfig.enemyName : '病句史萊姆',
        kind: 'slime' as const,
        x: 780,
        y: 440,
        homeX: 780,
        homeY: 440,
        hp: Math.round(180 * hpScale),
        maxHp: Math.round(180 * hpScale),
        shielded: true,
        defeated: false,
        angle: 2,
      },
      {
        id: 'm3',
        name: stageConfig?.tier === 'boss' ? stageConfig.enemyName : '亂碼魔 Boss',
        kind: 'boss' as const,
        x: 980,
        y: 230,
        homeX: 980,
        homeY: 230,
        hp: Math.round(290 * hpScale),
        maxHp: Math.round(290 * hpScale),
        shielded: true,
        defeated: false,
        angle: 4,
      },
    ] as MapMonster[],
    chests: [
      { id: 'c1', x: 350, y: 220, opened: false, rewardText: '獲得古書靈墨！必殺能量 +25%' },
      { id: 'c2', x: 680, y: 205, opened: false, rewardText: '發現仙丹寶箱！隊伍生命 +30' },
    ] as MapChest[],
    // Battle animation states
    atb: [100, 65, 45] as [number, number, number],
    enemyAtb: 0,
    heroDash: 0, // 0..1
    heroAttackRole: 'swordsman' as 'swordsman' | 'craneMage' | 'pandaHealer',
    enemyHitFlash: 0,
    heroHitFlash: 0,
    fallingChar: null as { char: string; y: number; alpha: number } | null,
    inkSlashArc: 0,
    particles: new ParticlePool(320),
    floats: new FloatingTextPool(48),
    feel: createGameFeel(),
    petals: Array.from({ length: 28 }, () => ({
      x: Math.random() * 1200,
      y: Math.random() * 700,
      vx: -18 - Math.random() * 24,
      vy: 14 + Math.random() * 18,
      size: 4 + Math.random() * 4,
    })),
  });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    pausedRef.current = paused;
    document.body.dataset.state = paused ? 'paused' : 'playing';
  }, [paused]);

  useEffect(() => {
    activeSkillRef.current = activeSkill;
  }, [activeSkill]);

  const pullQuestion = useCallback((mode: SkillMode): ChineseQuestion => {
    const mgr =
      mode === 'slash'
        ? slashMgrRef.current
        : mode === 'radical'
          ? radicalMgrRef.current
          : typoMgrRef.current;
    return mgr.next();
  }, []);

  const concludeRun = useCallback(
    (victory: boolean) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      cancelAll();
      document.body.dataset.state = 'gameover';
      if (victory) soundEngine.playVictoryFanfare();
      else soundEngine.playDefeatSting();

      const clearSeconds = Math.max(1, Math.round((Date.now() - startClockRef.current) / 1000));
      const hpRatio = Math.max(0, partyHpRef.current / playerStats.maxHp);
      const stars = calculateStarRating(
        victory,
        correctRef.current,
        totalAttemptsRef.current,
        hpRatio
      );
      const result: WorldRunResult = {
        subject: 'chinese',
        victory,
        score: scoreRef.current,
        stars,
        correctCount: correctRef.current,
        totalAttempts: totalAttemptsRef.current,
        maxCombo: maxComboRef.current,
        clearSeconds,
        coinsEarned: victory ? 90 + stars * 35 + Math.round(scoreRef.current * 0.05) : 30,
        xpEarned: victory ? 85 + stars * 25 : 25,
        crystalsEarned: victory ? stars * 2 + 1 : 0,
        knowledgeTags: Array.from(unlockedTagsRef.current),
        progressSummary: victory
          ? `淨化${stageConfig?.enemyName ? `「${stageConfig.enemyName}」與` : ''}墨靈幻境全部魔物，耗時 ${clearSeconds} 秒！`
          : `仍有 ${worldRef.current.monsters.filter((m) => !m.defeated).length} 隻魔物未被淨化，調整策略再戰！`,
        stageKey: stageConfig?.stageKey,
        stageLabel: stageConfig ? `第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關「${stageConfig.title}」` : undefined,
        chestRewardText: victory && stars === 3 ? stageConfig?.starChestReward?.label : undefined,
      };
      onFinish(result);
    },
    [onFinish, playerStats.maxHp, stageConfig]
  );

  const openSkillChallenge = useCallback(
    (mode: SkillMode) => {
      if (phaseRef.current !== 'battle' || pausedRef.current || activeSkillRef.current) return;
      const w = worldRef.current;
      const heroIdx = mode === 'slash' ? 0 : mode === 'radical' ? 1 : 2;
      if (w.atb[heroIdx] < 99) return;
      soundEngine.playClick();
      const q = pullQuestion(mode);
      setCurrentQ(q);
      setActiveSkill(mode);
      setSelectedRadicals([]);
      setQStartTime(Date.now());
      soundEngine.speakText(q.prompt, 'zh-TW');
    },
    [pullQuestion]
  );

  const applyPlayerDamageToEnemy = useCallback(
    (
      skillMult: number,
      skillMode: SkillMode,
      isCorrect: boolean,
      q: ChineseQuestion,
      customChar?: string
    ) => {
      const w = worldRef.current;
      const enemy = battleEnemyRef.current;
      if (!enemy) return;

      totalAttemptsRef.current += 1;
      onAnswerResult(q, isCorrect, Math.max(0, Date.now() - qStartTime));

      const enemyX = w.width * 0.72;
      const enemyY = w.height * 0.48;

      if (isCorrect) {
        correctRef.current += 1;
        unlockedTagsRef.current.add(q.knowledgeTag);
        const nextCombo = comboRef.current + 1;
        comboRef.current = nextCombo;
        maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
        setCombo(nextCombo);

        const elapsed = (Date.now() - qStartTime) / 1000;
        const speedGrade = getSpeedGrade(elapsed, 12, playMode, guardianId);
        const calc = calculateCombatDamage({
          baseAttack: playerStats.baseAttack,
        critChance: playerStats.critChance,
          skillMultiplier: skillMult,
          isCorrect: true,
          speedGrade,
          combo: nextCombo,
          guardianId,
          doubleNextAttack: doubleNext,
        });

        let finalDmg = calc.damage;
        let shieldBroken = false;
        if (enemy.shielded) {
          if (skillMode === 'typo') {
            enemy.shielded = false;
            shieldBroken = true;
            finalDmg = Math.round(finalDmg * 1.45);
          } else {
            finalDmg = Math.max(10, Math.round(finalDmg * 0.55));
          }
        }

        if (doubleNext) setDoubleNext(false);

        // Animations & 4-stage game feel!
        w.heroAttackRole =
          skillMode === 'slash' ? 'swordsman' : skillMode === 'radical' ? 'craneMage' : 'pandaHealer';
        w.heroDash = 1.0;
        w.inkSlashArc = 1.0;
        w.enemyHitFlash = 1.0;
        if (customChar) {
          w.fallingChar = { char: customChar, y: enemyY - 210, alpha: 1 };
        }
        triggerGameFeel(w.feel, {
          hitstop: 0.06,
          shake: calc.isCritical || shieldBroken ? 0.65 : 0.35,
          flash: calc.isBurst ? 0.28 : 0.14,
          flashColor: '#FEF08A',
        });

        w.particles.burst(
          enemyX,
          enemyY,
          calc.isCritical ? 26 : 16,
          ['#F59E0B', '#EF4444', '#FEF08A', '#0F172A'],
          90,
          290,
          7,
          'spark'
        );
        w.particles.spawn(enemyX, enemyY, 0, 0, '#F59E0B', 14, 0.35, 0, 'ring');

        if (speedGrade === 'PERFECT') soundEngine.playPerfectBell();
        else soundEngine.playCorrectChord(nextCombo);
        soundEngine.playSlash();

        const tagLabel = shieldBroken
          ? '破盾暴擊！'
          : speedGrade === 'PERFECT'
            ? 'PERFECT!'
            : calc.isBurst
              ? '智光爆發！'
              : '';
        w.floats.spawn(
          enemyX,
          enemyY - 40,
          `-${finalDmg}`,
          speedGrade === 'PERFECT' ? 'perfect' : calc.isCritical ? 'crit' : 'normal',
          tagLabel
        );

        // Typo skill also heals party via Panda Healer!
        if (skillMode === 'typo') {
          const heal = Math.round(playerStats.maxHp * 0.15);
          partyHpRef.current = Math.min(playerStats.maxHp, partyHpRef.current + heal);
          setPartyHp(partyHpRef.current);
          w.floats.spawn(w.width * 0.25, w.height * 0.45, `+${heal}`, 'heal', '印璽治癒');
        }

        enemy.hp = Math.max(0, enemy.hp - finalDmg);
        scoreRef.current += finalDmg * 3 + (speedGrade === 'PERFECT' ? 120 : 60);
        setScore(scoreRef.current);
        setUltCharge((u) => Math.min(100, u + getUltimateChargeGain(speedGrade, nextCombo, guardianId, playerStats.ultChargeBonus)));

        // Reset used hero's ATB
        const heroIdx = skillMode === 'slash' ? 0 : skillMode === 'radical' ? 1 : 2;
        w.atb[heroIdx] = 0;

        setBattleEnemyUi({
          name: enemy.name,
          kind: enemy.kind,
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          shielded: enemy.shielded,
        });

        if (enemy.hp <= 0) {
          enemy.defeated = true;
          soundEngine.playExplosion();
          w.particles.burst(enemyX, enemyY, 34, ['#F59E0B', '#F43F5E', '#FEF08A'], 80, 320, 8, 'circle');
          const remaining = w.monsters.filter((m) => !m.defeated).length;
          setMonstersLeft(remaining);
          schedule(() => {
            if (remaining === 0) {
              concludeRun(true);
            } else {
              battleEnemyRef.current = null;
              setBattleEnemyUi(null);
              setPhase('explore');
              setMapToast(`成功淨化「${enemy.name}」！還有 ${remaining} 隻魔物等待挑戰！`);
            }
          }, 750);
        }
      } else {
        // Wrong answer: break combo, show clear non-blocking explanation, monster counterattacks gently
        comboRef.current = 0;
        setCombo(0);
        soundEngine.playWrongBuzz();
        setBanner({
          title: '招式受阻！記住這個國語知識點',
          answer: q.answer,
          explanation: q.explanation,
          tag: q.knowledgeTag,
        });
        const heroIdx = skillMode === 'slash' ? 0 : skillMode === 'radical' ? 1 : 2;
        w.atb[heroIdx] = 25;

        const dmg = shieldActive ? 0 : enemy.kind === 'boss' ? 18 : 12;
        if (shieldActive) {
          setShieldActive(false);
          w.floats.spawn(w.width * 0.25, w.height * 0.45, '結界抵擋', 'heal');
        } else {
          w.heroHitFlash = 0.9;
          triggerGameFeel(w.feel, { shake: 0.35, hitstop: 0.04 });
          partyHpRef.current = Math.max(0, partyHpRef.current - dmg);
          setPartyHp(partyHpRef.current);
          w.floats.spawn(w.width * 0.26, w.height * 0.46, `-${dmg}`, 'crit', '反擊');
          if (partyHpRef.current <= 0) {
            schedule(() => concludeRun(false), 550);
          }
        }
      }

      setActiveSkill(null);
      setCurrentQ(null);
      setSelectedRadicals([]);
    },
    [
      concludeRun,
      doubleNext,
      guardianId,
      onAnswerResult,
      playMode,
      playerStats.baseAttack,
      playerStats.maxHp,
      qStartTime,
      shieldActive,
    ]
  );

  const handleTriggerUltimate = () => {
    if (ultCharge < 100 || phaseRef.current !== 'battle' || !battleEnemyRef.current) return;
    soundEngine.playUltimateRoar();
    setUltCharge(0);
    setCutIn(true);
    schedule(() => {
      setCutIn(false);
      const w = worldRef.current;
      const enemy = battleEnemyRef.current;
      if (!enemy) return;
      enemy.shielded = false;
      const dmg = Math.round(playerStats.baseAttack * 3.8);
      enemy.hp = Math.max(0, enemy.hp - dmg);
      w.fallingChar = { char: '智', y: w.height * 0.2, alpha: 1 };
      w.enemyHitFlash = 1;
      triggerGameFeel(w.feel, { hitstop: 0.08, shake: 0.95, flash: 0.4, flashColor: '#FDE047' });
      w.particles.burst(w.width * 0.72, w.height * 0.48, 42, ['#FDE047', '#F59E0B', '#EF4444'], 120, 380, 9, 'spark');
      w.floats.spawn(w.width * 0.72, w.height * 0.4, `-${dmg}`, 'perfect', '萬墨歸宗！');
      scoreRef.current += dmg * 4;
      setScore(scoreRef.current);
      setBattleEnemyUi({
        name: enemy.name,
        kind: enemy.kind,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        shielded: false,
      });
      if (enemy.hp <= 0) {
        enemy.defeated = true;
        const remaining = w.monsters.filter((m) => !m.defeated).length;
        setMonstersLeft(remaining);
        schedule(() => {
          if (remaining === 0) concludeRun(true);
          else {
            battleEnemyRef.current = null;
            setBattleEnemyUi(null);
            setPhase('explore');
          }
        }, 700);
      }
    }, 1250);
  };

  const handleGuardianSkill = () => {
    if (guardianUsed) return;
    setGuardianUsed(true);
    soundEngine.playPerfectBell();
    const w = worldRef.current;
    setMapToast(guardian.battleCheer);

    if (guardian.activeEffectKey === 'ink_heal_boost') {
      const heal = Math.round(playerStats.maxHp * 0.35);
      partyHpRef.current = Math.min(playerStats.maxHp, partyHpRef.current + heal);
      setPartyHp(partyHpRef.current);
      setDoubleNext(true);
      w.floats.spawn(w.width * 0.28, w.height * 0.45, `+${heal} & 2x`, 'heal', guardian.activeName);
    } else if (guardian.activeEffectKey === 'full_ultimate') {
      setUltCharge(100);
      w.floats.spawn(w.width * 0.28, w.height * 0.45, '必殺 100%', 'perfect', guardian.activeName);
    } else if (guardian.activeEffectKey === 'freeze_timer') {
      freezeRef.current = 8;
      setFreezeTimer(8);
      w.atb = [100, 100, 100];
      setAtbValues([100, 100, 100]);
      w.floats.spawn(w.width * 0.5, w.height * 0.4, '時空定格 8s', 'perfect', guardian.activeName);
    } else {
      setShieldActive(true);
      const heal = Math.round(playerStats.maxHp * 0.25);
      partyHpRef.current = Math.min(playerStats.maxHp, partyHpRef.current + heal);
      setPartyHp(partyHpRef.current);
      w.floats.spawn(w.width * 0.28, w.height * 0.45, '翡翠無敵盾', 'heal', guardian.activeName);
    }
  };

  const guideToNearestMonster = () => {
    const w = worldRef.current;
    const alive = w.monsters.find((m) => !m.defeated);
    if (!alive) return;
    soundEngine.playClick();
    w.targetX = alive.x;
    w.targetY = alive.y;
    w.hasClickTarget = true;
  };

  // Main 60FPS independent Canvas 2D loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      worldRef.current.width = rect.width;
      worldRef.current.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setPaused((prev) => !prev);
        return;
      }
      worldRef.current.keys.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      worldRef.current.keys.delete(e.key.toLowerCase());
    };
    const onBlur = () => {
      worldRef.current.keys.clear();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let rafId = 0;
    let yieldTimer = 0;
    let alive = true;
    let lastTs = performance.now();
    let hudSyncAccum = 0;

    const loop = (now: number) => {
      if (!alive) return;
      const frameStart = performance.now();
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const w = worldRef.current;
      const { simDt, shakeX, shakeY } = updateGameFeel(w.feel, pausedRef.current ? 0 : rawDt);
      const dt = pausedRef.current ? 0 : simDt;
      w.time += dt;

      if (freezeRef.current > 0 && dt > 0) {
        freezeRef.current = Math.max(0, freezeRef.current - dt);
      }

      // Ambient drifting sakura petals
      for (const p of w.petals) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -10) p.x = w.width + 10;
        if (p.y > w.height + 10) p.y = -10;
      }

      w.particles.update(dt);
      w.floats.update(dt);

      if (phaseRef.current === 'explore' && dt > 0) {
        // Movement via WASD / Arrows, Virtual Touch Joystick, or click-to-walk
        let dx = w.joyX;
        let dy = w.joyY;
        if (w.keys.has('w') || w.keys.has('arrowup')) dy -= 1;
        if (w.keys.has('s') || w.keys.has('arrowdown')) dy += 1;
        if (w.keys.has('a') || w.keys.has('arrowleft')) dx -= 1;
        if (w.keys.has('d') || w.keys.has('arrowright')) dx += 1;

        const speed = 225 * (1 + playerStats.speedBonus);
        if (Math.abs(dx) > 0.08 || Math.abs(dy) > 0.08) {
          w.hasClickTarget = false;
          const len = Math.max(1, Math.hypot(dx, dy));
          w.playerX += (dx / len) * speed * dt;
          w.playerY += (dy / len) * speed * dt;
          w.facing = dx < 0 ? -1 : 1;
          w.walkPhase += dt * 1.4;
        } else if (w.hasClickTarget) {
          const tx = w.targetX - w.playerX;
          const ty = w.targetY - w.playerY;
          const dist = Math.hypot(tx, ty);
          if (dist > 8) {
            w.playerX += (tx / dist) * speed * dt;
            w.playerY += (ty / dist) * speed * dt;
            w.facing = tx < 0 ? -1 : 1;
            w.walkPhase += dt * 1.4;
          } else {
            w.hasClickTarget = false;
          }
        }

        w.playerX = Math.max(54, Math.min(w.width - 54, w.playerX));
        w.playerY = Math.max(105, Math.min(w.height - 65, w.playerY));

        // Follow party trail smoothly
        w.trail[0] = { x: w.playerX, y: w.playerY };
        for (let i = 1; i < w.trail.length; i++) {
          const prev = w.trail[i - 1];
          const curr = w.trail[i];
          const d = Math.hypot(prev.x - curr.x, prev.y - curr.y);
          if (d > 48) {
            curr.x += ((prev.x - curr.x) / d) * (d - 48) * 0.25;
            curr.y += ((prev.y - curr.y) / d) * (d - 48) * 0.25;
          }
        }

        // Chest pickups
        for (const c of w.chests) {
          if (c.opened) continue;
          const cx = (c.x / 1200) * w.width;
          const cy = (c.y / 700) * w.height;
          if (Math.hypot(w.playerX - cx, w.playerY - cy) < 46) {
            c.opened = true;
            soundEngine.playPerfectBell();
            w.particles.burst(cx, cy, 18, ['#FACC15', '#FEF08A', '#34D399'], 60, 180, 6);
            if (c.id === 'c1') {
              setUltCharge((u) => Math.min(100, u + 25));
            } else {
              partyHpRef.current = Math.min(playerStats.maxHp, partyHpRef.current + 30);
              setPartyHp(partyHpRef.current);
            }
            w.floats.spawn(cx, cy - 20, '古書寶箱！', 'perfect');
            setMapToast(c.rewardText);
          }
        }

        // Patrol monsters & encounter check
        for (const m of w.monsters) {
          if (m.defeated) continue;
          m.angle += dt * (m.kind === 'boss' ? 0.7 : 1.15);
          const mx = (m.homeX / 1200) * w.width + Math.cos(m.angle) * (m.kind === 'boss' ? 28 : 42);
          const my = (m.homeY / 700) * w.height + Math.sin(m.angle * 1.3) * 20;
          m.x = mx;
          m.y = my;

          if (Math.hypot(w.playerX - mx, w.playerY - my) < 52) {
            soundEngine.playSlash();
            w.pendingMonster = m;
            w.transitionAlpha = 0.01;
            phaseRef.current = 'transition';
            setPhase('transition');
            break;
          }
        }
      } else if (phaseRef.current === 'transition' && dt > 0) {
        w.transitionAlpha += dt * 2.6;
        if (w.transitionAlpha >= 1 && w.pendingMonster) {
          battleEnemyRef.current = w.pendingMonster;
          setBattleEnemyUi({
            name: w.pendingMonster.name,
            kind: w.pendingMonster.kind,
            hp: w.pendingMonster.hp,
            maxHp: w.pendingMonster.maxHp,
            shielded: w.pendingMonster.shielded,
          });
          w.atb = [100, 82, 70];
          w.enemyAtb = 0;
          phaseRef.current = 'battle';
          setPhase('battle');
          w.transitionAlpha = 0;
        }
      } else if (phaseRef.current === 'battle' && dt > 0) {
        // Decay battle VFX
        if (w.heroDash > 0) w.heroDash = Math.max(0, w.heroDash - dt * 2.6);
        if (w.inkSlashArc > 0) w.inkSlashArc = Math.max(0, w.inkSlashArc - dt * 3.2);
        if (w.enemyHitFlash > 0) w.enemyHitFlash = Math.max(0, w.enemyHitFlash - dt * 5);
        if (w.heroHitFlash > 0) w.heroHitFlash = Math.max(0, w.heroHitFlash - dt * 5);
        if (w.fallingChar) {
          w.fallingChar.y += 420 * dt;
          w.fallingChar.alpha -= dt * 1.1;
          if (w.fallingChar.alpha <= 0) w.fallingChar = null;
        }

        // ATB charges when not answering a modal question
        if (!activeSkillRef.current) {
          const atbSpeed = [28, 23, 21];
          for (let i = 0; i < 3; i++) {
            w.atb[i] = Math.min(100, w.atb[i] + atbSpeed[i] * (1 + playerStats.speedBonus) * dt);
          }

          // Enemy ATB (paused in practice mode or during Griffin time freeze)
          if (playMode === 'adventure' && freezeRef.current <= 0 && battleEnemyRef.current && battleEnemyRef.current.hp > 0) {
            const enemySpeed = battleEnemyRef.current.kind === 'boss' ? 11.5 : 8.5;
            w.enemyAtb += enemySpeed * dt;
            if (w.enemyAtb >= 100) {
              w.enemyAtb = 0;
              const dmg = battleEnemyRef.current.kind === 'boss' ? 14 : 9;
              w.heroHitFlash = 0.85;
              triggerGameFeel(w.feel, { shake: 0.3 });
              soundEngine.playWrongBuzz();
              partyHpRef.current = Math.max(0, partyHpRef.current - dmg);
              setPartyHp(partyHpRef.current);
              w.floats.spawn(w.width * 0.25, w.height * 0.42, `-${dmg}`, 'crit', '魔物突襲');
              if (partyHpRef.current <= 0) {
                concludeRun(false);
              }
            }
          }
        }
      }

      // Throttled HUD ATB sync (~12Hz)
      hudSyncAccum += rawDt;
      if (hudSyncAccum > 0.085) {
        hudSyncAccum = 0;
        if (phaseRef.current === 'battle') {
          setAtbValues([Math.round(w.atb[0]), Math.round(w.atb[1]), Math.round(w.atb[2])]);
        }
        if (freezeRef.current >= 0) {
          setFreezeTimer(Math.ceil(freezeRef.current));
        }
      }

      // ==================== RENDER ====================
      ctx.save();
      ctx.translate(shakeX, shakeY);
      const W = w.width;
      const H = w.height;

      if (phaseRef.current === 'explore' || phaseRef.current === 'transition') {
        // RO-Style Bright Ink-Scroll Fantasy Overworld
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#D1FAE5');
        bgGrad.addColorStop(0.5, '#86EFAC');
        bgGrad.addColorStop(1, '#4ADE80');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Distant ink-wash misty mountains at top
        ctx.fillStyle = 'rgba(15, 118, 110, 0.22)';
        ctx.beginPath();
        ctx.moveTo(0, 145);
        ctx.quadraticCurveTo(W * 0.18, 45, W * 0.36, 125);
        ctx.quadraticCurveTo(W * 0.56, 30, W * 0.78, 120);
        ctx.quadraticCurveTo(W * 0.92, 65, W, 130);
        ctx.lineTo(W, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();

        // Winding azure ink river
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 56;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(W * 0.55, 70);
        ctx.bezierCurveTo(W * 0.48, H * 0.38, W * 0.65, H * 0.62, W * 0.52, H + 20);
        ctx.stroke();

        // Shimmering water lines
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 6; i++) {
          const wy = ((i * 110 + w.time * 28) % H);
          ctx.beginPath();
          ctx.moveTo(W * 0.53, wy);
          ctx.lineTo(W * 0.57, wy + 14);
          ctx.stroke();
        }

        // Stone Arch Bridge over the river
        const bx = W * 0.54;
        const by = H * 0.48;
        ctx.fillStyle = '#E7E5E4';
        ctx.strokeStyle = '#57534E';
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, bx - 54, by - 28, 108, 56, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#B45309';
        ctx.fillRect(bx - 52, by - 32, 104, 8);
        ctx.fillRect(bx - 52, by + 24, 104, 8);

        // Ancient Calligraphy Stone Steles (landmarks)
        for (const [sx, sy, ch] of [
          [W * 0.22, H * 0.28, '文'],
          [W * 0.84, H * 0.22, '墨'],
        ] as [number, number, string][]) {
          ctx.fillStyle = '#CBD5E1';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          drawRoundedRect(ctx, sx - 20, sy - 34, 40, 60, 8);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#0F172A';
          ctx.font = '900 22px "Noto Sans TC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(ch, sx, sy + 2);
        }

        // Click destination ring
        if (w.hasClickTarget) {
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w.targetX, w.targetY, 14 + Math.sin(w.time * 10) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Ancient Book Chests
        for (const c of w.chests) {
          const cx = (c.x / 1200) * W;
          const cy = (c.y / 700) * H;
          ctx.fillStyle = c.opened ? '#94A3B8' : '#D97706';
          ctx.strokeStyle = '#451A03';
          ctx.lineWidth = 2.5;
          drawRoundedRect(ctx, cx - 18, cy - 14, 36, 26, 6);
          ctx.fill();
          ctx.stroke();
          if (!c.opened) {
            ctx.fillStyle = '#FEF08A';
            ctx.fillRect(cx - 5, cy - 6, 10, 10);
            ctx.font = '700 11px "Noto Sans TC", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#78350F';
            ctx.fillText('古書寶箱', cx, cy - 20);
          }
        }

        // Patrolling Monsters
        for (const m of w.monsters) {
          if (m.defeated) continue;
          drawInkMonster(ctx, m.kind, m.x, m.y, w.time, {
            shielded: m.shielded,
            hpRatio: m.hp / m.maxHp,
            name: m.name,
          });
        }

        // 3-Hero RO Party
        drawInkChibiHero(ctx, 'pandaHealer', w.trail[2].x, w.trail[2].y, w.time, {
          facing: w.facing,
          walkPhase: w.walkPhase,
          label: '印璽醫者',
          scale: 0.9,
        });
        drawInkChibiHero(ctx, 'craneMage', w.trail[1].x, w.trail[1].y, w.time, {
          facing: w.facing,
          walkPhase: w.walkPhase,
          label: '詩韻法師',
          scale: 0.92,
        });
        drawInkChibiHero(ctx, 'swordsman', w.trail[0].x, w.trail[0].y, w.time, {
          facing: w.facing,
          walkPhase: w.walkPhase,
          label: '墨劍士',
          scale: 1.0,
        });

        // Ink wash transition splash
        if (phaseRef.current === 'transition') {
          ctx.fillStyle = `rgba(15, 23, 42, ${Math.min(0.95, w.transitionAlpha)})`;
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, w.transitionAlpha * Math.hypot(W, H) * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // ==================== RO SIDE-ANGLE ATB BATTLE STAGE ====================
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#FEF3C7');
        sky.addColorStop(0.52, '#FDE68A');
        sky.addColorStop(0.52, '#A7F3D0');
        sky.addColorStop(1, '#34D399');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // Ink mountains silhouette on horizon
        ctx.fillStyle = 'rgba(30, 41, 59, 0.16)';
        ctx.beginPath();
        ctx.moveTo(0, H * 0.52);
        ctx.lineTo(W * 0.2, H * 0.34);
        ctx.lineTo(W * 0.42, H * 0.5);
        ctx.lineTo(W * 0.72, H * 0.31);
        ctx.lineTo(W, H * 0.52);
        ctx.closePath();
        ctx.fill();

        // Calligraphy golden battle floor ring
        const isPortrait = W < 640;
        const shiftY = isPortrait ? -H * 0.11 : 0;
        const heroScaleMul = isPortrait ? 0.88 : 1;

        ctx.strokeStyle = 'rgba(217, 119, 6, 0.32)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(W * 0.5, H * 0.57 + shiftY, W * 0.38, H * 0.13, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Freeze aura when Griffin skill active
        if (freezeRef.current > 0) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fillRect(0, 0, W, H);
        }

        // Dash offset for attacking hero
        const dashOffset = Math.sin(w.heroDash * Math.PI) * (W * 0.32);

        // 3 Heroes in classic RO staggered formation
        drawInkChibiHero(
          ctx,
          'swordsman',
          W * 0.27 + (w.heroAttackRole === 'swordsman' ? dashOffset : 0),
          H * 0.44 + shiftY,
          w.time,
          {
            facing: 1,
            attackProgress: w.heroAttackRole === 'swordsman' ? w.heroDash : 0,
            hitFlash: w.heroHitFlash,
            label: '墨劍士',
            scale: 1.28 * heroScaleMul,
          }
        );
        drawInkChibiHero(
          ctx,
          'craneMage',
          W * 0.17 + (w.heroAttackRole === 'craneMage' ? dashOffset * 0.5 : 0),
          H * 0.52 + shiftY,
          w.time,
          {
            facing: 1,
            attackProgress: w.heroAttackRole === 'craneMage' ? w.heroDash : 0,
            hitFlash: w.heroHitFlash,
            label: '詩韻法師',
            scale: 1.22 * heroScaleMul,
          }
        );
        drawInkChibiHero(
          ctx,
          'pandaHealer',
          W * 0.26 + (w.heroAttackRole === 'pandaHealer' ? dashOffset * 0.5 : 0),
          H * 0.59 + shiftY,
          w.time,
          {
            facing: 1,
            attackProgress: w.heroAttackRole === 'pandaHealer' ? w.heroDash : 0,
            hitFlash: w.heroHitFlash,
            label: '印璽醫者',
            scale: 1.2 * heroScaleMul,
          }
        );

        // Enemy on right
        const enemy = battleEnemyRef.current;
        if (enemy) {
          drawInkMonster(ctx, enemy.kind, W * 0.72, H * 0.49 + shiftY, w.time, {
            hitFlash: w.enemyHitFlash,
            shielded: enemy.shielded,
            hpRatio: enemy.hp / enemy.maxHp,
            name: enemy.name,
            scale: (enemy.kind === 'boss' ? 1.9 : 1.55) * heroScaleMul,
          });

          // Enemy ATB warning ring
          if (w.enemyAtb > 72 && playMode === 'adventure') {
            ctx.strokeStyle = '#F43F5E';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(W * 0.72, H * 0.49 + shiftY, 58 + Math.sin(w.time * 18) * 5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Ink Slash Arc Trail
        if (w.inkSlashArc > 0) {
          ctx.save();
          ctx.globalAlpha = w.inkSlashArc;
          ctx.strokeStyle = '#DC2626';
          ctx.lineWidth = 14 * w.inkSlashArc;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(W * 0.72, H * 0.49, 68, -2.3, 0.7);
          ctx.stroke();
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 5 * w.inkSlashArc;
          ctx.stroke();
          ctx.restore();
        }

        // Giant Golden Falling Calligraphy Character (Radical Magic Circle Payoff!)
        if (w.fallingChar) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, w.fallingChar.alpha);
          ctx.font = '900 120px "Noto Sans TC", serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 10;
          ctx.strokeStyle = '#78350F';
          ctx.strokeText(w.fallingChar.char, W * 0.72, w.fallingChar.y);
          ctx.fillStyle = '#FDE047';
          ctx.fillText(w.fallingChar.char, W * 0.72, w.fallingChar.y);
          ctx.restore();
        }
      }

      // Drifting sakura petals
      ctx.fillStyle = 'rgba(251, 113, 133, 0.65)';
      for (const p of w.petals) {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.55, w.time + p.x * 0.01, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles & RO Bouncing Damage Numbers
      w.particles.render(ctx);
      w.floats.render(ctx);

      if (w.feel.flashAlpha > 0.01) {
        ctx.fillStyle = w.feel.flashColor;
        ctx.globalAlpha = w.feel.flashAlpha;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
      const workMs = performance.now() - frameStart;
      if (workMs > 10) {
        yieldTimer = window.setTimeout(() => {
          if (alive) rafId = requestAnimationFrame(loop);
        }, Math.min(40, Math.round(workMs)));
      } else {
        rafId = requestAnimationFrame(loop);
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      clearTimeout(yieldTimer);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [concludeRun, playMode, playerStats.maxHp, playerStats.speedBonus]);

  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const joyActiveIdRef = useRef<number | null>(null);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = 36;
    const rawX = clientX - cx;
    const rawY = clientY - cy;
    const dist = Math.hypot(rawX, rawY);
    const clampedDist = Math.min(maxR, dist);
    const angle = Math.atan2(rawY, rawX);
    const kx = dist > 2 ? Math.cos(angle) * clampedDist : 0;
    const ky = dist > 2 ? Math.sin(angle) * clampedDist : 0;
    setJoyKnob({ x: kx, y: ky });
    worldRef.current.joyX = kx / maxR;
    worldRef.current.joyY = ky / maxR;
  };

  const resetJoystick = () => {
    joyActiveIdRef.current = null;
    setJoyKnob({ x: 0, y: 0 });
    worldRef.current.joyX = 0;
    worldRef.current.joyY = 0;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'explore' || pausedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    worldRef.current.targetX = e.clientX - rect.left;
    worldRef.current.targetY = e.clientY - rect.top;
    worldRef.current.hasClickTarget = true;
    soundEngine.playClick();
  };

  const handleRadicalPick = (part: string) => {
    if (!currentQ || currentQ.payload.mode !== 'radical') return;
    const payload = currentQ.payload as ChineseRadicalPayload;
    soundEngine.playClick();
    soundEngine.hapticPulse(14);

    if (selectedRadicals.includes(part)) {
      setSelectedRadicals((prev) => prev.filter((p) => p !== part));
      return;
    }
    const next = [...selectedRadicals, part];
    setSelectedRadicals(next);
    if (next.length === 2) {
      const ok =
        (next[0] === payload.partA && next[1] === payload.partB) ||
        (next[0] === payload.partB && next[1] === payload.partA);
      applyPlayerDamageToEnemy(1.45, 'radical', ok, currentQ, payload.targetChar);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-emerald-950" data-testid="ink-rpg-engine">
      {/* Isolated Full-Bleed Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="block w-full h-full cursor-pointer"
        data-testid="ink-rpg-canvas"
      />

      {/* Top Perimeter HUD (No backdrop-blur over canvas, responsive wrap on mobile) */}
      <div className="fixed inset-x-0 top-0 z-20 pointer-events-none safe-top p-2.5 sm:p-3 flex flex-wrap items-start justify-between gap-2">
        {/* Left: Party HP + World Status */}
        <div className="pointer-events-auto max-w-full rounded-2xl bg-slate-900/92 border-2 border-amber-400/80 px-3 sm:px-4 py-2 shadow-xl flex flex-wrap items-center gap-2.5 sm:gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-amber-300 tracking-wide truncate max-w-[200px] sm:max-w-none">
              {stageConfig
                ? `墨靈幻境・第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關「${stageConfig.title}」`
                : `國語文・墨靈幻境（${grade}年級）`}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
              <span className="text-[11px] font-black text-emerald-300">HP</span>
              <div className="w-20 sm:w-32 h-3 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-transform origin-left"
                  style={{ transform: `scaleX(${Math.max(0, partyHp / playerStats.maxHp)})` }}
                />
              </div>
              <span className="text-[11px] font-black text-white font-mono-num">
                {partyHp}/{playerStats.maxHp}
              </span>
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-700" />
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-bold">魔物</div>
              <div className="text-sm sm:text-lg font-black text-amber-300 font-mono-num">{monstersLeft}/3</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-bold">連擊</div>
              <div className="text-sm sm:text-lg font-black text-rose-400 font-mono-num">{combo}x</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-bold">積分</div>
              <div className="text-sm sm:text-lg font-black text-white font-mono-num">{score}</div>
            </div>
          </div>
        </div>

        {/* Right: Guardian Active Skill + Pause */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 ml-auto">
          {freezeTimer > 0 && (
            <div className="rounded-xl bg-sky-600 text-white font-black text-xs px-2.5 py-2 shadow-lg">
              定格 {freezeTimer}s
            </div>
          )}
          <button
            type="button"
            disabled={guardianUsed}
            onClick={handleGuardianSkill}
            className={`min-h-[42px] px-2.5 sm:px-3.5 rounded-xl font-black text-xs border-2 flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 ${
              guardianUsed
                ? 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-slate-950'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-none">{guardian.activeName}</span>
          </button>
          <button
            type="button"
            onClick={() => setPaused(true)}
            aria-label="暫停遊戲"
            className="w-11 h-11 rounded-xl bg-slate-900/92 hover:bg-slate-800 border-2 border-slate-600 text-white flex items-center justify-center shadow-lg shrink-0"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Explore Phase: Bottom-Left Translucent Virtual Joystick + Auto-Path CTA */}
      {phase === 'explore' && (
        <>
          {/* Virtual Touch Joystick (Mobile & Tablet Thumb Control) */}
          <div
            ref={joyBaseRef}
            data-testid="ink-virtual-joystick"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture?.(e.pointerId);
              joyActiveIdRef.current = e.pointerId;
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (joyActiveIdRef.current !== e.pointerId) return;
              e.stopPropagation();
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              if (joyActiveIdRef.current === e.pointerId) resetJoystick();
            }}
            onPointerCancel={resetJoystick}
            className="fixed left-4 bottom-5 z-25 w-28 h-28 rounded-full bg-slate-900/55 border-2 border-amber-300/55 flex items-center justify-center touch-none select-none shadow-2xl"
            aria-label="虛擬方向搖桿"
          >
            <div className="w-12 h-12 rounded-full border border-white/25 pointer-events-none" />
            <div
              className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 border-2 border-white shadow-lg pointer-events-none"
              style={{
                transform: `translate3d(${joyKnob.x}px, ${joyKnob.y}px, 0)`,
              }}
            />
          </div>

          <div className="fixed right-4 left-36 sm:inset-x-0 bottom-5 z-20 pointer-events-none flex flex-col items-end sm:items-center gap-2 px-1 sm:px-4">
            {mapToast && (
              <div className="rounded-xl bg-slate-900/92 border border-amber-400/70 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-100 shadow-lg max-w-full">
                {mapToast}
              </div>
            )}
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.hapticPulse(12);
                  guideToNearestMonster();
                }}
                className="min-h-[50px] px-4 sm:px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-transform active:scale-95"
              >
                <Compass className="w-5 h-5" /> 自動尋路迎戰魔物
              </button>
            </div>
          </div>
        </>
      )}

      {/* Battle Phase: ATB Skill Deck (Bottom Dock) */}
      {phase === 'battle' && !activeSkill && battleEnemyUi && (
        <div className="fixed inset-x-0 bottom-3 z-20 pointer-events-none flex flex-col items-center px-4">
          <div className="pointer-events-auto w-full max-w-4xl rounded-2xl bg-slate-900/95 border-2 border-amber-400/80 p-3 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 px-1">
              <div className="text-xs sm:text-sm font-black text-amber-200 flex items-center gap-2">
                <span>遭遇：{battleEnemyUi.name}</span>
                <span className="text-slate-400">·</span>
                <span className="font-mono-num text-rose-300">
                  HP {battleEnemyUi.hp}/{battleEnemyUi.maxHp}
                </span>
                {battleEnemyUi.shielded && (
                  <span className="text-sky-300 inline-flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> 護盾中（請用「破邪斬句」破防！）
                  </span>
                )}
              </div>
              <button
                type="button"
                disabled={ultCharge < 100}
                onClick={handleTriggerUltimate}
                className={`min-h-[40px] px-4 rounded-xl font-black text-xs flex items-center gap-1.5 transition-transform active:scale-95 ${
                  ultCharge >= 100
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_16px_rgba(244,63,94,0.65)]'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" /> 萬墨歸宗 ({ultCharge}%)
              </button>
            </div>

            {/* 3 Distinct Skill Cards with Live ATB Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={atbValues[0] < 99}
                onClick={() => openSkillChallenge('slash')}
                className={`min-h-[64px] rounded-xl p-2.5 border-2 text-left transition-transform active:scale-95 ${
                  atbValues[0] >= 99
                    ? 'bg-amber-500/20 border-amber-400 hover:bg-amber-500/30 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-amber-300" /> 墨痕斬・普攻
                  </span>
                  <span className="text-[11px] font-mono-num text-amber-300">{atbValues[0]}%</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">成語修辭快斬 · 墨劍士</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${atbValues[0]}%` }} />
                </div>
              </button>

              <button
                type="button"
                disabled={atbValues[1] < 99}
                onClick={() => openSkillChallenge('radical')}
                className={`min-h-[64px] rounded-xl p-2.5 border-2 text-left transition-transform active:scale-95 ${
                  atbValues[1] >= 99
                    ? 'bg-sky-500/20 border-sky-400 hover:bg-sky-500/30 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-sky-300" /> 部件拼字法陣
                  </span>
                  <span className="text-[11px] font-mono-num text-sky-300">{atbValues[1]}%</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">兩部件合體召喚大字 · 詩韻法師</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-400" style={{ width: `${atbValues[1]}%` }} />
                </div>
              </button>

              <button
                type="button"
                disabled={atbValues[2] < 99}
                onClick={() => openSkillChallenge('typo')}
                className={`min-h-[64px] rounded-xl p-2.5 border-2 text-left transition-transform active:scale-95 ${
                  atbValues[2] >= 99
                    ? 'bg-emerald-500/20 border-emerald-400 hover:bg-emerald-500/30 text-white'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-300" /> 破邪斬句・破盾
                  </span>
                  <span className="text-[11px] font-mono-num text-emerald-300">{atbValues[2]}%</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">斬碎石碑錯別字＋治癒 · 印璽醫者</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${atbValues[2]}%` }} />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Interactive Overlay (3 Distinct Chinese Mechanics!) */}
      {phase === 'battle' && activeSkill && currentQ && (
        <div className="fixed inset-x-0 bottom-3 z-30 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-3xl rounded-3xl bg-slate-900/96 border-2 border-amber-400 p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-xs font-black text-amber-300">
                {activeSkill === 'slash' && '【墨痕斬】快速辨識語文奧義'}
                {activeSkill === 'radical' && '【部件拼字魔法陣】依序點選 2 個偏旁部首組成漢字'}
                {activeSkill === 'typo' && '【破邪斬句】直接點擊石碑中隱藏的錯別字將其斬碎！'}
              </div>
              <button
                type="button"
                onClick={() => soundEngine.speakText(currentQ.prompt, 'zh-TW')}
                aria-label="朗讀題目"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-bold flex items-center gap-1"
              >
                <Volume2 className="w-4 h-4" /> 朗讀
              </button>
            </div>

            <div className="text-base sm:text-lg font-black text-white mb-3">{currentQ.prompt}</div>

            {/* Skill 1: Slash Fast Strike */}
            {currentQ.payload.mode === 'slash' && (
              <div className="grid grid-cols-2 gap-2.5">
                {(currentQ.payload as ChineseSlashPayload).options.map((opt, idx) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      soundEngine.hapticPulse(14);
                      applyPlayerDamageToEnemy(
                        1.15,
                        'slash',
                        idx === (currentQ.payload as ChineseSlashPayload).correctIndex,
                        currentQ
                      );
                    }}
                    className="min-h-[56px] rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border-2 border-slate-600 hover:border-amber-200 text-white font-black text-base px-4 transition-all active:scale-95"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Skill 2: Radical Magic Circle Combiner */}
            {currentQ.payload.mode === 'radical' && (
              <div>
                <div className="flex items-center justify-center gap-3 mb-3 py-2 rounded-2xl bg-slate-950/80 border border-amber-400/50">
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-amber-400 flex items-center justify-center text-2xl font-black text-amber-300">
                    {selectedRadicals[0] ?? '？'}
                  </div>
                  <span className="text-2xl font-black text-amber-400">＋</span>
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-amber-400 flex items-center justify-center text-2xl font-black text-amber-300">
                    {selectedRadicals[1] ?? '？'}
                  </div>
                  <span className="text-2xl font-black text-amber-400">＝</span>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/60 text-sm font-bold text-amber-200">
                    召喚金色書法大字
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {(currentQ.payload as ChineseRadicalPayload).pool.map((part) => {
                    const active = selectedRadicals.includes(part);
                    return (
                      <button
                        key={part}
                        type="button"
                        onClick={() => handleRadicalPick(part)}
                        className={`min-w-[64px] min-h-[64px] rounded-2xl text-2xl font-black border-2 transition-transform active:scale-90 ${
                          active
                            ? 'bg-amber-400 border-amber-100 text-slate-950 scale-105 shadow-[0_0_16px_rgba(251,191,36,0.7)]'
                            : 'bg-slate-800 hover:bg-slate-700 border-sky-400/70 text-white'
                        }`}
                      >
                        {part}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skill 3: Clickable Stone Tablet Sentence Typo Slash */}
            {currentQ.payload.mode === 'typo' && (
              <div className="rounded-2xl bg-stone-800 border-2 border-stone-500 p-3 flex flex-wrap items-center justify-center gap-2">
                {(currentQ.payload as ChineseTypoPayload).sentence.split('').map((ch, idx) => {
                  const isPunc = ch === '，' || ch === '。' || ch === '！' || ch === '？';
                  if (isPunc) {
                    return (
                      <span key={idx} className="text-xl font-black text-stone-300 px-0.5">
                        {ch}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        soundEngine.hapticPulse(16);
                        applyPlayerDamageToEnemy(
                          1.35,
                          'typo',
                          idx === (currentQ.payload as ChineseTypoPayload).typoIndex,
                          currentQ
                        );
                      }}
                      className="min-w-[50px] min-h-[52px] rounded-xl bg-stone-700 hover:bg-rose-500 border-2 border-stone-400 hover:border-amber-200 text-white text-xl font-black transition-transform active:scale-90"
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {bossWarning && stageConfig?.tier === 'boss' && (
        <div className="fixed inset-x-0 top-24 z-30 pointer-events-none flex justify-center px-4">
          <div className="animate-vs-banner rounded-2xl bg-rose-950/95 border-2 border-amber-400 px-6 py-3 text-center shadow-[0_0_32px_rgba(251,191,36,0.5)]">
            <div className="text-xs font-black tracking-widest text-amber-300">
              WARNING · 第 10 關章節大魔王現身！
            </div>
            <div className="text-xl font-black text-white mt-0.5">{stageConfig.enemyName}</div>
            {stageConfig.bossPhase2Name && (
              <div className="text-xs text-rose-200 mt-0.5">
                二階變身型態：{stageConfig.bossPhase2Name}（破防必殺擊潰！）
              </div>
            )}
          </div>
        </div>
      )}

      <ExplanationBanner message={banner} onDismiss={() => setBanner(null)} />
      <UltimateCutIn
        visible={cutIn}
        title="萬墨歸宗・書法龍斬"
        subtitle="貫穿全場並粉碎敵方護盾！"
        symbol="墨"
        accentBg="bg-gradient-to-r from-amber-700 via-red-700 to-slate-900"
      />
      <WorldPauseModal
        open={paused}
        worldName={
          stageConfig
            ? `墨靈幻境・第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
            : '國語文・墨靈幻境'
        }
        onResume={() => setPaused(false)}
        onRestart={onExit}
        onExit={onExit}
      />
    </div>
  );
};
