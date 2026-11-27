import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { RoguelikeRelicDef } from '../data/heroProgression';
import { gamepadManager } from '../core/gamepadManager';
import { soundEngine } from '../audio/soundEngine';

interface RoguelikeCardModalProps {
  open: boolean;
  title?: string;
  choices: RoguelikeRelicDef[];
  onPick: (relic: RoguelikeRelicDef) => void;
}

/**
 * Compact 3-Card Roguelike Awakening Picker
 * Fits horizontally without overflow on 390x844 mobile portrait & 844x390 landscape,
 * and supports Nintendo Switch Gamepad D-Pad Left/Right + A confirmation.
 */
export const RoguelikeCardModal: React.FC<RoguelikeCardModalProps> = ({
  open,
  title = '🌟 戰場知識覺醒・三選一強化',
  choices,
  onPick,
}) => {
  const [cursor, setCursor] = useState(1);

  useEffect(() => {
    if (!open) return;
    setCursor(Math.min(1, Math.max(0, choices.length - 1)));
  }, [open, choices]);

  useEffect(() => {
    if (!open || choices.length === 0) return;
    let prevLeft = false;
    let prevRight = false;
    const id = window.setInterval(() => {
      const snap = gamepadManager.poll();
      const p1 = snap.players.find((p) => p.connected);
      if (!p1) return;
      const left = p1.moveX < -0.5 || p1.justPressed.dpadLeft;
      const right = p1.moveX > 0.5 || p1.justPressed.dpadRight;
      if (left && !prevLeft) {
        soundEngine.playClick();
        setCursor((c) => (c + choices.length - 1) % choices.length);
      }
      if (right && !prevRight) {
        soundEngine.playClick();
        setCursor((c) => (c + 1) % choices.length);
      }
      if (p1.justPressed.confirm) {
        const chosen = choices[cursor];
        if (chosen) {
          soundEngine.playPerfectBell();
          onPick(chosen);
        }
      }
      prevLeft = p1.moveX < -0.5;
      prevRight = p1.moveX > 0.5;
    }, 75);
    return () => clearInterval(id);
  }, [open, choices, cursor, onPick]);

  if (!open || choices.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/82 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950 border-2 border-amber-400/70 p-3 sm:p-4 shadow-2xl space-y-3">
        <div className="text-center space-y-0.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            {title}
          </div>
          <p className="text-[11px] text-slate-300">
            點擊卡片或用 Switch 搖桿左右＋A 鍵立即獲得本場強化！
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {choices.map((card, idx) => {
            const focused = idx === cursor;
            return (
              <button
                key={card.id}
                type="button"
                onMouseEnter={() => setCursor(idx)}
                onClick={() => {
                  soundEngine.playPerfectBell();
                  onPick(card);
                }}
                className={`rounded-2xl p-2.5 sm:p-3.5 text-left border-2 flex flex-col justify-between gap-2 transition active:scale-95 ${
                  focused
                    ? 'bg-slate-800/95 border-amber-300 shadow-lg shadow-amber-400/25 -translate-y-0.5'
                    : 'bg-slate-900/85 border-white/15 hover:border-cyan-400/60'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl sm:text-3xl leading-none">{card.icon}</span>
                    <span
                      className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md text-slate-950"
                      style={{ backgroundColor: card.accent }}
                    >
                      覺醒
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white leading-tight">
                    {card.name}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold text-amber-200 leading-snug">
                    {card.shortEffect}
                  </div>
                </div>
                <div className="text-[10px] font-black text-center py-1 rounded-lg bg-white/10 text-cyan-200">
                  選擇強化
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
