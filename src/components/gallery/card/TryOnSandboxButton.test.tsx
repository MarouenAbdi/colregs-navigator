// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TryOnSandboxButton } from "./TryOnSandboxButton.js";
import { crossingResidualBasicCase } from "../../../domain/colregs/classify-encounter.fixtures.js";

// Mocks the Gallery<->Sandbox bridge the same mutable-closure-variable way
// SandboxContainer.test.tsx already mocks it, so requestLoad's call args
// can be asserted without a real SandboxBridgeProvider ancestor.
const mockRequestLoad = vi.fn();
vi.mock("../../sandbox/bridge/SandboxBridgeProvider.js", () => ({
  useSandboxBridge: () => ({ pendingScenario: null, requestLoad: mockRequestLoad }),
}));

// jsdom does not implement scrollIntoView -- same test-only polyfill
// precedent as SandboxContainer.test.tsx.
beforeEach(() => {
  mockRequestLoad.mockClear();
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("TryOnSandboxButton", () => {
  it("renders a button with the accessible name 'Try {title} on Sandbox'", () => {
    render(
      <TryOnSandboxButton
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        title="Classic crossing"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Try Classic crossing on Sandbox" }),
    ).toBeInTheDocument();
  });

  it("calls requestLoad with exactly (vesselA, vesselB) on click", async () => {
    const user = userEvent.setup();
    render(
      <TryOnSandboxButton
        vesselA={crossingResidualBasicCase.vesselA}
        vesselB={crossingResidualBasicCase.vesselB}
        title="Classic crossing"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Try Classic crossing on Sandbox" }));

    expect(mockRequestLoad).toHaveBeenCalledWith(
      crossingResidualBasicCase.vesselA,
      crossingResidualBasicCase.vesselB,
    );
  });

  it("scrolls a sibling #sandbox element into view on click, with no behavior: 'smooth' override (D-07)", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <section id="sandbox" />
        <TryOnSandboxButton
          vesselA={crossingResidualBasicCase.vesselA}
          vesselB={crossingResidualBasicCase.vesselB}
          title="Classic crossing"
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Try Classic crossing on Sandbox" }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    const callArg = (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(callArg).not.toHaveProperty("behavior", "smooth");
  });
});
