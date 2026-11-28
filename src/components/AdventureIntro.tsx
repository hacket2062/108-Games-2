import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import type { CampaignStageConfig, PlayMode } from '../types/game';
import { WORLD_GUIDES } from '../core/gameExperience';
import { WorldScene } from './WorldScene';
import { TUTORIAL_DEMOS } from '../data/tutorialDemos';
import type { TutorialStatus } from '../core/tutorialProgress';

/** Engines are not mounted until the child is ready: reading never costs HP/time. */
export function AdventureIntro({ stage, playMode, onReady, onBack }: {
  stage: CampaignStageConfig; playMode: PlayMode; onReady: (status: TutorialStatus) => void; onBack: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const guide = WORLD_GUIDES[stage.subject];
  const demo = TUTORIAL_DEMOS[stage.subject];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [position, setPosition] = useState(1);
  const [feedback, setFeedback] = useState('');
  const attemptAction = (next: number) => {
    if (step !== 1) return;
    setPosition(next);
    if (next === demo.target) { setStep(2); setFeedback('做到啦！接著試答一題。'); }
    else setFeedback(stage.subject === 'science' ? '找找看，哪一個是蘋果？' : '再靠近發光的位置試試。');
  };
  const answer = (option: string) => {
    if (step !== 2) return;
    if (option === demo.answer) { setStep(3); setFeedback(demo.success); }
    else setFeedback(demo.explanation);
  };
  useEffect(() => { panel.current?.focus(); }, []);
  return <div className="adventure-intro" role="dialog" aria-modal="true" aria-labelledby="intro-title"
    ref={panel} tabIndex={-1} onKeyDown={(event) => { if (event.key === 'Escape') onBack(); }}>
    <div className="adventure-intro-card">
      <WorldScene subject={stage.subject} className="adventure-intro-art" />
      <div className="adventure-intro-content">
        <span className="adventure-eyebrow">先試玩，再出發 · {playMode === 'practice' ? '自由練習' : '冒險挑戰'}</span>
        <h1 id="intro-title">{guide.title}</h1>
        <div className="tutorial-steps" aria-label="教學進度"><span aria-current={step === 1 ? 'step' : undefined}>1 動手試試</span><span aria-current={step === 2 ? 'step' : undefined}>2 試答一題</span><span aria-current={step === 3 ? 'step' : undefined}>準備完成</span></div>
        <h2 className="tutorial-task">{step === 1 ? demo.action : step === 2 ? demo.prompt : demo.success}</h2>
        <div className={`tutorial-stage tutorial-stage-${stage.subject} ${step === 3 ? 'tutorial-success' : ''}`}
          tabIndex={step === 1 ? 0 : -1} role="group" aria-label="示範操作區"
          onKeyDown={(event) => {
            if (step !== 1 || stage.subject === 'science' || stage.subject === 'math') return;
            if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(event.key)) {
              event.preventDefault(); attemptAction(Math.max(0, Math.min(2, position + (['ArrowLeft', 'a', 'A'].includes(event.key) ? -1 : 1))));
            }
          }}>
          <div className="tutorial-action-grid">{demo.positions.map((label, index) => <button key={label} type="button"
            className={index === demo.target ? 'tutorial-target' : ''} disabled={step !== 1}
            aria-label={stage.subject === 'math' ? `建塔：${label}` : stage.subject === 'science' ? `選取${label}` : `移動到${label}`}
            onClick={() => attemptAction(index)}>
            <span className="tutorial-actor" aria-hidden="true">{step === 3 ? (index === demo.target ? '✦' : '·') : stage.subject === 'science' ? ['🍎', '🪨', '🪵'][index] : position === index ? demo.actor : index === demo.target ? '◎' : '·'}</span>
            <span>{label}</span>
          </button>)}</div>
          {step === 3 && <div className="tutorial-effect" aria-hidden="true">✧ ━━━ ✦ ━━━ ✧</div>}
        </div>
        {step === 2 && <div className="tutorial-answers" role="group" aria-label="示範題選項">{demo.options.map((option, i) => <button key={option} type="button" onClick={() => answer(option)}><span>{i + 1}</span>{option}</button>)}</div>}
        <p className="tutorial-feedback" role="status" aria-live="polite">{feedback || (stage.subject === 'chinese' || stage.subject === 'english' ? '用手指點選；也可點操作區後按左右方向鍵。' : '點一下發光的選項試試看。')}</p>
        <p className="adventure-intro-note">這是示範，不扣血、不計作答或獎勵。{playMode === 'practice' && '練習不改變冒險通關與寶箱。'}</p>
        <div className="adventure-intro-actions">
          <button type="button" onClick={onBack}><ArrowLeft size={16} /> 返回地圖</button>
          {step === 3 ? <button type="button" className="adventure-launch" onClick={() => onReady('completed')}><Play size={16} /> 我準備好了，出發！</button>
            : <button type="button" className="tutorial-skip" onClick={() => onReady('skipped')}>我已熟悉，略過教學</button>}
        </div>
      </div>
    </div>
  </div>;
}
