/**
 * Reasoning-trail step derivation helpers shared by the verdict banner and
 * the reasoning-trail card. Deliberately generic (no `doubt`/
 * `ClassificationResult` parameter) -- the doubt-substitution ("Rule 7"
 * override) and casing ("Rule 15" vs "RULE 15") are per-consumer
 * presentation choices, composed by each consuming component itself, not
 * shared derivation logic.
 */

// `classifyEncounter()`'s trail always pushes a fixed shape: Rule 7 first,
// then 1-3 dispatch-stage entries (Rule 13/14/15, in various combinations
// for hysteresis/exclusion checks), then a final Rule 18/13(a) confirmation
// entry -- so the actual classifying rule (the "middle" stage entry a
// verdict banner should cite) is always the second-to-last entry,
// regardless of the trail's total length.
export function classifyingEntryIndex(trailLength: number): number {
  return trailLength - 2;
}

// Extracts just the leading rule number from a ruleId string (e.g.
// "Rule 13(a)-(b)" -> "13", "Rule 15" -> "15"). Falls back to the raw
// ruleId unchanged if the string doesn't match the expected "Rule N..."
// shape.
export function ruleNumber(ruleId: string): string {
  const match = /Rule (\d+)/.exec(ruleId);
  return match ? match[1] : ruleId;
}
