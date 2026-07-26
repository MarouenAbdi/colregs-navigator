import { describe, expect, it } from "vitest";
import { TOUR_STEPS } from "./guided-tour-steps.js";

/**
 * Data-integrity guard (TOUR-01, TOUR-02): proves TOUR_STEPS holds exactly
 * the design source's 6 steps, in order, with the verbatim id/title/point
 * content -- so a future edit can't silently drop a step or drift the copy
 * away from `19-DESIGN-SNAPSHOT.md`.
 */
describe("guided-tour-steps data integrity", () => {
  it("exports exactly 6 entries", () => {
    expect(TOUR_STEPS).toHaveLength(6);
  });

  it("has ids 0 through 5 in order", () => {
    expect(TOUR_STEPS.map((step) => step.id)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("matches the design source's verbatim titles in order", () => {
    expect(TOUR_STEPS.map((step) => step.title)).toEqual([
      "Welcome aboard the Navigator",
      "Move the vessels",
      "Read the instruments",
      "Read the verdict",
      "Follow the reasoning",
      "Start from a classic",
    ]);
  });

  it("never concatenates the icon glyph into the title", () => {
    for (const step of TOUR_STEPS) {
      expect(step.title.startsWith(step.icon)).toBe(false);
    }
  });

  it("gives every step 2 or 3 points, each with a non-empty tag and text", () => {
    for (const step of TOUR_STEPS) {
      expect(step.points.length).toBeGreaterThanOrEqual(2);
      expect(step.points.length).toBeLessThanOrEqual(3);
      for (const point of step.points) {
        expect(point.tag.length).toBeGreaterThan(0);
        expect(point.text.length).toBeGreaterThan(0);
      }
    }
  });

  it("matches the design source's exact step 1 (Welcome) content", () => {
    const step0 = TOUR_STEPS[0];
    expect(step0.icon).toBe("⚓");
    expect(step0.body).toBe(
      "Drop two vessels on a nautical chart and this engine names the give-way ship — and the exact COLREGS rule behind the verdict. Here is how to read it.",
    );
    expect(step0.points).toEqual([
      {
        tag: "RULES 11–18",
        text: "Every verdict maps to the real Steering & Sailing Rules for vessels in sight of one another.",
      },
      {
        tag: "LIVE",
        text: "Anything you change recomputes instantly — geometry, verdict, and reasoning all update together.",
      },
    ]);
  });

  it("matches the design source's exact step 6 (Start from a classic) content", () => {
    const step5 = TOUR_STEPS[5];
    expect(step5.icon).toBe("❖");
    expect(step5.title).toBe("Start from a classic");
    expect(step5.points).toEqual([
      {
        tag: "6 SCENARIOS",
        text: "Crossing, head-on, overtaking, sailing priority, not-under-command, and an in-doubt case.",
      },
      {
        tag: "RESET",
        text: "The Reset button restores the current scenario to its textbook starting position at any time.",
      },
    ]);
  });
});
