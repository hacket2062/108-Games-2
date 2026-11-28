import type {
  ElementaryGrade,
  EnglishHangarProfile,
  GrowthTreeNodeState,
  MandarinRpgProfile,
  MathDefenseProfile,
  ScienceCookingProfile,
  SubjectId,
} from '../types/progression';

// Generated hub showcase artworks (copied into dist/ by vite.config.ts)
export const SUBJECT_HUB_ART: Record<SubjectId, { imageUrl: string; title: string; subtitle: string }> = {
  chinese: {
    imageUrl: '/src/assets/images/hub_chinese_dojo_1795879724789.jpg',
    title: '文心修煉道場',
    subtitle: '以筆為劍・字音成語閱讀修辭四脈並進',
  },
  english: {
    imageUrl: '/src/assets/images/hub_english_hangar_1795879723945.jpg',
    title: '王牌航電機庫',
    subtitle: '模組化戰機改裝・機翼、武器莢艙與航電晶片自由配裝',
  },
  math: {
    imageUrl: '/src/assets/images/hub_math_hq_1795879723662.jpg',
    title: '算力防線指揮部',
    subtitle: '工程砲台武器庫・算力齒輪強化防線藍圖',
  },
  science: {
    imageUrl: '/src/assets/images/hub_science_kitchen_1795879725370.jpg',
    title: '元素實驗廚房',
    subtitle: '科學廚具精準控溫・探索物質、生物、地球與能量奧秘',
  },
};

export interface GrowthTreeNodeCatalogItem {
  nodeId: string;
  branch: string;
  name: string;
  description: string;
  curriculumFocus: string;
  costPerLevel: number;
  maxLevel: number;
  effectSummary: (level: number) => string;
  sampleTags: string[];
}

// ==================== 1. 國語探索 RPG —《文心修煉道場》====================

export interface MandarinEquipmentItem {
  id: string;
  slot: 'weapon' | 'armor';
  name: string;
  typeLabel: string;
  description: string;
  wenqiBonus: number;
  critBonusPct: number;
  comboBonusPct: number;
  unlockCostPoints: number;
}

export const MANDARIN_WEAPONS: MandarinEquipmentItem[] = [
  {
    id: 'chi_wp_brush',
    slot: 'weapon',
    name: '青竹狼毫筆',
    typeLabel: '毛筆',
    description: '入門文心法器，落筆行雲流水，提升基礎文氣攻擊力。',
    wenqiBonus: 18,
    critBonusPct: 6,
    comboBonusPct: 8,
    unlockCostPoints: 0,
  },
  {
    id: 'chi_wp_bamboo_sword',
    slot: 'weapon',
    name: '春秋竹簡劍',
    typeLabel: '竹簡劍',
    description: '古籍竹簡凝練而成的文氣長劍，破邪斬句暴擊率大幅提升。',
    wenqiBonus: 32,
    critBonusPct: 14,
    comboBonusPct: 12,
    unlockCostPoints: 2,
  },
  {
    id: 'chi_wp_ink_fan',
    slot: 'weapon',
    name: '蘭亭墨韻扇',
    typeLabel: '墨韻扇',
    description: '揮扇灑墨成詩，連擊加成與成語破盾倍率顯著提高。',
    wenqiBonus: 44,
    critBonusPct: 18,
    comboBonusPct: 22,
    unlockCostPoints: 4,
  },
  {
    id: 'chi_wp_star_brush',
    slot: 'weapon',
    name: '文昌星輝玉筆',
    typeLabel: '傳說毛筆',
    description: '集結四脈文氣之巔峰法寶，字字珠璣皆能觸發文心會心一擊。',
    wenqiBonus: 62,
    critBonusPct: 26,
    comboBonusPct: 30,
    unlockCostPoints: 7,
  },
];

export const MANDARIN_ARMORS: MandarinEquipmentItem[] = [
  {
    id: 'chi_ar_scroll_cloak',
    slot: 'armor',
    name: '書卷青雲披風',
    typeLabel: '書卷披風',
    description: '書院制式披風，穩固心神，減少答錯時受到的反震傷害。',
    wenqiBonus: 10,
    critBonusPct: 3,
    comboBonusPct: 5,
    unlockCostPoints: 0,
  },
  {
    id: 'chi_ar_jade_pendant',
    slot: 'armor',
    name: '溫潤青玉文佩',
    typeLabel: '玉佩護符',
    description: '佩於腰間可凝神靜氣，增加思考容錯並提升連擊續航。',
    wenqiBonus: 20,
    critBonusPct: 8,
    comboBonusPct: 12,
    unlockCostPoints: 2,
  },
  {
    id: 'chi_ar_hanlin_robe',
    slot: 'armor',
    name: '翰林錦繡文袍',
    typeLabel: '高階文袍',
    description: '大儒專屬長袍，文氣充盈護體，大幅強化暴擊與答題護盾。',
    wenqiBonus: 36,
    critBonusPct: 14,
    comboBonusPct: 18,
    unlockCostPoints: 5,
  },
];

