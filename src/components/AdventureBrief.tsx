import React from 'react';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import type { CampaignStageConfig, PlayerSaveData } from '../types/game';
import { getNextAdventure } from '../core/adventureGuide';
import { effectivePlayMode } from '../core/gameExperience';
import { WorldScene } from './WorldScene';
import { HeroPortrait } from './EquipmentArt';

export function AdventureBrief({ save, onStart }: {
  save: PlayerSaveData;
  onStart: (stage: CampaignStageConfig) => void;
}) {
  const { stage, replay } = getNextAdventure(save);
  return (
    <section className="adventure-brief" aria-labelledby="adventure-heading">
      <WorldScene subject={stage.subject} className="adventure-brief-art" />
      <HeroPortrait className="lobby-player-portrait" appearance={{weapon:save.weapons.find(w=>w.uid===save.equippedWeaponUid) ?? save.weapons[0],equipment:save.equipment,characterJob:save.characterJob}} />
      <div className="adventure-brief-copy">
        <span className="adventure-eyebrow"><Sparkles size={14} /> 你的知識，就是超能力</span>
        <h2 id="adventure-heading">下一站，<br />讓世界亮起來。</h2>
        <p>和守護者一起探索四個世界。<br />每一次嘗試，都離答案更近一點。</p>
        <button type="button" className="adventure-launch" onClick={() => onStart(stage)}>
          <Compass size={19} /> {replay ? '再挑戰一次' : '出發冒險'} <ArrowRight size={18} />
        </button>
        <div className="adventure-destination">{stage.chapterTitle} · 第 {stage.stageNumber} 關<br />{stage.title} · {effectivePlayMode(save) === 'practice' ? '練習模式' : '冒險模式'}</div>
      </div>
    </section>
  );
}
