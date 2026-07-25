// @vitest-environment jsdom
/**
 * ChartHeaderStrip tests. Verifies the merged rule-badge + title +
 * 4-tier risk-pill header strip (SBOX-06) against real classifyEncounter()
 * output, mirroring VerdictBanner.test.tsx's fixture-first convention (real
 * domain fixtures, not hand-typed rule badges) plus one hand-authored
 * literal for the single case (non-doubt mutual accent) no existing
 * fixture naturally exercises -- every mutual fixture in
 * classify-encounter.fixtures.ts also lands in a doubt band.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ChartHeaderStrip } from "./ChartHeaderStrip.js";
import { classifyEncounter } from "../../../domain/colregs/classify-encounter.js";
import {
  crossingResidualBasicCase,
  doubtBandNearOvertakingBoundaryCase,
} from "../../../domain/colregs/classify-encounter.fixtures.js";
import type { Vessel } from "../../../domain/vessel/vessel.js";
import type { ClassificationResult } from "../../../domain/colregs/types.js";

afterEach(cleanup);

function classifyOrThrow(vesselA: Vessel, vesselB: Vessel): ClassificationResult {
  const result = classifyEncounter(vesselA, vesselB);
  if (!result.ok) throw new Error("Fixture failed to classify -- fixture is broken");
  return result.value;
}

const crossingClassification = classifyOrThrow(
  crossingResidualBasicCase.vesselA,
  crossingResidualBasicCase.vesselB,
);

const doubtCrossingClassification = classifyOrThrow(
  doubtBandNearOvertakingBoundaryCase.vesselA,
  doubtBandNearOvertakingBoundaryCase.vesselB,
);

// No real domain fixture pairs a non-doubt encounter with giveWay/standOn
// both null (every mutual fixture in classify-encounter.fixtures.ts also
// lands in a doubt band) -- this hand-authored literal isolates the
// mutual-accent branch from the doubt-accent branch, mirroring
// ControlPanel.test.tsx's own precedent for hand-typed ClassificationResult
// literals.
const mutualNonDoubtClassification: ClassificationResult = {
  encounterType: "head-on",
  riskOfCollision: true,
  giveWay: null,
  standOn: null,
  doubt: false,
  trail: [
    { ruleId: "Rule 14", text: "", facts: {} },
    { ruleId: "Rule 14(a)", text: "", facts: {} },
  ],
};

describe("ChartHeaderStrip", () => {
  it("renders the rule badge, title, and risk pill for a non-degenerate crossing classification", () => {
    render(
      <ChartHeaderStrip
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        classification={crossingClassification}
        isDegenerate={false}
      />,
    );

    expect(screen.getByText("Rule 15")).toBeInTheDocument();
    expect(screen.getByText("Crossing")).toBeInTheDocument();
    expect(
      screen.getByText("Passing clear — CPA 3.54 NM on present courses."),
    ).toBeInTheDocument();
  });

  it("always reads 'Rule 7' when classification.doubt is true, regardless of the trail's actual classifying rule", () => {
    render(
      <ChartHeaderStrip
        vesselA={doubtBandNearOvertakingBoundaryCase.vesselA}
        vesselB={doubtBandNearOvertakingBoundaryCase.vesselB}
        classification={doubtCrossingClassification}
        isDegenerate={false}
      />,
    );

    expect(screen.getByText("Rule 7")).toBeInTheDocument();
    expect(screen.getByText("Crossing")).toBeInTheDocument();
  });

  it("omits the rule badge, titles 'Unable to classify', and shows the watch-tone risk pill when degenerate", () => {
    render(
      <ChartHeaderStrip
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        classification={crossingClassification}
        isDegenerate={true}
      />,
    );

    expect(screen.queryByText("Rule 15")).not.toBeInTheDocument();
    expect(screen.queryByText("Rule 7")).not.toBeInTheDocument();
    expect(screen.getByText("Unable to classify")).toBeInTheDocument();
    const riskText = screen.getByText("Unable to classify — vessels are coincident.");
    expect(riskText).toBeInTheDocument();
    expect(riskText.parentElement?.className).toContain("text-doubt");
  });

  it("uses the mutual accent token (not the default rule-accent teal) for a giveWay/standOn-null non-doubt encounter", () => {
    render(
      <ChartHeaderStrip
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        classification={mutualNonDoubtClassification}
        isDegenerate={false}
      />,
    );

    const badge = screen.getByText("Rule 14");
    expect(badge.className).toContain("bg-mutual");
    expect(badge.className).not.toContain("bg-rule-accent");
    expect(badge.className).not.toContain("bg-doubt");
  });
});
