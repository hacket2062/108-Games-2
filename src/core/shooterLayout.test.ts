import test from 'node:test';
import assert from 'node:assert/strict';
import {spreadShooterTargets,shooterLetterBounds} from './shooterLayout';

test('all answer drones and spelling letters spawn inside actual phone and desktop widths',()=>{
 for(const width of [320,390,844,1440])for(const count of [4,6,10]){
  const xs=spreadShooterTargets(width,count);
  assert.equal(xs.length,count);assert.equal(new Set(xs).size,count);
  assert.ok(xs.every(x=>Number.isFinite(x)&&x>=45&&x<=width-45));
 }
});
test('one target is centered and empty waves have no targets',()=>{
 assert.deepEqual(spreadShooterTargets(390,1),[195]);
 assert.deepEqual(spreadShooterTargets(390,0),[]);
});
test('spelling targets stay above the ship in short landscape and portrait screens',()=>{
 for(const h of [390,740,844,1000]){
  const [top,bottom]=shooterLetterBounds(h);
  assert.ok(top>0&&bottom>=top&&bottom<=h-90);
 }
});
