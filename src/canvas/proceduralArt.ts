import type { GuardianId } from '../types/game';
import { GUARDIANS } from '../data/guardians';
import type { EquipmentAppearance } from '../core/equipmentAppearance';
import type { ZombieKind } from '../core/mathDefense';
import { drawArtCell, drawChapterBoss, drawCompanionMotion, drawEquippedHero, drawPaintedUnit, drawUpgradeRig, drawWorldAvatar, drawZombieArt } from './spriteArt';

// ============================================================================
// Zero-GC Pooled Particle Ring Buffer & RO-Style Floating Damage Numbers
// ============================================================================

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  shape: 'circle' | 'spark' | 'ring' | 'petal' | 'ink';
}

export class ParticlePool {
  public readonly items: Particle[];
  private cursor = 0;

  constructor(capacity = 320) {
    this.items = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      color: '#ffffff',
      alpha: 1,
      life: 0,
      maxLife: 0.5,
      gravity: 0,
      shape: 'circle',
    }));
  }

  public spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size = 5,
    maxLife = 0.55,
    gravity = 160,
    shape: Particle['shape'] = 'circle'
  ) {
    const p = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.items.length;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.color = color;
    p.size = size;
    p.alpha = 1;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.gravity = gravity;
    p.shape = shape;
  }

  public burst(
    x: number,
    y: number,
    count: number,
    colors: string[],
    speedMin = 60,
    speedMax = 240,
    size = 6,
    shape: Particle['shape'] = 'circle',
    gravity = 180
  ) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = speedMin + Math.random() * (speedMax - speedMin);
      const col = colors[i % colors.length];
      this.spawn(
        x,
        y,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        col,
        size * (0.7 + Math.random() * 0.6),
        0.35 + Math.random() * 0.4,
        gravity,
        shape
      );
    }
  }

  public update(dt: number) {
    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      if (!p.active) continue;
      ctx.globalAlpha = p.alpha;
      if (p.shape === 'ring') {
        const progress = 1 - p.life / p.maxLife;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.5, 5 * p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size + progress * 48, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.5, p.size * 0.45);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      } else if (p.shape === 'petal') {
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 4);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + p.alpha * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  subText: string;
  color: string;
  strokeColor: string;
  scale: number;
  life: number;
  maxLife: number;
}

export class FloatingTextPool {
  public readonly items: FloatingText[];
  private cursor = 0;

  constructor(capacity = 48) {
    this.items = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      text: '',
      subText: '',
      color: '#FBBF24',
      strokeColor: '#0F172A',
      scale: 1,
      life: 0,
      maxLife: 0.9,
    }));
  }

  public spawn(
    x: number,
    y: number,
    text: string,
    style: 'normal' | 'crit' | 'perfect' | 'heal' | 'miss' = 'normal',
    subText = ''
  ) {
    const f = this.items[this.cursor];
    this.cursor = (this.cursor + 1) % this.items.length;
    f.active = true;
    f.x = x + (Math.random() - 0.5) * 20;
    f.y = y;
    f.vx = (Math.random() - 0.5) * 42;
    f.vy = style === 'crit' || style === 'perfect' ? -185 : -135;
    f.text = text;
    f.subText = subText;
    f.maxLife = style === 'crit' || style === 'perfect' ? 1.05 : 0.82;
    f.life = f.maxLife;
    f.scale = style === 'crit' ? 1.4 : style === 'perfect' ? 1.32 : 1.0;
    if (style === 'perfect') {
      f.color = '#FDE047';
      f.strokeColor = '#78350F';
    } else if (style === 'crit') {
      f.color = '#FB7185';
      f.strokeColor = '#4C0519';
    } else if (style === 'heal') {
      f.color = '#4ADE80';
      f.strokeColor = '#064E3B';
    } else if (style === 'miss') {
      f.color = '#CBD5E1';
      f.strokeColor = '#1E293B';
    } else {
      f.color = '#FFFFFF';
      f.strokeColor = '#0F172A';
    }
  }

  public update(dt: number) {
    for (let i = 0; i < this.items.length; i++) {
      const f = this.items[i];
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        continue;
      }
      f.vy += 420 * dt; // RO bouncy arc!
      f.x += f.vx * dt;
      f.y += f.vy * dt;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.items.length; i++) {
      const f = this.items[i];
      if (!f.active) continue;
      const progress = 1 - f.life / f.maxLife;
      const pop = progress < 0.16 ? 0.65 + (progress / 0.16) * 0.55 : 1.15 - progress * 0.25;
      const alpha = progress > 0.72 ? Math.max(0, (1 - progress) / 0.28) : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(f.x, f.y);
      ctx.scale(f.scale * pop, f.scale * pop);
      ctx.font = '900 24px "Fredoka", "Noto Sans TC", sans-serif';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = f.strokeColor;
      ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, 0, 0);
      if (f.subText) {
        ctx.font = '800 12px "Fredoka", "Noto Sans TC", sans-serif';
        ctx.lineWidth = 3.5;
        ctx.strokeText(f.subText, 0, -20);
        ctx.fillStyle = '#FEF08A';
        ctx.fillText(f.subText, 0, -20);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}

