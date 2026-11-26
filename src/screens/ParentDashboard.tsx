import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Lock,
  ShieldCheck,
  TrendingUp,
  Clock,
  Swords,
  KeyRound,
} from 'lucide-react';
import { SubjectId } from '../types/game';
import { useGameState } from '../core/GameStateContext';
import { useAuth } from '../auth/AuthContext';
import { getSubjectAccuracyPercent } from '../core/combatMath';
import { getPvPRankTier } from '../data/spiritsAndTitles';
import { soundEngine } from '../audio/soundEngine';

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

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onExit }) => {
  const { user } = useAuth();
  const { save, updateParentSettings, buildLearningCsv } = useGameState();

  const [unlocked, setUnlocked] = useState(false);
  const [mathInput, setMathInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [lockError, setLockError] = useState('');
  const [newPin, setNewPin] = useState(save.parentSettings.pinCode);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Arithmetic challenge (47 + 28 = 75) OR 4-digit Parent PIN (default 1234)
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const mathOk = mathInput.trim() === '75';
    const pinOk = pinInput.trim() === save.parentSettings.pinCode;
    if (mathOk || pinOk) {
      soundEngine.playCorrectChord(2);
      setUnlocked(true);
      setLockError('');
    } else {
      soundEngine.playWrongBuzz();
      setLockError('請輸入正確算術答案（47 + 28）或 4 位數家長 PIN 碼！');
    }
  };

  const handleExportCsv = () => {
    const csv = buildLearningCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `智光守護者_學習報告_${user.displayName}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    soundEngine.playPerfectBell();
    setSavedNotice('已匯出 UTF-8 CSV 學習報告，可直接以 Excel 或 Google 試算表開啟！');
  };

  const weakTags = useMemo(() => {
    const map = new Map<string, { tag: string; subject: SubjectId; count: number }>();
    for (const w of save.wrongRecords) {
      const key = `${w.subject}:${w.knowledgeTag}`;
      const existing = map.get(key);
      if (existing) existing.count += w.wrongCount;
      else map.set(key, { tag: w.knowledgeTag, subject: w.subject, count: w.wrongCount });
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [save.wrongRecords]);

  const knowledgeHeatmap = useMemo(() => {
    const entries = Object.entries(save.knowledgeMastery ?? {}).map(([tag, rec]) => {
      const pct = rec.answered > 0 ? Math.round((rec.correct / rec.answered) * 100) : 0;
      return { tag, answered: rec.answered, correct: rec.correct, pct };
    });
    return entries.sort((a, b) => a.pct - b.pct || b.answered - a.answered).slice(0, 12);
  }, [save.knowledgeMastery]);

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
  const overallAcc = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const rapidGuessCount = save.rapidGuessCount ?? 0;
  const rapidGuessRate = totalAnswered > 0 ? Math.round((rapidGuessCount / totalAnswered) * 100) : 0;

  // Radar Chart coordinates
  const scores: Record<SubjectId, number> = {
    chinese: getSubjectAccuracyPercent(save.subjectStats.chinese),
    english: getSubjectAccuracyPercent(save.subjectStats.english),
    math: getSubjectAccuracyPercent(save.subjectStats.math),
    science: getSubjectAccuracyPercent(save.subjectStats.science),
  };
  const cx = 130;
  const cy = 120;
  const maxR = 82;
  const pt = (angleDeg: number, pct: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const r = (Math.max(12, pct) / 100) * maxR;
    return `${cx + Math.cos(rad) * r},${cy + Math.sin(rad) * r}`;
  };
  const polygonPoints = [
    pt(0, scores.chinese),
    pt(90, scores.english),
    pt(180, scores.math),
    pt(270, scores.science),
  ].join(' ');

  const rankTier = getPvPRankTier(save.pvp.rating);
  const todayMinutes = Math.round(save.dailyPlaySeconds / 60);

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col overflow-hidden" data-testid="parent-dashboard">
      {/* Header */}
      <div className="shrink-0 bg-slate-900 border-b-2 border-sky-500/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="min-h-[44px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-black text-xs inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> 返回學園
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-sky-300 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5" /> 家長／老師學習分析儀表板
            </h1>
            <p className="text-xs text-slate-400">
              學生檔案：{user.displayName} · {save.grade}年級（{save.semester === 'upper' ? '上學期' : '下學期'}）
            </p>
          </div>
        </div>

        {unlocked && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[44px] px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> 匯出 CSV 學習報表
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {!unlocked ? (
          <form
            onSubmit={handleUnlock}
            className="max-w-md mx-auto mt-8 rounded-3xl bg-slate-900 border-2 border-sky-400 p-6 space-y-5 shadow-2xl"
          >
            <div className="text-center">
              <Lock className="w-11 h-11 text-sky-300 mx-auto" />
              <h2 className="text-xl font-black text-white mt-2">家長雙重安全鎖</h2>
              <p className="text-xs text-slate-400 mt-1">
                請擇一完成「算術驗證」或輸入「4 位數家長 PIN 碼（預設 1234）」
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  方式一・算術驗證：47 + 28 = ?
                </label>
                <input
                  type="number"
                  value={mathInput}
                  onChange={(e) => setMathInput(e.target.value)}
                  placeholder="輸入計算結果"
                  className="w-full min-h-[48px] rounded-xl bg-slate-950 border-2 border-slate-700 px-4 text-white font-mono-num text-base font-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-sky-300 mb-1">
                  方式二・家長 4 位數 PIN 碼
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="預設 1234"
                  className="w-full min-h-[48px] rounded-xl bg-slate-950 border-2 border-slate-700 px-4 text-white font-mono-num text-base font-black"
                />
              </div>
            </div>

            {lockError && <div className="text-xs text-rose-400 font-bold">{lockError}</div>}

            <button
              type="submit"
              className="w-full min-h-[52px] rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-base"
            >
              解鎖分析儀表板
            </button>
          </form>
        ) : (
          <div className="max-w-6xl mx-auto space-y-5">
            {savedNotice && (
              <div className="rounded-2xl bg-emerald-950/80 border border-emerald-400 px-4 py-2.5 text-xs font-bold text-emerald-200">
                {savedNotice}
              </div>
            )}

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4">
                <div className="text-xs text-slate-400">累計作答題數</div>
                <div className="text-2xl font-black text-white font-mono-num mt-1">{totalAnswered} 題</div>
                <div className="text-[11px] text-emerald-400 mt-0.5">答對 {totalCorrect} 題</div>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4">
                <div className="text-xs text-slate-400">四科總正確率</div>
                <div className="text-2xl font-black text-sky-300 font-mono-num mt-1">{overallAcc}%</div>
                <div className="text-[11px] text-slate-400 mt-0.5">最高連擊 {save.bestStreak}x</div>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 今日學習時間
                </div>
                <div className="text-2xl font-black text-amber-300 font-mono-num mt-1">
                  {todayMinutes} / {save.parentSettings.dailyLimitMinutes} 分
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">防沉迷護眼提醒已啟用</div>
              </div>
              <div className="rounded-2xl bg-slate-900 border border-slate-700 p-4">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5" /> 競技場表現
                </div>
                <div className="text-2xl font-black font-mono-num mt-1" style={{ color: rankTier.color }}>
                  {rankTier.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {save.pvp.wins}勝 {save.pvp.losses}敗（積分 {save.pvp.rating}）
                </div>
              </div>
            </div>

            {/* Radar Chart + Parent Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* SVG 4-Subject Radar Chart */}
              <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-700 p-5 flex flex-col items-center">
                <div className="text-sm font-black text-sky-300 self-start mb-2">
                  四科 108 課綱能力雷達圖（正確率 %）
                </div>
                <svg viewBox="0 0 260 245" className="w-full max-w-[260px]">
                  {[0.33, 0.66, 1].map((r, i) => (
                    <polygon
                      key={i}
                      points={`${cx},${cy - maxR * r} ${cx + maxR * r},${cy} ${cx},${cy + maxR * r} ${cx - maxR * r},${cy}`}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="1.2"
                    />
                  ))}
                  <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="#334155" />
                  <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="#334155" />
                  <polygon
                    points={polygonPoints}
                    fill="rgba(56, 189, 248, 0.35)"
                    stroke="#38BDF8"
                    strokeWidth="2.8"
                  />
                  <text x={cx} y={24} textAnchor="middle" fill="#FDE047" fontSize="12" fontWeight="900">
                    國語 {scores.chinese}%
                  </text>
                  <text x={248} y={cy + 4} textAnchor="end" fill="#22D3EE" fontSize="12" fontWeight="900">
                    英語 {scores.english}%
                  </text>
                  <text x={cx} y={226} textAnchor="middle" fill="#60A5FA" fontSize="12" fontWeight="900">
                    數學 {scores.math}%
                  </text>
                  <text x={12} y={cy + 4} textAnchor="start" fill="#34D399" fontSize="12" fontWeight="900">
                    自然 {scores.science}%
                  </text>
                </svg>

                {/* Weak knowledge points */}
                <div className="w-full mt-3 pt-3 border-t border-slate-800">
                  <div className="text-xs font-black text-rose-300 mb-2">建議優先複習的薄弱知識點</div>
                  {weakTags.length === 0 ? (
                    <div className="text-xs text-slate-400">目前無累計錯題紀錄，表現非常優秀！</div>
                  ) : (
                    <div className="space-y-1.5">
                      {weakTags.map((w) => (
                        <div key={`${w.subject}-${w.tag}`} className="flex justify-between text-xs bg-slate-950 rounded-lg px-3 py-1.5">
                          <span className="font-bold text-slate-200">
                            【{SUBJECT_NAMES[w.subject]}】{w.tag}
                          </span>
                          <span className="font-black text-rose-400 font-mono-num">錯 {w.count} 次</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Controls + Learning Trajectory Timeline */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                {/* Parent Safeguard Controls */}
                <div className="rounded-3xl bg-slate-900 border border-slate-700 p-5 space-y-4">
                  <div className="text-sm font-black text-amber-300">家長守護與防沉迷設定</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5">
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
                        className="w-full mt-2 accent-amber-400"
                      />
                    </div>

                    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 flex items-center gap-2">
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
                            setSavedNotice('家長 4 位數 PIN 碼已更新！');
                          }
                        }}
                        className="min-h-[38px] px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shrink-0"
                      >
                        更新 PIN
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateParentSettings({ pvpEnabled: !save.parentSettings.pvpEnabled })
                      }
                      className={`min-h-[50px] rounded-2xl px-4 border-2 flex items-center justify-between text-xs font-black ${
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
                      className={`min-h-[50px] rounded-2xl px-4 border-2 flex items-center justify-between text-xs font-black ${
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

                {/* Learning Trajectory Timeline */}
                <div className="rounded-3xl bg-slate-900 border border-slate-700 p-5 flex-1">
                  <div className="text-sm font-black text-emerald-300 flex items-center gap-1.5 mb-3">
                    <TrendingUp className="w-4 h-4" /> 近期學習軌跡時間軸（最新 10 筆）
                  </div>
                  {save.trajectory.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4">
                      完成任一科目世界或線上對戰後，這裡會自動記錄每次答題正確率、用時與成長評語。
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {save.trajectory.slice(0, 10).map((t) => {
                        const acc =
                          t.totalAttempts > 0
                            ? Math.round((t.correctCount / t.totalAttempts) * 100)
                            : 100;
                        return (
                          <div
                            key={t.id}
                            className="rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-black text-white flex items-center gap-2">
                                <span className="text-sky-300">{SUBJECT_NAMES[t.subject]}</span>
                                <span className="text-slate-500">·</span>
                                <span className="text-slate-400 font-mono-num">
                                  {new Date(t.timestamp).toLocaleTimeString('zh-TW', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">{t.note}</div>
                            </div>
                            <div className="text-right shrink-0 font-mono-num">
                              <div className="text-xs font-black text-emerald-400">正確率 {acc}%</div>
                              <div className="text-[10px] text-slate-400">{t.durationSeconds}秒</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* 108 Curriculum Knowledge Tag Heatmap + Rapid-Guessing Detection */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 rounded-3xl bg-slate-900 border border-slate-700 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="text-sm font-black text-amber-300">
                    108 課綱知識點掌握度熱力圖
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> 精熟 ≥80%
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> 加強 50~79%
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> 需複習 &lt;50%
                    </span>
                  </div>
                </div>
                {knowledgeHeatmap.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4">
                    孩子開始冒險答題後，系統會即時依照 108 課綱知識標籤繪製綠／黃／紅熱力格子！
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {knowledgeHeatmap.map((item) => {
                      const tone =
                        item.pct >= 80
                          ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
                          : item.pct >= 50
                            ? 'bg-amber-950/80 border-amber-400/80 text-amber-200'
                            : 'bg-rose-950/80 border-rose-500/80 text-rose-200';
                      return (
                        <div key={item.tag} className={`rounded-xl border-2 p-2.5 ${tone}`}>
                          <div className="text-xs font-black truncate">{item.tag}</div>
                          <div className="mt-1 flex items-baseline justify-between font-mono-num">
                            <span className="text-base font-black">{item.pct}%</span>
                            <span className="text-[10px] opacity-80">
                              {item.correct}/{item.answered}題
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 rounded-3xl bg-slate-900 border border-slate-700 p-5 flex flex-col justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-rose-300">
                    亂猜行為偵測（作答專注度監測）
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    偵測未滿 1.2 秒即點錯選項的快速盲猜次數，協助家長與老師及早開啟「練習模式」培養閱讀審題習慣。
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-400">疑似盲猜次數</span>
                    <span
                      className={`text-2xl font-black font-mono-num ${
                        rapidGuessCount >= 4 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {rapidGuessCount} 次
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {rapidGuessCount >= 4
                      ? `盲猜比例約 ${rapidGuessRate}%，建議開啟上方「強制練習模式（不計時）」引導慢慢審題。`
                      : '目前審題節奏穩定良好，無頻繁亂猜行為！'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
