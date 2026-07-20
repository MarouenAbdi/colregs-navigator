# Pitfalls Research

**Domain:** Adding GitHub Actions CI/CD, Husky/lint-staged pre-commit hooks, and a first-ever live deployment (first-ever production Postgres) to an existing Next.js 16 / React 19 / tRPC 11 / Prisma 7 / TypeScript 7 (tsgo) app
**Researched:** 2026-07-20
**Confidence:** HIGH for Prisma 7 driver-adapter/pooling behavior and Husky `prepare`-script mechanics (verified against current Prisma docs + multiple community sources); MEDIUM for hosting-provider free-tier specifics (fast-moving pricing/limits, cross-checked across 2-3 sources); MEDIUM for GitHub Actions caching/forked-PR-secrets mechanics (official GitHub docs language + community confirmation)

## Critical Pitfalls

### Pitfall 1: `generated/prisma` client is never regenerated in CI or on the host, so build/test fails on a fresh checkout

**What goes wrong:**
This project's `prisma/schema.prisma` uses the Prisma 7 `prisma-client` generator with an explicit `output = "../generated/prisma"`, and `generated/` is gitignored (confirmed in `.gitignore` line 7). Locally this works because someone has already run `prisma generate` at some point in the checkout's history. A brand-new GitHub Actions runner, or a brand-new deployment host build, starts from a clean clone with **no `generated/prisma` directory at all** — every import of the Prisma client fails to resolve, and `tsc --noEmit`, `vitest run`, and `next build --webpack` all fail immediately, before any of this milestone's actual CI/CD logic is even exercised.

**Why it happens:**
Prisma 7 changed the default from "generate into `node_modules/.prisma/client` automatically on `npm install`" to "generate into an explicit `output` path only when `prisma generate` is run." There is currently no `postinstall` script in `package.json` that runs `prisma generate` — this was never needed before because local dev machines always had a stale-but-present `generated/` folder from manual `npx prisma generate` runs during feature work. CI/deploy is the first environment where that assumption breaks.

**How to avoid:**
Add an explicit `prisma generate` step immediately after `npm ci` in every CI job (lint/typecheck/test/build) and as (or before) the build command on the hosting platform. Prisma's own Vercel deployment guidance recommends wiring this via a `postinstall` script (`"postinstall": "prisma generate"`) precisely so it runs automatically after any `npm install`/`npm ci`, in any environment, without each CI job or host build command needing to remember it separately.

**Warning signs:**
`Cannot find module '../generated/prisma'` or similar resolution errors in a CI log that never appear locally; a CI job that passes `npm ci` but fails at the very first `tsc`/`vitest`/`next build` step with an import-resolution error rather than a real type/test/lint failure.

**Phase to address:** CI setup phase (add `postinstall` script + explicit `prisma generate` CI step before any other check) — this must be fixed before *any* other CI check can even run, so it blocks the whole phase, not just the build job.

---

### Pitfall 2: Prisma driver-adapter connection pool exhausts the DB under serverless concurrency — and the old `?connection_limit=` URL-param fix doesn't apply

**What goes wrong:**
This is the single most common Prisma-on-serverless failure mode: each serverless function invocation (cold or warm-but-new-container) can end up opening its own pool of DB connections; under any real concurrent traffic (or even a burst of preview-deploy traffic hitting a low-connection-limit free-tier DB), the DB's total connection limit is exhausted and requests start failing/timing out with pool-timeout errors. This project is at *elevated* risk here specifically because it already locked in `@prisma/adapter-pg` (driver adapters), and most existing "fix Prisma+Vercel pooling" advice on the internet (`DATABASE_URL?connection_limit=5&pool_timeout=10`) is written for the pre-v7 Rust query-engine model — **those URL query params do nothing for a driver-adapter setup.**

