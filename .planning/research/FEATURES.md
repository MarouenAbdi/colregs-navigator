# Feature Research

**Domain:** Portfolio/demo-site hero section + embedded preset-gallery UX for a single-page interactive tool (v1.1 UI Redesign milestone — Hero and Gallery phases only; Scaffolding/Sandbox restyle are presentation-only and not covered here)
**Researched:** 2026-07-18
**Confidence:** MEDIUM-HIGH (Next.js redirect/hash mechanics verified against official docs and source via Context7 = HIGH; hero/gallery UX patterns synthesized from multiple WebSearch sources on dev-tool landing pages, cross-checked against this project's own already-locked design decisions = MEDIUM)

## Scope Note

This project's v1.1 milestone is a pure re-implementation of an already-designed UI — it adds **no new domain/business features**. The only genuinely new piece of UI is the **Hero** section (this app previously had no marketing/landing content — `/` went straight to the sandbox). The **Gallery** phase is not a new feature either; it's a **relocation** of an already-shipped, already-validated feature (curated preset browsing, built in v1.0 Phase 5) from its own `/gallery` route to a `/#gallery` section on the home page. Accordingly, this document treats "features" as **UX/interaction-pattern decisions**, not domain capabilities — the downstream roadmap needs to know which patterns are expected, which are worth the extra polish, and which would be scope creep against a milestone whose own charter is "zero change to domain logic or existing validated requirements."

Prior feature research for this project (COLREGS domain/rules-engine feature landscape, v1.0) is superseded by this document for the v1.1 milestone — that domain research already fed a shipped, validated product and is not re-litigated here.

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Headline + one-line subhead stating what the tool actually does, in plain language (not vague SaaS copy) | Dev-tool landing page research is explicit: "No salesy BS" and "Clever and simple wins" are the two rules that hold across the 100+ pages studied — visitors bounce fast if they can't tell what the product *is* within seconds | LOW | Already scoped in PROJECT.md ("headline, copy, CTAs"). Pure content/copy work, shadcn Typography primitives. |
| Primary CTA that leads directly into the interactive tool, with zero signup/login gate | This app has no accounts by design (no-login save/share is a locked v1.0 decision) — a hero that funnels toward a "Sign up" / "Request a demo" CTA would misrepresent the product and add friction the tool doesn't need | LOW | CTA = anchor-scroll or route-scroll to the Sandbox section on the same page (no separate `/try` route exists or is needed). |
| A visual preview of the *actual product surface* near the fold, not stock imagery/generic illustration | Confirmed pattern across dev-tool landing pages: visuals paired with relevant, on-brand content increase engagement; devtool audiences specifically expect to see real UI, not marketing photography | LOW–MEDIUM | PROJECT.md already locks this as an "illustrative live-classification preview card" — see Differentiators below for why "illustrative" (not literally live) is the correct scope. |
| No forced onboarding/tour before reaching the tool | "Developers want to try your product now" is a repeated, cross-sourced finding; a wizard/tour before the sandbox contradicts the project's own "no login, no gate" positioning | LOW | Direct scroll/CTA into Sandbox, no modal/carousel gate. |
| Gallery section renders as a real grid of the 6 curated presets, each identifiable by encounter type + short rationale | Already shipped and validated in v1.0 Phase 5 — this is existing, tested behavior, just being relocated | LOW | Reuse `gallery.list()` tRPC query and card content; only the container/route changes. |
| Gallery section is reachable via a stable, linkable URL fragment (`/#gallery`) | Required directly by the locked decision to redirect the removed `/gallery` route here — old bookmarks/links must still resolve to *something* meaningful, not a 404 | LOW–MEDIUM | See "Redirect + Anchor Scroll Considerations" below — this has real technical gotchas despite looking trivial. |
| Gallery cards still navigate to a full scenario view on click (`/s/[shareId]`) | This is the existing, already-tested v1.0 interaction — changing it would be a functional change, which this milestone explicitly excludes | LOW | Zero new engineering: same `<Link href={`/s/${row.id}`}>` pattern already in `app/gallery/page.tsx`, just moved into a home-page section component. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Illustrative (not wired-to-live-state) mini classification preview card in the Hero, showing a canned example verdict (e.g., a classic crossing encounter with a give-way/stand-on badge) | Directly showcases this project's actual core value — explainability, not just visualization — before the user even reaches the real sandbox. Research on dev-tool heroes found interactive/product-truthful previews outperform generic screenshots for conveying value fast | LOW–MEDIUM | **This is already the locked design** (PROJECT.md: "illustrative live-classification preview card," Hero Direction A). Keep it a static/canned example — see Anti-Features for why NOT to wire it to real state. |
| Secondary/tertiary CTA linking to source code (GitHub) or an "About this project" note | Portfolio-specific differentiator with no equivalent in commercial SaaS hero research — the actual audience here (interviewers/engineers evaluating the project) values seeing the implementation, not just the demo | LOW | Not in the current 4-phase plan; flag as a candidate scope addition for the Hero phase if not already covered by the design file — verify against the design file's actual CTA set before adding. |
| Small illustrative geometry motion (e.g., a subtly animated bearing line or heading vector) in the Hero preview card | Evil Martians' research explicitly separates "static product UI" (fast, valid) from "animated product UI" (more compelling, more effort) — a small, tasteful animation is consistent with the domain (motion/bearing is literally the subject matter) and would sit well within Direction A's existing preview-card slot | MEDIUM | Discretionary polish — only pursue if it doesn't reintroduce actual sandbox/domain logic into the Hero (see Anti-Features). |
| Mini visual thumbnail per gallery card (small rendered chart snippet showing the two vessels' relative geometry) instead of text-only cards | Existing `/gallery` implementation is text-only (encounter type label + rationale paragraph); a geometric thumbnail would let users visually recognize "the crossing one" or "the overtaking one" at a glance, leveraging chart-rendering work already built for the Sandbox | MEDIUM–HIGH | Real cost: needs a reusable, non-interactive "mini chart" render mode extracted from `ChartPanel`, one per card × 6 cards. Worth flagging to the roadmap as an optional Gallery-phase stretch goal, not a requirement — the design file should be checked first for whether it already specifies this. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Wiring the Hero preview card to the *real* `SandboxContainer`/live classification engine (a second, fully-functional mini-sandbox above the real one) | Feels more "impressive" — "why show a fake demo when the real one is one scroll away?" | Duplicates a stateful, draggable, `"use client"` component on the same page; doubles the surface area to keep in sync with the real sandbox's domain wiring; directly contradicts the milestone's own locked framing of the preview card as "illustrative"; adds real engineering cost to a phase whose charter is presentation-only | Static/canned example data rendered once, no drag/live-update wiring — exactly what PROJECT.md already locks in |
| Auto-playing hero video, carousel, or slideshow of multiple "example encounters" cycling automatically | Looks polished in isolation, common in generic SaaS hero galleries | Cross-sourced dev-tool-landing-page research flags this as "salesy" — motion for its own sake, without user control, is the opposite of the "clever and simple wins" finding; also adds CLS/layout-shift risk that can break the `/#gallery` anchor-scroll math (see below) | One static illustrative preview card, matching the locked Direction A design |
| Gated CTA ("Request a demo" / "Book a call" / email-capture before viewing the tool) | Standard B2B SaaS lead-gen pattern | Wrong model for this product entirely — it's a no-login, publicly demoable tool; a lead-gen gate would misrepresent both the product and the portfolio intent | Direct CTA into the Sandbox section, no email/contact capture |
| Pagination, "load more," or infinite scroll on the Gallery section | Reflexive pattern for "any grid of cards" | There are exactly 6 hand-curated presets (fixed, not user-generated, not growing over time) — pagination solves a many-items problem this project doesn't have and adds unnecessary interaction/complexity | Render all 6 as a single static responsive grid (already the v1.0 behavior; matches the design file's fixed breakpoints at 900px/640px) |
| Client-side-only data fetching for the Gallery section (spinner-first render, `useEffect` + fetch) | Common default in component-library thinking ("gallery" = "fetch client-side, show a loading skeleton") | Breaks the `/#gallery` redirect UX: the browser's native fragment-scroll only works if the `id="gallery"` element already exists in the *initial* HTML. If the section is empty at first paint and fills in after a client fetch, users redirected from the old `/gallery` route will land at the top of the page instead of at the gallery, silently defeating the whole redirect | Keep the Gallery section a server-rendered async Server Component (same pattern as today's `app/gallery/page.tsx`, which already does `await getCaller().gallery.list()`) so `#gallery` is present at first paint |

