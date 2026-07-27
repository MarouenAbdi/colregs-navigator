---
phase: 19-guided-tour
reviewed: 2026-07-27T12:15:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/components/ui/dialog.tsx
  - src/components/tour/guided-tour-steps.ts
  - src/components/tour/guided-tour-steps.test.ts
  - app/globals.css
  - src/components/tour/TourStepIllustration.tsx
  - src/components/tour/TourStepIllustration.test.tsx
  - src/components/tour/GuidedTourModal.tsx
  - src/components/tour/GuidedTourModal.test.tsx
  - src/components/sandbox/SandboxContainer.tsx
  - src/components/sandbox/SandboxContainer.test.tsx
  - eslint.config.mjs
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 19: Code Review Report

**Reviewed:** 2026-07-27T12:15:00Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

All 40 tests across the four new/changed test files pass, `tsc --noEmit` is clean, and `eslint` reports zero errors on the changed files. The controlled-Dialog composition, focus-restore-to-trigger logic, and step-navigation state machine in `GuidedTourModal.tsx` were traced by hand (and empirically verified with a scratch instrumentation test, since deleted) — the focus-restore effect genuinely does capture the pre-open focus target *before* Radix's `FocusScope` steals focus into the dialog, because Radix's focus-scope effect depends on a `container` state variable populated by a ref callback, deferring it to a later effect pass than `GuidedTourModal`'s own `useEffect`. That subtlety is not documented anywhere in the code and would be very easy to break in a future refactor, but as shipped today it works correctly.

The most serious finding is a genuinely dead-on-arrival CSS defect: `dialog.tsx`'s open/close fade+zoom transition classes use the bare `data-open:`/`data-closed:` Tailwind v4 variant (boolean-attribute selector), but Radix Dialog sets `data-state="open"|"closed"` on `Overlay`/`Content` — never a literal `data-open`/`data-closed` attribute. I confirmed via `@tailwindcss/cli` that `data-open:fade-in-0` compiles to selector `.data-open\:fade-in-0[data-open]`, and via a rendered-DOM probe that Radix only ever emits `data-state="open"`/`data-state="closed"`. The two selectors never intersect, so the dialog's entire enter/exit animation is dead code — it always renders instantly with no transition. This was not introduced by oversight: commit `130c7e3` explicitly changed the plan to *require* this exact (broken) syntax, reasoning it matches `select.tsx`'s pre-existing convention — so the same defect exists in `select.tsx` today (out of this phase's file scope, but worth flagging as the root cause).

Remaining findings are content-fidelity and accessibility gaps in the six inline SVG tour illustrations and the new `radar-sweep-dot` accent, plus one clear violation of this repo's own documented "no duplicated JSX for near-identical instances" convention (the exact failure mode CLAUDE.md's own rationale calls out).

## Critical Issues

### CR-01: Dialog open/close animation classes never match Radix's actual `data-state` attribute — dead CSS

**File:** `src/components/ui/dialog.tsx:34-35,62-64`
**Issue:** `DialogOverlay` and `DialogContent` apply `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95` / `data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95`. Tailwind v4's bare `data-open:`/`data-closed:` variant compiles to the attribute-presence selector `[data-open]` / `[data-closed]` (verified by compiling this exact class list with `@tailwindcss/cli`, which emitted `.data-open\:fade-in-0[data-open] { ... }`). Radix's `Dialog.Overlay`/`Dialog.Content`, however, only ever set `data-state="open"` or `data-state="closed"` (verified by rendering `<DialogContent>` in jsdom and inspecting `outerHTML`: `data-state="open" data-slot="dialog-content" ...`). There is no `data-open`/`data-closed` attribute anywhere in Radix's output, so these selectors can never match — the dialog's intended fade-in/zoom-in on open and fade-out/zoom-out on close never fire. The dialog simply appears/disappears instantly with no transition, silently contradicting the shipped-looking `animate-in`/`animate-out` classes.

This is not a one-off typo: `.planning/phases/19-guided-tour/19-01-PLAN.md` (commit `130c7e3`) explicitly mandated this exact bare-variant syntax because it believed `select.tsx`'s `SelectContent` uses (and relies on) the same convention successfully. `select.tsx` has the identical defect (`data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95` / `data-closed:animate-out ...` at lines 104-105), so this bug is inherited from — and reinforces — a pre-existing broken pattern rather than introducing a new one. Both components currently render with zero enter/exit transition.

**Fix:**
```tsx
// DialogOverlay
className={cn(
  `
    fixed inset-0 z-50 bg-black/70 backdrop-blur-sm
    data-[state=open]:animate-in data-[state=open]:fade-in-0
    data-[state=closed]:animate-out data-[state=closed]:fade-out-0
  `,
  className
)}

// DialogContent
className={cn(
  `
    fixed top-1/2 left-1/2 z-50 grid max-h-[820px] w-full max-w-150
    -translate-1/2 gap-4 rounded-2xl border border-border bg-card p-0
    shadow-lg
    data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
    data-[state=closed]:animate-out data-[state=closed]:fade-out-0
    data-[state=closed]:zoom-out-95
  `,
  className
)}
```
(`select.tsx` should get the same fix in a follow-up, since it shares the identical defect.)

