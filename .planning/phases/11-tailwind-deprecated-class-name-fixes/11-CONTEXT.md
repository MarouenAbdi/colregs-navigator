# Phase 11: Tailwind Deprecated Class-Name Fixes - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace known deprecated Tailwind v3 class-name usages with their Tailwind v4 canonical
equivalents, with no visual or accessibility regression:

1. `outline-none` → `outline-hidden` in `button.tsx`, `select.tsx`, `Header.tsx`, `GalleryCard.tsx`.
2. Bare `rounded` → `rounded-sm` in `SandboxContainer.tsx` and `ChartPanel.tsx`.
3. Fixes applied by hand, file-by-file, scoped to actual Tailwind `className` usages only —
   not a blanket find-replace (known false-positive traps: `"Grounded in "` UI copy in Hero,
   `"rounded to clean numbers"` code comment in `GalleryPreviewChart.tsx`).
4. Human confirms in a real browser: no visual or keyboard-focus-outline regression across
   Hero, Header, Gallery, Sandbox.

No new capabilities. `classifyEncounter()` and all COLREGS rule outputs stay untouched (this
phase touches only presentation-layer class names).

</domain>

<decisions>
## Implementation Decisions

### Radius fix (rounded → rounded-sm)

- **D-01:** `ChartPanel.tsx` and `SandboxContainer.tsx` currently use `rounded-[0.25rem]` (an
  arbitrary-value pin, restored twice during Phase 10 after `eslint --fix` silently collapsed
  it to `rounded-lg`). TWFX-02 resolves as: rename both to `rounded-sm`, the actual canonical
  Tailwind v4 class name — even though this project's theme derives `--radius-sm` as
  `calc(var(--radius) * 0.6)` = `0.375rem` (with `--radius: 0.625rem` in `app/globals.css`),
  not Tailwind's stock `0.25rem`. This is a deliberate, accepted 1.5x visual radius increase
  (0.25rem → 0.375rem) on these two elements, not a bug to work around.
- **D-02:** If the manual browser check (TWFX-04) shows the larger radius looks visually worse
  on Sandbox, **do not roll back**. Accept it — canonical class-name correctness wins over the
  pixel-exact match Phase 10 was protecting. v1.2 is a tech-debt/hygiene milestone; a radius
  bump on two low-emphasis chart/container elements is acceptable design drift here, not a
  blocking regression. (This reverses Phase 10's CR-01 stance, which prioritized pixel-identical
  preservation — that was explicitly deferred to this phase for a reason: TWFX-02 is where the
  deliberate class-name change was always meant to happen.)
- **D-03:** Once `rounded-[0.25rem]` no longer appears anywhere in the codebase, remove the now-dead
  `eslint.config.mjs` ignore pattern that was protecting it:
  `"better-tailwindcss/enforce-canonical-classes": ["warn", { ignore: ["^rounded-\\[0\\.25rem\\]$"] }]`
  (plus its adjacent explanatory comment). Do this as part of this phase's scope — stale config
  for a value that no longer exists would confuse a future reader.

### outline-hidden a11y check depth

- **D-04:** The `outline-none` → `outline-hidden` swap is mechanical and low-risk at all 4 sites
  — each already pairs it with an existing `focus-visible:ring-*`/`focus-visible:border-ring`
  treatment. Verification depth: a **normal-browser focus-ring check only** (tab through each
  component, confirm the existing focus indicator still renders). Do **not** add an explicit
  forced-colors/high-contrast-mode check — that's `outline-hidden`'s underlying a11y rationale,
  but verifying it is out of scope for this phase's TWFX-04 acceptance criterion, which asks
  only for standard visual/keyboard-focus regression confirmation.

### TWFX-04 verification method

- **D-05:** No Claude-in-Chrome automated pre-check (screenshots/focus-ring inspection) before
  handoff. Go straight to the user's own manual real-browser walkthrough across Hero, Header,
  Gallery, Sandbox — TWFX-04 already requires human confirmation; an automated pre-check would
  duplicate rather than add value here.

### Claude's Discretion

