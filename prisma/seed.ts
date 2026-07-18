/**
 * One-time seed script writing curatedScenarios (src/server/db/
 * curated-scenarios.ts) directly into the Scenario table via the shared
 * Prisma singleton -- deliberately bypassing the public `scenario.create`
 * mutation, which never accepts isCurated/rationale/displayOrder (D-03: no
 * auth exists to gate who could otherwise self-curate).
 *
 * Run via `npx prisma db seed` (registered as prisma.config.ts's
 * migrations.seed).
 */

import "dotenv/config"; // Pitfall 5: don't rely on process-env inheritance
// from the parent `prisma` CLI subprocess.

import { prisma } from "../src/server/db/client.js"; // Pitfall 4: reuse the
// existing adapter-configured singleton -- a bare `new PrismaClient()`
// throws P2038 in Prisma 7 without the pg driver adapter.
import { curatedScenarios } from "../src/server/db/curated-scenarios.js";
import { classifyEncounter } from "../src/domain/colregs/classify-encounter.js";

async function main() {
  for (const entry of curatedScenarios) {
    // Defensive dry-run validation, mirroring createScenario's own guard
    // (scenario-service.ts) -- a seed row that fails classification would
    // break gallery.list's non-optional re-derivation at every future read.
    // Never persist result.value -- no verdict column exists (D-06).
    const result = classifyEncounter(entry.vesselA, entry.vesselB);
    if (!result.ok) {
      throw new Error(
        `Curated entry (displayOrder ${entry.displayOrder}) unclassifiable: ${result.reason}`,
      );
    }

    await prisma.scenario.create({
      data: {
        vesselAPosX: entry.vesselA.position.x,
        vesselAPosY: entry.vesselA.position.y,
        vesselAHeading: entry.vesselA.heading,
        vesselASpeed: entry.vesselA.speed,
        vesselAType: entry.vesselA.type,
        vesselBPosX: entry.vesselB.position.x,
        vesselBPosY: entry.vesselB.position.y,
        vesselBHeading: entry.vesselB.heading,
        vesselBSpeed: entry.vesselB.speed,
        vesselBType: entry.vesselB.type,
        isCurated: true,
        rationale: entry.rationale,
        displayOrder: entry.displayOrder,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
