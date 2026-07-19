// @vitest-environment jsdom
/**
 * SandboxContainer integration tests -- end-to-end wiring proof for
 * ChartPanel + ControlPanel + the 3 split reasoning cards (VerdictBanner/
 * InstrumentReadouts/ReasoningTrail) + the applyVesselUpdate choke point.
 * Exercises default-scenario mount (D-06), live update via ControlPanel
 * (CLAS-05), the degenerate coincident-position state (Pitfall 5), Rule
 * 13(d) hysteresis threading through previousEncounterTypeRef, the Reset
 * scenario CTA, and the 6-chip preset row (D-01/D-02).
 *
 * jsdom does not implement `ResizeObserver` or the Pointer Capture methods
 * ChartPanel/useHullDrag call directly -- same test-only polyfills as
 * ChartPanel.test.tsx / useHullDrag.test.ts.
 */
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SandboxContainer } from "./SandboxContainer.js";
import { chartToScreen } from "../../domain/geometry/screen-convert.js";
import {
  crossingResidualBasicCase,
  overtakingBothDirectionsCase,
} from "../../domain/colregs/classify-encounter.fixtures.js";
import type { Position } from "../../domain/vessel/vessel.js";
import type { VesselLabel } from "../../domain/colregs/types.js";

// 05-03 Task 2: mock next/navigation's useRouter and the trpc client's
// scenario.create mutation so Save's mutate-args + onSuccess-redirect +
// isPending-disables-button behaviors can be asserted without a real
// tRPC/HTTP round-trip.
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockMutate = vi.fn();
let mockIsPending = false;
let capturedOnSuccess: ((data: { shareId: string }) => void) | undefined;
vi.mock("../../lib/trpc/client.js", () => ({
  trpc: {
    scenario: {
      create: {
        useMutation: (options?: { onSuccess?: (data: { shareId: string }) => void }) => {
          capturedOnSuccess = options?.onSuccess;
          return { mutate: mockMutate, isPending: mockIsPending };
        },
      },
    },
  },
}));

// Mirrors ChartPanel.tsx's own fixed chart-space viewBox (private inside
// ChartPanel) and this file's polyfilled container size -- same pattern
// used by useHullDrag.test.ts / useRotateHandleDrag.test.ts to drive real
// pointer gestures against the rendered hull hit-rects.
const MOCK_CONTAINER_SIZE = { width: 400, height: 400 };
const CHART_VIEW_BOX = { minX: -10, minY: -10, width: 20, height: 20 };

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
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  mockPush.mockClear();
  mockMutate.mockClear();
  mockIsPending = false;
  capturedOnSuccess = undefined;
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

/** Repeats `{ArrowRight}`/`{ArrowLeft}` on a focused Radix Slider thumb. */
async function pressArrow(
  user: ReturnType<typeof userEvent.setup>,
  key: "{ArrowRight}" | "{ArrowLeft}",
  times: number,
): Promise<void> {
  for (let i = 0; i < times; i++) {
    await user.keyboard(key);
  }
}

function reasoningTrailCard(): HTMLElement {
  const card = screen.getByText("Reasoning Trail").closest('[data-slot="card"]');
  expect(card).not.toBeNull();
  return card as HTMLElement;
}

