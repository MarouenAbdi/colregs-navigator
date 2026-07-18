/**
 * The 6 preset-scenario chip fixtures (Sandbox design contract's chip row).
 * Sandbox-local, standalone `Vessel` literals -- NOT sourced from the
 * gallery's curated-scenario seed data and NOT merged into the domain
 * layer's own classification test fixtures (locked decision: the curated
 * seed data doesn't match this design's 6 labels, and this milestone's
 * boundary forbids touching the domain/server layers). Values are copied
 * as new literals, verified against the real `classifyEncounter()` in this
 * module's test file, not merely hand-derived.
 */

import type { Vessel } from "../../domain/vessel/vessel.js";

export type ChipId =
  | "classic-crossing"
  | "head-on-meeting"
  | "overtaking"
  | "sailing-has-priority"
  | "not-under-command"
  | "in-doubt";

export interface ChipScenario {
  id: ChipId;
  label: string;
  vesselA: Vessel;
  vesselB: Vessel;
}

// "Classic crossing" -- identical to SandboxContainer's own current default
// seed (Rule 15, Vessel A gives way).
const classicCrossingVessels = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" as const },
  vesselB: { position: { x: 5, y: 0 }, heading: 270, speed: 10, type: "power-driven" as const },
};

// "Head-on meeting" -- both vessels on a due north/south line, reciprocal
// headings (Rule 14, mutual obligation -- same vessel type on both sides).
const headOnMeetingVessels = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" as const },
  vesselB: { position: { x: 0, y: 5 }, heading: 180, speed: 10, type: "power-driven" as const },
};

// "Overtaking" -- vesselA is the overtaking vessel (bearing from B to A is
// more than 22.5 degrees abaft B's beam), so the chip's "A gives way"
// outcome is satisfied (Rule 13).
const overtakingVessels = {
  vesselA: { position: { x: 0.5, y: -0.8660254 }, heading: 0, speed: 15, type: "power-driven" as const },
  vesselB: { position: { x: 0, y: 0 }, heading: 0, speed: 8, type: "power-driven" as const },
};

// "Sailing has priority" -- classic-crossing geometry with vesselB's type
// swapped to 'sailing' (priority 3, still lower-priority-number than
// vesselA's 'power-driven' at priority 4) -- rule18Overrides(4, 3) is
// false, so the geometric baseline (giveWay: vesselA) already matches Rule
// 18's outcome without an override. Zero new geometry beyond the type
// swap.
const sailingHasPriorityVessels = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" as const },
  vesselB: { position: { x: 5, y: 0 }, heading: 270, speed: 10, type: "sailing" as const },
};

// "Not under command" -- classic-crossing geometry, vessel identities
// swapped (A<->B) and distance scaled from 5nm to 1.4nm so DCPA lands under
// the 1.0nm Rule 7 threshold (a genuinely at-risk demo). Geometric baseline
// gives way to vesselB, but vesselB is 'not-under-command' (priority 1)
// against vesselA's 'power-driven' (priority 4) -- rule18Overrides(1, 4) is
// true, flipping the final verdict onto vesselA. This is the clearest
// on-screen demonstration that Rule 18 protects the NUC vessel's special
// status even when the raw geometry would otherwise favor it giving way.
const notUnderCommandVessels = {
  vesselA: { position: { x: 1.4, y: 0 }, heading: 270, speed: 10, type: "power-driven" as const },
  vesselB: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "not-under-command" as const },
};

// "In doubt" -- a 45-degree-rotated analog of the domain's own verified
// 5-degree-inclusive head-on-boundary fixture: rotating both vessels'
// headings and the bearing between them by a constant offset preserves
// every relative-bearing computation exactly (relative bearing is
// heading-relative, not compass-absolute), while giving this chip a
// visually distinct diagonal NE-SW line instead of "head-on meeting"'s
// vertical N-S line. True bearing from A to B is set to 50 degrees (45 + 5,
// so the relative bearing comes out to exactly the inclusive 5-degree
// boundary): dx = 10*sin(50deg), dy = 10*cos(50deg), full double precision
// so the computed bearing lands safely on the inclusive <=5 side. Both
// vessels are 'sailing' (a same-tier tie), so Rule 18 does not override --
// mutual obligation, matching the chip's MUTUAL badge.
const inDoubtVessels = {
  vesselA: { position: { x: 0, y: 0 }, heading: 45, speed: 10, type: "sailing" as const },
  vesselB: {
    position: { x: 7.66044443118978, y: 6.427876096865393 },
    heading: 225,
    speed: 10,
    type: "sailing" as const,
  },
};

export const CHIP_SCENARIOS: Record<ChipId, { vesselA: Vessel; vesselB: Vessel }> = {
  "classic-crossing": classicCrossingVessels,
  "head-on-meeting": headOnMeetingVessels,
  overtaking: overtakingVessels,
  "sailing-has-priority": sailingHasPriorityVessels,
  "not-under-command": notUnderCommandVessels,
  "in-doubt": inDoubtVessels,
};

// Chip labels/order verbatim from the Sandbox design's Copywriting Contract.
export const CHIP_ORDER: readonly { id: ChipId; label: string }[] = [
  { id: "classic-crossing", label: "Classic crossing" },
  { id: "head-on-meeting", label: "Head-on meeting" },
  { id: "overtaking", label: "Overtaking" },
  { id: "sailing-has-priority", label: "Sailing has priority" },
  { id: "not-under-command", label: "Not under command" },
  { id: "in-doubt", label: "In doubt" },
];
