/**
 * Tests for scenario-service.ts -- SCEN-02's core mechanism: getScenario/
 * listGallery must genuinely re-run classifyEncounter() on every read, and
 * createScenario must reject unclassifiable input before persistence
 * (resolved by validating unclassifiable input at `createScenario` time,
 * before persistence).
 *
 * Runs against the live Docker Postgres instance (D-01) --
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

  it("listGallery() returns an array shape, tolerant of curated rows from prisma/seed.ts (D-07)", async () => {
    // prisma/seed.ts side effect: prisma/seed.ts now populates this
    // same shared dev database with 6 curated rows, so an empty array is no
    // longer guaranteed here (this suite creates no curated rows of its own
    // before this assertion runs, but a prior `npx prisma db seed` run
    // against the shared DB is a real possibility). Assert the shape
    // contract (every returned row genuinely has isCurated: true) rather
    // than exact emptiness.
    const result = await listGallery();
    expect(Array.isArray(result)).toBe(true);
    expect(result.every((row) => row.isCurated === true)).toBe(true);
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
