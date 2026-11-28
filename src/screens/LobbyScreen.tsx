import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Coins,
  Compass,
  Gem,
  Hammer,
  Heart,
  ListChecks,
  Lock,
  LogIn,
  LogOut,
  Play,
  ShoppingBag,
  Sparkles,
  Star,
  Swords,
  Trophy,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  ActiveScreen,
  CampaignStageConfig,
  GradeLevel,
  GuardianId,
  SemesterId,
  SubjectId,
} from '../types/game';
import { useAuth } from '../auth/AuthContext';
import { useGameState } from '../core/GameStateContext';
import { ASCENSION_PATHS } from '../data/itemsAndGems';
import { GAME_TITLES, getPvPRankTier, GUARDIAN_LIST, GUARDIANS } from '../data/spiritsAndTitles';
import { CharacterGrowthPanel } from '../components/CharacterGrowthPanel';
import { RandomMissionPanel } from '../components/RandomMissionPanel';
import { xpRequiredForLevel } from '../core/combatMath';
import { soundEngine } from '../audio/soundEngine';
import {
  drawGuardianSpirit,
} from '../core/canvasEffects';
import { getWorldTotalStars } from '../data/campaignMap';
import { AdventureBrief } from '../components/AdventureBrief';
import { WorldScene } from '../components/WorldScene';

interface LobbyScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenWorldMap: (subject: SubjectId) => void;
  onOpenMistakes: () => void;
  onStartAdventure: (stage: CampaignStageConfig) => void;
}

interface PlanetPortalConfig {
  id: SubjectId;
  screen: ActiveScreen;
  worldTitle: string;
  subjectLabel: string;
  genreTag: string;
  accentBorder: string;
  planetGrad: string;
  ringColor: string;
  emblem: string;
}

const PLANET_PORTALS: PlanetPortalConfig[] = [
  {
    id: 'chinese',
    screen: 'world_chinese',
    worldTitle: '墨靈幻境',
    subjectLabel: '國語文',
    genreTag: '揮動墨劍，找出文字裡的祕密',
    accentBorder: 'border-amber-400/90 hover:border-amber-200',
    planetGrad: 'from-amber-400 via-orange-500 to-rose-600',
    ringColor: 'border-amber-200/75',
    emblem: '墨',
  },
  {
    id: 'english',
    screen: 'world_english',
    worldTitle: '星際機甲戰線',
    subjectLabel: '英語文',
    genreTag: '駕駛戰機，解開星際單字訊號',
    accentBorder: 'border-cyan-400/90 hover:border-cyan-200',
    planetGrad: 'from-cyan-400 via-indigo-500 to-fuchsia-600',
    ringColor: 'border-cyan-200/75',
    emblem: 'Aa',
  },
  {
    id: 'math',
    screen: 'world_math',
    worldTitle: '數境建築王國',
    subjectLabel: '數學',
    genreTag: '動動腦，建造你的防禦陣線',
    accentBorder: 'border-sky-400/90 hover:border-sky-200',
    planetGrad: 'from-emerald-400 via-sky-500 to-blue-700',
    ringColor: 'border-sky-200/75',
    emblem: 'π',
  },
  {
    id: 'science',
    screen: 'world_science',
    worldTitle: '元素料理大亂鬥',
    subjectLabel: '自然科學',
    genreTag: '選食材、控溫度，變身科學小廚神',
    accentBorder: 'border-emerald-400/90 hover:border-emerald-200',
    planetGrad: 'from-orange-400 via-rose-500 to-teal-500',
    ringColor: 'border-emerald-200/75',
    emblem: '炎',
  },
];

