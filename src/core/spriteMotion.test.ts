import test from 'node:test';import assert from 'node:assert/strict';
import {heroPoseFrame,enemyPoseFrame} from './spriteMotion';import {BOSS_APPEARANCES,getBossAppearance} from './bossAppearance';
test('walking changes articulated frames; idle stops and attack countdown goes windup then strike',()=>{
 assert.deepEqual([0,1/6,2/6,3/6].map(t=>heroPoseFrame(true,t)),[0,1,0,2]);
 assert.equal(heroPoseFrame(false,99),0);assert.equal(heroPoseFrame(false,0,1),3);assert.equal(heroPoseFrame(false,0,.5),4);assert.equal(heroPoseFrame(false,0,0,.4),5);
 assert.equal(heroPoseFrame(true,3,1,.4),5,'hurt overrides the current action');
});
test('enemy movement, attack and frozen simulation clocks select reproducible poses',()=>{
 assert.deepEqual([0,1/6,2/6,3/6].map(t=>enemyPoseFrame(t)),[0,1,0,2]);
 assert.equal(enemyPoseFrame(55,false),0);assert.equal(enemyPoseFrame(55,true,true),3);
 assert.equal(enemyPoseFrame(.25,true),enemyPoseFrame(.25,true),'paused simulation time cannot advance pose');
});
test('each chapter and tier has different boss art, identity and matching combat element',()=>{
 const bosses=[1,2,3].flatMap(c=>[getBossAppearance(c,false),getBossAppearance(c,true)]);
 assert.equal(new Set(bosses.map(b=>b.row)).size,6);assert.equal(new Set(bosses.map(b=>b.name)).size,6);assert.equal(new Set(bosses.map(b=>b.silhouette)).size,6);
 assert.deepEqual([1,2,3].map(c=>getBossAppearance(c).element),['storm','frost','fire']);
 assert.equal(getBossAppearance(0).row,0);assert.equal(getBossAppearance(99,true).row,5);assert.equal(BOSS_APPEARANCES.length,6);
});
