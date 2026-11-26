import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Coins,
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
import {
  ActiveScreen,
  GradeLevel,
  GuardianId,
  SemesterId,
  SubjectId,
} from '../types/game';
import { useAuth } from '../auth/AuthContext';
import { useGameState } from '../core/GameStateContext';
import { ASCENSION_PATHS } from '../data/itemsAndGems';
import { GAME_TITLES, getPvPRankTier, GUARDIAN_LIST, GUARDIANS } from '../data/spiritsAndTitles';
import { xpRequiredForLevel } from '../core/combatMath';
import { soundEngine } from '../audio/soundEngine';
import {
  drawGuardianSpirit,
  drawRoundedRect,
  FloatingTextPool,
  ParticlePool,
} from '../core/canvasEffects';

import { getWorldTotalStars } from '../data/campaignMap';

interface LobbyScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenWorldMap: (subject: SubjectId) => void;
  onOpenMistakes: () => void;
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
    genreTag: 'RO 2.5D 走圖＋ATB 拼字斬句',
    accentBorder: 'border-amber-400 hover:border-amber-200',
    planetGrad: 'from-amber-400 via-orange-500 to-rose-600',
    ringColor: 'border-amber-200/70',
    emblem: '墨',
  },
  {
    id: 'english',
    screen: 'world_english',
    worldTitle: '星際機甲戰線',
    subjectLabel: '英語文',
    genreTag: '賽博彈幕射擊＋母艦拼字',
    accentBorder: 'border-cyan-400 hover:border-cyan-200',
    planetGrad: 'from-cyan-400 via-indigo-500 to-fuchsia-600',
    ringColor: 'border-cyan-200/70',
    emblem: 'Aa',
  },
  {
    id: 'math',
    screen: 'world_math',
    worldTitle: '數境建築王國',
    subjectLabel: '數學',
    genreTag: '5×8 殭屍塔防＋算式盾雷射',
    accentBorder: 'border-blue-400 hover:border-sky-200',
    planetGrad: 'from-emerald-400 via-sky-500 to-blue-700',
    ringColor: 'border-sky-200/70',
    emblem: 'π',
  },
  {
    id: 'science',
    screen: 'world_science',
    worldTitle: '元素料理大亂鬥',
    subjectLabel: '自然科學',
    genreTag: 'Overcooked 控溫酸鹼廚房',
    accentBorder: 'border-emerald-400 hover:border-emerald-200',
    planetGrad: 'from-orange-400 via-rose-500 to-teal-500',
    ringColor: 'border-emerald-200/70',
    emblem: '炎',
  },
];

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  onNavigate,
  onOpenWorldMap,
  onOpenMistakes,
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

  const guardianIdRef = useRef<GuardianId>(save.selectedGuardian);
  const auraColorRef = useRef(ASCENSION_PATHS[equippedWeapon.ascensionPath].auraPrimary);
  const petBounceRef = useRef(0);
  const particlesRef = useRef(new ParticlePool(160));
  const floatsRef = useRef(new FloatingTextPool(24));

  useEffect(() => {
    guardianIdRef.current = save.selectedGuardian;
    setSpeechBubble(GUARDIANS[save.selectedGuardian].petLines[0]);
  }, [save.selectedGuardian]);

  useEffect(() => {
    auraColorRef.current = ASCENSION_PATHS[equippedWeapon.ascensionPath].auraPrimary;
  }, [equippedWeapon.ascensionPath]);

  // Enter / Space quick launch to Stage Map
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

  // Live Interactive Plaza Canvas (Guardian cleanly above the interaction card!)
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = rect.width;
      height = rect.height;

      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#0B1120');
      sky.addColorStop(0.48, '#1E3A8A');
      sky.addColorStop(0.86, '#0F766E');
      sky.addColorStop(1, '#064E3B');
      cachedSky = sky;

      const gx = width < 1024 ? width * 0.5 : width * 0.21;
      const gy = width < 1024 ? height * 0.3 : height * 0.44;
      const rad = ctx.createRadialGradient(gx, gy, 24, gx, gy, Math.max(width, height) * 0.42);
      rad.addColorStop(0, 'rgba(251, 191, 36, 0.26)');
      rad.addColorStop(0.55, 'rgba(56, 189, 248, 0.11)');
      rad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      cachedRad = rad;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const clouds = Array.from({ length: 6 }, (_, i) => ({
      x: i * 260,
      y: 72 + (i % 3) * 58,
      speed: 11 + (i % 3) * 5,
      scale: 0.78 + (i % 3) * 0.3,
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

      if (petBounceRef.current > 0) {
        petBounceRef.current = Math.max(0, petBounceRef.current - dt * 2.4);
      }
      particlesRef.current.update(dt);
      floatsRef.current.update(dt);

      ctx.fillStyle = cachedSky ?? '#1E3A8A';
      ctx.fillRect(0, 0, width, height);
      if (cachedRad) {
        ctx.fillStyle = cachedRad;
        ctx.fillRect(0, 0, width, height);
      }

      // Soft clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      for (const c of clouds) {
        c.x += c.speed * dt;
        if (c.x > width + 180) c.x = -180;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 36 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 34 * c.scale, c.y - 10, 42 * c.scale, 0, Math.PI * 2);
        ctx.arc(c.x + 72 * c.scale, c.y, 32 * c.scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating Stone Pedestal positioned cleanly at upper-middle left (zero overlap with card below!)
      const px = width < 1024 ? width * 0.5 : width * 0.21;
      const py = width < 1024 ? height * 0.3 : height * 0.44;

      ctx.save();
      ctx.translate(px, py + 48);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = auraColorRef.current;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 92, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1E293B';
      drawRoundedRect(ctx, -60, 15, 120, 20, 9);
      ctx.fill();
      ctx.restore();

      drawGuardianSpirit(
        ctx,
        guardianIdRef.current,
        px,
        py,
        time,
        width < 1024 ? 1.45 : 1.9,
        petBounceRef.current
      );

      particlesRef.current.render(ctx);
      floatsRef.current.render(ctx);

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
    petBounceRef.current = 1.0;
    petGuardian();
    const lines = guardian.petLines;
    setSpeechBubble(lines[Math.floor(Math.random() * lines.length)]);

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const px = rect.width < 1024 ? rect.width * 0.5 : rect.width * 0.21;
      const py = rect.width < 1024 ? rect.height * 0.3 : rect.height * 0.44;
      particlesRef.current.burst(px, py - 24, 16, ['#FB7185', '#FDE047', '#34D399'], 50, 170, 6, 'petal');
      floatsRef.current.spawn(px, py - 68, '羈絆 +1 ♥', 'perfect');
    }
  };

  // Detect if 3 identical gems can be synthesized (shows subtle ready dot on Socketing dock button)
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
    <div className="relative w-full h-full overflow-hidden bg-slate-950" data-testid="lobby-hub">
      <canvas ref={canvasRef} className="block w-full h-full" data-testid="lobby-canvas" />

      {/* Clean Mobile/Tablet-First Game Shell Overlay */}
      <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
        {/* TOP STRIP: Account + Resources + Secondary Utility Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2.5">
            {/* Account Badge with Real Google Photo or Local Avatar */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setDrawer('account');
              }}
              className="min-h-[48px] rounded-2xl bg-slate-900/94 hover:bg-slate-800 border-2 border-amber-400/75 px-3.5 py-2 shadow-xl flex items-center gap-3 text-left"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl border border-amber-300 object-cover shrink-0"
                />
              ) : (
                <span
                  className="w-9 h-9 rounded-xl font-black text-sm text-slate-950 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.displayName.slice(0, 1)}
                </span>
              )}
              <div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-white">
                  <span>{user.displayName}</span>
                  <span className="text-amber-300 font-mono-num">Lv.{save.level}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${Math.min(100, (save.xp / xpNeeded) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {user.provider === 'google' ? 'Google 雲端已同步' : '本機檔案'} · {currentTitle}
                  </span>
                </div>
              </div>
            </button>

            {/* Prominent One-Click Real Google OAuth Sign-In CTA */}
            {user.provider !== 'google' && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  signInWithGoogle();
                }}
                className="min-h-[46px] px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 border-2 border-sky-300 font-black text-xs inline-flex items-center gap-1.5 shadow-xl transition-transform active:scale-95"
              >
                <LogIn className="w-4 h-4 text-sky-600" /> Google 帳號登入
              </button>
            )}

            {/* Compact Resource Numbers */}
            <div className="rounded-2xl bg-slate-900/92 border border-slate-700 px-3.5 py-2.5 shadow-xl flex items-center gap-3.5 text-xs sm:text-sm font-black font-mono-num">
              <span className="text-amber-300 inline-flex items-center gap-1">
                <Coins className="w-4 h-4" /> {save.coins}
              </span>
              <span className="text-cyan-300 inline-flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> {save.crystals}
              </span>
              <span className="text-fuchsia-300 inline-flex items-center gap-1 hidden sm:inline-flex">
                <Trophy className="w-4 h-4" /> {save.pvp.honorTokens}
              </span>
              <span className="text-emerald-300 text-xs hidden md:inline">
                戰力 {combatStats.baseAttack}
              </span>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setDrawer('quests');
              }}
              className="relative min-h-[46px] px-3 rounded-xl bg-slate-900/92 hover:bg-slate-800 border-2 border-emerald-400/70 text-emerald-200 font-black text-xs inline-flex items-center gap-1.5"
            >
              <ListChecks className="w-4 h-4" /> 每日任務
              {unclaimedQuests > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
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
              className="min-h-[46px] px-3 rounded-xl bg-slate-900/92 hover:bg-slate-800 border-2 border-sky-400/70 text-sky-200 font-black text-xs inline-flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" /> 家長專區
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={save.muted ? '開啟音效' : '靜音'}
              className="w-11 h-11 rounded-xl bg-slate-900/92 hover:bg-slate-800 border-2 border-slate-600 text-white flex items-center justify-center"
            >
              {save.muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-300" />}
            </button>
          </div>
        </div>

        {authNotice && (
          <div className="pointer-events-auto self-center rounded-xl bg-indigo-950/95 border border-indigo-400 px-4 py-1.5 text-xs font-bold text-indigo-100 flex items-center gap-3 shadow-lg">
            <span>{authNotice}</span>
            <button type="button" onClick={clearAuthNotice} aria-label="關閉通知" className="text-indigo-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CENTER MAIN SPLIT: Left Unobstructed Guardian Stage + Right 4 Worlds & PvP Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center my-auto">
          {/* Left 5 Cols: Crest + Open Guardian Window + Interaction Card Below Pedestal */}
          <div className="lg:col-span-5 flex flex-col items-start justify-between gap-3">
            <div className="pointer-events-auto">
              <svg
                viewBox="0 0 420 78"
                className="w-[290px] sm:w-[360px] h-auto"
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
                  108 學園大冒險 · 四界獨立引擎＋競技場
                </text>
              </svg>
            </div>

            {/* Spacer keeps Canvas Guardian & Pedestal 100% clear */}
            <div className="h-24 lg:h-48" />

            <div className="pointer-events-auto w-full max-w-sm rounded-2xl bg-slate-900/92 border-2 border-amber-400/75 p-3.5 shadow-2xl">
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
                  <Heart className="w-4 h-4 fill-white" /> 摸摸精靈 (+羈絆)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setDrawer('spirits');
                  }}
                  className="min-h-[46px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-600 font-bold text-xs"
                >
                  切換精靈
                </button>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Grade/Semester/Mode + 4 Distinct Worlds + Online PvP Portal */}
          <div className="lg:col-span-7 pointer-events-auto flex flex-col gap-3">
            {/* Grade + Semester + Mode Selector */}
            <div className="rounded-2xl bg-slate-900/94 border border-slate-700 p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xl">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {([3, 4, 5, 6] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setGrade(g);
                    }}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-black whitespace-nowrap ${
                      save.grade === g ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {g}年級
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['upper', 'lower'] as SemesterId[]).map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSemester(sem);
                    }}
                    className={`min-h-[38px] px-3 rounded-lg text-xs font-black whitespace-nowrap ${
                      save.semester === sem ? 'bg-sky-400 text-slate-950' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {sem === 'upper' ? '上學期' : '下學期'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  disabled={save.parentSettings.forcePracticeMode}
                  onClick={() => {
                    soundEngine.playClick();
                    setPlayMode('adventure');
                  }}
                  className={`min-h-[38px] px-3 rounded-lg text-xs font-black whitespace-nowrap ${
                    save.playMode === 'adventure'
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-400 hover:text-white disabled:opacity-40'
                  }`}
                >
                  冒險計時
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setPlayMode('practice');
                  }}
                  className={`min-h-[38px] px-3 rounded-lg text-xs font-black whitespace-nowrap ${
                    save.playMode === 'practice'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  練習不計時
                </button>
              </div>
            </div>

            {/* 4 Subject Planets -> 3 Chapters x 10 Stages World Map */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLANET_PORTALS.map((planet) => {
                const worldStats = getWorldTotalStars(planet.id, save.grade, save.stageProgress);
                return (
                  <button
                    key={planet.id}
                    type="button"
                    onMouseEnter={() => setFocusedScreen(planet.screen)}
                    onClick={() => {
                      soundEngine.playClick();
                      onOpenWorldMap(planet.id);
                    }}
                    data-start={planet.id === 'chinese' ? 'true' : undefined}
                    className={`group rounded-2xl bg-slate-900/94 border-2 ${planet.accentBorder} p-3.5 text-left shadow-2xl transition-transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center gap-3.5`}
                  >
                    <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${planet.planetGrad} border-2 border-white/70 shadow-lg flex items-center justify-center text-xl font-black text-white group-hover:scale-110 transition-transform`}
                      >
                        {planet.emblem}
                      </div>
                      <div
                        className={`absolute inset-x-[-5px] top-1/2 -translate-y-1/2 h-4 rounded-full border-2 ${planet.ringColor} -rotate-12 pointer-events-none`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-400">
                          {planet.subjectLabel} · {save.grade}年級 · 3章30關
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300 font-mono-num">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {worldStats.earned}/90
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-black text-white mt-0.5">
                        {planet.worldTitle}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">{planet.genreTag}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Online PvP Arena Featured Banner */}
            <button
              type="button"
              disabled={!save.parentSettings.pvpEnabled}
              onClick={() => {
                soundEngine.playClick();
                onNavigate('pvp_arena');
              }}
              className={`w-full min-h-[64px] rounded-2xl border-2 px-4 py-3 text-left flex items-center justify-between gap-3 shadow-2xl transition-transform active:scale-[0.99] ${
                save.parentSettings.pvpEnabled
                  ? 'bg-gradient-to-r from-indigo-900/95 via-fuchsia-900/95 to-rose-900/95 border-fuchsia-400 hover:border-amber-300'
                  : 'bg-slate-900/90 border-slate-700 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl border-2 border-white/60 flex items-center justify-center font-black text-lg text-slate-950 shrink-0"
                  style={{ backgroundColor: rankTier.color }}
                >
                  {rankTier.emblem}
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <Swords className="w-4 h-4 text-amber-300" /> 線上對戰・雙人知識競技場
                  </div>
                  <div className="text-[11px] text-fuchsia-200">
                    {save.parentSettings.pvpEnabled
                      ? `${rankTier.name}（${save.pvp.rating}分）· 神兵光環對轟 · 好友房號即時對決`
                      : '家長專區已暫時鎖定線上對戰模式'}
                  </div>
                </div>
              </div>
              <span className="min-h-[38px] px-3.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1 shrink-0">
                <Play className="w-3.5 h-3.5 fill-slate-950" /> 進入對戰
              </span>
            </button>
          </div>
        </div>

        {/* BOTTOM RPG DOCK: Forge / Socketing / Shop / Mistakes */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onNavigate('forge');
            }}
            className="min-h-[50px] px-4 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border-2 border-amber-400/75 text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-xl"
          >
            <Hammer className="w-4 h-4 text-amber-400" />
            <span>神兵鍛造屋</span>
            <span className="text-[11px] font-mono-num" style={{ color: weaponPathDef.auraPrimary }}>
              +{equippedWeapon.enhanceLevel}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onNavigate('socketing');
            }}
            className="relative min-h-[50px] px-4 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border-2 border-cyan-400/75 text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-xl"
          >
            <Gem className="w-4 h-4 text-cyan-300" />
            <span>寶石工坊</span>
            <span className="text-[11px] text-cyan-300 font-mono-num">({save.gemBag.length})</span>
            {hasSynthReady && (
              <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onNavigate('shop');
            }}
            className="min-h-[50px] px-4 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border-2 border-emerald-400/75 text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-xl"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-300" />
            <span>魔法商店</span>
            <span className="text-[10px] font-black text-amber-300">7折</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onOpenMistakes();
            }}
            className="min-h-[50px] px-4 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border-2 border-rose-400/75 text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-xl"
          >
            <BookOpen className="w-4 h-4 text-rose-300" />
            <span>錯題本 ({save.wrongRecords.length})</span>
          </button>
        </div>
      </div>

      {/* SLIDE-OVER DRAWER: ACCOUNT SWITCHER & GOOGLE LOGIN */}
      {drawer === 'account' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-400 p-5 space-y-4 shadow-2xl">
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
                Google 帳號雲端存檔＋跨裝置線上對戰
              </div>
              {user.provider === 'google' ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-200">
                    已登入：<strong>{user.displayName}</strong> ({user.email})
                  </div>
                  <button
                    type="button"
                    onClick={signOutGoogle}
                    className="min-h-[40px] px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs inline-flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> 登出
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="w-full min-h-[46px] rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm inline-flex items-center justify-center gap-2"
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
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-emerald-400 p-5 space-y-4 shadow-2xl">
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
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-amber-400 p-5 space-y-4 shadow-2xl">
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
