/**
 * appRouter -- composes the scenario and gallery sub-routers. This is the
 * router the Next.js route handler and the server-side caller factory
 * (integration tests) both consume.
 */

import { createTRPCRouter } from "../trpc.js";
import { scenarioRouter } from "./scenario.js";
import { galleryRouter } from "./gallery.js";

export const appRouter = createTRPCRouter({
  scenario: scenarioRouter,
  gallery: galleryRouter,
});

export type AppRouter = typeof appRouter;
