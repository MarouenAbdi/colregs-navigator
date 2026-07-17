/**
 * scenario-service.ts -- the sole place `classifyEncounter()` is invoked in
 * this phase (SCEN-02's core mechanism). This is the one file in the entire
 * codebase that both fetches stored rows AND calls `classifyEncounter()` on
 * them, on every single read -- never caching or persisting the verdict
 * (D-06).
 *
 * Open Question 1 (RESEARCH.md) resolution: validate at `createScenario`
 * time by calling `classifyEncounter()` once, discarding `.value` on
 * success (never persisted) and rejecting with `TRPCError({ code:
 * "BAD_REQUEST" })` when `result.ok` is false. This guarantees every row
 * `getScenario`/`listGallery` subsequently read is classifiable, so their
 * own re-derivation calls should never see `!ok` in practice -- but each
 * defensively checks `.ok` anyway (T-3-05: generic INTERNAL_SERVER_ERROR,
 * never leaking the domain-internal DegenerateCaseReason across the tRPC
 * boundary, D-10).
 */

import { TRPCError } from "@trpc/server";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import type { Vessel, VesselType } from "../../domain/vessel/vessel.js";
import type { ClassificationResult } from "../../domain/colregs/types.js";
import {
  create,
  findByShareId,
  findCurated,
  type ScenarioRow,
} from "../db/scenario-repository.js";

/**
 * Reconstructs `Vessel` objects from a `ScenarioRow`'s flat columns.
 * Casting `vesselAType`/`vesselBType` as `VesselType` is safe because the
 * only write path (`createScenario`, below) already validated these values
 * against `VesselTypeSchema` at the Zod-validated tRPC input boundary
 * (Open Question 3, RESEARCH.md) -- there is no other write path in this
 * project's scope that could bypass that validation.
 */
export function rowToVessels(row: ScenarioRow): {
  vesselA: Vessel;
  vesselB: Vessel;
} {
  return {
    vesselA: {
      position: { x: row.vesselAPosX, y: row.vesselAPosY },
      heading: row.vesselAHeading,
      speed: row.vesselASpeed,
      type: row.vesselAType as VesselType,
    },
    vesselB: {
      position: { x: row.vesselBPosX, y: row.vesselBPosY },
      heading: row.vesselBHeading,
      speed: row.vesselBSpeed,
      type: row.vesselBType as VesselType,
    },
  };
}

export async function createScenario(
  vesselA: Vessel,
  vesselB: Vessel,
): Promise<{ shareId: string }> {
  // Dry-run validation only -- the verdict itself is discarded, never
  // persisted (D-06). This is the last point before a row becomes
  // permanently persisted (T-3-04).
  const result = classifyEncounter(vesselA, vesselB);
  if (!result.ok) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Cannot classify scenario: ${result.reason}`,
    });
  }

  const row = await create(vesselA, vesselB);
  return { shareId: row.id };
}

export async function getScenario(
  shareId: string,
): Promise<(ScenarioRow & { verdict: ClassificationResult }) | null> {
  const row = await findByShareId(shareId);
  if (!row) {
    return null; // router turns this into TRPCError NOT_FOUND (D-10)
  }

  const { vesselA, vesselB } = rowToVessels(row);
  // SCEN-02: always fresh -- no `previous` argument, there is no persisted
  // classification to pass.
  const result = classifyEncounter(vesselA, vesselB);
  if (!result.ok) {
    // Theoretically unreachable given createScenario's dry-run validation
    // (T-3-04) -- defensive, not a non-null assertion. Never leak the
    // domain-internal DegenerateCaseReason across the tRPC boundary (D-10).
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stored scenario failed re-classification",
    });
  }

  return { ...row, verdict: result.value };
}

export async function listGallery(): Promise<
  Array<ScenarioRow & { verdict: ClassificationResult }>
> {
  const rows = await findCurated();
  return rows.map((row) => {
    const { vesselA, vesselB } = rowToVessels(row);
    const result = classifyEncounter(vesselA, vesselB);
    if (!result.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stored scenario failed re-classification",
      });
    }
    return { ...row, verdict: result.value };
  });
}
