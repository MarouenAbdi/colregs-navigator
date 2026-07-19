# Phase 11: Tailwind Deprecated Class-Name Fixes - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 7 (6 component/style files + 1 config file)
**Analogs found:** 7 / 7 (self-referential — this phase is a mechanical rename across existing
sites; each file's own current line is both the target and the pattern source. Cross-file
consistency is what stands in for a traditional "analog.")

This phase modifies existing files only — no new files are created. Because the edit is a
literal class-name rename applied independently at each of 6 sites (not a new pattern being
introduced), the most useful "analog" for each site is the other sibling sites undergoing the
identical rename, so the planner can verify consistency across all occurrences rather than
invent a novel treatment per file.

## File Classification

| Modified File | Role | Data Flow | Change | Match Quality |
|----------------|------|-----------|--------|----------------|
| `src/components/ui/button.tsx` | component (UI primitive) | request-response (render) | `outline-none` → `outline-hidden` | exact (sibling sites in select.tsx/Header.tsx/GalleryCard.tsx) |
| `src/components/ui/select.tsx` | component (UI primitive) | request-response (render) | `outline-none` → `outline-hidden` | exact |
| `src/components/layout/Header.tsx` | component (layout) | request-response (render) | `focus-visible:outline-none` → `focus-visible:outline-hidden` | exact |
| `src/components/gallery/GalleryCard.tsx` | component (feature) | request-response (render) | `focus-visible:outline-none` → `focus-visible:outline-hidden` | exact |
| `src/components/sandbox/SandboxContainer.tsx` | component (feature) | request-response (render) | `rounded-[0.25rem]` → `rounded-sm` | exact (sibling: ChartPanel.tsx) |
| `src/components/sandbox/ChartPanel.tsx` | component (feature, SVG) | request-response (render) | `rounded-[0.25rem]` → `rounded-sm` | exact (sibling: SandboxContainer.tsx) |
| `eslint.config.mjs` | config | batch (static lint config) | remove dead `enforce-canonical-classes` ignore pattern + comment | exact (self — D-03) |

## Pattern Assignments

### `src/components/ui/button.tsx` (component, request-response)

**Exact current state** (lines 7-21, `buttonVariants` base template literal):
```typescript
const buttonVariants = cva(
  `
    group/button inline-flex shrink-0 items-center justify-center rounded-lg
    border border-transparent bg-clip-padding text-sm font-medium
    whitespace-nowrap transition-all outline-none select-none
    focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50
    active:not-aria-[haspopup]:translate-y-px
    disabled:pointer-events-none disabled:opacity-50
    aria-invalid:border-destructive aria-invalid:ring-3
    aria-invalid:ring-destructive/20
    dark:aria-invalid:border-destructive/50
    dark:aria-invalid:ring-destructive/40
    [&_svg]:pointer-events-none [&_svg]:shrink-0
    [&_svg:not([class*='size-'])]:size-4
  `,
```

**Target line (11):** `whitespace-nowrap transition-all outline-none select-none`
**Fix:** replace bare `outline-none` → `outline-hidden` on this line only. This is the *bare*
form (not `focus-visible:outline-none`), applied unconditionally to every button variant — the
existing `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` on line 12
is the adjacent focus-visible ring treatment that makes this swap additive-safe (per CONTEXT.md
"Reusable patterns").

---

### `src/components/ui/select.tsx` (component, request-response)

**Exact current state** (lines 40-59, `SelectTrigger`):
```typescript
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        `
          flex w-fit items-center justify-between gap-1.5 rounded-lg border
          border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap
          transition-colors outline-none select-none
          focus-visible:border-ring focus-visible:ring-3
          focus-visible:ring-ring/50
          disabled:cursor-not-allowed disabled:opacity-50
          aria-invalid:border-destructive aria-invalid:ring-3
          aria-invalid:ring-destructive/20
          data-placeholder:text-muted-foreground
          data-[size=default]:h-8
          data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)]
          *:data-[slot=select-value]:line-clamp-1
          *:data-[slot=select-value]:flex
          *:data-[slot=select-value]:items-center
