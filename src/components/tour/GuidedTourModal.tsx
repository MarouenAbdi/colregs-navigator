"use client";

/**
 * GuidedTourModal -- controlled Radix Dialog composition for the 6-step
 * Guided Tour (D-01, D-02, TOUR-01, TOUR-02). Delegates Escape/outside-click
 * dismissal and the focus trap entirely to Radix's Dialog defaults --
 * closing the exact gap CONTEXT.md's D-01 identifies in the design source's
 * own prototype (no Escape handler, no outside-click handler there).
 * `step` is ephemeral tour-nav view state and stays local to this
 * component -- never lifted into the shared Sandbox state hook
 * (ARCHITECTURE.md Anti-Pattern 2).
 *
 * Focus-return-to-trigger is the one piece NOT left to Radix's bare
 * default: Radix's `DialogContent`'s built-in `onCloseAutoFocus` restores
 * focus via `context.triggerRef.current?.focus()`, which is only
 * populated by an actual `<DialogTrigger>` descendant -- and always calls
 * `event.preventDefault()` first, which cancels `FocusScope`'s own
 * "restore to whatever had focus before open" fallback. Since this
 * component is driven by a fully external, controlled `open`/onOpenChange
 * pair (its trigger button lives in `SandboxContainer.tsx`, wired in Plan
 * 19-03, not as a `DialogTrigger` child here), `context.triggerRef` is
 * always null and Radix's default silently focuses nothing. A one-line
 * manual capture/restore below closes that gap without hand-rolling any
 * of the Escape/outside-click/focus-trap behavior itself.
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { TOUR_STEPS } from "./guided-tour-steps.js";
import { TourStepIllustration } from "./TourStepIllustration.js";

export interface GuidedTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GuidedTourModal({ open, onOpenChange }: GuidedTourModalProps) {
  const [step, setStep] = useState(0);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Reset to step 0 every time the tour (re)opens -- matches the design
  // source's own re-open behavior, not a fresh-mount-only reset. Also
  // captures whatever had focus right before opening, for the manual
  // focus-restore in onCloseAutoFocus below (see file header comment).
  useEffect(() => {
    if (open) {
      setStep(0);
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open]);

  const current = TOUR_STEPS[step];
  const isLastStep = step === TOUR_STEPS.length - 1;

  function handleForward() {
    if (isLastStep) {
      // "Start exploring" closes the tour instead of advancing past the
      // last step (D-02) -- same button, dual purpose by step position.
      onOpenChange(false);
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden"
        onCloseAutoFocus={(event) => {
          // See file header comment: Radix's own default here only
          // restores focus via a <DialogTrigger>-registered ref, which
          // this fully-externally-controlled component has none of.
          // preventDefault() suppresses that no-op default so this
          // manual restore is what actually runs.
          event.preventDefault();
          previouslyFocusedElementRef.current?.focus();
        }}
      >
        <div className="
          flex items-center justify-between border-b border-border px-5 py-3
        ">
          <span className="
            flex items-center gap-2 font-mono text-[11px] font-semibold
            text-muted-foreground uppercase
          ">
            <span className="radar-sweep-dot" aria-hidden="true" />
            {`Guided tour · Step ${step + 1}/6`}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Skip tour
          </Button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="
                flex size-11 shrink-0 items-center justify-center rounded-lg
                border border-primary/30 bg-primary/10 text-xl
              "
            >
              {current.icon}
            </span>
            <DialogTitle className="text-[21px] font-bold">{current.title}</DialogTitle>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <TourStepIllustration step={step} />
          </div>

          <DialogDescription className="text-sm text-muted-foreground">{current.body}</DialogDescription>

          <ul className="flex flex-col gap-2">
            {current.points.map((point) => (
              <li key={point.tag} className="flex gap-2 text-sm">
                <span className="
                  shrink-0 font-mono text-[11px] font-semibold text-primary
                ">{point.tag}</span>
                <span className="text-muted-foreground">{point.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="
          flex items-center justify-between border-t border-border px-5 py-3
        ">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            // Empty placeholder keeps the footer's 3-column layout centered
            // when Back is absent on step 0, without rendering a "Back"
            // button role for assistive tech or tests to find.
            <span aria-hidden="true" />
          )}

          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((tourStep, i) => {
              const isActive = i === step;
              const isCompleted = i < step;
              return (
                <span
                  key={tourStep.id}
                  data-testid="tour-step-dot"
                  aria-hidden="true"
                  className={`
                    h-1.5 rounded-full
                    ${isActive ? "w-4.5 bg-primary" : "w-1.5"}
                    ${!isActive && isCompleted ? "bg-rule-accent" : ""}
                    ${
                      // Upcoming dots: the design's literal #3F3F46 has no
                      // exact token match in this app's palette, so this
                      // uses the closest existing Tailwind color token
                      // (--border) rather than a raw hex literal.
                      !isActive && !isCompleted ? "bg-border" : ""
                    }
                  `}
                />
              );
            })}
          </div>

          <Button type="button" variant="default" onClick={handleForward}>
            {isLastStep ? "Start exploring" : "Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
