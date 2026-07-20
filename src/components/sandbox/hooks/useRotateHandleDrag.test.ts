// @vitest-environment jsdom
/**
 * useRotateHandleDrag test: drives a real
 * pointerdown+pointermove sequence against ChartPanel's rendered
 * rotate-handle hit-circle, asserts onVesselHeadingChange fires with a
 * heading, and regression-tests Pitfall 1 -- the hull hit-rect's own
 * position-change callback must NOT also fire for the same gesture
 * (proves `stopPropagation()` works).
 */
import { createElement } from "react";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChartPanel } from "../ChartPanel.js";
import { classifyEncounter } from "../../../domain/colregs/classify-encounter.js";
import { crossingResidualBasicCase } from "../../../domain/colregs/classify-encounter.fixtures.js";

const MOCK_CONTAINER_SIZE = { width: 400, height: 400 };

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

describe("useRotateHandleDrag (via ChartPanel's rotate-handle hit-circle)", () => {
  it("forwards a heading value and does not also trigger the hull hit-rect's position-change callback", () => {
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

    const rotateHitCircle = container.querySelector('[data-testid="rotate-hit-vesselA"]');
    expect(rotateHitCircle).not.toBeNull();

    const pointerEventInit = { pointerId: 1, clientX: 150, clientY: 40, bubbles: true };
    rotateHitCircle?.dispatchEvent(new PointerEvent("pointerdown", pointerEventInit));
    rotateHitCircle?.dispatchEvent(new PointerEvent("pointermove", pointerEventInit));

    expect(onVesselHeadingChange).toHaveBeenCalledTimes(1);
    expect(onVesselHeadingChange.mock.calls[0]?.[0]).toBe("vesselA");
    expect(typeof onVesselHeadingChange.mock.calls[0]?.[1]).toBe("number");

    // Pitfall 1 regression: the rotate handle sits over the hull hit-rect;
    // without stopPropagation() this same gesture would also fire the
    // hull's own onPointerDown/onPointerMove handlers.
    expect(onVesselPositionChange).not.toHaveBeenCalled();
  });
});
