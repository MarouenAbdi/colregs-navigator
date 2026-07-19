// @vitest-environment jsdom
/**
 * ChartPanel render + doubt-overlay tests (04-03 Task 3).
 *
 * jsdom does not implement `ResizeObserver` or the Pointer Capture methods
 * (`setPointerCapture`/`hasPointerCapture`/`releasePointerCapture`) that
 * ChartPanel/useHullDrag/useRotateHandleDrag call directly, per the
 * project's own (correct, non-defensive) production code -- see
 * `04-RESEARCH.md`'s Standard Pointer-Events pattern. This file installs
 * minimal test-only polyfills for both so the component can render and be
 * drag-tested under jsdom without weakening the production implementation.
 */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartPanel } from "./ChartPanel.js";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import {
  crossingResidualBasicCase,
  doubtBandNearOvertakingBoundaryCase,
  headOnBoundaryInclusiveCase,
} from "../../domain/colregs/classify-encounter.fixtures.js";
import type { ChartPanelProps } from "./types.js";

const MOCK_CONTAINER_SIZE = { width: 400, height: 400 };

class MockResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(): void {
    // Real ResizeObserver invokes the callback once, asynchronously, after
    // observe() is first called -- fire synchronously here with a fixed
    // size, which is close enough for a controlled test environment and
    // keeps tests free of timing flakiness.
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

function renderChartPanel(overrides: Partial<ChartPanelProps> = {}) {
  const { vesselA, vesselB } = crossingResidualBasicCase;
  const result = classifyEncounter(vesselA, vesselB);
  if (!result.ok) throw new Error("fixture expected to classify successfully");

  const props: ChartPanelProps = {
    vesselA,
    vesselB,
    classification: result.value,
    onVesselPositionChange: vi.fn(),
    onVesselHeadingChange: vi.fn(),
    ...overrides,
  };
  return render(<ChartPanel {...props} />);
}

describe("ChartPanel", () => {
  it("renders a GW badge and an SO badge for a give-way/stand-on crossing encounter", () => {
    renderChartPanel();
    expect(screen.getByText("GW")).toBeInTheDocument();
    expect(screen.getByText("SO")).toBeInTheDocument();
  });

  it("gives the decorative letter/role-badge overlay pointer-events:none so it never shadows the hull's own drag hit-target underneath it", () => {
    // Regression test for a real hit-testing dead zone (code review CR-01):
    // at heading 0 (this app's default seed), the non-rotating badge's
    // painted rect geometrically overlapped ~45px^2 of the hull polygon's
    // own painted area. Without pointer-events:none, an unhandled solid
    // shape captures that pointerdown via SVG's default
    // pointer-events:visiblePainted, silently blocking the hull drag that
    // should have started there.
    const { container } = renderChartPanel();
    const badgeText = within(container).getByText("GW");
    const overlayGroup = badgeText.closest("g[pointer-events]");
    expect(overlayGroup).not.toBeNull();
    expect(overlayGroup?.getAttribute("pointer-events")).toBe("none");
  });

  it("renders the bearing line dashed amber when doubtBoundary is near-head-on-boundary", () => {
    const { vesselA, vesselB } = headOnBoundaryInclusiveCase;
    const result = classifyEncounter(vesselA, vesselB);
    if (!result.ok) throw new Error("fixture expected to classify successfully");
    expect(result.value.doubt).toBe(true);
    expect(result.value.doubtBoundary).toBe("near-head-on-boundary");

    const { container } = renderChartPanel({ vesselA, vesselB, classification: result.value });
    const bearingLine = container.querySelector('[data-testid="bearing-line"]');
    expect(bearingLine).not.toBeNull();
    expect(bearingLine?.getAttribute("stroke-dasharray")).toBe("4 3");
    expect(bearingLine?.getAttribute("stroke")).toBe("#F59E0B");
  });

  it("renders exactly one amber-stroked cone when doubtBoundary is near-overtaking-crossing-boundary", () => {
    const { vesselA, vesselB } = doubtBandNearOvertakingBoundaryCase;
    const result = classifyEncounter(vesselA, vesselB);
    if (!result.ok) throw new Error("fixture expected to classify successfully");
    expect(result.value.doubt).toBe(true);
    expect(result.value.doubtBoundary).toBe("near-overtaking-crossing-boundary");

    const { container } = renderChartPanel({ vesselA, vesselB, classification: result.value });
    const cones = container.querySelectorAll('[data-testid^="cone-"]');
    expect(cones).toHaveLength(2);
    const amberCones = Array.from(cones).filter((cone) => cone.getAttribute("stroke") === "#F59E0B");
    expect(amberCones).toHaveLength(1);
  });
});