export const MANDARIN_CONSUMABLES = [
  {
    id: 'ink_inspiration',
    name: '靈感墨水',
    effect: '戰鬥中顯示 108 課綱解題提示，不中斷思考節奏',
    costCoins: 45,
  },
  {
    id: 'calm_elixir',
    name: '定心丹',
    effect: '立即恢復 35% 生命值並清除一次錯誤震盪',
    costCoins: 55,
  },
  {
    id: 'double_aura_talisman',
    name: '雙倍文氣符',
    effect: '下一次答對觸發 2 倍文氣斬擊與雙倍連擊蓄力',
    costCoins: 70,
  },
];

export const MANDARIN_SPIRITS = [
  {
    id: 'spirit_zi_ling',
    name: '字靈・小墨',
    role: '部首字形夥伴',
    passive: '辨識形近字與部首拼字時，文氣傷害 +12%',
  },
  {
    id: 'spirit_shi_ling',
    name: '詩靈・青鸞',
    role: '成語古詩夥伴',
    passive: '連擊達 3 以上時，每題額外提供 +8% 暴擊率',
  },
  {
    id: 'spirit_dian_he',
    name: '典籍・白鶴',
    role: '閱讀修辭夥伴',
    passive: '每場探索額外延長審題餘裕 +1.5 秒',
  },
];

export const MANDARIN_GROWTH_TREE: GrowthTreeNodeCatalogItem[] = [
  {
    nodeId: 'chi_phonetics_1',
    branch: '字音字形',
    name: '偏旁辨識眼',
    description: '強化部首結構與字形敏銳度，基礎文氣攻擊提升。',
    curriculumFocus: '108 課綱・國語識字與部首結構',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `文氣值 +${lv * 8}`,
    sampleTags: ['部首辨識', '部首結構', '六書部首拆解'],
  },
  {
    nodeId: 'chi_phonetics_2',
    branch: '字音字形',
    name: '多音正音訣',
    description: '精準破解形近字與多音字陷阱，提升會心暴擊率。',
    curriculumFocus: '108 課綱・形近字與多音字辨析',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `暴擊率 +${lv * 3}%`,
    sampleTags: ['形近字辨析', '多音字辨析', '錯別字'],
  },
  {
    nodeId: 'chi_idiom_1',
    branch: '詞語成語',
    name: '妙語連珠脈',
    description: '累積詞彙與成語典故，提高連擊傷害倍率。',
    curriculumFocus: '108 課綱・詞語活用與成語典故',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `連擊加成 +${lv * 5}%`,
    sampleTags: ['成語典故', '成語應用', '反義成語'],
  },
  {
    nodeId: 'chi_idiom_2',
    branch: '詞語成語',
    name: '畫龍點睛斬',
    description: '答對成語情境題時額外累積必殺能量。',
    curriculumFocus: '108 課綱・語境詞義與成語運用',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `必殺蓄力 +${lv * 4}`,
    sampleTags: ['成語情境', '歷史成語', '詞語搭配'],
  },
  {
    nodeId: 'chi_reading_1',
    branch: '閱讀理解',
    name: '文心通透境',
    description: '從容閱讀古詩與長句推論，增加生命上限與審題時間。',
    curriculumFocus: '108 課綱・句意理解與古詩賞析',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `生命上限 +${lv * 18}`,
    sampleTags: ['古詩賞析', '名言理解', '閱讀推論'],
  },
  {
    nodeId: 'chi_reading_2',
    branch: '閱讀理解',
    name: '複句破陣心法',
    description: '拆解轉折、因果與遞進複句，強化對首領破防威力。',
    curriculumFocus: '108 課綱・句型結構與複句分析',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `審題餘裕 +${(lv * 0.4).toFixed(1)} 秒`,
    sampleTags: ['句型結構', '複句分析', '文言詞義'],
  },
  {
    nodeId: 'chi_rhetoric_1',
    branch: '修辭寫作',
    name: '錦繡修辭筆',
    description: '活用譬喻、擬人、排比與映襯，放大主動技傷害。',
    curriculumFocus: '108 課綱・修辭辨析與表達技巧',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `文氣值 +${lv * 6}、連擊 +${lv * 3}%`,
    sampleTags: ['修辭辨析', '譬喻修辭', '誇飾修辭', '排比修辭'],
  },
  {
    nodeId: 'chi_rhetoric_2',
    branch: '修辭寫作',
    name: '琢句除疵訣',
    description: '精準抓出病句與標點瑕疵，獲得防禦減傷護盾。',
    curriculumFocus: '108 課綱・語病診斷與寫作修訂',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `心神護盾 +${lv * 3}%`,
    sampleTags: ['病句修改', '高階修辭', '修辭綜合'],
  },
];

