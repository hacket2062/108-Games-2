import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_QUESTIONS,getChineseQuestions,getEnglishQuestions,getMathQuestions,getScienceQuestions,getPvPMixedQuestions} from '../data/questionBank';
import {getChaptersForWorld,buildStageKey} from '../data/campaignMap';
test('grades 1–2 have distinct playable banks in both semesters and every engine mode',()=>{
 for(const grade of [1,2] as const)for(const semester of ['upper','lower'] as const){
  for(const mode of ['slash','radical','typo'] as const)assert.ok(getChineseQuestions(grade,semester,mode).length>0);
  for(const mode of ['listen','spell'] as const)assert.ok(getEnglishQuestions(grade,semester,mode).length>0);
  for(const subject of ['chinese','english','math','science'] as const){
   const bank=ALL_QUESTIONS.filter(q=>q.grade===grade&&q.subject===subject);
   assert.ok(bank.length>=25,`${subject} g${grade}`);
   assert.ok(bank.some(q=>q.semester===semester));
   const chapters=getChaptersForWorld(subject,grade);
   assert.equal(chapters.length,3);assert.equal(chapters.flatMap(x=>x.stages).length,30);
   assert.equal(chapters[0].stages[0].stageKey,buildStageKey(subject,grade,1,1));
   assert.notEqual(chapters[0].title,getChaptersForWorld(subject,3)[0].title);
  }
  for(const q of getScienceQuestions(grade,semester)){
   assert.equal(q.grade,grade);assert.equal(q.knowledgeTag,'生活觀察');
   assert.equal(q.payload.ingredients.filter(i=>i.isCorrect).length,q.payload.neededCount);
  }
 }
});
test('early arithmetic stays within grade bounds at every stage, with valid distinct answers',()=>{
 for(const grade of [1,2] as const)for(const semester of ['upper','lower'] as const)for(const stage of [1,5,10]){
  for(const q of getMathQuestions(grade,semester,stage)){
   assert.equal(q.grade,grade);
   assert.equal(q.payload.options[q.payload.correctIndex],q.answer);
   assert.equal(new Set(q.payload.options).size,4);
   const numbers=q.payload.formulaShield.match(/\d+/g)!.map(Number);
   const expected=q.payload.formulaShield.includes('−')?numbers[0]-numbers[1]:numbers[0]+numbers[1];
   assert.equal(Number(q.answer),expected);assert.ok(expected>=0&&expected<=(grade===1?20:100));
  }
 }
});
test('early Chinese puzzles are solvable without duplicate part selection',()=>{
 for(const grade of [1,2] as const)for(const q of getChineseQuestions(grade,'upper')){
  const p=q.payload;
  if(p.mode==='radical'){assert.notEqual(p.partA,p.partB);assert.ok(p.pool.includes(p.partA)&&p.pool.includes(p.partB));assert.equal(new Set(p.pool).size,p.pool.length);}
  if(p.mode==='typo')assert.equal(p.sentence[p.typoIndex],p.wrongChar);
  if(p.mode==='slash')assert.equal(p.options[p.correctIndex],q.answer);
 }
});
test('Trial Tower and mixed decks preserve each life-observation question and correct choices',()=>{
 for(const grade of [1,2] as const){
  const cards=getPvPMixedQuestions(grade,'science',123);
  assert.equal(cards.length,26);
  for(const card of cards){
   const original=ALL_QUESTIONS.find(q=>q.id===card.id)!;
   assert.ok(card.prompt.includes(original.prompt));
   assert.equal(card.options[card.correctIndex],card.answer);
   assert.equal(new Set(card.options).size,4);
   assert.ok(card.options.every(x=>!x.includes('免操作')));
  }
 }
});
