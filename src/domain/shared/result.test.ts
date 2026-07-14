import { describe, expect, it } from "vitest";
import { assertUnreachable, err, ok, type Result } from "./result";

describe("ok", () => {
  it("returns a success result narrowing value to T with no cast", () => {
    const result: Result<number> = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // `result.value` is typed as number here with no cast required.
      expect(result.value).toBe(42);
    }
  });
});

describe("err", () => {
  it("returns a failure result narrowing reason to DegenerateCaseReason with no cast", () => {
    const result: Result<number> = err("coincident-position");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // `result.reason` is typed as DegenerateCaseReason here with no cast required.
      expect(result.reason).toBe("coincident-position");
      expect(result.details).toBeUndefined();
    }
  });

  it("carries the details payload through unchanged", () => {
    const result = err("no-closure", { currentDistanceNm: 4.2 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no-closure");
      expect(result.details).toEqual({ currentDistanceNm: 4.2 });
    }
  });
});

describe("assertUnreachable", () => {
  it("throws when called (exhaustiveness guard)", () => {
    expect(() => assertUnreachable("unexpected" as never)).toThrow(
      /Unhandled case/,
    );
  });
});
