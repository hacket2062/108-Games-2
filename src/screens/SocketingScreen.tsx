import React, { useMemo, useState } from 'react';
import { ArrowLeft, Gem, Plus, Sparkles, Unlink } from 'lucide-react';
import { GemElementId } from '../types/game';
import { useGameState } from '../core/GameStateContext';
import { GEM_ELEMENTS } from '../data/itemsAndGems';
import { computeWeaponPower } from '../core/combatMath';
import { soundEngine } from '../audio/soundEngine';
import {WeaponArt} from '../components/EquipmentArt';

interface SocketingScreenProps {
  onExit: () => void;
}

export const SocketingScreen: React.FC<SocketingScreenProps> = ({ onExit }) => {
  const { save, equippedWeapon, socketGem, unsocketGem, synthesizeGems } = useGameState();

  const [selectedWeaponUid, setSelectedWeaponUid] = useState(equippedWeapon.uid);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const weapon =
    save.weapons.find((w) => w.uid === selectedWeaponUid) ?? save.weapons[0] ?? equippedWeapon;
  const power = computeWeaponPower(weapon);

  // Group bag gems by element + level for 3-to-1 synthesis!
  const synthGroups = useMemo(() => {
    const map = new Map<string, { element: GemElementId; level: 1 | 2 | 3 | 4; count: number }>();
    for (const g of save.gemBag) {
      if (g.level >= 5) continue;
      const key = `${g.element}_${g.level}`;
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { element: g.element, level: g.level as 1 | 2 | 3 | 4, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.level - a.level);
  }, [save.gemBag]);

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col overflow-hidden" data-testid="socketing-screen">
      {/* Header */}
      <div className="shrink-0 bg-slate-900 border-b-2 border-cyan-500/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
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
            <h1 className="text-lg sm:text-xl font-black text-cyan-300 flex items-center gap-1.5">
              <Gem className="w-5 h-5" /> 寶石鑲嵌工坊
            </h1>
            <p className="text-xs text-slate-400">
              3 顆同級寶石無痛合成升階（Lv.1 → Lv.5）· 全程無損鑲嵌與拆卸
            </p>
          </div>
        </div>

        <select
          value={weapon.uid}
          onChange={(e) => setSelectedWeaponUid(e.target.value)}
          className="min-h-[44px] rounded-xl bg-slate-950 border-2 border-cyan-400/70 px-3 text-sm font-black text-white"
        >
          {save.weapons.map((w) => (
            <option key={w.uid} value={w.uid}>
              {w.name} (+{w.enhanceLevel})
            </option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-5">
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

          <WeaponArt weapon={weapon} className="shop-item-art"/>
          {/* Top Card: Weapon 3 Gem Slots + Live Total Stat */}
          <div className="rounded-3xl bg-slate-900 border-2 border-cyan-500/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-base font-black text-white">
                  {weapon.name} +{weapon.enhanceLevel} 的知識寶石槽
                </div>
                <div className="text-xs text-slate-400">
                  點選下方槽位後再點選背包寶石即可鑲嵌；點擊已鑲嵌寶石即可無損拆下
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-black font-mono-num">
                <span className="text-amber-300">總攻 {power.attack}</span>
                <span className="text-emerald-300">HP +{power.hp}</span>
                <span className="text-rose-300">暴擊 {Math.round(power.critChance * 100)}%</span>
                <span className="text-cyan-300">必殺 +{power.ultBonus}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {weapon.socketedGems.map((slotGem, idx) => {
                const isSelected = activeSlot === idx;
                const def = slotGem ? GEM_ELEMENTS[slotGem.element] : null;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 border-2 transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-800 border-amber-400 shadow-lg'
                        : 'bg-slate-950 border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setActiveSlot(idx);
                      }}
                      className="flex-1 text-left flex items-center gap-3 min-h-[52px]"
                    >
                      <div
                        className="w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 font-black text-sm"
                        style={{
                          borderColor: def ? def.color : '#475569',
                          backgroundColor: def ? `${def.color}33` : '#0F172A',
                          color: def ? def.color : '#64748B',
                        }}
                      >
                        {slotGem ? `Lv.${slotGem.level}` : <Plus className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-bold">
                          槽位 {idx + 1} {isSelected ? '（已選取）' : ''}
                        </div>
                        <div className="text-sm font-black text-white">
                          {def ? def.name : '空槽位・點擊鑲嵌'}
                        </div>
                        {def && slotGem && (
                          <div className="text-[11px] text-slate-300">
                            攻+{def.attackPerLevel * slotGem.level} · HP+{def.hpPerLevel * slotGem.level}
                          </div>
                        )}
                      </div>
                    </button>

                    {slotGem && (
                      <button
                        type="button"
                        onClick={() => setFeedback(unsocketGem(weapon.uid, idx))}
                        className="min-h-[44px] px-3 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-black inline-flex items-center gap-1 shrink-0"
                      >
                        <Unlink className="w-3.5 h-3.5" /> 拆下
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 5 cols: 3-to-1 Gem Synthesis Altar */}
            <div className="lg:col-span-5 rounded-3xl bg-slate-900 border-2 border-fuchsia-500/50 p-4 space-y-3">
              <div className="text-sm font-black text-fuchsia-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> 3 合 1 寶石合成台（最高 Lv.5）
              </div>
              {synthGroups.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  背包尚無可合成寶石，通關世界 Boss 或至魔法商店即可收集寶石！
                </div>
              ) : (
                <div className="space-y-2">
                  {synthGroups.map((g) => {
                    const def = GEM_ELEMENTS[g.element];
                    const ready = g.count >= 3;
                    return (
                      <div
                        key={`${g.element}-${g.level}`}
                        className="rounded-xl bg-slate-950 border border-slate-800 p-3 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-black"
                            style={{ borderColor: def.color, color: def.color }}
                          >
                            {g.level}
                          </span>
                          <div>
                            <div className="text-xs font-black text-white">
                              Lv.{g.level} {def.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono-num">
                              持有 {g.count} / 3 顆
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!ready}
                          onClick={() => setFeedback(synthesizeGems(g.element, g.level))}
                          className={`min-h-[42px] px-3 rounded-xl font-black text-xs ${
                            ready
                              ? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          合成 Lv.{g.level + 1}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right 7 cols: Gem Bag Grid */}
            <div className="lg:col-span-7 rounded-3xl bg-slate-900 border-2 border-slate-700 p-4 space-y-3">
              <div className="text-sm font-black text-amber-300">
                寶石背包（共 {save.gemBag.length} 顆 · 點擊鑲嵌至槽位 {activeSlot + 1}）
              </div>
              {save.gemBag.length === 0 ? (
                <div className="text-xs text-slate-400 py-8 text-center">
                  背包目前沒有閒置寶石，可從上方武器無損拆下或前往魔法商店購買。
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {save.gemBag.map((gem) => {
                    const def = GEM_ELEMENTS[gem.element];
                    return (
                      <button
                        key={gem.uid}
                        type="button"
                        onClick={() => setFeedback(socketGem(weapon.uid, activeSlot, gem.uid))}
                        className="min-h-[64px] rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-400 p-3 text-left flex items-center justify-between gap-2 transition-transform active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-xs shrink-0"
                            style={{
                              borderColor: def.color,
                              backgroundColor: `${def.color}25`,
                              color: def.color,
                            }}
                          >
                            Lv.{gem.level}
                          </div>
                          <div>
                            <div className="text-sm font-black text-white">{def.name}</div>
                            <div className="text-[11px] text-slate-400">
                              攻+{def.attackPerLevel * gem.level} · HP+{def.hpPerLevel * gem.level} · 暴擊+{Math.round(def.critPerLevel * gem.level * 100)}%
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-black text-cyan-300 shrink-0">鑲嵌</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
