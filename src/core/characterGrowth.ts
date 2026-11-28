import type { AscensionPath, GuardianId, PlayerSaveData } from '../types/game';

export type CharacterJob = 'adventurer' | 'sentinel' | 'arcanist' | 'ranger';
export const JOBS: Record<CharacterJob, {name:string;path:AscensionPath;description:string}> = {
  adventurer:{name:'學園冒險者',path:'base',description:'從四科冒險累積經驗，Lv.5 開放首次轉職。'},
  sentinel:{name:'聖翼守衛',path:'hero',description:'最大生命 +15%，以重甲守護防線。'},
  arcanist:{name:'星環術士',path:'mythic',description:'攻擊 +10%，以星環法術突破敵陣。'},
  ranger:{name:'緋焰遊俠',path:'inferno',description:'速度加成 +10 個百分點、暴擊 +3 個百分點。'},
};
export function growthRank(level:number) {return level>=30 ? {name:'大師',step:3,next:0} : level>=15 ? {name:'精英',step:2,next:30} : level>=5 ? {name:'正式',step:1,next:15} : {name:'見習',step:0,next:5};}
export function availableGrowthTitles(save:PlayerSaveData):string[] {
  return Array.from(new Set([...save.unlockedTitles, ...(save.level>=5?['title_growth_5']:[]),...(save.level>=15?['title_growth_15']:[]),...(save.level>=30?['title_growth_30']:[])]));
}
export function changeCharacterJob(save:PlayerSaveData, job:CharacterJob):PlayerSaveData {
  if (!Object.hasOwn(JOBS,job) || (job!=='adventurer' && save.level<5)) return save;
  return {...save,characterJob:job,unlockedTitles:availableGrowthTitles(save)};
}
export function bondRequired(level:number) {return 20 + Math.min(100, Math.max(1,level))*5;}
/** One credited interaction of each kind per guardian/day; extra affection remains free. */
export function creditBond(save:PlayerSaveData,id:GuardianId,kind:'pet'|'feed',day:string):PlayerSaveData {
  const old=save.guardianCare?.[id];
  const care=old?.day===day ? old : {day,points:old?.points??0,petted:false,fed:false};
  if (kind==='pet'?care.petted:care.fed) return save;
  if (kind==='feed' && save.coins<90) return save;
  const points=care.points+(kind==='pet'?2:8);
  const required=bondRequired(save.guardianBonds[id]);
  const levelUp=points>=required;
  return {...save,coins:save.coins-(kind==='feed'?90:0),guardianBonds:{...save.guardianBonds,[id]:save.guardianBonds[id]+(levelUp?1:0)},guardianCare:{...save.guardianCare,[id]:{day,points:points-(levelUp?required:0),petted:care.petted||kind==='pet',fed:care.fed||kind==='feed'}}};
}
