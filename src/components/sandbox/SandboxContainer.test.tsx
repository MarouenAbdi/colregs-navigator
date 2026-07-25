// @vitest-environment jsdom
/**
 * SandboxContainer integration tests -- end-to-end wiring proof for
 * ChartPanel + ControlPanel + the 3 split reasoning cards (VerdictBanner/
 * InstrumentReadouts/ReasoningTrail) + the applyVesselUpdate choke point.
 * Exercises default-scenario mount (D-06), live update via ControlPanel
 * (CLAS-05), the degenerate coincident-position state (Pitfall 5), Rule
 * 13(d) hysteresis threading through previousEncounterTypeRef, and the
 * Reset scenario CTA.
 *
 * jsdom does not implement `ResizeObserver` or the Pointer Capture methods
 * ChartPanel/useHullDrag call directly -- same test-only polyfills as
 * ChartPanel.test.tsx / useHullDrag.test.ts.
 */
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SandboxContainer } from "./SandboxContainer.js";
import { chartToScreen } from "../../domain/geometry/screen-convert/screen-convert.js";
import {
  crossingResidualBasicCase,
  overtakingBothDirectionsCase,
} from "../../domain/colregs/classify-encounter.fixtures.js";
import type { Position, Vessel } from "../../domain/vessel/vessel.js";
import type { VesselLabel } from "../../domain/colregs/types.js";