export interface GameFeelState {
  hitstop: number;
  shakeTrauma: number;
  flashAlpha: number;
  flashColor: string;
}

export function createGameFeel(): GameFeelState {
  return { hitstop: 0, shakeTrauma: 0, flashAlpha: 0, flashColor: '#ffffff' };
}

export function triggerGameFeel(
  feel: GameFeelState,
  opts: { hitstop?: number; shake?: number; flash?: number; flashColor?: string }
) {
  if (opts.hitstop) feel.hitstop = Math.max(feel.hitstop, opts.hitstop);
  if (opts.shake) feel.shakeTrauma = Math.min(1, feel.shakeTrauma + opts.shake);
  if (opts.flash) {
    feel.flashAlpha = Math.max(feel.flashAlpha, opts.flash);
    feel.flashColor = opts.flashColor ?? '#ffffff';
  }
}

export function updateGameFeel(feel: GameFeelState, dt: number): {
  simDt: number;
  shakeX: number;
  shakeY: number;
} {
  if (feel.shakeTrauma > 0) {
    feel.shakeTrauma = Math.max(0, feel.shakeTrauma - dt * 2.4);
  }
  if (feel.flashAlpha > 0) {
    feel.flashAlpha = Math.max(0, feel.flashAlpha - dt * 3.2);
  }
  const mag = feel.shakeTrauma * feel.shakeTrauma * 14;
  const shakeX = mag > 0.1 ? (Math.random() * 2 - 1) * mag : 0;
  const shakeY = mag > 0.1 ? (Math.random() * 2 - 1) * mag : 0;

  if (feel.hitstop > 0) {
    feel.hitstop = Math.max(0, feel.hitstop - dt);
    return { simDt: 0, shakeX, shakeY };
  }
  return { simDt: dt, shakeX, shakeY };
}

