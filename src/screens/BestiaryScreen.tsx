import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useGameState } from '../core/GameStateContext';
import { BESTIARY_CATALOG, BestiaryEntry, getBestiaryBonusPercent } from '../data/heroProgression';
import {
  drawDarkGluttonBoss,
  drawInkMonster,
  drawMathZombie,
  drawMechaShip,
} from '../canvas/proceduralArt';
import { soundEngine } from '../audio/soundEngine';

interface BestiaryScreenProps {
  onExit: () => void;
}

const WORLD_FILTERS: { id: 'all' | BestiaryEntry['world']; label: string }[] = [
  { id: 'all', label: '全部圖鑑' },
  { id: 'chinese', label: '國語墨境' },
  { id: 'english', label: '星際英語' },
  { id: 'math', label: '數境王國' },
  { id: 'science', label: '元素料理' },
  { id: 'tower', label: '試煉之塔' },
];

const MonsterPortraitCanvas: React.FC<{ entry: BestiaryEntry; discovered: boolean }> = ({
  entry,
  discovered,
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = 136;
    const h = 96;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    const bg = ctx.createRadialGradient(w / 2, h / 2, 6, w / 2, h / 2, 74);
    bg.addColorStop(0, discovered ? '#1E293B' : '#0F172A');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (!discovered) {
      ctx.filter = 'brightness(0.18) contrast(1.4)';
    }

    const cx = w / 2;
    const cy = h * 0.58;
    const t = 1.2;

    switch (entry.renderKind) {
      case 'ink_poring':
        drawInkMonster(ctx, 'poring', cx, cy, t, { hpRatio: 1, shielded: false, hitFlash: 0, scale: 0.9 });
        break;
      case 'ink_slime':
        drawInkMonster(ctx, 'slime', cx, cy, t, { hpRatio: 1, shielded: false, hitFlash: 0, scale: 0.9 });
        break;
      case 'ink_boss':
        drawInkMonster(ctx, 'boss', cx, cy + 4, t, { hpRatio: 1, shielded: true, hitFlash: 0, scale: 0.72 });
        break;
      case 'mecha_drone':
        drawMechaShip(ctx, 'falcon', cx, cy, t, 0.2, false, 0, true);
        break;
      case 'zombie_zero':
        drawMathZombie(ctx, 'zero', cx, cy + 6, t, { hpRatio: 1, armorRatio: 0, hasBucket: false, jumpOffset: 0, chilled: false, hitFlash: 0, formulaShield: null });
        break;
      case 'zombie_bucket':
        drawMathZombie(ctx, 'bucket', cx, cy + 6, t, { hpRatio: 1, armorRatio: 1, hasBucket: true, jumpOffset: 0, chilled: false, hitFlash: 0, formulaShield: null });
        break;
      case 'zombie_hopper':
        drawMathZombie(ctx, 'hopper', cx, cy + 6, t, { hpRatio: 1, armorRatio: 0, hasBucket: false, jumpOffset: 4, chilled: false, hitFlash: 0, formulaShield: null });
        break;
      case 'zombie_sprinter':
        drawMathZombie(ctx, 'sprinter', cx, cy + 6, t, { hpRatio: 1, armorRatio: 0, hasBucket: false, jumpOffset: 0, chilled: false, hitFlash: 0, formulaShield: null });
        break;
      case 'zombie_mage':
        drawMathZombie(ctx, 'mage', cx, cy + 6, t, { hpRatio: 1, armorRatio: 1, hasBucket: false, jumpOffset: 0, chilled: false, hitFlash: 0, formulaShield: '3x=9' });
        break;
      case 'zombie_fusion':
        drawMathZombie(ctx, 'fusion', cx, cy + 8, t, { hpRatio: 1, armorRatio: 1, hasBucket: false, jumpOffset: 0, chilled: false, hitFlash: 0, formulaShield: 'Boss' });
        break;
      case 'dragon_lord':
        ctx.save();
        ctx.translate(cx, cy + 4);
        ctx.scale(0.62, 0.62);
        drawDarkGluttonBoss(ctx, 0, 0, t, 1, 0);
        ctx.restore();
        break;
      case 'tower_lord':
      default:
        ctx.save();
        ctx.translate(cx, cy + 2);
        ctx.scale(0.68, 0.68);
        drawInkMonster(ctx, 'boss', 0, 0, t, { hpRatio: 1, shielded: true, hitFlash: 0, scale: 0.9 });
        ctx.restore();
        break;
    }

    ctx.restore();
  }, [discovered, entry.renderKind]);

  return (
    <canvas
      ref={ref}
      className="w-full h-24 rounded-xl border border-white/10 block bg-slate-950"
    />
  );
};

