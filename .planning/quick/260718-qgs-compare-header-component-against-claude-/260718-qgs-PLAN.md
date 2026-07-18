---
quick_id: 260718-qgs
type: quick
files_modified: [src/components/layout/Header.tsx]
autonomous: false
must_haves:
  truths:
    - "Header's nav links (Sandbox/Gallery) and the Source button visually group together on the right, matching Main-Design.png and 06-CONTEXT.md's explicit layout description"
    - "Nav links show an accent-colored hover and focus-visible state, per 06-UI-SPEC.md's Color section reservation"
    - "Header.tsx's top-of-file comment contains no plan/task ID reference, per the Phase 7 'Comments: WHY only' convention"
    - "The two nav links render from one data source, not two copy-pasted JSX blocks"
  artifacts:
    - path: "src/components/layout/Header.tsx"
      provides: "Sticky header chrome: logo group (left), nav+Source group (right)"
  key_links:
    - from: "src/components/layout/Header.tsx"
      to: "app/globals.css"
      via: "text-accent utility class (already registered, reused for hover/focus state)"
      pattern: "hover:text-accent"
---

<objective>
Compare `src/components/layout/Header.tsx` against the Claude Design source
(`.planning/design/Main-Design.png`) and this repo's own Phase 6 planning
artifacts (`06-CONTEXT.md`, `06-UI-SPEC.md`), fix the genuine deviations found,
and retroactively apply the Phase 7 conventions codified in `CLAUDE.md` —
bundled into the current branch (`frontend-implementation/phase-7-hero`) so it
ships together with Phase 7's PR.

Purpose: Header.tsx was built in Phase 6 before the Phase 7 conventions
existed, and a design-fidelity pass on it was never separately checked off
(06-UI-SPEC.md's checker sign-off section is still all-unchecked / "pending").
This closes both gaps in one pass rather than carrying them forward silently.

Output: Updated `src/components/layout/Header.tsx` with confirmed visual
deviations fixed and convention violations corrected.
</objective>

<audit_findings>
This audit was already performed by the planner (image read + cross-referenced
against `06-CONTEXT.md`/`06-UI-SPEC.md`/`06-01-SUMMARY.md`) so the executor
does not need to re-derive it from scratch — re-open `Main-Design.png` only to
sanity-check before editing, per Task 1.

## Confirmed deviations (fix these)

1. **Layout grouping.** `06-CONTEXT.md`'s `<specifics>` section states the
   design explicitly as: "icon + wordmark + chip on the left; 'Sandbox' /
   'Gallery' anchor links + 'Source' button (with icon) on the right" — i.e.
   nav links and the Source button are ONE visual group on the right.
   Header.tsx's current markup has 3 direct flex children under
   `justify-between` (logo div, `<nav>`, `<Button>`), which pushes the middle
   child (`<nav>`) toward the horizontal center rather than flush against the
   Button — contradicting the locked two-group layout.

2. **Missing nav-link hover/focus state.** `06-UI-SPEC.md`'s Color section
   explicitly reserves the accent token (`#2dd4bf`, already exposed via the
   `text-accent` Tailwind utility and already used on the header's `Compass`
   icon) for "focus rings on interactive elements (nav links...)" and
   "active/hover state of Header nav links." The current `<a href="#sandbox">`
   / `<a href="#gallery">` elements carry zero interactive-state classes —
   confirmed via Tailwind's Preflight base styles (which reset `<a>` to
   `color: inherit`/no underline, so these render as plain unstyled text with
   no hover/focus affordance at all today).

3. **Nav link gap.** `06-UI-SPEC.md`'s Spacing Scale locks the "sm" token
   (8px) to "...nav link gaps." The current `<nav>` uses `gap-6` (24px) — 3x
   the documented value.

## Confirmed NOT deviations (do not touch)

