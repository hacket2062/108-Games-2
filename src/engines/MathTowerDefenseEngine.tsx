import { useLazyRef } from '../core/useLazyRef';
import { useSessionScheduler } from '../core/useSessionScheduler';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pause, Sparkles, Cog, Zap, Volume2, Crosshair } from 'lucide-react';
import type {
  EngineCommonProps,
  MathQuestion,
  WorldRunResult,
} from '../types/game';
import { getMathQuestions } from '../data/questionBank';
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
  drawMathTower,
  drawMathZombie,
  drawRoundedRect,
  FloatingTextPool,
  MathTowerKind,
  ParticlePool,
  triggerGameFeel,
  updateGameFeel,
} from '../canvas/proceduralArt';
import {
  ExplanationBanner,
  UltimateCutIn,
  WorldPauseModal,
} from '../components/UltimateCutIn';

const LANES = 5;
const COLS = 8;

interface TowerConfig {
  kind: MathTowerKind;
  name: string;
  role: string;
  cost: number;
  hotkey: string;
  accent: string;
}

const TOWER_SHOP: TowerConfig[] = [
  { kind: 'beaver', name: '海狸產能塔', role: '定期生產齒輪', cost: 50, hotkey: '1', accent: 'border-amber-400' },
  { kind: 'raccoon', name: '浣熊機槍塔', role: '高速數字連射', cost: 80, hotkey: '2', accent: 'border-sky-400' },
  { kind: 'owl', name: '貓頭鷹冰塔', role: '幾何冰凍減速', cost: 110, hotkey: '3', accent: 'border-cyan-300' },
  { kind: 'hedgehog', name: '刺蝟質數塔', role: '範圍高傷爆破', cost: 130, hotkey: '4', accent: 'border-rose-400' },
];

interface PlacedTower {
  id: string;
  kind: MathTowerKind;
  lane: number;
  col: number;
  hp: number;
  maxHp: number;
  cooldown: number;
  overclockTimer: number;
  overheatTimer: number;
  recoil: number;
}

interface ZombieEntity {
  id: string;
  kind: 'zero' | 'bucket' | 'hopper' | 'boss';
  lane: number;
  x: number; // 0..1 normalized across grid width (1.02 = right spawn, 0 = castle gate)
  hp: number;
  maxHp: number;
  speed: number;
  chillTimer: number;
  hitFlash: number;
  formulaQuestion: MathQuestion | null;
  biteCd: number;
}

interface MathProjectile {
  lane: number;
  x: number;
  speed: number;
  damage: number;
  kind: 'digit' | 'frost' | 'prime';
  color: string;
}

interface SkyLaserBeam {
  x: number;
  y: number;
  life: number;
}