export const BestiaryScreen: React.FC<BestiaryScreenProps> = ({ onExit }) => {
  const { save } = useGameState();
  const [filter, setFilter] = useState<'all' | BestiaryEntry['world']>('all');
  const [selected, setSelected] = useState<BestiaryEntry>(BESTIARY_CATALOG[0]);

  const discoveredSet = new Set(save.discoveredBestiary ?? []);
  const discoveredCount = discoveredSet.size;
  const bonusPct = getBestiaryBonusPercent(save.discoveredBestiary ?? []);
  const filtered =
    filter === 'all' ? BESTIARY_CATALOG : BESTIARY_CATALOG.filter((e) => e.world === filter);

  return (
    <div className="w-screen h-[100dvh] flex flex-col bg-slate-950 text-white overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Sticky Single-Row Top Header */}
      <header className="h-12 shrink-0 px-3 bg-slate-900/95 border-b border-white/10 flex items-center justify-between gap-2 whitespace-nowrap">
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
          <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="text-sm font-black text-amber-300 truncate">智光魔物圖鑑</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-black shrink-0">
          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200">
            收錄 {discoveredCount}/{BESTIARY_CATALOG.length}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
            全屬性 +{bonusPct}%
          </span>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="shrink-0 px-3 py-2 bg-slate-900/70 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto">
        {WORLD_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setFilter(f.id);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap border transition ${
              filter === f.id
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Main Content: Detail Spotlight + Scrollable Grid */}
      <div className="flex-1 min-h-0 flex flex-col landscape:flex-row overflow-hidden">
        {/* Selected Monster Spotlight */}
        <div className="shrink-0 landscape:w-[38%] p-3 bg-gradient-to-b from-indigo-950/60 to-slate-950 border-b landscape:border-b-0 landscape:border-r border-white/10 flex flex-col gap-2.5 overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="w-36 shrink-0">
              <MonsterPortraitCanvas
                entry={selected}
                discovered={discoveredSet.has(selected.id)}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-black">
                <Sparkles className="w-3 h-3" /> {selected.hpTier}
              </div>
              <h2 className="text-base font-black text-white truncate">
                {discoveredSet.has(selected.id) ? selected.name : '？？？未知魔物'}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">{selected.title}</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-white/10 p-2.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-rose-300 font-black">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              弱點攻略：{selected.weakness}
            </div>
            <p className="text-slate-200 leading-relaxed text-[11px]">
              {discoveredSet.has(selected.id)
                ? selected.trivia
                : '前往對應科目世界或試煉之塔擊敗此魔物即可解鎖完整 108 課綱知識百科與永久戰力加成！'}
            </p>
          </div>
        </div>

        {/* Monster Cards Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pb-6">
            {filtered.map((entry) => {
              const found = discoveredSet.has(entry.id);
              const isSelected = selected.id === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setSelected(entry);
                  }}
                  className={`rounded-2xl p-2 text-left border-2 transition flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-950/80 border-amber-400 shadow-md shadow-amber-400/20'
                      : 'bg-slate-900/80 border-white/10 hover:border-cyan-400/50'
                  }`}
                >
                  <div className="relative">
                    <MonsterPortraitCanvas entry={entry} discovered={found} />
                    {!found && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-black text-white truncate">
                    {found ? entry.name : '？？？未解鎖'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 truncate">
                    {entry.hpTier}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
