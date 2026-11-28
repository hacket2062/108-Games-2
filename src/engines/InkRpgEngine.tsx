import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, Pause, Shield, Sparkles, Compass, Swords, Wand2, BookOpen } from 'lucide-react';
import {
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
  computeClassDamageBonus,
  getSpeedGrade,
  getUltimateChargeGain,
} from '../core/combatMath';
import { soundEngine } from '../audio/soundEngine';
import {
  createGameFeel,
  drawHeroClassAura,
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
import { RoguelikeCardModal } from '../components/RoguelikeCardModal';
import { RoguelikeRelicDef, rollRoguelikeChoices } from '../data/heroProgression';
import { gamepadManager } from '../core/gamepadManager';

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
  facingAngle: number;
  alerted: boolean;
  chaseSpeed: number;
  waveCurrent: number;
  wavesTotal: number;
  waveNames: string[];
  isStageBoss?: boolean;
}

interface MapChest {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  rewardText: string;
}

export const InkRpgEngine: React.FC<EngineCommonProps> = ({
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
  const movingRef = useRef(false);
  const guardian = GUARDIANS[guardianId];
  const hpScale = stageConfig?.enemyHpScale ?? 1;

  // Zero-Repeat Persistent Shuffle-Bag QuestionManager per skill mode
  const slashMgrRef = useRef(
    new QuestionManager<ChineseQuestion>(getChineseQuestions(grade, semester, 'slash'), {
      masteredQuestionIds,
      wrongQuestionIds,
      focusTags: stageConfig?.focusTags,
      bagKey: `zh_slash_g${grade}_s${semester}`,
    })
  );
  const radicalMgrRef = useRef(
    new QuestionManager<ChineseQuestion>(getChineseQuestions(grade, semester, 'radical'), {
      masteredQuestionIds,
      wrongQuestionIds,
      focusTags: stageConfig?.focusTags,
      bagKey: `zh_rad_g${grade}_s${semester}`,
    })
  );
  const typoMgrRef = useRef(
    new QuestionManager<ChineseQuestion>(getChineseQuestions(grade, semester, 'typo'), {
      masteredQuestionIds,
      wrongQuestionIds,
      focusTags: stageConfig?.focusTags,
      bagKey: `zh_typo_g${grade}_s${semester}`,
    })
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

  const [phase, setPhase] = useState<InkPhase>('explore');
  const [paused, setPaused] = useState(false);
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
    waveCurrent: number;
    wavesTotal: number;
    isStageBoss?: boolean;
  } | null>(null);
  const [sealedSkill, setSealedSkill] = useState<'slash' | 'radical' | null>(null);
  const [monstersLeft, setMonstersLeft] = useState(8);
  const [banner, setBanner] = useState<{
    title: string;
    answer: string;
    explanation: string;
    tag: string;
  } | null>(null);
  const [cutIn, setCutIn] = useState(false);
  const [mapToast, setMapToast] = useState<string | null>(
    '警戒！8 隻墨妖在三大古區巡邏，進入紅色視野扇形將遭到追擊！擊敗首領通關！'
  );

  // Refs synced for 60FPS loop without re-mounting canvas
  const phaseRef = useRef<InkPhase>('explore');
  const pausedRef = useRef(false);
  const freezeRef = useRef(0);
  const battleEnemyRef = useRef<MapMonster | null>(null);
  const sealedSkillRef = useRef<'slash' | 'radical' | null>(null);
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
        name: stageConfig ? `${stageConfig.title}斥候` : '錯字墨妖',
        kind: 'poring' as const,
        x: 340,
        y: 280,
        homeX: 340,
        homeY: 280,
        hp: Math.round(145 * hpScale),
        maxHp: Math.round(145 * hpScale),
        shielded: false,
        defeated: false,
        angle: 0.4,
        facingAngle: 0,
        alerted: false,
        chaseSpeed: 150,
        waveCurrent: 1,
        wavesTotal: 2,
        waveNames: [stageConfig ? `${stageConfig.title}斥候` : '錯字墨妖', '墨影雙刃兵'],
      },
      {
        id: 'm2',
        name: '斷句小魔',
        kind: 'poring' as const,
        x: 390,
        y: 525,
        homeX: 390,
        homeY: 525,
        hp: Math.round(150 * hpScale),
        maxHp: Math.round(150 * hpScale),
        shielded: false,
        defeated: false,
        angle: 1.9,
        facingAngle: 1.2,
        alerted: false,
        chaseSpeed: 152,
        waveCurrent: 1,
        wavesTotal: 2,
        waveNames: ['斷句小魔', '殘篇書妖'],
      },
      {
        id: 'm3',
        name: '橋頭病句妖',
        kind: 'slime' as const,
        x: 590,
        y: 330,
        homeX: 590,
        homeY: 330,
        hp: Math.round(175 * hpScale),
        maxHp: Math.round(175 * hpScale),
        shielded: true,
        defeated: false,
        angle: 3.1,
        facingAngle: 2.6,
        alerted: false,
        chaseSpeed: 160,
        waveCurrent: 1,
        wavesTotal: 2,
        waveNames: ['橋頭病句妖', '蝕文狂將'],
      },
      {
        id: 'm4',
        name: '墨霧巡邏兵',
        kind: 'poring' as const,
        x: 620,
        y: 540,
        homeX: 620,
        homeY: 540,
        hp: Math.round(160 * hpScale),
        maxHp: Math.round(160 * hpScale),
        shielded: stageConfig ? stageConfig.stageNumber >= 3 : false,
        defeated: false,
        angle: 4.5,
        facingAngle: -1.1,
        alerted: false,
        chaseSpeed: 158,
        waveCurrent: 1,
        wavesTotal: 2,
        waveNames: ['墨霧巡邏兵', '赤筆暗衛'],
      },
      {
        id: 'm5',
        name: stageConfig?.tier === 'elite' ? stageConfig.enemyName : '經閣護法妖',
        kind: 'slime' as const,
        x: 790,
        y: 235,
        homeX: 790,
        homeY: 235,
        hp: Math.round(205 * hpScale),
        maxHp: Math.round(205 * hpScale),
        shielded: true,
        defeated: false,
        angle: 0.9,
        facingAngle: 2.1,
        alerted: false,
        chaseSpeed: 168,
        waveCurrent: 1,
        wavesTotal: 2,
        waveNames: [
          stageConfig?.tier === 'elite' ? stageConfig.enemyName : '經閣護法妖',
          '破印重甲鬼',
        ],
      },
      {
        id: 'm6',
        name: '倒置成語鬼',
        kind: 'poring' as const,
        x: 820,
        y: 465,
        homeX: 820,
        homeY: 465,
        hp: Math.round(170 * hpScale),
        maxHp: Math.round(170 * hpScale),
        shielded: true,
        defeated: false,
        angle: 2.5,
        facingAngle: -2.2,
        alerted: false,
        chaseSpeed: 162,
        waveCurrent: 1,
        wavesTotal: 2,
        waveNames: ['倒置成語鬼', '黑硯咒師'],
      },
      {
        id: 'm7',
        name: '祭壇禁衛魔',
        kind: 'slime' as const,
        x: 960,
        y: 520,
        homeX: 960,
        homeY: 520,
        hp: Math.round(215 * hpScale),
        maxHp: Math.round(215 * hpScale),
        shielded: true,
        defeated: false,
        angle: 5.1,
        facingAngle: 3.1,
        alerted: false,
        chaseSpeed: 170,
        waveCurrent: 1,
        wavesTotal: 2,
        waveNames: ['祭壇禁衛魔', '墨龍先鋒官'],
      },
      {
        id: 'm8',
        name: stageConfig?.enemyName ? `${stageConfig.enemyName}（首領）` : '深淵墨魔首領',
        kind: 'boss' as const,
        x: 1030,
        y: 265,
        homeX: 1030,
        homeY: 265,
        hp: Math.round(240 * hpScale),
        maxHp: Math.round(240 * hpScale),
        shielded: true,
        defeated: false,
        angle: 3.8,
        facingAngle: Math.PI,
        alerted: false,
        chaseSpeed: 178,
        waveCurrent: 1,
        wavesTotal: 3,
        waveNames: [
          stageConfig?.enemyName ? `${stageConfig.enemyName}・前哨` : '深淵墨魔・前哨',
          stageConfig?.enemyName ? `${stageConfig.enemyName}・覺醒` : '深淵墨魔・覺醒',
          stageConfig?.bossPhase2Name ?? (stageConfig?.enemyName ? `${stageConfig.enemyName}・終焉真身` : '深淵墨魔皇'),
        ],
        isStageBoss: true,
      },
    ] as MapMonster[],
    chests: [
      { id: 'c1', x: 280, y: 210, opened: false, rewardText: '獲得古書靈墨！必殺能量 +30%' },
      { id: 'c2', x: 700, y: 185, opened: false, rewardText: '發現仙丹寶箱！隊伍生命 +35' },
      { id: 'c3', x: 920, y: 380, opened: false, rewardText: '尋獲破魔玉璽！隊伍生命 +30 & 必殺 +25%' },
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
    pausedRef.current = paused || Boolean(banner) || relicModalOpen;
    document.body.dataset.state = paused ? 'paused' : banner ? 'reading' : relicModalOpen ? 'choosing' : 'playing';
  }, [paused,banner,relicModalOpen]);

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
      if (sealedSkillRef.current && mode === sealedSkillRef.current) {
        soundEngine.playWrongBuzz();
        worldRef.current.floats.spawn(
          worldRef.current.width * 0.3,
          worldRef.current.height * 0.52,
          '錯字封印中！',
          'miss',
          '請用印璽醫者解除'
        );
        return;
      }
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
      onAnswerResult(q, isCorrect);

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

        // Typo skill heals party via Panda Healer AND cleanses 「錯字封印」!
        if (skillMode === 'typo') {
          const heal = Math.round(playerStats.maxHp * 0.18);
          partyHpRef.current = Math.min(playerStats.maxHp, partyHpRef.current + heal);
          setPartyHp(partyHpRef.current);
          const cleansed = sealedSkillRef.current !== null;
          if (cleansed) {
            sealedSkillRef.current = null;
            setSealedSkill(null);
          }
          w.floats.spawn(
            w.width * 0.25,
            w.height * 0.45,
            cleansed ? `+${heal} 解封！` : `+${heal}`,
            'heal',
            cleansed ? '淨化錯字封印' : '印璽治癒'
          );
        }

        enemy.hp = Math.max(0, enemy.hp - finalDmg);
        scoreRef.current += finalDmg * 3 + (speedGrade === 'PERFECT' ? 120 : 60);
        setScore(scoreRef.current);
        setUltCharge((u) => Math.min(100, u + getUltimateChargeGain(speedGrade, nextCombo, guardianId)));

        // Reset used hero's ATB
        const heroIdx = skillMode === 'slash' ? 0 : skillMode === 'radical' ? 1 : 2;
        w.atb[heroIdx] = 0;

        if (enemy.hp <= 0 && enemy.waveCurrent < enemy.wavesTotal) {
          // Multi-wave hardcore reinforcement inside the same encounter!
          enemy.waveCurrent += 1;
          enemy.maxHp = Math.round(enemy.maxHp * 1.18);
          enemy.hp = enemy.maxHp;
          enemy.name = enemy.waveNames[enemy.waveCurrent - 1] ?? `${enemy.name}・增援`;
          enemy.shielded = true;
          w.enemyAtb = 20;
          soundEngine.playExplosion();
          w.particles.burst(enemyX, enemyY, 32, ['#A855F7', '#F43F5E', '#FDE047'], 90, 310, 8, 'spark');
          w.floats.spawn(
            enemyX,
            enemyY - 62,
            `第 ${enemy.waveCurrent}/${enemy.wavesTotal} 波！`,
            'crit',
            `${enemy.name} 增援降臨`
          );
          setBattleEnemyUi({
            name: enemy.name,
            kind: enemy.kind,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
            shielded: enemy.shielded,
            waveCurrent: enemy.waveCurrent,
            wavesTotal: enemy.wavesTotal,
            isStageBoss: enemy.isStageBoss,
          });
        } else if (enemy.hp <= 0) {
          enemy.defeated = true;
          sealedSkillRef.current = null;
          setSealedSkill(null);
          soundEngine.playExplosion();
          w.particles.burst(enemyX, enemyY, 38, ['#F59E0B', '#F43F5E', '#FEF08A'], 80, 340, 8, 'circle');
          const remaining = w.monsters.filter((m) => !m.defeated).length;
          setMonstersLeft(remaining);
          setBattleEnemyUi({
            name: enemy.name,
            kind: enemy.kind,
            hp: 0,
            maxHp: enemy.maxHp,
            shielded: false,
            waveCurrent: enemy.waveCurrent,
            wavesTotal: enemy.wavesTotal,
            isStageBoss: enemy.isStageBoss,
          });
          setTimeout(() => {
            if (remaining === 0 || enemy.isStageBoss) {
              concludeRun(true);
            } else {
              battleEnemyRef.current = null;
              setBattleEnemyUi(null);
              setPhase('explore');
              setMapToast(`成功淨化「${enemy.name}」！還有 ${remaining} 隻墨妖（擊敗首領可通關）！`);
            }
          }, 750);
        } else {
          setBattleEnemyUi({
            name: enemy.name,
            kind: enemy.kind,
            hp: enemy.hp,
            maxHp: enemy.maxHp,
            shielded: enemy.shielded,
            waveCurrent: enemy.waveCurrent,
            wavesTotal: enemy.wavesTotal,
            isStageBoss: enemy.isStageBoss,
          });
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
            setTimeout(() => concludeRun(false), 550);
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
    setTimeout(() => {
      setCutIn(false);
      const w = worldRef.current;
      const enemy = battleEnemyRef.current;
      if (!enemy) return;
      enemy.shielded = false;
      sealedSkillRef.current = null;
      setSealedSkill(null);
      const dmg = Math.round(playerStats.baseAttack * 3.8);
      enemy.hp = Math.max(0, enemy.hp - dmg);
      w.fallingChar = { char: '智', y: w.height * 0.2, alpha: 1 };
      w.enemyHitFlash = 1;
      triggerGameFeel(w.feel, { hitstop: 0.08, shake: 0.95, flash: 0.4, flashColor: '#FDE047' });
      w.particles.burst(w.width * 0.72, w.height * 0.48, 42, ['#FDE047', '#F59E0B', '#EF4444'], 120, 380, 9, 'spark');
      w.floats.spawn(w.width * 0.72, w.height * 0.4, `-${dmg}`, 'perfect', '萬墨歸宗！');
      scoreRef.current += dmg * 4;
      setScore(scoreRef.current);

      if (enemy.hp <= 0 && enemy.waveCurrent < enemy.wavesTotal) {
        enemy.waveCurrent += 1;
        enemy.maxHp = Math.round(enemy.maxHp * 1.18);
        enemy.hp = enemy.maxHp;
        enemy.name = enemy.waveNames[enemy.waveCurrent - 1] ?? `${enemy.name}・增援`;
        enemy.shielded = true;
        w.floats.spawn(
          w.width * 0.72,
          w.height * 0.34,
          `第 ${enemy.waveCurrent}/${enemy.wavesTotal} 波！`,
          'crit',
          `${enemy.name} 增援`
        );
        setBattleEnemyUi({
          name: enemy.name,
          kind: enemy.kind,
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          shielded: enemy.shielded,
          waveCurrent: enemy.waveCurrent,
          wavesTotal: enemy.wavesTotal,
          isStageBoss: enemy.isStageBoss,
        });
      } else if (enemy.hp <= 0) {
        enemy.defeated = true;
        const remaining = w.monsters.filter((m) => !m.defeated).length;
        setMonstersLeft(remaining);
        setBattleEnemyUi({
          name: enemy.name,
          kind: enemy.kind,
          hp: 0,
          maxHp: enemy.maxHp,
          shielded: false,
          waveCurrent: enemy.waveCurrent,
          wavesTotal: enemy.wavesTotal,
          isStageBoss: enemy.isStageBoss,
        });
        setTimeout(() => {
          if (remaining === 0 || enemy.isStageBoss) concludeRun(true);
          else {
            battleEnemyRef.current = null;
            setBattleEnemyUi(null);
            setPhase('explore');
          }
        }, 700);
      } else {
        setBattleEnemyUi({
          name: enemy.name,
          kind: enemy.kind,
          hp: enemy.hp,
          maxHp: enemy.maxHp,
          shielded: false,
          waveCurrent: enemy.waveCurrent,
          wavesTotal: enemy.wavesTotal,
          isStageBoss: enemy.isStageBoss,
        });
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

      const walkBefore = w.walkPhase;
      if (phaseRef.current === 'explore' && dt > 0) {
        // Movement via WASD / Arrows, Virtual Touch Joystick, or click-to-walk
        let dx = w.joyX;
        let dy = w.joyY;
        if (w.keys.has('w') || w.keys.has('arrowup')) dy -= 1;
        if (w.keys.has('s') || w.keys.has('arrowdown')) dy += 1;
        if (w.keys.has('a') || w.keys.has('arrowleft')) dx -= 1;
        if (w.keys.has('d') || w.keys.has('arrowright')) dx += 1;

        const speed = 225 * (1 + playerStats.speedBonus);
        const snap = gamepadManager.poll();
        const p0 = snap.players.find((p) => p.connected);
        if (p0 && (Math.abs(p0.moveX) > 0.1 || Math.abs(p0.moveY) > 0.1)) {
          dx += p0.moveX;
          dy += p0.moveY;
        }

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

        w.playerX = Math.max(36, Math.min(w.width - 36, w.playerX));
        w.playerY = Math.max(36, Math.min(w.height - 36, w.playerY));

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
              setUltCharge((u) => Math.min(100, u + 30));
            } else if (c.id === 'c2') {
              partyHpRef.current = Math.min(playerStats.maxHp, partyHpRef.current + 35);
              setPartyHp(partyHpRef.current);
            } else {
              partyHpRef.current = Math.min(playerStats.maxHp, partyHpRef.current + 30);
              setPartyHp(partyHpRef.current);
              setUltCharge((u) => Math.min(100, u + 25));
            }
            w.floats.spawn(cx, cy - 20, '古書寶箱！', 'perfect');
            setMapToast(c.rewardText);
          }
        }

        // 8 Patrolling Monsters with Red Sector Alert Cones & Active Chase AI
        const visionRadius = Math.min(155, Math.max(105, w.width * 0.14));
        const visionHalfAngle = 0.56; // ~32 deg half-cone
        for (const m of w.monsters) {
          if (m.defeated) continue;
          const homeScaledX = (m.homeX / 1200) * w.width;
          const homeScaledY = (m.homeY / 700) * w.height;
          if (m.x === m.homeX && m.y === m.homeY && w.width !== 1200) {
            m.x = homeScaledX;
            m.y = homeScaledY;
          }

          const toPx = w.playerX - m.x;
          const toPy = w.playerY - m.y;
          const distToPlayer = Math.hypot(toPx, toPy);
          const angleToPlayer = Math.atan2(toPy, toPx);
          let angleDiff = angleToPlayer - m.facingAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          const spotted =
            distToPlayer < 64 ||
            (distToPlayer < visionRadius && Math.abs(angleDiff) <= visionHalfAngle);

          if (spotted && !m.alerted) {
            m.alerted = true;
            soundEngine.playWrongBuzz();
            w.floats.spawn(m.x, m.y - 36, '! 警戒追擊', 'crit');
            setMapToast(`⚠️ 遭到「${m.name}」發現！敵人正高速追擊！`);
          } else if (m.alerted && distToPlayer > visionRadius * 1.85) {
            m.alerted = false;
          }

          if (m.alerted && distToPlayer > 8) {
            m.facingAngle = angleToPlayer;
            m.x += (toPx / distToPlayer) * m.chaseSpeed * dt;
            m.y += (toPy / distToPlayer) * m.chaseSpeed * dt;
          } else {
            m.angle += dt * (m.kind === 'boss' ? 0.72 : 1.08);
            const patrolX = homeScaledX + Math.cos(m.angle) * (m.kind === 'boss' ? 36 : 52);
            const patrolY = homeScaledY + Math.sin(m.angle * 1.35) * 26;
            const vx = patrolX - m.x;
            const vy = patrolY - m.y;
            if (Math.hypot(vx, vy) > 1) {
              m.facingAngle = Math.atan2(vy, vx);
              m.x += vx * Math.min(1, dt * 3.5);
              m.y += vy * Math.min(1, dt * 3.5);
            }
          }

          if (Math.hypot(w.playerX - m.x, w.playerY - m.y) < 48) {
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
          onDiscoverMonster?.(
            w.pendingMonster.kind === 'boss'
              ? 'bst_ink_boss'
              : w.pendingMonster.kind === 'slime'
                ? 'bst_ink_golem'
                : 'bst_ink_moth'
          );
          sealedSkillRef.current = null;
          setSealedSkill(null);
          setBattleEnemyUi({
            name: w.pendingMonster.name,
            kind: w.pendingMonster.kind,
            hp: w.pendingMonster.hp,
            maxHp: w.pendingMonster.maxHp,
            shielded: w.pendingMonster.shielded,
            waveCurrent: w.pendingMonster.waveCurrent,
            wavesTotal: w.pendingMonster.wavesTotal,
            isStageBoss: w.pendingMonster.isStageBoss,
          });
          w.atb = [100, 82, 70];
          w.enemyAtb = 0;
          w.floats = new FloatingTextPool(48);
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

          // Enemy ATB + 「錯字封印」 Skill Seal Attack (Adventure mode)
          if (playMode === 'adventure' && freezeRef.current <= 0 && battleEnemyRef.current && battleEnemyRef.current.hp > 0) {
            const enemySpeed =
              battleEnemyRef.current.kind === 'boss'
                ? 14
                : battleEnemyRef.current.kind === 'slime'
                  ? 11.5
                  : 10;
            w.enemyAtb += enemySpeed * dt;
            if (w.enemyAtb >= 100) {
              w.enemyAtb = 0;
              const dmg =
                battleEnemyRef.current.kind === 'boss'
                  ? 22
                  : battleEnemyRef.current.kind === 'slime'
                    ? 16
                    : 13;
              w.heroHitFlash = 0.9;
              triggerGameFeel(w.feel, { shake: 0.42 });
              soundEngine.playWrongBuzz();
              partyHpRef.current = Math.max(0, partyHpRef.current - dmg);
              setPartyHp(partyHpRef.current);

              // Inflict 「錯字封印」 sealing either slash or radical until cleansed by 印璽醫者!
              const toSeal: 'slash' | 'radical' = Math.random() < 0.5 ? 'slash' : 'radical';
              sealedSkillRef.current = toSeal;
              setSealedSkill(toSeal);

              w.floats.spawn(
                w.width * 0.25,
                w.height * 0.42,
                `-${dmg}`,
                'crit',
                `錯字封印・鎖定${toSeal === 'slash' ? '墨痕斬' : '拼字陣'}！`
              );
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

        // Zone 3: Ancient Crimson-Gold Ink Altar (Boss Sanctuary at far right)
        const altarX = W * 0.86;
        const altarY = H * 0.38;
        ctx.save();
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.42)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(altarX, altarY, 72, 42, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.ellipse(altarX, altarY, 54, 30, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(127, 29, 29, 0.72)';
        ctx.font = '900 11px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('古墨祭壇・首領領域', altarX, altarY - 46);
        ctx.restore();

        // Zone 2: Ruined Scripture Pavilion landmark
        const pavX = W * 0.67;
        const pavY = H * 0.24;
        ctx.fillStyle = '#991B1B';
        ctx.beginPath();
        ctx.moveTo(pavX - 36, pavY);
        ctx.lineTo(pavX, pavY - 24);
        ctx.lineTo(pavX + 36, pavY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#78350F';
        ctx.fillRect(pavX - 24, pavY, 6, 26);
        ctx.fillRect(pavX + 18, pavY, 6, 26);

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

        // Translucent Red Sector Alert Vision Cones behind Monsters
        const coneR = Math.min(155, Math.max(105, W * 0.14));
        for (const m of w.monsters) {
          if (m.defeated) continue;
          ctx.save();
          const pulse = 0.5 + 0.5 * Math.sin(w.time * (m.alerted ? 14 : 4));
          const coneGrad = ctx.createRadialGradient(m.x, m.y, 12, m.x, m.y, coneR);
          if (m.alerted) {
            coneGrad.addColorStop(0, `rgba(220, 38, 38, ${0.46 + pulse * 0.16})`);
            coneGrad.addColorStop(1, 'rgba(244, 63, 94, 0.06)');
          } else {
            coneGrad.addColorStop(0, `rgba(239, 68, 68, ${0.26 + pulse * 0.08})`);
            coneGrad.addColorStop(1, 'rgba(239, 68, 68, 0.03)');
          }
          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.arc(m.x, m.y, coneR, m.facingAngle - 0.56, m.facingAngle + 0.56);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = m.alerted ? 'rgba(244, 63, 94, 0.85)' : 'rgba(239, 68, 68, 0.45)';
          ctx.lineWidth = m.alerted ? 2.5 : 1.5;
          ctx.stroke();
          ctx.restore();
        }

        // Patrolling Monsters (8 across 3 zones)
        for (const m of w.monsters) {
          if (m.defeated) continue;
          drawInkMonster(ctx, m.kind, m.x, m.y, w.time, {
            shielded: m.shielded,
            alerted: m.alerted,
            hpRatio: m.hp / m.maxHp,
            name: m.isStageBoss ? `👑 ${m.name}` : m.name,
            scale: m.isStageBoss ? 1.2 : 0.92,
          });
        }

        if(dt>0) movingRef.current=w.walkPhase!==walkBefore;
        // 3-Hero RO Party
        drawInkChibiHero(ctx, 'pandaHealer', w.trail[2].x, w.trail[2].y, w.time, {
          facing: w.facing,
          walkPhase: w.walkPhase,
          label: '印璽醫者',
          walking: movingRef.current,
          scale: 0.9,
        });
        drawInkChibiHero(ctx, 'craneMage', w.trail[1].x, w.trail[1].y, w.time, {
          facing: w.facing,
          walkPhase: w.walkPhase,
          label: '詩韻法師',
          walking: movingRef.current,
          scale: 0.92,
        });
        drawInkChibiHero(ctx, 'swordsman', w.trail[0].x, w.trail[0].y, w.time, {
          facing: w.facing,
          walkPhase: w.walkPhase,
          label: '墨劍士',
          appearance: appearanceRef.current,
          walking: movingRef.current,
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
        const shiftY = isPortrait ? 0 : 0;
        const heroScaleMul = isPortrait ? 0.84 : 1;

        ctx.strokeStyle = 'rgba(217, 119, 6, 0.32)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(W * 0.5, H * 0.56 + shiftY, W * 0.4, H * 0.16, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Freeze aura when Griffin skill active
        if (freezeRef.current > 0) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fillRect(0, 0, W, H);
        }

        // Dash offset for attacking hero
        const dashOffset = Math.sin(w.heroDash * Math.PI) * (W * 0.32);

        // 3 Heroes in classic RO staggered formation (extra vertical clearance on Portrait)
        drawHeroClassAura(
          ctx,
          isPortrait ? W * 0.28 : W * 0.25,
          isPortrait ? H * 0.52 : H * 0.56,
          w.time,
          playerStats.heroClassBranch,
          playerStats.heroTier
        );
        drawInkChibiHero(
          ctx,
          'swordsman',
          (isPortrait ? W * 0.31 : W * 0.27) + (w.heroAttackRole === 'swordsman' ? dashOffset : 0),
          isPortrait ? H * 0.27 : H * 0.44,
          w.time,
          {
            facing: 1,
            attackProgress: w.heroAttackRole === 'swordsman' ? w.heroDash : 0,
            hitFlash: w.heroHitFlash,
            label: '墨劍士',
            appearance: appearanceRef.current,
            scale: 1.18 * heroScaleMul,
          }
        );
        drawInkChibiHero(
          ctx,
          'craneMage',
          (isPortrait ? W * 0.14 : W * 0.17) + (w.heroAttackRole === 'craneMage' ? dashOffset * 0.5 : 0),
          isPortrait ? H * 0.5 : H * 0.52,
          w.time,
          {
            facing: 1,
            attackProgress: w.heroAttackRole === 'craneMage' ? w.heroDash : 0,
            hitFlash: w.heroHitFlash,
            label: '詩韻法師',
          walking: movingRef.current,
            scale: 1.12 * heroScaleMul,
          }
        );
        if (playerCount >= 4) {
          drawInkChibiHero(ctx, 'mage', W * 0.14, isPortrait ? H * 0.74 : H * 0.62, w.time + 1.2, {
            facing: 1,
            hitFlash: w.heroHitFlash,
            label: '4P文曲',
            scale: 0.96 * heroScaleMul,
          });
        }
        drawInkChibiHero(
          ctx,
          'pandaHealer',
          (isPortrait ? W * 0.31 : W * 0.26) + (w.heroAttackRole === 'pandaHealer' ? dashOffset * 0.5 : 0),
          isPortrait ? H * 0.73 : H * 0.62,
          w.time,
          {
            facing: 1,
            attackProgress: w.heroAttackRole === 'pandaHealer' ? w.heroDash : 0,
            hitFlash: w.heroHitFlash,
            label: '印璽醫者',
          walking: movingRef.current,
            scale: 1.12 * heroScaleMul,
          }
        );

        // Enemy on right
        const enemy = battleEnemyRef.current;
        if (enemy) {
          drawInkMonster(ctx, enemy.kind, isPortrait ? W * 0.74 : W * 0.72, H * 0.5, w.time, {
            hitFlash: w.enemyHitFlash,
            shielded: enemy.shielded,
            hpRatio: enemy.hp / enemy.maxHp,
            name: enemy.name,
            scale: (enemy.kind === 'boss' ? 1.85 : 1.5) * heroScaleMul,
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

  // Auto-dismiss map toast after 1.8s
  useEffect(() => {
    if (!mapToast) return;
    const t = window.setTimeout(() => setMapToast(null), 1800);
    return () => clearTimeout(t);
  }, [mapToast]);

  // Trigger Roguelike 3-card Awakening mid-stage
  const relicTriggeredRef = useRef(false);
  useEffect(() => {
    if (!relicTriggeredRef.current && monstersLeft <= 5 && monstersLeft > 0) {
      relicTriggeredRef.current = true;
      setRelicChoices(rollRoguelikeChoices(4));
      setRelicModalOpen(true);
    }
  }, [monstersLeft]);

  // Switch Gamepad A/B/X/Y skill & answer selection during battle
  useEffect(() => {
    if (phase !== 'battle' || paused || relicModalOpen) return;
    const id = window.setInterval(() => {
      const snap = gamepadManager.poll();
      for (const p of snap.players) {
        if (!p.connected) continue;
        if (!activeSkill) {
          if (p.justPressed.confirm && atbValues[0] >= 99 && sealedSkill !== 'slash') openSkillChallenge('slash');
          if (p.justPressed.cancel && atbValues[1] >= 99 && sealedSkill !== 'radical') openSkillChallenge('radical');
          if (p.justPressed.skill1 && atbValues[2] >= 99) openSkillChallenge('typo');
          if ((p.justPressed.skill2 || p.justPressed.ult) && ultCharge >= 100) handleTriggerUltimate();
        } else if (currentQ?.payload.mode === 'slash') {
          const payload = currentQ.payload as ChineseSlashPayload;
          const mult = 1.15 * computeClassDamageBonus(playerStats.heroClassId, combo, combo >= 3) * relicBonusRef.current;
          if (p.justPressed.confirm) applyPlayerDamageToEnemy(mult, 'slash', 0 === payload.correctIndex, currentQ);
          if (p.justPressed.cancel) applyPlayerDamageToEnemy(mult, 'slash', 1 === payload.correctIndex, currentQ);
          if (p.justPressed.skill1) applyPlayerDamageToEnemy(mult, 'slash', 2 === payload.correctIndex, currentQ);
          if (p.justPressed.skill2) applyPlayerDamageToEnemy(mult, 'slash', 3 === payload.correctIndex, currentQ);
        }
        break;
      }
    }, 85);
    return () => clearInterval(id);
  }, [activeSkill, applyPlayerDamageToEnemy, atbValues, combo, currentQ, handleTriggerUltimate, openSkillChallenge, paused, phase, playerStats.heroClassId, relicModalOpen, sealedSkill, ultCharge]);

  const classBonusMult = computeClassDamageBonus(playerStats.heroClassId, combo, combo >= 3) * relicBonusRef.current;

  return (
    <div
      className="game-screen game-screen-chinese w-screen h-[100dvh] flex flex-col overflow-hidden bg-emerald-950 text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      data-testid="ink-rpg-engine"
    >
      {/* Tier 1: Single-Row Compact HUD (h-12 shrink-0, zero overlap!) */}
      <header className="game-hud h-12 shrink-0 px-2.5 bg-slate-900/95 border-b border-amber-400/35 flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-black text-amber-300 truncate max-w-[110px] sm:max-w-none">
            {stageConfig
              ? `🖌️ ${stageConfig.chapterIndex}-${stageConfig.stageNumber}關`
              : `🖌️ 墨靈幻境(${grade}年)`}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-12 sm:w-20 h-2 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-transform origin-left"
                style={{ transform: `scaleX(${Math.max(0, partyHp / playerStats.maxHp)})` }}
              />
            </div>
            <span className="text-[11px] font-black text-white font-mono-num">{partyHp}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-black shrink-0">
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 font-mono-num">
            妖{monstersLeft}/8
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-200 font-mono-num">
            {combo}連
          </span>
          {freezeTimer > 0 && (
            <span className="px-1.5 py-0.5 rounded-lg bg-sky-600 text-white text-[10px]">
              ❄️{freezeTimer}s
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
        {/* Tier 2: Pure Unobstructed Ink RPG Canvas Stage */}
        <div className="game-stage relative h-[44dvh] shrink-0 landscape:h-full landscape:w-[54%] bg-emerald-950 border-b landscape:border-b-0 landscape:border-r border-amber-400/25 overflow-hidden">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="block w-full h-full cursor-pointer"
            data-testid="ink-rpg-canvas"
          />
          {mapToast && phase === 'explore' && (
            <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 max-w-[92%] px-3 py-1 rounded-full bg-slate-950/90 border border-amber-400/70 text-amber-100 text-xs font-black truncate shadow-lg">
              {mapToast}
            </div>
          )}
        </div>

        {/* Tier 3: Independent Explore Joystick OR Battle ATB Skills & 3-Mode Chinese Answer Dock */}
        <div className="game-controls flex-1 min-h-0 landscape:w-[46%] overflow-y-auto p-2.5 sm:p-3 bg-slate-900/95 flex flex-col justify-between gap-2">
          {/* Explore Phase Controls */}
          {phase === 'explore' && (
            <div className="flex-1 flex flex-col justify-between gap-3">
              <div className="rounded-2xl bg-slate-950/85 border border-amber-400/30 p-3 text-xs text-slate-200 flex items-center justify-between gap-2">
                <span className="font-bold truncate">
                  🗺️ 滑動搖桿或點擊上方地圖移動・剩餘 {monstersLeft} 隻墨妖（{playerCount}P）
                </span>
                <button
                  type="button"
                  disabled={guardianUsed}
                  onClick={handleGuardianSkill}
                  className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] border shrink-0 flex items-center gap-1 ${
                    guardianUsed
                      ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-300 border-amber-200 text-slate-950'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> {guardian.activeName}
                </button>
              </div>

              <div className="flex items-center justify-around gap-4 py-1 flex-1">
                {/* Virtual Touch Joystick OUTSIDE Canvas */}
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
                  className="relative w-28 h-28 rounded-full bg-slate-950 border-2 border-amber-300/60 flex items-center justify-center touch-none select-none shadow-xl shrink-0"
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

                <div className="flex flex-col gap-2 flex-1 max-w-[220px]">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.hapticPulse(12);
                      guideToNearestMonster();
                    }}
                    className="min-h-[54px] px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95"
                  >
                    <Compass className="w-5 h-5 shrink-0" /> 自動尋路迎戰
                  </button>
                  <div className="text-[11px] text-center text-slate-400 font-bold">
                    支援方向鍵 / WASD / Switch 搖桿
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Battle Phase: ATB Skill Deck */}
          {phase === 'battle' && !activeSkill && battleEnemyUi && (
            <div className="flex-1 flex flex-col justify-between gap-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5 px-1">
                <div className="text-xs font-black text-amber-200 flex flex-wrap items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px]">
                    波 {battleEnemyUi.waveCurrent}/{battleEnemyUi.wavesTotal}
                  </span>
                  <span>{battleEnemyUi.name}</span>
                  <span className="font-mono-num text-rose-300">
                    HP {battleEnemyUi.hp}/{battleEnemyUi.maxHp}
                  </span>
                  {battleEnemyUi.shielded && (
                    <span className="text-sky-300 inline-flex items-center gap-0.5 text-[10px]">
                      <Shield className="w-3 h-3" /> 護盾
                    </span>
                  )}
                  {sealedSkill && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-400 text-rose-200 text-[10px]">
                      🔒 錯字封印
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={ultCharge < 100}
                  onClick={handleTriggerUltimate}
                  className={`min-h-[34px] px-3 rounded-xl font-black text-xs flex items-center gap-1 ${
                    ultCharge >= 100
                      ? 'bg-rose-500 hover:bg-rose-400 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> 萬墨歸宗 ({ultCharge}%)
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 flex-1">
                <button
                  type="button"
                  disabled={atbValues[0] < 99 || sealedSkill === 'slash'}
                  onClick={() => openSkillChallenge('slash')}
                  className={`min-h-[54px] rounded-xl p-2.5 border-2 text-left transition-transform active:scale-95 ${
                    sealedSkill === 'slash'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 cursor-not-allowed'
                      : atbValues[0] >= 99
                        ? 'bg-amber-500/20 border-amber-400 hover:bg-amber-500/30 text-white'
                        : 'bg-slate-800/70 border-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                    <span className="flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-amber-300" /> [A] 墨痕斬・成語快斬
                    </span>
                    <span className="font-mono-num text-amber-300">
                      {sealedSkill === 'slash' ? '🔒 封印' : `${atbValues[0]}%`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${atbValues[0]}%` }} />
                  </div>
                </button>

                <button
                  type="button"
                  disabled={atbValues[1] < 99 || sealedSkill === 'radical'}
                  onClick={() => openSkillChallenge('radical')}
                  className={`min-h-[54px] rounded-xl p-2.5 border-2 text-left transition-transform active:scale-95 ${
                    sealedSkill === 'radical'
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 cursor-not-allowed'
                      : atbValues[1] >= 99
                        ? 'bg-sky-500/20 border-sky-400 hover:bg-sky-500/30 text-white'
                        : 'bg-slate-800/70 border-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                    <span className="flex items-center gap-1.5">
                      <Wand2 className="w-4 h-4 text-sky-300" /> [B] 部件拼字法陣・合體大字
                    </span>
                    <span className="font-mono-num text-sky-300">
                      {sealedSkill === 'radical' ? '🔒 封印' : `${atbValues[1]}%`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-sky-400" style={{ width: `${atbValues[1]}%` }} />
                  </div>
                </button>

                <button
                  type="button"
                  disabled={atbValues[2] < 99}
                  onClick={() => openSkillChallenge('typo')}
                  className={`min-h-[54px] rounded-xl p-2.5 border-2 text-left transition-transform active:scale-95 ${
                    atbValues[2] >= 99
                      ? sealedSkill
                        ? 'bg-emerald-500/35 border-emerald-300 text-white'
                        : 'bg-emerald-500/20 border-emerald-400 hover:bg-emerald-500/30 text-white'
                      : 'bg-slate-800/70 border-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-300" /> [X] 破邪斬句・解封破盾
                    </span>
                    <span className="font-mono-num text-emerald-300">{atbValues[2]}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${atbValues[2]}%` }} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Battle Phase: 3 Distinct Chinese Answer Mechanics (Zero Canvas Occlusion!) */}
          {phase === 'battle' && activeSkill && currentQ && (
            <div className="rounded-2xl bg-slate-950/95 border-2 border-amber-400 p-3 flex-1 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-black text-amber-300 truncate">
                  {activeSkill === 'slash' && '【墨痕斬】快速辨識語文奧義'}
                  {activeSkill === 'radical' && '【部件拼字】點選 2 個部首組成漢字'}
                  {activeSkill === 'typo' && '【破邪斬句】點擊石碑中的錯別字！'}
                </div>
                <button
                  type="button"
                  onClick={() => soundEngine.speakText(currentQ.prompt, 'zh-TW')}
                  aria-label="朗讀題目"
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" /> 朗讀
                </button>
              </div>

              <div className="text-sm sm:text-base font-black text-white leading-snug">
                {currentQ.prompt}
              </div>

              {currentQ.payload.mode === 'slash' && (
                <div className="grid grid-cols-2 gap-2">
                  {(currentQ.payload as ChineseSlashPayload).options.map((opt, idx) => {
                    const padKeys = ['A', 'B', 'X', 'Y'];
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          soundEngine.hapticPulse(14);
                          applyPlayerDamageToEnemy(
                            1.15 * classBonusMult,
                            'slash',
                            idx === (currentQ.payload as ChineseSlashPayload).correctIndex,
                            currentQ
                          );
                        }}
                        className="min-h-[48px] rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-slate-600 text-white font-black text-sm px-3 flex items-center gap-2 transition-all active:scale-95"
                      >
                        <span className="w-5 h-5 rounded bg-white/15 text-amber-300 text-[10px] flex items-center justify-center shrink-0">
                          {padKeys[idx]}
                        </span>
                        <span className="truncate">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.payload.mode === 'radical' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 py-1.5 rounded-xl bg-slate-900 border border-amber-400/40">
                    <div className="w-10 h-10 rounded-lg border border-dashed border-amber-400 flex items-center justify-center text-lg font-black text-amber-300">
                      {selectedRadicals[0] ?? '？'}
                    </div>
                    <span className="text-lg font-black text-amber-400">＋</span>
                    <div className="w-10 h-10 rounded-lg border border-dashed border-amber-400 flex items-center justify-center text-lg font-black text-amber-300">
                      {selectedRadicals[1] ?? '？'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {(currentQ.payload as ChineseRadicalPayload).pool.map((part) => {
                      const active = selectedRadicals.includes(part);
                      return (
                        <button
                          key={part}
                          type="button"
                          onClick={() => handleRadicalPick(part)}
                          className={`min-w-[52px] min-h-[52px] rounded-xl text-xl font-black border-2 transition-transform active:scale-90 ${
                            active
                              ? 'bg-amber-400 border-amber-100 text-slate-950 scale-105'
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

              {currentQ.payload.mode === 'typo' && (
                <div className="rounded-xl bg-stone-800 border border-stone-500 p-2.5 flex flex-wrap items-center justify-center gap-1.5">
                  {(currentQ.payload as ChineseTypoPayload).sentence.split('').map((ch, idx) => {
                    const isPunc = ch === '，' || ch === '。' || ch === '！' || ch === '？';
                    if (isPunc) {
                      return (
                        <span key={idx} className="text-lg font-black text-stone-300 px-0.5">
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
                            1.35 * classBonusMult,
                            'typo',
                            idx === (currentQ.payload as ChineseTypoPayload).typoIndex,
                            currentQ
                          );
                        }}
                        className="min-w-[42px] min-h-[44px] rounded-xl bg-stone-700 hover:bg-rose-500 border border-stone-400 text-white text-lg font-black transition-transform active:scale-90"
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {bossWarning && stageConfig?.tier === 'boss' && (
        <div className="fixed inset-x-0 top-14 z-30 pointer-events-none flex justify-center px-4">
          <div className="rounded-full bg-rose-950/95 border border-amber-400 px-4 py-1.5 text-center shadow-lg">
            <span className="text-xs font-black text-amber-200">
              ⚠️ 大魔王現身：{stageConfig.enemyName}
            </span>
          </div>
        </div>
      )}

      <RoguelikeCardModal
        open={relicModalOpen}
        title="🌟 墨靈幻境覺醒・選擇戰術遺物"
        choices={relicChoices}
        onPick={(relic) => {
          setRelicModalOpen(false);
          if (relic.id === 'golden_aegis' || relic.id === 'wisdom_drain') {
            partyHpRef.current = Math.min(playerStats.maxHp, partyHpRef.current + Math.round(playerStats.maxHp * 0.35));
            setPartyHp(partyHpRef.current);
          } else if (relic.id === 'chain_lightning' || relic.id === 'absolute_zero') {
            setUltCharge(100);
          } else {
            relicBonusRef.current = Number((relicBonusRef.current + 0.22).toFixed(2));
          }
        }}
      />

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
