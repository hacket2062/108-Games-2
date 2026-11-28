import { GuardianId } from '../types/game';
import type {EquipmentAppearance} from '../core/equipmentAppearance';
import {drawCompanionMotion,drawEquippedHero,drawWorldAvatar,drawPaintedUnit,drawLegacyZombie} from './spriteArt';

/**
 * Commercial-Grade Japanese Anime Chibi Mobile Game Art Renderer (60FPS Canvas 2D)
 * Features multi-layer cel-shading gradients, rim highlights, glossy expressive anime eyes
 * with dual white sparkle highlights, flowing capes/scarves, glowing weapons, and pooled VFX.
 */

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'spark' | 'ring' | 'petal' | 'ink';
  gravity: number;
}

export class ParticlePool {
  private pool: Particle[];

  constructor(capacity = 260) {
    this.pool = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 4,
      color: '#FFFFFF',
      shape: 'circle' as const,
      gravity: 0,
    }));
  }

  spawn(
    optsOrX: Omit<Particle, 'active'> | number,
    y?: number,
    vx?: number,
    vy?: number,
    color?: string,
    size?: number,
    life?: number,
    gravity = 0,
    shape: Particle['shape'] = 'circle'
  ) {
    const opts: Omit<Particle, 'active'> =
      typeof optsOrX === 'number'
        ? {
            x: optsOrX,
            y: y ?? 0,
            vx: vx ?? 0,
            vy: vy ?? 0,
            color: color ?? '#FFFFFF',
            size: size ?? 4,
            life: life ?? 0.5,
            maxLife: life ?? 0.5,
            gravity,
            shape,
          }
        : optsOrX;

    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) {
        p.active = true;
        p.x = opts.x;
        p.y = opts.y;
        p.vx = opts.vx;
        p.vy = opts.vy;
        p.life = opts.life;
        p.maxLife = opts.maxLife;
        p.size = opts.size;
        p.color = opts.color;
        p.shape = opts.shape;
        p.gravity = opts.gravity;
        return;
      }
    }
  }

  burst(
    x: number,
    y: number,
    count: number,
    colors: string[],
    speedMin = 70,
    speedMax = 240,
    size = 6,
    shape: Particle['shape'] = 'spark',
    gravity = 180
  ) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75,
        size: size * (0.7 + Math.random() * 0.7),
        color: colors[i % colors.length],
        shape,
        gravity,
      });
    }
    this.spawn({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.32,
      maxLife: 0.32,
      size: size * 3.5,
      color: colors[0],
      shape: 'ring',
      gravity: 0,
    });
  }

  update(dt: number) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.shape === 'ring') {
        const radius = p.size * (1.85 - alpha);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.5, 4.5 * alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.9, p.size * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'petal') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 6);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ink') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + alpha * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  subtitle?: string;
  style: 'perfect' | 'crit' | 'normal' | 'heal' | 'miss';
  life: number;
  maxLife: number;
  scale: number;
}

export class FloatingTextPool {
  private pool: FloatingText[];

  constructor(capacity = 48) {
    this.pool = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: 0,
      text: '',
      subtitle: undefined,
      style: 'normal' as const,
      life: 0,
      maxLife: 1,
      scale: 1,
    }));
  }

  spawn(
    x: number,
    y: number,
    text: string,
    style: FloatingText['style'] = 'normal',
    subtitle?: string
  ) {
    for (let i = 0; i < this.pool.length; i++) {
      const f = this.pool[i];
      if (!f.active) {
        f.active = true;
        f.x = x + (Math.random() - 0.5) * 18;
        f.y = y;
        f.vy = style === 'crit' ? -135 : -105;
        f.text = text;
        f.subtitle = subtitle;
        f.style = style;
        f.life = 0.98;
        f.maxLife = 0.98;
        f.scale = style === 'crit' ? 1.4 : style === 'perfect' ? 1.24 : 1.02;
        return;
      }
    }
  }

  update(dt: number) {
    for (let i = 0; i < this.pool.length; i++) {
      const f = this.pool[i];
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        continue;
      }
      f.y += f.vy * dt;
      f.vy += 175 * dt;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.pool.length; i++) {
      const f = this.pool[i];
      if (!f.active) continue;
      const t = 1 - f.life / f.maxLife;
      const pop = t < 0.16 ? 0.65 + (t / 0.16) * 0.68 : 1.0;
      const alpha = f.life < 0.25 ? f.life / 0.25 : 1;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.translate(f.x, f.y);
      ctx.scale(f.scale * pop, f.scale * pop);
      ctx.font = '900 22px "Fredoka", "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0F172A';
      ctx.strokeText(f.text, 0, 0);

      if (f.style === 'perfect') ctx.fillStyle = '#FDE047';
      else if (f.style === 'crit') ctx.fillStyle = '#FB7185';
      else if (f.style === 'heal') ctx.fillStyle = '#4ADE80';
      else if (f.style === 'miss') ctx.fillStyle = '#CBD5E1';
      else ctx.fillStyle = '#FFFFFF';

      ctx.fillText(f.text, 0, 0);

      if (f.subtitle) {
        ctx.font = '800 12px "Noto Sans TC", sans-serif';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#0F172A';
        ctx.strokeText(f.subtitle, 0, 18);
        ctx.fillStyle = '#FEF08A';
        ctx.fillText(f.subtitle, 0, 18);
      }
      ctx.restore();
    }
  }
}

export interface GameFeelState {
  hitstopTimer: number;
  shakeTimer: number;
  shakeIntensity: number;
  flashAlpha: number;
  flashColor: string;
}

export function createGameFeel(): GameFeelState {
  return {
    hitstopTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    flashAlpha: 0,
    flashColor: '#FFFFFF',
  };
}

export function triggerGameFeel(
  feel: GameFeelState,
  opts: {
    hitstop?: number;
    shake?: number;
    shakeDuration?: number;
    flash?: number | string;
    flashColor?: string;
    flashAlpha?: number;
  }
) {
  if (opts.hitstop) feel.hitstopTimer = Math.max(feel.hitstopTimer, opts.hitstop);
  if (opts.shake) {
    const pxShake = opts.shake <= 2 ? opts.shake * 14 : opts.shake;
    feel.shakeIntensity = Math.max(feel.shakeIntensity, pxShake);
    feel.shakeTimer = Math.max(feel.shakeTimer, opts.shakeDuration ?? 0.22);
  }
  if (typeof opts.flash === 'number') {
    feel.flashAlpha = Math.max(feel.flashAlpha, opts.flash);
    if (opts.flashColor) feel.flashColor = opts.flashColor;
  } else if (typeof opts.flash === 'string') {
    feel.flashColor = opts.flash;
    feel.flashAlpha = Math.max(feel.flashAlpha, opts.flashAlpha ?? 0.35);
  } else if (opts.flashColor) {
    feel.flashColor = opts.flashColor;
    feel.flashAlpha = Math.max(feel.flashAlpha, opts.flashAlpha ?? 0.3);
  }
}

