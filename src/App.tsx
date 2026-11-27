import React, { useEffect, useState } from 'react';
import { ActiveScreen, CampaignStageConfig, SubjectId, WorldRunResult } from './types/game';
import { AuthProvider } from './auth/AuthContext';
import { GameStateProvider, useGameState } from './core/GameStateContext';
import { getStageConfig } from './data/campaignMap';
import { LobbyScreen } from './screens/LobbyScreen';
import { StageSelectScreen } from './screens/StageSelectScreen';
import { ForgeScreen } from './screens/ForgeScreen';
import { SocketingScreen } from './screens/SocketingScreen';
import { ShopScreen } from './screens/ShopScreen';
import { ParentDashboard } from './screens/ParentDashboard';
import { TrialTowerScreen } from './screens/TrialTowerScreen';
import { BestiaryScreen } from './screens/BestiaryScreen';
import { InkRpgEngine } from './engines/InkRpgEngine';
import { GalaxyShooterEngine } from './engines/GalaxyShooterEngine';
import { MathTowerDefenseEngine } from './engines/MathTowerDefenseEngine';
import { ScienceCookingEngine } from './engines/ScienceCookingEngine';
import { PvPArenaEngine } from './engines/PvPArenaEngine';
import { BattleEndModal } from './components/BattleEndModal';
import { MistakeNotebookModal } from './components/MistakeNotebookModal';
import { soundEngine } from './audio/soundEngine';

function resolveInitialNav(): {
  screen: ActiveScreen;
  worldSubject: SubjectId;
  stageNum: number;
  chapterNum: 1 | 2 | 3;
} {
  if (typeof window === 'undefined') {
    return { screen: 'lobby', worldSubject: 'chinese', stageNum: 1, chapterNum: 1 };
  }
  const params = new URLSearchParams(window.location.search);
  const wParam = params.get('world');
  const worldSubject: SubjectId =
    wParam === 'english' || wParam === 'math' || wParam === 'science' ? wParam : 'chinese';
  const stageNum = Math.max(1, Math.min(10, Number(params.get('stage')) || 1));
  const rawCh = Number(params.get('chapter')) || 1;
  const chapterNum: 1 | 2 | 3 = rawCh === 2 ? 2 : rawCh === 3 ? 3 : 1;

  const screenParam = params.get('screen');
  if (screenParam === 'stage_select') return { screen: 'stage_select', worldSubject, stageNum, chapterNum };
  if (screenParam === 'forge') return { screen: 'forge', worldSubject, stageNum, chapterNum };
  if (screenParam === 'socketing') return { screen: 'socketing', worldSubject, stageNum, chapterNum };
  if (screenParam === 'shop') return { screen: 'shop', worldSubject, stageNum, chapterNum };
  if (screenParam === 'parent') return { screen: 'parent_dashboard', worldSubject, stageNum, chapterNum };
  if (screenParam === 'trial_tower') return { screen: 'trial_tower', worldSubject, stageNum, chapterNum };
  if (screenParam === 'bestiary') return { screen: 'bestiary', worldSubject, stageNum, chapterNum };

  if (params.get('autostart') === '1') {
    if (wParam === 'pvp') return { screen: 'pvp_arena', worldSubject, stageNum, chapterNum };
    const worldScreen: ActiveScreen =
      worldSubject === 'english'
        ? 'world_english'
        : worldSubject === 'math'
          ? 'world_math'
          : worldSubject === 'science'
            ? 'world_science'
            : 'world_chinese';
    return { screen: worldScreen, worldSubject, stageNum, chapterNum };
  }

  return { screen: 'lobby', worldSubject, stageNum, chapterNum };
}

function subjectToScreen(subject: SubjectId): ActiveScreen {
  if (subject === 'english') return 'world_english';
  if (subject === 'math') return 'world_math';
  if (subject === 'science') return 'world_science';
  return 'world_chinese';
}

