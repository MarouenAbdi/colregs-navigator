---
phase: 10-eslint-setup-lint-clean-baseline
reviewed: 2026-07-19T00:00:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - .editorconfig
  - README.md
  - app/layout.tsx
  - app/s/[shareId]/page.tsx
  - eslint-rules/no-stale-id-comments.mjs
  - eslint-suppressions.json
  - eslint.config.mjs
  - package.json
  - src/components/gallery/GalleryCard.tsx
  - src/components/gallery/GalleryContainer.tsx
  - src/components/gallery/GalleryPreviewChart.tsx
  - src/components/hero/Hero.tsx
  - src/components/hero/HeroPreviewCard.tsx
  - src/components/layout/Footer.tsx
  - src/components/layout/Header.tsx
  - src/components/sandbox/ChartPanel.tsx
  - src/components/sandbox/ControlPanel.tsx
  - src/components/sandbox/InstrumentReadouts.tsx
  - src/components/sandbox/ReasoningTrail.tsx
  - src/components/sandbox/SandboxContainer.tsx
  - src/components/sandbox/VerdictBanner.tsx
  - src/components/shared/SectionGridBackground.tsx
  - src/components/ui/badge.tsx
  - src/components/ui/button.tsx
  - src/components/ui/card.tsx
  - src/components/ui/label.tsx
  - src/components/ui/select.tsx
  - src/components/ui/slider.tsx
  - vitest.setup.ts
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-07-19T00:00:00Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

This phase retrofitted ESLint onto a previously zero-lint-tooling codebase and reached a
"lint-clean" baseline via `eslint --fix` + `eslint --fix --suppress-all`. I verified `npm run
lint` currently reports 0 errors, confirmed the vast majority of the `.tsx` diff is genuinely
inert Tailwind-class reformatting/shorthand-collapsing (`enforce-canonical-classes`,
`enforce-consistent-line-wrapping`), and hand-computed/compiled the actual Tailwind CSS output
for this project's customized `--radius` theme tokens to check the one class of "safe" autofix
the task flagged as highest-risk: class *renames* (not just reordering).

That check surfaced a real, provable visual regression (CR-01 below): the
`better-tailwindcss/no-deprecated-classes` autofix blindly renamed bare `rounded` →
`rounded-sm` in two files, but this project's shadcn-style theme customizes `--radius`/
`--radius-sm` such that the two classes compile to different border-radius values here
(0.25rem vs 0.375rem) — a silent, unreviewed visual change shipped as part of "lint-clean"
work.

I also stress-tested the new custom `local/no-stale-id-comments` rule against the actual
codebase content (not just its own doc comment) and found it has a real coverage gap: it
does not catch the single most common form of "rotting pointer" already present throughout
this codebase (`NN-XXX-SPEC.md` / `NN-RESEARCH.md` / `NN-HUMAN-UAT.md` style doc-filename
references), despite the feature's own README description claiming it "catches rotting
pointers ... repo-wide" (CR-02).

Beyond those two, I found four warning-level issues (unused Babel preset dependencies, an
inconsistent glob-completeness bug in the domain-boundary rule that the same config block
explicitly fixed for its Next.js sibling but not its Prisma sibling, a missing
`generated/**` ignore causing noisy lint output, and an overstated guarantee in
README.md about what the suppression file actually enforces) and two minor info-level notes.

## Critical Issues

### CR-01: `eslint --fix` autofix silently changed border-radius (bare `rounded` → `rounded-sm`) because this project's theme customizes the radius scale

**File:** `src/components/sandbox/ChartPanel.tsx:446`
**File:** `src/components/sandbox/SandboxContainer.tsx:231`

**Issue:** The diff from `48c105d` shows both files had a bare `rounded` class renamed to
`rounded-sm` by the lint-clean autofix pass:

```diff
- className="bg-chart-surface border border-border rounded"
+ className="rounded-sm border border-border bg-chart-surface"
```
```diff
- <div className="rounded border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
+ <div className="rounded-sm border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
```

This rename comes from `eslint-plugin-better-tailwindcss`'s `no-deprecated-classes` rule
(`node_modules/eslint-plugin-better-tailwindcss/lib/rules/no-deprecated-classes.js:31`),
which hardcodes `[/^rounded$/, "rounded-sm"]` as a Tailwind v4 migration alias — a blind
regex substitution with **no awareness of this project's actual theme**.