**Why it happens:**
Since Prisma ORM v7, relational datasources instantiate Prisma Client via driver adapters by default, and pool sizing is entirely delegated to the underlying Node driver (here, `pg`'s `Pool`) — configured via adapter constructor options like `max`/`connectionTimeoutMillis`/`idleTimeoutMillis`, not connection-string parameters. If the codebase (or whoever wires up the Prisma client for deployment) copies an old Stack Overflow answer's `?connection_limit=1` into the connection string, it will silently be ignored, giving false confidence that pooling is "handled."

**How to avoid:**
- Instantiate a single `PrismaPg` adapter + `PrismaClient` at module scope (not per-request/per-handler) so warm invocations reuse the same client — this project's existing `src/server/db/` Prisma client singleton pattern should already do this; verify it during the deployment phase rather than assuming it carries over unchanged to a serverless host.
- Explicitly set a small `max` pool size on the `pg.Pool`/`PrismaPg` adapter options (e.g. `max: 3-5` for a free-tier DB with a low total connection ceiling), since the driver's own default (`10`) multiplied across several concurrently-warm function instances can still exhaust a small free-tier limit.
- If the chosen host is Vercel with Fluid Compute, use `@vercel/functions`' `attachDatabasePool(pool)` paired with the `pg.Pool` instance so idle connections are released before a suspended function's container is frozen — this is the officially documented pattern for driver-adapter + Fluid Compute and is not something you'd discover from older Prisma+Vercel blog posts.
- Prefer a DB provider with its own serverless-aware pooling (Neon's pooled connection string, or Supabase's Supavisor/PgBouncer-fronted connection string) over a bare unpooled Postgres connection string for the app's runtime `DATABASE_URL`.

**Warning signs:**
Intermittent `Timed out fetching a new connection from the pool` errors that only appear under concurrent load or after a deploy-preview burst, never in local single-request dev testing; DB provider dashboard showing connections near/at its cap during otherwise-low traffic.

**Phase to address:** Deployment phase (DB/hosting setup) — must be resolved before the "first live deployment" is considered done, since this is exactly the kind of bug that looks fine in a solo demo click-through and then fails the first time an interviewer or crawler generates a few concurrent requests.

---

### Pitfall 3: Running `prisma migrate deploy` unsafely against the first-ever production DB (or using `db push`/`migrate dev` by mistake)

**What goes wrong:**
Because this is the DB's first-ever production deployment, there's no established "safe migration ritual" yet, and it's easy to reach for the wrong command: `prisma migrate dev` (interactive, can reset/drop data, meant for local dev only) or `prisma db push` (schema-sync without a migration history) run against the real prod `DATABASE_URL` by accident — either during manual first-setup or because a CI script copy-pastes the wrong Prisma command. `migrate deploy` itself is also unsafe if the wrong `DATABASE_URL` is in scope (e.g., a CI secret accidentally pointing at prod during a PR/preview run rather than only on merge-to-main).

**Why it happens:**
Local development up to this point has only ever used `migrate dev` against a disposable local/test Postgres (per this milestone's own framing: "the DB has never run against a real hosted Postgres before"). The muscle memory from local dev is `migrate dev`, and the mental model of "which DB does this command talk to right now" has never had real stakes before.

**How to avoid:**
- Decouple migrations from the app build/deploy: run `prisma migrate deploy` as its own explicit CI/CD step (only on `main`, only with the production `DATABASE_URL` secret in scope) *before* triggering the build/deploy — if the migration step fails, the deploy should not proceed with an app build that expects a schema the DB doesn't yet have. Prisma's own CI/CD guidance is explicit that `migrate deploy` "should generally be part of an automated CI/CD pipeline" and recommends *not* running it locally against production at all.
- Never wire `migrate dev` or `db push` into any CI/CD job — only `migrate deploy` should ever run outside a developer's local machine.
- Use separate `DATABASE_URL` values per environment (CI/test DB, preview-deploy DB if the host supports branch/preview DBs, production DB), gated by GitHub Environments so the production secret is literally not resolvable from a PR-triggered job — only from a job restricted to the `main`-branch deployment environment.

**Warning signs:**
A migration step that runs on every PR (not just on merge to `main`); a single `DATABASE_URL` secret used identically across all workflow triggers with no environment scoping; any script invoking `prisma db push` or `prisma migrate dev` outside a local `npm run` context.

**Phase to address:** Deployment phase — the exact migration command and its trigger conditions should be a named requirement/check in this phase, not an implicit assumption.

---

### Pitfall 4: `next.config.ts`'s webpack/tsgo workarounds behave differently (or aren't honored at all) on the hosting platform's build environment than in local `next build --webpack`

**What goes wrong:**
This project already has direct, recent precedent for exactly this failure class: Turbopack silently didn't support `resolve.extensionAlias`, and the dev server had never been run end-to-end until Phase 5 of a prior milestone, so the gap went undetected for four completed phases. The same risk now applies to the **hosting platform's build pipeline**, which is the next environment that has never actually run this app's exact build command end-to-end. Concretely: (a) some hosting platforms auto-detect Next.js and may run their own inferred build command (e.g. plain `next build`) instead of respecting a custom `"build": "next build --webpack"` script if the platform's framework preset overrides it; (b) `typescript.ignoreBuildErrors: true` in `next.config.ts` was set specifically because Next 16.2.10's *internal* type-checker crashes against tsgo's Program-API shape — if the host's build step re-enables or duplicates that internal check (e.g. via a platform-specific "type check" toggle separate from the Next build itself), the exact same crash could resurface on the host even though `npm run build` passes locally; (c) the `resolve.extensionAlias`/`@` webpack-alias fixes are `next.config.ts`-level, so they travel with the repo — but only if the host actually invokes `next build --webpack` (or plain `next build`, since webpack is the default builder when Turbopack isn't explicitly requested) rather than some custom build wrapper that bypasses `next.config.ts` webpack customization entirely.

**Why it happens:**
"Build succeeds locally" and "build succeeds on the host" are different claims until proven otherwise — hosting platforms often have framework-specific auto-detection, their own Node version defaults, and sometimes their own opinionated build/type-check steps layered on top of (or instead of) the project's own `package.json` scripts. This project's specific tsgo/webpack workarounds are narrow, deliberate, two-file fixes — exactly the kind of thing that's easy to silently bypass with a platform default.

**How to avoid:**
- Explicitly configure the hosting platform to run this project's own `npm run build` script (`next build --webpack`), not an auto-inferred `next build` — verify in the platform's project settings, don't trust framework auto-detection.
- Do a full, real first deploy (not just "build passes in a CI job") as an explicit phase gate before calling the deployment phase done — mirroring the "the dev server had never actually been run end-to-end" lesson: run the actual production build against the actual host, not just a local simulation of it.
- If the chosen host offers a "type checking" or "lint on build" toggle separate from the Next.js build itself, explicitly disable it or confirm it uses `npx tsc --noEmit` (which works against tsgo) rather than Next's own internal Program-API check (which doesn't).
- Pin the Node.js major version the host uses (via `.nvmrc` / `package.json` `engines.node` / host-specific Node-version setting) to the same version used locally and in CI, since `next.config.ts`'s `import.meta.dirname` usage and other modern syntax choices are Node-version-sensitive.

