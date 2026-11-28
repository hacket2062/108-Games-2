import {spawnSync} from 'node:child_process';
const run=args=>{const result=spawnSync(process.execPath,args,{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);};
const suites=['campaignAndQuestions','combatMath','earlyGrades','renderLayout'];
for(const source of suites)run(['node_modules/vite/bin/vite.js','build','--ssr','src/core/'+source+'.test.ts','--outDir','.verification/test-'+source]);
run(['--test','scripts/procedural-startup.test.mjs',...suites.map(s=>'.verification/test-'+s+'/'+s+'.test.js')]);