export function computeMandarinTitle(profile: MandarinRpgProfile): string {
  const totalLevels = Object.values(profile.growthTree).reduce((sum, n) => sum + n.level, 0);
  if (totalLevels >= 24) return '文曲大宗師';
  if (totalLevels >= 16) return '博學大儒';
  if (totalLevels >= 9) return '墨韻劍客';
  if (totalLevels >= 4) return '妙筆學士';
  return '見習書童';
}

export function computeMandarinStats(profile: MandarinRpgProfile) {
  const weapon = MANDARIN_WEAPONS.find((w) => w.id === profile.equippedWeaponId) ?? MANDARIN_WEAPONS[0];
  const armor = MANDARIN_ARMORS.find((a) => a.id === profile.equippedArmorId) ?? MANDARIN_ARMORS[0];
  const tree = profile.growthTree;

  const wenqi =
    35 +
    profile.rpgLevel * 5 +
    weapon.wenqiBonus +
    armor.wenqiBonus +
    (tree.chi_phonetics_1?.level ?? 0) * 8 +
    (tree.chi_rhetoric_1?.level ?? 0) * 6;
  const critPct = Math.min(
    65,
    8 + weapon.critBonusPct + armor.critBonusPct + (tree.chi_phonetics_2?.level ?? 0) * 3
  );
  const comboPct =
    10 +
    weapon.comboBonusPct +
    armor.comboBonusPct +
    (tree.chi_idiom_1?.level ?? 0) * 5 +
    (tree.chi_rhetoric_1?.level ?? 0) * 3;
  const maxHpBonus = (tree.chi_reading_1?.level ?? 0) * 18;
  const thinkBonusSec = Number(((tree.chi_reading_2?.level ?? 0) * 0.4 + (profile.guardianSpiritId === 'spirit_dian_he' ? 1.5 : 0)).toFixed(1));

  return { wenqi, critPct, comboPct, maxHpBonus, thinkBonusSec };
}

// ==================== 2. 英文戰鬥機 —《王牌航電機庫》（嚴禁 RPG 樹／劍盾）====================

export interface JetBlueprint {
  id: string;
  name: string;
  codeName: string;
  liveryColor: string;
  accentColor: string;
  description: string;
  unlockCores: number;
  baseFirepower: number; // 0..100
  baseShield: number;
  baseMobility: number;
  baseLockOn: number;
}

export interface HangarModuleItem {
  id: string;
  slot: 'wing' | 'weaponPod' | 'avionicsChip';
  name: string;
  specLabel: string;
  description: string;
  unlockCores: number;
  firepowerDelta: number;
  shieldDelta: number;
  mobilityDelta: number;
  lockOnDelta: number;
}

export const ENGLISH_JETS: JetBlueprint[] = [
  {
    id: 'jet_sparrow',
    name: '星隼一型偵察機',
    codeName: 'SF-01 SPARROW',
    liveryColor: '#38BDF8',
    accentColor: '#E0F2FE',
    description: '均衡型學園訓練戰機，操控穩定，適合熟悉聽音鎖定與單字狙擊。',
    unlockCores: 0,
    baseFirepower: 52,
    baseShield: 54,
    baseMobility: 60,
    baseLockOn: 58,
  },
  {
    id: 'jet_falcon',
    name: '音速遊隼 Mk-II',
    codeName: 'VF-22 FALCON',
    liveryColor: '#0EA5E9',
    accentColor: '#FDE047',
    description: '高機動截擊機，搭載雙向量尾噴嘴，快速穿梭於單字彈幕之間。',
    unlockCores: 60,
    baseFirepower: 68,
    baseShield: 58,
    baseMobility: 82,
    baseLockOn: 72,
  },
  {
    id: 'jet_valkyrie',
    name: '星雲女武神 X-7',
    codeName: 'NX-07 VALKYRIE',
    liveryColor: '#6366F1',
    accentColor: '#67E8F9',
    description: '重裝火力型星際戰機，專為高頻拼字母艦與文法蟲洞強襲打造。',
    unlockCores: 120,
    baseFirepower: 86,
    baseShield: 76,
    baseMobility: 70,
    baseLockOn: 80,
  },
  {
    id: 'jet_aegis_star',
    name: '極光王牌號 Ω',
    codeName: 'AEGIS-Ω ACE',
    liveryColor: '#14B8A6',
    accentColor: '#FCD34D',
    description: '旗艦級次世代航電戰機，全頻語音鎖定與偏折力場皆達頂尖水準。',
    unlockCores: 200,
    baseFirepower: 92,
    baseShield: 90,
    baseMobility: 88,
    baseLockOn: 94,
  },
];

