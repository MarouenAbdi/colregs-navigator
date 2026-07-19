# Pitfalls Research

**Domain:** Retrofitting ESLint, refactoring an SVG pointer-drag component, codebase-wide comment cleanup, and deprecated Tailwind v4 class-name fixes — onto an existing, working, zero-lint COLREGS Navigator codebase (v1.2 Tech Debt & Stabilization milestone)
**Researched:** 2026-07-19
**Confidence:** HIGH (grounded in this repo's actual files/greps plus official ESLint and Tailwind CSS documentation, not general training-data advice)

## Critical Pitfalls

### Pitfall 1: ESLint retrofit flood leads to giving up or mass-disabling rules

**What goes wrong:**
Running `eslint --init`/adding a config to a codebase this size (dozens of `src/`/`app/` files, several hundred lines each in `ChartPanel.tsx`/`SandboxContainer.tsx` alone) for the first time typically surfaces hundreds-to-thousands of violations instantly, most of them in files nobody is touching this milestone. The two failure modes are: (a) the task stalls because "fix everything before `npm run lint` can pass" is too large to finish, or (b) someone sets broad rules to `"off"` in `eslint.config.*` (or blankets files with `/* eslint-disable */` at the top) just to get a green run, which defeats the entire purpose of adding lint for portfolio-hygiene signal — a reviewer who opens `eslint.config.*` and sees `no-unused-vars: "off"`, `@typescript-eslint/no-explicit-any: "off"`, etc. reads that as "lint was cargo-culted in, not enforced."

**Why it happens:**
Retrofitting is fundamentally different from starting a project with lint from day one — there is no way to keep the codebase in a state where every commit stays lint-clean while you incrementally introduce rules, because the entire codebase already exists and is already "done." Teams default to the two extremes above because they don't know ESLint has a built-in third option for exactly this situation.

**How to avoid:**
Use ESLint's native bulk-suppression workflow instead of disabling rules:
1. `eslint --fix` first — auto-fixable violations (spacing, unused-import removal that's safe, etc.) get resolved for free with no manual triage, shrinking the flood immediately.
2. For what's left, run `eslint --fix --suppress-all` (confirmed available in the ESLint version this project would install — `10.7.0` as of this research, well past the version that introduced this flag). This writes an `eslint-suppressions.json` file that suppresses every *currently existing* violation for rules configured as `"error"`, while still enforcing those same rules at full strength on any *new* or *changed* code from this point forward. Nothing is disabled — the rule stays on, it's just not retroactively enforced against code this milestone isn't touching.
3. Triage remaining violations by file/rule at your own pace in later phases (or defer entirely — the suppression file itself is a legitimate, visible artifact showing "we know about this debt and are paying it down incrementally," which is arguably a *stronger* portfolio signal than a suspiciously perfect first-commit lint pass).
4. Only fall back to `--suppress-rule <rule>` for one or two genuinely noisy rules if `--suppress-all` still leaves an unmanageable list — but treat this as the exception, not the default plan.

Do NOT reach for `.eslintignore`-ing entire directories or setting rules to `"warn"` project-wide as the "solution" — `"warn"` violations are explicitly *not* suppressed by `--suppress-all` (only `"error"`-level rules are), so a warn-everything config just produces permanent unaddressed noise in every future `npm run lint` run rather than a clean, tracked suppression list.

**Warning signs:**
- `eslint.config.*` accumulating `rules: { "...": "off" }` entries added during this milestone (not pre-existing/intentional ones)
- A commit message like "disable rule X, too many violations" instead of "suppress existing X violations, enforce going forward"
- `npm run lint` passing but the diff shows no `eslint-suppressions.json` and no fixed files — a suspiciously silent success on a codebase that's never been linted

**Phase to address:**
The ESLint setup phase (first phase of this milestone, before the refactor/comment phases touch files — running suppression *after* other phases start editing files would suppress violations that phase then has to un-suppress or fix anyway).

---

### Pitfall 2: SVG hit-testing regression reoccurring a third time during the ChartPanel/SandboxContainer refactor

**What goes wrong:**
This exact regression class has already hit this project twice, per `.planning/PROJECT.md`'s own Key Decisions log: (1) Phase 4 — separate invisible padded hit-shapes for hull-drag and rotate-handle never matched what the user visually saw, making drag/rotate "tricky"; (2) Phase 8 — a new non-rotating letter/role-badge overlay, added on top of the hull during the shadcn restyle, silently captured `pointerdown` because it lacked explicit `pointer-events: none`, geometrically overlapping ~45px² of the hull's painted stern silhouette at heading 0 (the app's default seed) — caught by an automated point-in-polygon check, *not* by manual visual UAT. A structural refactor of `ChartPanel.tsx` (560 lines, being broken up for this milestone) is exactly the kind of change that reintroduces this: moving the `<polygon data-testid="hull-hit-...">` / `<circle data-testid="rotate-hit-...">` JSX into a separate presentational subcomponent file, or restructuring the `<g pointerEvents="none">` wrapper around the letter/badge overlay group during extraction, can silently detach pointer handlers from the visible painted shape or drop the `pointerEvents="none"` prop in transit — with no compiler error, since both are valid JSX either way.

**Why it happens:**
The correctness of this code depends on an invariant that isn't type-checked or structurally enforced: "pointer handlers must be attached directly to the shape with the fill the user actually sees, and every purely-decorative overlay stacked on top of an interactive shape must carry `pointer-events: none`." A pure code-structure refactor (splitting a file, renaming a component, hoisting a `<g>`) can preserve visual output pixel-for-pixel while silently breaking this invariant, because JSX visually renders identically whether `onPointerDown` is on the right element or `pointerEvents="none"` survived the move — until a human actually tries to drag.

**How to avoid:**
- Treat the hull `<polygon>`, rotate-handle `<circle>`, and the `<g pointerEvents="none">` overlay wrapper as a single atomic unit during any file split — if `VesselGroup` (currently defined inline in `ChartPanel.tsx`) moves to its own file, move it as one intact block; do not separately relocate the hit-target shapes from the overlay group in different commits/passes.
- Re-run (or write, if it doesn't already exist as an automated test) the point-in-polygon overlap check that caught the Phase 8 regression — this project's own precedent shows manual visual UAT alone missed a ~45px² dead zone, so a structural refactor needs the same automated geometric check re-run against the refactored output, not just a visual smoke test.
- After the refactor, manually drag-test both vessels' hull and rotate handle at heading 0 specifically (the documented worst-case heading where the badge overlay geometrically overlaps the hull) and at a non-zero heading, not just "it renders."
- Keep `data-testid="hull-hit-{label}"` / `data-testid="rotate-hit-{label}"` stable through the refactor so existing RTL-based interaction tests (`ChartPanel.test.tsx`) continue to exercise the actual hit-target elements rather than silently querying nothing and passing by accident.

**Warning signs:**
- A refactor PR that touches `ChartPanel.tsx`'s SVG tree but has zero diff in `ChartPanel.test.tsx` or any drag-interaction test
- Any new or moved `<g>`/`<rect>`/`<circle>` element added between the hull polygon and the pointer, without an explicit `pointerEvents` prop one way or the other (implicit default is `visiblePainted`, i.e. "can capture pointer events if painted" — never leave this to default when the element is decorative)
- Extracting `VesselGroup` to a new file changes prop shapes (e.g. passing `vessel` instead of the specific fields needed) in a way that could accidentally drop `hullDrag`/`rotateDrag` handler wiring

**Phase to address:**
The ChartPanel/SandboxContainer file-structure refactor phase — this is the phase most likely to touch the hit-testing code, and should explicitly budget time for the drag/rotate manual re-verification and automated geometric regression check, not treat the refactor as "just moving code."

---

### Pitfall 3: Comment cleanup deletes substantive WHY content while removing a stale ID reference

**What goes wrong:**
The 10 flagged Phase/Plan/REQ-ID comments in this codebase are not isolated tags like `// Phase 3` sitting alone on their own line — they are IDs woven into the middle of explanatory sentences. Real examples found in this codebase:
- `src/domain/colregs/classify-encounter.ts`: *"Composes Phase 1's `relativeBearing()`/`cpa()` and Plan 01's `riskOfCollision`/`rule18Overrides()`/`vesselPriority()` functions exclusively — no new trigonometry or threshold logic is introduced here."*
- `src/domain/colregs/vessel-priority.ts`: *"...NUC and RIATM are each named as vessels that others must keep clear of, with no rule text ranking one above the other (**Phase 1's D-11**: these are legally distinct, co-equal-priority statuses, not aliases)."*
- `src/components/sandbox/hooks/useHullDrag.ts`: *"...does not persist/validate the forwarded value itself (**04-03-PLAN.md's threat model T-04-09**: the actual VesselSchema validation boundary is `SandboxContainer.applyVesselUpdate`, 04-06)."*

A blind regex pass targeting a pattern like `\(Phase \d+.*?\)` or `\bPlan \d+\b` to strip these will, in the parenthetical cases, delete the *entire parenthetical* — including the substantive claim ("these are legally distinct, co-equal-priority statuses, not aliases") that is the actual load-bearing WHY, not just the ID. In the non-parenthetical case (`classify-encounter.ts`), naive deletion of just the ID token can leave a grammatically broken fragment if the regex isn't scoped precisely to the possessive ("Phase 1's ") rather than the bare number.

**Why it happens:**
A find-and-replace or regex tool operates on text patterns, not on sentence semantics — it cannot distinguish "this ID is decorative metadata" from "this ID is the grammatical subject of a clause that also carries the actual justification." Treating this as a mechanical search-and-strip task (rather than a per-comment edit) is the natural shortcut once you've located all 10 files via `grep`.

**How to avoid:**
- Do this as a manual, per-comment edit reviewed in isolation — read the full comment block, decide what the ID reference is modifying, and rewrite the sentence to drop only the ID/pointer while preserving every substantive clause. Do not use a global regex replace across files for this pass, even a "smart" one — 10 comments across ~20 files is small enough that manual editing is both faster to get right and the only way to guarantee no WHY content is lost.
- Before committing, `git diff` every touched file and specifically re-read each edited comment as prose — does it still make a complete, standalone justification without the ID? If a sentence reads oddly or a clause has clearly gone missing, that's the signal a delete-not-edit happened.
- Note that the initial "10 found comments" count (from the ID-pattern grep used to scope this milestone) may itself be an undercount — `src/domain/colregs/vessel-priority.ts` also contains *"...intentionally match **this plan's** exact acceptance-criteria grep pattern..."*, a stale reference with no numeric ID that a strict `Phase \d+|Plan \d+|REQ-` grep pattern would miss. Re-grep more loosely (`this plan|this phase|the current phase`) before considering the sweep complete.

**Warning signs:**
- A diff where a comment shrinks by more than just the ID substring (e.g. a whole parenthetical or clause vanished)
- Post-cleanup comments that read as sentence fragments or lose their concluding clause
- Comment cleanup commits with a very high volume of changed lines relative to the small (10-comment) actual scope — suggests a mechanical bulk operation rather than careful per-file edits

**Phase to address:**
The comment-cleanup phase — should be scoped as a manual, reviewed, one-file-at-a-time pass, explicitly not a scripted/regex bulk operation, given the small (10-comment) actual size of the task.

---

### Pitfall 4: Naive Tailwind v4 class-name find-replace corrupts non-Tailwind text and ships an unverifiable visual regression

**What goes wrong:**
Per Tailwind's own v3→v4 upgrade guide (verified against official docs, HIGH confidence):
- `outline-none` → `outline-hidden` is not a synonym swap — in v4, `outline-none` is a *new, different* utility meaning "no outline at all" (`outline-style: none`), while `outline-hidden` preserves the old v3 `outline-none` behavior (an outline that's invisible by default but still appears in forced-colors/high-contrast mode for accessibility). Leaving old `outline-none` usages unchanged does not error and does not look different in a normal browser — it silently produces a real accessibility regression (no forced-colors-mode focus indicator) that will not surface in any jsdom-based test, since jsdom does not evaluate `prefers-contrast`/forced-colors media features.
- `rounded` → `rounded-sm` is one leg of a three-way rename cascade: old `rounded-sm` is now `rounded-xs`, and old bare `rounded` is now `rounded-sm`. A naive substring-based find-replace of `rounded` → `rounded-sm` across the repo, if not scoped precisely to the exact bare-word match, risks double-touching any pre-existing `rounded-sm`/`rounded-xs` usage (none currently exist in this codebase, confirmed by grep, but this is a real risk pattern for future additions or if the replace tool isn't checked against it first).
- This codebase already contains multiple concrete false-positive traps for an unscoped string replace: `src/components/hero/Hero.tsx` renders literal visible UI copy `"Grounded in "` — the substring `rounded` sits inside `Grounded`, so a plain (non-word-boundary) string replace would corrupt real, user-facing hero copy on the most visible section of the app. `src/components/gallery/GalleryPreviewChart.tsx` has a comment reading *"...rounded to clean numbers..."* — a naive replace would turn this into nonsense prose. `src/domain/geometry/bearing.ts`/`relative-bearing.ts` use the word "unrounded" in a doc comment — safe against a properly word-bounded regex, but a genuine trap for any tool doing plain substring matching without boundaries. The repo also has many *legitimate* Tailwind classes containing the `rounded` substring that must NOT be touched (`rounded-lg`, `rounded-xl`, `rounded-md`, `rounded-full`, `rounded-t-xl`, `rounded-b-xl`, etc., found across `src/components/ui/*`, `HeroPreviewCard.tsx`, `VerdictBanner.tsx`, `ReasoningTrail.tsx`, and more) — any replace not scoped to the exact bare-word token will also corrupt these.

**Why it happens:**
Both renames are one-word-vs-another string swaps that look trivially safe to script (`sed`/global find-replace across `*.tsx`), but Tailwind class names are short, common English words (`rounded`, `outline`) that also occur naturally in comments and real UI copy — and this project's own visual regression surface (Tailwind classes) is exactly the one thing this project's test suite (Vitest + jsdom + RTL) is structurally unable to verify, per this project's own documented `jsdom` limitation (no `getScreenCTM()`, and more broadly no real layout/paint engine). Green tests after a bad replace prove nothing about whether the visual result is correct.

**How to avoid:**
- Never do a plain/global string replace for either rename. Scope every match to a `className="..."`/`class="..."` (or `cn(...)`, `cva(...)` variant-config) attribute value, and require a Tailwind-class word boundary: match bare `rounded` only when it's a whole utility token (preceded by a space/quote/backtick and followed by a space/quote/backtick — i.e. NOT followed by `-` as in `rounded-lg`, and not preceded by another letter as in `Grounded`). The 6 files flagged in scoping (per `PROJECT.md`: `outline-none` in 4 files — confirmed via grep as `src/components/ui/button.tsx`, `src/components/ui/select.tsx`, `src/components/layout/Header.tsx`, `src/components/gallery/GalleryCard.tsx`; bare `rounded` in 2 files — confirmed via grep as `src/components/sandbox/SandboxContainer.tsx:221` and `src/components/sandbox/ChartPanel.tsx:437`) should be edited individually with the exact line reviewed, not via a repo-wide automated script.
- After editing, re-grep for the OLD class name across `className`/`class` attributes only, to confirm zero remaining matches in the intended scope — and separately re-grep for the exact substrings above (`Grounded`, `unrounded`, comment usages of "rounded") to confirm none of them were touched.
- Because jsdom cannot verify this, this fix requires a manual visual check in an actual browser (`npm run dev`) of every file touched — specifically Hero, Header, Gallery card, and Sandbox/ChartPanel/SandboxContainer's focus rings and corner radii — before considering the phase done. Do not rely on `npm run test`/`npm run build` passing as sufficient verification for a purely visual class-name change.
- For `outline-none`→`outline-hidden` specifically, also spot-check keyboard-focus visibility in a forced-colors/high-contrast OS mode if feasible, since that's the one behavior difference the rename exists to preserve.

**Warning signs:**
- A single commit changing many files with an identical mechanical diff pattern for this rename, with no accompanying manual verification note
- Any diff hunk inside a comment block or a JSX text node (not inside a `className`) touched by this pass
- `npm run test`/`npm run build` cited as the verification step for this specific change, with no mention of a manual browser check

**Phase to address:**
The Tailwind deprecated-class-fix phase — should be scoped to exactly the 6 flagged files, edited by hand line-by-line, with an explicit manual-browser-verification step in that phase's acceptance criteria (not covered by the automated test suite).

---

### Pitfall 5: Mechanical cleanup (autofix, formatting, refactor) drifts into an unreviewed behavior change

**What goes wrong:**
This milestone is explicitly locked as "no domain logic changes" (`.planning/PROJECT.md` Locked Decisions), but three of its four workstreams (`eslint --fix`, comment cleanup, file-structure refactor) all involve *editing files inside `src/domain/`* — the one directory this project's own architecture treats as sacrosanct (framework-free, the actual portfolio-value code). This project has already shipped one real bug from exactly this kind of drift: Phase 2's code review caught an initial `classifyEncounter()` implementation that applied Rule 18's vessel-type hierarchy uniformly to both crossing AND overtaking encounters, when Rule 13(a) requires overtaking to override Rule 18 entirely ("notwithstanding anything contained in Rules 4 to 18") — a subtle, easy-to-miss precedence bug in exactly the kind of code that gets casually "touched" during a lint/format/refactor pass. Separately, `vessel-priority.ts` contains an intentional, non-default formatting choice — single-quoted string literals instead of the codebase's usual double quotes, "to intentionally match [a] plan's exact acceptance-criteria grep pattern" — that a blanket `eslint --fix` with a `quotes` rule configured to the codebase default would silently flip back to double quotes, undoing a deliberate (if now-obscure) choice without anyone noticing, since the file still compiles and passes tests either way.

**Why it happens:**
`eslint --fix` and IDE "format on save" don't distinguish "safe, purely stylistic fix" from "fix that changes runtime behavior at an edge case" (e.g. `eqeqeq` autofix on a comparison that relied on loose-equality coercion, `prefer-const` on a variable that's conditionally reassigned only on one rare branch). On a rules-engine codebase where correctness depends on getting boundary conditions exactly right (Rule 13 vs. Rule 18 precedence, near-head-on-boundary doubt resolution), even a "safe" autofix category deserves a second look before it's trusted blindly across `src/domain/`.

**How to avoid:**
- Run `eslint --fix` in two passes: apply it everywhere EXCEPT `src/domain/`, review that broad diff quickly (it's genuinely low-risk outside the domain layer), then run it against `src/domain/` in isolation and manually review every changed line in that smaller diff before committing — treat `src/domain/` autofixes as requiring the same scrutiny as a hand-written domain change would.
- Before/after any autofix or refactor pass touching `src/domain/colregs/` or `src/domain/geometry/`, run the full existing test suite (`npm run test`) and specifically confirm the Rule-13-overtaking-overrides-Rule-18 regression test (added after the Phase 2 fix) still passes and wasn't itself "cleaned up" away.
- When configuring the `quotes` ESLint rule (or any stylistic rule), grep for known intentional exceptions first (the single-quote block in `vessel-priority.ts`) and either scope an `eslint-disable` comment there or accept/re-verify the change deliberately rather than letting a blanket autofix silently overwrite it.

**Warning signs:**
- An `eslint --fix` diff touching `src/domain/` that the reviewer approves without reading line-by-line, on the assumption "autofix is always safe"
- Any diff in `vessel-priority.ts` that flips single quotes to double quotes without an explicit note about the intentional exception
- A refactor/cleanup PR with no test-suite run recorded in its verification notes

**Phase to address:**
Cross-cutting — applies to both the ESLint setup phase (when `eslint --fix` first runs across the whole repo) and the file-structure refactor phase (if any refactor touches domain files, which it shouldn't given the milestone scope is Sandbox/component files, but should be explicitly guarded against).

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| `eslint --suppress-all` on first adoption | Unblocks `npm run lint` immediately without fixing hundreds of pre-existing violations | Suppressed violations can linger indefinitely if no follow-up triage phase is ever scheduled | Always acceptable as the adoption mechanism itself — just pair it with a visible `eslint-suppressions.json` in the repo (a real, trackable artifact) rather than silently disabling rules |
| Setting noisy rules to `"warn"` instead of `"error"` during rollout | Keeps `npm run lint` exit code green while surfacing issues in output | `"warn"`-level violations are NOT covered by `--suppress-all`/bulk suppression, so they accumulate as permanent unaddressed noise in every future run, training people to ignore lint output entirely | Only for rules you genuinely intend to fix soon (days, not indefinitely) — never as a permanent parking spot for a rule the team doesn't want to enforce |
| Global regex/`sed` pass for the comment cleanup or Tailwind class rename | Fast, touches all files in one command | Silently corrupts embedded WHY prose or non-Tailwind text (see Pitfalls 3 and 4) with no compiler error to catch it | Never acceptable for either of these two specific tasks in this milestone, given the small (10-comment, 6-file) actual scope — manual editing is both safer and not meaningfully slower here |
| Skipping the manual browser check after the Tailwind class-name fix because `npm run test`/`build` pass | Saves a few minutes | Ships a silent visual/accessibility regression that no automated test in this stack (jsdom-based) can detect | Never acceptable for this specific change — always acceptable to skip manual browser verification for changes with jsdom-testable behavior (e.g. most domain logic) |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| ESLint + Next.js 16 / TypeScript 7 / typescript-eslint | Assuming `eslint-config-next` (currently `16.2.10`, matching this project's Next.js version) and `typescript-eslint` (currently `8.64.0`) both fully support ESLint's flat-config format (`eslint.config.*`) out of the box without checking version-specific setup docs, since this project has never had any ESLint config to migrate from | Verify the exact flat-config setup for both packages against their current docs at install time (via Context7/official docs) rather than assuming a `.eslintrc.json`-era tutorial applies — flat config is the ESLint 9+/10+ default and the config shape differs meaningfully from legacy config |
| ESLint `--fix` + Prettier (if added later) | Running an ESLint stylistic rule's autofix (quotes, spacing) without checking whether it conflicts with an existing formatter convention already established in the codebase (e.g. `vessel-priority.ts`'s intentional single-quote exception) | Grep for known intentional formatting exceptions before enabling any stylistic autofix rule broadly (see Pitfall 5) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Running full-repo `eslint` (no cache) on every save in the editor | Slow editor feedback, developers start ignoring/disabling the editor's ESLint integration out of impatience | Enable ESLint's built-in cache (`--cache`) for local/editor runs; keep `npm run lint` as the authoritative uncached CI-equivalent check | Noticeable once the ruleset + file count grows past what this small-to-medium codebase currently has — worth setting up now since a local `npm run lint` script is this milestone's only lint entry point (no CI yet) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Treating `outline-none`→`outline-hidden` as a pure find-replace with no accessibility check | Users relying on OS forced-colors/high-contrast mode lose the visible focus indicator on interactive elements (buttons, links, form controls) it existed to preserve — a silent accessibility regression | Manually confirm, per Tailwind's own documented distinction, that the replacement target is `outline-hidden` (preserves old accessible-but-invisible-until-forced-colors behavior) and not new v4 `outline-none` (a different, harder outline removal) |
| Assuming "tests pass" means "no visual regression" for any Tailwind class-name change | A corrupted class name or accidentally-touched comment/UI-copy string ships to production undetected, since jsdom has no layout/paint engine to catch it | Manual browser verification (`npm run dev`) of every touched file's rendered output is a required step for this milestone's Tailwind-fix phase, not optional |

## "Looks Done But Isn't" Checklist

- [ ] **`npm run lint` passing:** Often "passing" because rules were set to `"off"` or `"warn"` during this milestone rather than genuinely resolved or properly suppressed — verify by reading the full `eslint.config.*` diff and confirming `eslint-suppressions.json` (not blanket rule disables) is the mechanism used for any deferred violations
- [ ] **Tailwind class-name fix:** Often verified only by `npm run test`/`npm run build` passing — verify by actually opening the app in a browser and visually comparing Hero, Header, Gallery card, and Sandbox focus rings/corner radii against the pre-fix state
- [ ] **ChartPanel/SandboxContainer refactor:** Often verified only by the file compiling and existing tests passing — verify by manually dragging both vessels' hulls and rotate handles at heading 0 (the documented worst-case badge-overlap heading) and confirming no dead zones, not just that `data-testid` queries still resolve
- [ ] **Comment cleanup:** Often "done" once a grep for `Phase \d+|Plan \d+|REQ-` returns zero matches — verify by re-reading every edited comment as prose to confirm no substantive WHY clause was deleted alongside the ID, and re-grep loosely (`this plan|this phase`) to catch non-numeric stale references the strict pattern missed

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| ESLint flood led to mass rule-disabling | LOW | Re-enable disabled rules, run `eslint --fix --suppress-all` instead to generate a proper suppression file; no code changes needed, purely a config-file fix |
| SVG hit-testing regression reintroduced during refactor | MEDIUM | Re-apply the same two structural fixes already proven in this project's history: attach pointer handlers directly to the visible painted shape, and add explicit `pointerEvents="none"` to any decorative overlay group stacked on top of it; re-run/add the point-in-polygon overlap check as a permanent regression test so a third occurrence is caught automatically next time |
| Comment cleanup deleted substantive WHY content | LOW–MEDIUM | `git diff`/`git blame` the affected comment's prior version and manually restore the deleted clause while still removing the stale ID — recoverable via git history as long as the bad commit hasn't been squashed away |
| Tailwind naive replace corrupted UI copy or a comment | LOW | `git diff` review catches this immediately if done before commit; if already committed, revert just the corrupted lines using `git blame`/prior commit content, then redo the intended class-name fix scoped correctly |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| ESLint flood → mass-disable | ESLint setup phase (first phase, before others edit files) | `eslint.config.*` diff shows no new `"off"` entries added this milestone; `eslint-suppressions.json` present and reviewed if used |
| SVG hit-testing regression (3rd occurrence) | ChartPanel/SandboxContainer refactor phase | Manual drag/rotate test at heading 0 for both vessels; automated point-in-polygon overlap check re-run/added as a regression test |
| Comment cleanup deletes WHY content | Comment-cleanup phase | Per-file `git diff` review confirming every edited comment still reads as a complete, standalone justification |
| Tailwind naive replace corrupts non-Tailwind text / ships unverifiable visual regression | Tailwind deprecated-class-fix phase | Manual browser check of all 6 flagged files' rendered output; re-grep confirms only `className`/`class` attribute occurrences were touched |
| Autofix/refactor drifts into unreviewed domain-logic or intentional-formatting change | ESLint setup phase AND refactor phase (cross-cutting) | Full test suite green after any `src/domain/` autofix, with the Rule-13-overrides-Rule-18 regression test specifically confirmed still present and passing; `vessel-priority.ts` single-quote exception confirmed unchanged |

## Sources

- `.planning/PROJECT.md` — this project's own Key Decisions log, primary source for both documented hit-testing regressions (Phase 4, Phase 8) and the Phase 2 Rule 13/Rule 18 precedence bug
- `src/components/sandbox/ChartPanel.tsx`, `src/components/sandbox/hooks/useHullDrag.ts` — read directly to confirm current hit-testing structure and locate real embedded stale-ID comment examples
- `src/domain/colregs/classify-encounter.ts`, `src/domain/colregs/vessel-priority.ts` — read directly to confirm real embedded WHY-content-adjacent-to-ID comment examples
- `src/components/hero/Hero.tsx`, `src/components/gallery/GalleryPreviewChart.tsx`, `src/domain/geometry/bearing.ts` — grepped directly to confirm real "rounded"-substring false-positive examples (`"Grounded in "` UI copy, "rounded to clean numbers" comment, "unrounded" word), plus a broad grep of `src/components/ui/*`/`HeroPreviewCard.tsx`/`VerdictBanner.tsx`/`ReasoningTrail.tsx` confirming many legitimate `rounded-*` classes that a naive replace would also corrupt
- Context7 `/eslint/eslint` (HIGH reputation) — `--fix --suppress-all` / `eslint-suppressions.json` bulk-suppression workflow, confirmed as an official, current ESLint CLI feature (docs: `docs/src/use/suppressions.md`, `docs/src/use/command-line-interface.md`)
- `npm view eslint version` / `npm view typescript-eslint version` / `npm view eslint-config-next version` — live registry versions (`eslint@10.7.0`, `typescript-eslint@8.64.0`, `eslint-config-next@16.2.10`) confirmed at research time, HIGH confidence (not training data)
- Tailwind CSS official upgrade guide (`https://tailwindcss.com/docs/upgrade-guide`, fetched directly) — HIGH confidence source for the `outline-none`→`outline-hidden` semantic-difference caveat and the `rounded`/`rounded-sm`/`rounded-xs` three-way rename cascade

---
*Pitfalls research for: ESLint retrofit, SVG pointer-drag refactor, comment cleanup, Tailwind v4 deprecated class fixes (COLREGS Navigator v1.2 Tech Debt & Stabilization)*
*Researched: 2026-07-19*
