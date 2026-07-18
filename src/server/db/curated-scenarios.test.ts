/**
 * Coverage/validation tests for curated-scenarios.ts (SCEN-03, D-04).
 *
 * These tests validate the SHAPE of the curated set (count, classifiability,
 * encounter-type coverage, genuine mirror-geometry, genuine Rule 18
 * overrides, and displayOrder/rationale integrity) -- never hand-copying
 * expected encounterType/giveWay values, always deriving them via
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

  it("Test 3: encounter-type coverage includes head-on, a genuine crossing give-way/stand-on mirror pair, and overtaking", () => {
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

    const overtakingEntries = classified.filter(
      (c) => c.verdict.encounterType === "overtaking",
    );
    expect(overtakingEntries.length).toBeGreaterThanOrEqual(1);

    const crossingEntries = classified.filter(
      (c) => c.verdict.encounterType === "crossing",
    );
    const giveWayA = crossingEntries.find((c) => c.verdict.giveWay === "vesselA");
    const giveWayB = crossingEntries.find((c) => c.verdict.giveWay === "vesselB");
    expect(giveWayA).toBeDefined();
    expect(giveWayB).toBeDefined();

    // Genuine mirror-geometry property: the give-way-vesselA entry and the
    // give-way-vesselB entry must be the SAME physical encounter with
    // vessel-slot labels swapped, not two different encounters that happen
    // to both be crossings.
    expect(giveWayA!.entry.vesselA.position).toEqual(
      giveWayB!.entry.vesselB.position,
    );
    expect(giveWayA!.entry.vesselA.heading).toEqual(
      giveWayB!.entry.vesselB.heading,
    );
    expect(giveWayA!.entry.vesselB.position).toEqual(
      giveWayB!.entry.vesselA.position,
    );
    expect(giveWayA!.entry.vesselB.heading).toEqual(
      giveWayB!.entry.vesselA.heading,
    );
  });

  it("Test 4: 1-2 entries demonstrate a genuine Rule 18 vessel-type-priority override", () => {
    const mismatchEntries = curatedScenarios.filter(
      (entry) => entry.vesselA.type !== entry.vesselB.type,
    );
    expect(mismatchEntries.length).toBeGreaterThanOrEqual(1);
    expect(mismatchEntries.length).toBeLessThanOrEqual(2);

    for (const entry of mismatchEntries) {
      const actual = classifyEncounter(entry.vesselA, entry.vesselB);
      expect(actual.ok).toBe(true);
      if (!actual.ok) continue;

      // Baseline: same geometry, but vesselB's type is forced to match
      // vesselA's, removing the type mismatch while preserving every
      // geometric fact. If the override is genuine, the give-way
      // assignment must differ between the actual (mismatched) case and
      // this same-type baseline.
      const baselineVesselB: Vessel = { ...entry.vesselB, type: entry.vesselA.type };
      const baseline = classifyEncounter(entry.vesselA, baselineVesselB);
      expect(baseline.ok).toBe(true);
      if (!baseline.ok) continue;

      expect(actual.value.encounterType).toBe(baseline.value.encounterType);
      expect(actual.value.giveWay).not.toBe(baseline.value.giveWay);
    }
  });

  it("Test 5: every displayOrder is a unique integer, and every rationale is a non-empty string", () => {
    const displayOrders = curatedScenarios.map((entry) => entry.displayOrder);
    const uniqueDisplayOrders = new Set(displayOrders);
    expect(uniqueDisplayOrders.size).toBe(displayOrders.length);
    for (const displayOrder of displayOrders) {
      expect(Number.isInteger(displayOrder)).toBe(true);
    }

    for (const entry of curatedScenarios) {
      expect(typeof entry.rationale).toBe("string");
      expect(entry.rationale.length).toBeGreaterThan(0);
    }
  });
});
