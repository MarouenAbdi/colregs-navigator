# Conventions

Established during Phase 7 (Hero), generalized for all future frontend work in this codebase.

## Separation of concerns: split computation from presentation

A component file should have one concern. When a component mixes non-trivial derived
computation (geometry math, formatting, domain calls) with JSX presentation, split it:

- A pure, framework-free module for the computation (e.g. `hero-preview-geometry.ts`) —
  exported constants/functions, zero React/JSX, independently unit-testable.
- A presentation component that imports that module and renders JSX only.

Signal that a split is overdue: a component file growing past ~150-200 lines by
accumulating both derived math and markup, or a component that would need domain/geometry
context to review even though the reviewer only cares about layout.

## No duplicated JSX for near-identical instances

If the same JSX block (or a near-identical one) is repeated for two data instances — two
vessels, two badges, two cards — extract a parameterized subcomponent instead of
copy-pasting. Duplication here has bitten this project already (a rotation bug fixed in
one vessel's block but not the other would have been invisible until someone dragged the
second vessel).

## No raw CSS composed as strings in component files

Gradient/animation/keyframe definitions belong in `app/globals.css` (or a scoped
stylesheet) as real CSS rules. Components should only toggle class names or set a narrow
CSS custom property (one numeric/color value) — never build `background-image`/`animation`
strings via template literals inside a `.tsx` file. If a value must vary per call site,
expose it as a CSS custom property (`style={{ "--foo": value }}`) rather than composing
the whole rule in JS.

## Comments: WHY only, attached to what they justify

Write a comment once, at the definition of the constant/function it explains — not at
every call site. A comment should explain a non-obvious derivation (e.g. "this exact
number comes from solving X against Y"), a locked design decision, or a subtle invariant.
Never restate what the code visibly does, and never reference a task/plan ID that will rot
once the plan is archived — reference the *reason* instead (a design source, a specific
locked decision by name/number, a research doc's finding).

## Shared/decorative primitives: extract only on a real second consumer

`src/components/shared/` exists for cross-feature components, but per the "don't
pre-abstract" rule established in Phase 6, only move something there once a second real
consumer actually needs it (e.g. `SectionGridBackground`, extracted in Phase 7 once Hero
and the design's Gallery section were both confirmed to use the same pattern) — not
speculatively.
