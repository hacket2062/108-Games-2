import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Crown, Lock, Shield, Sparkles, Swords, Wand2, X } from 'lucide-react';
import { GuardianId, HeroClassBranch, HeroClassId, HeroTierId } from '../types/game';
import { useGameState } from '../core/GameStateContext';
import {
  canAdvanceHeroTier,
  canSelectHeroClass,
  createInitialHeroProgression,
  HERO_CLASSES,
  HERO_TIERS,
} from '../data/heroProgression';
import { xpRequiredForLevel } from '../core/combatMath';
import { GUARDIAN_LIST } from '../data/spiritsAndTitles';
import { gamepadManager } from '../core/gamepadManager';
import { soundEngine } from '../audio/soundEngine';

interface ClassAdvancementModalProps {
  open: boolean;
  onClose: () => void;
}

const BRANCH_TABS: { id: Exclude<HeroClassBranch, 'none'>; label: string; icon: React.ReactNode; color: string; classes: [HeroClassId, HeroClassId] }[] = [
  {
    id: 'blade',
    label: '破軍武聖',
    icon: <Swords className="w-4 h-4" />,
    color: 'from-rose-600 to-amber-500',
    classes: ['star_swordsman', 'peerless_warlord'],
  },
  {
    id: 'arcane',
    label: '奧術賢者',
    icon: <Wand2 className="w-4 h-4" />,
    color: 'from-violet-600 to-cyan-500',
    classes: ['element_mage', 'astral_archmage'],
  },
  {
    id: 'guardian',
    label: '聖盾御獸',
    icon: <Shield className="w-4 h-4" />,
    color: 'from-emerald-600 to-amber-400',
    classes: ['holy_sentinel', 'beast_sovereign'],
  },
];