**Warning signs:**
A CI build step (running in a container) passes, but the actual hosted deploy fails or serves a broken page — the two are not the same test; any hosting-platform build log showing a build command different from the repo's own `npm run build`.

**Phase to address:** Deployment phase — should be an explicit checklist item ("hosting platform build command matches `package.json` `build` script exactly, verified in platform settings, not assumed from auto-detection") before the deployment phase is considered complete.

---

### Pitfall 5: No pinned Node.js version anywhere in the repo — local, CI, and host can silently drift

**What goes wrong:**
There is currently no `.nvmrc` and no `engines` field in `package.json`. Local development is on Node v22.23.1 (confirmed). Without an explicit pin, a GitHub Actions `actions/setup-node` step can default to whatever version is specified in the workflow YAML (easy to pick an LTS version that isn't actually what's used locally), and the hosting platform can independently default to its own platform-wide Node version. Given this project's locked TypeScript 7.0.2 (tsgo, a very new native-compiler release) and Next.js 16.2.10/React 19.2.7 (all recent majors), a Node version mismatch is more likely than usual to surface as a real incompatibility (native `fetch`/`Intl`/ESM behavior differences), not just a theoretical risk.

**Why it happens:**
Single-developer local-only projects never need to communicate "which Node version" to anyone else — the .nvmrc/engines-field discipline only starts paying for itself once a second environment (CI, host) enters the picture, which is exactly what this milestone introduces for the first time.

**How to avoid:**
Add a `.nvmrc` (or `engines.node` in `package.json`) pinning the exact major version used locally, and reference it from the GitHub Actions workflow via `actions/setup-node`'s `node-version-file` input so CI reads the same source of truth instead of a separately-hardcoded version number in the YAML. Set the hosting platform's Node version setting to match the same value explicitly (most platforms let you override framework-detected Node version).

**Warning signs:**
CI workflow YAML has a Node version hardcoded that doesn't match any file in the repo; a "works locally, fails in CI" bug that turns out to be Node-version-related rather than code-related.

**Phase to address:** CI setup phase (add `.nvmrc`/`engines` + wire `setup-node` to read it) — should be one of the first things fixed, since every other CI job (lint/typecheck/test/build) depends on the runner having the right Node version.

---

### Pitfall 6: macOS-local vs Linux-CI/Linux-host native-binary or optional-dependency mismatches

**What goes wrong:**
Local development is on macOS (Darwin); GitHub Actions' standard runners and virtually all Node hosting platforms are Linux. Packages with platform-specific native/optional binaries — most relevantly here, Next.js's SWC compiler (`@next/swc-*` platform packages installed as `optionalDependencies`) — can produce a `package-lock.json` whose resolved/locked entries were generated on macOS and don't include the Linux-specific optional package, or vice versa. If this ever happens, `npm ci` on the Linux CI runner (or Linux host) either fails to install the right SWC binary or silently proceeds and Next.js then fails with "Failed to load SWC binary for linux/x64" at build/dev time — a real, well-documented Next.js failure mode, not a hypothetical one. Note: Prisma 7's move to a WASM-based query engine plus mandatory driver adapters removes most of the historical Prisma-binary-target cross-platform pain this pitfall used to also cover — this concern is now primarily about Next.js/SWC and any other native-binary devDependency, not Prisma itself.