## Warnings

### WR-01: Decorative tour illustrations are not hidden from assistive technology

**File:** `src/components/tour/TourStepIllustration.tsx:22,60,102,129,178,226`
**Issue:** None of the six `<svg>` roots (`WelcomeIllustration`, `MoveVesselsIllustration`, `InstrumentsIllustration`, `VerdictIllustration`, `ReasoningIllustration`, `GalleryIllustration`) carry `aria-hidden="true"`, `role="presentation"`, or `focusable="false"`. Inline SVG `<text>` nodes are real, accessible DOM text — screen readers will announce mock/placeholder content (e.g. step 2's fabricated readout values `"1.92 NM"`, `"045°"`, `"0.28 NM"`, `"04:12"`, or step 3's fabricated `"CROSSING · RULE 15 · VESSEL A GIVES WAY"` banner) as if it were live, real data, duplicating and potentially confusing the already-accessible `title`/`body`/`points` content that describes the same step. This is purely decorative illustration content (per this file's own header comment) and should not reach the accessibility tree at all.
**Fix:** Add `aria-hidden="true"` (and optionally `focusable="false"` for older IE/Edge SVG focus quirks, though likely moot for this stack) to each `<svg>` root, e.g. `<svg aria-hidden="true" viewBox="0 0 460 176" ...>`.

### WR-02: `radar-sweep-dot` infinite animation is not gated behind `prefers-reduced-motion`

**File:** `app/globals.css:209-223` (consumed at `src/components/tour/GuidedTourModal.tsx:86` and `src/components/sandbox/SandboxContainer.tsx:75`)
**Issue:** `.radar-sweep-dot` runs `animation: radar-sweep 2s linear infinite` unconditionally, forever, on two persistently-visible elements (the "How to read this" trigger button, always on-screen in the Sandbox header, and the Guided Tour's own header). This codebase already has an established, correct precedent for gating motion behind `prefers-reduced-motion` in this same file (`html { scroll-behavior: smooth }` is wrapped in `@media (prefers-reduced-motion: no-preference)` at lines 173-177, with an explicit comment about respecting users who've opted out of animation). The new radar-sweep animation does not follow that precedent, and as an unconditional, indefinitely-looping animation displayed in parallel with other content, it also runs against WCAG 2.2.2 (Pause, Stop, Hide) guidance for non-essential motion lasting more than five seconds.
**Fix:**
```css
.radar-sweep-dot {
  position: relative;
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: conic-gradient(from 0deg, transparent, var(--primary) 60%, transparent);
}

@media (prefers-reduced-motion: no-preference) {
  .radar-sweep-dot {
    animation: radar-sweep 2s linear infinite;
  }
}
```

### WR-03: Duplicated near-identical JSX for the two-vessel blocks, violating CLAUDE.md's explicit convention

**File:** `src/components/tour/TourStepIllustration.tsx:39-45` (`WelcomeIllustration`), `137-162` (`VerdictIllustration`)
**Issue:** `WelcomeIllustration` repeats an almost-identical `<g transform="translate(...) rotate(...)"><path d="M0 -9 L6 8 L0 4 L-6 8 Z" fill="..."/></g>` wedge block twice (once per vessel, differing only in translate/rotate/fill), and `VerdictIllustration` repeats an almost-identical `<g transform="translate(16,Y)">` vessel-row block twice (rect + wedge `<g>` + label `<text>` + badge `<rect>` + badge `<text>`, differing only in Y-offset, wedge fill, label, and badge colors/text). This is precisely the anti-pattern CLAUDE.md calls out by name: *"If the same JSX block ... is repeated for two data instances — two vessels, two badges, two cards — extract a parameterized subcomponent instead of copy-pasting. Duplication here has bitten this project already (a rotation bug fixed in one vessel's block but not the other would have been invisible until someone dragged the second vessel)."* Both duplicated blocks here literally include a per-vessel `rotate(...)`/color value — exactly the kind of value a future edit could update in one copy and miss in the other. The file's own header comment addresses only the *step-to-step* level ("six distinct sub-components... not near-identical, so the convention does not apply") but misses that the convention applies at the *within-a-step, per-vessel* grain, where genuine duplication exists.
**Fix:** Extract small parameterized subcomponents, e.g.:
```tsx
function VesselWedge({ x, y, rotation, fill }: { x: number; y: number; rotation: number; fill: string }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotation})`}>
      <path d="M0 -9 L6 8 L0 4 L-6 8 Z" fill={fill} />
    </g>
  );
}

