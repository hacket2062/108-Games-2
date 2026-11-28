import React, { useMemo, useState } from 'react';
import {
  Check,
  Coins,
  Cpu,
  Crosshair,
  Lock,
  Plane,
  Radio,
  Shield,
  Sliders,
  Zap,
} from 'lucide-react';
import { useGameState } from '../../core/GameStateContext';
import { soundEngine } from '../../audio/soundEngine';
import {
  computeEnglishHangarRadar,
  ENGLISH_COPILOTS,
  ENGLISH_JETS,
  ENGLISH_MODULES,
  ENGLISH_TACTICAL_ITEMS,
  SUBJECT_HUB_ART,
} from '../../data/subjectProgressionData';

/** Clean 4-Axis SVG Avionics Radar Chart */
const HangarRadarSvg: React.FC<{
  firepower: number;
  shield: number;
  mobility: number;
  lockOn: number;
}> = ({ firepower, shield, mobility, lockOn }) => {
  const cx = 115;
  const cy = 105;
  const maxR = 68;
  const pt = (deg: number, val: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    const r = (Math.max(15, Math.min(100, val)) / 100) * maxR;
    return `${cx + Math.cos(rad) * r},${cy + Math.sin(rad) * r}`;
  };
  const poly = [pt(0, firepower), pt(90, mobility), pt(180, shield), pt(270, lockOn)].join(' ');

  return (
    <svg viewBox="0 0 230 210" className="w-full max-w-[210px] mx-auto">
      {[0.33, 0.66, 1].map((ratio, idx) => (
        <polygon
          key={idx}
          points={`${cx},${cy - maxR * ratio} ${cx + maxR * ratio},${cy} ${cx},${cy + maxR * ratio} ${cx - maxR * ratio},${cy}`}
          fill="none"
          stroke="#334155"
          strokeWidth="1.2"
        />
      ))}
      <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="#334155" />
      <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="#334155" />
      <polygon
        points={poly}
        fill="rgba(34, 211, 238, 0.28)"
        stroke="#22D3EE"
        strokeWidth="2.4"
      />
      <text x={cx} y={22} textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="800">
        火力 {firepower}
      </text>
      <text x={222} y={cy + 4} textAnchor="end" fill="#FDE047" fontSize="11" fontWeight="800">
        機動 {mobility}
      </text>
      <text x={cx} y={196} textAnchor="middle" fill="#34D399" fontSize="11" fontWeight="800">
        護盾 {shield}
      </text>
      <text x={8} y={cy + 4} textAnchor="start" fill="#C084FC" fontSize="11" fontWeight="800">
        鎖定 {lockOn}
      </text>
    </svg>
  );
};

