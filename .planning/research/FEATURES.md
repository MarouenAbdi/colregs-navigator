# Feature Research

**Domain:** CI/CD pipeline, pre-commit hooks, and deployment for a solo-authored portfolio full-stack app (Next.js/tRPC/Prisma/PostgreSQL)
**Researched:** 2026-07-20
**Confidence:** HIGH (CI/CD structure, Husky/lint-staged division, badges — well-documented, multi-source corroborated) / MEDIUM (Vercel-vs-Actions redundancy specifics, health-check conventions — fewer authoritative primary sources, but internally consistent across sources)

## Scope Note

This document supersedes the prior FEATURES.md (v1.2 Tech Debt & Stabilization — lint/hygiene tooling landscape) for this milestone. v1.3's feature landscape is CI/CD, pre-commit hooks, and deployment — a different domain than v1.2's lint/refactor hygiene, though the same "reviewer is a tech lead/interviewer, not a real team of users" framing applies and is carried forward below. Prior milestones' UI/domain-feature research (v1.0, v1.1) and lint-tooling research (v1.2) remain valid for their own milestones and are not re-litigated here.

## Context Check Against Existing Codebase

`package.json` already defines `lint`, `typecheck`, `test`, and `build` npm scripts (added across v1.0–v1.2). This milestone's CI work is **wiring existing scripts into a pipeline**, not creating new checks. This matters for complexity ratings below — "add lint to CI" is LOW complexity here specifically because the lint config, ESLint bypass workaround (`@next/eslint-plugin-next` + `@babel/eslint-parser`), and `tsc --noEmit` typecheck script already exist and are known-working locally.

## Framing

The reviewer here is a tech lead or interviewer skimming the repo, not a real multi-contributor team relying on these processes daily. Their signal for "professional DevOps practice" is: does the pipeline demonstrate the author understands what a real team's setup looks like and can build one, correctly sized for a solo two-person-max audience (author + reviewer)? Over-scoping (Kubernetes, staging environments, secrets managers for a repo with one contributor and one deployed instance) reads as cargo-culting/resume-driven development just as visibly as under-scoping (no CI at all) reads as unfinished. This is why the anti-features list below is as long and specific as the table-stakes list — proportional judgment is itself the thing being evaluated in this milestone, not tool-checklist completion.

## Feature Landscape

### Table Stakes (A Reviewer Expects These)

