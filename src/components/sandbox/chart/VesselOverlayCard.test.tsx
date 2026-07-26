// @vitest-environment jsdom
/**
 * VesselOverlayCard tests, following ControlPanel.test.tsx's Radix
 * Select/Slider interaction pattern (click+findByRole for Select,
 * focus+keyboard for Slider) plus its jsdom ResizeObserver/PointerCapture/
 * scrollIntoView polyfills. Also proves Pitfall 1's pointer-events-none/
 * auto split via a direct DOM assertion, not just visual review.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VesselOverlayCard } from "./VesselOverlayCard.js";
import { classifyEncounter } from "../../../domain/colregs/classify-encounter.js";
import { crossingResidualBasicCase } from "../../../domain/colregs/classify-encounter.fixtures.js";
import type { Vessel } from "../../../domain/vessel/vessel.js";
import type { ClassificationResult } from "../../../domain/colregs/types.js";

afterEach(() => {
  cleanup();
});

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => true;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

function classifyOrThrow(vesselA: Vessel, vesselB: Vessel): ClassificationResult {
  const result = classifyEncounter(vesselA, vesselB);
  if (!result.ok) throw new Error("Fixture failed to classify -- fixture is broken");
  return result.value;
}

const crossingClassification = classifyOrThrow(
  crossingResidualBasicCase.vesselA,
  crossingResidualBasicCase.vesselB,
);

describe("VesselOverlayCard", () => {
  it("renders letter chip, vessel name, role badge, close button, TYPE select, SPEED slider, and read-only HEADING", () => {
    render(
      <VesselOverlayCard
        label="vesselA"
        letter="A"
        vessel={crossingResidualBasicCase.vesselA}
        classification={crossingClassification}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("Vessel A")).toBeInTheDocument();
    // crossingClassification.giveWay === "vesselA" -> Vessel A is GW.
    expect(screen.getByText("GW")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close Vessel A control card" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByText(`${crossingResidualBasicCase.vesselA.speed} kn`)).toBeInTheDocument();
    const expectedHeading = `${Math.round(crossingResidualBasicCase.vesselA.heading).toString().padStart(3, "0")}°`;
    expect(screen.getByText(expectedHeading)).toBeInTheDocument();
  });

  it("lists exactly the 5 vessel-type options with the same display labels ControlPanel.tsx uses", async () => {
    const user = userEvent.setup();
    render(
      <VesselOverlayCard
        label="vesselA"
        letter="A"
        vessel={crossingResidualBasicCase.vesselA}
        classification={crossingClassification}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    const options = await screen.findAllByRole("option");
    const optionLabels = options.map((option) => option.textContent);

    expect(optionLabels).toEqual([
      "Power-driven",
      "Sailing",
      "Fishing",
      "Not under command",
      "Restricted in ability to maneuver",
    ]);
  });

  it("calls onVesselTypeChange with the selected type", async () => {
    const user = userEvent.setup();
    const onVesselTypeChange = vi.fn();
    render(
      <VesselOverlayCard
        label="vesselB"
        letter="B"
        vessel={crossingResidualBasicCase.vesselB}
        classification={crossingClassification}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={onVesselTypeChange}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Fishing" }));

    expect(onVesselTypeChange).toHaveBeenCalledWith("vesselB", "fishing");
  });

  it("calls onVesselSpeedChange with speed + 1 when the slider is incremented via arrow key", async () => {
    const user = userEvent.setup();
    const onVesselSpeedChange = vi.fn();
    render(
      <VesselOverlayCard
        label="vesselA"
        letter="A"
        vessel={crossingResidualBasicCase.vesselA}
        classification={crossingClassification}
        onVesselSpeedChange={onVesselSpeedChange}
        onVesselTypeChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const slider = screen.getByRole("slider");
    slider.focus();
    await user.keyboard("{ArrowRight}");

    expect(onVesselSpeedChange).toHaveBeenCalledWith(
      "vesselA",
      crossingResidualBasicCase.vesselA.speed + 1,
    );
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <VesselOverlayCard
        label="vesselA"
        letter="A"
        vessel={crossingResidualBasicCase.vesselA}
        classification={crossingClassification}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={vi.fn()}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Close Vessel A control card" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the close button, Select trigger, and Slider clickable despite the root chrome's pointer-events-none (Pitfall 1)", () => {
    const { container } = render(
      <VesselOverlayCard
        label="vesselA"
        letter="A"
        vessel={crossingResidualBasicCase.vesselA}
        classification={crossingClassification}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("pointer-events-none");

    const closeButton = screen.getByRole("button", { name: "Close Vessel A control card" });
    expect(closeButton.className).toContain("pointer-events-auto");

    const selectTrigger = screen.getByRole("combobox");
    expect(selectTrigger.className).toContain("pointer-events-auto");

    const slider = screen.getByRole("slider");
    // Radix's Slider.Root (the actual pointer-events-auto recipient) is the
    // slider role's own containing group -- assert on its closest ancestor
    // carrying data-slot="slider" rather than the thumb itself.
    const sliderRoot = slider.closest('[data-slot="slider"]') as HTMLElement;
    expect(sliderRoot.className).toContain("pointer-events-auto");
  });
});
