import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialPlayerSave,hydrateSave} from './playerSave';
import {claimRandomMission,createRandomMissions,missionProgress} from './randomMissions';
import {completeSaveData} from './saveIntegrity';
import {computeSaveCombatStats} from './combatMath';
test('mission generation creates four reward kinds, persists rolls and starts after existing progress',()=>{
 const save=createInitialPlayerSave();save.subjectStats.math.answered=100;save.subjectStats.math.correct=90;
 const board=createRandomMissions(save,'2026-11-27',123);save.randomMissions=board;
 assert.deepEqual(board,createRandomMissions(save,'2026-11-27',123));assert.deepEqual(board.missions.map(m=>m.reward.kind),['skill','weapon','gear','item']);
 assert.ok(board.missions.every(m=>missionProgress(save,m)===0));
 assert.deepEqual(hydrateSave(completeSaveData(save)).randomMissions,board);
 assert.notDeepEqual(board,createRandomMissions(save,'2026-11-27',456));
});
test('all mission rewards claim exactly once and special skills affect real stats',()=>{
 let save=createInitialPlayerSave();save.randomMissions=createRandomMissions(save,'2026-11-27',123);
 assert.equal(claimRandomMission(save,save.randomMissions.missions[0].id),save);
 for(const stats of Object.values(save.subjectStats)){stats.answered=30;stats.correct=25;stats.clears=3;}
 const weapons=save.weapons.length,gearTotal=Object.values(save.equipment).reduce((a,b)=>a+b,0),itemTotal=Object.values(save.items).reduce((a,b)=>a+b,0),before=computeSaveCombatStats(save);
 for(const m of save.randomMissions.missions){save=claimRandomMission(save,m.id);assert.equal(claimRandomMission(save,m.id),save);}
 assert.equal(save.weapons.length,weapons+1);assert.equal(Object.values(save.equipment).reduce((a,b)=>a+b,0),gearTotal+1);assert.equal(Object.values(save.items).reduce((a,b)=>a+b,0),itemTotal+2);
 assert.equal(save.unlockedSkills?.length,1);const after=computeSaveCombatStats(save);assert.ok(after.baseAttack>before.baseAttack||after.maxHp>before.maxHp);
 assert.deepEqual(completeSaveData(save).randomMissions,save.randomMissions);
});