describe("SandboxContainer", () => {
  it("loads with the default crossing scenario already classified, with no user interaction (D-06)", () => {
    render(<SandboxContainer />);
    expect(screen.getByRole("heading", { name: "Crossing" })).toBeInTheDocument();
    expect(
      screen.getByText(/Vessel A gives way\. Give-way vessel takes early/),
    ).toBeInTheDocument();
  });

  it("re-derives the classification live when a ControlPanel speed slider changes, with no submit step (CLAS-05)", async () => {
    const user = userEvent.setup();
    render(<SandboxContainer />);

    const before = reasoningTrailCard().textContent;

    // Default vesselA speed is 10kn -- 15 ArrowRight presses lands at 25kn,
    // matching the previous native-input test's "clear + type 25" target.
    const vesselASlider = screen.getAllByRole("slider")[0] as HTMLElement;
    vesselASlider.focus();
    await pressArrow(user, "{ArrowRight}", 15);

    // Verdict stays "crossing"/"vesselA gives way" at this new speed, but
    // the Rule 7 TCPA/DCPA facts underneath change -- proving the trail
    // re-renders live from the new speed with no submit step.
    expect(screen.getByRole("heading", { name: "Crossing" })).toBeInTheDocument();
    expect(reasoningTrailCard().textContent).not.toBe(before);
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
    const vesselASlider = screen.getAllByRole("slider")[0] as HTMLElement;
    vesselASlider.focus();
    await pressArrow(user, "{ArrowLeft}", 10); // 10kn -> 0kn

    const vesselBSlider = screen.getAllByRole("slider")[1] as HTMLElement;
    vesselBSlider.focus();
    await pressArrow(user, "{ArrowRight}", 5); // 10kn -> 15kn

    dragHullTo(container, "vesselB", { x: 2, y: -8 });
    expect(screen.getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();

    // Step 2: drag vesselB straight to (5,0) -- the exact position/heading/
    // speed combination of the already-proven overtakingHysteresisHoldsCase
    // fixture. Geometrically alone (bearing 90/0 from this position) this
    // reads as crossing, but Rule 7 risk still holds and
    // previousEncounterTypeRef.current is "overtaking" from Step 1, so the
    // sticky Rule 13(d) path must keep the verdict "overtaking".
    dragHullTo(container, "vesselB", { x: 5, y: 0 });

    expect(screen.getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();
  });

  it("restores the default scenario and clears degenerate state when Reset scenario is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<SandboxContainer />);

    dragHullTo(container, "vesselA", { x: 5, y: 0 });
    expect(screen.getByText("Unable to classify")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset scenario" }));

    expect(screen.getByRole("heading", { name: "Crossing" })).toBeInTheDocument();
    expect(screen.queryByText("Unable to classify")).not.toBeInTheDocument();
  });

  // 05-03 Task 1: seed-from-saved-scenario (SCEN-01, D-02, Assumption A3)
  it("seeds the initial classification from initialScenario vessels instead of the default crossing fixture", () => {
    render(
      <SandboxContainer
        initialScenario={{
          vesselA: overtakingBothDirectionsCase.vesselA,
          vesselB: overtakingBothDirectionsCase.vesselB,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Crossing" })).not.toBeInTheDocument();
  });

  it("restores the passed-in initialScenario's own vessels (not the default) when Reset scenario is clicked", () => {
    const { container } = render(
      <SandboxContainer
        initialScenario={{
          vesselA: overtakingBothDirectionsCase.vesselA,
          vesselB: overtakingBothDirectionsCase.vesselB,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();

    // Drag vesselB onto vesselA's seeded position (0,0) -- a coincident-
    // position degenerate input -- to move off the overtaking verdict.
    dragHullTo(container, "vesselB", { x: 0, y: 0 });
    expect(screen.getByText("Unable to classify")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Overtaking" })).not.toBeInTheDocument();

    const resetButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent === "Reset scenario");
    expect(resetButton).toBeDefined();
    act(() => {
      resetButton?.click();
    });

    expect(screen.getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();
    expect(screen.queryByText("Unable to classify")).not.toBeInTheDocument();
  });

  it("does not show any chip as active when a saved/shared scenario is loaded, even though it defaults to Classic crossing on the plain seedless route (code review CR-02)", () => {
    // Regression test: activeChipId used to default to "classic-crossing"
    // unconditionally, so every /s/[shareId] page showed that chip as
    // active/pressed regardless of the actually-loaded (arbitrary) vessel
    // geometry -- directly contradicting this component's own documented
    // "highlight never goes stale/misleading" contract.
    render(<SandboxContainer />);
    expect(screen.getByRole("button", { name: "Classic crossing" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    cleanup();

    render(
      <SandboxContainer
        initialScenario={{
          vesselA: overtakingBothDirectionsCase.vesselA,
          vesselB: overtakingBothDirectionsCase.vesselB,
        }}
      />,
    );
    for (const chip of screen.getAllByRole("button", { pressed: false })) {
      expect(chip).toHaveAttribute("aria-pressed", "false");
    }
    expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument();
  });

  it("renders the banner label (and rationale, when provided) communicating a saved/shared scenario is loaded (D-02)", () => {
    const { rerender } = render(
      <SandboxContainer banner={{ label: "Viewing saved scenario — drag to explore" }} />,
    );
    expect(
      screen.getByText("Viewing saved scenario — drag to explore"),
    ).toBeInTheDocument();

    rerender(
      <SandboxContainer
        banner={{
          label: "Viewing saved scenario — drag to explore",
          rationale: "Loaded from a shared link.",
        }}
      />,
    );
    expect(screen.getByText("Loaded from a shared link.")).toBeInTheDocument();
  });

  // 05-03 Task 2: Save button wired to scenario.create + redirect (SCEN-01)
  it("calls scenario.create's mutate with the current vesselA/vesselB when Save is clicked", async () => {
    const user = userEvent.setup();
    render(<SandboxContainer />);

    await user.click(screen.getByRole("button", { name: "Save and share this scenario" }));

    expect(mockMutate).toHaveBeenCalledWith({
      vesselA: crossingResidualBasicCase.vesselA,
      vesselB: crossingResidualBasicCase.vesselB,
    });
  });

  it("redirects to /s/{shareId} when the mutation succeeds", async () => {
    const user = userEvent.setup();
    render(<SandboxContainer />);

    await user.click(screen.getByRole("button", { name: "Save and share this scenario" }));
    expect(capturedOnSuccess).toBeDefined();
    act(() => {
      capturedOnSuccess?.({ shareId: "abc123" });
    });

    expect(mockPush).toHaveBeenCalledWith("/s/abc123");
  });

  it("disables the Save button while the mutation is pending", () => {
    mockIsPending = true;
    render(<SandboxContainer />);

    expect(
      screen.getByRole("button", { name: "Save and share this scenario" }),
    ).toBeDisabled();
  });

  // D-01/D-02: chip row loads a canned scenario in place, full replace +
  // hysteresis reset, mechanically identical to Reset scenario.
  it("loads the Overtaking chip's fixture scenario when clicked, landing give-way on the fixture's documented vessel", async () => {
    const user = userEvent.setup();
    render(<SandboxContainer />);

    await user.click(screen.getByRole("button", { name: "Overtaking" }));

    const verdictHeading = screen.getByRole("heading", { name: "Overtaking" });
    const verdictCard = verdictHeading.closest('[data-slot="verdict-banner"]') as HTMLElement;
    expect(verdictCard).not.toBeNull();

    // The "Overtaking" chip fixture documents vesselA as the give-way
    // vessel (chip-scenarios.ts) -- its role badge must read "GIVE WAY".
    const vesselABadgeContainer = within(verdictCard).getByText("Vessel A").parentElement;
    expect(vesselABadgeContainer?.textContent).toContain("GIVE WAY");
  });
});
