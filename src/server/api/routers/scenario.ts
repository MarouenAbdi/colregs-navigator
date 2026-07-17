/**
 * scenario tRPC router -- a thin Zod-validated adapter over
 * `scenario-service.ts` (success criterion #4: zero classification logic
 * and zero direct Prisma calls in any router handler here).
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc.js";
import { VesselSchema } from "../../../domain/vessel/vessel.js"; // D-11: reuse, don't redefine

const CreateScenarioInput = z.object({
  vesselA: VesselSchema,
  vesselB: VesselSchema,
});

export const scenarioRouter = createTRPCRouter({
  create: publicProcedure
    .input(CreateScenarioInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.scenarioService.createScenario(input.vesselA, input.vesselB);
    }),
  get: publicProcedure
    .input(z.object({ shareId: z.string() }))
    .query(async ({ ctx, input }) => {
      const scenario = await ctx.scenarioService.getScenario(input.shareId);
      if (!scenario) {
        // D-10: standard TRPCError, never a Result-shaped response body.
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return scenario;
    }),
});
