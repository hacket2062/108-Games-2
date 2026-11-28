import React from 'react';
import { ArrowLeft, BookMarked, Lock, Map, Play } from 'lucide-react';
import { SubjectId } from '../types/game';
import { useGameState } from '../core/GameStateContext';
import { soundEngine } from '../audio/soundEngine';
import { isScienceUnlockedForGrade, SUBJECT_HUB_ART } from '../data/subjectProgressionData';
import { MandarinDojoHub } from './hubs/MandarinDojoHub';
import { EnglishHangarHub } from './hubs/EnglishHangarHub';
import { MathCommandHub } from './hubs/MathCommandHub';
import { ScienceKitchenHub } from './hubs/ScienceKitchenHub';

interface SubjectHubScreenProps {
  subject: SubjectId;
  onChangeSubject: (subject: SubjectId) => void;
  onEnterStageMap: (subject: SubjectId) => void;
  onExit: () => void;
}

const SUBJECT_TABS: Array<{ id: SubjectId; label: string; hubName: string; activeCls: string }> = [
  { id: 'chinese', label: '國語', hubName: '文心道場', activeCls: 'bg-amber-400 text-slate-950' },
  { id: 'english', label: '英語', hubName: '王牌機庫', activeCls: 'bg-cyan-400 text-slate-950' },
  { id: 'math', label: '數學', hubName: '防線指揮部', activeCls: 'bg-sky-400 text-slate-950' },
  { id: 'science', label: '自然', hubName: '實驗廚房', activeCls: 'bg-emerald-400 text-slate-950' },
];

export const SubjectHubScreen: React.FC<SubjectHubScreenProps> = ({
  subject,
  onChangeSubject,
  onEnterStageMap,
  onExit,
}) => {
  const { save } = useGameState();
  const scienceLocked = subject === 'science' && !isScienceUnlockedForGrade(save.grade);

  const pendingPractice = (save.todayPracticeQueue ?? []).filter(
    (item) => !item.completed && item.subject === subject
  );

  return (
    <div
      className="w-full h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden"
      data-testid="subject-hub-screen"
      data-subject={subject}
    >
      {/* Top Single-Row Header */}
      <header className="shrink-0 safe-top bg-slate-900/95 border-b border-slate-800 px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-xs inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" /> 返回大廳
          </button>

          <div className="hidden md:flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            {SUBJECT_TABS.map((item) => {
              const active = item.id === subject;
              const locked = item.id === 'science' && !isScienceUnlockedForGrade(save.grade);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChangeSubject(item.id);
                  }}
                  className={`h-7 px-3 rounded-lg text-xs font-black whitespace-nowrap shrink-0 inline-flex items-center gap-1 transition-colors ${
                    active ? item.activeCls : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {locked && <Lock className="w-3 h-3" />}
                  {item.label}・{item.hubName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
          <span className="font-mono-num">
            {save.grade}年級{save.semester === 'upper' ? '上' : '下'}學期 · 成長跨年級永久保留
          </span>
        </div>
      </header>

      {/* Mobile Subject Switcher Strip */}
      <div className="md:hidden shrink-0 bg-slate-900/80 border-b border-slate-800 px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
        {SUBJECT_TABS.map((item) => {
          const active = item.id === subject;
          const locked = item.id === 'science' && !isScienceUnlockedForGrade(save.grade);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onChangeSubject(item.id);
              }}
              className={`h-8 px-3 rounded-lg text-xs font-black whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                active
                  ? item.activeCls
                  : 'bg-slate-950 text-slate-300 border border-slate-800'
              }`}
            >
              {locked && <Lock className="w-3 h-3" />}
              {item.label}・{item.hubName}
            </button>
          );
        })}
      </div>

      {/* Main Scrollable Hub Content */}
      <main className="flex-1 min-h-0 overflow-y-auto scroll-touch px-3 sm:px-6 py-4 sm:py-5 pb-24">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Parent Assigned Today Practice Banner (if any for this subject) */}
          {pendingPractice.length > 0 && (
            <div className="rounded-2xl bg-indigo-950/75 border border-indigo-400/50 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-indigo-100">
                <BookMarked className="w-4 h-4 text-indigo-300 shrink-0" />
                <span>
                  <strong className="text-white">今日家長練習清單：</strong>
                  進入關卡時系統將優先加強{' '}
                  {pendingPractice.map((p) => `「${p.knowledgeTag}」`).join('、')}
                </span>
              </div>
              <span className="text-[11px] font-mono-num font-bold text-indigo-300">
                待完成 {pendingPractice.length} 項
              </span>
            </div>
          )}

          {subject === 'chinese' && <MandarinDojoHub />}
          {subject === 'english' && <EnglishHangarHub />}
          {subject === 'math' && <MathCommandHub />}
          {subject === 'science' && (
            <ScienceKitchenHub onSwitchToOtherSubject={() => onChangeSubject('chinese')} />
          )}
        </div>
      </main>

      {/* Sticky Bottom Launch Bar */}
      <footer className="shrink-0 sticky bottom-0 z-30 safe-bottom bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-3 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="hidden sm:block min-w-0">
            <div className="text-xs font-black text-white truncate">
              {SUBJECT_HUB_ART[subject].title} · 整備就緒
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {SUBJECT_HUB_ART[subject].subtitle}
            </div>
          </div>
          <button
            type="button"
            disabled={scienceLocked}
            data-start="true"
            onClick={() => {
              soundEngine.playSlash();
              onEnterStageMap(subject);
            }}
            className={`w-full sm:w-auto sm:min-w-[280px] min-h-[48px] px-6 rounded-2xl font-black text-sm inline-flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-[0.98] whitespace-nowrap ${
              scienceLocked
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 to-emerald-400 hover:brightness-110 text-slate-950'
            }`}
          >
            {scienceLocked ? (
              <>
                <Lock className="w-4 h-4 shrink-0" /> 升上三年級解鎖自然實驗廚房
              </>
            ) : (
              <>
                <Map className="w-4 h-4 shrink-0" />
                <span>進入關卡地圖・出發冒險</span>
                <Play className="w-4 h-4 fill-slate-950 shrink-0" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
