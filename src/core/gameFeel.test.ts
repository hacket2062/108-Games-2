import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameFeel,triggerGameFeel,updateGameFeel} from '../canvas/proceduralArt';
test('paused feedback neither advances effects nor generates new random camera shake',()=>{
 const feel=createGameFeel();triggerGameFeel(feel,{shake:.4,flash:.3,hitstop:.06});
 const before={...feel};
 for(let i=0;i<30;i++)assert.deepEqual(updateGameFeel(feel,0),{dt:0,simDt:0,shakeX:0,shakeY:0});
 assert.deepEqual(feel,before);
 const resumed=updateGameFeel(feel,1/60);assert.ok(feel.shakeTimer<before.shakeTimer&&feel.flashAlpha<before.flashAlpha);
 assert.equal(resumed.simDt,0,'The remaining hitstop is still honoured after resuming');
});
