---
phase: 06-scaffolding
reviewed: 2026-07-18T12:01:55Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/lib/utils.ts
  - src/components/ui/button.tsx
  - src/components/layout/Header.tsx
  - src/components/layout/Footer.tsx
  - src/components/shared/README.md
  - app/globals.css
  - app/layout.tsx
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-07-18T12:01:55Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the Phase 6 scaffolding deliverables: the `cn()` utility, the shadcn `Button` primitive, `Header`/`Footer` page chrome, the `shared/` placeholder README, the dark-only theme in `app/globals.css`, and `app/layout.tsx`'s shell wiring. `npx tsc --noEmit` passes and no hardcoded secrets, dangerous functions, or debug artifacts were found. The `radix-ui` `Slot.Root` usage, the deliberate `Github` → `Code2` icon substitution (verified against the installed `lucide-react@1.25.0` package, which genuinely has no GitHub icon), and the `.js`-suffixed import/webpack `extensionAlias` plumbing were all independently verified to be correct.

The issues found are concentrated in two areas: (1) the Header's in-page nav links (`#sandbox`/`#gallery`) point at anchor targets that do not exist anywhere in the current page tree — the actual routes are `/` (renders `SandboxContainer`) and `/gallery` (a separate page) — so these links are currently non-functional for any real visitor; and (2) a layout inconsistency where `Footer`'s content row has no `max-w-*` constraint while `Header`'s does, so on viewports wider than 1152px the footer text will not align under the header content column. Several smaller spec-compliance and quality gaps (spacing-scale deviations, missing nav hover/focus treatment, a stale/inaccurate code comment, and a duplicate `font-sans` application) round out the findings.

## Warnings

### WR-01: Header nav links point to anchor targets that don't exist anywhere in the app