export const ENGLISH_MODULES: HangarModuleItem[] = [
  // Wing / Thruster
  {
    id: 'wing_standard',
    slot: 'wing',
    name: '標準航電穩定翼',
    specLabel: '標準機翼',
    description: '提供平穩俯仰控制與基礎巡航速度。',
    unlockCores: 0,
    firepowerDelta: 0,
    shieldDelta: 4,
    mobilityDelta: 6,
    lockOnDelta: 4,
  },
  {
    id: 'wing_supersonic',
    slot: 'wing',
    name: '超音速後掠機翼',
    specLabel: '機體改裝件',
    description: '顯著強化橫向閃避機動性，輕鬆躲避干擾彈幕。',
    unlockCores: 35,
    firepowerDelta: 4,
    shieldDelta: 2,
    mobilityDelta: 18,
    lockOnDelta: 6,
  },
  {
    id: 'wing_ion_thruster',
    slot: 'wing',
    name: '離子脈衝推進器',
    specLabel: '推進改裝件',
    description: '高速推進同時為武器莢艙提供額外輸出功率。',
    unlockCores: 75,
    firepowerDelta: 12,
    shieldDelta: 6,
    mobilityDelta: 22,
    lockOnDelta: 8,
  },
  // Weapon Pods
  {
    id: 'pod_dual_laser',
    slot: 'weaponPod',
    name: '雙聯裝雷射砲',
    specLabel: '武器莢艙',
    description: '雙管高頻雷射速射，精準擊墜目標單字無人機。',
    unlockCores: 0,
    firepowerDelta: 8,
    shieldDelta: 0,
    mobilityDelta: 2,
    lockOnDelta: 6,
  },
  {
    id: 'pod_phonics_missile',
    slot: 'weaponPod',
    name: '音標追蹤飛彈',
    specLabel: '武器莢艙',
    description: '根據自然發音聲紋自動修正彈道，對母艦護盾傷害大幅提升。',
    unlockCores: 40,
    firepowerDelta: 18,
    shieldDelta: 0,
    mobilityDelta: 0,
    lockOnDelta: 16,
  },
  {
    id: 'pod_emp_net',
    slot: 'weaponPod',
    name: '電磁脈衝網發射艙',
    specLabel: '武器莢艙',
    description: '命中時釋放電磁脈衝緩速敵群，並為機體補充護盾能量。',
    unlockCores: 80,
    firepowerDelta: 14,
    shieldDelta: 14,
    mobilityDelta: 4,
    lockOnDelta: 12,
  },
  // Avionics / Shield Chips
  {
    id: 'chip_deflector',
    slot: 'avionicsChip',
    name: '偏折能量護盾晶片',
    specLabel: '護盾晶片',
    description: '機身外層形成能量偏折場，吸收碰撞與誤擊損傷。',
    unlockCores: 0,
    firepowerDelta: 0,
    shieldDelta: 10,
    mobilityDelta: 0,
    lockOnDelta: 4,
  },
  {
    id: 'chip_voice_lock',
    slot: 'avionicsChip',
    name: '聲紋鎖定航電晶片',
    specLabel: '航電晶片',
    description: '強化英語聽力訊號解析，延長鎖定判定窗口與連擊分數。',
    unlockCores: 45,
    firepowerDelta: 6,
    shieldDelta: 8,
    mobilityDelta: 4,
    lockOnDelta: 20,
  },
  {
    id: 'chip_aegis_matrix',
    slot: 'avionicsChip',
    name: '極光偏折護盾矩陣',
    specLabel: '旗艦護盾晶片',
    description: '自動再生偏折護盾並提升全系統反應速度。',
    unlockCores: 90,
    firepowerDelta: 8,
    shieldDelta: 22,
    mobilityDelta: 8,
    lockOnDelta: 14,
  },
];

export const ENGLISH_TACTICAL_ITEMS = [
  {
    id: 'repair_drone',
    name: '緊急維修無人機',
    effect: '空中修復機體護盾 35%，維持出擊續戰力',
    costCoins: 50,
  },
  {
    id: 'chrono_field',
    name: '時間減速力場',
    effect: '將敵機與彈幕速度降低 45%，獲得充足審題與拼字時間',
    costCoins: 60,
  },
  {
    id: 'voice_beacon',
    name: '語音翻譯信標',
    effect: '重播慢速發音並鎖定目標單字首字母提示',
    costCoins: 45,
  },
];

