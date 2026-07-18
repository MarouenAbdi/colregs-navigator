import { describe, expect, it } from "vitest";
import { buildScenarioBanner } from "./banner.js";

describe("buildScenarioBanner", () => {
  it("returns the gallery label + rationale for a curated row with rationale text", () => {
    expect(buildScenarioBanner({ isCurated: true, rationale: "x" })).toEqual({
      label: "Gallery example",
      rationale: "x",
    });
  });

  it("falls back to the generic label when curated but missing a rationale", () => {
    expect(buildScenarioBanner({ isCurated: true, rationale: null })).toEqual({
      label: "Viewing saved scenario — drag to explore",
    });
  });

  it("returns the generic label for a plain, non-curated saved scenario", () => {
    expect(buildScenarioBanner({ isCurated: false, rationale: null })).toEqual({
      label: "Viewing saved scenario — drag to explore",
    });
  });
});
