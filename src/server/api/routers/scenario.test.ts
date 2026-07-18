/**
 * End-to-end integration tests for the composed `appRouter`, exercised via
 * tRPC's `createCallerFactory` server-side caller (no HTTP server needed).
 * This is the test that proves SCEN-02's re-derive-on-read guarantee holds
 * across the FULL router -> service -> repository -> domain chain, not
 * just at the service-unit-test level already covered in Plan 02.
 */

import { afterAll, describe, expect, it } from "vitest";
import { createCallerFactory, createTRPCContext } from "../trpc.js";
import { appRouter } from "./_app.js";
import { headOnGenuineCase } from "../../../domain/colregs/classify-encounter.fixtures.js";
import { prisma } from "../../db/client.js";

const createCaller = createCallerFactory(appRouter);
const caller = createCaller(createTRPCContext());

describe("appRouter (scenario + gallery) -- end-to-end integration", () => {
  it("scenario.create returns a cuid-shaped shareId", async () => {
    const { shareId } = await caller.scenario.create({
      vesselA: headOnGenuineCase.vesselA,
      vesselB: headOnGenuineCase.vesselB,
    });

    expect(typeof shareId).toBe("string");
    // cuid()-shaped: starts with 'c', reasonably long alphanumeric string.
    expect(shareId).toMatch(/^[a-z0-9]{20,}$/i);
  });

  it("scenario.get re-derives the verdict end-to-end, matching the fixture's expected values", async () => {
    const { shareId } = await caller.scenario.create({
      vesselA: headOnGenuineCase.vesselA,
      vesselB: headOnGenuineCase.vesselB,
    });

    const fetched = await caller.scenario.get({ shareId });

    expect(fetched.verdict.encounterType).toBe(
      headOnGenuineCase.expectedEncounterType,
    );
    expect(fetched.verdict.giveWay).toBe(headOnGenuineCase.expectedGiveWay);
    expect(fetched.verdict.standOn).toBe(headOnGenuineCase.expectedStandOn);
  });

  it("scenario.get rejects a nonexistent shareId with TRPCError NOT_FOUND", async () => {
    await expect(
      caller.scenario.get({ shareId: "does-not-exist" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  describe("gallery.list", () => {
    // 05-02-PLAN.md Task 3: this replaces the now-stale assumption that an
    // empty array is always returned when no curated scenarios exist --
    // now that prisma/seed.ts (Task 2) populates the shared dev database
    // with curated rows, that assumption no longer holds. This test
    // creates and promotes its OWN row, then asserts containment (never
    // exact array equality) so it passes regardless of whether the seed
    // script has already run against the shared database.
    let shareId: string;

    afterAll(async () => {
      if (shareId) {
        await prisma.scenario.deleteMany({ where: { id: shareId } });
      }
    });

    it("returns curated rows including one this test creates and promotes, with a fresh verdict", async () => {
      const created = await caller.scenario.create({
        vesselA: headOnGenuineCase.vesselA,
        vesselB: headOnGenuineCase.vesselB,
      });
      shareId = created.shareId;

      await prisma.scenario.update({
        where: { id: shareId },
        data: { isCurated: true, displayOrder: 999, rationale: "test rationale" },
      });

      const result = await caller.gallery.list();
      const found = result.find((row) => row.id === shareId);

      expect(found).toBeDefined();
      expect(found?.isCurated).toBe(true);
      expect(found?.rationale).toBe("test rationale");
      expect(found?.verdict.encounterType).toBeDefined();
    });
  });
});