export const ENGLISH_COPILOTS = [
  {
    id: 'ai_echo7',
    name: 'AI 領航精靈・Echo-7',
    role: '自然發音協作核心',
    passive: '聽音辨字波次自動強化語音清晰度與首字母鎖定',
  },
  {
    id: 'ai_phono',
    name: '聲紋解析 AI・Phono',
    role: '拼字校驗副駕',
    passive: '母艦拼字戰時，字母命中火力 +15%',
  },
  {
    id: 'ai_lexi',
    name: '星圖語彙 AI・Lexi',
    role: '護盾導航副駕',
    passive: '機體護盾上限 +18%，延長鎖定容錯時間',
  },
];

export function computeEnglishHangarRadar(profile: EnglishHangarProfile) {
  const jet = ENGLISH_JETS.find((j) => j.id === profile.activeJetId) ?? ENGLISH_JETS[0];
  const wing = ENGLISH_MODULES.find((m) => m.id === profile.loadout.wingModuleId) ?? ENGLISH_MODULES[0];
  const pod = ENGLISH_MODULES.find((m) => m.id === profile.loadout.weaponPodId) ?? ENGLISH_MODULES[3];
  const chip = ENGLISH_MODULES.find((m) => m.id === profile.loadout.avionicsChipId) ?? ENGLISH_MODULES[6];

  const clamp = (v: number) => Math.max(20, Math.min(100, Math.round(v)));
  return {
    firepower: clamp(jet.baseFirepower + wing.firepowerDelta + pod.firepowerDelta + chip.firepowerDelta),
    shield: clamp(jet.baseShield + wing.shieldDelta + pod.shieldDelta + chip.shieldDelta),
    mobility: clamp(jet.baseMobility + wing.mobilityDelta + pod.mobilityDelta + chip.mobilityDelta),
    lockOn: clamp(jet.baseLockOn + wing.lockOnDelta + pod.lockOnDelta + chip.lockOnDelta),
    jet,
    wing,
    pod,
    chip,
  };
}

export function computeEnglishPilotRank(profile: EnglishHangarProfile): string {
  const unlockedTotal = profile.unlockedJetIds.length + profile.unlockedModuleIds.length;
  if (unlockedTotal >= 11 || profile.flightMiles >= 6000) return '星河王牌指揮官';
  if (unlockedTotal >= 8 || profile.flightMiles >= 3000) return '星際王牌飛官';
  if (unlockedTotal >= 6 || profile.flightMiles >= 1200) return '音速中隊長';
  return '見習領航員';
}

// ==================== 3. 數學殭屍塔防 —《算力防線指揮部》====================

export interface MathTurretSpec {
  id: string;
  name: string;
  category: string;
  description: string;
  baseDamage: number;
  rangeLabel: string;
  accentColor: string;
  upgradeCostPerLv: number;
}

export const MATH_TURRET_ARSENAL: MathTurretSpec[] = [
  {
    id: 'turret_addsub',
    name: '加減速射機槍塔',
    category: '速射主力',
    description: '高射速連續火力，對前排算式殭屍進行穩定壓制。',
    baseDamage: 24,
    rangeLabel: '中距離・極速連發',
    accentColor: '#38BDF8',
    upgradeCostPerLv: 1,
  },
  {
    id: 'turret_muldiv',
    name: '乘除高能雷射塔',
    category: '穿透破甲',
    description: '聚焦高能雷射貫穿鐵桶護甲，答對乘除題時觸發超頻增傷。',
    baseDamage: 42,
    rangeLabel: '全通道・高能穿透',
    accentColor: '#F59E0B',
    upgradeCostPerLv: 1,
  },
  {
    id: 'turret_geo_frost',
    name: '幾何冰凍減速塔',
    category: '控場緩速',
    description: '發射多邊形霜凍力場，顯著降低殭屍推進速度並延長算題時間。',
    baseDamage: 20,
    rangeLabel: '廣域菱形・緩速 40%',
    accentColor: '#22D3EE',
    upgradeCostPerLv: 1,
  },
  {
    id: 'turret_frac_mortar',
    name: '分數迫擊砲',
    category: '範圍轟炸',
    description: '遠程拋物線範圍爆破，有效瓦解成群融合巨怪與高階首領。',
    baseDamage: 54,
    rangeLabel: '超遠程・範圍爆破',
    accentColor: '#A78BFA',
    upgradeCostPerLv: 2,
  },
];

