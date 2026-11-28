import {kitchenSceneScale} from '../core/renderLayout';
import {ScienceWorkbench} from '../components/ScienceWorkbench';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, Flame, Pause, Sparkles, Volume2, FlaskConical, CheckCircle2 } from 'lucide-react';
import {
  EngineCommonProps,
  PhType,
  ScienceIngredient,
  ScienceQuestion,
  TempZone,
  WorldRunResult,
} from '../types/game';
import { getScienceQuestions } from '../data/questionBank';
import { QuestionManager } from '../core/questionManager';
import { GUARDIANS } from '../data/guardians';
import {
  calculateCombatDamage,
  calculateStarRating,
  computeClassDamageBonus,
  getUltimateChargeGain,
} from '../core/combatMath';
import { soundEngine } from '../audio/soundEngine';
import {
  createGameFeel,
  drawChefCharacter,
  drawDarkGluttonBoss,
  drawHeroClassAura,
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
import { RoguelikeCardModal } from '../components/RoguelikeCardModal';
import { RoguelikeRelicDef, rollRoguelikeChoices } from '../data/heroProgression';
import { gamepadManager } from '../core/gamepadManager';

type CookingStep = 'ingredients' | 'temperature' | 'ph' | 'serve';

export const ScienceCookingEngine: React.FC<EngineCommonProps> = ({
  appearance,
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
  const appearanceRef = useRef(appearance);
  appearanceRef.current = appearance;
  const guardian = GUARDIANS[guardianId];
  const dishMgrRef = useRef(
    new QuestionManager<ScienceQuestion>(getScienceQuestions(grade, semester), {
      masteredQuestionIds,
      wrongQuestionIds,
      focusTags: stageConfig?.focusTags,
      bagKey: `sci_cook_g${grade}_s${semester}`,
    })
  );

  const [paused, setPaused] = useState(false);
  const [chef, setChef] = useState<'redpanda' | 'penguin' | 'mantis' | 'fox'>('redpanda');
  const bossMaxHp = Math.round(380 * (stageConfig?.enemyHpScale ?? 1));
  const [bossHp, setBossHp] = useState(bossMaxHp);
  const [kitchenHp, setKitchenHp] = useState(playerStats.maxHp);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [ultCharge, setUltCharge] = useState(25);
  const [guardianUsed, setGuardianUsed] = useState(false);
  const [freezeSecs, setFreezeSecs] = useState(0);
  const [orderTimer, setOrderTimer] = useState(grade<=2?45:32);
  const [cutIn, setCutIn] = useState(false);
  const [relicModalOpen, setRelicModalOpen] = useState(false);
  const [relicChoices, setRelicChoices] = useState<RoguelikeRelicDef[]>([]);
  const relicTriggeredRef = useRef(false);
  const [bossWarning, setBossWarning] = useState(stageConfig?.tier === 'boss');
  useEffect(() => {
    onDiscoverMonster?.('bst_chaos_dragon');
  }, [onDiscoverMonster]);
  useEffect(() => {
    if (!bossWarning) return;
    const t = window.setTimeout(() => setBossWarning(false), 1800);
    return () => clearTimeout(t);
  }, [bossWarning]);

  // 4-Step Cooking Workbench State + Dual Concurrent Order Queue (Zero-Repeat)
  const [currentDish, setCurrentDish] = useState<ScienceQuestion>(() => dishMgrRef.current.next());
  const [nextDish, setNextDish] = useState<ScienceQuestion>(() => dishMgrRef.current.next());
  const nextDishRef = useRef<ScienceQuestion>(nextDish);
  useEffect(() => {
    nextDishRef.current = nextDish;
  }, [nextDish]);
  const servingRef=useRef(false);
  const [step, setStep] = useState<CookingStep>('ingredients');
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [tempResult, setTempResult] = useState<'PERFECT' | 'GREAT' | 'GOOD' | null>(null);
  const [selectedPh, setSelectedPh] = useState<PhType | null>(null);
  const [banner, setBanner] = useState<{
    title: string;
    answer: string;
    explanation: string;
    tag: string;
  } | null>(null);

  // Live rhythm stove needle (0..100) mutated in RAF + DOM ref for zero 60Hz React re-renders!
  const needleRef = useRef(50);
  const needleDirRef = useRef(1);
  const needleBarRef = useRef<HTMLDivElement | null>(null);

  const pausedRef = useRef(false);
  const chefRef = useRef<'redpanda' | 'penguin' | 'mantis' | 'fox'>('redpanda');
  const stepRef = useRef<CookingStep>('ingredients');
  const bossHpRef = useRef(bossMaxHp);
  const kitchenHpRef = useRef(playerStats.maxHp);
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
  const orderTimeRef = useRef(grade<=2?45:32);

  const simRef = useRef({
    time: 0,
    width: 1200,
    height: 420,
    potColor: '#7C3AED', // purple cabbage default
    potTargetColor: '#7C3AED',
    chefPulse: 0,
    bossHitFlash: 0,
    bossMood: 'hungry' as 'hungry' | 'hurt' | 'happy',
    bossMoodTimer: 0,
    bossFireBreath: 0,
    dishExplosion: null as {
      progress: number;
      style: 'fire' | 'ice' | 'rainbow' | 'nature';
      label: string;
    } | null,
    flyingDish: null as {
      progress: number;
      style: 'fire' | 'ice' | 'rainbow' | 'nature';
      label: string;
    } | null,
    particles: new ParticlePool(340),
    floats: new FloatingTextPool(48),
    feel: createGameFeel(),
  });

  useEffect(() => {
    pausedRef.current = paused || Boolean(banner) || relicModalOpen;
    document.body.dataset.state = paused ? 'paused' : banner ? 'reading' : relicModalOpen ? 'choosing' : 'playing';
  }, [paused,banner,relicModalOpen]);

  useEffect(() => {
    chefRef.current = chef;
  }, [chef]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const loadNextDish = useCallback(() => {
    const promoted = nextDishRef.current;
    const queued = dishMgrRef.current.next();
    setCurrentDish(promoted);
    setNextDish(queued);
    nextDishRef.current = queued;
    servingRef.current=false;
    setStep('ingredients');
    setPickedIds([]);
    setTempResult(null);
    setSelectedPh(null);
    orderTimeRef.current = grade<=2?45:guardianId === 'griffin' ? 36 : 32;
    setOrderTimer(orderTimeRef.current);
    simRef.current.potColor = '#7C3AED';
    soundEngine.speakText(`新訂單，${promoted.payload.dishName}。${promoted.payload.orderRequirement}`, 'zh-TW');
  }, [guardianId]);

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
        kitchenHpRef.current / playerStats.maxHp
      );
      const result: WorldRunResult = {
        subject: 'science',
        victory,
        score: scoreRef.current,
        stars,
        correctCount: correctRef.current,
        totalAttempts: attemptsRef.current,
        maxCombo: maxComboRef.current,
        clearSeconds,
        coinsEarned: victory ? 100 + stars * 35 + Math.round(scoreRef.current * 0.04) : 30,
        xpEarned: victory ? 95 + stars * 25 : 25,
        crystalsEarned: victory ? stars * 2 + 1 : 0,
        knowledgeTags: Array.from(tagsRef.current),
        progressSummary: victory
          ? `用完美元素料理征服${stageConfig?.enemyName ?? '黑暗饕餮'}！解鎖 ${tagsRef.current.size} 個自然科學原理！`
          : `${stageConfig?.enemyName ?? '黑暗饕餮'}大鬧廚房了，調整實驗步驟再挑戰一次！`,
        stageKey: stageConfig?.stageKey,
        stageLabel: stageConfig ? `第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關「${stageConfig.title}」` : undefined,
        chestRewardText: victory && stars === 3 ? stageConfig?.starChestReward?.label : undefined,
      };
      onFinish(result);
    },
    [onFinish, playerStats.maxHp, stageConfig]
  );

  // Step 1: Pick scientific ingredients from Cold Storage
  const handlePickIngredient = (ing: ScienceIngredient) => {
    if (step !== 'ingredients' || pickedIds.includes(ing.id)) return;
    const s = simRef.current;
    const potX = s.width * 0.5;
    const potY = s.height * 0.78;

    if (ing.isCorrect) {
      soundEngine.playSizzleChop();
      const nextPicked = [...pickedIds, ing.id];
      setPickedIds(nextPicked);
      s.chefPulse = 1;
      s.particles.burst(potX, potY, 14, [ing.color, '#FEF08A', '#FFFFFF'], 50, 170, 5);
      s.floats.spawn(potX, potY - 30, `投入 ${ing.name}！`, 'heal');

      if (nextPicked.length >= currentDish.payload.neededCount) {
        soundEngine.playCorrectChord(comboRef.current + 1);
        if(grade<=2){setTempResult('GOOD');setSelectedPh('neutral');setStep('serve');}else setStep('temperature');
      }
    } else {
      // Wrong ingredient: Dragon Lord scorches kitchen + black smoke + science fact!
      attemptsRef.current += 1;
      onAnswerResult(currentDish, false);
      comboRef.current = 0;
      setCombo(0);
      soundEngine.playWrongBuzz();
      s.bossFireBreath = 0.85;
      if (playMode === 'adventure') {
        const scorchDmg = 10;
        kitchenHpRef.current = Math.max(0, kitchenHpRef.current - scorchDmg);
        setKitchenHp(kitchenHpRef.current);
        if (kitchenHpRef.current <= 0) setTimeout(() => concludeRun(false), 500);
      }
      triggerGameFeel(s.feel, { shake: 0.38 });
      s.particles.burst(potX, potY, 18, ['#334155', '#EF4444', '#64748B'], 40, 150, 8, 'circle', -40);
      s.floats.spawn(potX, potY - 26, '龍息灼燒！', 'miss');
      setBanner({
        title: `選錯食材「${ing.name}」！`,
        answer: currentDish.payload.ingredients
          .filter((i) => i.isCorrect)
          .map((i) => i.name)
          .join('＋'),
        explanation: ing.wrongReason ?? currentDish.explanation,
        tag: currentDish.knowledgeTag,
      });
    }
  };

  // Step 2: Rhythm Temperature Lock!
  const getTempBounds = (zone: TempZone): [number, number] => {
    const widen = guardianId === 'deer' ? 6 : 0;
    if (zone === 'freeze') return [0, 32 + widen];
    if (zone === 'simmer') return [35 - widen / 2, 67 + widen / 2];
    return [68 - widen, 100];
  };

  const handleLockTemperature = useCallback(() => {
    if (stepRef.current !== 'temperature') return;
    const val = needleRef.current;
    const [minB, maxB] = getTempBounds(currentDish.payload.targetTempZone);
    const center = (minB + maxB) / 2;
    const s = simRef.current;
    const potX = s.width * 0.5;
    const potY = s.height * 0.78;

    if (val >= minB && val <= maxB) {
      const dist = Math.abs(val - center);
      const tier = dist <= (maxB - minB) * 0.34 ? 'PERFECT' : 'GREAT';
      setTempResult(tier);
      if (tier === 'PERFECT') soundEngine.playPerfectBell();
      else soundEngine.playCorrectChord(2);
      s.chefPulse = 1;
      const col =
        currentDish.payload.targetTempZone === 'freeze'
          ? '#38BDF8'
          : currentDish.payload.targetTempZone === 'boil'
            ? '#EF4444'
            : '#F59E0B';
      s.particles.burst(potX, potY, 20, [col, '#FEF08A'], 70, 210, 6);
      s.floats.spawn(potX, potY - 30, tier === 'PERFECT' ? '火候 PERFECT!' : '火候 GREAT!', tier === 'PERFECT' ? 'perfect' : 'heal');
      setStep('ph');
    } else {
      soundEngine.playWrongBuzz();
      triggerGameFeel(s.feel, { shake: 0.25 });
      s.floats.spawn(potX, potY - 26, '溫度偏差！再試一次', 'miss');
    }
  }, [currentDish.payload.targetTempZone, guardianId]);

  // Step 3: Acid / Neutral / Alkali Reagent Drop with Live Broth Color Change
  const handleDropReagent = (ph: PhType) => {
    if (step !== 'ph') return;
    const s = simRef.current;
    const potX = s.width * 0.5;
    const potY = s.height * 0.78;
    const brothColor = ph === 'acid' ? '#F43F5E' : ph === 'alkali' ? '#14B8A6' : '#A855F7';
    s.potColor = brothColor;
    s.particles.burst(potX, potY, 22, [brothColor, '#FFFFFF', '#FEF08A'], 60, 200, 6);

    if (ph === currentDish.payload.targetPh) {
      soundEngine.playCorrectChord(3);
      setSelectedPh(ph);
      s.floats.spawn(potX, potY - 30, '酸鹼調色完美！', 'perfect');
      setStep('serve');
    } else {
      attemptsRef.current += 1;
      onAnswerResult(currentDish, false);
      soundEngine.playWrongBuzz();
      setBanner({
        title: '試劑酸鹼度不符訂單要求！',
        answer: currentDish.payload.targetPhLabel,
        explanation: currentDish.explanation,
        tag: currentDish.knowledgeTag,
      });
    }
  };

  // Step 4: Ring Serving Attack Bell -> Launch Dish at Dark Glutton Boss!
  const handleRingServeBell = () => {
    if (step !== 'serve'||servingRef.current||pausedRef.current) return;
    servingRef.current=true;
    const s = simRef.current;
    soundEngine.playPerfectBell();
    soundEngine.playSlash();

    attemptsRef.current += 1;
    correctRef.current += 1;
    onAnswerResult(currentDish, true);
    tagsRef.current.add(currentDish.knowledgeTag);

    const nextCombo = comboRef.current + 1;
    comboRef.current = nextCombo;
    maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
    setCombo(nextCombo);

    const speedTier = tempResult ?? 'GREAT';
    const calc = calculateCombatDamage({
      baseAttack: playerStats.baseAttack,
      skillMultiplier: 2.8,
      isCorrect: true,
      speedGrade: speedTier,
      combo: nextCombo,
      guardianId,
      doubleNextAttack: doubleNextRef.current,
    });
    doubleNextRef.current = false;

    const dishDmg = Math.max(95, calc.damage);
    s.flyingDish = {
      progress: 0,
      style: currentDish.payload.effectStyle,
      label: currentDish.payload.dishName,
    };

    // Impact moment when dish hits Boss
    setTimeout(() => {
      const bx = s.width * 0.5;
      const by = s.height * 0.34;
      bossHpRef.current = Math.max(0, bossHpRef.current - dishDmg);
      setBossHp(bossHpRef.current);
      s.bossHitFlash = 1;
      s.bossMood = 'hurt';
      s.bossMoodTimer = 1.1;
      s.dishExplosion = {
        progress: 0,
        style: currentDish.payload.effectStyle,
        label:
          currentDish.payload.effectStyle === 'fire'
            ? '🔥 火龍捲鍋！'
            : currentDish.payload.effectStyle === 'ice'
              ? '❄️ 絕對零度聖代！'
              : '🌈 虹彩酸鹼衝擊波！',
      };
      soundEngine.playExplosion();
      const fxColors =
        currentDish.payload.effectStyle === 'ice'
          ? ['#38BDF8', '#A5F3FC', '#FFFFFF']
          : currentDish.payload.effectStyle === 'fire'
            ? ['#F97316', '#EF4444', '#FDE047']
            : ['#F43F5E', '#A855F7', '#14B8A6', '#FDE047'];
      triggerGameFeel(s.feel, {
        hitstop: 0.06,
        shake: 0.72,
        flash: 0.28,
        flashColor: fxColors[0],
      });
      s.particles.burst(bx, by, 38, fxColors, 100, 360, 8, 'spark');
      s.particles.spawn(bx, by, 0, 0, fxColors[0], 20, 0.45, 0, 'ring');
      s.floats.spawn(
        bx,
        by - 20,
        `-${dishDmg}`,
        speedTier === 'PERFECT' ? 'perfect' : 'crit',
        `${currentDish.payload.dishName} 必殺上菜！`
      );

      scoreRef.current += dishDmg * 4 + (speedTier === 'PERFECT' ? 180 : 90);
      setScore(scoreRef.current);
      ultRef.current = Math.min(100, ultRef.current + getUltimateChargeGain(speedTier, nextCombo, guardianId));
      setUltCharge(ultRef.current);

      if (bossHpRef.current <= 0) {
        setTimeout(() => concludeRun(true), 700);
      } else {
        setTimeout(() => loadNextDish(), 650);
      }
    }, 360);
  };

  const triggerElementFeastUltimate = () => {
    if (ultRef.current < 100) return;
    ultRef.current = 0;
    setUltCharge(0);
    soundEngine.playUltimateRoar();
    setCutIn(true);
    setTimeout(() => {
      setCutIn(false);
      const s = simRef.current;
      const dmg = 165;
      bossHpRef.current = Math.max(0, bossHpRef.current - dmg);
      setBossHp(bossHpRef.current);
      s.bossHitFlash = 1;
      s.bossMood = 'hurt';
      s.bossMoodTimer = 1.4;
      triggerGameFeel(s.feel, { hitstop: 0.08, shake: 0.9, flash: 0.35, flashColor: '#F97316' });
      s.particles.burst(s.width * 0.5, s.height * 0.34, 42, ['#F97316', '#38BDF8', '#10B981', '#FDE047'], 110, 360, 8, 'spark');
      s.floats.spawn(s.width * 0.5, s.height * 0.28, `-${dmg}`, 'perfect', '五星元素大滿貫！');
      scoreRef.current += 520;
      setScore(scoreRef.current);
      if (bossHpRef.current <= 0) setTimeout(() => concludeRun(true), 700);
    }, 1150);
  };

  const handleGuardianSkill = () => {
    if (guardianUsed) return;
    setGuardianUsed(true);
    soundEngine.playPerfectBell();
    const s = simRef.current;
    if (guardian.activeEffectKey === 'ink_heal_boost') {
      const heal = Math.round(playerStats.maxHp * 0.35);
      kitchenHpRef.current = Math.min(playerStats.maxHp, kitchenHpRef.current + heal);
      setKitchenHp(kitchenHpRef.current);
      doubleNextRef.current = true;
      s.floats.spawn(s.width * 0.5, s.height * 0.65, `+${heal} HP & 2x`, 'heal', guardian.activeName);
    } else if (guardian.activeEffectKey === 'full_ultimate') {
      ultRef.current = 100;
      setUltCharge(100);
      s.floats.spawn(s.width * 0.5, s.height * 0.65, '必殺 100%', 'perfect', guardian.activeName);
    } else if (guardian.activeEffectKey === 'freeze_timer') {
      freezeRef.current = 8;
      setFreezeSecs(8);
      s.floats.spawn(s.width * 0.5, s.height * 0.5, '訂單暫停 8s', 'perfect', guardian.activeName);
    } else {
      if(grade<=2){orderTimeRef.current+=8;setOrderTimer(orderTimeRef.current);return;}
      // Auto-complete current ingredient step!
      const correctIds = currentDish.payload.ingredients.filter((i) => i.isCorrect).map((i) => i.id);
      setPickedIds(correctIds);
      if (step === 'ingredients') setStep('temperature');
      s.floats.spawn(s.width * 0.5, s.height * 0.65, '森羅自動備料！', 'heal', guardian.activeName);
    }
  };

  // Main 60FPS Kitchen Stage Canvas Loop
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
      simRef.current.width = rect.width;
      simRef.current.height = rect.height;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setPaused((p) => !p);
      } else if (e.code === 'Space' && stepRef.current === 'temperature') {
        e.preventDefault();
        handleLockTemperature();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    let rafId = 0;
    let yieldTimer = 0;
    let alive = true;
    let lastTs = performance.now();
    let timerAccum = 0;

    const loop = (now: number) => {
      if (!alive) return;
      const frameStart = performance.now();
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const s = simRef.current;

      const { simDt, shakeX, shakeY } = updateGameFeel(s.feel, pausedRef.current ? 0 : rawDt);
      const dt = pausedRef.current ? 0 : simDt;
      s.time += dt;

      if (dt > 0) {
        if (freezeRef.current > 0) freezeRef.current = Math.max(0, freezeRef.current - dt);
        if (s.chefPulse > 0) s.chefPulse = Math.max(0, s.chefPulse - dt * 4);
        if (s.bossHitFlash > 0) s.bossHitFlash = Math.max(0, s.bossHitFlash - dt * 4);
        if (s.bossMoodTimer > 0) {
          s.bossMoodTimer -= dt;
          if (s.bossMoodTimer <= 0) s.bossMood = 'hungry';
        }
        if (s.bossFireBreath > 0) {
          s.bossFireBreath = Math.max(0, s.bossFireBreath - dt * 1.45);
        }
        if (s.dishExplosion) {
          s.dishExplosion.progress += dt * 1.65;
          if (s.dishExplosion.progress >= 1) s.dishExplosion = null;
        }

        // Flying served dish arc from cauldron to Boss!
        if (s.flyingDish) {
          s.flyingDish.progress += dt * 2.8;
          if (s.flyingDish.progress >= 1) s.flyingDish = null;
        }

        // Oscillating rhythm temperature needle (DOM ref mutated directly at 60Hz!)
        if (stepRef.current === 'temperature') {
          const spd = playMode === 'practice' ? 56 : 92;
          needleRef.current += needleDirRef.current * spd * dt;
          if (needleRef.current >= 98) {
            needleRef.current = 98;
            needleDirRef.current = -1;
          } else if (needleRef.current <= 2) {
            needleRef.current = 2;
            needleDirRef.current = 1;
          }
          if (needleBarRef.current) {
            needleBarRef.current.style.left = `${needleRef.current}%`;
          }
        }

        // Order patience timer (Adventure mode only) -> Dragon Lord Fire-Breath Attack!
        if (playMode === 'adventure' && freezeRef.current <= 0) {
          orderTimeRef.current -= dt;
          if (orderTimeRef.current <= 0) {
            orderTimeRef.current = 32;
            const dmg = 24;
            kitchenHpRef.current = Math.max(0, kitchenHpRef.current - dmg);
            setKitchenHp(kitchenHpRef.current);
            s.bossFireBreath = 1.0;
            soundEngine.playWrongBuzz();
            triggerGameFeel(s.feel, { shake: 0.55, flash: 0.22, flashColor: '#EF4444' });
            s.particles.burst(s.width * 0.5, s.height * 0.68, 28, ['#EF4444', '#F97316', '#FDE047'], 80, 260, 7, 'spark');
            s.floats.spawn(s.width * 0.5, s.height * 0.45, `饕餮吐息 -${dmg}`, 'crit', '訂單超時！');
            if (kitchenHpRef.current <= 0) concludeRun(false);
          }
        }

        // Ambient steam bubbles from cauldron
        if (Math.random() < 0.25) {
          s.particles.spawn(
            s.width * 0.5 + (Math.random() - 0.5) * 60,
            s.height * 0.76,
            (Math.random() - 0.5) * 20,
            -45 - Math.random() * 45,
            s.potColor,
            4 + Math.random() * 4,
            0.75,
            -20,
            'circle'
          );
        }
      }

      s.particles.update(dt);
      s.floats.update(dt);

      timerAccum += rawDt;
      if (timerAccum > 0.25) {
        timerAccum = 0;
        setOrderTimer(Math.ceil(orderTimeRef.current));
        setFreezeSecs(Math.ceil(freezeRef.current));
      }

      // ==================== RENDER FANTASY ELEMENT KITCHEN ====================
      ctx.save();
      ctx.translate(shakeX, shakeY);
      const W = s.width;
      const H = s.height;

      // Warm sunny kitchen wall backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#FFF7ED');
      bg.addColorStop(0.58, '#FFEDD5');
      bg.addColorStop(0.58, '#FDBA74');
      bg.addColorStop(1, '#FB923C');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Kitchen checkered tiles strip
      const tileW = 48;
      for (let x = 0; x < W; x += tileW) {
        ctx.fillStyle = (x / tileW) % 2 === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(251,146,60,0.25)';
        ctx.fillRect(x, H * 0.52, tileW, 24);
      }

      // Short phone stages use a horizontal composition with uniform actor scales.
      const compact=H<260;
      const bossScale=compact?Math.min(.65,(H-12)/190,W/440):kitchenSceneScale(W,H);
      const bossX=W*(compact?.73:.5),bossY=H*(compact?.53:.36);
      ctx.fillStyle='#92400E';ctx.strokeStyle='#451A03';ctx.lineWidth=2;
      drawRoundedRect(ctx,W*(compact?.53:.16),H*(compact?.82:.44),W*(compact?.40:.68),compact?10:28,6);ctx.fill();ctx.stroke();
      ctx.save();ctx.translate(bossX,bossY);ctx.scale(bossScale,bossScale);
      drawDarkGluttonBoss(ctx,0,0,s.time,bossHpRef.current/bossMaxHp,s.bossHitFlash,s.bossMood);ctx.restore();
      const potX=W*(compact?.37:.5),potY=H*.77;
      const propScale=compact?Math.min(.65,(H-12)/150):Math.min(1,W/440,H/430);
      ctx.save();ctx.translate(potX,potY);ctx.scale(propScale,propScale);
      ctx.fillStyle='#1E293B';ctx.strokeStyle='#0F172A';ctx.lineWidth=3.5;
      ctx.beginPath();ctx.ellipse(0,0,64,34,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=s.potColor;ctx.beginPath();ctx.ellipse(0,-12,54,16,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.arc(-18,-13+Math.sin(s.time*6)*2,6,0,Math.PI*2);ctx.arc(14,-10+Math.cos(s.time*5)*2,4.5,0,Math.PI*2);ctx.fill();
      drawHeroClassAura(ctx,-108,-8,s.time,playerStats.heroClassBranch,playerStats.heroTier);
      drawChefCharacter(ctx,chefRef.current,-108,-8,s.time,s.chefPulse,null,appearanceRef.current);
      if(playerCount>=2)drawChefCharacter(ctx,'penguin',106,-8,s.time+.7,s.chefPulse*.7,null,appearanceRef.current);
      if(playerCount>=3)drawChefCharacter(ctx,'mantis',-165,2,s.time+1.4,s.chefPulse*.6,null,appearanceRef.current);
      if(playerCount>=4)drawChefCharacter(ctx,'fox',165,2,s.time+2.1,s.chefPulse*.6);
      ctx.restore();

      // Dragon Lord Charge-Up Warning Aura (< 8s left in adventure)
      if (playMode === 'adventure' && orderTimeRef.current <= 8 && freezeRef.current <= 0) {
        const warnPulse = 0.5 + 0.5 * Math.sin(s.time * 16);
        ctx.save();
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + warnPulse * 0.5})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(bossX,bossY,(62 + warnPulse * 10)*bossScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Abyssal Chaos Dragon Lord Fire-Breath Attack VFX
      if (s.bossFireBreath > 0.02) {
        ctx.save();
        const alpha = Math.min(1, s.bossFireBreath * 1.4);
        const mawX = bossX;
        const mawY = bossY+15*bossScale;
        const flameGrad = ctx.createLinearGradient(mawX, mawY, potX, potY + 18);
        flameGrad.addColorStop(0, `rgba(254, 240, 138, ${alpha})`);
        flameGrad.addColorStop(0.45, `rgba(249, 115, 22, ${alpha * 0.9})`);
        flameGrad.addColorStop(1, `rgba(220, 38, 38, ${alpha * 0.1})`);
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(mawX - 16, mawY);
        ctx.lineTo(mawX + 16, mawY);
        ctx.lineTo(potX + 86, potY + 18);
        ctx.lineTo(potX - 86, potY + 18);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Elemental Dish Explosion VFX on Dragon Lord (Fire Tornado / Absolute Zero / Prism Wave)
      if (s.dishExplosion) {
        const p = s.dishExplosion.progress;
        const ex = bossX;
        const ey = bossY;
        const fade = Math.max(0, 1 - p);
        ctx.save();
        ctx.globalAlpha = fade;
        if (s.dishExplosion.style === 'fire') {
          for (let ring = 0; ring < 4; ring++) {
            const ry = ey + 35 - ring * 24 - p * 26;
            const rw = 36 + ring * 18 + p * 38;
            ctx.strokeStyle = ring % 2 === 0 ? '#F97316' : '#FDE047';
            ctx.lineWidth = 6 * fade;
            ctx.beginPath();
            ctx.ellipse(ex, ry, rw, 14, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (s.dishExplosion.style === 'ice') {
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 4;
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4 + p * 0.6;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(ex + Math.cos(a) * (40 + p * 95), ey + Math.sin(a) * (40 + p * 95));
            ctx.stroke();
          }
        } else {
          const cols = ['#F43F5E', '#A855F7', '#14B8A6'];
          cols.forEach((col, i) => {
            ctx.strokeStyle = col;
            ctx.lineWidth = 5 * fade;
            ctx.beginPath();
            ctx.arc(ex, ey, 28 + p * 95 + i * 16, 0, Math.PI * 2);
            ctx.stroke();
          });
        }
        ctx.restore();
      }

      // Flying Served Element Dish Projectile!
      if (s.flyingDish) {
        const t = s.flyingDish.progress;
        const fx = potX+(bossX-potX)*t;
        const fy = potY - 24 - (potY - H * 0.36) * t - Math.sin(t * Math.PI) * 55;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(t * 9);
        ctx.fillStyle = '#FEF08A';
        ctx.strokeStyle = '#EA580C';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#EA580C';
        ctx.font = '900 18px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 1);
        ctx.restore();
      }

      s.particles.render(ctx);
      s.floats.render(ctx);

      if (s.feel.flashAlpha > 0.01) {
        ctx.fillStyle = s.feel.flashColor;
        ctx.globalAlpha = s.feel.flashAlpha;
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
  }, [concludeRun, handleLockTemperature, playMode]);

  const [tMin, tMax] = getTempBounds(currentDish.payload.targetTempZone);

  // Trigger Boss Phase 2 Enrage + Roguelike Awakening at <= 50% Boss HP
  const bossPhase2 = bossHp <= bossMaxHp * 0.5 && bossHp > 0;
  useEffect(() => {
    if (bossPhase2 && !relicTriggeredRef.current) {
      relicTriggeredRef.current = true;
      setRelicChoices(rollRoguelikeChoices(5));
      setRelicModalOpen(true);
    }
  }, [bossPhase2]);

  // Switch Gamepad A/B/X/Y/ZR support across the 4 Cooking Stations
  useEffect(() => {
    if (paused || relicModalOpen) return;
    const id = window.setInterval(() => {
      const snap = gamepadManager.poll();
      for (const p of snap.players) {
        if (!p.connected) continue;
        if (step === 'ingredients') {
          const ings = currentDish.payload.ingredients;
          if (p.justPressed.confirm && ings[0]) handlePickIngredient(ings[0]);
          if (p.justPressed.cancel && ings[1]) handlePickIngredient(ings[1]);
          if (p.justPressed.skill1 && ings[2]) handlePickIngredient(ings[2]);
          if (p.justPressed.skill2 && ings[3]) handlePickIngredient(ings[3]);
        } else if (step === 'temperature') {
          if (p.justPressed.confirm) handleLockTemperature();
        } else if (step === 'ph') {
          if (p.justPressed.confirm) handleDropReagent('acid');
          if (p.justPressed.cancel) handleDropReagent('neutral');
          if (p.justPressed.skill1) handleDropReagent('alkali');
        } else if (step === 'serve') {
          if (p.justPressed.confirm) handleRingServeBell();
        }
        break;
      }
    }, 85);
    return () => clearInterval(id);
  }, [currentDish.payload.ingredients, handleDropReagent, handleLockTemperature, handlePickIngredient, handleRingServeBell, paused, relicModalOpen, step]);

  const classMultPreview = computeClassDamageBonus(playerStats.heroClassId, combo, combo >= 3);

  return (
    <div
      className="game-screen game-screen-science w-screen h-[100dvh] flex flex-col overflow-hidden bg-orange-950 text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      data-testid="science-cooking-engine"
    >
      {/* Tier 1: Single-Row Compact Kitchen HUD (h-12 shrink-0, zero overlap!) */}
      <header className="game-hud h-12 shrink-0 px-2.5 bg-slate-950/95 border-b border-orange-500/45 flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-black text-orange-300 truncate max-w-[115px] sm:max-w-none">
            {stageConfig
              ? `🧪 ${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
              : `🧪 元素料理(${grade}年)`}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-12 sm:w-20 h-2 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-transform origin-left"
                style={{ transform: `scaleX(${Math.max(0, kitchenHp / playerStats.maxHp)})` }}
              />
            </div>
            <span className="text-[11px] font-black text-white font-mono-num">{kitchenHp}</span>
          </div>
          <span className="text-[11px] font-black text-rose-300 font-mono-num">
            龍{bossHp}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {playMode === 'adventure' && (
            <span
              className={`rounded-lg text-white font-black text-[11px] px-2 py-0.5 font-mono-num ${
                orderTimer <= 8 && freezeSecs <= 0 ? 'bg-rose-600 animate-pulse' : 'bg-orange-600'
              }`}
            >
              {freezeSecs > 0 ? `❄️${freezeSecs}s` : `⏳${orderTimer}s`}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setChef((c) =>
                c === 'redpanda' ? 'penguin' : c === 'penguin' ? 'mantis' : c === 'mantis' ? 'fox' : 'redpanda'
              );
            }}
            className="h-8 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-orange-300/60 text-orange-200 font-bold text-[11px]"
            title={`職業傷害倍率 ×${classMultPreview.toFixed(2)}`}
          >
            {chef === 'redpanda' ? '🔥熊貓' : chef === 'penguin' ? '❄️企鵝' : chef === 'mantis' ? '⚡螳螂' : '🦊火狐'}
          </button>
          <button
            type="button"
            disabled={guardianUsed}
            onClick={handleGuardianSkill}
            className={`h-8 px-2 rounded-xl font-black text-[11px] border flex items-center gap-1 ${
              guardianUsed
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-400 hover:bg-emerald-300 border-emerald-100 text-slate-950'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{guardian.activeName}</span>
          </button>
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

      {/* Main Split: Portrait Top Canvas / Bottom Workbench | Landscape 54% Left Canvas / 46% Right Workbench */}
      <div className="game-layout flex-1 min-h-0 flex flex-col landscape:flex-row overflow-hidden" inert={Boolean(banner)}>
        {/* Tier 2: Pure Unobstructed Dragon Lord & Cauldron Canvas */}
        <div className="game-stage relative h-[30dvh] shrink-0 landscape:h-full landscape:w-[45%] border-b landscape:border-b-0 landscape:border-r border-orange-500/35 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            data-testid="science-cooking-canvas"
          />
          {bossPhase2 && (
            <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-rose-950/90 border border-orange-400 text-[11px] font-black text-orange-200 whitespace-nowrap">
              🔥 饕餮龍王・二階狂暴加速！
            </div>
          )}
        </div>

        <div className="game-controls flex-1 min-h-0 landscape:w-[55%] flex flex-col overflow-hidden">
          <ScienceWorkbench dish={currentDish} nextDish={nextDish} step={step} pickedIds={pickedIds} tempResult={tempResult} selectedPh={selectedPh} needleRef={needleBarRef} tMin={tMin} tMax={tMax} ultCharge={ultCharge} paused={paused||Boolean(banner)||relicModalOpen} serving={servingRef.current} onPick={handlePickIngredient} onLock={handleLockTemperature} onPh={handleDropReagent} onServe={handleRingServeBell} onUltimate={triggerElementFeastUltimate}/>
        </div>
      </div>

      {bossWarning && stageConfig?.tier === 'boss' && (
        <div className="fixed inset-x-0 top-14 z-30 pointer-events-none flex justify-center px-4">
          <div className="rounded-full bg-rose-950/95 border border-orange-400 px-4 py-1.5 text-center shadow-lg">
            <span className="text-xs font-black text-orange-200">
              ⚠️ 饕餮魔王現身：{stageConfig.enemyName}
            </span>
          </div>
        </div>
      )}

      <RoguelikeCardModal
        open={relicModalOpen}
        title="🌟 廚房極限覺醒・選擇戰術遺物"
        choices={relicChoices}
        onPick={(relic) => {
          setRelicModalOpen(false);
          if (relic.id === 'golden_aegis' || relic.id === 'wisdom_drain') {
            kitchenHpRef.current = Math.min(playerStats.maxHp, kitchenHpRef.current + Math.round(playerStats.maxHp * 0.35));
            setKitchenHp(kitchenHpRef.current);
          } else if (relic.id === 'chain_lightning') {
            ultRef.current = 100;
            setUltCharge(100);
          } else if (relic.id === 'absolute_zero') {
            orderTimeRef.current += 10;
            setOrderTimer(Math.ceil(orderTimeRef.current));
          } else {
            doubleNextRef.current = true;
          }
        }}
      />

      <ExplanationBanner message={banner} onDismiss={() => setBanner(null)} />
      <UltimateCutIn
        visible={cutIn}
        title="五星元素料理・火冰雙龍捲！"
        subtitle="以完美科學原理重創黑暗饕餮！"
        symbol="炎"
        accentBg="bg-gradient-to-r from-orange-600 via-rose-600 to-teal-600"
      />
      <WorldPauseModal
        open={paused}
        worldName={
          stageConfig
            ? `元素料理大亂鬥・第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
            : '自然科學・元素料理大亂鬥'
        }
        onResume={() => setPaused(false)}
        onRestart={onExit}
        onExit={onExit}
      />
    </div>
  );
};
