import test from 'node:test';import assert from 'node:assert/strict';
import {ALL_QUESTIONS,getMathQuestions} from '../data/questionBank';
import {ADVENTURE_CHINESE,ADVENTURE_ENGLISH,ADVENTURE_MATH,ADVENTURE_SCIENCE} from '../data/questions/adventureExpansion';
import {varyQuestionOptions} from './questionVariation';import {QuestionManager} from './questionManager';
test('new content has unique prompts and IDs, balanced grade/semester coverage and valid answer indices',()=>{
 const added=[...ADVENTURE_CHINESE,...ADVENTURE_ENGLISH,...ADVENTURE_MATH,...ADVENTURE_SCIENCE];assert.equal(added.length,432);
 assert.equal(new Set(ALL_QUESTIONS.map(q=>q.id)).size,ALL_QUESTIONS.length);
 for(const grade of [3,4,5,6])for(const subject of ['chinese','english','math','science'])for(const semester of ['upper','lower'])assert.ok(added.some(q=>q.grade===grade&&q.subject===subject&&q.semester===semester));
 assert.equal(new Set(ADVENTURE_MATH.map(q=>q.prompt)).size,ADVENTURE_MATH.length);
 for(const q of added){assert.ok(q.explanation&&q.hint);const p=q.payload;if('correctIndex'in p){const options='options'in p?p.options:p.choices;assert.equal(options[p.correctIndex],q.answer);assert.equal(new Set(options).size,options.length);}}
});
test('option shuffle preserves the correct answer and never changes the original question bank',()=>{
 for(const q of ALL_QUESTIONS){const before=JSON.stringify(q),copy=varyQuestionOptions(q,()=>0);assert.equal(JSON.stringify(q),before);const p=copy.payload;if('correctIndex'in p){const options='options'in p?p.options:p.choices;assert.equal(options[p.correctIndex],q.answer);}}
 const q=getMathQuestions(4,'upper')[0];assert.notDeepEqual(varyQuestionOptions(q,()=>0).payload.options,q.payload.options);
});
test('recent account history is postponed across runs, without duplicates inside a complete deck',()=>{
 const pool=getMathQuestions(4,'upper').slice(0,15),recent=pool.slice(0,5).map(q=>q.id);
 const manager=new QuestionManager(pool,{recentQuestionIds:recent});const first=Array.from({length:10},()=>manager.next().id);assert.ok(first.every(id=>!recent.includes(id)));
 const all=[...first,...Array.from({length:5},()=>manager.next().id)];assert.equal(new Set(all).size,15);assert.notEqual(manager.next().id,all.at(-1));
 const exhausted=new QuestionManager(pool,{recentQuestionIds:pool.map(q=>q.id)});assert.notEqual(exhausted.next().id,pool.at(-1)?.id);
});
