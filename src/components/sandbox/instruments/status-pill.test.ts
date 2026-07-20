import { describe, expect, it } from "vitest";
import { statusPillCopy } from "./status-pill.js";

describe("statusPillCopy", () => {
  it("renders the verbatim 'clear' copy when riskOfCollision is false", () => {
    expect(statusPillCopy(false, 1.81, 4.2)).toEqual({
      text: "Passing clear — CPA 1.81 NM on present courses.",
      tone: "clear",
    });
  });

  it("renders the 'risk' copy when riskOfCollision is true", () => {
    expect(statusPillCopy(true, 0.87, 3.5)).toEqual({
      text: "Risk of collision — CPA 0.87 NM on present courses.",
      tone: "risk",
    });
  });

  it("renders '—' in place of the numeric segment when cpaNm is null, for both tones", () => {
    expect(statusPillCopy(false, null, 4.2)).toEqual({
      text: "Passing clear — CPA — on present courses.",
      tone: "clear",
    });
    expect(statusPillCopy(true, null, 3.5)).toEqual({
      text: "Risk of collision — CPA — on present courses.",
      tone: "risk",
    });
  });

  it("renders the 'opening' copy when not at risk and closest approach is already in the past", () => {
    expect(statusPillCopy(false, 1.81, -2.5)).toEqual({
      text: "Vessels are opening — CPA already passed. No risk of collision developing on present courses.",
      tone: "opening",
    });
  });

  it("does not use the 'opening' tone when riskOfCollision is true, even with a past tcpa", () => {
    expect(statusPillCopy(true, 0.2, -1)).toEqual({
      text: "Risk of collision — CPA 0.20 NM on present courses.",
      tone: "risk",
    });
  });

  it("does not use the 'opening' tone when tcpaMinutes is null (no-closure/parallel courses)", () => {
    expect(statusPillCopy(false, null, null)).toEqual({
      text: "Passing clear — CPA — on present courses.",
      tone: "clear",
    });
  });
});
