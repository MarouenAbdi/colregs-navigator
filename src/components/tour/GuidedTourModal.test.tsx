// @vitest-environment jsdom
/**
 * GuidedTourModal behavior tests -- proves every ROADMAP Phase 19 success
 * criterion (step nav, final-step label/close, Skip/Escape/outside-click
 * dismissal, focus-return) against the real Radix Dialog primitive, not a
 * hand-rolled overlay. Follows VesselOverlayCard.test.tsx's jsdom pragma +
 * userEvent interaction pattern. Escape/outside-click assertions await
 * user-event interactions before reading `document.activeElement`
 * (RESEARCH.md Pitfall 3 -- Radix's focus restoration is not always
 * synchronous with React's render commit).
 */
import { useState } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuidedTourModal } from "./GuidedTourModal.js";
import { TOUR_STEPS } from "./guided-tour-steps.js";

afterEach(() => {
  cleanup();
});

// Wraps GuidedTourModal with real open/step-managing state (rather than a
// vi.fn() onOpenChange) so Escape/outside-click/Skip dismissal paths and
// the reopen-resets-to-step-0 behavior exercise Radix's actual controlled
// Dialog lifecycle, not just a spy assertion.
function TourHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open tour
      </button>
      <GuidedTourModal open={open} onOpenChange={setOpen} />
    </div>
  );
}

describe("GuidedTourModal", () => {
  it("renders closed (no dialog role) when open is false", () => {
    render(<GuidedTourModal open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows TOUR_STEPS[0] content and no Back button when open becomes true", async () => {
    render(<GuidedTourModal open={true} onOpenChange={vi.fn()} />);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(TOUR_STEPS[0]!.title)).toBeInTheDocument();
    expect(within(dialog).getByText(TOUR_STEPS[0]!.body)).toBeInTheDocument();
    for (const point of TOUR_STEPS[0]!.points) {
      expect(within(dialog).getByText(point.tag)).toBeInTheDocument();
    }
    expect(within(dialog).queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("advances through steps 1-4 via Next, each showing that step's content and a Back button", async () => {
    const user = userEvent.setup();
    render(<GuidedTourModal open={true} onOpenChange={vi.fn()} />);

    const dialog = await screen.findByRole("dialog");
    for (let step = 1; step <= 4; step++) {
      await user.click(within(dialog).getByRole("button", { name: "Next" }));
      expect(within(dialog).getByText(TOUR_STEPS[step]!.title)).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: "Back" })).toBeInTheDocument();
    }
  });

  it("reads 'Start exploring' on the last step and calls onOpenChange(false) instead of advancing past it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<GuidedTourModal open={true} onOpenChange={onOpenChange} />);

    const dialog = await screen.findByRole("dialog");
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
      await user.click(within(dialog).getByRole("button", { name: "Next" }));
    }
    expect(within(dialog).getByText(TOUR_STEPS[TOUR_STEPS.length - 1]!.title)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Next" })).not.toBeInTheDocument();

    const forwardButton = within(dialog).getByRole("button", { name: "Start exploring" });
    await user.click(forwardButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Back returns to the previous step's content", async () => {
    const user = userEvent.setup();
    render(<GuidedTourModal open={true} onOpenChange={vi.fn()} />);

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Next" }));
    await user.click(within(dialog).getByRole("button", { name: "Next" }));
    expect(within(dialog).getByText(TOUR_STEPS[2]!.title)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Back" }));

    expect(within(dialog).getByText(TOUR_STEPS[1]!.title)).toBeInTheDocument();
  });

  it("Skip tour calls onOpenChange(false) immediately regardless of current step", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<GuidedTourModal open={true} onOpenChange={onOpenChange} />);

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Next" }));
    await user.click(within(dialog).getByRole("button", { name: "Skip tour" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Escape closes the tour and returns focus to the element focused before it opened", async () => {
    const user = userEvent.setup();
    render(<TourHarness />);

    const openButton = screen.getByRole("button", { name: "Open tour" });
    await user.click(openButton);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Radix's onCloseAutoFocus/focus-trap restoration is not always
    // synchronous with React's render commit (RESEARCH.md Pitfall 3) --
    // wrap in waitFor rather than asserting immediately after the awaited
    // keyboard interaction.
    await waitFor(() => expect(openButton).toHaveFocus());
  });

  it("a pointerdown outside the dialog content closes it (Radix onPointerDownOutside)", async () => {
    render(<TourHarness />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Open tour" }));
    await screen.findByRole("dialog");

    // Radix's modal Dialog sets `pointer-events: none` on <body> while
    // open (real production behavior), leaving only the Dialog's own
    // Portal subtree -- Content AND Overlay -- interactive. Clicking the
    // Overlay backdrop (rendered by this codebase's own `DialogOverlay`,
    // outside `DialogContent`) is the actual real-world outside-dismiss
    // gesture and is the only page element userEvent can click without
    // tripping its pointer-events guard.
    const overlay = document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement;
    await user.click(overlay);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("resets to step 0 when reopened after a previous session advanced past step 0", async () => {
    const user = userEvent.setup();
    render(<TourHarness />);

    const openButton = screen.getByRole("button", { name: "Open tour" });
    await user.click(openButton);
    let dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Next" }));
    await user.click(within(dialog).getByRole("button", { name: "Next" }));
    expect(within(dialog).getByText(TOUR_STEPS[2]!.title)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(openButton);
    dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(TOUR_STEPS[0]!.title)).toBeInTheDocument();
  });

  it("always renders exactly 6 step-dot indicator elements regardless of current step", async () => {
    const user = userEvent.setup();
    render(<GuidedTourModal open={true} onOpenChange={vi.fn()} />);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByTestId("tour-step-dot")).toHaveLength(6);

    await user.click(within(dialog).getByRole("button", { name: "Next" }));

    expect(within(dialog).getAllByTestId("tour-step-dot")).toHaveLength(6);
  });
});
