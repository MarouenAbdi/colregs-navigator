// @vitest-environment jsdom
/**
 * InstrumentReadouts tests (08-04 Task 2). Verifies the 4-tile
 * Range/Bearing/CPA/TCPA grid + status pill, both against a real
 * `crossingResidualBasicCase`-derived classification and against a
 * degenerate (coincident-position, matching heading+speed) pair where
 * bearing/CPA/TCPA are all unavailable.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InstrumentReadouts } from "./InstrumentReadouts.js";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { crossingResidualBasicCase } from "../../domain/colregs/classify-encounter.fixtures.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
import type { ClassificationResult } from "../../domain/colregs/types.js";

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

// Coincident position AND matching heading/speed -- per 08-01's own
// degenerate-fixture correction, a coincident position alone with
// differing headings still yields a defined (non-null) CPA; only a
// genuinely zero relative-velocity vector triggers cpa()'s "no-closure"
// null result.
const coincidentVessel: Vessel = {
  position: { x: 0, y: 0 },
  heading: 0,
  speed: 10,
  type: "power-driven",
};

describe("InstrumentReadouts", () => {
  it("renders the 4-tile grid and status pill for a real classification", () => {
    render(
      <InstrumentReadouts
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        classification={crossingClassification}
      />,
    );
    expect(screen.getByText("RANGE")).toBeInTheDocument();
    expect(screen.getByText("5.00 NM")).toBeInTheDocument();
    expect(screen.getByText("BEARING A→B")).toBeInTheDocument();
    expect(screen.getByText("090°")).toBeInTheDocument();
    expect(screen.getByText("CPA")).toBeInTheDocument();
    expect(screen.getByText("3.54 NM")).toBeInTheDocument();
    expect(screen.getByText("TCPA")).toBeInTheDocument();
    expect(screen.getByText("15.0 min")).toBeInTheDocument();
    expect(
      screen.getByText("Passing clear — CPA 3.54 NM on present courses."),
    ).toBeInTheDocument();
  });

  it("renders placeholders for bearing/CPA/TCPA and a zero range when degenerate", () => {
    render(
      <InstrumentReadouts
        vesselA={coincidentVessel}
        vesselB={coincidentVessel}
        classification={crossingClassification}
      />,
    );
    expect(screen.getByText("0.00 NM")).toBeInTheDocument();
    // BEARING/CPA/TCPA tiles each render a standalone "—" placeholder.
    expect(screen.getAllByText("—")).toHaveLength(3);
    // The status pill's own CPA segment also renders "—", embedded in its
    // sentence (one text node, not a standalone element).
    expect(
      screen.getByText("Passing clear — CPA — on present courses."),
    ).toBeInTheDocument();
  });
});
