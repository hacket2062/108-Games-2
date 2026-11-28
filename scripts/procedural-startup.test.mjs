import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const source=readFileSync(process.env.PROCEDURAL_SOURCE || 'src/data/proceduralQuestions.ts','utf8');
const code=stripTypeScriptTypes(source.replace(/^import\s*\{[^}]+\}\s*from\s*'..\/types\/game';\s*/,'').replaceAll('export function','function'),{mode:'transform'});
function generator(random=Math.random){
 const math=Object.create(Math);math.random=random;
 const context=vm.createContext({exports:{},Math:math,Date});
 vm.runInContext(code,context,{timeout:1000});
 return expression=>vm.runInContext(expression,context,{timeout:500});
}

test('negative-answer options terminate even when random always returns the same value',()=>{
 const run=generator(()=>.5);
 for(const answer of [-100,-32,-8,-1,0,1,100]){
  const pack=run(`buildNumericOptions(${answer})`);
  assert.equal(pack.options.length,4);assert.equal(new Set(pack.options).size,4);
  assert.equal(pack.options[pack.correctIndex],String(answer));
 }
});
test('grade-four subtraction never creates a negative intermediate result',()=>{
 let i=0;const values=[.75,0,.999,.999];
 const run=generator(()=>values[i++]??.5);
 const questions=run("generateProceduralMathQuestions(4,'upper',1,1)");
 assert.equal(questions.length,1);assert.ok(Number(questions[0].answer)>=0);
});
test('all grades and semesters can generate repeated batches without blocking startup',()=>{
 const run=generator();let total=0;
 for(let batch=0;batch<40;batch++)for(const grade of [3,4,5,6])for(const semester of ['upper','lower']){
  const questions=run(`generateProceduralMathQuestions(${grade},'${semester}',${1+batch%10},16)`);
  assert.ok(questions.length>0);
  for(const q of questions){assert.equal(q.payload.options.length,4);assert.equal(new Set(q.payload.options).size,4);assert.equal(q.payload.options[q.payload.correctIndex],q.answer);}
  total+=questions.length;
 }
 assert.ok(total>=4000);
});
