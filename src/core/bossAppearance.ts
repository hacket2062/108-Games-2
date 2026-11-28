import type {DefenseElement} from './mathDefense';
export interface BossAppearance {row:number;name:string;element:DefenseElement;chapter:number;supreme:boolean;silhouette:string;}
export const BOSS_APPEARANCES:readonly BossAppearance[]=[
 {row:0,name:'機關巨王・銅齒',element:'storm',chapter:1,supreme:false,silhouette:'巨型機械拳甲・齒輪王冠'},
 {row:1,name:'冰角牛王・霜蹄',element:'frost',chapter:2,supreme:false,silhouette:'牛首雙角・冰盾重槌'},
 {row:2,name:'熔岩龍王・赤鱗',element:'fire',chapter:3,supreme:false,silhouette:'龍首長尾・熔火鏈槌'},
 {row:3,name:'極品・翡翠森骸王',element:'storm',chapter:1,supreme:true,silhouette:'鹿首樹角・根鬚巨爪'},
 {row:4,name:'極品・寒晶巫后',element:'frost',chapter:2,supreme:true,silhouette:'雪冠浮袍・六刃冰晶'},
 {row:5,name:'極品・虛空翼龍王',element:'fire',chapter:3,supreme:true,silhouette:'巨幅龍翼・四足宇宙巨獸'},
];
export function getBossAppearance(chapter=1,supreme=false):BossAppearance {
  const index=Math.max(0,Math.min(2,Math.floor(chapter)-1));
  return BOSS_APPEARANCES[index+(supreme?3:0)];
}
