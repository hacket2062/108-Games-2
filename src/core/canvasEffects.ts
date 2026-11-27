import type { AscensionPath, GuardianId } from '../types/game';
import { ASCENSION_PATHS } from '../data/itemsAndGems';
import { drawGuardianSpirit, drawRoundedRect } from '../canvas/proceduralArt';

export * from '../canvas/proceduralArt';

export interface PvPDuelistRenderOptions {
  facing: 1 | -1;
  name: string;
  weaponPath: AscensionPath;
  weaponLevel: number;
  guardianId: GuardianId;
  attackProgress: number; // 0..1
  hitFlash: number; // 0..1
  shielded: boolean;
  fogged: boolean;
  scale?: number;
}

/**
 * 60FPS Chibi 2.5-Head-Ratio PvP Arena Duelist with 3-Path Weapon Ascension Aura
 * (Hero Golden Halo / Mythic Starlight Rings / Inferno Crimson Flames) + mini Guardian companion!
 */
export function drawPvPDuelist(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  opts: PvPDuelistRenderOptions
) {
  const scale = opts.scale ?? 1.35;
  const path = ASCENSION_PATHS[opts.weaponPath];
  const breathe = Math.sin(time * 4.5 + (opts.facing > 0 ? 0 : 1.7)) * 3.5;
  const swing = Math.sin(opts.attackProgress * Math.PI);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Ground shadow
  ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 38, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3-Path Weapon Ascension Ground Aura!
  if (opts.weaponPath !== 'base' || opts.weaponLevel >= 5) {
    ctx.save();
    ctx.strokeStyle = path.auraPrimary;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.72 + Math.sin(time * 6) * 0.2;
    ctx.beginPath();
    ctx.ellipse(0, 34, 36 + Math.sin(time * 5) * 4, 13, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (opts.weaponPath === 'mythic') {
      // Orbiting starlight runes
      for (let i = 0; i < 3; i++) {
        const a = time * 2.8 + (i * Math.PI * 2) / 3;
        const rx = Math.cos(a) * 40;
        const ry = Math.sin(a) * 16 - 4;
        ctx.fillStyle = i % 2 === 0 ? '#38BDF8' : '#C084FC';
        ctx.beginPath();
        ctx.arc(rx, ry, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (opts.weaponPath === 'inferno') {
      // Rising crimson flame wisps
      for (let i = 0; i < 4; i++) {
        const phase = (time * 2.2 + i * 0.25) % 1;
        const fx = Math.sin(i * 2.1 + time * 4) * 26;
        const fy = 28 - phase * 62;
        ctx.fillStyle = phase < 0.5 ? '#F43F5E' : '#FB923C';
        ctx.globalAlpha = (1 - phase) * 0.75;
        ctx.beginPath();
        ctx.arc(fx, fy, 5 * (1 - phase * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (opts.weaponPath === 'hero') {
      // Golden Halo crest behind head
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -18, 28, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Mini Guardian floating behind shoulder
  drawGuardianSpirit(
    ctx,
    opts.guardianId,
    -opts.facing * 42,
    -28 + Math.sin(time * 5) * 4,
    time,
    0.58,
    swing * 0.6
  );

  // Flip character body by facing direction
  ctx.save();
  ctx.scale(opts.facing, 1);
  ctx.translate(swing * 18, breathe);

  // Flowing cloak
  ctx.fillStyle = opts.facing > 0 ? '#1D4ED8' : '#9F1239';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-12, 2);
  ctx.quadraticCurveTo(-28 - Math.sin(time * 7) * 5, 18, -20, 32);
  ctx.lineTo(10, 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Legs
  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, -10, 24, 8, 12, 3);
  ctx.fill();
  drawRoundedRect(ctx, 3, 24, 8, 12, 3);
  ctx.fill();

  // Tunic armor torso
  ctx.fillStyle = opts.facing > 0 ? '#38BDF8' : '#FB7185';
  drawRoundedRect(ctx, -13, 0, 26, 26, 8);
  ctx.fill();
  ctx.stroke();

  // Belt emblem
  ctx.fillStyle = path.auraPrimary;
  ctx.fillRect(-13, 14, 26, 5);

  // Big Chibi Head (2.5-head ratio)
  ctx.fillStyle = '#FDE6C4';
  ctx.beginPath();
  ctx.arc(0, -15, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Spiky anime hair / helmet crest
  ctx.fillStyle = opts.facing > 0 ? '#1E3A8A' : '#4C0519';
  ctx.beginPath();
  ctx.arc(0, -19, 18.5, Math.PI * 0.95, Math.PI * 2.08);
  ctx.lineTo(14, -28);
  ctx.lineTo(5, -35);
  ctx.lineTo(-4, -29);
  ctx.lineTo(-14, -33);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(5, -13, 3, 0, Math.PI * 2);
  ctx.arc(13, -13, 2.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(6, -14.2, 1.1, 0, Math.PI * 2);
  ctx.arc(13.8, -14.2, 1, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Ascended Weapon Blade held heroically forward!
  ctx.save();
  ctx.translate(18, 10);
  ctx.rotate(0.52 + swing * 1.05);

  // Outer aura glow
  if (opts.weaponLevel >= 3 || opts.weaponPath !== 'base') {
    ctx.strokeStyle = path.auraPrimary;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, -46);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Blade steel / ascended crystal core
  ctx.fillStyle = opts.weaponPath === 'base' ? '#E2E8F0' : path.auraSecondary;
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(0, -48);
  ctx.lineTo(5, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crossguard
  ctx.fillStyle = path.auraPrimary;
  drawRoundedRect(ctx, -9, -5, 18, 6, 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (opts.hitFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, opts.hitFlash)})`;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Reflective Shield Dome
  if (opts.shielded) {
    ctx.strokeStyle = '#38BDF8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Name + Weapon Enhance Tag
  ctx.font = '800 11px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#0F172A';
  const badge = `${opts.name} (+${opts.weaponLevel})`;
  ctx.strokeText(badge, 0, -46);
  ctx.fillStyle = opts.facing > 0 ? '#BAE6FD' : '#FECDD3';
  ctx.fillText(badge, 0, -46);

  ctx.restore();
}
