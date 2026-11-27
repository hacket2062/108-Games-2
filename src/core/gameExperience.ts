import type { CampaignStageConfig, PlayMode, PlayerSaveData, SubjectId, WorldRunResult } from '../types/game';
import { isStageUnlocked } from '../data/campaignMap';

export const WORLD_GUIDES: Record<SubjectId, { title: string; mission: string; steps: [string, string, string]; controls: string; tip: string }> = {
  chinese: {
    title: '墨劍小隊，出發！', mission: '探索墨靈幻境，用文字的力量破解怪物的封印。',
    steps: ['在草地上移動，靠近怪物開始挑戰。', '看清題目，選答案、組合部件，或找出錯別字。', '答對累積連擊與能量，再使用必殺技。'],
    controls: '電腦：WASD／方向鍵移動，也可點地面。手機：使用畫面搖桿；答題直接點選。',
    tip: '先讀完題目再出手。錯了也能從解析找到線索。',
  },
  english: {
    title: '星際飛行員，準備起飛！', mission: '駕駛機甲戰機，解開太空中的英文訊號。',
    steps: ['先看上方的單字提示，也可以重播英文語音。', '移動機甲，瞄準正確答案或依序收集字母。', '閃開危險、累積能量，用必殺技突破敵陣。'],
    controls: '移動與技能請使用畫面上的控制區；點「重播英文語音」可以再聽一次。',
    tip: '聽不清楚就再聽一次，不必急著猜答案。',
  },
  math: {
    title: '小小建築師，守護王國！', mission: '用算式解開護盾，安排防禦塔守護基地。',
    steps: ['點選可建造的位置，選擇防禦塔。', '讀算式與選項，答對來破解敵人的護盾。', '觀察敵人路線，搭配防禦與技能守住基地。'],
    controls: '用滑鼠或手指點選塔位、答案與技能；也可點題目旁的朗讀按鈕。',
    tip: '可以先想一想答案的大小合不合理，再選答案。',
  },
  science: {
    title: '科學小廚神，開張！', mission: '在虛擬廚房觀察食材、溫度與酸鹼，完成料理挑戰。',
    steps: ['讀訂單，從冷藏櫃選出指定的食材。', '留意目標溫度，在合適的位置鎖定火候。', '完成酸鹼選擇與料理步驟，最後搖鈴出餐。'],
    controls: '點選食材、酸鹼與出餐按鈕；鎖定火候也可按空白鍵。',
    tip: '這是虛擬科學廚房。真實加熱與實驗要有大人陪同。',
  },
};

export function effectivePlayMode(save: Pick<PlayerSaveData, 'playMode' | 'parentSettings'>): PlayMode {
  return save.parentSettings.forcePracticeMode ? 'practice' : save.playMode;
}

export function canEnterStage(stage: CampaignStageConfig, save: Pick<PlayerSaveData, 'playMode' | 'parentSettings' | 'stageProgress'>): boolean {
  return effectivePlayMode(save) === 'practice' || isStageUnlocked(stage, save.stageProgress);
}

export function recordsCampaignProgress(result: Pick<WorldRunResult, 'stageKey' | 'playMode'>): boolean {
  return Boolean(result.stageKey) && result.playMode !== 'practice';
}

export function getLearningFeedback(result: Pick<WorldRunResult, 'victory' | 'correctCount' | 'totalAttempts'>) {
  const accuracy = result.totalAttempts > 0 ? Math.round(result.correctCount / result.totalAttempts * 100) : null;
  const message = accuracy === null
    ? '這次還沒有作答紀錄。先看看玩法，準備好再試一次。'
    : result.correctCount === result.totalAttempts
      ? '這一回合的題目都答對了！下次也試著說說你的理由。'
      : result.correctCount === 0
        ? '願意嘗試就是開始。先挑一道錯題，看懂解析後再出發。'
        : `這次答對 ${result.correctCount} 道題。把還不熟的地方練一練，就能帶著新線索再出發。`;
  return { accuracy, message };
}
