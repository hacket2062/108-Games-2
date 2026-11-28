import React, {useState} from 'react';
import {useGameState} from '../core/GameStateContext';
import {availableGrowthTitles,bondRequired,growthRank,JOBS,type CharacterJob} from '../core/characterGrowth';
import {GAME_TITLES} from '../data/spiritsAndTitles';
import {HeroPortrait} from './EquipmentArt';

export function CharacterGrowthPanel() {
  const {save,equippedWeapon,changeJob,selectTitle}=useGameState();
  const [open,setOpen]=useState(false);
  const job=save.characterJob??'adventurer', rank=growthRank(save.level);
  const care=save.guardianCare?.[save.selectedGuardian];
  const available=availableGrowthTitles(save);
  return <section className="character-growth" aria-label="角色成長與轉職">
    <div className="character-growth-summary"><div><strong>Lv.{save.level} · {rank.name}{JOBS[job].name}</strong><p>{rank.next?`下次進階 Lv.${rank.next}`:'已達大師階位'} · 羈絆經驗 {care?.points??0}/{bondRequired(save.guardianBonds[save.selectedGuardian])}</p></div><button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'收起成長面板':'進階・轉職・稱號'}</button></div>
    {open && <><p>Lv.5 首次轉職 · Lv.15 精英 · Lv.30 大師。轉職免費，可隨時改選；武器與強化完整保留。</p><div className="character-job-grid">{(Object.keys(JOBS) as CharacterJob[]).map(id=><article key={id} data-character-job={id}><HeroPortrait appearance={{weapon:equippedWeapon,equipment:save.equipment}} previewPath={JOBS[id].path}/><h3>{JOBS[id].name}</h3><p>{JOBS[id].description}</p><button type="button" disabled={id===job || id!=='adventurer' && save.level<5} onClick={()=>changeJob(id)}>{id===job?'目前職業':save.level<5&&id!=='adventurer'?'Lv.5 解鎖':'轉職為'+JOBS[id].name}</button></article>)}</div><h3>我的稱號</h3><div className="character-titles">{GAME_TITLES.map(title=><button key={title.id} type="button" disabled={!available.includes(title.id)} aria-pressed={save.selectedTitle===title.id} onClick={()=>selectTitle(title.id)}><strong>{title.name}{save.selectedTitle===title.id?' ✓':''}</strong><small>{available.includes(title.id)?'已取得・點選佩戴':title.unlockHint}</small></button>)}</div><p>照顧夥伴：每位每天首次摸摸 +2 經驗、餵食 +8 經驗。升級需求隨羈絆提高；重複摸摸仍可互動。</p></>}
  </section>;
}
