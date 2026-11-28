import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Coins,
  Gem,
  Heart,
  ShoppingBag,
  Sparkles,
  Swords,
  Trophy,
} from 'lucide-react';
import { BattleItemId, GemElementId, GuardianId } from '../types/game';
import { useGameState } from '../core/GameStateContext';
import { BATTLE_ITEMS, GEM_ELEMENTS, WEAPON_CATALOG } from '../data/itemsAndGems';
import { GUARDIAN_LIST } from '../data/spiritsAndTitles';
import { soundEngine } from '../audio/soundEngine';
import {BattleItemArt,WeaponArt} from '../components/EquipmentArt';

interface ShopScreenProps {
  onExit: () => void;
}

function getCountdownToMidnight(): string {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const diffSec = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const s = String(diffSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({ onExit }) => {
  const {
    save,
    buyWeapon,
    buyGem,
    buyBattleItem,
    unlockOrBondGuardian,
  } = useGameState();

  const [tab, setTab] = useState<'weapons' | 'gems' | 'items' | 'honor'>('weapons');
  const [countdown, setCountdown] = useState(getCountdownToMidnight);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(getCountdownToMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const dayIndex = new Date().getDate();
  const discountedGem: GemElementId = (
    ['ink_ruby', 'star_sapphire', 'gear_topaz', 'leaf_emerald'] as GemElementId[]
  )[dayIndex % 4];
  const discountedItem: BattleItemId = (
    ['wisdom_potion', 'combo_charm', 'shield_scroll', 'time_hourglass', 'forge_guard'] as BattleItemId[]
  )[dayIndex % 5];

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col overflow-hidden" data-testid="shop-screen">
      {/* Top Bar */}
      <div className="shrink-0 bg-slate-900 border-b-2 border-emerald-500/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
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
            <h1 className="text-lg sm:text-xl font-black text-emerald-300 flex items-center gap-1.5">
              <ShoppingBag className="w-5 h-5" /> 學園魔法商店
            </h1>
            <p className="text-xs text-slate-400">
              每日 7 折特賣倒數 · 神兵鋪 · 寶石坊 · 道具精靈屋 · 競技榮譽兌換
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm font-black font-mono-num">
          <span className="text-amber-300 inline-flex items-center gap-1">
            <Coins className="w-4 h-4" /> {save.coins}
          </span>
          <span className="text-cyan-300 inline-flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> {save.crystals}
          </span>
          <span className="text-fuchsia-300 inline-flex items-center gap-1">
            <Trophy className="w-4 h-4" /> 榮譽幣 {save.pvp.honorTokens}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Daily Discount Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border-2 border-amber-400/70 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-amber-300 inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> 今日限時 7 折特惠倒數：<span className="font-mono-num text-white">{countdown}</span>
              </div>
              <div className="text-sm font-black text-white mt-1">
                今日特價：{GEM_ELEMENTS[discountedGem].name}（7折）＆ {BATTLE_ITEMS[discountedItem].name}（7折）！
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFeedback(buyGem(discountedGem, 0.7))}
                className="min-h-[44px] px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs"
              >
                搶購 7 折寶石 ({Math.round(GEM_ELEMENTS[discountedGem].shopPriceCoins * 0.7)}金)
              </button>
              <button
                type="button"
                onClick={() => setFeedback(buyBattleItem(discountedItem, false, 0.7))}
                className="min-h-[44px] px-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs"
              >
                搶購 7 折道具 ({Math.round(BATTLE_ITEMS[discountedItem].priceCoins * 0.7)}金)
              </button>
            </div>
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

          {/* 4 Shop Section Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {(
              [
                ['weapons', '神兵鋪', Swords],
                ['gems', '寶石坊', Gem],
                ['items', '道具與精靈屋', Heart],
                ['honor', '競技榮譽兌換', Trophy],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setTab(id);
                }}
                className={`min-h-[46px] rounded-xl text-xs sm:text-sm font-black inline-flex items-center justify-center gap-1.5 transition-colors ${
                  tab === id
                    ? 'bg-emerald-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* TAB 1: WEAPONS */}
          {tab === 'weapons' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {WEAPON_CATALOG.filter((w) => w.priceCoins > 0).map((w) => (
                <div
                  key={w.templateId}
                  className="rounded-3xl bg-slate-900 border-2 border-slate-700 p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <WeaponArt weapon={{...w,uid:w.templateId,enhanceLevel:0,ascensionPath:'base',socketedGems:[null,null,null]}} className="shop-item-art"/>
                    <div className="text-xs font-black text-amber-300 uppercase">{w.rarity} · 基礎攻擊 {w.baseAttack}</div>
                    <div className="text-lg font-black text-white mt-1">{w.name}</div>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{w.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedback(buyWeapon(w.templateId, false))}
                    className="w-full min-h-[48px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm"
                  >
                    {w.priceCoins} 金幣購買
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: GEMS */}
          {tab === 'gems' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(GEM_ELEMENTS) as GemElementId[]).map((id) => {
                const g = GEM_ELEMENTS[id];
                const isDisc = id === discountedGem;
                const price = isDisc ? Math.round(g.shopPriceCoins * 0.7) : g.shopPriceCoins;
                return (
                  <div
                    key={id}
                    className="rounded-3xl bg-slate-900 border-2 p-4 flex flex-col justify-between gap-3"
                    style={{ borderColor: g.color }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black" style={{ color: g.color }}>
                          {g.subjectLabel}
                        </span>
                        {isDisc && <span className="text-xs font-black text-amber-300">今日 7 折</span>}
                      </div>
                      <div className="text-lg font-black text-white mt-1">Lv.1 {g.name}</div>
                      <p className="text-xs text-slate-300 mt-1">{g.statLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFeedback(buyGem(id, isDisc ? 0.7 : 1))}
                      className="w-full min-h-[48px] rounded-xl text-slate-950 font-black text-sm"
                      style={{ backgroundColor: g.color }}
                    >
                      {price} 金幣購買
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: BATTLE ITEMS & GUARDIAN SPIRITS */}
          {tab === 'items' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {(Object.keys(BATTLE_ITEMS) as BattleItemId[]).map((id) => {
                  const item = BATTLE_ITEMS[id];
                  const isDisc = id === discountedItem;
                  const price = isDisc ? Math.round(item.priceCoins * 0.7) : item.priceCoins;
                  return (
                    <div
                      key={id}
                      className="rounded-2xl bg-slate-900 border-2 border-slate-700 p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <BattleItemArt id={id} className="shop-item-art"/>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black" style={{ color: item.color }}>
                            {item.shortTag}
                          </span>
                          <span className="text-xs text-slate-400 font-mono-num">
                            持有 ×{save.items[id] ?? 0}
                          </span>
                        </div>
                        <div className="text-base font-black text-white mt-1">{item.name}</div>
                        <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedback(buyBattleItem(id, false, isDisc ? 0.7 : 1))}
                        className="w-full min-h-[46px] rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs"
                      >
                        {price} 金幣購買 {isDisc ? '（7折）' : ''}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-3xl bg-slate-900 border-2 border-rose-500/40 p-4 space-y-3">
                <div className="text-sm font-black text-rose-300">
                  守護精靈靈果屋（餵食靈果提升羈絆等級，立即強化全隊攻防！）
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {GUARDIAN_LIST.map((g) => (
                    <div key={g.id} className="rounded-2xl bg-slate-950 border border-slate-800 p-3 flex flex-col justify-between gap-2">
                      <div>
                        <div className="text-sm font-black text-white">{g.name}</div>
                        <div className="text-[11px] text-amber-300">
                          羈絆 Lv.{save.guardianBonds[g.id as GuardianId] ?? 1}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{g.passiveDesc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedback(unlockOrBondGuardian(g.id))}
                        className="min-h-[42px] rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs"
                      >
                        90 金幣餵食靈果 (+2 羈絆)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ARENA HONOR EXCHANGE */}
          {tab === 'honor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WEAPON_CATALOG.filter((w) => w.priceHonor).map((w) => (
                <div
                  key={w.templateId}
                  className="rounded-3xl bg-slate-900 border-2 border-fuchsia-400 p-5 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-black text-fuchsia-300">
                      競技場專屬神話神兵 · 基礎攻擊 {w.baseAttack}（自帶 +5）
                    </div>
                    <div className="text-xl font-black text-white mt-1">{w.name}</div>
                    <p className="text-xs text-slate-300 mt-1.5">{w.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedback(buyWeapon(w.templateId, true))}
                    className="w-full min-h-[50px] rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black text-sm"
                  >
                    {w.priceHonor} 競技榮譽幣兌換
                  </button>
                </div>
              ))}

              {(Object.keys(BATTLE_ITEMS) as BattleItemId[])
                .filter((id) => BATTLE_ITEMS[id].priceHonor)
                .map((id) => {
                  const item = BATTLE_ITEMS[id];
                  return (
                    <div
                      key={id}
                      className="rounded-3xl bg-slate-900 border-2 border-indigo-400/70 p-5 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-black text-indigo-300">
                          競技榮譽特供 · 持有 ×{save.items[id] ?? 0}
                        </div>
                        <div className="text-lg font-black text-white mt-1">{item.name}</div>
                        <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedback(buyBattleItem(id, true))}
                        className="w-full min-h-[48px] rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm"
                      >
                        {item.priceHonor} 競技榮譽幣兌換
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
