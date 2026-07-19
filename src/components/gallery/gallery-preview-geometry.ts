/**
 * Gallery-local (not `shared/`) per-card dynamic bounding-box-from-
 * vessel-pair math. This is genuinely new logic neither Hero's one-
 * fixture hand-solved `HERO_VIEW_BOX` constant nor `ChartPanel.tsx`'s
 * fixed 20nm box needs -- per CLAUDE.md's "extract only on a real second
 * consumer" convention, it stays here until a second consumer of this
 * specific function exists.
 */
import type { ChartViewBox } from "../../domain/geometry/screen-convert.js";
import type { Position } from "../../domain/vessel/vessel.js";

export function computeCardViewBox(
  a: Position,
  b: Position,
  aspectRatio: number, // width / height, e.g. 360/240
  paddingFraction: number, // e.g. 0.35
): ChartViewBox {
  const minXRaw = Math.min(a.x, b.x);
  const maxXRaw = Math.max(a.x, b.x);
  const minYRaw = Math.min(a.y, b.y);
  const maxYRaw = Math.max(a.y, b.y);
  // Guard coincident axes (e.g. a purely vertical vessel pair, where
  // maxXRaw - minXRaw would otherwise be exactly 0).
  const rawWidth = Math.max(maxXRaw - minXRaw, 0.001);
  const rawHeight = Math.max(maxYRaw - minYRaw, 0.001);

  const padX = rawWidth * paddingFraction;
  const padY = rawHeight * paddingFraction;
  let width = rawWidth + padX * 2;
  let height = rawHeight + padY * 2;
  const centerX = (minXRaw + maxXRaw) / 2;
  const centerY = (minYRaw + maxYRaw) / 2;

  // Force the box onto the card's fixed aspect ratio by growing whichever
  // dimension is proportionally smaller -- never shrinking, so neither
  // vessel ever clips outside the final box.
  if (width / height > aspectRatio) {
    height = width / aspectRatio;
  } else {
    width = height * aspectRatio;
  }

  return { minX: centerX - width / 2, minY: centerY - height / 2, width, height };
}
