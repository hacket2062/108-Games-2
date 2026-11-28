import React, { useEffect, useRef, useState, useCallback } from 'react';
import {lawnUnitLayout} from '../core/renderLayout';
import { Pause, Sparkles, Cog, Zap, Volume2, Crosshair } from 'lucide-react';
import {
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
  canFuseZombies,
  computeClassDamageBonus,
  computeMathTowerDamage,
  getSpeedGrade,
  getUltimateChargeGain,
} from '../core/combatMath';
import { soundEngine } from '../audio/soundEngine';
import {
  createGameFeel,
  drawHeroClassAura,
  drawMathTower,
  drawMathZombie,
  drawRoundedRect,
  FloatingTextPool,
  MathTowerKind,
  MathZombieKind,
  ParticlePool,
  triggerGameFeel,
  updateGameFeel,
} from '../canvas/proceduralArt';
import {
  ExplanationBanner,
  UltimateCutIn,
  WorldPauseModal,
} from '../components/UltimateCutIn';
import { RoguelikeCardModal } from '../components/RoguelikeCardModal';
import { RoguelikeRelicDef, rollRoguelikeChoices } from '../data/heroProgression';
import { gamepadManager } from '../core/gamepadManager';

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
  kind: MathZombieKind;
  lane: number;
  x: number; // 0..1 normalized across grid width (1.02 = right spawn, 0 = castle gate)
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  hasBucket: boolean;
  hasVaulted: boolean;
  jumpTimer: number;
  mageHealCd: number;
  speed: number;
  chillTimer: number;
  hitFlash: number;
  formulaQuestion: MathQuestion | null;
  biteCd: number;
}

interface FlyingBucket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  life: number;
}

interface FusionLightning {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
}

interface MathProjectile {
  lane: number;
  x: number;
  speed: number;
  damage: number;
  overclocked: boolean;
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
  playerCount = 1,
  stageConfig,
  masteredQuestionIds,
  wrongQuestionIds,
  onAnswerResult,
  onDiscoverMonster,
  onFinish,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guardian = GUARDIANS[guardianId];
  const qMgrRef = useRef(
    new QuestionManager<MathQuestion>(
      getMathQuestions(grade, semester, stageConfig?.stageNumber),
      {
        masteredQuestionIds,
        wrongQuestionIds,
        focusTags: stageConfig?.focusTags,
        bagKey: `math_td_g${grade}_s${semester}`,
      }
    )
  );
  const [relicModalOpen, setRelicModalOpen] = useState(false);
  const [relicChoices, setRelicChoices] = useState<RoguelikeRelicDef[]>([]);
  const relicBonusRef = useRef(1);
  const [bossWarning, setBossWarning] = useState(stageConfig?.tier === 'boss');
  useEffect(() => {
    if (!bossWarning) return;
    const t = window.setTimeout(() => setBossWarning(false), 1800);
    return () => clearTimeout(t);
  }, [bossWarning]);