/** Custom SVG Fighter Jet Hangar Bay Preview reflecting live livery + modular pods */
const JetBaySchematicSvg: React.FC<{
  liveryColor: string;
  accentColor: string;
  wingId: string;
  podId: string;
  chipId: string;
}> = ({ liveryColor, accentColor, wingId, podId, chipId }) => {
  const isSwept = wingId === 'wing_supersonic' || wingId === 'wing_ion_thruster';
  const hasShieldRing = chipId === 'chip_aegis_matrix' || chipId === 'chip_deflector';
  const isMissile = podId === 'pod_phonics_missile';
  const isEmp = podId === 'pod_emp_net';

  return (
    <svg viewBox="0 0 240 160" className="w-full max-w-[230px] mx-auto">
      <defs>
        <radialGradient id="bayGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={liveryColor} stopOpacity="0.32" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="240" height="160" rx="16" fill="url(#bayGlow)" />
      {/* Hangar alignment grid */}
      <line x1="20" y1="80" x2="220" y2="80" stroke="#1E293B" strokeDasharray="4 4" />
      <line x1="120" y1="14" x2="120" y2="146" stroke="#1E293B" strokeDasharray="4 4" />
      {hasShieldRing && (
        <ellipse
          cx="120"
          cy="82"
          rx="86"
          ry="58"
          fill="none"
          stroke={chipId === 'chip_aegis_matrix' ? '#2DD4BF' : '#38BDF8'}
          strokeWidth="1.6"
          strokeDasharray="6 4"
          opacity="0.7"
        />
      )}
      {/* Wings */}
      <polygon
        points={
          isSwept
            ? '120,42 206,112 184,122 120,94 56,122 34,112'
            : '120,48 198,98 188,112 120,92 52,112 42,98'
        }
        fill={liveryColor}
        opacity="0.9"
      />
      {/* Weapon Pods on wingtips */}
      <rect
        x="48"
        y="84"
        width="10"
        height="26"
        rx="4"
        fill={isEmp ? '#A78BFA' : isMissile ? '#FACC15' : accentColor}
      />
      <rect
        x="182"
        y="84"
        width="10"
        height="26"
        rx="4"
        fill={isEmp ? '#A78BFA' : isMissile ? '#FACC15' : accentColor}
      />
      {/* Fuselage */}
      <polygon points="120,18 140,76 132,126 120,136 108,126 100,76" fill="#E2E8F0" />
      <polygon points="120,26 130,68 120,90 110,68" fill={liveryColor} />
      {/* Cockpit Canopy */}
      <ellipse cx="120" cy="58" rx="7" ry="15" fill="#0F172A" stroke={accentColor} strokeWidth="2" />
      {/* Ion Thruster Plumes */}
      <polygon
        points="110,128 116,148 120,132 124,148 130,128"
        fill={wingId === 'wing_ion_thruster' ? '#38BDF8' : '#F59E0B'}
      />
    </svg>
  );
};

export const EnglishHangarHub: React.FC = () => {
  const {
    save,
    subjectProfiles,
    unlockOrSelectEnglishJet,
    unlockOrEquipEnglishModule,
    selectEnglishCopilot,
    buySubjectConsumable,
  } = useGameState();

  const profile = subjectProfiles.english;
  const radar = useMemo(() => computeEnglishHangarRadar(profile), [profile]);
  const [tab, setTab] = useState<'loadout' | 'jets' | 'tactical'>('loadout');
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const activeCopilot =
    ENGLISH_COPILOTS.find((c) => c.id === profile.copilotSpiritId) ?? ENGLISH_COPILOTS[0];

  const notify = (res: { ok: boolean; message: string }) => {
    setToast({ ok: res.ok, text: res.message });
    if (res.ok) soundEngine.playCorrectChord(2);
    else soundEngine.playWrongBuzz();
  };

  const slotGroups: Array<{
    slot: 'wing' | 'weaponPod' | 'avionicsChip';
    title: string;
    subtitle: string;
    activeId: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    {
      slot: 'wing',
      title: '機體改裝件（機翼／推進器）',
      subtitle: '決定閃避機動與推進功率',
      activeId: profile.loadout.wingModuleId,
      icon: Plane,
    },
    {
      slot: 'weaponPod',
      title: '可切換武器莢艙（Weapon Pods）',
      subtitle: '依關卡需求切換雷射、音標追蹤彈或電磁脈衝網',
      activeId: profile.loadout.weaponPodId,
      icon: Crosshair,
    },
    {
      slot: 'avionicsChip',
      title: '航電與護盾晶片（Avionics Chip）',
      subtitle: '強化偏折護盾能量與語音鎖定窗口',
      activeId: profile.loadout.avionicsChipId,
      icon: Cpu,
    },
  ];

  return (
    <div className="space-y-5" data-testid="hub-english-hangar">
      {/* Sci-Fi Hangar Showcase Banner (NO RPG swords/classes/trees!) */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-400/35 bg-slate-900 shadow-2xl">
        <img
          src={SUBJECT_HUB_ART.english.imageUrl}
          alt={SUBJECT_HUB_ART.english.title}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-cyan-950/60" />

        <div className="relative z-10 p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left: Pilot Identity & Active Jet Schematic */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-48 rounded-2xl bg-slate-950/85 border border-cyan-400/40 p-2 shrink-0">
              <JetBaySchematicSvg
                liveryColor={radar.jet.liveryColor}
                accentColor={radar.jet.accentColor}
                wingId={profile.loadout.wingModuleId}
                podId={profile.loadout.weaponPodId}
                chipId={profile.loadout.avionicsChipId}
              />
            </div>
            <div className="min-w-0 w-full">
              <div className="text-xs font-bold text-cyan-300 tracking-wide">
                英語星際航電 · 模組化改裝機庫
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5">
                {SUBJECT_HUB_ART.english.title}
              </h2>
              <div className="mt-1.5 text-sm font-bold text-cyan-200">
                {profile.pilotRank} · {radar.jet.name}
              </div>
              <div className="mt-1 text-xs text-slate-300 font-mono-num">
                機型代號 {radar.jet.codeName} · 累積航程 {profile.flightMiles.toLocaleString()} km
              </div>
              <div className="mt-3 rounded-xl bg-slate-950/85 border border-cyan-400/40 px-3.5 py-2 inline-flex items-center gap-3">
                <div>
                  <div className="text-[10px] text-cyan-300 font-bold">可用航電核心</div>
                  <div className="text-xl font-black text-white font-mono-num leading-none mt-0.5">
                    {profile.hangarCores}
                  </div>
                </div>
                <div className="h-7 w-px bg-slate-800" />
                <div className="text-[11px] text-slate-300">
                  已解鎖機型 <strong className="text-white font-mono-num">{profile.unlockedJetIds.length}/4</strong> · 模組{' '}
                  <strong className="text-white font-mono-num">{profile.unlockedModuleIds.length}/9</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Live Modular Loadout Readout */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-black text-slate-300">當前出擊配裝方案</div>
            <div className="rounded-xl bg-slate-950/85 border border-slate-800 px-3.5 py-2.5 text-xs">
              <span className="text-slate-400">機翼推進：</span>
              <span className="font-black text-white">{radar.wing.name}</span>
            </div>
            <div className="rounded-xl bg-slate-950/85 border border-slate-800 px-3.5 py-2.5 text-xs">
              <span className="text-slate-400">武器莢艙：</span>
              <span className="font-black text-amber-300">{radar.pod.name}</span>
            </div>
            <div className="rounded-xl bg-slate-950/85 border border-slate-800 px-3.5 py-2.5 text-xs">
              <span className="text-slate-400">護盾晶片：</span>
              <span className="font-black text-emerald-300">{radar.chip.name}</span>
            </div>
            <div className="rounded-xl bg-slate-950/85 border border-slate-800 px-3.5 py-2.5 text-xs">
              <span className="text-slate-400">AI 領航員：</span>
              <span className="font-black text-cyan-300">{activeCopilot.name}</span>
            </div>
          </div>

          {/* Right: Live 4-Axis Avionics Radar */}
          <div className="lg:col-span-3 rounded-2xl bg-slate-950/85 border border-slate-800 p-2">
            <HangarRadarSvg
              firepower={radar.firepower}
              shield={radar.shield}
              mobility={radar.mobility}
              lockOn={radar.lockOn}
            />
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
      <div className="inline-flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        {(
          [
            { id: 'loadout', label: '模組化自由配裝台', icon: Sliders },
            { id: 'jets', label: '戰機藍圖機庫', icon: Plane },
            { id: 'tactical', label: '戰術消耗品與 AI 領航', icon: Radio },
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
                active ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Modular Hangar Loadout (Wing + Weapon Pod + Avionics Chip) */}
      {tab === 'loadout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {slotGroups.map((group) => {
            const Icon = group.icon;
            const modules = ENGLISH_MODULES.filter((m) => m.slot === group.slot);
            return (
              <div
                key={group.slot}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3"
              >
                <div className="border-b border-slate-800 pb-2.5">
                  <div className="text-sm font-black text-cyan-300 flex items-center gap-1.5">
                    <Icon className="w-4 h-4 shrink-0" /> {group.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{group.subtitle}</div>
                </div>

                <div className="space-y-2.5">
                  {modules.map((mod) => {
                    const unlocked = profile.unlockedModuleIds.includes(mod.id);
                    const equipped = group.activeId === mod.id;
                    const canAfford = profile.hangarCores >= mod.unlockCores;

                    return (
                      <div
                        key={mod.id}
                        className={`rounded-xl p-3 border space-y-2 ${
                          equipped
                            ? 'bg-cyan-950/45 border-cyan-400'
                            : 'bg-slate-950/90 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-black text-white">{mod.name}</div>
                            <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                              {mod.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="text-[11px] font-mono-num text-cyan-200">
                            {mod.firepowerDelta > 0 && `火力+${mod.firepowerDelta} `}
                            {mod.mobilityDelta > 0 && `機動+${mod.mobilityDelta} `}
                            {mod.shieldDelta > 0 && `護盾+${mod.shieldDelta} `}
                            {mod.lockOnDelta > 0 && `鎖定+${mod.lockOnDelta}`}
                          </div>
                          <button
                            type="button"
                            disabled={equipped || (!unlocked && !canAfford)}
                            onClick={() => notify(unlockOrEquipEnglishModule(mod.id))}
                            className={`min-h-[34px] px-3 rounded-lg text-xs font-black whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                              equipped
                                ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                                : unlocked
                                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                                  : canAfford
                                    ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {equipped ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> 裝載中
                              </>
                            ) : unlocked ? (
                              '切換裝載'
                            ) : (
                              <>
                                <Lock className="w-3 h-3" /> {mod.unlockCores} 核心
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Jet Blueprints */}
      {tab === 'jets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ENGLISH_JETS.map((jet) => {
            const unlocked = profile.unlockedJetIds.includes(jet.id);
            const active = profile.activeJetId === jet.id;
            const canAfford = profile.hangarCores >= jet.unlockCores;

            return (
              <div
                key={jet.id}
                className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 ${
                  active
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-lg'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono-num font-bold text-cyan-300">
                      {jet.codeName}
                    </div>
                    <h3 className="text-lg font-black text-white mt-0.5">{jet.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{jet.description}</p>
                  </div>
                  <span
                    className="w-9 h-9 rounded-xl border border-white/30 shrink-0"
                    style={{ backgroundColor: jet.liveryColor }}
                    title="機身塗裝色"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 text-center rounded-xl bg-slate-950/90 border border-slate-800 p-2.5 font-mono-num">
                  <div>
                    <div className="text-[10px] text-slate-400">火力</div>
                    <div className="text-sm font-black text-sky-300">{jet.baseFirepower}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">機動</div>
                    <div className="text-sm font-black text-amber-300">{jet.baseMobility}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">護盾</div>
                    <div className="text-sm font-black text-emerald-300">{jet.baseShield}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">鎖定</div>
                    <div className="text-sm font-black text-fuchsia-300">{jet.baseLockOn}</div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={active || (!unlocked && !canAfford)}
                  onClick={() => notify(unlockOrSelectEnglishJet(jet.id))}
                  className={`w-full min-h-[42px] rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 ${
                    active
                      ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                      : unlocked
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                        : canAfford
                          ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {active ? (
                    <>
                      <Check className="w-4 h-4" /> 當前出擊機體
                    </>
                  ) : unlocked ? (
                    '設為出擊機體'
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> 消耗 {jet.unlockCores} 航電核心解鎖藍圖
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: Tactical Items & AI Co-pilot */}
      {tab === 'tactical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sm font-black text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> 戰術消耗品整備
              </span>
              <span className="text-xs font-mono-num font-black text-amber-300 inline-flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> {save.coins} 金幣
              </span>
            </div>
            <div className="space-y-2.5">
              {ENGLISH_TACTICAL_ITEMS.map((item) => {
                const count = profile.tacticalItems[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white">
                        {item.name}{' '}
                        <span className="text-xs font-mono-num text-cyan-300">× {count}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.effect}</p>
                    </div>
                    <button
                      type="button"
                      disabled={save.coins < item.costCoins}
                      onClick={() =>
                        notify(buySubjectConsumable('english', item.id, item.costCoins, item.name))
                      }
                      className={`min-h-[38px] px-3 rounded-xl text-xs font-black whitespace-nowrap shrink-0 ${
                        save.coins >= item.costCoins
                          ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      補給 ({item.costCoins}金)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="text-sm font-black text-emerald-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Shield className="w-4 h-4" /> 機載 AI 領航精靈
            </div>
            <div className="space-y-2.5">
              {ENGLISH_COPILOTS.map((ai) => {
                const selected = profile.copilotSpiritId === ai.id;
                return (
                  <button
                    key={ai.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playPetChime();
                      selectEnglishCopilot(ai.id);
                      setToast({ ok: true, text: `已連線 AI 領航員：${ai.name}` });
                    }}
                    className={`w-full rounded-xl p-3.5 border text-left transition-colors ${
                      selected
                        ? 'bg-cyan-950/50 border-cyan-400'
                        : 'bg-slate-950/90 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-white">
                        {ai.name}{' '}
                        <span className="text-xs font-bold text-slate-400">· {ai.role}</span>
                      </span>
                      {selected && (
                        <span className="text-xs font-black text-cyan-300">連線中</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{ai.passive}</p>
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
