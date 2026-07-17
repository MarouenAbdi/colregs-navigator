// @vitest-environment jsdom
/**
 * ReasoningPanel tests (04-05). Verifies the verdict banner composition,
 * full ordered trail rendering (rule citation + text + geometric fact
 * readouts, RSON-01), doubt caveat lines (D-04), and the degenerate
 * "Unable to classify" note that still shows the last-good trail (D-03).
 *
 * Minimal inline `ClassificationResult`-shaped fixtures per behavior case,
 * following crossingResidualBasicCase / headOnNucRiatmTieCase /
 * doubtBandNearOvertakingBoundaryCase shapes from
 * classify-encounter.fixtures.ts (read_first).
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReasoningPanel } from "./ReasoningPanel.js";
import type { ClassificationResult } from "../../domain/colregs/types.js";

// vitest.config.ts sets `globals: false` (no auto-injected globals), so
// @testing-library/react's automatic afterEach(cleanup) registration (which
// relies on a global `afterEach`) never fires -- each test file must
// register its own cleanup explicitly, matching the project's existing
// no-magic-globals convention (04-PATTERNS.md).
afterEach(cleanup);

// Mirrors crossingResidualBasicCase's verdict shape (giveWay: "vesselA").
const crossingClassification: ClassificationResult = {
  encounterType: "crossing",
  riskOfCollision: true,
  giveWay: "vesselA",
  standOn: "vesselB",
  doubt: false,
  trail: [
    {
      ruleId: "Rule 7",
      text: "Risk of collision exists.",
      facts: { riskOfCollision: true, tcpaMinutes: 4.2, dcpaNm: 0.83 },
    },
    {
      ruleId: "Rule 13(a)-(b)",
      text: "Not overtaking in either direction.",
      facts: { relativeBearingAtoB: 90, relativeBearingBtoA: 0 },
    },
    {
      ruleId: "Rule 15",
      text: "Crossing: the vessel that has the other on her own starboard side must keep out of the way.",
      facts: { relativeBearingAtoB: 127.34 },
    },
  ],
};

// Mirrors headOnNucRiatmTieCase's mutual-obligation shape.
const mutualClassification: ClassificationResult = {
  encounterType: "head-on",
  riskOfCollision: true,
  giveWay: null,
  standOn: null,
  doubt: false,
  trail: [
    {
      ruleId: "Rule 14(a)-(b)",
      text: "Head-on: the vessels are meeting on reciprocal or nearly reciprocal courses.",
      facts: { relativeBearingAtoB: 0, relativeBearingBtoA: 0 },
    },
    {
      ruleId: "Rule 18(a)-(c)",
      text: "Rule 18 does not apply: both vessels share the same priority tier -- mutual obligation stands, no give-way/stand-on assigned.",
      facts: { vesselAType: "not-under-command", vesselBType: "restricted-in-ability-to-maneuver" },
    },
  ],
};

// A three-entry trail including a Rule 13(d) sticky-overtaking entry with
// empty facts -- used to assert no fact-readout <dl> is rendered for it.
const overtakingWithEmptyFactsEntry: ClassificationResult = {
  encounterType: "overtaking",
  riskOfCollision: true,
  giveWay: "vesselB",
  standOn: "vesselA",
  doubt: false,
  trail: [
    {
      ruleId: "Rule 7",
      text: "Risk of collision exists.",
      facts: { riskOfCollision: true, tcpaMinutes: 7.42, dcpaNm: 0.5 },
    },
    {
      ruleId: "Rule 13(d)",
      text: "Overtaking situation persists (once overtaking, always overtaking until finally past and clear).",
      facts: {},
    },
    {
      ruleId: "Rule 13(a)",
      text: "Rule 18 does not apply to an overtaking situation.",
      facts: { vesselAType: "power-driven", vesselBType: "power-driven" },
    },
  ],
};

function withDoubt(
  boundary: ClassificationResult["doubtBoundary"],
): ClassificationResult {
  return { ...crossingClassification, doubt: true, doubtBoundary: boundary };
}

describe("ReasoningPanel", () => {
  it("renders the exact verdict banner for a give-way classification", () => {
    render(<ReasoningPanel classification={crossingClassification} isDegenerate={false} />);
    expect(screen.getByText("Crossing — Vessel A gives way")).toBeInTheDocument();
  });

  it("renders the exact mutual-obligation banner and MUTUAL badge, not GW/SO", () => {
    render(<ReasoningPanel classification={mutualClassification} isDegenerate={false} />);
    expect(screen.getByText("Head-on — mutual obligation")).toBeInTheDocument();
    expect(screen.getAllByText("MUTUAL")).toHaveLength(2);
    expect(screen.queryByText("GW")).not.toBeInTheDocument();
    expect(screen.queryByText("SO")).not.toBeInTheDocument();
  });

  it("renders all trail entries' ruleId and text, in array order", () => {
    render(<ReasoningPanel classification={crossingClassification} isDegenerate={false} />);
    const trailItems = screen.getAllByRole("listitem");
    expect(trailItems).toHaveLength(3);
    expect(trailItems[0]).toHaveTextContent("Rule 7");
    expect(trailItems[0]).toHaveTextContent("Risk of collision exists.");
    expect(trailItems[1]).toHaveTextContent("Rule 13(a)-(b)");
    expect(trailItems[1]).toHaveTextContent("Not overtaking in either direction.");
    expect(trailItems[2]).toHaveTextContent("Rule 15");
    expect(trailItems[2]).toHaveTextContent(
      "Crossing: the vessel that has the other on her own starboard side must keep out of the way.",
    );
  });

  it("renders formatted fact readouts beneath each entry, and none for empty-facts entries", () => {
    render(<ReasoningPanel classification={overtakingWithEmptyFactsEntry} isDegenerate={false} />);
    expect(screen.getByText("7.4 min")).toBeInTheDocument();
    expect(screen.getByText("0.50 nm")).toBeInTheDocument();

    // Only the two non-empty-facts entries (Rule 7, Rule 13(a)) render a
    // <dl> fact-readout block; Rule 13(d)'s empty-facts entry renders none.
    const trailItems = screen.getAllByRole("listitem");
    expect(trailItems).toHaveLength(3);
    const dlCount = trailItems.filter((item) => item.querySelector("dl") !== null).length;
    expect(dlCount).toBe(2);
  });

  it("formats a relative-bearing fact to one decimal with a degree sign", () => {
    render(<ReasoningPanel classification={crossingClassification} isDegenerate={false} />);
    expect(screen.getByText("127.3°")).toBeInTheDocument();
  });

  it("renders the overtaking/crossing-boundary doubt caveat verbatim", () => {
    render(
      <ReasoningPanel
        classification={withDoubt("near-overtaking-crossing-boundary")}
        isDegenerate={false}
      />,
    );
    expect(
      screen.getByText(
        "Near the overtaking/crossing boundary (112.5° abaft the beam) — this verdict may flip with a small heading change.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the head-on-boundary doubt caveat verbatim", () => {
    render(
      <ReasoningPanel classification={withDoubt("near-head-on-boundary")} isDegenerate={false} />,
    );
    expect(
      screen.getByText(
        "Near the head-on boundary (reciprocal heading) — this verdict may flip with a small heading change.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the degenerate note while still rendering the last-good trail", () => {
    render(<ReasoningPanel classification={crossingClassification} isDegenerate={true} />);
    expect(screen.getByText("Unable to classify")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Vessel A and Vessel B are at the same position — drag one apart to resume live classification.",
      ),
    ).toBeInTheDocument();
    // Last-good trail entries remain present underneath the note.
    expect(screen.getByText("Rule 7")).toBeInTheDocument();
    expect(screen.getByText("Rule 15")).toBeInTheDocument();
  });
});
