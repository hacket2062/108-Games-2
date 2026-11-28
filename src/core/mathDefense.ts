export type ZombieKind = 'zero' | 'hopper' | 'bucket' | 'pyro' | 'oracle' | 'boss';
export type DefenseElement = 'neutral' | 'fire' | 'frost' | 'storm';
export const DEFENSE_ELEMENTS: Record<DefenseElement, { name: string; color: string; icon: string }> = {
  neutral: { name: '物理', color: '#e9d4ab', icon: '◆' }, fire: { name: '烈焰', color: '#ff9977', icon: '炎' },
  frost: { name: '寒霜', color: '#90e6ff', icon: '霜' }, storm: { name: '雷電', color: '#ddbdff', icon: '雷' },
};
export const ZOMBIE_DEFS: Record<ZombieKind, { name: string; cell: number; element: DefenseElement; hp: number; speed: number; bite: number; gate: number; role: string }> = {
  zero: { name: '迷糊學徒', cell: 0, element: 'neutral', hp: 75, speed: .012, bite: 8, gate: 8, role: '低威脅・慢速步行' },
  hopper: { name: '雷疾跑者', cell: 1, element: 'storm', hp: 85, speed: .023, bite: 7, gate: 10, role: '跑得快・怕寒霜' },
  bucket: { name: '寒霜重盾衛', cell: 2, element: 'frost', hp: 190, speed: .010, bite: 12, gate: 14, role: '高血量・算式盾・怕烈焰' },
  pyro: { name: '熔火術士', cell: 3, element: 'fire', hp: 115, speed: .013, bite: 15, gate: 12, role: '蓄力重擊・怕雷電' },
  oracle: { name: '冰晶祈願者', cell: 4, element: 'frost', hp: 105, speed: .011, bite: 7, gate: 10, role: '替同路夥伴回復・最多3次' },
  boss: { name: '機關殭屍王', cell: 5, element: 'storm', hp: 440, speed: .008, bite: 22, gate: 28, role: '半血進入二階・重型首領' },
};
// Explicit fantasy-game rule, not a claim about real-world science.
export function elementDamageMultiplier(attack: DefenseElement, target: DefenseElement): number {
  if (attack === 'neutral' || target === 'neutral' || attack === target) return 1;
  return ({ fire: 'frost', frost: 'storm', storm: 'fire' } as const)[attack] === target ? 1.6 : .7;
}
export function projectileElement(kind: string): DefenseElement {
  return kind === 'frost' ? 'frost' : kind === 'fire' || kind === 'prime' ? 'fire' : kind === 'beam' ? 'storm' : 'neutral';
}
export function zombieForWave(wave: number, ordinal: number, chapter: number, stage = 1): Exclude<ZombieKind, 'boss'> {
  if (wave === 0 && chapter === 1 && stage === 1) return ordinal < 2 ? 'zero' : 'bucket';
  const pool: Exclude<ZombieKind, 'boss'>[] = ['zero', 'hopper', 'bucket', 'pyro', 'oracle'];
  return pool[(ordinal + wave + chapter + stage - 2) % pool.length];
}
export function defenseBossProfile(major:boolean) {return major ? {name:'極品・星蝕殭屍王',hpMultiplier:2.4,speedMultiplier:1.15,damageMultiplier:1.5} : {name:'機關殭屍王',hpMultiplier:1,speedMultiplier:1,damageMultiplier:1};}
export function defenseSimulationPaused(paused: boolean, started: boolean, readingQuestion: boolean, readingExplanation: boolean, finished: boolean): boolean {
  return paused || !started || readingQuestion || readingExplanation || finished;
}
export function defenseWavePressure(wave:number,chapter:number) {
  return {hp:1+wave*.35+(chapter-1)*.2,speed:1+wave*.15,interval:Math.max(1.8,5-wave*1.2-(chapter-1)*.3),count:wave===0?3:6+wave*3};
}