**How to avoid:**
- Always run `npm ci` (not `npm install`) in CI and on the host build, which respects the committed lockfile's platform-specific optional dependency entries rather than re-resolving them.
- Regenerate/commit `package-lock.json` after any dependency change using a clean `npm install` (not `npm ci`, which never rewrites the lock) so the lockfile reflects current registry state across platforms — npm's lockfile format is designed to record entries for multiple platforms' optional dependencies, but only if the lockfile was generated (not just installed-from) recently enough to include them.
- If a Linux CI/build ever reports a missing SWC binary despite a clean `npm ci`, the documented fix is a forced clean reinstall (`rm -rf node_modules package-lock.json && npm install`) to let npm re-resolve all platform variants, followed by committing the regenerated lockfile.

**Warning signs:**
"Failed to load SWC binary for linux/x64" (or similar) appearing only in CI/host logs, never locally; a CI job that fails at `npm ci` install time with a missing-optional-dependency warning rather than failing on any actual project code.

**Phase to address:** CI setup phase — should be caught the very first time the CI workflow is stood up and run against a real PR, since this failure mode manifests immediately at `npm ci`, before any lint/typecheck/test/build step even starts.

---

### Pitfall 7: Husky hooks silently don't run for anyone who clones fresh (missing `prepare` script), giving false confidence that pre-commit checks are enforced

**What goes wrong:**
Husky v9+ (the current major) relies entirely on a `"prepare": "husky"` script in `package.json` running automatically on `npm install`/`npm ci` to (re-)register Git's `core.hooksPath` pointing at `.husky/`. If that `prepare` script is missing, misconfigured, or the hook files themselves lack the executable bit (common with certain clone/OS combinations), a fresh clone will have hooks that simply never fire — `git commit` proceeds normally with zero indication anything is wrong. This is a "looks done but isn't" trap: it works perfectly for whoever set it up locally (their `.git/hooks` was already correctly wired from the initial `husky init`) but silently fails to reproduce for a fresh clone, CI checkout, or a collaborator.

**Why it happens:**
Husky's hook-registration mechanism only re-runs as a side effect of `npm install`, not as a persistent, version-controlled Git setting that survives a fresh clone by default — the `prepare` script is the only thing that re-establishes it, and it's easy to test "does the hook run" only on the machine where it was originally set up (which never re-triggers `prepare` because `node_modules` is already present and `npm install` may be skipped if nothing changed).

**How to avoid:**
- Confirm `"prepare": "husky"` is present in `package.json` `scripts` and verify it by actually testing the "fresh clone" path: clone the repo into a new directory (or a scratch worktree), run `npm ci`, and confirm `git config core.hooksPath` returns `.husky` and that hook files under `.husky/` are executable (`ls -l .husky/`).
- Since this is a single-repo project (not a monorepo/subdirectory setup), the "Husky must be installed relative to the repo root" gotcha doesn't apply here, but is worth a one-line note in `CONTRIBUTING.md` regardless, since a contributor could still clone into an unusual location.
- Do not rely on "it worked when I set it up" as sufficient verification — that only proves the hook mechanism works on a machine that never re-ran install from scratch.

**Warning signs:**
A commit with an obvious lint violation (e.g. deliberately reintroduce a Tailwind deprecated class name) gets committed with no pre-commit output at all on a *freshly cloned* copy of the repo; `git config core.hooksPath` returning empty on a fresh clone.

**Phase to address:** Pre-commit hooks phase — the phase's own success criteria should explicitly include a fresh-clone verification step, not just "hooks work on my already-set-up machine."

---

### Pitfall 8: GitHub Actions secrets (including `DATABASE_URL`) are unavailable to workflow runs triggered by forked-repo pull requests

**What goes wrong:**
If the CI workflow is triggered on `pull_request` (the standard, safe trigger) and any job needs a secret (e.g., a test/preview `DATABASE_URL`, or a deployment token), that secret is simply not resolvable for any PR opened from a fork — this is intentional GitHub security behavior, not a bug, but it surprises teams the first time an external contributor (or even the repo owner testing via a fork) opens a PR and a secret-dependent CI job fails or silently skips. For a solo-maintained portfolio repo this is lower-risk in practice (most PRs will come from branches within the same repo, which do have secret access), but it's worth designing around deliberately rather than discovering it only if/when an external contributor's PR CI run mysteriously fails at the DB-dependent test step.

