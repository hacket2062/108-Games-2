import React,{useState} from 'react';
import {useGameState} from '../core/GameStateContext';
import {missionProgress,rewardName,SPECIAL_SKILLS} from '../core/randomMissions';
export function RandomMissionPanel(){
 const {save,claimMission,equipSpecialSkill}=useGameState(),[open,setOpen]=useState(false);
 const missions=save.randomMissions?.missions??[];
 return <section className="character-growth" aria-label="隨機任務板"><div className="character-growth-summary"><div><strong>冒險委託 · 隨機任務板</strong><p>每日換新委託；當日固定，重新整理不會換獎勵。錯過不扣獎。</p></div><button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'收起任務':'查看隨機任務'}</button></div>
 {open&&<><div className="mission-grid">{missions.map(m=>{const progress=missionProgress(save,m);return <article key={m.id} data-mission-id={m.id}><h3>{m.subject==='all'?'四科':{chinese:'國語',english:'英文',math:'數學',science:'自然'}[m.subject]} · {m.metric==='answered'?'完成作答':m.metric==='correct'?'答對題目':'完成通關'} {m.target} {m.metric==='clears'?'關':'題'}</h3><p>{rewardName(m.reward)}</p><progress value={progress} max={m.target}/><p>{progress}/{m.target}</p><button type="button" disabled={m.claimed||progress<m.target} onClick={()=>claimMission(m.id)}>{m.claimed?'已領取':progress>=m.target?'領取獎勵':'冒險進行中'}</button></article>})}</div><h3>特殊技能 · 同時裝備一種</h3><div className="character-titles">{Object.entries(SPECIAL_SKILLS).map(([id,skill])=><button type="button" key={id} disabled={!save.unlockedSkills?.includes(id as keyof typeof SPECIAL_SKILLS)} aria-pressed={save.selectedSkill===id} onClick={()=>equipSpecialSkill(id as keyof typeof SPECIAL_SKILLS)}><strong>{skill.name}{save.selectedSkill===id?' ✓':''}</strong><small>{skill.description}</small><small>{save.unlockedSkills?.includes(id as keyof typeof SPECIAL_SKILLS)?'已解鎖':'完成技能委託取得；重複技能改領150金幣'}</small></button>)}</div></>}
 </section>;
}
