import React, { useState } from 'react';
import { X, BookOpen, Swords, CheckCircle2, Volume2 } from 'lucide-react';
import { PlayerSaveData, SubjectId, WrongRecord } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface MistakeNotebookModalProps {
  open: boolean;
  save: PlayerSaveData;
  onClose: () => void;
  onClearMistake: (questionId: string) => void;
}

const SUBJECT_LABELS: Record<SubjectId, string> = {
  chinese: '國語文',
  english: '英語文',
  math: '數學',
  science: '自然科學',
};

export const MistakeNotebookModal: React.FC<MistakeNotebookModalProps> = ({
  open,
  save,
  onClose,
  onClearMistake,
}) => {
  const [filter, setFilter] = useState<'all' | SubjectId>('all');
  const [revengeRecord, setRevengeRecord] = useState<WrongRecord | null>(null);
  const [revengeFeedback, setRevengeFeedback] = useState<string | null>(null);

  if (!open) return null;

  const filtered =
    filter === 'all'
      ? save.wrongRecords
      : save.wrongRecords.filter((r) => r.subject === filter);

  const startRevenge = (rec: WrongRecord) => {
    soundEngine.playSlash();
    setRevengeRecord(rec);
    setRevengeFeedback(null);
    soundEngine.speakText(rec.prompt, rec.subject === 'english' ? 'en-US' : 'zh-TW');
  };

  const handleRevengeAnswer = (opt: string) => {
    if (!revengeRecord) return;
    const isCorrect =
      opt === revengeRecord.correctAnswer ||
      revengeRecord.correctAnswer.includes(opt);
    if (isCorrect) {
      soundEngine.playPerfectBell();
      onClearMistake(revengeRecord.questionId);
      setRevengeFeedback('復仇成功！已從錯題本移除並獲得 +35 金幣！');
      setTimeout(() => {
        setRevengeRecord(null);
        setRevengeFeedback(null);
      }, 1050);
    } else {
      soundEngine.playWrongBuzz();
      setRevengeFeedback(`再看一次解析：${revengeRecord.explanation}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="智光錯題本與復仇挑戰"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border-2 border-rose-400/80 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-white font-display flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-rose-400" /> 智光錯題本
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              共收錄 {save.wrongRecords.length} 筆待複習題目 · 透過「錯題復仇挑戰」擊敗它們贏金幣！
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉錯題本"
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {(['all', 'chinese', 'english', 'math', 'science'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  filter === tab
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab === 'all' ? '全部科目' : SUBJECT_LABELS[tab]}
              </button>
            ))}
          </div>

          {filtered.length > 0 && !revengeRecord && (
            <button
              type="button"
              onClick={() => startRevenge(filtered[0])}
              className="min-h-[44px] px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
            >
              <Swords className="w-4 h-4" /> 一鍵錯題復仇挑戰
            </button>
          )}
        </div>

        {/* Active Revenge Challenge Arena */}
        {revengeRecord && (
          <div className="mt-4 rounded-2xl bg-slate-950 border-2 border-amber-400 p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-black text-amber-300">
                錯題復仇挑戰 · {SUBJECT_LABELS[revengeRecord.subject]} · {revengeRecord.grade}年級
              </span>
              <button
                type="button"
                onClick={() =>
                  soundEngine.speakText(
                    revengeRecord.prompt,
                    revengeRecord.subject === 'english' ? 'en-US' : 'zh-TW'
                  )
                }
                aria-label="朗讀復仇題目"
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-200 text-xs font-bold inline-flex items-center gap-1"
              >
                <Volume2 className="w-4 h-4" /> 朗讀
              </button>
            </div>
            <div className="text-lg font-black text-white mb-4">{revengeRecord.prompt}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(revengeRecord.revengeOptions && revengeRecord.revengeOptions.length >= 2
                ? revengeRecord.revengeOptions
                : [revengeRecord.correctAnswer, '再想一下']
              ).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleRevengeAnswer(opt)}
                  className="min-h-[48px] rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-slate-600 text-white font-bold text-sm px-4 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
            {revengeFeedback && (
              <div className="mt-3 text-sm font-bold text-emerald-300">{revengeFeedback}</div>
            )}
            <button
              type="button"
              onClick={() => setRevengeRecord(null)}
              className="mt-3 text-xs text-slate-400 hover:text-white underline"
            >
              返回錯題清單
            </button>
          </div>
        )}

        {/* Wrong Records List */}
        {!revengeRecord && (
          <div className="mt-4 space-y-2.5">
            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <div className="text-base font-black text-white">目前沒有待複習的錯題！</div>
                <p className="text-xs text-slate-400 mt-1">
                  在四大世界答錯題目時，系統會自動在此收錄解析，幫助你針對弱點進步。
                </p>
              </div>
            ) : (
              filtered.map((rec) => (
                <div
                  key={rec.questionId}
                  className="rounded-2xl bg-slate-950/75 border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-bold">
                      {SUBJECT_LABELS[rec.subject]} · {rec.grade}年級 · 知識點：{rec.knowledgeTag} · 錯 {rec.wrongCount} 次
                    </div>
                    <div className="text-sm sm:text-base font-black text-white mt-1">
                      {rec.prompt}
                    </div>
                    <div className="text-xs text-emerald-300 font-bold mt-1">
                      正解：{rec.correctAnswer}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{rec.explanation}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startRevenge(rec)}
                    className="min-h-[44px] px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Swords className="w-4 h-4" /> 復仇挑戰
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
