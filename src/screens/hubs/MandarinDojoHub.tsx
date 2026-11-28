import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Coins,
  Flame,
  Lock,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';
import { useGameState } from '../../core/GameStateContext';
import { HeroPortrait } from '../../components/EquipmentArt';
import { soundEngine } from '../../audio/soundEngine';
import {
  computeMandarinStats,
  MANDARIN_ARMORS,
  MANDARIN_CONSUMABLES,
  MANDARIN_GROWTH_TREE,
  MANDARIN_SPIRITS,
  MANDARIN_WEAPONS,
  SUBJECT_HUB_ART,
} from '../../data/subjectProgressionData';

const BRANCH_ORDER = ['字音字形', '詞語成語', '閱讀理解', '修辭寫作'] as const;
const TITLE_LADDER = [
  { name: '見習書童', req: 0 },
  { name: '妙筆學士', req: 4 },
  { name: '墨韻劍客', req: 9 },
  { name: '博學大儒', req: 16 },
  { name: '文曲大宗師', req: 24 },
];

export const MandarinDojoHub: React.FC = () => {
  const {
    save,
    equippedWeapon,
    combatStats,
    subjectProfiles,
    upgradeSubjectTreeNode,
    equipOrUnlockMandarinGear,
    selectMandarinSpirit,
    buySubjectConsumable,
  } = useGameState();

  const profile = subjectProfiles.chinese;
  const stats = useMemo(() => computeMandarinStats(profile), [profile]);
  const [tab, setTab] = useState<'tree' | 'gear' | 'bag'>('tree');
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const totalTreeLevels = Object.values(profile.growthTree).reduce((s, n) => s + n.level, 0);
  const activeSpirit =
    MANDARIN_SPIRITS.find((s) => s.id === profile.guardianSpiritId) ?? MANDARIN_SPIRITS[0];

  const notify = (res: { ok: boolean; message: string }) => {
    setToast({ ok: res.ok, text: res.message });
    if (res.ok) soundEngine.playCorrectChord(2);
    else soundEngine.playWrongBuzz();
  };

  return (
    <div className="space-y-5" data-testid="hub-chinese-dojo">
      {/* Showcase Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/35 bg-slate-900 shadow-2xl">
        <img
          src={SUBJECT_HUB_ART.chinese.imageUrl}
          alt={SUBJECT_HUB_ART.chinese.title}
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-amber-950/55" />

        <div className="relative z-10 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left: Scholar Character Portrait & Title */}
          <div className="lg:col-span-5 flex items-center gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-950/85 border border-amber-400/50 p-1.5 flex items-center justify-center shrink-0 shadow-lg">
              <HeroPortrait
                appearance={{
                  weapon: equippedWeapon,
                  equipment: save.equipment,
                  heroClassBranch: combatStats.heroClassBranch,
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-300/90 tracking-wide">
                國語探索 RPG · 專屬修煉道場
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5 truncate">
                {SUBJECT_HUB_ART.chinese.title}
              </h2>
              <div className="mt-1.5 text-sm font-bold text-amber-200">
                {profile.characterTitle} · 文心 Lv.{profile.rpgLevel}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${Math.min(100, profile.exp)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-300 font-mono-num">
                  EXP {profile.exp}/100
                </span>
              </div>
            </div>
          </div>

          {/* Right: Independent Mandarin RPG Stats & Skill Points */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-slate-950/80 border border-amber-400/40 p-3.5">
              <div className="text-[11px] font-bold text-amber-300">可用文心點數</div>
              <div className="text-2xl font-black text-white font-mono-num mt-1">
                {profile.skillPoints}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">國語闖關永久累積</div>
            </div>
            <div className="rounded-2xl bg-slate-950/80 border border-slate-700/80 p-3.5">
              <div className="text-[11px] font-bold text-slate-400">文氣值</div>
              <div className="text-2xl font-black text-amber-300 font-mono-num mt-1">
                {stats.wenqi}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">斬句與破盾攻擊</div>
            </div>
            <div className="rounded-2xl bg-slate-950/80 border border-slate-700/80 p-3.5">
              <div className="text-[11px] font-bold text-slate-400">會心暴擊率</div>
              <div className="text-2xl font-black text-rose-300 font-mono-num mt-1">
                {stats.critPct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">字音辨析暴擊</div>
            </div>
            <div className="rounded-2xl bg-slate-950/80 border border-slate-700/80 p-3.5">
              <div className="text-[11px] font-bold text-slate-400">連擊加成</div>
              <div className="text-2xl font-black text-emerald-300 font-mono-num mt-1">
                +{stats.comboPct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                審題 +{stats.thinkBonusSec}s
              </div>
            </div>
          </div>
        </div>
      </section>

      {toast && (
        <div
          role="status"
          className={`rounded-2xl px-4 py-2.5 text-xs font-bold border ${
            toast.ok
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Segmented Interactive Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          {(
            [
              { id: 'tree', label: '文心 RPG 成長樹', icon: BookOpen },
              { id: 'gear', label: '主武器與護身防具', icon: Swords },
              { id: 'bag', label: '戰鬥道具與字靈夥伴', icon: Sparkles },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setTab(item.id);
                }}
                className={`min-h-[40px] px-3.5 rounded-lg text-xs font-black whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-300 font-bold">
          當前守護精靈：<span className="text-amber-300">{activeSpirit.name}</span> · 總修煉階數{' '}
          <span className="font-mono-num text-white">{totalTreeLevels}/40</span>
        </div>
      </div>

      {/* TAB 1: 4-Branch Wenxin RPG Growth Tree */}
      {tab === 'tree' && (
        <div className="space-y-4">
          {/* Scholar Title Progression Strip */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-xs font-black text-amber-300">
                文心進階稱號之路（跨 1～6 年級永久累積）
              </div>
              <div className="text-xs text-slate-400 font-mono-num">
                目前累計 {totalTreeLevels} 階
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {TITLE_LADDER.map((tier) => {
                const reached = totalTreeLevels >= tier.req;
                return (
                  <div
                    key={tier.name}
                    className={`rounded-xl px-2.5 py-2 border text-center ${
                      reached
                        ? 'bg-amber-950/50 border-amber-400/60 text-amber-200'
                        : 'bg-slate-950/80 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-xs font-black truncate">{tier.name}</div>
                    <div className="text-[10px] font-mono-num mt-0.5">{tier.req} 階</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Branches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BRANCH_ORDER.map((branchName) => {
              const nodes = MANDARIN_GROWTH_TREE.filter((n) => n.branch === branchName);
              const branchLv = nodes.reduce(
                (s, n) => s + (profile.growthTree[n.nodeId]?.level ?? 0),
                0
              );
              const branchMax = nodes.reduce((s, n) => s + n.maxLevel, 0);

              return (
                <div
                  key={branchName}
                  className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <h3 className="text-base font-black text-amber-300">{branchName}</h3>
                      <div className="text-[11px] text-slate-400">
                        {nodes[0]?.curriculumFocus}
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono-num text-white">
                      Lv.{branchLv}/{branchMax}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {nodes.map((node) => {
                      const state = profile.growthTree[node.nodeId];
                      const lv = state?.level ?? 0;
                      const isMax = lv >= node.maxLevel;
                      const canAfford = profile.skillPoints >= node.costPerLevel;

                      return (
                        <div
                          key={node.nodeId}
                          className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">{node.name}</span>
                              <span className="text-xs font-mono-num font-bold text-amber-300">
                                Lv.{lv}/{node.maxLevel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                              {node.description}
                            </p>
                            <div className="text-[11px] text-emerald-300 font-bold mt-1">
                              目前效果：{lv > 0 ? node.effectSummary(lv) : '尚未修煉'}
                              {!isMax && ` → 下一階 ${node.effectSummary(lv + 1)}`}
                            </div>
                            {state?.unlockedInGrade && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                最近修煉紀錄：{state.unlockedInGrade}年級
                                {state.unlockedInSemester === 2 ? '下' : '上'}學期
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isMax || !canAfford}
                            onClick={() => notify(upgradeSubjectTreeNode('chinese', node.nodeId))}
                            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black whitespace-nowrap shrink-0 transition-colors ${
                              isMax
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                                : canAfford
                                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {isMax ? '已圓滿' : `修煉 (${node.costPerLevel}點)`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Mandarin Weapons & Armors */}
      {tab === 'gear' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Primary Weapons */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-amber-300 border-b border-slate-800 pb-2">
              <ScrollText className="w-4 h-4" /> 主武器庫（毛筆・竹簡劍・墨韻扇）
            </div>
            <div className="space-y-2.5">
              {MANDARIN_WEAPONS.map((w) => {
                const unlocked = profile.unlockedWeaponIds.includes(w.id);
                const equipped = profile.equippedWeaponId === w.id;
                return (
                  <div
                    key={w.id}
                    className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 ${
                      equipped
                        ? 'bg-amber-950/40 border-amber-400'
                        : 'bg-slate-950/90 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white">
                        {w.name}{' '}
                        <span className="text-xs font-bold text-slate-400">· {w.typeLabel}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{w.description}</p>
                      <div className="text-[11px] font-mono-num text-amber-200 mt-1">
                        文氣 +{w.wenqiBonus} · 暴擊 +{w.critBonusPct}% · 連擊 +{w.comboBonusPct}%
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={equipped || (!unlocked && profile.skillPoints < w.unlockCostPoints)}
                      onClick={() => notify(equipOrUnlockMandarinGear('weapon', w.id))}
                      className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                        equipped
                          ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                          : unlocked
                            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                            : profile.skillPoints >= w.unlockCostPoints
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> 裝備中
                        </>
                      ) : unlocked ? (
                        '裝備'
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> {w.unlockCostPoints}點解鎖
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Armor & Accessories */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-sky-300 border-b border-slate-800 pb-2">
              <Shield className="w-4 h-4" /> 防具與護身飾品（書卷披風・玉佩護符）
            </div>
            <div className="space-y-2.5">
              {MANDARIN_ARMORS.map((a) => {
                const unlocked = profile.unlockedArmorIds.includes(a.id);
                const equipped = profile.equippedArmorId === a.id;
                return (
                  <div
                    key={a.id}
                    className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 ${
                      equipped
                        ? 'bg-sky-950/40 border-sky-400'
                        : 'bg-slate-950/90 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white">
                        {a.name}{' '}
                        <span className="text-xs font-bold text-slate-400">· {a.typeLabel}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>
                      <div className="text-[11px] font-mono-num text-sky-200 mt-1">
                        文氣 +{a.wenqiBonus} · 暴擊 +{a.critBonusPct}% · 連擊 +{a.comboBonusPct}%
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={equipped || (!unlocked && profile.skillPoints < a.unlockCostPoints)}
                      onClick={() => notify(equipOrUnlockMandarinGear('armor', a.id))}
                      className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                        equipped
                          ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                          : unlocked
                            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                            : profile.skillPoints >= a.unlockCostPoints
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {equipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> 穿戴中
                        </>
                      ) : unlocked ? (
                        '穿戴'
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> {a.unlockCostPoints}點解鎖
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Mandarin Consumables & Guardian Spirits */}
      {tab === 'bag' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Consumables */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> 文房戰鬥道具補給
              </span>
              <span className="text-xs font-mono-num font-black text-amber-300 inline-flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> {save.coins} 金幣
              </span>
            </div>
            <div className="space-y-2.5">
              {MANDARIN_CONSUMABLES.map((item) => {
                const count = profile.consumables[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white">
                        {item.name}{' '}
                        <span className="text-xs font-mono-num text-amber-300">× {count}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.effect}</p>
                    </div>
                    <button
                      type="button"
                      disabled={save.coins < item.costCoins}
                      onClick={() =>
                        notify(buySubjectConsumable('chinese', item.id, item.costCoins, item.name))
                      }
                      className={`min-h-[38px] px-3 rounded-xl text-xs font-black whitespace-nowrap shrink-0 ${
                        save.coins >= item.costCoins
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      補充 ({item.costCoins}金)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guardian Spirits */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="text-sm font-black text-emerald-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4" /> 國語守護精靈（字靈／詩靈夥伴）
            </div>
            <div className="space-y-2.5">
              {MANDARIN_SPIRITS.map((sp) => {
                const selected = profile.guardianSpiritId === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playPetChime();
                      selectMandarinSpirit(sp.id);
                      setToast({ ok: true, text: `已切換守護精靈：${sp.name}` });
                    }}
                    className={`w-full rounded-xl p-3.5 border text-left transition-colors ${
                      selected
                        ? 'bg-emerald-950/45 border-emerald-400'
                        : 'bg-slate-950/90 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-white">
                        {sp.name}{' '}
                        <span className="text-xs font-bold text-slate-400">· {sp.role}</span>
                      </span>
                      {selected && (
                        <span className="text-xs font-black text-emerald-300">同行中</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{sp.passive}</p>
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
