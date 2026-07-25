// @vitest-environment jsdom
/**
 * ChartFooterStrip tests. Verifies the merged RANGE/BEARING/CPA/TCPA
 * readout tiles + per-vessel role/action panel (SBOX-07) against the same
 * real-classification and degenerate-fixture cases
 * `InstrumentReadouts.test.tsx` already proves, plus the isDegenerate-gated
 * action-text placeholder behavior new to this component.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ChartFooterStrip } from "./ChartFooterStrip.js";
import { classifyEncounter } from "../../../domain/colregs/classify-encounter.js";
import { crossingResidualBasicCase } from "../../../domain/colregs/classify-encounter.fixtures.js";
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

// Same degenerate-fixture correction InstrumentReadouts.test.tsx documents:
// coincident position AND matching heading/speed (zero relative velocity)
// is required to force cpa()'s "no-closure" null result.
const coincidentVessel: Vessel = {
  position: { x: 0, y: 0 },
  heading: 0,
  speed: 10,
  type: "power-driven",
};

describe("ChartFooterStrip", () => {
  it("renders the 4 readout tiles, LIVE label, and both vessels' role/action text for a real classification", () => {
    render(
      <ChartFooterStrip
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        classification={crossingClassification}
        isDegenerate={false}
      />,
    );

    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("RANGE")).toBeInTheDocument();
    expect(screen.getByText("5.00 NM")).toBeInTheDocument();
    expect(screen.getByText("BEARING A→B")).toBeInTheDocument();
    expect(screen.getByText("090°")).toBeInTheDocument();
    expect(screen.getByText("CPA")).toBeInTheDocument();
    expect(screen.getByText("3.54 NM")).toBeInTheDocument();
    expect(screen.getByText("TCPA")).toBeInTheDocument();
    expect(screen.getByText("15.0 min")).toBeInTheDocument();

    // crossingClassification.giveWay === "vesselA" -> Vessel A is GW, Vessel B is SO.
    expect(screen.getByText("GW")).toBeInTheDocument();
    expect(screen.getByText("SO")).toBeInTheDocument();
    expect(
      screen.getByText("Alter course early & substantially — pass well clear astern."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hold course & speed; stand ready to act if she does not."),
    ).toBeInTheDocument();
  });

  it("renders placeholders for bearing/CPA/TCPA and a zero range when coincident but not degenerate, while action text stays real", () => {
    render(
      <ChartFooterStrip
        vesselA={coincidentVessel}
        vesselB={coincidentVessel}
        classification={crossingClassification}
        isDegenerate={false}
      />,
    );

    expect(screen.getByText("0.00 NM")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(
      screen.getByText("Alter course early & substantially — pass well clear astern."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hold course & speed; stand ready to act if she does not."),
    ).toBeInTheDocument();
  });

  it("renders '—' for both vessels' action text when isDegenerate, while role badges still render from the last-good classification", () => {
    render(
      <ChartFooterStrip
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        classification={crossingClassification}
        isDegenerate={true}
      />,
    );

    expect(screen.getByText("GW")).toBeInTheDocument();
    expect(screen.getByText("SO")).toBeInTheDocument();
    expect(
      screen.queryByText("Alter course early & substantially — pass well clear astern."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Hold course & speed; stand ready to act if she does not."),
    ).not.toBeInTheDocument();
    // Both action cells now render the placeholder (in addition to the 3
    // readout-tile placeholders already covered by degenerate vessel input
    // in the prior test -- here vessels are non-coincident, so the only
    // "—" instances are the 2 action-text cells).
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
