// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GalleryCard } from "./GalleryCard.js";
import {
  crossingResidualBasicCase,
  headOnGenuineCase,
} from "../../../domain/colregs/classify-encounter.fixtures.js";
import { classifyEncounter } from "../../../domain/colregs/classify-encounter.js";

// Rule 3 (blocking): `vitest.config.ts` sets `globals: false` project-wide
// (CLAUDE.md's "no magic" persona) -- matches every other `.test.tsx` file
// in this repo (e.g. GalleryPreviewChart.test.tsx).
afterEach(() => {
  cleanup();
});

function classify(vesselA: typeof crossingResidualBasicCase.vesselA, vesselB: typeof crossingResidualBasicCase.vesselB) {
  const result = classifyEncounter(vesselA, vesselB);
  if (!result.ok) throw new Error("fixture must classify successfully");
  return result.value;
}

describe("GalleryCard", () => {
  it("renders the passed ruleLabel/title/description verbatim and an 'A GIVES WAY' verdict badge for a give-way scenario", () => {
    const classification = classify(crossingResidualBasicCase.vesselA, crossingResidualBasicCase.vesselB);
    render(
      <GalleryCard
        id="abc123"
        title="Classic crossing"
        ruleLabel="Rule 15"
        description="Power-driven vessels on crossing courses; the one with the other to starboard keeps clear."
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        classification={classification}
      />,
    );

    expect(screen.getByText("Rule 15")).toBeInTheDocument();
    expect(screen.getByText("A GIVES WAY")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Classic crossing" })).toBeInTheDocument();
    expect(
      screen.getByText("Power-driven vessels on crossing courses; the one with the other to starboard keeps clear."),
    ).toBeInTheDocument();
  });

  it("renders a MUTUAL verdict badge (not A/B GIVES WAY) for a mutual scenario", () => {
    const classification = classify(headOnGenuineCase.vesselA, headOnGenuineCase.vesselB);
    render(
      <GalleryCard
        id="def456"
        title="Head-on meeting"
        ruleLabel="Rule 14"
        description="Reciprocal courses, each dead ahead of the other — both alter course to starboard."
        vesselA={headOnGenuineCase.vesselA}
        vesselB={headOnGenuineCase.vesselB}
        classification={classification}
      />,
    );

    expect(screen.getByText("MUTUAL")).toBeInTheDocument();
    expect(screen.queryByText("A GIVES WAY")).not.toBeInTheDocument();
    expect(screen.queryByText("B GIVES WAY")).not.toBeInTheDocument();
  });

  it("wraps the whole card in a single Link to /s/{id} with the exact aria-label", () => {
    const classification = classify(crossingResidualBasicCase.vesselA, crossingResidualBasicCase.vesselB);
    render(
      <GalleryCard
        id="abc123"
        title="Classic crossing"
        ruleLabel="Rule 15"
        description="Power-driven vessels on crossing courses; the one with the other to starboard keeps clear."
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        classification={classification}
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links.length).toBe(1);
    expect(links[0]).toHaveAttribute("href", "/s/abc123");
    expect(links[0]).toHaveAttribute("aria-label", "Load Classic crossing scenario into the sandbox");
  });
});