export const MATH_TACTICAL_TRAPS = [
  {
    id: 'nitrogen_bomb',
    name: '液態氮冰凍炸彈',
    effect: '全場殭屍減速 55%，為陣地爭取寶貴布防時間',
    costCoins: 55,
  },
  {
    id: 'overclock_core',
    name: '算力超頻器',
    effect: '暫停怪物前進 5 秒並讓全砲台進入破甲超頻狀態',
    costCoins: 65,
  },
  {
    id: 'bastion_wrench',
    name: '防線修復扳手',
    effect: '立即修復防線耐久度 40%，加固城門核心',
    costCoins: 45,
  },
];

export const MATH_SPIRITS = [
  {
    id: 'spirit_archi',
    name: '數靈・阿基',
    role: '四則運算精靈',
    passive: '強化加減機槍塔與乘除雷射塔基礎威力 +14%',
  },
  {
    id: 'spirit_euclid',
    name: '幾何精靈・歐幾',
    role: '空間防線精靈',
    passive: '強化幾何冰凍塔緩速範圍與防線最大耐久 +20%',
  },
  {
    id: 'spirit_fibo',
    name: '比例精靈・斐波',
    role: '分數應用精靈',
    passive: '開局初始能量齒輪 +30，加速部署高階砲台',
  },
];

export const MATH_GROWTH_TREE: GrowthTreeNodeCatalogItem[] = [
  {
    nodeId: 'math_calc_1',
    branch: '數與計算',
    name: '四則速射校正',
    description: '強化整數加減乘除心算精準度，提升所有主力砲台傷害。',
    curriculumFocus: '108 課綱・整數四則運算與估算',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `砲台火力 +${lv * 9}%`,
    sampleTags: ['三位數加減', '二位數乘法', '整數除法', '四則運算順序'],
  },
  {
    nodeId: 'math_calc_2',
    branch: '數與計算',
    name: '分數小數破甲彈',
    description: '強化分數通分與小數運算，超頻破甲效率大幅提升。',
    curriculumFocus: '108 課綱・分數與小數運算',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `破甲增傷 +${lv * 10}%`,
    sampleTags: ['同分母分數', '異分母分數加減', '小數加減', '分數乘除'],
  },
  {
    nodeId: 'math_geo_1',
    branch: '幾何與空間',
    name: '多邊形冰霜陣列',
    description: '運用周長、面積與角度原理，強化防線緩速與控制。',
    curriculumFocus: '108 課綱・平面圖形周長、面積與角度',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `防線耐久 +${lv * 22}`,
    sampleTags: ['周長計算', '正方形面積', '三角形面積', '角度與三角形'],
  },
  {
    nodeId: 'math_geo_2',
    branch: '幾何與空間',
    name: '立體圓陣增幅器',
    description: '透過圓面積與柱體體積設計立體防禦場，擴大射程覆蓋。',
    curriculumFocus: '108 課綱・圓面積與立體體積',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `全砲台爆擊 +${lv * 4}%`,
    sampleTags: ['圓面積計算', '長方體體積', '空間視圖'],
  },
  {
    nodeId: 'math_measure_1',
    branch: '量與實測',
    name: '精密能量補給站',
    description: '掌握長度、時間與容積換算，增加開局初始齒輪能量。',
    curriculumFocus: '108 課綱・長度、時間與容積實測',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `初始能量 +${lv * 18}`,
    sampleTags: ['長度單位', '時間換算', '重量與容積'],
  },
  {
    nodeId: 'math_measure_2',
    branch: '量與實測',
    name: '計時穩壓齒輪',
    description: '延長每次答題後的砲台超頻持續時間。',
    curriculumFocus: '108 課綱・複合單位與實測估算',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `審題寬限 +${(lv * 0.5).toFixed(1)} 秒`,
    sampleTags: ['速率與距離', '時間實測', '估算應用'],
  },
  {
    nodeId: 'math_algebra_1',
    branch: '代數與應用邏輯',
    name: '因倍數演算法核心',
    description: '活用因數、倍數與規律推理，提升連擊能量回復。',
    curriculumFocus: '108 課綱・因數、倍數與數量規律',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `必殺軌道雷射蓄力 +${lv * 5}`,
    sampleTags: ['因數與最大公因數', '倍數與最小公倍數', '四則括號運算'],
  },
  {
    nodeId: 'math_algebra_2',
    branch: '代數與應用邏輯',
    name: '比例未知數指揮矩陣',
    description: '運用比與比值、百分率與未知數，全面強化防線作戰效率。',
    curriculumFocus: '108 課綱・比與比值、百分率與未知數',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `全防線火力 +${lv * 7}%`,
    sampleTags: ['比與比值', '百分率與折扣', '未知數應用'],
  },
];

