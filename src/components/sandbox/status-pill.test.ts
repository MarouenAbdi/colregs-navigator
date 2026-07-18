import { describe, expect, it } from "vitest";
import { statusPillCopy } from "./status-pill.js";

describe("statusPillCopy", () => {
  it("renders the verbatim 'clear' copy when riskOfCollision is false", () => {
    expect(statusPillCopy(false, 1.81)).toEqual({
      text: "Passing clear — CPA 1.81 NM on present courses.",
      tone: "clear",
    });
  });

  it("renders the 'risk' copy when riskOfCollision is true", () => {
    expect(statusPillCopy(true, 0.87)).toEqual({
      text: "Risk of collision — CPA 0.87 NM on present courses.",
      tone: "risk",
    });
  });

  it("renders '—' in place of the numeric segment when cpaNm is null, for both tones", () => {
    expect(statusPillCopy(false, null)).toEqual({
      text: "Passing clear — CPA — on present courses.",
      tone: "clear",
    });
    expect(statusPillCopy(true, null)).toEqual({
      text: "Risk of collision — CPA — on present courses.",
      tone: "risk",
    });
  });
});
