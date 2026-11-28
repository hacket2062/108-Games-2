/** Frame selectors use simulation clocks, so pause freezes the actual limb pose. */
export function heroPoseFrame(moving:boolean,walkPhase:number,attackProgress=0,hitFlash=0):number {
  if(hitFlash>0)return 5;
  if(attackProgress>.65)return 3; // countdown: wind-up precedes strike
  if(attackProgress>.12)return 4;
  if(moving)return [0,1,0,2][Math.floor(Math.max(0,walkPhase)*6)%4];
  return 0;
}
export function enemyPoseFrame(time:number,moving=true,attacking=false,fast=false):number {
  if(attacking)return 3;
  return moving?[0,1,0,2][Math.floor(Math.max(0,time)*(fast?9:6))%4]:0;
}
// Generated rows have slight unequal gutters. Explicit source bounds keep hats,
// horns and feet intact without pulling pixels from a neighboring actor.
const MOTION_ROWS:Record<string,readonly (readonly [number,number])[]>={
 'zombie-motion-v1.png':[[0,.196],[.2,.389],[.395,.57],[.578,.765],[.772,1]],
 'boss-motion-v1.png':[[0,.151],[.16,.309],[.313,.466],[.47,.629],[.635,.795],[.799,.985]],
};
export function motionSourceRect(url:string,width:number,height:number,row:number,frame:number,columns:number,rows:number):[number,number,number,number] {
 const key=url.split('/').at(-1)??'',bounds=MOTION_ROWS[key]?.[row]??[row/rows,(row+1)/rows];
 const cellW=width/columns,cellH=(bounds[1]-bounds[0])*height;
 const inset=key.startsWith('boss-')||key.startsWith('zombie-')?.055:.015;
 return [frame*cellW+cellW*inset,bounds[0]*height+cellH*.015,cellW*(1-inset*2),cellH*.97];
}
export function bossPortraitBackground(row:number):{backgroundPosition:string;backgroundSize:string} {
 const [start,end]=MOTION_ROWS['boss-motion-v1.png'][row];
 const height=end-start;
 return {backgroundPosition:`0% ${start/(1-height)*100}%`,backgroundSize:`400% ${100/height}%`};
}