export function computeMathCommanderRank(profile: MathDefenseProfile): string {
  const treeSum = Object.values(profile.growthTree).reduce((s, n) => s + n.level, 0);
  const turretSum = Object.values(profile.turretUpgrades).reduce((s, lv) => s + lv, 0);
  const total = treeSum + turretSum;
  if (total >= 26) return '傳奇算力總司令';
  if (total >= 18) return '首席數理總工程師';
  if (total >= 10) return '防線結構技師';
  return '初階算術工程師';
}

// ==================== 4. 自然料理 —《元素實驗廚房》====================

export interface ScienceCookwareItem {
  id: string;
  name: string;
  toolType: string;
  description: string;
  scoreBonusPct: number;
  tempPrecisionBonus: number;
  unlockCostCrystals: number;
}

export const SCIENCE_COOKWARE: ScienceCookwareItem[] = [
  {
    id: 'cook_induction',
    name: '精準控溫電磁爐',
    toolType: '控溫爐具',
    description: '穩定控制急凍、中火與沸騰三溫區，大幅減少焦鍋失誤。',
    scoreBonusPct: 12,
    tempPrecisionBonus: 15,
    unlockCostCrystals: 0,
  },
  {
    id: 'cook_beaker_set',
    name: '刻度量杯實驗組',
    toolType: '定量器皿',
    description: '以精準刻度調配酸鹼與溶解比例，讓料理評分更上一層樓。',
    scoreBonusPct: 18,
    tempPrecisionBonus: 18,
    unlockCostCrystals: 0,
  },
  {
    id: 'cook_micro_spice',
    name: '顯微調味分析罐',
    toolType: '觀測廚具',
    description: '透過顯微鏡頭辨識植物構造與天然色素，選材更精準。',
    scoreBonusPct: 28,
    tempPrecisionBonus: 24,
    unlockCostCrystals: 3,
  },
  {
    id: 'cook_centrifuge',
    name: '星核離心攪拌器',
    toolType: '高階實驗廚具',
    description: '運用離心力與電磁場同步熟成，解鎖高階元素料理反應特效。',
    scoreBonusPct: 40,
    tempPrecisionBonus: 32,
    unlockCostCrystals: 6,
  },
];

export const SCIENCE_SEASONINGS = [
  {
    id: 'heat_stabilizer',
    name: '火候穩定劑',
    effect: '鎖定目標溫區不飄移，輕鬆完成高難度控溫訂單',
    costCoins: 45,
  },
  {
    id: 'golden_sauce',
    name: '黃金秘製醬料',
    effect: '提供一次選材容錯保護，並使出餐評分額外 +25%',
    costCoins: 60,
  },
  {
    id: 'lab_hourglass',
    name: '時間沙漏',
    effect: '延長所有進行中訂單耐心時間 +10 秒',
    costCoins: 50,
  },
];

export const SCIENCE_FOOD_SPIRITS = [
  {
    id: 'spirit_flame_chef',
    name: '火候精靈・炎寶',
    role: '熱能控溫食靈',
    passive: '沸騰與中火實驗料理出餐評分 +15%',
  },
  {
    id: 'spirit_droplet',
    name: '水滴精靈・露露',
    role: '三態酸鹼食靈',
    passive: '酸鹼指示劑與溶解料理容錯提升，生命上限 +18%',
  },
  {
    id: 'spirit_crystal_leaf',
    name: '元素結晶靈・青葉',
    role: '生態能量食靈',
    passive: '每道完成料理額外獲得 +15% 實驗分數與連擊加成',
  },
];

