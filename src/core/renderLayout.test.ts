import test from 'node:test';
import assert from 'node:assert/strict';
import {containArtwork,lawnUnitLayout,kitchenStageLayout} from './renderLayout';
test('portrait, square and wide source art fits its box without stretching or moving its feet',()=>{
 for(const [sw,sh] of [[256,256],[250,266],[277,286],[315,271]])for(const [w,h] of [[68,76],[86,94],[40,44],[160,160]]){
  const [x,y,dw,dh]=containArtwork(sw,sh,7,11,w,h);
  assert.ok(Math.abs(dw/dh-sw/sh)<1e-10);
  assert.ok(x>=7-1e-9&&y>=11-1e-9&&x+dw<=7+w+1e-9);
  assert.ok(Math.abs(y+dh-(11+h))<1e-9);
 }
});
test('units fit narrow phone cells and short landscape cells with breathing room',()=>{
 for(const [cw,ch] of [[40,34],[43,46],[52,29],[110,80]]){
  const {scale,yOffset}=lawnUnitLayout(cw,ch);
  assert.ok(88*scale<=cw*.88+1e-9&&104*scale<=ch*.88+1e-9);
  assert.ok(scale>0&&scale<=1);assert.equal(yOffset,14*scale);
 }
});
test('short phone composition keeps the boss, cauldron and all four chefs inside the stage',()=>{
 for(const [w,h] of [[390,100],[375,102],[390,145]]){
  const p=kitchenStageLayout(w,h);assert.equal(p.compact,true);
  assert.ok(p.bossY-95*p.bossScale>=0&&p.bossY+95*p.bossScale<=h);
  assert.ok(p.potY+34*p.propScale<=h);
  assert.ok(p.potX-203*p.propScale>=0&&p.potX+203*p.propScale<=w);
  assert.ok(p.potY-60*p.propScale>=0);
 }
 assert.equal(kitchenStageLayout(1000,600).bossScale,1);
 assert.equal(kitchenStageLayout(1000,600).propScale,1);
});
