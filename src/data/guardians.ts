import type { GuardianId } from '../types/game';

export interface GuardianConfig {
  id: GuardianId;
  name: string;
  title: string;
  element: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  passiveName: string;
  passiveDesc: string;
  activeName: string;
  activeDesc: string;
  activeEffectKey: 'ink_heal_boost' | 'full_ultimate' | 'freeze_timer' | 'shield_surge';
  petLines: string[];
  battleCheer: string;
}

export const GUARDIANS: Record<GuardianId, GuardianConfig> = {
  qilin: {
    id: 'qilin',
    name: '墨麒麟',
    title: '文華瑞獸',
    element: '水墨金光',
    primaryColor: '#F59E0B',
    secondaryColor: '#1E293B',
    accentColor: '#FEF3C7',
    passiveName: '文心聚氣',
    passiveDesc: '基礎攻擊力 +12%，答對時必殺充能額外 +8%',
    activeName: '瑞墨護心',
    activeDesc: '立即回復 35% 生命/城門耐久，並賦予下一次攻擊雙倍傷害',
    activeEffectKey: 'ink_heal_boost',
    petLines: [
      '筆落驚風雨，今天也要帥氣通關喔！',
      '摸摸頭～墨香滿滿，錯字通通退散！',
      '連擊越高，我身上的金紋就越耀眼呢！',
    ],
    battleCheer: '墨麒麟降下金墨祝福，傷害大幅提升！',
  },
  stardragon: {
    id: 'stardragon',
    name: '星核龍',
    title: '超新星幼龍',
    element: '星海電漿',
    primaryColor: '#06B6D4',
    secondaryColor: '#312E81',
    accentColor: '#EC4899',
    passiveName: '星火超載',
    passiveDesc: 'PERFECT 速度倍率額外 +0.15x，暴擊更具爆發力',
    activeName: '星核滿載',
    activeDesc: '立刻將必殺技量表直接充滿至 100%，並震懾敵軍！',
    activeEffectKey: 'full_ultimate',
    petLines: [
      '吼嗚！能量核心已經預熱完畢，出發吧！',
      '聽仔細英文發音，我們一起轟穿星際防線！',
      '嘿嘿，你的指尖暖呼呼的，羈絆值上升啦！',
    ],
    battleCheer: '星核龍釋放超新星能量，必殺技瞬間滿載！',
  },
  griffin: {
    id: 'griffin',
    name: '數律獅鷲',
    title: '黃金比例翼王',
    element: '幾何風暴',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E3A8A',
    accentColor: '#FBBF24',
    passiveName: '精密齒輪',
    passiveDesc: '數學塔防開局齒輪 +60，所有世界答題寬限時間 +2 秒',
    activeName: '時空定格',
    activeDesc: '凍結戰場倒數與敵人行動 8 秒，從容解題零壓力！',
    activeEffectKey: 'freeze_timer',
    petLines: [
      '黃金比例完美無瑕，算式難不倒我們！',
      '展開雙翼！讓我替你把時間暫停下來思考吧！',
      '每解開一題，我的羽毛就閃耀著數理光輝！',
    ],
    battleCheer: '數律獅鷲展開時空領域，敵軍與計時全面停滯！',
  },
  deer: {
    id: 'deer',
    name: '森羅鹿靈',
    title: '元素自然使者',
    element: '翡翠生機',
    primaryColor: '#10B981',
    secondaryColor: '#064E3B',
    accentColor: '#A7F3D0',
    passiveName: '自然調和',
    passiveDesc: '最大生命/護盾 +20%，自然料理火候 PERFECT 區間變寬',
    activeName: '森羅結界',
    activeDesc: '展開翡翠無敵護盾 + 立刻補滿料理/戰場資源並清掉干擾彈幕！',
    activeEffectKey: 'shield_surge',
    petLines: [
      '風吹過葉梢，大自然的祕密都藏在生活裡喔！',
      '角上的新芽開花了，謝謝你這麼細心照顧我！',
      '別怕答錯，每一次實驗都是最棒的發現！',
    ],
    battleCheer: '森羅鹿靈喚起翡翠結界，全隊獲得堅固守護！',
  },
};

export const GUARDIAN_LIST: GuardianConfig[] = [
  GUARDIANS.qilin,
  GUARDIANS.stardragon,
  GUARDIANS.griffin,
  GUARDIANS.deer,
];
