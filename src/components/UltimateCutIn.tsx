import React from 'react';
import { Play, RotateCcw, Home, Lightbulb, X } from 'lucide-react';

export interface UltimateCutInProps {
  visible: boolean;
  title: string;
  subtitle: string;
  symbol: string;
  accentBg: string;
}

export const UltimateCutIn: React.FC<UltimateCutInProps> = ({
  visible,
  title,
  subtitle,
  symbol,
  accentBg,
}) => {
  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-slate-950/65" />
      <div
        className={`animate-cut-in relative w-[120%] py-8 px-12 border-y-4 border-amber-300 shadow-2xl flex items-center justify-center gap-8 ${accentBg}`}
      >
        <div className="text-7xl sm:text-8xl font-black text-amber-200 drop-shadow-[0_6px_0_rgba(15,23,42,0.85)] select-none">
          {symbol}
        </div>
        <div className="text-left">
          <div className="text-amber-200 text-sm font-bold tracking-widest uppercase">
            智光必殺技發動
          </div>
          <div className="text-4xl sm:text-5xl font-black text-white hud-text-stroke font-display">
            {title}
          </div>
          <div className="text-base sm:text-lg font-bold text-amber-100 mt-1">
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface ExplanationBannerProps {
  message: {
    title: string;
    answer: string;
    explanation: string;
    tag: string;
  } | null;
  onDismiss: () => void;
}

export const ExplanationBanner: React.FC<ExplanationBannerProps> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,560px)] rounded-2xl bg-slate-900/95 border-2 border-amber-400/90 px-4 py-3 shadow-2xl pointer-events-auto"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-sm font-black text-amber-300">
              {message.title} · 正解：{message.answer}
            </div>
            <p className="text-xs sm:text-sm text-slate-100 mt-0.5 leading-snug">
              {message.explanation}
            </p>
            <div className="text-[11px] text-slate-400 mt-1">
              已收錄至錯題本 · 知識點：{message.tag}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="關閉解析提示"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export interface WorldPauseModalProps {
  open: boolean;
  worldName: string;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const WorldPauseModal: React.FC<WorldPauseModalProps> = ({
  open,
  worldName,
  onResume,
  onRestart,
  onExit,
}) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="暫停選單"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 pointer-events-auto"
    >
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-amber-400/70 p-6 shadow-2xl text-center">
        <h2 className="text-2xl font-black text-white font-display">遊戲暫停</h2>
        <p className="text-sm text-slate-300 mt-1">{worldName}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full min-h-[48px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Play className="w-5 h-5" /> 繼續冒險
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base border border-slate-600 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <RotateCcw className="w-5 h-5" /> 重新挑戰
          </button>
          <button
            type="button"
            onClick={onExit}
            className="w-full min-h-[48px] rounded-xl bg-slate-800/70 hover:bg-rose-900/60 text-slate-200 hover:text-white font-bold text-base border border-slate-700 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Home className="w-5 h-5" /> 返回智光學園廣場
          </button>
        </div>
      </div>
    </div>
  );
};
