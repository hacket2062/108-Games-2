import {
  CampaignChapter,
  CampaignStageConfig,
  GradeLevel,
  StageProgressRecord,
  StageTier,
  SubjectId,
} from '../types/game';

interface ChapterTemplate {
  chapterIndex: 1 | 2 | 3;
  title: string;
  unitSummary: string;
  themeColor: string;
  bossName: string;
  bossPhase2Name: string;
  elitePairName: string;
  focusTags: string[];
  stageTitles: [string, string, string, string, string, string, string, string, string, string];
  chestWeaponId: string;
  chestLabel: string;
}

const CHAPTER_TEMPLATES: Record<SubjectId, ChapterTemplate[]> = {
  chinese: [
    {
      chapterIndex: 1,
      title: '第一章・墨溪古道',
      unitSummary: '部首結構、形近字辨識與詞語配對基礎',
      themeColor: '#F59E0B',
      bossName: '亂碼魔將軍',
      bossPhase2Name: '狂墨・亂碼魔將軍【二階】',
      elitePairName: '錯字波利＆形近雙煞',
      focusTags: ['部首結構', '形近字', '字音字形', '部首拼字'],
      stageTitles: [
        '墨溪初探',
        '偏旁石碑林',
        '青竹書院門',
        '形近字迷霧',
        '多音字渡口',
        '古籍拼字陣',
        '雙煞守橋戰',
        '墨林大亂鬥',
        '飛花連擊道',
        '亂碼魔將軍殿',
      ],
      chestWeaponId: 'star_lance',
      chestLabel: '星輝脈衝長槍＋升階晶石 ×8',
    },
    {
      chapterIndex: 2,
      title: '第二章・成語仙山',
      unitSummary: '成語活用、修辭技巧與標點語病診斷',
      themeColor: '#EC4899',
      bossName: '病句妖王',
      bossPhase2Name: '斷章・病句妖王【二階】',
      elitePairName: '誇飾狐＆譬喻鴉',
      focusTags: ['成語活用', '修辭手法', '病句修改', '成語典故'],
      stageTitles: [
        '山腳成語碑',
        '四字試煉階',
        '譬喻雲海亭',
        '擬人竹林陣',
        '對偶懸索橋',
        '病句除魔壇',
        '雙妖護法陣',
        '詞海狂潮戰',
        '妙筆生花道',
        '病句妖王神殿',
      ],
      chestWeaponId: 'golden_ratio_staff',
      chestLabel: '黃金比例裁決杖＋升階晶石 ×10',
    },
    {
      chapterIndex: 3,
      title: '第三章・文昌星閣',
      unitSummary: '古詩賞析、文言文關鍵字與閱讀推論',
      themeColor: '#A855F7',
      bossName: '絕墨天尊',
      bossPhase2Name: '虛空・絕墨天尊【二階】',
      elitePairName: '忘詩鬼＆斷簡魔',
      focusTags: ['古詩賞析', '文言詞義', '閱讀推論', '經典名句'],
      stageTitles: [
        '星閣迎風廊',
        '絕句平仄臺',
        '古詩意境橋',
        '文言解碼室',
        '名言典故塔',
        '修辭星象儀',
        '雙魔鎮閣戰',
        '群書激鬥廳',
        '翰林連斬陣',
        '絕墨天尊頂樓',
      ],
      chestWeaponId: 'academy_blade',
      chestLabel: '傳說文華晶核＋升階晶石 ×12',
    },
  ],
  english: [
    {
      chapterIndex: 1,
      title: 'Chapter 1・霓虹星港',
      unitSummary: '日常生活單字、聽音辨字與自然發音',
      themeColor: '#06B6D4',
      bossName: '靜默母艦 Alpha',
      bossPhase2Name: '超載・靜默母艦【二階】',
      elitePairName: '雙子干擾無人機',
      focusTags: ['生活單字', '天氣食物', '自然發音', '聽力辨字'],
      stageTitles: [
        '星港啟航',
        '霓虹單字帶',
        '氣象雷達區',
        '校園通訊塔',
        '音標隕石群',
        '雙語干擾網',
        '雙子艦守衛戰',
        '極速單字潮',
        '光束連擊軌',
        '靜默母艦決戰',
      ],
      chestWeaponId: 'star_lance',
      chestLabel: '星輝脈衝長槍＋升階晶石 ×8',
    },
    {
      chapterIndex: 2,
      title: 'Chapter 2・文法蟲洞',
      unitSummary: '疑問詞、時態文法與對話填空實戰',
      themeColor: '#6366F1',
      bossName: '錯序星艦 Omega',
      bossPhase2Name: '時空・錯序星艦【二階】',
      elitePairName: '過去式＆進行式戰機',
      focusTags: ['基礎文法', '時態變化', '生活對話', '疑問詞'],
      stageTitles: [
        '蟲洞入口',
        'Be動詞航道',
        '疑問詞星雲',
        '進行式脈衝',
        '過去式殘骸',
        '介系詞雷區',
        '時態雙王戰',
        '銀河句型暴',
        '超光速連擊',
        '錯序星艦核心',
      ],
      chestWeaponId: 'golden_ratio_staff',
      chestLabel: '黃金比例裁決杖＋升階晶石 ×10',
    },
    {
      chapterIndex: 3,
      title: 'Chapter 3・星核語宮',
      unitSummary: '長句理解、職業興趣與高頻拼字挑戰',
      themeColor: '#D946EF',
      bossName: '虛空語皇母艦',
      bossPhase2Name: '毀滅・虛空語皇【二階】',
      elitePairName: '拼字雙核心母機',
      focusTags: ['高頻拼字', '職業興趣', '節慶文化', '閱讀填空'],
      stageTitles: [
        '星宮外環',
        '拼字光橋',
        '夢想職業站',
        '世界節慶帶',
        '旅遊對話港',
        '星際拼寫爐',
        '雙核護衛陣',
        '全頻單字海',
        '星河極限擊',
        '虛空語皇王座',
      ],
      chestWeaponId: 'academy_blade',
      chestLabel: '星語傳說晶核＋升階晶石 ×12',
    },
  ],
  math: [
    {
      chapterIndex: 1,
      title: '第一章・四則草坪堡',
      unitSummary: '加減乘除運算、括號優先與估算巧算',
      themeColor: '#3B82F6',
      bossName: '零之巨像',
      bossPhase2Name: '暴走・零之巨像【二階】',
      elitePairName: '鐵桶負數＆跳跳算式雙將',
      focusTags: ['四則運算', '整數乘除', '估算心算', '括號順序'],
      stageTitles: [
        '堡前初防',
        '齒輪採集站',
        '乘法狙擊線',
        '除法破甲陣',
        '括號優先橋',
        '複合算式牆',
        '雙將強襲戰',
        '算式狂潮防線',
        '黃金超頻陣',
        '零之巨像攻城',
      ],
      chestWeaponId: 'star_lance',
      chestLabel: '星輝脈衝長槍＋升階晶石 ×8',
    },
    {
      chapterIndex: 2,
      title: '第二章・分數幾何塔',
      unitSummary: '分數加減通分、小數運算與周長面積',
      themeColor: '#0EA5E9',
      bossName: '碎裂幾何王',
      bossPhase2Name: '高維・碎裂幾何王【二階】',
      elitePairName: '分數騎士＆面積盾衛',
      focusTags: ['分數運算', '小數加減', '面積周長', '因數倍數'],
      stageTitles: [
        '分數溪谷',
        '通分石磚牆',
        '小數點吊橋',
        '長方形堡壘',
        '三角形尖塔',
        '因倍數地雷',
        '幾何雙衛戰',
        '百變圖形潮',
        '精準座標砲',
        '碎裂幾何王座',
      ],
      chestWeaponId: 'golden_ratio_staff',
      chestLabel: '黃金比例裁決杖＋升階晶石 ×10',
    },
    {
      chapterIndex: 3,
      title: '第三章・比例星儀城',
      unitSummary: '速率、比與比值、圓面積與未知數應用',
      themeColor: '#14B8A6',
      bossName: '混沌公式帝',
      bossPhase2Name: '無限・混沌公式帝【二階】',
      elitePairName: '速率飛將＆未知數魔盾',
      focusTags: ['速率問題', '比與比值', '圓面積', '未知數'],
      stageTitles: [
        '星儀大門',
        '百分率鐘樓',
        '比值天平橋',
        '速率軌道線',
        '圓周率砲台',
        '柱體容積庫',
        '雙魔公式陣',
        '全能算式海',
        '超頻軌道轟',
        '混沌公式帝殿',
      ],
      chestWeaponId: 'academy_blade',
      chestLabel: '數律傳說晶核＋升階晶石 ×12',
    },
  ],
  science: [
    {
      chapterIndex: 1,
      title: '第一章・元素暖火灶',
      unitSummary: '物質三態變化、溶解現象與植物構造',
      themeColor: '#10B981',
      bossName: '黑暗饕餮王',
      bossPhase2Name: '暴食・黑暗饕餮王【二階】',
      elitePairName: '冰火雙醬怪',
      focusTags: ['水的三態', '溶解實驗', '植物構造', '熱脹冷縮'],
      stageTitles: [
        '暖火開張',
        '三態魔法鍋',
        '根莖葉冷櫃',
        '溶解結晶湯',
        '蒸發冷凝盅',
        '熱對流快炒',
        '冰火雙怪試吃',
        '極限翻鍋祭',
        '元素連擊宴',
        '黑暗饕餮王宴',
      ],
      chestWeaponId: 'star_lance',
      chestLabel: '星輝脈衝長槍＋升階晶石 ×8',
    },
    {
      chapterIndex: 2,
      title: '第二章・酸鹼星廚館',
      unitSummary: '水溶液酸鹼變色、電路磁鐵與光影折射',
      themeColor: '#F97316',
      bossName: '失衡酸鹼魔廚',
      bossPhase2Name: '腐蝕・酸鹼魔廚【二階】',
      elitePairName: '強酸史萊姆＆磁場火龍',
      focusTags: ['水溶液酸鹼', '電路與磁鐵', '光的折射', '聲波震動'],
      stageTitles: [
        '紫菜汁調色',
        '石蕊試紙台',
        '磁極懸浮爐',
        '串並聯電鍋',
        '彩虹折射飲',
        '氧化防鏽派',
        '酸磁雙魔踢館',
        '元素彩虹狂炒',
        '精準溫控秀',
        '失衡魔廚決戰',
      ],
      chestWeaponId: 'golden_ratio_staff',
      chestLabel: '黃金比例裁決杖＋升階晶石 ×10',
    },
    {
      chapterIndex: 3,
      title: '第三章・生態宇宙宴',
      unitSummary: '天文月相四季、地質天氣、電磁鐵與生態鏈',
      themeColor: '#EF4444',
      bossName: '混沌熵滅巨饕',
      bossPhase2Name: '黑洞・熵滅巨饕【二階】',
      elitePairName: '颱風旋風怪＆板塊石饕',
      focusTags: ['天文月相', '天氣與地質', '電磁鐵', '生態食物鏈'],
      stageTitles: [
        '月相盈虧餅',
        '星象四季湯',
        '鋒面雲霧鍋',
        '電磁線圈烤',
        '槓桿省力燉',
        '岩石礦物拼',
        '風岩雙饕來襲',
        '全能實驗大賽',
        '黃金星廚連擊',
        '混沌熵滅最終宴',
      ],
      chestWeaponId: 'academy_blade',
      chestLabel: '森羅傳說晶核＋升階晶石 ×12',
    },
  ],
};

