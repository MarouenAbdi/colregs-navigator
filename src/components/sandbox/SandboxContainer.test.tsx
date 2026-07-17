// @vitest-environment jsdom
/**
 * SandboxContainer integration tests (04-06 Task 3) -- end-to-end wiring
 * proof for ChartPanel + ControlPanel + ReasoningPanel + the
 * applyVesselUpdate choke point. Exercises the five behaviors this plan's
 * <behavior> block specifies: default-scenario mount (D-06), live update
 * via ControlPanel (CLAS-05), the degenerate coincident-position state
 * (Pitfall 5), Rule 13(d) hysteresis threading through
 * previousEncounterTypeRef, and the Reset Scenario CTA.
 *
 * jsdom does not implement `ResizeObserver` or the Pointer Capture methods
 * ChartPanel/useHullDrag call directly -- same test-only polyfills as
 * ChartPanel.test.tsx / useHullDrag.test.ts.
 */
import { act, cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SandboxContainer } from "./SandboxContainer.js";
import { chartToScreen } from "../../domain/geometry/screen-convert.js";
import type { Position } from "../../domain/vessel/vessel.js";
import type { VesselLabel } from "../../domain/colregs/types.js";

// Mirrors ChartPanel.tsx's own fixed chart-space viewBox (private inside
// ChartPanel) and this file's polyfilled container size -- same pattern
// used by useHullDrag.test.ts / useRotateHandleDrag.test.ts to drive real
// pointer gestures against the rendered hull hit-rects.
const MOCK_CONTAINER_SIZE = { width: 400, height: 400 };
const CHART_VIEW_BOX = { minX: -10, minY: -10, width: 20, height: 20 };

const DEFAULT_VERDICT_TEXT = "Crossing — Vessel A gives way";
const OVERTAKING_VERDICT_TEXT = "Overtaking — Vessel B gives way";

class MockResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(): void {
    this.callback(
      [{ contentRect: MOCK_CONTAINER_SIZE } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }

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
});

// Rule 3 (blocking, see ControlPanel.test.tsx): vitest.config.ts sets
// `globals: false`, so RTL's automatic afterEach-cleanup never registers.
afterEach(() => {
  cleanup();
});

/**
 * Drives a real pointerdown+pointermove sequence against a rendered hull
 * hit-rect, landing the vessel at exactly `targetPosition` -- jsdom's
 * zero-valued `getBoundingClientRect()` means the hook's
 * `clientX - svgRect.left` reduces to exactly `clientX`, so the target
 * chart position converts directly to the clientX/clientY to dispatch
 * (same technique as useHullDrag.test.ts). Wrapped in `act()`: raw
 * `dispatchEvent` calls outside of Testing Library's own event helpers do
 * not otherwise flush the resulting `setState` calls synchronously, which
 * would leave the DOM assertion below reading stale (pre-drag) content.
 */
function dragHullTo(container: HTMLElement, vessel: VesselLabel, targetPosition: Position): void {
  const hitRect = container.querySelector(`[data-testid="hull-hit-${vessel}"]`);
  expect(hitRect).not.toBeNull();
  const targetScreen = chartToScreen(targetPosition, MOCK_CONTAINER_SIZE, CHART_VIEW_BOX);
  const pointerEventInit = {
    pointerId: 1,
    clientX: targetScreen.screenX,
    clientY: targetScreen.screenY,
    bubbles: true,
  };
  act(() => {
    hitRect?.dispatchEvent(new PointerEvent("pointerdown", pointerEventInit));
    hitRect?.dispatchEvent(new PointerEvent("pointermove", pointerEventInit));
  });
}