**File:** `src/components/layout/Header.tsx:34-35`
**Issue:** The nav renders `<a href="#sandbox">Sandbox</a>` and `<a href="#gallery">Gallery</a>`, intended as same-page anchor links (per `06-RESEARCH.md`'s documented data flow: "Browser native same-page anchor scroll"). However, no element in the current codebase has `id="sandbox"` or `id="gallery"` (`grep -rn 'id="sandbox"\|id="gallery"'` across `src/`/`app/` returns zero matches). The actual Sandbox and Gallery features live at two separate routes — `app/page.tsx` (renders `<SandboxContainer />` directly, no wrapping `id`) and `app/gallery/page.tsx` (a fully separate page) — not as sections on one scrollable homepage. As shipped today, clicking either nav link does nothing (no scroll, no navigation).
**Fix:** Until a future phase actually merges Sandbox/Gallery into anchor sections on one page, point these links at the real routes so they aren't dead on arrival:
```tsx
import Link from "next/link";
// ...
<nav className="hidden items-center gap-6 text-sm sm:flex">
  <Link href="/">Sandbox</Link>
  <Link href="/gallery">Gallery</Link>
</nav>
```
If the anchor-based design is intentionally deferred to a later phase (e.g. the Hero phase merging these into one page), track that explicitly as a follow-up so this isn't accidentally shipped as broken navigation in the interim.

### WR-02: Footer content row is not width-constrained, unlike Header — chrome will visually misalign on wide viewports

**File:** `src/components/layout/Footer.tsx:9`
**Issue:** `Header.tsx:22` constrains its content row with `mx-auto ... max-w-6xl px-6`, centering content within a 1152px column on wide screens. `Footer.tsx:9`'s content row uses `mx-auto flex flex-col gap-4 px-6 py-4 ...` with **no `max-w-*`** class. `mx-auto` has no effect on an element with no width constraint (a block-level `div` already fills 100% of its parent), so the footer's text will span edge-to-edge on any viewport wider than 1152px while the header's content stays centered in a narrower column — the two chrome bars won't share a left/right edge, breaking the "Header/Footer content container" alignment the design intends (`06-UI-SPEC.md`'s Spacing Scale table groups Header and Footer gutter padding together, implying a shared container width).
**Fix:**
```tsx
<div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
```
(Note: the same gap exists in `06-PATTERNS.md`'s own illustrative Footer snippet, so this wasn't introduced by the executor deviating from the plan — but it's still a real defect in the shipped code and should be fixed regardless of where it originated.)

### WR-03: Header nav links have no hover/focus/active treatment, unlike every other interactive element in the shell

**File:** `src/components/layout/Header.tsx:33-36`
**Issue:** `06-UI-SPEC.md`'s Color table explicitly reserves the accent color for "active/hover state of Header nav links," but the `<a href="#sandbox">`/`<a href="#gallery">` elements carry no `className` at all — no hover color shift, no focus-visible ring, nothing to signal they're interactive beyond the browser's default outline (Tailwind's preflight already strips the default blue/underline via `a { color: inherit; text-decoration: inherit; }`, so absent explicit styling these render as plain, indistinguishable body text). This is inconsistent with the `Button` component two lines below, which has an explicit `focus-visible:ring-3 focus-visible:ring-ring/50` treatment, and fails the spec's own accent-color usage contract.
**Fix:**
```tsx
<nav className="hidden items-center gap-6 text-sm sm:flex">
  <a href="#sandbox" className="transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm">
    Sandbox
  </a>
  <a href="#gallery" className="transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm">
    Gallery
  </a>
</nav>
```

## Info

### IN-01: Icon-to-wordmark gap doesn't match the locked Spacing Scale token

**File:** `src/components/layout/Header.tsx:23`
**Issue:** `06-UI-SPEC.md`'s Spacing Scale explicitly assigns `xs` (4px) to "Icon-to-label gaps (e.g. ... logo icon↔wordmark gap)" and `sm` (8px) to "chip↔wordmark" spacing — i.e., two different gap sizes within the same row. The implementation wraps the icon, wordmark, and chip in a single flex container with one uniform `gap-2` (8px), so the icon-to-wordmark gap is 8px instead of the specified 4px.
**Fix:** Split into nested flex groups with different gaps, e.g. `<div className="flex items-center gap-1">` for icon+wordmark, nested inside the outer `gap-2` container that also holds the chip.

### IN-02: Declared "wide desktop" (`xl`, 32px, ≥900px) gutter token is never consumed

**File:** `src/components/layout/Header.tsx:22`, `src/components/layout/Footer.tsx:9`
**Issue:** `06-UI-SPEC.md`'s Spacing Scale declares an `xl` token (32px) specifically for "Horizontal page-gutter padding on Header/Footer content container (desktop, wide desktop, ≥900px)," implying a responsive step up from the `lg` (24px) `px-6` used today. Neither `Header.tsx` nor `Footer.tsx` has any `900px`-scoped padding utility (`grep -rn "900px" src app` returns nothing) — the gutter stays at `px-6` at all viewport widths.
**Fix:** Either add the responsive step (`className="... px-6 min-[900px]:px-8"`) or remove the unused `xl` token from the spec if it's not needed at this phase.

### IN-03: `app/globals.css` comment overclaims full `:root`/`.dark` value parity

**File:** `app/globals.css:51-58, 84`
**Issue:** The comment at lines 51-58 states "Both `:root` and `.dark` blocks below carry identical values on purpose," but `--radius` (line 84) is declared only in `:root` and is absent from the `.dark` block (lines 95-127). This happens to be harmless today (since both selectors target the same `html` element, `:root`'s value is simply inherited where `.dark` doesn't override it), but the comment is factually inaccurate and could mislead a future maintainer who trusts it while auditing for out-of-sync values.
**Fix:** Either add `--radius: 0.625rem;` to `.dark` for true parity, or correct the comment to note `--radius` is intentionally `:root`-only since it isn't a color token subject to light/dark drift.

### IN-04: `font-sans` is applied twice via two different mechanisms

**File:** `app/layout.tsx:35`, `app/globals.css:136-137`
**Issue:** `app/layout.tsx:35` sets `className={cn("dark font-sans", ...)}` directly on `<html>`, while `app/globals.css:129-143`'s `@layer base` block also applies `html { @apply font-sans; }`. Both target the same element with the same utility — redundant, and a future edit to one location without noticing the other could create silent drift (e.g. someone changes the Tailwind class on `<html>` in `layout.tsx` believing it's the only source of the font, unaware `globals.css` will still force `font-sans`).
**Fix:** Pick one source of truth — either drop `font-sans` from the `layout.tsx` className string (since `globals.css`'s `@layer base` already guarantees it on `html`), or drop the `@layer base` rule and rely solely on the explicit className.

### IN-05: `Button` doesn't default to `type="button"` for native `<button>` renders

**File:** `src/components/ui/button.tsx:44-65`
**Issue:** When `asChild` is `false` (the default), `Button` renders a native `<button>` with no default `type` attribute. Per the HTML spec, a `<button>` without an explicit `type` inside a `<form>` defaults to `type="submit"`, which can cause unintended form submissions for any future consumer that places a `Button` inside a form without remembering to pass `type="button"` explicitly. Not currently exercised by any file in this review (Header's only `Button` usage is `asChild` wrapping an `<a>`, which never renders a native `<button>`), but worth hardening now since this is a shared primitive every future feature (Sandbox's `ControlPanel`, etc.) will consume.
**Fix:**
```tsx
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      type={asChild ? undefined : type}
      data-slot="button"
      // ...
```

---

_Reviewed: 2026-07-18T12:01:55Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