export function updateGameFeel(
  feel: GameFeelState,
  rawDt: number
): { dt: number; simDt: number; shakeX: number; shakeY: number } {
  if (feel.flashAlpha > 0) {
    feel.flashAlpha = Math.max(0, feel.flashAlpha - rawDt * 2.6);
  }
  if (feel.shakeTimer > 0) {
    feel.shakeTimer = Math.max(0, feel.shakeTimer - rawDt);
  }
  const shakeX =
    feel.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * feel.shakeIntensity * (feel.shakeTimer / 0.22) : 0;
  const shakeY =
    feel.shakeTimer > 0 ? (Math.random() - 0.5) * 2 * feel.shakeIntensity * (feel.shakeTimer / 0.22) : 0;

  if (feel.hitstopTimer > 0) {
    feel.hitstopTimer = Math.max(0, feel.hitstopTimer - rawDt);
    return { dt: 0, simDt: 0, shakeX, shakeY };
  }
  return { dt: rawDt, simDt: rawDt, shakeX, shakeY };
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Glossy Japanese Anime Chibi Eye: gradient iris + deep pupil + upper eyelash arch + dual white sparkles */
export function drawAnimeEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  irisTop: string,
  irisBottom: string,
  lookX = 0.6
) {
  ctx.save();
  ctx.translate(x, y);

  // Sclera
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Gradient Iris
  const grad = ctx.createLinearGradient(0, -ry, 0, ry);
  grad.addColorStop(0, irisTop);
  grad.addColorStop(1, irisBottom);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(lookX, 0.4, rx * 0.78, ry * 0.86, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupil
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.ellipse(lookX, 0.2, rx * 0.42, ry * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lower crescent light reflection
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(lookX, ry * 0.45, rx * 0.4, ry * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dual Crisp White Sparkles (top-left main + bottom-right secondary)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(lookX - rx * 0.34, -ry * 0.36, Math.max(1.2, rx * 0.34), 0, Math.PI * 2);
  ctx.arc(lookX + rx * 0.32, ry * 0.28, Math.max(0.75, rx * 0.17), 0, Math.PI * 2);
  ctx.fill();

  // Bold Anime Upper Eyelash Arch
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = Math.max(1.8, rx * 0.42);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0.8, rx * 1.08, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();

  ctx.restore();
}

/** Fierce Glowing Anime Villain / Dragon / Monster Eye (sharp angular sclera + slit glow) */
export function drawFierceEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  glowColor: string,
  tilt = 0.25
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 9;
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.quadraticCurveTo(0, -h * 1.35, w, -h * 0.25);
  ctx.quadraticCurveTo(0, h * 0.95, -w, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(w * 0.1, -h * 0.1, w * 0.32, h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.ellipse(w * 0.12, -h * 0.06, w * 0.14, h * 0.56, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-w * 1.08, -h * 0.1);
  ctx.quadraticCurveTo(0, -h * 1.45, w * 1.08, -h * 0.32);
  ctx.stroke();
  ctx.restore();
}

/**
 * 1. LOBBY GUARDIAN SPIRIT (Anime Chibi Cel-Shaded Sacred Spirit)
 */
export function drawGuardianSpirit(
  ctx: CanvasRenderingContext2D,
  id: GuardianId,
  x: number,
  y: number,
  time: number,
  scale = 1,
  bounce = 0
) {
  const hover = Math.sin(time * 3.1) * 7 - bounce * 18;
  const wingFlap = Math.sin(time * 6.8) * 0.24;
  ctx.save();
  ctx.translate(x, y + hover);
  ctx.scale(scale, scale);

  // Soft Ground Shadow
  ctx.fillStyle = 'rgba(2, 6, 23, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, 44 - hover * 0.4, 28, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Floating Sacred Rune Halo Ring behind spirit
  const haloColor =
    id === 'griffin' ? '#FDE047' : id === 'stardragon' ? '#38BDF8' : id === 'qilin' ? '#FB923C' : '#34D399';
  ctx.save();
  ctx.rotate(time * 0.7);
  ctx.strokeStyle = haloColor;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.arc(0, -4, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  if (id === 'griffin') {
    // Cel-Shaded Celestial Starlight Owl
    ctx.save();
    // Spread celestial wings
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.translate(22, 4);
      ctx.rotate(0.28 + wingFlap);
      const wg = ctx.createLinearGradient(0, -14, 24, 16);
      wg.addColorStop(0, '#6366F1');
      wg.addColorStop(1, '#312E81');
      ctx.fillStyle = wg;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(26, -12, 22, 10);
      ctx.quadraticCurveTo(10, 18, -2, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Gold feather tips
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.ellipse(14, 4, 5, 2.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Round Cel-Shaded Body
    const bg = ctx.createRadialGradient(-8, -14, 4, 0, 0, 32);
    bg.addColorStop(0, '#A5B4FC');
    bg.addColorStop(0.6, '#4F46E5');
    bg.addColorStop(1, '#312E81');
    ctx.fillStyle = bg;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(0, 2, 24, 27, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cream Belly Plumes
    const belly = ctx.createLinearGradient(0, -2, 0, 24);
    belly.addColorStop(0, '#FEFCE8');
    belly.addColorStop(1, '#FDE68A');
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.ellipse(0, 11, 15.5, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ear Tufts
    ctx.fillStyle = '#4338CA';
    ctx.beginPath();
    ctx.moveTo(-18, -16);
    ctx.lineTo(-26, -32);
    ctx.lineTo(-8, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, -16);
    ctx.lineTo(26, -32);
    ctx.lineTo(8, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Royal Scholar Beret + Gold Star Tassel
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.ellipse(0, -23, 20, 6.5, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(17, -20, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Glossy Anime Eyes
    drawAnimeEye(ctx, -9.5, -5.5, 6.4, 7.2, '#FEF08A', '#EA580C', 0.4);
    drawAnimeEye(ctx, 9.5, -5.5, 6.4, 7.2, '#FEF08A', '#EA580C', -0.4);

    // Cute Golden Beak & Blush
    ctx.fillStyle = 'rgba(251, 113, 133, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-15, 2, 4, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(15, 2, 4, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (id === 'stardragon') {
    // Cel-Shaded Azure Crystal Star Dragon Spirit
    ctx.save();
    // Sweeping Crystal Tail
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(16, 16);
    ctx.quadraticCurveTo(36, 12 + Math.sin(time * 6) * 7, 29, -8);
    ctx.stroke();
    ctx.fillStyle = '#7DD3FC';
    ctx.beginPath();
    ctx.moveTo(29, -15);
    ctx.lineTo(36, -6);
    ctx.lineTo(29, -2);
    ctx.lineTo(23, -8);
    ctx.closePath();
    ctx.fill();

    // Crystalline Wings
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.translate(18, -4);
      ctx.rotate(-0.2 + wingFlap);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(22, -16);
      ctx.lineTo(26, 2);
      ctx.lineTo(8, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Body + Chibi Head
    const dg = ctx.createRadialGradient(-8, -14, 4, 0, 2, 32);
    dg.addColorStop(0, '#BAE6FD');
    dg.addColorStop(0.55, '#0EA5E9');
    dg.addColorStop(1, '#0369A1');
    ctx.fillStyle = dg;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 12, 18, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -10, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cream Dragon Belly Scales
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.ellipse(0, 14, 11, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Curved Horns
    ctx.fillStyle = '#FDE047';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 10, -24);
      ctx.quadraticCurveTo(dir * 20, -34, dir * 16, -42);
      ctx.quadraticCurveTo(dir * 10, -32, dir * 4, -26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    drawAnimeEye(ctx, -8.5, -10, 5.8, 6.8, '#38BDF8', '#1D4ED8', 0.4);
    drawAnimeEye(ctx, 8.5, -10, 5.8, 6.8, '#38BDF8', '#1D4ED8', -0.4);

    // Cute Fang Smile
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, 5.5, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
    ctx.restore();
  } else if (id === 'qilin') {
    // Cel-Shaded Golden Flame-Ink Qilin Spirit
    ctx.save();
    // Three glowing flame tails fanning out
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(14, 14);
      ctx.rotate(i * 0.42 + Math.sin(time * 6 + i) * 0.14);
      const tg = ctx.createLinearGradient(0, 0, 26, -16);
      tg.addColorStop(0, '#EA580C');
      tg.addColorStop(0.65, '#FB923C');
      tg.addColorStop(1, '#FEF08A');
      ctx.fillStyle = tg;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(18, -18, 28, -4);
      ctx.quadraticCurveTo(16, 12, 0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Body & Head
    const fg = ctx.createRadialGradient(-7, -14, 4, 0, 2, 30);
    fg.addColorStop(0, '#FDBA74');
    fg.addColorStop(0.6, '#F97316');
    fg.addColorStop(1, '#C2410C');
    ctx.fillStyle = fg;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 12, 16, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fluffy White Neck Fur
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.ellipse(0, 5, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fox Head
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(0, -10, 21, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tall Pointed Ears with Cream Inner Fur
    for (const dir of [-1, 1]) {
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(dir * 16, -18);
      ctx.lineTo(dir * 23, -39);
      ctx.lineTo(dir * 4, -24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.moveTo(dir * 14, -20);
      ctx.lineTo(dir * 19, -33);
      ctx.lineTo(dir * 8, -23);
      ctx.closePath();
      ctx.fill();
    }

    // Forehead Flame Crest
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(4, -17);
    ctx.lineTo(0, -14);
    ctx.lineTo(-4, -17);
    ctx.closePath();
    ctx.fill();

    drawAnimeEye(ctx, -8.5, -9.5, 5.8, 6.6, '#FB7185', '#9F1239', 0.4);
    drawAnimeEye(ctx, 8.5, -9.5, 5.8, 6.6, '#FB7185', '#9F1239', -0.4);

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(0, -2.5, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Cel-Shaded Jade Forest Deer Spirit
    ctx.save();
    // Glowing Golden-Emerald Antlers
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 9, -23);
      ctx.quadraticCurveTo(dir * 16, -34, dir * 23, -40);
      ctx.moveTo(dir * 15, -32);
      ctx.lineTo(dir * 12, -41);
      ctx.stroke();
      // Glowing Leaf Bud
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.ellipse(dir * 23, -40, 4.5, 2.5, dir * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const jg = ctx.createRadialGradient(-7, -14, 4, 0, 2, 30);
    jg.addColorStop(0, '#A7F3D0');
    jg.addColorStop(0.6, '#10B981');
    jg.addColorStop(1, '#047857');
    ctx.fillStyle = jg;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 12, 16, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ECFDF5';
    ctx.beginPath();
    ctx.ellipse(0, 13, 10, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = jg;
    ctx.beginPath();
    ctx.ellipse(0, -10, 20, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawAnimeEye(ctx, -8, -9.5, 5.8, 6.6, '#6EE7B7', '#047857', 0.4);
    drawAnimeEye(ctx, 8, -9.5, 5.8, 6.6, '#6EE7B7', '#047857', -0.4);

    // Blush & Gentle Smile
    ctx.fillStyle = 'rgba(251, 113, 133, 0.38)';
    ctx.beginPath();
    ctx.ellipse(-13, -3, 3.6, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(13, -3, 3.6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.arc(0, -2, 4.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 2. CHINESE WORLD (墨靈幻境): Anime Chibi 2.5-Head Ink Heroes & Armored Ink Demons
 */
export type InkHeroRole = 'swordsman' | 'mage' | 'healer' | 'craneMage' | 'pandaHealer';

export function drawInkChibiHero(
  ctx: CanvasRenderingContext2D,
  rawRole: InkHeroRole,
  x: number,
  y: number,
  time: number,
  opts: {
    facing?: 1 | -1;
    appearance?: EquipmentAppearance;
    attackProgress?: number;
    hitFlash?: number;
    walking?: boolean;
    walkPhase?: number;
    label?: string;
    scale?: number;
  } = {}
) {
  const role: 'swordsman' | 'mage' | 'healer' =
    rawRole === 'craneMage' ? 'mage' : rawRole === 'pandaHealer' ? 'healer' : rawRole;
  if(role==='swordsman' && opts.appearance && drawEquippedHero(ctx,x,y,time,opts.appearance,opts.facing??1,opts.scale??1,opts.attackProgress??0,Boolean(opts.walking),opts.walkPhase??0,opts.hitFlash??0)) return;
  if(role!=='swordsman' && drawCompanionMotion(ctx,role==='mage'?'craneMage':'pandaHealer',x,y,time,{...opts,moving:Boolean(opts.walking)})) return;
  const facing = opts.facing ?? 1;
  const attack = opts.attackProgress ?? 0;
  const scale = opts.scale ?? 1;
  const walkSwing =
    opts.walking || (opts.walkPhase ?? 0) > 0
      ? Math.sin((opts.walkPhase ?? time) * 13) * 6
      : 0;
  const breathe = Math.sin(time * 4.2) * 2.5;
  const lungeX = Math.sin(attack * Math.PI) * 32;

  ctx.save();
  ctx.translate(x + lungeX * facing, y + breathe);
  ctx.scale(facing * scale, scale);

  // Soft Ground Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 32 - breathe * 0.4, 21, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const palette =
    role === 'swordsman'
      ? {
          cloak: '#1D4ED8',
          cloakDark: '#1E3A8A',
          robeTop: '#F8FAFC',
          robeBot: '#CBD5E1',
          accent: '#F59E0B',
          hairTop: '#1E293B',
          hairBot: '#0F172A',
          eyeTop: '#38BDF8',
          eyeBot: '#1D4ED8',
        }
      : role === 'mage'
        ? {
            cloak: '#7C3AED',
            cloakDark: '#4C1D95',
            robeTop: '#F5F3FF',
            robeBot: '#DDD6FE',
            accent: '#38BDF8',
            hairTop: '#4C1D95',
            hairBot: '#2E1065',
            eyeTop: '#C084FC',
            eyeBot: '#6D28D9',
          }
        : {
            cloak: '#059669',
            cloakDark: '#064E3B',
            robeTop: '#ECFDF5',
            robeBot: '#A7F3D0',
            accent: '#FBBF24',
            hairTop: '#1E293B',
            hairBot: '#064E3B',
            eyeTop: '#34D399',
            eyeBot: '#047857',
          };

  // Dynamic Wind-Blown Flowing Scarf / Cloak
  const cloakWave = Math.sin(time * 7.5) * 6;
  const cg = ctx.createLinearGradient(-26, 0, 8, 30);
  cg.addColorStop(0, palette.cloak);
  cg.addColorStop(1, palette.cloakDark);
  ctx.fillStyle = cg;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-9, -1);
  ctx.quadraticCurveTo(-28 - cloakWave, 10, -24 - cloakWave * 0.5, 29);
  ctx.quadraticCurveTo(-8, 31, 9, 27);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Animated Boots / Legs
  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, -9 + walkSwing * 0.45, 21, 7.5, 11, 3.5);
  ctx.fill();
  drawRoundedRect(ctx, 2 - walkSwing * 0.45, 21, 7.5, 11, 3.5);
  ctx.fill();

  // Layered Martial Robe with Gold Trim
  const rg = ctx.createLinearGradient(0, -2, 0, 24);
  rg.addColorStop(0, palette.robeTop);
  rg.addColorStop(1, palette.robeBot);
  ctx.fillStyle = rg;
  drawRoundedRect(ctx, -13, -1, 26, 24, 7.5);
  ctx.fill();
  ctx.stroke();

  // Sash & Jade/Gold Belt Emblem
  ctx.fillStyle = palette.cloak;
  ctx.fillRect(-13, 10, 26, 5.5);
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(2, 12.7, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // Head (2.5-Head Anime Chibi Proportions)
  const skin = ctx.createRadialGradient(-4, -22, 2, 0, -16, 20);
  skin.addColorStop(0, '#FFF1DF');
  skin.addColorStop(1, '#F5CBA7');
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -16, 17.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Soft Anime Cheek Blush
  ctx.fillStyle = 'rgba(251, 113, 133, 0.34)';
  ctx.beginPath();
  ctx.ellipse(-2, -10.5, 3.2, 1.8, 0, 0, Math.PI * 2);
  ctx.ellipse(14, -10.5, 2.8, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Layered Anime Hair + Specular Ribbon Highlight
  const hg = ctx.createLinearGradient(0, -37, 0, -10);
  hg.addColorStop(0, palette.hairTop);
  hg.addColorStop(1, palette.hairBot);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(0, -19, 18.5, Math.PI * 0.92, Math.PI * 2.1);
  ctx.lineTo(15, -24);
  ctx.lineTo(11, -16);
  ctx.lineTo(6, -24);
  ctx.lineTo(1, -15);
  ctx.lineTo(-6, -23);
  ctx.lineTo(-14, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Anime Hair Highlight Arc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-2, -23, 12, Math.PI * 1.18, Math.PI * 1.78);
  ctx.stroke();

  // Role Headgear
  if (role === 'swordsman') {
    // Flowing Crimson Headband Ribbon
    ctx.fillStyle = '#EF4444';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;
    ctx.fillRect(-16, -27, 32, 4.2);
    ctx.beginPath();
    ctx.moveTo(-16, -25);
    ctx.quadraticCurveTo(-30 - cloakWave, -22, -32 - cloakWave, -15);
    ctx.lineTo(-27 - cloakWave, -13);
    ctx.quadraticCurveTo(-24 - cloakWave * 0.5, -20, -15, -23);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (role === 'mage') {
    // Celestial Starlight Hairpin Crest
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(5, -31);
    ctx.lineTo(0, -27);
    ctx.lineTo(-5, -31);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Emerald Panda Ears / Jade Crown
    ctx.fillStyle = '#064E3B';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-13, -33, 5.5, 0, Math.PI * 2);
    ctx.arc(11, -33, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(-1, -34, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Expressive Glossy Anime Eyes
  drawAnimeEye(ctx, 2.5, -14.5, 4.5, 5.2, palette.eyeTop, palette.eyeBot, 0.8);
  drawAnimeEye(ctx, 12.2, -14.5, 4.1, 5.0, palette.eyeTop, palette.eyeBot, 0.8);

  // Confident Anime Smile
  ctx.strokeStyle = '#7C2D12';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.arc(8, -8.5, 3.2, 0.1 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();

  // Enchanted Glowing Weapon + Slash Arc
  ctx.save();
  ctx.translate(15, 7);
  ctx.rotate(attack > 0 ? -0.95 + attack * 2.5 : 0.25 + Math.sin(time * 4.5) * 0.08);
  if (role === 'swordsman') {
    // Enchanted Azure-Ink Katana
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 10;
    const bg = ctx.createLinearGradient(0, -4, 0, -46);
    bg.addColorStop(0, '#E0F2FE');
    bg.addColorStop(0.5, '#38BDF8');
    bg.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = bg;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-2.5, -2);
    ctx.lineTo(-1, -46);
    ctx.lineTo(3.5, -39);
    ctx.lineTo(3, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Gold Tsuba Guard
    ctx.fillStyle = '#F59E0B';
    drawRoundedRect(ctx, -7, -4, 14, 5, 2);
    ctx.fill();
    ctx.stroke();

    if (attack > 0.12 && attack < 0.9) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.88)';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 44, -Math.PI * 0.85, Math.PI * 0.3);
      ctx.stroke();
    }
  } else if (role === 'mage') {
    // Giant Calligraphy Celestial Brush Staff
    ctx.fillStyle = '#78350F';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.8;
    drawRoundedRect(ctx, -2.5, -34, 5, 44, 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = '#A855F7';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#E9D5FF';
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.quadraticCurveTo(9, -39, 0, -32);
    ctx.quadraticCurveTo(-9, -39, 0, -52);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    // Floating Jade Seal Talisman Staff
    ctx.shadowColor = '#34D399';
    ctx.shadowBlur = 11;
    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.8;
    drawRoundedRect(ctx, -7, -30, 14, 20, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#065F46';
    ctx.font = '900 10px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('癒', 0, -17);
  }
  ctx.restore();

  if ((opts.hitFlash ?? 0) > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, opts.hitFlash ?? 0)})`;
    ctx.beginPath();
    ctx.arc(0, -4, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  if (opts.label) {
    ctx.save();
    ctx.font = '800 11px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#0F172A';
    ctx.strokeText(opts.label, x + lungeX * facing, y + 40 * scale);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(opts.label, x + lungeX * facing, y + 40 * scale);
    ctx.restore();
  }
}

export function drawInkMonster(
  ctx: CanvasRenderingContext2D,
  kind: 'poring' | 'slime' | 'boss',
  x: number,
  y: number,
  time: number,
  opts: {
    hitFlash?: number;
    scale?: number;
    shielded?: boolean;
    alerted?: boolean;
    hpRatio?: number;
    name?: string;
  } = {}
) {
  const scale = (opts.scale ?? 1) * (kind === 'boss' ? 1.5 : 1);
  if(drawPaintedUnit(ctx,kind==='poring'?2:kind==='slime'?3:opts.name?.includes('墨')?5:4,x,y,time,{scale,hitFlash:opts.hitFlash,shielded:opts.shielded,hpRatio:opts.hpRatio,label:opts.name}))return;
  const floatY = Math.sin(time * 4.8) * 5;
  ctx.save();
  ctx.translate(x, y + floatY);
  ctx.scale(scale, scale);

  // Ground shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 26 - floatY * 0.4, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (kind === 'boss') {
    // Armored Ink Demon Shogun (Sharp Obsidian Armor + Crimson Horns + Floating Rune Ring)
    ctx.save();
    ctx.rotate(-time * 1.1);
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, -6, 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Jagged Crimson Energy Cape
    ctx.fillStyle = '#881337';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-26, -10);
    ctx.lineTo(-34, 24);
    ctx.lineTo(-14, 18);
    ctx.lineTo(0, 27);
    ctx.lineTo(16, 18);
    ctx.lineTo(34, 24);
    ctx.lineTo(26, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Obsidian Armored Torso & Helm
    const bg = ctx.createLinearGradient(0, -32, 0, 22);
    bg.addColorStop(0, '#334155');
    bg.addColorStop(0.55, '#0F172A');
    bg.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-25, 16);
    ctx.lineTo(-28, -14);
    ctx.lineTo(-14, -29);
    ctx.lineTo(14, -29);
    ctx.lineTo(28, -14);
    ctx.lineTo(25, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Curved Obsidian-Crimson Horns
    ctx.fillStyle = '#F43F5E';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 12, -26);
      ctx.quadraticCurveTo(dir * 29, -36, dir * 24, -48);
      ctx.quadraticCurveTo(dir * 16, -34, dir * 6, -28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing Forehead Seal
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(5, -20);
    ctx.lineTo(0, -15);
    ctx.lineTo(-5, -20);
    ctx.closePath();
    ctx.fill();

    // Fierce Magma Eyes
    drawFierceEye(ctx, -10, -7, 7, 4.5, '#FB7185', 0.28);
    drawFierceEye(ctx, 10, -7, 7, 4.5, '#FB7185', -0.28);

    // Armored Fang Mask
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(-11, 5);
    ctx.lineTo(-7, 13);
    ctx.lineTo(-3, 6);
    ctx.lineTo(3, 6);
    ctx.lineTo(7, 13);
    ctx.lineTo(11, 5);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'poring') {
    // Crimson Oni-Mask Ink Imp (Sharp Horned Silhouette + Glowing Eyes)
    const og = ctx.createRadialGradient(-5, -12, 3, 0, 0, 26);
    og.addColorStop(0, '#FB7185');
    og.addColorStop(0.65, '#BE123C');
    og.addColorStop(1, '#4C0519');
    ctx.fillStyle = og;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(-22, 16);
    ctx.quadraticCurveTo(-26, -8, -14, -20);
    ctx.lineTo(0, -26);
    ctx.lineTo(14, -20);
    ctx.quadraticCurveTo(26, -8, 22, 16);
    ctx.quadraticCurveTo(0, 23, -22, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin White Oni Horns
    ctx.fillStyle = '#FEF3C7';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 9, -20);
      ctx.lineTo(dir * 16, -34);
      ctx.lineTo(dir * 3, -23);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    drawFierceEye(ctx, -8.5, -4, 5.5, 3.6, '#FDE047', 0.25);
    drawFierceEye(ctx, 8.5, -4, 5.5, 3.6, '#FDE047', -0.25);

    // Fanged Grin
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(0, 7, 7, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(-5, 7);
    ctx.lineTo(-3, 12);
    ctx.lineTo(-1, 7);
    ctx.moveTo(5, 7);
    ctx.lineTo(3, 12);
    ctx.lineTo(1, 7);
    ctx.fill();
  } else {
    // Spectral Ink Phantom Wraith (Armored Floating Mask + Wispy Shadow Cloak)
    const wg = ctx.createLinearGradient(0, -24, 0, 22);
    wg.addColorStop(0, '#475569');
    wg.addColorStop(0.55, '#1E293B');
    wg.addColorStop(1, '#0F172A');
    ctx.fillStyle = wg;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.moveTo(-21, 18);
    ctx.lineTo(-22, -8);
    ctx.quadraticCurveTo(0, -30, 22, -8);
    ctx.lineTo(21, 18);
    ctx.lineTo(11, 12);
    ctx.lineTo(0, 21);
    ctx.lineTo(-11, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Floating Porcelain Fox-Demon Half-Mask
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(-14, -12);
    ctx.lineTo(0, -18);
    ctx.lineTo(14, -12);
    ctx.lineTo(10, 4);
    ctx.lineTo(0, 8);
    ctx.lineTo(-10, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawFierceEye(ctx, -6.5, -5, 4.8, 3.2, '#38BDF8', 0.25);
    drawFierceEye(ctx, 6.5, -5, 4.8, 3.2, '#38BDF8', -0.25);
  }

  // Boss Shield Ring
  if (opts.shielded) {
    ctx.strokeStyle = '#38BDF8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -2, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Alert "!" Badge when spotting player in vision cone
  if (opts.alerted) {
    ctx.save();
    ctx.translate(0, -40);
    ctx.fillStyle = '#EF4444';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 15px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 1);
    ctx.restore();
  }

  if ((opts.hitFlash ?? 0) > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.9, opts.hitFlash ?? 0)})`;
    ctx.beginPath();
    ctx.arc(0, -4, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  if (opts.hpRatio !== undefined) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-20, -37, 40, 5);
    ctx.fillStyle = opts.hpRatio > 0.45 ? '#22C55E' : '#F43F5E';
    ctx.fillRect(-19, -36, 38 * Math.max(0, opts.hpRatio), 3);
  }

  if (opts.name) {
    ctx.font = '800 10px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0F172A';
    ctx.strokeText(opts.name, 0, 34);
    ctx.fillStyle = kind === 'boss' ? '#FDE047' : '#FECDD3';
    ctx.fillText(opts.name, 0, 34);
  }

  ctx.restore();
}

/**
 * 3. ENGLISH WORLD (星際機甲戰線): Sleek Anime Gundam-Style Cyber Mecha Starfighter
 */
export function drawMechaShip(
  ctx: CanvasRenderingContext2D,
  variant: 'blaster' | 'falcon',
  x: number,
  y: number,
  time: number,
  tilt = 0,
  shielded = false,
  hitFlash = 0,
  firing = false,
  appearance?: EquipmentAppearance
) {
  if(drawWorldAvatar(ctx,'ship',x,y,time,appearance,tilt,shielded,hitFlash))return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt * 0.22);

  // Twin Plasma Afterburner Flames
  const flameH = (firing ? 32 : 18) + Math.sin(time * 42) * 5;
  for (const ox of [-11, 11]) {
    const fg = ctx.createLinearGradient(ox, 16, ox, 16 + flameH);
    fg.addColorStop(0, '#FFFFFF');
    fg.addColorStop(0.35, variant === 'falcon' ? '#F472B6' : '#38BDF8');
    fg.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(ox - 5, 16);
    ctx.lineTo(ox + 5, 16);
    ctx.lineTo(ox, 16 + flameH);
    ctx.closePath();
    ctx.fill();
  }

  // Swept Forward Mecha Cyber Wings (Multi-layer metallic shading)
  const wg = ctx.createLinearGradient(-38, -8, 38, 18);
  wg.addColorStop(0, variant === 'falcon' ? '#9D174D' : '#1D4ED8');
  wg.addColorStop(0.5, variant === 'falcon' ? '#EC4899' : '#38BDF8');
  wg.addColorStop(1, variant === 'falcon' ? '#9D174D' : '#1D4ED8');
  ctx.fillStyle = hitFlash > 0 ? '#FFFFFF' : wg;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(13, -6);
  ctx.lineTo(38, 10);
  ctx.lineTo(34, 21);
  ctx.lineTo(13, 14);
  ctx.lineTo(7, 23);
  ctx.lineTo(-7, 23);
  ctx.lineTo(-13, 14);
  ctx.lineTo(-34, 21);
  ctx.lineTo(-38, 10);
  ctx.lineTo(-13, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // White Gundam Shoulder Armor Panels
  ctx.fillStyle = hitFlash > 0 ? '#FFFFFF' : '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(10, -10);
  ctx.lineTo(14, 15);
  ctx.lineTo(0, 19);
  ctx.lineTo(-14, 15);
  ctx.lineTo(-10, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wingtip Plasma Cannons
  ctx.fillStyle = firing ? '#FDE047' : variant === 'falcon' ? '#22D3EE' : '#F43F5E';
  drawRoundedRect(ctx, -31, -2, 6, 16, 2);
  ctx.fill();
  ctx.stroke();
  drawRoundedRect(ctx, 25, -2, 6, 16, 2);
  ctx.fill();
  ctx.stroke();

  // Glowing Energy Canopy Cockpit
  const cg = ctx.createLinearGradient(0, -20, 0, 5);
  cg.addColorStop(0, '#ECFEFF');
  cg.addColorStop(0.45, variant === 'falcon' ? '#FDE047' : '#22D3EE');
  cg.addColorStop(1, '#0284C7');
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.ellipse(0, -7, 6.5, 13.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rim Specular Glint
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(-2, -12, 1.8, 4.5, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Active Energy Shield Ring
  if (shielded) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -2, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 4. MATH WORLD (數境建築王國): Anime Chibi Animal Engineers + 5 Zombie Types + Fusion Mega-Boss
 */
export type MathTowerKind = 'beaver' | 'raccoon' | 'owl' | 'hedgehog';
export type MathZombieKind = 'zero' | 'bucket' | 'hopper' | 'sprinter' | 'mage' | 'fusion' | 'boss';

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
  if(drawPaintedUnit(ctx,{beaver:6,raccoon:7,owl:8,hedgehog:9}[kind],x-recoil*6,y,time,{hitFlash:overheated?1:0,shielded:overclocked}))return;
  ctx.save();
  ctx.translate(x - recoil * 6, y);

  // Overclock Golden Aura Ring / Overheat Red Warning Ring
  if (overclocked || overheated) {
    ctx.save();
    ctx.strokeStyle = overheated ? '#EF4444' : '#FDE047';
    ctx.lineWidth = 2.6;
    ctx.globalAlpha = 0.72 + Math.sin(time * 10) * 0.22;
    ctx.beginPath();
    ctx.ellipse(0, 17, 25, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Steel Base Platform
  const baseGrad = ctx.createLinearGradient(-20, 10, 20, 22);
  baseGrad.addColorStop(0, '#475569');
  baseGrad.addColorStop(1, '#1E293B');
  ctx.fillStyle = baseGrad;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 17, 22, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const bob = Math.sin(time * 5.2) * 1.8;
  ctx.translate(0, bob);

  if (kind === 'beaver') {
    // Anime Chibi Beaver Gear Engineer
    const bg = ctx.createRadialGradient(-4, -10, 2, 0, 0, 20);
    bg.addColorStop(0, '#D97706');
    bg.addColorStop(1, '#78350F');
    ctx.fillStyle = bg;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 4, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -10, 13.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Yellow Hardhat + Glowing Gear Emblem
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, -14, 14.2, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawAnimeEye(ctx, -4.5, -9, 3.3, 3.8, '#38BDF8', '#1D4ED8', 0.6);
    drawAnimeEye(ctx, 5.5, -9, 3.3, 3.8, '#38BDF8', '#1D4ED8', 0.6);
    // Spinning Golden Gear floating beside beaver
    ctx.save();
    ctx.translate(15, 2);
    ctx.rotate(time * 3.8);
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (kind === 'raccoon') {
    // Anime Raccoon Twin-Gatling Gunner
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 4, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(0, -10, 13.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Pointed Raccoon Ears
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 11, -18);
      ctx.lineTo(dir * 15, -27);
      ctx.lineTo(dir * 4, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Bandit Mask + Expressive Eyes
    ctx.fillStyle = '#1E293B';
    drawRoundedRect(ctx, -11, -14, 22, 8, 4);
    ctx.fill();
    drawAnimeEye(ctx, -4.5, -10, 3.2, 3.5, '#FDE047', '#EA580C', 0.7);
    drawAnimeEye(ctx, 5.5, -10, 3.2, 3.5, '#FDE047', '#EA580C', 0.7);
    // Twin Energy Gatling Barrels
    ctx.fillStyle = '#38BDF8';
    drawRoundedRect(ctx, 9, -2, 18, 5, 2);
    ctx.fill();
    ctx.stroke();
    drawRoundedRect(ctx, 9, 4, 18, 5, 2);
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'owl') {
    // Anime Frost Arcanist Owl
    const og = ctx.createRadialGradient(-3, -10, 2, 0, 0, 20);
    og.addColorStop(0, '#BAE6FD');
    og.addColorStop(1, '#0284C7');
    ctx.fillStyle = og;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -2, 15, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Crystal Wizard Hat
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.moveTo(-14, -15);
    ctx.lineTo(0, -34);
    ctx.lineTo(14, -15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    drawAnimeEye(ctx, -5, -8, 3.6, 4.1, '#67E8F9', '#0369A1', 0.5);
    drawAnimeEye(ctx, 5, -8, 3.6, 4.1, '#67E8F9', '#0369A1', 0.5);
    // Floating Frost Orb
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(17, -6 + Math.sin(time * 7) * 3, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // Anime Hedgehog Prime Mortar Bombardier
    ctx.fillStyle = '#581C87';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-22, -16 + i * 7);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(2, -4, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawAnimeEye(ctx, -1, -6, 3.2, 3.8, '#F43F5E', '#881337', 0.7);
    drawAnimeEye(ctx, 8, -6, 3.2, 3.8, '#F43F5E', '#881337', 0.7);
    // Heavy Mortar Tube
    ctx.save();
    ctx.translate(9, -11);
    ctx.rotate(-0.52);
    ctx.fillStyle = '#334155';
    drawRoundedRect(ctx, -4, -10, 20, 11, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F97316';
    ctx.fillRect(11, -10, 5, 11);
    ctx.restore();
  }

  ctx.restore();
}

export function drawMathZombie(
  ctx: CanvasRenderingContext2D,
  kind: MathZombieKind,
  x: number,
  y: number,
  time: number,
  opts: {
    frozen?: boolean;
    chilled?: boolean;
    hitFlash?: number;
    hpRatio?: number;
    armorRatio?: number;
    hasBucket?: boolean;
    shieldFormula?: string | null;
    formulaShield?: string | null;
    jumpOffset?: number;
    chapter?: number;
    supreme?: boolean;
  } = {}
) {
  if(drawLegacyZombie(ctx,kind,x,y,time,opts))return;
  const isChilled = Boolean(opts.frozen || opts.chilled);
  const badgeFormula = opts.shieldFormula ?? opts.formulaShield ?? null;
  const isFusion = kind === 'fusion';
  const isBoss = kind === 'boss';
  const scale = isFusion ? 1.55 : isBoss ? 1.48 : 1.0;
  const speedFreq = kind === 'sprinter' ? 12 : 6.2;
  const wobble = Math.sin(time * speedFreq) * (kind === 'sprinter' ? 0.14 : 0.08);
  const jumpY = opts.jumpOffset ?? 0;

  ctx.save();
  ctx.translate(x, y - jumpY);
  ctx.scale(scale, scale);

  // Soft Ground Shadow (stays on ground when jumping)
  ctx.fillStyle = 'rgba(2, 6, 23, 0.36)';
  ctx.beginPath();
  ctx.ellipse(0, 24 + jumpY / scale, 20, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Purple-Lightning Fusion Aura!
  if (isFusion) {
    ctx.save();
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.7 + Math.sin(time * 12) * 0.25;
    ctx.beginPath();
    ctx.arc(0, -4, 30 + Math.sin(time * 9) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.rotate(wobble);

  // Legs / Spring-Boots for Hopper
  ctx.fillStyle = kind === 'hopper' ? '#F59E0B' : '#1E293B';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  const step = Math.sin(time * speedFreq) * 4;
  drawRoundedRect(ctx, -9 + step, 14, 6.5, 10, 2.5);
  ctx.fill();
  ctx.stroke();
  drawRoundedRect(ctx, 2 - step, 14, 6.5, 10, 2.5);
  ctx.fill();
  ctx.stroke();

  // Armored Zombie Coat / Torso
  const coatColor =
    isFusion
      ? '#581C87'
      : isBoss
        ? '#7F1D1D'
        : kind === 'mage'
          ? '#312E81'
          : kind === 'sprinter'
            ? '#0F766E'
            : kind === 'hopper'
              ? '#9A3412'
              : '#334155';
  ctx.fillStyle = coatColor;
  drawRoundedRect(ctx, -12, -2, 24, 20, 6);
  ctx.fill();
  ctx.stroke();

  // Glowing Math Armor Chestplate if armor > 0
  if ((opts.armorRatio ?? 0) > 0) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.6;
    drawRoundedRect(ctx, -10, 1, 20, 12, 3);
    ctx.fill();
    ctx.stroke();
  }

  // Stylized Anime Zombie Head (Sharp Jaw, NOT a derpy blob!)
  const skinTop = isChilled
    ? '#BAE6FD'
    : isFusion
      ? '#E9D5FF'
      : isBoss
        ? '#FCA5A5'
        : '#A3E635';
  const skinBot = isChilled
    ? '#38BDF8'
    : isFusion
      ? '#9333EA'
      : isBoss
        ? '#B91C1C'
        : '#4D7C0F';
  const hg = ctx.createLinearGradient(0, -28, 0, -2);
  hg.addColorStop(0, skinTop);
  hg.addColorStop(1, skinBot);
  ctx.fillStyle = hg;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-14, -12);
  ctx.quadraticCurveTo(-15, -28, 0, -28);
  ctx.quadraticCurveTo(15, -28, 14, -12);
  ctx.lineTo(10, -2);
  ctx.lineTo(-10, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fierce Glowing Eyes (facing left toward castle)
  const eyeColor = isFusion ? '#E879F9' : kind === 'sprinter' ? '#22D3EE' : '#F43F5E';
  drawFierceEye(ctx, -7, -14, 4.4, 2.8, eyeColor, -0.2);
  drawFierceEye(ctx, 2, -14, 4.4, 2.8, eyeColor, 0.12);

  // Role-Specific Gear
  if (kind === 'bucket' && opts.hasBucket !== false) {
    // Heavy Steel Armor Bucket Helmet with Math Rivets
    const bg = ctx.createLinearGradient(-15, -38, 15, -18);
    bg.addColorStop(0, '#CBD5E1');
    bg.addColorStop(0.5, '#64748B');
    bg.addColorStop(1, '#334155');
    ctx.fillStyle = bg;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.lineTo(-12, -37);
    ctx.lineTo(12, -37);
    ctx.lineTo(16, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-15, -23, 30, 4);
  } else if (kind === 'sprinter') {
    // Cyber Neon Visor + Speed Scarf
    ctx.fillStyle = '#22D3EE';
    drawRoundedRect(ctx, -15, -18, 22, 6, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.moveTo(10, -2);
    ctx.lineTo(26, -6 + Math.sin(time * 16) * 3);
    ctx.lineTo(22, 3);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'hopper') {
    // Frog-Spring Visor Crest
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-12, -26);
    ctx.lineTo(-4, -36);
    ctx.lineTo(4, -27);
    ctx.lineTo(12, -36);
    ctx.lineTo(14, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'mage') {
    // Floating Rune Shield Staff + Wizard Hood
    ctx.fillStyle = '#4338CA';
    ctx.beginPath();
    ctx.moveTo(-15, -22);
    ctx.lineTo(0, -40);
    ctx.lineTo(15, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, 12);
    ctx.lineTo(-19, -22);
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(-19, -24, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (isBoss || isFusion) {
    // Spiked Overlord Crown + Twin Horns
    ctx.fillStyle = isFusion ? '#E879F9' : '#FACC15';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, -24);
    ctx.lineTo(-18, -40);
    ctx.lineTo(-6, -30);
    ctx.lineTo(0, -42);
    ctx.lineTo(6, -30);
    ctx.lineTo(18, -40);
    ctx.lineTo(15, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Reached-Out Armored Arm
  ctx.fillStyle = skinBot;
  drawRoundedRect(ctx, -22, 0, 12, 6, 3);
  ctx.fill();
  ctx.stroke();

  if ((opts.hitFlash ?? 0) > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, opts.hitFlash ?? 0)})`;
    ctx.beginPath();
    ctx.arc(0, -6, 22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // HP Bar + Blue Math-Armor Bar!
  const barW = 36;
  const barY = -44;
  if (opts.hpRatio !== undefined) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-barW / 2, barY, barW, 5.5);
    ctx.fillStyle = opts.hpRatio > 0.45 ? '#22C55E' : '#F43F5E';
    ctx.fillRect(-barW / 2 + 1, barY + 1, (barW - 2) * Math.max(0, opts.hpRatio), 3.5);
  }
  if ((opts.armorRatio ?? 0) > 0) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-barW / 2, barY - 5, barW, 4.5);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(-barW / 2 + 1, barY - 4, (barW - 2) * Math.max(0, opts.armorRatio ?? 0), 2.5);
  }

  // Formula Shield Badge above Armored/Elite/Fusion Zombie
  if (badgeFormula) {
    ctx.save();
    ctx.translate(0, -58);
    const pillW = Math.max(54, badgeFormula.length * 8.5 + 14);
    ctx.fillStyle = isFusion ? 'rgba(88, 28, 135, 0.94)' : 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = isFusion ? '#E879F9' : '#38BDF8';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, -pillW / 2, -11, pillW, 20, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 10.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeFormula, 0, -0.5);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 5. SCIENCE WORLD (元素料理大亂鬥):
 * - Blazing Red Panda Chef / Ice Crystal Penguin / Thunder Mantis Blade Chef
 * - Abyssal Chaos Glutton Dragon Lord (深淵混沌饕餮龍王)
 */
export function drawDarkGluttonBoss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  hpRatio: number,
  hitFlash = 0,
  mood: 'hungry' | 'hurt' | 'happy' = 'hungry'
) {
  const hover = Math.sin(time * 3.2) * 7;
  const roar = hitFlash > 0.15 || mood === 'hurt' ? 1 : Math.max(0, Math.sin(time * 2.4) - 0.65) * 2.8;
  ctx.save();
  ctx.translate(x, y + hover);

  // Dark Abyssal Dragon Aura + Floating Obsidian Armor Plates
  const aura = ctx.createRadialGradient(0, 0, 18, 0, 0, 92);
  aura.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
  aura.addColorStop(0.55, 'rgba(126, 34, 206, 0.25)');
  aura.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 92, 0, Math.PI * 2);
  ctx.fill();

  // Floating Obsidian Dragon Shoulder Plates
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.translate(dir * 66, -12 + Math.sin(time * 4 + dir) * 7);
    ctx.rotate(dir * (0.28 + Math.sin(time * 3) * 0.08));
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(dir * 18, -6);
    ctx.lineTo(dir * 10, 22);
    ctx.lineTo(-dir * 8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Sweeping Obsidian Dragon Wings
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.scale(dir, 1);
    const wingBeat = Math.sin(time * 4.5) * 0.12;
    ctx.rotate(wingBeat);
    const wg = ctx.createLinearGradient(20, -40, 88, 10);
    wg.addColorStop(0, '#3B0764');
    wg.addColorStop(1, '#0F172A');
    ctx.fillStyle = wg;
    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(28, -14);
    ctx.lineTo(84, -46);
    ctx.lineTo(92, -6);
    ctx.lineTo(66, 12);
    ctx.lineTo(44, 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Obsidian Crystal Dragon Horns (Twin Swept Back)
  for (const dir of [-1, 1]) {
    const hGrad = ctx.createLinearGradient(0, -76, 0, -28);
    hGrad.addColorStop(0, '#E879F9');
    hGrad.addColorStop(0.5, '#7E22CE');
    hGrad.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = hGrad;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(dir * 18, -32);
    ctx.quadraticCurveTo(dir * 46, -54, dir * 40, -78);
    ctx.quadraticCurveTo(dir * 26, -56, dir * 8, -38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Dragon Armored Torso & Head
  const bodyG = ctx.createLinearGradient(0, -48, 0, 52);
  bodyG.addColorStop(0, '#4C1D95');
  bodyG.addColorStop(0.5, '#1E1B4B');
  bodyG.addColorStop(1, '#09090B');
  ctx.fillStyle = bodyG;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-48, 36);
  ctx.lineTo(-54, -12);
  ctx.lineTo(-32, -44);
  ctx.lineTo(0, -52);
  ctx.lineTo(32, -44);
  ctx.lineTo(54, -12);
  ctx.lineTo(48, 36);
  ctx.quadraticCurveTo(0, 56, -48, 36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Burning Magma Elemental Core in Chest
  ctx.save();
  ctx.shadowColor = '#F97316';
  ctx.shadowBlur = 16;
  const coreG = ctx.createRadialGradient(0, 26, 2, 0, 26, 16);
  coreG.addColorStop(0, '#FEF08A');
  coreG.addColorStop(0.55, '#F97316');
  coreG.addColorStop(1, '#BE123C');
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(13, 26);
  ctx.lineTo(0, 40);
  ctx.lineTo(-13, 26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Fierce Blazing Dragon Eyes
  drawFierceEye(ctx, -20, -18, 12, 7.2, '#FDE047', 0.3);
  drawFierceEye(ctx, 20, -18, 12, 7.2, '#FDE047', -0.3);

  // Roaring Dragon Maw + Glowing Flame Breath!
  const mawH = 11 + roar * 9;
  ctx.fillStyle = '#450A0A';
  ctx.strokeStyle = '#F43F5E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 2, 24, mawH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Dragon Fangs
  ctx.fillStyle = '#F8FAFC';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 8 - 3.5, -mawH + 2);
    ctx.lineTo(i * 8, -mawH + 10);
    ctx.lineTo(i * 8 + 3.5, -mawH + 2);
    ctx.closePath();
    ctx.fill();
  }

  // Roaring Flame Glow inside Maw
  if (roar > 0.25) {
    ctx.fillStyle = `rgba(251, 146, 60, ${Math.min(0.85, roar * 0.7)})`;
    ctx.beginPath();
    ctx.ellipse(0, 4, 15, mawH * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (hitFlash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, hitFlash)})`;
    ctx.beginPath();
    ctx.arc(0, -4, 62, 0, Math.PI * 2);
    ctx.fill();
  }

  // Boss HP Bar
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  drawRoundedRect(ctx, -64, -84, 128, 12, 6);
  ctx.fill();
  const hpg = ctx.createLinearGradient(-62, 0, 62, 0);
  hpg.addColorStop(0, '#F43F5E');
  hpg.addColorStop(1, '#F97316');
  ctx.fillStyle = hpg;
  drawRoundedRect(ctx, -62, -82, 124 * Math.max(0, hpRatio), 8, 4);
  ctx.fill();
  ctx.restore();
}

export function drawChefCharacter(
  ctx: CanvasRenderingContext2D,
  rawTheme: 'redpanda' | 'panda' | 'penguin' | 'mantis' | 'fox',
  x: number,
  y: number,
  time: number,
  pulse = 0,
  carryingLabel: string | null = null,
  appearance?: EquipmentAppearance
) {
  if(rawTheme!=='fox' && drawWorldAvatar(ctx,rawTheme==='panda'?'redpanda':rawTheme,x,y-Math.max(0,pulse)*8,time,appearance,0,false,0,pulse))return;
  const theme: 'panda' | 'penguin' | 'mantis' | 'fox' = rawTheme === 'redpanda' ? 'panda' : rawTheme;
  const bob = Math.sin(time * 6.5) * 2.5 - pulse * 10;
  const scarfWave = Math.sin(time * 9) * 5;
  ctx.save();
  ctx.translate(x, y + bob);
  if (pulse > 0.05) {
    const s = 1 + pulse * 0.12;
    ctx.scale(s, s);
  }

  // Ground Shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
  ctx.beginPath();
  ctx.ellipse(0, 29 - bob * 0.4, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flowing Elemental Chef Scarf
  ctx.fillStyle =
    theme === 'penguin'
      ? '#38BDF8'
      : theme === 'mantis'
        ? '#22C55E'
        : theme === 'fox'
          ? '#F59E0B'
          : '#EF4444';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -2);
  ctx.quadraticCurveTo(-28 - scarfWave, 4, -30 - scarfWave, 18);
  ctx.lineTo(-22 - scarfWave * 0.6, 20);
  ctx.quadraticCurveTo(-18, 8, -4, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crisp White Double-Breasted Chef Coat + Gold Trim
  const coatG = ctx.createLinearGradient(0, -4, 0, 26);
  coatG.addColorStop(0, '#FFFFFF');
  coatG.addColorStop(1, '#E2E8F0');
  ctx.fillStyle = coatG;
  drawRoundedRect(ctx, -16, -2, 32, 26, 9);
  ctx.fill();
  ctx.stroke();

  // Gold Buttons & Sash
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(-4, 7, 2.2, 0, Math.PI * 2);
  ctx.arc(4, 7, 2.2, 0, Math.PI * 2);
  ctx.arc(-4, 15, 2.2, 0, Math.PI * 2);
  ctx.arc(4, 15, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Character Head (Blazing Red Panda / Ice Penguin / Thunder Mantis / Wind Fox)
  if (theme === 'panda') {
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.ellipse(22, 16, 12, 6, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const pg = ctx.createRadialGradient(-5, -20, 3, 0, -14, 21);
    pg.addColorStop(0, '#FB923C');
    pg.addColorStop(0.7, '#EA580C');
    pg.addColorStop(1, '#9A3412');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.ellipse(0, -14, 19, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (const dir of [-1, 1]) {
      ctx.fillStyle = '#7C2D12';
      ctx.beginPath();
      ctx.moveTo(dir * 12, -24);
      ctx.lineTo(dir * 20, -37);
      ctx.lineTo(dir * 5, -28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFBEB';
      ctx.beginPath();
      ctx.moveTo(dir * 12, -26);
      ctx.lineTo(dir * 16, -33);
      ctx.lineTo(dir * 8, -28);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.ellipse(-10, -8, 6.5, 4.5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(10, -8, 6.5, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    drawAnimeEye(ctx, -7, -14.5, 4.4, 5.0, '#FDE047', '#C2410C', 0.4);
    drawAnimeEye(ctx, 7, -14.5, 4.4, 5.0, '#FDE047', '#C2410C', -0.4);

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.ellipse(0, -9, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme === 'penguin') {
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.ellipse(0, -14, 18.5, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.ellipse(0, -10, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    drawAnimeEye(ctx, -7, -14, 4.4, 5.0, '#67E8F9', '#0369A1', 0.4);
    drawAnimeEye(ctx, 7, -14, 4.4, 5.0, '#67E8F9', '#0369A1', -0.4);
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.lineTo(4, -9);
    ctx.lineTo(0, -4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (theme === 'fox') {
    // 4P Starlight Wind Fox Chef
    const fg = ctx.createRadialGradient(-4, -19, 3, 0, -14, 20);
    fg.addColorStop(0, '#FDE68A');
    fg.addColorStop(0.65, '#F59E0B');
    fg.addColorStop(1, '#B45309');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(0, -14, 18.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const dir of [-1, 1]) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(dir * 10, -24);
      ctx.lineTo(dir * 22, -41);
      ctx.lineTo(dir * 4, -29);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.ellipse(0, -8, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    drawAnimeEye(ctx, -7, -14, 4.4, 5.0, '#A7F3D0', '#047857', 0.4);
    drawAnimeEye(ctx, 7, -14, 4.4, 5.0, '#A7F3D0', '#047857', -0.4);
  } else {
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.ellipse(0, -14, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-6, -28);
    ctx.quadraticCurveTo(-12, -40, -18, -36);
    ctx.moveTo(6, -28);
    ctx.quadraticCurveTo(12, -40, 18, -36);
    ctx.stroke();
    drawAnimeEye(ctx, -7, -14, 4.5, 5.0, '#FEF08A', '#15803D', 0.4);
    drawAnimeEye(ctx, 7, -14, 4.5, 5.0, '#FEF08A', '#15803D', -0.4);
  }

  // Tall Gold-Trimmed Master Chef Toque Hat!
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-8, -36, 8.5, 0, Math.PI * 2);
  ctx.arc(0, -40, 9.5, 0, Math.PI * 2);
  ctx.arc(8, -36, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, -13, -34, 26, 10, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(-13, -27, 26, 3.2);

  // Glowing Elemental Kitchen Cleaver
  ctx.save();
  ctx.translate(20, 4);
  ctx.rotate(-0.35 + Math.sin(time * 8) * 0.14);
  ctx.fillStyle = '#F1F5F9';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.8;
  drawRoundedRect(ctx, -3, -18, 12, 16, 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#78350F';
  drawRoundedRect(ctx, -1, -2, 5, 9, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (carryingLabel) {
    ctx.fillStyle = '#FEF08A';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, -34, -67, 68, 20, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 10.5px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(carryingLabel.slice(0, 6), 0, -57);
  }

  ctx.restore();
}

/**
 * Hero Class Specialization Battle Aura + Tier 4 Legendary Golden Wings
 */
export function drawHeroClassAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  classBranch: 'none' | 'blade' | 'arcane' | 'guardian',
  tier: 1 | 2 | 3 | 4
) {
  ctx.save();
  ctx.translate(x, y);

  // Tier 4 Legendary Golden Holy Wings
  if (tier >= 4) {
    const flap = Math.sin(time * 5.2) * 0.14;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.scale(dir, 1);
      ctx.rotate(-0.2 + flap);
      const wg = ctx.createLinearGradient(8, -28, 56, 8);
      wg.addColorStop(0, 'rgba(254, 240, 138, 0.92)');
      wg.addColorStop(0.55, 'rgba(251, 191, 36, 0.72)');
      wg.addColorStop(1, 'rgba(245, 158, 11, 0.08)');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(8, -6);
      ctx.quadraticCurveTo(32, -38, 56, -18);
      ctx.quadraticCurveTo(42, 0, 48, 12);
      ctx.quadraticCurveTo(24, 10, 8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Class-specific rotating energy halo (zero shadowBlur for 60FPS!)
  if (classBranch === 'blade') {
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.72)';
    ctx.lineWidth = 2.6;
    for (let i = 0; i < 3; i++) {
      const a = time * 3.8 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(0, 0, 34 + i * 3, a, a + 0.9);
      ctx.stroke();
    }
  } else if (classBranch === 'arcane') {
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = time * 2.6 + (i * Math.PI) / 2;
      ctx.fillStyle = i % 2 === 0 ? '#67E8F9' : '#E879F9';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 38, Math.sin(a) * 16, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (classBranch === 'guardian') {
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 40 + Math.sin(time * 4) * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (tier >= 2) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export interface MechaSpriteCache {
  ships: HTMLCanvasElement[]; // 0: 1P Blue, 1: 2P Pink, 2: 3P Gold, 3: 4P Emerald
  bolts: HTMLCanvasElement[];
}

/**
 * Pre-rendered Offscreen Canvas Sprite Cache for 60FPS Galaxy Shooter (zero per-frame shadowBlur).
 */
export function createMechaSpriteCache(): MechaSpriteCache {
  const palettes = [
    { dark: '#1D4ED8', bright: '#38BDF8', cannon: '#F43F5E', canopy: '#22D3EE' }, // 1P Blue
    { dark: '#9D174D', bright: '#EC4899', cannon: '#22D3EE', canopy: '#FDE047' }, // 2P Pink
    { dark: '#B45309', bright: '#F59E0B', cannon: '#38BDF8', canopy: '#FEF08A' }, // 3P Gold
    { dark: '#047857', bright: '#10B981', cannon: '#FDE047', canopy: '#A7F3D0' }, // 4P Emerald
  ];

  const ships = palettes.map((pal) => {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.translate(48, 50);
      const wg = ctx.createLinearGradient(-36, -8, 36, 18);
      wg.addColorStop(0, pal.dark);
      wg.addColorStop(0.5, pal.bright);
      wg.addColorStop(1, pal.dark);
      ctx.fillStyle = wg;
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(13, -6);
      ctx.lineTo(38, 10);
      ctx.lineTo(34, 21);
      ctx.lineTo(13, 14);
      ctx.lineTo(7, 23);
      ctx.lineTo(-7, 23);
      ctx.lineTo(-13, 14);
      ctx.lineTo(-34, 21);
      ctx.lineTo(-38, 10);
      ctx.lineTo(-13, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(10, -10);
      ctx.lineTo(14, 15);
      ctx.lineTo(0, 19);
      ctx.lineTo(-14, 15);
      ctx.lineTo(-10, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pal.cannon;
      drawRoundedRect(ctx, -31, -2, 6, 16, 2);
      ctx.fill();
      ctx.stroke();
      drawRoundedRect(ctx, 25, -2, 6, 16, 2);
      ctx.fill();
      ctx.stroke();

      const cg = ctx.createLinearGradient(0, -20, 0, 5);
      cg.addColorStop(0, '#FFFFFF');
      cg.addColorStop(0.5, pal.canopy);
      cg.addColorStop(1, pal.dark);
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(0, -7, 6.5, 13.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    return c;
  });

  const bolts = palettes.map((pal) => {
    const c = document.createElement('canvas');
    c.width = 20;
    c.height = 36;
    const ctx = c.getContext('2d');
    if (ctx) {
      const g = ctx.createLinearGradient(10, 2, 10, 34);
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(0.45, pal.bright);
      g.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = g;
      drawRoundedRect(ctx, 6, 3, 8, 28, 4);
      ctx.fill();
    }
    return c;
  });

  return { ships, bolts };
}
