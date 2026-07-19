// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GalleryPreviewChart } from "./GalleryPreviewChart.js";
import {
  crossingResidualBasicCase,
  headOnGenuineCase,
} from "../../domain/colregs/classify-encounter.fixtures.js";

// Rule 3 (blocking): `vitest.config.ts` sets `globals: false` project-wide
// (CLAUDE.md's "no magic" persona) -- matches every other `.test.tsx` file
// in this repo (e.g. Hero.test.tsx).
afterEach(() => {
  cleanup();
});

describe("GalleryPreviewChart (09-02)", () => {
  it("renders a give-way-type vessel pair with role-correct GW/SO pills, not MUTUAL", () => {
    render(
      <GalleryPreviewChart
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
      />,
    );

    const svg = screen.getByRole("img");
    expect(svg).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("GW")).toBeInTheDocument();
    expect(screen.getByText("SO")).toBeInTheDocument();
    expect(screen.queryByText("MUTUAL")).not.toBeInTheDocument();
  });

  it("renders a mutual-type vessel pair with both pills as MU, using the mutual role's fill class", () => {
    const { container } = render(
      <GalleryPreviewChart vesselA={headOnGenuineCase.vesselA} vesselB={headOnGenuineCase.vesselB} />,
    );

    const muPills = screen.getAllByText("MU");
    expect(muPills.length).toBe(2);
    expect(screen.queryByText("GW")).not.toBeInTheDocument();
    expect(screen.queryByText("SO")).not.toBeInTheDocument();

    const mutualHulls = container.querySelectorAll(".fill-mutual");
    expect(mutualHulls.length).toBeGreaterThan(0);
  });

  it("throws a descriptive Error when classifyEncounter() returns !ok (coincident-position vessels)", () => {
    const coincident = {
      position: { x: 0, y: 0 },
      heading: 0,
      speed: 10,
      type: "power-driven" as const,
    };

    expect(() => render(<GalleryPreviewChart vesselA={coincident} vesselB={coincident} />)).toThrow();
  });
});
