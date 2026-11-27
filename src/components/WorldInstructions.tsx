import React from 'react';
import type { SubjectId } from '../types/game';
import { WORLD_GUIDES } from '../core/gameExperience';

export function WorldInstructions({ subject }: { subject: SubjectId }) {
  const guide = WORLD_GUIDES[subject];
  return <div className="world-instructions">
    <ol>{guide.steps.map((step, i) => <li key={step}><span aria-hidden="true">{i + 1}</span><p>{step}</p></li>)}</ol>
    <p className="world-instructions-controls">{guide.controls}</p>
    <p className="world-instructions-tip">✦ {guide.tip}</p>
  </div>;
}
