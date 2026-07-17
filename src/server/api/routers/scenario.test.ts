/**
 * End-to-end integration tests for the composed `appRouter`, exercised via
 * tRPC's `createCallerFactory` server-side caller (no HTTP server needed).
 * This is the test that proves SCEN-02's re-derive-on-read guarantee holds
 * across the FULL router -> service -> repository -> domain chain, not
 * just at the service-unit-test level already covered in Plan 02.
 */

import { describe, expect, it } from "vitest";
import { createCallerFactory, createTRPCContext } from "../trpc.js";
import { appRouter } from "./_app.js";
import { headOnGenuineCase } from "../../../domain/colregs/classify-encounter.fixtures.js";

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

  it("gallery.list resolves to [] when no curated scenarios exist", async () => {
    const result = await caller.gallery.list();
    expect(result).toEqual([]);
  });
});