## Feature Dependencies

```
Hero preview card (illustrative)
    └──requires nothing new from Sandbox/domain layer
         (canned example data only — deliberately NOT wired to SandboxContainer)

Gallery section (embedded on home page)
    └──requires──> existing gallery.list() tRPC query (already built, v1.0 Phase 5)
    └──requires──> id="gallery" present in initial server-rendered HTML
                       └──requires──> /gallery → /#gallery redirect landing correctly
                                          └──requires──> next.config.ts redirects() entry,
                                                          NOT a client-side-only route removal

Gallery card click → /s/[shareId] full page
    └──requires nothing new: reuses existing v1.0 SandboxContainer + initialScenario seeding
        (see app/s/[shareId]/page.tsx — already server-fetches and seeds via `initialScenario` prop)

Mini chart thumbnail per gallery card (differentiator, optional)
    └──requires──> extracting a non-interactive render mode from ChartPanel
                       └──conflicts with──> milestone's "restyle, don't refactor domain wiring" framing
                                             (flag as an explicit scope decision, not an assumed default)
```

### Dependency Notes

- **Gallery section requires `id="gallery"` in initial HTML, which requires the redirect to be config-based, not route-based:** if `/gallery` is simply deleted with no `next.config.ts` `redirects()` entry, visitors get a hard 404 instead of landing on `/#gallery`. If it's redirected via a lingering `app/gallery/page.tsx` that itself calls `redirect('/#gallery')` from `next/navigation`, that still works, but it's an unnecessary extra render/hop versus a config-level redirect — see below for the concrete recommendation.
- **Gallery card click → `/s/[shareId]` requires no new work:** this is the single most important complexity-reducing finding here — the existing "click preset → full navigation to a dedicated shared-scenario page" interaction is exactly what's already built, tested, and human-verified in v1.0. The tempting alternative (click preset → load into the *same* home-page sandbox instance in place, scroll up) would require lifting `SandboxContainer`'s state to the page level and adding remount/reseed logic that doesn't exist today (`SandboxContainer` only seeds from `initialScenario` once, at mount — it has no mechanism to accept a *new* scenario after the fact; the existing `key`-driven remount pattern lives in `app/s/[shareId]/page.tsx`, one instance per route, not a shared in-place instance). Keeping the existing click-through-to-`/s/[shareId]` behavior avoids this entirely and matches the milestone's explicit "zero change to domain logic or existing validated requirements" charter.
- **Mini chart thumbnail conflicts with milestone scope framing:** it's a legitimate differentiator (see above) but requires new component extraction work beyond "restyle existing UI to match the design file." Recommend checking whether the design file itself specifies text-only or thumbnail cards before deciding — don't assume the differentiator is in scope just because it's a good idea.

