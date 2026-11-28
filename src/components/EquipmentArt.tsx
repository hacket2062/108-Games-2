import React from 'react';
import type { AscensionPath, BattleItemId, EquipmentSlotId, WeaponInstance } from '../types/game';
import { equipmentArtTier, GEAR_ART_CELLS, heroArtPath, ITEM_ART_CELLS, PATH_ART, weaponArtCell } from '../core/equipmentAppearance';
import type { EquipmentAppearance } from '../core/equipmentAppearance';

export function AtlasArt({ cell, className = '', label }: { cell: number; className?: string; label?: string }) {
  return <span role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    className={`atlas-art ${className}`} style={{ backgroundImage: 'url(/art/equipment-atlas-v1.png)', backgroundPosition: `${cell % 4 / 3 * 100}% ${Math.floor(cell / 4) / 3 * 100}%` }} />;
}

export function WeaponArt({ weapon, className = '' }: { weapon: WeaponInstance; className?: string }) {
  const path = weapon.ascensionPath;
  const fused = weaponArtCell(weapon) === 4;
  return <span className={`weapon-art weapon-art-${path} ${fused ? 'weapon-art-fused' : ''} ${className}`}
    role="img" aria-label={`${weapon.name}・${PATH_ART[path].silhouette}`} data-weapon-family={weaponArtCell(weapon)} data-weapon-path={path}>
    <AtlasArt cell={weaponArtCell(weapon)} />
    <svg viewBox="0 0 200 200" className="weapon-evolution-overlay" aria-hidden="true">
      {path === 'hero' && <g fill="#ffdc83" stroke="#fff5cf" strokeWidth="2"><path d="m95 118-55-13 20 20-19 4 49 17zm18-18 13-55 13 22 8-14 6 44z"/><path d="m93 138-22 25 17-4 3 16 18-36z"/></g>}
      {path === 'mythic' && <g fill="#b8a0ff" stroke="#dcf8ff" strokeWidth="2"><path d="m42 97 10-34 12 34-12 21zm93-41 9-34 13 34-12 17zm14 93 10-30 12 30-12 18z"/><ellipse cx="100" cy="100" rx="76" ry="30" fill="none" transform="rotate(-35 100 100)" strokeDasharray="8 9"/></g>}
      {path === 'inferno' && <g fill="#b9364b" stroke="#ffba76" strokeWidth="2"><path d="m53 137-24-2 28-15-18-10 34-4 9 13zm57-60 7-38 10 16 16-28-2 38 13-4-25 33z"/><path d="m72 162-23 20 9-29-15 1 32-26z"/></g>}
      {Array.from({ length: Math.min(5, Math.floor(weapon.enhanceLevel / 3)) }, (_, i) => <path key={i} d={`m${55+i*20} 178 4-8 4 8-4 8z`} fill={PATH_ART[path].color} />)}
    </svg>
  </span>;
}

export function GearArt({ slot, level, className = '' }: { slot: EquipmentSlotId; level: number; className?: string }) {
  const tier = equipmentArtTier(level);
  return <span className={`gear-art gear-art-tier-${tier} ${className}`} role="img" aria-label={`${slot} 裝備外觀 ${tier + 1} 階`} data-gear-tier={tier}>
    <AtlasArt cell={GEAR_ART_CELLS[slot]} />
    <svg viewBox="0 0 120 120" aria-hidden="true">{tier > 0 && <path d="m10 75 3-29 12 13 5-29 10 20-4 39zm100 0-3-29-12 13-5-29-10 20 4 39z" fill={tier > 1 ? '#b89cff' : '#ffe2a0'} stroke="#fff4d0"/>}{tier > 1 && <path d="m60 8 9 18-9 18-9-18z" fill="#8fe7f5"/>}{tier > 2 && <path d="m20 103 40-15 40 15-11 11-29-12-29 12z" fill="#ff7e86"/>}</svg>
    <span className="gear-engraving">{Array.from({length: Math.min(5, Math.ceil(level / 3))}, () => '✦').join('')}</span>
  </span>;
}
export function BattleItemArt({ id, className = '' }: { id: BattleItemId; className?: string }) { return <AtlasArt cell={ITEM_ART_CELLS[id]} className={className} />; }
export function HeroPortrait({ appearance, className = '', previewPath }: { appearance: EquipmentAppearance; className?: string; previewPath?: AscensionPath }) {
  const path = previewPath ?? heroArtPath(appearance);
  const frame = PATH_ART[path].frame;
  return <div className={`hero-portrait hero-portrait-${path} ${className}`} data-hero-path={path}>
    <span className="hero-portrait-sprite" role="img" aria-label={PATH_ART[path].name}
      style={{backgroundPosition:`${frame % 2 * 100}% ${Math.floor(frame / 2) * 100}%`}} />
    <WeaponArt weapon={{...appearance.weapon,ascensionPath:previewPath ?? appearance.weapon.ascensionPath}} className="hero-held-weapon" />
  </div>;
}
