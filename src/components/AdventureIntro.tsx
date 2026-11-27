import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import type { CampaignStageConfig, PlayMode } from '../types/game';
import { WORLD_GUIDES } from '../core/gameExperience';
import { WorldScene } from './WorldScene';
import { WorldInstructions } from './WorldInstructions';

/** Engines are not mounted until the child is ready: reading never costs HP/time. */
export function AdventureIntro({ stage, playMode, onReady, onBack }: {
  stage: CampaignStageConfig; playMode: PlayMode; onReady: () => void; onBack: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const guide = WORLD_GUIDES[stage.subject];
  useEffect(() => { panel.current?.focus(); }, []);
  return <div className="adventure-intro" role="dialog" aria-modal="true" aria-labelledby="intro-title"
    ref={panel} tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape') onBack(); }}>
    <div className="adventure-intro-card">
      <WorldScene subject={stage.subject} className="adventure-intro-art" />
      <div className="adventure-intro-content">
        <span className="adventure-eyebrow">守護者的行前小提醒 · {playMode === 'practice' ? '自由練習' : '冒險挑戰'}</span>
        <h1 id="intro-title">{guide.title}</h1>
        <p className="adventure-intro-mission">{guide.mission}</p>
        <WorldInstructions subject={stage.subject} />
        <p className="adventure-intro-note">準備好才開始，讀這張卡不會扣血。{playMode === 'practice' && '練習不改變冒險關卡的通關與寶箱紀錄。'}</p>
        <div className="adventure-intro-actions">
          <button type="button" onClick={onBack}><ArrowLeft size={16} /> 返回地圖</button>
          <button type="button" className="adventure-launch" onClick={onReady}><Play size={16} /> 我準備好了，出發！</button>
        </div>
      </div>
    </div>
  </div>;
}