describe("SandboxContainer", () => {
  it("loads with the default crossing scenario already classified, with no user interaction (D-06)", () => {
    render(<SandboxContainer />);
    expect(screen.getByText(DEFAULT_VERDICT_TEXT)).toBeInTheDocument();
  });

  it("re-derives the classification live when a ControlPanel speed input changes, with no submit step (CLAS-05)", async () => {
    const user = userEvent.setup();
    render(<SandboxContainer />);

    const reasoningPanelBefore = screen.getByText(DEFAULT_VERDICT_TEXT).closest("aside");
    const before = reasoningPanelBefore?.textContent;

    const speedInputA = screen.getAllByLabelText("Speed (kn)")[0] as HTMLInputElement;
    await user.clear(speedInputA);
    await user.type(speedInputA, "25");

    // Verdict stays "crossing"/"vesselA gives way" at this new speed, but
    // the Rule 7 TCPA/DCPA facts underneath change -- proving the trail
    // re-renders live from the new speed with no submit step.
    const reasoningPanelAfter = screen.getByText(DEFAULT_VERDICT_TEXT).closest("aside");
    expect(reasoningPanelAfter?.textContent).not.toBe(before);
  });

  it("shows 'Unable to classify' without losing the last-good trail when a vessel is dragged onto the other's exact position (Pitfall 5)", () => {
    const { container } = render(<SandboxContainer />);

    // Default scenario: vesselA at (0,0), vesselB at (5,0). Drag vesselA's
    // hull directly onto vesselB's exact position -- a coincident-position
    // degenerate input.
    dragHullTo(container, "vesselA", { x: 5, y: 0 });

    expect(screen.getByText("Unable to classify")).toBeInTheDocument();
    // The last-good trail entries (from the default scenario) stay
    // rendered underneath the degenerate note rather than going blank.
    expect(screen.getByText("Rule 15")).toBeInTheDocument();
  });

  it("threads previousEncounterTypeRef through a fresh-overtaking-then-sticky update sequence (Rule 13(d) hysteresis wiring)", async () => {
    const user = userEvent.setup();
    const { container } = render(<SandboxContainer />);

    // Step 1: morph vesselA/vesselB to a genuinely fresh overtaking
    // encounter (bearing well abaft vesselA's beam) -- this sets
    // previousEncounterTypeRef.current to "overtaking" via a real
    // (non-sticky) Stage 3 classification.
    const speedInputA = screen.getAllByLabelText("Speed (kn)")[0] as HTMLInputElement;
    await user.clear(speedInputA);
    await user.type(speedInputA, "0");

    const speedInputB = screen.getAllByLabelText("Speed (kn)")[1] as HTMLInputElement;
    await user.clear(speedInputB);
    await user.type(speedInputB, "15");

    dragHullTo(container, "vesselB", { x: 2, y: -8 });
    // Both the verdict banner AND the "Rule 13(d)" trail copy contain the
    // word "Overtaking"/"overtaking" -- assert the exact banner text to
    // avoid an ambiguous multi-match query.
    expect(screen.getByText(OVERTAKING_VERDICT_TEXT)).toBeInTheDocument();

    // Step 2: drag vesselB straight to (5,0) -- the exact position/heading/
    // speed combination of the already-proven overtakingHysteresisHoldsCase
    // fixture. Geometrically alone (bearing 90/0 from this position) this
    // reads as crossing, but Rule 7 risk still holds and
    // previousEncounterTypeRef.current is "overtaking" from Step 1, so the
    // sticky Rule 13(d) path must keep the verdict "overtaking".
    dragHullTo(container, "vesselB", { x: 5, y: 0 });

    expect(screen.getByText(OVERTAKING_VERDICT_TEXT)).toBeInTheDocument();
  });

  it("restores the default scenario and clears degenerate state when Reset Scenario is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<SandboxContainer />);

    dragHullTo(container, "vesselA", { x: 5, y: 0 });
    expect(screen.getByText("Unable to classify")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset Scenario" }));

    expect(screen.getByText(DEFAULT_VERDICT_TEXT)).toBeInTheDocument();
    expect(screen.queryByText("Unable to classify")).not.toBeInTheDocument();
  });
});