export const MathTowerDefenseEngine: React.FC<EngineCommonProps> = ({
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
  onRestart,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guardian = GUARDIANS[guardianId];
  const qMgrRef = useLazyRef(() =>
    new QuestionManager<MathQuestion>(getMathQuestions(grade, semester), {
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

  const [paused, setPaused] = useState(false);
  const { schedule, cancelAll } = useSessionScheduler(paused);
  const [selectedTower, setSelectedTower] = useState<MathTowerKind>('raccoon');
  const [radialPicker, setRadialPicker] = useState<{
    lane: number;
    col: number;
    x: number;
    y: number;
  } | null>(null);
  const [gears, setGears] = useState(guardianId === 'griffin' ? 210 : 150);
  const [castleHp, setCastleHp] = useState(playerStats.maxHp);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [ultCharge, setUltCharge] = useState(25);
  const [guardianUsed, setGuardianUsed] = useState(false);
  const [freezeSecs, setFreezeSecs] = useState(0);
  const [cutIn, setCutIn] = useState(false);
  const [shieldedCount, setShieldedCount] = useState(0);
  const [banner, setBanner] = useState<{
    title: string;
    answer: string;
    explanation: string;
    tag: string;
  } | null>(null);

  // Active Blueprint Quick-Solver (either harvesting gears/overclock OR sniping a formula-shielded zombie)
  const [solverState, setSolverState] = useState<{
    purpose: 'harvest' | 'snipe';
    question: MathQuestion;
    targetZombieId?: string;
    startedAt: number;
  } | null>(null);

  const pausedRef = useRef(false);
  const gearsRef = useRef(guardianId === 'griffin' ? 210 : 150);
  const castleHpRef = useRef(playerStats.maxHp);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const tagsRef = useRef<Set<string>>(new Set());
  const startClockRef = useRef(Date.now());
  const finishedRef = useRef(false);
  const ultRef = useRef(25);
  const freezeRef = useRef(0);
  const doubleNextRef = useRef(false);
  const selectedTowerRef = useRef<MathTowerKind>('raccoon');

  const TOTAL_WAVES = stageConfig ? stageConfig.waveCount : 3;

  const tdRef = useRef({
    time: 0,
    width: 1200,
    height: 700,
    gridLeft: 130,
    gridTop: 108,
    cellW: 115,
    cellH: 92,
    towers: [
      {
        id: 'init-beaver',
        kind: 'beaver' as MathTowerKind,
        lane: 2,
        col: 0,
        hp: 100,
        maxHp: 100,
        cooldown: 3,
        overclockTimer: 0,
        overheatTimer: 0,
        recoil: 0,
      },
      {
        id: 'init-raccoon',
        kind: 'raccoon' as MathTowerKind,
        lane: 2,
        col: 1,
        hp: 100,
        maxHp: 100,
        cooldown: 1,
        overclockTimer: 0,
        overheatTimer: 0,
        recoil: 0,
      },
    ] as PlacedTower[],
    zombies: [] as ZombieEntity[],
    projectiles: [] as MathProjectile[],
    lasers: [] as SkyLaserBeam[],
    waveIndex: 0,
    zombiesToSpawn: 5,
    spawnTimer: 1.5,
    bossSpawned: false,
    particles: new ParticlePool(340),
    floats: new FloatingTextPool(48),
    feel: createGameFeel(),
  });

  useEffect(() => {
    pausedRef.current = paused;
    document.body.dataset.state = paused ? 'paused' : 'playing';
  }, [paused]);

  useEffect(() => {
    selectedTowerRef.current = selectedTower;
  }, [selectedTower]);

  const pullMathQ = useCallback((): MathQuestion => {
    return qMgrRef.current.next();
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
      const stars = calculateStarRating(
        victory,
        correctRef.current,
        attemptsRef.current,
        castleHpRef.current / playerStats.maxHp
      );
      const result: WorldRunResult = {
        subject: 'math',
        victory,
        score: scoreRef.current,
        stars,
        correctCount: correctRef.current,
        totalAttempts: attemptsRef.current,
        maxCombo: maxComboRef.current,
        clearSeconds,
        coinsEarned: victory ? 95 + stars * 35 + Math.round(scoreRef.current * 0.04) : 30,
        xpEarned: victory ? 90 + stars * 25 : 25,
        crystalsEarned: victory ? stars * 2 + 1 : 0,
        knowledgeTags: Array.from(tagsRef.current),
        progressSummary: victory
          ? `守住機械城堡並擊倒${stageConfig?.enemyName ?? '歸零巨人 Boss'}！共答對 ${correctRef.current} 題數學算式！`
          : `第 ${tdRef.current.waveIndex + 1} 波防線遭突破，多用算數超頻與狙擊雷射再戰！`,
        stageKey: stageConfig?.stageKey,
        stageLabel: stageConfig ? `第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關「${stageConfig.title}」` : undefined,
        chestRewardText: victory && stars === 3 ? stageConfig?.starChestReward?.label : undefined,
      };
      onFinish(result);
    },
    [onFinish, playerStats.maxHp, stageConfig]
  );

  const openHarvestSolver = () => {
    soundEngine.playClick();
    const q = pullMathQ();
    setSolverState({
      purpose: 'harvest',
      question: q,
      startedAt: Date.now(),
    });
    soundEngine.speakText(q.prompt, 'zh-TW');
  };

  const openSnipeNearestShield = () => {
    const target = tdRef.current.zombies.find((z) => z.formulaQuestion);
    if (!target || !target.formulaQuestion) {
      openHarvestSolver();
      return;
    }
    soundEngine.playClick();
    setSolverState({
      purpose: 'snipe',
      question: target.formulaQuestion,
      targetZombieId: target.id,
      startedAt: Date.now(),
    });
    soundEngine.speakText(target.formulaQuestion.prompt, 'zh-TW');
  };

  const handleSolveOption = (optIdx: number) => {
    if (!solverState) return;
    const { question, purpose, targetZombieId, startedAt } = solverState;
    const isCorrect = optIdx === question.payload.correctIndex;
    const td = tdRef.current;

    attemptsRef.current += 1;
    onAnswerResult(question, isCorrect, Math.max(0, Date.now() - startedAt));

    if (isCorrect) {
      correctRef.current += 1;
      tagsRef.current.add(question.knowledgeTag);
      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
      setCombo(nextCombo);

      const elapsed = (Date.now() - startedAt) / 1000;
      const tier = getSpeedGrade(elapsed, 13, playMode, guardianId);
      const calc = calculateCombatDamage({
        baseAttack: playerStats.baseAttack,
        critChance: playerStats.critChance,
        skillMultiplier: 2.5,
        isCorrect: true,
        speedGrade: tier,
        combo: nextCombo,
        guardianId,
        doubleNextAttack: doubleNextRef.current,
      });
      doubleNextRef.current = false;

      if (tier === 'PERFECT') soundEngine.playPerfectBell();
      else soundEngine.playCorrectChord(nextCombo);

      ultRef.current = Math.min(100, ultRef.current + getUltimateChargeGain(tier, nextCombo, guardianId, playerStats.ultChargeBonus));
      setUltCharge(ultRef.current);

      if (purpose === 'harvest') {
        const gearGain = tier === 'PERFECT' ? 115 : 85;
        gearsRef.current += gearGain;
        setGears(gearsRef.current);
        scoreRef.current += 180 + calc.damage;
        setScore(scoreRef.current);

        // Overclock all towers for 8s on PERFECT, or 4s on GREAT/GOOD
        const ocDur = tier === 'PERFECT' ? 8 : 4.5;
        for (const t of td.towers) {
          t.overclockTimer = Math.max(t.overclockTimer, ocDur);
          t.overheatTimer = 0;
        }
        td.floats.spawn(
          td.width * 0.45,
          td.height * 0.38,
          `+${gearGain} 齒輪`,
          tier === 'PERFECT' ? 'perfect' : 'heal',
          tier === 'PERFECT' ? '全員雙倍射速 8s!' : '砲塔超頻！'
        );
        soundEngine.playGearBuild();
      } else {
        // Golden Ratio Sky Laser snipe!
        const target = td.zombies.find((z) => z.id === targetZombieId) ?? td.zombies[0];
        if (target) {
          const zx = td.gridLeft + target.x * (td.cellW * COLS);
          const zy = td.gridTop + (target.lane + 0.5) * td.cellH;
          td.lasers.push({ x: zx, y: zy, life: 0.55 });
          soundEngine.playExplosion();
          triggerGameFeel(td.feel, { hitstop: 0.06, shake: 0.65, flash: 0.25, flashColor: '#FDE047' });
          td.particles.burst(zx, zy, 30, ['#FDE047', '#F59E0B', '#38BDF8'], 90, 300, 7, 'spark');

          const laserDmg = target.kind === 'boss' ? Math.max(140, calc.damage * 2) : target.maxHp + 50;
          target.hp -= laserDmg;
          target.formulaQuestion = null;
          target.hitFlash = 1;
          td.floats.spawn(zx, zy - 26, `-${laserDmg}`, 'perfect', '黃金比例雷射！');

          // AOE splash to nearby zombies
          for (const other of td.zombies) {
            if (other.id !== target.id && Math.abs(other.lane - target.lane) <= 1 && Math.abs(other.x - target.x) < 0.2) {
              other.hp -= Math.round(calc.damage * 0.8);
              other.x = Math.min(1.0, other.x + 0.06);
              other.hitFlash = 0.8;
            }
          }
          gearsRef.current += 45;
          setGears(gearsRef.current);
          scoreRef.current += 320;
          setScore(scoreRef.current);
        }
      }
    } else {
      // Wrong answer -> explanation + nearest tower overheats 3s
      comboRef.current = 0;
      setCombo(0);
      soundEngine.playWrongBuzz();
      setBanner({
        title: '算式過熱！一座砲塔停機冷卻 3 秒',
        answer: question.answer,
        explanation: question.explanation,
        tag: question.knowledgeTag,
      });
      if (td.towers.length > 0) {
        const victim = td.towers[td.towers.length - 1];
        victim.overheatTimer = 3.0;
        const tx = td.gridLeft + (victim.col + 0.5) * td.cellW;
        const ty = td.gridTop + (victim.lane + 0.5) * td.cellH;
        td.particles.burst(tx, ty, 12, ['#64748B', '#EF4444'], 30, 110, 6);
        td.floats.spawn(tx, ty - 20, '過熱 3s', 'miss');
      }
    }
    setSolverState(null);
  };

  const triggerGoldenRatioUltimate = () => {
    if (ultRef.current < 100) return;
    ultRef.current = 0;
    setUltCharge(0);
    soundEngine.playUltimateRoar();
    setCutIn(true);
    schedule(() => {
      setCutIn(false);
      const td = tdRef.current;
      triggerGameFeel(td.feel, { hitstop: 0.08, shake: 0.9, flash: 0.35, flashColor: '#FDE047' });
      for (const z of td.zombies) {
        const zx = td.gridLeft + z.x * (td.cellW * COLS);
        const zy = td.gridTop + (z.lane + 0.5) * td.cellH;
        td.lasers.push({ x: zx, y: zy, life: 0.65 });
        z.formulaQuestion = null;
        z.hp -= z.kind === 'boss' ? 220 : 999;
        z.hitFlash = 1;
        td.particles.burst(zx, zy, 16, ['#FDE047', '#38BDF8'], 70, 240, 6, 'spark');
      }
      gearsRef.current += 100;
      setGears(gearsRef.current);
      scoreRef.current += 500;
      setScore(scoreRef.current);
    }, 1150);
  };

  const handleGuardianSkill = () => {
    if (guardianUsed) return;
    setGuardianUsed(true);
    soundEngine.playPerfectBell();
    const td = tdRef.current;
    if (guardian.activeEffectKey === 'ink_heal_boost') {
      const heal = Math.round(playerStats.maxHp * 0.35);
      castleHpRef.current = Math.min(playerStats.maxHp, castleHpRef.current + heal);
      setCastleHp(castleHpRef.current);
      doubleNextRef.current = true;
      td.floats.spawn(110, td.height * 0.5, `+${heal} 城門修復`, 'heal', guardian.activeName);
    } else if (guardian.activeEffectKey === 'full_ultimate') {
      ultRef.current = 100;
      setUltCharge(100);
      td.floats.spawn(td.width * 0.5, td.height * 0.4, '必殺 100%', 'perfect', guardian.activeName);
    } else if (guardian.activeEffectKey === 'freeze_timer') {
      freezeRef.current = 8;
      setFreezeSecs(8);
      td.floats.spawn(td.width * 0.5, td.height * 0.4, '全場殭屍定格 8s', 'perfect', guardian.activeName);
    } else {
      gearsRef.current += 140;
      setGears(gearsRef.current);
      for (const t of td.towers) t.overclockTimer = 8;
      td.floats.spawn(td.width * 0.5, td.height * 0.4, '+140 齒輪 & 超頻', 'heal', guardian.activeName);
    }
  };

  // Main 60FPS Tower Defense Canvas Loop
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
      const td = tdRef.current;
      td.width = rect.width;
      td.height = rect.height;
      const isNarrow = rect.width < 640;
      td.gridLeft = isNarrow ? 44 : Math.max(96, rect.width * 0.1);
      td.gridTop = isNarrow ? 156 : 98;
      const availW = rect.width - td.gridLeft - (isNarrow ? 8 : 36);
      const availH = rect.height - td.gridTop - (isNarrow ? 94 : 104);
      td.cellW = Math.max(38, availW / COLS);
      td.cellH = Math.max(48, availH / LANES);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setPaused((p) => !p);
      } else if (e.key === '1') setSelectedTower('beaver');
      else if (e.key === '2') setSelectedTower('raccoon');
      else if (e.key === '3') setSelectedTower('owl');
      else if (e.key === '4') setSelectedTower('hedgehog');
    };
    window.addEventListener('keydown', onKeyDown);

    let rafId = 0;
    let yieldTimer = 0;
    let alive = true;
    let lastTs = performance.now();
    let hudAccum = 0;

    const spawnZombie = (waveIdx: number, isBoss = false) => {
      const td = tdRef.current;
      const lane = isBoss ? 2 : Math.floor(Math.random() * LANES);
      const kinds: Array<'zero' | 'bucket' | 'hopper'> = ['zero', 'bucket', 'hopper'];
      const kind = isBoss ? 'boss' : kinds[Math.min(kinds.length - 1, Math.floor(Math.random() * (waveIdx + 2)))];
      const hasFormulaShield = isBoss || kind === 'bucket' || Math.random() < 0.42;
      const baseHp = isBoss ? 520 : kind === 'bucket' ? 175 : kind === 'hopper' ? 115 : 100;
      const baseSpeed = isBoss ? 0.022 : kind === 'hopper' ? 0.045 : 0.031;

      td.zombies.push({
        id: `z-${Date.now()}-${Math.random()}`,
        kind,
        lane,
        x: 1.03,
        hp: baseHp,
        maxHp: baseHp,
        speed: playMode === 'practice' ? baseSpeed * 0.65 : baseSpeed,
        chillTimer: 0,
        hitFlash: 0,
        formulaQuestion: hasFormulaShield ? pullMathQ() : null,
        biteCd: 0,
      });
    };

    const loop = (now: number) => {
      if (!alive) return;
      const frameStart = performance.now();
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const td = tdRef.current;

      const { simDt, shakeX, shakeY } = updateGameFeel(td.feel, pausedRef.current ? 0 : rawDt);
      const dt = pausedRef.current ? 0 : simDt;
      td.time += dt;

      if (freezeRef.current > 0 && dt > 0) freezeRef.current = Math.max(0, freezeRef.current - dt);

      if (dt > 0) {
        // Wave Spawner
        if (td.zombiesToSpawn > 0) {
          td.spawnTimer -= dt;
          if (td.spawnTimer <= 0) {
            td.zombiesToSpawn -= 1;
            const isBossLast = td.waveIndex === TOTAL_WAVES - 1 && td.zombiesToSpawn === 0 && !td.bossSpawned;
            if (isBossLast) td.bossSpawned = true;
            spawnZombie(td.waveIndex, isBossLast);
            td.spawnTimer = Math.max(2.1, 4.2 - td.waveIndex * 0.65);
          }
        } else if (td.zombies.length === 0) {
          if (td.waveIndex + 1 < TOTAL_WAVES) {
            td.waveIndex += 1;
            setWave(td.waveIndex + 1);
            td.zombiesToSpawn = 5 + td.waveIndex * 2;
            td.spawnTimer = 1.8;
            gearsRef.current += 60;
            setGears(gearsRef.current);
            td.floats.spawn(td.width * 0.5, td.height * 0.35, `第 ${td.waveIndex + 1} 波來襲！`, 'perfect', '+60 齒輪補給');
          } else {
            concludeRun(true);
          }
        }

        // Update Towers
        for (const t of td.towers) {
          if (t.overclockTimer > 0) t.overclockTimer = Math.max(0, t.overclockTimer - dt);
          if (t.overheatTimer > 0) {
            t.overheatTimer = Math.max(0, t.overheatTimer - dt);
            continue;
          }
          if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 6);

          const rateMult = t.overclockTimer > 0 ? 2.0 : 1.0;
          t.cooldown -= dt * rateMult;
          if (t.cooldown <= 0) {
            const tx = td.gridLeft + (t.col + 0.5) * td.cellW;
            const ty = td.gridTop + (t.lane + 0.5) * td.cellH;
            if (t.kind === 'beaver') {
              t.cooldown = 5.5;
              gearsRef.current += 25;
              setGears(gearsRef.current);
              td.floats.spawn(tx, ty - 24, '+25 齒輪', 'perfect');
              td.particles.burst(tx, ty - 10, 6, ['#FACC15', '#FEF08A'], 30, 90, 4);
            } else {
              const laneHasZombie = td.zombies.some((z) => z.lane === t.lane && z.x > t.col / COLS);
              if (laneHasZombie) {
                t.recoil = 1;
                if (t.kind === 'raccoon') {
                  t.cooldown = 0.85;
                  td.projectiles.push({
                    lane: t.lane,
                    x: (t.col + 0.65) / COLS,
                    speed: 0.62,
                    damage: Math.round(playerStats.baseAttack * 0.72),
                    kind: 'digit',
                    color: '#38BDF8',
                  });
                  soundEngine.playLaser();
                } else if (t.kind === 'owl') {
                  t.cooldown = 1.45;
                  td.projectiles.push({
                    lane: t.lane,
                    x: (t.col + 0.65) / COLS,
                    speed: 0.48,
                    damage: Math.round(playerStats.baseAttack * 0.65),
                    kind: 'frost',
                    color: '#67E8F9',
                  });
                } else {
                  t.cooldown = 2.2;
                  td.projectiles.push({
                    lane: t.lane,
                    x: (t.col + 0.65) / COLS,
                    speed: 0.42,
                    damage: Math.round(playerStats.baseAttack * 1.65),
                    kind: 'prime',
                    color: '#FB7185',
                  });
                }
              }
            }
          }
        }

        // Update Projectiles
        for (let i = td.projectiles.length - 1; i >= 0; i--) {
          const p = td.projectiles[i];
          p.x += p.speed * dt;
          if (p.x > 1.06) {
            td.projectiles.splice(i, 1);
            continue;
          }
          const hitZ = td.zombies.find((z) => z.lane === p.lane && Math.abs(z.x - p.x) < 0.055);
          if (hitZ) {
            const mult = hitZ.formulaQuestion ? 0.5 : 1.0;
            const dmg = Math.max(4, Math.round(p.damage * mult));
            hitZ.hp -= dmg;
            hitZ.hitFlash = 0.65;
            if (p.kind === 'frost') hitZ.chillTimer = 3.5;
            const px = td.gridLeft + hitZ.x * (td.cellW * COLS);
            const py = td.gridTop + (hitZ.lane + 0.5) * td.cellH;
            if (p.kind === 'prime') {
              soundEngine.playExplosion();
              td.particles.burst(px, py, 16, ['#FB7185', '#FACC15'], 60, 180, 6);
              for (const other of td.zombies) {
                if (other.id !== hitZ.id && Math.abs(other.lane - hitZ.lane) <= 1 && Math.abs(other.x - hitZ.x) < 0.14) {
                  other.hp -= Math.round(dmg * 0.6);
                }
              }
            } else {
              td.particles.burst(px, py, 5, [p.color, '#FFFFFF'], 30, 100, 3);
            }
            td.projectiles.splice(i, 1);
          }
        }

        // Update Zombies
        const frozen = freezeRef.current > 0;
        for (let i = td.zombies.length - 1; i >= 0; i--) {
          const z = td.zombies[i];
          if (z.hitFlash > 0) z.hitFlash = Math.max(0, z.hitFlash - dt * 5);
          if (z.chillTimer > 0) z.chillTimer = Math.max(0, z.chillTimer - dt);

          if (z.hp <= 0) {
            const zx = td.gridLeft + z.x * (td.cellW * COLS);
            const zy = td.gridTop + (z.lane + 0.5) * td.cellH;
            td.particles.burst(zx, zy, 18, ['#84CC16', '#FACC15', '#FFFFFF'], 60, 220, 6);
            scoreRef.current += z.kind === 'boss' ? 600 : 120;
            gearsRef.current += z.kind === 'boss' ? 100 : 25;
            setScore(scoreRef.current);
            setGears(gearsRef.current);
            td.zombies.splice(i, 1);
            continue;
          }

          if (!frozen) {
            // Check blocking tower in same lane
            const blocking = td.towers.find(
              (t) => t.lane === z.lane && Math.abs(z.x - (t.col + 0.5) / COLS) < 0.055
            );
            if (blocking) {
              z.biteCd -= dt;
              if (z.biteCd <= 0) {
                z.biteCd = 1.0;
                blocking.hp -= z.kind === 'boss' ? 35 : 18;
                if (blocking.hp <= 0) {
                  td.towers = td.towers.filter((t) => t.id !== blocking.id);
                }
              }
            } else {
              const spd = z.speed * (z.chillTimer > 0 ? 0.45 : 1.0);
              z.x -= spd * dt;
            }

            // Reached Mechanical Castle Gate!
            if (z.x <= 0.01) {
              const gateDmg = z.kind === 'boss' ? 40 : 18;
              castleHpRef.current = Math.max(0, castleHpRef.current - gateDmg);
              setCastleHp(castleHpRef.current);
              soundEngine.playWrongBuzz();
              triggerGameFeel(td.feel, { shake: 0.5 });
              td.floats.spawn(td.gridLeft, td.gridTop + (z.lane + 0.5) * td.cellH, `-${gateDmg} 城門`, 'crit');
              td.zombies.splice(i, 1);
              if (castleHpRef.current <= 0) {
                concludeRun(false);
              }
            }
          }
        }

        // Decay Sky Lasers
        for (let i = td.lasers.length - 1; i >= 0; i--) {
          td.lasers[i].life -= dt;
          if (td.lasers[i].life <= 0) td.lasers.splice(i, 1);
        }
      }

      td.particles.update(dt);
      td.floats.update(dt);

      hudAccum += rawDt;
      if (hudAccum > 0.18) {
        hudAccum = 0;
        setShieldedCount(td.zombies.filter((z) => z.formulaQuestion).length);
        setFreezeSecs(Math.ceil(freezeRef.current));
      }

      // ==================== RENDER 5x8 PVZ BLUEPRINT LAWN ====================
      ctx.save();
      ctx.translate(shakeX, shakeY);
      const W = td.width;
      const H = td.height;

      // Bright sunlit sky/blueprint border
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, W, H);

      // Left Mechanical Castle Gate wall (scales gracefully on 390px mobile)
      const castlePad = td.gridLeft < 60 ? 6 : 12;
      const castleW = Math.max(24, td.gridLeft - castlePad * 2);
      const castleGrad = ctx.createLinearGradient(0, td.gridTop, td.gridLeft, td.gridTop);
      castleGrad.addColorStop(0, '#1E3A8A');
      castleGrad.addColorStop(1, '#3B82F6');
      ctx.fillStyle = castleGrad;
      drawRoundedRect(ctx, castlePad, td.gridTop - 6, castleW, td.cellH * LANES + 12, 12);
      ctx.fill();
      ctx.strokeStyle = '#93C5FD';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Rotating Castle Gate Gear emblem
      ctx.save();
      ctx.translate(castlePad + castleW * 0.5, td.gridTop + td.cellH * 2.5);
      ctx.rotate(td.time * 0.8);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = td.gridLeft < 60 ? 3.5 : 5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(24, castleW * 0.36), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 5x8 Alternating Emerald Grass / Blueprint Tiles
      for (let r = 0; r < LANES; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = td.gridLeft + c * td.cellW;
          const y = td.gridTop + r * td.cellH;
          const alt = (r + c) % 2 === 0;
          ctx.fillStyle = alt ? '#22C55E' : '#16A34A';
          ctx.fillRect(x, y, td.cellW - 2, td.cellH - 2);
          // Subtle architectural blueprint grid line
          ctx.strokeStyle = 'rgba(255,255,255,0.18)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2, y + 2, td.cellW - 6, td.cellH - 6);
        }
      }

      if (freezeRef.current > 0) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fillRect(td.gridLeft, td.gridTop, td.cellW * COLS, td.cellH * LANES);
      }

      // Placed Math Towers
      for (const t of td.towers) {
        const tx = td.gridLeft + (t.col + 0.5) * td.cellW;
        const ty = td.gridTop + (t.lane + 0.5) * td.cellH;
        drawMathTower(ctx, t.kind, tx, ty, td.time, t.overclockTimer > 0, t.overheatTimer > 0, t.recoil);
      }

      // Projectiles
      for (const p of td.projectiles) {
        const px = td.gridLeft + p.x * (td.cellW * COLS);
        const py = td.gridTop + (p.lane + 0.5) * td.cellH;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        if (p.kind === 'frost') {
          ctx.beginPath();
          ctx.moveTo(px, py - 9);
          ctx.lineTo(px + 9, py + 7);
          ctx.lineTo(px - 9, py + 7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, p.kind === 'prime' ? 10 : 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Zombies sorted by lane for 2.5D overlap
      const sortedZ = [...td.zombies].sort((a, b) => a.lane - b.lane);
      for (const z of sortedZ) {
        const zx = td.gridLeft + z.x * (td.cellW * COLS);
        const zy = td.gridTop + (z.lane + 0.5) * td.cellH;
        drawMathZombie(ctx, z.kind, zx, zy, td.time, {
          hpRatio: z.hp / z.maxHp,
          chilled: z.chillTimer > 0,
          hitFlash: z.hitFlash,
          formulaShield: z.formulaQuestion ? z.formulaQuestion.payload.formulaShield : null,
        });
      }

      // Golden Ratio Sky Lasers
      for (const l of td.lasers) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, l.life * 2);
        const lg = ctx.createLinearGradient(l.x - 28, 0, l.x + 28, 0);
        lg.addColorStop(0, 'rgba(250,204,21,0)');
        lg.addColorStop(0.5, '#FEF08A');
        lg.addColorStop(1, 'rgba(250,204,21,0)');
        ctx.fillStyle = lg;
        ctx.fillRect(l.x - 28, 0, 56, l.y + 18);
        ctx.restore();
      }

      td.particles.render(ctx);
      td.floats.render(ctx);

      if (td.feel.flashAlpha > 0.01) {
        ctx.fillStyle = td.feel.flashColor;
        ctx.globalAlpha = td.feel.flashAlpha;
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
    };
  }, [concludeRun, playMode, playerStats.baseAttack, playerStats.maxHp, pullMathQ]);

  const placeTowerAt = (lane: number, col: number, kind: MathTowerKind) => {
    const td = tdRef.current;
    const occupied = td.towers.some((t) => t.lane === lane && t.col === col);
    if (occupied) {
      setRadialPicker(null);
      return;
    }

    const cfg = TOWER_SHOP.find((s) => s.kind === kind)!;
    const tx = td.gridLeft + (col + 0.5) * td.cellW;
    const ty = td.gridTop + (lane + 0.5) * td.cellH;
    if (gearsRef.current < cfg.cost) {
      soundEngine.playWrongBuzz();
      soundEngine.hapticPulse(22);
      td.floats.spawn(tx, ty, '齒輪不足！解題採能', 'miss');
      setRadialPicker(null);
      openHarvestSolver();
      return;
    }

    gearsRef.current -= cfg.cost;
    setGears(gearsRef.current);
    setSelectedTower(kind);
    soundEngine.playGearBuild();
    soundEngine.hapticPulse(16);
    td.towers.push({
      id: `t-${Date.now()}-${Math.random()}`,
      kind: cfg.kind,
      lane,
      col,
      hp: 100,
      maxHp: 100,
      cooldown: 0.4,
      overclockTimer: 0,
      overheatTimer: 0,
      recoil: 0,
    });
    td.particles.burst(tx, ty, 14, ['#FACC15', '#38BDF8', '#FFFFFF'], 40, 140, 5);
    setRadialPicker(null);
  };

  const handleGridClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pausedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const td = tdRef.current;

    // 1. Check if player clicked a Formula-Shielded Zombie to snipe it!
    for (const z of td.zombies) {
      if (!z.formulaQuestion) continue;
      const zx = td.gridLeft + z.x * (td.cellW * COLS);
      const zy = td.gridTop + (z.lane + 0.5) * td.cellH;
      if (Math.abs(cx - zx) < 56 && Math.abs(cy - (zy - 22)) < 62) {
        soundEngine.playClick();
        soundEngine.hapticPulse(16);
        setRadialPicker(null);
        setSolverState({
          purpose: 'snipe',
          question: z.formulaQuestion,
          targetZombieId: z.id,
          startedAt: Date.now(),
        });
        soundEngine.speakText(z.formulaQuestion.prompt, 'zh-TW');
        return;
      }
    }

    // 2. Clicking an empty 5x8 grass tile opens the circular Radial Tower Wheel right near the tile!
    const col = Math.floor((cx - td.gridLeft) / td.cellW);
    const lane = Math.floor((cy - td.gridTop) / td.cellH);
    if (col < 0 || col >= COLS || lane < 0 || lane >= LANES) {
      setRadialPicker(null);
      return;
    }

    const occupied = td.towers.some((t) => t.lane === lane && t.col === col);
    if (occupied) {
      setRadialPicker(null);
      return;
    }

    soundEngine.playClick();
    const clampedX = Math.max(122, Math.min(rect.width - 122, td.gridLeft + (col + 0.5) * td.cellW));
    const clampedY = Math.max(138, Math.min(rect.height - 154, td.gridTop + (lane + 0.5) * td.cellH));
    setRadialPicker({ lane, col, x: clampedX, y: clampedY });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950" data-testid="math-td-engine">
      <canvas
        ref={canvasRef}
        onClick={handleGridClick}
        className="block w-full h-full cursor-pointer"
        data-testid="math-td-canvas"
      />

      {/* Top Unified Tower Defense HUD */}
      <div className="fixed inset-x-0 top-0 z-20 pointer-events-none safe-top p-2 sm:p-3 flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto max-w-full rounded-2xl bg-slate-900/94 border-2 border-blue-400/80 px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-xl flex items-center gap-2.5 sm:gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-sky-300 truncate max-w-[140px] sm:max-w-none">
              {stageConfig
                ? `數境建築・第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
                : `數境建築王國（${grade}年級）`}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-black text-emerald-300">城門</span>
              <div className="w-16 sm:w-28 h-2.5 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-transform origin-left"
                  style={{ transform: `scaleX(${Math.max(0, castleHp / playerStats.maxHp)})` }}
                />
              </div>
              <span className="text-[11px] font-black text-white font-mono-num">{castleHp}</span>
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-700" />
          <div className="flex items-center gap-1 text-amber-300 font-black font-mono-num text-sm sm:text-lg">
            <Cog className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" style={{ animationDuration: '6s' }} /> {gears}
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400">波次</div>
            <div className="text-sm sm:text-base font-black text-white font-mono-num">
              {wave}/{TOTAL_WAVES}
            </div>
          </div>
          <div className="hidden sm:block text-center">
            <div className="text-[9px] text-slate-400">連擊</div>
            <div className="text-base font-black text-amber-300 font-mono-num">{combo}x</div>
          </div>
        </div>

        {/* Math Power Triggers: Harvest Gears + Snipe Shielded Zombie + Guardian + Pause */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          {freezeSecs > 0 && (
            <div className="rounded-xl bg-sky-600 text-white font-black text-xs px-3 py-2">
              凍結 {freezeSecs}s
            </div>
          )}
          <button
            type="button"
            onClick={openHarvestSolver}
            className="min-h-[44px] px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
          >
            <Zap className="w-4 h-4" /> 算數採能機 (+齒輪/超頻)
          </button>
          <button
            type="button"
            onClick={openSnipeNearestShield}
            className={`min-h-[44px] px-3.5 rounded-xl font-black text-xs border-2 flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 ${
              shieldedCount > 0
                ? 'bg-rose-500 hover:bg-rose-400 border-amber-200 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Crosshair className="w-4 h-4" /> 狙擊算式盾 ({shieldedCount})
          </button>
          <button
            type="button"
            disabled={guardianUsed}
            onClick={handleGuardianSkill}
            className={`min-h-[44px] px-3 rounded-xl font-black text-xs border-2 flex items-center gap-1.5 ${
              guardianUsed
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-sky-400 hover:bg-sky-300 border-sky-200 text-slate-950'
            }`}
          >
            <Sparkles className="w-4 h-4" /> {guardian.activeName}
          </button>
          <button
            type="button"
            onClick={() => setPaused(true)}
            aria-label="暫停遊戲"
            className="w-11 h-11 rounded-xl bg-slate-900/92 hover:bg-slate-800 border-2 border-slate-600 text-white flex items-center justify-center"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Unified Tower Blueprint Dock (Never overlaps 5x8 grid tiles!) */}
      <div className="fixed inset-x-0 bottom-2 z-20 pointer-events-none px-4 flex items-end justify-between gap-3">
        <div className="pointer-events-auto rounded-2xl bg-slate-900/95 border-2 border-slate-700 p-2 shadow-2xl flex items-center gap-2 overflow-x-auto">
          {TOWER_SHOP.map((t) => {
            const active = selectedTower === t.kind;
            const affordable = gears >= t.cost;
            return (
              <button
                key={t.kind}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedTower(t.kind);
                }}
                className={`min-h-[60px] min-w-[136px] rounded-xl px-3 py-1.5 border-2 text-left transition-transform active:scale-95 ${
                  active
                    ? `bg-slate-800 ${t.accent} scale-[1.03]`
                    : 'bg-slate-950/80 border-slate-700 hover:border-slate-500'
                } ${!affordable ? 'opacity-65' : ''}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-white whitespace-nowrap">{t.name}</span>
                  <span className="text-xs font-black text-amber-300 font-mono-num">⚙{t.cost}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5 flex items-center justify-between">
                  <span>{t.role}</span>
                  <span className="text-slate-500 font-mono-num">[{t.hotkey}]</span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={ultCharge < 100}
          onClick={triggerGoldenRatioUltimate}
          className={`pointer-events-auto min-h-[60px] px-4 rounded-2xl font-black text-xs sm:text-sm border-2 flex items-center gap-2 shrink-0 shadow-xl transition-transform active:scale-95 ${
            ultCharge >= 100
              ? 'bg-amber-400 hover:bg-amber-300 border-white text-slate-950'
              : 'bg-slate-900/92 border-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" /> 黃金比例轟炸 ({ultCharge}%)
        </button>
      </div>

      {/* Circular Radial Tower Build Wheel (Opens on Empty Grass Tile Tap) */}
      {radialPicker && (
        <div
          data-testid="math-td-radial-wheel"
          className="fixed z-30 pointer-events-auto"
          style={{
            left: radialPicker.x,
            top: radialPicker.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative w-56 h-56 rounded-full bg-slate-950/78 border-2 border-amber-400/80 shadow-[0_0_28px_rgba(15,23,42,0.85)] flex items-center justify-center">
            <button
              type="button"
              onClick={() => setRadialPicker(null)}
              aria-label="取消建塔"
              className="w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 border-2 border-slate-500 text-slate-200 font-black text-xs shadow"
            >
              取消
            </button>
            {TOWER_SHOP.map((t, idx) => {
              const positions = [
                'top-1.5 left-1/2 -translate-x-1/2',
                'right-1.5 top-1/2 -translate-y-1/2',
                'bottom-1.5 left-1/2 -translate-x-1/2',
                'left-1.5 top-1/2 -translate-y-1/2',
              ];
              const affordable = gears >= t.cost;
              return (
                <button
                  key={t.kind}
                  type="button"
                  onClick={() => placeTowerAt(radialPicker.lane, radialPicker.col, t.kind)}
                  className={`absolute ${positions[idx]} min-w-[82px] min-h-[50px] px-2.5 py-1 rounded-2xl border-2 text-center shadow-xl transition-transform active:scale-90 ${
                    affordable
                      ? `bg-slate-900 ${t.accent} text-white hover:bg-slate-800`
                      : 'bg-slate-900/85 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="text-[11px] font-black whitespace-nowrap">{t.name.slice(0, 4)}</div>
                  <div className="text-[11px] font-black text-amber-300 font-mono-num">⚙{t.cost}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Non-Blocking Side/Bottom Blueprint Math Solver Overlay */}
      {solverState && (
        <div className="fixed right-3 sm:right-4 bottom-24 z-30 w-[min(94vw,420px)] rounded-3xl bg-slate-900/96 border-2 border-amber-400 p-4 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black text-amber-300">
              {solverState.purpose === 'snipe'
                ? '【黃金比例狙擊雷射】破解殭屍算式盾！'
                : '【算數採能機】快解贏得大量齒輪＋超頻！'}
            </span>
            <button
              type="button"
              onClick={() => soundEngine.speakText(solverState.question.prompt, 'zh-TW')}
              aria-label="朗讀數學題目"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <div className="text-base sm:text-lg font-black text-white mb-3 leading-snug">
            {solverState.question.prompt}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {solverState.question.payload.options.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  soundEngine.hapticPulse(14);
                  handleSolveOption(idx);
                }}
                className="min-h-[54px] rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border-2 border-sky-500/60 hover:border-amber-200 text-white font-black text-base font-mono-num transition-all active:scale-95"
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>提示：{solverState.question.hint}</span>
            <button
              type="button"
              onClick={() => setSolverState(null)}
              className="text-slate-300 hover:text-white underline"
            >
              稍後再解
            </button>
          </div>
        </div>
      )}

      {bossWarning && stageConfig?.tier === 'boss' && (
        <div className="fixed inset-x-0 top-24 z-30 pointer-events-none flex justify-center px-4">
          <div className="animate-vs-banner rounded-2xl bg-rose-950/95 border-2 border-amber-400 px-6 py-3 text-center shadow-[0_0_32px_rgba(244,63,94,0.55)]">
            <div className="text-xs font-black tracking-widest text-amber-300">
              WARNING · 第 10 關章節大魔王進軍！
            </div>
            <div className="text-xl font-black text-white mt-0.5">{stageConfig.enemyName}</div>
            {stageConfig.bossPhase2Name && (
              <div className="text-xs text-rose-200 mt-0.5">
                二階變身型態：{stageConfig.bossPhase2Name}（算式狙擊破防！）
              </div>
            )}
          </div>
        </div>
      )}

      <ExplanationBanner message={banner} onDismiss={() => setBanner(null)} />
      <UltimateCutIn
        visible={cutIn}
        title="黃金比例・幾何軌道砲"
        subtitle="全戰線算式盾粉碎＋補給 100 齒輪！"
        symbol="φ"
        accentBg="bg-gradient-to-r from-blue-700 via-indigo-800 to-amber-600"
      />
      <WorldPauseModal
        subject="math"
        open={paused}
        worldName={
          stageConfig
            ? `數境建築王國・第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
            : '數學・數境建築王國'
        }
        onResume={() => setPaused(false)}
        onRestart={onRestart}
        onExit={onExit}
      />
    </div>
  );
};
