import type { SubjectId } from '../types/game';

/** Authored examples for learning the controls, not assessment questions. */
export const TUTORIAL_DEMOS: Record<SubjectId, {
  action: string; positions: [string, string, string]; target: number; actor: string;
  prompt: string; options: [string, string, string]; answer: string; explanation: string; success: string;
}> = {
  chinese: {
    action: '點右邊，靠近小怪物', positions: ['左邊草地', '中間草地', '右邊小怪物'], target: 2, actor: '🧙',
    prompt: '「休息」的「休」是什麼意思？', options: ['停下來歇一歇', '一直奔跑', '大聲唱歌'], answer: '停下來歇一歇',
    explanation: '「休」有停下來歇息的意思。再找找看。', success: '墨劍發光！封印解開了。',
  },
  english: {
    action: '移動戰機，對準左邊目標', positions: ['左邊星港', '中間星港', '右邊星港'], target: 0, actor: '🚀',
    prompt: '哪個英文單字是「貓」？', options: ['dog', 'cat', 'sun'], answer: 'cat',
    explanation: 'cat 是貓，dog 是狗，sun 是太陽。再試一次。', success: '光束命中！單字訊號解開了。',
  },
  math: {
    action: '點發光空地，放一座塔', positions: ['左邊空地', '中間空地', '發光空地'], target: 2, actor: '🏰',
    prompt: '護盾上寫著 2 ＋ 3，答案是？', options: ['4', '5', '6'], answer: '5',
    explanation: '從 2 開始再數 3 個：3、4、5。', success: '防禦塔啟動！算式護盾破解了。',
  },
  science: {
    action: '點蘋果，放入示範料理盤', positions: ['蘋果', '石頭', '木塊'], target: 0, actor: '🍎',
    prompt: '冰塊加熱後，會有什麼變化？', options: ['變成石頭', '融化成水', '長出葉子'], answer: '融化成水',
    explanation: '冰受熱會融化，從固態變成液態的水。', success: '料理完成！你看懂狀態變化了。',
  },
};