const AppShell: React.FC = () => {
  const {
    save,
    combatStats,
    isRestReminderVisible,
    dismissRestReminder,
    recordAnswer,
    resolveWrongRecord,
    applyWorldResult,
    recordDiscoveredMonster,
  } = useGameState();

  const initial = resolveInitialNav();
  const [screen, setScreen] = useState<ActiveScreen>(initial.screen);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(initial.worldSubject);
  const [activeStage, setActiveStage] = useState<CampaignStageConfig>(() =>
    getStageConfig(initial.worldSubject, save.grade, initial.chapterNum, initial.stageNum)
  );
  const [runSeed, setRunSeed] = useState(0);
  const [pendingResult, setPendingResult] = useState<WorldRunResult | null>(null);
  const [leveledUpBanner, setLeveledUpBanner] = useState(false);
  const [mistakesOpen, setMistakesOpen] = useState(false);

  // Keep activeStage synchronized with grade changes when on menus
  useEffect(() => {
    if (screen === 'lobby' || screen === 'stage_select') {
      setActiveStage((prev) =>
        getStageConfig(selectedSubject, save.grade, prev.chapterIndex, prev.stageNumber)
      );
    }
  }, [save.grade, screen, selectedSubject]);

  useEffect(() => {
    const isPlayingWorld =
      screen === 'world_chinese' ||
      screen === 'world_english' ||
      screen === 'world_math' ||
      screen === 'world_science';
    document.body.dataset.state = pendingResult
      ? 'gameover'
      : isPlayingWorld
        ? 'playing'
        : 'menu';
  }, [screen, pendingResult]);

  const handleOpenWorldMap = (subject: SubjectId) => {
    setSelectedSubject(subject);
    setActiveStage(getStageConfig(subject, save.grade, 1, 1));
    setScreen('stage_select');
  };

  const handleStartStage = (stage: CampaignStageConfig) => {
    setSelectedSubject(stage.subject);
    setActiveStage(stage);
    setPendingResult(null);
    setRunSeed((n) => n + 1);
    setScreen(subjectToScreen(stage.subject));
  };

  const handleFinishWorld = (result: WorldRunResult) => {
    const enriched: WorldRunResult = {
      ...result,
      stageKey: result.stageKey ?? activeStage.stageKey,
      stageLabel:
        result.stageLabel ??
        `${activeStage.chapterTitle} 第${activeStage.stageNumber}關・${activeStage.title}`,
    };
    const { leveledUp, chestDropped } = applyWorldResult(enriched);
    setLeveledUpBanner(leveledUp);
    setPendingResult(chestDropped ? { ...enriched, chestRewardText: chestDropped } : enriched);
  };

  const handleReplayWorld = () => {
    soundEngine.playClick();
    setPendingResult(null);
    setRunSeed((n) => n + 1);
  };

  const handleNextStage = () => {
    soundEngine.playSlash();
    setPendingResult(null);
    const nextNum = activeStage.stageNumber < 10 ? activeStage.stageNumber + 1 : 1;
    const nextCh: 1 | 2 | 3 =
      activeStage.stageNumber < 10
        ? activeStage.chapterIndex
        : activeStage.chapterIndex < 3
          ? ((activeStage.chapterIndex + 1) as 1 | 2 | 3)
          : 3;
    const nextCfg = getStageConfig(activeStage.subject, save.grade, nextCh, nextNum);
    setActiveStage(nextCfg);
    setRunSeed((n) => n + 1);
    setScreen(subjectToScreen(nextCfg.subject));
  };

  const handleReturnStageSelect = () => {
    soundEngine.playClick();
    setPendingResult(null);
    setScreen('stage_select');
  };

  const handleReturnLobby = () => {
    soundEngine.playClick();
    setPendingResult(null);
    setScreen('lobby');
  };

  const effectivePlayMode = save.parentSettings.forcePracticeMode ? 'practice' : save.playMode;
  const wrongQuestionIds = save.wrongRecords.map((w) => w.questionId);
  const masteredQuestionIds = save.masteredQuestionIds ?? [];

  const commonWorldProps = {
    grade: save.grade,
    semester: save.semester,
    playMode: effectivePlayMode,
    guardianId: save.selectedGuardian,
    playerStats: combatStats,
    playerCount: save.playerCount ?? 1,
    stageConfig: activeStage,
    masteredQuestionIds,
    wrongQuestionIds,
    onAnswerResult: recordAnswer,
    onDiscoverMonster: recordDiscoveredMonster,
    onFinish: handleFinishWorld,
    onExit: handleReturnStageSelect,
  };

  const hasNextStage =
    Boolean(pendingResult?.victory) &&
    !(activeStage.chapterIndex === 3 && activeStage.stageNumber === 10);

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {screen === 'lobby' && (
        <LobbyScreen
          onNavigate={setScreen}
          onOpenWorldMap={handleOpenWorldMap}
          onOpenMistakes={() => setMistakesOpen(true)}
        />
      )}
      {screen === 'stage_select' && (
        <StageSelectScreen
          subject={selectedSubject}
          onStartStage={handleStartStage}
          onExit={handleReturnLobby}
        />
      )}
      {screen === 'world_chinese' && (
        <InkRpgEngine key={`ch-${activeStage.stageKey}-${runSeed}`} {...commonWorldProps} />
      )}
      {screen === 'world_english' && (
        <GalaxyShooterEngine key={`en-${activeStage.stageKey}-${runSeed}`} {...commonWorldProps} />
      )}
      {screen === 'world_math' && (
        <MathTowerDefenseEngine key={`ma-${activeStage.stageKey}-${runSeed}`} {...commonWorldProps} />
      )}
      {screen === 'world_science' && (
        <ScienceCookingEngine key={`sc-${activeStage.stageKey}-${runSeed}`} {...commonWorldProps} />
      )}
      {screen === 'pvp_arena' && <PvPArenaEngine onExit={handleReturnLobby} />}
      {screen === 'trial_tower' && <TrialTowerScreen onExit={handleReturnLobby} />}
      {screen === 'bestiary' && <BestiaryScreen onExit={handleReturnLobby} />}
      {screen === 'forge' && <ForgeScreen onExit={handleReturnLobby} />}
      {screen === 'socketing' && <SocketingScreen onExit={handleReturnLobby} />}
      {screen === 'shop' && <ShopScreen onExit={handleReturnLobby} />}
      {screen === 'parent_dashboard' && <ParentDashboard onExit={handleReturnLobby} />}

      <BattleEndModal
        result={pendingResult}
        leveledUp={leveledUpBanner}
        onRetry={handleReplayWorld}
        onNextStage={hasNextStage ? handleNextStage : undefined}
        onReturnLobby={handleReturnStageSelect}
      />

      <MistakeNotebookModal
        open={mistakesOpen}
        save={save}
        onClearMistake={resolveWrongRecord}
        onClose={() => setMistakesOpen(false)}
      />

      {/* Anti-Addiction Friendly Eye-Rest Reminder */}
      {isRestReminderVisible && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-emerald-400 p-6 text-center space-y-4 shadow-2xl">
            <div className="text-3xl font-black text-emerald-300">護眼小休息時間！</div>
            <p className="text-sm text-slate-200 leading-relaxed">
              你今天已經認真學習滿 {save.parentSettings.dailyLimitMinutes} 分鐘囉！起來喝杯水、看看遠方綠色植物 5 分鐘再繼續冒險吧！
            </p>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                dismissRestReminder();
              }}
              className="w-full min-h-[50px] rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm"
            >
              我知道了，休息一下！
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <GameStateProvider>
        <AppShell />
      </GameStateProvider>
    </AuthProvider>
  );
}
