import { describe, expect, it } from "vitest";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { CHIP_ORDER, CHIP_SCENARIOS, type ChipId } from "./chip-scenarios.js";

/**
 * Safety net (per the Sandbox research doc's own recommendation): exercise
 * all 6 chip fixtures through the REAL classifyEncounter(), not just the
 * hand-derived/reimplemented math the fixtures were designed against --
 * a hand-reimplementation, however careful, is not the same as running the
 * actual module.
 */

interface ExpectedVerdict {
  encounterType: "head-on" | "crossing" | "overtaking";
  giveWay: "vesselA" | "vesselB" | null;
  standOn: "vesselA" | "vesselB" | null;
  doubt: boolean;
  riskOfCollision?: boolean;
}

const EXPECTED: Record<ChipId, ExpectedVerdict> = {
  "classic-crossing": {
    encounterType: "crossing",
    giveWay: "vesselA",
    standOn: "vesselB",
    doubt: false,
  },
  "head-on-meeting": {
    encounterType: "head-on",
    giveWay: null,
    standOn: null,
    doubt: true,
  },
  overtaking: {
    encounterType: "overtaking",
    giveWay: "vesselA",
    standOn: "vesselB",
    doubt: false,
  },
  "sailing-has-priority": {
    encounterType: "crossing",
    giveWay: "vesselA",
    standOn: "vesselB",
    doubt: false,
  },
  "not-under-command": {
    encounterType: "crossing",
    giveWay: "vesselA",
    standOn: "vesselB",
    doubt: false,
    riskOfCollision: true,
  },
  "in-doubt": {
    encounterType: "head-on",
    giveWay: null,
    standOn: null,
    doubt: true,
    riskOfCollision: true,
  },
};

describe("CHIP_SCENARIOS", () => {
  it("defines all 6 ChipId values", () => {
    const ids = Object.keys(CHIP_SCENARIOS).sort();
    expect(ids).toEqual(
      [
        "classic-crossing",
        "head-on-meeting",
        "overtaking",
        "sailing-has-priority",
        "not-under-command",
        "in-doubt",
      ].sort(),
    );
  });

  for (const [id, expected] of Object.entries(EXPECTED) as [ChipId, ExpectedVerdict][]) {
    it(`"${id}" classifies as documented against the real classifyEncounter()`, () => {
      const { vesselA, vesselB } = CHIP_SCENARIOS[id];
      const result = classifyEncounter(vesselA, vesselB);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.encounterType).toBe(expected.encounterType);
      expect(result.value.giveWay).toBe(expected.giveWay);
      expect(result.value.standOn).toBe(expected.standOn);
      expect(result.value.doubt).toBe(expected.doubt);
      if (expected.riskOfCollision !== undefined) {
        expect(result.value.riskOfCollision).toBe(expected.riskOfCollision);
      }
    });
  }
});

describe("CHIP_ORDER", () => {
  it("lists all 6 chips in the exact design order with verbatim labels", () => {
    expect(CHIP_ORDER.map((c) => c.id)).toEqual([
      "classic-crossing",
      "head-on-meeting",
      "overtaking",
      "sailing-has-priority",
      "not-under-command",
      "in-doubt",
    ]);
    expect(CHIP_ORDER.map((c) => c.label)).toEqual([
      "Classic crossing",
      "Head-on meeting",
      "Overtaking",
      "Sailing has priority",
      "Not under command",
      "In doubt",
    ]);
  });
});
