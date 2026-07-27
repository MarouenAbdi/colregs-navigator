// @vitest-environment jsdom
/**
 * ReasoningTrail tests. Verifies dynamic step count/order,
 * tag+tone derivation for all 3 tone buckets (GEOMETRY/RULE N/VERDICT),
 * the doubt-substitution override, empty-facts suppression, and both
 * doubt-caveat strings verbatim -- collectively covering every behavior
 * the retired combined-aside test suite asserted for the trail/
 * fact-readout/doubt-caveat portion of that file.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReasoningTrail } from "./ReasoningTrail.js";
import type { ClassificationResult } from "../../../domain/colregs/types.js";

afterEach(cleanup);

// Mirrors the retired combined-aside test suite's 3-entry crossing fixture
// verbatim (Rule 7 / Rule 13(a)-(b) / Rule 15, giveWay: "vesselA").
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

// A realistic 5-entry trail shape (Rule 7 / Rule 13 / Rule 14 / Rule 15 /
// Rule 18), doubt: true -- classifyingEntryIndex(5) === 3, so index 3 (Rule
// 15) is the entry that gets doubt-substituted to "Rule 7", while indices 1
// and 2 (Rule 13, Rule 14) still show their own tags.
const fiveEntryDoubtClassification: ClassificationResult = {
  encounterType: "crossing",
  riskOfCollision: true,
  giveWay: "vesselA",
  standOn: "vesselB",
  doubt: true,
  doubtBoundary: "near-overtaking-crossing-boundary",
  trail: [
    { ruleId: "Rule 7", text: "Risk of collision exists.", facts: { riskOfCollision: true } },
    { ruleId: "Rule 13(a)-(b)", text: "Not overtaking in either direction.", facts: {} },
    { ruleId: "Rule 14(a)-(b)", text: "Not head-on.", facts: {} },
    { ruleId: "Rule 15", text: "Crossing verdict.", facts: { relativeBearingAtoB: 110 } },
    { ruleId: "Rule 18(a)-(c)", text: "Rule 18 does not override.", facts: {} },
  ],
};

// A 3-entry trail with an empty-facts middle entry (the Rule 13(d) sticky-
// overtaking case) -- no <dl> should render for that entry only.
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

function withDoubt(boundary: ClassificationResult["doubtBoundary"]): ClassificationResult {
  return { ...crossingClassification, doubt: true, doubtBoundary: boundary };
}

describe("ReasoningTrail", () => {
  it("renders all trail entries' ruleId and text, in array order, with a dynamic step-count pill", () => {
    const { container } = render(<ReasoningTrail classification={crossingClassification} />);
    expect(screen.getByText("3 contacts")).toBeInTheDocument();
    const trailItems = Array.from(container.querySelectorAll('[data-role="trail-card"]'));
    expect(trailItems).toHaveLength(3);
    expect(trailItems[0]).toHaveTextContent("Rule 7");
    expect(trailItems[0]).toHaveTextContent("Risk of collision exists.");
    expect(trailItems[1]).toHaveTextContent("Rule 13(a)-(b)");
    expect(trailItems[1]).toHaveTextContent("Not overtaking in either direction.");
    expect(trailItems[2]).toHaveTextContent("Rule 15");
  });

  it("tags index 0 GEOMETRY, the classifying index (1, non-doubt) RULE 13, and the last index VERDICT", () => {
    render(<ReasoningTrail classification={crossingClassification} />);
    expect(screen.getByText("GEOMETRY")).toBeInTheDocument();
    expect(screen.getByText("RULE 13")).toBeInTheDocument();
    expect(screen.getByText("VERDICT")).toBeInTheDocument();
  });

  it("renders a dynamic 5-step count and substitutes Rule 7 only at the doubt-flagged classifying index", () => {
    render(<ReasoningTrail classification={fiveEntryDoubtClassification} />);
    expect(screen.getByText("5 contacts")).toBeInTheDocument();
    expect(screen.getByText("GEOMETRY")).toBeInTheDocument();
    expect(screen.getByText("RULE 13")).toBeInTheDocument();
    expect(screen.getByText("RULE 14")).toBeInTheDocument();
    // "Rule 7" appears twice: once as entry 0's own ruleId text, once as the
    // doubt-substituted tag on the classifying entry (index 3).
    expect(screen.getAllByText("Rule 7")).toHaveLength(2);
    expect(screen.getByText("VERDICT")).toBeInTheDocument();
    // The classifying index's own "RULE 15" tag must NOT appear -- it was
    // substituted by the doubt override.
    expect(screen.queryByText("RULE 15")).not.toBeInTheDocument();
  });

  it("renders formatted fact readouts beneath each entry, and none for empty-facts entries", () => {
    const { container } = render(<ReasoningTrail classification={overtakingWithEmptyFactsEntry} />);
    expect(screen.getByText("7.4 min")).toBeInTheDocument();
    expect(screen.getByText("0.50 nm")).toBeInTheDocument();
    const trailItems = Array.from(container.querySelectorAll('[data-role="trail-card"]'));
    const dlCount = trailItems.filter((item) => item.querySelector("dl") !== null).length;
    expect(dlCount).toBe(2);
  });

  it("formats a relative-bearing fact to one decimal with a degree sign", () => {
    render(<ReasoningTrail classification={crossingClassification} />);
    expect(screen.getByText("127.3°")).toBeInTheDocument();
  });

  it("renders the overtaking/crossing-boundary doubt caveat verbatim", () => {
    render(<ReasoningTrail classification={withDoubt("near-overtaking-crossing-boundary")} />);
    expect(
      screen.getByText(
        "Near the overtaking/crossing boundary (112.5° abaft the beam) — this verdict may flip with a small heading change.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the head-on-boundary doubt caveat verbatim", () => {
    render(<ReasoningTrail classification={withDoubt("near-head-on-boundary")} />);
    expect(
      screen.getByText(
        "Near the head-on boundary (reciprocal heading) — this verdict may flip with a small heading change.",
      ),
    ).toBeInTheDocument();
  });
});
