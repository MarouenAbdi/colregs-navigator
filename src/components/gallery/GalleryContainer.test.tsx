// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GalleryContainer } from "./GalleryContainer.js";

// Rule 3 (blocking): `vitest.config.ts` sets `globals: false` project-wide
// (CLAUDE.md's "no magic" persona) -- matches every other `.test.tsx` file
// in this repo.
afterEach(() => {
  cleanup();
});

// RTL cannot render an async Server Component directly via JSX -- `await`
// the component call first, then render its resolved JSX, matching this
// codebase's only other async-Server-Component test precedent's approach.
describe("GalleryContainer (09-03)", () => {
  it("renders the section heading, eyebrow, and exactly 6 links to /s/*", async () => {
    render(await GalleryContainer());

    expect(screen.getByRole("heading", { name: "Classic encounters, one click away" })).toBeInTheDocument();
    expect(screen.getByText("Curated scenarios")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links.length).toBe(6);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^\/s\//);
    }
  });

  it("includes the real curated scenario titles from the seeded data", async () => {
    render(await GalleryContainer());

    expect(screen.getByText("Classic crossing")).toBeInTheDocument();
    expect(screen.getByText("In doubt")).toBeInTheDocument();
  });
});