function getStageTier(stageNumber: number): StageTier {
  if (stageNumber <= 3) return 'explore';
  if (stageNumber <= 6) return 'trial';
  if (stageNumber === 7) return 'elite';
  if (stageNumber <= 9) return 'brawl';
  return 'boss';
}

export function getStageTierLabel(tier: StageTier): string {
  switch (tier) {
    case 'explore':
      return '基礎探索';
    case 'trial':
      return '進階試煉';
    case 'elite':
      return '雙精英守衛';
    case 'brawl':
      return '綜合亂鬥';
    case 'boss':
      return '章節大魔王';
  }
}

export function buildStageKey(
  subject: SubjectId,
  grade: GradeLevel,
  chapterIndex: 1 | 2 | 3,
  stageNumber: number
): string {
  return `${subject}_g${grade}_c${chapterIndex}_s${stageNumber}`;
}

export function getChaptersForWorld(subject: SubjectId, grade: GradeLevel): CampaignChapter[] {
  const templates = CHAPTER_TEMPLATES[subject];
  return templates.map((tpl) => {
    const stages: CampaignStageConfig[] = tpl.stageTitles.map((stageTitle, idx) => {
      const stageNumber = idx + 1;
      const tier = getStageTier(stageNumber);
      const chapterFactor = 1 + (tpl.chapterIndex - 1) * 0.16;
      const stageFactor = 1 + (stageNumber - 1) * 0.08;
      const enemyHpScale = Number(
        (chapterFactor * stageFactor * (tier === 'boss' ? 1.45 : tier === 'elite' ? 1.2 : 1)).toFixed(2)
      );
      const enemySpeedScale = Number(
        (1 + (tpl.chapterIndex - 1) * 0.08 + (stageNumber - 1) * 0.04).toFixed(2)
      );
      const waveCount =
        tier === 'explore' ? 3 : tier === 'trial' ? 4 : tier === 'elite' ? 4 : tier === 'brawl' ? 5 : 5;
      const comboRewardMultiplier = tier === 'brawl' || tier === 'boss' ? 2.0 : tier === 'elite' ? 1.5 : 1.0;

      const enemyName =
        tier === 'boss'
          ? tpl.bossName
          : tier === 'elite'
            ? tpl.elitePairName
            : tier === 'brawl'
              ? `${stageTitle}軍團`
              : `${stageTitle}守衛`;

      const subtitle =
        tier === 'explore'
          ? '熟悉專屬操作與基礎 108 課綱核心概念'
          : tier === 'trial'
            ? '進階題型與特殊機制登場，精準破防！'
            : tier === 'elite'
              ? `雙精英聯手登場（${tpl.elitePairName}），限時破盾挑戰！`
              : tier === 'brawl'
                ? '全章節知識點綜合亂鬥・連擊獎勵翻倍！'
                : `巨型 Boss【${tpl.bossName}】2 階段狂暴變身・三星通關奪寶箱！`;

      return {
        stageKey: buildStageKey(subject, grade, tpl.chapterIndex, stageNumber),
        subject,
        grade,
        chapterIndex: tpl.chapterIndex,
        chapterTitle: tpl.title,
        stageNumber,
        title: stageTitle,
        subtitle,
        tier,
        enemyName,
        bossPhase2Name: tier === 'boss' ? tpl.bossPhase2Name : undefined,
        enemyHpScale,
        enemySpeedScale,
        waveCount,
        comboRewardMultiplier,
        focusTags: tpl.focusTags,
        starChestReward:
          tier === 'boss'
            ? {
                coins: 260 + tpl.chapterIndex * 80,
                crystals: 6 + tpl.chapterIndex * 2,
                weaponTemplateId: tpl.chestWeaponId,
                label: tpl.chestLabel,
              }
            : undefined,
      };
    });

    return {
      id: `${subject}_g${grade}_c${tpl.chapterIndex}`,
      subject,
      grade,
      chapterIndex: tpl.chapterIndex,
      title: tpl.title,
      unitSummary: tpl.unitSummary,
      themeColor: tpl.themeColor,
      bossName: tpl.bossName,
      stages,
    };
  });
}