  const [paused, setPaused] = useState(false);
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
  const [itemCharges, setItemCharges] = useState({ freeze: 1, smite: 1, gear: 1, repair: 1 });
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
    flyingBuckets: [] as FlyingBucket[],
    fusionArcs: [] as FusionLightning[],
    waveIndex: 0,
    zombiesToSpawn: 6,
    spawnTimer: 1.4,
    bossSpawned: false,
    particles: new ParticlePool(340),
    floats: new FloatingTextPool(48),
    feel: createGameFeel(),
  });

  useEffect(() => {
    pausedRef.current = paused || Boolean(banner) || relicModalOpen;
    document.body.dataset.state = paused ? 'paused' : banner ? 'reading' : relicModalOpen ? 'choosing' : 'playing';
  }, [paused,banner,relicModalOpen]);

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
    onAnswerResult(question, isCorrect);

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

      ultRef.current = Math.min(100, ultRef.current + getUltimateChargeGain(tier, nextCombo, guardianId));
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

          const laserDmg =
            target.kind === 'boss' || target.kind === 'fusion'
              ? Math.max(160, calc.damage * 2.2)
              : target.maxHp + 60;
          target.armor = 0;
          target.hp -= laserDmg;
          target.formulaQuestion = null;
          target.hitFlash = 1;
          td.floats.spawn(zx, zy - 26, `-${laserDmg}`, 'perfect', '黃金比例破甲雷射！');

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
    setTimeout(() => {
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

  // 4 Real-Time Tactical Item Triggers (Free starter charges + optional gear purchase)
  const useTacticalItem = (item: 'freeze' | 'smite' | 'gear' | 'repair') => {
    const td = tdRef.current;
    const gearCosts = { freeze: 60, smite: 80, gear: 999, repair: 90 };
    const freeLeft = itemCharges[item];
    if (freeLeft <= 0) {
      if (item === 'gear' || gearsRef.current < gearCosts[item]) {
        soundEngine.playWrongBuzz();
        td.floats.spawn(td.width * 0.5, td.height * 0.5, '道具次數或齒輪不足！', 'miss');
        return;
      }
      gearsRef.current -= gearCosts[item];
      setGears(gearsRef.current);
    } else {
      setItemCharges((prev) => ({ ...prev, [item]: prev[item] - 1 }));
    }

    soundEngine.hapticPulse(18);
    if (item === 'freeze') {
      freezeRef.current = Math.max(freezeRef.current, 5);
      setFreezeSecs(Math.ceil(freezeRef.current));
      soundEngine.playPerfectBell();
      td.floats.spawn(td.width * 0.5, td.height * 0.35, '❄️ 絕對零度冰封 5s', 'perfect');
    } else if (item === 'smite') {
      const strongest = [...td.zombies].sort((a, b) => b.hp + b.armor - (a.hp + a.armor))[0];
      if (strongest) {
        const zx = td.gridLeft + strongest.x * (td.cellW * COLS);
        const zy = td.gridTop + (strongest.lane + 0.5) * td.cellH;
        td.lasers.push({ x: zx, y: zy, life: 0.6 });
        strongest.armor = 0;
        strongest.hp -= strongest.kind === 'boss' || strongest.kind === 'fusion' ? 240 : 999;
        strongest.hitFlash = 1;
        soundEngine.playExplosion();
        triggerGameFeel(td.feel, { hitstop: 0.06, shake: 0.7, flash: 0.28, flashColor: '#38BDF8' });
        td.particles.burst(zx, zy, 28, ['#38BDF8', '#FDE047', '#FFFFFF'], 90, 290, 7, 'spark');
        td.floats.spawn(zx, zy - 26, '⚡ 質數天雷貫穿！', 'perfect');
      }
    } else if (item === 'gear') {
      gearsRef.current += 150;
      setGears(gearsRef.current);
      soundEngine.playGearBuild();
      td.floats.spawn(td.width * 0.5, td.height * 0.38, '⚙️ +150 齒輪湧泉', 'perfect');
    } else {
      const heal = Math.round(playerStats.maxHp * 0.5);
      castleHpRef.current = Math.min(playerStats.maxHp, castleHpRef.current + heal);
      setCastleHp(castleHpRef.current);
      soundEngine.playPerfectBell();
      td.floats.spawn(td.gridLeft + 30, td.height * 0.45, `🛡️ 城門 +${heal}`, 'heal');
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
      td.gridLeft = isNarrow ? 34 : Math.max(66, rect.width * 0.08);
      td.gridTop = 14;
      const availW = Math.max(200, rect.width - td.gridLeft - (isNarrow ? 8 : 20));
      const availH = Math.max(150, rect.height - td.gridTop - 14);
      td.cellW = availW / COLS;
      td.cellH = availH / LANES;
      Object.assign(canvas.dataset,{gridLeft:String(td.gridLeft),gridTop:String(td.gridTop),cellWidth:String(td.cellW),cellHeight:String(td.cellH)});
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
      const kinds: Array<'zero' | 'bucket' | 'hopper' | 'sprinter' | 'mage'> = [
        'zero',
        'bucket',
        'hopper',
        'sprinter',
        'mage',
      ];
      const poolMax = Math.min(kinds.length, 3 + waveIdx);
      const kind: MathZombieKind = isBoss ? 'boss' : kinds[Math.floor(Math.random() * poolMax)];
      const hasFormulaShield = isBoss || kind === 'bucket' || kind === 'mage' || Math.random() < 0.48;
      const baseHp =
        isBoss ? 580 : kind === 'bucket' ? 195 : kind === 'mage' ? 150 : kind === 'hopper' ? 135 : kind === 'sprinter' ? 110 : 120;
      const baseArmor =
        isBoss ? 260 : kind === 'bucket' ? 170 : kind === 'mage' ? 120 : 95;
      const baseSpeed =
        isBoss ? 0.024 : kind === 'sprinter' ? 0.068 : kind === 'hopper' ? 0.048 : 0.036;

      onDiscoverMonster?.(
        isBoss
          ? 'bst_fusion_behemoth'
          : kind === 'bucket'
            ? 'bst_bucket_zombie'
            : kind === 'mage'
              ? 'bst_algebra_mage'
              : kind === 'hopper'
                ? 'bst_fraction_hopper'
                : kind === 'sprinter'
                  ? 'bst_decimal_sprinter'
                  : 'bst_zero_zombie'
      );
      td.zombies.push({
        id: `z-${Date.now()}-${Math.random()}`,
        kind,
        lane,
        x: 1.03,
        hp: Math.round(baseHp * (stageConfig?.enemyHpScale ?? 1)),
        maxHp: Math.round(baseHp * (stageConfig?.enemyHpScale ?? 1)),
        armor: Math.round(baseArmor * (stageConfig?.enemyHpScale ?? 1)),
        maxArmor: Math.round(baseArmor * (stageConfig?.enemyHpScale ?? 1)),
        hasBucket: kind === 'bucket',
        hasVaulted: false,
        jumpTimer: 0,
        mageHealCd: 3.5,
        speed: playMode === 'practice' ? baseSpeed * 0.72 : baseSpeed,
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
            if (td.waveIndex === 2) {
              setRelicChoices(rollRoguelikeChoices(td.waveIndex + 3));
              setRelicModalOpen(true);
            }
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
                const isOc = t.overclockTimer > 0;
                if (t.kind === 'raccoon') {
                  t.cooldown = 0.85;
                  td.projectiles.push({
                    lane: t.lane,
                    x: (t.col + 0.65) / COLS,
                    speed: 0.62,
                    damage: Math.round(playerStats.baseAttack * 0.78),
                    overclocked: isOc,
                    kind: 'digit',
                    color: isOc ? '#FDE047' : '#38BDF8',
                  });
                  soundEngine.playLaser();
                } else if (t.kind === 'owl') {
                  t.cooldown = 1.45;
                  td.projectiles.push({
                    lane: t.lane,
                    x: (t.col + 0.65) / COLS,
                    speed: 0.48,
                    damage: Math.round(playerStats.baseAttack * 0.68),
                    overclocked: isOc,
                    kind: 'frost',
                    color: '#67E8F9',
                  });
                } else {
                  t.cooldown = 2.2;
                  td.projectiles.push({
                    lane: t.lane,
                    x: (t.col + 0.65) / COLS,
                    speed: 0.42,
                    damage: Math.round(playerStats.baseAttack * 1.7),
                    overclocked: isOc,
                    kind: 'prime',
                    color: isOc ? '#FDE047' : '#FB7185',
                  });
                }
              }
            }
          }
        }

        // Update Projectiles with Hardcore Math Armor (10% scratch dmg unless Overclocked!)
        for (let i = td.projectiles.length - 1; i >= 0; i--) {
          const p = td.projectiles[i];
          p.x += p.speed * dt;
          if (p.x > 1.06) {
            td.projectiles.splice(i, 1);
            continue;
          }
          const hitZ = td.zombies.find((z) => z.lane === p.lane && Math.abs(z.x - p.x) < 0.055);
          if (hitZ) {
            const shieldFactor = hitZ.formulaQuestion && !p.overclocked ? 0.5 : 1.0;
            const dmgCalc = computeMathTowerDamage(
              Math.round(p.damage * shieldFactor),
              hitZ.armor,
              p.overclocked
            );
            const prevArmor = hitZ.armor;
            hitZ.armor = Math.max(0, hitZ.armor - dmgCalc.armorDamage);
            hitZ.hp -= dmgCalc.hpDamage;
            hitZ.hitFlash = 0.65;
            if (p.kind === 'frost') hitZ.chillTimer = 3.5;

            const px = td.gridLeft + hitZ.x * (td.cellW * COLS);
            const py = td.gridTop + (hitZ.lane + 0.5) * td.cellH;

            // Bucket Helmet Fly-Off Physics when Iron Bucket Zombie's armor breaks!
            if (hitZ.kind === 'bucket' && hitZ.hasBucket && prevArmor > 0 && hitZ.armor <= 0) {
              hitZ.hasBucket = false;
              td.flyingBuckets.push({
                x: px,
                y: py - 24,
                vx: 85 + Math.random() * 55,
                vy: -220,
                rot: 0,
                life: 1.15,
              });
              td.floats.spawn(px, py - 32, '鐵桶破甲！', 'perfect');
            }

            if (p.kind === 'prime') {
              soundEngine.playExplosion();
              td.particles.burst(px, py, 16, ['#FB7185', '#FACC15'], 60, 180, 6);
              for (const other of td.zombies) {
                if (other.id !== hitZ.id && Math.abs(other.lane - hitZ.lane) <= 1 && Math.abs(other.x - hitZ.x) < 0.14) {
                  const splash = computeMathTowerDamage(Math.round(p.damage * 0.6), other.armor, p.overclocked);
                  other.armor = Math.max(0, other.armor - splash.armorDamage);
                  other.hp -= splash.hpDamage;
                }
              }
            } else {
              td.particles.burst(px, py, 5, [p.color, '#FFFFFF'], 30, 100, 3);
            }
            td.projectiles.splice(i, 1);
          }
        }

        // Zombie Fusion Evolution Check: 2 different nearby zombies merge into a giant Mutant Boss!
        if (td.zombies.length >= 2 && freezeRef.current <= 0) {
          outer: for (let a = 0; a < td.zombies.length; a++) {
            for (let b = a + 1; b < td.zombies.length; b++) {
              const za = td.zombies[a];
              const zb = td.zombies[b];
              if (canFuseZombies(za, zb)) {
                const ax = td.gridLeft + za.x * (td.cellW * COLS);
                const ay = td.gridTop + (za.lane + 0.5) * td.cellH;
                const bx = td.gridLeft + zb.x * (td.cellW * COLS);
                const by = td.gridTop + (zb.lane + 0.5) * td.cellH;
                td.fusionArcs.push({ x1: ax, y1: ay, x2: bx, y2: by, life: 0.75 });
                td.particles.burst((ax + bx) / 2, (ay + by) / 2, 26, ['#C084FC', '#E879F9', '#FDE047'], 70, 260, 7, 'spark');
                td.floats.spawn((ax + bx) / 2, (ay + by) / 2 - 34, '⚡ 殭屍融合進化！', 'crit', '變異融合巨獸');
                soundEngine.playUltimateRoar();

                const combinedHp = Math.round((za.hp + zb.hp) * 1.45);
                const combinedArmor = Math.round((za.armor + zb.armor) * 1.2 + 90);
                za.kind = 'fusion';
                za.hp = combinedHp;
                za.maxHp = combinedHp;
                za.armor = combinedArmor;
                za.maxArmor = combinedArmor;
                za.speed = Math.max(za.speed, zb.speed) * 0.92;
                za.formulaQuestion = pullMathQ();
                td.zombies.splice(b, 1);
                break outer;
              }
            }
          }
        }

        // Update Zombies (including Hopper tower-vault & Mage armor-shield healing!)
        const frozen = freezeRef.current > 0;
        for (let i = td.zombies.length - 1; i >= 0; i--) {
          const z = td.zombies[i];
          if (z.hitFlash > 0) z.hitFlash = Math.max(0, z.hitFlash - dt * 5);
          if (z.chillTimer > 0) z.chillTimer = Math.max(0, z.chillTimer - dt);
          if (z.jumpTimer > 0) z.jumpTimer = Math.max(0, z.jumpTimer - dt * 1.6);

          if (z.hp <= 0) {
            const zx = td.gridLeft + z.x * (td.cellW * COLS);
            const zy = td.gridTop + (z.lane + 0.5) * td.cellH;
            td.particles.burst(zx, zy, 18, ['#84CC16', '#FACC15', '#FFFFFF'], 60, 220, 6);
            scoreRef.current += z.kind === 'boss' || z.kind === 'fusion' ? 620 : 120;
            gearsRef.current += z.kind === 'boss' || z.kind === 'fusion' ? 110 : 28;
            setScore(scoreRef.current);
            setGears(gearsRef.current);
            td.zombies.splice(i, 1);
            continue;
          }

          if (!frozen) {
            // Mage Zombie periodically repairs nearby zombies' Math Armor!
            if (z.kind === 'mage') {
              z.mageHealCd -= dt;
              if (z.mageHealCd <= 0) {
                z.mageHealCd = 4.2;
                const mx = td.gridLeft + z.x * (td.cellW * COLS);
                const my = td.gridTop + (z.lane + 0.5) * td.cellH;
                td.particles.burst(mx, my, 12, ['#38BDF8', '#A855F7'], 40, 120, 4);
                for (const ally of td.zombies) {
                  if (Math.abs(ally.lane - z.lane) <= 1 && Math.abs(ally.x - z.x) < 0.25) {
                    ally.armor = Math.min(ally.maxArmor, ally.armor + 35);
                  }
                }
              }
            }

            // Check blocking tower in same lane
            const blocking = td.towers.find(
              (t) => t.lane === z.lane && Math.abs(z.x - (t.col + 0.5) / COLS) < 0.055
            );
            if (blocking && z.kind === 'hopper' && !z.hasVaulted) {
              // Hopper vaults cleanly over the front-row blocking tower!
              z.hasVaulted = true;
              z.jumpTimer = 1.0;
              z.x -= 0.13;
              const zx = td.gridLeft + z.x * (td.cellW * COLS);
              const zy = td.gridTop + (z.lane + 0.5) * td.cellH;
              td.floats.spawn(zx, zy - 32, '躍過砲塔！', 'miss');
            } else if (blocking) {
              z.biteCd -= dt;
              if (z.biteCd <= 0) {
                z.biteCd = 0.95;
                blocking.hp -= z.kind === 'boss' || z.kind === 'fusion' ? 42 : 22;
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
              const gateDmg = z.kind === 'boss' || z.kind === 'fusion' ? 45 : 22;
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

        // Update Parabolic Flying Bucket Physics
        for (let i = td.flyingBuckets.length - 1; i >= 0; i--) {
          const fb = td.flyingBuckets[i];
          fb.life -= dt;
          fb.vy += 520 * dt;
          fb.x += fb.vx * dt;
          fb.y += fb.vy * dt;
          fb.rot += dt * 9;
          if (fb.life <= 0) td.flyingBuckets.splice(i, 1);
        }

        // Decay Fusion Lightning & Sky Lasers
        for (let i = td.fusionArcs.length - 1; i >= 0; i--) {
          td.fusionArcs[i].life -= dt;
          if (td.fusionArcs[i].life <= 0) td.fusionArcs.splice(i, 1);
        }
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

      // Hero Class Aura + Rotating Castle Gate Gear emblem
      drawHeroClassAura(
        ctx,
        castlePad + castleW * 0.5,
        td.gridTop + td.cellH * 2.5,
        td.time,
        playerStats.heroClassBranch,
        playerStats.heroTier
      );
      ctx.save();
      ctx.translate(castlePad + castleW * 0.5, td.gridTop + td.cellH * 2.5);
      ctx.rotate(td.time * 0.8);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = td.gridLeft < 60 ? 3.5 : 5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(24, castleW * 0.36) * Math.min(1.2, relicBonusRef.current), 0, Math.PI * 2);
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
        const unit=lawnUnitLayout(td.cellW,td.cellH);
        ctx.save();ctx.translate(tx,ty+unit.yOffset);ctx.scale(unit.scale,unit.scale);
        drawMathTower(ctx, t.kind, 0, 0, td.time, t.overclockTimer > 0, t.overheatTimer > 0, t.recoil);
        ctx.restore();
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
        const unit=lawnUnitLayout(td.cellW,td.cellH,z.kind==='fusion'?1.55:z.kind==='boss'?1.48:1);
        ctx.save();ctx.translate(zx,zy+unit.yOffset);ctx.scale(unit.scale,unit.scale);
        drawMathZombie(ctx, z.kind, 0, 0, td.time, {
          chapter: stageConfig?.chapterIndex,
          supreme: stageConfig?.stageNumber===10,
          hpRatio: z.hp / z.maxHp,
          armorRatio: z.maxArmor > 0 ? z.armor / z.maxArmor : 0,
          hasBucket: z.hasBucket,
          jumpOffset: z.jumpTimer > 0 ? Math.sin(z.jumpTimer * Math.PI) * 34 : 0,
          chilled: z.chillTimer > 0,
          hitFlash: z.hitFlash,
          formulaShield: null,
        });
        ctx.restore();
        if(z.formulaQuestion&&sortedZ.find(other=>other.lane===z.lane&&other.formulaQuestion)===z){
          const label=z.formulaQuestion.payload.formulaShield;
          ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
          const labelW=Math.min(104,Math.max(46,ctx.measureText(label).width+12));
          const lx=Math.max(td.gridLeft+labelW/2,Math.min(td.width-labelW/2-4,zx)),ly=Math.max(12,zy-td.cellH*.46);
          ctx.fillStyle='#0b1934';ctx.fillRect(lx-labelW/2,ly-9,labelW,18);ctx.fillStyle='#ffe39b';ctx.fillText(label,lx,ly,labelW-8);
        }
      }

      // Parabolic Flying Detached Iron Buckets!
      for (const fb of td.flyingBuckets) {
        ctx.save();
        ctx.translate(fb.x, fb.y);
        ctx.rotate(fb.rot);
        ctx.globalAlpha = Math.min(1, fb.life * 2);
        ctx.fillStyle = '#64748B';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, 8);
        ctx.lineTo(-9, -8);
        ctx.lineTo(9, -8);
        ctx.lineTo(12, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Purple Lightning Zombie Fusion Arcs!
      for (const arc of td.fusionArcs) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, arc.life * 2);
        ctx.strokeStyle = '#E879F9';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(arc.x1, arc.y1);
        ctx.lineTo((arc.x1 + arc.x2) / 2, (arc.y1 + arc.y2) / 2 - 26);
        ctx.lineTo(arc.x2, arc.y2);
        ctx.stroke();
        ctx.restore();
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
      if (Math.abs(cx - zx) < td.cellW*.5 && Math.abs(cy - zy) < td.cellH*.5) {
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

  // Switch Gamepad A/B/X/Y buzz-in when Math Solver is open
  useEffect(() => {
    if (!solverState || paused) return;
    const id = window.setInterval(() => {
      const snap = gamepadManager.poll();
      for (const p of snap.players) {
        if (!p.connected) continue;
        if (p.justPressed.confirm) handleSolveOption(0);
        if (p.justPressed.cancel) handleSolveOption(1);
        if (p.justPressed.skill1) handleSolveOption(2);
        if (p.justPressed.skill2) handleSolveOption(3);
        break;
      }
    }, 80);
    return () => clearInterval(id);
  }, [handleSolveOption, paused, solverState]);

  const classMultPreview = computeClassDamageBonus(playerStats.heroClassId, combo, combo >= 3);

  return (
    <div
      className="game-screen game-screen-math w-screen h-[100dvh] flex flex-col overflow-hidden bg-slate-950 text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      data-testid="math-td-engine"
    >
      {/* Tier 1: Single-Row Compact HUD (h-12 shrink-0, zero overlap!) */}
      <header className="game-hud h-12 shrink-0 px-2.5 bg-slate-900/95 border-b border-blue-500/35 flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-black text-sky-300 truncate max-w-[115px] sm:max-w-none">
            {stageConfig
              ? `🏰 ${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
              : `🏰 數境塔防(${grade}年)`}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-12 sm:w-20 h-2 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-transform origin-left"
                style={{ transform: `scaleX(${Math.max(0, castleHp / playerStats.maxHp)})` }}
              />
            </div>
            <span className="text-[11px] font-black text-white font-mono-num">{castleHp}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-black shrink-0">
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 font-mono-num flex items-center gap-1">
            <Cog className="w-3 h-3" /> {gears}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-mono-num">
            W{wave}/{TOTAL_WAVES}
          </span>
          {playerCount > 1 && (
            <span className="hidden sm:inline px-1.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-200 text-[10px]">
              {playerCount}P共鬥×{classMultPreview.toFixed(1)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setPaused(true)}
            aria-label="暫停遊戲"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-white flex items-center justify-center shrink-0"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split: Portrait Top Canvas / Bottom Dock | Landscape 54% Left Canvas / 46% Right Dock */}
      <div className="game-layout flex-1 min-h-0 flex flex-col landscape:flex-row overflow-hidden" inert={Boolean(banner)}>
        {/* Tier 2: Pure Unobstructed 5x8 Lawn Canvas */}
        <div className="game-stage relative h-[42dvh] shrink-0 landscape:h-full landscape:w-[54%] bg-slate-950 border-b landscape:border-b-0 landscape:border-r border-blue-500/25 overflow-hidden">
          <canvas
            ref={canvasRef}
            onClick={handleGridClick}
            className="block w-full h-full cursor-pointer"
            data-testid="math-td-canvas"
          />
          {freezeSecs > 0 && (
            <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-sky-600/90 text-white text-[11px] font-black">
              ❄️ 全場冰封 {freezeSecs}s
            </div>
          )}

          {/* Circular Radial Tower Build Wheel (Localized inside Canvas on empty tile tap) */}
          {radialPicker && (
            <div
              data-testid="math-td-radial-wheel"
              className="absolute z-30 pointer-events-auto"
              style={{
                left: Math.max(122, Math.min((canvasRef.current?.clientWidth ?? 360) - 122, radialPicker.x)),
                top: Math.max(78, Math.min((canvasRef.current?.clientHeight ?? 260) - 78, radialPicker.y)),
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="grid w-[236px] grid-cols-2 gap-1.5 rounded-2xl bg-slate-950 border-2 border-amber-400/80 shadow-2xl p-2">
                <button
                  type="button"
                  onClick={() => setRadialPicker(null)}
                  aria-label="取消建塔"
                  className="col-span-2 min-h-[36px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-500 text-slate-200 font-black text-[11px]"
                >
                  取消
                </button>
                {TOWER_SHOP.map((t) => {
                  const affordable = gears >= t.cost;
                  return (
                    <button
                      key={t.kind}
                      type="button"
                      onClick={() => placeTowerAt(radialPicker.lane, radialPicker.col, t.kind)}
                      className={`min-h-[44px] px-2 py-1 rounded-xl border text-center shadow-lg transition-transform active:scale-90 ${
                        affordable
                          ? `bg-slate-900 ${t.accent} text-white hover:bg-slate-800`
                          : 'bg-slate-900/85 border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] font-black whitespace-nowrap">{t.name.slice(0, 4)}</div>
                      <div className="text-[10px] font-black text-amber-300 font-mono-num">⚙{t.cost}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Tier 3: Independent Controls + Inline Math Blueprint Solver (NEVER blocks the 5x8 lawn!) */}
        <div className="game-controls flex-1 min-h-0 landscape:w-[46%] overflow-y-auto p-2.5 bg-slate-900/95 flex flex-col justify-between gap-2">
          {/* Primary Math Power Triggers */}
          <div className="grid grid-cols-3 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={openHarvestSolver}
              className="min-h-[42px] px-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 shadow transition-transform active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" /> 採能超頻
            </button>
            <button
              type="button"
              onClick={openSnipeNearestShield}
              className={`min-h-[42px] px-2 rounded-xl font-black text-[11px] border flex items-center justify-center gap-1 transition-transform active:scale-95 ${
                shieldedCount > 0
                  ? 'bg-rose-500 hover:bg-rose-400 border-amber-200 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 shrink-0" /> 破盾({shieldedCount})
            </button>
            <button
              type="button"
              disabled={guardianUsed}
              onClick={handleGuardianSkill}
              className={`min-h-[42px] px-2 rounded-xl font-black text-[11px] border flex items-center justify-center gap-1 truncate ${
                guardianUsed
                  ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-400 hover:bg-sky-300 border-sky-200 text-slate-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{guardian.activeName}</span>
            </button>
          </div>

          {/* Inline Math Solver OR Tower Blueprint + Tactical Items */}
          {solverState ? (
            <div data-testid="math-td-inline-solver" className="rounded-2xl bg-slate-950/95 border-2 border-amber-400 p-3 space-y-2 flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-amber-300 truncate">
                  {solverState.purpose === 'snipe'
                    ? '🎯 黃金比例狙擊・破解算式盾！'
                    : '⚡ 算數採能機・快解獲齒輪＋超頻！'}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => soundEngine.speakText(solverState.question.prompt, 'zh-TW')}
                    aria-label="朗讀數學題目"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSolverState(null)}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300"
                  >
                    返回建塔
                  </button>
                </div>
              </div>
              <div className="text-sm sm:text-base font-black text-white leading-snug">
                {solverState.question.prompt}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {solverState.question.payload.options.map((opt, idx) => {
                  const padKeys = ['A', 'B', 'X', 'Y'];
                  return (
                    <button
                      key={`${solverState.question.id}-${opt}-${idx}`}
                      type="button"
                      onClick={() => {
                        soundEngine.hapticPulse(14);
                        handleSolveOption(idx);
                      }}
                      className="min-h-[46px] px-2.5 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-sky-500/60 text-white font-black text-sm font-mono-num flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span className="w-5 h-5 rounded bg-white/15 text-amber-300 text-[10px] flex items-center justify-center shrink-0">
                        {padKeys[idx]}
                      </span>
                      <span className="truncate">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {/* 4 Tower Blueprints */}
              <div className="grid grid-cols-2 gap-1.5">
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
                      className={`min-h-[48px] rounded-xl px-2.5 py-1.5 border-2 text-left transition-transform active:scale-95 ${
                        active
                          ? `bg-slate-800 ${t.accent}`
                          : 'bg-slate-950/80 border-slate-700 hover:border-slate-500'
                      } ${!affordable ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-white truncate">{t.name}</span>
                        <span className="text-xs font-black text-amber-300 font-mono-num shrink-0">⚙{t.cost}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">{t.role}</div>
                    </button>
                  );
                })}
              </div>

              {/* 4 Compact Tactical Item Slots */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'freeze' as const, icon: '❄️', label: '冰封', cost: 60 },
                  { id: 'smite' as const, icon: '⚡', label: '天雷', cost: 80 },
                  { id: 'gear' as const, icon: '⚙️', label: '+150', cost: 0 },
                  { id: 'repair' as const, icon: '🛡️', label: '修50%', cost: 90 },
                ].map((it) => {
                  const free = itemCharges[it.id];
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => useTacticalItem(it.id)}
                      className="min-h-[42px] px-1 rounded-xl bg-slate-950 hover:bg-indigo-900/70 border border-indigo-400/45 text-white text-center transition-transform active:scale-95 flex flex-col items-center justify-center"
                    >
                      <span className="text-[11px] font-black leading-none">
                        {it.icon} {it.label}
                      </span>
                      <span className="text-[9px] font-mono-num text-amber-300 mt-0.5">
                        {free > 0 ? `免費×${free}` : it.cost > 0 ? `⚙${it.cost}` : '已用'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ultimate Bar */}
          <button
            type="button"
            disabled={ultCharge < 100}
            onClick={triggerGoldenRatioUltimate}
            className={`w-full min-h-[44px] px-3 rounded-xl font-black text-xs sm:text-sm border flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95 ${
              ultCharge >= 100
                ? 'bg-amber-400 hover:bg-amber-300 border-white text-slate-950 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" /> 黃金比例轟炸 ({ultCharge}%)
          </button>
        </div>
      </div>

      {bossWarning && stageConfig?.tier === 'boss' && (
        <div className="fixed inset-x-0 top-14 z-30 pointer-events-none flex justify-center px-4">
          <div className="rounded-full bg-rose-950/95 border border-amber-400 px-4 py-1.5 text-center shadow-lg">
            <span className="text-xs font-black text-amber-200">
              ⚠️ 魔王進軍：{stageConfig.enemyName}
            </span>
          </div>
        </div>
      )}

      <RoguelikeCardModal
        open={relicModalOpen}
        title="🌟 數境防線覺醒・選擇戰術遺物"
        choices={relicChoices}
        onPick={(relic) => {
          setRelicModalOpen(false);
          if (relic.id === 'golden_aegis' || relic.id === 'wisdom_drain') {
            castleHpRef.current = Math.min(playerStats.maxHp, castleHpRef.current + Math.round(playerStats.maxHp * 0.35));
            setCastleHp(castleHpRef.current);
          } else if (relic.id === 'chain_lightning' || relic.id === 'absolute_zero') {
            ultRef.current = 100;
            setUltCharge(100);
          } else {
            gearsRef.current += 120;
            setGears(gearsRef.current);
            relicBonusRef.current = Number((relicBonusRef.current + 0.2).toFixed(2));
          }
        }}
      />

      <ExplanationBanner message={banner} onDismiss={() => setBanner(null)} />
      <UltimateCutIn
        visible={cutIn}
        title="黃金比例・幾何軌道砲"
        subtitle="全戰線算式盾粉碎＋補給 100 齒輪！"
        symbol="φ"
        accentBg="bg-gradient-to-r from-blue-700 via-indigo-800 to-amber-600"
      />
      <WorldPauseModal
        open={paused}
        worldName={
          stageConfig
            ? `數境建築王國・第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
            : '數學・數境建築王國'
        }
        onResume={() => setPaused(false)}
        onRestart={onExit}
        onExit={onExit}
      />
    </div>
  );
};
