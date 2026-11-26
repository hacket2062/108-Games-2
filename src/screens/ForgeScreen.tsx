import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Coins,
  Flame,
  Hammer,
  Shield,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { AscensionPath, EquipmentSlotId, WeaponInstance } from '../types/game';
import { useGameState } from '../core/GameStateContext';
import {
  ASCENSION_PATHS,
  FUSION_RECIPES,
  getEnhanceCost,
  getEnhanceSuccessRate,
} from '../data/itemsAndGems';
import { computeWeaponPower } from '../core/combatMath';
import { soundEngine } from '../audio/soundEngine';

interface ForgeScreenProps {
  onExit: () => void;
}

const GEAR_SLOTS: {
  slot: EquipmentSlotId;
  name: string;
  statLabel: string;
  accent: string;
}[] = [
  { slot: 'weapon', name: '主武器槽', statLabel: '全科攻擊 +2/級', accent: '#F59E0B' },
  { slot: 'helm', name: '智慧頭冠', statLabel: '最大 HP +12/級', accent: '#38BDF8' },
  { slot: 'armor', name: '學園戰甲', statLabel: '護甲與耐力 +14/級', accent: '#10B981' },
  { slot: 'gloves', name: '速寫護手', statLabel: '暴擊與攻速 +1.2%/級', accent: '#F43F5E' },
  { slot: 'boots', name: '疾風戰靴', statLabel: '移動與連擊時間 +4%/級', accent: '#A855F7' },
  { slot: 'amulet', name: '星光護符', statLabel: '經驗／必殺充能 +5%/級', accent: '#FACC15' },
];

function getWeaponRarity(w: WeaponInstance): { label: 'R' | 'SR' | 'SSR' | 'UR'; color: string } {
  if (w.templateId === 'fused_eternal_blade' || (w.ascensionPath !== 'base' && w.enhanceLevel >= 12)) {
    return { label: 'UR', color: '#F43F5E' };
  }
  if (w.ascensionPath !== 'base' || w.enhanceLevel >= 8) {
    return { label: 'SSR', color: '#F59E0B' };
  }
  if (w.enhanceLevel >= 4 || w.baseAttack >= 20) {
    return { label: 'SR', color: '#A855F7' };
  }
  return { label: 'R', color: '#38BDF8' };
}

