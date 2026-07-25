/**
 * Per-role required-action copy for the chart footer strip (D-03), keyed
 * off this codebase's existing `VesselRole` vocabulary -- mirrors
 * `vessel-role.ts`'s own `Record<VesselRole, string>` map pattern
 * (`ROLE_BADGE_TEXT`), new content only. Degenerate/error framing uses
 * the same `"—"` placeholder convention as `InstrumentReadouts.tsx`,
 * declared locally by the consuming `ChartFooterStrip.tsx` (Plan 18-02)
 * rather than centralized here.
 */

import type { VesselRole } from "../vessel-role.js";

export const ROLE_ACTION_TEXT: Record<VesselRole, string> = {
  "give-way": "Alter course early & substantially — pass well clear astern.",
  "stand-on": "Hold course & speed; stand ready to act if she does not.",
  mutual: "No privilege — both take early, decisive avoiding action.",
};
