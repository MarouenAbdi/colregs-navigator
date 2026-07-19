/**
 * Coverage/validation tests for curated-scenarios.ts (GAL-01, D-01 through
 * D-05).
 *
 * These tests validate the SHAPE of the curated set (count, classifiability,
 * encounter-type coverage, genuine Rule 18 overrides, and displayOrder/
 * rationale/title/ruleLabel integrity) -- never hand-copying expected
 * encounterType/giveWay values, always deriving them via
 * `classifyEncounter()` itself, so this suite can never silently drift from
 * the domain engine's actual behavior.
 */

import { describe, expect, it } from "vitest";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
import { curatedScenarios } from "./curated-scenarios.js";

describe("curatedScenarios", () => {
  it("Test 1: length is between 5 and 8 inclusive (SCEN-03's range)", () => {
    expect(curatedScenarios.length).toBeGreaterThanOrEqual(5);
    expect(curatedScenarios.length).toBeLessThanOrEqual(8);
  });

  it("Test 2: every entry classifies successfully (proves no hysteresis-dependent fixture was reused, Pitfall 3)", () => {
    for (const entry of curatedScenarios) {
      const result = classifyEncounter(entry.vesselA, entry.vesselB);
      expect(result.ok).toBe(true);
    }
  });

  it("Test 3: encounter-type coverage includes head-on, crossing, overtaking, and both A-gives-way and mutual outcomes", () => {
    const classified = curatedScenarios.map((entry) => {
      const result = classifyEncounter(entry.vesselA, entry.vesselB);
      if (!result.ok) {
        throw new Error(
          `Unexpected classification failure for displayOrder ${entry.displayOrder}: ${result.reason}`,
        );
      }
      return { entry, verdict: result.value };
    });

    const headOnEntries = classified.filter(
      (c) => c.verdict.encounterType === "head-on",
    );
    expect(headOnEntries.length).toBeGreaterThanOrEqual(1);

    const crossingEntries = classified.filter(
      (c) => c.verdict.encounterType === "crossing",
    );
    expect(crossingEntries.length).toBeGreaterThanOrEqual(1);

    const overtakingEntries = classified.filter(
      (c) => c.verdict.encounterType === "overtaking",
    );
    expect(overtakingEntries.length).toBeGreaterThanOrEqual(1);

    const giveWayAEntries = classified.filter(
      (c) => c.verdict.giveWay === "vesselA",
    );
    expect(giveWayAEntries.length).toBeGreaterThanOrEqual(1);

    const mutualEntries = classified.filter((c) => c.verdict.giveWay === null);
    expect(mutualEntries.length).toBeGreaterThanOrEqual(1);
  });

  it("Test 4: 1-3 entries demonstrate a type mismatch, and at least 1 is a genuine Rule 18 vessel-type-priority override", () => {
    const mismatchEntries = curatedScenarios.filter(
      (entry) => entry.vesselA.type !== entry.vesselB.type,
    );
    expect(mismatchEntries.length).toBeGreaterThanOrEqual(1);
    expect(mismatchEntries.length).toBeLessThanOrEqual(3);

    let genuineOverrideCount = 0;
    for (const entry of mismatchEntries) {
      const actual = classifyEncounter(entry.vesselA, entry.vesselB);
      expect(actual.ok).toBe(true);
      if (!actual.ok) continue;

      // Baseline: same geometry, but vesselB's type is forced to match
      // vesselA's, removing the type mismatch while preserving every
      // geometric fact. Some mismatch entries (e.g. "Sailing has priority")
      // legitimately have no override -- the geometric baseline already
      // matches Rule 18's outcome -- so inequality is not asserted
      // unconditionally for every mismatch entry.
      const baselineVesselB: Vessel = { ...entry.vesselB, type: entry.vesselA.type };
      const baseline = classifyEncounter(entry.vesselA, baselineVesselB);
      expect(baseline.ok).toBe(true);
      if (!baseline.ok) continue;

      expect(actual.value.encounterType).toBe(baseline.value.encounterType);
      if (actual.value.giveWay !== baseline.value.giveWay) {
        genuineOverrideCount += 1;
      }
    }
    expect(genuineOverrideCount).toBeGreaterThanOrEqual(1);
  });

  it("Test 5: every displayOrder is a unique integer, and every rationale/title/ruleLabel is a non-empty string", () => {
    const displayOrders = curatedScenarios.map((entry) => entry.displayOrder);
    const uniqueDisplayOrders = new Set(displayOrders);
    expect(uniqueDisplayOrders.size).toBe(displayOrders.length);
    for (const displayOrder of displayOrders) {
      expect(Number.isInteger(displayOrder)).toBe(true);
    }

    for (const entry of curatedScenarios) {
      expect(typeof entry.rationale).toBe("string");
      expect(entry.rationale.length).toBeGreaterThan(0);
      expect(typeof entry.title).toBe("string");
      expect(entry.title.length).toBeGreaterThan(0);
      expect(typeof entry.ruleLabel).toBe("string");
      expect(entry.ruleLabel.length).toBeGreaterThan(0);
    }
  });
});
