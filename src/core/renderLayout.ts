/** Contain artwork without changing its native proportions; keep feet on the baseline. */
export function containArtwork(sourceWidth:number,sourceHeight:number,x:number,y:number,width:number,height:number):[number,number,number,number]{
 const scale=Math.min(width/sourceWidth,height/sourceHeight);
 const w=sourceWidth*scale,h=sourceHeight*scale;
 return [x+(width-w)/2,y+height-h,w,h];
}
/** The painted unit, including its head and base, must fit a single lawn tile. */
export function lawnUnitLayout(cellWidth:number,cellHeight:number,magnification=1){
 const scale=Math.min(1,cellWidth*.88/(88*magnification),cellHeight*.88/(104*magnification));
 return {scale,yOffset:14*scale};
}
/** Kitchen art was authored around a 500px-high stage, not a phone's short strip. */
export function kitchenSceneScale(width:number,height:number):number{return Math.min(1,width/440,height/430);}
export function kitchenStageLayout(width:number,height:number){
 const compact=height<260;
 return {
  bossScale:compact?Math.max(0,Math.min(.65,(height-12)/190,width/440)):kitchenSceneScale(width,height),
  propScale:compact?Math.max(0,Math.min(.65,(height-12)/150)):kitchenSceneScale(width,height),
  bossX:width*(compact?.73:.5),bossY:height*(compact?.53:.36),potX:width*(compact?.37:.5),potY:height*.77,compact,
 };
}
