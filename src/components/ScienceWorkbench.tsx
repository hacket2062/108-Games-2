import React from 'react';
import type {ScienceQuestion,ScienceIngredient,PhType} from '../types/game';
import {soundEngine} from '../audio/soundEngine';
type Step='ingredients'|'temperature'|'ph'|'serve';
interface Props {
 dish:ScienceQuestion;nextDish:ScienceQuestion;step:Step;pickedIds:string[];tempResult:string|null;selectedPh:PhType|null;
 needleRef:React.RefObject<HTMLDivElement|null>;tMin:number;tMax:number;ultCharge:number;paused:boolean;serving:boolean;answerBudget?:number;
 onPick:(ingredient:ScienceIngredient)=>void;onLock:()=>void;onPh:(ph:PhType)=>void;onServe:()=>void;onUltimate:()=>void;
}
const STEPS:[Step,string][]=[['ingredients','選食材'],['temperature','控火候'],['ph','調酸鹼'],['serve','出餐']];
export function ScienceWorkbench(p:Props){
 const early=p.dish.grade<=2; const visibleSteps=early?STEPS.filter(([id])=>id==='ingredients'||id==='serve'):STEPS; const index=visibleSteps.findIndex(([id])=>id===p.step);
 return <section className="science-workbench" data-testid="science-workbench" data-step={p.step}>
  <header className="science-ticket" data-testid="science-order-queue">
   <div className="science-ticket-heading"><div><small>{p.dish.knowledgeTag}</small><h2>{p.dish.payload.dishName}</h2></div>
    <button type="button" className="science-speak" aria-label="朗讀料理訂單" onClick={()=>soundEngine.speakText(p.dish.payload.dishName+'，'+p.dish.payload.orderRequirement,'zh-TW')}>朗讀</button></div>
   <p className="science-order-requirement">{p.dish.payload.orderRequirement}</p>
   <details className="science-next-order"><summary>下一份：{p.nextDish.payload.dishName}</summary><p>{p.nextDish.payload.orderRequirement}</p></details>
  </header>
  <ol className="science-step-list" aria-label="料理步驟" style={{gridTemplateColumns:early?'repeat(2,minmax(0,1fr))':undefined}}>{visibleSteps.map(([id,label],i)=><li key={id} aria-current={id===p.step?'step':undefined} data-complete={i<index}><span>{i<index?'✓':i+1}</span>{label}</li>)}</ol>
  <div className="science-active-station">
   {p.step==='ingredients'&&<section aria-labelledby="science-ingredient-heading">
    <h3 id="science-ingredient-heading">{early?'生活觀察：選出答案':'挑選食材'} <span>{p.pickedIds.length}／{p.dish.payload.neededCount}</span></h3>
    <p className="science-instruction">閱讀完整選項，選出符合訂單的 {p.dish.payload.neededCount} 項。</p>
    <div className="science-ingredient-grid">{p.dish.payload.ingredients.map(ing=>{
     const picked=p.pickedIds.includes(ing.id);
     return <button key={ing.id} type="button" className="science-ingredient-option" data-testid="science-ingredient-option" aria-pressed={picked} disabled={p.paused||picked} onClick={()=>p.onPick(ing)}>
      <span className="science-ingredient-swatch" style={{backgroundColor:ing.color}} aria-hidden="true">{picked?'✓':''}</span>
      <strong className="science-ingredient-name">{ing.name}</strong><small>{picked?'已投入 · '+ing.categoryTag:'選擇這個答案'}</small>
     </button>;
    })}</div>
   </section>}
   {p.step==='temperature'&&<section aria-labelledby="science-temperature-heading">
    <h3 id="science-temperature-heading">控制火候</h3><p className="science-target">目標：{p.dish.payload.targetTempLabel}</p>
    <p className="science-instruction">等指針進入亮色區域，再按下鎖定。</p>
    <div className="science-temperature-gauge"><span className="science-temperature-target" style={{left:p.tMin+'%',width:(p.tMax-p.tMin)+'%'}}/><span ref={p.needleRef} className="science-temperature-needle" style={{left:'50%'}}/></div>
    <div className="science-temperature-labels"><span>0°C 急凍</span><span>55°C 中火</span><span>100°C 沸騰</span></div>
    <button type="button" className="science-primary-action" disabled={p.paused} onClick={p.onLock}>鎖定火候 <small>也可按空白鍵</small></button>
   </section>}
   {p.step==='ph'&&<section aria-labelledby="science-ph-heading">
    <h3 id="science-ph-heading">調整酸鹼度</h3><p className="science-target">需求：{p.dish.payload.targetPhLabel}</p>
    <div className="science-reagent-grid">{([['acid','酸性','檸檬紅'],['neutral','中性','純水紫'],['alkali','鹼性','蘇打藍']] as const).map(([ph,label,detail])=><button key={ph} type="button" className={'science-reagent science-reagent-'+ph} disabled={p.paused} aria-pressed={p.selectedPh===ph} onClick={()=>p.onPh(ph)}><strong>{label}</strong><span>{detail}</span></button>)}</div>
   </section>}
   {p.step==='serve'&&<section aria-labelledby="science-serve-heading">
    <h3 id="science-serve-heading">{early?'觀察完成，準備確認答案！':'料理完成，準備出餐！'}</h3>
    <ul className="science-recipe-summary"><li>食材：{p.dish.payload.ingredients.filter(i=>p.pickedIds.includes(i.id)).map(i=>i.name).join('、')}</li>{!early&&<><li>火候：{p.dish.payload.targetTempLabel}（{p.tempResult}）</li><li>酸鹼：{p.dish.payload.targetPhLabel}</li></>}</ul>
    <button type="button" className="science-primary-action" disabled={p.paused||p.serving} onClick={p.onServe}>{p.serving?'料理送出中…':early?'確認答案！':'搖鈴出餐！'}</button>
   </section>}
  </div>
  <footer className="science-workbench-footer"><span data-testid="answer-pace" data-answer-budget={p.answerBudget}>第 {index+1}／{visibleSteps.length} 步{p.answerBudget?' · 本題 '+p.answerBudget+' 秒':''}</span><button type="button" className="science-ultimate" disabled={p.paused||p.ultCharge<100} onClick={p.onUltimate}>元素大滿貫 · {p.ultCharge}%</button></footer>
 </section>;
}

