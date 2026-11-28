import type {BattleItemId,EquipmentSlotId,PlayerSaveData,SubjectId} from '../types/game';
import {WEAPON_CATALOG} from '../data/itemsAndGems';
export type SpecialSkill='star_guard'|'flame_focus';
export const SPECIAL_SKILLS:Record<SpecialSkill,{name:string;description:string}>={star_guard:{name:'星幕守護',description:'被動技能：最大生命 +8%。'},flame_focus:{name:'破陣專注',description:'被動技能：攻擊 +6%。'}};
export type MissionReward={kind:'skill';id:SpecialSkill}|{kind:'weapon';id:string}|{kind:'gear';id:EquipmentSlotId}|{kind:'item';id:BattleItemId;count:number};
export interface RandomMission {id:string;metric:'answered'|'correct'|'clears';subject:SubjectId|'all';target:number;baseline:number;reward:MissionReward;claimed:boolean;}
export interface RandomMissionBoard {day:string;missions:RandomMission[];}
export function missionValue(save:PlayerSaveData,mission:Pick<RandomMission,'subject'|'metric'>):number {
 return (mission.subject==='all'?Object.values(save.subjectStats):[save.subjectStats[mission.subject]]).reduce((sum,s)=>sum+s[mission.metric],0);
}
export function createRandomMissions(save:PlayerSaveData,day:string,seed:number):RandomMissionBoard {
 let state=seed>>>0;const pick=(n:number)=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state%n;};
 const subjects=['chinese','english','math','science'] as const;
 const rewards:MissionReward[]=[{kind:'skill',id:pick(2)?'star_guard':'flame_focus'},{kind:'weapon',id:WEAPON_CATALOG[1+pick(WEAPON_CATALOG.length-1)].templateId},{kind:'gear',id:(['helm','armor','gloves','boots','amulet'] as const)[pick(5)]},{kind:'item',id:(['wisdom_potion','combo_charm','shield_scroll','time_hourglass','forge_guard'] as const)[pick(5)],count:2}];
 return {day,missions:rewards.map((reward,i)=>{const metric=i===2?'clears':i===1?'correct':'answered';const subject=i===0?subjects[pick(4)]:'all';const mission:RandomMission={id:day+'-'+i,metric,subject,target:i===2?2:i===0?8:12+pick(7),baseline:0,reward,claimed:false};mission.baseline=missionValue(save,mission);return mission;})};
}
export function missionProgress(save:PlayerSaveData,mission:RandomMission) {return Math.min(mission.target,Math.max(0,missionValue(save,mission)-mission.baseline));}
export function rewardName(reward:MissionReward):string {
 if(reward.kind==='skill') return '特殊技能：'+SPECIAL_SKILLS[reward.id].name;
 if(reward.kind==='weapon') return '武器：'+(WEAPON_CATALOG.find(w=>w.templateId===reward.id)?.name??reward.id);
 if(reward.kind==='gear') return ({weapon:'武器槽',helm:'頭冠',armor:'戰甲',gloves:'護手',boots:'戰靴',amulet:'護符'}[reward.id])+'升級 1 級（最高15級；滿級改領150金幣）';
 return ({wisdom_potion:'智慧藥水',combo_charm:'連擊護符',shield_scroll:'護盾卷軸',time_hourglass:'時間沙漏',forge_guard:'鍛造保護卷'}[reward.id])+' ×'+reward.count;
}
export function claimRandomMission(save:PlayerSaveData,id:string):PlayerSaveData {
 const mission=save.randomMissions?.missions.find(m=>m.id===id);if(!mission||mission.claimed||missionProgress(save,mission)<mission.target)return save;
 let next:PlayerSaveData={...save,randomMissions:{...save.randomMissions!,missions:save.randomMissions!.missions.map(m=>m.id===id?{...m,claimed:true}:m)}};const r=mission.reward;
 if(r.kind==='skill') next={...next,unlockedSkills:Array.from(new Set([...(save.unlockedSkills??[]),r.id])),selectedSkill:save.selectedSkill??r.id,...((save.unlockedSkills??[]).includes(r.id)?{coins:save.coins+150}:{})};
 else if(r.kind==='gear') next=(save.equipment[r.id]??1)>=15?{...next,coins:save.coins+150}:{...next,equipment:{...save.equipment,[r.id]:(save.equipment[r.id]??1)+1}};
 else if(r.kind==='item')next={...next,items:{...save.items,[r.id]:save.items[r.id]+r.count}};
 else {const template=WEAPON_CATALOG.find(w=>w.templateId===r.id);if(!template)return save;next={...next,weapons:[...save.weapons,{uid:'mission-'+id,templateId:template.templateId,name:template.name,baseAttack:template.baseAttack,rarity:template.rarity,enhanceLevel:0,ascensionPath:'base',socketedGems:[null,null,null]}]};}
 return next;
}