```

**Target line (48):** `transition-colors outline-none select-none`
**Fix:** replace bare `outline-none` → `outline-hidden`, same pattern as `button.tsx`. Adjacent
focus-visible ring is lines 49-50 (`focus-visible:border-ring focus-visible:ring-3
focus-visible:ring-ring/50`).

**False-positive trap in this same file (do not touch):** line 56 contains
`data-[size=sm]:rounded-[min(var(--radius-md),10px)]` — a different arbitrary-value radius
class, out of scope for this phase (not `rounded-[0.25rem]`, not flagged in CONTEXT.md's file
list).

---

### `src/components/layout/Header.tsx` (component, request-response)

**Exact current state** (lines 67-83, nav link anchor):
```typescript
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="
                  rounded-md px-2.75 py-1.75 text-[13.5px] font-medium
                  text-muted-foreground transition-colors
                  hover:text-accent
                  focus-visible:text-accent focus-visible:ring-2
                  focus-visible:ring-accent/60 focus-visible:ring-offset-2
                  focus-visible:ring-offset-background
                  focus-visible:outline-none
                "
              >
                {label}
              </a>
            ))}
```

**Target line (78):** `focus-visible:outline-none`
**Fix:** replace with `focus-visible:outline-hidden` (this file already uses the
`focus-visible:` variant form, unlike button.tsx/select.tsx's bare form — same rename, different
variant prefix). Adjacent ring treatment: lines 75-77
(`focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2
focus-visible:ring-offset-background`).

---

### `src/components/gallery/GalleryCard.tsx` (component, request-response)

**Exact current state** (lines 46-52, `Link` wrapper):
```typescript
  return (
    <Link
      href={`/s/${id}`}
      aria-label={`Load ${title} scenario into the sandbox`}
      className="
        group block rounded-xl
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
      "
    >
```

**Target line (51):** `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`
**Fix:** replace `focus-visible:outline-none` → `focus-visible:outline-hidden` on the same line
(ring classes stay before it, unchanged). Same variant-prefixed form as Header.tsx.

**False-positive trap — confirmed NOT in this file but in a sibling file, do not touch:**
`src/components/gallery/GalleryPreviewChart.tsx:19` — code comment `// ... 238 logical,
rounded to clean numbers), a correction to Hero's own 8:5` — plain English, not a Tailwind
class.

---

### `src/components/sandbox/SandboxContainer.tsx` (component, request-response)

**Exact current state** (lines 227-236, save-banner block):
```typescript
        {saveError ? <p className="text-sm text-doubt">{saveError}</p> : null}
        {banner ? (
          <div className="
            rounded-[0.25rem] border border-border bg-card px-3 py-2 text-sm
            text-muted-foreground
          ">
            <div>{banner.label}</div>
            {banner.rationale ? <div>{banner.rationale}</div> : null}
          </div>
        ) : null}
      </header>
```

**Target line (230):** `rounded-[0.25rem] border border-border bg-card px-3 py-2 text-sm`
**Fix:** replace `rounded-[0.25rem]` → `rounded-sm` (per D-01, accepting the 0.25rem →
`--radius-sm` = 0.375rem visual radius increase; per D-02 do not revert even if it looks
different in the manual browser check).

---

### `src/components/sandbox/ChartPanel.tsx` (component, request-response, SVG)

**Exact current state** (lines 441-447, chart `<svg>` root):
```typescript
  return (
    <div ref={containerRef} className="relative aspect-square w-full">
      <svg
        width={containerSize.width}
        height={containerSize.height}
        className="rounded-[0.25rem] border border-border bg-chart-surface"
      >
```

**Target line (446):** `className="rounded-[0.25rem] border border-border bg-chart-surface"`
**Fix:** replace `rounded-[0.25rem]` → `rounded-sm`, identical rename to `SandboxContainer.tsx`
above. This is the second and last remaining occurrence of `rounded-[0.25rem]` in the codebase
— once both are renamed, the eslint ignore pattern (below) becomes dead and must be removed per
D-03.

---

### `eslint.config.mjs` (config, batch)

**Analog:** itself — D-03 requires removing a now-dead ignore pattern once its target string no
longer appears anywhere in the codebase.

**Exact current state** (lines 37-58, `better-tailwindcss` plugin block):
```javascript
  {
    extends: [eslintPluginBetterTailwindcss.configs.recommended],
    settings: {
      "better-tailwindcss": {
        // Tailwind v4 points at its CSS entry point (not a JS/TS config
        // file) -- app/globals.css line 1 is `@import "tailwindcss";`.
        entryPoint: "app/globals.css",
      },
    },
    rules: {
      // enforce-canonical-classes' "simplification" autofix has no
      // awareness of this project's customized --radius theme scale
      // (app/globals.css derives --radius-sm/md/lg/xl from a single
      // --radius token via calc(), not Tailwind's stock literals) -- an
      // arbitrary-value exact override like rounded-[0.25rem] can get
      // silently "simplified" to a named class that resolves to a
      // completely different computed radius in this theme, since the
      // plugin has no way to know this project's --radius overrides
      // exist. Ignored here rather than fixed upstream for that reason.
      "better-tailwindcss/enforce-canonical-classes": ["warn", { ignore: ["^rounded-\\[0\\.25rem\\]$"] }],
    },
  },
```

