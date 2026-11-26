import React from 'react';
import { Star, Coins, Sparkles, RotateCcw, Home, Award } from 'lucide-react';
import { WorldRunResult } from '../types/game';

interface BattleEndModalProps {
  result: WorldRunResult | null;
  leveledUp?: boolean;
  onRetry: () => void;
  onNextStage?: () => void;
  onReturnLobby: () => void;
}

const SUBJECT_NAMES: Record<WorldRunResult['subject'], string> = {
  chinese: '國語文・墨靈幻境',
  english: '英語文・星際機甲戰線',
  math: '數學・數境建築王國',
  science: '自然科學・元素料理大亂鬥',
};

export const BattleEndModal: React.FC<BattleEndModalProps> = ({
  result,
  leveledUp,
  onRetry,
  onNextStage,
  onReturnLobby,
}) => {
  if (!result) return null;
  const accuracy =
    result.totalAttempts > 0
      ? Math.round((result.correctCount / result.totalAttempts) * 100)
      : 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={result.victory ? '關卡勝利結算' : '挑戰失敗結算'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 pointer-events-auto"
    >
      <div
        className={`w-full max-w-lg rounded-3xl border-2 p-6 sm:p-7 shadow-2xl ${
          result.victory
            ? 'bg-slate-900 border-amber-400'
            : 'bg-slate-900 border-rose-500/80'
        }`}
      >
        <div className="text-center">
          <div className="text-xs font-bold text-slate-400">
            {result.stageLabel ?? SUBJECT_NAMES[result.subject]}
          </div>
          {leveledUp && (
            <div className="mt-1 inline-block rounded-lg bg-amber-400/20 border border-amber-300/60 px-2.5 py-0.5 text-xs font-black text-amber-200">
              守護者升級！全屬性能力提升
            </div>
          )}
          <h2
            className={`text-3xl sm:text-4xl font-black mt-1 font-display ${
              result.victory ? 'text-amber-300' : 'text-rose-400'
            }`}
          >
            {result.victory ? '關卡大勝利！' : '差一點就通關了！'}
          </h2>
          <p className="text-sm text-slate-300 mt-1">{result.progressSummary}</p>

          {result.chestRewardText && (
            <div className="mt-3 rounded-2xl bg-amber-950/80 border-2 border-amber-400 px-3.5 py-2 text-xs font-black text-amber-200">
              {result.chestRewardText}
            </div>
          )}

          {/* 3-Star Display */}
          <div className="flex items-center justify-center gap-3 my-4">
            {[1, 2, 3].map((idx) => (
              <Star
                key={idx}
                className={`w-10 h-10 transition-transform ${
                  idx <= result.stars
                    ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.65)]'
                    : 'text-slate-700 fill-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mastery Metrics */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950/70 rounded-2xl p-3.5 border border-slate-800">
          <div className="text-center">
            <div className="text-xs text-slate-400">戰鬥積分</div>
            <div className="text-xl font-black text-white font-mono-num">
              {Math.round(result.score)}
            </div>
          </div>
          <div className="text-center border-x border-slate-800">
            <div className="text-xs text-slate-400">答題正確率</div>
            <div className="text-xl font-black text-emerald-400 font-mono-num">
              {accuracy}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">最高連擊</div>
            <div className="text-xl font-black text-amber-300 font-mono-num">
              {result.maxCombo}x
            </div>
          </div>
        </div>

        {/* Rewards Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-sm font-bold">
          <span className="inline-flex items-center gap-1.5 text-amber-300 font-mono-num">
            <Coins className="w-4 h-4" /> +{result.coinsEarned} 金幣
          </span>
          <span className="inline-flex items-center gap-1.5 text-cyan-300 font-mono-num">
            <Sparkles className="w-4 h-4" /> +{result.crystalsEarned} 晶石
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-300 font-mono-num">
            <Award className="w-4 h-4" /> +{result.xpEarned} 經驗值
          </span>
        </div>

        {result.knowledgeTags.length > 0 && (
          <div className="mt-4 text-center text-xs text-slate-300">
            <span className="text-slate-400">解鎖知識卡：</span>
            {result.knowledgeTags.slice(0, 4).join(' · ')}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          {onNextStage && (
            <button
              type="button"
              data-start="true"
              onClick={onNextStage}
              className="w-full min-h-[50px] rounded-xl bg-gradient-to-r from-emerald-400 to-amber-400 hover:brightness-110 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95"
            >
              推進下一關！
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              data-start={!onNextStage ? 'true' : undefined}
              onClick={onRetry}
              className="min-h-[48px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> {result.victory ? '重刷三星' : '立即重試'}
            </button>
            <button
              type="button"
              onClick={onReturnLobby}
              className="min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base border border-slate-600 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <Home className="w-4 h-4" /> 返回章節地圖
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
