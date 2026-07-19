# Feature Research

**Domain:** Solo-built portfolio repo tooling/hygiene (v1.2 Tech Debt & Stabilization milestone — ESLint setup, refactor, comment cleanup)
**Researched:** 2026-07-19
**Confidence:** HIGH (Next.js/typescript-eslint claims verified via official docs and Context7; solo-vs-team tradeoff judgments are MEDIUM, cross-checked against multiple sources but inherently a project-context call)

## Scope Note

This document supersedes the prior FEATURES.md (v1.1 UI Redesign, hero/gallery UX patterns) for this milestone. v1.2 adds no new user-facing features — the "feature landscape" here is a tooling/hygiene landscape: what a credible lint/code-quality setup looks like for a **solo-built portfolio repo** whose explicit audience is a hiring tech lead or interviewer, not a real multi-contributor team. Prior UI-feature research (v1.0 domain, v1.1 hero/gallery) is not re-litigated here and remains valid for its own milestones.

## Framing

The reviewer here is not "users" but a **tech lead or interviewer skimming the repo**. Their signal for
"professional engineering hygiene" is different from a real team's: they're not checking whether tooling
*prevents* bad commits (there's only one contributor — nothing to prevent), they're checking whether the
repo *demonstrates the author knows what a real team's setup looks like and can build one*, sized correctly
for this repo. Over-scoping the tooling (CI, git hooks, CONTRIBUTING.md for zero external contributors) reads
as cargo-culting exactly as much as under-scoping it (no linter at all) reads as unfinished. Both failure
modes are visible to an experienced reviewer — this is why the categorization below is stricter than a
generic "ESLint best practices" list.

PROJECT.md already locks part of the scope for this milestone: **local `npm run lint` script only, no GitHub
Actions CI this milestone** (explicitly deferred to a future milestone). That locked decision is treated as
a hard constraint below, not re-litigated.

## Feature Landscape

### Table Stakes (A Reviewer Would Notice Absence)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| ESLint installed + configured for Next.js 16 + TypeScript, using flat config (`eslint.config.mjs`) | The repo currently has **zero** lint tooling — `npm run dev/build/test/typecheck` exist but no `lint`. For a project whose CLAUDE.md explicitly claims a "Staff Full-Stack Engineer" persona and DDD-lite discipline, shipping two full milestones with no linter at all is the single most visible gap an interviewer would find in 10 seconds of opening `package.json`. | LOW | Install `eslint` + `eslint-config-next` (which bundles `@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks` recommended sets). **Next.js 16 removed `next lint` entirely** (confirmed via official docs, `nextjs.org/docs/app/api-reference/config/eslint`, `v16.0.0` changelog) — there is no `next lint` command to fall back to, and any stale `eslint` key in `next.config.ts` should be deleted. Use the ESLint CLI directly (`eslint .`) via the flat-config file, not the old `.eslintrc.*` format (deprecated, removed in ESLint v10). |
| `eslint-config-next/typescript` layered on top of the base config | TypeScript is a locked core technology (STACK.md) — a JS-only lint config on a fully-TypeScript codebase would look like an oversight, not a deliberate choice. | LOW | This sub-config is itself based on `plugin:@typescript-eslint/recommended` (confirmed via Next.js official docs) — see the strictness discussion under Anti-Features for why `recommended`, not `strict-type-checked`, is the right starting tier here. |
| `npm run lint` script wired into `package.json`, documented alongside `dev`/`build`/`test`/`typecheck` | PROJECT.md's own milestone goal names this exact script. A reviewer who runs `npm run test` and `npm run typecheck` (both already present) and finds no sibling `lint` script would read the milestone as incomplete regardless of whether ESLint is technically installed. | LOW | Trivial once ESLint is configured — `"lint": "eslint ."`. Consider `"lint:fix": "eslint . --fix"` as a paired convenience script; low cost, matches the shape of existing scripts. |
| A lint-clean baseline — `npm run lint` exits 0 with no errors across the existing codebase | Introducing a linter to an already-built, two-milestone-old codebase and leaving it red is worse than not having one: a reviewer who runs `npm run lint` and sees a wall of unaddressed errors reads it as "tooling added but not actually used," undermining the whole hygiene narrative. | MEDIUM | This is the real cost driver of the milestone, not the ESLint install itself. PROJECT.md already flags concrete known violations to fix as part of this pass (deprecated Tailwind v4 class names in 6 files, long files, stale comments) — those and whatever else surfaces from turning the linter on for the first time need to be clean before the milestone closes. |
| Removing the stale `eslint` option from `next.config.ts` (if present) | Next.js 16 explicitly deprecated/removed this config key alongside `next lint`'s removal — leaving it in place signals unfamiliarity with the exact framework version this project is pinned to (16.2.10, per STACK.md), which is a worse look than having no lint config at all for a project whose stated differentiator is engineering rigor. | LOW | One-line removal, verified via Next.js's own migration notes; pairs naturally with the flat-config setup work. |

### Differentiators (Impressive, Not Expected)

| Feature | Value Proposition | Complexity | Notes |
|---------|--------------------|------------|-------|
| Architecture-boundary enforcement via ESLint's core `no-restricted-imports` (or per-directory config overrides) — encoding "`src/domain/` never imports from `src/server/`, Next.js, tRPC, or Prisma" as an actual lint rule | This is the single highest-signal differentiator available here. STACK.md/CLAUDE.md already name this exact boundary as "the hard rule to enforce" for the domain-modeling-depth claim to be real rather than aspirational — turning a **written** convention into a **lint-enforced** one is precisely the kind of thing a tech lead notices and respects, because it shows the author understands conventions rot without automation. | LOW–MEDIUM | Confirmed via research: `no-restricted-imports` is a core ESLint rule (zero new dependency) capable of this via glob-scoped flat-config overrides (a `files: ['src/domain/**']` block restricting imports outside `src/domain/`). A dedicated plugin (`eslint-plugin-boundaries`) exists for larger/monorepo-scale layering but is unjustified overhead at this project's ~3-layer, single-package scale — same "don't add a dependency the project doesn't need" logic STACK.md already applies elsewhere. |
| `no-restricted-syntax` rule banning stale task/plan/REQ-ID references in comments (e.g. matching `/Phase \d+|REQ-\d+|Plan \d+/i` against comment text) | This milestone is *manually* removing 10 found stale comment references right now — a lint rule is the difference between "we cleaned it up once" and "this can't recur." It directly operationalizes the "WHY-only, no rotting task IDs" convention already written in CLAUDE.md/CONVENTIONS. | LOW | Core ESLint rule, no new dependency; the pattern-matching half of the convention (does this comment cite an ID that will rot?) is fully mechanical and a genuinely good fit for a custom rule. See "What NOT to Automate" below for the half of this convention that isn't mechanical. |
| `no-restricted-syntax` rule banning raw CSS built as template-literal strings in `.tsx` files (e.g. flagging a `TemplateLiteral` assigned to a JSX `style` attribute or a `background-image`/`animation` string) | Directly operationalizes the "no raw CSS composed as strings in component files" convention already written in CLAUDE.md — same rationale as above: a documented convention with no enforcement is one refactor away from being silently violated. | LOW | Same core rule, different AST selector; no new dependency. |
| `max-lines` / `max-lines-per-function` as an early-warning proxy for "split computation from presentation" | CLAUDE.md's own convention names a concrete numeric signal ("growing past ~150-200 lines") — that's an unusually good match for a mechanical threshold rule, better than most style conventions. | LOW | Set as `warn`, not `error` — it's a proxy for a judgment call (mixing computation with markup), not the judgment itself; a long file that's legitimately just verbose JSX shouldn't hard-fail the build. Frame this as a nudge, not a strict gate. |
| `typescript-eslint`'s `recommended-type-checked` tier (adds type-aware rules on top of the `eslint-config-next/typescript` default `recommended`) | A meaningful, well-established step up in rigor beyond what `eslint-config-next/typescript` ships by default, without the risk profile of the `strict` tiers (see Anti-Features). Shows deliberate calibration of strictness rather than just accepting a framework default. | MEDIUM | Requires wiring `parserOptions.project`/typed linting (points ESLint at `tsconfig.json`) and is slower to run than untyped rules — real cost, but well-trodden and stable. Confirmed via Context7 (`typescript-eslint`) that `recommended-type-checked` is explicitly positioned as "additional recommended rules requiring type information," one clear step above the default, not the most aggressive tier. |
| `.editorconfig` at repo root | Near-zero cost, cheap signal that indentation/charset/line-ending conventions were considered, without asking anything of a reviewer skimming the repo. | LOW | Single static file, no runtime dependency. Optional polish, not required — most reviewers won't specifically check for its absence the way they would a missing linter. |
| Prettier + `eslint-config-prettier`, format-on-save only (NOT a repo-wide reformat commit) | Consistent formatting is a genuine team-hygiene signal, and Next.js's own docs show the exact recommended pairing (`eslint-config-prettier` to disable ESLint's conflicting stylistic rules). | MEDIUM | Real risk: running Prettier's formatter across ~2 milestones of already-written code produces a large, low-value diff unrelated to this milestone's actual goal (lint rules + refactor + comment cleanup) and would visually swamp the meaningful changes in the PR. If added, scope it to "install + document, format new/touched files only" rather than a blanket reformat — otherwise this tips toward scope creep for a milestone that's explicitly not supposed to touch working code without reason. |
| A short "Linting & Code Quality" section added to the README (not a new file) enumerating which CLAUDE.md conventions are lint-enforced vs. still human-reviewed | Ties the new tooling back to the conventions the project already documents by hand — shows the two are a coherent system, not tooling bolted on independently of the written philosophy. | LOW | README additions are already an expected deliverable per CLAUDE.md's Documentation constraint; this is additive to that existing obligation, not a new deliverable category. |

### Anti-Features (Would Read as Over-Engineering Here)

| Feature | Why Requested | Why Problematic (for THIS repo) | Alternative |
|---------|---------------|----------------------------------|-------------|
| Husky + lint-staged pre-commit hooks | Genuinely standard on real multi-contributor teams — commonly the first thing people reach for right after "add ESLint." Community sources frame it as "the professional workflow." | With exactly one contributor, there is no one else's commit to catch — the only person a pre-commit hook can block is the author themselves, who already has `npm run lint` one command away. It adds a git-hook installation step (a `prepare` script, `.husky/` directory, onboarding friction for anyone who clones the repo to review it) to solve a problem — "a teammate might skip lint" — that doesn't exist yet in a solo repo. PROJECT.md's own locked scope for this milestone ("local `npm run lint` script only") already signals this exact class of process machinery is meant to wait. | Document `npm run lint` in the README as a required pre-push step; revisit husky/lint-staged only if/when a CI workflow is added in a future milestone (the two pair naturally — CI as the actual enforcement backstop, hooks as a fast local mirror of it — but introducing hooks alone, ahead of CI, front-loads friction without the corresponding benefit). |
| GitHub Actions CI workflow + status badge | Table stakes on a real team repo, and a badge is a highly visible "this is professional" signal on a README. | **Explicitly out of scope for this milestone per PROJECT.md's own locked decision** ("no GitHub Actions CI — that's a candidate for a future milestone"). Adding it now would both violate the milestone's stated scope and risk turning a "first step" milestone into a much larger one — CI setup for this stack (Next.js + Prisma + Postgres) means also wiring a test database, secrets, and a build step, none of which this milestone's goal calls for. | Leave as the next milestone's explicit target; this milestone's `npm run lint` is correctly framed as the prerequisite for a future CI job to call. |
| `CONTRIBUTING.md` | Signals "welcoming to contributors," commonly bundled with CI/badge/community-health-file setups; several generic checklists list it as a default open-source hygiene file. | This is a single-author portfolio repo with **no external contributors, past or planned** — a contributor-onboarding guide for zero contributors reads as cargo-culting open-source ritual rather than genuine practice, which is the opposite of the impression this milestone is trying to create. | Fold the small amount of genuinely useful content (how to run lint/tests/build locally) into the README's existing "setup guide" section, which is already a stated CLAUDE.md documentation deliverable — don't create a second file whose entire premise (multiple contributors) doesn't apply. |
| `typescript-eslint`'s `strict` / `strict-type-checked` config tier | Sounds like the more rigorous, more impressive choice — "strict" is a stronger word than "recommended." | typescript-eslint's own docs describe this tier as "highly opinionated," requiring "strong TypeScript proficiency," and explicitly **not stable under semver** (its rule set can change outside major version bumps) — confirmed via Context7. Turning this on retroactively across a codebase written to `recommended`-level expectations for two prior milestones would surface a large volume of stylistic-opinion violations disconnected from real bugs, right when the milestone's stated goal is a scoped, demonstrable "first step," not a rewrite. Doing this now risks a lint pass so noisy it either gets partially suppressed (undermining the exercise) or balloons the milestone's actual scope. | `eslint-config-next/typescript`'s own default (`recommended`) is the right starting tier; `recommended-type-checked` (see Differentiators) is the correct "more rigorous but still stable and well-trodden" next step, not `strict-type-checked`. |
| Writing custom ESLint AST rules to fully automate the "no duplicated JSX for near-identical instances" and "comments must explain WHY not WHAT" conventions | Tempting once you've already written 2-3 custom `no-restricted-syntax` rules (see Differentiators) — it can feel like "why not go all the way and automate everything CLAUDE.md documents?" | Both are genuine judgment calls, not mechanical patterns. "Near-identical JSX" requires comparing two hand-authored blocks for semantic (not textual) similarity — CLAUDE.md's own example of this bug (a rotation fix applied to one vessel but not the other) was caught by a human, not tooling, and no off-the-shelf rule detects "these two blocks differ only in vessel-specific values." Whether a comment explains WHY vs. restates WHAT is a natural-language judgment ESLint's AST-based model has no access to. Writing and maintaining bespoke rules for these would itself become an unjustified dependency (a custom rule package to write, test, and keep working across ESLint upgrades) for a benefit — full automation of two judgment-based conventions — a solo repo doesn't need; PR self-review is sufficient at this scale. | Leave both conventions as documented-but-manual in CONVENTIONS/CLAUDE.md, exactly as they are today; catch violations via the same self-review discipline that's already caught them once. `eslint-plugin-sonarjs`'s `no-identical-functions` rule is a *partial*, narrower proxy (catches literally-duplicated function bodies, not "near-identical" hand-varied JSX) — not worth adding as a new dependency for that narrow a slice of the actual convention. |

## What NOT to Automate — Direct Answer to "Should CLAUDE.md's Conventions Become ESLint Rules?"

Splitting each of the 4 written conventions by whether the specific claim in each one is mechanically detectable:

| Convention (as written in CLAUDE.md) | Automatable slice | Judgment-only slice (stays manual) |
|---|---|---|
| Split computation from presentation | File length crossing ~150-200 lines (`max-lines`, as a `warn`) | Whether the *mix* is actually computation+presentation vs. just verbose JSX — needs a human read |
| No duplicated JSX for near-identical instances | None found that's worth a new dependency | Whether two blocks are "near-identical enough" to warrant extraction — inherently a similarity judgment |
| No raw CSS as strings in component files | Template-literal-as-`style`/`background-image`/`animation` pattern (`no-restricted-syntax`) | None — this one is fully mechanical, a good candidate |
| WHY-only comments, no rotting task/plan IDs | Detecting a stale-ID pattern (`Phase \d+`, `REQ-\d+`, etc.) in comment text (`no-restricted-syntax`) | Whether a comment explains WHY vs. restates WHAT — needs a human read |

**Recommendation:** convert the two fully-mechanical slices (stale-ID comments, raw-CSS-as-strings) into real custom ESLint rules this milestone — they're low-cost, zero-new-dependency (`no-restricted-syntax` is core ESLint), and directly prevent recurrence of problems this exact milestone found by hand. Use `max-lines` as a soft proxy nudge for the file-length signal. Leave the two judgment-based conventions (near-identical JSX, WHY-vs-WHAT comments) as documented-but-manual — don't chase full automation of conventions that are, by their own nature, human calls.

## Feature Dependencies

```
ESLint installed + flat config (eslint.config.mjs)
    └──requires──> eslint-config-next, eslint-config-next/typescript installed
                       └──requires──> npm run lint script wired

npm run lint script ──enables──> lint-clean baseline pass (fix existing violations)
                                      └──enables──> custom no-restricted-syntax rules (stale-ID comments, raw-CSS-strings)
                                                         (adding these BEFORE the codebase is lint-clean would just add more red to the same pass)

Architecture-boundary rule (no-restricted-imports on src/domain/**) ──independent of──> the rest of the ESLint setup
    (can be added in the same PR, but doesn't depend on eslint-config-next specifically — it's a plain core-ESLint config block)

typescript-eslint recommended-type-checked ──enhances──> the default eslint-config-next/typescript (recommended) tier
    (optional upgrade, not a prerequisite for anything else in this list)

GitHub Actions CI (future milestone) ──requires──> npm run lint existing and lint-clean
    (this milestone is explicitly the prerequisite step for that future one, per PROJECT.md)

Husky + lint-staged (deferred) ──pairs naturally with, but does not require──> GitHub Actions CI
```

### Dependency Notes

- **Lint-clean baseline requires the script to exist first:** you can't declare the codebase "lint-clean" without a way to run the linter — the script wiring and the baseline fix are sequential, not parallel, work within this milestone.
- **Architecture-boundary enforcement is independent:** because it uses ESLint's own core `no-restricted-imports` rule rather than anything from `eslint-config-next`, it can be added in the same PR as the main setup without waiting on any other piece — there's no reason to sequence it after the Next.js-specific config.
- **CI (future milestone) depends on this milestone's baseline being clean:** a CI job that runs `npm run lint` on every push is only useful once that command reliably exits 0 on `main` — this milestone is the explicit, correctly-ordered prerequisite PROJECT.md already frames it as.

## MVP Definition

### Launch With (this milestone)

- [ ] ESLint + `eslint-config-next` + `eslint-config-next/typescript`, flat config (`eslint.config.mjs`) — the entire premise of the milestone
- [ ] `npm run lint` script in `package.json`, documented in README alongside existing scripts
- [ ] Stale `eslint` key removed from `next.config.ts` if present (Next.js 16 no longer uses it)
- [ ] Lint-clean baseline: zero errors on `npm run lint` after fixing existing known violations (deprecated Tailwind classes, etc.)
- [ ] Architecture-boundary rule (`no-restricted-imports`, `src/domain/**` scope) — highest-signal differentiator, low cost, directly enforces an already-documented "hard rule"
- [ ] Custom `no-restricted-syntax` rules for stale task/plan/REQ-ID comment patterns and raw-CSS-as-template-literal patterns — cheap, zero-new-dependency, prevents recurrence of exactly what this milestone is manually cleaning up
- [ ] `max-lines` as a `warn`-level proxy nudge, tied to the same refactor sweep this milestone already scopes

### Add After Validation (candidate for later in this same milestone, if time allows)

- [ ] `typescript-eslint` `recommended-type-checked` tier — real value, but wire it after the base setup is lint-clean, since typed linting will surface additional, possibly-noisier findings on top of the base pass
- [ ] `.editorconfig` — trivial to add whenever, no dependency ordering concern
- [ ] README "Linting & Code Quality" section tying tooling back to CLAUDE.md's documented conventions

### Future Consideration (explicitly deferred, not this milestone)

- [ ] GitHub Actions CI workflow (+ status badge) — PROJECT.md's own locked decision defers this
- [ ] Husky + lint-staged pre-commit hooks — defer until/unless CI is added; premature without it for a solo repo
- [ ] Prettier repo-wide reformat — if pursued at all, scope to new/touched files only, never a blanket reformat commit
- [ ] `strict-type-checked` — reconsider only if a future milestone is an intentional "raise the bar" rewrite pass, not a first-pass setup

## Feature Prioritization Matrix

| Feature | Reviewer-Visible Value | Implementation Cost | Priority |
|---------|------------------------|----------------------|----------|
| ESLint + Next.js/TS config + `npm run lint` | HIGH | LOW | P1 |
| Lint-clean baseline (fix existing violations) | HIGH | MEDIUM | P1 |
| Architecture-boundary `no-restricted-imports` rule | HIGH | LOW–MEDIUM | P1 |
| Custom `no-restricted-syntax` (stale IDs, raw CSS strings) | MEDIUM–HIGH | LOW | P1 |
| `max-lines` proxy for file-length convention | MEDIUM | LOW | P2 |
| `recommended-type-checked` upgrade | MEDIUM | MEDIUM | P2 |
| `.editorconfig` | LOW | LOW | P2 |
| README lint/quality section | MEDIUM | LOW | P2 |
| Prettier (scoped, non-blanket) | LOW–MEDIUM | MEDIUM | P3 |
| GitHub Actions CI + badge | HIGH (but deferred) | MEDIUM | P3 (future milestone) |
| Husky + lint-staged | LOW (solo repo) | LOW | P3 (defer) |
| CONTRIBUTING.md | LOW (no contributors) | LOW | Do not build |
| `strict-type-checked` | LOW (risk > payoff now) | HIGH | Do not build (this milestone) |

**Priority key:**
- P1: Must have for this milestone to credibly close its own stated goal
- P2: Should have if time allows within this milestone; genuine value, no urgency
- P3: Correctly deferred to a future milestone or an explicit non-goal

## Sources

- [Next.js: ESLint Plugin config reference](https://nextjs.org/docs/app/api-reference/config/eslint) — official docs, confirms Next.js 16 removed `next lint`, flat-config setup steps, `eslint-config-next`/`eslint-config-next/typescript`/`eslint-config-next/core-web-vitals` package boundaries, and the `eslint-config-prettier`/lint-staged integration recipes. HIGH confidence (official, dated `lastUpdated: 2025-11-10`, version-pinned to 16.2.10 matching this project's locked Next.js version).
- Context7 `/typescript-eslint/typescript-eslint` — `recommended` / `recommended-type-checked` / `strict` / `strict-type-checked` tier definitions and stability guidance (`strict-type-checked` explicitly "not stable under Semantic Versioning"). HIGH confidence (official monorepo docs via Context7).
- [eslint-plugin-tailwindcss (npm)](https://www.npmjs.com/package/eslint-plugin-tailwindcss) / [poupe-ui/eslint-plugin-tailwindcss](https://github.com/poupe-ui/eslint-plugin-tailwindcss) / [oxlint-tailwindcss writeup](https://sergioazocar.com/en/blog/oxlint-tailwindcss-the-linting-plugin-tailwind-v4-needed/) — confirms Tailwind v4 ESLint-plugin support is partial/fragmented across several competing community packages as of this research; treat any Tailwind-specific lint plugin choice as its own small research question if pursued, not a drop-in decision. MEDIUM confidence (community sources, no single authoritative "official Tailwind ESLint plugin").
- WebSearch: "solo developer portfolio repo ESLint pre-commit hooks husky lint-staged" — cross-section of community writeups (Olivia Coumans, Built In, DEV Community, PkgPulse) converging on: lint-staged's value proposition is specifically fast checks on *other people's* staged files in a team; for a solo repo the enforcement benefit is much weaker. MEDIUM confidence (multiple independent sources agree, no single authoritative source since this is a project-context judgment, not a documented fact).
- WebSearch: "CONTRIBUTING.md solo portfolio project" — GitHub's own community-health-file guidance and Open Source Guides both frame CONTRIBUTING.md as existing specifically to onboard *external* contributors; converges with the anti-feature reasoning above. MEDIUM confidence.
- WebSearch: "eslint no-restricted-imports / eslint-plugin-boundaries architecture enforcement" — confirms `no-restricted-imports` is a core, zero-dependency ESLint rule sufficient for this project's scale, and that `eslint-plugin-boundaries`/monorepo-oriented tools exist but target a larger scale than this project's ~3-layer single package. MEDIUM-HIGH confidence (ESLint's own core-rules docs plus multiple independent architecture-enforcement writeups agree on the pattern).

---
*Feature research for: v1.2 Tech Debt & Stabilization milestone, COLREGS Navigator*
*Researched: 2026-07-19*