**How to avoid:**
- Keep the CI trigger as plain `pull_request` (not `pull_request_target`) — `pull_request_target` grants secret access to untrusted fork code and is explicitly discouraged by GitHub except behind very careful safeguards (checking out only the base ref, never the PR's HEAD).
- If any CI job genuinely needs a real `DATABASE_URL` (e.g., an integration-test job against a live-shaped schema), prefer spinning up an ephemeral Postgres **service container** within the workflow itself (GitHub Actions' built-in `services:` Postgres container) for that job, rather than depending on a stored secret pointing at any hosted DB — this sidesteps the forked-PR-secrets problem entirely for CI (as opposed to deployment, which only ever runs on `main` and never needs to handle untrusted fork code).
- Scope any deployment-related secrets (host API tokens, production `DATABASE_URL`) to a GitHub *Environment* restricted to the `main` branch, so they're categorically unavailable to any PR-triggered job regardless of fork status.

**Warning signs:**
A CI job that references `secrets.DATABASE_URL` (or similar) directly in a `pull_request`-triggered job with no fallback; unexplained CI failures specifically on PRs from forks that pass identically on same-repo branches.

**Phase to address:** CI setup phase — decide the CI Postgres strategy (ephemeral service container vs. hosted secret) up front, since it determines whether this pitfall is even reachable.

---

### Pitfall 9: `.env` accidentally committed with a real production `DATABASE_URL`

**What goes wrong:**
The moment a real, live, credentialed production `DATABASE_URL` exists (this milestone's "first-ever production Postgres"), the cost of an accidental `.env` commit goes from "annoying" to "a real credential leak requiring rotation." Current state check: `.env` is already correctly listed in `.gitignore` and is not tracked (`git ls-files` confirms only `.env.example` is tracked, not `.env`) — good baseline — but this protection is per-repo-clone/per-machine `.gitignore` awareness, not enforced. A `git add -A`/`git add .` habit, or copy-pasting the finished production `.env` into a new file that isn't yet gitignore-covered (e.g. `.env.production`, `.env.local` if that pattern isn't also ignored), can still leak it.

**How to avoid:**
- Confirm `.gitignore` covers every env-file variant actually in use, not just bare `.env` (check for `.env.local`, `.env.production`, `.env*.local` depending on what naming convention the deployment platform expects — e.g., Vercel-style platforms typically want secrets set via their dashboard/CLI, not a committed file at all).
- Add a lint-staged/pre-commit check (or a lightweight CI step) that fails if any staged/tracked file matching `.env*` (excluding `.env.example`) is ever added — this belongs naturally in the pre-commit hooks phase as a cheap, high-value addition alongside the lint-staged config.
- Never paste the real production connection string into any committed file, including README examples, ADRs, or CONTRIBUTING.md — use placeholder values there, matching the existing `.env.example` pattern.

**Warning signs:**
`git status` showing `.env` (not `.env.example`) as staged or tracked at any point; a repo-wide `git log -p -- .env` (if ever accidentally tracked historically) showing real credentials in history, which would require secret rotation, not just a follow-up commit removing the file (removing it in a later commit does not erase it from history).

**Phase to address:** Pre-commit hooks phase (add the env-file guard rule) and deployment phase (confirm the chosen host's actual secrets-injection mechanism, e.g. dashboard-configured env vars, not a committed file).

---

### Pitfall 10: First-deploy environment-variable misconfiguration — `NEXT_PUBLIC_*` baked in at build time, server-only vars silently `undefined`

**What goes wrong:**
Next.js inlines every `NEXT_PUBLIC_*` variable into the client JS bundle **at build time** — if the hosting platform's dashboard env vars aren't set (or aren't set for the right environment: production vs. preview) *before* the build runs, the value frozen into the bundle is `undefined`, and no amount of setting the variable afterward fixes an already-built bundle — a redeploy/rebuild is required. Separately, server-only env vars (no `NEXT_PUBLIC_` prefix, e.g. `DATABASE_URL` for tRPC server-side procedures) are correctly *not* bundled into client JS, but if they're missing from the host's server runtime environment (as opposed to only being present in a local `.env`), any tRPC procedure touching Prisma fails at request time with a config/connection error that never surfaces during local `npm run dev`.

**How to avoid:**
- Before the first production build on the host, set every environment variable the app needs (both `NEXT_PUBLIC_*` and server-only) directly in the hosting platform's environment-variable configuration for the Production environment — do not assume `.env`/`.env.example` values carry over automatically; they don't, by design (these files are typically gitignored specifically so they can't).
- After first deploy, if any `NEXT_PUBLIC_*` variable needs to change, trigger an explicit rebuild — don't just update the dashboard value and expect the already-built static bundle to pick it up.
- Treat `.env.example` as the single source of truth for "which variables must exist," and add a lightweight startup/CI check (or just a manual checklist item in the deployment phase) cross-referencing it against what's actually configured on the host before calling first deploy complete.

**Warning signs:**
The deployed app loads but a client-visible value (e.g. any public API base URL, feature flag) shows as blank/undefined despite being correct in `.env.example`; a tRPC mutation/query that works in local dev throws a generic 500 on the live deploy with no local repro.

**Phase to address:** Deployment phase — should be an explicit pre-go-live checklist step ("every var in `.env.example` is configured on the host for the Production environment, confirmed via a real deployed request, not just a build log").

---

### Pitfall 11: Free-tier DB auto-suspend compounding with serverless cold starts on a low-traffic portfolio demo

**What goes wrong:**
Both Neon and Supabase's free tiers aggressively suspend/pause idle compute to control cost — Neon can suspend as short as 5 minutes of inactivity (resuming in well under a second on the next query, per Neon's own documentation), while Supabase's free-tier *project* pauses entirely after 7 days of no activity and requires the query to trigger a wake-up that can take noticeably longer than Neon's resume. Layered on top of Vercel's own function cold starts (and the Hobby tier's 10-second execution ceiling), a portfolio project that an interviewer visits after it's sat untouched for days can hit a "slow or apparently-broken first load" on the exact occasion that matters most — the very first click.

**How to avoid:**
- Prefer a DB provider whose free-tier suspend behavior resumes fast and transparently on the next query (Neon's model) over one that fully pauses the project after longer idle windows (Supabase's model), given this project's actual usage pattern (sporadic portfolio visits, not continuous traffic) — this is a concrete, project-specific reason to weigh provider choice, not just "pick whichever free tier."
- Whatever provider is chosen, budget for the resume latency explicitly in the deployment phase's own testing: test the live deploy after a real multi-hour/overnight idle period (not just immediately after setup, when the DB compute is already warm) before considering the deployment "demo-ready."
- If the resume latency proves noticeable in practice, consider a scheduled low-frequency keep-alive (e.g., a GitHub Actions cron hitting a lightweight health-check endpoint every few hours) — but weigh this against free-tier usage-hour budgets (Neon's free tier is metered in compute-hours, not just storage) before adding it, since an aggressive keep-alive could itself burn through the free allowance.

**Warning signs:**
The very first request after a long idle period taking multiple seconds (versus subsequent requests being fast) during manual testing; any DB provider dashboard showing "compute suspended"/"project paused" status that wasn't verified against actual demo-visit patterns.

**Phase to address:** Deployment phase (provider selection sub-step) — this is exactly the kind of thing the milestone's own "research phase compares options before the user picks" locked decision should weigh, not something to discover after the DB is already chosen.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|--------------------|-----------------|------------------|
| Running `prisma db push` once to "just get the prod schema in place quickly" instead of `migrate deploy` from committed migrations | Faster first-time setup, skips writing/reviewing a migration | No migration history for the prod DB going forward; the next real schema change has no clean baseline to `migrate deploy` against | Never — even for a first-ever prod DB, apply the existing committed migrations (`20260717125040_init`, `20260719100808_add_curated_title_and_rule_label`) via `migrate deploy` so history starts correctly from day one |
| Skipping a CI Postgres service container and instead pointing CI tests at the real hosted dev/prod DB via a stored secret | Avoids configuring a `services:` block | Forked-PR secret unavailability (Pitfall 8), risk of CI tests writing to a real DB, slower CI (network hop vs. local container) | Never for this project's scale — a Postgres service container is nearly free to add and removes an entire pitfall class |
| Leaving `typescript.ignoreBuildErrors: true` in `next.config.ts` without re-verifying `npm run typecheck` is wired as its own separate, mandatory CI gate | Saves re-deriving the existing, already-understood workaround | If the CI workflow is built without carrying `npm run typecheck` forward as a required job, real type errors could ship to production silently, since Next's own build no longer catches them | Never — this flag already exists specifically because a different check (`tsc --noEmit`) is the authoritative one; CI must actually run that check |
| Hardcoding the CI Node version in workflow YAML rather than adding `.nvmrc`/`engines` first | One less file to add before CI works | Local/CI/host Node version drift becomes invisible and only surfaces as a mysterious future failure | Acceptable only as a very short-lived first draft, immediately followed up with the `.nvmrc`/`node-version-file` fix in the same phase |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Prisma 7 + `@prisma/adapter-pg` on a serverless host | Copying old `?connection_limit=N` DATABASE_URL query-param advice, which driver adapters ignore | Configure pool size via the `pg.Pool`/`PrismaPg` adapter constructor options (`max`, `connectionTimeoutMillis`); use `attachDatabasePool` if the host is Vercel Fluid Compute |
| Vercel (or similar) + `next.config.ts` custom webpack config | Trusting the platform's Next.js framework auto-detection to run the right build command | Explicitly set/verify the platform's build command matches `package.json`'s own `"build": "next build --webpack"` script |
| GitHub Actions + npm dependency caching | Manually caching `node_modules` directly via `actions/cache` | Use `actions/setup-node`'s built-in `cache: npm` (or its automatic `packageManager`-field detection), which caches npm's global cache keyed on the lockfile hash, not `node_modules` itself |
| GitHub Actions + Postgres for CI tests | Pointing tests at a hosted dev DB via a stored secret | Use GitHub Actions' built-in `services:` Postgres container, scoped and disposable per workflow run |
| Husky v9+ hook registration | Assuming hooks "just work" because they work on the machine that ran the original `husky init` | Verify via an actual fresh-clone + `npm ci` test that `core.hooksPath` and hook file executability are both correctly set |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Free-tier DB compute suspend + serverless cold start stacking | First request after idle is multiple seconds slow; subsequent requests fast | Choose a fast-resume provider (Neon-style); test after a real overnight idle period, not just immediately post-setup | Any time the app hasn't been visited recently — exactly the demo scenario that matters most for a portfolio project |
| Default `pg.Pool` size (10) times several concurrently-warm serverless function instances | Pool-timeout errors under any concurrent load, absent in solo manual testing | Explicitly cap `max` pool size per adapter instance relative to the DB's total connection ceiling | As soon as more than a couple of concurrent requests hit the app — easily reachable via a crawler, a shared link, or simple double-tab testing |
| Vercel Hobby tier's 10-second function execution ceiling | A slow query (e.g., cold DB resume + slow query together) gets killed with a 504 rather than just being slow | Keep server-side query paths fast independent of DB cold-start risk; consider Fluid Compute if the 10s ceiling is ever actually hit | Any request that combines DB cold-resume time with a non-trivial query, on the Hobby tier specifically |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `.env` (or any `.env.*` variant not already covered by `.gitignore`) accidentally committed once the file holds a real production `DATABASE_URL` | Full DB credential leak, requiring rotation, not just file removal | Confirm `.gitignore` covers every env-file naming variant in actual use; add a pre-commit guard rejecting staged `.env*` files (excluding `.env.example`) |
| Using `pull_request_target` (instead of `pull_request`) to work around forked-PR secret unavailability | Grants secret access to untrusted PR code, a well-known GitHub Actions supply-chain risk | Use `pull_request` + a CI-local Postgres service container instead; reserve any secret-requiring jobs for `main`-branch-restricted GitHub Environments |
| Production `DATABASE_URL` or host deploy tokens stored as plain repo-level GitHub secrets available to every workflow trigger | A misconfigured or future workflow could inadvertently expose/use production credentials from a non-production trigger | Scope production secrets to a GitHub Environment tied to `main`/production deploys only, not repo-wide secrets |

## "Looks Done But Isn't" Checklist

- [ ] **CI pipeline "passes":** Confirm it actually includes a real `prisma generate` step and would fail on a truly clean checkout — not just green because a stale `generated/` folder happened to be cached from a previous run.
- [ ] **Pre-commit hooks "installed":** Verify via an actual fresh clone + `npm ci` in a scratch directory, not just "it worked when I set it up on my machine."
- [ ] **First deploy "successful":** Confirm the *actual hosted build command* matches `package.json`'s `build` script (not a platform auto-detected one), and that a real end-to-end request (not just a green build log) was exercised — mirroring this project's own precedent where a green `tsc`/Vitest run for four phases masked a dev-server that had never actually been started.
- [ ] **Production DB "connected":** Confirm connection pooling is actually configured (adapter-level `max`, not a URL query param that driver adapters ignore), not just "the first manual query worked."
- [ ] **Environment variables "configured":** Confirm every variable in `.env.example` exists on the host's Production environment specifically (not just Preview/Development), and that any `NEXT_PUBLIC_*` change triggered an actual rebuild.
- [ ] **Demo-ready deploy:** Confirm the live app was tested after a real multi-hour/overnight idle period, not only immediately after the DB/host were freshly provisioned and still warm.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| `.env` committed with a real credential | HIGH | Rotate the leaked DB credential immediately at the provider (do not rely on a follow-up commit removing the file — history retains it); update the host's env-var config with the new credential; consider `git filter-repo`/BFG history rewrite only if the repo is not yet public or if acceptable to force-push, otherwise accept the leak is permanent in history and rotation is the real fix |
| Prisma pool exhaustion discovered in production | MEDIUM | Reduce adapter `max` pool size immediately as a stopgap; add `attachDatabasePool` (if on Vercel Fluid Compute) or switch the runtime `DATABASE_URL` to the provider's pooled/Supavisor-style connection string |
| CI green but host build fails (config not honored) | LOW-MEDIUM | Explicitly override the host's build command setting to match `package.json`'s `build` script; re-run; this project's own webpack/tsgo `next.config.ts` fixes should not need code changes, only host configuration changes |
| Husky hooks not firing for a collaborator/fresh clone | LOW | Add/fix the `"prepare": "husky"` script; ask the affected collaborator to re-run `npm ci` (or `npm install`) to re-trigger hook registration |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|--------------------|----------------|
| Prisma client never regenerated on clean checkout | CI setup phase | CI job fails/passes correctly on a genuinely clean `generated/` state; `postinstall` script present |
| Node version drift (local/CI/host) | CI setup phase | `.nvmrc`/`engines.node` present; workflow references it via `node-version-file`; host Node setting matches |
| macOS-local vs Linux-CI/host native-binary mismatch | CI setup phase | First real CI run against a PR completes `npm ci` without SWC/binary errors |
| Forked-PR secret unavailability | CI setup phase | CI Postgres strategy uses a service container, not a stored secret, for any `pull_request`-triggered job |
| Husky hooks not registered for fresh clones | Pre-commit hooks phase | Fresh-clone + `npm ci` test confirms `core.hooksPath` and hook executability |
| `.env`/secret leak risk | Pre-commit hooks phase (guard) + deployment phase (host secrets config) | Pre-commit rule rejects staged `.env*`; host uses dashboard/CLI-configured secrets, not a committed file |
| Host build command/config not honored (webpack/tsgo workarounds silently bypassed) | Deployment phase | Host's configured build command verified to literally match `package.json`'s `build` script; a real end-to-end hosted request tested, not just a green build log |
| Prisma connection pool exhaustion under serverless concurrency | Deployment phase (DB/hosting setup) | Adapter `max` pool size explicitly set; tested under at least light concurrent load, not just single sequential requests |
| Unsafe `migrate deploy`/`db push` against first prod DB | Deployment phase | Migration step isolated as its own CI/CD stage, gated to `main` only, using `migrate deploy` exclusively |
| Environment variable misconfiguration on first deploy | Deployment phase | Every `.env.example` variable cross-checked against the host's Production environment config; confirmed via a real deployed request |
| Free-tier DB auto-suspend + cold start compounding | Deployment phase (provider selection) | Live deploy tested after a genuine multi-hour/overnight idle period |

## Sources

- [Prisma Docs — Deploy to Vercel (serverless)](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel) — HIGH confidence, official docs; driver-adapter + `attachDatabasePool` pattern, `postinstall`/`prisma generate` guidance, `prisma: command not found` gotcha
- [Prisma Docs — Database connections / connection pool](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections) — HIGH confidence, official docs; pool-sizing principle, driver-adapter pool configuration (no URL params in v7)
- [Prisma Docs — Deploying database changes with Prisma Migrate](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate) — HIGH confidence, official docs; `migrate deploy` vs `migrate dev`/`db push` guidance, CI/CD pipeline placement
- [Prisma GitHub Discussion #11131 — Prisma Migrate and CI/CD](https://github.com/prisma/prisma/discussions/11131) — MEDIUM confidence, official repo discussion
- [Prisma v6→v7 migration guide (community, tomodahinata.com)](https://tomodahinata.com/en/blog/prisma-orm-v6-to-v7-migration-guide) — MEDIUM confidence, cross-checked against official upgrade guide; WASM query engine / mandatory driver adapters
- [GitHub community discussion — GitHub Actions secrets not available on `pull_request`](https://github.com/orgs/community/discussions/196886) — HIGH confidence, official GitHub community forum explaining intentional forked-PR secret behavior
- [michaelheap.com — Accessing secrets from forks safely](https://michaelheap.com/access-secrets-from-forks/) — MEDIUM confidence, community source, consistent with GitHub's own documented behavior
- [typicode/husky GitHub issues #891, #949, #1447](https://github.com/typicode/husky/issues/891) — MEDIUM-HIGH confidence, first-party repo issues; `prepare` script and `core.hooksPath` mechanics
- [actions/setup-node README + advanced-usage docs](https://github.com/actions/setup-node) — HIGH confidence, official GitHub Actions repo; npm caching keyed on lockfile, `node-version-file` input
- [GitHub community discussion — caching npm dependencies](https://github.com/orgs/community/discussions/196822) — MEDIUM confidence, official forum
- [Next.js docs — Failed to load SWC binary](https://nextjs.org/docs/messages/failed-loading-swc) — HIGH confidence, official Next.js docs; macOS/Linux optional-dependency lockfile mismatch and fix
- [Vercel Knowledge Base — What can I do about Vercel Functions timing out?](https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out) — HIGH confidence, official Vercel docs; Hobby tier 10s execution ceiling, Fluid Compute
- [Neon vs Supabase 2026 comparisons (multiple: designrevision.com, dev.to, closefuture.io, kunalganglani.com)](https://designrevision.com/blog/supabase-vs-neon) — MEDIUM confidence, cross-checked across 4+ independent 2026-dated articles converging on the same free-tier suspend/pause behavior claims
- Direct repo inspection: `.planning/PROJECT.md` Key Decisions table (Turbopack/`extensionAlias`/tsgo precedent), `next.config.ts`, `package.json`, `prisma/schema.prisma`, `prisma.config.ts`, `.gitignore`, `git ls-files`/`git check-ignore` — HIGH confidence, ground truth from the actual codebase

---
*Pitfalls research for: CI/CD & Deployment milestone (v1.3), COLREGS Navigator*
*Researched: 2026-07-20*
