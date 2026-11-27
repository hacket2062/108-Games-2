import { useEffect, useState } from 'react';

export type GamepadButtonAction =
  | 'confirm' // Switch A (Right) / Option A
  | 'cancel' // Switch B (Down) / Dash / Option B
  | 'skill1' // Switch X (Up) / Option C
  | 'skill2' // Switch Y (Left) / Option D
  | 'ult' // L / R / ZL / ZR
  | 'tabLeft' // L
  | 'tabRight' // R
  | 'pause' // + (Plus)
  | 'dpadUp'
  | 'dpadDown'
  | 'dpadLeft'
  | 'dpadRight';

export interface PlayerGamepadState {
  slot: 0 | 1 | 2 | 3; // 1P..4P
  connected: boolean;
  label: string;
  color: string;
  name: string;
  moveX: number; // -1..1 deadzone-filtered
  moveY: number; // -1..1 deadzone-filtered
  pressed: Record<GamepadButtonAction, boolean>;
  justPressed: Record<GamepadButtonAction, boolean>;
}

export interface GamepadSnapshot {
  players: PlayerGamepadState[];
  connectedCount: number;
  singleJoyConMode: boolean;
}

export const PLAYER_SLOT_THEMES = [
  { slot: 0 as const, label: '1P', color: '#38BDF8', name: '湛藍主機' },
  { slot: 1 as const, label: '2P', color: '#F43F5E', name: '霓虹緋紅' },
  { slot: 2 as const, label: '3P', color: '#FBBF24', name: '琥珀金光' },
  { slot: 3 as const, label: '4P', color: '#34D399', name: '翡翠疾風' },
];

const DEADZONE = 0.18;

export function applyDeadzone(value: number, deadzone = DEADZONE): number {
  if (!Number.isFinite(value) || Math.abs(value) < deadzone) return 0;
  const sign = value < 0 ? -1 : 1;
  return sign * ((Math.abs(value) - deadzone) / (1 - deadzone));
}

/**
 * Rotates analog stick axes by 90 degrees when a single Nintendo Switch Joy-Con
 * is held sideways (horizontal mode).
 */
export function transformStickForJoyCon(
  rawX: number,
  rawY: number,
  singleJoyConMode: boolean,
  isRightJoyCon = false
): { x: number; y: number } {
  const fx = applyDeadzone(rawX);
  const fy = applyDeadzone(rawY);
  if (!singleJoyConMode) return { x: fx, y: fy };
  // Left Joy-Con sideways: vertical up (+X) becomes screen up (-Y), etc.
  if (isRightJoyCon) {
    return { x: -fy, y: fx };
  }
  return { x: fy, y: -fx };
}

function emptyButtons(): Record<GamepadButtonAction, boolean> {
  return {
    confirm: false,
    cancel: false,
    skill1: false,
    skill2: false,
    ult: false,
    tabLeft: false,
    tabRight: false,
    pause: false,
    dpadUp: false,
    dpadDown: false,
    dpadLeft: false,
    dpadRight: false,
  };
}

function createEmptyPlayer(slot: 0 | 1 | 2 | 3): PlayerGamepadState {
  const t = PLAYER_SLOT_THEMES[slot];
  return {
    slot,
    connected: false,
    label: t.label,
    color: t.color,
    name: t.name,
    moveX: 0,
    moveY: 0,
    pressed: emptyButtons(),
    justPressed: emptyButtons(),
  };
}

function readBtn(gp: Gamepad, idx: number): boolean {
  const b = gp.buttons[idx];
  return Boolean(b && (b.pressed || b.value > 0.55));
}

/**
 * Standard HTML5 Gamepad API manager supporting up to 4 simultaneous
 * Nintendo Switch Pro Controllers and Single/Dual Joy-Con controllers.
 */
