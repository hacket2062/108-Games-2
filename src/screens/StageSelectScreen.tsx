import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  Crown,
  Flame,
  Gift,
  Lock,
  Play,
  Shield,
  Sparkles,
  Star,
  Swords,
} from 'lucide-react';
import { CampaignStageConfig, SubjectId } from '../types/game';
import { useGameState } from '../core/GameStateContext';
import {
  getChaptersForWorld,
  getChapterStarCount,
  getStageTierLabel,
  getWorldTotalStars,
  isStageUnlocked,
} from '../data/campaignMap';
import { soundEngine } from '../audio/soundEngine';

interface StageSelectScreenProps {
  subject: SubjectId;
  onStartStage: (stage: CampaignStageConfig) => void;
  onExit: () => void;
}

const WORLD_THEMES: Record<
  SubjectId,
  {
    worldName: string;
    subjectLabel: string;
    tagline: string;
    accentText: string;
    accentBorder: string;
    bgGrad: string;
    emblem: string;
  }
> = {
  chinese: {
    worldName: '墨靈幻境',
    subjectLabel: '國語文',
    tagline: 'RO 2.5D 水墨草地探索 · ATB 部件拼字與破邪斬句',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-400',
    bgGrad: 'from-slate-950 via-amber-950/35 to-slate-950',
    emblem: '墨',
  },
  english: {
    worldName: '星際機甲戰線',
    subjectLabel: '英語文',
    tagline: '霓虹彈幕機甲射擊 · 聽音轟炸單字機與母艦拼字',
    accentText: 'text-cyan-300',
    accentBorder: 'border-cyan-400',
    bgGrad: 'from-slate-950 via-indigo-950/50 to-slate-950',
    emblem: 'Aa',
  },
  math: {
    worldName: '數境建築王國',
    subjectLabel: '數學',
    tagline: '5×8 策略殭屍塔防 · 齒輪超頻與算式盾軌道雷射',
    accentText: 'text-sky-300',
    accentBorder: 'border-sky-400',
    bgGrad: 'from-slate-950 via-blue-950/45 to-slate-950',
    emblem: 'π',
  },
  science: {
    worldName: '元素料理大亂鬥',
    subjectLabel: '自然科學',
    tagline: 'Overcooked 節奏廚房 · 選材控溫酸鹼變色出餐',
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-400',
    bgGrad: 'from-slate-950 via-emerald-950/40 to-slate-950',
    emblem: '炎',
  },
};