// ============================================================================
// Procedural Vector Art: Q-Version 2.5-Head-Ratio Skeletal Characters
// ============================================================================

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawGuardianSpirit(
  ctx: CanvasRenderingContext2D,
  guardianId: GuardianId,
  x: number,
  y: number,
  time: number,
  scale = 1,
  happyBounce = 0
) {
  const cfg = GUARDIANS[guardianId];
  const bob = Math.sin(time * 3.4) * 5 - happyBounce * 14;
  const wingFlap = Math.sin(time * 7.2) * 0.25;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);

  // Soft ground shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
  ctx.beginPath();
  ctx.ellipse(0, 36 - bob * 0.5, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Aura ring
  ctx.strokeStyle = cfg.primaryColor;
  ctx.globalAlpha = 0.28 + Math.sin(time * 4) * 0.1;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Wings or flowing tail
  ctx.save();
  if (guardianId === 'griffin' || guardianId === 'stardragon') {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(wingFlap);
      ctx.fillStyle = guardianId === 'stardragon' ? cfg.accentColor : cfg.accentColor;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(10, 2);
      ctx.quadraticCurveTo(36, -20, 40, -2);
      ctx.quadraticCurveTo(32, 16, 12, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // Ink cloud / foliage tail
    ctx.fillStyle = cfg.primaryColor;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-22, 12 + Math.sin(time * 5) * 3, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Chibi Body
  ctx.fillStyle = cfg.secondaryColor;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, 14, 15, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belly Crest
  ctx.fillStyle = cfg.accentColor;
  ctx.beginPath();
  ctx.ellipse(0, 16, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Feet
  ctx.fillStyle = cfg.primaryColor;
  for (const fx of [-8, 8]) {
    ctx.beginPath();
    ctx.ellipse(fx, 26, 5.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Big Q-Version Head (2.5 head ratio)
  ctx.fillStyle = cfg.primaryColor;
  ctx.beginPath();
  ctx.arc(0, -7, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner face
  ctx.fillStyle = cfg.accentColor;
  ctx.beginPath();
  ctx.ellipse(0, -3, 15, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Horns / Antlers / Crest
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.5;
  if (guardianId === 'qilin') {
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(7, -23);
    ctx.lineTo(-7, -23);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (guardianId === 'stardragon') {
    ctx.fillStyle = '#38BDF8';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 10, -22);
      ctx.lineTo(side * 19, -35);
      ctx.lineTo(side * 4, -26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (guardianId === 'griffin') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(-6, -24);
    ctx.lineTo(0, -37);
    ctx.lineTo(6, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Deer antlers with green sprouts
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 3.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * 9, -23);
      ctx.lineTo(side * 16, -37);
      ctx.moveTo(side * 13, -31);
      ctx.lineTo(side * 22, -31);
      ctx.stroke();
      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.arc(side * 17, -38, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Expressive Eyes
  if (happyBounce > 0.15) {
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.8;
    for (const ex of [-7, 7]) {
      ctx.beginPath();
      ctx.arc(ex, -6, 4.5, Math.PI, 0);
      ctx.stroke();
    }
  } else {
    for (const ex of [-7, 7]) {
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.ellipse(ex, -6, 3.6, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 1.2, -7.8, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Cute rosy cheeks & smile
  ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-11, -1, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(11, -1, 3.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -1, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

export type InkHeroRole = 'swordsman' | 'craneMage' | 'pandaHealer';

export function drawInkChibiHero(
  ctx: CanvasRenderingContext2D,
  role: InkHeroRole,
  x: number,
  y: number,
  time: number,
  opts: {
    facing?: 1 | -1;
    appearance?: EquipmentAppearance;
    walkPhase?: number;
    moving?: boolean;
    attackProgress?: number; // 0..1
    hitFlash?: number;
    label?: string;
    scale?: number;
  } = {}
) {
  const facing = opts.facing ?? 1;
  const walk = opts.walkPhase ?? 0;
  const atk = opts.attackProgress ?? 0;
  const scale = opts.scale ?? 1;
  const bob = Math.abs(Math.sin(walk * 8)) * -4 + Math.sin(time * 4.2) * 2.2;
  const legSwing = Math.sin(walk * 8) * 6;
  if (role === 'swordsman' && opts.appearance && drawEquippedHero(ctx,x,y,time,opts.appearance,facing,scale,atk,Boolean(opts.moving),walk,opts.hitFlash)) return;
  if(role!=='swordsman' && drawCompanionMotion(ctx,role,x,y,time,opts))return;
  if(role!=='swordsman' && drawPaintedUnit(ctx,role==='pandaHealer'?0:1,x,y+bob,time,{scale,facing,hitFlash:opts.hitFlash,label:opts.label}))return;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Ground shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.scale(facing, 1);
  ctx.translate(0, bob);

  // Cape / Robe trailing
  ctx.fillStyle = role === 'swordsman' ? '#DC2626' : role === 'craneMage' ? '#0EA5E9' : '#10B981';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-20 - Math.sin(time * 6) * 3, 20);
  ctx.lineTo(4, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Legs
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.ellipse(-6 + legSwing * 0.5, 21, 5, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(6 - legSwing * 0.5, 21, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Torso
  ctx.fillStyle = role === 'swordsman' ? '#1E3A8A' : role === 'craneMage' ? '#F8FAFC' : '#FEF3C7';
  drawRoundedRect(ctx, -12, -2, 24, 21, 8);
  ctx.fill();
  ctx.stroke();

  // Gold belt sash
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(-11, 10, 22, 4);

  // Big Chibi Head
  const headColor = role === 'pandaHealer' ? '#FFFFFF' : role === 'craneMage' ? '#F8FAFC' : '#FDE68A';
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(0, -15, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (role === 'swordsman') {
    // Ink headband & spiky hair
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(0, -18, 17, Math.PI, 0);
    ctx.lineTo(14, -27);
    ctx.lineTo(4, -24);
    ctx.lineTo(-4, -31);
    ctx.lineTo(-14, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-16, -21, 32, 4.5);
  } else if (role === 'craneMage') {
    // Red crane crown + feather hat
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, -31, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(14, -14);
    ctx.lineTo(24, -11);
    ctx.lineTo(14, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Panda ears + eye patches + jade hairpin
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-13, -29, 6.5, 0, Math.PI * 2);
    ctx.arc(13, -29, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.ellipse(-5, -14, 5, 4, -0.2, 0, Math.PI * 2);
    ctx.ellipse(7, -14, 5, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  for (const ex of [-5, 7]) {
    ctx.fillStyle = role === 'pandaHealer' ? '#FFFFFF' : '#0F172A';
    ctx.beginPath();
    ctx.arc(ex, -14, role === 'pandaHealer' ? 2.2 : 3, 0, Math.PI * 2);
    ctx.fill();
    if (role !== 'pandaHealer') {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 1, -15.2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Weapon Arm + Attack Swing Arc
  const swingAngle = atk > 0 ? -1.4 + atk * 3.1 : Math.sin(time * 4) * 0.1;
  ctx.save();
  ctx.translate(10, 4);
  ctx.rotate(swingAngle);
  if (role === 'swordsman') {
    // Ink Brush Katana
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-2, -2, 6, 10);
    ctx.fillStyle = '#E2E8F0';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(5, -34);
    ctx.lineTo(-1, -30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (atk > 0.2 && atk < 0.85) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, 36, -1.2, 0.8);
      ctx.stroke();
    }
  } else if (role === 'craneMage') {
    // Calligraphy Staff
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, -28);
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(0, -31, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Jade Seal Stamp
    ctx.fillStyle = '#10B981';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, -6, -14, 14, 14, 3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Hit flash white overlay
  if (opts.hitFlash && opts.hitFlash > 0) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, opts.hitFlash)})`;
    ctx.fillRect(-35, -45, 75, 80);
  }
  ctx.restore();

  // RO-style Overhead Nameplate
  if (opts.label) {
    ctx.font = '700 12px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeText(opts.label, 0, -40);
    ctx.fillStyle = '#FEF3C7';
    ctx.fillText(opts.label, 0, -40);
  }

  ctx.restore();
}

export function drawInkMonster(
  ctx: CanvasRenderingContext2D,
  kind: 'poring' | 'slime' | 'boss',
  x: number,
  y: number,
  time: number,
  opts: { hitFlash?: number; shielded?: boolean; hpRatio?: number; name?: string; scale?: number; chapter?:number;supreme?:boolean;moving?:boolean;attacking?:boolean } = {}
) {
  const scale = opts.scale ?? (kind === 'boss' ? 1.45 : 1);
  if(kind==='boss'&&drawChapterBoss(ctx,x,y,time,{...opts,scale}))return;
  if(drawPaintedUnit(ctx,kind==='poring'?2:kind==='slime'?3:opts.name?.includes('王')?5:4,x,y,time,{scale,hitFlash:opts.hitFlash,shielded:opts.shielded,hpRatio:opts.hpRatio,label:opts.name}))return;
  const squishX = 1 + Math.sin(time * 5.2) * 0.08;
  const squishY = 1 - Math.sin(time * 5.2) * 0.08;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.scale(squishX, squishY);

  if (kind === 'poring') {
    // Cute RO-style Typo Poring
    ctx.fillStyle = '#FB7185';
    ctx.strokeStyle = '#881337';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-22, 16);
    ctx.quadraticCurveTo(-24, -18, 0, -24);
    ctx.quadraticCurveTo(24, -18, 22, 16);
    ctx.quadraticCurveTo(0, 22, -22, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Specular jelly shine
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-9, -10, 6, 3.5, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Typo tag on forehead
    ctx.fillStyle = '#FEF3C7';
    ctx.font = '900 13px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('錯', 0, -6);
  } else if (kind === 'slime') {
    ctx.fillStyle = '#8B5CF6';
    ctx.strokeStyle = '#3B0764';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, 22, Math.PI, 0);
    ctx.lineTo(24, 16);
    ctx.quadraticCurveTo(0, 22, -24, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#EDE9FE';
    ctx.font = '900 13px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('病', 0, -5);
  } else {
    // Glitch Ink Boss Demon
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-26, 20);
    ctx.lineTo(-22, -22);
    ctx.lineTo(-10, -34);
    ctx.lineTo(0, -22);
    ctx.lineTo(10, -34);
    ctx.lineTo(22, -22);
    ctx.lineTo(26, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing rune core
    ctx.fillStyle = '#F43F5E';
    ctx.font = '900 16px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('亂', 0, -10);
  }

  // Eyes
  ctx.fillStyle = kind === 'boss' ? '#FDE047' : '#0F172A';
  ctx.beginPath();
  ctx.arc(-8, 4, 3.3, 0, Math.PI * 2);
  ctx.arc(8, 4, 3.3, 0, Math.PI * 2);
  ctx.fill();

  if (opts.hitFlash && opts.hitFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, opts.hitFlash)})`;
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Shield Aura
  if (opts.shielded) {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 32, time * 2, time * 2 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Name & HP bar
  if (opts.name) {
    ctx.font = '700 11px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0F172A';
    ctx.strokeText(opts.name, 0, -34);
    ctx.fillStyle = kind === 'boss' ? '#FDA4AF' : '#FFFFFF';
    ctx.fillText(opts.name, 0, -34);
  }
  if (opts.hpRatio !== undefined) {
    const bw = 46;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    drawRoundedRect(ctx, -bw / 2, 26, bw, 7, 3);
    ctx.fill();
    ctx.fillStyle = kind === 'boss' ? '#F43F5E' : '#22C55E';
    drawRoundedRect(ctx, -bw / 2 + 1, 27, Math.max(0, (bw - 2) * opts.hpRatio), 5, 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawMechaShip(
  ctx: CanvasRenderingContext2D,
  variant: 'blaster' | 'falcon',
  x: number,
  y: number,
  time: number,
  tilt = 0,
  shielded = false,
  hitFlash = 0,
  appearance?: EquipmentAppearance
) {
  if(drawWorldAvatar(ctx,'ship',x,y,time,appearance,tilt,shielded,hitFlash))return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt * 0.22);
  if (appearance) drawUpgradeRig(ctx,0,0,appearance,time,1);

  // Thruster flames
  const flameLen = 18 + Math.sin(time * 40) * 6;
  const grad = ctx.createLinearGradient(0, 16, 0, 16 + flameLen);
  grad.addColorStop(0, '#FEF08A');
  grad.addColorStop(0.5, variant === 'blaster' ? '#06B6D4' : '#EC4899');
  grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = grad;
  for (const tx of [-10, 10]) {
    ctx.beginPath();
    ctx.moveTo(tx - 4, 15);
    ctx.lineTo(tx, 16 + flameLen);
    ctx.lineTo(tx + 4, 15);
    ctx.closePath();
    ctx.fill();
  }

  // Wings
  ctx.fillStyle = variant === 'blaster' ? '#0284C7' : '#DB2777';
  ctx.strokeStyle = '#E0F2FE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(28, 12);
  ctx.lineTo(14, 18);
  ctx.lineTo(0, 10);
  ctx.lineTo(-14, 18);
  ctx.lineTo(-28, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Core fuselage
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.lineTo(11, 8);
  ctx.lineTo(0, 16);
  ctx.lineTo(-11, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glowing canopy cockpit
  ctx.fillStyle = variant === 'blaster' ? '#22D3EE' : '#F472B6';
  ctx.beginPath();
  ctx.ellipse(0, -6, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing laser pods
  ctx.fillStyle = '#FACC15';
  ctx.fillRect(-22, 0, 4, 12);
  ctx.fillRect(18, 0, 4, 12);

  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, hitFlash)})`;
    ctx.beginPath();
    ctx.arc(0, -4, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  if (shielded) {
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -2, 34, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export type MathTowerKind = 'beaver' | 'raccoon' | 'owl' | 'hedgehog' | 'flame' | 'prism';

export function drawMathTower(
  ctx: CanvasRenderingContext2D,
  kind: MathTowerKind,
  x: number,
  y: number,
  time: number,
  overclocked = false,
  overheated = false,
  recoil = 0
) {
  const bob = Math.sin(time * 4.5) * 2.5;
  const towerCell={beaver:6,raccoon:7,owl:8,hedgehog:9,flame:10,prism:11}[kind];
  if(drawPaintedUnit(ctx,towerCell,x-recoil*3,y,time,{hitFlash:overheated?1:0,shielded:overclocked}))return;
  if (kind === 'flame' || kind === 'prism') {
    ctx.save();ctx.translate(x,y);ctx.fillStyle='#26324b';ctx.strokeStyle=kind==='flame'?'#ff9a66':'#d8b5ff';ctx.lineWidth=3;
    drawRoundedRect(ctx,-23,0,46,26,6);ctx.fill();ctx.stroke();
    if(kind==='flame'){ctx.fillStyle='#9c3f36';drawRoundedRect(ctx,-15,-19,44,23,6);ctx.fill();ctx.stroke();ctx.fillStyle='#ffd280';ctx.beginPath();ctx.moveTo(28,-4);ctx.lineTo(43,-11);ctx.lineTo(29,-17);ctx.closePath();ctx.fill();}
    else{ctx.fillStyle='#8f80d8';ctx.beginPath();ctx.moveTo(0,-42+bob);ctx.lineTo(20,-15+bob);ctx.lineTo(0,7+bob);ctx.lineTo(-20,-15+bob);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,-16,30,8,0,0,Math.PI*2);ctx.stroke();}
    ctx.restore();return;
  }
  ctx.save();
  ctx.translate(x, y);

  // Base platform
  ctx.fillStyle = overclocked ? '#F59E0B' : '#334155';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 18, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (overclocked) {
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 4, 30 + Math.sin(time * 12) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(-recoil * 6, bob);

  if (kind === 'beaver') {
    // Beaver Gear Producer
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.arc(0, 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Spinning Golden Gear behind head
    ctx.save();
    ctx.translate(0, -14);
    ctx.rotate(time * (overclocked ? 6 : 2.5));
    ctx.fillStyle = '#FACC15';
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -15, 6, 6);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // Hard hat
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, -4, 14, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'raccoon') {
    // Raccoon Multiply Gatling Turret
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Twin gun barrels
    ctx.fillStyle = '#38BDF8';
    drawRoundedRect(ctx, 8, -8, 20, 6, 2);
    ctx.fill();
    ctx.stroke();
    drawRoundedRect(ctx, 8, 2, 20, 6, 2);
    ctx.fill();
    ctx.stroke();
    // Raccoon mask
    ctx.fillStyle = '#1E293B';
    drawRoundedRect(ctx, -12, -8, 20, 8, 4);
    ctx.fill();
  } else if (kind === 'owl') {
    // Owl Frost Geometry Mage
    ctx.fillStyle = '#0EA5E9';
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Floating Frost Triangle
    ctx.save();
    ctx.translate(0, -22);
    ctx.rotate(time * 2.5);
    ctx.strokeStyle = '#67E8F9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(9, 7);
    ctx.lineTo(-9, 7);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // Owl glasses
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(-6, -3, 5.5, 0, Math.PI * 2);
    ctx.arc(6, -3, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Hedgehog Prime Bomb Specialist
    ctx.fillStyle = '#EF4444';
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
      ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24);
      ctx.lineTo(Math.cos(a + 0.25) * 12, Math.sin(a + 0.25) * 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#FCA5A5';
    ctx.beginPath();
    ctx.arc(0, 3, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P!', 0, 7);
  }

  // Eyes for beaver/raccoon/owl
  if (kind !== 'hedgehog') {
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-5, -3, 2.3, 0, Math.PI * 2);
    ctx.arc(5, -3, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (overheated) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FCA5A5';
    ctx.font = '800 11px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('過熱', 0, 4);
  }

  ctx.restore();
  ctx.restore();
}

export function drawMathZombie(
  ctx: CanvasRenderingContext2D,
  kind: ZombieKind,
  x: number,
  y: number,
  time: number,
  opts: {
    hpRatio: number;
    chilled?: boolean;
    hitFlash?: number;
    formulaShield?: string | null;
    phase2?: boolean;
    moving?: boolean;
    attacking?: boolean;
    chapter?: number;
    supreme?: boolean;
  }
) {
  const scale = kind === 'boss' ? 1.4 : 1;
  const hop = kind === 'hopper' ? Math.abs(Math.sin(time * 7)) * -14 : Math.abs(Math.sin(time * 5)) * -3;

  ctx.save();
  ctx.translate(x, y + hop);
  ctx.scale(scale, scale);

  // Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 22 - hop * 0.5, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const spriteDrawn = drawZombieArt(ctx, kind, opts.phase2,time,opts.moving,opts.attacking,opts.chapter,opts.supreme);
  if (!spriteDrawn) {
  // Body fallback while the atlas loads.
  ctx.fillStyle = opts.chilled ? '#67E8F9' : kind === 'boss' ? '#4C1D95' : '#65A30D';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.4;
  drawRoundedRect(ctx, -12, -2, 24, 22, 6);
  ctx.fill();
  ctx.stroke();

  // Outstretched zombie arms
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-8, 4);
  ctx.lineTo(-24, 0 + Math.sin(time * 6) * 3);
  ctx.stroke();

  // Big goofy head
  ctx.fillStyle = opts.chilled ? '#A5F3FC' : kind === 'boss' ? '#7C3AED' : '#84CC16';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, -14, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Iron bucket for bucket zombie
  if (kind === 'bucket') {
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(-14, -20);
    ctx.lineTo(-11, -36);
    ctx.lineTo(11, -36);
    ctx.lineTo(14, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('-1', 0, -24);
  } else if (kind === 'boss') {
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-14, -26);
    ctx.lineTo(-9, -38);
    ctx.lineTo(0, -30);
    ctx.lineTo(9, -38);
    ctx.lineTo(14, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Goofy spiral/wide eyes
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-6, -15, 5, 0, Math.PI * 2);
  ctx.arc(5, -14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-7, -15, 2, 0, Math.PI * 2);
  ctx.arc(4, -14, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // "0" belly mark
  ctx.fillStyle = '#FEF08A';
  ctx.font = '900 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(kind === 'hopper' ? '½' : '0', 0, 12);
  }

  if (opts.hitFlash && opts.hitFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, opts.hitFlash)})`;
    ctx.beginPath();
    ctx.arc(0, -4, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // HP Bar
  ctx.fillStyle = 'rgba(15,23,42,0.8)';
  drawRoundedRect(ctx, -20, 24, 40, 6, 3);
  ctx.fill();
  ctx.fillStyle = kind === 'boss' ? '#F43F5E' : '#EF4444';
  drawRoundedRect(ctx, -19, 25, Math.max(0, 38 * opts.hpRatio), 4, 2);
  ctx.fill();

  // Formula Shield Plaque above head (clickable to snipe!)
  if (opts.formulaShield) {
    const label = opts.formulaShield;
    ctx.font = '800 12px "JetBrains Mono", "Noto Sans TC", sans-serif';
    const tw = Math.max(66, ctx.measureText(label).width + 18);
    ctx.fillStyle = '#FEF3C7';
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, -tw / 2, -62, tw, 24, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#78350F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, -50);
  }

  ctx.restore();
}

export function drawDarkGluttonBoss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  hpRatio: number,
  hitFlash = 0,
  mood: 'hungry' | 'hurt' | 'happy' = 'hungry'
) {
  const breathe = Math.sin(time * 3.5) * 4;
  ctx.save();
  ctx.translate(x, y + breathe);

  // Bib
  ctx.fillStyle = '#FEF3C7';
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-42, 16);
  ctx.quadraticCurveTo(0, 52, 42, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Huge plush purple monster torso/head
  ctx.fillStyle = '#6D28D9';
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(0, -10, 56, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Horns
  ctx.fillStyle = '#F59E0B';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 28, -44);
    ctx.lineTo(side * 46, -68);
    ctx.lineTo(side * 14, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Fork & Knife in hands
  ctx.save();
  ctx.translate(-64, 4 + Math.sin(time * 7) * 5);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.lineTo(0, -22);
  ctx.moveTo(-6, -22);
  ctx.lineTo(-6, -10);
  ctx.lineTo(6, -10);
  ctx.lineTo(6, -22);
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 7.5;
  ctx.stroke();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(64, 4 - Math.sin(time * 7) * 5);
  ctx.fillStyle = '#E2E8F0';
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 18);
  ctx.lineTo(-4, -22);
  ctx.quadraticCurveTo(10, -16, 4, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Eyes
  if (mood === 'hurt') {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 4;
    for (const ex of [-20, 20]) {
      ctx.beginPath();
      ctx.moveTo(ex - 7, -24);
      ctx.lineTo(ex + 7, -14);
      ctx.moveTo(ex + 7, -24);
      ctx.lineTo(ex - 7, -14);
      ctx.stroke();
    }
  } else {
    for (const ex of [-20, 20]) {
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(ex, -20, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(ex, -19, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Big open hungry mouth
  ctx.fillStyle = '#9F1239';
  ctx.beginPath();
  ctx.ellipse(0, 6, 26, mood === 'hurt' ? 16 : 12 + Math.sin(time * 8) * 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Cute fangs
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(-14, -4);
  ctx.lineTo(-10, 4);
  ctx.lineTo(-6, -4);
  ctx.moveTo(6, -4);
  ctx.lineTo(10, 4);
  ctx.lineTo(14, -4);
  ctx.fill();

  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.8, hitFlash)})`;
    ctx.beginPath();
    ctx.ellipse(0, -10, 58, 48, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Boss HP Bar
  ctx.fillStyle = 'rgba(15,23,42,0.85)';
  drawRoundedRect(ctx, -68, -76, 136, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#F43F5E';
  drawRoundedRect(ctx, -66, -74, Math.max(0, 132 * hpRatio), 8, 4);
  ctx.fill();

  ctx.restore();
}

export function drawChefCharacter(
  ctx: CanvasRenderingContext2D,
  chef: 'redpanda' | 'penguin' | 'mantis',
  x: number,
  y: number,
  time: number,
  cookingPulse = 0,
  appearance?: EquipmentAppearance
) {
  const bob = Math.sin(time * 6) * 3 - cookingPulse * 8;
  if(drawWorldAvatar(ctx,chef,x,y+bob,time,appearance,0,false,0,cookingPulse))return;
  ctx.save();
  ctx.translate(x, y + bob);
  if (appearance) drawUpgradeRig(ctx,0,-4,appearance,time,.9);

  // Chef body apron
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.4;
  drawRoundedRect(ctx, -16, 0, 32, 26, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F97316';
  ctx.fillRect(-10, 8, 20, 14);

  // Head
  ctx.fillStyle = chef === 'redpanda' ? '#EA580C' : chef === 'penguin' ? '#1E293B' : '#16A34A';
  ctx.beginPath();
  ctx.arc(0, -14, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Face patch
  ctx.fillStyle = chef === 'mantis' ? '#BBF7D0' : '#FFF7ED';
  ctx.beginPath();
  ctx.ellipse(0, -11, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tall white chef toque hat!
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-7, -36, 8, 0, Math.PI * 2);
  ctx.arc(7, -36, 8, 0, Math.PI * 2);
  ctx.arc(0, -40, 10, 0, Math.PI * 2);
  ctx.fillRect(-13, -34, 26, 10);
  ctx.fill();
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(-6, -12, 2.8, 0, Math.PI * 2);
  ctx.arc(6, -12, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
