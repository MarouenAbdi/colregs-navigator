import { describe, expect, it } from "vitest";
import { ROLE_ACTION_TEXT } from "./footer-action-copy.js";

describe("ROLE_ACTION_TEXT", () => {
  it("has the exact verbatim give-way action copy (D-03)", () => {
    expect(ROLE_ACTION_TEXT["give-way"]).toBe(
      "Alter course early & substantially — pass well clear astern.",
    );
  });

  it("has the exact verbatim stand-on action copy (D-03)", () => {
    expect(ROLE_ACTION_TEXT["stand-on"]).toBe(
      "Hold course & speed; stand ready to act if she does not.",
    );
  });

  it("has the exact verbatim mutual action copy (D-03)", () => {
    expect(ROLE_ACTION_TEXT["mutual"]).toBe(
      "No privilege — both take early, decisive avoiding action.",
    );
  });

  it("has exactly the 3 VesselRole keys", () => {
    expect(Object.keys(ROLE_ACTION_TEXT).sort()).toEqual(["give-way", "mutual", "stand-on"]);
  });
});
