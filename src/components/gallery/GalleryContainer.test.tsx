// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GalleryContainer } from "./GalleryContainer.js";

// GalleryContainer renders 6 GalleryCards, each transitively rendering
// TryOnSandboxButton, which calls the real useSandboxBridge() hook -- mock
// it the same mutable-closure-variable way SandboxContainer.test.tsx does,
// or every render below throws the "must be used within
// SandboxBridgeProvider" guard error.
vi.mock("../sandbox/bridge/SandboxBridgeProvider.js", () => ({
  useSandboxBridge: () => ({ pendingScenario: null, requestLoad: vi.fn() }),
}));

// Rule 3 (blocking): `vitest.config.ts` sets `globals: false` project-wide
// (CLAUDE.md's "no magic" persona) -- matches every other `.test.tsx` file
// in this repo.
afterEach(() => {
  cleanup();
});

// RTL cannot render an async Server Component directly via JSX -- `await`
// the component call first, then render its resolved JSX, matching this
// codebase's only other async-Server-Component test precedent's approach.
describe("GalleryContainer", () => {
  it("renders the section heading, eyebrow, and exactly 6 'Try on Sandbox' buttons, with no <Link> anywhere", async () => {
    render(await GalleryContainer());

    expect(screen.getByRole("heading", { name: "Classic encounters, one click away" })).toBeInTheDocument();
    expect(screen.getByText("Curated scenarios")).toBeInTheDocument();

    expect(screen.queryAllByRole("link").length).toBe(0);
    expect(screen.getAllByRole("button", { name: /try .* on sandbox/i }).length).toBe(6);
  });

  it("includes the real curated scenario titles from the seeded data", async () => {
    render(await GalleryContainer());

    expect(screen.getByText("Classic crossing")).toBeInTheDocument();
    expect(screen.getByText("In doubt")).toBeInTheDocument();
  });
});
