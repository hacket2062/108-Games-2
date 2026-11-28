/** Keep answer targets reachable on the actual canvas, including narrow phones. */
export function spreadShooterTargets(width: number, count: number, preferredMargin = 140): number[] {
  const w = Math.max(1, width);
  const margin = Math.min(preferredMargin, w * .18);
  return Array.from({length: Math.max(0, count)}, (_, i) =>
    count === 1 ? w / 2 : margin + (w - margin * 2) * i / (count - 1));
}
export function shooterLetterBounds(height: number): [number, number] {
  const top = Math.min(210, height * .42);
  return [top, Math.max(top, Math.min(height * .62, height - 110))];
}