class GamepadManager {
  private singleJoyConMode = false;
  private prevPressed: Record<GamepadButtonAction, boolean>[] = [
    emptyButtons(),
    emptyButtons(),
    emptyButtons(),
    emptyButtons(),
  ];
  private players: PlayerGamepadState[] = [
    createEmptyPlayer(0),
    createEmptyPlayer(1),
    createEmptyPlayer(2),
    createEmptyPlayer(3),
  ];
  private listeners = new Set<() => void>();
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initEvents();
    }
  }

  private initEvents() {
    if (this.initialized) return;
    this.initialized = true;
    const notify = () => {
      this.poll();
      this.emit();
    };
    window.addEventListener('gamepadconnected', notify);
    window.addEventListener('gamepaddisconnected', notify);
  }

  public setSingleJoyConMode(enabled: boolean): void {
    this.singleJoyConMode = enabled;
    this.emit();
  }

  public isSingleJoyConMode(): boolean {
    return this.singleJoyConMode;
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  public poll(): GamepadSnapshot {
    const rawPads =
      typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function'
        ? Array.from(navigator.getGamepads()).filter((g): g is Gamepad => Boolean(g && g.connected))
        : [];

    let connectedCount = 0;

    for (let slot = 0; slot < 4; slot++) {
      const gp = rawPads[slot];
      const p = this.players[slot];
      const prev = this.prevPressed[slot];

      if (!gp) {
        p.connected = false;
        p.moveX = 0;
        p.moveY = 0;
        p.pressed = emptyButtons();
        p.justPressed = emptyButtons();
        this.prevPressed[slot] = emptyButtons();
        continue;
      }

      connectedCount += 1;
      p.connected = true;
      const idLower = (gp.id || '').toLowerCase();
      const isRightJoyCon = idLower.includes('joy-con (r)') || idLower.includes('joy-con r');
      const isJoyCon = idLower.includes('joy-con');
      const useSideways = this.singleJoyConMode || (isJoyCon && !idLower.includes('l+r') && !idLower.includes('combined'));

      const rawAxisX = gp.axes[0] ?? 0;
      const rawAxisY = gp.axes[1] ?? 0;
      const stick = transformStickForJoyCon(rawAxisX, rawAxisY, useSideways, isRightJoyCon);

      const dUp = readBtn(gp, 12);
      const dDown = readBtn(gp, 13);
      const dLeft = readBtn(gp, 14);
      const dRight = readBtn(gp, 15);

      let mx = stick.x;
      let my = stick.y;
      if (dLeft) mx = -1;
      else if (dRight) mx = 1;
      if (dUp) my = -1;
      else if (dDown) my = 1;

      p.moveX = Math.max(-1, Math.min(1, mx));
      p.moveY = Math.max(-1, Math.min(1, my));

      // Standard Nintendo Switch mapping:
      // Button 1 = A (Right) on Switch Pro / standard gamepad right-face button,
      // Button 0 = B (Down) or primary confirm on XInput — map cleanly with Joy-Con sideways rotation!
      const next: Record<GamepadButtonAction, boolean> = useSideways
        ? {
            confirm: readBtn(gp, 1) || readBtn(gp, 0),
            cancel: readBtn(gp, 2),
            skill1: readBtn(gp, 3),
            skill2: readBtn(gp, 0) && !readBtn(gp, 1),
            ult: readBtn(gp, 4) || readBtn(gp, 5) || readBtn(gp, 6) || readBtn(gp, 7),
            tabLeft: readBtn(gp, 4),
            tabRight: readBtn(gp, 5),
            pause: readBtn(gp, 9) || readBtn(gp, 8),
            dpadUp: my < -0.55 || dUp,
            dpadDown: my > 0.55 || dDown,
            dpadLeft: mx < -0.55 || dLeft,
            dpadRight: mx > 0.55 || dRight,
          }
        : {
            confirm: readBtn(gp, 0) || readBtn(gp, 1), // Supports both Switch A (1) and standard A (0)
            cancel: readBtn(gp, 1) && readBtn(gp, 0) ? false : readBtn(gp, 1),
            skill1: readBtn(gp, 2),
            skill2: readBtn(gp, 3),
            ult: readBtn(gp, 4) || readBtn(gp, 5) || readBtn(gp, 6) || readBtn(gp, 7),
            tabLeft: readBtn(gp, 4) || readBtn(gp, 6),
            tabRight: readBtn(gp, 5) || readBtn(gp, 7),
            pause: readBtn(gp, 9),
            dpadUp: dUp || my < -0.6,
            dpadDown: dDown || my > 0.6,
            dpadLeft: dLeft || mx < -0.6,
            dpadRight: dRight || mx > 0.6,
          };

      const just = emptyButtons();
      (Object.keys(next) as GamepadButtonAction[]).forEach((k) => {
        just[k] = next[k] && !prev[k];
      });

      p.pressed = next;
      p.justPressed = just;
      this.prevPressed[slot] = { ...next };
    }

    return {
      players: this.players.map((p) => ({
        ...p,
        pressed: { ...p.pressed },
        justPressed: { ...p.justPressed },
      })),
      connectedCount,
      singleJoyConMode: this.singleJoyConMode,
    };
  }

  public getSnapshot(): GamepadSnapshot {
    return {
      players: this.players.map((p) => ({
        ...p,
        pressed: { ...p.pressed },
        justPressed: { ...p.justPressed },
      })),
      connectedCount: this.players.filter((p) => p.connected).length,
      singleJoyConMode: this.singleJoyConMode,
    };
  }
}

export const gamepadManager = new GamepadManager();

/**
 * Lightweight React hook for Lobby / Modals to display 1P..4P Switch controller pills
 * and handle menu navigation via Gamepad without 60Hz re-render spam.
 */
export function useGamepadStatus(onAction?: (slot: number, action: GamepadButtonAction) => void) {
  const [snap, setSnap] = useState<GamepadSnapshot>(() => gamepadManager.getSnapshot());

  useEffect(() => {
    const unsub = gamepadManager.subscribe(() => setSnap(gamepadManager.getSnapshot()));
    let prevConnected = -1;
    const id = window.setInterval(() => {
      const next = gamepadManager.poll();
      if (next.connectedCount !== prevConnected) {
        prevConnected = next.connectedCount;
        setSnap(next);
      }
      if (onAction) {
        for (const p of next.players) {
          if (!p.connected) continue;
          (Object.keys(p.justPressed) as GamepadButtonAction[]).forEach((k) => {
            if (p.justPressed[k]) onAction(p.slot, k);
          });
        }
      }
    }, 90);
    return () => {
      unsub();
      window.clearInterval(id);
    };
  }, [onAction]);

  return {
    ...snap,
    setSingleJoyConMode: (v: boolean) => gamepadManager.setSingleJoyConMode(v),
  };
}
