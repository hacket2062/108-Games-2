import {spawnSync} from 'node:child_process';
const run=args=>{
  const result=spawnSync(process.execPath,args,{stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
};
for(const [source,out] of [['campaignAndQuestions','.verification/test-campaign'],['combatMath','.verification/test-combat']]) {
  run(['node_modules/vite/bin/vite.js','build','--ssr','src/core/'+source+'.test.ts','--outDir',out]);
}
run(['--test','scripts/procedural-startup.test.mjs','.verification/test-campaign/campaignAndQuestions.test.js','.verification/test-combat/combatMath.test.js']);