export const StageSelectScreen: React.FC<StageSelectScreenProps> = ({
  subject,
  onStartStage,
  onExit,
}) => {
  const { save } = useGameState();
  const theme = WORLD_THEMES[subject];
  const chapters = useMemo(
    () => getChaptersForWorld(subject, save.grade),
    [subject, save.grade]
  );
  const worldStars = useMemo(
    () => getWorldTotalStars(subject, save.grade, save.stageProgress),
    [subject, save.grade, save.stageProgress]
  );

  const [chapterIdx, setChapterIdx] = useState<0 | 1 | 2>(0);
  const activeChapter = chapters[chapterIdx] ?? chapters[0];

  // Default to the highest unlocked stage in active chapter
  const [selectedStageNum, setSelectedStageNum] = useState<number>(() => {
    const ch = chapters[0];
    let highest = 1;
    for (const s of ch.stages) {
      if (isStageUnlocked(s, save.stageProgress)) highest = s.stageNumber;
    }
    return highest;
  });

  const selectedStage =
    activeChapter.stages[Math.max(0, Math.min(9, selectedStageNum - 1))] ?? activeChapter.stages[0];

  const isPracticeFreeUnlock = save.playMode === 'practice';
  const selectedUnlocked =
    isPracticeFreeUnlock || isStageUnlocked(selectedStage, save.stageProgress);
  const selectedRec = save.stageProgress?.[selectedStage.stageKey];

  const handleSwitchChapter = (idx: 0 | 1 | 2) => {
    soundEngine.playClick();
    setChapterIdx(idx);
    const ch = chapters[idx];
    let highest = 1;
    for (const s of ch.stages) {
      if (isPracticeFreeUnlock || isStageUnlocked(s, save.stageProgress)) {
        highest = s.stageNumber;
      }
    }
    setSelectedStageNum(highest);
  };

  return (
    <div
      className={`w-full h-[100dvh] bg-gradient-to-br ${theme.bgGrad} text-white flex flex-col overflow-hidden`}
      data-testid="stage-select-screen"
    >
      {/* Top World Map Header (Compact Single Row) */}
      <div className={`shrink-0 safe-top bg-slate-900/95 border-b-2 ${theme.accentBorder} px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-black text-xs inline-flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div className="w-8 h-8 rounded-xl bg-slate-950 border border-white/30 flex items-center justify-center font-black text-sm text-amber-300 shrink-0">
            {theme.emblem}
          </div>
          <h1 className={`text-sm sm:text-lg font-black ${theme.accentText} truncate`}>
            {theme.subjectLabel}・{theme.worldName}
          </h1>
          <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
            {save.grade}年級{save.semester === 'upper' ? '上' : '下'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-black font-mono-num shrink-0">
          <span className="text-amber-300 inline-flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {worldStars.earned}/{worldStars.max}
          </span>
          <span className="hidden sm:inline text-emerald-300">通關 {worldStars.clearedStages}/30</span>
        </div>
      </div>

      {/* Main Scrollable Stage Map & Intel */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-touch p-3 sm:p-4 pb-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* 3 Chapter Selector Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {chapters.map((ch, idx) => {
              const active = idx === chapterIdx;
              const chStars = getChapterStarCount(ch, save.stageProgress);
              const chUnlocked =
                isPracticeFreeUnlock || isStageUnlocked(ch.stages[0], save.stageProgress);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSwitchChapter(idx as 0 | 1 | 2)}
                  className={`rounded-2xl p-3.5 border-2 text-left transition-all ${
                    active
                      ? 'bg-slate-900 border-amber-400 shadow-xl'
                      : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-white flex items-center gap-1.5">
                      {!chUnlocked && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                      {ch.title}
                    </span>
                    <span className="text-xs font-black text-amber-300 font-mono-num inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {chStars}/30
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {ch.unitSummary}
                  </div>
                  <div className="text-[11px] font-bold text-rose-300 mt-1">
                    章節大魔王：{ch.bossName}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Split: Left 7 Cols 10-Stage Adventure Map + Right 5 Cols Stage Briefing Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* 10-Stage Map Grid */}
            <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border-2 border-slate-700 p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-base font-black text-white">{activeChapter.title}</div>
                  <div className="text-xs text-slate-400">
                    108 課綱核心單元：{activeChapter.unitSummary}
                  </div>
                </div>
                {isPracticeFreeUnlock && (
                  <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/70 border border-emerald-500/60 px-2.5 py-1 rounded-lg">
                    練習模式：全關卡自由挑選
                  </span>
                )}
              </div>

              {/* 10 Stage Nodes (2 Rows x 5 Cols with progression badges) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {activeChapter.stages.map((stage) => {
                  const unlocked =
                    isPracticeFreeUnlock || isStageUnlocked(stage, save.stageProgress);
                  const rec = save.stageProgress?.[stage.stageKey];
                  const isSelected = stage.stageNumber === selectedStage.stageNumber;
                  const isBoss = stage.tier === 'boss';
                  const isElite = stage.tier === 'elite';

                  return (
                    <button
                      key={stage.stageKey}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedStageNum(stage.stageNumber);
                      }}
                      className={`relative min-h-[108px] rounded-2xl p-2.5 border-2 flex flex-col items-center justify-between text-center overflow-hidden transition-colors active:scale-95 ${
                        isSelected
                          ? 'bg-slate-800 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                          : unlocked
                            ? isBoss
                              ? 'bg-rose-950/60 hover:bg-rose-950/90 border-rose-500/80'
                              : isElite
                                ? 'bg-amber-950/40 hover:bg-amber-950/70 border-amber-500/70'
                                : 'bg-slate-950/85 hover:bg-slate-800/80 border-slate-700'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[10px] font-black">
                        <span className="text-slate-400 font-mono-num">
                          {activeChapter.chapterIndex}-{stage.stageNumber}
                        </span>
                        {isBoss ? (
                          <Crown className="w-4 h-4 text-rose-400" />
                        ) : isElite ? (
                          <Swords className="w-3.5 h-3.5 text-amber-400" />
                        ) : !unlocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-sky-400" />
                        )}
                      </div>

                      <div className="my-1">
                        <div className="text-xs font-black text-white leading-tight">
                          {stage.title}
                        </div>
                        <div
                          className={`text-[10px] font-bold mt-0.5 ${
                            isBoss
                              ? 'text-rose-300'
                              : isElite
                                ? 'text-amber-300'
                                : stage.tier === 'brawl'
                                  ? 'text-fuchsia-300'
                                  : 'text-slate-400'
                          }`}
                        >
                          {getStageTierLabel(stage.tier)}
                        </div>
                      </div>

                      {/* 3-Star Row */}
                      <div className="flex items-center justify-center gap-0.5">
                        {[1, 2, 3].map((i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i <= (rec?.stars ?? 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend Strip */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>1–3關 基礎探索 · 4–6關 進階試煉 · 7關 雙精英守衛 · 8–9關 雙倍亂鬥 · 10關 二階大魔王</span>
                <span className="text-emerald-300 font-bold">單場防重複出題引擎已啟用</span>
              </div>
            </div>

            {/* Right 5 Cols: Selected Stage Briefing & Launch Panel */}
            <div
              className={`lg:col-span-5 rounded-3xl bg-slate-900 border-2 p-5 space-y-4 shadow-2xl ${
                selectedStage.tier === 'boss'
                  ? 'border-rose-500'
                  : selectedStage.tier === 'elite'
                    ? 'border-amber-400'
                    : 'border-sky-500/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-black text-amber-300 font-mono-num">
                    {activeChapter.title} · 第 {selectedStage.stageNumber} 關（
                    {getStageTierLabel(selectedStage.tier)}）
                  </div>
                  <h2 className="text-2xl font-black text-white mt-0.5">{selectedStage.title}</h2>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  {[1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i <= (selectedRec?.stars ?? 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedStage.subtitle}
              </p>

              {/* Enemy / Boss Intel */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" /> 關卡首領／敵陣
                  </span>
                  <span className="font-black text-rose-300">{selectedStage.enemyName}</span>
                </div>
                {selectedStage.bossPhase2Name && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-amber-400" /> 二階段狂暴形態
                    </span>
                    <span className="font-black text-amber-300">{selectedStage.bossPhase2Name}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs font-mono-num">
                  <div>
                    <div className="text-[10px] text-slate-400">波次／目標</div>
                    <div className="font-black text-white">{selectedStage.waveCount} 波</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">敵人強度</div>
                    <div className="font-black text-amber-300">
                      ×{selectedStage.enemyHpScale.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">連擊獎勵</div>
                    <div className="font-black text-emerald-300">
                      ×{selectedStage.comboRewardMultiplier.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Focus Knowledge Tags */}
              <div>
                <div className="text-xs font-black text-slate-400 mb-1.5">本關 108 課綱出題重點</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStage.focusTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-sky-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stage 10 3-Star Boss Chest Preview */}
              {selectedStage.starChestReward && (
                <div className="rounded-2xl bg-gradient-to-r from-amber-950/80 to-rose-950/70 border-2 border-amber-400/75 p-3.5 flex items-center gap-3">
                  <Gift className="w-8 h-8 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      三星通關大魔王寶箱
                      {selectedRec?.chestClaimed && (
                        <span className="text-emerald-300">（已領取）</span>
                      )}
                    </div>
                    <div className="text-xs text-white font-bold mt-0.5">
                      {selectedStage.starChestReward.label}
                    </div>
                  </div>
                </div>
              )}

              {selectedRec?.bestScore ? (
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1">
                    <Award className="w-4 h-4 text-emerald-400" /> 歷史最高分
                  </span>
                  <span className="font-black text-emerald-300 font-mono-num">
                    {selectedRec.bestScore} 分
                  </span>
                </div>
              ) : null}

            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Launch CTA Bar (100% visible without scrolling on 390x844 & 844x390!) */}
      <div className="shrink-0 sticky bottom-0 z-30 safe-bottom bg-slate-950/95 backdrop-blur-md border-t border-white/15 px-3 sm:px-5 py-2.5 shadow-[0_-8px_24px_rgba(2,6,23,0.75)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block min-w-0">
            <div className="text-xs font-black text-amber-300 truncate">
              {activeChapter.title} · 第 {selectedStage.stageNumber} 關（{getStageTierLabel(selectedStage.tier)}）
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              敵陣：{selectedStage.enemyName}｜{save.playerCount ?? 1}P 出擊
            </div>
          </div>
          <button
            type="button"
            disabled={!selectedUnlocked}
            data-start="true"
            onClick={() => {
              soundEngine.playSlash();
              onStartStage(selectedStage);
            }}
            className={`w-full sm:w-auto sm:min-w-[300px] min-h-[48px] px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-[0.98] ${
              selectedUnlocked
                ? selectedStage.tier === 'boss'
                  ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-orange-500 text-slate-950 hover:brightness-110'
                  : 'bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 hover:brightness-110'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {selectedUnlocked ? (
              <>
                <Play className="w-5 h-5 fill-slate-950 shrink-0" />
                <span className="truncate">
                  開始第 {selectedStage.stageNumber} 關・{selectedStage.title}！
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 shrink-0" />
                <span className="truncate">請先通關前一關（或切換練習模式）</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
