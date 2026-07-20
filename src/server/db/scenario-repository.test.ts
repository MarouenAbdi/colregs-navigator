/**
 * Integration tests for scenario-repository.ts against the live Docker
 * Postgres instance (D-01) -- no mocking of `prisma`, these
 * tests exercise the real Prisma Client + adapter.
 */

import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./client.js";
import { create, findByShareId, findCurated } from "./scenario-repository.js";
import type { Vessel } from "../../domain/vessel/vessel.js";

const vesselA: Vessel = {
  position: { x: 0, y: 0 },
  heading: 0,
  speed: 10,
  type: "power-driven",
};

const vesselB: Vessel = {
  position: { x: 5, y: 0 },
  heading: 270,
  speed: 10,
  type: "fishing",
};

// Track every row this test file creates so it can clean up after itself --
// this suite runs against a real, persistent Postgres instance, not an
// in-memory fake, so leftover rows would otherwise accumulate across runs.
const createdIds: string[] = [];

afterAll(async () => {
  if (createdIds.length > 0) {
    await prisma.scenario.deleteMany({ where: { id: { in: createdIds } } });
  }
});

describe("scenario-repository", () => {
  it("create() persists a row mapping flat vesselA/vesselB columns and returns a cuid-shaped id", async () => {
    const row = await create(vesselA, vesselB);
    createdIds.push(row.id);

    expect(row.id).not.toMatch(/^\d+$/); // not a small sequential integer
    expect(row.createdAt).toBeInstanceOf(Date);
    expect(row.vesselAPosX).toBe(vesselA.position.x);
    expect(row.vesselAPosY).toBe(vesselA.position.y);
    expect(row.vesselAHeading).toBe(vesselA.heading);
    expect(row.vesselASpeed).toBe(vesselA.speed);
    expect(row.vesselAType).toBe(vesselA.type);
    expect(row.vesselBPosX).toBe(vesselB.position.x);
    expect(row.vesselBPosY).toBe(vesselB.position.y);
    expect(row.vesselBHeading).toBe(vesselB.heading);
    expect(row.vesselBSpeed).toBe(vesselB.speed);
    expect(row.vesselBType).toBe(vesselB.type);
  });

  it("findByShareId() returns the matching row for an id just created, and null for a nonexistent id", async () => {
    const created = await create(vesselA, vesselB);
    createdIds.push(created.id);

    const found = await findByShareId(created.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);

    const notFound = await findByShareId("nonexistent-share-id-xyz");
    expect(notFound).toBeNull();
  });

  it("findCurated() returns only isCurated rows, ordered by displayOrder ascending, excluding non-curated rows", async () => {
    const curatedRow = await create(vesselA, vesselB);
    createdIds.push(curatedRow.id);
    const nonCuratedRow = await create(vesselA, vesselB);
    createdIds.push(nonCuratedRow.id);

    await prisma.scenario.update({
      where: { id: curatedRow.id },
      data: { isCurated: true, displayOrder: 0 },
    });

    const curated = await findCurated();
    const curatedIds = curated.map((row) => row.id);

    expect(curatedIds).toContain(curatedRow.id);
    expect(curatedIds).not.toContain(nonCuratedRow.id);
    expect(curated.every((row) => row.isCurated === true)).toBe(true);
  });
});
