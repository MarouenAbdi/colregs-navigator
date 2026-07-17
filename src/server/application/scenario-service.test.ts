/**
 * Tests for scenario-service.ts -- SCEN-02's core mechanism: getScenario/
 * listGallery must genuinely re-run classifyEncounter() on every read, and
 * createScenario must reject unclassifiable input before persistence
 * (Open Question 1, resolved in this plan's Task 2).
 *
 * Runs against the live Docker Postgres instance from Plan 01 (D-01) --
 * repository calls are real, not mocked, except in Test 2 where a spy
 * asserts `create` is never invoked for rejected input.
 */

import { afterAll, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { prisma } from "../db/client.js";
import * as repository from "../db/scenario-repository.js";
import * as classifyModule from "../../domain/colregs/classify-encounter.js";
import {
  createScenario,
  getScenario,
  listGallery,
  rowToVessels,
} from "./scenario-service.js";
import { crossingResidualBasicCase } from "../../domain/colregs/classify-encounter.fixtures.js";
import type { Vessel } from "../../domain/vessel/vessel.js";

const createdIds: string[] = [];

afterAll(async () => {
  if (createdIds.length > 0) {
    await prisma.scenario.deleteMany({ where: { id: { in: createdIds } } });
  }
  vi.restoreAllMocks();
});

const coincidentVesselA: Vessel = {
  position: { x: 3, y: 3 },
  heading: 0,
  speed: 5,
  type: "power-driven",
};
const coincidentVesselB: Vessel = {
  position: { x: 3, y: 3 },
  heading: 90,
  speed: 5,
  type: "power-driven",
};

describe("scenario-service", () => {
  it("createScenario() with a valid classifiable pair calls repository.create and returns { shareId } matching the persisted row's id", async () => {
    const { vesselA, vesselB } = crossingResidualBasicCase;
    const result = await createScenario(vesselA, vesselB);
    createdIds.push(result.shareId);

    const persisted = await repository.findByShareId(result.shareId);
    expect(persisted).not.toBeNull();
    expect(persisted?.id).toBe(result.shareId);
  });

  it("createScenario() with a coincident-position pair throws TRPCError BAD_REQUEST before calling repository.create", async () => {
    const createSpy = vi.spyOn(repository, "create");

    await expect(
      createScenario(coincidentVesselA, coincidentVesselB),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(createSpy).not.toHaveBeenCalled();

    createSpy.mockRestore();
  });

  it("createScenario() rejection is a TRPCError instance with code BAD_REQUEST", async () => {
    await expect(
      createScenario(coincidentVesselA, coincidentVesselB),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("getScenario() returns null for a nonexistent shareId (not a thrown error)", async () => {
    const result = await getScenario("nonexistent-share-id-xyz");
    expect(result).toBeNull();
  });

  it("getScenario() for a shareId just created re-derives a verdict matching the same fixture's expected* values", async () => {
    const { vesselA, vesselB, expectedEncounterType, expectedGiveWay, expectedStandOn } =
      crossingResidualBasicCase;
    const created = await createScenario(vesselA, vesselB);
    createdIds.push(created.shareId);

    const classifySpy = vi.spyOn(classifyModule, "classifyEncounter");
    const callCountBefore = classifySpy.mock.calls.length;

    const fetched = await getScenario(created.shareId);

    expect(classifySpy.mock.calls.length).toBeGreaterThan(callCountBefore);
    expect(fetched).not.toBeNull();
    expect(fetched?.verdict.encounterType).toBe(expectedEncounterType);
    expect(fetched?.verdict.giveWay).toBe(expectedGiveWay);
    expect(fetched?.verdict.standOn).toBe(expectedStandOn);

    classifySpy.mockRestore();
  });

  it("listGallery() returns [] when no curated rows exist (D-07)", async () => {
    const result = await listGallery();
    // May contain rows curated by a different test run against the same
    // persistent DB -- assert the shape/emptiness contract using a filter
    // rather than assuming total isolation, but the acceptance criterion
    // requires toEqual([]) against a clean slate. This suite creates no
    // curated rows before this assertion runs, so it is expected to hold.
    expect(result).toEqual([]);
  });

  it("listGallery() returns curated rows with a populated verdict field", async () => {
    const { vesselA, vesselB, expectedEncounterType } = crossingResidualBasicCase;
    const created = await createScenario(vesselA, vesselB);
    createdIds.push(created.shareId);
    await prisma.scenario.update({
      where: { id: created.shareId },
      data: { isCurated: true, displayOrder: 0 },
    });

    const result = await listGallery();
    const found = result.find((row) => row.id === created.shareId);

    expect(found).toBeDefined();
    expect(found?.verdict.encounterType).toBe(expectedEncounterType);
  });

  it("rowToVessels() reconstructs Vessel objects from flat columns", async () => {
    const { vesselA, vesselB } = crossingResidualBasicCase;
    const created = await createScenario(vesselA, vesselB);
    createdIds.push(created.shareId);
    const row = await repository.findByShareId(created.shareId);

    const { vesselA: reconstructedA, vesselB: reconstructedB } = rowToVessels(
      row!,
    );
    expect(reconstructedA).toEqual(vesselA);
    expect(reconstructedB).toEqual(vesselB);
  });
});
