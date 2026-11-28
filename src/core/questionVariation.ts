import type {AnyQuestion} from '../types/game';
/** Shuffle a copy and carry the correct index with the answer; never mutate the source bank. */
export function varyQuestionOptions<T extends AnyQuestion>(question:T,random:()=>number=Math.random):T {
 const copy=structuredClone(question);
 const shuffle=<V,>(values:V[])=>{for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}return values;};
 const payload=copy.payload;
 if('correctIndex' in payload){
   const options='options' in payload?payload.options:'choices' in payload?payload.choices:undefined;
   if(options){const correct=options[payload.correctIndex];shuffle(options);payload.correctIndex=options.indexOf(correct);}
 }else if('ingredients' in payload)shuffle(payload.ingredients);
 else if('pool' in payload)shuffle(payload.pool);
 else if('distractorLetters' in payload)shuffle(payload.distractorLetters);
 return copy;
}
