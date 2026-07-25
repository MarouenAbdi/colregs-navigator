import { describe, expect, it } from "vitest";
import { deriveOverlayAnchor } from "./vessel-overlay-position.js";

const CONTAINER = { width: 400, height: 400 };

describe("deriveOverlayAnchor", () => {
  it("anchors right/below when the vessel is in the top-left quadrant", () => {
    const result = deriveOverlayAnchor({ screenX: 100, screenY: 100 }, CONTAINER);
    expect(result.right).toBe(true);
    expect(result.below).toBe(true);
    expect(result.offsetXPx).toBe(100 + 26);
    expect(result.offsetYPx).toBe(100 - 6);
  });

  it("anchors left/above when the vessel is in the bottom-right quadrant", () => {
    const result = deriveOverlayAnchor({ screenX: 300, screenY: 300 }, CONTAINER);
    expect(result.right).toBe(false);
    expect(result.below).toBe(false);
    expect(result.offsetXPx).toBe(CONTAINER.width - 300 + 26);
    expect(result.offsetYPx).toBe(CONTAINER.height - 300 - 6);
  });

  it("resolves the exact horizontal/vertical halfway point deterministically via the < comparison", () => {
    const result = deriveOverlayAnchor(
      { screenX: CONTAINER.width / 2, screenY: CONTAINER.height / 2 },
      CONTAINER,
    );
    // screenX < width/2 is false at exact halfway -> right anchors false (left side)
    expect(result.right).toBe(false);
    expect(result.below).toBe(false);
    expect(Number.isNaN(result.offsetXPx)).toBe(false);
    expect(Number.isNaN(result.offsetYPx)).toBe(false);
  });

  it("clamps offsetYPx at 0 rather than going negative near the top edge", () => {
    const result = deriveOverlayAnchor({ screenX: 100, screenY: 2 }, CONTAINER);
    expect(result.offsetYPx).toBe(0);
  });

  it("clamps offsetYPx at 0 rather than going negative near the bottom edge", () => {
    const result = deriveOverlayAnchor({ screenX: 300, screenY: 398 }, CONTAINER);
    expect(result.offsetYPx).toBe(0);
  });
});