export const ClassAdvancementModal: React.FC<ClassAdvancementModalProps> = ({ open, onClose }) => {
  const { save, combatStats, advanceHeroTier, selectHeroClass, setSecondaryGuardian } = useGameState();
  const prog = save.heroProgression ?? createInitialHeroProgression();
  const [branchIdx, setBranchIdx] = useState<number>(() => {
    const idx = BRANCH_TABS.findIndex((b) => b.id === prog.classBranch);
    return idx >= 0 ? idx : 0;
  });
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const tierDef = HERO_TIERS[prog.tier];
  const currentClassDef = HERO_CLASSES[prog.classId];
  const tierCheck = canAdvanceHeroTier(save.level, save.coins, prog);
  const xpReq = xpRequiredForLevel(save.level);
  const xpPct = Math.min(100, Math.round((save.xp / Math.max(1, xpReq)) * 100));

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 1800);
    return () => clearTimeout(t);
  }, [feedback]);

  // Switch Gamepad L/R tab switching + B close support
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      const snap = gamepadManager.poll();
      const p1 = snap.players.find((p) => p.connected);
      if (!p1) return;
      if (p1.justPressed.tabLeft) {
        soundEngine.playClick();
        setBranchIdx((i) => (i + BRANCH_TABS.length - 1) % BRANCH_TABS.length);
      }
      if (p1.justPressed.tabRight) {
        soundEngine.playClick();
        setBranchIdx((i) => (i + 1) % BRANCH_TABS.length);
      }
      if (p1.justPressed.cancel) {
        soundEngine.playClick();
        onClose();
      }
    }, 80);
    return () => clearInterval(id);
  }, [open, onClose]);

  if (!open) return null;

  const activeBranch = BRANCH_TABS[branchIdx];

  const handleBreakthrough = () => {
    const res = advanceHeroTier();
    setFeedback({ ok: res.ok, text: res.message });
  };

  const handleSelectClass = (classId: HeroClassId) => {
    const res = selectHeroClass(classId);
    setFeedback({ ok: res.ok, text: res.message });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="w-full max-w-3xl max-h-[92dvh] rounded-3xl bg-slate-900 border-2 border-amber-400/50 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Sticky Modal Header */}
        <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-slate-950 shadow-md shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-amber-300 truncate">
                ⚔️ 英雄轉職與階級進階殿堂
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                目前：{tierDef.name}｜職業：{currentClassDef.name}（L / R 切換流派）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 flex items-center justify-center text-slate-200 shrink-0"
            aria-label="關閉轉職視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Auto-Dismiss Feedback */}
        {feedback && (
          <div
            className={`mx-4 mt-2 px-3 py-1.5 rounded-xl text-xs font-black text-center border ${
              feedback.ok
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                : 'bg-rose-500/20 border-rose-400/50 text-rose-200'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
          {/* Section 1: Hero Level & 4-Tier Breakthrough */}
          <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                  Lv.{save.level} / 60
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs font-black">
                  🏅 進階徽章 {prog.badges} 枚
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 text-xs font-black">
                  ⚔️ ATK {combatStats.baseAttack} ｜ ❤️ HP {combatStats.maxHp}
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-400">
                EXP {save.xp} / {xpReq}（{xpPct}%）
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-orange-500 transition-all duration-300"
                style={{ width: `${xpPct}%` }}
              />
            </div>

            {/* 4-Tier Ladder */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([1, 2, 3, 4] as HeroTierId[]).map((t) => {
                const td = HERO_TIERS[t];
                const reached = prog.tier >= t;
                const isCurrent = prog.tier === t;
                return (
                  <div
                    key={t}
                    className={`rounded-xl p-2.5 border transition ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                        : reached
                          ? 'bg-emerald-500/10 border-emerald-400/40'
                          : 'bg-slate-900/70 border-white/10 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-black text-white truncate">{td.name}</span>
                      {reached ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] text-amber-300 font-bold mt-1">
                      Lv.{td.minLevel} ｜ ATK +{td.attackBonusPct}% HP +{td.hpBonusPct}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      {td.unlockNote}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Breakthrough Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/10">
              {prog.tier < 4 && tierCheck.nextTier ? (
                <>
                  <div className="text-xs text-slate-300">
                    下一階：<strong className="text-amber-300">{tierCheck.nextTier.name}</strong>
                    <span className="ml-2 text-slate-400">
                      需求 Lv.{tierCheck.nextTier.minLevel}・🏅{tierCheck.nextTier.badgeCost}・🪙{tierCheck.nextTier.coinCost}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBreakthrough}
                    className={`px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition shrink-0 ${
                      tierCheck.ok
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95'
                        : 'bg-slate-800 text-slate-400 border border-white/10'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    {tierCheck.ok ? '立即突破階級！' : tierCheck.reason ?? '條件尚未達成'}
                  </button>
                </>
              ) : (
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  已達四階・傳說智光聖者！金色聖光之翼與全職業被動共鳴已永久覺醒！
                </div>
              )}
            </div>
          </div>

          {/* Section 2: 3-Branch Class Specialization */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              {BRANCH_TABS.map((tab, idx) => {
                const active = idx === branchIdx;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setBranchIdx(idx);
                    }}
                    className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition ${
                      active
                        ? `bg-gradient-to-r ${tab.color} text-white border-white/30 shadow-md`
                        : 'bg-slate-950/70 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 2 Classes in Selected Branch (1st Job + 2nd Ultimate Job) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeBranch.classes.map((cid) => {
                const def = HERO_CLASSES[cid];
                const isSelected = prog.classId === cid;
                const unlockCheck = canSelectHeroClass(cid, prog);
                return (
                  <div
                    key={cid}
                    className={`rounded-2xl p-3.5 border-2 flex flex-col justify-between gap-2.5 transition ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-950/90 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/15'
                        : 'bg-slate-950/75 border-white/10'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-lg text-white"
                          style={{ backgroundColor: def.badgeColor }}
                        >
                          {def.branchLabel}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          需 {HERO_TIERS[def.requiredTier].name.slice(0, 2)}
                        </span>
                      </div>
                      <div className="text-base font-black text-white flex items-center gap-2">
                        {def.name}
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">
                            使用中
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-amber-300">{def.tagline}</div>
                      <div className="rounded-xl bg-slate-900/90 border border-white/10 p-2.5 text-xs text-slate-200 leading-relaxed">
                        <div className="font-black text-cyan-300 mb-0.5">✨ {def.passiveTitle}</div>
                        {def.passiveDesc}
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300">
                          ATK +{def.attackBonus}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300">
                          HP +{def.hpBonus}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300">
                          暴擊 +{Math.round(def.critBonus * 100)}%
                        </span>
                        {def.thinkTimeBonusSec > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300">
                            思考 +{def.thinkTimeBonusSec}s
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">🎨 戰場特效：{def.visualEffectDesc}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectClass(cid)}
                      disabled={isSelected}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                          : unlockCheck.ok
                            ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 text-white active:scale-95'
                            : 'bg-slate-800 text-slate-400 border border-white/10'
                      }`}
                    >
                      {isSelected
                        ? '✔ 目前已啟用此職業'
                        : unlockCheck.ok
                          ? `轉職為【${def.name}】`
                          : `🔒 ${unlockCheck.reason}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Dual Spirit Selector for Spirit Tamer */}
            {activeBranch.id === 'guardian' && (
              <div className="rounded-2xl bg-slate-950/80 border border-emerald-400/30 p-3 space-y-2">
                <div className="text-xs font-black text-emerald-300">
                  🐉 萬靈御獸師專屬・第二守護精靈設定（與主精靈同時出戰）
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GUARDIAN_LIST.map((sp) => {
                    const isSec = prog.secondaryGuardian === sp.id;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playPetChime();
                          setSecondaryGuardian(sp.id as GuardianId);
                        }}
                        className={`px-2.5 py-2 rounded-xl text-xs font-black border transition ${
                          isSec
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {sp.name} {isSec ? '★' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