## Redirect + Anchor-Scroll Considerations (Gallery phase — HIGH confidence, verified via Next.js source/docs)

This is a small feature surface with real, non-obvious failure modes. Recommended approach and why:

1. **Use a `next.config.ts` `redirects()` entry, not a lingering `app/gallery/page.tsx`:**
   ```ts
   async redirects() {
     return [
       { source: "/gallery", destination: "/#gallery", permanent: true },
     ];
   }
   ```
   Verified via Next.js source (`prepare-destination.ts`, `parseDestination()`): hash fragments in redirect `destination` strings are explicitly parsed into their own `hash` field and preserved through the redirect — this is supported, documented behavior, not a workaround.
2. **Use `permanent: true` (308), not a temporary 307:** `/gallery` is being permanently removed, and the Key Decision log's own stated rationale for adding a redirect at all is "preserves any existing bookmarked links" — a permanent redirect is the semantically correct signal to search engines and browsers for that intent.
3. **The Gallery section must be part of the initial server-rendered HTML.** Because this redirect is a real HTTP-level navigation (the browser receives a 308 with `Location: /#gallery` and performs a fresh top-level load), the fragment-scroll-into-view behavior that follows is the **browser's native anchor-scroll**, not Next.js's client-side `<Link>`-specific scroll handling (that logic — `scroll={false}`, scroll-into-view-if-not-visible — only applies to client-side transitions triggered by `next/link` or `useRouter`, not to a fresh document load following an HTTP redirect). The practical consequence: if the Gallery section is a client component that fetches its data after hydration, the `id="gallery"` element won't exist at the moment the browser tries to scroll to the fragment, and the redirect will silently degrade to "land at the top of the page." Keep the Gallery section as an async Server Component (mirroring the current `app/gallery/page.tsx`'s `await getCaller().gallery.list()` pattern) so the anchor target exists at first paint.
4. **Watch for post-paint layout shift above the Gallery section.** Native browser fragment-scroll computes the target's position once, near initial load; if the Hero section's height changes after that (web font swap, late image load, an entrance animation on the illustrative preview card), the computed scroll offset can end up wrong and the user lands slightly above/below the intended section. Mitigate by avoiding layout-shifting effects in the Hero (e.g., reserve space for Geist font metrics, avoid an entrance animation that changes the Hero's box height) — this is a real, if minor, cross-dependency between the Hero and Gallery phases worth flagging to whoever builds Hero.

## MVP Definition

### Launch With (v1 — this milestone)

- [ ] Hero section: headline, subhead, primary CTA (scroll to Sandbox), illustrative (canned, non-interactive) live-classification preview card — this is the one genuinely new UI surface in the milestone
- [ ] Gallery section embedded on the home page below the Sandbox, server-rendered (not client-fetched), reusing the existing `gallery.list()` query and card-click-to-`/s/[shareId]` behavior unchanged
- [ ] `/gallery` route removed; `next.config.ts` permanent redirect (`308`) to `/#gallery` in its place

### Add After Validation (v1.x)

- [ ] Secondary CTA in the Hero linking to source/about (if not already specified by the design file — verify first)
- [ ] Small illustrative motion/animation in the Hero preview card (only if it doesn't reintroduce real sandbox wiring or cause layout shift above the Gallery anchor target)

### Future Consideration (v2+)

- [ ] Mini geometric chart thumbnail per Gallery card (replacing/augmenting the text-only card) — defer until there's a clear need to differentiate cards visually beyond the rationale text, and until it can be built without duplicating `ChartPanel`'s interactive logic
- [ ] Inline "load preset into the current sandbox instance + scroll up" interaction as an alternative to full navigation to `/s/[shareId]` — defer indefinitely unless a future milestone explicitly wants a single continuous-page experience; today's per-scenario dedicated pages are simpler, already built, and already validated

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hero headline/subhead/CTA + illustrative preview card | HIGH | LOW-MEDIUM | P1 |
| Gallery section embedded server-side on home page (reusing existing query/click behavior) | HIGH | LOW | P1 |
| `/gallery` → `/#gallery` permanent redirect, config-based | HIGH (avoids broken bookmarks) | LOW | P1 |
| Secondary "view source" CTA in Hero | MEDIUM | LOW | P2 |
| Illustrative motion in Hero preview card | LOW-MEDIUM | MEDIUM | P3 |
| Mini chart thumbnail per Gallery card | MEDIUM | MEDIUM-HIGH | P3 |
| Inline preset-load-without-navigation into shared sandbox instance | LOW (nice-to-have polish) | HIGH (requires state-lifting refactor) | P3 (likely out of milestone scope) |

## Competitor/Reference Pattern Analysis

| Pattern | Generic SaaS Landing Pages | Dev-Tool Landing Pages (Evil Martians study, n=100+) | Our Approach |
|---------|---------------------------|-------------------------------------------------------|--------------|
| Hero visual | Stock photography, abstract illustration, marketing screenshots | Real product UI: static screenshot, code snippet, or (for narrow-scope tools) a live embedded working element | Illustrative (canned, non-live) classification preview card — a middle ground already locked by the design: real-looking product content, but not the actual stateful sandbox, appropriate given this isn't a "narrow-scope tool" like an image upscaler |
| Primary CTA | "Start free trial" / "Book a demo" / "Sign up" | "Start building" / "Download now" / direct link into a live playground | Scroll/CTA straight into the on-page Sandbox — no signup exists in this product at all |
| Example/preset gallery | Rare; if present, usually customer logos or case-study cards | Present in tools like regex101 (a "Samples"/pattern-library menu for loading example patterns into the *same* live editor in place) | Present, but architecturally different from regex101's in-place example loader: our presets link to a dedicated `/s/[shareId]` page per scenario (already built/validated) rather than mutating a shared editor instance in place — a deliberate, lower-risk choice for this milestone, not an oversight |

## Sources

- [We studied 100 dev tool landing pages — here's what really works in 2025 (Evil Martians)](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025) — MEDIUM-HIGH confidence, single but methodologically substantial source (100+ pages analyzed), used for hero visual taxonomy ("live product embed," "animated vs. static product UI," "no salesy BS" principle) and CTA-pairing pattern
- [Next.js official docs — `redirects()` in `next.config.js`](https://nextjs.org/docs/01-app/02-guides/redirecting.mdx) via Context7 `/vercel/next.js` — HIGH confidence, official documentation
- [Next.js source — `prepare-destination.ts` `parseDestination()`](https://github.com/vercel/next.js/blob/canary/packages/next/src/shared/lib/router/utils/prepare-destination.ts) via Context7 `/vercel/next.js` — HIGH confidence, verified against actual routing implementation, confirms hash fragments are preserved through config-level redirects
- [Next.js `redirect()`/`permanentRedirect()` API reference](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/04-functions/redirect.mdx) via Context7 `/vercel/next.js` — HIGH confidence, official docs
- [Next.js `Link` component — scroll-to-id and `scroll={false}` behavior](https://github.com/vercel/next.js/blob/canary/docs/01-app/03-api-reference/02-components/link.mdx) via Context7 `/vercel/next.js` — HIGH confidence; used to establish that Next's own scroll-management logic is specific to client-side `<Link>`/`useRouter` transitions, distinct from native browser fragment-scroll following a full HTTP redirect
- Project source read directly: `app/page.tsx`, `app/gallery/page.tsx`, `app/s/[shareId]/page.tsx`, `src/components/sandbox/SandboxContainer.tsx`, `src/server/api/routers/gallery.ts` — HIGH confidence (ground truth for existing dependencies/behavior)
- `.planning/PROJECT.md` — HIGH confidence, authoritative for locked decisions (Hero Direction A, "illustrative" preview card wording, dark-mode-only, `/gallery` redirect rationale, breakpoints)
- General WebSearch on hero-section and gallery/scroll-pattern conventions — LOW-MEDIUM confidence, used only for background context (generic hero-section listicles, generic scrolling-pattern articles); not treated as authoritative and not the basis for any table-stakes/differentiator claim above without corroboration from the Evil Martians source or the project's own locked decisions

---
*Feature research for: COLREGS Navigator v1.1 UI Redesign — Hero section (new UI) and Gallery-embed UX (relocation of existing feature)*
*Researched: 2026-07-18*