This project (`app/globals.css`) follows the shadcn convention of overriding `--radius` at
`:root` (line 97, unlayered) and deriving `--radius-sm`/`--radius-md`/`--radius-lg`/etc. from
it inside `@theme inline` (lines 42-48: `--radius-sm: calc(var(--radius) * 0.6)`). I compiled
this exact theme against real Tailwind CSS v4.3.3 (via `@tailwindcss/cli`, the version pinned
in this project's own `package.json`) to get the actual resolved values:

```css
.rounded    { border-radius: 0.25rem; }                 /* Tailwind's hardcoded literal default -- untouched by this project's --radius override */
.rounded-sm { border-radius: calc(var(--radius) * 0.6); }  /* = 0.625rem * 0.6 = 0.375rem in THIS project */
.rounded-lg { border-radius: var(--radius); }              /* = 0.625rem -- what "rounded" conceptually meant pre-fix */
```

`rounded` and `rounded-sm` are **not equivalent in this codebase** (0.25rem vs 0.375rem — a
50% larger corner radius). The autofix silently changed the corner radius of the Sandbox
chart panel's SVG border and the saved-scenario info banner from 4px to 6px, with no visual
review, as an unreviewed side effect of "reaching lint-clean."

**Fix:** Do not accept this autofix as-is. Either:
1. Restore the prior visual exactly with an explicit value: `rounded-[0.25rem]` (keeps
   pixel-identical output, but reintroduces the underlying "deprecated bare `rounded`"
   lint error unless paired with an inline suppression comment explaining why), or
2. Deliberately adopt `rounded-sm`'s new 0.375rem value as a conscious design decision after
   visually comparing both radii in the running app, and note the decision in a comment (per
   this repo's own "comments: WHY only" convention) so a future reader doesn't mistake it for
   another blind autofix.

Either way, this needs an actual visual check before merging, not a rubber-stamp of the
autofix output. Any other bare `rounded` classes elsewhere in the repo (outside this phase's
touched-file list) that this same rule may already have silently rewritten should also be
audited.

### CR-02: Custom `local/no-stale-id-comments` rule fails to catch the most common stale-doc-reference pattern already in this codebase

**File:** `eslint-rules/no-stale-id-comments.mjs:15`
**File:** `src/components/sandbox/ControlPanel.tsx:103` (clean, unmitigated example)

**Issue:** `README.md:51-53` claims this rule "catches rotting pointers like `Phase 3` or
`04-01` in comments, repo-wide." I tested the actual regex
(`STALE_ID_PATTERN`) against real strings pulled from this codebase's own comments:

```js
STALE_ID_PATTERN.test("references 08-UI-SPEC.md Layout section")   // false
STALE_ID_PATTERN.test("04-HUMAN-UAT.md Gap 1 follow-up")            // false
STALE_ID_PATTERN.test("per 09-RESEARCH.md Pattern 1")               // false
STALE_ID_PATTERN.test("matching the design's 09-UI-SPEC.md ...")    // false
```

The regex only recognizes the literal `-PLAN.md` suffix
(`\d{2}(\.\d+)?-\d{2}-PLAN\.md`) — it has no branch that matches the far more common
`NN-XXXX-SPEC.md` / `NN-RESEARCH.md` / `NN-HUMAN-UAT.md` doc-filename shape, even though
these are exactly the same "rotting pointer" class the rule exists to prevent (a phase
artifact filename that goes stale the moment the phase folder is archived).

This isn't hypothetical: `src/components/sandbox/ControlPanel.tsx:103` contains
`per 08-UI-SPEC.md's Color section` in a comment with no other stale-ID token nearby — and
`ControlPanel.tsx` has **zero entries** in `eslint-suppressions.json`. This reference is
neither flagged as an error nor recorded as suppressed debt; it's simply invisible to the
tool. A repo-wide scan of the reviewed files turned up 27 more occurrences of
`UI-SPEC.md`/`RESEARCH.md`/`HUMAN-UAT.md` across `GalleryCard.tsx`, `GalleryContainer.tsx`,
`GalleryPreviewChart.tsx`, `ChartPanel.tsx`, `VerdictBanner.tsx`, and others — most happen to
be co-located with an already-matching token (e.g. `GAL-01`) and so get suppressed
incidentally, masking how large the actual blind spot is.

**Fix:** Add a branch that matches bare `NN(.N)?-<word-chars>.md` doc-filename references,
not just the `-PLAN.md` suffix, e.g.:

```js
const STALE_ID_PATTERN =
  /\b(Phase\s+\d+|Plan\s+\d+|REQ-[A-Z]+-\d+|[A-Z]{2,6}-\d{2,3}|\d{2}(\.\d+)?-[A-Za-z][\w-]*\.md|this\s+(phase|plan))\b|\d{2}(\.\d+)?-\d{2}(?=\s*[),])/i;
```

Then re-run `eslint --fix --suppress-all` to regenerate `eslint-suppressions.json` with the
now-correctly-detected debt, and confirm the count of newly-caught violations is reasonable
before committing the wider suppression list.

## Warnings

### WR-01: Unused Babel preset dependencies added to `package.json`

**File:** `package.json:40-41`
**Issue:** `@babel/preset-react` and `@babel/preset-typescript` were added as
devDependencies in this phase but are never referenced anywhere in the codebase (no
`babel.config.js`/`.babelrc`, and `eslint.config.mjs` doesn't use them either). The
`eslint.config.mjs` comment (lines 25-29) explicitly documents *why*: `@babel/eslint-parser`
reads `babelOptions.parserOpts.plugins` directly and "never applies `babelOptions.presets`,"
so these two preset packages are dead weight — installed, but structurally unreachable by
this project's own babel config path. This contradicts CLAUDE.md's "justify every
abstraction and dependency" persona.
**Fix:** Remove `@babel/preset-react` and `@babel/preset-typescript` from
`package.json` devDependencies (and `package-lock.json`) unless a concrete future use is
already planned; `@babel/core` and `@babel/eslint-parser` are sufficient for the current
`parserOpts.plugins: ["typescript", "jsx"]` setup.

### WR-02: Domain-boundary Prisma import restriction is missing the deep-subpath glob that the adjacent Next.js restriction explicitly added for itself

**File:** `eslint.config.mjs:76-93`
**Issue:** The Next.js pattern in this same `no-restricted-imports` config block was
deliberately widened to `["next", "next/*", "next/**"]` with a comment explaining why:
"A bare `next/*` glob only matches one path segment past `next/`... `next/**` is required
too, so deeper subpaths like `next/font/google` are also caught." The very next pattern in
the same array, for Prisma, was not given the same treatment:

```js
group: ["@prisma/*", "prisma", "prisma/*"],
```

This only catches one-level-deep imports (e.g. `@prisma/client`), not deeper subpaths like
`@prisma/client/runtime/library` or `@prisma/adapter-pg/dist/index`. Since this rule is
CLAUDE.md's "hard rule to enforce" architecture boundary (`src/domain/` must never import
Prisma), a deep Prisma subpath import from `src/domain/` would currently slip through
undetected — the exact failure mode the Next.js pattern was fixed to avoid two lines above it
in the same file. No current `src/domain/` file does this (verified via grep), so this is a
latent gap, not an active violation.
**Fix:** Add `@prisma/**` to the group, mirroring the Next.js pattern:
```js
group: ["@prisma/*", "@prisma/**", "prisma", "prisma/*", "prisma/**"],
```

### WR-03: `eslint.config.mjs`'s `globalIgnores` doesn't exclude the generated Prisma client, causing noisy lint output

**File:** `eslint.config.mjs:139`
**Issue:** `globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"])` doesn't
include the `generated/` directory (Prisma's generated client output, listed in
`.gitignore:7-8` but present on disk after `prisma generate`). Running `npm run lint` lints
these auto-generated, non-source files and reports:
```
generated/prisma/browser.ts
  3:1  warning  Unused eslint-disable directive (no problems were reported)
```
across 9 generated files, every run, for code nobody edits and that shouldn't be linted.
**Fix:** Add `"generated/**"` to `globalIgnores`, mirroring `.gitignore`'s own exclusion.

### WR-04: README.md overstates what the suppression mechanism actually guarantees

**File:** `README.md:64-67`
**Issue:** "Every suppressed rule stays fully enforced (at `\"error\"`) against any new or
changed code" is not quite accurate given how ESLint's suppressions feature actually works:
`eslint-suppressions.json` tracks a **count** per file+rule, not a fingerprint/location per
violation. If a file with an existing suppressed count for a rule has one pre-existing
violation fixed and one new violation introduced elsewhere in the same file (net count
unchanged), the new violation would not surface as an error — it would silently ride under
the existing suppression budget. This is an inherent characteristic of the feature (not
something this phase's author could avoid while using ESLint's own suppress-all mechanism),
but the README's wording promises a stronger guarantee than the tool provides.
**Fix:** Soften the claim, e.g.: "Suppressed counts are tracked per file+rule; a new
violation in an already-suppressed file+rule combination can only be caught if it pushes the
count above the previously recorded number — reducing violation count elsewhere in the same
file can mask a new one." Optionally, periodically run `eslint --prune-suppressions`-style
audits (or an equivalent CI check comparing counts against a freshly-generated baseline) to
catch drift.

## Info

### IN-01: Hardcoded "Rule 15" badge text in the Hero preview card doesn't derive from the classification result

**File:** `src/components/hero/HeroPreviewCard.tsx:259`
**Issue:** Every other rule-badge in this codebase (`VerdictBanner.tsx`'s
`bannerRuleBadge()`, `GalleryCard.tsx`'s verdict derivation) computes the displayed rule
number from `classification`/`ruleNumber(entry.ruleId)`. `HeroPreviewCard.tsx` instead
hardcodes the literal text `Rule 15` in JSX, relying on the fixed fixture always classifying
as a Rule-15 crossing encounter. Not a live bug today (the fixture is fixed and tested), but
if `hero-preview-fixture.ts` is ever edited to a different encounter type, this badge would
silently go stale (unlike every sibling verdict badge, which can't).
**Fix:** Derive the badge text the same way `VerdictBanner.tsx` does, e.g. via
`ruleNumber(...)` against the classifying trail entry, so the fixture and the badge can never
drift independently.

### IN-02: Raw-CSS `no-restricted-syntax` selector for `style={{...}}` uses a broad bare `:`/`;` alternation

**File:** `eslint.config.mjs:126`
**Issue:** The first `no-restricted-syntax` selector's content gate
(`TemplateElement[value.raw=/background-image|animation|gradient|:|;/]`) includes bare `:`
and `;` as stand-alone alternatives. Scoped only to `style={...}` attributes, so it currently
has no false positives (no template-literal `style` values in this codebase contain a colon
or semicolon today), but it's a latent trap: a future legitimate single-CSS-custom-property
value that happens to contain a colon (e.g. a formatted time string or ratio) would trip this
rule even though it's exactly the sanctioned pattern the rule's own comment says should never
be flagged.
**Fix:** Not urgent; if it starts producing false positives, tighten the gate to require an
actual property-like shape (e.g. `\w+\s*:` or a real semicolon-separated declaration) rather
than any bare `:`/`;`.

## Resolution

Both critical findings and the four warnings were addressed. CR-01's first fix attempt
(commit `64a3944`) was itself silently undone before phase completion — documented below,
since this is directly relevant to trusting any future "restored the original value" claim
against this plugin.

- **CR-01**: First attempt restored `ChartPanel.tsx`/`SandboxContainer.tsx` to
  `rounded-[0.25rem]` (exact pixel-identical prior radius) in commit `64a3944`. The
  immediately-following `eslint --fix --suppress-all` run (done in the same commit, to absorb
  CR-02's newly-detected violations) silently re-collapsed `rounded-[0.25rem]` to `rounded-lg`
  via `enforce-canonical-classes`' own autofix — which resolves to `var(--radius)` = 0.625rem
  in this project's theme, a *third*, worse, unreviewed value (2.5x the true original, versus
  the original bug's 1.5x). Phase-goal verification caught this by diffing the actual shipped
  code against the commit message's claim, not by trusting the SUMMARY/commit text. Fixed
  properly by (a) restoring `rounded-[0.25rem]` again in both files, and (b) adding a scoped
  `ignore` pattern to the `enforce-canonical-classes` rule config in `eslint.config.mjs` for
  this exact value, so a future `eslint --fix` run cannot silently repeat this — verified by
  running `npm run lint` (no `--fix`) afterward and confirming no warning/error on either line.
  The deliberate `rounded`→`rounded-sm` class-name change is still deferred to Phase 11
  (Tailwind Deprecated Class-Name Fixes), where it belongs with its own required manual
  browser verification (TWFX-04) — user confirmed this scoping explicitly.
- **CR-02**: `no-stale-id-comments.mjs`'s regex broadened to also match bare
  `NN-<word>.md` doc-filename references. Re-running `eslint --fix --suppress-all` surfaced
  29 newly-detected (previously invisible) violations, now tracked in
  `eslint-suppressions.json` as debt for Phase 13 (Comment Cleanup) to resolve by hand.
- **WR-01**: Removed unused `@babel/preset-react`/`@babel/preset-typescript` devDependencies.
- **WR-02**: Widened the domain-boundary Prisma import-restriction glob to `@prisma/**`,
  matching the adjacent Next.js pattern's deep-subpath coverage.
- **WR-03**: Added `generated/**` to `globalIgnores`.
- **WR-04**: Softened README's suppression-mechanism claim to accurately describe its
  per-file-per-rule count-based (not per-violation) tracking.

IN-01 and IN-02 were left as-is (both explicitly marked non-urgent/latent in the review;
IN-01 is a pre-existing pattern unrelated to this phase's own changes, IN-02 has no current
false positive to fix).

Full test suite (209/209), typecheck, and production build all re-verified passing after
these fixes, including after the CR-01 correction.

---

_Reviewed: 2026-07-19T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
