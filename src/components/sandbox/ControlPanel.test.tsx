// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Vessel, VesselType } from "../../domain/vessel/vessel.js";
import type { VesselLabel } from "../../domain/colregs/types.js";
import { ControlPanel } from "./ControlPanel.js";

// Rule 3 (blocking): `vitest.config.ts` sets `globals: false` (project-wide,
// per CLAUDE.md's "no magic" persona), so `@testing-library/react`'s
// automatic afterEach-cleanup detection (which relies on a global
// `afterEach`) never registers. Without this, each `it` block's `render()`
// leaves its previous tree mounted, and `getAllByLabelText` calls in later
// tests pick up stale elements from earlier tests. Scoped to this file only
// (not `vitest.setup.ts`) since every future `.test.tsx` file in this phase
// will need the same explicit import.
afterEach(() => {
  cleanup();
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

/**
 * ControlPanel is a controlled/presentational component -- it renders
 * exactly the vessel/speed/type it is given via props and never holds its
 * own state. To exercise a realistic clear+type/select interaction (where
 * the DOM input must reflect each keystroke, not snap back to a stale
 * prop), this harness plays the role SandboxContainer will play in 04-06:
 * it owns the vessel state and re-renders ControlPanel with the updated
 * value on every change, while still recording every call through the
 * spies under test.
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
  it("shows both vessel headings and speed labels", () => {
    render(
      <ControlPanel
        vesselA={vesselAFixture}
        vesselB={vesselBFixture}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Vessel A")).toBeInTheDocument();
    expect(screen.getByText("Vessel B")).toBeInTheDocument();
    expect(screen.getAllByText("Speed (kn)")).toHaveLength(2);
  });

  it("lists exactly five vessel-type options with the exact display labels for Vessel A", () => {
    render(
      <ControlPanel
        vesselA={vesselAFixture}
        vesselB={vesselBFixture}
        onVesselSpeedChange={vi.fn()}
        onVesselTypeChange={vi.fn()}
      />,
    );

    const vesselASelect = screen.getAllByLabelText("Vessel type")[0] as HTMLSelectElement;
    const optionLabels = Array.from(vesselASelect.options).map((option) => option.text);

    expect(optionLabels).toEqual([
      "Power-driven",
      "Sailing",
      "Fishing",
      "Not under command",
      "Restricted in ability to maneuver",
    ]);
  });

  it("calls onVesselSpeedChange with the parsed number when Vessel A's speed input changes", async () => {
    const user = userEvent.setup();
    const onVesselSpeedChange = vi.fn();

    render(<ControlledHarness onVesselSpeedChange={onVesselSpeedChange} onVesselTypeChange={vi.fn()} />);

    const speedInput = screen.getAllByLabelText("Speed (kn)")[0] as HTMLInputElement;
    await user.clear(speedInput);
    await user.type(speedInput, "20");

    expect(onVesselSpeedChange).toHaveBeenLastCalledWith("vesselA", 20);
  });

  it("calls onVesselTypeChange with the selected type when Vessel B's vessel-type select changes", async () => {
    const user = userEvent.setup();
    const onVesselTypeChange = vi.fn();

    render(<ControlledHarness onVesselSpeedChange={vi.fn()} onVesselTypeChange={onVesselTypeChange} />);

    const vesselBSelect = screen.getAllByLabelText("Vessel type")[1] as HTMLSelectElement;
    await user.selectOptions(vesselBSelect, "fishing");

    expect(onVesselTypeChange).toHaveBeenCalledWith("vesselB", "fishing");
  });
});