None flagged — all three areas resolved with explicit user decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` (TWFX-01 through TWFX-04, lines ~23–26, ~82–85) — the locked
  requirement text this phase must satisfy.
- `.planning/ROADMAP.md` (Phase 11 section) — success criteria, depends-on (Phase 10), canonical
  file list.

### Phase 10 history — directly relevant precedent
- `.planning/phases/10-eslint-setup-lint-clean-baseline/10-REVIEW.md` (CR-01 section) —
  documents that `eslint --fix`'s `enforce-canonical-classes` autofix previously silently
  re-collapsed a manually-restored `rounded-[0.25rem]` to `rounded-lg` (resolving to a *third*,
  worse value, 2.5x the original). Read this before running any `eslint --fix` in this phase's
  scope — do not let an autofix pass silently override the deliberate `rounded-sm` rename.
- `.planning/phases/10-eslint-setup-lint-clean-baseline/10-03-SUMMARY.md` — documents
  `eslint-suppressions.json` as the debt ledger; `GalleryCard.tsx`, `SandboxContainer.tsx`, and
  `ChartPanel.tsx` currently carry `local/no-stale-id-comments` suppression entries (2, 4, and
  10 respectively) — expected to shrink naturally as these exact files are touched by this
  phase (not a separate cleanup task, but don't be surprised if lint flags stale-ID comments in
  these files once you're editing them).
- `eslint.config.mjs` (lines ~40–57) — the `better-tailwindcss` plugin config, including the
  `enforce-canonical-classes` ignore pattern this phase is expected to remove (D-03).

### Theme/design tokens
- `app/globals.css` (lines 42–48 `--radius-sm`/`-md`/`-lg`/`-xl`/`-2xl`/`-3xl`/`-4xl`; line 97
  `--radius: 0.625rem`) — the theme's radius scale. `--radius-sm` = `calc(var(--radius) * 0.6)`
  = `0.375rem`. No `--radius-xs` token exists (confirmed no other component in the codebase
  currently uses `rounded-sm` or `rounded-xs`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Exact current state of the 6 flagged files (confirmed via grep, 2026-07-19)
- `src/components/ui/button.tsx:11` — `outline-none` (bare, not `focus-visible:outline-none`)
- `src/components/ui/select.tsx:48` — `outline-none` (bare)
- `src/components/layout/Header.tsx:78` — `focus-visible:outline-none`
- `src/components/gallery/GalleryCard.tsx:51` — `focus-visible:outline-none`
- `src/components/sandbox/SandboxContainer.tsx:230` — `rounded-[0.25rem]` (not bare `rounded`;
  Phase 10's CR-01 already migrated the bare form to this arbitrary value)
- `src/components/sandbox/ChartPanel.tsx:446` — `rounded-[0.25rem]` (same)

### False-positive traps confirmed present (do not touch)
- `src/components/gallery/GalleryPreviewChart.tsx:19` — code comment: `"rounded to clean
  numbers"` (not a Tailwind class).
- Hero copy containing "Grounded in" (per ROADMAP/REQUIREMENTS note — verify at edit time).

### Reusable patterns
- Every `outline-none`/`focus-visible:outline-none` site already has an adjacent
  `focus-visible:ring-*` (and in Header's case `focus-visible:ring-offset-*`) treatment — the
  swap to `outline-hidden` is additive-safe, not a behavior change to the focus-visible ring
  itself.
- `npx eslint <file>` currently reports zero errors/warnings on all 4 `outline-none` files and
  both `rounded-[0.25rem]` files — `better-tailwindcss` plugin is not currently flagging any of
  these 6 files (the ignore pattern for `rounded-[0.25rem]` and the fact that `outline-none`
  hasn't yet been reclassified by the plugin as deprecated in this config are both relevant;
  don't assume `npm run lint` alone will surface these — they're being fixed proactively per
  the roadmap's explicit file list, not reactively from lint output).

</code_context>

<specifics>
## Specific Ideas

No additional specific requirements beyond the ROADMAP.md success criteria and the decisions
above — user confirmed the literal canonical-rename approach for both class-name migrations,
with acceptance of the resulting radius size change.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-Tailwind Deprecated Class-Name Fixes*
*Context gathered: 2026-07-19*
