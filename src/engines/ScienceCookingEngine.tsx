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
  getUltimateChargeGain,
} from '../core/combatMath';
import { soundEngine } from '../audio/soundEngine';
import {
  createGameFeel,
  drawChefCharacter,
  drawDarkGluttonBoss,
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

type CookingStep = 'ingredients' | 'temperature' | 'ph' | 'serve';

export const ScienceCookingEngine: React.FC<EngineCommonProps> = ({
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
  const dishMgrRef = useRef(
    new QuestionManager<ScienceQuestion>(getScienceQuestions(grade, semester), {
      masteredQuestionIds,
      wrongQuestionIds,
      focusTags: stageConfig?.focusTags,
    })
  );

  const [paused, setPaused] = useState(false);
  const [chef, setChef] = useState<'redpanda' | 'penguin' | 'mantis'>('redpanda');
  const bossMaxHp = Math.round(380 * (stageConfig?.enemyHpScale ?? 1));
  const [bossHp, setBossHp] = useState(bossMaxHp);
  const [kitchenHp, setKitchenHp] = useState(playerStats.maxHp);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [ultCharge, setUltCharge] = useState(25);
  const [guardianUsed, setGuardianUsed] = useState(false);
  const [freezeSecs, setFreezeSecs] = useState(0);
  const [orderTimer, setOrderTimer] = useState(32);
  const [cutIn, setCutIn] = useState(false);
  const [bossWarning, setBossWarning] = useState(stageConfig?.tier === 'boss');
  useEffect(() => {
    if (!bossWarning) return;
    const t = window.setTimeout(() => setBossWarning(false), 2600);
    return () => clearTimeout(t);
  }, [bossWarning]);

  // 4-Step Cooking Workbench State (Zero-Repeat)
  const [currentDish, setCurrentDish] = useState<ScienceQuestion>(() => dishMgrRef.current.next());
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
  const chefRef = useRef<'redpanda' | 'penguin' | 'mantis'>('redpanda');
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
  const orderTimeRef = useRef(32);

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
    pausedRef.current = paused;
    document.body.dataset.state = paused ? 'paused' : 'playing';
  }, [paused]);

  useEffect(() => {
    chefRef.current = chef;
  }, [chef]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const loadNextDish = useCallback(() => {
    const next = dishMgrRef.current.next();
    setCurrentDish(next);
    setStep('ingredients');
    setPickedIds([]);
    setTempResult(null);
    setSelectedPh(null);
    orderTimeRef.current = guardianId === 'griffin' ? 36 : 32;
    setOrderTimer(orderTimeRef.current);
    simRef.current.potColor = '#7C3AED';
    soundEngine.speakText(`新訂單，${next.payload.dishName}。${next.payload.orderRequirement}`, 'zh-TW');
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
        setStep('temperature');
      }
    } else {
      // Wrong ingredient: puff black smoke + friendly science fact!
      attemptsRef.current += 1;
      onAnswerResult(currentDish, false);
      comboRef.current = 0;
      setCombo(0);
      soundEngine.playWrongBuzz();
      triggerGameFeel(s.feel, { shake: 0.3 });
      s.particles.burst(potX, potY, 18, ['#334155', '#1E293B', '#64748B'], 40, 140, 8, 'circle', -40);
      s.floats.spawn(potX, potY - 26, '冒黑煙！', 'miss');
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
    if (step !== 'serve') return;
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
      s.particles.burst(bx, by, 34, fxColors, 100, 340, 8, 'spark');
      s.particles.spawn(bx, by, 0, 0, fxColors[0], 18, 0.4, 0, 'ring');
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

        // Order patience timer (Adventure mode only)
        if (playMode === 'adventure' && freezeRef.current <= 0) {
          orderTimeRef.current -= dt;
          if (orderTimeRef.current <= 0) {
            orderTimeRef.current = 32;
            const dmg = 22;
            kitchenHpRef.current = Math.max(0, kitchenHpRef.current - dmg);
            setKitchenHp(kitchenHpRef.current);
            soundEngine.playWrongBuzz();
            triggerGameFeel(s.feel, { shake: 0.45 });
            s.floats.spawn(s.width * 0.5, s.height * 0.45, `訂單超時 -${dmg}`, 'crit');
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

      // Banquet Dining Counter for Dark Glutton Boss
      ctx.fillStyle = '#92400E';
      ctx.strokeStyle = '#451A03';
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, W * 0.16, H * 0.44, W * 0.68, 28, 10);
      ctx.fill();
      ctx.stroke();

      // Dark Glutton Boss behind banquet table
      drawDarkGluttonBoss(
        ctx,
        W * 0.5,
        H * 0.36,
        s.time,
        bossHpRef.current / bossMaxHp,
        s.bossHitFlash,
        s.bossMood
      );

      // Glowing Magic Element Cauldron in foreground center
      const potX = W * 0.5;
      const potY = H * 0.77;
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(potX, potY, 64, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Broth surface (reacts to Acid/Neutral/Alkali color!)
      ctx.fillStyle = s.potColor;
      ctx.beginPath();
      ctx.ellipse(potX, potY - 12, 54, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight bubbles
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(potX - 18, potY - 13 + Math.sin(s.time * 6) * 2, 6, 0, Math.PI * 2);
      ctx.arc(potX + 14, potY - 10 + Math.cos(s.time * 5) * 2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Active Q-Version Chef beside Cauldron
      drawChefCharacter(ctx, chefRef.current, potX - 108, potY - 8, s.time, s.chefPulse);

      // Flying Served Element Dish Projectile!
      if (s.flyingDish) {
        const t = s.flyingDish.progress;
        const fx = potX;
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

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden bg-orange-950"
      data-testid="science-cooking-engine"
    >
      {/* Top 42% Canvas: Dark Glutton Boss + Magic Cauldron + Chef (100% Unobstructed!) */}
      <div className="relative h-[42%] w-full shrink-0">
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          data-testid="science-cooking-canvas"
        />

        {/* Top Left Kitchen Status */}
        <div className="absolute top-3 left-3 z-20 rounded-2xl bg-slate-900/92 border-2 border-orange-400 px-3.5 py-2 shadow-xl flex items-center gap-3.5">
          <div>
            <div className="text-[11px] font-bold text-orange-300">
              {stageConfig
                ? `元素料理大亂鬥・第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關「${stageConfig.title}」`
                : `自然科學・元素料理大亂鬥（${grade}年級）`}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-black text-emerald-300">廚房耐力</span>
              <div className="w-24 h-3 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-transform origin-left"
                  style={{ transform: `scaleX(${Math.max(0, kitchenHp / playerStats.maxHp)})` }}
                />
              </div>
              <span className="text-xs font-black text-white font-mono-num">{kitchenHp}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400">饕餮血量</div>
            <div className="text-base font-black text-rose-400 font-mono-num">
              {bossHp}/{bossMaxHp}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400">連擊</div>
            <div className="text-base font-black text-amber-300 font-mono-num">{combo}x</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400">積分</div>
            <div className="text-base font-black text-white font-mono-num">{score}</div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {playMode === 'adventure' && (
            <div className="rounded-xl bg-rose-600 text-white font-black text-xs px-3 py-2 font-mono-num shadow-lg">
              {freezeSecs > 0 ? `暫停 ${freezeSecs}s` : `訂單倒數 ${orderTimer}s`}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setChef((c) => (c === 'redpanda' ? 'penguin' : c === 'penguin' ? 'mantis' : 'redpanda'));
            }}
            className="min-h-[42px] px-3 rounded-xl bg-slate-900/92 hover:bg-slate-800 border-2 border-orange-300 text-orange-200 font-bold text-xs"
          >
            主廚：{chef === 'redpanda' ? '小熊貓' : chef === 'penguin' ? '企鵝' : '螳螂'}
          </button>
          <button
            type="button"
            disabled={guardianUsed}
            onClick={handleGuardianSkill}
            className={`min-h-[42px] px-3 rounded-xl font-black text-xs border-2 flex items-center gap-1 ${
              guardianUsed
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-400 hover:bg-emerald-300 border-emerald-100 text-slate-950'
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

      {/* Dedicated Non-Overlapping Order Ticket Strip between Stage and Workbench */}
      <div className="shrink-0 bg-amber-50 border-y-2 border-amber-500 px-4 py-2 shadow-md flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black text-orange-700 flex items-center gap-2">
            <span>黑暗饕餮訂單：【{currentDish.payload.dishName}】</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-700">知識點：{currentDish.knowledgeTag}</span>
          </div>
          <div className="text-sm font-black text-slate-900 truncate">
            {currentDish.payload.orderRequirement}
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            soundEngine.speakText(
              `${currentDish.payload.dishName}，${currentDish.payload.orderRequirement}`,
              'zh-TW'
            )
          }
          aria-label="朗讀料理訂單"
          className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center shrink-0"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Interactive 4-Station Tactile Kitchen Workbench */}
      <div className="flex-1 bg-slate-900 border-t-2 border-orange-400 p-3 sm:p-4 flex flex-col justify-between gap-3 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-stretch">
          {/* Station 1: Cold Storage Ingredient Picker (5 cols) */}
          <div
            className={`lg:col-span-5 rounded-2xl p-3 border-2 flex flex-col justify-between ${
              step === 'ingredients'
                ? 'bg-slate-800/95 border-amber-400 shadow-lg'
                : 'bg-slate-950/70 border-slate-700 opacity-85'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-black text-amber-300">
                1. 食材冷藏櫃（選取 {pickedIds.length}/{currentDish.payload.neededCount} 項正確食材）
              </div>
              {step !== 'ingredients' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {currentDish.payload.ingredients.map((ing) => {
                const picked = pickedIds.includes(ing.id);
                return (
                  <button
                    key={ing.id}
                    type="button"
                    disabled={step !== 'ingredients' || picked}
                    onClick={() => handlePickIngredient(ing)}
                    className={`min-h-[62px] rounded-xl p-2.5 border-2 text-left transition-transform active:scale-95 flex items-center gap-2.5 ${
                      picked
                        ? 'bg-emerald-900/60 border-emerald-400 text-emerald-100'
                        : 'bg-slate-900 hover:bg-slate-700 border-slate-600 text-white'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-lg shrink-0 border-2 border-slate-950"
                      style={{ backgroundColor: ing.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-black truncate">{ing.name}</div>
                      <div className={`text-[11px] truncate ${picked ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                        {picked ? `✓ ${ing.categoryTag}` : '點擊投入檢驗'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Station 2: Magic Temperature Stove Rhythm Bar (4 cols) */}
          <div
            className={`lg:col-span-4 rounded-2xl p-3 border-2 flex flex-col justify-between ${
              step === 'temperature'
                ? 'bg-slate-800/95 border-orange-400 shadow-lg'
                : 'bg-slate-950/70 border-slate-700 opacity-85'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-orange-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> 2. 控溫魔法爐
              </div>
              {tempResult && <span className="text-xs font-black text-amber-300">{tempResult} ★</span>}
            </div>
            <div className="text-xs text-slate-200 font-bold mt-1">
              目標火候：{currentDish.payload.targetTempLabel}
            </div>

            {/* Dynamic Thermal Rhythm Gauge */}
            <div className="my-3">
              <div className="relative h-9 rounded-xl overflow-hidden border-2 border-slate-600 bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500">
                {/* Target Highlight Zone */}
                <div
                  className="absolute inset-y-0 border-x-2 border-white bg-white/30"
                  style={{ left: `${tMin}%`, width: `${tMax - tMin}%` }}
                />
                {/* Moving Needle mutated via ref */}
                <div
                  ref={needleBarRef}
                  className="absolute top-0 bottom-0 w-2.5 -ml-1 bg-slate-950 border-x border-white shadow-lg"
                  style={{ left: '50%' }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
                <span>0°C 急凍藍區</span>
                <span>55°C 中火區</span>
                <span>100°C 沸騰紅區</span>
              </div>
            </div>

            <button
              type="button"
              disabled={step !== 'temperature'}
              onClick={handleLockTemperature}
              className={`w-full min-h-[48px] rounded-xl font-black text-sm transition-transform active:scale-95 ${
                step === 'temperature'
                  ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              鎖定火候翻炒！（或按空白鍵）
            </button>
          </div>

          {/* Station 3 & 4: Acid/Alkali Test Tubes + Serving Attack Bell (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-2.5 justify-between">
            <div
              className={`rounded-2xl p-3 border-2 ${
                step === 'ph'
                  ? 'bg-slate-800/95 border-teal-400 shadow-lg'
                  : 'bg-slate-950/70 border-slate-700 opacity-85'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-black text-teal-300 flex items-center gap-1">
                  <FlaskConical className="w-4 h-4" /> 3. 酸鹼試管架
                </div>
                {selectedPh && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="text-[11px] text-slate-300 mb-2">
                需求：{currentDish.payload.targetPhLabel}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={step !== 'ph'}
                  onClick={() => handleDropReagent('acid')}
                  className="min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-45 text-white font-black text-xs"
                >
                  酸性
                  <div className="text-[10px] font-normal">檸檬紅</div>
                </button>
                <button
                  type="button"
                  disabled={step !== 'ph'}
                  onClick={() => handleDropReagent('neutral')}
                  className="min-h-[44px] rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-45 text-white font-black text-xs"
                >
                  中性
                  <div className="text-[10px] font-normal">純水紫</div>
                </button>
                <button
                  type="button"
                  disabled={step !== 'ph'}
                  onClick={() => handleDropReagent('alkali')}
                  className="min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-45 text-white font-black text-xs"
                >
                  鹼性
                  <div className="text-[10px] font-normal">蘇打藍</div>
                </button>
              </div>
            </div>

            {/* Station 4: Serve Attack Bell + Ultimate */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={step !== 'serve'}
                onClick={handleRingServeBell}
                className={`min-h-[54px] rounded-2xl font-black text-sm border-2 flex items-center justify-center gap-1.5 transition-transform active:scale-95 ${
                  step === 'serve'
                    ? 'bg-amber-400 hover:bg-amber-300 border-white text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.75)]'
                    : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Bell className="w-5 h-5" /> 搖鈴出餐！
              </button>
              <button
                type="button"
                disabled={ultCharge < 100}
                onClick={triggerElementFeastUltimate}
                className={`min-h-[54px] rounded-2xl font-black text-xs border-2 flex items-center justify-center gap-1 transition-transform active:scale-95 ${
                  ultCharge >= 100
                    ? 'bg-rose-500 hover:bg-rose-400 border-amber-200 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" /> 元素大滿貫 ({ultCharge}%)
              </button>
            </div>
          </div>
        </div>
      </div>

      {bossWarning && stageConfig?.tier === 'boss' && (
        <div className="fixed inset-x-0 top-24 z-30 pointer-events-none flex justify-center px-4">
          <div className="rounded-2xl bg-rose-950/95 border-2 border-orange-400 px-6 py-3 text-center shadow-[0_0_32px_rgba(251,146,60,0.55)]">
            <div className="text-xs font-black tracking-widest text-orange-300">
              WARNING · 第 10 關章節大魔王饕餮現身！
            </div>
            <div className="text-xl font-black text-white mt-0.5">{stageConfig.enemyName}</div>
            {stageConfig.bossPhase2Name && (
              <div className="text-xs text-rose-200 mt-0.5">
                二階變身型態：{stageConfig.bossPhase2Name}（五星控溫破防！）
              </div>
            )}
          </div>
        </div>
      )}

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
