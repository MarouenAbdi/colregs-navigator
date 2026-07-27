// @vitest-environment jsdom
/**
 * TourStepIllustration behavior tests -- proves each of the 6 step indices
 * renders its distinct, per-step SVG content (D-03), all sharing the same
 * `viewBox="0 0 460 176"` and zero `dangerouslySetInnerHTML` usage.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TourStepIllustration } from "./TourStepIllustration.js";

afterEach(() => {
  cleanup();
});

describe("TourStepIllustration", () => {
  it("step 0 renders a radar scope: two vessel-wedge paths, a dashed relative-bearing line, and the RULE 15 verdict pill", () => {
    const { container } = render(<TourStepIllustration step={0} />);

    expect(container.querySelector('path[fill="#EF4444"]')).toBeInTheDocument();
    expect(container.querySelector('path[fill="#22C55E"]')).toBeInTheDocument();
    expect(container.querySelector('line[stroke-dasharray="3 3"]')).toBeInTheDocument();
    expect(screen.getByText("RULE 15 · CROSSING")).toBeInTheDocument();
  });

  it("step 1 renders a hull outline with DRAG HULL and ROTATE BOW labels", () => {
    render(<TourStepIllustration step={1} />);

    expect(screen.getByText("DRAG HULL")).toBeInTheDocument();
    expect(screen.getByText("ROTATE BOW")).toBeInTheDocument();
  });

  it("step 2 renders 4 instrument tiles with RANGE/BEARING/CPA/TCPA content", () => {
    render(<TourStepIllustration step={2} />);

    expect(screen.getByText("RANGE")).toBeInTheDocument();
    expect(screen.getByText("1.92 NM")).toBeInTheDocument();
    expect(screen.getByText("BEARING")).toBeInTheDocument();
    expect(screen.getByText("045°")).toBeInTheDocument();
    expect(screen.getByText("CPA")).toBeInTheDocument();
    expect(screen.getByText("0.28 NM")).toBeInTheDocument();
    expect(screen.getByText("TCPA")).toBeInTheDocument();
    expect(screen.getByText("04:12")).toBeInTheDocument();
  });

  it("step 3 renders the verdict pill, vessel labels, and GIVE WAY / STAND ON badges", () => {
    render(<TourStepIllustration step={3} />);

    expect(screen.getByText("CROSSING · RULE 15 · VESSEL A GIVES WAY")).toBeInTheDocument();
    expect(screen.getByText("Vessel A")).toBeInTheDocument();
    expect(screen.getByText("Vessel B")).toBeInTheDocument();
    expect(screen.getByText("GIVE WAY")).toBeInTheDocument();
    expect(screen.getByText("STAND ON")).toBeInTheDocument();
  });

  it("step 4 renders the NAV DECISION CHAIN heading and 4 chained node labels", () => {
    render(<TourStepIllustration step={4} />);

    expect(screen.getByText("NAV DECISION CHAIN")).toBeInTheDocument();
    expect(screen.getByText("RULE 7")).toBeInTheDocument();
    expect(screen.getByText("RULE 15")).toBeInTheDocument();
    expect(screen.getByText("RULE 18")).toBeInTheDocument();
    expect(screen.getByText("VERDICT")).toBeInTheDocument();
  });

  it("step 5 renders 6 scenario-tile labels", () => {
    render(<TourStepIllustration step={5} />);

    expect(screen.getByText("CROSSING")).toBeInTheDocument();
    expect(screen.getByText("HEAD-ON")).toBeInTheDocument();
    expect(screen.getByText("OVERTAKE")).toBeInTheDocument();
    expect(screen.getByText("SAILING")).toBeInTheDocument();
    expect(screen.getByText("NUC")).toBeInTheDocument();
    expect(screen.getByText("IN DOUBT")).toBeInTheDocument();
  });

  it("every step's root svg carries viewBox 0 0 460 176", () => {
    for (const step of [0, 1, 2, 3, 4, 5]) {
      const { container, unmount } = render(<TourStepIllustration step={step} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 460 176");
      unmount();
    }
  });
});
