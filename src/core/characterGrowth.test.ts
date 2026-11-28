import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialPlayerSave,hydrateSave} from './playerSave';
import {availableGrowthTitles,bondRequired,changeCharacterJob,creditBond,growthRank} from './characterGrowth';
import {computeSaveCombatStats,xpRequiredForLevel,applyXpGain} from './combatMath';
import {defenseWavePressure,defenseBossProfile,zombieForWave} from './mathDefense';
import {completeSaveData} from './saveIntegrity';
test('job gates, ranks and titles depend on real level; changing jobs preserves inventory',()=>{
 const save=createInitialPlayerSave(); assert.equal(changeCharacterJob(save,'sentinel'),save);
 save.level=5; const next=changeCharacterJob(save,'sentinel'); assert.equal(next.characterJob,'sentinel'); assert.deepEqual(next.weapons,save.weapons);
 assert.ok(computeSaveCombatStats(next).maxHp>computeSaveCombatStats(save).maxHp);
 assert.ok(computeSaveCombatStats(changeCharacterJob(save,'arcanist')).baseAttack>computeSaveCombatStats(save).baseAttack);
 assert.ok(computeSaveCombatStats(changeCharacterJob(save,'ranger')).speedBonus>computeSaveCombatStats(save).speedBonus);
 assert.deepEqual([1,5,15,30].map(v=>growthRank(v).step),[0,1,2,3]);
 assert.ok(availableGrowthTitles({...save,level:30}).includes('title_growth_30'));
 assert.equal(hydrateSave(completeSaveData(next)).characterJob,'sentinel');
});
test('pet/feed give experience once per guardian/day, do not instantly level, or double charge',()=>{
 const save=createInitialPlayerSave(),day='2026-11-27';
 const pet=creditBond(save,'qilin','pet',day); assert.equal(pet.guardianBonds.qilin,save.guardianBonds.qilin); assert.equal(pet.guardianCare?.qilin?.points,2);
 assert.equal(creditBond(pet,'qilin','pet',day),pet);
 const fed=creditBond(pet,'qilin','feed',day); assert.equal(fed.coins,save.coins-90); assert.equal(fed.guardianCare?.qilin?.points,10); assert.equal(creditBond(fed,'qilin','feed',day),fed);
 const tomorrow=creditBond(fed,'qilin','pet','2026-11-28');assert.equal(tomorrow.guardianCare?.qilin?.points,12);
 const near={...save,guardianCare:{qilin:{day,points:bondRequired(save.guardianBonds.qilin)-2,petted:false,fed:false}}};
 assert.equal(creditBond(near,'qilin','pet',day).guardianBonds.qilin,save.guardianBonds.qilin+1);
 const legacy=hydrateSave({...save,guardianBonds:{...save.guardianBonds,qilin:100}}); assert.equal(legacy.guardianBonds.qilin,100);
 assert.equal(completeSaveData(tomorrow).guardianCare?.qilin?.points,12);
});
test('later zombie waves increase health, speed, numbers and spawn pressure',()=>{
 const a=defenseWavePressure(0,1),b=defenseWavePressure(2,1),c=defenseWavePressure(2,3);
 assert.ok(b.hp>a.hp&&b.speed>a.speed&&b.count>a.count&&b.interval<a.interval); assert.ok(c.hp>b.hp&&c.interval<b.interval);
 assert.ok(defenseBossProfile(true).hpMultiplier>defenseBossProfile(false).hpMultiplier);
 assert.notEqual(zombieForWave(0,0,1,1),zombieForWave(0,0,1,2));
});
test('experience requirements grow faster at high levels while preserving earned XP and levels',()=>{
 assert.deepEqual([1,5,15,30].map(xpRequiredForLevel),[120,768,4908,17868]);
 assert.ok(xpRequiredForLevel(30)-xpRequiredForLevel(29)>xpRequiredForLevel(5)-xpRequiredForLevel(4));
 assert.deepEqual(applyXpGain(15,300,0),{level:15,xp:300,leveledUp:false});
 const threshold=xpRequiredForLevel(5);assert.deepEqual(applyXpGain(5,threshold-1,1),{level:6,xp:0,leveledUp:true});
});
