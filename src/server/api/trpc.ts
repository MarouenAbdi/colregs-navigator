/**
 * tRPC initialization -- the single place `initTRPC` is called in this
 * codebase. Exports the context factory and the primitives every router
 * file imports (`createTRPCRouter`, `publicProcedure`, `createCallerFactory`).
 *
 * T-3-07: the custom `errorFormatter` strips verbose Prisma error internals
 * from responses when `NODE_ENV === "production"`, per RESEARCH.md's
 * Security Domain guidance (Information Disclosure mitigation) -- prevents
 * leaking connection details/SQL text through the tRPC error channel.
 */

import { initTRPC } from "@trpc/server";
import {
  createScenario,
  getScenario,
  listGallery,
} from "../application/scenario-service.js";

export function createTRPCContext() {
  return {
    scenarioService: { createScenario, getScenario, listGallery },
  };
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        prismaDetailsHidden:
          process.env.NODE_ENV === "production" ? true : undefined,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
