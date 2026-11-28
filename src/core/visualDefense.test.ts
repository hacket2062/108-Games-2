import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialPlayerSave } from './playerSave';
import { appearanceSignature, equipmentArtTier, heroArtPath, weaponArtCell, WEAPON_ART_CELLS } from './equipmentAppearance';
import { DEFENSE_ELEMENTS, defenseSimulationPaused, elementDamageMultiplier, projectileElement, ZOMBIE_DEFS, zombieForWave } from './mathDefense';

test('catalog and fusion weapons have five distinct silhouettes, and fusion is never the starter art',()=>{
  assert.equal(new Set(Object.values(WEAPON_ART_CELLS)).size,5);
  assert.equal(weaponArtCell({templateId:'wp_starter_pen',isFused:true}),4);
  assert.notEqual(weaponArtCell({templateId:'wp_starter_pen'}),weaponArtCell({templateId:'wp_fused_aurora'}));
});
test('each ascension selects a distinct full character, and all equipment levels participate in visual identity',()=>{
  const save=createInitialPlayerSave();
  const appearance={weapon:save.weapons[0],equipment:save.equipment};
  const before=appearanceSignature(appearance);
  const paths=(['base','hero','mythic','inferno'] as const).map(path=>heroArtPath({...appearance,weapon:{...appearance.weapon,ascensionPath:path}}));
  assert.equal(new Set(paths).size,4);
  for(const slot of ['weapon','helm','armor','gloves','boots','amulet'] as const){const next=structuredClone(appearance);next.equipment[slot]=(next.equipment[slot]??1)+1;assert.notEqual(appearanceSignature(next),before);}
  assert.deepEqual([1,5,10,15].map(equipmentArtTier),[0,1,2,3]);
  assert.equal(heroArtPath({...appearance,equipment:{...appearance.equipment,armor:10}}),'mythic');
});
test('six enemies differ in strength, movement and role, with a predictable beginner wave',()=>{
  assert.equal(Object.keys(ZOMBIE_DEFS).length,6);
  assert.equal(new Set(Object.values(ZOMBIE_DEFS).map(z=>z.cell)).size,6);
  assert.ok(ZOMBIE_DEFS.boss.hp>ZOMBIE_DEFS.bucket.hp&&ZOMBIE_DEFS.bucket.hp>ZOMBIE_DEFS.zero.hp);
  assert.ok(ZOMBIE_DEFS.hopper.speed>ZOMBIE_DEFS.zero.speed);
  assert.deepEqual([0,1,2].map(i=>zombieForWave(0,i,1)),['zero','zero','bucket']);
  assert.equal(new Set(Array.from({length:10},(_,i)=>zombieForWave(1,i,2))).size,5);
});
test('element counters alter actual damage in both directions while physical stays neutral',()=>{
  assert.equal(elementDamageMultiplier('fire','frost'),1.6);
  assert.equal(elementDamageMultiplier('frost','storm'),1.6);
  assert.equal(elementDamageMultiplier('storm','fire'),1.6);
  assert.equal(elementDamageMultiplier('frost','fire'),.7);
  for(const target of Object.keys(DEFENSE_ELEMENTS) as Array<keyof typeof DEFENSE_ELEMENTS>)assert.equal(elementDamageMultiplier('neutral',target),1);
  assert.equal(projectileElement('beam'),'storm');assert.equal(projectileElement('fire'),'fire');
});
test('enemy simulation cannot run before explicit wave start, while answering or reading, or after settlement',()=>{
  assert.equal(defenseSimulationPaused(false,false,false,false,false),true);
  assert.equal(defenseSimulationPaused(false,true,true,false,false),true);
  assert.equal(defenseSimulationPaused(false,true,false,true,false),true);
  assert.equal(defenseSimulationPaused(true,true,false,false,false),true);
  assert.equal(defenseSimulationPaused(false,true,false,false,true),true);
  assert.equal(defenseSimulationPaused(false,true,false,false,false),false);
});
