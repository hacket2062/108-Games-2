import React, { useEffect, useState } from 'react';
import { Star, Coins, Sparkles, RotateCcw, Home, Award, Gift, ArrowRight, BookOpen } from 'lucide-react';
import { getLearningFeedback } from '../core/gameExperience';
import type { RunMistake } from '../core/runReview';
import type { WorldRunResult } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface BattleEndModalProps {
  result: WorldRunResult | null;
  leveledUp?: boolean;
  onRetry: () => void;
  onNextStage?: () => void;
  onReturnLobby: () => void;
  onReviewMistakes?: () => void;
  onTryPractice?: () => void;
  wrongRecordCount?: number;
  runMistakes?: readonly RunMistake[];
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
  onReviewMistakes,
  onTryPractice,
  wrongRecordCount = 0,
  runMistakes = [],
}) => {
  const [litStars, setLitStars] = useState(0);
  const [chestOpened, setChestOpened] = useState(false);

  useEffect(() => {
    if (!result) {
      setLitStars(0);
      setChestOpened(false);
      return;
    }

    setLitStars(0);
    setChestOpened(false);

    const timers: number[] = [];
    if (result.victory) {
      timers.push(
        window.setTimeout(() => {
          setChestOpened(true);
          soundEngine.playChestOpen();
          soundEngine.hapticPulse(24);
        }, 220)
      );
    }

    for (let s = 1; s <= result.stars; s++) {
      timers.push(
        window.setTimeout(() => {
          setLitStars(s);
          soundEngine.playStarChime(s);
        }, 380 + s * 220)
      );
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [result]);

  if (!result) return null;
  const { accuracy, message } = getLearningFeedback(result);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={result.victory ? '關卡勝利結算' : '挑戰失敗結算'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 pointer-events-auto overflow-y-auto"
    >
      <div
        className={`w-full max-w-lg my-auto rounded-3xl border-2 p-5 sm:p-6 shadow-2xl ${
          result.victory
            ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/90 border-amber-400'
            : 'bg-slate-900 border-rose-500/80'
        }`}
      >
        <div className="text-center">
          <div className="text-xs font-bold text-slate-400">
            {result.stageLabel ?? SUBJECT_NAMES[result.subject]}
          </div>
          {leveledUp && (
            <div className="mt-1.5 inline-block rounded-lg bg-amber-400/20 border border-amber-300/60 px-2.5 py-0.5 text-xs font-black text-amber-200">
              守護者升級！全屬性能力提升
            </div>
          )}
          <h2
            className={`text-2xl sm:text-4xl font-black mt-1 font-display ${
              result.victory ? 'text-amber-300' : 'text-rose-400'
            }`}
          >
            {result.victory ? '關卡大勝利！' : '帶著新線索，再試一次！'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">{result.progressSummary}</p>
          {result.playMode === 'practice' && <p className="text-xs text-cyan-200 mt-2">自由練習完成 · 冒險關卡與寶箱紀錄保持原樣</p>}

          {/* Animated Treasure Chest Reveal */}
          {result.victory && (
            <div className="mt-3 flex justify-center">
              <div
                className={`relative inline-flex items-center gap-2.5 rounded-2xl border-2 px-4 py-2 ${
                  chestOpened
                    ? 'animate-chest-open bg-gradient-to-r from-amber-500/25 via-yellow-400/25 to-orange-500/25 border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.45)]'
                    : 'bg-slate-800/80 border-slate-700 opacity-60'
                }`}
              >
                <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow">
                  <Gift className="w-5 h-5" />
                </span>
                <div className="text-left">
                  <div className="text-[11px] font-black text-amber-200">
                    {result.chestRewardText ? '傳說魔王寶箱已開啟！' : '通關戰利品寶箱已開啟！'}
                  </div>
                  <div className="text-xs font-bold text-white">
                    {result.chestRewardText ?? `獲得 ${result.coinsEarned} 金幣與 ${result.crystalsEarned} 智光晶石`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Staggered 3-Star Pop-In Lighting Display */}
          <div className="flex items-center justify-center gap-3.5 my-4">
            {[1, 2, 3].map((idx) => {
              const earned = idx <= result.stars;
              const lit = idx <= litStars;
              return (
                <div
                  key={idx}
                  className={`relative flex items-center justify-center ${
                    idx === 2 ? '-mt-2' : ''
                  }`}
                >
                  <Star
                    className={`w-11 h-11 transition-all duration-300 ${
                      earned && lit
                        ? 'animate-star-pop text-amber-400 fill-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.8)]'
                        : 'text-slate-700 fill-slate-800 scale-90'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Mastery Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/75 rounded-2xl p-3 border border-slate-800">
          <div className="text-center">
            <div className="text-[11px] text-slate-400">戰鬥積分</div>
            <div className="text-lg sm:text-xl font-black text-white font-mono-num">
              {Math.round(result.score)}
            </div>
          </div>
          <div className="text-center border-x border-slate-800">
            <div className="text-[11px] text-slate-400">答題正確率</div>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono-num">
              {accuracy === null ? '尚未作答' : `${accuracy}%`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-slate-400">最高連擊</div>
            <div className="text-lg sm:text-xl font-black text-amber-300 font-mono-num">
              {result.maxCombo}x
            </div>
          </div>
        </div>

        {/* Structured Loot Rewards List */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-950/70 border border-amber-500/35 px-2.5 py-2 text-center">
            <div className="inline-flex items-center justify-center gap-1 text-[11px] text-amber-300 font-bold">
              <Coins className="w-3.5 h-3.5" /> 金幣
            </div>
            <div className="text-sm sm:text-base font-black text-white font-mono-num">
              +{result.coinsEarned}
            </div>
          </div>
          <div className="rounded-xl bg-slate-950/70 border border-cyan-500/35 px-2.5 py-2 text-center">
            <div className="inline-flex items-center justify-center gap-1 text-[11px] text-cyan-300 font-bold">
              <Sparkles className="w-3.5 h-3.5" /> 智光晶石
            </div>
            <div className="text-sm sm:text-base font-black text-white font-mono-num">
              +{result.crystalsEarned}
            </div>
          </div>
          <div className="rounded-xl bg-slate-950/70 border border-emerald-500/35 px-2.5 py-2 text-center">
            <div className="inline-flex items-center justify-center gap-1 text-[11px] text-emerald-300 font-bold">
              <Award className="w-3.5 h-3.5" /> 守護經驗
            </div>
            <div className="text-sm sm:text-base font-black text-white font-mono-num">
              +{result.xpEarned}
            </div>
          </div>
        </div>

        {result.knowledgeTags.length > 0 && (
          <div className="mt-3 text-center text-xs text-slate-300">
            <span className="text-slate-400">本次接觸的知識：</span>
            {result.knowledgeTags.slice(0, 4).join(' · ')}
          </div>
        )}

        <div className="learning-next-step" role="status"><strong>守護者的小提醒</strong><p>{message}</p><p>本次作答 {result.totalAttempts} 次 · 答對 {result.correctCount} 次</p></div>
        {runMistakes.length > 0 && <section className="run-review-preview" aria-label="本局錯題速覽">
          <h3>這一局，帶走的新線索</h3>
          <p>本局 {runMistakes.length} 道錯題 · 先看前 3 題，不用急著重打。</p>
          {runMistakes.slice(0, 3).map((wrong) => <details key={wrong.questionId}>
            <summary>{wrong.prompt}</summary><p>參考答案：{wrong.correctAnswer}</p><p>{wrong.explanation}</p>
          </details>)}
        </section>}
        <div className="mt-5 flex flex-col gap-2.5">
          {onReviewMistakes && (runMistakes.length > 0 || wrongRecordCount > 0) && <button type="button" className="learning-review-button" onClick={onReviewMistakes}><BookOpen size={17} /> {runMistakes.length > 0 ? `複習本局錯題（${runMistakes.length} 題）` : `打開我的錯題本（${wrongRecordCount} 題）`}</button>}
          {!result.victory && result.playMode !== 'practice' && onTryPractice && <button type="button" className="learning-review-button" onClick={onTryPractice}>先用練習模式熟悉這一關</button>}
          {onNextStage && (
            <button
              type="button"
              data-start="true"
              onClick={() => {
                soundEngine.playClick();
                onNextStage();
              }}
              className="w-full min-h-[52px] rounded-xl bg-gradient-to-r from-emerald-400 to-amber-400 hover:brightness-110 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95"
            >
              推進下一關！ <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              data-start={!onNextStage ? 'true' : undefined}
              onClick={() => {
                soundEngine.playClick();
                onRetry();
              }}
              className="min-h-[48px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> {result.victory ? '重刷三星' : '立即重試'}
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onReturnLobby();
              }}
              className="min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm sm:text-base border border-slate-600 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <Home className="w-4 h-4" /> 返回章節地圖
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
