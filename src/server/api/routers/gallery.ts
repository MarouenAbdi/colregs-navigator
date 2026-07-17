/**
 * gallery tRPC router -- a thin adapter over `scenario-service.ts`'s
 * `listGallery`. An empty curated set is a valid, non-error result (D-07):
 * returns `[]` and never throws (no not-found-style error path here).
 */

import { createTRPCRouter, publicProcedure } from "../trpc.js";

export const galleryRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.scenarioService.listGallery();
  }),
});