// Mock next/navigation's useRouter and the trpc client's
// scenario.create mutation so Save's mutate-args + onSuccess-redirect +
// isPending-disables-button behaviors can be asserted without a real
// tRPC/HTTP round-trip.
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mocks the Gallery<->Sandbox bridge (SandboxBridgeProvider.tsx) the same
// mutable-closure-variable way this file already mocks next/navigation and
// the trpc client -- lets each test drive pendingScenario directly without
// a real Provider ancestor or a TryOnSandboxButton click.
let mockPendingScenario: { vesselA: Vessel; vesselB: Vessel; requestId: number } | null = null;
vi.mock("./bridge/SandboxBridgeProvider.js", () => ({
  useSandboxBridge: () => ({ pendingScenario: mockPendingScenario, requestLoad: vi.fn() }),
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
  mockPendingScenario = null;
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

// Plan 18-03 wires ChartPanel's own ChartHeaderStrip (encounter-title
// heading + "Unable to classify"/rule-badge text) alongside the still-live
// VerdictBanner card -- both render simultaneously until Plan 18-04 retires
// VerdictBanner, so any query for this shared text/heading content must be
// scoped to VerdictBanner's own DOM region or it ambiguously matches both.
function verdictBanner(): HTMLElement {
  const banner = document.querySelector('[data-slot="verdict-banner"]');
  expect(banner).not.toBeNull();
  return banner as HTMLElement;
}

describe("SandboxContainer", () => {
  it("loads with the default crossing scenario already classified, with no user interaction (D-06)", () => {
    render(<SandboxContainer />);
    expect(within(verdictBanner()).getByRole("heading", { name: "Crossing" })).toBeInTheDocument();
    expect(
      screen.getByText(/Vessel A gives way\. Give-way vessel takes early/),
    ).toBeInTheDocument();
    // Closes out the "Chip-row removal... verify via a repo-wide usage
    // check" pitfall-checklist item at the component-test level -- the
    // chip row is fully removed this phase (D-01/D-02), no replacement UI.
    expect(screen.queryByRole("button", { name: "Classic crossing" })).not.toBeInTheDocument();
  });

  it("re-derives the classification live when a ControlPanel speed slider changes, with no submit step", async () => {
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
    expect(within(verdictBanner()).getByRole("heading", { name: "Crossing" })).toBeInTheDocument();
    expect(reasoningTrailCard().textContent).not.toBe(before);
  });

  it("shows 'Unable to classify' without losing the last-good trail when a vessel is dragged onto the other's exact position (Pitfall 5)", () => {
    const { container } = render(<SandboxContainer />);

    // Default scenario: vesselA at (0,0), vesselB at (5,0). Drag vesselA's
    // hull directly onto vesselB's exact position -- a coincident-position
    // degenerate input.
    dragHullTo(container, "vesselA", { x: 5, y: 0 });

    expect(within(verdictBanner()).getByText("Unable to classify")).toBeInTheDocument();
    // The last-good trail entries (from the default scenario) stay
    // rendered underneath the degenerate note rather than going blank --
    // this "Rule 15" comes from ReasoningTrail's own entry.ruleId text, a
    // distinct source from VerdictBanner's/ChartHeaderStrip's rule badge
    // (both of which hide their own badge while isDegenerate), so this one
    // assertion is correctly left unscoped.
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
    expect(within(verdictBanner()).getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();

    // Step 2: drag vesselB straight to (5,0) -- the exact position/heading/
    // speed combination of the already-proven overtakingHysteresisHoldsCase
    // fixture. Geometrically alone (bearing 90/0 from this position) this
    // reads as crossing, but Rule 7 risk still holds and
    // previousEncounterTypeRef.current is "overtaking" from Step 1, so the
    // sticky Rule 13(d) path must keep the verdict "overtaking".
    dragHullTo(container, "vesselB", { x: 5, y: 0 });

    expect(within(verdictBanner()).getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();
  });

  it("restores the default scenario and clears degenerate state when Reset scenario is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<SandboxContainer />);

    dragHullTo(container, "vesselA", { x: 5, y: 0 });
    expect(within(verdictBanner()).getByText("Unable to classify")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset scenario" }));

    expect(within(verdictBanner()).getByRole("heading", { name: "Crossing" })).toBeInTheDocument();
    expect(within(verdictBanner()).queryByText("Unable to classify")).not.toBeInTheDocument();
  });

  // Seed-from-saved-scenario (SCEN-01, D-02, Assumption A3)
  it("seeds the initial classification from initialScenario vessels instead of the default crossing fixture", () => {
    render(
      <SandboxContainer
        initialScenario={{
          vesselA: overtakingBothDirectionsCase.vesselA,
          vesselB: overtakingBothDirectionsCase.vesselB,
        }}
      />,
    );

    expect(within(verdictBanner()).getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();
    expect(within(verdictBanner()).queryByRole("heading", { name: "Crossing" })).not.toBeInTheDocument();
  });

  // handleReset now delegates its apply step to loadScenario (D-03), so
  // this test proves loadScenario's full-replace + hysteresis-reset
  // contract (arbitrary vessel pair replace + previousEncounterTypeRef
  // reset landing on the correct verdict) via its only current call site,
  // not just "Reset works" in isolation -- no new render pass or assertion
  // logic is needed since the drag-to-degenerate-then-reset sequence below
  // already exercises this contract end-to-end through handleReset ->
  // loadScenario.
  it("restores the passed-in initialScenario's own vessels (not the default) when Reset scenario is clicked", () => {
    const { container } = render(
      <SandboxContainer
        initialScenario={{
          vesselA: overtakingBothDirectionsCase.vesselA,
          vesselB: overtakingBothDirectionsCase.vesselB,
        }}
      />,
    );

    expect(within(verdictBanner()).getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();

    // Drag vesselB onto vesselA's seeded position (0,0) -- a coincident-
    // position degenerate input -- to move off the overtaking verdict.
    dragHullTo(container, "vesselB", { x: 0, y: 0 });
    expect(within(verdictBanner()).getByText("Unable to classify")).toBeInTheDocument();
    expect(within(verdictBanner()).queryByRole("heading", { name: "Overtaking" })).not.toBeInTheDocument();

    const resetButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent === "Reset scenario");
    expect(resetButton).toBeDefined();
    act(() => {
      resetButton?.click();
    });

    expect(within(verdictBanner()).getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();
    expect(within(verdictBanner()).queryByText("Unable to classify")).not.toBeInTheDocument();
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

  // Save button wired to scenario.create + redirect (SCEN-01)
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

  // Gallery -> Sandbox bridge consumption (Phase 17, ROADMAP success
  // criterion 1): SandboxContainer applies a pending scenario via
  // loadScenario() as soon as useSandboxBridge()'s requestId changes, with
  // no navigation and no submit step.
  it("loads a bridged scenario via loadScenario when pendingScenario.requestId changes", () => {
    const { rerender } = render(<SandboxContainer />);
    expect(within(verdictBanner()).getByRole("heading", { name: "Crossing" })).toBeInTheDocument();

    mockPendingScenario = {
      vesselA: overtakingBothDirectionsCase.vesselA,
      vesselB: overtakingBothDirectionsCase.vesselB,
      requestId: 1,
    };
    rerender(<SandboxContainer />);

    expect(within(verdictBanner()).getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();
  });

  // ROADMAP success criterion 4: a second bridged load replaces the first,
  // not stale -- a component-level analog of the human-verified "second
  // gallery card replaces the first" check Plan 17-04 confirms end-to-end.
  it("replaces a bridged scenario with a second one when a new requestId arrives", () => {
    const { rerender } = render(<SandboxContainer />);

    mockPendingScenario = {
      vesselA: overtakingBothDirectionsCase.vesselA,
      vesselB: overtakingBothDirectionsCase.vesselB,
      requestId: 1,
    };
    rerender(<SandboxContainer />);
    expect(within(verdictBanner()).getByRole("heading", { name: "Overtaking" })).toBeInTheDocument();

    mockPendingScenario = {
      vesselA: crossingResidualBasicCase.vesselA,
      vesselB: crossingResidualBasicCase.vesselB,
      requestId: 2,
    };
    rerender(<SandboxContainer />);

    expect(within(verdictBanner()).getByRole("heading", { name: "Crossing" })).toBeInTheDocument();
    expect(within(verdictBanner()).queryByRole("heading", { name: "Overtaking" })).not.toBeInTheDocument();
  });
});
