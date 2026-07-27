// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Hero } from "./Hero.js";

// Rule 3 (blocking): `vitest.config.ts` sets `globals: false` (project-wide,
// per CLAUDE.md's "no magic" persona), so `@testing-library/react`'s
// automatic afterEach-cleanup detection never registers. Matches every
// other `.test.tsx` file in this repo (e.g. ControlPanel.test.tsx).
afterEach(() => {
  cleanup();
});

describe("Hero", () => {
  it("renders the locked headline and both CTAs with correct anchor targets", () => {
    render(<Hero />);

    expect(screen.getByRole("heading", { name: /two vessels/i })).toBeInTheDocument();

    const sandboxLink = screen.getByRole("link", { name: /open the sandbox/i });
    expect(sandboxLink).toHaveAttribute("href", "#sandbox");

    const galleryLink = screen.getByRole("link", { name: /classic encounters/i });
    expect(galleryLink).toHaveAttribute("href", "#gallery");

    expect(screen.getByText("Rule 15")).toBeInTheDocument();
    // "2.99 NM" appears twice by design: once in the
    // mini-chart's floating distance-label chip on the connector line, and
    // once in the RANGE readout tile -- both derived from the same
    // computed `range` value, not independently hand-typed literals.
    expect(screen.getAllByText("2.99 NM").length).toBeGreaterThan(0);
  });

  it("renders the header strip's risk pill and the footer's BEARING A->B/TCPA tiles, with the old eyebrow/verdict-banner text fully removed (D-03, D-04)", () => {
    render(<Hero />);

    // Header strip risk pill -- deriveHeroPreviewRisk() resolves this
    // fixture's dcpaNm (1.18 NM, over the 1.0 "watch" threshold) to the
    // "ok" tier's exact text template.
    expect(
      screen.getByText("Passing clear — CPA 1.18 NM on present courses."),
    ).toBeInTheDocument();

    // Footer strip's net-new TCPA tile (this fixture's tcpaMinutes ~12.34
    // -> "12.3 min").
    expect(screen.getByText("TCPA")).toBeInTheDocument();
    expect(screen.getByText("12.3 min")).toBeInTheDocument();
    expect(screen.getByText("BEARING A→B")).toBeInTheDocument();

    // D-04: the old CardHeader eyebrow and below-chart verdict banner are
    // fully removed, not relocated.
    expect(screen.queryByText("Live classification")).not.toBeInTheDocument();
    expect(screen.queryByText(/BRG-ring/)).not.toBeInTheDocument();
  });
});
