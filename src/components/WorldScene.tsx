import React, { useId } from 'react';
import type { SubjectId } from '../types/game';

/** Lightweight original vector postcards. Decorative; names live in real text. */
export function WorldScene({ subject, className = '' }: { subject: SubjectId; className?: string }) {
  const id = useId().replace(/:/g, '');
  const palettes = {
    chinese: ['#402047', '#bb6271', '#ffd6a0'],
    english: ['#081d4e', '#3649a2', '#70f3f0'],
    math: ['#093c49', '#228b94', '#c8f4a3'],
    science: ['#46234b', '#be6d68', '#ffe7a1'],
  };
  const colors = palettes[subject];
  return (
    <svg viewBox="0 0 480 240" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1">
          <stop stopColor={colors[0]} /><stop offset="1" stopColor={colors[1]} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor={colors[2]} stopOpacity=".65" /><stop offset="1" stopColor={colors[2]} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path fill={`url(#${id}-sky)`} d="M0 0h480v240H0z" />
      <circle cx="350" cy="78" r="120" fill={`url(#${id}-glow)`} />
      {[ [35,28], [103,53], [196,25], [283,42], [421,29], [449,107], [60,109] ].map(([x,y]) =>
        <path key={x} d={`M${x-3} ${y}h6m-3-3v6`} stroke={colors[2]} strokeWidth="1.5" opacity=".7" />)}
      {subject === 'chinese' && <>
        <circle cx="354" cy="62" r="34" fill="#ffe8bc" />
        <path d="M0 176 71 81 137 165 218 69 310 177 399 113 480 179v61H0" fill="#5a375c" />
        <path d="m0 207 110-68 82 68 101-79 110 80 77-32v64H0" fill="#392b48" />
        <path d="M214 240q35-48 19-77h38q-25 38 37 77" fill="#f2c1a2" opacity=".6" />
        <g fill="#35253e" stroke="#e8b588" strokeWidth="2">
          <path d="M287 163v-29h71v29m-61-29v-27h51v27" />
          <path d="m274 136 49-27 49 27zm10-28 39-27 39 27z" fill="#7d4059" />
        </g>
        <path d="M55 227Q80 151 66 94m5 40 38-23m-38 44-30-24" fill="none" stroke="#37233f" strokeWidth="9" />
        {[ [65,93], [85,112], [42,124], [108,101], [57,143] ].map(([x,y]) => <g key={x} fill="#ffb3ca"><circle cx={x} cy={y} r="16"/><circle cx={x+15} cy={y-7} r="12"/></g>)}
        <path d="M0 231q108-42 196 0t284-4v13H0" fill="#24243b" />
      </>}
      {subject === 'english' && <>
        <circle cx="368" cy="65" r="40" fill="#a7b4ef" opacity=".9" />
        <ellipse cx="368" cy="65" rx="68" ry="13" transform="rotate(-22 368 65)" fill="none" stroke="#d2a4f7" strokeWidth="6" />
        <path d="m0 227 57-47 50 9 57-46 73 61 97-45 70 21 76-58v118H0" fill="#15264e" />
        <g fill="#243f73" stroke="#67dfe5" strokeWidth="2"><path d="M70 212v-75h24v75m-9-75V97m-28 73h50m271 53v-70h22v70m-12-70v-32"/></g>
        <g transform="translate(235 112) rotate(12)">
          <path d="m0-66 20 58 49 38-56-12L0 43l-13-25-56 12 49-38z" fill="#dbeffa" stroke="#71fbf5" strokeWidth="3" />
          <path d="m0-39 8 33L0 10-8-6z" fill="#3060aa" />
          <path d="m-7 37 7 36 7-36" fill="#9bfcfa" />
        </g>
        <g stroke="#81f9f2" strokeWidth="3" opacity=".7"><path d="m157 107 6-27m142 34 6-27m-108 87 6-19"/></g>
        <path d="M0 233h480" stroke="#61f6f0" strokeWidth="2" opacity=".6" />
      </>}
      {subject === 'math' && <>
        <circle cx="367" cy="61" r="32" fill="#e6ffc2" />
        <path d="m0 169 76-48 79 53 101-69 109 58 115-63v140H0" fill="#367c79" />
        <path d="M0 215q119-79 250-12t230-17v54H0" fill="#175557" />
        <path d="m85 240 113-77 80 15-56 62" fill="#b4ba89" />
        <g stroke="#e2ebc2" strokeWidth="3" fill="#72ada0">
          <path d="M270 203v-84h88v84zm-15-84 59-49 59 49z" />
          <path d="M246 209v-60h-39v60m-9-60 28-34 29 34zm114-26v-35h39v35m-49-35 29-34 29 34z" />
        </g>
        <path d="M297 203v-34q17-25 34 0v34" fill="#244c50" />
        <g fill="#f0e7a2"><path d="M286 130h14v18h-14zm42 0h14v18h-14z"/><path d="m96 120 15-30 15 30-15 30z"/></g>
        <circle cx="97" cy="186" r="19" fill="#e7cd87" stroke="#fff2bb" strokeWidth="3" />
        <path d="M87 186h20m-10-10v20" stroke="#6a806c" strokeWidth="4" />
      </>}
      {subject === 'science' && <>
        <path d="M0 177q90-67 179-10t301-14v87H0" fill="#69475c" />
        <path d="M0 220q107-53 245-7t235-11v38H0" fill="#372e47" />
        <g stroke="#ffe6b2" strokeWidth="3">
          <path d="M150 180q-26-22-14-49l20-39V57h30v35l20 39q12 27-14 49z" fill="#add8c5" />
          <path d="M143 139h57q12 26-12 33h-36q-15-8-9-33" fill="#61c8ad" />
          <path d="M130 56h62" />
          <path d="M252 180v-46h86v46" fill="#edaa7c" />
          <path d="M245 134h100m-94-7q-12-29 17-29-2-29 25-21 29-10 31 19 28-1 15 31" fill="#fff0d0" />
        </g>
        <g fill="none" stroke="#e8f3c4" strokeWidth="3" opacity=".7"><path d="M270 58q-12-12 0-24m26 28q12-12 0-24m-138 78 6-9"/></g>
        <circle cx="381" cy="119" r="21" fill="#ffe29c" />
        <path d="m381 98q-5-32 22-33-1 24-22 33" fill="#a7d394" />
        <g fill="#f8d88f"><circle cx="164" cy="148" r="4"/><circle cx="181" cy="160" r="3"/></g>
      </>}
    </svg>
  );
}
