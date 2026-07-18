import { describe, expect, it } from "vitest";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import {
  crossingResidualBasicCase,
  overtakingBothDirectionsCase,
} from "../../domain/colregs/classify-encounter.fixtures.js";
import { classifyingEntryIndex, ruleNumber } from "./reasoning-trail-tag.js";

describe("classifyingEntryIndex", () => {
  it("returns trailLength - 2 (the always-second-to-last entry)", () => {
    expect(classifyingEntryIndex(5)).toBe(3);
    expect(classifyingEntryIndex(3)).toBe(1);
    expect(classifyingEntryIndex(4)).toBe(2);
  });

  it("points at the real classifying-rule entry for a 5-entry crossing trail", () => {
    const { vesselA, vesselB } = crossingResidualBasicCase;
    const result = classifyEncounter(vesselA, vesselB);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const trail = result.value.trail;
    expect(trail).toHaveLength(5);
    expect(trail[classifyingEntryIndex(trail.length)]?.ruleId).toBe("Rule 15");
  });

  it("points at the real classifying-rule entry for a 3-entry overtaking trail", () => {
    const { vesselA, vesselB } = overtakingBothDirectionsCase;
    const result = classifyEncounter(vesselA, vesselB);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const trail = result.value.trail;
    expect(trail).toHaveLength(3);
    expect(trail[classifyingEntryIndex(trail.length)]?.ruleId).toBe("Rule 13(a)-(b)");
  });
});

describe("ruleNumber", () => {
  it("extracts the leading rule number from a compound ruleId", () => {
    expect(ruleNumber("Rule 13(a)-(b)")).toBe("13");
  });

  it("extracts the leading rule number from a plain ruleId", () => {
    expect(ruleNumber("Rule 15")).toBe("15");
  });

  it("falls back to the raw ruleId unchanged when there is no match", () => {
    expect(ruleNumber("GEOMETRY")).toBe("GEOMETRY");
  });
});
