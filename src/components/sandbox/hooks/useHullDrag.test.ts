// @vitest-environment jsdom
/**
 * useHullDrag test (04-03 Task 3): drives a real pointerdown+pointermove
 * sequence against ChartPanel's rendered hull hit-rect and asserts
 * onVesselPositionChange receives the expected screenToChart-converted
 * chart-space Position.
 *
 * Written as a plain `.ts` file per this plan's own file list -- no JSX
 * syntax is used (React.createElement instead), and jsdom's missing
 * ResizeObserver/Pointer-Capture APIs are polyfilled the same way as
 * ChartPanel.test.tsx.
 */
import { createElement } from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartPanel } from "../ChartPanel.js";
import { classifyEncounter } from "../../../domain/colregs/classify-encounter.js";
import { crossingResidualBasicCase } from "../../../domain/colregs/classify-encounter.fixtures.js";
import { screenToChart } from "../../../domain/geometry/screen-convert.js";

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
});

describe("useHullDrag (via ChartPanel's hull hit-rect)", () => {
  it("forwards the vessel label and the screenToChart-converted chart position on pointermove", () => {
    const { vesselA, vesselB } = crossingResidualBasicCase;
    const result = classifyEncounter(vesselA, vesselB);
    if (!result.ok) throw new Error("fixture expected to classify successfully");

    const onVesselPositionChange = vi.fn();
    const onVesselHeadingChange = vi.fn();

    const { container } = render(
      createElement(ChartPanel, {
        vesselA,
        vesselB,
        classification: result.value,
        onVesselPositionChange,
        onVesselHeadingChange,
      }),
    );

    const hullHitRect = container.querySelector('[data-testid="hull-hit-vesselA"]');
    expect(hullHitRect).not.toBeNull();

    // jsdom's getBoundingClientRect() always returns a zero-valued rect (no
    // real layout engine), so the hook's `clientX - svgRect.left` reduces
    // to exactly `clientX` -- pick clientX/clientY directly as the
    // simulated pointer's screen coordinates.
    const pointerEventInit = { pointerId: 1, clientX: 120, clientY: 90, bubbles: true };
    hullHitRect?.dispatchEvent(new PointerEvent("pointerdown", pointerEventInit));
    hullHitRect?.dispatchEvent(new PointerEvent("pointermove", pointerEventInit));

    const expectedPosition = screenToChart(120, 90, MOCK_CONTAINER_SIZE, CHART_VIEW_BOX);

    expect(onVesselPositionChange).toHaveBeenCalledWith("vesselA", expectedPosition);
  });
});