Features a technical interviewer/tech lead would expect from a "professional engineering practices" showcase. Missing these makes the DevOps signal feel incomplete or performative.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| GitHub Actions CI workflow: lint + typecheck + test + build, on every PR | This is the baseline signal of "CI exists" — a reviewer opening the Actions tab or a PR expects to see these four gates, all already scripted locally | LOW | One `.github/workflows/ci.yml` calling existing `npm run lint`/`typecheck`/`test`/`build`. No new tooling to write. |
| CI triggers on `pull_request` (to `main`) AND `push` to `main` | PRs need pre-merge gating; a direct push to main (rare but possible) still needs the same gate re-run post-merge for badge accuracy | LOW | Standard `on: { pull_request: { branches: [main] }, push: { branches: [main] } }` — avoids the common gap where main's badge goes stale because CI only ever ran on PR branches |
| Dependency caching (`actions/setup-node` with `cache: npm`, or lockfile-keyed cache) | Table stakes for not looking careless about pipeline speed; a 3-5 min CI run vs a 40s one is a visible signal of polish | LOW | Built into `actions/setup-node@v4`'s `cache: 'npm'` option — a single line, not a separate caching strategy to design |
| Required status checks on `main` (branch protection) | Without this, a red CI run doesn't actually block a merge — the pipeline is theater. Branch protection is the difference between "CI runs" and "CI enforces" | LOW | GitHub repo setting (Settings → Branches → protect `main`, require the CI workflow's job(s) to pass). Zero code — a checklist/documentation item for the CD/CI phase, not a code deliverable, but must be explicitly done and verified, not assumed. |
| README CI status badge | The single most common, most-expected visual signal of "this repo has CI" — nearly universal on maintained GitHub repos | LOW | `![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)`, optionally wrapped in a link to the workflow run. Confirmed syntax via GitHub Docs. |
| Continuous Deployment: auto-deploy to production on merge to `main` | Explicitly locked in PROJECT.md ("CD means real auto-deploy on merge to main, not a manual/staged release process") — this is the difference between a CI-only repo (common) and a CI/CD repo (the stated goal) | LOW–MEDIUM | See "CD pattern" discussion below — the *mechanism* (host-native Git integration vs. Actions-driven deploy) is the open design question, not whether auto-deploy-on-merge happens at all. |
| `prisma migrate deploy` run against production DB as part of the deploy step | A real production Postgres DB (per PROJECT.md's "live deployment... backed by a real production Postgres database") needs its schema kept in sync on every deploy — this is the standard, Prisma-documented CI/CD pattern, not an extra | MEDIUM | Confirmed via Prisma's own docs: `migrate deploy` (not `migrate dev`) is the CI/CD-safe, non-interactive command; needs `DATABASE_URL` as a CI secret. Prisma's own guidance also flags a real gotcha: concurrent merges within its 10s advisory-lock window — irrelevant at solo-author scale but worth a one-line note in docs so it doesn't read as an oversight. |
| A basic health/status signal for the live deployment | A reviewer clicking the live URL expects some evidence the deployed instance is genuinely wired to its production DB, not just serving static pages | LOW | A `GET /api/health` (or `/api/trpc/health`) route doing a lightweight `SELECT 1`/`prisma.$queryRaw` check, returning `200`/`503` with `{status, timestamp}`. Keep it a plain JSON endpoint, not a dashboard — see anti-features below for what NOT to build here. |
| Husky + lint-staged pre-commit hook running lint/format on staged files only | This is the standard, near-universal pattern in any JS/TS repo claiming git hygiene discipline; a portfolio repo with `CLAUDE.md`-documented conventions but no enforcement at commit-time reads as inconsistent | LOW | `npx husky init`, `lint-staged` config running `eslint --fix` (staged `.ts/.tsx` only) — reuses the already-working `eslint` config, no new lint rules to write |
| `CONTRIBUTING.md` with setup, workflow, and code-style sections | Explicitly locked as a target feature (`DOCS-CONTRIB-01`); a reviewer treating the repo as an "open-source-style" portfolio artifact expects this file to exist and be genuine, not boilerplate | LOW | See detailed section breakdown below |
| Documented rollback / "what happens on a broken deploy" note | Not a feature to build, but a documentation table-stake: a tech lead reviewing DevOps maturity will ask "what's your rollback story?" — for a portfolio project, "the host's dashboard lets you re-promote a prior deployment in one click" is a legitimate, sufficient answer if written down | LOW | Documentation only (README or CONTRIBUTING) — no pipeline code required if you pick a host with one-click rollback (Vercel/Railway/Render/Netlify all have this natively) |

### Differentiators (Signal Above the Baseline)

Not required to look "CI/CD exists," but these are what separate "checked a box" from "understands tradeoffs" — valuable specifically because this milestone's stated purpose is demonstrating *judgment*, not just tool usage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Explicit "why we don't run a redundant Actions deploy step" note in docs, if using host-native Git integration | Shows the interviewer the engineer understands *when a tool should defer to a platform feature* rather than defaulting to "more pipeline = more impressive" — a senior-engineer signal, directly aligned with this project's existing "justify every abstraction and dependency" persona | LOW (documentation only) | See CD pattern discussion below — this is a near-zero-cost differentiator: one paragraph in README/CONTRIBUTING explaining the deploy architecture choice |
| PR preview deployments (ephemeral URL per PR) | Lets a reviewer click a live preview of a specific PR's changes without pulling the branch locally — a genuinely useful, low-effort differentiator if the chosen host supports it out of the box | LOW (if host-native, e.g. Vercel/Netlify preview deploys) / not worth building manually | Free with Vercel/Netlify's native GitHub integration — do not hand-roll this with GitHub Actions if the host already does it; that would itself become the "redundant Actions deploy step" anti-pattern |
| lint-staged running `tsc --noEmit` scoped only on genuinely fast paths, OR explicitly deferring full typecheck to CI with a documented rationale | Shows deliberate reasoning about the commit-time/CI-time tradeoff (many teams get this wrong by cramming full-repo typecheck into pre-commit and then quietly bypassing hooks when it gets slow) rather than cargo-culting a "kitchen sink" hook | LOW | Given this codebase's TypeScript 7.0.2/tsgo setup already has a known-fast `npm run typecheck`, benchmark it once; if it's fast (seconds, not tens of seconds) it's reasonable to include at pre-commit — document the decision either way in `CONTRIBUTING.md` |
| A short "Architecture / Deployment" ADR-style doc entry specifically for the CI/CD decision (host choice, DB choice, deploy trigger mechanism) | PROJECT.md already commits this project to maintaining ADRs; adding one for this milestone's stack choice (which host? why?) is directly aligned with an existing project convention, not a new ask | LOW | Reuses the existing ADR practice — no new documentation format to invent |
| `npm audit`/dependency vulnerability check as a non-blocking CI step (e.g. `npm audit --audit-level=high` reporting only, not failing the build) | Shows baseline security awareness without over-engineering a full SCA/Dependabot program | LOW | Optional, cheap addition; keep non-blocking (report-only) so a third-party CVE in a dev-dependency doesn't block ship-ability of a portfolio demo |
| Dependabot (GitHub-native, zero-config) enabled for `npm` ecosystem | GitHub-native automated dependency PRs is a one-file (`dependabot.yml`) addition that reads as "keeps dependencies current" without building any custom tooling | LOW | Native GitHub feature, not a pipeline you build — appropriately scoped differentiator (shows awareness, costs almost nothing) |

### Anti-Features (Would Read as Overengineered / Resume-Driven for This Project's Scope)

Features that are legitimate at larger scale but would actively hurt the "credible, right-sized engineering judgment" signal this milestone is going for — a tech lead reviewing this repo would read these as "doesn't understand proportionality," not "impressive."

| Feature | Why It Looks Appealing | Why Problematic Here | Alternative |
|---------|------------------------|-----------------------|-------------|
| Manual GitHub Actions deploy step (build + push) running *alongside* the host's native Git integration (e.g. Vercel) | Feels like "more pipeline = more DevOps credit" | Produces duplicate builds, race conditions, and doubled build minutes — confirmed as a known anti-pattern; the fix (disabling the host's auto-deploy via `ignoreCommand` in `vercel.json`, or vice versa) is itself evidence the engineer didn't think through the interaction before shipping it | Pick exactly one deploy mechanism: either the host's native Git integration (recommended default for a Next.js-on-Vercel-style host — zero custom deploy code, preview URLs for free) OR a GitHub Actions deploy step with the host's auto-deploy explicitly disabled — never both |
| Multi-environment staging + production pipeline (separate staging DB, staging URL, promotion gate between them) | Mirrors what "real" companies do, feels senior | This is a solo-authored portfolio project with a single reviewer-facing production instance; a staging environment with no team to protect and no real users to canary against is pure process overhead that will visibly sit unused — a reviewer will notice an empty/never-touched staging environment faster than they'd be impressed by its existence | One production environment; PR preview deployments (via the host's native feature, not hand-built) already cover the "see changes before merge" need without a second persistent environment |
| Kubernetes / containerized deployment (Docker + k8s manifests + Helm) | Classic "resume-driven development" flag — reads as chasing keywords rather than solving this project's actual deployment problem | A single Next.js app + one Postgres instance has zero orchestration, scaling, or multi-service needs that Kubernetes exists to solve; adding k8s here is the textbook definition of a solution in search of a problem, and a technical interviewer will immediately ask "why does a 2-vessel portfolio app need pod autoscaling?" — a question with no good answer | Any PaaS/serverless-friendly host with native Next.js support (Vercel, Netlify, Railway, Render) — zero infra-as-code needed |
| Blue-green / canary deployments, traffic-shifting, feature-flag-gated rollout | Sounds like "modern 2026 best practice" (some current-year DevOps content pushes this framing) | This is infrastructure for de-risking deploys to real concurrent user traffic at scale; a portfolio demo with intermittent single-reviewer traffic has no risk profile that justifies it, and building it would visibly not have been "tested" in any real sense | Simple full-replace deploy on merge; rollback via host's one-click "promote a previous deployment" feature is a sufficient, honest answer to "what if a deploy breaks prod" |
| Custom secret-rotation tooling / a secrets manager (Vault, AWS Secrets Manager, etc.) | Sounds like "security maturity" | For a single `DATABASE_URL` and maybe one or two API keys stored as GitHub Actions secrets + the host's environment variable dashboard, a dedicated secrets-management system is solving an organizational-scale problem (many services, many rotating credentials, compliance requirements) this project doesn't have | GitHub Actions encrypted secrets + host's built-in environment variable store; document rotation as "regenerate the credential, update the two places it's stored" — a one-sentence policy, not a system |
| A custom-built CI dashboard / Grafana/Prometheus observability stack | Feels like "full DevOps" | Massive overkill for a project whose "operational" surface is one Next.js app and one Postgres instance with no SLA and no on-call — this is the single clearest "resume-driven, didn't right-size to the problem" tell a reviewer would flag | The GitHub Actions tab (workflow history) + the `/api/health` endpoint + the host's own built-in deployment/runtime logs (Vercel/Railway/Render all ship this natively) are sufficient observability for this scope |
| Matrix build strategy across multiple Node.js versions / OSes | Common CI pattern shown in generic tutorials | This is a single-stack, single-deployment-target app (Next.js only runs where you deploy it — one Node version, one OS). A matrix here tests nothing real; it multiplies CI minutes for zero risk-coverage benefit, since there is no library-consumer audience running arbitrary Node versions against this code | Pin one Node LTS version (matching the deployment host's runtime) in a single job; no matrix needed. (Contrast: matrix strategy earns its keep for published npm packages supporting multiple consumer environments — not the case here.) |
| Full-repo `tsc --noEmit` + full test suite crammed into the Husky pre-commit hook (not lint-staged-scoped) | Feels like "maximum enforcement" | Multiple independent sources agree this is the most common Husky/lint-staged anti-pattern: slow, ambitious pre-commit hooks train developers to reach for `--no-verify`, which defeats the entire point of having hooks | Keep pre-commit to lint-staged's fast, staged-file-scoped checks (ESLint --fix, maybe Prettier if added); leave full typecheck + full test suite as CI-only gates (already true here — `npm run typecheck`/`npm run test` are the CI job steps, not the hook) |
| A separate `pre-push` hook running the full test suite, in addition to the CI gate | Sounds like "extra safety layer" | Duplicates work CI already does authoritatively (CI is the real enforcement point since branch protection requires it), while adding local friction on every push — a false sense of thoroughness without new coverage | Skip a pre-push hook entirely; rely on the CI-required-status-check as the single source of truth for "did it pass," matching the "local hooks are fast/staged-only, CI is exhaustive/authoritative" split documented by multiple sources above |

## CD Pattern Decision (Directly Answers the Milestone's Open Design Question)

Research strongly converges on: **for a Next.js app, prefer the hosting platform's native Git integration (e.g. Vercel's GitHub App) for the actual deploy, and let GitHub Actions own only CI (lint/typecheck/test/build) plus, if a separate production Postgres needs schema sync, a `prisma migrate deploy` step.**

