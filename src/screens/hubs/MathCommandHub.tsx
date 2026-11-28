import React, { useState } from 'react';
import {
  Check,
  Cog,
  Coins,
  Cpu,
  Crosshair,
  Shield,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useGameState } from '../../core/GameStateContext';
import { soundEngine } from '../../audio/soundEngine';
import {
  MATH_GROWTH_TREE,
  MATH_SPIRITS,
  MATH_TACTICAL_TRAPS,
  MATH_TURRET_ARSENAL,
  SUBJECT_HUB_ART,
} from '../../data/subjectProgressionData';

const MATH_BRANCHES = ['數與計算', '幾何與空間', '量與實測', '代數與應用邏輯'] as const;

/** Interactive 5-Lane Defense Blueprint SVG reflecting active turret deck */
const DefenseBlueprintSvg: React.FC<{
  activeDeck: string[];
  turretUpgrades: Record<string, number>;
}> = ({ activeDeck, turretUpgrades }) => {
  const specs = activeDeck
    .map((id) => MATH_TURRET_ARSENAL.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <svg viewBox="0 0 260 150" className="w-full max-w-[260px] mx-auto">
      <rect x="2" y="2" width="256" height="146" rx="14" fill="#071529" stroke="#1E3A5F" strokeWidth="1.5" />
      {/* 5 Horizontal defense lanes */}
      {[24, 50, 76, 102, 128].map((y, idx) => (
        <g key={idx}>
          <line x1="24" y1={y} x2="242" y2={y} stroke="#1E3A5F" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="24" cy={y} r="3" fill="#38BDF8" opacity="0.6" />
        </g>
      ))}
      {/* Fortress Wall on Left */}
      <rect x="10" y="14" width="12" height="122" rx="4" fill="#0284C7" opacity="0.85" />
      {/* Deployed Active Turret Blueprint Nodes */}
      {specs.map((spec, idx) => {
        const y = 32 + idx * 28;
        const lv = turretUpgrades[spec.id] ?? 1;
        return (
          <g key={spec.id}>
            <line x1="68" y1={y} x2="228" y2={y} stroke={spec.accentColor} strokeWidth="2" opacity="0.45" />
            <circle cx="64" cy={y} r="10" fill="#0F172A" stroke={spec.accentColor} strokeWidth="2.4" />
            <text x="64" y={y + 3.5} textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="900">
              L{lv}
            </text>
            <text x="84" y={y + 3.5} fill="#E2E8F0" fontSize="9.5" fontWeight="800">
              {spec.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const MathCommandHub: React.FC = () => {
  const {
    save,
    subjectProfiles,
    upgradeSubjectTreeNode,
    upgradeMathTurret,
    toggleMathDeckTurret,
    selectMathSpirit,
    buySubjectConsumable,
  } = useGameState();

  const profile = subjectProfiles.math;
  const [tab, setTab] = useState<'tree' | 'turrets' | 'traps'>('tree');
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const totalTreeLv = Object.values(profile.growthTree).reduce((s, n) => s + n.level, 0);
  const totalTurretLv = Object.values(profile.turretUpgrades).reduce((s, v) => s + v, 0);
  const activeSpirit =
    MATH_SPIRITS.find((s) => s.id === profile.guardianSpiritId) ?? MATH_SPIRITS[0];

  const notify = (res: { ok: boolean; message: string }) => {
    setToast({ ok: res.ok, text: res.message });
    if (res.ok) soundEngine.playCorrectChord(2);
    else soundEngine.playWrongBuzz();
  };

  return (
    <div className="space-y-5" data-testid="hub-math-command">
      {/* Showcase Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-sky-400/35 bg-slate-900 shadow-2xl">
        <img
          src={SUBJECT_HUB_ART.math.imageUrl}
          alt={SUBJECT_HUB_ART.math.title}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-sky-950/60" />

        <div className="relative z-10 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs font-bold text-sky-300 tracking-wide">
              數學殭屍塔防 · 防線工程指揮部
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5">
              {SUBJECT_HUB_ART.math.title}
            </h2>
            <div className="mt-1.5 text-sm font-bold text-sky-200">
              {profile.commanderRank} · 守護精靈：{activeSpirit.name}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl bg-slate-950/85 border border-sky-400/40 p-3">
                <div className="text-[10px] font-bold text-sky-300">算力齒輪</div>
                <div className="text-2xl font-black text-white font-mono-num mt-0.5">
                  {profile.techGears}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-950/85 border border-slate-700 p-3">
                <div className="text-[10px] font-bold text-slate-400">砲台總階</div>
                <div className="text-2xl font-black text-amber-300 font-mono-num mt-0.5">
                  Lv.{totalTurretLv}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-950/85 border border-slate-700 p-3">
                <div className="text-[10px] font-bold text-slate-400">防線樹階</div>
                <div className="text-2xl font-black text-emerald-300 font-mono-num mt-0.5">
                  {totalTreeLv}/40
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-4 justify-end">
            <div className="w-full sm:w-72 rounded-2xl bg-slate-950/85 border border-sky-500/35 p-3">
              <div className="text-[11px] font-black text-sky-300 mb-1.5 flex items-center justify-between">
                <span>防禦陣地藍圖預覽</span>
                <span className="font-mono-num text-slate-400">
                  已配置 {profile.activeDeckTurretIds.length} 座砲台
                </span>
              </div>
              <DefenseBlueprintSvg
                activeDeck={profile.activeDeckTurretIds}
                turretUpgrades={profile.turretUpgrades}
              />
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
            { id: 'tree', label: '算力防線成長樹', icon: Cpu },
            { id: 'turrets', label: '砲台武器庫', icon: Crosshair },
            { id: 'traps', label: '戰術道具與數靈精靈', icon: Wrench },
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
                active ? 'bg-sky-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: 4-Branch Math Growth Tree */}
      {tab === 'tree' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MATH_BRANCHES.map((branchName) => {
            const nodes = MATH_GROWTH_TREE.filter((n) => n.branch === branchName);
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
                    <h3 className="text-base font-black text-sky-300">{branchName}</h3>
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
                    const canAfford = profile.techGears >= node.costPerLevel;

                    return (
                      <div
                        key={node.nodeId}
                        className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{node.name}</span>
                            <span className="text-xs font-mono-num font-bold text-sky-300">
                              Lv.{lv}/{node.maxLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                            {node.description}
                          </p>
                          <div className="text-[11px] text-emerald-300 font-bold mt-1">
                            效果：{lv > 0 ? node.effectSummary(lv) : '尚未強化'}
                            {!isMax && ` → ${node.effectSummary(lv + 1)}`}
                          </div>
                          {state?.unlockedInGrade && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              升級紀錄：{state.unlockedInGrade}年級
                              {state.unlockedInSemester === 2 ? '下' : '上'}學期
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isMax || !canAfford}
                          onClick={() => notify(upgradeSubjectTreeNode('math', node.nodeId))}
                          className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black whitespace-nowrap shrink-0 ${
                            isMax
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                              : canAfford
                                ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isMax ? '已滿階' : `強化 (${node.costPerLevel}齒輪)`}
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

      {/* TAB 2: Turret Arsenal */}
      {tab === 'turrets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MATH_TURRET_ARSENAL.map((turret) => {
            const lv = profile.turretUpgrades[turret.id] ?? 1;
            const inDeck = profile.activeDeckTurretIds.includes(turret.id);
            const cost = turret.upgradeCostPerLv;
            const isMax = lv >= 10;
            const dmg = Math.round(turret.baseDamage * (1 + (lv - 1) * 0.22));

            return (
              <div
                key={turret.id}
                className={`rounded-2xl p-4 border space-y-3 ${
                  inDeck
                    ? 'bg-slate-900/95 border-sky-400/80'
                    : 'bg-slate-900/75 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-400">
                      {turret.category} · {turret.rangeLabel}
                    </div>
                    <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                      <span>{turret.name}</span>
                      <span
                        className="text-xs font-mono-num font-black"
                        style={{ color: turret.accentColor }}
                      >
                        Lv.{lv}/10
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{turret.description}</p>
                  </div>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-right font-mono-num shrink-0">
                    <div className="text-[10px] text-slate-400">單發威力</div>
                    <div className="text-base font-black text-amber-300">{dmg}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isMax || profile.techGears < cost}
                    onClick={() => notify(upgradeMathTurret(turret.id))}
                    className={`flex-1 min-h-[40px] rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 ${
                      isMax
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                        : profile.techGears >= cost
                          ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Cog className="w-3.5 h-3.5" />
                    {isMax ? '砲台已滿階' : `升級砲台 (${cost} 算力齒輪)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => notify(toggleMathDeckTurret(turret.id))}
                    className={`min-h-[40px] px-3.5 rounded-xl text-xs font-black border whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                      inDeck
                        ? 'bg-emerald-950/75 border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                    }`}
                  >
                    {inDeck && <Check className="w-3.5 h-3.5" />}
                    {inDeck ? '已編入陣地' : '加入陣地'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Tactical Traps & Math Spirits */}
      {tab === 'traps' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-black text-sky-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> 防線戰術道具補給
              </span>
              <span className="text-xs font-mono-num font-black text-amber-300 inline-flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> {save.coins} 金幣
              </span>
            </div>
            <div className="space-y-2.5">
              {MATH_TACTICAL_TRAPS.map((item) => {
                const count = profile.tacticalTraps[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white">
                        {item.name}{' '}
                        <span className="text-xs font-mono-num text-sky-300">× {count}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.effect}</p>
                    </div>
                    <button
                      type="button"
                      disabled={save.coins < item.costCoins}
                      onClick={() =>
                        notify(buySubjectConsumable('math', item.id, item.costCoins, item.name))
                      }
                      className={`min-h-[38px] px-3 rounded-xl text-xs font-black whitespace-nowrap shrink-0 ${
                        save.coins >= item.costCoins
                          ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
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
            <div className="text-sm font-black text-emerald-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4" /> 數學守護精靈（數靈／幾何精靈）
            </div>
            <div className="space-y-2.5">
              {MATH_SPIRITS.map((sp) => {
                const selected = profile.guardianSpiritId === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playPetChime();
                      selectMathSpirit(sp.id);
                      setToast({ ok: true, text: `已指派防線守護精靈：${sp.name}` });
                    }}
                    className={`w-full rounded-xl p-3.5 border text-left transition-colors ${
                      selected
                        ? 'bg-sky-950/50 border-sky-400'
                        : 'bg-slate-950/90 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-white">
                        {sp.name}{' '}
                        <span className="text-xs font-bold text-slate-400">· {sp.role}</span>
                      </span>
                      {selected && (
                        <span className="text-xs font-black text-sky-300">駐守中</span>
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
