import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  History,
  KeyRound,
  Layers,
  Lock,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { GradeLevel, SubjectId } from '../types/game';
import { useGameState } from '../core/GameStateContext';
import { useAuth } from '../auth/AuthContext';
import { soundEngine } from '../audio/soundEngine';
import {
  computeEnglishHangarRadar,
  ENGLISH_JETS,
  getTreeBranchProgress,
  isScienceUnlockedForGrade,
  MANDARIN_GROWTH_TREE,
  MATH_GROWTH_TREE,
  MATH_TURRET_ARSENAL,
  SCIENCE_GROWTH_TREE,
  SUBJECT_HUB_ART,
} from '../data/subjectProgressionData';

interface ParentDashboardProps {
  onExit: () => void;
}

const SUBJECT_NAMES: Record<SubjectId | 'pvp', string> = {
  chinese: '國語文',
  english: '英語文',
  math: '數學',
  science: '自然科學',
  pvp: '線上對戰',
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  tree_unlock: '成長樹解鎖',
  blueprint_unlock: '機庫藍圖改裝',
  tag_mastered: '知識點精熟',
  mistake_overcome: '錯題克服',
  session: '闖關歷程',
};

type MasteryStatus = 'mastered' | 'growing' | 'weak';

interface DiagnosticRow {
  key: string;
  subject: SubjectId;
  grade: GradeLevel;
  semesterLabel: string;
  tag: string;
  attempts: number;
  unassistedCorrect: number;
  hintedCorrect: number;
  wrongCount: number;
  unresolvedMistakes: number;
  status: MasteryStatus;
  sampleQuestionId?: string;
  samplePrompt?: string;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onExit }) => {
  const { user } = useAuth();
  const {
    save,
    subjectProfiles,
    updateParentSettings,
    addToTodayPracticeQueue,
    removeFromTodayPracticeQueue,
    buildLearningCsv,
  } = useGameState();

  // Dynamic two-digit multiplication parent lock challenge
  const [challenge] = useState(() => {
    const a = 12 + Math.floor(Math.random() * 8); // 12..19
    const b = 4 + Math.floor(Math.random() * 6); // 4..9
    return { a, b, answer: a * b };
  });

  const [unlocked, setUnlocked] = useState(false);
  const [mathInput, setMathInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [lockError, setLockError] = useState('');
  const [activeTab, setActiveTab] = useState<'dual_track' | 'timeline' | 'diagnostics' | 'settings'>(
    'dual_track'
  );
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectId>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | GradeLevel>('all');
  const [newPin, setNewPin] = useState(save.parentSettings.pinCode);
  const [notice, setNotice] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const mathOk = Number(mathInput.trim()) === challenge.answer;
    const pinOk = pinInput.trim() === save.parentSettings.pinCode;
    if (mathOk || pinOk) {
      soundEngine.playCorrectChord(2);
      setUnlocked(true);
      setLockError('');
    } else {
      soundEngine.playWrongBuzz();
      setLockError(
        `請輸入正確乘積（${challenge.a} × ${challenge.b}）或 4 位數家長 PIN 碼！`
      );
    }
  };

  const handleExportCsv = () => {
    const csv = buildLearningCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `智光守護者_學習歷程_${user.displayName}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    soundEngine.playPerfectBell();
    setNotice('已匯出 UTF-8 CSV 學習歷程報表，可直接以 Excel 或 Google 試算表開啟。');
  };

  const totalAnswered =
    save.subjectStats.chinese.answered +
    save.subjectStats.english.answered +
    save.subjectStats.math.answered +
    save.subjectStats.science.answered;
  const totalCorrect =
    save.subjectStats.chinese.correct +
    save.subjectStats.english.correct +
    save.subjectStats.math.correct +
    save.subjectStats.science.correct;
  const overallAccText =
    totalAnswered > 0 ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : '尚未開始探索';
  const todayMinutes = Math.round(save.dailyPlaySeconds / 60);
  const rapidGuessCount = save.rapidGuessCount ?? 0;

  // Honest Mastery Diagnostics rows (strictly separating unassisted vs hinted vs weak mistakes)
  const diagnosticRows = useMemo<DiagnosticRow[]>(() => {
    const map = new Map<string, DiagnosticRow>();

    // Seed from detailed TagMasteryRecord
    for (const [key, rec] of Object.entries(save.tagMastery ?? {})) {
      const status: MasteryStatus =
        rec.unassistedCorrect >= 2 && rec.wrongCount === 0
          ? 'mastered'
          : rec.wrongCount > rec.unassistedCorrect
            ? 'weak'
            : rec.unassistedCorrect >= 2
              ? 'mastered'
              : 'growing';
      map.set(key, {
        key,
        subject: rec.subject,
        grade: rec.grade,
        semesterLabel: rec.semester === 2 ? '下學期' : '上學期',
        tag: rec.tag,
        attempts: rec.attempts,
        unassistedCorrect: rec.unassistedCorrect,
        hintedCorrect: rec.hintedCorrect,
        wrongCount: rec.wrongCount,
        unresolvedMistakes: 0,
        status,
      });
    }

    // Backfill legacy knowledgeMastery entries if not yet in tagMastery
    for (const [, legacy] of Object.entries(save.knowledgeMastery ?? {})) {
      const fallbackKey = `${legacy.subject}:g${save.grade}:${legacy.tag}`;
      if (!map.has(fallbackKey) && legacy.answered > 0) {
        const wrong = Math.max(0, legacy.answered - legacy.correct);
        const status: MasteryStatus =
          legacy.correct >= 2 && wrong === 0
            ? 'mastered'
            : wrong > legacy.correct
              ? 'weak'
              : 'growing';
        map.set(fallbackKey, {
          key: fallbackKey,
          subject: legacy.subject,
          grade: save.grade,
          semesterLabel: save.semester === 'lower' ? '下學期' : '上學期',
          tag: legacy.tag,
          attempts: legacy.answered,
          unassistedCorrect: legacy.correct,
          hintedCorrect: 0,
          wrongCount: wrong,
          unresolvedMistakes: 0,
          status,
        });
      }
    }

    // Merge unresolved WrongRecords — any unresolved mistake forces status to 'weak'
    for (const w of save.wrongRecords) {
      const key = `${w.subject}:g${w.grade}:${w.knowledgeTag}`;
      const existing = map.get(key);
      if (existing) {
        existing.unresolvedMistakes += w.wrongCount;
        existing.wrongCount = Math.max(existing.wrongCount, w.wrongCount);
        existing.status = 'weak';
        existing.sampleQuestionId = existing.sampleQuestionId ?? w.questionId;
        existing.samplePrompt = existing.samplePrompt ?? w.prompt;
      } else {
        map.set(key, {
          key,
          subject: w.subject,
          grade: w.grade,
          semesterLabel: '待複習',
          tag: w.knowledgeTag,
          attempts: w.wrongCount,
          unassistedCorrect: 0,
          hintedCorrect: 0,
          wrongCount: w.wrongCount,
          unresolvedMistakes: w.wrongCount,
          status: 'weak',
          sampleQuestionId: w.questionId,
          samplePrompt: w.prompt,
        });
      }
    }

    const order: Record<MasteryStatus, number> = { weak: 0, growing: 1, mastered: 2 };
    return Array.from(map.values()).sort(
      (a, b) =>
        order[a.status] - order[b.status] ||
        b.unresolvedMistakes - a.unresolvedMistakes ||
        b.attempts - a.attempts
    );
  }, [save.knowledgeMastery, save.grade, save.semester, save.tagMastery, save.wrongRecords]);

  const filteredDiagnostics = useMemo(
    () =>
      diagnosticRows.filter(
        (r) =>
          (subjectFilter === 'all' || r.subject === subjectFilter) &&
          (gradeFilter === 'all' || r.grade === gradeFilter)
      ),
    [diagnosticRows, gradeFilter, subjectFilter]
  );

  // Merged Chronological Timeline (Milestones + Battle Trajectory)
  const mergedTimeline = useMemo(() => {
    const milestoneEvents = (save.learningMilestones ?? []).map((m) => ({
      id: m.id,
      ts: Date.parse(m.timestamp) || Date.now(),
      subject: m.subject as SubjectId | 'pvp',
      gradeLabel: `${m.grade}年級${m.semester === 2 ? '下' : '上'}`,
      typeLabel: EVENT_TYPE_LABEL[m.eventType] ?? '成長里程碑',
      title: m.title,
      evidence: m.curriculumEvidence,
      isMilestone: true,
    }));

    const sessionEvents = save.trajectory.map((t) => {
      const acc =
        t.totalAttempts > 0 ? Math.round((t.correctCount / t.totalAttempts) * 100) : null;
      return {
        id: t.id,
        ts: t.timestamp,
        subject: t.subject,
        gradeLabel: `${t.grade}年級`,
        typeLabel: EVENT_TYPE_LABEL.session,
        title: `${SUBJECT_NAMES[t.subject]}冒險（${t.victory ? '通關' : '練習結束'}）`,
        evidence:
          acc !== null
            ? `${t.note} · 答對 ${t.correctCount}/${t.totalAttempts} 題（正確率 ${acc}%，耗時 ${t.durationSeconds} 秒）`
            : `${t.note} · 尚未完成有效答題`,
        isMilestone: false,
      };
    });

    return [...milestoneEvents, ...sessionEvents].sort((a, b) => b.ts - a.ts).slice(0, 40);
  }, [save.learningMilestones, save.trajectory]);

  const mandarinBranches = useMemo(
    () => getTreeBranchProgress(MANDARIN_GROWTH_TREE, subjectProfiles.chinese.growthTree),
    [subjectProfiles.chinese.growthTree]
  );
  const mathBranches = useMemo(
    () => getTreeBranchProgress(MATH_GROWTH_TREE, subjectProfiles.math.growthTree),
    [subjectProfiles.math.growthTree]
  );
  const scienceBranches = useMemo(
    () => getTreeBranchProgress(SCIENCE_GROWTH_TREE, subjectProfiles.science.growthTree),
    [subjectProfiles.science.growthTree]
  );
  const englishRadar = useMemo(
    () => computeEnglishHangarRadar(subjectProfiles.english),
    [subjectProfiles.english]
  );

  const practiceQueue = save.todayPracticeQueue ?? [];
  const masteredCount = diagnosticRows.filter((r) => r.status === 'mastered').length;
  const weakCount = diagnosticRows.filter((r) => r.status === 'weak').length;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div
      className="w-full h-[100dvh] bg-slate-950 text-white flex flex-col overflow-hidden"
      data-testid="parent-dashboard"
    >
      {/* Top Header */}
      <header className="shrink-0 safe-top bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="min-h-[42px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-xs inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" /> 返回學園
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-sky-300 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 shrink-0" /> 家長學習歷程與 108 課綱診斷中心
            </h1>
            <p className="text-xs text-slate-400">
              學生檔案：{user.displayName} · 目前就讀設定：國小 {save.grade} 年級
              {save.semester === 'upper' ? '上學期' : '下學期'}
            </p>
          </div>
        </div>

        {unlocked && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[40px] px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> 匯出 CSV 學習報表
          </button>
        )}
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
        {!unlocked ? (
          <form
            onSubmit={handleUnlock}
            className="max-w-md mx-auto mt-8 rounded-3xl bg-slate-900 border border-sky-400/50 p-6 space-y-5 shadow-2xl"
          >
            <div className="text-center">
              <Lock className="w-10 h-10 text-sky-300 mx-auto" />
              <h2 className="text-xl font-black text-white mt-2">家長雙重安全驗證</h2>
              <p className="text-xs text-slate-400 mt-1">
                請完成兩位數乘法確認，或輸入 4 位數家長 PIN 碼（預設 1234）
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1.5">
                  方式一・乘法驗證：{challenge.a} × {challenge.b} = ?
                </label>
                <input
                  type="number"
                  value={mathInput}
                  onChange={(e) => setMathInput(e.target.value)}
                  placeholder="輸入計算結果"
                  className="w-full min-h-[46px] rounded-xl bg-slate-950 border border-slate-700 px-4 text-white font-mono-num text-base font-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sky-300 mb-1.5">
                  方式二・家長 4 位數 PIN 碼
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="預設 1234"
                  className="w-full min-h-[46px] rounded-xl bg-slate-950 border border-slate-700 px-4 text-white font-mono-num text-base font-black"
                />
              </div>
            </div>

            {lockError && <div className="text-xs text-rose-400 font-bold">{lockError}</div>}

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-sm"
            >
              解鎖家長學習歷程
            </button>
          </form>
        ) : (
          <div className="max-w-6xl mx-auto space-y-5">
            {notice && (
              <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/60 px-4 py-2.5 text-xs font-bold text-emerald-200">
                {notice}
              </div>
            )}

            {/* Honest Top KPI Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <div className="text-xs text-slate-400">累計真實作答</div>
                <div className="text-2xl font-black text-white font-mono-num mt-1">
                  {totalAnswered > 0 ? `${totalAnswered} 題` : '尚未開始探索'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono-num">
                  {totalAnswered > 0 ? `答對 ${totalCorrect} 題 · 正確率 ${overallAccText}` : '等待孩子開始第一場冒險'}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <div className="text-xs text-slate-400">108 課綱知識點掌握</div>
                <div className="text-2xl font-black text-emerald-300 font-mono-num mt-1">
                  {masteredCount} 項已精熟
                </div>
                <div className="text-[11px] text-rose-300 mt-0.5 font-mono-num">
                  待複習弱點 {weakCount} 項 · 已排入今日練習 {practiceQueue.filter((i) => !i.completed).length} 項
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 今日學習時間
                </div>
                <div className="text-2xl font-black text-amber-300 font-mono-num mt-1">
                  {todayMinutes} / {save.parentSettings.dailyLimitMinutes} 分
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">護眼定時提醒運作中</div>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                <div className="text-xs text-slate-400">作答專注度監測</div>
                <div
                  className={`text-2xl font-black font-mono-num mt-1 ${
                    rapidGuessCount >= 4 ? 'text-rose-400' : 'text-emerald-300'
                  }`}
                >
                  {rapidGuessCount} 次快猜
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {rapidGuessCount >= 4 ? '建議開啟不計時練習模式' : '審題節奏穩定良好'}
                </div>
              </div>
            </div>

            {/* Segmented Navigation Tabs */}
            <div className="inline-flex flex-wrap bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              {(
                [
                  { id: 'dual_track', label: '四科成長雙軌對照', icon: Layers },
                  { id: 'timeline', label: '學習軌跡時間軸', icon: History },
                  { id: 'diagnostics', label: '誠實學力診斷表', icon: BookOpen },
                  { id: 'settings', label: '家長守護設定', icon: Settings },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveTab(t.id);
                    }}
                    className={`min-h-[40px] px-3.5 rounded-lg text-xs font-black whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors ${
                      active
                        ? 'bg-sky-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: Dual-Track 4-Subject Progress */}
            {activeTab === 'dual_track' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Chinese Dual Track */}
                <div className="rounded-2xl bg-slate-900 border border-amber-500/35 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-bold text-amber-300">
                        國語文 · {SUBJECT_HUB_ART.chinese.title}
                      </div>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {subjectProfiles.chinese.characterTitle}（文心 Lv.
                        {subjectProfiles.chinese.rpgLevel}）
                      </h3>
                    </div>
                    <div className="text-right font-mono-num">
                      {save.subjectStats.chinese.answered > 0 ? (
                        <>
                          <div className="text-sm font-black text-emerald-300">
                            正確率{' '}
                            {Math.round(
                              (save.subjectStats.chinese.correct /
                                save.subjectStats.chinese.answered) *
                                100
                            )}
                            %
                          </div>
                          <div className="text-[11px] text-slate-400">
                            作答 {save.subjectStats.chinese.answered} 題 · 通關{' '}
                            {save.subjectStats.chinese.clears} 次
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-bold text-slate-400">尚未開始探索</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {mandarinBranches.map((b) => (
                      <div key={b.branch} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">
                            {b.branch}{' '}
                            <span className="text-slate-400 font-normal">· {b.curriculumFocus}</span>
                          </span>
                          <span className="font-mono-num font-black text-amber-300">
                            Lv.{b.currentLevels}/{b.maxLevels}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-amber-400"
                            style={{ width: `${(b.currentLevels / b.maxLevels) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* English Dual Track (Strictly Modular Hangar Blueprints, NO RPG tree!) */}
                <div className="rounded-2xl bg-slate-900 border border-cyan-500/35 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-bold text-cyan-300">
                        英語文 · {SUBJECT_HUB_ART.english.title}（模組化航電系統）
                      </div>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {subjectProfiles.english.pilotRank} · {englishRadar.jet.name}
                      </h3>
                    </div>
                    <div className="text-right font-mono-num">
                      {save.subjectStats.english.answered > 0 ? (
                        <>
                          <div className="text-sm font-black text-emerald-300">
                            正確率{' '}
                            {Math.round(
                              (save.subjectStats.english.correct /
                                save.subjectStats.english.answered) *
                                100
                            )}
                            %
                          </div>
                          <div className="text-[11px] text-slate-400">
                            作答 {save.subjectStats.english.answered} 題 · 航程{' '}
                            {subjectProfiles.english.flightMiles} km
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-bold text-slate-400">尚未開始探索</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                      <div className="text-slate-400">已解鎖戰機藍圖</div>
                      <div className="text-lg font-black text-cyan-300 font-mono-num mt-0.5">
                        {subjectProfiles.english.unlockedJetIds.length} / {ENGLISH_JETS.length} 架
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
                      <div className="text-slate-400">已解鎖改裝模組</div>
                      <div className="text-lg font-black text-sky-300 font-mono-num mt-0.5">
                        {subjectProfiles.english.unlockedModuleIds.length} / 9 組
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1">
                    <div>
                      現行戰術配置：{englishRadar.wing.name} · {englishRadar.pod.name} ·{' '}
                      {englishRadar.chip.name}
                    </div>
                    <div className="text-slate-400">
                      108 課綱對應：聽音辨字自然發音、單字拼寫重組與基礎生活句型
                    </div>
                  </div>
                </div>

                {/* Math Dual Track */}
                <div className="rounded-2xl bg-slate-900 border border-sky-500/35 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-bold text-sky-300">
                        數學 · {SUBJECT_HUB_ART.math.title}
                      </div>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {subjectProfiles.math.commanderRank} · 已強化砲台{' '}
                        {Object.values(subjectProfiles.math.turretUpgrades).reduce((s, v) => s + v, 0)} 階
                      </h3>
                    </div>
                    <div className="text-right font-mono-num">
                      {save.subjectStats.math.answered > 0 ? (
                        <>
                          <div className="text-sm font-black text-emerald-300">
                            正確率{' '}
                            {Math.round(
                              (save.subjectStats.math.correct / save.subjectStats.math.answered) *
                                100
                            )}
                            %
                          </div>
                          <div className="text-[11px] text-slate-400">
                            作答 {save.subjectStats.math.answered} 題 · 編入砲台{' '}
                            {subjectProfiles.math.activeDeckTurretIds.length}/{MATH_TURRET_ARSENAL.length}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-bold text-slate-400">尚未開始探索</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {mathBranches.map((b) => (
                      <div key={b.branch} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">
                            {b.branch}{' '}
                            <span className="text-slate-400 font-normal">· {b.curriculumFocus}</span>
                          </span>
                          <span className="font-mono-num font-black text-sky-300">
                            Lv.{b.currentLevels}/{b.maxLevels}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-sky-400"
                            style={{ width: `${(b.currentLevels / b.maxLevels) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Science Dual Track */}
                <div className="rounded-2xl bg-slate-900 border border-emerald-500/35 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="text-xs font-bold text-emerald-300">
                        自然科學 · {SUBJECT_HUB_ART.science.title}
                      </div>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {isScienceUnlockedForGrade(save.grade)
                          ? subjectProfiles.science.chefTitle
                          : '一～二年級友善鎖定（三年級開放）'}
                      </h3>
                    </div>
                    <div className="text-right font-mono-num">
                      {save.subjectStats.science.answered > 0 ? (
                        <>
                          <div className="text-sm font-black text-emerald-300">
                            正確率{' '}
                            {Math.round(
                              (save.subjectStats.science.correct /
                                save.subjectStats.science.answered) *
                                100
                            )}
                            %
                          </div>
                          <div className="text-[11px] text-slate-400">
                            作答 {save.subjectStats.science.answered} 題 · 通關{' '}
                            {save.subjectStats.science.clears} 次
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-bold text-slate-400">尚未開始探索</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {scienceBranches.map((b) => (
                      <div key={b.branch} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">
                            {b.branch}{' '}
                            <span className="text-slate-400 font-normal">· {b.curriculumFocus}</span>
                          </span>
                          <span className="font-mono-num font-black text-emerald-300">
                            Lv.{b.currentLevels}/{b.maxLevels}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-emerald-400"
                            style={{ width: `${(b.currentLevels / b.maxLevels) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Chronological Growth Timeline */}
            {activeTab === 'timeline' && (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-black text-white">學習成長軌跡時間軸</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      完整記錄每次樹狀解鎖、戰機藍圖改裝、獨立精熟知識點與錯題克服證據
                    </p>
                  </div>
                  <span className="text-xs font-mono-num text-slate-400">
                    共 {mergedTimeline.length} 筆紀錄
                  </span>
                </div>

                {mergedTimeline.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">
                    尚未開始探索。孩子完成第一次答題或解鎖科目成長節點後，歷程會即時記錄於此。
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {mergedTimeline.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs text-slate-400 font-mono-num">
                            {formatDate(ev.ts)} · {SUBJECT_NAMES[ev.subject]} · {ev.gradeLabel} ·{' '}
                            <span
                              className={
                                ev.isMilestone ? 'text-amber-300 font-bold' : 'text-sky-300 font-bold'
                              }
                            >
                              {ev.typeLabel}
                            </span>
                          </div>
                          <div className="text-sm font-black text-white mt-0.5">{ev.title}</div>
                          <div className="text-xs text-slate-300 mt-0.5">{ev.evidence}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Honest Mastery Diagnostics Table & Today Practice Queue */}
            {activeTab === 'diagnostics' && (
              <div className="space-y-4">
                {/* Today's Parent Practice Queue Panel */}
                <div className="rounded-2xl bg-slate-900 border border-indigo-500/40 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-indigo-300">
                        今日家長指定練習清單（進入對應科目關卡時自動優先出題）
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        從下方學力診斷表點選「加入今日練習清單」，即可精準補強孩子尚未獨立掌握的觀念。
                      </p>
                    </div>
                    <span className="text-xs font-mono-num text-indigo-200 font-bold">
                      待完成 {practiceQueue.filter((i) => !i.completed).length} / {practiceQueue.length}
                    </span>
                  </div>

                  {practiceQueue.length === 0 ? (
                    <div className="text-xs text-slate-400 py-1">
                      目前尚未排入指定練習項目。
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {practiceQueue.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white flex items-center gap-1.5">
                              {item.completed && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                              <span className={item.completed ? 'line-through text-slate-400' : ''}>
                                {SUBJECT_NAMES[item.subject]} · {item.grade}年級 · {item.knowledgeTag}
                              </span>
                            </div>
                            {item.prompt && (
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {item.prompt}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromTodayPracticeQueue(item.id)}
                            aria-label="移除練習項目"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filters + Honest Diagnostic Table */}
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black text-white">
                        108 課綱知識點誠實學力診斷表
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        嚴格區分「無提示獨立答對（≥2 題即精熟）」、「提示輔助練習中」與「待複習弱點」
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value as 'all' | SubjectId)}
                        className="h-9 rounded-lg bg-slate-950 border border-slate-700 px-2.5 text-xs font-bold text-white"
                      >
                        <option value="all">全部科目</option>
                        <option value="chinese">國語文</option>
                        <option value="english">英語文</option>
                        <option value="math">數學</option>
                        <option value="science">自然科學</option>
                      </select>
                      <select
                        value={gradeFilter}
                        onChange={(e) =>
                          setGradeFilter(
                            e.target.value === 'all' ? 'all' : (Number(e.target.value) as GradeLevel)
                          )
                        }
                        className="h-9 rounded-lg bg-slate-950 border border-slate-700 px-2.5 text-xs font-bold text-white"
                      >
                        <option value="all">全部年級</option>
                        {[1, 2, 3, 4, 5, 6].map((g) => (
                          <option key={g} value={g}>
                            {g}年級
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {filteredDiagnostics.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-400">
                      此篩選條件下尚未開始探索，無虛假或預設掌握度紀錄。
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2.5 pr-3 font-bold">科目 / 年級</th>
                            <th className="py-2.5 pr-3 font-bold">108 課綱知識點</th>
                            <th className="py-2.5 pr-3 font-bold">狀態判讀</th>
                            <th className="py-2.5 pr-3 font-bold font-mono-num">無提示對 / 提示對 / 錯</th>
                            <th className="py-2.5 text-right font-bold">家長輔導行動</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {filteredDiagnostics.map((row) => {
                            const queued = practiceQueue.some(
                              (q) =>
                                !q.completed &&
                                q.subject === row.subject &&
                                q.knowledgeTag === row.tag
                            );
                            return (
                              <tr key={row.key} className="hover:bg-slate-950/60">
                                <td className="py-3 pr-3 whitespace-nowrap text-slate-300">
                                  {SUBJECT_NAMES[row.subject]} · {row.grade}年級
                                </td>
                                <td className="py-3 pr-3 font-black text-white">{row.tag}</td>
                                <td className="py-3 pr-3 whitespace-nowrap font-bold">
                                  {row.status === 'mastered' && (
                                    <span className="text-emerald-300">已獨立掌握</span>
                                  )}
                                  {row.status === 'growing' && (
                                    <span className="text-amber-300">練習成長中</span>
                                  )}
                                  {row.status === 'weak' && (
                                    <span className="text-rose-400">待複習弱點</span>
                                  )}
                                </td>
                                <td className="py-3 pr-3 font-mono-num text-slate-300 whitespace-nowrap">
                                  <span className="text-emerald-300 font-bold">
                                    {row.unassistedCorrect}
                                  </span>{' '}
                                  / <span className="text-amber-300">{row.hintedCorrect}</span> /{' '}
                                  <span className="text-rose-400">{row.wrongCount}</span>
                                </td>
                                <td className="py-3 text-right whitespace-nowrap">
                                  {row.status !== 'mastered' ? (
                                    <button
                                      type="button"
                                      disabled={queued}
                                      onClick={() => {
                                        const res = addToTodayPracticeQueue({
                                          subject: row.subject,
                                          grade: row.grade,
                                          knowledgeTag: row.tag,
                                          questionId: row.sampleQuestionId,
                                          prompt: row.samplePrompt,
                                        });
                                        setNotice(res.message);
                                        if (res.ok) soundEngine.playCorrectChord(1);
                                      }}
                                      className={`min-h-[32px] px-3 rounded-lg text-[11px] font-black inline-flex items-center gap-1 ${
                                        queued
                                          ? 'bg-slate-800 text-slate-400 cursor-default'
                                          : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                                      }`}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      {queued ? '已在今日清單' : '幫孩子加入今日練習清單'}
                                    </button>
                                  ) : (
                                    <span className="text-slate-500 text-[11px]">已穩定掌握</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Parent Safeguard Settings */}
            {activeTab === 'settings' && (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 max-w-3xl">
                <div className="text-base font-black text-amber-300">家長守護與防沉迷設定</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                    <div className="flex justify-between text-xs font-bold">
                      <span>每日護眼時間上限</span>
                      <span className="text-amber-300 font-mono-num">
                        {save.parentSettings.dailyLimitMinutes} 分鐘
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={120}
                      step={5}
                      value={save.parentSettings.dailyLimitMinutes}
                      onChange={(e) =>
                        updateParentSettings({ dailyLimitMinutes: Number(e.target.value) })
                      }
                      className="w-full mt-2.5 accent-amber-400"
                    />
                  </div>

                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-sky-400 shrink-0" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="flex-1 min-w-0 min-h-[38px] rounded-lg bg-slate-900 border border-slate-700 px-2.5 text-sm font-mono-num font-black"
                      placeholder="4碼PIN"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newPin.length === 4) {
                          updateParentSettings({ pinCode: newPin });
                          setNotice('家長 4 位數 PIN 碼已更新。');
                        }
                      }}
                      className="min-h-[38px] px-3 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs shrink-0"
                    >
                      更新 PIN
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateParentSettings({ pvpEnabled: !save.parentSettings.pvpEnabled })
                    }
                    className={`min-h-[50px] rounded-xl px-4 border flex items-center justify-between text-xs font-black ${
                      save.parentSettings.pvpEnabled
                        ? 'bg-emerald-950/60 border-emerald-400 text-emerald-200'
                        : 'bg-slate-950 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>線上知識競技對戰開關</span>
                    <span>{save.parentSettings.pvpEnabled ? '已開啟' : '已鎖定'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateParentSettings({
                        forcePracticeMode: !save.parentSettings.forcePracticeMode,
                      })
                    }
                    className={`min-h-[50px] rounded-xl px-4 border flex items-center justify-between text-xs font-black ${
                      save.parentSettings.forcePracticeMode
                        ? 'bg-sky-950/60 border-sky-400 text-sky-200'
                        : 'bg-slate-950 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>強制練習模式（不計時）</span>
                    <span>{save.parentSettings.forcePracticeMode ? '已開啟' : '自由切換'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
