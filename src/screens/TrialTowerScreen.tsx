import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Flame, Shield, Sparkles, Trophy, Volume2, Zap } from 'lucide-react';
import { EliteAffixId, PvPQuestionCard, SubjectId } from '../types/game';
import { useGameState } from '../core/GameStateContext';
import { getPvPMixedQuestions } from '../data/questionBank';
import {
  ELITE_AFFIXES,
  HERO_CLASSES,
  RoguelikeRelicDef,
  rollEliteAffixes,
  rollRoguelikeChoices,
} from '../data/heroProgression';
import { computeClassDamageBonus } from '../core/combatMath';
import {
  drawDarkGluttonBoss,
  drawHeroClassAura,
  drawInkChibiHero,
  drawInkMonster,
  drawMathZombie,
  ParticlePool,
} from '../canvas/proceduralArt';
import { RoguelikeCardModal } from '../components/RoguelikeCardModal';
import { gamepadManager } from '../core/gamepadManager';
import { soundEngine } from '../audio/soundEngine';

interface TrialTowerScreenProps {
  onExit: () => void;
}

const SUBJECT_LABELS: Record<SubjectId, { name: string; color: string; bg: string }> = {
  chinese: { name: '國語文', color: '#F43F5E', bg: 'bg-rose-500/20 text-rose-200 border-rose-400/40' },
  english: { name: '英語文', color: '#38BDF8', bg: 'bg-sky-500/20 text-sky-200 border-sky-400/40' },
  math: { name: '數學', color: '#F59E0B', bg: 'bg-amber-500/20 text-amber-200 border-amber-400/40' },
  science: { name: '自然科學', color: '#10B981', bg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' },
};

export const TrialTowerScreen: React.FC<TrialTowerScreenProps> = ({ onExit }) => {
  const { save, combatStats, applyTowerResult, recordDiscoveredMonster } = useGameState();
  const [floor, setFloor] = useState(1);
  const [heroHp, setHeroHp] = useState(combatStats.maxHp);
  const [maxEnemyHp, setMaxEnemyHp] = useState(180);
  const [enemyHp, setEnemyHp] = useState(180);
  const [enemyShield, setEnemyShield] = useState(2);
  const [combo, setCombo] = useState(0);
  const [ultCharge, setUltCharge] = useState(0);
  const [affixes, setAffixes] = useState<EliteAffixId[]>([]);
  const [bossPhase2, setBossPhase2] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12 + combatStats.thinkTimeBonusSec);
  const [toast, setToast] = useState<string | null>(null);
  const [relicBonusAtk, setRelicBonusAtk] = useState(1);
  const [relicChoices, setRelicChoices] = useState<RoguelikeRelicDef[]>([]);
  const [relicModalOpen, setRelicModalOpen] = useState(false);
  const [gameOver, setGameOver] = useState<{
    floorReached: number;
    coins: number;
    xp: number;
    badges: number;
    crystals: number;
    isNewRecord: boolean;
  } | null>(null);

  const deck = useMemo(
    () => getPvPMixedQuestions(save.grade, 'all', Date.now() % 99991),
    [save.grade]
  );
  const [qIdx, setQIdx] = useState(0);
  const currentQ: PvPQuestionCard | null = deck[qIdx % Math.max(1, deck.length)] ?? null;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef(new ParticlePool(180));
  const fxStateRef = useRef({ heroSwing: 0, enemyFlash: 0, heroFlash: 0, shockwave: 0 });
  const playerCount = save.playerCount ?? 1;

  const isGuardianLordFloor = floor % 5 === 0;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // Setup enemy stats per floor
  const initFloor = useCallback(
    (nextFloor: number) => {
      const isLord = nextFloor % 5 === 0;
      const baseHp = Math.round((150 + nextFloor * 52) * (isLord ? 1.55 : 1));
      setMaxEnemyHp(baseHp);
      setEnemyHp(baseHp);
      setBossPhase2(false);
      const rolled = isLord
        ? rollEliteAffixes(8, nextFloor)
        : nextFloor >= 2
          ? rollEliteAffixes(Math.min(10, nextFloor + 1), nextFloor)
          : [];
      setAffixes(rolled);
      setEnemyShield(isLord || rolled.includes('void_shield') ? 2 : 1);
      const mindPenalty = rolled.includes('mind_pressure') ? -2 : 0;
      setTimeLeft(Math.max(7, 12 + combatStats.thinkTimeBonusSec + mindPenalty));
      if (isLord) {
        recordDiscoveredMonster(nextFloor >= 10 ? 'bst_tower_emperor' : 'bst_tower_warden');
      }
    },
    [combatStats.thinkTimeBonusSec, recordDiscoveredMonster]
  );

  useEffect(() => {
    initFloor(1);
  }, [initFloor]);

  const finishTowerRun = useCallback(
    (finalFloor: number, finalCorrect: number, finalAttempts: number) => {
      const clearedFloors = Math.max(0, finalFloor - 1);
      const coins = 80 + clearedFloors * 45 + finalCorrect * 14;
      const xp = 60 + clearedFloors * 38 + finalCorrect * 16;
      const badges = Math.max(1, Math.floor(clearedFloors / 2) + (clearedFloors >= 5 ? 3 : 0));
      const crystals = Math.floor(clearedFloors / 3) + 1;
      const outcome = applyTowerResult({
        floorReached: Math.max(1, clearedFloors),
        correctCount: finalCorrect,
        totalAttempts: finalAttempts,
        coinsEarned: coins,
        xpEarned: xp,
        badgesEarned: badges,
        crystalsEarned: crystals,
      });
      setGameOver({
        floorReached: Math.max(1, clearedFloors),
        coins,
        xp,
        badges,
        crystals,
        isNewRecord: outcome.isNewRecord,
      });
    },
    [applyTowerResult]
  );

  const handleEnemyCounterAttack = useCallback(
    (reason: string) => {
      soundEngine.playWrongBuzz();
      fxStateRef.current.heroFlash = 1;
      setCombo(0);
      const dmgRaw = Math.round((20 + floor * 3.5) * (bossPhase2 ? 1.35 : 1) * (1 - combatStats.shieldMitigation));
      const dmg = Math.max(10, dmgRaw);
      showToast(`${reason} 受到 ${dmg} 傷害！`);
      setHeroHp((prev) => {
        const next = Math.max(0, prev - dmg);
        if (next <= 0) {
          finishTowerRun(floor, correctCount, totalAttempts + 1);
        }
        return next;
      });
      setQIdx((n) => n + 1);
      setTimeLeft(Math.max(7, 12 + combatStats.thinkTimeBonusSec));
    },
    [bossPhase2, combatStats.shieldMitigation, combatStats.thinkTimeBonusSec, correctCount, finishTowerRun, floor, showToast, totalAttempts]
  );

  // Question countdown timer
  useEffect(() => {
    if (gameOver || relicModalOpen) return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.2) {
          handleEnemyCounterAttack('⏳ 倒數歸零！領主發動反擊！');
          return Math.max(7, 12 + combatStats.thinkTimeBonusSec);
        }
        return Number((t - 0.2).toFixed(1));
      });
    }, 200);
    return () => clearInterval(id);
  }, [combatStats.thinkTimeBonusSec, gameOver, handleEnemyCounterAttack, relicModalOpen]);

  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      if (!currentQ || gameOver || relicModalOpen) return;
      setTotalAttempts((n) => n + 1);
      const isCorrect = choiceIndex === currentQ.correctIndex;
      if (!isCorrect) {
        handleEnemyCounterAttack(`❌ 正解是「${currentQ.answer}」`);
        return;
      }

      soundEngine.playCorrectChord(combo + 1);
      fxStateRef.current.heroSwing = 1;
      fxStateRef.current.enemyFlash = 1;
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setCorrectCount((c) => c + 1);
      setUltCharge((u) => Math.min(100, u + 26 + combatStats.ultChargeBonus));

      // Damage formula with class multiplier & shield break
      const classMult = computeClassDamageBonus(
        combatStats.heroClassId,
        nextCombo,
        nextCombo >= 3
      );
      const isMindBonus = affixes.includes('mind_pressure') ? 1.5 : 1;
      const shieldBreak = enemyShield > 0;
      const dmg = Math.round(
        combatStats.baseAttack *
          (shieldBreak ? 0.85 : 1.35) *
          classMult *
          relicBonusAtk *
          isMindBonus *
          (playerCount > 1 ? 1 + (playerCount - 1) * 0.12 : 1)
      );

      if (shieldBreak) {
        setEnemyShield((s) => Math.max(0, s - 1));
      }

      particlesRef.current.burst(280, 120, 18, ['#FDE047', '#38BDF8', '#F43F5E', '#A855F7'], 80, 240, 6, 'spark');

      setEnemyHp((prev) => {
        const nextHp = Math.max(0, prev - dmg);
        if (nextHp > 0 && nextHp <= maxEnemyHp * 0.5 && !bossPhase2 && isGuardianLordFloor) {
          setBossPhase2(true);
          soundEngine.playUltimateRoar();
          showToast('🔥 守門領主進入【二階段狂暴】！攻防倍增！');
        } else if (nextHp > 0) {
          showToast(`⚡ ${HERO_CLASSES[combatStats.heroClassId].name} 斬擊 -${dmg}！${shieldBreak ? '破盾！' : ''}`);
        } else {
          soundEngine.playVictoryFanfare();
          const nextFloor = floor + 1;
          setFloor(nextFloor);
          setHeroHp((h) => Math.min(combatStats.maxHp, h + Math.round(combatStats.maxHp * 0.16)));
          initFloor(nextFloor);
          showToast(`🏆 突破第 ${floor} 層！前進第 ${nextFloor} 層！`);
          if (floor % 2 === 0) {
            setRelicChoices(rollRoguelikeChoices(floor));
            setRelicModalOpen(true);
          }
        }
        return nextHp;
      });

      setQIdx((n) => n + 1);
      setTimeLeft(Math.max(7, 12 + combatStats.thinkTimeBonusSec));
    },
    [
      affixes,
      bossPhase2,
      combatStats.baseAttack,
      combatStats.heroClassId,
      combatStats.maxHp,
      combatStats.thinkTimeBonusSec,
      combatStats.ultChargeBonus,
      combo,
      currentQ,
      enemyShield,
      floor,
      gameOver,
      handleEnemyCounterAttack,
      initFloor,
      isGuardianLordFloor,
      maxEnemyHp,
      playerCount,
      relicBonusAtk,
      relicModalOpen,
      showToast,
    ]
  );

  const handleCastUltimate = useCallback(() => {
    if (ultCharge < 100 || gameOver || relicModalOpen) return;
    soundEngine.playUltimateRoar();
    setUltCharge(0);
    fxStateRef.current.shockwave = 1;
    fxStateRef.current.enemyFlash = 1;
    setEnemyShield(0);
    const tamerBoost = combatStats.heroClassId === 'beast_sovereign' ? 1.5 : 1;
    const dmg = Math.round(combatStats.baseAttack * 3.4 * relicBonusAtk * tamerBoost);
    particlesRef.current.burst(260, 110, 32, ['#FDE047', '#38BDF8', '#C084FC', '#FFFFFF'], 110, 320, 7, 'spark');
    setEnemyHp((prev) => {
      const next = Math.max(0, prev - dmg);
      if (next <= 0) {
        const nextFloor = floor + 1;
        setFloor(nextFloor);
        initFloor(nextFloor);
        showToast(`🌟 智光合體無雙斬殺！突破第 ${floor} 層！`);
      } else {
        showToast(`🌟 無雙奧義破盾轟炸 -${dmg}！`);
      }
      return next;
    });
  }, [combatStats.baseAttack, combatStats.heroClassId, floor, gameOver, initFloor, relicBonusAtk, relicModalOpen, showToast, ultCharge]);

  // Switch Gamepad A/B/X/Y answer & L+R Ultimate
  useEffect(() => {
    if (gameOver || relicModalOpen) return;
    const id = window.setInterval(() => {
      const snap = gamepadManager.poll();
      for (const p of snap.players) {
        if (!p.connected) continue;
        if (p.justPressed.confirm) handleAnswer(0);
        if (p.justPressed.cancel) handleAnswer(1);
        if (p.justPressed.skill1) handleAnswer(2);
        if (p.justPressed.skill2) handleAnswer(3);
        if (p.justPressed.ult) handleCastUltimate();
        break;
      }
    }, 75);
    return () => clearInterval(id);
  }, [gameOver, handleAnswer, handleCastUltimate, relicModalOpen]);

  // 60FPS Pure Anime Battle Arena Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(300, rect.width);
      const h = Math.max(180, rect.height);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(dpr, dpr);

        // Starry Astral Tower Backdrop
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, bossPhase2 ? '#2A0A1E' : '#0B1026');
        bg.addColorStop(0.6, bossPhase2 ? '#4C0D2F' : '#1E1B4B');
        bg.addColorStop(1, '#0F172A');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Tower stone floor + runes
        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        ctx.fillRect(0, h * 0.72, w, h * 0.28);
        ctx.strokeStyle = bossPhase2 ? 'rgba(244, 63, 94, 0.5)' : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.72);
        ctx.lineTo(w, h * 0.72);
        ctx.stroke();

        fxStateRef.current.heroSwing = Math.max(0, fxStateRef.current.heroSwing - dt * 3);
        fxStateRef.current.enemyFlash = Math.max(0, fxStateRef.current.enemyFlash - dt * 4);
        fxStateRef.current.heroFlash = Math.max(0, fxStateRef.current.heroFlash - dt * 3);
        fxStateRef.current.shockwave = Math.max(0, fxStateRef.current.shockwave - dt * 2.2);

        const heroX = w * 0.24 + fxStateRef.current.heroSwing * 28;
        const heroY = h * 0.62;
        const enemyX = w * 0.74;
        const enemyY = h * 0.56;

        // Hero Class Aura + Tier 4 Golden Wings
        drawHeroClassAura(ctx, heroX, heroY - 6, t, combatStats.heroClassBranch, combatStats.heroTier);

        // Draw 1..4 Co-op Anime Heroes
        for (let p = playerCount - 1; p >= 0; p--) {
          const ox = -p * 26;
          const oy = p % 2 === 1 ? -14 : 8;
          drawInkChibiHero(
            ctx,
            p % 2 === 0 ? 'swordsman' : 'craneMage',
            heroX + ox,
            heroY + oy,
            t + p * 0.6,
            {
              facing: 1,
              attackProgress: fxStateRef.current.heroSwing,
              hitFlash: fxStateRef.current.heroFlash,
              label: `${p + 1}P`,
              scale: p === 0 ? 1 : 0.86,
            }
          );
        }

        // Draw Floor Enemy / Dual-Affix Guardian Lord
        if (isGuardianLordFloor) {
          drawDarkGluttonBoss(
            ctx,
            enemyX,
            enemyY,
            t,
            enemyHp / Math.max(1, maxEnemyHp),
            fxStateRef.current.enemyFlash > 0 ? 1 : 0
          );
        } else if (floor % 2 === 0) {
          drawMathZombie(
            ctx,
            floor >= 6 ? 'fusion' : 'mage',
            enemyX,
            enemyY + 12,
            t,
            {
              hpRatio: enemyHp / Math.max(1, maxEnemyHp),
              armorRatio: enemyShield > 0 ? 1 : 0,
              hasBucket: false,
              jumpOffset: 0,
              chilled: false,
              hitFlash: fxStateRef.current.enemyFlash,
              formulaShield: enemyShield > 0 ? `🛡️×${enemyShield}` : null,
            }
          );
        } else {
          drawInkMonster(
            ctx,
            floor >= 4 ? 'slime' : 'poring',
            enemyX,
            enemyY + 4,
            t,
            {
              hpRatio: enemyHp / Math.max(1, maxEnemyHp),
              shielded: enemyShield > 0,
              hitFlash: fxStateRef.current.enemyFlash,
              scale: 1.15,
            }
          );
        }

        // Shockwave ring on Ultimate
        if (fxStateRef.current.shockwave > 0) {
          const p = 1 - fxStateRef.current.shockwave;
          ctx.strokeStyle = `rgba(253, 224, 71, ${fxStateRef.current.shockwave})`;
          ctx.lineWidth = 6 * fxStateRef.current.shockwave;
          ctx.beginPath();
          ctx.arc(w * 0.5, h * 0.55, 40 + p * w * 0.55, 0, Math.PI * 2);
          ctx.stroke();
        }

        particlesRef.current.update(dt);
        particlesRef.current.render(ctx);
        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bossPhase2, combatStats.heroClassBranch, combatStats.heroTier, enemyHp, enemyShield, floor, isGuardianLordFloor, maxEnemyHp, playerCount]);

  const handlePickRelic = (relic: RoguelikeRelicDef) => {
    setRelicModalOpen(false);
    if (relic.id === 'golden_aegis' || relic.id === 'wisdom_drain') {
      setHeroHp((h) => Math.min(combatStats.maxHp, h + Math.round(combatStats.maxHp * 0.4)));
    } else if (relic.id === 'blade_flurry' || relic.id === 'double_cast') {
      setRelicBonusAtk((m) => Number((m + 0.25).toFixed(2)));
    } else if (relic.id === 'chain_lightning') {
      setUltCharge(100);
    } else if (relic.id === 'absolute_zero') {
      setTimeLeft((t) => t + 4);
    } else {
      setRelicBonusAtk((m) => Number((m + 0.18).toFixed(2)));
    }
    showToast(`✨ 獲得覺醒遺物【${relic.name}】！`);
  };

  const subjMeta = currentQ ? SUBJECT_LABELS[currentQ.subject] : SUBJECT_LABELS.chinese;

  return (
    <div className="w-screen h-[100dvh] flex flex-col bg-slate-950 text-white overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Tier 1: Single-Row Compact HUD (h-12) */}
      <header className="h-12 shrink-0 px-2.5 bg-slate-900/95 border-b border-white/10 flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center shrink-0"
            aria-label="返回大廳"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-black text-amber-300 truncate">
            🗼 試煉之塔 第 {floor} 層 {isGuardianLordFloor ? '👑領主' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-black shrink-0">
          <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-200">
            ❤️ {heroHp}/{combatStats.maxHp}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200">
            🔥 {combo}連
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200">
            ⏳ {timeLeft.toFixed(0)}s
          </span>
        </div>
      </header>

      {/* Main Split: Portrait Top/Bottom | Landscape 54% Left / 46% Right */}
      <div className="flex-1 min-h-0 flex flex-col landscape:flex-row overflow-hidden">
        {/* Tier 2: Pure Unobstructed Anime Canvas Stage */}
        <div className="relative h-[36dvh] shrink-0 landscape:h-full landscape:w-[54%] bg-slate-950 border-b landscape:border-b-0 landscape:border-r border-white/10 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full block" />
          {/* Auto-dismissing single-line floating capsule toast (1.8s) */}
          {toast && (
            <div className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 max-w-[92%] px-3 py-1 rounded-full bg-slate-950/90 border border-amber-400/60 text-amber-200 text-xs font-black truncate shadow-lg">
              {toast}
            </div>
          )}
        </div>

        {/* Tier 3: Independent Bottom / Right Control & 108-Curriculum Quiz Panel */}
        <div className="flex-1 min-h-0 landscape:w-[46%] overflow-y-auto p-3 flex flex-col justify-between gap-2.5 bg-slate-900/95">
          {/* Enemy Status + Affixes + Ultimate Bar (lives OUTSIDE canvas!) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs font-black">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate text-rose-300">
                  {isGuardianLordFloor ? '👑 智光守門領主' : `第 ${floor} 層魔物`}
                  {bossPhase2 ? '【二階狂暴】' : ''}
                </span>
                {enemyShield > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/50 text-sky-200 text-[10px] shrink-0">
                    🛡️×{enemyShield}
                  </span>
                )}
              </div>
              <span className="text-slate-300 shrink-0">
                {enemyHp} / {maxEnemyHp}
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-200"
                style={{ width: `${Math.max(0, (enemyHp / Math.max(1, maxEnemyHp)) * 100)}%` }}
              />
            </div>
            {affixes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {affixes.map((ax) => (
                  <span
                    key={ax}
                    className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 border border-white/15 text-amber-200"
                  >
                    {ELITE_AFFIXES[ax].badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rotating 4-Subject Question Box */}
          {currentQ && (
            <div className="rounded-2xl bg-slate-950/90 border border-white/15 p-3 space-y-2.5 flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-black ${subjMeta.bg}`}>
                  {subjMeta.name}・{currentQ.knowledgeTag}
                </span>
                {currentQ.speakText && (
                  <button
                    type="button"
                    onClick={() => soundEngine.speakText(currentQ.speakText ?? '', currentQ.speakLang ?? 'zh-TW')}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> 朗讀
                  </button>
                )}
              </div>

              <div className="text-sm sm:text-base font-black text-white leading-snug">
                {currentQ.prompt}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {currentQ.options.slice(0, 4).map((opt, idx) => {
                  const padLabels = ['A', 'B', 'X', 'Y'];
                  return (
                    <button
                      key={`${currentQ.id}-${idx}`}
                      type="button"
                      onClick={() => handleAnswer(idx)}
                      className="min-h-[46px] px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600/80 active:scale-95 border border-white/15 text-left text-xs sm:text-sm font-black text-white flex items-center gap-2 transition"
                    >
                      <span className="w-5 h-5 rounded-md bg-white/15 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                        {padLabels[idx]}
                      </span>
                      <span className="line-clamp-2">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Ultimate & Quick Retreat Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCastUltimate}
              disabled={ultCharge < 100}
              className={`flex-1 min-h-[44px] rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition ${
                ultCharge >= 100
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 shadow-lg shadow-amber-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-white/10'
              }`}
            >
              <Zap className="w-4 h-4" />
              {ultCharge >= 100
                ? '🌟 施放智光合體無雙奧義！(L+R)'
                : `無雙充能 ${ultCharge}%（最高紀錄 ${save.towerBestFloor ?? 0} 層）`}
            </button>
            <button
              type="button"
              onClick={() => finishTowerRun(floor, correctCount, totalAttempts)}
              className="px-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-xs font-black text-slate-200 shrink-0"
            >
              結算領獎
            </button>
          </div>
        </div>
      </div>

      {/* Roguelike 3-Card Awakening */}
      <RoguelikeCardModal
        open={relicModalOpen}
        title={`🌟 第 ${floor} 層試煉覺醒・三選一遺物`}
        choices={relicChoices}
        onPick={handlePickRelic}
      />

      {/* Tower Result Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-400 p-5 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-slate-950">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-300">
                🗼 試煉之塔結算・第 {gameOver.floorReached} 層
              </h3>
              {gameOver.isNewRecord && (
                <div className="text-xs font-black text-emerald-300 mt-1 flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" /> 刷新個人最高層數紀錄！
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-black">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 text-amber-300">
                🪙 金幣 +{gameOver.coins}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 text-cyan-300">
                ✨ 經驗 +{gameOver.xp}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 text-indigo-300">
                🏅 進階徽章 +{gameOver.badges}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 text-fuchsia-300">
                💎 智光晶石 +{gameOver.crystals}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setGameOver(null);
                  setFloor(1);
                  setHeroHp(combatStats.maxHp);
                  setCombo(0);
                  setCorrectCount(0);
                  setTotalAttempts(0);
                  setRelicBonusAtk(1);
                  initFloor(1);
                }}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center gap-1"
              >
                <Flame className="w-4 h-4" /> 再次登塔
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onExit();
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-white font-black text-sm flex items-center justify-center gap-1"
              >
                <Shield className="w-4 h-4" /> 返回大廳
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