export const ForgeScreen: React.FC<ForgeScreenProps> = ({ onExit }) => {
  const {
    save,
    equippedWeapon,
    equipWeapon,
    enhanceWeapon,
    ascendWeapon,
    fuseWeapons,
    upgradeEquipmentSlot,
  } = useGameState();

  const [selectedUid, setSelectedUid] = useState<string>(equippedWeapon.uid);
  const [tab, setTab] = useState<'enhance' | 'ascend' | 'fuse' | 'gear'>('enhance');
  const [useGuard, setUseGuard] = useState(true);
  const [fusePartnerUid, setFusePartnerUid] = useState<string>('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [forgingFlash, setForgingFlash] = useState(false);

  const selectedWeapon =
    save.weapons.find((w) => w.uid === selectedUid) ?? save.weapons[0] ?? equippedWeapon;
  const power = computeWeaponPower(selectedWeapon);
  const pathDef = ASCENSION_PATHS[selectedWeapon.ascensionPath];
  const enhanceCost = getEnhanceCost(selectedWeapon.enhanceLevel);
  const successRate = getEnhanceSuccessRate(selectedWeapon.enhanceLevel);

  const handleEnhance = () => {
    soundEngine.playForgeHammer();
    setForgingFlash(true);
    window.setTimeout(() => setForgingFlash(false), 320);
    const res = enhanceWeapon(
      selectedWeapon.uid,
      useGuard && selectedWeapon.enhanceLevel >= 7 && (save.items.forge_guard ?? 0) > 0
    );
    setFeedback(res);
  };

  const handleAscend = (path: AscensionPath) => {
    const res = ascendWeapon(selectedWeapon.uid, path);
    setFeedback(res);
  };

  const handleFuse = () => {
    if (!fusePartnerUid) {
      setFeedback({ ok: false, message: '請先挑選另一把神兵作為融合素材！' });
      return;
    }
    const res = fuseWeapons(selectedWeapon.uid, fusePartnerUid);
    setFeedback(res);
    if (res.ok) {
      setFusePartnerUid('');
    }
  };

  const otherWeapons = save.weapons.filter((w) => w.uid !== selectedWeapon.uid);
  const fusionRecipe = FUSION_RECIPES[0];

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col overflow-hidden" data-testid="forge-screen">
      {/* Top Bar */}
      <div className="shrink-0 bg-slate-900 border-b-2 border-amber-500/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="min-h-[44px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-black text-xs inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> 返回廣場
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-amber-300 flex items-center gap-1.5">
              <Hammer className="w-5 h-5" /> 神兵鍛造屋
            </h1>
            <p className="text-xs text-slate-400">
              +0~+15 強化鍛造 · 英雄／神話／地獄三路線覺醒 · 神兵融合爐
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-black font-mono-num">
          <span className="text-amber-300 inline-flex items-center gap-1">
            <Coins className="w-4 h-4" /> {save.coins}
          </span>
          <span className="text-cyan-300 inline-flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> {save.crystals}
          </span>
          <span className="text-rose-300 text-xs">
            保護卷軸 ×{save.items.forge_guard ?? 0}
          </span>
        </div>
      </div>

      {/* Main Responsive Workspace */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 cols: Weapon Showcase Aura Preview + Owned Inventory */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Live Visual Weapon Aura Pedestal */}
            <div
              className={`rounded-3xl bg-slate-900 border-2 p-5 transition-all ${
                forgingFlash ? 'scale-[1.02] brightness-125' : ''
              }`}
              style={{
                borderColor: pathDef.auraPrimary,
                boxShadow: `0 0 30px ${pathDef.auraPrimary}33`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-black px-2 py-1 rounded-lg text-slate-950 font-mono-num"
                    style={{ backgroundColor: getWeaponRarity(selectedWeapon).color }}
                  >
                    {getWeaponRarity(selectedWeapon).label}
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-amber-300">
                    {pathDef.name}
                  </span>
                </div>
                {save.equippedWeaponUid === selectedWeapon.uid ? (
                  <span className="text-xs font-black text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> 目前裝備中
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      equipWeapon(selectedWeapon.uid);
                    }}
                    className="min-h-[36px] px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                  >
                    切換裝備
                  </button>
                )}
              </div>

              {/* Stylized SVG Ascended Blade & Aura Rings */}
              <div className="my-4 flex items-center justify-center">
                <svg viewBox="0 0 220 130" className="w-56 h-32" aria-label={selectedWeapon.name}>
                  <defs>
                    <radialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor={pathDef.auraPrimary} stopOpacity="0.55" />
                      <stop offset="100%" stopColor={pathDef.auraPrimary} stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="110" cy="65" r="58" fill="url(#auraGrad)" />
                  <ellipse
                    cx="110"
                    cy="65"
                    rx="72"
                    ry="24"
                    fill="none"
                    stroke={pathDef.auraPrimary}
                    strokeWidth="2.5"
                    strokeDasharray={selectedWeapon.ascensionPath === 'mythic' ? '8 5' : undefined}
                  />
                  {/* Diagonal Sword Silhouette */}
                  <g transform="translate(110 65) rotate(-32)">
                    <polygon
                      points="0,-54 9,14 0,24 -9,14"
                      fill={selectedWeapon.ascensionPath === 'base' ? '#E2E8F0' : pathDef.auraSecondary}
                      stroke="#0F172A"
                      strokeWidth="3"
                    />
                    <rect x="-18" y="14" width="36" height="8" rx="3" fill={pathDef.auraPrimary} stroke="#0F172A" strokeWidth="2.5" />
                    <rect x="-4" y="22" width="8" height="22" rx="2" fill="#475569" stroke="#0F172A" strokeWidth="2" />
                    <circle cx="0" cy="46" r="6" fill={pathDef.auraPrimary} stroke="#0F172A" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              <div className="text-center">
                <div className="text-xl font-black text-white">
                  {selectedWeapon.name}{' '}
                  <span className="font-mono-num" style={{ color: pathDef.auraPrimary }}>
                    +{selectedWeapon.enhanceLevel}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
                    <div className="text-[10px] text-slate-400">總攻擊</div>
                    <div className="text-sm font-black text-amber-300 font-mono-num">{power.attack}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
                    <div className="text-[10px] text-slate-400">附加 HP</div>
                    <div className="text-sm font-black text-emerald-300 font-mono-num">+{power.hp}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
                    <div className="text-[10px] text-slate-400">暴擊率</div>
                    <div className="text-sm font-black text-rose-300 font-mono-num">
                      {Math.round(power.critChance * 100)}%
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-2">
                    <div className="text-[10px] text-slate-400">減傷</div>
                    <div className="text-sm font-black text-sky-300 font-mono-num">
                      {Math.round(power.shieldMitigation * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weapon Inventory List */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
              <div className="text-xs font-black text-slate-400">我的神兵庫（{save.weapons.length} 把）</div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {save.weapons.map((w) => {
                  const active = w.uid === selectedWeapon.uid;
                  const p = ASCENSION_PATHS[w.ascensionPath];
                  return (
                    <button
                      key={w.uid}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedUid(w.uid);
                      }}
                      className={`w-full min-h-[52px] rounded-xl px-3.5 py-2 border-2 text-left flex items-center justify-between transition-colors ${
                        active
                          ? 'bg-slate-800 border-amber-400'
                          : 'bg-slate-950 hover:bg-slate-800/70 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-black text-white flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-black px-1.5 py-0.5 rounded text-slate-950 font-mono-num"
                            style={{ backgroundColor: getWeaponRarity(w).color }}
                          >
                            {getWeaponRarity(w).label}
                          </span>
                          <span>{w.name}</span>
                          <span className="font-mono-num" style={{ color: p.auraPrimary }}>
                            +{w.enhanceLevel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.name} · 攻擊 {computeWeaponPower(w).attack}
                        </div>
                      </div>
                      {save.equippedWeaponUid === w.uid && (
                        <span className="text-[11px] font-black text-emerald-400">裝備中</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 7 cols: 4 Forge Tabs */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              {(
                [
                  ['enhance', '神兵強化'],
                  ['ascend', '三路線升階'],
                  ['gear', '六大裝備槽'],
                  ['fuse', '神兵融合爐'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setTab(id);
                  }}
                  className={`min-h-[46px] rounded-xl text-xs sm:text-sm font-black transition-colors ${
                    tab === id
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {feedback && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-black border-2 ${
                  feedback.ok
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-400 text-rose-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            {/* TAB 1: +0~+15 ENHANCE */}
            {tab === 'enhance' && (
              <div className="rounded-3xl bg-slate-900 border-2 border-slate-700 p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-black text-white">
                      強化等級：+{selectedWeapon.enhanceLevel} → +{Math.min(15, selectedWeapon.enhanceLevel + 1)}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      強化達 +5 即可解鎖英雄／神話／地獄三路線覺醒！
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">本次鍛造成功率</div>
                    <div className={`text-2xl font-black font-mono-num ${successRate >= 70 ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {selectedWeapon.enhanceLevel >= 15 ? 'MAX' : `${successRate}%`}
                    </div>
                  </div>
                </div>

                {/* Progress Bar 0..15 */}
                <div className="grid grid-cols-15 gap-1">
                  {Array.from({ length: 15 }, (_, idx) => (
                    <div
                      key={idx}
                      className={`h-3 rounded-sm ${
                        idx < selectedWeapon.enhanceLevel ? 'bg-amber-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-200">
                    本次消耗：
                    <span className="text-amber-300 font-mono-num ml-1">{enhanceCost.coins} 金幣</span>
                    {enhanceCost.crystals > 0 && (
                      <span className="text-cyan-300 font-mono-num ml-2">+ {enhanceCost.crystals} 晶石</span>
                    )}
                  </div>
                  {selectedWeapon.enhanceLevel >= 7 && (
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-rose-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useGuard}
                        onChange={(e) => setUseGuard(e.target.checked)}
                        className="w-4 h-4 accent-rose-500"
                      />
                      使用神匠保護卷軸（剩餘 {save.items.forge_guard ?? 0}）
                    </label>
                  )}
                </div>

                <button
                  type="button"
                  disabled={selectedWeapon.enhanceLevel >= 15}
                  onClick={handleEnhance}
                  className="w-full min-h-[58px] rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 hover:brightness-110 disabled:opacity-40 text-slate-950 font-black text-lg shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Hammer className="w-5 h-5" />
                  {selectedWeapon.enhanceLevel >= 15 ? '已達傳說滿級 +15' : '敲擊鐵砧・立即強化！'}
                </button>
              </div>
            )}

            {/* TAB 2: 3-PATH ASCENSION */}
            {tab === 'ascend' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {(['hero', 'mythic', 'inferno'] as AscensionPath[]).map((pathKey) => {
                  const def = ASCENSION_PATHS[pathKey];
                  const isCurrent = selectedWeapon.ascensionPath === pathKey;
                  const meetsEnhance = selectedWeapon.enhanceLevel >= def.minEnhanceLevel;
                  const Icon = pathKey === 'hero' ? Shield : pathKey === 'mythic' ? Zap : Flame;
                  return (
                    <div
                      key={pathKey}
                      className="rounded-3xl bg-slate-900 border-2 p-4 flex flex-col justify-between gap-3"
                      style={{ borderColor: isCurrent ? '#10B981' : def.auraPrimary }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-950"
                            style={{ backgroundColor: def.auraPrimary }}
                          >
                            <Icon className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="text-sm font-black text-white">{def.name}</div>
                            <div className="text-[11px] text-slate-400">{def.passiveTitle}</div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                          {def.passiveDesc}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[11px] font-mono-num text-slate-400">
                          條件：+{def.minEnhanceLevel} · {def.coinCost}金幣 + {def.crystalCost}晶石
                        </div>
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => handleAscend(pathKey)}
                          className={`w-full min-h-[48px] rounded-xl font-black text-xs transition-transform active:scale-95 ${
                            isCurrent
                              ? 'bg-emerald-900/60 text-emerald-300 cursor-default'
                              : meetsEnhance
                                ? 'text-slate-950 hover:brightness-110'
                                : 'bg-slate-800 text-slate-400'
                          }`}
                          style={
                            !isCurrent && meetsEnhance
                              ? { backgroundColor: def.auraPrimary }
                              : undefined
                          }
                        >
                          {isCurrent ? '已覺醒此路線' : meetsEnhance ? '立即覺醒升階！' : `需強化至 +${def.minEnhanceLevel}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 4: 6-SLOT EQUIPMENT NO-BREAK STRENGTHENING */}
            {tab === 'gear' && (
              <div className="rounded-3xl bg-slate-900 border-2 border-emerald-500/60 p-5 space-y-4">
                <div>
                  <div className="text-base font-black text-emerald-300 flex items-center gap-2">
                    <Shield className="w-5 h-5" /> 六大防具與飾品強化（+0~+15 絕不爆裝）
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    全面強化頭盔、戰甲、護手、戰靴、護符與主武器槽，大幅提升四大世界與競技場基礎戰力！
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GEAR_SLOTS.map((g) => {
                    const lv = save.equipment?.[g.slot] ?? 0;
                    const costCoins = 55 + lv * 35;
                    const costCrystals = lv >= 6 ? Math.floor((lv - 4) / 2) : 0;
                    const maxed = lv >= 15;
                    return (
                      <div
                        key={g.slot}
                        className="rounded-2xl bg-slate-950 border-2 border-slate-800 p-3.5 flex flex-col justify-between gap-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-black text-white flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: g.accent }}
                              />
                              {g.name}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{g.statLabel}</div>
                          </div>
                          <span
                            className="text-base font-black font-mono-num"
                            style={{ color: g.accent }}
                          >
                            +{lv}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={maxed}
                          onClick={() => {
                            soundEngine.playForgeHammer();
                            const res = upgradeEquipmentSlot(g.slot);
                            setFeedback(res);
                          }}
                          className="min-h-[44px] w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs transition-transform active:scale-95"
                        >
                          {maxed
                            ? '已滿級 +15'
                            : `無爆強化（${costCoins}金幣${costCrystals > 0 ? ` + ${costCrystals}晶石` : ''}）`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: WEAPON FUSION */}
            {tab === 'fuse' && (
              <div className="rounded-3xl bg-slate-900 border-2 border-fuchsia-500/70 p-5 space-y-4">
                <div>
                  <div className="text-base font-black text-fuchsia-300 flex items-center gap-2">
                    <Swords className="w-5 h-5" /> 融合配方：{fusionRecipe.resultName}（基礎攻擊 {fusionRecipe.resultBaseAttack}）
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{fusionRecipe.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-950 border border-amber-400/60 p-3.5">
                    <div className="text-xs text-slate-400">主神兵（左側已選擇）</div>
                    <div className="text-base font-black text-amber-300 mt-1">
                      {selectedWeapon.name} +{selectedWeapon.enhanceLevel}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-950 border border-slate-700 p-3.5">
                    <div className="text-xs text-slate-400 mb-1.5">選擇副素材神兵</div>
                    {otherWeapons.length === 0 ? (
                      <div className="text-xs text-rose-300">
                        背包僅剩 1 把神兵，請先至魔法商店購入第二把神兵進行融合！
                      </div>
                    ) : (
                      <select
                        value={fusePartnerUid}
                        onChange={(e) => setFusePartnerUid(e.target.value)}
                        className="w-full min-h-[42px] rounded-xl bg-slate-900 border border-slate-600 px-3 text-sm font-bold text-white"
                      >
                        <option value="">-- 請選擇第二把神兵 --</option>
                        {otherWeapons.map((w) => (
                          <option key={w.uid} value={w.uid}>
                            {w.name} (+{w.enhanceLevel})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={otherWeapons.length === 0 || !fusePartnerUid}
                  onClick={handleFuse}
                  className="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:brightness-110 disabled:opacity-40 text-white font-black text-base shadow-xl"
                >
                  開始神兵融合（消耗 {fusionRecipe.coinCost} 金幣 + {fusionRecipe.crystalCost} 晶石）
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
