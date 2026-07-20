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
});
