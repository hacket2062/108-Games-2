import type { EquipmentAppearance } from '../core/equipmentAppearance';
import { heroArtPath, PATH_ART, weaponArtCell } from '../core/equipmentAppearance';
import { ZOMBIE_DEFS } from '../core/mathDefense';
import type { ZombieKind } from '../core/mathDefense';
import {enemyPoseFrame,heroPoseFrame,motionSourceRect} from '../core/spriteMotion';
import {getBossAppearance} from '../core/bossAppearance';

const images = new Map<string, HTMLImageElement>();
function atlas(url: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let image = images.get(url);
  if (!image) { image = new Image(); image.src = url; images.set(url, image); }
  return image.complete && image.naturalWidth > 0 ? image : null;
}
export async function preloadMotionAssets(world:'chinese'|'math'|'science'):Promise<void> {
  if(typeof Image==='undefined')return;
  const files=world==='chinese'?['hero','party','boss']:world==='math'?['zombie','boss']:['chef'];
  await Promise.all(files.map(async name=>{const url='/art/'+name+'-motion-v1.png';atlas(url);await images.get(url)?.decode().catch(()=>{});}));
}
export function drawMotionFrame(ctx:CanvasRenderingContext2D,url:string,row:number,frame:number,columns:number,rows:number,x:number,y:number,width:number,height:number):boolean {
  const source=atlas(url);if(!source)return false;
  const crop=motionSourceRect(url,source.naturalWidth,source.naturalHeight,row,frame,columns,rows);
  ctx.drawImage(source,...crop,x,y,width,height);return true;
}
export function drawCompanionMotion(ctx:CanvasRenderingContext2D,role:'pandaHealer'|'craneMage',x:number,y:number,time:number,options:{scale?:number;facing?:number;moving?:boolean;walkPhase?:number;attackProgress?:number;hitFlash?:number;label?:string}):boolean {
  if(!atlas('/art/party-motion-v1.png'))return false;
  ctx.save();ctx.translate(x,y);ctx.scale((options.scale??1)*(options.facing??1),options.scale??1);
  drawMotionFrame(ctx,'/art/party-motion-v1.png',role==='pandaHealer'?0:1,heroPoseFrame(Boolean(options.moving),options.walkPhase??0,options.attackProgress,options.hitFlash),6,2,-42,-61,84,94);
  ctx.restore();return true;
}
export function drawChapterBoss(ctx:CanvasRenderingContext2D,x:number,y:number,time:number,options:{chapter?:number;supreme?:boolean;moving?:boolean;attacking?:boolean;scale?:number;hitFlash?:number;hpRatio?:number;name?:string;shielded?:boolean}):boolean {
  if(!atlas('/art/boss-motion-v1.png'))return false;
  const boss=getBossAppearance(options.chapter,options.supreme);
  ctx.save();ctx.translate(x,y);ctx.scale(options.scale??1,options.scale??1);
  if(options.shielded){ctx.strokeStyle='#9bdfff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-8,44,49,0,0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=options.hitFlash?.7:1;
  drawMotionFrame(ctx,'/art/boss-motion-v1.png',boss.row,enemyPoseFrame(time,options.moving,options.attacking),4,6,-43,-61,86,95);
  ctx.globalAlpha=1;ctx.fillStyle='#14213a';ctx.fillRect(-30,36,60,5);ctx.fillStyle='#ee9cb4';ctx.fillRect(-30,36,60*(options.hpRatio??1),5);
  ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffdf9f';ctx.strokeStyle='#0a1527';ctx.lineWidth=3;ctx.strokeText(boss.name,0,-64);ctx.fillText(boss.name,0,-64);
  ctx.restore();return true;
}
export function drawWorldAvatar(ctx:CanvasRenderingContext2D,role:'ship'|'redpanda'|'penguin'|'mantis',x:number,y:number,time:number,appearance?:EquipmentAppearance,tilt=0,shielded=false,hitFlash=0,cookingPulse=0):boolean {
 if(role!=='ship'){
  const path=appearance?heroArtPath(appearance):'base';
  const column=(role==='redpanda'?0:role==='penguin'?2:4)+(cookingPulse>.04?1:0);
  if(drawMotionFrame(ctx,'/art/chef-motion-v1.png',PATH_ART[path].frame,column,6,4,x-38,y-52,76,88))return true;
 }
 const image=atlas('/art/world-avatars-v1.png');if(!image)return false;
 const path=appearance?heroArtPath(appearance):'base',frame=PATH_ART[path].frame;
 const row=role==='ship'?0:role==='redpanda'?1:role==='penguin'?2:3;
 ctx.save();ctx.translate(x,y);ctx.rotate(tilt*.22);
 if(shielded){ctx.fillStyle='#7ccfff25';ctx.strokeStyle='#b5f5ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,38,44,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 if(role==='ship'){
  const glow=ctx.createLinearGradient(0,18,0,44);glow.addColorStop(0,path==='inferno'?'#ffbd8e':'#b5edff');glow.addColorStop(1,'#80cfff00');ctx.fillStyle=glow;ctx.beginPath();ctx.moveTo(-9,17);ctx.lineTo(0,35+Math.sin(time*30)*5);ctx.lineTo(9,17);ctx.fill();
 }
 const w=image.naturalWidth/4;
 const bounds=[[0,.218],[.226,.470],[.476,.728],[.735,1]][row];
 ctx.globalAlpha=hitFlash>0?.65+Math.sin(time*45)*.25:1;
 ctx.drawImage(image,frame*w+w*.055,bounds[0]*image.naturalHeight,w*.89,(bounds[1]-bounds[0])*image.naturalHeight,role==='ship'?-37:-36,role==='ship'?-38:-49,role==='ship'?74:72,role==='ship'?76:86);
 ctx.restore();return true;
}
export function drawArtCell(ctx: CanvasRenderingContext2D, url: string, cell: number, columns: number, rows: number, x: number, y: number, width: number, height: number): boolean {
  const image = atlas(url); if (!image) return false;
  const w = image.naturalWidth / columns, h = image.naturalHeight / rows;
  if(url.includes('allies-towers-enemies')){const bounds=[[0,.24],[.247,.492],[.496,.721],[.735,.995]][Math.floor(cell/4)];ctx.drawImage(image,cell%4*w+w*.075,bounds[0]*image.naturalHeight,w*.85,(bounds[1]-bounds[0])*image.naturalHeight,x,y,width,height);return true;}
  if(url.includes('hero-evolution')){ctx.drawImage(image,cell%columns*w+w*.03,Math.floor(cell/columns)*h+h*.02,w*.94,h*.90,x,y,width,height);return true;}
  if(url.includes('zombie-roster')) {ctx.drawImage(image,cell%columns*w+w*.035,Math.floor(cell/columns)*h+h*.02,w*.93,h*.90,x,y,width,height);return true;}
  ctx.drawImage(image, cell % columns * w, Math.floor(cell / columns) * h, w, h, x, y, width, height); return true;
}
export function drawPaintedUnit(ctx:CanvasRenderingContext2D,cell:number,x:number,y:number,time:number,options:{scale?:number;facing?:number;hitFlash?:number;shielded?:boolean;hpRatio?:number;label?:string}={}):boolean {
 if(!atlas('/art/allies-towers-enemies-v1.png'))return false;
 ctx.save();ctx.translate(x,y+Math.sin(time*3)*1.5);ctx.scale(options.scale??1,options.scale??1);
 ctx.fillStyle='#080f1c55';ctx.beginPath();ctx.ellipse(0,24,28,7,0,0,Math.PI*2);ctx.fill();
 if(options.shielded){ctx.strokeStyle='#b5e9ff';ctx.fillStyle='#70bbff20';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-8,40,48,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 ctx.save();ctx.scale(options.facing??1,1);ctx.globalAlpha=options.hitFlash? .7:1;drawArtCell(ctx,'/art/allies-towers-enemies-v1.png',cell,4,4,-40,-58,80,88);ctx.restore();
 if(options.hpRatio!==undefined){ctx.fillStyle='#0a1429';ctx.fillRect(-27,-65,54,5);ctx.fillStyle='#85d99e';ctx.fillRect(-27,-65,54*Math.max(0,Math.min(1,options.hpRatio)),5);}
 if(options.label){ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#eaf4f9';ctx.strokeStyle='#071428';ctx.lineWidth=3;ctx.strokeText(options.label,0,43);ctx.fillText(options.label,0,43);}
 ctx.restore();return true;
}
export function drawEquippedHero(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, appearance: EquipmentAppearance, facing = 1, scale = 1, attack = 0,moving=false,walkPhase=0,hitFlash=0): boolean {
  if (!atlas('/art/hero-motion-v1.png')&&!atlas('/art/hero-evolution-v1.png')) return false;
  ctx.save(); ctx.translate(x,y+Math.sin(time*3)*1.5); ctx.scale(facing*scale,scale);
  const path = heroArtPath(appearance);
  const pose=heroPoseFrame(moving,walkPhase,attack,hitFlash);
  const animated=drawMotionFrame(ctx,'/art/hero-motion-v1.png',PATH_ART[path].frame,pose,6,4,-43,-59,86,94);
  if(!animated)drawArtCell(ctx,'/art/hero-evolution-v1.png',PATH_ART[path].frame,2,2,-38,-54,76,86);
  const hands=[[18,-8],[20,-12],[26,-25],[-9,-47],[35,-16],[22,-26]];
  ctx.save();ctx.translate(...(animated?hands[pose]:[21,-6]) as [number,number]);ctx.rotate(pose===3?-1.1:pose===4?1.1:-.15);
  drawArtCell(ctx,'/art/equipment-atlas-v1.png',weaponArtCell(appearance.weapon),4,4,-18,-35,45,56);ctx.restore();
  ctx.restore();return true;
}
export function drawZombieArt(ctx: CanvasRenderingContext2D, kind: ZombieKind, phase2 = false,time=0,moving=true,attacking=false,chapter=1,supreme=false): boolean {
  const frame=enemyPoseFrame(time,moving,attacking,kind==='hopper'||phase2);
  const boss=getBossAppearance(chapter,supreme);
  const animated=kind==='boss'?drawMotionFrame(ctx,'/art/boss-motion-v1.png',boss.row,frame,4,6,-39,-58,78,88):drawMotionFrame(ctx,'/art/zombie-motion-v1.png',ZOMBIE_DEFS[kind].cell,frame,4,5,-34,-50,68,76);
  const drawn=animated||drawArtCell(ctx,'/art/zombie-roster-v1.png',ZOMBIE_DEFS[kind].cell,3,2,-30,-46,60,72);
  return drawn;
}
export function drawUpgradeRig(ctx: CanvasRenderingContext2D,x:number,y:number,appearance:EquipmentAppearance,time:number,scale=1){
  const path=heroArtPath(appearance);if(path==='base')return;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle=path==='hero'?'#f8d583':path==='mythic'?'#8fcfff':'#dd5364';ctx.strokeStyle=path==='inferno'?'#ffd29a':'#f1eeff';ctx.lineWidth=1.7;
  for(const side of[-1,1]){ctx.beginPath();if(path==='hero'){ctx.moveTo(side*17,-8);ctx.lineTo(side*42,-24);ctx.lineTo(side*33,5);ctx.lineTo(side*17,12);}else if(path==='mythic'){const bob=Math.sin(time*2)*3;ctx.moveTo(side*34,-22+bob);ctx.lineTo(side*43,-5+bob);ctx.lineTo(side*34,12+bob);ctx.lineTo(side*26,-5+bob);}else{ctx.moveTo(side*17,-2);ctx.lineTo(side*45,-31);ctx.lineTo(side*39,-5);ctx.lineTo(side*52,-11);ctx.lineTo(side*30,21);}ctx.closePath();ctx.fill();ctx.stroke();}ctx.restore();
}
