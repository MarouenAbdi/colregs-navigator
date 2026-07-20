/**
 * Shared degenerate-case signaling type for the domain layer (D-05).
 *
 * Every degenerate-input-prone function returns a `Result<T>` instead of
 * throwing, returning `null`, or returning `NaN` for an expected failure mode
 * (e.g. coincident positions, parallel/matching-course vessels).
 */

export type DegenerateCaseReason =
  | "coincident-position" // D-07: bearing/relativeBearing when positions are identical
  | "no-closure" // D-06: cpa/tcpa when relative velocity is ~zero (parallel/matching course)
  // Reserved for a future Number.isFinite input guard on the geometry
  // functions (see bearing.ts/relative-bearing.ts's own guards) --
  // No function in this file emits this reason yet — it exists so geometry
  // functions can defensively reject NaN/Infinity inputs that bypass
  // VesselSchema via direct object-literal construction.
  | "invalid-input";

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: DegenerateCaseReason; details?: Record<string, unknown> };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(
  reason: DegenerateCaseReason,
  details?: Record<string, unknown>,
): Result<T> {
  return { ok: false, reason, details };
}

/**
 * Exhaustiveness guard for `switch (result.reason)` handling once
 * `DegenerateCaseReason` grows past a couple of variants (used by the
 * COLREGS rules-engine consumers built on top of this module, not by this
 * file itself).
 */
export function assertUnreachable(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}
