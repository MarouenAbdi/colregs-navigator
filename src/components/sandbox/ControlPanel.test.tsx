// @vitest-environment jsdom
/**
 * ControlPanel interaction tests, rewritten for the Radix Select/Slider
 * primitive swap (SBOX-04). The old native-`<select>` interaction helper no
 * longer resolves against these Radix primitives -- Select/Slider require
 * the click+findByRole / focus+keyboard interaction patterns below, per
 * 08-RESEARCH.md's "Test rewrite pattern" Code Example.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Vessel, VesselType } from "../../domain/vessel/vessel.js";
import type { ClassificationResult, VesselLabel } from "../../domain/colregs/types.js";
import { ControlPanel } from "./ControlPanel.js";

// Rule 3 (blocking): `vitest.config.ts` sets `globals: false` (project-wide,
// per CLAUDE.md's "no magic" persona), so `@testing-library/react`'s
// automatic afterEach-cleanup detection (which relies on a global
// `afterEach`) never registers. Without this, each `it` block's `render()`
// leaves its previous tree mounted, and later `getAllByRole` calls pick up
// stale elements from earlier tests. Scoped to this file only (not
// `vitest.setup.ts`), matching the project's established convention.
afterEach(() => {
  cleanup();
});

// jsdom does not implement `ResizeObserver` (Radix Slider's internal
// use-size hook calls it directly), the Pointer Capture methods, or
// `scrollIntoView` that Radix Select/Slider call directly -- scoped local
// polyfills, matching ChartPanel.test.tsx's existing convention (not added
// to a global setup file).
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

const vesselAFixture: Vessel = {
  position: { x: 0, y: 0 },
  heading: 90,
  speed: 10,
  type: "power-driven",
};

const vesselBFixture: Vessel = {
  position: { x: 5, y: 5 },
  heading: 270,
  speed: 12,
  type: "sailing",
};

// Any valid crossing-shape fixture -- ControlPanelProps now requires
// `classification` since the card header derives its role badge via
// getVesselRole() (08-01 widened the prop contract).
const classificationFixture: ClassificationResult = {
  encounterType: "crossing",
  riskOfCollision: true,
  giveWay: "vesselA",
  standOn: "vesselB",
  doubt: false,
  trail: [],
};

/**
 * ControlPanel is a controlled/presentational component -- it renders
 * exactly the vessel/speed/type it is given via props and never holds its
 * own state. To exercise a realistic interaction (where the DOM control
 * must reflect each change, not snap back to a stale prop), this harness
 * plays the role SandboxContainer plays in production: it owns the vessel
 * state and re-renders ControlPanel with the updated value on every change,
 * while still recording every call through the spies under test.
 */
function ControlledHarness({
  onVesselSpeedChange,
  onVesselTypeChange,
}: {
  onVesselSpeedChange: (vessel: VesselLabel, speed: number) => void;
  onVesselTypeChange: (vessel: VesselLabel, type: VesselType) => void;
}) {
  const [vesselA, setVesselA] = useState(vesselAFixture);
  const [vesselB, setVesselB] = useState(vesselBFixture);

  return (
    <ControlPanel
      vesselA={vesselA}
      vesselB={vesselB}
      classification={classificationFixture}
      onVesselSpeedChange={(vessel, speed) => {
        onVesselSpeedChange(vessel, speed);
        if (vessel === "vesselA") setVesselA((v) => ({ ...v, speed }));
        else setVesselB((v) => ({ ...v, speed }));
      }}
      onVesselTypeChange={(vessel, type) => {
        onVesselTypeChange(vessel, type);
        if (vessel === "vesselA") setVesselA((v) => ({ ...v, type }));
        else setVesselB((v) => ({ ...v, type }));
      }}
    />
  );
}

describe("ControlPanel", () => {
  it("shows both vessel headings and role badges", () => {
    render(
      <ControlPanel
        vesselA={vesselAFixture}
        vesselB={vesselBFixture}
        classification={classificationFixture}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Vessel A")).toBeInTheDocument();
    expect(screen.getByText("Vessel B")).toBeInTheDocument();
    expect(screen.getAllByText("Speed")).toHaveLength(2);
    expect(screen.getAllByText("Heading")).toHaveLength(2);
  });

  it("renders the card-header role badge derived from getVesselRole, never a locally re-derived role", () => {
    render(
      <ControlPanel
        vesselA={vesselAFixture}
        vesselB={vesselBFixture}
        classification={classificationFixture}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={vi.fn()}
      />,
    );

    // classificationFixture.giveWay === "vesselA" -> Vessel A is GW, Vessel B is SO.
    expect(screen.getAllByText("GW").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SO").length).toBeGreaterThan(0);
  });

  it("lists exactly five vessel-type options with the exact display labels for Vessel A", async () => {
    const user = userEvent.setup();
    render(
      <ControlPanel
        vesselA={vesselAFixture}
        vesselB={vesselBFixture}
        classification={classificationFixture}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={vi.fn()}
      />,
    );

    await user.click(screen.getAllByRole("combobox")[0]!);
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

  it("calls onVesselSpeedChange with speed + 1 when Vessel A's speed slider is incremented via arrow key", async () => {
    const user = userEvent.setup();
    const onVesselSpeedChange = vi.fn();

    render(<ControlledHarness onVesselSpeedChange={onVesselSpeedChange} onVesselTypeChange={vi.fn()} />);

    const vesselASlider = screen.getAllByRole("slider")[0]!;
    vesselASlider.focus();
    await user.keyboard("{ArrowRight}");

    expect(onVesselSpeedChange).toHaveBeenLastCalledWith("vesselA", vesselAFixture.speed + 1);
  });

  it("calls onVesselTypeChange with the selected type when Vessel B's Select changes", async () => {
    const user = userEvent.setup();
    const onVesselTypeChange = vi.fn();

    render(<ControlledHarness onVesselSpeedChange={vi.fn()} onVesselTypeChange={onVesselTypeChange} />);

    await user.click(screen.getAllByRole("combobox")[1]!);
    await user.click(await screen.findByRole("option", { name: "Fishing" }));

    expect(onVesselTypeChange).toHaveBeenCalledWith("vesselB", "fishing");
  });
});
