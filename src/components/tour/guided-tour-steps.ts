/**
 * Verbatim 6-step Guided Tour copy (TOUR-01, TOUR-02), ported directly from
 * `.planning/phases/19-guided-tour/19-DESIGN-SNAPSHOT.md`'s "Step content"
 * section -- the design source's own fully-coded tour prototype, not
 * paraphrased from memory. Pure data module: zero JSX, zero React import,
 * consumed by GuidedTourModal/TourStepIllustration (Plan 19-02).
 */

export interface TourStepPoint {
  tag: string;
  text: string;
}

export interface TourStep {
  id: number; // 0-5, matches the design source's 6-step order
  icon: string; // decorative unicode glyph, NOT concatenated into title
  title: string;
  body: string;
  points: TourStepPoint[]; // 2 or 3 entries, varies per step
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 0,
    icon: "⚓",
    title: "Welcome aboard the Navigator",
    body: "Drop two vessels on a nautical chart and this engine names the give-way ship — and the exact COLREGS rule behind the verdict. Here is how to read it.",
    points: [
      {
        tag: "RULES 11–18",
        text: "Every verdict maps to the real Steering & Sailing Rules for vessels in sight of one another.",
      },
      {
        tag: "LIVE",
        text: "Anything you change recomputes instantly — geometry, verdict, and reasoning all update together.",
      },
    ],
  },
  {
    id: 1,
    icon: "✥",
    title: "Move the vessels",
    body: "The chart is fully draggable. Grab a hull to reposition it, or drag its bow handle to swing the heading. Selecting a vessel opens its control card.",
    points: [
      {
        tag: "DRAG HULL",
        text: "Reposition a ship anywhere on the scope — range and bearing follow.",
      },
      {
        tag: "DRAG BOW",
        text: "Rotate the small handle ahead of the bow to change heading.",
      },
      {
        tag: "TYPE & SPEED",
        text: "In the card, set vessel type (power, sailing, fishing, RAM, NUC) and speed — these drive the Rule 18 priority.",
      },
    ],
  },
  {
    id: 2,
    icon: "▦",
    title: "Read the instruments",
    body: "The footer strip is your live radar readout. These four numbers tell you whether a real risk of collision is developing.",
    points: [
      {
        tag: "RANGE / BRG",
        text: "Distance in nautical miles and the compass bearing from A to B.",
      },
      {
        tag: "CPA",
        text: "Closest Point of Approach — how near the vessels pass on present courses.",
      },
      {
        tag: "TCPA",
        text: "Time to that closest approach. A positive, shrinking value means they are closing.",
      },
    ],
  },
  {
    id: 3,
    icon: "§",
    title: "Read the verdict",
    body: "The header banner states the encounter type, the governing rule, and which vessel must give way. Each ship also carries a GIVE WAY / STAND ON badge and its required action.",
    points: [
      {
        tag: "GIVE WAY",
        text: "This vessel must take early, substantial action to keep clear.",
      },
      {
        tag: "STAND ON",
        text: "This vessel holds course and speed — but stays ready to act.",
      },
      {
        tag: "IN DOUBT",
        text: "Ambiguous geometry is flagged amber — the rules tell you to assume the more dangerous case.",
      },
    ],
  },
  {
    id: 4,
    icon: "⟿",
    title: "Follow the reasoning",
    body: "The NAV Decision Chain shows every logical step the engine took — from risk-of-collision through the encounter type to the final Rule 18 verdict. Read it left to right.",
    points: [
      {
        tag: "CONTACT 01",
        text: "Each node cites its own rule (e.g. Rule 7, 13, 14, 15, 18) and the facts that triggered it.",
      },
      {
        tag: "HIGHLIGHT",
        text: "The last, glowing node is the decisive step that produced the verdict.",
      },
    ],
  },
  {
    id: 5,
    icon: "❖",
    title: "Start from a classic",
    body: "Not sure where to begin? The Gallery below holds textbook COLREGS geometries. Load one into the sandbox with a click, then drag from there.",
    points: [
      {
        tag: "6 SCENARIOS",
        text: "Crossing, head-on, overtaking, sailing priority, not-under-command, and an in-doubt case.",
      },
      {
        tag: "RESET",
        text: "The Reset button restores the current scenario to its textbook starting position at any time.",
      },
    ],
  },
];