/** Compact 90x90 Retina mini-canvas for the Mobile Guardian Companion Card */
const GuardianMiniCanvas: React.FC<{
  guardianId: GuardianId;
  auraColor: string;
  bounceSignal: number;
  displaySize?: number;
}> = ({ guardianId, auraColor, bounceSignal, displaySize = 90 }) => {
  const miniRef = useRef<HTMLCanvasElement | null>(null);
  const guardianRef = useRef(guardianId);
  const auraRef = useRef(auraColor);
  const bounceRef = useRef(0);

  useEffect(() => {
    guardianRef.current = guardianId;
  }, [guardianId]);

  useEffect(() => {
    auraRef.current = auraColor;
  }, [auraColor]);

  useEffect(() => {
    if (bounceSignal > 0) bounceRef.current = 1.0;
  }, [bounceSignal]);

  useEffect(() => {
    const canvas = miniRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 90;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(displaySize * dpr);
    canvas.height = Math.floor(displaySize * dpr);
    const scale = displaySize / size * dpr;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    let rafId = 0;
    let alive = true;
    let lastTs = performance.now();
    let time = 0;

    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      time += dt;
      if (bounceRef.current > 0) {
        bounceRef.current = Math.max(0, bounceRef.current - dt * 2.5);
      }

      ctx.clearRect(0, 0, size, size);
      const glow = ctx.createRadialGradient(45, 50, 6, 45, 50, 42);
      glow.addColorStop(0, `${auraRef.current}55`);
      glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // Mini stone disc
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = auraRef.current;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(45, 74, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      drawGuardianSpirit(ctx, guardianRef.current, 45, 52, time, 0.88, bounceRef.current);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
    };
  }, [displaySize]);

  return (
    <canvas
      ref={miniRef}
      className="w-[90px] h-[90px] rounded-2xl bg-slate-950/90 border border-slate-700/80 shrink-0"
    />
  );
};

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onNavigate,
  onOpenWorldMap,
  onOpenMistakes,
  onStartAdventure,
}) => {
  const {
    user,
    localAccounts,
    authNotice,
    clearAuthNotice,
    signInWithGoogle,
    switchLocalAccount,
    createLocalAccount,
    signOutGoogle,
  } = useAuth();
  const {
    save,
    saveNotice,
    exportSaveBackup,
    equippedWeapon,
    combatStats,
    setGrade,
    setSemester,
    setPlayMode,
    toggleMute,
    selectGuardian,
    petGuardian,
    claimDailyQuest,
  } = useGameState();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guardian = GUARDIANS[save.selectedGuardian];
  const [speechBubble, setSpeechBubble] = useState<string>(guardian.petLines[0]);
  const [focusedScreen, setFocusedScreen] = useState<ActiveScreen>('world_chinese');
  const [drawer, setDrawer] = useState<'none' | 'account' | 'quests' | 'spirits'>('none');
  const [newStudentName, setNewStudentName] = useState('');
  const [questToast, setQuestToast] = useState<string | null>(null);
  const [miniBounceSignal, setMiniBounceSignal] = useState(0);


  useEffect(() => {
    setSpeechBubble(GUARDIANS[save.selectedGuardian].petLines[0]);
  }, [save.selectedGuardian]);

  // Auto-dismiss auth notification toast after 2.5s so it never blocks UI
  useEffect(() => {
    if (!authNotice) return;
    const timer = window.setTimeout(() => {
      clearAuthNotice();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [authNotice, clearAuthNotice]);

  // Enter / Space quick launch to Stage Map on desktop keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (drawer !== 'none') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        soundEngine.playClick();
        if (focusedScreen === 'world_english') onOpenWorldMap('english');
        else if (focusedScreen === 'world_math') onOpenWorldMap('math');
        else if (focusedScreen === 'world_science') onOpenWorldMap('science');
        else onOpenWorldMap('chinese');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawer, focusedScreen, onOpenWorldMap]);

  // Live Starry Knowledge-Rune Backdrop Canvas (Desktop shows full guardian pedestal on left; mobile shows clean ambient backdrop)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1280;
    let height = 720;
    let cachedSky: CanvasGradient | null = null;
    let cachedRad: CanvasGradient | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === width && rect.height === height && cachedSky) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = rect.width;
      height = rect.height;

      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#070D1F');
      sky.addColorStop(0.46, '#172E73');
      sky.addColorStop(0.84, '#0F5E63');
      sky.addColorStop(1, '#063B36');
      cachedSky = sky;

      const gx = width < 1024 ? width * 0.5 : width * 0.21;
      const gy = width < 1024 ? height * 0.28 : height * 0.46;
      const rad = ctx.createRadialGradient(gx, gy, 20, gx, gy, Math.max(width, height) * 0.45);
      rad.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
      rad.addColorStop(0.55, 'rgba(56, 189, 248, 0.10)');
      rad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      cachedRad = rad;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const clouds = Array.from({ length: 6 }, (_, i) => ({
      x: i * 260,
      y: 78 + (i % 3) * 64,
      speed: 10 + (i % 3) * 4.5,
      scale: 0.72 + (i % 3) * 0.28,
    }));

    const stars = Array.from({ length: 38 }, (_, i) => ({
      x: (i * 197.3) % 1,
      y: (i * 89.1) % 0.75,
      size: 1.2 + (i % 3) * 0.85,
      phase: i * 0.7,
    }));

    const runeSymbols = ['文', 'π', 'Aa', '⚡', '★', '炎', '智', '∞'];
    const runes = Array.from({ length: 14 }, (_, i) => ({
      x: ((i * 137) % 100) / 100,
      y: ((i * 73) % 100) / 100,
      speedY: 0.012 + (i % 4) * 0.005,
      swayPhase: i * 1.1,
      symbol: runeSymbols[i % runeSymbols.length],
      size: 13 + (i % 3) * 4,
      color: i % 3 === 0 ? '#FDE047' : i % 3 === 1 ? '#38BDF8' : '#34D399',
    }));

    let rafId = 0;
    let yieldTimer = 0;
    let alive = true;
    let lastTs = performance.now();
    let time = 0;

    const loop = (now: number) => {
      if (!alive) return;
      const frameStart = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      time += dt;

      ctx.fillStyle = cachedSky ?? '#172E73';
      ctx.fillRect(0, 0, width, height);
      if (cachedRad) {
        ctx.fillStyle = cachedRad;
        ctx.fillRect(0, 0, width, height);
      }

      // Twinkling Stardust
      for (const s of stars) {
        const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(time * 2.1 + s.phase));
        ctx.fillStyle = `rgba(254, 249, 195, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Slowly Drifting Glowing Knowledge Rune Particles
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const r of runes) {
        r.y -= r.speedY * dt;
        if (r.y < -0.06) r.y = 1.06;
        const rx = r.x * width + Math.sin(time * 0.9 + r.swayPhase) * 18;
        const ry = r.y * height;
        ctx.globalAlpha = 0.14 + 0.08 * Math.sin(time * 1.6 + r.swayPhase);
        ctx.fillStyle = r.color;
        ctx.font = `900 ${r.size}px "Fredoka", "Noto Sans TC", sans-serif`;
        ctx.fillText(r.symbol, rx, ry);
      }
      ctx.restore();

      // Soft Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      for (const c of clouds) {
        c.x += c.speed * dt;
        if (c.x > width + 180) c.x = -180;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 34 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 32 * c.scale, c.y - 9, 40 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 68 * c.scale, c.y, 30 * c.scale, 0, Math.PI * 2);
        ctx.fill();
      }

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
    };
  }, []);

  const triggerPetGuardian = () => {
    soundEngine.playPetChime();
    soundEngine.hapticPulse(16);
    setMiniBounceSignal((n) => n + 1);
    petGuardian();
    const lines = guardian.petLines;
    setSpeechBubble(lines[Math.floor(Math.random() * lines.length)]);

  };

  const hasSynthReady = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of save.gemBag) {
      if (g.level >= 5) continue;
      const k = `${g.element}_${g.level}`;
      const n = (counts.get(k) ?? 0) + 1;
      if (n >= 3) return true;
      counts.set(k, n);
    }
    return false;
  }, [save.gemBag]);

  const unclaimedQuests = save.dailyQuests.filter((q) => !q.claimed && q.current >= q.target).length;
  const xpNeeded = xpRequiredForLevel(save.level);
  const rankTier = getPvPRankTier(save.pvp.rating);
  const currentTitle = GAME_TITLES.find((t) => t.id === save.selectedTitle)?.name ?? '智光見習守護者';
  const weaponPathDef = ASCENSION_PATHS[equippedWeapon.ascensionPath];

  return (
    <div
      className="adventure-hub relative w-full h-full overflow-hidden bg-slate-950 flex flex-col"
      data-testid="lobby-hub"
    >
      {/* Full-bleed Live Starry & Rune Backdrop Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        data-testid="lobby-canvas"
      />

      {/* 1. STICKY TOP HEADER (Single-Row Compact Capsule Bar <= 56px, Zero Multi-Row Wrapping) */}
      <header className="relative z-30 shrink-0 safe-top bg-slate-950/88 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto h-14 px-2 sm:px-5 flex items-center justify-between gap-1 sm:gap-3">
          {/* Left: Circular Avatar + Nickname/Lv + Prominent Quick Google Login/Switch */}
          <div className="min-w-0 flex items-center gap-1 sm:gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setDrawer('account');
              }}
              aria-label="開啟帳號與切換選單"
              className="shrink-0 h-9 sm:h-10 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-amber-400/75 pl-1 pr-2 sm:pr-3.5 flex items-center gap-1.5 sm:gap-2 text-left transition-transform active:scale-95"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-amber-300 object-cover shrink-0"
                />
              ) : (
                <span
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs text-slate-950 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.displayName.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-white leading-tight">
                  <span className="hidden sm:inline truncate max-w-[110px]">{user.displayName}</span>
                  <span className="text-amber-300 font-mono-num shrink-0">Lv.{save.level}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
                  <div className="w-16 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${Math.min(100, (save.xp / xpNeeded) * 100)}%` }}
                    />
                  </div>
                  <span className="hidden md:inline text-[10px] text-slate-400 truncate">
                    {user.provider === 'google' ? '雲端同步' : currentTitle}
                  </span>
                </div>
              </div>
            </button>

            {/* Quick Google Login / Switch Trigger */}
            {user.provider !== 'google' ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  signInWithGoogle();
                }}
                className="h-8 sm:h-9 px-2 sm:px-3 rounded-full bg-white hover:bg-slate-100 text-slate-950 border border-sky-300 font-black text-[11px] sm:text-xs inline-flex items-center gap-1 shadow transition-transform active:scale-95 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span className="sm:hidden">Google</span>
                <span className="hidden sm:inline">Google 登入</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setDrawer('account');
                }}
                className="h-8 sm:h-9 px-2 sm:px-3 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/70 text-sky-200 font-black text-[11px] sm:text-xs inline-flex items-center gap-1 shrink-0"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>切換</span>
              </button>
            )}
          </div>

          {/* Right: Compact Coins/Crystals + 3 Round Utility Icon Buttons */}
          <div className="shrink-0 flex items-center gap-1 sm:gap-2">
            <div className="h-8 sm:h-9 rounded-full bg-slate-900/95 border border-slate-700 px-2 sm:px-3 flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-xs font-black font-mono-num">
              <span className="text-amber-300 inline-flex items-center gap-0.5 sm:gap-1">
                <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> {save.coins}
              </span>
              <span className="text-cyan-300 inline-flex items-center gap-0.5 sm:gap-1">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> {save.crystals}
              </span>
              <span className="hidden md:inline-flex text-fuchsia-300 items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> {save.pvp.honorTokens}
              </span>
              <span className="hidden lg:inline text-emerald-300 text-[11px]">
                戰力 {combatStats.baseAttack}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setDrawer('quests');
              }}
              aria-label="每日任務"
              title="每日任務"
              className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-emerald-400/70 text-emerald-300 flex items-center justify-center transition-transform active:scale-90 shrink-0"
            >
              <ListChecks className="w-4 h-4" />
              {unclaimedQuests > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {unclaimedQuests}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNavigate('parent_dashboard');
              }}
              aria-label="家長專區"
              title="家長專區"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-sky-400/70 text-sky-300 flex items-center justify-center transition-transform active:scale-90 shrink-0"
            >
              <Lock className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={save.muted ? '開啟音效' : '靜音'}
              title={save.muted ? '開啟音效' : '靜音'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-slate-600 text-white flex items-center justify-center transition-transform active:scale-90 shrink-0"
            >
              {save.muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-20 shrink-0 flex items-center justify-between gap-2 bg-slate-900 px-3 py-1 text-xs text-slate-200">
        <span role="status" className="min-w-0">{saveNotice}</span>
        <button type="button" className="shrink-0 min-h-9 underline text-sky-300" onClick={exportSaveBackup}>匯出備份</button>
      </div>

      {/* Auto-Dismissing Floating Auth Notice Toast (2.5s, never blocks UI) */}
      {authNotice && (
        <div
          role="status"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] rounded-full bg-indigo-950/92 backdrop-blur-md border border-indigo-400/80 px-4 py-1.5 text-xs font-bold text-indigo-100 flex items-center gap-2.5 shadow-xl"
        >
          <span className="truncate">{authNotice}</span>
          <button
            type="button"
            onClick={clearAuthNotice}
            aria-label="關閉通知"
            className="text-indigo-300 hover:text-white shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. SCROLLABLE MAIN STAGE (Smooth Vertical Scroll on Mobile, 2-Column Split on Desktop) */}
      <main className="relative z-10 flex-1 overflow-y-auto scroll-touch px-3 sm:px-6 pt-3 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-6 items-start min-h-full">
          {/* MOBILE COMPACT BRAND + HORIZONTAL GUARDIAN CARD (~110px tall, zero clipping!) */}
          <div className="lg:hidden flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center shadow">
                  智
                </span>
                <div>
                  <h1 className="text-base font-black text-white leading-none font-display tracking-wide">
                    智光守護者
                  </h1>
                  <div className="text-[10px] font-bold text-amber-300/90 mt-0.5">
                    108 學園大冒險 · 探索你的超能力
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-black text-emerald-300 bg-slate-900/80 border border-emerald-500/40 rounded-lg px-2 py-1 font-mono-num">
                戰力 {combatStats.baseAttack}
              </span>
            </div>

            {/* Horizontal Compact Guardian Card */}
            <div className="rounded-2xl bg-slate-900/92 backdrop-blur-sm border-2 border-amber-400/75 p-2.5 shadow-xl flex items-center gap-3">
              <GuardianMiniCanvas
                guardianId={save.selectedGuardian}
                auraColor={weaponPathDef.auraPrimary}
                bounceSignal={miniBounceSignal}
              />
              <div className="min-w-0 flex-1 flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-black text-amber-300 truncate">
                    {guardian.name} · {guardian.title}
                  </div>
                  <span className="text-[11px] font-black text-rose-300 inline-flex items-center gap-0.5 font-mono-num shrink-0">
                    <Heart className="w-3 h-3 fill-rose-400" /> Lv.{save.guardianBonds[save.selectedGuardian]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-100 leading-snug line-clamp-2">
                  「{speechBubble}」
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={triggerPetGuardian}
                    className="flex-1 min-h-[38px] rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center justify-center gap-1 transition-transform active:scale-95"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" /> 摸摸 (+羈絆)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setDrawer('spirits');
                    }}
                    className="min-h-[38px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-600 font-bold text-xs shrink-0 transition-transform active:scale-95"
                  >
                    切換
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DESKTOP LEFT 5 COLS: Full Crest + Open Canvas Guardian Pedestal + Interaction Card */}
          <div className="adventure-companion hidden lg:flex lg:col-span-4 flex-col items-start gap-5 lg:sticky lg:top-3">
            <div>
              <svg
                viewBox="0 0 420 78"
                className="w-full max-w-[360px] h-auto"
                role="img"
                aria-label="智光守護者：108 學園大冒險"
              >
                <defs>
                  <linearGradient id="crestGoldV2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="55%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                </defs>
                <polygon
                  points="26,8 48,22 40,50 12,50 4,22"
                  fill="url(#crestGoldV2)"
                  stroke="#0F172A"
                  strokeWidth="3"
                />
                <text x="26" y="36" textAnchor="middle" fill="#0F172A" fontSize="20" fontWeight="900">
                  智
                </text>
                <text
                  x="62"
                  y="38"
                  fill="#FFFFFF"
                  stroke="#0F172A"
                  strokeWidth="6"
                  paintOrder="stroke fill"
                  fontSize="32"
                  fontWeight="900"
                  fontFamily="'Noto Sans TC', sans-serif"
                >
                  智光守護者
                </text>
                <text
                  x="64"
                  y="64"
                  fill="#FDE047"
                  stroke="#0F172A"
                  strokeWidth="4"
                  paintOrder="stroke fill"
                  fontSize="15"
                  fontWeight="800"
                  letterSpacing="2"
                >
                  108 學園大冒險 · 探索你的超能力
                </text>
              </svg>
            </div>

            <div className="adventure-companion-stage">
              <span>你的冒險夥伴</span>
              <GuardianMiniCanvas guardianId={save.selectedGuardian} auraColor={weaponPathDef.auraPrimary} bounceSignal={miniBounceSignal} displaySize={210} />
              <p>準備好了嗎？一起出發！</p>
            </div>

            <div className="w-full max-w-sm rounded-2xl bg-slate-900/92 backdrop-blur-sm border-2 border-amber-400/75 p-3.5 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-black text-amber-300">
                  {guardian.name} · {guardian.title}
                </div>
                <span className="text-xs font-black text-rose-300 inline-flex items-center gap-1 font-mono-num">
                  <Heart className="w-3.5 h-3.5 fill-rose-400" /> 羈絆 Lv.{save.guardianBonds[save.selectedGuardian]}
                </span>
              </div>
              <p className="text-xs text-white mt-1 leading-snug">「{speechBubble}」</p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerPetGuardian}
                  className="flex-1 min-h-[46px] rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <Heart className="w-4 h-4 fill-white" /> 摸摸精靈（每日首次 +2 經驗）
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setDrawer('spirits');
                  }}
                  className="min-h-[46px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-600 font-bold text-xs transition-transform active:scale-95"
                >
                  切換精靈
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS (Full Width on Mobile): Grade/Semester/Mode + 4 Worlds + Online PvP */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            <CharacterGrowthPanel />
            <RandomMissionPanel />
            <AdventureBrief save={save} onStart={(stage) => {
              soundEngine.playClick();
              soundEngine.hapticPulse(12);
              onStartAdventure(stage);
            }} />
            {/* Compact Segmented Controls: Grade (3~6), Semester (上/下), Mode (計時/練習) */}
            <div className="rounded-2xl bg-slate-900/92 backdrop-blur-sm border border-slate-700/90 p-2 shadow-xl flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2">
              <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {([3, 4, 5, 6] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setGrade(g);
                    }}
                    className={`min-h-[38px] px-2.5 sm:px-3 rounded-lg text-xs font-black whitespace-nowrap transition-colors ${
                      save.grade === g
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {g}年級
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <div className="grid grid-cols-2 items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['upper', 'lower'] as SemesterId[]).map((sem) => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSemester(sem);
                      }}
                      className={`min-h-[38px] px-2.5 rounded-lg text-xs font-black whitespace-nowrap transition-colors ${
                        save.semester === sem
                          ? 'bg-sky-400 text-slate-950 shadow'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {sem === 'upper' ? '上學期' : '下學期'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    disabled={save.parentSettings.forcePracticeMode}
                    onClick={() => {
                      soundEngine.playClick();
                      setPlayMode('adventure');
                    }}
                    className={`min-h-[38px] px-2 rounded-lg text-xs font-black whitespace-nowrap transition-colors ${
                      save.playMode === 'adventure'
                        ? 'bg-rose-500 text-white shadow'
                        : 'text-slate-400 hover:text-white disabled:opacity-40'
                    }`}
                  >
                    計時
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setPlayMode('practice');
                    }}
                    className={`min-h-[38px] px-2 rounded-lg text-xs font-black whitespace-nowrap transition-colors ${
                      save.playMode === 'practice'
                        ? 'bg-emerald-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    練習
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Subject Worlds -> 3 Chapters x 10 Stages */}
            <div className="adventure-worlds-heading"><span>選一個世界，開始探索</span><span>4 個世界 · 4 種玩法</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLANET_PORTALS.map((planet) => {
                const worldStats = getWorldTotalStars(planet.id, save.grade, save.stageProgress);
                return (
                  <button
                    key={planet.id}
                    type="button"
                    onMouseEnter={() => setFocusedScreen(planet.screen)}
                    onFocus={() => setFocusedScreen(planet.screen)}
                    onClick={() => {
                      soundEngine.playClick();
                      soundEngine.hapticPulse(12);
                      onOpenWorldMap(planet.id);
                    }}
                    data-start={planet.id === 'chinese' ? 'true' : undefined}
                    className={`world-postcard world-postcard-${planet.id} group text-left`}
                  >
                    <WorldScene subject={planet.id} className="world-postcard-art" />
                    <div className="world-postcard-copy">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-400">
                          {planet.subjectLabel} · {save.grade}年級
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-amber-300 font-mono-num">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {worldStats.earned}/{worldStats.max}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-white mt-0.5 leading-tight">
                        {planet.worldTitle}
                      </div>
                      <div className="world-postcard-description">{planet.genreTag}</div>
                      <div className="world-postcard-progress" aria-label={`已通過 ${worldStats.clearedStages} 關，共 30 關`}>
                        <span style={{ width: `${worldStats.clearedStages / 30 * 100}%` }} />
                      </div>
                      <div className="world-postcard-footer"><span>{worldStats.clearedStages === 0 ? '全新旅程，等你出發' : `已探索 ${worldStats.clearedStages} / 30 關`}</span><span>探索世界 <ChevronRight size={14} /></span></div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Golden/Neon Featured Online PvP Arena Banner */}
            <button
              type="button"
              disabled={!save.parentSettings.pvpEnabled}
              onClick={() => {
                soundEngine.playClick();
                soundEngine.hapticPulse(18);
                onNavigate('pvp_arena');
              }}
              className={`w-full min-h-[70px] rounded-2xl border-2 px-3.5 sm:px-4 py-3 text-left flex items-center justify-between gap-3 shadow-2xl transition-transform active:scale-[0.98] ${
                save.parentSettings.pvpEnabled
                  ? 'bg-gradient-to-r from-indigo-900/95 via-fuchsia-900/95 to-amber-900/90 border-amber-400/90 hover:border-amber-200'
                  : 'bg-slate-900/90 border-slate-700 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-xl border-2 border-white/70 flex items-center justify-center font-black text-lg text-slate-950 shrink-0 shadow"
                  style={{ backgroundColor: rankTier.color }}
                >
                  {rankTier.emblem}
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="truncate">守護者練習場</span>
                  </div>
                  <div className="text-[11px] text-amber-100/90 truncate mt-0.5">
                    {save.parentSettings.pvpEnabled
                      ? '和 AI 切磋知識 · 練習不影響真人排名'
                      : '家長專區已暫時鎖定競技場'}
                  </div>
                </div>
              </div>
              <span className="min-h-[38px] px-3 sm:px-3.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1 shrink-0 shadow">
                <Play className="w-3.5 h-3.5 fill-slate-950" /> 練習
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* 3. FIXED 5-TAB BOTTOM MOBILE NAVIGATION BAR (64px height + Safe Area Inset) */}
      <nav
        aria-label="主功能導覽列"
        className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 safe-bottom shadow-[0_-8px_24px_rgba(2,6,23,0.65)]"
      >
        <div className="max-w-2xl mx-auto h-16 grid grid-cols-5 items-center px-1">
          <button
            type="button"
            aria-current="page"
            onClick={() => soundEngine.playClick()}
            className="h-full flex flex-col items-center justify-center gap-0.5 text-amber-300 font-black relative"
          >
            <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-amber-400" />
            <Compass className="w-5 h-5" />
            <span className="text-[10px] sm:text-xs">冒險大廳</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onNavigate('forge');
            }}
            className="h-full flex flex-col items-center justify-center gap-0.5 text-slate-300 hover:text-amber-300 font-bold relative transition-colors active:scale-95"
          >
            <div className="relative">
              <Hammer className="w-5 h-5 text-amber-400" />
              <span
                className="absolute -top-1.5 -right-4 text-[9px] font-black font-mono-num"
                style={{ color: weaponPathDef.auraPrimary }}
              >
                +{equippedWeapon.enhanceLevel}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs">神兵鍛造</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onNavigate('socketing');
            }}
            className="h-full flex flex-col items-center justify-center gap-0.5 text-slate-300 hover:text-cyan-300 font-bold relative transition-colors active:scale-95"
          >
            <div className="relative">
              <Gem className="w-5 h-5 text-cyan-300" />
              {hasSynthReady && (
                <span className="absolute -top-0.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-ping" />
              )}
            </div>
            <span className="text-[10px] sm:text-xs">寶石工坊</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onNavigate('shop');
            }}
            className="h-full flex flex-col items-center justify-center gap-0.5 text-slate-300 hover:text-emerald-300 font-bold relative transition-colors active:scale-95"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
              <span className="absolute -top-1.5 -right-4 text-[9px] font-black text-amber-300">
                7折
              </span>
            </div>
            <span className="text-[10px] sm:text-xs">魔法商店</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenMistakes();
            }}
            className="h-full flex flex-col items-center justify-center gap-0.5 text-slate-300 hover:text-rose-300 font-bold relative transition-colors active:scale-95"
          >
            <div className="relative">
              <BookOpen className="w-5 h-5 text-rose-300" />
              {save.wrongRecords.length > 0 && (
                <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black font-mono-num flex items-center justify-center">
                  {save.wrongRecords.length}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs">錯題本</span>
          </button>
        </div>
      </nav>

      {/* SLIDE-OVER DRAWER: ACCOUNT SWITCHER & GOOGLE LOGIN */}
      {drawer === 'account' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-3xl bg-slate-900 border-2 border-amber-400 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-amber-300 flex items-center gap-2">
                <Users className="w-5 h-5" /> 學園帳號與多學生切換
              </h2>
              <button
                type="button"
                onClick={() => setDrawer('none')}
                aria-label="關閉帳號抽屜"
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google Account Section */}
            <div className="rounded-2xl bg-slate-950 border border-slate-700 p-3.5 space-y-2.5">
              <div className="text-xs font-black text-sky-300">
                Google 帳號雲端存檔 · 跨裝置接續學習
              </div>
              {user.provider === 'google' ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-200 min-w-0 truncate">
                    已登入：<strong>{user.displayName}</strong> ({user.email})
                  </div>
                  <button
                    type="button"
                    onClick={signOutGoogle}
                    className="min-h-[40px] px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs inline-flex items-center gap-1 shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" /> 登出
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="w-full min-h-[48px] rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm inline-flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> 使用 Google 帳號登入
                </button>
              )}
            </div>

            {/* Local Multi-Account Switching */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-400">
                本機多學生學習檔案（免登入獨立存檔）
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {localAccounts.map((acc) => {
                  const active = acc.uid === user.uid;
                  return (
                    <button
                      key={acc.uid}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        switchLocalAccount(acc.uid);
                        setDrawer('none');
                      }}
                      className={`w-full min-h-[48px] rounded-xl px-3.5 border-2 flex items-center justify-between text-left ${
                        active
                          ? 'bg-slate-800 border-amber-400 text-white'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 font-black text-sm">
                        <span
                          className="w-7 h-7 rounded-lg text-slate-950 text-xs flex items-center justify-center"
                          style={{ backgroundColor: acc.avatarColor }}
                        >
                          {acc.displayName.slice(0, 1)}
                        </span>
                        {acc.displayName}
                      </span>
                      {active && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="新增本機學生暱稱..."
                  className="flex-1 min-h-[44px] rounded-xl bg-slate-950 border border-slate-700 px-3 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newStudentName.trim()) {
                      createLocalAccount(newStudentName);
                      setNewStudentName('');
                      setDrawer('none');
                    }
                  }}
                  className="min-h-[44px] px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs inline-flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" /> 新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: DAILY QUESTS */}
      {drawer === 'quests' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-3xl bg-slate-900 border-2 border-emerald-400 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-emerald-300 flex items-center gap-2">
                <ListChecks className="w-5 h-5" /> 每日學園任務
              </h2>
              <button
                type="button"
                onClick={() => setDrawer('none')}
                aria-label="關閉每日任務"
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {questToast && (
              <div className="rounded-xl bg-emerald-950 border border-emerald-400 px-3 py-2 text-xs font-bold text-emerald-200">
                {questToast}
              </div>
            )}
            <div className="space-y-2.5">
              {save.dailyQuests.map((q) => {
                const done = q.current >= q.target;
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-black text-white">{q.title}</div>
                      <div className="text-xs text-slate-400 font-mono-num mt-0.5">
                        進度 {q.current}/{q.target} · 獎勵 +{q.rewardCoins}金 +{q.rewardCrystals}晶
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!done || q.claimed}
                      onClick={() => {
                        const res = claimDailyQuest(q.id);
                        setQuestToast(res.message);
                      }}
                      className={`min-h-[42px] px-3.5 rounded-xl font-black text-xs shrink-0 ${
                        q.claimed
                          ? 'bg-slate-800 text-slate-500'
                          : done
                            ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {q.claimed ? '已領取' : done ? '領取獎勵' : '進行中'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: GUARDIAN SPIRIT SWITCHER */}
      {drawer === 'spirits' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-3xl bg-slate-900 border-2 border-amber-400 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-amber-300">選擇出戰守護精靈</h2>
              <button
                type="button"
                onClick={() => setDrawer('none')}
                aria-label="關閉精靈選擇"
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GUARDIAN_LIST.map((g) => {
                const selected = save.selectedGuardian === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playPetChime();
                      selectGuardian(g.id);
                      setDrawer('none');
                    }}
                    className={`rounded-2xl p-3.5 border-2 text-left transition-all ${
                      selected
                        ? 'bg-slate-800 border-amber-400'
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">{g.name}</span>
                      <span className="text-xs font-black text-rose-300 font-mono-num">
                        羈絆 Lv.{save.guardianBonds[g.id]}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-amber-300 mt-1">被動：{g.passiveName}</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{g.passiveDesc}</div>
                    <div className="text-[11px] text-cyan-300 mt-1">主動：{g.activeName}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
