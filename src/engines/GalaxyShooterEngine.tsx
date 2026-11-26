import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, Pause, Sparkles, Rocket, Crosshair } from 'lucide-react';
import {
  EnglishDronePayload,
  EnglishQuestion,
  EnglishSpellPayload,
  EngineCommonProps,
  WorldRunResult,
} from '../types/game';
import { getEnglishQuestions, shuffleArray } from '../data/questionBank';
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
  drawMechaShip,
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

interface PlayerLaser {
  x: number;
  y: number;
  vy: number;
  power: number;
  color: string;
}

interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface EnergyCore {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface AnswerDrone {
  id: string;
  label: string;
  isCorrect: boolean;
  x: number;
  y: number;
  targetY: number;
  vx: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  shieldFlash: number;
  fireCd: number;
  wobble: number;
}

interface LetterOrb {
  id: string;
  letter: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  collected: boolean;
  flash: number;
}

export const GalaxyShooterEngine: React.FC<EngineCommonProps> = ({
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

  const droneMgrRef = useRef(
    new QuestionManager<EnglishQuestion>(
      [
        ...getEnglishQuestions(grade, semester, 'listen'),
        ...getEnglishQuestions(grade, semester, 'fill'),
      ],
      {
        masteredQuestionIds,
        wrongQuestionIds,
        focusTags: stageConfig?.focusTags,
      }
    )
  );
  const spellMgrRef = useRef(
    new QuestionManager<EnglishQuestion>(getEnglishQuestions(grade, semester, 'spell'), {
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
  const [shipVariant, setShipVariant] = useState<'blaster' | 'falcon'>('blaster');
  const [hp, setHp] = useState(playerStats.maxHp);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [ultCharge, setUltCharge] = useState(30);
  const [guardianUsed, setGuardianUsed] = useState(false);
  const [freezeSecs, setFreezeSecs] = useState(0);
  const [cutIn, setCutIn] = useState(false);
  const [banner, setBanner] = useState<{
    title: string;
    answer: string;
    explanation: string;
    tag: string;
  } | null>(null);
  const [radarInfo, setRadarInfo] = useState<{
    prompt: string;
    speakText: string;
    zhHint: string;
    isBoss: boolean;
    spellProgress?: string;
    spellTarget?: string;
  }>({
    prompt: '準備進入星際戰線...',
    speakText: '',
    zhHint: '',
    isBoss: false,
  });

  const pausedRef = useRef(false);
  const shipVariantRef = useRef<'blaster' | 'falcon'>('blaster');
  const hpRef = useRef(playerStats.maxHp);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const tagsRef = useRef<Set<string>>(new Set());
  const startClockRef = useRef(Date.now());
  const finishedRef = useRef(false);
  const ultRef = useRef(30);
  const freezeRef = useRef(0);
  const shieldTimerRef = useRef(0);
  const doubleNextRef = useRef(false);
  const touchDragRef = useRef<{ active: boolean; pointerId: number | null; lastX: number; lastY: number }>({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  });

  const TOTAL_DRONE_WAVES = stageConfig ? Math.max(3, stageConfig.waveCount - 1) : 4;

  const simRef = useRef({
    time: 0,
    width: 1200,
    height: 700,
    shipX: 600,
    shipY: 560,
    targetX: 600,
    targetY: 560,
    pointerActive: false,
    tilt: 0,
    shipHitFlash: 0,
    fireTimer: 0,
    novaBeamTimer: 0,
    keys: new Set<string>(),
    stars: Array.from({ length: 120 }, () => ({
      x: Math.random() * 1400,
      y: Math.random() * 900,
      speed: 40 + Math.random() * 190,
      size: 1 + Math.random() * 2.2,
      color: Math.random() > 0.7 ? '#67E8F9' : Math.random() > 0.5 ? '#F472B6' : '#E2E8F0',
    })),
    lasers: [] as PlayerLaser[],
    enemyBullets: [] as EnemyBullet[],
    cores: [] as EnergyCore[],
    drones: [] as AnswerDrone[],
    waveIndex: 0,
    waveStartTime: Date.now(),
    currentQuestion: null as EnglishQuestion | null,
    // Boss Mothership Spelling State
    bossMode: false,
    bossHp: 100,
    bossMaxHp: 100,
    bossX: 600,
    bossHitFlash: 0,
    bossFireCd: 1.5,
    spellQuestion: null as EnglishQuestion | null,
    spellIndex: 0,
    letterOrbs: [] as LetterOrb[],
    orbitalCannonTimer: 0,
    particles: new ParticlePool(360),
    floats: new FloatingTextPool(48),
    feel: createGameFeel(),
  });

  useEffect(() => {
    pausedRef.current = paused;
    document.body.dataset.state = paused ? 'paused' : 'playing';
  }, [paused]);

  useEffect(() => {
    shipVariantRef.current = shipVariant;
  }, [shipVariant]);

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
        hpRef.current / playerStats.maxHp
      );
      const result: WorldRunResult = {
        subject: 'english',
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
          ? `擊毀${stageConfig?.enemyName ?? '星際母艦'}！完成 ${TOTAL_DRONE_WAVES} 波單字戰線與拼字決戰！`
          : `止步於第 ${simRef.current.waveIndex + 1} 波星際防線，再調整走位挑戰！`,
        stageKey: stageConfig?.stageKey,
        stageLabel: stageConfig ? `第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關「${stageConfig.title}」` : undefined,
        chestRewardText: victory && stars === 3 ? stageConfig?.starChestReward?.label : undefined,
      };
      onFinish(result);
    },
    [onFinish, playerStats.maxHp, stageConfig]
  );

  const spawnBossSpellingRound = useCallback(() => {
    const s = simRef.current;
    const sq = spellMgrRef.current.next();
    const payload = sq.payload as EnglishSpellPayload;

    s.bossMode = true;
    s.spellQuestion = sq;
    s.spellIndex = 0;
    s.drones = [];
    s.waveStartTime = Date.now();

    const allLetters = shuffleArray([
      ...payload.word.split(''),
      ...payload.distractorLetters.slice(0, 2),
    ]);
    const W = Math.max(800, s.width);
    s.letterOrbs = allLetters.map((letter, idx) => ({
      id: `orb-${idx}-${Date.now()}`,
      letter,
      x: 120 + ((W - 240) / Math.max(1, allLetters.length - 1)) * idx,
      y: 265 + (idx % 2) * 75,
      vx: (Math.random() > 0.5 ? 1 : -1) * (35 + Math.random() * 30),
      vy: (Math.random() > 0.5 ? 1 : -1) * 18,
      r: 28,
      collected: false,
      flash: 0,
    }));

    setWave(TOTAL_DRONE_WAVES + 1);
    setRadarInfo({
      prompt: `${stageConfig?.enemyName ?? 'BOSS'} 拼字充能！依序射擊字母拼出「${payload.zhMeaning}」`,
      speakText: payload.speakText,
      zhHint: payload.zhMeaning,
      isBoss: true,
      spellProgress: '',
      spellTarget: payload.word,
    });
    soundEngine.speakText(payload.speakText, 'en-US');
  }, [TOTAL_DRONE_WAVES, stageConfig?.enemyName]);

  const spawnDroneWave = useCallback(
    (waveNum: number) => {
      const s = simRef.current;
      if (waveNum >= TOTAL_DRONE_WAVES) {
        s.bossHp = stageConfig?.tier === 'boss' ? 3 : 2;
        s.bossMaxHp = s.bossHp;
        spawnBossSpellingRound();
        return;
      }

      const q = droneMgrRef.current.next();
      const payload = q.payload as EnglishDronePayload;

      s.waveIndex = waveNum;
      s.currentQuestion = q;
      s.waveStartTime = Date.now();
      s.bossMode = false;

      const W = Math.max(800, s.width);
      const count = payload.choices.length;
      const indexed = shuffleArray(
        payload.choices.map((label, idx) => ({ label, isCorrect: idx === payload.correctIndex }))
      );

      s.drones = indexed.map((item, i) => ({
        id: `d-${waveNum}-${i}`,
        label: item.label,
        isCorrect: item.isCorrect,
        x: 140 + ((W - 280) / Math.max(1, count - 1)) * i,
        y: -40 - i * 25,
        targetY: 175 + (i % 2) * 58,
        vx: (i % 2 === 0 ? 1 : -1) * (32 + waveNum * 8),
        hp: 45,
        maxHp: 45,
        hitFlash: 0,
        shieldFlash: 0,
        fireCd: 1.5 + i * 0.55,
        wobble: i * 1.4,
      }));

      setWave(waveNum + 1);
      setRadarInfo({
        prompt: q.prompt,
        speakText: payload.speakText,
        zhHint: payload.mode === 'listen' ? `提示：${payload.zhMeaning}` : payload.zhMeaning,
        isBoss: false,
      });
      soundEngine.speakText(payload.speakText, 'en-US');
    },
    [grade, semester, spawnBossSpellingRound]
  );

  // Boot wave 1 on mount
  useEffect(() => {
    const t = setTimeout(() => spawnDroneWave(0), 200);
    return () => clearTimeout(t);
  }, [spawnDroneWave]);

  const triggerNovaBurst = () => {
    if (ultRef.current < 100) return;
    ultRef.current = 0;
    setUltCharge(0);
    soundEngine.playUltimateRoar();
    setCutIn(true);
    setTimeout(() => {
      setCutIn(false);
      const s = simRef.current;
      s.novaBeamTimer = 1.1;
      s.enemyBullets = [];
      triggerGameFeel(s.feel, { hitstop: 0.08, shake: 0.9, flash: 0.35, flashColor: '#22D3EE' });
      s.particles.burst(s.shipX, s.height * 0.35, 40, ['#22D3EE', '#EC4899', '#FEF08A'], 100, 380, 8, 'spark');

      // Auto-destroy correct drone or advance boss spelling!
      if (!s.bossMode) {
        const rightDrone = s.drones.find((d) => d.isCorrect);
        if (rightDrone && s.currentQuestion) {
          rightDrone.hp = 0;
          correctRef.current += 1;
          attemptsRef.current += 1;
          onAnswerResult(s.currentQuestion, true);
          tagsRef.current.add(s.currentQuestion.knowledgeTag);
          scoreRef.current += 350;
          setScore(scoreRef.current);
          s.floats.spawn(rightDrone.x, rightDrone.y, 'NOVA 擊破!', 'perfect');
          s.drones = [];
          setTimeout(() => spawnDroneWave(s.waveIndex + 1), 650);
        }
      } else if (s.spellQuestion) {
        s.bossHp -= 1;
        s.bossHitFlash = 1;
        scoreRef.current += 450;
        setScore(scoreRef.current);
        s.floats.spawn(s.bossX, 150, 'NOVA 重創母艦!', 'perfect');
        if (s.bossHp <= 0) setTimeout(() => concludeRun(true), 650);
        else setTimeout(() => spawnBossSpellingRound(), 750);
      }
    }, 1150);
  };

  const handleGuardianSkill = () => {
    if (guardianUsed) return;
    setGuardianUsed(true);
    soundEngine.playPerfectBell();
    const s = simRef.current;
    if (guardian.activeEffectKey === 'ink_heal_boost') {
      const heal = Math.round(playerStats.maxHp * 0.35);
      hpRef.current = Math.min(playerStats.maxHp, hpRef.current + heal);
      setHp(hpRef.current);
      doubleNextRef.current = true;
      s.floats.spawn(s.shipX, s.shipY - 30, `+${heal} HP & 2x`, 'heal', guardian.activeName);
    } else if (guardian.activeEffectKey === 'full_ultimate') {
      ultRef.current = 100;
      setUltCharge(100);
      s.floats.spawn(s.shipX, s.shipY - 30, 'NOVA 100%', 'perfect', guardian.activeName);
    } else if (guardian.activeEffectKey === 'freeze_timer') {
      freezeRef.current = 8;
      setFreezeSecs(8);
      s.enemyBullets = [];
      s.floats.spawn(s.shipX, s.shipY - 30, '彈幕凍結 8s', 'perfect', guardian.activeName);
    } else {
      shieldTimerRef.current = 10;
      s.enemyBullets = [];
      s.floats.spawn(s.shipX, s.shipY - 30, '翡翠護盾啟動', 'heal', guardian.activeName);
    }
  };

  // Main 60FPS Galaxy Shooter Canvas Loop
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
      if (simRef.current.shipY > rect.height - 50) {
        simRef.current.shipY = rect.height - 90;
        simRef.current.targetY = rect.height - 90;
      }
      simRef.current.bossX = rect.width * 0.5;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        setPaused((p) => !p);
        return;
      }
      simRef.current.keys.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      simRef.current.keys.delete(e.key.toLowerCase());
    };
    const onBlur = () => simRef.current.keys.clear();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let rafId = 0;
    let yieldTimer = 0;
    let alive = true;
    let lastTs = performance.now();
    let syncTimer = 0;

    const handleCorrectDroneKill = (drone: AnswerDrone) => {
      const s = simRef.current;
      const q = s.currentQuestion;
      if (!q) return;
      attemptsRef.current += 1;
      correctRef.current += 1;
      onAnswerResult(q, true);
      tagsRef.current.add(q.knowledgeTag);

      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      maxComboRef.current = Math.max(maxComboRef.current, nextCombo);
      setCombo(nextCombo);

      const elapsed = (Date.now() - s.waveStartTime) / 1000;
      const gradeTier = getSpeedGrade(elapsed, 13, playMode, guardianId);
      const calc = calculateCombatDamage({
        baseAttack: playerStats.baseAttack,
        skillMultiplier: 2.2,
        isCorrect: true,
        speedGrade: gradeTier,
        combo: nextCombo,
        guardianId,
        doubleNextAttack: doubleNextRef.current,
      });
      doubleNextRef.current = false;

      scoreRef.current += calc.damage * 4 + (gradeTier === 'PERFECT' ? 150 : 75);
      setScore(scoreRef.current);
      ultRef.current = Math.min(100, ultRef.current + getUltimateChargeGain(gradeTier, nextCombo, guardianId));
      setUltCharge(ultRef.current);

      soundEngine.playExplosion();
      if (gradeTier === 'PERFECT') soundEngine.playPerfectBell();
      else soundEngine.playCorrectChord(nextCombo);

      triggerGameFeel(s.feel, {
        hitstop: 0.06,
        shake: 0.6,
        flash: 0.22,
        flashColor: '#22D3EE',
      });
      s.particles.burst(drone.x, drone.y, 28, ['#22D3EE', '#EC4899', '#FDE047', '#FFFFFF'], 90, 320, 7, 'spark');
      s.particles.spawn(drone.x, drone.y, 0, 0, '#22D3EE', 16, 0.35, 0, 'ring');
      s.floats.spawn(
        drone.x,
        drone.y - 16,
        `+${calc.damage * 4}`,
        gradeTier === 'PERFECT' ? 'perfect' : 'crit',
        `${drone.label} 命中！`
      );

      // Spawn magnetized energy cores
      for (let i = 0; i < 4; i++) {
        s.cores.push({
          x: drone.x + (Math.random() - 0.5) * 40,
          y: drone.y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 120,
          vy: -80 + Math.random() * 60,
        });
      }

      s.drones = [];
      s.enemyBullets = [];
      setTimeout(() => {
        if (!finishedRef.current) spawnDroneWave(s.waveIndex + 1);
      }, 720);
    };

    const handleWrongDronePenalty = (drone: AnswerDrone) => {
      const s = simRef.current;
      const q = s.currentQuestion;
      if (!q) return;
      attemptsRef.current += 1;
      onAnswerResult(q, false);
      comboRef.current = 0;
      setCombo(0);
      soundEngine.playWrongBuzz();
      drone.shieldFlash = 1.0;
      drone.hp = drone.maxHp; // Deflects and resets
      triggerGameFeel(s.feel, { shake: 0.32 });
      s.floats.spawn(drone.x, drone.y - 20, '護盾反彈！', 'miss', `正解：${q.answer}`);
      setBanner({
        title: `誤擊「${drone.label}」！目標反彈彈幕`,
        answer: `${q.answer}（${(q.payload as EnglishDronePayload).zhMeaning}）`,
        explanation: q.explanation,
        tag: q.knowledgeTag,
      });

      // Fan-spread penalty bullets!
      if (playMode === 'adventure' && freezeRef.current <= 0) {
        for (let i = -2; i <= 2; i++) {
          const ang = Math.PI / 2 + i * 0.25;
          s.enemyBullets.push({
            x: drone.x,
            y: drone.y + 24,
            vx: Math.cos(ang) * 210,
            vy: Math.sin(ang) * 210,
            r: 7,
          });
        }
      }
    };

    const handleLetterHit = (orb: LetterOrb) => {
      const s = simRef.current;
      if (!s.spellQuestion || orb.collected) return;
      const payload = s.spellQuestion.payload as EnglishSpellPayload;
      const expected = payload.word[s.spellIndex];
      if (orb.letter === expected) {
        orb.collected = true;
        s.spellIndex += 1;
        soundEngine.playCorrectChord(s.spellIndex);
        s.particles.burst(orb.x, orb.y, 14, ['#22D3EE', '#FDE047'], 70, 200, 5, 'spark');
        s.floats.spawn(orb.x, orb.y - 12, orb.letter, 'perfect', '充能！');
        setRadarInfo((prev) => ({
          ...prev,
          spellProgress: payload.word.slice(0, s.spellIndex),
        }));

        if (s.spellIndex >= payload.word.length) {
          // Orbital Main Cannon blasts Mothership!
          attemptsRef.current += 1;
          correctRef.current += 1;
          onAnswerResult(s.spellQuestion, true);
          tagsRef.current.add(s.spellQuestion.knowledgeTag);
          s.orbitalCannonTimer = 0.85;
          s.bossHitFlash = 1.0;
          s.bossHp -= 1;
          scoreRef.current += 600;
          setScore(scoreRef.current);
          soundEngine.playExplosion();
          soundEngine.playPerfectBell();
          triggerGameFeel(s.feel, { hitstop: 0.07, shake: 0.85, flash: 0.3, flashColor: '#FDE047' });
          s.particles.burst(s.bossX, 130, 38, ['#FDE047', '#EC4899', '#22D3EE'], 110, 360, 8, 'spark');
          s.floats.spawn(s.bossX, 145, `${payload.word} 軌道主砲！`, 'perfect');
          s.letterOrbs = [];

          if (s.bossHp <= 0) {
            setTimeout(() => concludeRun(true), 850);
          } else {
            setTimeout(() => {
              if (!finishedRef.current) spawnBossSpellingRound();
            }, 950);
          }
        }
      } else {
        orb.flash = 0.8;
        soundEngine.playWrongBuzz();
        attemptsRef.current += 1;
        onAnswerResult(s.spellQuestion, false);
        s.floats.spawn(orb.x, orb.y - 14, `需要 ${expected}`, 'miss');
        setBanner({
          title: `字母順序不對喔！下一個字母是「${expected}」`,
          answer: `${payload.word}（${payload.zhMeaning}）`,
          explanation: s.spellQuestion.explanation,
          tag: s.spellQuestion.knowledgeTag,
        });
      }
    };

    const loop = (now: number) => {
      if (!alive) return;
      const frameStart = performance.now();
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const s = simRef.current;

      const { simDt, shakeX, shakeY } = updateGameFeel(s.feel, pausedRef.current ? 0 : rawDt);
      const dt = pausedRef.current ? 0 : simDt;
      s.time += dt;

      if (freezeRef.current > 0 && dt > 0) freezeRef.current = Math.max(0, freezeRef.current - dt);
      if (shieldTimerRef.current > 0 && dt > 0) shieldTimerRef.current = Math.max(0, shieldTimerRef.current - dt);
      if (s.shipHitFlash > 0) s.shipHitFlash = Math.max(0, s.shipHitFlash - dt * 5);
      if (s.bossHitFlash > 0) s.bossHitFlash = Math.max(0, s.bossHitFlash - dt * 4);
      if (s.novaBeamTimer > 0) s.novaBeamTimer = Math.max(0, s.novaBeamTimer - dt);
      if (s.orbitalCannonTimer > 0) s.orbitalCannonTimer = Math.max(0, s.orbitalCannonTimer - dt);

      const W = s.width;
      const H = s.height;

      // Update parallax stars
      for (const st of s.stars) {
        st.y += st.speed * dt;
        if (st.y > H + 10) {
          st.y = -8;
          st.x = Math.random() * W;
        }
      }

      if (dt > 0) {
        // Ship movement: Keyboard + Pointer tracking
        let kx = 0;
        let ky = 0;
        if (s.keys.has('a') || s.keys.has('arrowleft')) kx -= 1;
        if (s.keys.has('d') || s.keys.has('arrowright')) kx += 1;
        if (s.keys.has('w') || s.keys.has('arrowup')) ky -= 1;
        if (s.keys.has('s') || s.keys.has('arrowdown')) ky += 1;

        const prevX = s.shipX;
        if (kx !== 0 || ky !== 0) {
          s.pointerActive = false;
          const spd = (shipVariantRef.current === 'falcon' ? 460 : 380) * (1 + playerStats.speedBonus);
          s.shipX += kx * spd * dt;
          s.shipY += ky * spd * dt;
        } else if (s.pointerActive) {
          s.shipX += (s.targetX - s.shipX) * Math.min(1, dt * 14);
          s.shipY += (s.targetY - s.shipY) * Math.min(1, dt * 14);
        }

        s.shipX = Math.max(44, Math.min(W - 44, s.shipX));
        s.shipY = Math.max(H * 0.45, Math.min(H - 52, s.shipY));
        s.tilt = Math.max(-1, Math.min(1, (s.shipX - prevX) * 0.12));

        // Auto-fire neon lasers
        s.fireTimer -= dt;
        const fireInterval = shipVariantRef.current === 'falcon' ? 0.16 : 0.22;
        if (s.fireTimer <= 0) {
          s.fireTimer = fireInterval;
          if (shipVariantRef.current === 'blaster') {
            s.lasers.push(
              { x: s.shipX - 14, y: s.shipY - 22, vy: -680, power: 14, color: '#22D3EE' },
              { x: s.shipX + 14, y: s.shipY - 22, vy: -680, power: 14, color: '#22D3EE' }
            );
          } else {
            s.lasers.push({ x: s.shipX, y: s.shipY - 28, vy: -760, power: 20, color: '#F472B6' });
          }
          soundEngine.playLaser();
        }

        // Update player lasers & check collisions
        for (let i = s.lasers.length - 1; i >= 0; i--) {
          const b = s.lasers[i];
          b.y += b.vy * dt;
          if (b.y < -20) {
            s.lasers.splice(i, 1);
            continue;
          }

          let hit = false;
          if (!s.bossMode) {
            for (const d of s.drones) {
              if (Math.abs(b.x - d.x) < 58 && Math.abs(b.y - d.y) < 30) {
                hit = true;
                d.hitFlash = 0.7;
                d.hp -= b.power;
                s.particles.burst(b.x, b.y, 4, [b.color, '#FFFFFF'], 40, 130, 3, 'spark', 0);
                if (d.hp <= 0) {
                  if (d.isCorrect) handleCorrectDroneKill(d);
                  else handleWrongDronePenalty(d);
                }
                break;
              }
            }
          } else {
            for (const orb of s.letterOrbs) {
              if (!orb.collected && Math.hypot(b.x - orb.x, b.y - orb.y) < orb.r + 8) {
                hit = true;
                handleLetterHit(orb);
                break;
              }
            }
          }
          if (hit) s.lasers.splice(i, 1);
        }

        // Update drones
        const frozen = freezeRef.current > 0;
        for (const d of s.drones) {
          d.wobble += dt * 3;
          if (d.hitFlash > 0) d.hitFlash = Math.max(0, d.hitFlash - dt * 5);
          if (d.shieldFlash > 0) d.shieldFlash = Math.max(0, d.shieldFlash - dt * 3);
          if (!frozen) {
            d.y += (d.targetY - d.y) * Math.min(1, dt * 3.5);
            d.x += d.vx * dt;
            if (d.x < 95 || d.x > W - 95) d.vx *= -1;
            // Enemy firing in Adventure mode
            if (playMode === 'adventure') {
              d.fireCd -= dt;
              if (d.fireCd <= 0) {
                d.fireCd = 2.4 + Math.random() * 1.6;
                const ang = Math.atan2(s.shipY - d.y, s.shipX - d.x);
                s.enemyBullets.push({
                  x: d.x,
                  y: d.y + 24,
                  vx: Math.cos(ang) * 185,
                  vy: Math.sin(ang) * 185,
                  r: 6,
                });
              }
            }
          }
        }

        // Boss Letter Orbs drift & Mothership fire
        if (s.bossMode) {
          s.bossX = W * 0.5 + Math.sin(s.time * 1.2) * Math.min(180, W * 0.16);
          for (const orb of s.letterOrbs) {
            if (orb.flash > 0) orb.flash = Math.max(0, orb.flash - dt * 3);
            if (!orb.collected && !frozen) {
              orb.x += orb.vx * dt;
              orb.y += orb.vy * dt;
              if (orb.x < 70 || orb.x > W - 70) orb.vx *= -1;
              if (orb.y < 210 || orb.y > H * 0.62) orb.vy *= -1;
            }
          }
          if (playMode === 'adventure' && !frozen) {
            s.bossFireCd -= dt;
            if (s.bossFireCd <= 0) {
              s.bossFireCd = 1.9;
              for (let k = -1; k <= 1; k++) {
                s.enemyBullets.push({
                  x: s.bossX + k * 48,
                  y: 155,
                  vx: k * 65,
                  vy: 210,
                  r: 7,
                });
              }
            }
          }
        }

        // Enemy bullets hit player
        for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
          const eb = s.enemyBullets[i];
          eb.x += eb.vx * dt;
          eb.y += eb.vy * dt;
          if (eb.y > H + 20 || eb.x < -20 || eb.x > W + 20) {
            s.enemyBullets.splice(i, 1);
            continue;
          }
          if (Math.hypot(eb.x - s.shipX, eb.y - s.shipY) < 22) {
            s.enemyBullets.splice(i, 1);
            if (shieldTimerRef.current > 0) {
              s.floats.spawn(s.shipX, s.shipY - 26, '護盾吸收', 'heal');
            } else {
              s.shipHitFlash = 0.9;
              triggerGameFeel(s.feel, { shake: 0.35, hitstop: 0.03 });
              soundEngine.playWrongBuzz();
              hpRef.current = Math.max(0, hpRef.current - 12);
              setHp(hpRef.current);
              s.floats.spawn(s.shipX, s.shipY - 24, '-12', 'crit');
              if (hpRef.current <= 0) concludeRun(false);
            }
          }
        }

        // Magnetized Energy Cores
        for (let i = s.cores.length - 1; i >= 0; i--) {
          const c = s.cores[i];
          const dx = s.shipX - c.x;
          const dy = s.shipY - c.y;
          const dist = Math.hypot(dx, dy);
          c.vx += (dx / Math.max(1, dist)) * 850 * dt;
          c.vy += (dy / Math.max(1, dist)) * 850 * dt;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          if (dist < 28) {
            s.cores.splice(i, 1);
            scoreRef.current += 25;
            setScore(scoreRef.current);
          }
        }
      }

      s.particles.update(dt);
      s.floats.update(dt);

      syncTimer += rawDt;
      if (syncTimer > 0.15) {
        syncTimer = 0;
        setFreezeSecs(Math.ceil(freezeRef.current));
      }

      // ==================== RENDER DEEP SPACE ====================
      ctx.save();
      ctx.translate(shakeX, shakeY);

      const spaceGrad = ctx.createLinearGradient(0, 0, 0, H);
      spaceGrad.addColorStop(0, '#090418');
      spaceGrad.addColorStop(0.55, '#130A2A');
      spaceGrad.addColorStop(1, '#08182E');
      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle cyber nebula glow
      const neb = ctx.createRadialGradient(W * 0.72, H * 0.28, 20, W * 0.72, H * 0.28, 340);
      neb.addColorStop(0, 'rgba(236, 72, 153, 0.18)');
      neb.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
      neb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, W, H);

      // Parallax stars
      for (const st of s.stars) {
        ctx.fillStyle = st.color;
        ctx.fillRect(st.x, st.y, st.size, st.size * (st.speed > 140 ? 4 : 1.5));
      }

      // Nova Burst / Orbital Cannon Giant Beam
      if (s.novaBeamTimer > 0 || s.orbitalCannonTimer > 0) {
        const bx = s.orbitalCannonTimer > 0 ? s.bossX : s.shipX;
        const beamW = 72 * Math.max(s.novaBeamTimer, s.orbitalCannonTimer);
        const beamGrad = ctx.createLinearGradient(bx - beamW, 0, bx + beamW, 0);
        beamGrad.addColorStop(0, 'rgba(34,211,238,0)');
        beamGrad.addColorStop(0.5, '#FEF08A');
        beamGrad.addColorStop(1, 'rgba(236,72,153,0)');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(bx - beamW, 0, beamW * 2, H);
      }

      // Answer Drones with Glowing Neon English Labels Directly on Hulls!
      for (const d of s.drones) {
        ctx.save();
        ctx.translate(d.x, d.y + Math.sin(d.wobble) * 5);

        // Drone metallic wings
        ctx.fillStyle = '#312E81';
        ctx.strokeStyle = d.shieldFlash > 0 ? '#FB923C' : '#22D3EE';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-58, -10);
        ctx.lineTo(-34, -26);
        ctx.lineTo(34, -26);
        ctx.lineTo(58, -10);
        ctx.lineTo(44, 18);
        ctx.lineTo(-44, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Thruster eye
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.arc(0, 16, 6, 0, Math.PI * 2);
        ctx.fill();

        // Large glowing neon answer billboard (extra crisp & legible on mobile screens)
        const fontSize = W < 640 ? 20 : 21;
        ctx.font = `900 ${fontSize}px "Fredoka", "Noto Sans TC", sans-serif`;
        const tw = Math.max(106, ctx.measureText(d.label).width + 28);
        ctx.fillStyle = d.hitFlash > 0 ? '#FFFFFF' : 'rgba(9, 14, 34, 0.96)';
        ctx.strokeStyle = d.shieldFlash > 0 ? '#F97316' : '#38BDF8';
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, -tw / 2, -23, tw, 40, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = d.hitFlash > 0 ? '#0F172A' : '#F0F9FF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.label, 0, -3);

        // Drone HP microbar
        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.fillRect(-34, -34, 68, 5);
        ctx.fillStyle = '#22D3EE';
        ctx.fillRect(-34, -34, Math.max(0, 68 * (d.hp / d.maxHp)), 5);

        ctx.restore();
      }

      // Boss Mothership & Floating Letter Energy Orbs
      if (s.bossMode) {
        ctx.save();
        ctx.translate(s.bossX, 128);
        ctx.fillStyle = s.bossHitFlash > 0 ? '#FFFFFF' : '#1E1B4B';
        ctx.strokeStyle = '#EC4899';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-130, -10);
        ctx.lineTo(-85, -42);
        ctx.lineTo(85, -42);
        ctx.lineTo(130, -10);
        ctx.lineTo(95, 28);
        ctx.lineTo(-95, 28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing core
        ctx.fillStyle = '#22D3EE';
        ctx.beginPath();
        ctx.arc(0, -4, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0F172A';
        ctx.font = '900 12px "Fredoka", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`HP ${s.bossHp}/${s.bossMaxHp}`, 0, 1);
        ctx.restore();

        // Letter Energy Orbs
        for (const orb of s.letterOrbs) {
          if (orb.collected) continue;
          ctx.save();
          ctx.translate(orb.x, orb.y);
          ctx.fillStyle = orb.flash > 0 ? '#EF4444' : 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = orb.flash > 0 ? '#FCA5A5' : '#FACC15';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, orb.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FEF08A';
          ctx.font = '900 24px "Fredoka", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(orb.letter, 0, 1);
          ctx.restore();
        }
      }

      // Player Lasers
      for (const b of s.lasers) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 2.5, b.y - 12, 5, 22);
      }

      // Enemy Bullets
      for (const eb of s.enemyBullets) {
        ctx.fillStyle = '#FB7185';
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(eb.x, eb.y, eb.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // Energy Cores
      for (const c of s.cores) {
        ctx.fillStyle = '#34D399';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player Mecha Ship
      drawMechaShip(
        ctx,
        shipVariantRef.current,
        s.shipX,
        s.shipY,
        s.time,
        s.tilt,
        shieldTimerRef.current > 0,
        s.shipHitFlash
      );

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
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [concludeRun, guardianId, onAnswerResult, playMode, playerStats.baseAttack, playerStats.maxHp, playerStats.speedBonus, spawnBossSpellingRound, spawnDroneWave]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pausedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (e.pointerType === 'touch') {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      touchDragRef.current = { active: true, pointerId: e.pointerId, lastX: px, lastY: py };
      // Keep mecha ship comfortably above the thumb (+52px upward offset) so thumb never blocks ship
      simRef.current.targetX = Math.max(36, Math.min(rect.width - 36, px));
      simRef.current.targetY = Math.max(120, Math.min(rect.height - 62, py - 52));
      simRef.current.pointerActive = true;
    } else {
      simRef.current.targetX = px;
      simRef.current.targetY = py;
      simRef.current.pointerActive = true;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pausedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    if (e.pointerType === 'touch') {
      if (!touchDragRef.current.active || touchDragRef.current.pointerId !== e.pointerId) return;
      // Smooth relative touch drag (1.15x thumb responsiveness without jumping under finger)
      const dx = (px - touchDragRef.current.lastX) * 1.15;
      const dy = (py - touchDragRef.current.lastY) * 1.15;
      touchDragRef.current.lastX = px;
      touchDragRef.current.lastY = py;
      simRef.current.targetX = Math.max(36, Math.min(rect.width - 36, simRef.current.targetX + dx));
      simRef.current.targetY = Math.max(120, Math.min(rect.height - 62, simRef.current.targetY + dy));
      simRef.current.pointerActive = true;
    } else {
      simRef.current.targetX = px;
      simRef.current.targetY = py;
      simRef.current.pointerActive = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (touchDragRef.current.pointerId === e.pointerId) {
      touchDragRef.current.active = false;
      touchDragRef.current.pointerId = null;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950" data-testid="galaxy-shooter-engine">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="block w-full h-full cursor-crosshair touch-none"
        data-testid="galaxy-shooter-canvas"
      />

      {/* Top Holographic Mission Radar (Zero Option Buttons!) */}
      <div className="fixed inset-x-0 top-0 z-20 pointer-events-none safe-top p-2 sm:p-3 flex flex-wrap items-start justify-between gap-2">
        {/* Left: Ship HP & Wave */}
        <div className="pointer-events-auto max-w-full rounded-2xl bg-slate-900/92 border-2 border-cyan-400/80 px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-xl flex items-center gap-2.5 sm:gap-3.5">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-cyan-300 truncate max-w-[140px] sm:max-w-none">
              {stageConfig
                ? `Word Galaxy・第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
                : `Word Galaxy（${grade}年級）`}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-black text-rose-300">SHIELD</span>
              <div className="w-16 sm:w-24 h-2.5 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-transform origin-left"
                  style={{ transform: `scaleX(${Math.max(0, hp / playerStats.maxHp)})` }}
                />
              </div>
              <span className="text-[11px] font-black text-white font-mono-num">{hp}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400">WAVE</div>
            <div className="text-sm sm:text-base font-black text-cyan-300 font-mono-num">
              {wave}/{TOTAL_DRONE_WAVES + 1}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-slate-400">COMBO</div>
            <div className="text-sm sm:text-base font-black text-pink-400 font-mono-num">{combo}x</div>
          </div>
          <div className="hidden sm:block text-center">
            <div className="text-[9px] text-slate-400">SCORE</div>
            <div className="text-base font-black text-white font-mono-num">{score}</div>
          </div>
        </div>

        {/* Center Holographic Mission Prompt + TTS */}
        <div className="pointer-events-auto rounded-2xl bg-indigo-950/95 border-2 border-pink-400/90 px-4 py-2 shadow-2xl max-w-xl flex items-center gap-3">
          <button
            type="button"
            onClick={() => soundEngine.speakText(radarInfo.speakText, 'en-US')}
            aria-label="重播英文語音"
            className="w-11 h-11 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center shrink-0 transition-transform active:scale-95"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-black text-white leading-tight">
              {radarInfo.prompt}
            </div>
            <div className="text-xs text-cyan-200 mt-0.5 flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 shrink-0" />
              <span>
                {radarInfo.isBoss
                  ? `已拼出：${radarInfo.spellProgress || '___'} / 共 ${radarInfo.spellTarget?.length ?? 0} 字母（移動機甲射擊對應字母球！）`
                  : `${radarInfo.zhHint} · 移動機甲瞄準正確敵機轟爆它！`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {freezeSecs > 0 && (
            <div className="rounded-xl bg-sky-600 text-white font-black text-xs px-3 py-2">
              凍結 {freezeSecs}s
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setShipVariant((v) => (v === 'blaster' ? 'falcon' : 'blaster'));
            }}
            className="min-h-[44px] px-3 rounded-xl bg-slate-900/92 hover:bg-slate-800 border-2 border-pink-400/70 text-pink-200 font-bold text-xs flex items-center gap-1.5"
          >
            <Rocket className="w-4 h-4" /> {shipVariant === 'blaster' ? 'Blaster' : 'Falcon'}
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

      {/* Bottom Corner Action Triggers (Nova Burst & Guardian Skill — Keeping Center 85%+ Clear!) */}
      <div className="fixed inset-x-0 bottom-3 z-20 pointer-events-none px-4 flex items-end justify-between">
        <button
          type="button"
          disabled={guardianUsed}
          onClick={handleGuardianSkill}
          className={`pointer-events-auto min-h-[48px] px-4 rounded-2xl font-black text-xs border-2 flex items-center gap-2 shadow-xl transition-transform active:scale-95 ${
            guardianUsed
              ? 'bg-slate-900/75 border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-slate-950'
          }`}
        >
          <Sparkles className="w-4 h-4" /> {guardian.name}：{guardian.activeName}
        </button>

        <button
          type="button"
          disabled={ultCharge < 100}
          onClick={triggerNovaBurst}
          className={`pointer-events-auto min-h-[50px] px-5 rounded-2xl font-black text-sm border-2 flex items-center gap-2 shadow-xl transition-transform active:scale-95 ${
            ultCharge >= 100
              ? 'bg-pink-500 hover:bg-pink-400 border-cyan-200 text-white shadow-[0_0_24px_rgba(236,72,153,0.75)]'
              : 'bg-slate-900/90 border-cyan-500/50 text-cyan-300 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" /> NOVA BURST ({ultCharge}%)
        </button>
      </div>

      {bossWarning && stageConfig?.tier === 'boss' && (
        <div className="fixed inset-x-0 top-24 z-30 pointer-events-none flex justify-center px-4">
          <div className="animate-vs-banner rounded-2xl bg-rose-950/95 border-2 border-cyan-300 px-6 py-3 text-center shadow-[0_0_32px_rgba(34,211,238,0.5)]">
            <div className="text-xs font-black tracking-widest text-cyan-300">
              WARNING · 第 10 關章節大魔王星艦逼近！
            </div>
            <div className="text-xl font-black text-white mt-0.5">{stageConfig.enemyName}</div>
            {stageConfig.bossPhase2Name && (
              <div className="text-xs text-rose-200 mt-0.5">
                二階變身型態：{stageConfig.bossPhase2Name}（拼字核心擊破！）
              </div>
            )}
          </div>
        </div>
      )}

      <ExplanationBanner message={banner} onDismiss={() => setBanner(null)} />
      <UltimateCutIn
        visible={cutIn}
        title="NOVA BURST・超新星貫穿砲"
        subtitle="清除全屏彈幕並鎖定正確目標！"
        symbol="★"
        accentBg="bg-gradient-to-r from-cyan-600 via-indigo-700 to-pink-600"
      />
      <WorldPauseModal
        open={paused}
        worldName={
          stageConfig
            ? `Word Galaxy・第${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
            : '英語文・星際機甲戰線 Word Galaxy'
        }
        onResume={() => setPaused(false)}
        onRestart={onExit}
        onExit={onExit}
      />
    </div>
  );
};
