// @vitest-environment jsdom
/**
 * VerdictBanner tests. Verifies the 3 behavior cases split
 * out of the former single combined reasoning aside: give-way (standalone
 * title + Rule N badge + GW/SO role badges), mutual (MUTUAL badges, Rule 7
 * badge, mutual description), and degenerate (title/description replaced,
 * rule badge suppressed, role badges from the last-good classification
 * persist).
 *
 * Fixtures are the REAL `classifyEncounter()` output against existing
 * domain fixtures (crossingResidualBasicCase / headOnNucRiatmTieCase) --
 * not hand-typed literals -- so the derived rule badge (classifyingEntryIndex
 * + ruleNumber) is exercised against genuine trail shapes, matching the
 * Hero precedent of verifying UI fixtures against the real domain function.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { VerdictBanner } from "./VerdictBanner.js";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import {
  crossingResidualBasicCase,
  headOnNucRiatmTieCase,
} from "../../domain/colregs/classify-encounter.fixtures.js";

// vitest.config.ts sets `globals: false` -- register cleanup explicitly
// per this project's no-magic-globals convention.
afterEach(cleanup);

function classifyOrThrow(vesselA: Parameters<typeof classifyEncounter>[0], vesselB: Parameters<typeof classifyEncounter>[1]) {
  const result = classifyEncounter(vesselA, vesselB);
  if (!result.ok) throw new Error("Fixture failed to classify -- fixture is broken");
  return result.value;
}

const crossingClassification = classifyOrThrow(
  crossingResidualBasicCase.vesselA,
  crossingResidualBasicCase.vesselB,
);

const mutualClassification = classifyOrThrow(
  headOnNucRiatmTieCase.vesselA,
  headOnNucRiatmTieCase.vesselB,
);

describe("VerdictBanner", () => {
  it("renders the give-way case: standalone title, description, Rule badge, GIVE WAY/STAND ON role badges", () => {
    render(<VerdictBanner classification={crossingClassification} isDegenerate={false} />);
    expect(screen.getByText("Crossing")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Vessel A gives way. Give-way vessel takes early, substantial action; stand-on vessel holds course and speed.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Rule 15")).toBeInTheDocument();
    expect(screen.getByText("GIVE WAY")).toBeInTheDocument();
    expect(screen.getByText("STAND ON")).toBeInTheDocument();
  });

  it("renders the mutual case: MUTUAL badges on both vessels, never GIVE WAY/STAND ON, Rule 7 badge", () => {
    render(<VerdictBanner classification={mutualClassification} isDegenerate={false} />);
    expect(screen.getByText("Head-on")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Mutual obligation. Both vessels must alter course to starboard early and substantially to avoid a close-quarters situation.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Rule 7")).toBeInTheDocument();
    expect(screen.getAllByText("MUTUAL")).toHaveLength(2);
    expect(screen.queryByText("GIVE WAY")).not.toBeInTheDocument();
    expect(screen.queryByText("STAND ON")).not.toBeInTheDocument();
  });

  it("renders the degenerate case: title/description replaced, rule badge suppressed, role badges persist", () => {
    render(<VerdictBanner classification={crossingClassification} isDegenerate={true} />);
    expect(screen.getByText("Unable to classify")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Vessel A and Vessel B are at the same position — drag one apart to resume live classification.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Rule 15")).not.toBeInTheDocument();
    expect(screen.getByText("GIVE WAY")).toBeInTheDocument();
    expect(screen.getByText("STAND ON")).toBeInTheDocument();
  });
});