- The `Code2` icon substituted for a GitHub icon on the "Source" button is a
  real, already-documented Rule-1 deviation (a genuine upstream `lucide-react`
  package change during Phase 6 — see the file's own top comment and
  `06-01-SUMMARY.md` Deviation #5), not a bug. Leave as-is.
- Logo icon (`Compass`), two-weight wordmark treatment, "Rules 11-18" pill
  badge styling, sticky/border/background chrome, and the 640px nav-collapse
  breakpoint all match `Main-Design.png` and `06-UI-SPEC.md` already. No fix.

## Noted but explicitly NOT fixing

- `06-UI-SPEC.md`'s Spacing Scale also documents a responsive container gutter
  (24px default -> 32px at a >=900px breakpoint). Header.tsx hardcodes `px-6`
  (24px) with no responsive switch. This is being left alone: it is not
  confirmable from a single fixed-width screenshot, `06-UI-SPEC.md`'s own
  checker sign-off was never completed (draft status, "Approval: pending"),
  and fixing it would require inventing a new custom `900px` Tailwind
  breakpoint that does not exist anywhere else in this codebase today. If a
  later phase (Sandbox/Gallery) needs this same breakpoint, add it then with
  real cross-component justification rather than here.

## Phase 7 convention audit

- **Split computation from presentation:** Not applicable — Header.tsx is
  fully static markup with no derived math or domain calls. No split needed.
- **No duplicated JSX for near-identical instances:** VIOLATION. The two
  `<a href="#sandbox">`/`<a href="#gallery">` blocks are near-identical and
  are about to both need the same new hover/focus classes (fix #2 above) —
  exactly the duplication risk the convention calls out ("a bug fixed in one
  block but not the other would be invisible"). Fix by extracting a small
  `NAV_LINKS` array rendered via `.map()`.
- **No raw CSS composed as strings:** Compliant — Header.tsx only uses
  Tailwind class names, no template-literal-built style/animation strings.
  No fix.
- **Comments: WHY only, attached to what they justify:** VIOLATION. The
  top-of-file comment's first line reads "Header (06-01) -- sticky page-shell
  chrome..." — the `(06-01)` is a literal plan-ID reference, which the
  convention explicitly prohibits ("never reference a task/plan ID that will
  rot once the plan is archived"). The rest of that comment (the Code2-vs-
  GitHub rationale, referencing `06-RESEARCH.md` by name) is genuinely
  WHY-only and non-obvious — keep it, just drop the `(06-01)` tag.
</audit_findings>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md
@.planning/design/Main-Design.png
@.planning/phases/06-scaffolding/06-CONTEXT.md
@.planning/phases/06-scaffolding/06-UI-SPEC.md
@src/components/layout/Header.tsx
</context>

<interfaces>
From `app/globals.css` (already registered, no changes needed here):
- `--accent: #2dd4bf` exposed as the `text-accent` Tailwind utility class
  (already consumed once in Header.tsx for the `Compass` icon:
  `className="h-5 w-5 text-accent"`) — reuse this same utility for the new
  nav-link hover/focus classes, do not introduce a new color token.

From `src/components/ui/button.tsx` (unchanged, for reference only):
- `Button` accepts `variant`/`size`/`asChild` props via `class-variance-
  authority`; Header.tsx's existing `<Button asChild variant="outline"
  size="sm">` usage is correct and untouched by this plan.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Fix confirmed visual/design-fidelity deviations</name>
  <files>src/components/layout/Header.tsx</files>
  <action>
Re-open `.planning/design/Main-Design.png` with the Read tool and glance at
the header region once more to sanity-check the three confirmed deviations
listed in this plan's audit_findings block before editing (do not re-derive
the full audit — it is already done).

Then edit `src/components/layout/Header.tsx`:

Declare a module-level `const NAV_LINKS` array above the `Header` function,
with two entries, each an object literal with `href` ("#sandbox", "#gallery")
and `label` ("Sandbox", "Gallery") fields, typed via `as const`. Replace the
current `<nav>` element's two hardcoded `<a>` children with a single
`NAV_LINKS.map(...)` call, using `href` as the React `key`. Each rendered `<a>`
keeps `href={href}` and its text content `{label}`, and adds these new classes
on top of whatever base classes remain on the element: `transition-colors`,
`hover:text-accent`, `focus-visible:text-accent`, `focus-visible:outline-none`,
`focus-visible:ring-2`, `focus-visible:ring-accent/60`,
`focus-visible:ring-offset-2`, `focus-visible:ring-offset-background`,
`rounded-sm`. This implements 06-UI-SPEC.md's accent-reserved hover/focus-ring
state for nav links (fix #2) and simultaneously resolves the "no duplicated
JSX for near-identical instances" convention violation, since both links now
render from one source instead of two independently-maintained blocks.

Change the `<nav>` element's own `gap-6` to `gap-2` (fix #3 — 8px per
06-UI-SPEC.md's Spacing Scale "sm" token, "nav link gaps"). Keep `hidden`,
`items-center`, `text-sm`, and `sm:flex` on the `<nav>` unchanged.

Wrap the `<nav>` element and the existing `<Button>` element (with its
`asChild`/`variant="outline"`/`size="sm"` props and its inner `<a>` linking to
the GitHub repo, `Code2` icon, and "Source" label — none of that inner markup
changes) in a new `<div className="flex items-center gap-6">`. This makes the
header's outer flex container (currently `mx-auto flex h-16 max-w-6xl
items-center justify-between px-6`) have exactly two direct children — the
existing logo `<div className="flex items-center gap-2">` on the left, and
this new nav+Button wrapper on the right — so `justify-between` correctly
pushes the two groups to opposite ends instead of spreading three children
across the row (fix #1). Do not change the outer container's own classes
(`mx-auto flex h-16 max-w-6xl items-center justify-between px-6` stays exactly
as-is, including `px-6` — see audit_findings's "Noted but explicitly NOT
fixing" section for why the responsive-gutter token is intentionally left
alone).

Do not touch the logo `<div>` (Compass icon, "COLREGS"/"Navigator" spans,
"Rules 11-18" chip) or the sticky/border/background classes on `<header>` —
both are already confirmed compliant.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -c "NAV_LINKS" src/components/layout/Header.tsx && grep -c "hover:text-accent" src/components/layout/Header.tsx && test "$(grep -c 'href=\"#sandbox\"' src/components/layout/Header.tsx)" = "1"</automated>
  </verify>
  <done>
`npx tsc --noEmit` passes with no errors. `NAV_LINKS` appears in the file
(declared once, consumed via `.map()`). `hover:text-accent` appears on the
rendered nav links. `href="#sandbox"` appears exactly once in the file (inside
`NAV_LINKS`, not duplicated across two hardcoded `<a>` tags). The header's
outer flex container has exactly two direct JSX children (logo group, nav+
Button group).
  </done>
</task>

<task type="auto">
  <name>Task 2: Apply remaining Phase 7 convention fix (comment)</name>
  <files>src/components/layout/Header.tsx</files>
  <action>
Edit the top-of-file JSDoc-style comment in `src/components/layout/Header.tsx`.
Its first line currently reads "Header (06-01) -- sticky page-shell chrome
wired into app/layout.tsx." — remove the "(06-01)" plan-ID reference per the
"Comments: WHY only, attached to what they justify" convention (CLAUDE.md
Conventions section: "never reference a task/plan ID that will rot once the
plan is archived"), leaving "Header -- sticky page-shell chrome wired into
app/layout.tsx." Do not otherwise alter the rest of the comment — the
Code2-vs-Github rationale and its reference to 06-RESEARCH.md by name are both
genuinely WHY-only, non-obvious content and are explicitly allowed (citing "a
design source" is permitted by the convention). Do not touch the Server
Component rationale sentence either.

Confirm (no edit needed, just verify while the file is open) that: no raw
CSS/animation strings were introduced by Task 1, and no non-trivial derived
computation was introduced — Header.tsx should remain fully static JSX plus
the one small `NAV_LINKS` data array.
  </action>
  <verify>
    <automated>test "$(grep -c '06-01' src/components/layout/Header.tsx)" = "0" && npx tsc --noEmit</automated>
  </verify>
  <done>
The string "06-01" no longer appears anywhere in Header.tsx. The Code2-vs-
Github rationale and Server Component rationale sentences are still present
and unchanged. `npx tsc --noEmit` still passes.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Header.tsx now groups the Sandbox/Gallery nav links and the Source button
into one right-hand flex group (matching Main-Design.png/06-CONTEXT.md),
gives the nav links an accent-colored hover and focus-visible state
(matching 06-UI-SPEC.md's Color section), tightens the nav-link gap to 8px,
renders both links from one `NAV_LINKS` data source instead of two
copy-pasted blocks, and drops the stale "(06-01)" plan-ID reference from the
top-of-file comment.
  </what-built>
  <how-to-verify>
1. Run `npm run dev` and open the app in a browser at a desktop width
   (>=1024px).
2. Confirm the header shows: logo/wordmark/chip on the far left, and
   "Sandbox"/"Gallery"/"Source" clustered together on the far right (not nav
   links floating near the center).
3. Hover over "Sandbox" and "Gallery" — confirm the text turns the teal
   accent color. Tab to each link with the keyboard — confirm a visible
   accent-colored focus ring appears.
4. Narrow the viewport below 640px — confirm the nav links still disappear
   (Logo + Source button only), matching the existing D-03 mobile behavior.
5. Compare side-by-side with `.planning/design/Main-Design.png`'s header row
   — confirm no other visual regression was introduced.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any remaining issues</resume-signal>
</task>

</tasks>

<verification>
`npx tsc --noEmit` passes after both auto tasks. `git diff src/components/layout/Header.tsx` shows changes scoped only to: the nav+Button wrapper div, the `NAV_LINKS` array + `.map()`, the nav-link hover/focus classes, the `gap-2` change, and the "(06-01)" comment removal — no changes to the logo block, the Button's own props, the Source link's href/target/rel, or the `<header>` element's sticky/border/background classes.
</verification>

<success_criteria>
- Nav links + Source button visually form one group on the right of the header, matching Main-Design.png and 06-CONTEXT.md.
- Nav links have an accent hover and focus-visible state per 06-UI-SPEC.md.
- Nav links render from a single `NAV_LINKS` data source (no duplicated JSX).
- Top-of-file comment contains no plan/task ID reference.
- No other Header.tsx behavior, copy, or styling changed.
</success_criteria>

<output>
Create `.planning/quick/260718-qgs-compare-header-component-against-claude-/260718-qgs-SUMMARY.md` when done.
</output>