**Fix (D-03):** once both `rounded-[0.25rem]` sites (SandboxContainer.tsx:230,
ChartPanel.tsx:446) are renamed to `rounded-sm`, remove:
1. Line 56: `"better-tailwindcss/enforce-canonical-classes": ["warn", { ignore: ["^rounded-\\[0\\.25rem\\]$"] }],`
2. Its explanatory comment block, lines 47-55 (the 9-line comment starting
   `// enforce-canonical-classes' "simplification" autofix has no ...` through `... Ignored
   here rather than fixed upstream for that reason.`)

After removal, the `rules: { }` block inside this config object becomes empty. Two structurally
valid options for the planner to choose between:
- Leave `rules: {}` as an empty object (keeps the `settings.entryPoint` config block intact and
  self-documenting as the anchor for the `better-tailwindcss` plugin's `entryPoint` setting).
- Remove the `rules` key entirely, keeping only `extends` and `settings`.
Either is lint-valid; prefer whichever keeps the diff smallest (likely: drop the `rules` key
since it would be empty, per general "no dead code" hygiene — but this is a minor style call,
not a locked decision in CONTEXT.md).

**Verification after this edit:** run `npx eslint eslint.config.mjs src/components/sandbox/SandboxContainer.tsx src/components/sandbox/ChartPanel.tsx` (or `npm run lint`) to confirm no new
warnings/errors — CONTEXT.md confirms these files currently pass lint cleanly (0
errors/warnings), so this should remain true after the edit.

---

## Shared Patterns

### `outline-none` → `outline-hidden` rename (4 sites)
**Applies to:** `button.tsx`, `select.tsx`, `Header.tsx`, `GalleryCard.tsx`

Two syntactic forms exist across the 4 sites — both take the identical rename:
- Bare form (`outline-none`, unconditional): `button.tsx:11`, `select.tsx:48`
- Variant-prefixed form (`focus-visible:outline-none`): `Header.tsx:78`, `GalleryCard.tsx:51`

Every site already has an adjacent `focus-visible:ring-*` (and in Header's case also
`focus-visible:ring-offset-*`) treatment on a neighboring line — this is what CONTEXT.md's
"Reusable patterns" section means by "additive-safe, not a behavior change to the
focus-visible ring itself." No site needs a *new* ring class added; only the literal string
`outline-none` → `outline-hidden` changes, preserving the `focus-visible:` prefix where present.

### `rounded-[0.25rem]` → `rounded-sm` rename (2 sites)
**Applies to:** `SandboxContainer.tsx:230`, `ChartPanel.tsx:446`

Both sites are a single literal string replacement inside a `className` (SandboxContainer uses
a multi-line template string via a plain `className="..."` string literal with line breaks;
ChartPanel uses a single-line `className="..."` string). No `cn()`/`cva()` wrapper at either
site — direct string replacement is safe without touching call structure.

Per D-01, `--radius-sm` in this theme (`app/globals.css:42`, `--radius-sm: calc(var(--radius)
* 0.6)` with `--radius: 0.625rem` at `app/globals.css:97`) evaluates to `0.375rem` — a 1.5x
increase from the current `0.25rem` arbitrary value. This is accepted design drift (D-02), not
a bug to compensate for elsewhere.

### Dead-config removal, gated on both renames landing first (1 site)
**Applies to:** `eslint.config.mjs`

D-03's removal must happen *after* both `rounded-[0.25rem]` sites are renamed (sequencing
matters: if the planner batches all edits into one commit that's fine, but if split across
separate plan steps, the eslint.config.mjs edit must not land before the two rename edits, or a
transient lint warning could appear for the interim state — though in practice both edits are
small enough to land together safely).

## No Analog Found

None. This phase touches only existing files with a fully mechanical, well-precedented rename
at each site; no file requires an external analog to model a new pattern.

## Metadata

**Analog search scope:** `src/components/ui/`, `src/components/layout/`, `src/components/gallery/`,
`src/components/sandbox/`, `eslint.config.mjs`, `app/globals.css` (radius tokens only)
**Files scanned:** grep across `src/` for `outline-none` (4 matches, all listed above) and
`rounded-\[0.25rem\]` (2 matches, all listed above); confirmed `select.tsx:56`
(`rounded-[min(var(--radius-md),10px)]`) and `GalleryPreviewChart.tsx:19` (comment text) and
`Hero.tsx:72` (`"Grounded in "` UI copy) as false-positive traps to leave untouched.
**Pattern extraction date:** 2026-07-19
