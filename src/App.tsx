import React, { useEffect, useState } from 'react';
import { ActiveScreen, WorldRunResult } from './types/game';
import { AuthProvider } from './auth/AuthContext';
import { GameStateProvider, useGameState } from './core/GameStateContext';
import { LobbyScreen } from './screens/LobbyScreen';
import { ForgeScreen } from './screens/ForgeScreen';
import { SocketingScreen } from './screens/SocketingScreen';
import { ShopScreen } from './screens/ShopScreen';
import { ParentDashboard } from './screens/ParentDashboard';
import { InkRpgEngine } from './engines/InkRpgEngine';
import { GalaxyShooterEngine } from './engines/GalaxyShooterEngine';
import { MathTowerDefenseEngine } from './engines/MathTowerDefenseEngine';
import { ScienceCookingEngine } from './engines/ScienceCookingEngine';
import { PvPArenaEngine } from './engines/PvPArenaEngine';
import { BattleEndModal } from './components/BattleEndModal';
import { MistakeNotebookModal } from './components/MistakeNotebookModal';
import { soundEngine } from './audio/soundEngine';

function resolveInitialScreen(): ActiveScreen {
  if (typeof window === 'undefined') return 'lobby';
  const params = new URLSearchParams(window.location.search);
  const screenParam = params.get('screen');
  if (screenParam === 'forge') return 'forge';
  if (screenParam === 'socketing') return 'socketing';
  if (screenParam === 'shop') return 'shop';
  if (screenParam === 'parent') return 'parent_dashboard';

  if (params.get('autostart') === '1') {
    const w = params.get('world');
    if (w === 'chinese') return 'world_chinese';
    if (w === 'english') return 'world_english';
    if (w === 'math') return 'world_math';
    if (w === 'science') return 'world_science';
    if (w === 'pvp') return 'pvp_arena';
    return 'world_chinese';
  }
  return 'lobby';
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
  } = useGameState();

  const [screen, setScreen] = useState<ActiveScreen>(resolveInitialScreen);
  const [runSeed, setRunSeed] = useState(0);
  const [pendingResult, setPendingResult] = useState<WorldRunResult | null>(null);
  const [leveledUpBanner, setLeveledUpBanner] = useState(false);
  const [mistakesOpen, setMistakesOpen] = useState(false);

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

  const handleFinishWorld = (result: WorldRunResult) => {
    const { leveledUp } = applyWorldResult(result);
    setLeveledUpBanner(leveledUp);
    setPendingResult(result);
  };

  const handleReplayWorld = () => {
    soundEngine.playClick();
    setPendingResult(null);
    setRunSeed((n) => n + 1);
  };

  const handleReturnLobby = () => {
    soundEngine.playClick();
    setPendingResult(null);
    setScreen('lobby');
  };

  const effectivePlayMode = save.parentSettings.forcePracticeMode ? 'practice' : save.playMode;

  const commonWorldProps = {
    grade: save.grade,
    semester: save.semester,
    playMode: effectivePlayMode,
    guardianId: save.selectedGuardian,
    playerStats: combatStats,
    onAnswerResult: recordAnswer,
    onFinish: handleFinishWorld,
    onExit: handleReturnLobby,
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {screen === 'lobby' && (
        <LobbyScreen onNavigate={setScreen} onOpenMistakes={() => setMistakesOpen(true)} />
      )}
      {screen === 'world_chinese' && <InkRpgEngine key={`ch-${runSeed}`} {...commonWorldProps} />}
      {screen === 'world_english' && (
        <GalaxyShooterEngine key={`en-${runSeed}`} {...commonWorldProps} />
      )}
      {screen === 'world_math' && (
        <MathTowerDefenseEngine key={`ma-${runSeed}`} {...commonWorldProps} />
      )}
      {screen === 'world_science' && (
        <ScienceCookingEngine key={`sc-${runSeed}`} {...commonWorldProps} />
      )}
      {screen === 'pvp_arena' && <PvPArenaEngine onExit={handleReturnLobby} />}
      {screen === 'forge' && <ForgeScreen onExit={handleReturnLobby} />}
      {screen === 'socketing' && <SocketingScreen onExit={handleReturnLobby} />}
      {screen === 'shop' && <ShopScreen onExit={handleReturnLobby} />}
      {screen === 'parent_dashboard' && <ParentDashboard onExit={handleReturnLobby} />}

      <BattleEndModal
        result={pendingResult}
        leveledUp={leveledUpBanner}
        onRetry={handleReplayWorld}
        onReturnLobby={handleReturnLobby}
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