export function getStageConfig(
  subject: SubjectId,
  grade: GradeLevel,
  chapterIndex: 1 | 2 | 3,
  stageNumber: number
): CampaignStageConfig {
  const chapters = getChaptersForWorld(subject, grade);
  const ch = chapters[chapterIndex - 1] ?? chapters[0];
  return ch.stages[Math.max(0, Math.min(9, stageNumber - 1))] ?? ch.stages[0];
}

export function isStageUnlocked(
  stage: CampaignStageConfig,
  progress: Record<string, StageProgressRecord> | undefined
): boolean {
  // Stage 1 of Chapter 1 is always unlocked!
  if (stage.chapterIndex === 1 && stage.stageNumber === 1) return true;
  if (!progress) return false;
  if (stage.stageNumber > 1) {
    const prevKey = buildStageKey(stage.subject, stage.grade, stage.chapterIndex, stage.stageNumber - 1);
    return Boolean(progress[prevKey]?.cleared);
  }
  // Stage 1 of Chapter 2 or 3 unlocks once Stage 10 of previous chapter is cleared (or Stage 5 cleared for friendly pacing)
  const prevChapter = (stage.chapterIndex - 1) as 1 | 2;
  const prevBossKey = buildStageKey(stage.subject, stage.grade, prevChapter, 10);
  return Boolean(progress[prevBossKey]?.cleared);
}

export function getChapterStarCount(
  chapter: CampaignChapter,
  progress: Record<string, StageProgressRecord> | undefined
): number {
  if (!progress) return 0;
  return chapter.stages.reduce((sum, s) => sum + (progress[s.stageKey]?.stars ?? 0), 0);
}

export function getWorldTotalStars(
  subject: SubjectId,
  grade: GradeLevel,
  progress: Record<string, StageProgressRecord> | undefined
): { earned: number; max: number; clearedStages: number } {
  const chapters = getChaptersForWorld(subject, grade);
  let earned = 0;
  let clearedStages = 0;
  for (const ch of chapters) {
    for (const s of ch.stages) {
      const rec = progress?.[s.stageKey];
      if (rec?.cleared) clearedStages += 1;
      earned += rec?.stars ?? 0;
    }
  }
  return { earned, max: 90, clearedStages };
}