export const SCIENCE_GROWTH_TREE: GrowthTreeNodeCatalogItem[] = [
  {
    nodeId: 'sci_matter_1',
    branch: '物質與變化',
    name: '三態溫控秘訣',
    description: '掌握熔化、凝固、蒸發與凝結原理，強化控溫料理評分。',
    curriculumFocus: '108 課綱・水的三態與物質性質',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `料理火力 +${lv * 8}%`,
    sampleTags: ['水的三態變化', '水的三態', '溶解實驗', '熱脹冷縮'],
  },
  {
    nodeId: 'sci_matter_2',
    branch: '物質與變化',
    name: '酸鹼彩虹試劑學',
    description: '精通石蕊與紫高麗菜汁酸鹼變色，提升完美出餐暴擊。',
    curriculumFocus: '108 課綱・水溶液酸鹼與化學變化',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `完美評價加成 +${lv * 5}%`,
    sampleTags: ['水溶液酸鹼', '氧化防鏽', '溶解與結晶'],
  },
  {
    nodeId: 'sci_bio_1',
    branch: '生物與生態',
    name: '本草植物圖譜',
    description: '認識根莖葉花果與光合作用，增加廚房護盾與體力。',
    curriculumFocus: '108 課綱・植物構造與光合作用',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `廚房耐久 +${lv * 20}`,
    sampleTags: ['植物光合作用', '植物構造', '動物構造'],
  },
  {
    nodeId: 'sci_bio_2',
    branch: '生物與生態',
    name: '生態平衡食譜',
    description: '理解食物鏈與生態保育，連擊出餐獲得更高分數。',
    curriculumFocus: '108 課綱・生態系統與食物鏈',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `連擊加分 +${lv * 6}%`,
    sampleTags: ['生態食物鏈', '生物棲地', '微生物發酵'],
  },
  {
    nodeId: 'sci_earth_1',
    branch: '地球與環境',
    name: '星象季節菜單',
    description: '掌握月相盈虧、四季日照與天氣變化，延長訂單寬限。',
    curriculumFocus: '108 課綱・天文月相、四季與天氣',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `訂單寬限 +${(lv * 0.6).toFixed(1)} 秒`,
    sampleTags: ['天文月相', '天氣與地質', '鋒面與雲霧'],
  },
  {
    nodeId: 'sci_earth_2',
    branch: '地球與環境',
    name: '地質礦物爐石',
    description: '認識岩石礦物與永續環境，減少錯誤食材扣血。',
    curriculumFocus: '108 課綱・岩石礦物與環境永續',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `失誤減傷 +${lv * 4}%`,
    sampleTags: ['岩石礦物', '環境保育', '水資源循環'],
  },
  {
    nodeId: 'sci_energy_1',
    branch: '能量與力',
    name: '電路磁力爐芯',
    description: '活用導體、串並聯與電磁鐵原理，強化出餐爆發力。',
    curriculumFocus: '108 課綱・電路導體與電磁鐵',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `料理火力 +${lv * 9}%`,
    sampleTags: ['導體與絕緣體', '電磁鐵磁力', '電路與磁鐵'],
  },
  {
    nodeId: 'sci_energy_2',
    branch: '能量與力',
    name: '光影槓桿省力術',
    description: '運用光的折射與簡單機械槓桿原理，加速必殺料理蓄力。',
    curriculumFocus: '108 課綱・光影折射、聲波與槓桿',
    costPerLevel: 1,
    maxLevel: 5,
    effectSummary: (lv) => `必殺蓄力 +${lv * 5}`,
    sampleTags: ['光的折射', '聲波震動', '簡單機械槓桿'],
  },
];

export function computeScienceChefTitle(profile: ScienceCookingProfile): string {
  const totalLevels = Object.values(profile.growthTree).reduce((sum, n) => sum + n.level, 0);
  if (totalLevels >= 22) return '米其林元素科學宗師';
  if (totalLevels >= 14) return '星級元素實驗主廚';
  if (totalLevels >= 7) return '精密調味研究員';
  return '見習實驗小廚';
}

export function isScienceUnlockedForGrade(grade: ElementaryGrade): boolean {
  return grade >= 3;
}

export function getTreeBranchProgress(
  catalog: GrowthTreeNodeCatalogItem[],
  treeState: Record<string, GrowthTreeNodeState>
): Array<{
  branch: string;
  currentLevels: number;
  maxLevels: number;
  curriculumFocus: string;
  contributingTags: string[];
  latestGrade?: ElementaryGrade;
  latestSemester?: 1 | 2;
}> {
  const map = new Map<
    string,
    {
      branch: string;
      currentLevels: number;
      maxLevels: number;
      curriculumFocus: string;
      contributingTags: Set<string>;
      latestGrade?: ElementaryGrade;
      latestSemester?: 1 | 2;
    }
  >();

  for (const item of catalog) {
    const state = treeState[item.nodeId];
    const existing = map.get(item.branch) ?? {
      branch: item.branch,
      currentLevels: 0,
      maxLevels: 0,
      curriculumFocus: item.curriculumFocus,
      contributingTags: new Set<string>(),
    };
    existing.currentLevels += state?.level ?? 0;
    existing.maxLevels += item.maxLevel;
    for (const tag of state?.contributingTags ?? []) {
      existing.contributingTags.add(tag);
    }
    if (state?.unlockedInGrade) {
      existing.latestGrade = state.unlockedInGrade;
      existing.latestSemester = state.unlockedInSemester;
    }
    map.set(item.branch, existing);
  }

  return Array.from(map.values()).map((entry) => ({
    branch: entry.branch,
    currentLevels: entry.currentLevels,
    maxLevels: entry.maxLevels,
    curriculumFocus: entry.curriculumFocus,
    contributingTags: Array.from(entry.contributingTags),
    latestGrade: entry.latestGrade,
    latestSemester: entry.latestSemester,
  }));
}
