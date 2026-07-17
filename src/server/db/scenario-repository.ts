/**
 * Thin Prisma query wrapper for the `Scenario` model -- three plain
 * module-level functions, no generic `Repository<T>` base class (RESEARCH.md
 * Anti-Patterns: one table, three query shapes does not warrant that
 * abstraction). Every query goes through Prisma Client's generated,
 * parameterized methods -- no `$queryRawUnsafe`/string-concatenated SQL
 * (T-3-03).
 *
 * D-10: `findByShareId` returns a bare `null` for "not found", not a
 * `Result<T>` -- that discriminated-union shape stays domain-internal, it
 * never appears at this infra layer's return values.
 */

import { prisma } from "./client.js";
import type { Vessel } from "../../domain/vessel/vessel.js";

export interface ScenarioRow {
  id: string;
  createdAt: Date;
  vesselAPosX: number;
  vesselAPosY: number;
  vesselAHeading: number;
  vesselASpeed: number;
  vesselAType: string;
  vesselBPosX: number;
  vesselBPosY: number;
  vesselBHeading: number;
  vesselBSpeed: number;
  vesselBType: string;
  isCurated: boolean;
  displayOrder: number | null;
  rationale: string | null;
}

export async function create(
  vesselA: Vessel,
  vesselB: Vessel,
): Promise<ScenarioRow> {
  return prisma.scenario.create({
    data: {
      vesselAPosX: vesselA.position.x,
      vesselAPosY: vesselA.position.y,
      vesselAHeading: vesselA.heading,
      vesselASpeed: vesselA.speed,
      vesselAType: vesselA.type,
      vesselBPosX: vesselB.position.x,
      vesselBPosY: vesselB.position.y,
      vesselBHeading: vesselB.heading,
      vesselBSpeed: vesselB.speed,
      vesselBType: vesselB.type,
    },
  });
}

export async function findByShareId(
  shareId: string,
): Promise<ScenarioRow | null> {
  // Prisma's findUnique already returns null for no match -- no try/catch
  // needed for the not-found case.
  return prisma.scenario.findUnique({ where: { id: shareId } });
}

export async function findCurated(): Promise<ScenarioRow[]> {
  return prisma.scenario.findMany({
    where: { isCurated: true },
    orderBy: { displayOrder: "asc" },
  });
}
