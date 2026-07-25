import { describe, expect, it } from "vitest";
import {
  CHART_HEADER_RISK_DOT_CLASSNAME,
  CHART_HEADER_RISK_TONE_CLASSNAME,
  deriveChartHeaderRisk,
} from "./chart-header-risk.js";

describe("deriveChartHeaderRisk", () => {
  it("renders the 'ok' tier when CPA is >= 1.0 NM", () => {
    expect(deriveChartHeaderRisk(1.81, 4.2)).toEqual({
      tier: "ok",
      text: "Passing clear — CPA 1.81 NM on present courses.",
    });
  });

  it("renders the 'watch' tier when 0.3 <= CPA < 1.0 NM", () => {
    const result = deriveChartHeaderRisk(0.87, 3.5);
    expect(result.tier).toBe("watch");
    expect(result.text).toContain("Close-quarters developing");
    expect(result.text).toContain("0.87 NM");
  });

  it("renders the 'high' tier when CPA < 0.3 NM", () => {
    const result = deriveChartHeaderRisk(0.2, 1.0);
    expect(result.tier).toBe("high");
    expect(result.text).toContain("Risk of collision");
    expect(result.text).toContain("0.20 NM");
  });

  it("renders the 'none' tier when vessels are opening (tcpaMinutes <= 0)", () => {
    const result = deriveChartHeaderRisk(1.81, -2.5);
    expect(result.tier).toBe("none");
    expect(result.text).toContain("opening");
  });

  it("renders the 'none' tier and does not throw when cpaNm/tcpaMinutes are both null", () => {
    expect(() => deriveChartHeaderRisk(null, null)).not.toThrow();
    const result = deriveChartHeaderRisk(null, null);
    expect(result.tier).toBe("none");
  });

  it("boundary: cpaNm exactly 0.3 falls into 'watch', not 'high'", () => {
    expect(deriveChartHeaderRisk(0.3, 5).tier).toBe("watch");
  });

  it("boundary: cpaNm exactly 1.0 falls into 'ok', not 'watch'", () => {
    expect(deriveChartHeaderRisk(1.0, 5).tier).toBe("ok");
  });

  it("CHART_HEADER_RISK_TONE_CLASSNAME has exactly the 4 tier keys", () => {
    expect(Object.keys(CHART_HEADER_RISK_TONE_CLASSNAME).sort()).toEqual([
      "high",
      "none",
      "ok",
      "watch",
    ]);
  });

  it("CHART_HEADER_RISK_DOT_CLASSNAME has exactly the 4 tier keys", () => {
    expect(Object.keys(CHART_HEADER_RISK_DOT_CLASSNAME).sort()).toEqual([
      "high",
      "none",
      "ok",
      "watch",
    ]);
  });
});
