import React, { useState } from 'react';
import {
  Beaker,
  Check,
  Coins,
  Flame,
  FlaskConical,
  Lock,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { useGameState } from '../../core/GameStateContext';
import { soundEngine } from '../../audio/soundEngine';
import {
  isScienceUnlockedForGrade,
  SCIENCE_COOKWARE,
  SCIENCE_FOOD_SPIRITS,
  SCIENCE_GROWTH_TREE,
  SCIENCE_SEASONINGS,
  SUBJECT_HUB_ART,
} from '../../data/subjectProgressionData';

const SCIENCE_BRANCHES = ['物質與變化', '生物與生態', '地球與環境', '能量與力'] as const;

interface ScienceKitchenHubProps {
  onSwitchToOtherSubject?: () => void;
}

export const ScienceKitchenHub: React.FC<ScienceKitchenHubProps> = ({
  onSwitchToOtherSubject,
}) => {
  const {
    save,
    setGrade,
    subjectProfiles,
    upgradeSubjectTreeNode,
    equipOrUnlockScienceCookware,
    selectScienceSpirit,
    buySubjectConsumable,
  } = useGameState();

  const profile = subjectProfiles.science;
  const unlocked = isScienceUnlockedForGrade(save.grade);
  const [tab, setTab] = useState<'tree' | 'cookware' | 'seasonings'>('tree');
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const activeCookware =
    SCIENCE_COOKWARE.find((c) => c.id === profile.equippedCookwareId) ?? SCIENCE_COOKWARE[0];
  const activeSpirit =
    SCIENCE_FOOD_SPIRITS.find((s) => s.id === profile.foodSpiritId) ?? SCIENCE_FOOD_SPIRITS[0];
  const totalTreeLv = Object.values(profile.growthTree).reduce((s, n) => s + n.level, 0);

  const notify = (res: { ok: boolean; message: string }) => {
    setToast({ ok: res.ok, text: res.message });
    if (res.ok) soundEngine.playCorrectChord(2);
    else soundEngine.playWrongBuzz();
  };

  // Friendly Grade 1–2 Lock Screen
  if (!unlocked) {
    return (
      <div
        className="relative overflow-hidden rounded-3xl border border-emerald-400/35 bg-slate-900 shadow-2xl"
        data-testid="hub-science-locked"
      >
        <img
          src={SUBJECT_HUB_ART.science.imageUrl}
          alt={SUBJECT_HUB_ART.science.title}
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 p-6 sm:p-10 text-center max-w-2xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/90 border border-emerald-400/50 text-emerald-300 flex items-center justify-center mx-auto shadow-lg">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300">
              目前年級：國小 {save.grade} 年級 · 108 課綱友善分齡保護
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
              升上三年級解鎖自然實驗廚房 ✨
            </h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              依照台灣 108 課綱規劃，自然科學實驗料理於國小三年級起正式登場！一、二年級可以先在國語道場、王牌英文機庫與數學防線累積實力，未來升上三年級即可開啟元素料理實驗台。
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
            {SCIENCE_BRANCHES.map((branch) => (
              <div
                key={branch}
                className="rounded-xl bg-slate-950/85 border border-slate-800 p-3 text-center"
              >
                <div className="text-xs font-black text-emerald-300">{branch}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">三年級解鎖</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setGrade(3);
              }}
              className="min-h-[44px] px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm"
            >
              切換至三年級預先體驗
            </button>
            {onSwitchToOtherSubject && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onSwitchToOtherSubject();
                }}
                className="min-h-[44px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-black text-sm"
              >
                返回探索其他科目
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="hub-science-kitchen">
      {/* Showcase Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-400/35 bg-slate-900 shadow-2xl">
        <img
          src={SUBJECT_HUB_ART.science.imageUrl}
          alt={SUBJECT_HUB_ART.science.title}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-emerald-950/60" />

        <div className="relative z-10 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs font-bold text-emerald-300 tracking-wide">
              自然科學料理 · 元素實驗廚房
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5">
              {SUBJECT_HUB_ART.science.title}
            </h2>
            <div className="mt-1.5 text-sm font-bold text-emerald-200">
              {profile.chefTitle} · 食靈夥伴：{activeSpirit.name}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              現役科學廚具：<strong className="text-white">{activeCookware.name}</strong>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-slate-950/85 border border-emerald-400/40 p-3.5">
              <div className="text-[11px] font-bold text-emerald-300">可用實驗結晶</div>
              <div className="text-2xl font-black text-white font-mono-num mt-1">
                {profile.labCrystals}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">跨 3～6 年級累積</div>
            </div>
            <div className="rounded-2xl bg-slate-950/85 border border-slate-700 p-3.5">
              <div className="text-[11px] font-bold text-slate-400">料理評分加成</div>
              <div className="text-2xl font-black text-amber-300 font-mono-num mt-1">
                +{activeCookware.scoreBonusPct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">廚具精準增益</div>
            </div>
            <div className="rounded-2xl bg-slate-950/85 border border-slate-700 p-3.5">
              <div className="text-[11px] font-bold text-slate-400">控溫穩定度</div>
              <div className="text-2xl font-black text-cyan-300 font-mono-num mt-1">
                +{activeCookware.tempPrecisionBonus}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">降低失誤焦鍋</div>
            </div>
            <div className="rounded-2xl bg-slate-950/85 border border-slate-700 p-3.5">
              <div className="text-[11px] font-bold text-slate-400">實驗樹總階</div>
              <div className="text-2xl font-black text-emerald-300 font-mono-num mt-1">
                {totalTreeLv}/40
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">四大自然領域</div>
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

      {/* Segmented Tabs */}
      <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        {(
          [
            { id: 'tree', label: '元素實驗成長樹', icon: Beaker },
            { id: 'cookware', label: '科學廚具實驗台', icon: Utensils },
            { id: 'seasonings', label: '料理道具與元素食靈', icon: Flame },
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
                  ? 'bg-emerald-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: 4-Branch Science Growth Tree */}
      {tab === 'tree' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCIENCE_BRANCHES.map((branchName) => {
            const nodes = SCIENCE_GROWTH_TREE.filter((n) => n.branch === branchName);
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
                    <h3 className="text-base font-black text-emerald-300">{branchName}</h3>
                    <div className="text-[11px] text-slate-400">{nodes[0]?.curriculumFocus}</div>
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
                    const canAfford = profile.labCrystals >= node.costPerLevel;

                    return (
                      <div
                        key={node.nodeId}
                        className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{node.name}</span>
                            <span className="text-xs font-mono-num font-bold text-emerald-300">
                              Lv.{lv}/{node.maxLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                            {node.description}
                          </p>
                          <div className="text-[11px] text-amber-300 font-bold mt-1">
                            效果：{lv > 0 ? node.effectSummary(lv) : '尚未研發'}
                            {!isMax && ` → ${node.effectSummary(lv + 1)}`}
                          </div>
                          {state?.unlockedInGrade && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              研發紀錄：{state.unlockedInGrade}年級
                              {state.unlockedInSemester === 2 ? '下' : '上'}學期
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isMax || !canAfford}
                          onClick={() => notify(upgradeSubjectTreeNode('science', node.nodeId))}
                          className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black whitespace-nowrap shrink-0 ${
                            isMax
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                              : canAfford
                                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isMax ? '已精通' : `研發 (${node.costPerLevel}結晶)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Scientific Cookware */}
      {tab === 'cookware' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCIENCE_COOKWARE.map((tool) => {
            const isUnlocked = profile.unlockedCookwareIds.includes(tool.id);
            const equipped = profile.equippedCookwareId === tool.id;
            const canAfford = profile.labCrystals >= tool.unlockCostCrystals;

            return (
              <div
                key={tool.id}
                className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 ${
                  equipped
                    ? 'bg-emerald-950/40 border-emerald-400'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-400">{tool.toolType}</div>
                  <h3 className="text-lg font-black text-white mt-0.5">{tool.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tool.description}</p>
                  <div className="text-xs font-mono-num text-emerald-300 font-bold mt-2">
                    料理評分 +{tool.scoreBonusPct}% · 控溫精準度 +{tool.tempPrecisionBonus}%
                  </div>
                </div>
                <button
                  type="button"
                  disabled={equipped || (!isUnlocked && !canAfford)}
                  onClick={() => notify(equipOrUnlockScienceCookware(tool.id))}
                  className={`w-full min-h-[40px] rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 ${
                    equipped
                      ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                      : isUnlocked
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                        : canAfford
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {equipped ? (
                    <>
                      <Check className="w-4 h-4" /> 使用中
                    </>
                  ) : isUnlocked ? (
                    '裝備廚具'
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> 消耗 {tool.unlockCostCrystals} 結晶解鎖
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Seasonings & Element Food Spirits */}
      {tab === 'seasonings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-black text-emerald-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> 廚房料理道具補給
              </span>
              <span className="text-xs font-mono-num font-black text-amber-300 inline-flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> {save.coins} 金幣
              </span>
            </div>
            <div className="space-y-2.5">
              {SCIENCE_SEASONINGS.map((item) => {
                const count = profile.seasoningInventory[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white">
                        {item.name}{' '}
                        <span className="text-xs font-mono-num text-emerald-300">× {count}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.effect}</p>
                    </div>
                    <button
                      type="button"
                      disabled={save.coins < item.costCoins}
                      onClick={() =>
                        notify(buySubjectConsumable('science', item.id, item.costCoins, item.name))
                      }
                      className={`min-h-[38px] px-3 rounded-xl text-xs font-black whitespace-nowrap shrink-0 ${
                        save.coins >= item.costCoins
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
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

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="text-sm font-black text-amber-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4" /> 元素食靈夥伴
            </div>
            <div className="space-y-2.5">
              {SCIENCE_FOOD_SPIRITS.map((sp) => {
                const selected = profile.foodSpiritId === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playPetChime();
                      selectScienceSpirit(sp.id);
                      setToast({ ok: true, text: `已指派廚房食靈：${sp.name}` });
                    }}
                    className={`w-full rounded-xl p-3.5 border text-left transition-colors ${
                      selected
                        ? 'bg-emerald-950/50 border-emerald-400'
                        : 'bg-slate-950/90 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-white">
                        {sp.name}{' '}
                        <span className="text-xs font-bold text-slate-400">· {sp.role}</span>
                      </span>
                      {selected && (
                        <span className="text-xs font-black text-emerald-300">協助中</span>
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