- Running a hand-rolled GitHub Actions deploy step *and* leaving the host's native auto-deploy-on-push enabled at the same time is a confirmed, named anti-pattern (duplicate builds, race conditions) — multiple sources agree the fix is to explicitly disable one side (e.g., Vercel's `ignoreCommand` in `vercel.json`, or disabling GitHub Actions deploy in favor of the host).
- Actions-driven deploy is legitimate specifically when you need "full control over the CI/CD pipeline" or are on GitHub Enterprise Server without native Git integration access — neither applies to a solo GitHub.com portfolio repo, so it's not the right default here.
- **Recommendation for this project:** if the chosen host (per the separate hosting-platform research) has first-class Next.js Git integration (Vercel is the most likely candidate given Next.js is built by Vercel), use that for the actual "auto-deploy on merge to main" mechanism, and scope the GitHub Actions workflow to CI checks + the `prisma migrate deploy` step (run before or alongside the platform's build, via a documented ordering — e.g., a build hook or a dedicated Actions job gated on CI passing). This satisfies PROJECT.md's "CD means real auto-deploy on merge to main" requirement (the deploy is still automatic and still triggered by the merge) while avoiding the redundant-deploy-step anti-pattern.
- If the chosen host instead has weak/no native Git integration, a GitHub Actions deploy job becomes the correct (not redundant) choice — this is a genuine either/or decision to make once the hosting platform is selected, not a "always add both" default.

## Feature Dependencies

```
GitHub Actions CI (lint+typecheck+test+build)
    └──requires──> existing npm scripts (lint, typecheck, test, build) — already present, zero new tooling

Branch protection (required status checks)
    └──requires──> GitHub Actions CI workflow existing and passing at least once

README CI badge
    └──requires──> GitHub Actions CI workflow committed with a stable workflow file name/path

CD (auto-deploy on merge to main)
    └──requires──> hosting platform + production Postgres provider selected (separate research track)
    └──requires──> GitHub Actions CI passing (deploy should be gated on CI, not parallel/independent)

prisma migrate deploy (production schema sync)
    └──requires──> production DATABASE_URL stored as a CI/host secret
    └──requires──> CD mechanism decided (runs inside whichever pipeline owns the deploy — Actions job or host build hook)

/api/health endpoint
    └──requires──> production DB connection configured (it's checking that exact connection)
    └──enhances──> CD confidence (a post-deploy smoke check a reviewer or you can hit manually)

Husky + lint-staged pre-commit hook
    └──requires──> existing ESLint config (already present) — no new lint rules needed
    └──conflicts with──> stuffing full typecheck/test suite into the same hook (see anti-features)

CONTRIBUTING.md
    └──enhances──> README (should link out to it, not duplicate its content)
    └──requires──> Husky/lint-staged setup decided (CONTRIBUTING should document the actual hook behavior, not an aspirational one)
```

### Dependency Notes

- **CD requires hosting platform selection first:** the CD mechanism (host-native Git integration vs. Actions-driven deploy) cannot be locked until the host is chosen — this is explicitly a research-then-decide item per PROJECT.md's locked decision ("hosting platform and Postgres provider are not pre-decided").
- **`prisma migrate deploy` requires CD mechanism decided:** whether this step lives inside a GitHub Actions job or a host build-hook/command depends on which side owns the deploy trigger.
- **CONTRIBUTING.md should be written after (or alongside) Husky/lint-staged, not before:** documenting hook behavior that doesn't match the shipped hook is worse than no documentation — sequence this file's pre-commit section last among the milestone's phases, or plan to revisit it once hooks are final.
- **Branch protection conflicts with nothing but must not be skipped:** it's the one item on the table-stakes list that's pure GitHub configuration (no code, no PR) — worth calling out explicitly in the roadmap/requirements so it isn't silently dropped as "not a coding task."

## CONTRIBUTING.md Table-Stakes Section Breakdown

For a solo-authored-but-portfolio-quality repo, the file should be genuine (matches what actually happens in this repo) rather than a generic open-source boilerplate copy. Recommended sections, in order:

1. **Intro/welcome** — one or two sentences: what this project is, that it's a portfolio project with a single maintainer, and what kind of contributions are realistically welcome (bug reports, small fixes, discussion — not large feature PRs from strangers, given the locked scope-discipline constraint in PROJECT.md)
2. **Development environment setup** — link to README's existing setup instructions rather than duplicating them; add anything CONTRIBUTING-specific (e.g. how to get a local Postgres instance running against Prisma migrations)
3. **Running checks locally** — the exact commands (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) a contributor should run before opening a PR — these are the same commands CI runs, stated explicitly so the loop is legible
4. **Pre-commit hook behavior** — a short, accurate paragraph on what Husky/lint-staged actually does on `git commit` (which files, which checks) — written to match what's actually configured, not aspirational
5. **Branch and commit conventions** — restates PROJECT.md's existing constraint ("feature branches, small logical conventional commits") so it's discoverable without reading internal planning docs
6. **PR expectations** — what CI must pass before merge (branch protection), and an honest note on response time given single-maintainer reality (e.g. "reviewed on a best-effort basis")
7. **Code style / architecture boundaries** — a pointer to the `src/domain/` architectural boundary (lint-enforced per v1.2) so a contributor understands the DDD-lite separation before touching domain code
8. **Reporting bugs / requesting features** — standard GitHub issue-template pointer, kept lightweight

## MVP Definition

### Launch With (v1.3 — this milestone)

Minimum viable CI/CD signal for a portfolio DevOps showcase — everything here maps directly to PROJECT.md's stated target features.

- [ ] GitHub Actions CI: lint + typecheck + test + build on PR + push-to-main, with branch protection requiring it — this IS the "CI exists and is enforced" signal
- [ ] README CI status badge — near-zero cost, universally expected
- [ ] CD: auto-deploy to production on merge to `main`, via whichever mechanism (host-native or Actions) fits the selected hosting platform, with the redundant-dual-deploy anti-pattern explicitly avoided
- [ ] `prisma migrate deploy` wired into the deploy path against the production Postgres instance
- [ ] A minimal `/api/health` endpoint doing a real DB connectivity check — the honest, low-cost "is it actually working" signal for a live-linked portfolio deployment
- [ ] Husky + lint-staged pre-commit hook (ESLint on staged files) — reuses existing lint config
- [ ] `CONTRIBUTING.md` covering: intro/welcome, dev environment setup (link to README if duplicated), how to run tests/lint/typecheck locally, branch/commit conventions (matches PROJECT.md's existing "feature branches, small logical conventional commits" constraint), PR expectations, and a note on the pre-commit hook behavior

### Add After Validation (not required for milestone completion, cheap to add if time allows)

- [ ] Dependabot config for `npm` ecosystem — one file, GitHub-native, no custom code
- [ ] `npm audit` as a non-blocking, report-only CI step
- [ ] A short ADR entry documenting the CD mechanism decision (host-native vs. Actions) and why

### Future Consideration (explicitly out of scope — do not build this milestone)

- [ ] Staging environment / multi-env promotion pipeline — no team, no real users, no canary need at this scale
- [ ] Kubernetes / Docker orchestration — no multi-service or scaling problem this solves
- [ ] Blue-green/canary/traffic-shifting deploys — de-risking infra for traffic patterns this portfolio app doesn't have
- [ ] Dedicated secrets-management system (Vault, etc.) — GitHub Actions secrets + host env vars are sufficient for ~2-3 credentials
- [ ] Custom observability stack (Grafana/Prometheus) — the host's own deployment logs + `/api/health` cover this scope
- [ ] Matrix build strategy across Node versions/OSes — single deployment target, no multi-environment consumer audience

## Feature Prioritization Matrix

| Feature | Reviewer-Signal Value | Implementation Cost | Priority |
|---------|------------------------|----------------------|----------|
| GitHub Actions CI (lint/typecheck/test/build) + branch protection | HIGH | LOW | P1 |
| README CI badge | MEDIUM | LOW | P1 |
| CD auto-deploy on merge to main | HIGH | LOW–MEDIUM (depends on host choice) | P1 |
| `prisma migrate deploy` in deploy path | HIGH (backs the "real production DB" claim) | MEDIUM | P1 |
| `/api/health` endpoint | MEDIUM | LOW | P1 |
| Husky + lint-staged | MEDIUM | LOW | P1 |
| `CONTRIBUTING.md` | MEDIUM | LOW | P1 |
| Dependabot | LOW–MEDIUM | LOW | P2 |
| `npm audit` (non-blocking) | LOW | LOW | P2 |
| CD-decision ADR entry | MEDIUM (judgment signal) | LOW | P2 |
| Staging environment, k8s, canary, secrets manager, observability stack | NEGATIVE (reads as overengineering) | HIGH | Do not build |

**Priority key:**
- P1: Must have for this milestone's stated goal
- P2: Should have, low-cost polish if time allows
- Do not build: explicitly flagged anti-features for this project's scope

## Sources

- [GitHub Docs: Adding a workflow status badge](https://docs.github.com/en/actions/how-tos/monitor-workflows/add-a-status-badge) — HIGH confidence, official docs, badge syntax and branch-scoping confirmed
- [Vercel Knowledge Base: How can I use GitHub Actions with Vercel?](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel) — HIGH confidence, official Vercel documentation on when Actions-driven deploy is/isn't appropriate alongside native Git integration
- [Vercel Docs: Deploying GitHub Projects with Vercel](https://vercel.com/docs/git/vercel-for-github) — HIGH confidence, official docs on native Git integration behavior
- [The perfect Vercel + GitHub Actions deployment pipeline — Aaron Francis](https://aaronfrancis.com/2021/the-perfect-vercel-github-actions-deployment-pipeline-faa0d4ac) — MEDIUM confidence, single well-regarded community source, cross-checked against Vercel's own docs on the redundancy/`ignoreCommand` pattern
- [Prisma Docs: Deploying database changes with Prisma Migrate](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate) — HIGH confidence, official Prisma documentation, `migrate deploy` CI/CD pattern and advisory-locking behavior
- [Prisma Docs: Development and production workflows](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) — HIGH confidence, official docs
- [prisma/prisma GitHub Discussion #11131: Prisma Migrate and CI/CD](https://github.com/prisma/prisma/discussions/11131) — MEDIUM confidence, first-party repo discussion, corroborates official docs pattern
- [Better Stack: Prevent Bad Commits with Husky and lint-staged](https://betterstack.com/community/guides/scaling-nodejs/husky-and-lint-staged/) — MEDIUM-HIGH confidence, detailed community guide, consistent with multiple other sources on pre-commit/CI division
- [Furkan Baytekin: Pre-Commit Hooks — Husky vs Native Git Hooks](https://furkanbaytekin.dev/blogs/pre-commit-hooks-husky-vs-native-git-hooks-for-clean-commits) — MEDIUM confidence, corroborates the "keep pre-commit fast/staged-only" consensus
- [Contributing.md: How to Build a CONTRIBUTING.md - Best Practices](https://contributing.md/how-to-build-contributing-md/) — MEDIUM confidence, widely-cited community reference for CONTRIBUTING.md structure
- [The Good Docs Project: About the Contributing Guide Template](https://www.thegooddocsproject.dev/template/contributing-guide) — MEDIUM-HIGH confidence, structured open-source documentation template project
- [Nurbak: Next.js Health Check — Complete Guide to /api/health](https://nurbak.com/en/blog/how-to-add-health-checks-nextjs-app/) — MEDIUM confidence, single source but internally consistent (200/503, no-cache, SELECT 1 pattern) with general health-check conventions across other sources
- [DEV Community / FullStackData Solutions: How to Add TypeCheck, Lint, Tests, and Build to Every PR with Husky and GitHub Actions](https://fullstackdatasolutions.com/blog/artificial-intelligence/cicd-pr-pipeline) — MEDIUM confidence, corroborates the standard lint+typecheck+test+build CI shape
- Existing `package.json` (read directly from repo) — HIGH confidence, ground truth for already-present `lint`/`typecheck`/`test`/`build` scripts this CI pipeline wires up
- `.planning/PROJECT.md` — HIGH confidence, ground truth for locked scope, locked CD definition, and existing carried-forward requirement IDs (CI-01, HOOKS-01, DOCS-CONTRIB-01)

---
*Feature research for: CI/CD, pre-commit hooks, and deployment for a portfolio full-stack project (v1.3 milestone)*
*Researched: 2026-07-20*