function VerdictVesselRow({ y, label, wedgeFill, badgeFill, badgeStroke, badgeTextFill, badgeText }: {...}) {
  return (
    <g transform={`translate(16,${y})`}>
      <rect width={428} height={42} rx={8} fill="#101014" stroke="#27272A" />
      <g transform="translate(14,11)"><path d="M0 20 L11 -4 L22 20 L11 14 Z" fill={wedgeFill} /></g>
      <text x={48} y={26} fill="#FAFAFA" fontSize={12}>{label}</text>
      <rect x={300} y={9} width={116} height={24} rx={6} fill={badgeFill} stroke={badgeStroke} />
      <text x={313} y={25} fill={badgeTextFill} fontSize={10} fontWeight={700}>{badgeText}</text>
    </g>
  );
}
```

### WR-04: `VerdictIllustration`'s "GIVE WAY" badge uses the wrong color, contradicting the app's actual give-way token — teaches the wrong color association

**File:** `src/components/tour/TourStepIllustration.tsx:140-148`
**Issue:** Within `VerdictIllustration`, Vessel A's wedge is filled `#EF4444` (red) — matching this app's real `--give-way` token (`#EF4444`, `app/globals.css:106`) and the real `ChartFooterStrip`'s `ROLE_BADGE_CLASSNAME["give-way"]` (`bg-give-way/10 border-give-way/35 text-give-way`, `src/components/sandbox/vessel-role.ts:52`). But the adjacent "GIVE WAY" badge on the *same* vessel row is colored amber (`fill="rgba(245,158,11,.14)"`, `stroke="rgba(245,158,11,.4)"`, `fill="#F59E0B"` on the text) — which is this app's `--doubt` token color (`#F59E0B`, `app/globals.css:110`), not `--give-way`. This is internally inconsistent within the same illustration (red wedge, amber badge, same vessel, same meaning) and factually wrong versus the live app's actual color-coding, which the tour explicitly exists to teach users to read ("Each ship also carries a GIVE WAY / STAND ON badge"). A user who completes this tour and then looks at the real sandbox will find give-way vessels marked red everywhere, not amber, undermining the tour's stated purpose.

This value is a verbatim, faithful port of `19-DESIGN-SNAPSHOT.md`'s own prototype (which itself hardcodes `#F59E0B`/`rgba(245,158,11,...)` for "GIVE WAY (amber)"), so the defect originates in the design source rather than being introduced by this implementation — but it still ships as incorrect, misleading content in this codebase today.
**Fix:** Change the GIVE WAY badge's fill/stroke/text colors to the give-way red token values (`#EF4444`-based, e.g. `fill="rgba(239,68,68,.14)"`, `stroke="rgba(239,68,68,.4)"`, text `fill="#EF4444"`) to match the real app's `--give-way` styling and the wedge color already used in the same row.

## Info

### IN-01: `TourStepIllustration.tsx` exceeds this project's documented file-length guideline

**File:** `src/components/tour/TourStepIllustration.tsx` (267 lines)
**Issue:** CLAUDE.md's "Separation of concerns" convention flags "~150-200 lines" as the signal a split is overdue. This file is 267 lines, though it does not mix computation with presentation (each of the six sub-components is pure markup/data, so the specific "split computation from presentation" rationale doesn't squarely apply) — it's six legitimately distinct, cohesive illustrations kept together for discoverability. Not flagged by the project's own `max-lines` ESLint rule, which is scoped only to `src/domain/**`.
**Fix:** Not urgent; if a 7th step or additional illustration detail is ever added, consider splitting into one file per illustration (or a `tour-illustrations/` subfolder) rather than growing this file further.

### IN-02: Potential future text-collision risk between the tour's mock illustrations and the live Sandbox UI

**File:** `src/components/tour/TourStepIllustration.tsx:93-98,169-174` (mock `RANGE`/`BEARING`/`CPA`/`TCPA` tile labels and rule-chain node labels), compared against `src/components/sandbox/chart/ChartFooterStrip.tsx` / `ChartHeaderStrip.tsx`
**Issue:** Because Radix's modal Dialog does not unmount the page behind it (it stays in the DOM, marked `aria-hidden` on background siblings), a future test that navigates the open Guided Tour to step 2 ("Read the instruments") or step 3 ("Read the verdict") from within `SandboxContainer.test.tsx` and queries `screen.getByText("RANGE")`/`"CPA"`/`"TCPA"` etc. without scoping to `within(dialog)` would hit duplicate matches (one from the real `ChartFooterStrip`, one from the tour's mock illustration) and throw. No current test hits this, but it's a latent trap for whoever next extends `SandboxContainer.test.tsx`'s "Guided Tour" describe block past step 0/1.
**Fix:** No action needed today; when adding future assertions inside the tour's later steps in an integration test, scope queries with `within(dialog)` as the existing tests already correctly do for step 0/1 content.

---

_Reviewed: 2026-07-27T12:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
